"""Plantilla base de la documentación OpenAPI (Swagger) servida en /apidocs."""

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [{"endpoint": "apispec", "route": "/apispec.json"}],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/",
}

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "Click&Buy API",
        "description": (
            "API REST del e-commerce de zapatillas Click&Buy. La autenticación usa una "
            "cookie de sesión que se obtiene con /api/auth/login o /api/auth/register. "
            "Los pagos se procesan con Webpay Plus (Transbank)."
        ),
        "version": "1.0.0",
    },
    "tags": [
        {"name": "Productos", "description": "Catálogo de zapatillas"},
        {"name": "Autenticación", "description": "Registro y sesión de usuarios"},
        {"name": "Pedidos", "description": "Historial de pedidos del usuario"},
        {"name": "Pagos", "description": "Checkout con Webpay Plus"},
        {"name": "Sistema", "description": "Estado del servicio"},
    ],
    "definitions": {
        "Error": {
            "type": "object",
            "properties": {"error": {"type": "string"}},
        },
        "User": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "string"},
                "email": {"type": "string"},
                "created_at": {"type": "string"},
            },
        },
        "Product": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "string"},
                "brand": {"type": "string"},
                "category": {"type": "string"},
                "price": {"type": "number", "description": "Precio en CLP"},
                "price_usd": {"type": "number"},
                "description": {"type": "string"},
                "image_url": {"type": "string"},
                "stock": {"type": "integer"},
                "sizes": {"type": "array", "items": {"type": "string"}},
                "style_id": {"type": "string"},
                "colorway": {"type": "string"},
                "release_date": {"type": "string"},
                "resell_links": {"type": "object"},
            },
        },
        "ShippingData": {
            "type": "object",
            "required": ["name", "email", "rut", "phone", "address", "city", "region"],
            "properties": {
                "name": {"type": "string", "example": "Juan Pérez"},
                "email": {"type": "string", "example": "juan@correo.cl"},
                "rut": {"type": "string", "example": "11.111.111-1"},
                "phone": {"type": "string", "example": "+56912345678"},
                "address": {"type": "string", "example": "Av. Providencia 1234"},
                "city": {"type": "string", "example": "Providencia"},
                "region": {"type": "string", "example": "Región Metropolitana"},
                "notes": {"type": "string"},
            },
        },
        "OrderItem": {
            "type": "object",
            "properties": {
                "product_id": {"type": "integer"},
                "product_name": {"type": "string"},
                "size": {"type": "string"},
                "quantity": {"type": "integer"},
                "price": {"type": "number"},
            },
        },
        "Order": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "status": {
                    "type": "string",
                    "enum": ["pending", "paid", "rejected", "cancelled", "failed"],
                },
                "subtotal": {"type": "number"},
                "shipping_cost": {"type": "number"},
                "total": {"type": "number"},
                "payment_method": {"type": "string"},
                "authorization_code": {"type": "string"},
                "card_last4": {"type": "string"},
                "created_at": {"type": "string"},
                "paid_at": {"type": "string"},
                "items": {"type": "array", "items": {"$ref": "#/definitions/OrderItem"}},
            },
        },
    },
}
