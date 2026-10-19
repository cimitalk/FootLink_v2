"""Database Persistence Layer for Footlink:
- SQLite Local 0 EUR & PostgreSQL Free-Tier compatible per ADR-002, ADR-006 & ADR-007.
- Full CRUD for 1 PIM Commercial Item <-> N PLM Production Variants
- 3-Level Hierarchical BOM and 0 EUR Subcontractor Assignments
- Sprint 5: Seasons & Collections (1:N), Master Domain Registries & Dynamic Schema Attributes.
"""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional
from uuid import uuid4

from app.models import (
    AttributeFieldType,
    AttributeTargetEntity,
    BomComponentType,
    BomItem,
    Collection,
    CollectionCreate,
    CollectionStatus,
    DomainRegistryEntry,
    DomainRegistryEntryCreate,
    PimCommercialItem,
    PlmLifecycleStatus,
    PlmProductionVariant,
    ProductCategory,
    ProductionPhase,
    RegistryDomain,
    SchemaAttributeDefinition,
    SchemaAttributeDefinitionCreate,
    Season,
    SeasonCreate,
    SeasonStatus,
    SubcontractorAssignment,
)
from app.orm_models import HAS_SQLALCHEMY, Base

APPLICATIVO_DIR = Path(__file__).resolve().parents[2]
DATABASE_DIR = APPLICATIVO_DIR / "database"
DEFAULT_SQLITE_PATH = DATABASE_DIR / "footlink.db"
SCHEMA_SQL_PATH = DATABASE_DIR / "schema.sql"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

if HAS_SQLALCHEMY:
    from sqlalchemy import create_engine  # type: ignore
    from sqlalchemy.orm import sessionmaker  # type: ignore

    connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    engine = None
    SessionLocal = None


def _resolve_sqlite_file_path(db_url: str = DATABASE_URL) -> str:
    if db_url in ("sqlite:///:memory:", ":memory:"):
        return ":memory:"
    if db_url.startswith("sqlite:///"):
        path_str = db_url[len("sqlite:///") :]
        p = Path(path_str)
        p.parent.mkdir(parents=True, exist_ok=True)
        return str(p)
    DEFAULT_SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    return str(DEFAULT_SQLITE_PATH)


