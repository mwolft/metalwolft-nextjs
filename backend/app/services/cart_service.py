import uuid
from app.extensions import db
from app.models.cart import Cart


class CartService:
    @staticmethod
    def get_or_create_anonymous_cart(anonymous_id: str | None):
        if not anonymous_id:
            anonymous_id = uuid.uuid4().hex

        cart = Cart.query.filter_by(anonymous_id=anonymous_id).first()

        if not cart:
            cart = Cart(anonymous_id=anonymous_id)
            db.session.add(cart)
            db.session.commit()

        return cart, anonymous_id

    @staticmethod
    def get_or_create_user_cart(user_id: int):
        cart = Cart.query.filter_by(user_id=user_id).first()

        if not cart:
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()

        return cart

    @staticmethod
    def merge_carts(user_cart: Cart, anonymous_cart: Cart):
        # Más adelante aquí se fusionarán los items
        db.session.delete(anonymous_cart)
        db.session.commit()
