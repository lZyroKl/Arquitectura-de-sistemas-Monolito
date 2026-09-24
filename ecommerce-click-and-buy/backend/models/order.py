from database import db
from datetime import datetime, timezone

class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subtotal = db.Column(db.Float, default=0.0)
    shipping_cost = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, nullable=False)
    # pending → paid | rejected | cancelled | failed
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    paid_at = db.Column(db.DateTime)

    # Datos de contacto y despacho
    customer_name = db.Column(db.String(100), default='')
    customer_email = db.Column(db.String(120), default='')
    customer_rut = db.Column(db.String(20), default='')
    customer_phone = db.Column(db.String(30), default='')
    shipping_address = db.Column(db.String(255), default='')
    shipping_city = db.Column(db.String(100), default='')
    shipping_region = db.Column(db.String(100), default='')
    shipping_notes = db.Column(db.String(255), default='')

    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")
    payment = db.relationship('Payment', backref='order', uselist=False, cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        payment = self.payment
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subtotal": self.subtotal,
            "shipping_cost": self.shipping_cost,
            "total": self.total,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "customer_name": self.customer_name,
            "customer_email": self.customer_email,
            "customer_rut": self.customer_rut,
            "customer_phone": self.customer_phone,
            "shipping_address": self.shipping_address,
            "shipping_city": self.shipping_city,
            "shipping_region": self.shipping_region,
            "shipping_notes": self.shipping_notes,
            "payment_method": payment.method if payment else None,
            "authorization_code": payment.authorization_code if payment else None,
            "card_last4": payment.card_last4 if payment else None,
            "items": [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    size = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        data = {
            "id": self.id,
            "order_id": self.order_id,
            "product_id": self.product_id,
            "size": self.size,
            "quantity": self.quantity,
            "price": self.price,
        }
        if getattr(self, "product", None):
            data["product_name"] = self.product.name  # type: ignore
            data["brand"] = self.product.brand  # type: ignore
            data["image_url"] = self.product.image_url  # type: ignore
        return data
