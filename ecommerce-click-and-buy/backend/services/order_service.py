from models.product import get_product_by_id

FREE_SHIPPING_THRESHOLD = 69990
SHIPPING_COST = 4990

REQUIRED_SHIPPING_FIELDS = ("name", "email", "rut", "phone", "address", "city", "region")


class OrderValidationError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def calculate_shipping(subtotal):
    return 0 if subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_COST


def validate_shipping(shipping):
    if not isinstance(shipping, dict):
        raise OrderValidationError("Faltan los datos de despacho")

    missing = [f for f in REQUIRED_SHIPPING_FIELDS if not str(shipping.get(f, "")).strip()]
    if missing:
        raise OrderValidationError(f"Faltan datos de despacho: {', '.join(missing)}")

    cleaned = {f: str(shipping[f]).strip() for f in REQUIRED_SHIPPING_FIELDS}
    cleaned["notes"] = str(shipping.get("notes", "")).strip()
    return cleaned


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

        product = get_product_by_id(product_id)
        if not product:
            raise OrderValidationError(f"El producto {product_id} no existe", 404)

        size = str(item["size"])
        if product["sizes"] and size not in product["sizes"]:
            raise OrderValidationError(f"La talla {size} no está disponible para {product['name']}")

        requested_per_product[product_id] = requested_per_product.get(product_id, 0) + quantity
        if requested_per_product[product_id] > product["stock"]:
            raise OrderValidationError(f"Stock insuficiente para {product['name']}", 409)

        lines.append({
            "product_id": product_id,
            "size": size,
            "quantity": quantity,
            "price": product["price"],
        })

    subtotal = sum(line["price"] * line["quantity"] for line in lines)
    return lines, subtotal
