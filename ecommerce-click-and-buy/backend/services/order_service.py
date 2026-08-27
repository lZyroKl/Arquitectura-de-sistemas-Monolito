from database import db
from models.order import Order, OrderItem
from models.product import Product

class OrderService:
    @staticmethod
    def create_order(user_id, items):
        total = sum(item["price"] * item["quantity"] for item in items)

        order = Order(user_id=user_id, total=total)
        db.session.add(order)
        db.session.flush() # To get order.id

        for item in items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item["product_id"],
                size=item["size"],
                quantity=item["quantity"],
                price=item["price"]
            )
            db.session.add(order_item)

        db.session.commit()
        return order.to_dict()

    @staticmethod
    def get_orders_by_user(user_id):
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        return [order.to_dict() for order in orders]

    @staticmethod
    def get_order_by_id(order_id):
        order = db.session.get(Order, order_id)
        if order:
            return order.to_dict()
        return None
