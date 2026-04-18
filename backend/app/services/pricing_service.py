from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import selectinload

from app.config import Config
from app.models.product import (
    OptionGroup,
    Product,
    ProductOption,
    ProductOptionAssignment,
)


TWO_DECIMALS = Decimal("0.01")
CM_PER_METER = Decimal("100")
ANCHORING_SURCHARGES = {
    "interior_holes": Decimal("0.00"),
    "frontal_holes": Decimal("0.00"),
    "plates": Decimal("14.99"),
    "side_claws": Decimal("39.00"),
    "front_claws": Decimal("39.00"),
}
ALLOWED_COLORS = {
    "white",
    "black",
    "anthracite",
    "green",
}
DEFAULT_ANCHORING_TYPE = "interior_holes"
DEFAULT_COLOR = "white"


class PricingError(Exception):
    def __init__(self, code: str, message: str, status_code: int):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class PricingService:
    @staticmethod
    def quote(
        *,
        product_id: int,
        configuration: dict | None = None,
        width_cm: int | None = None,
        height_cm: int | None = None,
        quantity: int = 1,
    ):
        normalized_configuration = PricingService._normalize_configuration(
            configuration=configuration,
            width_cm=width_cm,
            height_cm=height_cm,
        )
        normalized_width_cm = normalized_configuration["width_cm"]
        normalized_height_cm = normalized_configuration["height_cm"]
        normalized_options = normalized_configuration["options"]
        anchoring_type = normalized_configuration["anchoring_type"]
        color = normalized_configuration["color"]

        product = PricingService._get_product(product_id)
        PricingService._validate_inputs(
            product=product,
            width_cm=normalized_width_cm,
            height_cm=normalized_height_cm,
            quantity=quantity,
        )

        unit_area_m2 = PricingService._calculate_area_m2(
            normalized_width_cm,
            normalized_height_cm,
        )
        unit_price_m2 = PricingService._to_money(product.price_m2)
        unit_price_base = PricingService._money(unit_area_m2 * unit_price_m2)
        unit_options_modifier = PricingService._calculate_options_modifier(
            product=product,
            options=normalized_options,
        )
        unit_anchoring_surcharge = PricingService._calculate_anchoring_surcharge(
            anchoring_type=anchoring_type,
        )
        unit_configuration_modifier = PricingService._money(
            unit_options_modifier + unit_anchoring_surcharge
        )
        unit_price = PricingService._money(unit_price_base + unit_configuration_modifier)

        unit_shipping_surcharge, surcharge_rule = (
            PricingService._calculate_size_surcharge(
                width_cm=normalized_width_cm,
                height_cm=normalized_height_cm,
            )
        )

        products_subtotal = PricingService._money(
            unit_price * Decimal(quantity)
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
        if unit_anchoring_surcharge > Decimal("0.00"):
            rules_applied.append(f"anchoring_{anchoring_type}")
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
                "width_cm": normalized_width_cm,
                "height_cm": normalized_height_cm,
                "quantity": quantity,
                "anchoring_type": anchoring_type,
                "color": color,
            },
            "pricing": {
                "unit_area_m2": PricingService._serialize_decimal(unit_area_m2, 4),
                "unit_price_m2": PricingService._serialize_decimal(unit_price_m2),
                "unit_price_base": PricingService._serialize_decimal(unit_price_base),
                "unit_options_modifier": PricingService._serialize_decimal(
                    unit_configuration_modifier
                ),
                "unit_anchoring_surcharge": PricingService._serialize_decimal(
                    unit_anchoring_surcharge
                ),
                "unit_price": PricingService._serialize_decimal(unit_price),
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
    def _normalize_configuration(
        *,
        configuration: dict | None = None,
        width_cm: int | None = None,
        height_cm: int | None = None,
    ) -> dict:
        if configuration is None:
            configuration = {
                "width_cm": width_cm,
                "height_cm": height_cm,
                "options": [],
            }

        if not isinstance(configuration, dict):
            raise PricingError(
                code="INVALID_CONFIGURATION",
                message="Configuration must be an object.",
                status_code=400,
            )

        try:
            normalized_width_cm = int(configuration.get("width_cm"))
            normalized_height_cm = int(configuration.get("height_cm"))
        except (TypeError, ValueError) as exc:
            raise PricingError(
                code="INVALID_CONFIGURATION",
                message="Configuration width_cm and height_cm must be integers.",
                status_code=400,
            ) from exc

        raw_options = configuration.get("options", [])
        if raw_options is None:
            raw_options = []

        if not isinstance(raw_options, list):
            raise PricingError(
                code="INVALID_CONFIGURATION",
                message="Configuration options must be an array.",
                status_code=400,
            )

        normalized_options = []
        seen = set()

        for option in raw_options:
            if not isinstance(option, dict):
                raise PricingError(
                    code="INVALID_OPTION",
                    message="Each option must be an object.",
                    status_code=400,
                )

            group_slug = str(option.get("group_slug", "")).strip()
            option_slug = str(option.get("option_slug", "")).strip()

            if not group_slug or not option_slug:
                raise PricingError(
                    code="INVALID_OPTION",
                    message="Each option must include group_slug and option_slug.",
                    status_code=400,
                )

            dedupe_key = (group_slug, option_slug)
            if dedupe_key in seen:
                continue

            seen.add(dedupe_key)
            normalized_options.append({
                "group_slug": group_slug,
                "option_slug": option_slug,
            })

        anchoring_type = str(
            configuration.get("anchoring_type", DEFAULT_ANCHORING_TYPE)
        ).strip()
        if anchoring_type not in ANCHORING_SURCHARGES:
            raise PricingError(
                code="INVALID_ANCHORING_TYPE",
                message="Configuration anchoring_type is invalid.",
                status_code=400,
            )

        color = str(configuration.get("color", DEFAULT_COLOR)).strip()
        if color not in ALLOWED_COLORS:
            raise PricingError(
                code="INVALID_COLOR",
                message="Configuration color is invalid.",
                status_code=400,
            )

        return {
            "width_cm": normalized_width_cm,
            "height_cm": normalized_height_cm,
            "anchoring_type": anchoring_type,
            "color": color,
            "options": normalized_options,
        }

    @staticmethod
    def _get_product(product_id: int) -> Product:
        product = (
            Product.query
            .options(
                selectinload(Product.option_assignments)
                .selectinload(ProductOptionAssignment.option)
                .selectinload(ProductOption.group)
            )
            .get(product_id)
        )

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
    def _calculate_options_modifier(*, product: Product, options: list[dict]) -> Decimal:
        if not options:
            PricingService._validate_required_groups(product=product, selected_group_slugs=set())
            return Decimal("0.00")

        group_slugs = sorted({option["group_slug"] for option in options})
        option_slugs = sorted({option["option_slug"] for option in options})

        groups = OptionGroup.query.filter(OptionGroup.slug.in_(group_slugs)).all()
        group_by_slug = {group.slug: group for group in groups}

        product_options = (
            ProductOption.query
            .options(selectinload(ProductOption.group))
            .filter(ProductOption.slug.in_(option_slugs))
            .all()
        )
        product_options_by_slug = {option.slug: option for option in product_options}

        allowed_options = {}
        selected_groups = {}

        for assignment in product.option_assignments:
            option = assignment.option
            group = option.group
            allowed_options[(group.slug, option.slug)] = option

        modifier_total = Decimal("0.00")

        for selected_option in options:
            group_slug = selected_option["group_slug"]
            option_slug = selected_option["option_slug"]

            matched_group = group_by_slug.get(group_slug)
            if not matched_group:
                raise PricingError(
                    code="INVALID_OPTION_GROUP",
                    message=f"Option group '{group_slug}' does not exist.",
                    status_code=400,
                )

            matched_option = product_options_by_slug.get(option_slug)
            if not matched_option:
                raise PricingError(
                    code="INVALID_OPTION",
                    message=f"Option '{option_slug}' does not exist.",
                    status_code=400,
                )

            if matched_option.group.slug != matched_group.slug:
                raise PricingError(
                    code="INVALID_OPTION_GROUP",
                    message=(
                        f"Option '{option_slug}' does not belong to "
                        f"group '{group_slug}'."
                    ),
                    status_code=400,
                )

            matched_option = allowed_options.get((group_slug, option_slug))
            if not matched_option:
                raise PricingError(
                    code="INVALID_OPTION",
                    message=(
                        f"Option '{option_slug}' in group '{group_slug}' "
                        "is not valid for this product."
                    ),
                    status_code=400,
                )

            selected_groups.setdefault(group_slug, []).append(matched_option)
            modifier_total += PricingService._to_money(matched_option.price_modifier or 0)

        for group_slug, group_options in selected_groups.items():
            group = group_options[0].group
            if group.type == "single" and len(group_options) > 1:
                raise PricingError(
                    code="INVALID_OPTION_COMBINATION",
                    message=f"Multiple options selected for group '{group_slug}'.",
                    status_code=400,
                )

        PricingService._validate_required_groups(
            product=product,
            selected_group_slugs=set(selected_groups.keys()),
        )

        return PricingService._money(modifier_total)

    @staticmethod
    def _validate_required_groups(*, product: Product, selected_group_slugs: set[str]):
        required_group_slugs = {
            assignment.option.group.slug
            for assignment in product.option_assignments
            if assignment.option.group.is_required
        }

        missing_group_slugs = sorted(required_group_slugs - selected_group_slugs)
        if missing_group_slugs:
            raise PricingError(
                code="MISSING_REQUIRED_OPTION",
                message=(
                    "Missing required option for group "
                    f"'{missing_group_slugs[0]}'."
                ),
                status_code=400,
            )

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
    def _calculate_anchoring_surcharge(*, anchoring_type: str) -> Decimal:
        return PricingService._money(ANCHORING_SURCHARGES[anchoring_type])

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
