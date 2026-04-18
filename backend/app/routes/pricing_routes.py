from flask import Blueprint, jsonify, request

from app.services.pricing_service import PricingError, PricingService


pricing_bp = Blueprint("pricing", __name__, url_prefix="/api/pricing")


@pricing_bp.post("/quote")
def quote_price():
    data = request.get_json() or {}

    product_id = data.get("product_id")
    width_cm = data.get("width_cm")
    height_cm = data.get("height_cm")
    quantity = data.get("quantity", 1)
    configuration = data.get("configuration")

    if configuration is None:
        configuration = {
            "width_cm": width_cm,
            "height_cm": height_cm,
            "anchoring_type": data.get("anchoring_type"),
            "color": data.get("color"),
            "options": data.get("options", []),
        }

    if product_id is None:
        return (
            jsonify(
                {
                    "error": {
                        "code": "MISSING_PRODUCT_ID",
                        "message": "product_id is required.",
                    }
                }
            ),
            400,
        )

    try:
        quote = PricingService.quote(
            product_id=int(product_id),
            configuration=configuration,
            quantity=int(quantity),
        )
    except TypeError:
        return (
            jsonify(
                {
                    "error": {
                        "code": "INVALID_PAYLOAD",
                        "message": "A valid configuration and quantity are required.",
                    }
                }
            ),
            400,
        )
    except ValueError:
        return (
            jsonify(
                {
                    "error": {
                        "code": "INVALID_PAYLOAD",
                        "message": "product_id and quantity must be valid integers.",
                    }
                }
            ),
            400,
        )
    except PricingError as exc:
        return (
            jsonify(
                {
                    "error": {
                        "code": exc.code,
                        "message": exc.message,
                    }
                }
            ),
            exc.status_code,
        )

    return jsonify(quote)
