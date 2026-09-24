import sqlite3

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event, inspect, text
from sqlalchemy.engine import Engine

db = SQLAlchemy()


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
    # SQLite no valida las claves foráneas a menos que se active en cada conexión
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()


def init_db():
    """Crea las tablas que falten y agrega columnas nuevas a las existentes.

    create_all() no modifica tablas ya creadas, así que las columnas agregadas
    después (p. ej. los datos de despacho en `orders`) se añaden con ALTER TABLE
    para no perder los datos de bases antiguas.
    """
    db.create_all()
    _add_missing_columns()


def _add_missing_columns():
    inspector = inspect(db.engine)
    with db.engine.begin() as conn:
        for table in db.metadata.sorted_tables:
            existing = {column["name"] for column in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name not in existing:
                    column_type = column.type.compile(dialect=db.engine.dialect)
                    conn.execute(text(f"ALTER TABLE {table.name} ADD COLUMN {column.name} {column_type}"))
