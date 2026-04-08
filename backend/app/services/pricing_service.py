from decimal import Decimal, ROUND_HALF_UP

from app.config import Config
from app.models.product import Product


TWO_DECIMALS = Decimal("0.01")
CM_PER_METER = Decimal("100")


class PricingError(Exception):
    def __init__(self, code: str, message: str, status_code: int):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class PricingService:
    @staticmethod
    def quote(*, product_id: int, width_cm: int, height_cm: int, quantity: int = 1):
        product = PricingService._get_product(product_id)
        PricingService._validate_inputs(
            product=product,
            width_cm=width_cm,
            height_cm=height_cm,
            quantity=quantity,
        )

        unit_area_m2 = PricingService._calculate_area_m2(width_cm, height_cm)
        unit_price_m2 = PricingService._to_money(product.price_m2)
        unit_price_base = PricingService._money(unit_area_m2 * unit_price_m2)

        unit_shipping_surcharge, surcharge_rule = (
            PricingService._calculate_size_surcharge(
                width_cm=width_cm,
                height_cm=height_cm,
            )
        )

        products_subtotal = PricingService._money(
            unit_price_base * Decimal(quantity)
        )
        shipping_base, shipping_rule = PricingService._calculate_shipping_base(
            products_subtotal
        )
        shipping_surcharge = PricingService._money(
            unit_shipping_surcharge * Decimal(quantity)
        )
        total = PricingService._money(
            products_subtotal + shipping_base + shipping_surcharge
        )

        rules_applied = []
        if surcharge_rule:
            rules_applied.append(surcharge_rule)
        if shipping_rule:
            rules_applied.append(shipping_rule)

        return {
            "product": {
                "id": product.id,
                "slug": product.slug,
                "name": product.name,
            },
            "input": {
                "width_cm": width_cm,
                "height_cm": height_cm,
                "quantity": quantity,
            },
            "pricing": {
                "unit_area_m2": PricingService._serialize_decimal(unit_area_m2, 4),
                "unit_price_m2": PricingService._serialize_decimal(unit_price_m2),
                "unit_price_base": PricingService._serialize_decimal(unit_price_base),
                "unit_shipping_surcharge": PricingService._serialize_decimal(
                    unit_shipping_surcharge
                ),
                "products_subtotal": PricingService._serialize_decimal(
                    products_subtotal
                ),
                "shipping_base": PricingService._serialize_decimal(shipping_base),
                "shipping_surcharge": PricingService._serialize_decimal(
                    shipping_surcharge
                ),
                "total": PricingService._serialize_decimal(total),
            },
            "rules_applied": rules_applied,
            "currency": Config.DEFAULT_CURRENCY,
        }

    @staticmethod
    def _get_product(product_id: int) -> Product:
        product = Product.query.get(product_id)

        if not product:
            raise PricingError(
                code="PRODUCT_NOT_FOUND",
                message="Product not found.",
                status_code=404,
            )

        if not product.is_active:
            raise PricingError(
                code="PRODUCT_INACTIVE",
                message="Product is inactive.",
                status_code=400,
            )

        return product

    @staticmethod
    def _validate_inputs(
        *,
        product: Product,
        width_cm: int,
        height_cm: int,
        quantity: int,
    ):
        if width_cm <= 0:
            raise PricingError(
                code="INVALID_WIDTH",
                message="Width must be greater than 0 cm.",
                status_code=400,
            )

        if height_cm <= 0:
            raise PricingError(
                code="INVALID_HEIGHT",
                message="Height must be greater than 0 cm.",
                status_code=400,
            )

        if quantity < 1:
            raise PricingError(
                code="INVALID_QUANTITY",
                message="Quantity must be at least 1.",
                status_code=400,
            )

        if width_cm < product.min_width_cm or width_cm > product.max_width_cm:
            raise PricingError(
                code="INVALID_WIDTH",
                message=(
                    f"Width must be between {product.min_width_cm} and "
                    f"{product.max_width_cm} cm."
                ),
                status_code=400,
            )

        if height_cm < product.min_height_cm or height_cm > product.max_height_cm:
            raise PricingError(
                code="INVALID_HEIGHT",
                message=(
                    f"Height must be between {product.min_height_cm} and "
                    f"{product.max_height_cm} cm."
                ),
                status_code=400,
            )

    @staticmethod
    def _calculate_area_m2(width_cm: int, height_cm: int) -> Decimal:
        width_m = Decimal(width_cm) / CM_PER_METER
        height_m = Decimal(height_cm) / CM_PER_METER
        return width_m * height_m

    @staticmethod
    def _calculate_size_surcharge(*, width_cm: int, height_cm: int):
        longest_side = max(width_cm, height_cm)
        side_sum = width_cm + height_cm

        if side_sum > Config.OVERSIZE_SUM_MAX_THRESHOLD_CM:
            return (
                PricingService._to_money(Config.OVERSIZE_SUM_MAX_SURCHARGE),
                "oversize_sum_gt_400",
            )

        if side_sum > Config.OVERSIZE_SUM_THRESHOLD_CM:
            return (
                PricingService._to_money(Config.OVERSIZE_SUM_SURCHARGE),
                "oversize_sum_gt_300",
            )

        if longest_side > Config.OVERSIZE_SIDE_THRESHOLD_CM:
            return (
                PricingService._to_money(Config.OVERSIZE_SIDE_SURCHARGE),
                "oversize_side_gt_175",
            )

        return Decimal("0.00"), None

    @staticmethod
    def _calculate_shipping_base(products_subtotal: Decimal):
        if products_subtotal >= PricingService._to_money(
            Config.FREE_SHIPPING_THRESHOLD
        ):
            return Decimal("0.00"), "free_shipping_threshold"

        return (
            PricingService._to_money(Config.BASE_SHIPPING_FEE),
            "standard_shipping_fee",
        )

    @staticmethod
    def _money(value) -> Decimal:
        return Decimal(value).quantize(TWO_DECIMALS, rounding=ROUND_HALF_UP)

    @staticmethod
    def _to_money(value) -> Decimal:
        return PricingService._money(str(value))

    @staticmethod
    def _serialize_decimal(value: Decimal, precision: int = 2) -> str:
        quantizer = Decimal("1").scaleb(-precision)
        return format(value.quantize(quantizer, rounding=ROUND_HALF_UP), "f")
