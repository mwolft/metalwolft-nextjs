from decimal import Decimal
from app.services.checkout_service import CheckoutError


class CheckoutValidator:

    @staticmethod
    def validate(preview: dict, current: dict):
        CheckoutValidator._validate_flags(preview)
        CheckoutValidator._validate_totals(preview, current)
        CheckoutValidator._validate_items_basic(preview, current)

    @staticmethod
    def _validate_flags(preview: dict):
        """
        Valida flags básicos del snapshot (ej: is_valid)
        """
        if not preview.get("validation", {}).get("is_valid"):
            raise CheckoutError(
                code="CHECKOUT_INVALID",
                message="Checkout validation failed.",
                status_code=400,
            )

    @staticmethod
    def _validate_totals(preview: dict, current: dict):
        """
        Compara el total del snapshot contra el recalculado en backend.
        """
        try:
            preview_total = Decimal(preview["summary"]["grand_total"])
            current_total = Decimal(current["summary"]["grand_total"])
        except Exception:
            raise CheckoutError(
                code="INVALID_CHECKOUT_FORMAT",
                message="Invalid total format.",
                status_code=400,
            )

        if preview_total != current_total:
            raise CheckoutError(
                code="CHECKOUT_PRICE_MISMATCH",
                message="Checkout total mismatch.",
                status_code=400,
            )

    @staticmethod
    def _validate_items_basic(preview: dict, current: dict):

        preview_items = preview.get("items", [])
        current_items = current.get("items", [])

        def build_map(items):
            item_map = {}

            for item in items:
                product = item["product"]
                config = item["configuration"]

                key = (
                    int(product["id"]),
                    int(config["width_cm"]),
                    int(config["height_cm"]),
                    int(config["quantity"]),
                )

                item_map[key] = item

            return item_map

        preview_map = build_map(preview_items)
        current_map = build_map(current_items)

        # 1. Mismo número de items únicos
        if set(preview_map.keys()) != set(current_map.keys()):
            raise CheckoutError(
                code="DEBUG_KEYS",
                message=f"preview={list(preview_map.keys())} | current={list(current_map.keys())}",
                status_code=400,
            )

        # 2. Validación de precios por item
        for key in preview_map:
            preview_item = preview_map[key]
            current_item = current_map[key]

            if preview_item["pricing"]["total"] != current_item["pricing"]["total"]:
                raise CheckoutError(
                    code="CHECKOUT_ITEM_MISMATCH",
                    message="Item price mismatch.",
                    status_code=400,
                )