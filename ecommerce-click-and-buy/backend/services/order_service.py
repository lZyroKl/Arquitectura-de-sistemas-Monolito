from database import db
from models.order import Order, OrderItem
from models.product import Product

FREE_SHIPPING_THRESHOLD = 69990
SHIPPING_COST = 4990

REQUIRED_SHIPPING_FIELDS = ("name", "email", "rut", "phone", "address", "city", "region")


class OrderValidationError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class OrderService:
    @staticmethod
    def calculate_shipping(subtotal):
        return 0 if subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_COST

    @staticmethod
    def validate_shipping(shipping):
        if not isinstance(shipping, dict):
            raise OrderValidationError("Faltan los datos de despacho")

        missing = [f for f in REQUIRED_SHIPPING_FIELDS if not str(shipping.get(f, "")).strip()]
        if missing:
            raise OrderValidationError(f"Faltan datos de despacho: {', '.join(missing)}")

        cleaned = {f: str(shipping[f]).strip() for f in REQUIRED_SHIPPING_FIELDS}
        cleaned["notes"] = str(shipping.get("notes", "")).strip()
        return cleaned

    @staticmethod
    def build_order_lines(items):
        """Valida los items del carrito contra la BD y devuelve (líneas, subtotal).

        El precio siempre se toma de la base de datos; cualquier precio enviado
        por el cliente se ignora.
        """
        if not isinstance(items, list) or len(items) == 0:
            raise OrderValidationError("El pedido debe contener al menos un producto")

        lines = []
        requested_per_product = {}

        for item in items:
            if not isinstance(item, dict) or not all(k in item for k in ("product_id", "size", "quantity")):
                raise OrderValidationError("Datos de producto incompletos")

            try:
                product_id = int(item["product_id"])
                quantity = int(item["quantity"])
            except (TypeError, ValueError):
                raise OrderValidationError("Datos de producto inválidos")

            if quantity <= 0:
                raise OrderValidationError("La cantidad debe ser mayor a cero")

            product = db.session.get(Product, product_id)
            if not product:
                raise OrderValidationError(f"El producto {product_id} no existe", 404)

            size = str(item["size"])
            if product.sizes and size not in product.sizes:
                raise OrderValidationError(f"La talla {size} no está disponible para {product.name}")

            requested_per_product[product_id] = requested_per_product.get(product_id, 0) + quantity
            if requested_per_product[product_id] > product.stock:
                raise OrderValidationError(f"Stock insuficiente para {product.name}", 409)

            lines.append({
                "product_id": product_id,
                "size": size,
                "quantity": quantity,
                "price": product.price,
            })

        subtotal = sum(line["price"] * line["quantity"] for line in lines)
        return lines, subtotal

    @staticmethod
    def create_order(user_id, lines, subtotal, shipping_cost, shipping):
        """Crea un pedido 'pending'. Los precios de `lines` ya vienen de la BD."""
        order = Order(
            user_id=user_id,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=subtotal + shipping_cost,
            status="pending",
            customer_name=shipping["name"],
            customer_email=shipping["email"],
            customer_rut=shipping["rut"],
            customer_phone=shipping["phone"],
            shipping_address=shipping["address"],
            shipping_city=shipping["city"],
            shipping_region=shipping["region"],
            shipping_notes=shipping.get("notes", ""),
        )
        for line in lines:
            order.items.append(OrderItem(**line))

        db.session.add(order)
        db.session.commit()
        return order

    @staticmethod
    def get_orders_by_user(user_id):
        orders = (
            Order.query.filter_by(user_id=user_id)
            .order_by(Order.created_at.desc(), Order.id.desc())
            .all()
        )
        return [order.to_dict() for order in orders]

    @staticmethod
    def get_order_for_user(order_id, user_id):
        order = db.session.get(Order, order_id)
        if order and order.user_id == user_id:
            return order.to_dict()
        return None
