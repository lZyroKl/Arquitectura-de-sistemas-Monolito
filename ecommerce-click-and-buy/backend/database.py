import sqlite3
import os

from config import Config

_db_path = Config.DB_PATH


def set_db_path(path):
    global _db_path
    _db_path = path


def get_connection():
    directory = os.path.dirname(_db_path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    conn = sqlite3.connect(_db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# Columnas agregadas a "orders" después de la primera versión del esquema.
# Se aplican con ALTER TABLE para no perder los pedidos de bases existentes.
ORDER_EXTRA_COLUMNS = {
    "subtotal": "REAL NOT NULL DEFAULT 0",
    "shipping_cost": "REAL NOT NULL DEFAULT 0",
    "customer_name": "TEXT DEFAULT ''",
    "customer_email": "TEXT DEFAULT ''",
    "customer_rut": "TEXT DEFAULT ''",
    "customer_phone": "TEXT DEFAULT ''",
    "shipping_address": "TEXT DEFAULT ''",
    "shipping_city": "TEXT DEFAULT ''",
    "shipping_region": "TEXT DEFAULT ''",
    "shipping_notes": "TEXT DEFAULT ''",
    "payment_method": "TEXT DEFAULT 'webpay'",
    "payment_token": "TEXT",
    "authorization_code": "TEXT",
    "card_last4": "TEXT",
    "paid_at": "TIMESTAMP",
}


def _migrate_orders(cursor):
    existing = {row["name"] for row in cursor.execute("PRAGMA table_info(orders)").fetchall()}
    for column, definition in ORDER_EXTRA_COLUMNS.items():
        if column not in existing:
            cursor.execute(f"ALTER TABLE orders ADD COLUMN {column} {definition}")


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            brand TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            price_usd REAL,
            description TEXT,
            image_url TEXT,
            stock INTEGER DEFAULT 0,
            sizes TEXT DEFAULT '[]',
            style_id TEXT DEFAULT '',
            colorway TEXT DEFAULT '',
            release_date TEXT DEFAULT '',
            resell_links TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    _migrate_orders(cursor)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_orders_payment_token ON orders(payment_token)")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            size TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)

    conn.commit()
    conn.close()