class FootlinkSQLitePersistence:
    """Unified SQLite/SQLAlchemy persistence gateway for 1 PIM <-> N PLM, 3-level BOM, L6 Costing,
    Subcontractor Portal, Seasons & Collections, Domain Registries, and Dynamic Schema Attributes.
    """

    def __init__(self, db_url: str = DATABASE_URL) -> None:
        self.db_url = db_url
        self.sqlite_path = _resolve_sqlite_file_path(db_url)
        self._mem_conn: Optional[sqlite3.Connection] = None
        self.init_schema()

    def get_connection(self) -> sqlite3.Connection:
        if self.sqlite_path == ":memory:":
            if self._mem_conn is None:
                self._mem_conn = sqlite3.connect(":memory:", check_same_thread=False)
                self._mem_conn.row_factory = sqlite3.Row
                self._mem_conn.execute("PRAGMA foreign_keys = ON;")
            return self._mem_conn
        conn = sqlite3.connect(self.sqlite_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _close_if_file(self, conn: sqlite3.Connection) -> None:
        if self.sqlite_path != ":memory:":
            conn.close()

    def init_schema(self) -> None:
        """Create database tables from schema.sql and apply backwards-compatible non-destructive migrations."""
        if HAS_SQLALCHEMY and engine is not None and not self.db_url.startswith("sqlite"):
            Base.metadata.create_all(bind=engine)
            return

        conn = self.get_connection()
        try:
            # 1. First ensure columns exist in case of upgrading an existing SQLite database
            for table_name in ("pim_commercial_items", "plm_production_variants", "bom_items"):
                try:
                    conn.execute(f"ALTER TABLE {table_name} ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{{}}'")
                except sqlite3.OperationalError:
                    pass

            for col_sql in (
                "ALTER TABLE pim_commercial_items ADD COLUMN season_id VARCHAR(64) NULL",
                "ALTER TABLE pim_commercial_items ADD COLUMN collection_id VARCHAR(64) NULL",
                "ALTER TABLE plm_production_variants ADD COLUMN collection_id VARCHAR(64) NULL",
            ):
                try:
                    conn.execute(col_sql)
                except sqlite3.OperationalError:
                    pass

            # 2. Execute full DDL (tables, constraints, indexes)
            if SCHEMA_SQL_PATH.exists():
                ddl = SCHEMA_SQL_PATH.read_text(encoding="utf-8")
                conn.executescript(ddl)

            conn.commit()
        finally:
            self._close_if_file(conn)

    def count_pim_items(self) -> int:
        conn = self.get_connection()
        try:
            row = conn.execute("SELECT COUNT(*) AS cnt FROM pim_commercial_items").fetchone()
            return int(row["cnt"]) if row else 0
        finally:
            self._close_if_file(conn)

    def clear_all(self, clear_master_data: bool = False) -> None:
        conn = self.get_connection()
        try:
            conn.execute("DELETE FROM subcontractor_assignments")
            conn.execute("DELETE FROM bom_items")
            conn.execute("DELETE FROM plm_production_variants")
            conn.execute("DELETE FROM pim_commercial_items")
            if clear_master_data:
                conn.execute("DELETE FROM collections")
                conn.execute("DELETE FROM seasons")
                conn.execute("DELETE FROM domain_registries")
                conn.execute("DELETE FROM schema_attribute_definitions")
            conn.commit()
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Seasons & Collections Management (Sprint 5)
    # ========================================================================

    def save_season(self, season_in: SeasonCreate, season_id: Optional[str] = None) -> Season:
        conn = self.get_connection()
        try:
            sid = season_id or f"SEASON-{season_in.code.replace(' ', '').replace('/', '').upper()}"
            created_iso = datetime.now(timezone.utc).isoformat()
            status_val = season_in.status.value if isinstance(season_in.status, SeasonStatus) else str(season_in.status)

            conn.execute(
                """
                INSERT OR REPLACE INTO seasons (
                    season_id, code, name, year, status, start_date, end_date, description, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    sid,
                    season_in.code,
                    season_in.name,
                    season_in.year,
                    status_val,
                    season_in.start_date,
                    season_in.end_date,
                    season_in.description,
                    created_iso,
                ),
            )

            # Insert any initial collections
            for col in season_in.initial_collections:
                cid = f"COLL-{sid}-{col.code.replace(' ', '').upper()}"
                col_status = col.status.value if isinstance(col.status, CollectionStatus) else str(col.status)
                conn.execute(
                    """
                    INSERT OR IGNORE INTO collections (
                        collection_id, season_id, code, name, target_market, status, description, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        cid,
                        sid,
                        col.code,
                        col.name,
                        col.target_market,
                        col_status,
                        col.description,
                        created_iso,
                    ),
                )

            conn.commit()
            return self.get_season(sid)  # type: ignore[return-value]
        finally:
            self._close_if_file(conn)

    def get_season(self, season_id: str) -> Optional[Season]:
        conn = self.get_connection()
        try:
            row = conn.execute("SELECT * FROM seasons WHERE season_id = ?", (season_id,)).fetchone()
            if not row:
                return None
            collections = self.list_collections(season_id=season_id)
            count_row = conn.execute(
                "SELECT COUNT(*) as cnt FROM pim_commercial_items WHERE season_id = ?",
                (season_id,),
            ).fetchone()
            linked_cnt = int(count_row["cnt"]) if count_row else 0
            return Season(
                season_id=row["season_id"],
                code=row["code"],
                name=row["name"],
                year=int(row["year"]),
                status=SeasonStatus(row["status"]),
                start_date=row["start_date"],
                end_date=row["end_date"],
                description=row["description"],
                collections=collections,
                linked_products_count=linked_cnt,
                created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    def list_seasons(self) -> List[Season]:
        conn = self.get_connection()
        try:
            rows = conn.execute("SELECT season_id FROM seasons ORDER BY year DESC, code ASC").fetchall()
            seasons: List[Season] = []
            for r in rows:
                s = self.get_season(r["season_id"])
                if s:
                    seasons.append(s)
            return seasons
        finally:
            self._close_if_file(conn)

    def delete_season(self, season_id: str) -> bool:
        conn = self.get_connection()
        try:
            cur = conn.execute("DELETE FROM seasons WHERE season_id = ?", (season_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            self._close_if_file(conn)

    def save_collection(
        self, season_id: str, col_in: CollectionCreate, collection_id: Optional[str] = None
    ) -> Collection:
        conn = self.get_connection()
        try:
            cid = collection_id or f"COLL-{season_id}-{col_in.code.replace(' ', '').upper()}"
            created_iso = datetime.now(timezone.utc).isoformat()
            col_status = col_in.status.value if isinstance(col_in.status, CollectionStatus) else str(col_in.status)

            conn.execute(
                """
                INSERT OR REPLACE INTO collections (
                    collection_id, season_id, code, name, target_market, status, description, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    cid,
                    season_id,
                    col_in.code,
                    col_in.name,
                    col_in.target_market,
                    col_status,
                    col_in.description,
                    created_iso,
                ),
            )
            conn.commit()
            return self.get_collection(cid)  # type: ignore[return-value]
        finally:
            self._close_if_file(conn)

    def get_collection(self, collection_id: str) -> Optional[Collection]:
        conn = self.get_connection()
        try:
            row = conn.execute("SELECT * FROM collections WHERE collection_id = ?", (collection_id,)).fetchone()
            if not row:
                return None
            count_row = conn.execute(
                "SELECT COUNT(*) as cnt FROM pim_commercial_items WHERE collection_id = ?",
                (collection_id,),
            ).fetchone()
            linked_cnt = int(count_row["cnt"]) if count_row else 0
            return Collection(
                collection_id=row["collection_id"],
                season_id=row["season_id"],
                code=row["code"],
                name=row["name"],
                target_market=row["target_market"],
                status=CollectionStatus(row["status"]),
                description=row["description"],
                products_count=linked_cnt,
                created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    def list_collections(self, season_id: Optional[str] = None) -> List[Collection]:
        conn = self.get_connection()
        try:
            if season_id:
                rows = conn.execute(
                    "SELECT collection_id FROM collections WHERE season_id = ? ORDER BY code ASC",
                    (season_id,),
                ).fetchall()
            else:
                rows = conn.execute("SELECT collection_id FROM collections ORDER BY code ASC").fetchall()
            cols: List[Collection] = []
            for r in rows:
                c = self.get_collection(r["collection_id"])
                if c:
                    cols.append(c)
            return cols
        finally:
            self._close_if_file(conn)

    def delete_collection(self, collection_id: str) -> bool:
        conn = self.get_connection()
        try:
            cur = conn.execute("DELETE FROM collections WHERE collection_id = ?", (collection_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Master Domain Registries (Sprint 5)
    # ========================================================================

    def save_registry_entry(self, entry_in: DomainRegistryEntryCreate) -> DomainRegistryEntry:
        conn = self.get_connection()
        try:
            created_iso = datetime.now(timezone.utc).isoformat()
            dom_val = (
                entry_in.registry_domain.value
                if isinstance(entry_in.registry_domain, RegistryDomain)
                else str(entry_in.registry_domain)
            )
            meta_json = json.dumps(entry_in.metadata)

            conn.execute(
                """
                INSERT OR REPLACE INTO domain_registries (
                    registry_domain, registry_name, entry_code, label_it, label_en,
                    metadata_json, is_active, sort_order, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    dom_val,
                    entry_in.registry_name,
                    entry_in.entry_code,
                    entry_in.label_it,
                    entry_in.label_en,
                    meta_json,
                    1 if entry_in.is_active else 0,
                    entry_in.sort_order,
                    created_iso,
                ),
            )
            conn.commit()
            return self.get_registry_entry(dom_val, entry_in.registry_name, entry_in.entry_code)  # type: ignore[return-value]
        finally:
            self._close_if_file(conn)

    def get_registry_entry(self, domain: str, name: str, code: str) -> Optional[DomainRegistryEntry]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                """
                SELECT * FROM domain_registries
                WHERE registry_domain = ? AND registry_name = ? AND entry_code = ?
                """,
                (domain, name, code),
            ).fetchone()
            if not row:
                return None
            return DomainRegistryEntry(
                id=int(row["id"]),
                registry_domain=RegistryDomain(row["registry_domain"]),
                registry_name=row["registry_name"],
                entry_code=row["entry_code"],
                label_it=row["label_it"],
                label_en=row["label_en"],
                metadata=json.loads(row["metadata_json"] or "{}"),
                is_active=bool(row["is_active"]),
                sort_order=int(row["sort_order"]),
                created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    def list_registry_entries(
        self,
        domain: Optional[str] = None,
        name: Optional[str] = None,
        only_active: bool = False,
    ) -> List[DomainRegistryEntry]:
        conn = self.get_connection()
        try:
            clauses: List[str] = []
            params: List[Any] = []
            if domain:
                clauses.append("registry_domain = ?")
                params.append(domain)
            if name:
                clauses.append("registry_name = ?")
                params.append(name)
            if only_active:
                clauses.append("is_active = 1")

            where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
            sql = f"SELECT * FROM domain_registries {where} ORDER BY sort_order ASC, label_it ASC"
            rows = conn.execute(sql, tuple(params)).fetchall()

            entries: List[DomainRegistryEntry] = []
            for r in rows:
                entries.append(
                    DomainRegistryEntry(
                        id=int(r["id"]),
                        registry_domain=RegistryDomain(r["registry_domain"]),
                        registry_name=r["registry_name"],
                        entry_code=r["entry_code"],
                        label_it=r["label_it"],
                        label_en=r["label_en"],
                        metadata=json.loads(r["metadata_json"] or "{}"),
                        is_active=bool(r["is_active"]),
                        sort_order=int(r["sort_order"]),
                        created_at=self._parse_dt(r["created_at"]) or datetime.now(timezone.utc),
                    )
                )
            return entries
        finally:
            self._close_if_file(conn)

    def update_registry_entry(
        self,
        domain: str,
        name: str,
        code: str,
        label_it: Optional[str] = None,
        label_en: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        is_active: Optional[bool] = None,
        sort_order: Optional[int] = None,
    ) -> Optional[DomainRegistryEntry]:
        existing = self.get_registry_entry(domain, name, code)
        if not existing:
            return None
        conn = self.get_connection()
        try:
            new_label_it = label_it if label_it is not None else existing.label_it
            new_label_en = label_en if label_en is not None else existing.label_en
            new_metadata = metadata if metadata is not None else existing.metadata
            new_is_active = is_active if is_active is not None else existing.is_active
            new_sort_order = sort_order if sort_order is not None else existing.sort_order

            conn.execute(
                """
                UPDATE domain_registries
                SET label_it = ?, label_en = ?, metadata_json = ?, is_active = ?, sort_order = ?
                WHERE registry_domain = ? AND registry_name = ? AND entry_code = ?
                """,
                (
                    new_label_it,
                    new_label_en,
                    json.dumps(new_metadata),
                    1 if new_is_active else 0,
                    new_sort_order,
                    domain,
                    name,
                    code,
                ),
            )
            conn.commit()
            return self.get_registry_entry(domain, name, code)
        finally:
            self._close_if_file(conn)

    def delete_registry_entry(self, domain: str, name: str, code: str) -> bool:
        conn = self.get_connection()
        try:
            cur = conn.execute(
                "DELETE FROM domain_registries WHERE registry_domain = ? AND registry_name = ? AND entry_code = ?",
                (domain, name, code),
            )
            conn.commit()
            return cur.rowcount > 0
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Dynamic Schema Attribute Definitions (Founder Data Model Studio)
    # ========================================================================

    def save_attribute_definition(
        self, attr_in: SchemaAttributeDefinitionCreate, attribute_id: Optional[str] = None
    ) -> SchemaAttributeDefinition:
        conn = self.get_connection()
        try:
            entity_val = (
                attr_in.target_entity.value
                if isinstance(attr_in.target_entity, AttributeTargetEntity)
                else str(attr_in.target_entity)
            )
            type_val = (
                attr_in.field_type.value
                if isinstance(attr_in.field_type, AttributeFieldType)
                else str(attr_in.field_type)
            )
            aid = attribute_id or f"ATTR-{entity_val.upper()}-{attr_in.field_key.upper()}"
            created_iso = datetime.now(timezone.utc).isoformat()
            opt_json = json.dumps(attr_in.options)
            def_val = json.dumps(attr_in.default_value) if attr_in.default_value is not None else None

            conn.execute(
                """
                INSERT OR REPLACE INTO schema_attribute_definitions (
                    attribute_id, target_entity, field_key, label_it, label_en,
                    field_type, options_json, is_required, default_value, group_name,
                    is_system, description, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    aid,
                    entity_val,
                    attr_in.field_key,
                    attr_in.label_it,
                    attr_in.label_en,
                    type_val,
                    opt_json,
                    1 if attr_in.is_required else 0,
                    def_val,
                    attr_in.group_name,
                    1 if attr_in.is_system else 0,
                    attr_in.description,
                    created_iso,
                ),
            )
            conn.commit()
            return self.get_attribute_definition(entity_val, attr_in.field_key)  # type: ignore[return-value]
        finally:
            self._close_if_file(conn)

    def get_attribute_definition(self, target_entity: str, field_key: str) -> Optional[SchemaAttributeDefinition]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM schema_attribute_definitions WHERE target_entity = ? AND field_key = ?",
                (target_entity, field_key),
            ).fetchone()
            if not row:
                return None
            def_val_raw = row["default_value"]
            def_val = json.loads(def_val_raw) if def_val_raw is not None else None
            return SchemaAttributeDefinition(
                attribute_id=row["attribute_id"],
                target_entity=AttributeTargetEntity(row["target_entity"]),
                field_key=row["field_key"],
                label_it=row["label_it"],
                label_en=row["label_en"],
                field_type=AttributeFieldType(row["field_type"]),
                options=json.loads(row["options_json"] or "[]"),
                is_required=bool(row["is_required"]),
                default_value=def_val,
                group_name=row["group_name"],
                is_system=bool(row["is_system"]),
                description=row["description"],
                created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    def list_attribute_definitions(
        self, target_entity: Optional[str] = None
    ) -> List[SchemaAttributeDefinition]:
        conn = self.get_connection()
        try:
            if target_entity:
                rows = conn.execute(
                    "SELECT * FROM schema_attribute_definitions WHERE target_entity = ? ORDER BY group_name ASC, label_it ASC",
                    (target_entity,),
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM schema_attribute_definitions ORDER BY target_entity ASC, group_name ASC, label_it ASC"
                ).fetchall()

            attrs: List[SchemaAttributeDefinition] = []
            for r in rows:
                def_val_raw = r["default_value"]
                def_val = json.loads(def_val_raw) if def_val_raw is not None else None
                attrs.append(
                    SchemaAttributeDefinition(
                        attribute_id=r["attribute_id"],
                        target_entity=AttributeTargetEntity(r["target_entity"]),
                        field_key=r["field_key"],
                        label_it=r["label_it"],
                        label_en=r["label_en"],
                        field_type=AttributeFieldType(r["field_type"]),
                        options=json.loads(r["options_json"] or "[]"),
                        is_required=bool(r["is_required"]),
                        default_value=def_val,
                        group_name=r["group_name"],
                        is_system=bool(r["is_system"]),
                        description=r["description"],
                        created_at=self._parse_dt(r["created_at"]) or datetime.now(timezone.utc),
                    )
                )
            return attrs
        finally:
            self._close_if_file(conn)

    def delete_attribute_definition(self, target_entity: str, field_key: str) -> bool:
        conn = self.get_connection()
        try:
            cur = conn.execute(
                "DELETE FROM schema_attribute_definitions WHERE target_entity = ? AND field_key = ? AND is_system = 0",
                (target_entity, field_key),
            )
            conn.commit()
            return cur.rowcount > 0
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # 1 PIM Commercial Items & N PLM Production Variants
    # ========================================================================

    def save_pim_item(self, item: PimCommercialItem) -> PimCommercialItem:
        """Insert or update a full 1 PIM Commercial Item and its N PLM Variants, 3-level BOM, and Subcontractors."""
        conn = self.get_connection()
        try:
            created_iso = (
                item.created_at.isoformat() if isinstance(item.created_at, datetime) else str(item.created_at)
            )
            cat_val = item.category.value if isinstance(item.category, ProductCategory) else str(item.category)
            pim_meta = {
                "wholesale_price_eur": item.wholesale_price_eur,
                "retail_price_eur": item.retail_price_eur,
                "hs_customs_code": item.hs_customs_code,
                "gtin_ean": item.gtin_ean,
                "publishing_status": item.publishing_status,
                "care_instructions": item.care_instructions,
                "end_of_life_guide": item.end_of_life_guide,
                "collection_name": item.collection_name,
                "custom_attributes": item.custom_attributes,
            }
            conn.execute(
                """
                INSERT OR REPLACE INTO pim_commercial_items (
                    pim_item_id, sku_code, model_name, brand_tenant_id,
                    season, season_id, collection_id, category, commercial_description_it, commercial_description_en,
                    retail_channels_json, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item.pim_item_id,
                    item.sku_code,
                    item.model_name,
                    item.brand_tenant_id,
                    item.season,
                    item.season_id,
                    item.collection_id,
                    cat_val,
                    item.commercial_description_it,
                    item.commercial_description_en,
                    json.dumps(item.retail_channels),
                    json.dumps(pim_meta),
                    created_iso,
                ),
            )

            conn.execute("DELETE FROM plm_production_variants WHERE pim_item_id = ?", (item.pim_item_id,))

            for variant in item.plm_variants:
                self._insert_variant_in_tx(conn, item.pim_item_id, variant)

            conn.commit()
            return item
        finally:
            self._close_if_file(conn)

    def _insert_variant_in_tx(self, conn: sqlite3.Connection, pim_item_id: str, variant: PlmProductionVariant) -> None:
        v_created = (
            variant.created_at.isoformat() if isinstance(variant.created_at, datetime) else str(variant.created_at)
        )
        status_val = (
            variant.lifecycle_status.value
            if isinstance(variant.lifecycle_status, PlmLifecycleStatus)
            else str(variant.lifecycle_status)
        )
        var_meta = {
            "bom_version": variant.bom_version,
            "bom_snapshot_locked": variant.bom_snapshot_locked,
            "sample_base_size": variant.sample_base_size,
            "size_grading_step_pct": variant.size_grading_step_pct,
            "standard_labor_cost_eur": variant.standard_labor_cost_eur,
            "category_specific_specs": variant.category_specific_specs,
            "custom_attributes": variant.custom_attributes,
        }
        conn.execute(
            """
            INSERT INTO plm_production_variants (
                plm_variant_id, pim_item_id, collection_id, variant_code, colorway_name,
                size_range, last_or_pattern_code, lifecycle_status, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                variant.plm_variant_id,
                pim_item_id,
                variant.collection_id,
                variant.variant_code,
                variant.colorway_name,
                variant.size_range,
                variant.last_or_pattern_code,
                status_val,
                json.dumps(var_meta),
                v_created,
            ),
        )

        for bom in variant.bom_items:
            comp_val = (
                bom.component_type.value if isinstance(bom.component_type, BomComponentType) else str(bom.component_type)
            )
            bom_meta = {
                "unit_cost_eur": bom.unit_cost_eur,
                "lot_certificate_id": bom.lot_certificate_id,
                "custom_attributes": bom.custom_attributes,
            }
            conn.execute(
                """
                INSERT INTO bom_items (
                    bom_item_id, plm_variant_id, level, parent_bom_item_id,
                    component_type, material_name, supplier_name, origin_country_iso2,
                    unit_of_measure, unit_consumption, waste_percentage, recycled_content_pct,
                    certifications_json, metadata_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    bom.bom_item_id,
                    variant.plm_variant_id,
                    bom.level,
                    bom.parent_bom_item_id,
                    comp_val,
                    bom.material_name,
                    bom.supplier_name,
                    bom.origin_country_iso2,
                    bom.unit_of_measure,
                    bom.unit_consumption,
                    bom.waste_percentage,
                    bom.recycled_content_pct,
                    json.dumps(bom.certifications),
                    json.dumps(bom_meta),
                ),
            )

        for sub in variant.subcontractor_assignments:
            phase_val = sub.phase.value if isinstance(sub.phase, ProductionPhase) else str(sub.phase)
            sub_confirmed = (
                sub.confirmed_at.isoformat() if isinstance(sub.confirmed_at, datetime) else str(sub.confirmed_at)
            )
            conn.execute(
                """
                INSERT INTO subcontractor_assignments (
                    assignment_id, plm_variant_id, subcontractor_name,
                    district, phase, material_lot_code, completed, confirmed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    sub.assignment_id,
                    variant.plm_variant_id,
                    sub.subcontractor_name,
                    sub.district,
                    phase_val,
                    sub.material_lot_code,
                    1 if sub.completed else 0,
                    sub_confirmed,
                ),
            )

    def get_pim_item(self, pim_item_id: str) -> Optional[PimCommercialItem]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM pim_commercial_items WHERE pim_item_id = ?",
                (pim_item_id,),
            ).fetchone()
            if not row:
                return None
            return self._row_to_pim_item(conn, row)
        finally:
            self._close_if_file(conn)

    def list_pim_items(
        self,
        season_id: Optional[str] = None,
        collection_id: Optional[str] = None,
    ) -> List[PimCommercialItem]:
        conn = self.get_connection()
        try:
            clauses: List[str] = []
            params: List[Any] = []
            if season_id:
                clauses.append("season_id = ?")
                params.append(season_id)
            if collection_id:
                clauses.append("collection_id = ?")
                params.append(collection_id)

            where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
            sql = f"SELECT * FROM pim_commercial_items {where} ORDER BY created_at DESC"
            rows = conn.execute(sql, tuple(params)).fetchall()
            return [self._row_to_pim_item(conn, r) for r in rows]
        finally:
            self._close_if_file(conn)

    def _row_to_pim_item(self, conn: sqlite3.Connection, row: sqlite3.Row) -> PimCommercialItem:
        pim_id = row["pim_item_id"]
        variant_rows = conn.execute(
            "SELECT * FROM plm_production_variants WHERE pim_item_id = ? ORDER BY created_at ASC",
            (pim_id,),
        ).fetchall()

        variants: List[PlmProductionVariant] = []
        for vr in variant_rows:
            var_id = vr["plm_variant_id"]
            var_meta = json.loads(vr["metadata_json"] or "{}")

            bom_rows = conn.execute(
                "SELECT * FROM bom_items WHERE plm_variant_id = ? ORDER BY level ASC, id ASC",
                (var_id,),
            ).fetchall()
            bom_items: List[BomItem] = []
            for br in bom_rows:
                b_meta = json.loads(br["metadata_json"] or "{}")
                bom_items.append(
                    BomItem(
                        bom_item_id=br["bom_item_id"],
                        level=int(br["level"]),
                        parent_bom_item_id=br["parent_bom_item_id"],
                        component_type=BomComponentType(br["component_type"]),
                        material_name=br["material_name"],
                        supplier_name=br["supplier_name"],
                        origin_country_iso2=br["origin_country_iso2"],
                        unit_of_measure=br["unit_of_measure"],
                        unit_consumption=float(br["unit_consumption"]),
                        waste_percentage=float(br["waste_percentage"]),
                        recycled_content_pct=float(br["recycled_content_pct"]),
                        certifications=json.loads(br["certifications_json"] or "[]"),
                        unit_cost_eur=float(b_meta.get("unit_cost_eur", 11.50)),
                        lot_certificate_id=str(b_meta.get("lot_certificate_id", "CERT-ESPR-2026-IT")),
                        custom_attributes=b_meta.get("custom_attributes", {}),
                    )
                )

            sub_rows = conn.execute(
                "SELECT * FROM subcontractor_assignments WHERE plm_variant_id = ? ORDER BY id ASC",
                (var_id,),
            ).fetchall()
            sub_items: List[SubcontractorAssignment] = []
            for sr in sub_rows:
                sub_items.append(
                    SubcontractorAssignment(
                        assignment_id=sr["assignment_id"],
                        subcontractor_name=sr["subcontractor_name"],
                        district=sr["district"],
                        phase=ProductionPhase(sr["phase"]),
                        material_lot_code=sr["material_lot_code"],
                        completed=bool(sr["completed"]),
                        confirmed_at=self._parse_dt(sr["confirmed_at"]),
                    )
                )

            # Collection ID on variant
            col_id = vr["collection_id"] if "collection_id" in vr.keys() else None

            variants.append(
                PlmProductionVariant(
                    plm_variant_id=var_id,
                    pim_item_id=pim_id,
                    collection_id=col_id,
                    variant_code=vr["variant_code"],
                    colorway_name=vr["colorway_name"],
                    size_range=vr["size_range"],
                    last_or_pattern_code=vr["last_or_pattern_code"],
                    lifecycle_status=PlmLifecycleStatus(vr["lifecycle_status"]),
                    bom_version=str(var_meta.get("bom_version", "v1.0")),
                    bom_snapshot_locked=bool(var_meta.get("bom_snapshot_locked", False)),
                    sample_base_size=str(var_meta.get("sample_base_size", "42")),
                    size_grading_step_pct=float(var_meta.get("size_grading_step_pct", 2.8)),
                    standard_labor_cost_eur=float(var_meta.get("standard_labor_cost_eur", 28.0)),
                    category_specific_specs=var_meta.get("category_specific_specs", {}),
                    custom_attributes=var_meta.get("custom_attributes", {}),
                    bom_items=bom_items,
                    subcontractor_assignments=sub_items,
                    created_at=self._parse_dt(vr["created_at"]) or datetime.now(timezone.utc),
                )
            )

        pim_meta = json.loads(row["metadata_json"] or "{}")
        season_id_val = row["season_id"] if "season_id" in row.keys() else None
        collection_id_val = row["collection_id"] if "collection_id" in row.keys() else None
        col_name = pim_meta.get("collection_name")

        return PimCommercialItem(
            pim_item_id=pim_id,
            sku_code=row["sku_code"],
            model_name=row["model_name"],
            brand_tenant_id=row["brand_tenant_id"],
            season=row["season"],
            season_id=season_id_val,
            collection_id=collection_id_val,
            collection_name=col_name,
            category=ProductCategory(row["category"]),
            commercial_description_it=row["commercial_description_it"],
            commercial_description_en=row["commercial_description_en"],
            retail_channels=json.loads(row["retail_channels_json"] or "[]"),
            wholesale_price_eur=float(pim_meta.get("wholesale_price_eur", 155.0)),
            retail_price_eur=float(pim_meta.get("retail_price_eur", 420.0)),
            hs_customs_code=str(pim_meta.get("hs_customs_code", "6403.59.95")),
            gtin_ean=str(pim_meta.get("gtin_ean", "8050012026018")),
            publishing_status=str(pim_meta.get("publishing_status", "PUBLISHED")),
            care_instructions=str(
                pim_meta.get(
                    "care_instructions",
                    "Pulire con panno morbido, nutrire con cera naturale certificata e conservare su forma in cedro. Risuolabile.",
                )
            ),
            end_of_life_guide=str(
                pim_meta.get(
                    "end_of_life_guide",
                    "Programma Circolare Take-Back Footlink: restituzione gratuita a fine vita per disassemblaggio e riciclo filiera UE.",
                )
            ),
            custom_attributes=pim_meta.get("custom_attributes", {}),
            plm_variants=variants,
            created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
        )

    @staticmethod
    def _parse_dt(val: Optional[str]) -> Optional[datetime]:
        if not val:
            return None
        try:
            normalized = val.replace("Z", "+00:00")
            return datetime.fromisoformat(normalized)
        except Exception:
            return datetime.now(timezone.utc)


class PersistentPimStoreProxy:
    """Dictionary-compatible proxy backed by SQLite (`footlink.db`) so existing `PIM_STORE` operations
    and SQL persistence work together seamlessly.
    """

    def __init__(self, db_manager: FootlinkSQLitePersistence) -> None:
        self.db = db_manager

    def clear(self) -> None:
        self.db.clear_all()

    def get(self, pim_item_id: str, default: Any = None) -> Optional[PimCommercialItem]:
        item = self.db.get_pim_item(pim_item_id)
        return item if item is not None else default

    def __getitem__(self, pim_item_id: str) -> PimCommercialItem:
        item = self.db.get_pim_item(pim_item_id)
        if item is None:
            raise KeyError(pim_item_id)
        return item

    def __setitem__(self, pim_item_id: str, item: PimCommercialItem) -> None:
        self.db.save_pim_item(item)

    def __contains__(self, pim_item_id: str) -> bool:
        return self.db.get_pim_item(pim_item_id) is not None

    def __len__(self) -> int:
        return self.db.count_pim_items()

    def values(self) -> List[PimCommercialItem]:
        return self.db.list_pim_items()

    def items(self) -> List[Any]:
        return [(i.pim_item_id, i) for i in self.db.list_pim_items()]

    def save(self, item: PimCommercialItem) -> PimCommercialItem:
        return self.db.save_pim_item(item)


db_manager = FootlinkSQLitePersistence(DATABASE_URL)


def get_db() -> Iterator[FootlinkSQLitePersistence]:
    """Dependency injection generator for FastAPI routes."""
    yield db_manager
