from database import db
from datetime import datetime, timezone

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    brand = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    price_usd = db.Column(db.Float, default=0.0)
    description = db.Column(db.Text, default='')
    image_url = db.Column(db.String(500), default='')
    stock = db.Column(db.Integer, default=0)
    sizes = db.Column(db.JSON, default=list)
    style_id = db.Column(db.String(100), default='')
    colorway = db.Column(db.String(100), default='')
    release_date = db.Column(db.String(100), default='')
    resell_links = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    order_items = db.relationship('OrderItem', backref='product', lazy=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "brand": self.brand,
            "category": self.category,
            "price": self.price,
            "price_usd": self.price_usd,
            "description": self.description,
            "image_url": self.image_url,
            "stock": self.stock,
            "sizes": self.sizes or [],
            "style_id": self.style_id,
            "colorway": self.colorway,
            "release_date": self.release_date,
            "resell_links": self.resell_links or {},
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
