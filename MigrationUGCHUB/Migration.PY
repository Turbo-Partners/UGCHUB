import os
import re
import sys
import json
import time
import argparse
import tempfile
from typing import Dict, List, Tuple

import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv


# --------------------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------------------

DEFAULT_SCHEMAS = [
    "core",
    "company",
    "creator",
    "brand",
    "campaign",
    "messaging",
    "social",
    "content",
    "academy",
    "billing",
    "gamification",
    "analytics",
    "system",
    "gold",
    "misc",
]

# Explicit overrides always win
TABLE_SCHEMA_OVERRIDES = {
    "users": "core",
    "companies": "company",
    "company_members": "company",
    "company_user_invites": "company",
    "applications": "campaign",
    "deliverables": "campaign",
    "deliverable_comments": "campaign",
    "campaigns": "campaign",
    "campaign_invites": "campaign",
    "campaign_templates": "campaign",
    "campaign_prizes": "campaign",
    "campaign_points_rules": "campaign",
    "campaign_metric_snapshots": "analytics",
    "profile_snapshots": "analytics",
    "creator_analytics_history": "analytics",
    "notifications": "system",
    "feature_flags": "system",
    "integration_logs": "system",
    "session": "system",
    "tags": "system",
    "data_source_registry": "system",
    "conversations": "messaging",
    "conv_messages": "messaging",
    "message_reads": "messaging",
    "blog_posts": "content",
    "inspirations": "content",
    "inspiration_collections": "content",
    "inspiration_collection_items": "content",
    "creator_saved_inspirations": "content",
    "campaign_inspirations": "content",
    "courses": "academy",
    "course_modules": "academy",
    "course_lessons": "academy",
    "creator_course_progress": "academy",
    "creator_lesson_progress": "academy",
    "company_wallets": "billing",
    "wallet_boxes": "billing",
    "wallet_transactions": "billing",
    "payment_batches": "billing",
    "sales_tracking": "billing",
    "creator_commissions": "billing",
    "creator_balances": "billing",
    "points_ledger": "gamification",
    "creator_points": "gamification",
    "creator_levels": "gamification",
    "badges": "gamification",
    "creator_badges": "gamification",
    "brand_rewards": "gamification",
    "brand_programs": "gamification",
    "brand_tier_configs": "gamification",
    "brand_creator_tiers": "gamification",
    "reward_entitlements": "gamification",
    "brand_settings": "brand",
    "brand_tags": "brand",
    "brand_creator_memberships": "brand",
    "brand_creator_tiers": "brand",
}

# Regex rules in order
SCHEMA_RULES: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"^company_"), "company"),
    (re.compile(r"^creator_"), "creator"),
    (re.compile(r"^brand_"), "brand"),
    (re.compile(r"^campaign_"), "campaign"),
    (re.compile(r"^instagram_"), "social"),
    (re.compile(r"^tiktok_"), "social"),
    (re.compile(r"^youtube_"), "social"),
    (re.compile(r"^meta_"), "social"),
    (re.compile(r"^dm_"), "social"),
    (re.compile(r"^whatsapp_"), "social"),
    (re.compile(r"^conv_"), "messaging"),
    (re.compile(r"^message_"), "messaging"),
    (re.compile(r"^wallet_"), "billing"),
    (re.compile(r"^payment_"), "billing"),
    (re.compile(r"^sales_"), "billing"),
    (re.compile(r"^course_"), "academy"),
    (re.compile(r"^inspiration_"), "content"),
    (re.compile(r".*_analytics$"), "analytics"),
    (re.compile(r".*_metrics$"), "analytics"),
    (re.compile(r".*_snapshots$"), "analytics"),
    (re.compile(r"^feature_"), "system"),
]


# --------------------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------------------

