from decimal import Decimal
from app.services.checkout_service import CheckoutError
from app.models.product import Product


class CheckoutValidator:

    @staticmethod
    def validate(preview: dict, current: dict):
        CheckoutValidator._validate_flags(preview)
        CheckoutValidator._validate_totals(preview, current)
        CheckoutValidator._validate_items_basic(preview, current)

    @staticmethod
    def _validate_flags(preview: dict):
        if not preview.get("validation", {}).get("is_valid"):
            raise CheckoutError(
                code="CHECKOUT_INVALID",
                message="Checkout validation failed.",
                status_code=400,
            )

    @staticmethod
    def _validate_totals(preview: dict, current: dict):
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

                options_tuple = tuple(sorted(config.get("options", [])))

                key = (
                    int(product["id"]),
                    int(config["width_cm"]),
                    int(config["height_cm"]),
                    int(config["quantity"]),
                    options_tuple,
                )

                item_map[key] = item

            return item_map

        preview_map = build_map(preview_items)
        current_map = build_map(current_items)

        # 1. Mismo conjunto de items
        if set(preview_map.keys()) != set(current_map.keys()):
            raise CheckoutError(
                code="CHECKOUT_ITEMS_MISMATCH",
                message="Checkout items mismatch.",
                status_code=400,
            )

        # 2. Validación item a item
        for key in preview_map:
            preview_item = preview_map[key]
            current_item = current_map[key]

            # ✅ validar opciones
            CheckoutValidator._validate_item_options(preview_item)
            CheckoutValidator._validate_item_options_against_db(preview_item)

            # ✅ validar precio
            if preview_item["pricing"]["total"] != current_item["pricing"]["total"]:
                raise CheckoutError(
                    code="CHECKOUT_ITEM_MISMATCH",
                    message="Item price mismatch.",
                    status_code=400,
                )

    @staticmethod
    def _validate_item_options(item: dict):
        config = item.get("configuration", {})
        options = config.get("options", [])

        if not isinstance(options, list):
            raise CheckoutError(
                code="INVALID_OPTIONS_FORMAT",
                message="Options must be a list.",
                status_code=400,
            )

        if len(options) != len(set(options)):
            raise CheckoutError(
                code="DUPLICATE_OPTIONS",
                message="Duplicate options detected.",
                status_code=400,
            )

    @staticmethod
    def _validate_item_options_against_db(item: dict):
        product_id = item["product"]["id"]
        selected_options = item["configuration"].get("options", [])

        product = Product.query.get(product_id)

        if not product:
            raise CheckoutError(
                code="PRODUCT_NOT_FOUND",
                message="Product not found.",
                status_code=404,
            )

        # opciones permitidas
        allowed = {
            a.option.slug: a.option
            for a in product.option_assignments
        }

        groups = {}

        for slug in selected_options:
            option = allowed.get(slug)

            if not option:
                raise CheckoutError(
                    code="INVALID_OPTION",
                    message=f"Option '{slug}' not allowed.",
                    status_code=400,
                )

            if not option.is_active:
                raise CheckoutError(
                    code="INACTIVE_OPTION",
                    message=f"Option '{slug}' is inactive.",
                    status_code=400,
                )

            group = option.group

            if group.slug not in groups:
                groups[group.slug] = {
                    "group": group,
                    "options": []
                }

            groups[group.slug]["options"].append(option)

        # validar grupos tipo "single"
        for g in groups.values():
            if g["group"].type == "single" and len(g["options"]) > 1:
                raise CheckoutError(
                    code="INVALID_OPTION_COMBINATION",
                    message=f"Multiple options selected for group '{g['group'].slug}'.",
                    status_code=400,
                )

        # validar obligatorios
        required_groups = {
            a.option.group.slug: a.option.group
            for a in product.option_assignments
            if a.option.group.is_required
        }

        for group_slug in required_groups:
            if group_slug not in groups:
                raise CheckoutError(
                    code="MISSING_REQUIRED_OPTION",
                    message=f"Missing required option for group '{group_slug}'.",
                    status_code=400,
                )