from database import db
from datetime import datetime, timezone
import uuid

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    transaction_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='success')
    card_last4 = db.Column(db.String(4), nullable=False)
    card_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "transaction_id": self.transaction_id,
            "amount": self.amount,
            "status": self.status,
            "card_last4": self.card_last4,
            "created_at": self.created_at.isoformat() if self.created_at else None
            # NUNCA devolvemos ni mostramos el card_hash en la respuesta JSON por seguridad
        }