def load_env():
    load_dotenv()
    # Destination (GCloud SQL)
    gc_host = os.getenv("GC_HOST")
    gc_port = os.getenv("GC_PORT", "5432")
    gc_dbname = os.getenv("GC_DBNAME")
    gc_user = os.getenv("GC_USER")
    gc_password = os.getenv("GC_PASSWORD")
    gc_sslmode = os.getenv("GC_SSLMODE", "require")

    if not all([gc_host, gc_dbname, gc_user, gc_password]):
        print("Missing GC_* environment variables in MigrationUGCHUB/.env")
        sys.exit(1)

    dest_dsn = f"postgresql://{gc_user}:{gc_password}@{gc_host}:{gc_port}/{gc_dbname}?sslmode={gc_sslmode}"

    # Source (Neon) - read only
    source_dsn = os.getenv("DATABASE_URL")
    if not source_dsn:
        print("Missing DATABASE_URL in MigrationUGCHUB/.env")
        sys.exit(1)

    return source_dsn, dest_dsn


def resolve_schema(table: str) -> str:
    if table in TABLE_SCHEMA_OVERRIDES:
        return TABLE_SCHEMA_OVERRIDES[table]
    for pattern, schema in SCHEMA_RULES:
        if pattern.search(table):
            return schema
    return "misc"


def connect_source(dsn: str):
    conn = psycopg2.connect(dsn)
    conn.set_session(readonly=True, autocommit=True)
    return conn


def connect_dest(dsn: str):
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    return conn


def fetch_tables(conn) -> List[str]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
            """
        )
        return [row[0] for row in cur.fetchall()]


def fetch_enum_types(conn) -> List[Tuple[str, List[str]]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT n.nspname as schema, t.typname,
                   array_agg(e.enumlabel ORDER BY e.enumsortorder) as labels
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            GROUP BY n.nspname, t.typname
            ORDER BY t.typname
            """
        )
        return [(row[1], row[2]) for row in cur.fetchall()]


def fetch_columns(conn, table: str) -> List[Dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                a.attname,
                pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
                a.attnotnull,
                pg_get_expr(ad.adbin, ad.adrelid) AS default_expr,
                a.attidentity
            FROM pg_attribute a
            JOIN pg_class c ON c.oid = a.attrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
            WHERE n.nspname = 'public'
              AND c.relname = %s
              AND a.attnum > 0
              AND NOT a.attisdropped
            ORDER BY a.attnum
            """,
            (table,),
        )
        cols = []
        for row in cur.fetchall():
            cols.append(
                {
                    "name": row[0],
                    "data_type": row[1],
                    "not_null": row[2],
                    "default": row[3],
                    "identity": row[4],
                }
            )
        return cols


def fetch_constraints(conn) -> Dict[str, Dict[str, List[Dict]]]:
    """
    Returns constraints grouped by table:
    {
      "table": {
         "pk": [ {name, def} ],
         "unique": [ {name, def} ],
         "fk": [ {name, cols, ref_table, ref_cols, on_update, on_delete, match} ]
      }
    }
    """
    constraints: Dict[str, Dict[str, List[Dict]]] = {}

    with conn.cursor() as cur:
        # PK + UNIQUE
        cur.execute(
            """
            SELECT c.relname AS table_name,
                   con.conname,
                   con.contype,
                   pg_get_constraintdef(con.oid) AS condef
            FROM pg_constraint con
            JOIN pg_class c ON c.oid = con.conrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND con.contype IN ('p','u')
            ORDER BY c.relname, con.conname
            """
        )
        for table_name, conname, contype, condef in cur.fetchall():
            constraints.setdefault(table_name, {"pk": [], "unique": [], "fk": []})
            if contype == "p":
                constraints[table_name]["pk"].append({"name": conname, "def": condef})
            else:
                constraints[table_name]["unique"].append({"name": conname, "def": condef})

        # FKs
        cur.execute(
            """
            SELECT
                con.conname,
                src.relname AS table_name,
                con.conkey,
                ref.relname AS ref_table,
                con.confkey,
                con.confupdtype,
                con.confdeltype,
                con.confmatchtype
            FROM pg_constraint con
            JOIN pg_class src ON src.oid = con.conrelid
            JOIN pg_class ref ON ref.oid = con.confrelid
            JOIN pg_namespace n ON n.oid = src.relnamespace
            WHERE n.nspname = 'public'
              AND con.contype = 'f'
            ORDER BY src.relname, con.conname
            """
        )
        fk_rows = cur.fetchall()

    for row in fk_rows:
        conname, table_name, conkey, ref_table, confkey, confupdtype, confdeltype, confmatchtype = row
        src_cols = fetch_attnums(conn, table_name, conkey)
        ref_cols = fetch_attnums(conn, ref_table, confkey)
        constraints.setdefault(table_name, {"pk": [], "unique": [], "fk": []})
        constraints[table_name]["fk"].append(
            {
                "name": conname,
                "cols": src_cols,
                "ref_table": ref_table,
                "ref_cols": ref_cols,
                "on_update": decode_fk_action(confupdtype),
                "on_delete": decode_fk_action(confdeltype),
                "match": decode_fk_match(confmatchtype),
            }
        )

    return constraints


def fetch_attnums(conn, table: str, attnums: List[int]) -> List[str]:
    if not attnums:
        return []
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT attnum, attname
            FROM pg_attribute a
            JOIN pg_class c ON c.oid = a.attrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relname = %s
              AND a.attnum = ANY(%s)
            """,
            (table, attnums),
        )
        mapping = {row[0]: row[1] for row in cur.fetchall()}
    return [mapping[a] for a in attnums]


