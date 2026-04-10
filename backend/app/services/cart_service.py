import uuid
from decimal import Decimal

from sqlalchemy.orm import selectinload

from app.extensions import db
from app.models.cart import Cart, CartItem
from app.services.pricing_service import PricingError, PricingService


class CartNotFoundError(Exception):
    pass


class CartOwnershipError(Exception):
    pass


class CartService:
    @staticmethod
    def get_or_create_cart(*, anonymous_id: str | None, user=None):
        if user:
            cart = (
                Cart.query
                .options(selectinload(Cart.items).selectinload(CartItem.product))
                .filter_by(user_id=user.id)
                .first()
            )

            if not cart:
                cart = Cart(user_id=user.id)
                db.session.add(cart)
                db.session.commit()
                db.session.refresh(cart)

            return cart, None, "user"

        if not anonymous_id:
            anonymous_id = uuid.uuid4().hex

        cart = (
            Cart.query
            .options(selectinload(Cart.items).selectinload(CartItem.product))
            .filter_by(anonymous_id=anonymous_id)
            .first()
        )

        if not cart:
            cart = Cart(anonymous_id=anonymous_id)
            db.session.add(cart)
            db.session.commit()
            db.session.refresh(cart)

        return cart, anonymous_id, "anonymous"

    @staticmethod
    def add_item(
        *,
        cart: Cart,
        product_id: int,
        width_cm: int,
        height_cm: int,
        quantity: int,
    ):
        PricingService.quote(
            product_id=product_id,
            width_cm=width_cm,
            height_cm=height_cm,
            quantity=quantity,
        )

        existing_item = CartItem.query.filter_by(
            cart_id=cart.id,
            product_id=product_id,
            width_cm=width_cm,
            height_cm=height_cm,
        ).first()

        if existing_item:
            existing_item.quantity += quantity
            db.session.commit()
            return existing_item

        item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            width_cm=width_cm,
            height_cm=height_cm,
            quantity=quantity,
        )
        db.session.add(item)
        db.session.commit()
        return item

    @staticmethod
    def update_item(
        *,
        cart: Cart,
        item_id: int,
        product_id: int | None = None,
        width_cm: int | None = None,
        height_cm: int | None = None,
        quantity: int | None = None,
    ):
        item = CartService._get_owned_item(cart=cart, item_id=item_id)

        next_product_id = item.product_id if product_id is None else product_id
        next_width_cm = item.width_cm if width_cm is None else width_cm
        next_height_cm = item.height_cm if height_cm is None else height_cm
        next_quantity = item.quantity if quantity is None else quantity

        PricingService.quote(
            product_id=next_product_id,
            width_cm=next_width_cm,
            height_cm=next_height_cm,
            quantity=next_quantity,
        )

        item.product_id = next_product_id
        item.width_cm = next_width_cm
        item.height_cm = next_height_cm
        item.quantity = next_quantity

        db.session.commit()
        return item

    @staticmethod
    def delete_item(*, cart: Cart, item_id: int):
        item = CartService._get_owned_item(cart=cart, item_id=item_id)
        db.session.delete(item)
        db.session.commit()

    @staticmethod
    def merge_carts(*, user_cart: Cart, anonymous_cart: Cart):
        anonymous_items = CartItem.query.filter_by(cart_id=anonymous_cart.id).all()

        for anonymous_item in anonymous_items:
            matching_item = CartItem.query.filter_by(
                cart_id=user_cart.id,
                product_id=anonymous_item.product_id,
                width_cm=anonymous_item.width_cm,
                height_cm=anonymous_item.height_cm,
            ).first()

            if matching_item:
                matching_item.quantity += anonymous_item.quantity
                db.session.delete(anonymous_item)
            else:
                anonymous_item.cart_id = user_cart.id

        db.session.delete(anonymous_cart)
        db.session.commit()

    @staticmethod
    def serialize_cart(*, cart: Cart, cart_type: str):
        cart = (
            Cart.query
            .options(selectinload(Cart.items).selectinload(CartItem.product))
            .filter_by(id=cart.id)
            .first()
        )

        items = []
        products_subtotal = Decimal("0.00")
        shipping_base = Decimal("0.00")
        shipping_surcharge = Decimal("0.00")
        total = Decimal("0.00")
        rules_applied = []
        total_quantity = 0

        for item in cart.items:
            quote = PricingService.quote(
                product_id=item.product_id,
                width_cm=item.width_cm,
                height_cm=item.height_cm,
                quantity=item.quantity,
            )
            item_products_subtotal = Decimal(quote["pricing"]["products_subtotal"])
            item_shipping_surcharge = Decimal(quote["pricing"]["shipping_surcharge"])
            item_total = item_products_subtotal + item_shipping_surcharge

            items.append({
                "id": item.id,
                "product": quote["product"],
                "configuration": {
                    "width_cm": item.width_cm,
                    "height_cm": item.height_cm,
                    "quantity": item.quantity,
                },
                "pricing": {
                    **quote["pricing"],
                    "shipping_base": PricingService._serialize_decimal(Decimal("0.00")),
                    "total": PricingService._serialize_decimal(item_total),
                },
                "rules_applied": quote["rules_applied"],
            })

            products_subtotal += item_products_subtotal
            shipping_surcharge += item_shipping_surcharge
            rules_applied.extend(quote["rules_applied"])
            total_quantity += item.quantity

        shipping_base, shipping_rule = PricingService._calculate_shipping_base(
            products_subtotal
        )
        total = products_subtotal + shipping_base + shipping_surcharge

        if shipping_rule:
            rules_applied.append(shipping_rule)

        return {
            "cart_id": cart.id,
            "type": cart_type,
            "items": items,
            "summary": {
                "items_count": len(items),
                "total_quantity": total_quantity,
                "products_subtotal": PricingService._serialize_decimal(
                    products_subtotal
                ),
                "shipping_base": PricingService._serialize_decimal(
                    shipping_base
                ),
                "shipping_surcharge": PricingService._serialize_decimal(
                    shipping_surcharge
                ),
                "total": PricingService._serialize_decimal(
                    total
                ),
            },
            "rules_applied": sorted(set(rules_applied)),
            "currency": "EUR",
        }

    @staticmethod
    def _get_owned_item(*, cart: Cart, item_id: int):
        item = CartItem.query.filter_by(id=item_id).first()

        if not item:
            raise CartNotFoundError("Cart item not found.")

        if item.cart_id != cart.id:
            raise CartOwnershipError("Cart item does not belong to this cart.")

        return item
