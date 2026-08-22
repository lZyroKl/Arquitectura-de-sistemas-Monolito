from database import get_connection


def create_order(user_id, items):
    conn = get_connection()
    total = sum(item["price"] * item["quantity"] for item in items)

    cursor = conn.execute(
        "INSERT INTO orders (user_id, total) VALUES (?, ?)",
        (user_id, total)
    )
    order_id = cursor.lastrowid

    for item in items:
        conn.execute(
            "INSERT INTO order_items (order_id, product_id, size, quantity, price) VALUES (?, ?, ?, ?, ?)",
            (order_id, item["product_id"], item["size"], item["quantity"], item["price"])
        )

    conn.commit()
    order = get_order_by_id(order_id)
    conn.close()
    return order


def get_orders_by_user(user_id):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    ).fetchall()

    orders = []
    for row in rows:
        order = dict(row)
        items = conn.execute(
            """SELECT oi.*, p.name as product_name, p.image_url
               FROM order_items oi
               JOIN products p ON oi.product_id = p.id
               WHERE oi.order_id = ?""",
            (order["id"],)
        ).fetchall()
        order["items"] = [dict(i) for i in items]
        orders.append(order)

    conn.close()
    return orders


def get_order_by_id(order_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if not row:
        conn.close()
        return None

    order = dict(row)
    items = conn.execute(
        """SELECT oi.*, p.name as product_name, p.image_url
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?""",
        (order["id"],)
    ).fetchall()
    order["items"] = [dict(i) for i in items]
    conn.close()
    return order