def decode_fk_action(code: str) -> str:
    return {
        "a": "NO ACTION",
        "r": "RESTRICT",
        "c": "CASCADE",
        "n": "SET NULL",
        "d": "SET DEFAULT",
    }.get(code, "NO ACTION")


def decode_fk_match(code: str) -> str:
    return {"f": "FULL", "p": "PARTIAL", "s": "SIMPLE"}.get(code, "SIMPLE")


def fetch_indexes(conn) -> List[Dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT schemaname, tablename, indexname, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
            """
        )
        rows = cur.fetchall()
    return [
        {
            "schema": row[0],
            "table": row[1],
            "name": row[2],
            "def": row[3],
        }
        for row in rows
    ]


def create_schema(conn, schema: str):
    with conn.cursor() as cur:
        cur.execute(sql.SQL("CREATE SCHEMA IF NOT EXISTS {}").format(sql.Identifier(schema)))


def create_enum_types(dest_conn, enums: List[Tuple[str, List[str]]]):
    with dest_conn.cursor() as cur:
        for enum_name, labels in enums:
            cur.execute(
                sql.SQL(
                    "DO $$ BEGIN "
                    "IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace "
                    "WHERE n.nspname='public' AND t.typname=%s) THEN "
                    "CREATE TYPE public.{} AS ENUM ({}); "
                    "END IF; END $$;"
                ).format(
                    sql.Identifier(enum_name),
                    sql.SQL(", ").join(sql.Literal(label) for label in labels),
                ),
                (enum_name,),
            )


def build_create_table_sql(schema_name: str, table: str, columns: List[Dict]) -> sql.SQL:
    col_defs = []
    identity_cols = []
    for col in columns:
        col_name = sql.Identifier(col["name"])
        data_type = sql.SQL(col["data_type"])
        parts = [col_name, data_type]

        if col["identity"] in ("a", "d"):
            parts.append(sql.SQL("GENERATED BY DEFAULT AS IDENTITY"))
            identity_cols.append(col["name"])
        else:
            default = col["default"]
            if default and default.startswith("nextval("):
                parts.append(sql.SQL("GENERATED BY DEFAULT AS IDENTITY"))
                identity_cols.append(col["name"])
            elif default:
                parts.append(sql.SQL("DEFAULT " + default))

        if col["not_null"]:
            parts.append(sql.SQL("NOT NULL"))

        col_defs.append(sql.SQL(" ").join(parts))

    create_sql = sql.SQL("CREATE TABLE IF NOT EXISTS {}.{} ({});").format(
        sql.Identifier(schema_name),
        sql.Identifier(table),
        sql.SQL(", ").join(col_defs),
    )
    return create_sql


def copy_table_data(src_conn, dest_conn, src_table: str, dest_schema: str, truncate: bool):
    with dest_conn.cursor() as dcur:
        if truncate:
            dcur.execute(
                sql.SQL("TRUNCATE TABLE {}.{} RESTART IDENTITY CASCADE;").format(
                    sql.Identifier(dest_schema),
                    sql.Identifier(src_table),
                )
            )

    with tempfile.SpooledTemporaryFile(max_size=1024 * 1024 * 100, mode="w+b") as temp:
        with src_conn.cursor() as scur:
            copy_out = sql.SQL("COPY (SELECT * FROM {}.{}) TO STDOUT WITH (FORMAT CSV, DELIMITER E'\\t', NULL '\\N');").format(
                sql.Identifier("public"),
                sql.Identifier(src_table),
            )
            scur.copy_expert(copy_out, temp)

        temp.seek(0)
        with dest_conn.cursor() as dcur:
            copy_in = sql.SQL("COPY {}.{} FROM STDIN WITH (FORMAT CSV, DELIMITER E'\\t', NULL '\\N');").format(
                sql.Identifier(dest_schema),
                sql.Identifier(src_table),
            )
            dcur.copy_expert(copy_in, temp)


def set_identity_sequences(dest_conn, schema_name: str, table: str):
    """
    Set identity sequences based on max values for identity/serial columns.
    """
    with dest_conn.cursor() as cur:
        cur.execute(
            """
            SELECT a.attname
            FROM pg_attribute a
            JOIN pg_class c ON c.oid = a.attrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = %s
              AND c.relname = %s
              AND a.attidentity in ('a','d')
            """,
            (schema_name, table),
        )
        identity_cols = [row[0] for row in cur.fetchall()]

        for col in identity_cols:
            cur.execute(
                sql.SQL("SELECT pg_get_serial_sequence(%s, %s);"),
                (f"{schema_name}.{table}", col),
            )
            seq = cur.fetchone()[0]
            if not seq:
                continue
            cur.execute(
                sql.SQL("SELECT MAX({}) FROM {}.{};").format(
                    sql.Identifier(col),
                    sql.Identifier(schema_name),
                    sql.Identifier(table),
                )
            )
            max_val = cur.fetchone()[0]
            if not max_val or max_val < 1:
                # Initialize sequence to 1 without incrementing
                cur.execute(sql.SQL("SELECT setval(%s, %s, false);"), (seq, 1))
            else:
                cur.execute(sql.SQL("SELECT setval(%s, %s, true);"), (seq, max_val))


def create_constraints(dest_conn, constraints, schema_map):
    with dest_conn.cursor() as cur:
        # Pass 1: PK + UNIQUE for all tables
        for table, con in constraints.items():
            if table not in schema_map:
                continue
            dest_schema = schema_map[table]

            for pk in con["pk"]:
                try:
                    cur.execute(
                        sql.SQL("ALTER TABLE {}.{} ADD CONSTRAINT {} {}").format(
                            sql.Identifier(dest_schema),
                            sql.Identifier(table),
                            sql.Identifier(pk["name"]),
                            sql.SQL(pk["def"]),
                        )
                    )
                except (psycopg2.errors.DuplicateObject, psycopg2.errors.DuplicateTable, psycopg2.errors.InvalidTableDefinition):
                    pass

            for uq in con["unique"]:
                try:
                    cur.execute(
                        sql.SQL("ALTER TABLE {}.{} ADD CONSTRAINT {} {}").format(
                            sql.Identifier(dest_schema),
                            sql.Identifier(table),
                            sql.Identifier(uq["name"]),
                            sql.SQL(uq["def"]),
                        )
                    )
                except (psycopg2.errors.DuplicateObject, psycopg2.errors.DuplicateTable):
                    pass

        # Pass 2: FKs after PK/UQ are in place
        for table, con in constraints.items():
            if table not in schema_map:
                continue
            dest_schema = schema_map[table]

            for fk in con["fk"]:
                if fk["ref_table"] not in schema_map:
                    continue
                ref_schema = schema_map[fk["ref_table"]]
                match = fk["match"]
                match_sql = f" MATCH {match}" if match != "SIMPLE" else ""
                try:
                    cur.execute(
                        sql.SQL(
                            "ALTER TABLE {}.{} ADD CONSTRAINT {} FOREIGN KEY ({}) REFERENCES {}.{} ({}){} ON UPDATE {} ON DELETE {}"
                        ).format(
                            sql.Identifier(dest_schema),
                            sql.Identifier(table),
                            sql.Identifier(fk["name"]),
                            sql.SQL(", ").join(sql.Identifier(c) for c in fk["cols"]),
                            sql.Identifier(ref_schema),
                            sql.Identifier(fk["ref_table"]),
                            sql.SQL(", ").join(sql.Identifier(c) for c in fk["ref_cols"]),
                            sql.SQL(match_sql),
                            sql.SQL(fk["on_update"]),
                            sql.SQL(fk["on_delete"]),
                        )
                    )
                except psycopg2.errors.DuplicateObject:
                    pass


def create_indexes(dest_conn, indexes, schema_map):
    with dest_conn.cursor() as cur:
        for idx in indexes:
            table = idx["table"]
            if table not in schema_map:
                continue
            dest_schema = schema_map[table]
            # Rewrite index definition to new schema and add schema to index name.
            indexdef = idx["def"]

            # Normalize ON clause schema (handles ON public., ON "public"., ON ONLY public.)
            indexdef = re.sub(
                r'ON\\s+(ONLY\\s+)?(\"?[A-Za-z0-9_]+\"?)\\.',
                lambda m: f"ON {m.group(1) or ''}{dest_schema}.",
                indexdef,
                flags=re.IGNORECASE,
            )

            # Replace ON public.table with ON dest_schema.table (handles quoted and unquoted)
            indexdef = re.sub(
                r'ON\\s+"public"\\.',
                f"ON {dest_schema}.",
                indexdef,
                flags=re.IGNORECASE,
            )
            indexdef = re.sub(
                r"ON\\s+public\\.",
                f"ON {dest_schema}.",
                indexdef,
                flags=re.IGNORECASE,
            )
            indexdef = re.sub(
                r'ON\\s+ONLY\\s+"public"\\.',
                f"ON ONLY {dest_schema}.",
                indexdef,
                flags=re.IGNORECASE,
            )
            indexdef = re.sub(
                r"ON\\s+ONLY\\s+public\\.",
                f"ON ONLY {dest_schema}.",
                indexdef,
                flags=re.IGNORECASE,
            )
            indexdef = re.sub(r'"public"\\.', f"{dest_schema}.", indexdef, flags=re.IGNORECASE)
            indexdef = re.sub(r"public\\.", f"{dest_schema}.", indexdef, flags=re.IGNORECASE)

            # If ON clause has no schema (e.g., ON applications), force schema
            indexdef = re.sub(
                rf'ON\\s+(ONLY\\s+)?(\"?{re.escape(table)}\"?)',
                lambda m: f"ON {m.group(1) or ''}{dest_schema}.{table}",
                indexdef,
                flags=re.IGNORECASE,
            )

            # Qualify index name with schema
            indexdef = re.sub(
                r"^CREATE\\s+(UNIQUE\\s+)?INDEX\\s+",
                lambda m: f"CREATE {m.group(1) or ''}INDEX IF NOT EXISTS {dest_schema}.",
                indexdef,
                flags=re.IGNORECASE,
            )

            try:
                cur.execute(indexdef)
            except (psycopg2.errors.DuplicateObject, psycopg2.errors.DuplicateTable):
                pass
            except (psycopg2.errors.UndefinedTable, psycopg2.errors.WrongObjectType):
                error_log = os.path.join(os.path.dirname(__file__), "INDEX_ERRORS.log")
                with open(error_log, "a", encoding="utf-8") as f:
                    f.write(indexdef + "\n\n")
                pass


def create_legacy_views(dest_conn, schema_map):
    """
    Create public views pointing to new schemas to keep old references working.
    """
    with dest_conn.cursor() as cur:
        for table, schema_name in schema_map.items():
            cur.execute(
                sql.SQL("CREATE OR REPLACE VIEW public.{} AS SELECT * FROM {}.{};").format(
                    sql.Identifier(table),
                    sql.Identifier(schema_name),
                    sql.Identifier(table),
                )
            )


def create_gold_views(dest_conn, schema_map):
    """
    Create basic gold views if required tables exist.
    """
    with dest_conn.cursor() as cur:
        # Users + Companies + Campaigns metrics
        cur.execute(
            """
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog','information_schema')
              AND table_name IN ('users','companies','campaigns','applications','deliverables')
            """
        )
        existing = {(row[0], row[1]) for row in cur.fetchall()}

    def has(table):
        return any(t[1] == table for t in existing)

    with dest_conn.cursor() as cur:
        if has("users"):
            users_schema = schema_map.get("users", "core")
            cur.execute(
                sql.SQL(
                    """
                    CREATE SCHEMA IF NOT EXISTS gold;
                    CREATE OR REPLACE VIEW gold.daily_user_signups AS
                    SELECT
                      date_trunc('day', created_at) AS day,
                      COUNT(*) AS total_users,
                      COUNT(*) FILTER (WHERE role = 'creator') AS creators,
                      COUNT(*) FILTER (WHERE role = 'company') AS companies,
                      COUNT(*) FILTER (WHERE role = 'admin') AS admins
                    FROM {}.users
                    GROUP BY 1
                    ORDER BY 1;
                    """
                ).format(sql.Identifier(users_schema))
            )

        if has("campaigns") and has("applications"):
            campaigns_schema = schema_map.get("campaigns", "campaign")
            applications_schema = schema_map.get("applications", "campaign")
            cur.execute(
                sql.SQL(
                    """
                    CREATE SCHEMA IF NOT EXISTS gold;
                    CREATE OR REPLACE VIEW gold.campaign_funnel AS
                    SELECT
                      c.id AS campaign_id,
                      c.title,
                      c.status,
                      COUNT(a.id) AS applications,
                      COUNT(*) FILTER (WHERE a.status = 'accepted') AS accepted,
                      COUNT(*) FILTER (WHERE a.status = 'rejected') AS rejected
                    FROM {}.campaigns c
                    LEFT JOIN {}.applications a ON a.campaign_id = c.id
                    GROUP BY 1,2,3;
                    """
                ).format(sql.Identifier(campaigns_schema), sql.Identifier(applications_schema))
            )

        if has("companies") and has("campaigns"):
            companies_schema = schema_map.get("companies", "company")
            campaigns_schema = schema_map.get("campaigns", "campaign")
            cur.execute(
                sql.SQL(
                    """
                    CREATE SCHEMA IF NOT EXISTS gold;
                    CREATE OR REPLACE VIEW gold.company_kpis AS
                    SELECT
                      co.id AS company_id,
                      co.name,
                      COUNT(c.id) AS total_campaigns,
                      COUNT(*) FILTER (WHERE c.status = 'open') AS open_campaigns,
                      COUNT(*) FILTER (WHERE c.status = 'closed') AS closed_campaigns
                    FROM {}.companies co
                    LEFT JOIN {}.campaigns c ON c.company_id = co.id
                    GROUP BY 1,2;
                    """
                ).format(sql.Identifier(companies_schema), sql.Identifier(campaigns_schema))
            )


def generate_documentation(dest_conn, schema_map, output_path: str):
    with dest_conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog','information_schema')
              AND table_type='BASE TABLE'
            ORDER BY table_schema, table_name
            """
        )
        tables = cur.fetchall()

    lines = []
    lines.append("# Database Documentation")
    lines.append("")
    lines.append("## Schema Overview")
    lines.append("")
    for schema in sorted({t[0] for t in tables}):
        lines.append(f"- `{schema}`")

    lines.append("")
    lines.append("## Table Mapping (public -> target schema)")
    lines.append("")
    for table, schema in sorted(schema_map.items()):
        lines.append(f"- `{table}` → `{schema}.{table}`")

    lines.append("")
    lines.append("## Table Details")
    lines.append("")

    with dest_conn.cursor() as cur:
        for schema, table in tables:
            lines.append(f"### `{schema}.{table}`")

            # Columns
            cur.execute(
                """
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = %s AND table_name = %s
                ORDER BY ordinal_position
                """,
                (schema, table),
            )
            cols = cur.fetchall()
            lines.append("")
            lines.append("Columns:")
            for col_name, data_type, is_nullable, default in cols:
                nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
                default_str = f" DEFAULT {default}" if default else ""
                lines.append(f"- `{col_name}`: {data_type} {nullable}{default_str}")

            # Primary keys
            cur.execute(
                """
                SELECT conname, pg_get_constraintdef(c.oid)
                FROM pg_constraint c
                JOIN pg_class t ON t.oid = c.conrelid
                JOIN pg_namespace n ON n.oid = t.relnamespace
                WHERE n.nspname = %s AND t.relname = %s AND c.contype = 'p'
                """,
                (schema, table),
            )
            pks = cur.fetchall()
            if pks:
                lines.append("")
                lines.append("Primary Keys:")
                for name, definition in pks:
                    lines.append(f"- `{name}`: {definition}")

            # Foreign keys
            cur.execute(
                """
                SELECT conname, pg_get_constraintdef(c.oid)
                FROM pg_constraint c
                JOIN pg_class t ON t.oid = c.conrelid
                JOIN pg_namespace n ON n.oid = t.relnamespace
                WHERE n.nspname = %s AND t.relname = %s AND c.contype = 'f'
                """,
                (schema, table),
            )
            fks = cur.fetchall()
            if fks:
                lines.append("")
                lines.append("Foreign Keys:")
                for name, definition in fks:
                    lines.append(f"- `{name}`: {definition}")

            lines.append("")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    parser = argparse.ArgumentParser(description="UGC Hub DB Migration (Neon -> GCloud SQL)")
    parser.add_argument("--schema-only", action="store_true", help="Only create schemas/tables (no data).")
    parser.add_argument("--data-only", action="store_true", help="Only copy data (assumes tables exist).")
    parser.add_argument("--with-constraints", action="store_true", help="Create constraints after data load.")
    parser.add_argument("--with-indexes", action="store_true", help="Create indexes after data load.")
    parser.add_argument("--with-gold", action="store_true", help="Create gold views.")
    parser.add_argument("--with-legacy-views", action="store_true", help="Create public views pointing to new schemas.")
    parser.add_argument("--truncate", action="store_true", help="Truncate destination tables before copy.")
    parser.add_argument("--document", action="store_true", help="Generate documentation markdown.")
    parser.add_argument("--only", action="append", help="Only migrate a specific table (can be repeated).")
    args = parser.parse_args()

    source_dsn, dest_dsn = load_env()
    src_conn = connect_source(source_dsn)
    dest_conn = connect_dest(dest_dsn)

    tables = fetch_tables(src_conn)
    if args.only:
        tables = [t for t in tables if t in set(args.only)]

    schema_map = {t: resolve_schema(t) for t in tables}

    # Ensure schemas exist
    for schema_name in sorted(set(schema_map.values()) | {"gold"}):
        create_schema(dest_conn, schema_name)

    # Enums
    enums = fetch_enum_types(src_conn)
    if enums:
        create_enum_types(dest_conn, enums)

    # Create tables
    if not args.data_only:
        for table in tables:
            schema_name = schema_map[table]
            columns = fetch_columns(src_conn, table)
            create_sql = build_create_table_sql(schema_name, table, columns)
            with dest_conn.cursor() as cur:
                cur.execute(create_sql)

    # Copy data
    if not args.schema_only:
        for table in tables:
            schema_name = schema_map[table]
            print(f"Copying {table} -> {schema_name}.{table}")
            copy_table_data(src_conn, dest_conn, table, schema_name, args.truncate)
            set_identity_sequences(dest_conn, schema_name, table)

    # Constraints / Indexes
    constraints = fetch_constraints(src_conn)
    if args.with_constraints:
        create_constraints(dest_conn, constraints, schema_map)

    if args.with_indexes:
        indexes = fetch_indexes(src_conn)
        create_indexes(dest_conn, indexes, schema_map)

    if args.with_legacy_views:
        create_legacy_views(dest_conn, schema_map)

    if args.with_gold:
        create_gold_views(dest_conn, schema_map)

    if args.document:
        output_path = os.path.join(os.path.dirname(__file__), "DATABASE_DOC.md")
        generate_documentation(dest_conn, schema_map, output_path)
        print(f"Documentation generated at: {output_path}")

    src_conn.close()
    dest_conn.close()


if __name__ == "__main__":
    main()
