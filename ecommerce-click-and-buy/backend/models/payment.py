from database import db
from datetime import datetime, timezone
import uuid

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, unique=True)
    transaction_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    method = db.Column(db.String(30), default='webpay')
    # Token de Webpay: identifica la transacción cuando el usuario vuelve de Transbank
    token = db.Column(db.String(64), unique=True, index=True)
    amount = db.Column(db.Float, nullable=False)
    # pending → approved | rejected | cancelled | failed
    status = db.Column(db.String(50), default='pending')
    response_code = db.Column(db.Integer)
    authorization_code = db.Column(db.String(20))
    card_last4 = db.Column(db.String(4))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        # El token no se expone: basta con él para intentar confirmar la transacción
        return {
            "id": self.id,
            "order_id": self.order_id,
            "transaction_id": self.transaction_id,
            "method": self.method,
            "amount": self.amount,
            "status": self.status,
            "authorization_code": self.authorization_code,
            "card_last4": self.card_last4,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
