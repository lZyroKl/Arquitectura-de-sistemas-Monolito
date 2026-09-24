from database import get_connection

ORDER_ITEMS_QUERY = """
    SELECT oi.*, p.name as product_name, p.brand, p.image_url
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
"""


def _with_items(conn, row):
    order = dict(row)
    items = conn.execute(ORDER_ITEMS_QUERY, (order["id"],)).fetchall()
    order["items"] = [dict(i) for i in items]
    return order


def create_order(user_id, lines, subtotal, shipping_cost, shipping):
    """Crea un pedido en estado 'pending'. Los precios de `lines` ya vienen de la BD."""
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO orders (user_id, subtotal, shipping_cost, total, status,
               customer_name, customer_email, customer_rut, customer_phone,
               shipping_address, shipping_city, shipping_region, shipping_notes, payment_method)
           VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, 'webpay')""",
        (
            user_id, subtotal, shipping_cost, subtotal + shipping_cost,
            shipping["name"], shipping["email"], shipping["rut"], shipping["phone"],
            shipping["address"], shipping["city"], shipping["region"], shipping.get("notes", ""),
        )
    )
    order_id = cursor.lastrowid

    conn.executemany(
        "INSERT INTO order_items (order_id, product_id, size, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [(order_id, l["product_id"], l["size"], l["quantity"], l["price"]) for l in lines]
    )
    conn.commit()
    conn.close()
    return get_order_by_id(order_id)


def set_payment_token(order_id, token):
    conn = get_connection()
    conn.execute("UPDATE orders SET payment_token = ? WHERE id = ?", (token, order_id))
    conn.commit()
    conn.close()


def mark_order_paid(order_id, authorization_code, card_last4):
    """Marca el pedido como pagado y descuenta el stock en una sola transacción."""
    conn = get_connection()
    try:
        items = conn.execute(
            "SELECT product_id, quantity FROM order_items WHERE order_id = ?", (order_id,)
        ).fetchall()
        for item in items:
            conn.execute(
                "UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ?",
                (item["quantity"], item["product_id"])
            )
        conn.execute(
            """UPDATE orders SET status = 'paid', authorization_code = ?, card_last4 = ?,
                   paid_at = CURRENT_TIMESTAMP
               WHERE id = ?""",
            (authorization_code, card_last4, order_id)
        )
        conn.commit()
    finally:
        conn.close()


def update_order_status(order_id, status):
    conn = get_connection()
    conn.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
    conn.commit()
    conn.close()


def get_orders_by_user(user_id):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC",
        (user_id,)
    ).fetchall()
    orders = [_with_items(conn, row) for row in rows]
    conn.close()
    return orders


def _get_order_where(column, value):
    conn = get_connection()
    row = conn.execute(f"SELECT * FROM orders WHERE {column} = ?", (value,)).fetchone()
    order = _with_items(conn, row) if row else None
    conn.close()
    return order


def get_order_by_id(order_id):
    return _get_order_where("id", order_id)


def get_order_by_token(token):
    return _get_order_where("payment_token", token)
