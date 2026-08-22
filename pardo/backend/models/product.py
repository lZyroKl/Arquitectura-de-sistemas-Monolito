import json
from database import get_connection


def get_all_products(brand=None, category=None, min_price=None, max_price=None, search=None):
    conn = get_connection()
    query = "SELECT * FROM products WHERE 1=1"
    params = []

    if brand:
        query += " AND brand = ?"
        params.append(brand)
    if category:
        query += " AND category = ?"
        params.append(category)
    if min_price:
        query += " AND price >= ?"
        params.append(float(min_price))
    if max_price:
        query += " AND price <= ?"
        params.append(float(max_price))
    if search:
        query += " AND (name LIKE ? OR brand LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    products = []
    for row in rows:
        product = dict(row)
        product["sizes"] = json.loads(product["sizes"])
        products.append(product)
    return products


def get_product_by_id(product_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()
    if row:
        product = dict(row)
        product["sizes"] = json.loads(product["sizes"])
        return product
    return None


def get_brands():
    conn = get_connection()
    rows = conn.execute("SELECT DISTINCT brand FROM products ORDER BY brand").fetchall()
    conn.close()
    return [row["brand"] for row in rows]


def get_categories():
    conn = get_connection()
    rows = conn.execute("SELECT DISTINCT category FROM products ORDER BY category").fetchall()
    conn.close()
    return [row["category"] for row in rows]
