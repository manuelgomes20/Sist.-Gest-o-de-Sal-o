from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _add_column_if_missing(engine: Engine, table: str, column: str, ddl: str) -> None:
    inspector = inspect(engine)
    if not inspector.has_table(table):
        return

    existing = {col["name"] for col in inspector.get_columns(table)}
    if column in existing:
        return

    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))


def run_idempotent_migrations(engine: Engine) -> None:
    dialect = engine.dialect.name
    if dialect == "postgresql":
        json_default = "JSON DEFAULT '{}'::json"
        bool_default = "BOOLEAN DEFAULT TRUE"
    else:
        json_default = "JSON DEFAULT '{}'"
        bool_default = "BOOLEAN DEFAULT 1"

    _add_column_if_missing(engine, "tenants", "billing_cycle", "VARCHAR(20) DEFAULT 'monthly'")
    _add_column_if_missing(engine, "tenants", "auto_suspend", bool_default)
    _add_column_if_missing(engine, "tenants", "grace_days", "INTEGER DEFAULT 5")

    _add_column_if_missing(engine, "tenant_settings", "schedule", json_default)
    _add_column_if_missing(engine, "tenant_settings", "alert_config", json_default)
    _add_column_if_missing(engine, "tenant_settings", "attendance_settings", json_default)
    _add_column_if_missing(engine, "tenant_settings", "logo", "TEXT DEFAULT ''")
