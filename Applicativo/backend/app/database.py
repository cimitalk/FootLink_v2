"""Database Persistence Layer for Footlink:
- SQLite Local 0 EUR & PostgreSQL Free-Tier compatible per ADR-002, ADR-006 & ADR-007.
- Full CRUD for 1 PIM Commercial Item <-> N PLM Production Variants
- 3-Level Hierarchical BOM and 0 EUR Subcontractor Assignments
- Sprint 5: Seasons & Collections (1:N), Master Domain Registries & Dynamic Schema Attributes.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import re
import sqlite3
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Tuple
from uuid import uuid4

from app.models import (
    AttributeFieldType,
    AttributeTargetEntity,
    BomComponentType,
    BomItem,
    BomRequirementsCalculationRequest,
    BomRequirementsCalculationResult,
    BomSizeRequirementItem,
    BomTemplate,
    BomTemplateCreate,
    BomTemplateItem,
    BulkImportCommitRequest,
    BulkImportCommitResponse,
    BulkImportValidationResponse,
    BulkImportValidationRow,
    CarryoverStatus,
    Collection,
    CollectionCreate,
    CollectionStatus,
    ColorwayBomMappingRow,
    ColorwayBomMappingUpsertItem,
    ColorwayMatrixResponse,
    ColorwayMatrixUpsertRequest,
    Company,
    CompanyBusinessType,
    CompanyCreate,
    CompanyMembership,
    CompanyMembershipCreate,
    CompanyTier,
    CompanyUpdate,
    ConstructionType,
    DistrictUserRole,
    DomainRegistryEntry,
    DomainRegistryEntryCreate,
    ExplodeColorwaysRequest,
    ExplodeColorwaysResponse,
    MasterColor,
    MasterColorCreate,
    MasterColorUpdate,
    OrderSizeBreakdownItem,
    PimColorwaysEcommerceResponse,
    PimCommercialItem,
    PimVariantColorEcommerceItem,
    PlmLifecycleStatus,
    PlmProductionVariant,
    PriceTier,
    ProductCategory,
    ProductCategoryCreate,
    ProductCategoryHierarchyNode,
    ProductCategoryUpdate,
    ProductModel,
    ProductModelCreate,
    ProductModelUpdate,
    ProductModelWithProducts,
    ProductionOrder,
    ProductionOrderCreate,
    ProductionOrderPhaseItem,
    ProductionOrderStatus,
    ProductionOrderUpdate,
    ProductionPhase,
    RegistryDomain,
    SchemaAttributeDefinition,
    SchemaAttributeDefinitionCreate,
    Season,
    SeasonCreate,
    SeasonStatus,
    SubcontractorAssignment,
    SubcontractorPhaseConfirmRequest,
    TanneryBatch,
    TanneryBatchCreate,
    TanneryBatchUpdate,
    TanneryColorConsistencyItem,
    TanneryDocument,
    TanneryDocumentCreate,
    TanneryDocumentType,
    TanneryDocumentVerifyResponse,
    TanneryProcess,
    TargetOccasion,
    User,
    UserCreate,
    VariantDeepCloneRequest,
    VendorCertification,
    VendorCertificationCreate,
    VendorCreate,
    VendorFinancialExposureL6,
    VendorImpactedBomNode,
    VendorImpactedPimModel,
    VendorImpactedPlmVariant,
    VendorImpactedTanneryBatch,
    VendorImpactSummary,
    VendorRecord,
    VendorUpdate,
    VendorWhereUsedResponse,
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
                "ALTER TABLE pim_commercial_items ADD COLUMN category_id VARCHAR(64) NULL",
                "ALTER TABLE pim_commercial_items ADD COLUMN sub_category_id VARCHAR(64) NULL",
                "ALTER TABLE pim_commercial_items ADD COLUMN carryover_status VARCHAR(32) NOT NULL DEFAULT 'seasonal_core'",
                "ALTER TABLE pim_commercial_items ADD COLUMN brand_line VARCHAR(64) NOT NULL DEFAULT 'Main Line'",
                "ALTER TABLE pim_commercial_items ADD COLUMN target_occasion VARCHAR(64) NOT NULL DEFAULT 'smart_casual'",
                "ALTER TABLE pim_commercial_items ADD COLUMN price_tier VARCHAR(64) NOT NULL DEFAULT 'core_luxury'",
                "ALTER TABLE plm_production_variants ADD COLUMN collection_id VARCHAR(64) NULL",
                "ALTER TABLE plm_production_variants ADD COLUMN category_id VARCHAR(64) NULL",
                "ALTER TABLE plm_production_variants ADD COLUMN sub_category_id VARCHAR(64) NULL",
                "ALTER TABLE plm_production_variants ADD COLUMN construction_type VARCHAR(64) NOT NULL DEFAULT 'cassetta_cucita'",
                "ALTER TABLE plm_production_variants ADD COLUMN carryover_status VARCHAR(32) NOT NULL DEFAULT 'seasonal_core'",
                "ALTER TABLE plm_production_variants ADD COLUMN primary_color_id VARCHAR(64) NULL",
                "ALTER TABLE plm_production_variants ADD COLUMN secondary_color_id VARCHAR(64) NULL",
                "ALTER TABLE plm_production_variants ADD COLUMN hardware_finish_color_id VARCHAR(64) NULL",
                "ALTER TABLE plm_production_variants ADD COLUMN colorway_rule_preset VARCHAR(64) NOT NULL DEFAULT 'tone_on_tone'",
                "ALTER TABLE bom_items ADD COLUMN vendor_id VARCHAR(64) NULL",
                "ALTER TABLE bom_items ADD COLUMN master_color_id VARCHAR(64) NULL",
                "ALTER TABLE tannery_batches ADD COLUMN vendor_id VARCHAR(64) NULL",
                "ALTER TABLE tannery_batches ADD COLUMN master_color_id VARCHAR(64) NULL",
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

    def _resolve_vendor_link(
        self,
        conn: sqlite3.Connection,
        vendor_id: Optional[str],
        name_str: Optional[str],
    ) -> Tuple[Optional[str], str]:
        """Bidirectional auto-link between supplier_name/tannery_name and vendors_registry."""
        clean_vid = (vendor_id or "").strip() or None
        clean_name = (name_str or "").strip()
        try:
            if clean_vid:
                row = conn.execute(
                    "SELECT vendor_id, company_name FROM vendors_registry WHERE vendor_id = ? OR vendor_code = ?",
                    (clean_vid, clean_vid),
                ).fetchone()
                if row:
                    clean_vid = row["vendor_id"]
                    if not clean_name:
                        clean_name = row["company_name"]
            elif clean_name:
                row = conn.execute(
                    "SELECT vendor_id, company_name FROM vendors_registry WHERE LOWER(company_name) = LOWER(?)",
                    (clean_name,),
                ).fetchone()
                if row:
                    clean_vid = row["vendor_id"]
        except sqlite3.OperationalError:
            pass
        if not clean_name:
            clean_name = "Fornitore Distrettuale"
        return clean_vid, clean_name

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
            try:
                conn.execute("DELETE FROM variant_colorway_bom_mappings")
            except sqlite3.OperationalError:
                pass
            conn.execute("DELETE FROM production_order_phases")
            conn.execute("DELETE FROM order_size_breakdown")
            conn.execute("DELETE FROM production_orders")
            conn.execute("DELETE FROM tannery_documents")
            conn.execute("DELETE FROM tannery_batches")
            conn.execute("DELETE FROM subcontractor_assignments")
            conn.execute("DELETE FROM bom_items")
            conn.execute("DELETE FROM plm_production_variants")
            conn.execute("DELETE FROM pim_commercial_items")
            if clear_master_data:
                for tbl in ("vendor_certifications", "vendors_registry", "master_colors"):
                    try:
                        conn.execute(f"DELETE FROM {tbl}")
                    except sqlite3.OperationalError:
                        pass
                conn.execute("DELETE FROM company_memberships")
                conn.execute("DELETE FROM users")
                conn.execute("DELETE FROM companies")
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

            code_val = entry_in.entry_code or entry_in.code or "ENTRY_NEW"
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
                    code_val,
                    entry_in.label_it,
                    entry_in.label_en,
                    meta_json,
                    1 if entry_in.is_active else 0,
                    entry_in.sort_order,
                    created_iso,
                ),
            )
            conn.commit()
            return self.get_registry_entry(dom_val, entry_in.registry_name, code_val)  # type: ignore[return-value]
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
                "target_gender": getattr(item, "target_gender", "unisex"),
                "category_id": getattr(item, "category_id", None),
                "sub_category_id": getattr(item, "sub_category_id", None),
                "carryover_status": getattr(item, "carryover_status", "seasonal_core"),
                "brand_line": getattr(item, "brand_line", "Main Line"),
                "target_occasion": getattr(item, "target_occasion", "smart_casual"),
                "price_tier": getattr(item, "price_tier", "core_luxury"),
                "custom_attributes": item.custom_attributes,
            }
            m_id = getattr(item, "model_id", None)
            conn.execute(
                """
                INSERT INTO pim_commercial_items (
                    pim_item_id, model_id, sku_code, model_name, brand_tenant_id,
                    season, season_id, collection_id, category, commercial_description_it, commercial_description_en,
                    retail_channels_json, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(pim_item_id) DO UPDATE SET
                    model_id = COALESCE(excluded.model_id, pim_commercial_items.model_id),
                    sku_code = excluded.sku_code,
                    model_name = excluded.model_name,
                    brand_tenant_id = excluded.brand_tenant_id,
                    season = excluded.season,
                    season_id = excluded.season_id,
                    collection_id = excluded.collection_id,
                    category = excluded.category,
                    commercial_description_it = excluded.commercial_description_it,
                    commercial_description_en = excluded.commercial_description_en,
                    retail_channels_json = excluded.retail_channels_json,
                    metadata_json = excluded.metadata_json
                """,
                (
                    item.pim_item_id,
                    m_id,
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

            current_variant_ids = [v.plm_variant_id for v in item.plm_variants]
            if current_variant_ids:
                placeholders = ",".join("?" for _ in current_variant_ids)
                conn.execute(
                    f"DELETE FROM plm_production_variants WHERE pim_item_id = ? AND plm_variant_id NOT IN ({placeholders})",
                    [item.pim_item_id] + current_variant_ids,
                )
            else:
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
            "target_gender": getattr(variant, "target_gender", "unisex"),
            "category_id": getattr(variant, "category_id", None),
            "sub_category_id": getattr(variant, "sub_category_id", None),
            "construction_type": getattr(variant, "construction_type", "cassetta_cucita"),
            "carryover_status": getattr(variant, "carryover_status", "seasonal_core"),
            "category_specific_specs": variant.category_specific_specs,
            "custom_attributes": variant.custom_attributes,
        }
        primary_col = getattr(variant, "primary_color_id", None)
        secondary_col = getattr(variant, "secondary_color_id", None)
        hw_col = getattr(variant, "hardware_finish_color_id", None)
        rule_preset = getattr(variant, "colorway_rule_preset", None) or "tone_on_tone"

        conn.execute(
            """
            INSERT INTO plm_production_variants (
                plm_variant_id, pim_item_id, collection_id, variant_code, colorway_name,
                size_range, last_or_pattern_code, lifecycle_status,
                primary_color_id, secondary_color_id, hardware_finish_color_id, colorway_rule_preset,
                metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(plm_variant_id) DO UPDATE SET
                pim_item_id = excluded.pim_item_id,
                collection_id = excluded.collection_id,
                variant_code = excluded.variant_code,
                colorway_name = excluded.colorway_name,
                size_range = excluded.size_range,
                last_or_pattern_code = excluded.last_or_pattern_code,
                lifecycle_status = excluded.lifecycle_status,
                primary_color_id = COALESCE(excluded.primary_color_id, plm_production_variants.primary_color_id),
                secondary_color_id = COALESCE(excluded.secondary_color_id, plm_production_variants.secondary_color_id),
                hardware_finish_color_id = COALESCE(excluded.hardware_finish_color_id, plm_production_variants.hardware_finish_color_id),
                colorway_rule_preset = COALESCE(excluded.colorway_rule_preset, plm_production_variants.colorway_rule_preset),
                metadata_json = excluded.metadata_json
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
                primary_col,
                secondary_col,
                hw_col,
                rule_preset,
                json.dumps(var_meta),
                v_created,
            ),
        )

        # Preserve existing colorway mappings on bom_items if bom.master_color_id was not explicitly set
        existing_bom_colors: Dict[str, str] = {}
        try:
            for mr in conn.execute(
                "SELECT bom_item_id, master_color_id FROM variant_colorway_bom_mappings WHERE plm_variant_id = ?",
                (variant.plm_variant_id,),
            ).fetchall():
                if mr["master_color_id"]:
                    existing_bom_colors[mr["bom_item_id"]] = mr["master_color_id"]
        except sqlite3.OperationalError:
            pass

        conn.execute("DELETE FROM bom_items WHERE plm_variant_id = ?", (variant.plm_variant_id,))
        conn.execute("DELETE FROM subcontractor_assignments WHERE plm_variant_id = ?", (variant.plm_variant_id,))

        for bom in variant.bom_items:
            comp_val = (
                bom.component_type.value if isinstance(bom.component_type, BomComponentType) else str(bom.component_type)
            )
            resolved_vid, resolved_sname = self._resolve_vendor_link(
                conn, getattr(bom, "vendor_id", None), bom.supplier_name
            )
            bom.vendor_id = resolved_vid
            bom.supplier_name = resolved_sname
            resolved_mcol = getattr(bom, "master_color_id", None) or existing_bom_colors.get(bom.bom_item_id)
            bom.master_color_id = resolved_mcol
            bom_meta = {
                "unit_cost_eur": bom.unit_cost_eur,
                "lot_certificate_id": bom.lot_certificate_id,
                "custom_attributes": bom.custom_attributes,
            }
            conn.execute(
                """
                INSERT INTO bom_items (
                    bom_item_id, plm_variant_id, level, parent_bom_item_id,
                    component_type, material_name, supplier_name, vendor_id, master_color_id,
                    origin_country_iso2, unit_of_measure, unit_consumption, waste_percentage,
                    recycled_content_pct, certifications_json, metadata_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    bom.bom_item_id,
                    variant.plm_variant_id,
                    bom.level,
                    bom.parent_bom_item_id,
                    comp_val,
                    bom.material_name,
                    resolved_sname,
                    resolved_vid,
                    resolved_mcol,
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
                b_keys = br.keys()
                bom_items.append(
                    BomItem(
                        bom_item_id=br["bom_item_id"],
                        level=int(br["level"]),
                        parent_bom_item_id=br["parent_bom_item_id"],
                        component_type=BomComponentType(br["component_type"]),
                        material_name=br["material_name"],
                        supplier_name=br["supplier_name"],
                        vendor_id=br["vendor_id"] if "vendor_id" in b_keys else None,
                        master_color_id=br["master_color_id"] if "master_color_id" in b_keys else None,
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

            # Collection ID & Sprint 8 Colorway columns on variant
            v_keys = vr.keys()
            col_id = vr["collection_id"] if "collection_id" in v_keys else None
            p_col = vr["primary_color_id"] if "primary_color_id" in v_keys else None
            s_col = vr["secondary_color_id"] if "secondary_color_id" in v_keys else None
            hw_col = vr["hardware_finish_color_id"] if "hardware_finish_color_id" in v_keys else None
            r_preset = (vr["colorway_rule_preset"] if "colorway_rule_preset" in v_keys else None) or "tone_on_tone"

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
                    target_gender=var_meta.get("target_gender", "unisex"),
                    category_id=var_meta.get("category_id"),
                    sub_category_id=var_meta.get("sub_category_id"),
                    construction_type=var_meta.get("construction_type", "cassetta_cucita"),
                    carryover_status=var_meta.get("carryover_status", "seasonal_core"),
                    primary_color_id=p_col,
                    secondary_color_id=s_col,
                    hardware_finish_color_id=hw_col,
                    colorway_rule_preset=r_preset,
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
        model_id_val = row["model_id"] if "model_id" in row.keys() else None
        col_name = pim_meta.get("collection_name")

        return PimCommercialItem(
            pim_item_id=pim_id,
            model_id=model_id_val,
            sku_code=row["sku_code"],
            model_name=row["model_name"],
            brand_tenant_id=row["brand_tenant_id"],
            season=row["season"],
            season_id=season_id_val,
            collection_id=collection_id_val,
            collection_name=col_name,
            category=ProductCategory(row["category"]),
            category_id=pim_meta.get("category_id"),
            sub_category_id=pim_meta.get("sub_category_id"),
            target_gender=pim_meta.get("target_gender", "unisex"),
            carryover_status=pim_meta.get("carryover_status", "seasonal_core"),
            brand_line=pim_meta.get("brand_line", "Main Line"),
            target_occasion=pim_meta.get("target_occasion", "smart_casual"),
            price_tier=pim_meta.get("price_tier", "core_luxury"),
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

    # ========================================================================
    # Sprint 6: District PaaS (Companies & Users) - ADR-008
    # ========================================================================

    def list_companies(self, tier: Optional[str] = None, only_active: bool = False) -> List[Company]:
        conn = self.get_connection()
        try:
            query = "SELECT * FROM companies WHERE 1=1"
            params: List[Any] = []
            if tier:
                query += " AND company_tier = ?"
                params.append(tier)
            if only_active:
                query += " AND is_active = 1"
            query += " ORDER BY legal_name ASC"
            rows = conn.execute(query, params).fetchall()
            return [
                Company(
                    company_id=row["company_id"],
                    legal_name=row["legal_name"],
                    business_name=row["business_name"],
                    vat_number=row["vat_number"],
                    district=row["district"],
                    company_tier=CompanyTier(row["company_tier"]),
                    business_type=CompanyBusinessType(row["business_type"]),
                    contact_email=row["contact_email"],
                    phone=row["phone"] or "",
                    website=row["website"] or "",
                    metadata=json.loads(row["metadata_json"] or "{}"),
                    is_active=bool(row["is_active"]),
                    created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
                )
                for row in rows
            ]
        finally:
            self._close_if_file(conn)

    def get_company(self, company_id: str) -> Optional[Company]:
        conn = self.get_connection()
        try:
            row = conn.execute("SELECT * FROM companies WHERE company_id = ?", (company_id,)).fetchone()
            if not row:
                return None
            return Company(
                company_id=row["company_id"],
                legal_name=row["legal_name"],
                business_name=row["business_name"],
                vat_number=row["vat_number"],
                district=row["district"],
                company_tier=CompanyTier(row["company_tier"]),
                business_type=CompanyBusinessType(row["business_type"]),
                contact_email=row["contact_email"],
                phone=row["phone"] or "",
                website=row["website"] or "",
                metadata=json.loads(row["metadata_json"] or "{}"),
                is_active=bool(row["is_active"]),
                created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    def save_company(self, company_in: CompanyCreate, company_id: Optional[str] = None) -> Company:
        conn = self.get_connection()
        cid = company_id or f"comp-{uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            conn.execute(
                """
                INSERT INTO companies (
                    company_id, legal_name, business_name, vat_number, district,
                    company_tier, business_type, contact_email, phone, website,
                    metadata_json, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(company_id) DO UPDATE SET
                    legal_name=excluded.legal_name,
                    business_name=excluded.business_name,
                    vat_number=excluded.vat_number,
                    district=excluded.district,
                    company_tier=excluded.company_tier,
                    business_type=excluded.business_type,
                    contact_email=excluded.contact_email,
                    phone=excluded.phone,
                    website=excluded.website,
                    metadata_json=excluded.metadata_json,
                    is_active=excluded.is_active
                """,
                (
                    cid,
                    company_in.legal_name,
                    company_in.business_name,
                    company_in.vat_number,
                    company_in.district,
                    company_in.company_tier.value if hasattr(company_in.company_tier, "value") else str(company_in.company_tier),
                    company_in.business_type.value if hasattr(company_in.business_type, "value") else str(company_in.business_type),
                    company_in.contact_email,
                    company_in.phone or "",
                    company_in.website or "",
                    json.dumps(company_in.metadata or {}),
                    1 if company_in.is_active else 0,
                    now_iso,
                ),
            )
            conn.commit()
            return self.get_company(cid)  # type: ignore
        finally:
            self._close_if_file(conn)

    def list_users(self) -> List[User]:
        conn = self.get_connection()
        try:
            rows = conn.execute("SELECT * FROM users ORDER BY full_name ASC").fetchall()
            return [
                User(
                    user_id=row["user_id"],
                    email=row["email"],
                    full_name=row["full_name"],
                    is_platform_admin=bool(row["is_platform_admin"]),
                    is_active=bool(row["is_active"]),
                    created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
                )
                for row in rows
            ]
        finally:
            self._close_if_file(conn)

    def get_user(self, user_id: str) -> Optional[User]:
        conn = self.get_connection()
        try:
            row = conn.execute("SELECT * FROM users WHERE user_id = ? OR email = ?", (user_id, user_id)).fetchone()
            if not row:
                return None
            return User(
                user_id=row["user_id"],
                email=row["email"],
                full_name=row["full_name"],
                is_platform_admin=bool(row["is_platform_admin"]),
                is_active=bool(row["is_active"]),
                created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    def save_user(self, user_in: UserCreate, user_id: Optional[str] = None) -> User:
        conn = self.get_connection()
        uid = user_id or f"usr-{uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            conn.execute(
                """
                INSERT INTO users (user_id, email, full_name, password_hash, is_platform_admin, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    email=excluded.email,
                    full_name=excluded.full_name,
                    is_platform_admin=excluded.is_platform_admin,
                    is_active=excluded.is_active
                """,
                (
                    uid,
                    user_in.email,
                    user_in.full_name,
                    "hashed_footlink",
                    1 if user_in.is_platform_admin else 0,
                    1 if user_in.is_active else 0,
                    now_iso,
                ),
            )
            conn.commit()
            return self.get_user(uid)  # type: ignore
        finally:
            self._close_if_file(conn)

    def list_memberships(self, company_id: Optional[str] = None, user_id: Optional[str] = None) -> List[CompanyMembership]:
        conn = self.get_connection()
        try:
            query = """
                SELECT m.*, u.email as user_email, u.full_name as user_full_name, c.business_name as company_business_name
                FROM company_memberships m
                JOIN users u ON m.user_id = u.user_id
                JOIN companies c ON m.company_id = c.company_id
                WHERE 1=1
            """
            params: List[Any] = []
            if company_id:
                query += " AND m.company_id = ?"
                params.append(company_id)
            if user_id:
                query += " AND m.user_id = ?"
                params.append(user_id)
            rows = conn.execute(query, params).fetchall()
            return [
                CompanyMembership(
                    membership_id=row["membership_id"],
                    company_id=row["company_id"],
                    user_id=row["user_id"],
                    role=DistrictUserRole(row["role"]),
                    status=row["status"],
                    user_email=row["user_email"],
                    user_full_name=row["user_full_name"],
                    company_business_name=row["company_business_name"],
                    created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
                )
                for row in rows
            ]
        finally:
            self._close_if_file(conn)

    def save_membership(self, m_in: CompanyMembershipCreate) -> CompanyMembership:
        conn = self.get_connection()
        mid = f"mem-{uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            conn.execute(
                """
                INSERT INTO company_memberships (membership_id, company_id, user_id, role, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(company_id, user_id) DO UPDATE SET
                    role=excluded.role,
                    status=excluded.status
                """,
                (
                    mid,
                    m_in.company_id,
                    m_in.user_id,
                    m_in.role.value if hasattr(m_in.role, "value") else str(m_in.role),
                    m_in.status,
                    now_iso,
                ),
            )
            conn.commit()
            mems = self.list_memberships(company_id=m_in.company_id, user_id=m_in.user_id)
            return mems[0]
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Sprint 6: Tannery Batches & Document Vault (FTL-CEO-006)
    # ========================================================================

    def list_tannery_batches(self, company_id: Optional[str] = None, only_active: bool = False) -> List[TanneryBatch]:
        conn = self.get_connection()
        try:
            query = "SELECT * FROM tannery_batches WHERE 1=1"
            params: List[Any] = []
            if company_id:
                query += " AND company_id = ?"
                params.append(company_id)
            if only_active:
                query += " AND is_active = 1"
            query += " ORDER BY created_at DESC"
            rows = conn.execute(query, params).fetchall()
            batches: List[TanneryBatch] = []
            for row in rows:
                docs = self.list_tannery_documents(row["batch_id"])
                r_keys = row.keys()
                batches.append(
                    TanneryBatch(
                        batch_id=row["batch_id"],
                        company_id=row["company_id"],
                        batch_code=row["batch_code"],
                        tannery_name=row["tannery_name"],
                        vendor_id=row["vendor_id"] if "vendor_id" in r_keys else None,
                        master_color_id=row["master_color_id"] if "master_color_id" in r_keys else None,
                        district=row["district"],
                        leather_type=row["leather_type"],
                        tanning_process=TanneryProcess(row["tanning_process"]),
                        raw_hide_origin_country=row["raw_hide_origin_country"],
                        slaughterhouse_traceability_id=row["slaughterhouse_traceability_id"] or "",
                        eudr_deforestation_free=bool(row["eudr_deforestation_free"]),
                        lwg_rating=row["lwg_rating"],
                        lwg_score_pct=float(row["lwg_score_pct"]),
                        icec_certificate_id=row["icec_certificate_id"] or "",
                        reach_svhc_compliant=bool(row["reach_svhc_compliant"]),
                        chrome_vi_content_ppm=float(row["chrome_vi_content_ppm"]),
                        thickness_mm=row["thickness_mm"],
                        available_qty_sqft=float(row["available_qty_sqft"]),
                        metadata=json.loads(row["metadata_json"] or "{}"),
                        is_active=bool(row["is_active"]),
                        documents=docs,
                        created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
                    )
                )
            return batches
        finally:
            self._close_if_file(conn)

    def get_tannery_batch(self, batch_id: str) -> Optional[TanneryBatch]:
        conn = self.get_connection()
        try:
            row = conn.execute("SELECT * FROM tannery_batches WHERE batch_id = ? OR batch_code = ?", (batch_id, batch_id)).fetchone()
            if not row:
                return None
            docs = self.list_tannery_documents(row["batch_id"])
            r_keys = row.keys()
            return TanneryBatch(
                batch_id=row["batch_id"],
                company_id=row["company_id"],
                batch_code=row["batch_code"],
                tannery_name=row["tannery_name"],
                vendor_id=row["vendor_id"] if "vendor_id" in r_keys else None,
                master_color_id=row["master_color_id"] if "master_color_id" in r_keys else None,
                district=row["district"],
                leather_type=row["leather_type"],
                tanning_process=TanneryProcess(row["tanning_process"]),
                raw_hide_origin_country=row["raw_hide_origin_country"],
                slaughterhouse_traceability_id=row["slaughterhouse_traceability_id"] or "",
                eudr_deforestation_free=bool(row["eudr_deforestation_free"]),
                lwg_rating=row["lwg_rating"],
                lwg_score_pct=float(row["lwg_score_pct"]),
                icec_certificate_id=row["icec_certificate_id"] or "",
                reach_svhc_compliant=bool(row["reach_svhc_compliant"]),
                chrome_vi_content_ppm=float(row["chrome_vi_content_ppm"]),
                thickness_mm=row["thickness_mm"],
                available_qty_sqft=float(row["available_qty_sqft"]),
                metadata=json.loads(row["metadata_json"] or "{}"),
                is_active=bool(row["is_active"]),
                documents=docs,
                created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    def save_tannery_batch(self, b_in: TanneryBatchCreate, batch_id: Optional[str] = None) -> TanneryBatch:
        conn = self.get_connection()
        bid = batch_id or f"batch-{uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            resolved_vid, resolved_tname = self._resolve_vendor_link(
                conn, getattr(b_in, "vendor_id", None), b_in.tannery_name
            )
            b_in.vendor_id = resolved_vid
            b_in.tannery_name = resolved_tname
            mcol_id = (getattr(b_in, "master_color_id", None) or "").strip() or None
            conn.execute(
                """
                INSERT INTO tannery_batches (
                    batch_id, company_id, batch_code, tannery_name, vendor_id, master_color_id,
                    district, leather_type, tanning_process, raw_hide_origin_country,
                    slaughterhouse_traceability_id, eudr_deforestation_free, lwg_rating, lwg_score_pct,
                    icec_certificate_id, reach_svhc_compliant, chrome_vi_content_ppm, thickness_mm,
                    available_qty_sqft, metadata_json, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(batch_id) DO UPDATE SET
                    company_id=excluded.company_id,
                    batch_code=excluded.batch_code,
                    tannery_name=excluded.tannery_name,
                    vendor_id=COALESCE(excluded.vendor_id, tannery_batches.vendor_id),
                    master_color_id=COALESCE(excluded.master_color_id, tannery_batches.master_color_id),
                    district=excluded.district,
                    leather_type=excluded.leather_type,
                    tanning_process=excluded.tanning_process,
                    raw_hide_origin_country=excluded.raw_hide_origin_country,
                    slaughterhouse_traceability_id=excluded.slaughterhouse_traceability_id,
                    eudr_deforestation_free=excluded.eudr_deforestation_free,
                    lwg_rating=excluded.lwg_rating,
                    lwg_score_pct=excluded.lwg_score_pct,
                    icec_certificate_id=excluded.icec_certificate_id,
                    reach_svhc_compliant=excluded.reach_svhc_compliant,
                    chrome_vi_content_ppm=excluded.chrome_vi_content_ppm,
                    thickness_mm=excluded.thickness_mm,
                    available_qty_sqft=excluded.available_qty_sqft,
                    metadata_json=excluded.metadata_json,
                    is_active=excluded.is_active
                """,
                (
                    bid,
                    b_in.company_id,
                    b_in.batch_code,
                    resolved_tname,
                    resolved_vid,
                    mcol_id,
                    b_in.district,
                    b_in.leather_type,
                    b_in.tanning_process.value if hasattr(b_in.tanning_process, "value") else str(b_in.tanning_process),
                    b_in.raw_hide_origin_country,
                    b_in.slaughterhouse_traceability_id or "",
                    1 if b_in.eudr_deforestation_free else 0,
                    b_in.lwg_rating,
                    b_in.lwg_score_pct,
                    b_in.icec_certificate_id or "",
                    1 if b_in.reach_svhc_compliant else 0,
                    b_in.chrome_vi_content_ppm,
                    b_in.thickness_mm,
                    b_in.available_qty_sqft,
                    json.dumps(b_in.metadata or {}),
                    1 if b_in.is_active else 0,
                    now_iso,
                ),
            )
            conn.commit()
            return self.get_tannery_batch(bid)  # type: ignore
        finally:
            self._close_if_file(conn)

    def create_tannery_batch(self, b_in: TanneryBatchCreate, batch_id: Optional[str] = None) -> TanneryBatch:
        return self.save_tannery_batch(b_in, batch_id=batch_id)

    def list_tannery_documents(self, batch_id: str) -> List[TanneryDocument]:
        conn = self.get_connection()
        try:
            rows = conn.execute("SELECT * FROM tannery_documents WHERE batch_id = ? ORDER BY created_at DESC", (batch_id,)).fetchall()
            return [
                TanneryDocument(
                    document_id=row["document_id"],
                    batch_id=row["batch_id"],
                    doc_type=TanneryDocumentType(row["doc_type"]),
                    file_name=row["file_name"],
                    mime_type=row["mime_type"],
                    file_size_bytes=int(row["file_size_bytes"]),
                    sha256_hash=row["sha256_hash"],
                    data_payload=row["data_payload"] or "",
                    valid_until=row["valid_until"],
                    is_verified=bool(row["is_verified"]),
                    created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
                )
                for row in rows
            ]
        finally:
            self._close_if_file(conn)

    def save_tannery_document(self, batch_id: str, doc_in: TanneryDocumentCreate) -> TanneryDocument:
        conn = self.get_connection()
        did = f"doc-{uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        raw_bytes = (doc_in.data_payload or doc_in.file_name).encode("utf-8")
        computed_hash = hashlib.sha256(raw_bytes).hexdigest()
        try:
            conn.execute(
                """
                INSERT INTO tannery_documents (
                    document_id, batch_id, doc_type, file_name, mime_type, file_size_bytes,
                    sha256_hash, data_payload, valid_until, is_verified, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    did,
                    batch_id,
                    doc_in.doc_type.value if hasattr(doc_in.doc_type, "value") else str(doc_in.doc_type),
                    doc_in.file_name,
                    doc_in.mime_type,
                    len(raw_bytes) if doc_in.file_size_bytes == 0 else doc_in.file_size_bytes,
                    computed_hash,
                    doc_in.data_payload or "",
                    doc_in.valid_until,
                    1 if doc_in.is_verified else 0,
                    now_iso,
                ),
            )
            conn.commit()
            return TanneryDocument(
                document_id=did,
                batch_id=batch_id,
                doc_type=doc_in.doc_type,
                file_name=doc_in.file_name,
                mime_type=doc_in.mime_type,
                file_size_bytes=len(raw_bytes) if doc_in.file_size_bytes == 0 else doc_in.file_size_bytes,
                sha256_hash=computed_hash,
                data_payload=doc_in.data_payload or "",
                valid_until=doc_in.valid_until,
                is_verified=doc_in.is_verified,
                created_at=datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    def verify_tannery_document(self, document_id: str) -> Optional[TanneryDocumentVerifyResponse]:
        conn = self.get_connection()
        try:
            row = conn.execute("SELECT * FROM tannery_documents WHERE document_id = ?", (document_id,)).fetchone()
            if not row:
                return None
            stored_hash = row["sha256_hash"]
            raw_bytes = (row["data_payload"] or row["file_name"]).encode("utf-8")
            recomputed = hashlib.sha256(raw_bytes).hexdigest()
            is_authentic = (stored_hash == recomputed)
            return TanneryDocumentVerifyResponse(
                document_id=row["document_id"],
                batch_id=row["batch_id"],
                file_name=row["file_name"],
                stored_sha256_hash=stored_hash,
                computed_sha256_hash=recomputed,
                is_authentic=is_authentic,
                verification_status="MATCH_AUTHENTIC_SHA256" if is_authentic else "TAMPERED_HASH_MISMATCH",
                verified_at=datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Sprint 6: Production Orders Hub, Size Breakdown & BOM Wastage
    # ========================================================================

    def list_production_orders(
        self,
        company_id: Optional[str] = None,
        status: Optional[str] = None,
        plm_variant_id: Optional[str] = None,
    ) -> List[ProductionOrder]:
        conn = self.get_connection()
        try:
            query = """
                SELECT po.*, pv.variant_code, pi.model_name, tb.batch_code as tannery_batch_code
                FROM production_orders po
                JOIN plm_production_variants pv ON po.plm_variant_id = pv.plm_variant_id
                JOIN pim_commercial_items pi ON po.pim_item_id = pi.pim_item_id
                LEFT JOIN tannery_batches tb ON po.tannery_batch_id = tb.batch_id
                WHERE 1=1
            """
            params: List[Any] = []
            if company_id:
                query += " AND po.company_id = ?"
                params.append(company_id)
            if status:
                query += " AND po.status = ?"
                params.append(status)
            if plm_variant_id:
                query += " AND po.plm_variant_id = ?"
                params.append(plm_variant_id)
            query += " ORDER BY po.created_at DESC"
            rows = conn.execute(query, params).fetchall()
            orders: List[ProductionOrder] = []
            for row in rows:
                oid = row["order_id"]
                sizes = [
                    OrderSizeBreakdownItem(
                        size_code=s["size_code"],
                        planned_quantity=int(s["planned_quantity"]),
                        completed_quantity=int(s["completed_quantity"]),
                        scrapped_quantity=int(s["scrapped_quantity"]),
                    )
                    for s in conn.execute("SELECT * FROM order_size_breakdown WHERE order_id = ? ORDER BY size_code ASC", (oid,)).fetchall()
                ]
                phases = [
                    ProductionOrderPhaseItem(
                        phase_id=p["phase_id"],
                        order_id=p["order_id"],
                        phase_code=ProductionPhase(p["phase_code"]),
                        phase_sequence=int(p["phase_sequence"]),
                        subcontractor_name=p["subcontractor_name"],
                        subcontractor_id=p["subcontractor_id"],
                        district=p["district"],
                        status=p["status"],
                        target_quantity=int(p["target_quantity"]),
                        conform_quantity=int(p["conform_quantity"]),
                        scrapped_quantity=int(p["scrapped_quantity"]),
                        waste_reason_code=p["waste_reason_code"],
                        material_lot_code=p["material_lot_code"] or "",
                        magic_token=p["magic_token"],
                        confirmed_at=self._parse_dt(p["confirmed_at"]),
                        operator_notes=p["operator_notes"] or "",
                    )
                    for p in conn.execute("SELECT * FROM production_order_phases WHERE order_id = ? ORDER BY phase_sequence ASC", (oid,)).fetchall()
                ]
                orders.append(
                    ProductionOrder(
                        order_id=oid,
                        order_code=row["order_code"],
                        company_id=row["company_id"],
                        plm_variant_id=row["plm_variant_id"],
                        pim_item_id=row["pim_item_id"],
                        variant_code=row["variant_code"],
                        model_name=row["model_name"],
                        season_id=row["season_id"],
                        collection_id=row["collection_id"],
                        tannery_batch_id=row["tannery_batch_id"],
                        tannery_batch_code=row["tannery_batch_code"],
                        status=ProductionOrderStatus(row["status"]),
                        total_planned_pairs=int(row["total_planned_pairs"]),
                        total_completed_pairs=int(row["total_completed_pairs"]),
                        total_scrapped_pairs=int(row["total_scrapped_pairs"]),
                        start_date=row["start_date"],
                        target_delivery_date=row["target_delivery_date"],
                        notes=row["notes"] or "",
                        size_breakdown=sizes,
                        phases=phases,
                        metadata=json.loads(row["metadata_json"] or "{}"),
                        created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
                    )
                )
            return orders
        finally:
            self._close_if_file(conn)

    def get_production_order(self, order_id: str) -> Optional[ProductionOrder]:
        orders = self.list_production_orders()
        for o in orders:
            if o.order_id == order_id or o.order_code == order_id:
                return o
        return None

    def save_production_order(self, o_in: ProductionOrderCreate) -> ProductionOrder:
        conn = self.get_connection()
        oid = f"ord-{uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        total_planned = sum(s.planned_quantity for s in o_in.size_breakdown)
        try:
            conn.execute(
                """
                INSERT INTO production_orders (
                    order_id, order_code, company_id, plm_variant_id, pim_item_id,
                    season_id, collection_id, tannery_batch_id, status,
                    total_planned_pairs, total_completed_pairs, total_scrapped_pairs,
                    start_date, target_delivery_date, notes, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)
                """,
                (
                    oid,
                    o_in.order_code,
                    o_in.company_id,
                    o_in.plm_variant_id,
                    o_in.pim_item_id,
                    o_in.season_id,
                    o_in.collection_id,
                    o_in.tannery_batch_id,
                    o_in.status.value if hasattr(o_in.status, "value") else str(o_in.status),
                    total_planned,
                    now_iso[:10],
                    o_in.target_delivery_date,
                    o_in.notes or "",
                    json.dumps(o_in.metadata or {}),
                    now_iso,
                ),
            )
            # Insert size breakdown
            for s in o_in.size_breakdown:
                conn.execute(
                    """
                    INSERT INTO order_size_breakdown (order_id, size_code, planned_quantity, completed_quantity, scrapped_quantity, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (oid, s.size_code, s.planned_quantity, s.completed_quantity, s.scrapped_quantity, now_iso),
                )
            # Insert phases (default or custom)
            phases_data = o_in.phases or [
                {"phase_code": "cutting", "subcontractor_name": "Taglio CAD Marchigiano", "district": "Fermo", "sequence": 1},
                {"phase_code": "stitching_upper", "subcontractor_name": "Tomaificio Façon Marche (0 EUR)", "district": "Montegranaro", "sequence": 2},
                {"phase_code": "lasting_assembly", "subcontractor_name": "Manovia Montaggio Adriatica", "district": "Civitanova Marche", "sequence": 3},
                {"phase_code": "finishing", "subcontractor_name": "Reparto Finissaggio & Confezione", "district": "Fermo", "sequence": 4},
                {"phase_code": "quality_control", "subcontractor_name": "Collaudo Finale & Packaging QA", "district": "Fermo", "sequence": 5},
            ]
            for p in phases_data:
                pid = f"phase-{uuid4().hex[:12]}"
                token = f"magic-{uuid4().hex[:16]}"
                conn.execute(
                    """
                    INSERT INTO production_order_phases (
                        phase_id, order_id, phase_code, phase_sequence, subcontractor_name,
                        subcontractor_id, district, status, target_quantity, conform_quantity,
                        scrapped_quantity, magic_token, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, 0, ?, ?)
                    """,
                    (
                        pid,
                        oid,
                        p.get("phase_code", "cutting"),
                        int(p.get("sequence", 1)),
                        p.get("subcontractor_name", "Laboratorio Terzista"),
                        p.get("subcontractor_id"),
                        p.get("district", "Fermo-Macerata"),
                        total_planned,
                        token,
                        now_iso,
                    ),
                )
            conn.commit()
            return self.get_production_order(oid)  # type: ignore
        finally:
            self._close_if_file(conn)

    def confirm_phase_by_token(self, magic_token: str, req: SubcontractorPhaseConfirmRequest) -> Optional[ProductionOrderPhaseItem]:
        conn = self.get_connection()
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            row = conn.execute("SELECT * FROM production_order_phases WHERE magic_token = ?", (magic_token,)).fetchone()
            if not row:
                return None
            phase_id = row["phase_id"]
            order_id = row["order_id"]
            conn.execute(
                """
                UPDATE production_order_phases
                SET status = 'completed',
                    conform_quantity = ?,
                    scrapped_quantity = ?,
                    waste_reason_code = ?,
                    operator_notes = ?,
                    confirmed_at = ?
                WHERE phase_id = ?
                """,
                (
                    req.conform_quantity,
                    req.scrapped_quantity,
                    req.waste_reason_code,
                    req.operator_notes or "",
                    now_iso,
                    phase_id,
                ),
            )
            # Update order totals if last phase or QA
            all_phases = conn.execute("SELECT * FROM production_order_phases WHERE order_id = ?", (order_id,)).fetchall()
            completed_cnt = sum(1 for p in all_phases if p["status"] == "completed" or p["phase_id"] == phase_id)
            if completed_cnt == len(all_phases):
                conn.execute(
                    "UPDATE production_orders SET status = 'completed', total_completed_pairs = ?, total_scrapped_pairs = ? WHERE order_id = ?",
                    (req.conform_quantity, req.scrapped_quantity, order_id),
                )
            else:
                conn.execute("UPDATE production_orders SET status = 'in_production' WHERE order_id = ?", (order_id,))
            conn.commit()

            updated_row = conn.execute("SELECT * FROM production_order_phases WHERE phase_id = ?", (phase_id,)).fetchone()
            return ProductionOrderPhaseItem(
                phase_id=updated_row["phase_id"],
                order_id=updated_row["order_id"],
                phase_code=ProductionPhase(updated_row["phase_code"]),
                phase_sequence=int(updated_row["phase_sequence"]),
                subcontractor_name=updated_row["subcontractor_name"],
                subcontractor_id=updated_row["subcontractor_id"],
                district=updated_row["district"],
                status=updated_row["status"],
                target_quantity=int(updated_row["target_quantity"]),
                conform_quantity=int(updated_row["conform_quantity"]),
                scrapped_quantity=int(updated_row["scrapped_quantity"]),
                waste_reason_code=updated_row["waste_reason_code"],
                material_lot_code=updated_row["material_lot_code"] or "",
                magic_token=updated_row["magic_token"],
                confirmed_at=self._parse_dt(updated_row["confirmed_at"]),
                operator_notes=updated_row["operator_notes"] or "",
            )
        finally:
            self._close_if_file(conn)

    def calculate_bom_requirements(self, req: BomRequirementsCalculationRequest) -> BomRequirementsCalculationResult:
        conn = self.get_connection()
        try:
            bom_rows = conn.execute("SELECT * FROM bom_items WHERE plm_variant_id = ? ORDER BY level ASC", (req.plm_variant_id,)).fetchall()
            total_pairs = sum(s.planned_quantity for s in req.size_breakdown)
            requirements: List[BomSizeRequirementItem] = []
            total_leather_sqft = 0.0
            total_soles = 0

            base_size = 40.0
            grading_delta = 2.8

            for b in bom_rows:
                comp_type = b["component_type"]
                base_cons = float(b["unit_consumption"])
                waste_pct = req.custom_waste_override_pct if req.custom_waste_override_pct is not None else float(b["waste_percentage"])
                if req.custom_waste_override_pct is None:
                    if comp_type in ("upper", "lining"):
                        waste_pct = max(waste_pct, 18.0)
                    elif comp_type in ("outsole", "heel", "insole"):
                        waste_pct = max(waste_pct, 2.0)

                req_by_size: Dict[str, float] = {}
                net_req = 0.0

                for s in req.size_breakdown:
                    try:
                        numeric_sz = float(s.size_code.replace("EU", "").strip())
                    except ValueError:
                        numeric_sz = base_size

                    scale_factor = 1.0 + ((numeric_sz - base_size) * (grading_delta / 100.0))
                    item_cons = base_cons * scale_factor * s.planned_quantity
                    req_by_size[s.size_code] = round(item_cons, 3)
                    net_req += item_cons

                gross_req = net_req * (1.0 + (waste_pct / 100.0))
                if comp_type in ("upper", "lining"):
                    total_leather_sqft += gross_req
                elif comp_type == "outsole":
                    total_soles += int(round(gross_req))

                requirements.append(
                    BomSizeRequirementItem(
                        bom_item_id=b["bom_item_id"],
                        material_name=b["material_name"],
                        component_type=comp_type,
                        unit_of_measure=b["unit_of_measure"],
                        base_consumption=base_cons,
                        grading_delta_pct=grading_delta,
                        waste_percentage=waste_pct,
                        net_requirement=round(net_req, 3),
                        gross_requirement_with_waste=round(gross_req, 3),
                        requirement_by_size=req_by_size,
                    )
                )

            return BomRequirementsCalculationResult(
                plm_variant_id=req.plm_variant_id,
                total_pairs=total_pairs,
                requirements=requirements,
                total_leather_sqft_gross=round(total_leather_sqft, 2),
                total_soles_pairs_gross=total_soles if total_soles > 0 else total_pairs,
                calculated_at=datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Sprint 7: Product Categories Hierarchy (ADR-010)
    # ========================================================================

    def save_category(self, cat_in: ProductCategoryCreate) -> ProductCategoryHierarchyNode:
        conn = self.get_connection()
        try:
            cat_id = cat_in.category_id or f"cat_{uuid4().hex[:8]}"
            level = cat_in.level
            parent_id = cat_in.parent_id
            code = cat_in.code.strip().lower()

            if parent_id:
                p_row = conn.execute(
                    "SELECT slug_path, level FROM product_categories_hierarchy WHERE category_id = ?",
                    (parent_id,),
                ).fetchone()
                if p_row:
                    slug_path = cat_in.slug_path or f"{p_row['slug_path']}/{code}"
                    level = p_row["level"] + 1
                else:
                    slug_path = cat_in.slug_path or code
            else:
                slug_path = cat_in.slug_path or code

            now_str = datetime.now(timezone.utc).isoformat()
            conn.execute(
                """
                INSERT INTO product_categories_hierarchy (
                    category_id, parent_id, level, code, slug_path,
                    label_it, label_en, icon, is_active, sort_order, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(category_id) DO UPDATE SET
                    parent_id = excluded.parent_id,
                    level = excluded.level,
                    code = excluded.code,
                    slug_path = excluded.slug_path,
                    label_it = excluded.label_it,
                    label_en = excluded.label_en,
                    icon = excluded.icon,
                    is_active = excluded.is_active,
                    sort_order = excluded.sort_order
                """,
                (
                    cat_id,
                    parent_id,
                    level,
                    code,
                    slug_path,
                    cat_in.label_it,
                    cat_in.label_en,
                    cat_in.icon,
                    1 if cat_in.is_active else 0,
                    cat_in.sort_order,
                    now_str,
                ),
            )
            conn.commit()
            return ProductCategoryHierarchyNode(
                category_id=cat_id,
                parent_id=parent_id,
                level=level,
                code=code,
                slug_path=slug_path,
                label_it=cat_in.label_it,
                label_en=cat_in.label_en,
                icon=cat_in.icon,
                is_active=cat_in.is_active,
                sort_order=cat_in.sort_order,
                children=[],
                created_at=datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    def get_category(self, category_id: str) -> Optional[ProductCategoryHierarchyNode]:
        conn = self.get_connection()
        try:
            r = conn.execute(
                "SELECT * FROM product_categories_hierarchy WHERE category_id = ?",
                (category_id,),
            ).fetchone()
            if not r:
                return None
            return ProductCategoryHierarchyNode(
                category_id=r["category_id"],
                parent_id=r["parent_id"],
                level=r["level"],
                code=r["code"],
                slug_path=r["slug_path"],
                label_it=r["label_it"],
                label_en=r["label_en"],
                icon=r["icon"] or "🏷️",
                is_active=bool(r["is_active"]),
                sort_order=r["sort_order"],
                children=[],
                created_at=self._parse_dt(r["created_at"]),
            )
        finally:
            self._close_if_file(conn)

    def list_categories(
        self, parent_id: Optional[str] = None, level: Optional[int] = None
    ) -> List[ProductCategoryHierarchyNode]:
        conn = self.get_connection()
        try:
            query = "SELECT * FROM product_categories_hierarchy WHERE 1=1"
            params: List[Any] = []
            if parent_id is not None:
                if parent_id == "root":
                    query += " AND parent_id IS NULL"
                else:
                    query += " AND parent_id = ?"
                    params.append(parent_id)
            if level is not None:
                query += " AND level = ?"
                params.append(level)
            query += " ORDER BY level ASC, sort_order ASC, label_it ASC"
            rows = conn.execute(query, params).fetchall()
            return [
                ProductCategoryHierarchyNode(
                    category_id=r["category_id"],
                    parent_id=r["parent_id"],
                    level=r["level"],
                    code=r["code"],
                    slug_path=r["slug_path"],
                    label_it=r["label_it"],
                    label_en=r["label_en"],
                    icon=r["icon"] or "🏷️",
                    is_active=bool(r["is_active"]),
                    sort_order=r["sort_order"],
                    children=[],
                    created_at=self._parse_dt(r["created_at"]),
                )
                for r in rows
            ]
        finally:
            self._close_if_file(conn)

    def get_category_tree(self) -> List[ProductCategoryHierarchyNode]:
        all_cats = self.list_categories()
        cat_map = {c.category_id: c for c in all_cats}
        tree: List[ProductCategoryHierarchyNode] = []
        for c in all_cats:
            if c.parent_id and c.parent_id in cat_map:
                cat_map[c.parent_id].children.append(c)
            else:
                tree.append(c)
        return tree

    def delete_category(self, category_id: str) -> bool:
        conn = self.get_connection()
        try:
            cur = conn.execute(
                "DELETE FROM product_categories_hierarchy WHERE category_id = ?",
                (category_id,),
            )
            conn.commit()
            return cur.rowcount > 0
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Sprint 7: BOM Templates Library (ADR-010)
    # ========================================================================

    def save_bom_template(self, tpl: BomTemplateCreate) -> BomTemplate:
        conn = self.get_connection()
        try:
            t_id = tpl.template_id or f"BOM-TPL-{uuid4().hex[:8].upper()}"
            now_str = datetime.now(timezone.utc).isoformat()
            items_dump = [item.model_dump() for item in tpl.items]
            conn.execute(
                """
                INSERT INTO bom_templates (
                    template_id, name, category_id, construction_type,
                    description, items_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(template_id) DO UPDATE SET
                    name = excluded.name,
                    category_id = excluded.category_id,
                    construction_type = excluded.construction_type,
                    description = excluded.description,
                    items_json = excluded.items_json
                """,
                (
                    t_id,
                    tpl.name,
                    tpl.category_id,
                    tpl.construction_type,
                    tpl.description,
                    json.dumps(items_dump),
                    now_str,
                ),
            )
            conn.commit()
            return BomTemplate(
                template_id=t_id,
                name=tpl.name,
                category_id=tpl.category_id,
                construction_type=tpl.construction_type,
                description=tpl.description,
                items=tpl.items,
                created_at=datetime.now(timezone.utc),
            )
        finally:
            self._close_if_file(conn)

    def get_bom_template(self, template_id: str) -> Optional[BomTemplate]:
        conn = self.get_connection()
        try:
            r = conn.execute("SELECT * FROM bom_templates WHERE template_id = ?", (template_id,)).fetchone()
            if not r:
                return None
            raw_items = json.loads(r["items_json"] or "[]")
            items = [BomTemplateItem(**it) for it in raw_items]
            return BomTemplate(
                template_id=r["template_id"],
                name=r["name"],
                category_id=r["category_id"],
                construction_type=r["construction_type"],
                description=r["description"],
                items=items,
                created_at=self._parse_dt(r["created_at"]),
            )
        finally:
            self._close_if_file(conn)

    def list_bom_templates(self, category_id: Optional[str] = None) -> List[BomTemplate]:
        conn = self.get_connection()
        try:
            query = "SELECT * FROM bom_templates"
            params: List[Any] = []
            if category_id:
                query += " WHERE category_id = ?"
                params.append(category_id)
            query += " ORDER BY name ASC"
            rows = conn.execute(query, params).fetchall()
            templates: List[BomTemplate] = []
            for r in rows:
                raw_items = json.loads(r["items_json"] or "[]")
                items = [BomTemplateItem(**it) for it in raw_items]
                templates.append(
                    BomTemplate(
                        template_id=r["template_id"],
                        name=r["name"],
                        category_id=r["category_id"],
                        construction_type=r["construction_type"],
                        description=r["description"],
                        items=items,
                        created_at=self._parse_dt(r["created_at"]),
                    )
                )
            return templates
        finally:
            self._close_if_file(conn)

    def delete_bom_template(self, template_id: str) -> bool:
        conn = self.get_connection()
        try:
            cur = conn.execute("DELETE FROM bom_templates WHERE template_id = ?", (template_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            self._close_if_file(conn)

    def apply_bom_template_to_variant(self, template_id: str, plm_variant_id: str) -> List[BomItem]:
        conn = self.get_connection()
        try:
            tpl_row = conn.execute("SELECT * FROM bom_templates WHERE template_id = ?", (template_id,)).fetchone()
            if not tpl_row:
                raise ValueError(f"BOM Template '{template_id}' not found.")
            raw_items = json.loads(tpl_row["items_json"] or "[]")

            # Map template items into real BomItems with unique IDs
            id_map: Dict[str, str] = {}
            for it in raw_items:
                old_tid = it.get("template_item_id", "")
                id_map[old_tid] = f"BOM-{uuid4().hex[:8].upper()}"

            new_bom_items: List[BomItem] = []
            for it in raw_items:
                new_b_id = id_map.get(it.get("template_item_id", ""), f"BOM-{uuid4().hex[:8].upper()}")
                new_p_id = (
                    id_map.get(it.get("parent_template_item_id")) if it.get("parent_template_item_id") else None
                )
                bom_item = BomItem(
                    bom_item_id=new_b_id,
                    level=it.get("level", 1),
                    parent_bom_item_id=new_p_id,
                    component_type=BomComponentType(it.get("component_type", "upper")),
                    material_name=it.get("material_name", "Materiale Standard"),
                    supplier_name=it.get("supplier_name", "Fornitore Certificato"),
                    origin_country_iso2=it.get("origin_country_iso2", "IT"),
                    unit_of_measure=it.get("unit_of_measure", "dm2"),
                    unit_consumption=float(it.get("unit_consumption", 1.0)),
                    waste_percentage=float(it.get("waste_percentage", 5.0)),
                    recycled_content_pct=float(it.get("recycled_content_pct", 0.0)),
                    certifications=it.get("certifications", []),
                    unit_cost_eur=float(it.get("unit_cost_eur", 10.0)),
                    lot_certificate_id="CERT-ESPR-TPL",
                    custom_attributes={},
                )
                new_bom_items.append(bom_item)

            for bom in new_bom_items:
                comp_val = (
                    bom.component_type.value if isinstance(bom.component_type, BomComponentType) else str(bom.component_type)
                )
                resolved_vid, resolved_sname = self._resolve_vendor_link(conn, bom.vendor_id, bom.supplier_name)
                bom.vendor_id = resolved_vid
                bom.supplier_name = resolved_sname
                bom_meta = {
                    "unit_cost_eur": bom.unit_cost_eur,
                    "lot_certificate_id": bom.lot_certificate_id,
                    "custom_attributes": bom.custom_attributes,
                }
                conn.execute(
                    """
                    INSERT INTO bom_items (
                        bom_item_id, plm_variant_id, level, parent_bom_item_id,
                        component_type, material_name, supplier_name, vendor_id, master_color_id,
                        origin_country_iso2, unit_of_measure, unit_consumption, waste_percentage,
                        recycled_content_pct, certifications_json, metadata_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        bom.bom_item_id,
                        plm_variant_id,
                        bom.level,
                        bom.parent_bom_item_id,
                        comp_val,
                        bom.material_name,
                        resolved_sname,
                        resolved_vid,
                        bom.master_color_id,
                        bom.origin_country_iso2,
                        bom.unit_of_measure,
                        bom.unit_consumption,
                        bom.waste_percentage,
                        bom.recycled_content_pct,
                        json.dumps(bom.certifications),
                        json.dumps(bom_meta),
                    ),
                )
            conn.commit()
            return new_bom_items
        finally:
            self._close_if_file(conn)

    def update_bom_item(self, plm_variant_id: str, bom_item_id: str, updated_item: BomItem) -> BomItem:
        """Update an existing BOM item's fields in SQLite database."""
        conn = self.get_connection()
        try:
            cur = conn.execute(
                "SELECT * FROM bom_items WHERE plm_variant_id = ? AND bom_item_id = ?",
                (plm_variant_id, bom_item_id),
            ).fetchone()
            if not cur:
                raise ValueError(f"BOM Item '{bom_item_id}' not found in variant '{plm_variant_id}'.")

            comp_val = (
                updated_item.component_type.value
                if isinstance(updated_item.component_type, BomComponentType)
                else str(updated_item.component_type)
            )
            resolved_vid, resolved_sname = self._resolve_vendor_link(
                conn, updated_item.vendor_id, updated_item.supplier_name
            )
            updated_item.vendor_id = resolved_vid
            updated_item.supplier_name = resolved_sname
            cur_keys = cur.keys()
            resolved_mcol = updated_item.master_color_id or (
                cur["master_color_id"] if "master_color_id" in cur_keys else None
            )
            updated_item.master_color_id = resolved_mcol
            bom_meta = {
                "unit_cost_eur": updated_item.unit_cost_eur,
                "lot_certificate_id": updated_item.lot_certificate_id,
                "custom_attributes": updated_item.custom_attributes,
            }
            conn.execute(
                """
                UPDATE bom_items
                SET level = ?, parent_bom_item_id = ?, component_type = ?,
                    material_name = ?, supplier_name = ?, vendor_id = ?, master_color_id = ?,
                    origin_country_iso2 = ?, unit_of_measure = ?, unit_consumption = ?,
                    waste_percentage = ?, recycled_content_pct = ?, certifications_json = ?, metadata_json = ?
                WHERE plm_variant_id = ? AND bom_item_id = ?
                """,
                (
                    updated_item.level,
                    updated_item.parent_bom_item_id,
                    comp_val,
                    updated_item.material_name,
                    resolved_sname,
                    resolved_vid,
                    resolved_mcol,
                    updated_item.origin_country_iso2,
                    updated_item.unit_of_measure,
                    updated_item.unit_consumption,
                    updated_item.waste_percentage,
                    updated_item.recycled_content_pct,
                    json.dumps(updated_item.certifications),
                    json.dumps(bom_meta),
                    plm_variant_id,
                    bom_item_id,
                ),
            )
            conn.commit()
            return updated_item
        finally:
            self._close_if_file(conn)

    def delete_bom_item(self, plm_variant_id: str, bom_item_id: str) -> bool:
        """Delete a BOM item and all its recursive children in 3-level tree."""
        conn = self.get_connection()
        try:
            ids_to_delete = {bom_item_id}
            rows = conn.execute(
                "SELECT bom_item_id, parent_bom_item_id FROM bom_items WHERE plm_variant_id = ?",
                (plm_variant_id,),
            ).fetchall()

            added = True
            while added:
                added = False
                for r in rows:
                    bid = r["bom_item_id"]
                    pid = r["parent_bom_item_id"]
                    if pid in ids_to_delete and bid not in ids_to_delete:
                        ids_to_delete.add(bid)
                        added = True

            placeholders = ",".join("?" for _ in ids_to_delete)
            try:
                conn.execute(
                    f"DELETE FROM variant_colorway_bom_mappings WHERE plm_variant_id = ? AND bom_item_id IN ({placeholders})",
                    [plm_variant_id] + list(ids_to_delete),
                )
            except sqlite3.OperationalError:
                pass
            conn.execute(
                f"DELETE FROM bom_items WHERE plm_variant_id = ? AND bom_item_id IN ({placeholders})",
                [plm_variant_id] + list(ids_to_delete),
            )
            conn.commit()
            return True
        finally:
            self._close_if_file(conn)

    def move_bom_item(
        self, plm_variant_id: str, bom_item_id: str, new_level: int, new_parent_id: Optional[str]
    ) -> BomItem:
        """Move / reparent a BOM item in the 3-level tree."""
        conn = self.get_connection()
        try:
            r = conn.execute(
                "SELECT * FROM bom_items WHERE plm_variant_id = ? AND bom_item_id = ?",
                (plm_variant_id, bom_item_id),
            ).fetchone()
            if not r:
                raise ValueError(f"BOM Item '{bom_item_id}' not found in variant '{plm_variant_id}'.")

            if new_level == 1:
                new_parent_id = None
            elif not new_parent_id:
                raise ValueError("BOM items with level > 1 must specify a parent_bom_item_id.")
            else:
                parent_row = conn.execute(
                    "SELECT level FROM bom_items WHERE plm_variant_id = ? AND bom_item_id = ?",
                    (plm_variant_id, new_parent_id),
                ).fetchone()
                if not parent_row:
                    raise ValueError(f"Parent BOM Item '{new_parent_id}' does not exist in this variant.")
                if parent_row["level"] >= new_level:
                    raise ValueError(f"Parent item must be at a higher hierarchical level than Level {new_level}.")

            conn.execute(
                "UPDATE bom_items SET level = ?, parent_bom_item_id = ? WHERE plm_variant_id = ? AND bom_item_id = ?",
                (new_level, new_parent_id, plm_variant_id, bom_item_id),
            )
            conn.commit()

            updated_row = conn.execute(
                "SELECT * FROM bom_items WHERE plm_variant_id = ? AND bom_item_id = ?",
                (plm_variant_id, bom_item_id),
            ).fetchone()
            meta = json.loads(updated_row["metadata_json"] or "{}")
            u_keys = updated_row.keys()
            return BomItem(
                bom_item_id=updated_row["bom_item_id"],
                level=updated_row["level"],
                parent_bom_item_id=updated_row["parent_bom_item_id"],
                component_type=BomComponentType(updated_row["component_type"]),
                material_name=updated_row["material_name"],
                supplier_name=updated_row["supplier_name"],
                vendor_id=updated_row["vendor_id"] if "vendor_id" in u_keys else None,
                master_color_id=updated_row["master_color_id"] if "master_color_id" in u_keys else None,
                origin_country_iso2=updated_row["origin_country_iso2"],
                unit_of_measure=updated_row["unit_of_measure"],
                unit_consumption=float(updated_row["unit_consumption"]),
                waste_percentage=float(updated_row["waste_percentage"]),
                recycled_content_pct=float(updated_row["recycled_content_pct"]),
                certifications=json.loads(updated_row["certifications_json"] or "[]"),
                unit_cost_eur=float(meta.get("unit_cost_eur", 8.5)),
                lot_certificate_id=meta.get("lot_certificate_id", "CERT-ESPR-DEF"),
                custom_attributes=meta.get("custom_attributes", {}),
            )
        finally:
            self._close_if_file(conn)

    def create_bom_template_from_variant(
        self,
        plm_variant_id: str,
        name: str,
        category_id: str,
        construction_type: str = "cassetta_cucita",
        description: str = "",
    ) -> BomTemplate:
        """Create a new reusable BomTemplate from an existing variant's BOM items."""
        conn = self.get_connection()
        try:
            bom_rows = conn.execute(
                "SELECT * FROM bom_items WHERE plm_variant_id = ? ORDER BY level ASC, id ASC",
                (plm_variant_id,),
            ).fetchall()
            if not bom_rows:
                raise ValueError(f"Variant '{plm_variant_id}' has no BOM items to convert into a template.")

            tpl_items: List[BomTemplateItem] = []
            id_map: Dict[str, str] = {}
            for idx, r in enumerate(bom_rows):
                new_tid = f"TPL-ITM-{idx + 1:03d}"
                id_map[r["bom_item_id"]] = new_tid

            for r in bom_rows:
                tid = id_map[r["bom_item_id"]]
                pid = id_map.get(r["parent_bom_item_id"]) if r["parent_bom_item_id"] else None
                meta = json.loads(r["metadata_json"] or "{}")
                tpl_items.append(
                    BomTemplateItem(
                        level=r["level"],
                        parent_template_item_id=pid,
                        template_item_id=tid,
                        component_type=BomComponentType(r["component_type"]),
                        material_name=r["material_name"],
                        supplier_name=r["supplier_name"],
                        origin_country_iso2=r["origin_country_iso2"],
                        unit_of_measure=r["unit_of_measure"],
                        unit_consumption=float(r["unit_consumption"]),
                        waste_percentage=float(r["waste_percentage"]),
                        recycled_content_pct=float(r["recycled_content_pct"]),
                        certifications=json.loads(r["certifications_json"] or "[]"),
                        unit_cost_eur=float(meta.get("unit_cost_eur", 10.0)),
                    )
                )

            tpl_id = f"tpl_{name.lower().replace(' ', '_').replace('-', '_')[:32]}_{uuid4().hex[:4]}"
            payload = BomTemplateCreate(
                template_id=tpl_id,
                name=name,
                category_id=category_id,
                construction_type=construction_type,
                description=description,
                items=tpl_items,
            )
            return self.save_bom_template(payload)
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Sprint 7: Deep Clone Variant & 3-Level BOM (ADR-010)
    # ========================================================================

    def deep_clone_variant(self, source_variant_id: str, req: VariantDeepCloneRequest) -> PlmProductionVariant:
        conn = self.get_connection()
        try:
            vr = conn.execute(
                "SELECT * FROM plm_production_variants WHERE plm_variant_id = ?",
                (source_variant_id,),
            ).fetchone()
            if not vr:
                raise ValueError(f"Source variant '{source_variant_id}' not found.")

            pim_id = vr["pim_item_id"]
            var_meta = json.loads(vr["metadata_json"] or "{}")
            new_var_id = f"PLM-VAR-{uuid4().hex[:8].upper()}"

            new_last = req.new_last_or_pattern_code or vr["last_or_pattern_code"]
            new_size = req.new_size_range or vr["size_range"]

            cloned_bom_items: List[BomItem] = []
            if req.clone_bom:
                old_bom_rows = conn.execute(
                    "SELECT * FROM bom_items WHERE plm_variant_id = ? ORDER BY level ASC, id ASC",
                    (source_variant_id,),
                ).fetchall()

                id_remap: Dict[str, str] = {}
                for b in old_bom_rows:
                    old_id = b["bom_item_id"]
                    id_remap[old_id] = f"BOM-{uuid4().hex[:8].upper()}"

                replacements = req.material_replacements or {}
                for b in old_bom_rows:
                    new_b_id = id_remap[b["bom_item_id"]]
                    new_p_id = (
                        id_remap.get(b["parent_bom_item_id"]) if b["parent_bom_item_id"] else None
                    )
                    mat_name = b["material_name"]
                    if mat_name in replacements:
                        mat_name = replacements[mat_name]
                    else:
                        for old_mat, rep_mat in replacements.items():
                            if old_mat.lower() in mat_name.lower():
                                mat_name = rep_mat
                                break

                    b_meta = json.loads(b["metadata_json"] or "{}")
                    b_keys = b.keys()
                    cloned_bom_items.append(
                        BomItem(
                            bom_item_id=new_b_id,
                            level=b["level"],
                            parent_bom_item_id=new_p_id,
                            component_type=BomComponentType(b["component_type"]),
                            material_name=mat_name,
                            supplier_name=b["supplier_name"],
                            vendor_id=b["vendor_id"] if "vendor_id" in b_keys else None,
                            master_color_id=b["master_color_id"] if "master_color_id" in b_keys else None,
                            origin_country_iso2=b["origin_country_iso2"],
                            unit_of_measure=b["unit_of_measure"],
                            unit_consumption=float(b["unit_consumption"]),
                            waste_percentage=float(b["waste_percentage"]),
                            recycled_content_pct=float(b["recycled_content_pct"]),
                            certifications=json.loads(b["certifications_json"] or "[]"),
                            unit_cost_eur=float(b_meta.get("unit_cost_eur", 10.0)),
                            lot_certificate_id=str(b_meta.get("lot_certificate_id", "CERT-ESPR-CLONED")),
                            custom_attributes=b_meta.get("custom_attributes", {}),
                        )
                    )

            var_meta["bom_version"] = "v1.0 (Cloned)"
            var_meta["bom_snapshot_locked"] = False
            var_meta["cloned_from_variant_id"] = source_variant_id

            new_variant = PlmProductionVariant(
                plm_variant_id=new_var_id,
                pim_item_id=pim_id,
                collection_id=vr["collection_id"],
                variant_code=req.new_variant_code.strip(),
                colorway_name=req.new_colorway_name.strip(),
                size_range=new_size,
                last_or_pattern_code=new_last,
                lifecycle_status=PlmLifecycleStatus.PROTOTYPE,
                bom_version="v1.0 (Cloned)",
                bom_snapshot_locked=False,
                sample_base_size=str(var_meta.get("sample_base_size", "42")),
                size_grading_step_pct=float(var_meta.get("size_grading_step_pct", 2.8)),
                standard_labor_cost_eur=float(var_meta.get("standard_labor_cost_eur", 28.0)),
                target_gender=var_meta.get("target_gender", "unisex"),
                category_id=var_meta.get("category_id"),
                sub_category_id=var_meta.get("sub_category_id"),
                construction_type=var_meta.get("construction_type", "cassetta_cucita"),
                carryover_status=var_meta.get("carryover_status", "seasonal_core"),
                category_specific_specs=var_meta.get("category_specific_specs", {}),
                custom_attributes=var_meta.get("custom_attributes", {}),
                bom_items=cloned_bom_items,
                subcontractor_assignments=[],
                created_at=datetime.now(timezone.utc),
            )

            self._insert_variant_in_tx(conn, pim_id, new_variant)
            conn.commit()
            return new_variant
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Sprint 7: Bulk Data Onboarding (Import/Export Massivo con Dry-Run)
    # ========================================================================

    def validate_bulk_import(self, import_type: str, csv_content: str) -> BulkImportValidationResponse:
        rows: List[BulkImportValidationRow] = []
        valid_count = 0
        invalid_count = 0

        reader = csv.DictReader(io.StringIO(csv_content.strip()))
        row_num = 1
        for r in reader:
            row_num += 1
            errors: List[str] = []
            cleaned_row = {k.strip(): (v.strip() if v else "") for k, v in r.items() if k}

            if import_type == "articles":
                sku = cleaned_row.get("sku_code", "")
                model = cleaned_row.get("model_name", "")
                variant_code = cleaned_row.get("variant_code", "")
                cat_str = cleaned_row.get("category", "footwear").lower()

                if not sku:
                    errors.append("Colonna 'sku_code' mancante o vuota.")
                if not model:
                    errors.append("Colonna 'model_name' mancante o vuota.")
                if not variant_code:
                    errors.append("Colonna 'variant_code' mancante o vuota.")
                if cat_str not in ("footwear", "leather_goods", "apparel"):
                    errors.append(f"Categoria '{cat_str}' non valida (valori consentiti: footwear, leather_goods, apparel).")

                is_valid = len(errors) == 0
                if is_valid:
                    valid_count += 1
                else:
                    invalid_count += 1

                rows.append(
                    BulkImportValidationRow(
                        row_number=row_num,
                        entity_type="article_variant",
                        identifier=f"{sku} / {variant_code}",
                        is_valid=is_valid,
                        errors=errors,
                        parsed_data=cleaned_row,
                    )
                )

            elif import_type == "bom":
                var_code = cleaned_row.get("variant_code", "")
                mat_name = cleaned_row.get("material_name", "")
                comp_type = cleaned_row.get("component_type", "upper").lower()
                lvl_str = cleaned_row.get("level", "1")

                if not var_code:
                    errors.append("Colonna 'variant_code' mancante.")
                if not mat_name:
                    errors.append("Colonna 'material_name' mancante.")

                try:
                    lvl = int(lvl_str)
                    if lvl not in (1, 2, 3):
                        errors.append(f"Livello BOM '{lvl}' non valido (deve essere 1, 2 o 3).")
                except ValueError:
                    errors.append(f"Livello BOM '{lvl_str}' non numerico.")

                valid_comps = ("upper", "lining", "insole", "outsole", "heel", "hardware", "fabric", "packaging", "sub_assembly")
                if comp_type not in valid_comps:
                    errors.append(f"Component type '{comp_type}' non valido.")

                is_valid = len(errors) == 0
                if is_valid:
                    valid_count += 1
                else:
                    invalid_count += 1

                rows.append(
                    BulkImportValidationRow(
                        row_number=row_num,
                        entity_type="bom_item",
                        identifier=f"{var_code} > {mat_name}",
                        is_valid=is_valid,
                        errors=errors,
                        parsed_data=cleaned_row,
                    )
                )

        summary = f"Totale righe: {len(rows)} | Valide: {valid_count} | Errori: {invalid_count}"
        return BulkImportValidationResponse(
            total_rows=len(rows),
            valid_rows_count=valid_count,
            invalid_rows_count=invalid_count,
            rows=rows,
            summary=summary,
        )

    def commit_bulk_import(self, req: BulkImportCommitRequest) -> BulkImportCommitResponse:
        conn = self.get_connection()
        try:
            imported_items = 0
            imported_variants = 0
            imported_bom = 0

            if req.import_type == "articles":
                grouped: Dict[str, List[Dict[str, Any]]] = {}
                for r in req.valid_rows:
                    sku = r.get("sku_code", "")
                    if sku not in grouped:
                        grouped[sku] = []
                    grouped[sku].append(r)

                for sku, rows in grouped.items():
                    first_r = rows[0]
                    pim_id = f"PIM-{uuid4().hex[:8].upper()}"
                    model_name = first_r.get("model_name", "Nuovo Modello")
                    cat_val = first_r.get("category", "footwear").lower()
                    season = first_r.get("season", "PE26")
                    ws_price = float(first_r.get("wholesale_price_eur", 145.0) or 145.0)
                    rt_price = float(first_r.get("retail_price_eur", 390.0) or 390.0)
                    brand_line = first_r.get("brand_line", "Main Line")
                    carryover = first_r.get("carryover_status", "seasonal_core")

                    plm_variants: List[PlmProductionVariant] = []
                    for vr in rows:
                        v_code = vr.get("variant_code", f"VAR-{uuid4().hex[:6].upper()}")
                        c_name = vr.get("colorway_name", "Nero")
                        s_range = vr.get("size_range", "35-42")
                        last_code = vr.get("last_or_pattern_code", "LAST-STD")
                        const_type = vr.get("construction_type", "cassetta_cucita")
                        v_id = f"PLM-VAR-{uuid4().hex[:8].upper()}"

                        plm_variants.append(
                            PlmProductionVariant(
                                plm_variant_id=v_id,
                                pim_item_id=pim_id,
                                variant_code=v_code,
                                colorway_name=c_name,
                                size_range=s_range,
                                last_or_pattern_code=last_code,
                                lifecycle_status=PlmLifecycleStatus.PROTOTYPE,
                                construction_type=const_type,
                                carryover_status=carryover,
                                bom_items=[],
                                subcontractor_assignments=[],
                            )
                        )
                        imported_variants += 1

                    pim_item = PimCommercialItem(
                        pim_item_id=pim_id,
                        sku_code=sku,
                        model_name=model_name,
                        brand_tenant_id="brand-footlink-demo",
                        season=season,
                        category=ProductCategory(cat_val),
                        commercial_description_it=f"{model_name} in pelle pregiata lavorata nei distretti Made in Italy.",
                        commercial_description_en=f"{model_name} in premium leather crafted in Italian manufacturing districts.",
                        retail_channels=["B2B Showroom", "E-Commerce"],
                        wholesale_price_eur=ws_price,
                        retail_price_eur=rt_price,
                        brand_line=brand_line,
                        carryover_status=carryover,
                        plm_variants=plm_variants,
                    )
                    self.save_pim_item(pim_item)
                    imported_items += 1

            elif req.import_type == "bom":
                for r in req.valid_rows:
                    var_code = r.get("variant_code", "")
                    vr = conn.execute(
                        "SELECT plm_variant_id FROM plm_production_variants WHERE variant_code = ?",
                        (var_code,),
                    ).fetchone()
                    if not vr:
                        continue
                    v_id = vr["plm_variant_id"]

                    bom_id = f"BOM-{uuid4().hex[:8].upper()}"
                    lvl = int(r.get("level", 1) or 1)
                    p_id = r.get("parent_bom_item_id") or None
                    comp_type = r.get("component_type", "upper").lower()
                    mat_name = r.get("material_name", "Materiale")
                    supp = r.get("supplier_name", "Fornitore Certificato")
                    uom = r.get("unit_of_measure", "dm2")
                    cons = float(r.get("unit_consumption", 1.0) or 1.0)
                    waste = float(r.get("waste_percentage", 5.0) or 5.0)
                    cost = float(r.get("unit_cost_eur", 10.0) or 10.0)

                    bom_meta = {
                        "unit_cost_eur": cost,
                        "lot_certificate_id": "CERT-ESPR-BULK",
                        "custom_attributes": {},
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
                            bom_id,
                            v_id,
                            lvl,
                            p_id,
                            comp_type,
                            mat_name,
                            supp,
                            "IT",
                            uom,
                            cons,
                            waste,
                            0.0,
                            json.dumps([]),
                            json.dumps(bom_meta),
                        ),
                    )
                    imported_bom += 1
                conn.commit()

            return BulkImportCommitResponse(
                success=True,
                imported_items_count=imported_items,
                imported_variants_count=imported_variants,
                imported_bom_count=imported_bom,
                message=f"Importazione completata con successo: {imported_items} modelli PIM, {imported_variants} varianti PLM, {imported_bom} nodi BOM.",
            )
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Sprint 8 (FTL-TECH-022): Color Intelligence Engine & Colorway BOM Matrix
    # ========================================================================

    def _normalize_color_season_id(
        self,
        conn: sqlite3.Connection,
        season_id: Optional[str],
        season_ids: Optional[List[str]] = None,
    ) -> Optional[str]:
        candidate = season_id
        if (candidate is None or candidate == "") and season_ids:
            for s in season_ids:
                if s and s.strip() and s.strip().upper() != "ALL_CARRYOVER":
                    candidate = s.strip()
                    break
        if not candidate:
            return None
        cand_clean = candidate.strip()
        if not cand_clean or cand_clean.upper() == "ALL_CARRYOVER":
            return None
        row = conn.execute(
            "SELECT season_id FROM seasons WHERE season_id = ? OR code = ?",
            (cand_clean, cand_clean),
        ).fetchone()
        return row["season_id"] if row else None

    def _row_to_master_color(self, row: sqlite3.Row) -> MasterColor:
        cid = row["id"]
        sid = row["season_id"]
        sids = ["ALL_CARRYOVER"] if not sid else [sid]
        try:
            domains = json.loads(row["applicable_domains_json"] or "[]")
        except Exception:
            domains = ["pellame", "fodera", "suola", "minuterie"]
        return MasterColor(
            id=cid,
            color_id=cid,
            color_code=row["color_code"],
            technical_name_it=row["technical_name_it"],
            technical_name_en=row["technical_name_en"] or "",
            commercial_family=row["commercial_family"],
            hex_code=row["hex_code"],
            pantone_tcx_code=row["pantone_tcx_code"] or "",
            ral_code=row["ral_code"] or "",
            finish_type=row["finish_type"],
            applicable_domains=domains,
            season_id=sid,
            season_ids=sids,
            recipe_notes=row["recipe_notes"] or "",
            is_active=bool(row["is_active"]),
            created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
        )

    def list_master_colors(
        self,
        season_id: Optional[str] = None,
        commercial_family: Optional[str] = None,
        finish_type: Optional[str] = None,
        domain: Optional[str] = None,
        active_only: Any = False,
        search: Optional[str] = None,
    ) -> List[MasterColor]:
        conn = self.get_connection()
        try:
            sql = "SELECT * FROM master_colors WHERE 1=1"
            params: List[Any] = []
            if season_id:
                s_clean = season_id.strip()
                if s_clean.upper() in ("ALL_CARRYOVER", "CARRYOVER"):
                    sql += " AND season_id IS NULL"
                else:
                    sql += " AND season_id = ?"
                    params.append(s_clean)
            if commercial_family:
                sql += " AND LOWER(commercial_family) = LOWER(?)"
                params.append(commercial_family.strip())
            if finish_type:
                sql += " AND LOWER(finish_type) = LOWER(?)"
                params.append(finish_type.strip())
            is_active_only = (
                active_only is True
                or (isinstance(active_only, str) and active_only.strip().lower() in ("true", "1", "yes"))
            )
            if is_active_only:
                sql += " AND is_active = 1"
            if search and search.strip():
                like_q = f"%{search.strip().lower()}%"
                sql += (
                    " AND (LOWER(color_code) LIKE ? OR LOWER(technical_name_it) LIKE ? "
                    "OR LOWER(technical_name_en) LIKE ? OR LOWER(pantone_tcx_code) LIKE ? OR LOWER(ral_code) LIKE ?)"
                )
                params.extend([like_q, like_q, like_q, like_q, like_q])
            sql += " ORDER BY color_code ASC"
            rows = conn.execute(sql, params).fetchall()
            colors = [self._row_to_master_color(r) for r in rows]
            if domain and domain.strip():
                dom_low = domain.strip().lower()
                colors = [
                    c for c in colors if dom_low in [str(d).lower() for d in c.applicable_domains]
                ]
            return colors
        finally:
            self._close_if_file(conn)

    def get_master_color(self, color_id: str) -> Optional[MasterColor]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM master_colors WHERE id = ? OR color_code = ?",
                (color_id, color_id),
            ).fetchone()
            return self._row_to_master_color(row) if row else None
        finally:
            self._close_if_file(conn)

    def save_master_color(self, c_in: MasterColorCreate) -> MasterColor:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", c_in.hex_code or ""):
            raise ValueError(f"Invalid HEX code '{c_in.hex_code}'. Expected format #RRGGBB.")
        conn = self.get_connection()
        try:
            cid = (c_in.id or c_in.color_id or "").strip() or f"MCOL-{uuid4().hex[:8].upper()}"
            sid = self._normalize_color_season_id(conn, c_in.season_id, c_in.season_ids)
            now_iso = datetime.now(timezone.utc).isoformat()
            conn.execute(
                """
                INSERT INTO master_colors (
                    id, color_code, technical_name_it, technical_name_en, commercial_family,
                    hex_code, pantone_tcx_code, ral_code, finish_type, applicable_domains_json,
                    season_id, recipe_notes, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    color_code = excluded.color_code,
                    technical_name_it = excluded.technical_name_it,
                    technical_name_en = excluded.technical_name_en,
                    commercial_family = excluded.commercial_family,
                    hex_code = excluded.hex_code,
                    pantone_tcx_code = excluded.pantone_tcx_code,
                    ral_code = excluded.ral_code,
                    finish_type = excluded.finish_type,
                    applicable_domains_json = excluded.applicable_domains_json,
                    season_id = excluded.season_id,
                    recipe_notes = excluded.recipe_notes,
                    is_active = excluded.is_active
                """,
                (
                    cid,
                    c_in.color_code.strip().upper(),
                    c_in.technical_name_it.strip(),
                    (c_in.technical_name_en or "").strip(),
                    c_in.commercial_family.strip(),
                    c_in.hex_code.strip().upper(),
                    (c_in.pantone_tcx_code or "").strip(),
                    (c_in.ral_code or "").strip(),
                    c_in.finish_type.strip(),
                    json.dumps(c_in.applicable_domains or []),
                    sid,
                    c_in.recipe_notes or "",
                    1 if c_in.is_active else 0,
                    now_iso,
                ),
            )
            conn.commit()
            return self.get_master_color(cid)  # type: ignore
        finally:
            self._close_if_file(conn)

    def update_master_color(self, color_id: str, c_upd: MasterColorUpdate) -> Optional[MasterColor]:
        if c_upd.hex_code is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", c_upd.hex_code):
            raise ValueError(f"Invalid HEX code '{c_upd.hex_code}'. Expected format #RRGGBB.")
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM master_colors WHERE id = ? OR color_code = ?",
                (color_id, color_id),
            ).fetchone()
            if not row:
                return None
            real_id = row["id"]
            new_code = c_upd.color_code.strip().upper() if c_upd.color_code is not None else row["color_code"]
            new_it = c_upd.technical_name_it.strip() if c_upd.technical_name_it is not None else row["technical_name_it"]
            new_en = c_upd.technical_name_en.strip() if c_upd.technical_name_en is not None else row["technical_name_en"]
            new_fam = c_upd.commercial_family.strip() if c_upd.commercial_family is not None else row["commercial_family"]
            new_hex = c_upd.hex_code.strip().upper() if c_upd.hex_code is not None else row["hex_code"]
            new_pantone = c_upd.pantone_tcx_code.strip() if c_upd.pantone_tcx_code is not None else row["pantone_tcx_code"]
            new_ral = c_upd.ral_code.strip() if c_upd.ral_code is not None else row["ral_code"]
            new_finish = c_upd.finish_type.strip() if c_upd.finish_type is not None else row["finish_type"]
            new_domains_json = (
                json.dumps(c_upd.applicable_domains)
                if c_upd.applicable_domains is not None
                else row["applicable_domains_json"]
            )
            if c_upd.season_id is not None or c_upd.season_ids is not None:
                new_sid = self._normalize_color_season_id(conn, c_upd.season_id, c_upd.season_ids)
            else:
                new_sid = row["season_id"]
            new_notes = c_upd.recipe_notes if c_upd.recipe_notes is not None else row["recipe_notes"]
            new_active = (1 if c_upd.is_active else 0) if c_upd.is_active is not None else int(row["is_active"])

            conn.execute(
                """
                UPDATE master_colors
                SET color_code = ?, technical_name_it = ?, technical_name_en = ?,
                    commercial_family = ?, hex_code = ?, pantone_tcx_code = ?, ral_code = ?,
                    finish_type = ?, applicable_domains_json = ?, season_id = ?,
                    recipe_notes = ?, is_active = ?
                WHERE id = ?
                """,
                (
                    new_code,
                    new_it,
                    new_en,
                    new_fam,
                    new_hex,
                    new_pantone,
                    new_ral,
                    new_finish,
                    new_domains_json,
                    new_sid,
                    new_notes,
                    new_active,
                    real_id,
                ),
            )
            conn.commit()
            return self.get_master_color(real_id)
        finally:
            self._close_if_file(conn)

    def delete_master_color(self, color_id: str) -> Optional[Dict[str, str]]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT id FROM master_colors WHERE id = ? OR color_code = ?",
                (color_id, color_id),
            ).fetchone()
            if not row:
                return None
            real_id = row["id"]
            ref_count = 0
            for q, p in (
                ("SELECT COUNT(*) AS c FROM variant_colorway_bom_mappings WHERE master_color_id = ?", (real_id,)),
                ("SELECT COUNT(*) AS c FROM bom_items WHERE master_color_id = ?", (real_id,)),
                (
                    "SELECT COUNT(*) AS c FROM plm_production_variants WHERE primary_color_id = ? OR secondary_color_id = ? OR hardware_finish_color_id = ?",
                    (real_id, real_id, real_id),
                ),
                ("SELECT COUNT(*) AS c FROM tannery_batches WHERE master_color_id = ?", (real_id,)),
            ):
                r = conn.execute(q, p).fetchone()
                ref_count += int(r["c"]) if r else 0

            if ref_count > 0:
                conn.execute("UPDATE master_colors SET is_active = 0 WHERE id = ?", (real_id,))
                conn.commit()
                return {"status": "deactivated", "color_id": real_id}

            conn.execute("DELETE FROM master_colors WHERE id = ?", (real_id,))
            conn.commit()
            return {"status": "deleted", "color_id": real_id}
        finally:
            self._close_if_file(conn)

    @staticmethod
    def _default_part_role(component_type: str) -> str:
        mapping = {
            "upper": "tomaia_principale",
            "lining": "fodera_interna",
            "insole": "sottopiede",
            "outsole": "suola_fondo",
            "heel": "tacco",
            "hardware": "minuteria_accessori",
            "fabric": "riporto_secondario",
            "packaging": "packaging_scatola",
            "sub_assembly": "sotto_assieme_tecnico",
        }
        return mapping.get((component_type or "").lower(), "tomaia_principale")

    def _find_linked_tannery_batch_for_bom(
        self,
        conn: sqlite3.Connection,
        plm_variant_id: str,
        bom_row: sqlite3.Row,
        all_batches: List[sqlite3.Row],
    ) -> Optional[sqlite3.Row]:
        comp = (bom_row["component_type"] or "").lower()
        b_meta = json.loads(bom_row["metadata_json"] or "{}")
        custom_attrs = b_meta.get("custom_attributes") or {}
        explicit_bid = custom_attrs.get("tannery_batch_id") or custom_attrs.get("batch_code")
        lot_cert = str(b_meta.get("lot_certificate_id") or "")

        if explicit_bid:
            for tb in all_batches:
                if tb["batch_id"] == explicit_bid or tb["batch_code"] == explicit_bid:
                    return tb

        if comp not in ("upper", "lining"):
            return None

        for tb in all_batches:
            if lot_cert and (lot_cert == tb["batch_code"] or (tb["icec_certificate_id"] and lot_cert == tb["icec_certificate_id"])):
                return tb

        b_keys = bom_row.keys()
        b_vid = bom_row["vendor_id"] if "vendor_id" in b_keys else None
        if b_vid:
            for tb in all_batches:
                tb_vid = tb["vendor_id"] if "vendor_id" in tb.keys() else None
                if tb_vid and tb_vid == b_vid:
                    return tb

        b_sname = (bom_row["supplier_name"] or "").strip().lower()
        if b_sname:
            for tb in all_batches:
                if (tb["tannery_name"] or "").strip().lower() == b_sname:
                    return tb

        if comp == "upper":
            po_row = conn.execute(
                "SELECT tannery_batch_id FROM production_orders WHERE plm_variant_id = ? AND tannery_batch_id IS NOT NULL ORDER BY created_at DESC LIMIT 1",
                (plm_variant_id,),
            ).fetchone()
            if po_row and po_row["tannery_batch_id"]:
                for tb in all_batches:
                    if tb["batch_id"] == po_row["tannery_batch_id"]:
                        return tb

        return None

    def get_variant_colorway_matrix(self, variant_id: str) -> Optional[ColorwayMatrixResponse]:
        conn = self.get_connection()
        try:
            vr = conn.execute(
                "SELECT * FROM plm_production_variants WHERE plm_variant_id = ?",
                (variant_id,),
            ).fetchone()
            if not vr:
                return None

            v_keys = vr.keys()
            p_col = vr["primary_color_id"] if "primary_color_id" in v_keys else None
            s_col = vr["secondary_color_id"] if "secondary_color_id" in v_keys else None
            hw_col = vr["hardware_finish_color_id"] if "hardware_finish_color_id" in v_keys else None
            r_preset = (vr["colorway_rule_preset"] if "colorway_rule_preset" in v_keys else None) or "tone_on_tone"

            bom_rows = conn.execute(
                "SELECT * FROM bom_items WHERE plm_variant_id = ? ORDER BY level ASC, id ASC",
                (variant_id,),
            ).fetchall()

            map_rows = conn.execute(
                "SELECT * FROM variant_colorway_bom_mappings WHERE plm_variant_id = ?",
                (variant_id,),
            ).fetchall()
            map_by_bom: Dict[str, sqlite3.Row] = {mr["bom_item_id"]: mr for mr in map_rows}

            color_rows = conn.execute("SELECT * FROM master_colors").fetchall()
            colors_by_id: Dict[str, sqlite3.Row] = {cr["id"]: cr for cr in color_rows}

            all_batches = conn.execute("SELECT * FROM tannery_batches WHERE is_active = 1").fetchall()

            out_mappings: List[ColorwayBomMappingRow] = []
            mapped_count = 0
            approved_count = 0
            rejected_count = 0
            gate_blocked = False

            for br in bom_rows:
                bid = br["bom_item_id"]
                b_keys = br.keys()
                mr = map_by_bom.get(bid)
                mcol_id = (
                    mr["master_color_id"]
                    if mr is not None
                    else (br["master_color_id"] if "master_color_id" in b_keys else None)
                )
                crow = colors_by_id.get(mcol_id) if mcol_id else None

                lab_status = mr["lab_dip_status"] if mr is not None else "pending"
                delta_e = float(mr["delta_e_value"]) if (mr is not None and mr["delta_e_value"] is not None) else None
                part_role = mr["part_role"] if mr is not None else self._default_part_role(br["component_type"])
                galv = mr["galvanics_finish"] if mr is not None else None
                app_by = mr["approved_by"] if mr is not None else None
                app_at = self._parse_dt(mr["approved_at"]) if (mr is not None and mr["approved_at"]) else None
                notes = (mr["notes"] or "") if mr is not None else ""

                if mcol_id:
                    mapped_count += 1
                if lab_status in ("approved", "master_standard", "conditional_waiver"):
                    approved_count += 1
                if lab_status == "rejected":
                    rejected_count += 1
                    gate_blocked = True
                if delta_e is not None and delta_e > 2.5 and lab_status != "conditional_waiver":
                    gate_blocked = True

                linked_tb = self._find_linked_tannery_batch_for_bom(conn, variant_id, br, all_batches)
                t_consistency = "not_linked"
                linked_bcode: Optional[str] = None
                if linked_tb is not None:
                    linked_bcode = linked_tb["batch_code"]
                    tb_mcol = linked_tb["master_color_id"] if "master_color_id" in linked_tb.keys() else None
                    if mcol_id and tb_mcol:
                        t_consistency = "coherent" if mcol_id == tb_mcol else "mismatch"

                out_mappings.append(
                    ColorwayBomMappingRow(
                        id=mr["id"] if mr is not None else None,
                        plm_variant_id=variant_id,
                        bom_item_id=bid,
                        level=int(br["level"]),
                        parent_bom_item_id=br["parent_bom_item_id"],
                        component_type=br["component_type"],
                        material_name=br["material_name"],
                        supplier_name=br["supplier_name"],
                        vendor_id=br["vendor_id"] if "vendor_id" in b_keys else None,
                        master_color_id=mcol_id,
                        color_code=crow["color_code"] if crow is not None else None,
                        technical_name_it=crow["technical_name_it"] if crow is not None else None,
                        commercial_family=crow["commercial_family"] if crow is not None else None,
                        hex_code=crow["hex_code"] if crow is not None else None,
                        pantone_tcx_code=crow["pantone_tcx_code"] if crow is not None else None,
                        ral_code=crow["ral_code"] if crow is not None else None,
                        finish_type=crow["finish_type"] if crow is not None else None,
                        part_role=part_role,
                        galvanics_finish=galv,
                        lab_dip_status=lab_status,
                        delta_e_value=delta_e,
                        approved_by=app_by,
                        approved_at=app_at,
                        notes=notes,
                        tannery_color_consistency=t_consistency,
                        linked_batch_code=linked_bcode,
                    )
                )

            total_nodes = len(bom_rows)
            readiness_pct = round((approved_count / total_nodes) * 100.0, 1) if total_nodes > 0 else 0.0

            return ColorwayMatrixResponse(
                plm_variant_id=variant_id,
                variant_code=vr["variant_code"],
                colorway_name=vr["colorway_name"],
                primary_color_id=p_col,
                secondary_color_id=s_col,
                hardware_finish_color_id=hw_col,
                colorway_rule_preset=r_preset,
                total_bom_nodes=total_nodes,
                mapped_nodes_count=mapped_count,
                approved_nodes_count=approved_count,
                rejected_nodes_count=rejected_count,
                colorway_readiness_pct=readiness_pct,
                production_gate_blocked=gate_blocked,
                mappings=out_mappings,
            )
        finally:
            self._close_if_file(conn)

    def upsert_variant_colorway_matrix(
        self,
        variant_id: str,
        req: ColorwayMatrixUpsertRequest,
    ) -> Optional[ColorwayMatrixResponse]:
        conn = self.get_connection()
        try:
            vr = conn.execute(
                "SELECT * FROM plm_production_variants WHERE plm_variant_id = ?",
                (variant_id,),
            ).fetchone()
            if not vr:
                return None

            v_keys = vr.keys()
            new_p_col = (
                req.primary_color_id
                if req.primary_color_id is not None
                else (vr["primary_color_id"] if "primary_color_id" in v_keys else None)
            )
            new_s_col = (
                req.secondary_color_id
                if req.secondary_color_id is not None
                else (vr["secondary_color_id"] if "secondary_color_id" in v_keys else None)
            )
            new_hw_col = (
                req.hardware_finish_color_id
                if req.hardware_finish_color_id is not None
                else (vr["hardware_finish_color_id"] if "hardware_finish_color_id" in v_keys else None)
            )
            new_preset = (
                req.colorway_rule_preset
                if req.colorway_rule_preset is not None
                else ((vr["colorway_rule_preset"] if "colorway_rule_preset" in v_keys else None) or "tone_on_tone")
            )

            conn.execute(
                """
                UPDATE plm_production_variants
                SET primary_color_id = ?, secondary_color_id = ?,
                    hardware_finish_color_id = ?, colorway_rule_preset = ?
                WHERE plm_variant_id = ?
                """,
                (new_p_col, new_s_col, new_hw_col, new_preset, variant_id),
            )

            valid_bom_ids = {
                r["bom_item_id"]
                for r in conn.execute(
                    "SELECT bom_item_id FROM bom_items WHERE plm_variant_id = ?",
                    (variant_id,),
                ).fetchall()
            }

            now_iso = datetime.now(timezone.utc).isoformat()
            for item in req.mappings:
                if item.bom_item_id not in valid_bom_ids:
                    raise ValueError(
                        f"BOM Item '{item.bom_item_id}' does not belong to variant '{variant_id}'."
                    )
                if not item.master_color_id:
                    conn.execute(
                        "DELETE FROM variant_colorway_bom_mappings WHERE plm_variant_id = ? AND bom_item_id = ?",
                        (variant_id, item.bom_item_id),
                    )
                    conn.execute(
                        "UPDATE bom_items SET master_color_id = NULL WHERE plm_variant_id = ? AND bom_item_id = ?",
                        (variant_id, item.bom_item_id),
                    )
                    continue

                crow = conn.execute(
                    "SELECT id FROM master_colors WHERE id = ? OR color_code = ?",
                    (item.master_color_id, item.master_color_id),
                ).fetchone()
                if not crow:
                    raise ValueError(f"Master color '{item.master_color_id}' not found.")
                real_mcol_id = crow["id"]

                existing_mr = conn.execute(
                    "SELECT id, approved_at FROM variant_colorway_bom_mappings WHERE plm_variant_id = ? AND bom_item_id = ?",
                    (variant_id, item.bom_item_id),
                ).fetchone()
                map_id = existing_mr["id"] if existing_mr else f"CMAP-{uuid4().hex[:10].upper()}"

                if item.lab_dip_status in ("approved", "master_standard", "conditional_waiver"):
                    if item.approved_at is not None:
                        app_at_iso = (
                            item.approved_at.isoformat()
                            if isinstance(item.approved_at, datetime)
                            else str(item.approved_at)
                        )
                    elif existing_mr and existing_mr["approved_at"]:
                        app_at_iso = existing_mr["approved_at"]
                    else:
                        app_at_iso = now_iso
                else:
                    app_at_iso = None

                conn.execute(
                    """
                    INSERT INTO variant_colorway_bom_mappings (
                        id, plm_variant_id, bom_item_id, master_color_id,
                        part_role, galvanics_finish, lab_dip_status, delta_e_value,
                        approved_by, approved_at, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(plm_variant_id, bom_item_id) DO UPDATE SET
                        master_color_id = excluded.master_color_id,
                        part_role = excluded.part_role,
                        galvanics_finish = excluded.galvanics_finish,
                        lab_dip_status = excluded.lab_dip_status,
                        delta_e_value = excluded.delta_e_value,
                        approved_by = excluded.approved_by,
                        approved_at = excluded.approved_at,
                        notes = excluded.notes
                    """,
                    (
                        map_id,
                        variant_id,
                        item.bom_item_id,
                        real_mcol_id,
                        item.part_role or "tomaia_principale",
                        item.galvanics_finish,
                        item.lab_dip_status or "pending",
                        item.delta_e_value,
                        item.approved_by,
                        app_at_iso,
                        item.notes or "",
                    ),
                )
                conn.execute(
                    "UPDATE bom_items SET master_color_id = ? WHERE plm_variant_id = ? AND bom_item_id = ?",
                    (real_mcol_id, variant_id, item.bom_item_id),
                )

            conn.commit()
            return self.get_variant_colorway_matrix(variant_id)
        finally:
            self._close_if_file(conn)

    def explode_variant_colorways(
        self,
        source_variant_id: str,
        req: ExplodeColorwaysRequest,
    ) -> ExplodeColorwaysResponse:
        if not req.target_color_ids:
            raise ValueError("target_color_ids must contain at least one color ID.")
        conn = self.get_connection()
        try:
            vr = conn.execute(
                "SELECT * FROM plm_production_variants WHERE plm_variant_id = ?",
                (source_variant_id,),
            ).fetchone()
            if not vr:
                raise ValueError(f"Source variant '{source_variant_id}' not found.")

            pim_id = vr["pim_item_id"]
            var_meta = json.loads(vr["metadata_json"] or "{}")

            target_colors: List[MasterColor] = []
            for tcid in req.target_color_ids:
                crow = conn.execute(
                    "SELECT * FROM master_colors WHERE id = ? OR color_code = ?",
                    (tcid, tcid),
                ).fetchone()
                if not crow:
                    raise ValueError(f"Target MasterColor '{tcid}' not found.")
                target_colors.append(self._row_to_master_color(crow))

            all_color_ids = {
                r["id"] for r in conn.execute("SELECT id FROM master_colors").fetchall()
            }

            def _resolve_opt_color(cid: Optional[str]) -> Optional[str]:
                if not cid:
                    return None
                r = conn.execute(
                    "SELECT id FROM master_colors WHERE id = ? OR color_code = ?",
                    (cid, cid),
                ).fetchone()
                return r["id"] if r else None

            opt_lining = _resolve_opt_color(req.lining_color_id)
            opt_sole = _resolve_opt_color(req.sole_color_id)
            opt_hw = _resolve_opt_color(req.hardware_color_id)

            old_bom_rows = conn.execute(
                "SELECT * FROM bom_items WHERE plm_variant_id = ? ORDER BY level ASC, id ASC",
                (source_variant_id,),
            ).fetchall()

            src_mappings: Dict[str, str] = {
                mr["bom_item_id"]: mr["master_color_id"]
                for mr in conn.execute(
                    "SELECT bom_item_id, master_color_id FROM variant_colorway_bom_mappings WHERE plm_variant_id = ?",
                    (source_variant_id,),
                ).fetchall()
            }

            base_code_raw = vr["variant_code"].strip().upper()
            # Keep concise base prefix before exploding
            base_parts = base_code_raw.split("-")
            base_prefix = "-".join(base_parts[:3]) if len(base_parts) >= 4 else base_code_raw

            created_variants: List[PlmProductionVariant] = []
            now_dt = datetime.now(timezone.utc)
            now_iso = now_dt.isoformat()

            for t_color in target_colors:
                new_var_id = f"PLM-VAR-{uuid4().hex[:8].upper()}"
                slug = re.sub(r"[^A-Z0-9]+", "-", t_color.color_code.upper().replace("COL-", "").replace("MCOL-", "")).strip("-")
                if not slug:
                    slug = t_color.id[-6:].upper()
                candidate_vcode = f"{base_prefix}-{slug}"
                suffix_idx = 2
                while conn.execute(
                    "SELECT 1 FROM plm_production_variants WHERE variant_code = ?",
                    (candidate_vcode,),
                ).fetchone():
                    candidate_vcode = f"{base_prefix}-{slug}-{suffix_idx}"
                    suffix_idx += 1

                if req.rule_preset == "luxury_gold_hardware":
                    hw_finish_col = opt_hw or ("MCOL-GLD-010" if "MCOL-GLD-010" in all_color_ids else t_color.id)
                elif req.rule_preset == "luxury_palladium_hardware":
                    hw_finish_col = opt_hw or ("MCOL-SLV-011" if "MCOL-SLV-011" in all_color_ids else t_color.id)
                else:
                    hw_finish_col = opt_hw

                if req.rule_preset == "contrast_white_sole":
                    sec_col = opt_sole or ("MCOL-WHT-004" if "MCOL-WHT-004" in all_color_ids else t_color.id)
                else:
                    sec_col = opt_sole or opt_lining

                id_remap: Dict[str, str] = {
                    b["bom_item_id"]: f"BOM-{uuid4().hex[:8].upper()}" for b in old_bom_rows
                }
                cloned_bom_items: List[BomItem] = []
                mappings_to_insert: List[Tuple[Any, ...]] = []

                for b in old_bom_rows:
                    old_bid = b["bom_item_id"]
                    new_bid = id_remap[old_bid]
                    new_pid = id_remap.get(b["parent_bom_item_id"]) if b["parent_bom_item_id"] else None
                    comp = (b["component_type"] or "").lower()
                    b_keys = b.keys()
                    src_b_color = src_mappings.get(old_bid) or (
                        b["master_color_id"] if "master_color_id" in b_keys else None
                    )
                    if src_b_color and src_b_color not in all_color_ids:
                        src_b_color = None

                    galv_finish: Optional[str] = None
                    lab_status = "pending"
                    app_at_val: Optional[str] = None
                    app_by_val: Optional[str] = None
                    part_role = self._default_part_role(comp)

                    if comp in ("upper", "fabric", "sub_assembly", "heel", "insole"):
                        assigned_col = t_color.id
                        lab_status = "pending"
                    elif comp == "lining":
                        assigned_col = (
                            opt_lining
                            or src_b_color
                            or ("MCOL-TAN-002" if "MCOL-TAN-002" in all_color_ids else t_color.id)
                        )
                        lab_status = "pending"
                    elif comp == "outsole":
                        if req.rule_preset == "contrast_white_sole":
                            assigned_col = opt_sole or (
                                "MCOL-WHT-004" if "MCOL-WHT-004" in all_color_ids else t_color.id
                            )
                        else:
                            assigned_col = opt_sole or t_color.id
                        lab_status = "pending"
                    elif comp == "hardware":
                        if req.rule_preset == "luxury_gold_hardware":
                            assigned_col = opt_hw or (
                                "MCOL-GLD-010" if "MCOL-GLD-010" in all_color_ids else t_color.id
                            )
                            galv_finish = "oro_chiaro_24k"
                            lab_status = "master_standard"
                            app_at_val = now_iso
                            app_by_val = "Color Intelligence Engine (Preset Galvanica Oro 24K)"
                        elif req.rule_preset == "luxury_palladium_hardware":
                            assigned_col = opt_hw or (
                                "MCOL-SLV-011" if "MCOL-SLV-011" in all_color_ids else t_color.id
                            )
                            galv_finish = "palladio_lucido"
                            lab_status = "master_standard"
                            app_at_val = now_iso
                            app_by_val = "Color Intelligence Engine (Preset Palladio)"
                        else:
                            assigned_col = opt_hw or src_b_color or t_color.id
                            lab_status = "master_standard" if opt_hw else "pending"
                            if lab_status == "master_standard":
                                app_at_val = now_iso
                    elif comp == "packaging":
                        assigned_col = (
                            src_b_color
                            or ("MCOL-ECR-005" if "MCOL-ECR-005" in all_color_ids else t_color.id)
                        )
                        lab_status = "master_standard"
                        app_at_val = now_iso
                    else:
                        assigned_col = t_color.id

                    b_meta = json.loads(b["metadata_json"] or "{}")
                    cloned_bom_items.append(
                        BomItem(
                            bom_item_id=new_bid,
                            level=int(b["level"]),
                            parent_bom_item_id=new_pid,
                            component_type=BomComponentType(b["component_type"]),
                            material_name=b["material_name"],
                            supplier_name=b["supplier_name"],
                            vendor_id=b["vendor_id"] if "vendor_id" in b_keys else None,
                            master_color_id=assigned_col,
                            origin_country_iso2=b["origin_country_iso2"],
                            unit_of_measure=b["unit_of_measure"],
                            unit_consumption=float(b["unit_consumption"]),
                            waste_percentage=float(b["waste_percentage"]),
                            recycled_content_pct=float(b["recycled_content_pct"]),
                            certifications=json.loads(b["certifications_json"] or "[]"),
                            unit_cost_eur=float(b_meta.get("unit_cost_eur", 10.0)),
                            lot_certificate_id=str(b_meta.get("lot_certificate_id", "CERT-ESPR-EXPLODED")),
                            custom_attributes=b_meta.get("custom_attributes", {}),
                        )
                    )
                    mappings_to_insert.append(
                        (
                            f"CMAP-{uuid4().hex[:10].upper()}",
                            new_var_id,
                            new_bid,
                            assigned_col,
                            part_role,
                            galv_finish,
                            lab_status,
                            None,
                            app_by_val,
                            app_at_val,
                            f"Generato da 1-Click Colorway Explosion ({req.rule_preset})",
                        )
                    )

                new_variant = PlmProductionVariant(
                    plm_variant_id=new_var_id,
                    pim_item_id=pim_id,
                    collection_id=vr["collection_id"],
                    variant_code=candidate_vcode,
                    colorway_name=t_color.technical_name_it,
                    size_range=vr["size_range"],
                    last_or_pattern_code=vr["last_or_pattern_code"],
                    lifecycle_status=PlmLifecycleStatus.PROTOTYPE,
                    bom_version="v1.0 (Colorway Exploded)",
                    bom_snapshot_locked=False,
                    sample_base_size=str(var_meta.get("sample_base_size", "42")),
                    size_grading_step_pct=float(var_meta.get("size_grading_step_pct", 2.8)),
                    standard_labor_cost_eur=float(var_meta.get("standard_labor_cost_eur", 28.0)),
                    target_gender=var_meta.get("target_gender", "unisex"),
                    category_id=var_meta.get("category_id"),
                    sub_category_id=var_meta.get("sub_category_id"),
                    construction_type=var_meta.get("construction_type", "cassetta_cucita"),
                    carryover_status=var_meta.get("carryover_status", "seasonal_core"),
                    primary_color_id=t_color.id,
                    secondary_color_id=sec_col,
                    hardware_finish_color_id=hw_finish_col,
                    colorway_rule_preset=req.rule_preset,
                    category_specific_specs=var_meta.get("category_specific_specs", {}),
                    custom_attributes=var_meta.get("custom_attributes", {}),
                    bom_items=cloned_bom_items,
                    subcontractor_assignments=[],
                    created_at=now_dt,
                )

                self._insert_variant_in_tx(conn, pim_id, new_variant)
                for m_tuple in mappings_to_insert:
                    conn.execute(
                        """
                        INSERT INTO variant_colorway_bom_mappings (
                            id, plm_variant_id, bom_item_id, master_color_id,
                            part_role, galvanics_finish, lab_dip_status, delta_e_value,
                            approved_by, approved_at, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        m_tuple,
                    )
                created_variants.append(new_variant)

            conn.commit()
            return ExplodeColorwaysResponse(
                source_variant_id=source_variant_id,
                pim_item_id=pim_id,
                rule_preset=req.rule_preset,
                created_count=len(created_variants),
                created_variants=created_variants,
            )
        finally:
            self._close_if_file(conn)

    def get_tannery_color_consistency(self) -> List[TanneryColorConsistencyItem]:
        conn = self.get_connection()
        try:
            batches = conn.execute(
                "SELECT * FROM tannery_batches ORDER BY created_at DESC"
            ).fetchall()
            colors_by_id = {
                r["id"]: r for r in conn.execute("SELECT * FROM master_colors").fetchall()
            }
            leather_boms = conn.execute(
                """
                SELECT bi.*, pv.variant_code, cmap.master_color_id AS mapped_color_id
                FROM bom_items bi
                JOIN plm_production_variants pv ON bi.plm_variant_id = pv.plm_variant_id
                LEFT JOIN variant_colorway_bom_mappings cmap
                    ON cmap.plm_variant_id = bi.plm_variant_id AND cmap.bom_item_id = bi.bom_item_id
                WHERE bi.component_type IN ('upper', 'lining')
                ORDER BY pv.variant_code ASC, bi.level ASC
                """
            ).fetchall()
            po_links = conn.execute(
                "SELECT plm_variant_id, tannery_batch_id FROM production_orders WHERE tannery_batch_id IS NOT NULL"
            ).fetchall()
            variants_by_batch: Dict[str, set] = {}
            for po in po_links:
                variants_by_batch.setdefault(po["tannery_batch_id"], set()).add(po["plm_variant_id"])

            results: List[TanneryColorConsistencyItem] = []
            for tb in batches:
                tb_keys = tb.keys()
                tb_vid = tb["vendor_id"] if "vendor_id" in tb_keys else None
                tb_mcol = tb["master_color_id"] if "master_color_id" in tb_keys else None
                tb_color_row = colors_by_id.get(tb_mcol) if tb_mcol else None

                matched_boms: List[sqlite3.Row] = []
                for bi in leather_boms:
                    bi_keys = bi.keys()
                    bi_vid = bi["vendor_id"] if "vendor_id" in bi_keys else None
                    b_meta = json.loads(bi["metadata_json"] or "{}")
                    lot_cert = str(b_meta.get("lot_certificate_id") or "")
                    c_attrs = b_meta.get("custom_attributes") or {}
                    exp_batch = c_attrs.get("tannery_batch_id") or c_attrs.get("batch_code")

                    is_match = False
                    if exp_batch and exp_batch in (tb["batch_id"], tb["batch_code"]):
                        is_match = True
                    elif lot_cert and (lot_cert == tb["batch_code"] or (tb["icec_certificate_id"] and lot_cert == tb["icec_certificate_id"])):
                        is_match = True
                    elif tb_vid and bi_vid and tb_vid == bi_vid:
                        is_match = True
                    elif (tb["tannery_name"] or "").strip().lower() == (bi["supplier_name"] or "").strip().lower():
                        is_match = True
                    elif bi["component_type"] == "upper" and bi["plm_variant_id"] in variants_by_batch.get(tb["batch_id"], set()):
                        is_match = True

                    if is_match:
                        matched_boms.append(bi)

                if not matched_boms:
                    results.append(
                        TanneryColorConsistencyItem(
                            batch_id=tb["batch_id"],
                            batch_code=tb["batch_code"],
                            tannery_name=tb["tannery_name"],
                            vendor_id=tb_vid,
                            batch_master_color_id=tb_mcol,
                            batch_color_code=tb_color_row["color_code"] if tb_color_row else None,
                            batch_color_name_it=tb_color_row["technical_name_it"] if tb_color_row else None,
                            batch_hex_code=tb_color_row["hex_code"] if tb_color_row else None,
                            status="unmapped",
                            message="Nessun nodo BOM pellame collegato a questo lotto conceria.",
                        )
                    )
                    continue

                for bi in matched_boms:
                    bi_keys = bi.keys()
                    bom_mcol = bi["mapped_color_id"] or (
                        bi["master_color_id"] if "master_color_id" in bi_keys else None
                    )
                    bom_color_row = colors_by_id.get(bom_mcol) if bom_mcol else None
                    if not tb_mcol or not bom_mcol:
                        st = "unmapped"
                        msg = "Colore Master non ancora assegnato su lotto conceria o su nodo BOM."
                    elif tb_mcol == bom_mcol:
                        st = "coherent"
                        msg = f"Coerenza cromatica verificata ({tb_color_row['color_code'] if tb_color_row else tb_mcol})."
                    else:
                        st = "mismatch"
                        msg = (
                            f"Disallineamento colore: Lotto Conceria={tb_color_row['color_code'] if tb_color_row else tb_mcol} "
                            f"vs Nodo BOM={bom_color_row['color_code'] if bom_color_row else bom_mcol}."
                        )
                    results.append(
                        TanneryColorConsistencyItem(
                            batch_id=tb["batch_id"],
                            batch_code=tb["batch_code"],
                            tannery_name=tb["tannery_name"],
                            vendor_id=tb_vid,
                            batch_master_color_id=tb_mcol,
                            batch_color_code=tb_color_row["color_code"] if tb_color_row else None,
                            batch_color_name_it=tb_color_row["technical_name_it"] if tb_color_row else None,
                            batch_hex_code=tb_color_row["hex_code"] if tb_color_row else None,
                            plm_variant_id=bi["plm_variant_id"],
                            variant_code=bi["variant_code"],
                            bom_item_id=bi["bom_item_id"],
                            bom_material_name=bi["material_name"],
                            bom_master_color_id=bom_mcol,
                            bom_color_code=bom_color_row["color_code"] if bom_color_row else None,
                            bom_color_name_it=bom_color_row["technical_name_it"] if bom_color_row else None,
                            bom_hex_code=bom_color_row["hex_code"] if bom_color_row else None,
                            status=st,
                            message=msg,
                        )
                    )
            return results
        finally:
            self._close_if_file(conn)

    def get_pim_colorways_ecommerce(self, pim_item_id: str) -> Optional[PimColorwaysEcommerceResponse]:
        conn = self.get_connection()
        try:
            pim_row = conn.execute(
                "SELECT pim_item_id, sku_code, model_name FROM pim_commercial_items WHERE pim_item_id = ?",
                (pim_item_id,),
            ).fetchone()
            if not pim_row:
                return None

            var_rows = conn.execute(
                "SELECT * FROM plm_production_variants WHERE pim_item_id = ? ORDER BY created_at ASC",
                (pim_item_id,),
            ).fetchall()
            colors_by_id = {
                r["id"]: r for r in conn.execute("SELECT * FROM master_colors").fetchall()
            }

            families: List[str] = []
            variants_map: List[PimVariantColorEcommerceItem] = []

            for vr in var_rows:
                vid = vr["plm_variant_id"]
                v_keys = vr.keys()
                mcol_id = vr["primary_color_id"] if "primary_color_id" in v_keys else None
                if not mcol_id:
                    mr = conn.execute(
                        """
                        SELECT cmap.master_color_id
                        FROM variant_colorway_bom_mappings cmap
                        JOIN bom_items bi ON bi.plm_variant_id = cmap.plm_variant_id AND bi.bom_item_id = cmap.bom_item_id
                        WHERE cmap.plm_variant_id = ?
                        ORDER BY CASE WHEN bi.component_type = 'upper' THEN 0 ELSE 1 END, bi.level ASC
                        LIMIT 1
                        """,
                        (vid,),
                    ).fetchone()
                    if mr:
                        mcol_id = mr["master_color_id"]
                if not mcol_id:
                    br = conn.execute(
                        """
                        SELECT master_color_id FROM bom_items
                        WHERE plm_variant_id = ? AND master_color_id IS NOT NULL
                        ORDER BY CASE WHEN component_type = 'upper' THEN 0 ELSE 1 END, level ASC
                        LIMIT 1
                        """,
                        (vid,),
                    ).fetchone()
                    if br:
                        mcol_id = br["master_color_id"]

                crow = colors_by_id.get(mcol_id) if mcol_id else None
                if crow is not None:
                    fam = crow["commercial_family"]
                    item_entry = PimVariantColorEcommerceItem(
                        plm_variant_id=vid,
                        variant_code=vr["variant_code"],
                        colorway_name=vr["colorway_name"],
                        master_color_id=crow["id"],
                        color_code=crow["color_code"],
                        technical_name_it=crow["technical_name_it"],
                        technical_name_en=crow["technical_name_en"] or "",
                        commercial_family=fam,
                        hex_code=crow["hex_code"],
                        pantone_tcx_code=crow["pantone_tcx_code"] or "",
                        finish_type=crow["finish_type"],
                    )
                else:
                    cname_low = (vr["colorway_name"] or "").lower()
                    if any(k in cname_low for k in ("nero", "black", "antracite")):
                        fam, hx = "Nero / Black", "#141414"
                    elif any(k in cname_low for k in ("cuoio", "cognac", "moro", "tan", "brown")):
                        fam, hx = "Cuoio & Marrone", "#C68B59"
                    elif any(k in cname_low for k in ("bordeaux", "rosso", "red", "amaranto")):
                        fam, hx = "Rosso & Bordeaux", "#5E1914"
                    elif any(k in cname_low for k in ("oliva", "verde", "bosco", "green")):
                        fam, hx = "Verde / Green", "#2D4028"
                    elif any(k in cname_low for k in ("blu", "navy", "oceano")):
                        fam, hx = "Blu / Blue", "#1B2A4A"
                    elif any(k in cname_low for k in ("bianco", "avorio", "white", "ecru")):
                        fam, hx = "Bianco & Neutri", "#F8F8F6"
                    else:
                        fam, hx = "Neutri & Classici", "#6E737B"
                    item_entry = PimVariantColorEcommerceItem(
                        plm_variant_id=vid,
                        variant_code=vr["variant_code"],
                        colorway_name=vr["colorway_name"],
                        master_color_id=None,
                        color_code=None,
                        technical_name_it=vr["colorway_name"],
                        technical_name_en=vr["colorway_name"],
                        commercial_family=fam,
                        hex_code=hx,
                        pantone_tcx_code="",
                        finish_type="pieno_fiore_naturale",
                    )

                if item_entry.commercial_family not in families:
                    families.append(item_entry.commercial_family)
                variants_map.append(item_entry)

            return PimColorwaysEcommerceResponse(
                pim_item_id=pim_row["pim_item_id"],
                sku_code=pim_row["sku_code"],
                model_name=pim_row["model_name"],
                commercial_color_families=families,
                variants_color_map=variants_map,
            )
        finally:
            self._close_if_file(conn)

    # ========================================================================
    # Sprint 8 (FTL-TECH-023): Vendor Hub 360, SHA-256 Certs, L6 & Where-Used
    # ========================================================================

    @staticmethod
    def compute_vendor_rating(quality_score: float, otd_score: float, esg_score: float) -> Tuple[float, str]:
        overall = round(0.40 * float(quality_score) + 0.30 * float(otd_score) + 0.30 * float(esg_score), 1)
        if overall >= 90.0:
            r_class = "A+"
        elif overall >= 75.0:
            r_class = "A"
        elif overall >= 60.0:
            r_class = "B"
        else:
            r_class = "C"
        return overall, r_class

    @staticmethod
    def compute_cert_expiry_and_status(valid_until: str, stored_status: Optional[str] = None) -> Tuple[int, str]:
        try:
            exp_date = date.fromisoformat(str(valid_until).strip()[:10])
            days = (exp_date - date.today()).days
        except Exception:
            days = 365
        if stored_status == "revoked":
            return days, "revoked"
        if days < 0:
            return days, "expired"
        if days <= 60:
            return days, "expiring_soon"
        return days, "valid"

    @staticmethod
    def _apply_vendor_l6_segregation(vendor_dict: Dict[str, Any], viewer_role: str = "brand") -> Dict[str, Any]:
        """Centralized ADR-006 & ADR-011 L6 Cost/Commercial/Rating Segregation Guard."""
        role_norm = (viewer_role or "brand").strip().lower()
        if role_norm != "brand":
            for l6_field in (
                "quality_score",
                "otd_score",
                "esg_score",
                "overall_rating",
                "rating_class",
                "moq_description",
                "payment_terms_l6",
                "hourly_or_unit_rate_eur_l6",
                "negotiated_price_list_l6",
                "internal_audit_notes_l6",
            ):
                vendor_dict[l6_field] = None
            vendor_dict["l6_segregated"] = True
        else:
            vendor_dict["l6_segregated"] = False
        return vendor_dict

    def _row_to_vendor_cert(self, row: sqlite3.Row) -> VendorCertification:
        days, dyn_status = self.compute_cert_expiry_and_status(row["valid_until"], row["status"])
        return VendorCertification(
            cert_id=row["cert_id"],
            vendor_id=row["vendor_id"],
            cert_type=row["cert_type"],
            cert_code=row["cert_code"],
            issuing_body=row["issuing_body"],
            valid_from=row["valid_from"],
            valid_until=row["valid_until"],
            days_to_expiry=days,
            sha256_hash=row["sha256_hash"],
            status=dyn_status,
        )

    def _row_to_vendor_record(
        self,
        conn: sqlite3.Connection,
        row: sqlite3.Row,
        viewer_role: str = "brand",
    ) -> VendorRecord:
        vid = row["vendor_id"]
        cert_rows = conn.execute(
            "SELECT * FROM vendor_certifications WHERE vendor_id = ? ORDER BY valid_until ASC",
            (vid,),
        ).fetchall()
        certs = [self._row_to_vendor_cert(cr) for cr in cert_rows]

        q_score = float(row["quality_score"])
        o_score = float(row["otd_score"])
        e_score = float(row["esg_score"])
        overall, r_class = self.compute_vendor_rating(q_score, o_score, e_score)

        qual_status = row["qualification_status"]
        has_expired = (qual_status == "blocked_expired_certs") or any(
            c.status in ("expired", "revoked") for c in certs
        )
        if has_expired:
            semaphore = "red"
        elif len(certs) == 0 or any(c.status == "expiring_soon" for c in certs):
            semaphore = "yellow"
        else:
            semaphore = "green"

        try:
            price_list = json.loads(row["negotiated_price_list_json_l6"] or "[]")
        except Exception:
            price_list = []

        raw_dict: Dict[str, Any] = {
            "vendor_id": vid,
            "vendor_code": row["vendor_code"],
            "company_name": row["company_name"],
            "vat_number": row["vat_number"],
            "supply_chain_role": row["supply_chain_role"],
            "district_area": row["district_area"],
            "city_address": row["city_address"] or "",
            "country_iso2": row["country_iso2"] or "IT",
            "paas_tier": row["paas_tier"],
            "qualification_status": qual_status,
            "quality_score": q_score,
            "otd_score": o_score,
            "esg_score": e_score,
            "overall_rating": overall,
            "rating_class": r_class,
            "standard_lead_time_days": int(row["standard_lead_time_days"]),
            "moq_description": row["moq_description"],
            "payment_terms_l6": row["payment_terms_l6"],
            "hourly_or_unit_rate_eur_l6": float(row["hourly_or_unit_rate_eur_l6"]),
            "negotiated_price_list_l6": price_list,
            "internal_audit_notes_l6": row["internal_audit_notes_l6"] or "",
            "contact_email": row["contact_email"] or "",
            "district_company_id": row["district_company_id"] if "district_company_id" in row.keys() else None,
            "district_company": None,
            "is_active": bool(row["is_active"]),
            "certifications": certs,
            "has_expired_critical_certs": has_expired,
            "cert_semaphore_status": semaphore,
            "l6_segregated": False,
            "created_at": self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
        }
        if raw_dict["district_company_id"]:
            c_row = conn.execute(
                "SELECT company_id, legal_name, business_name, vat_number, district, company_tier, business_type, contact_email FROM companies WHERE company_id = ?",
                (raw_dict["district_company_id"],),
            ).fetchone()
            if c_row:
                raw_dict["district_company"] = {
                    "company_id": c_row["company_id"],
                    "legal_name": c_row["legal_name"],
                    "business_name": c_row["business_name"],
                    "vat_number": c_row["vat_number"],
                    "district": c_row["district"],
                    "company_tier": c_row["company_tier"],
                    "business_type": c_row["business_type"],
                    "contact_email": c_row["contact_email"],
                }
        segregated = self._apply_vendor_l6_segregation(raw_dict, viewer_role=viewer_role)
        return VendorRecord(**segregated)

    def list_vendors(
        self,
        viewer_role: str = "brand",
        supply_chain_role: Optional[str] = None,
        district_area: Optional[str] = None,
        qualification_status: Optional[str] = None,
        paas_tier: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[VendorRecord]:
        conn = self.get_connection()
        try:
            sql = "SELECT * FROM vendors_registry WHERE 1=1"
            params: List[Any] = []
            if supply_chain_role and supply_chain_role.strip():
                sql += " AND LOWER(supply_chain_role) = LOWER(?)"
                params.append(supply_chain_role.strip())
            if district_area and district_area.strip():
                sql += " AND LOWER(district_area) LIKE ?"
                params.append(f"%{district_area.strip().lower()}%")
            if qualification_status and qualification_status.strip():
                sql += " AND LOWER(qualification_status) = LOWER(?)"
                params.append(qualification_status.strip())
            if paas_tier and paas_tier.strip():
                sql += " AND LOWER(paas_tier) = LOWER(?)"
                params.append(paas_tier.strip())
            if search and search.strip():
                like_q = f"%{search.strip().lower()}%"
                sql += (
                    " AND (LOWER(vendor_code) LIKE ? OR LOWER(company_name) LIKE ? "
                    "OR LOWER(vat_number) LIKE ? OR LOWER(district_area) LIKE ?)"
                )
                params.extend([like_q, like_q, like_q, like_q])
            sql += " ORDER BY vendor_code ASC"
            rows = conn.execute(sql, params).fetchall()
            return [self._row_to_vendor_record(conn, r, viewer_role=viewer_role) for r in rows]
        finally:
            self._close_if_file(conn)

    def get_vendor(self, vendor_id: str, viewer_role: str = "brand") -> Optional[VendorRecord]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM vendors_registry WHERE vendor_id = ? OR vendor_code = ?",
                (vendor_id, vendor_id),
            ).fetchone()
            return self._row_to_vendor_record(conn, row, viewer_role=viewer_role) if row else None
        finally:
            self._close_if_file(conn)

    def _insert_vendor_cert_in_tx(
        self,
        conn: sqlite3.Connection,
        vendor_id: str,
        c_in: VendorCertificationCreate,
    ) -> str:
        cid = (c_in.cert_id or "").strip() or f"VCERT-{uuid4().hex[:8].upper()}"
        _, dyn_status = self.compute_cert_expiry_and_status(c_in.valid_until, c_in.status)
        sha_val = (c_in.sha256_hash or "").strip()
        if not sha_val or len(sha_val) != 64:
            sha_val = hashlib.sha256(
                f"{vendor_id}:{c_in.cert_type}:{c_in.cert_code}:{c_in.valid_until}".encode("utf-8")
            ).hexdigest()
        conn.execute(
            """
            INSERT INTO vendor_certifications (
                cert_id, vendor_id, cert_type, cert_code, issuing_body,
                valid_from, valid_until, sha256_hash, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(cert_id) DO UPDATE SET
                cert_type = excluded.cert_type,
                cert_code = excluded.cert_code,
                issuing_body = excluded.issuing_body,
                valid_from = excluded.valid_from,
                valid_until = excluded.valid_until,
                sha256_hash = excluded.sha256_hash,
                status = excluded.status
            """,
            (
                cid,
                vendor_id,
                c_in.cert_type.strip(),
                c_in.cert_code.strip(),
                c_in.issuing_body.strip(),
                c_in.valid_from.strip(),
                c_in.valid_until.strip(),
                sha_val,
                dyn_status,
            ),
        )
        return cid

    def save_vendor(self, v_in: VendorCreate, viewer_role: str = "brand") -> VendorRecord:
        conn = self.get_connection()
        try:
            vid = (v_in.vendor_id or "").strip() or f"VND-{uuid4().hex[:8].upper()}"
            vcode = (v_in.vendor_code or "").strip().upper()
            if not vcode:
                prefix = "TER" if v_in.paas_tier == "subcontractor_zero_eur" else "FOR"
                vcode = f"{prefix}-{uuid4().hex[:6].upper()}"
            overall, _ = self.compute_vendor_rating(v_in.quality_score, v_in.otd_score, v_in.esg_score)
            rate_val = 0.0 if v_in.paas_tier == "subcontractor_zero_eur" and v_in.hourly_or_unit_rate_eur_l6 == 0 else v_in.hourly_or_unit_rate_eur_l6
            now_iso = datetime.now(timezone.utc).isoformat()

            conn.execute(
                """
                INSERT INTO vendors_registry (
                    vendor_id, vendor_code, company_name, vat_number, supply_chain_role,
                    district_area, city_address, country_iso2, paas_tier, qualification_status,
                    quality_score, otd_score, esg_score, overall_rating, standard_lead_time_days,
                    moq_description, payment_terms_l6, hourly_or_unit_rate_eur_l6,
                    negotiated_price_list_json_l6, internal_audit_notes_l6, contact_email,
                    district_company_id, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(vendor_id) DO UPDATE SET
                    vendor_code = excluded.vendor_code,
                    company_name = excluded.company_name,
                    vat_number = excluded.vat_number,
                    supply_chain_role = excluded.supply_chain_role,
                    district_area = excluded.district_area,
                    city_address = excluded.city_address,
                    country_iso2 = excluded.country_iso2,
                    paas_tier = excluded.paas_tier,
                    qualification_status = excluded.qualification_status,
                    quality_score = excluded.quality_score,
                    otd_score = excluded.otd_score,
                    esg_score = excluded.esg_score,
                    overall_rating = excluded.overall_rating,
                    standard_lead_time_days = excluded.standard_lead_time_days,
                    moq_description = excluded.moq_description,
                    payment_terms_l6 = excluded.payment_terms_l6,
                    hourly_or_unit_rate_eur_l6 = excluded.hourly_or_unit_rate_eur_l6,
                    negotiated_price_list_json_l6 = excluded.negotiated_price_list_json_l6,
                    internal_audit_notes_l6 = excluded.internal_audit_notes_l6,
                    contact_email = excluded.contact_email,
                    district_company_id = COALESCE(excluded.district_company_id, vendors_registry.district_company_id),
                    is_active = excluded.is_active
                """,
                (
                    vid,
                    vcode,
                    v_in.company_name.strip(),
                    v_in.vat_number.strip(),
                    v_in.supply_chain_role.strip(),
                    v_in.district_area.strip(),
                    (v_in.city_address or "").strip(),
                    (v_in.country_iso2 or "IT").strip().upper(),
                    v_in.paas_tier.strip(),
                    v_in.qualification_status.strip(),
                    float(v_in.quality_score),
                    float(v_in.otd_score),
                    float(v_in.esg_score),
                    overall,
                    int(v_in.standard_lead_time_days),
                    v_in.moq_description or "",
                    v_in.payment_terms_l6 or "",
                    float(rate_val),
                    json.dumps(v_in.negotiated_price_list_l6 or []),
                    v_in.internal_audit_notes_l6 or "",
                    (v_in.contact_email or "").strip(),
                    v_in.district_company_id,
                    1 if v_in.is_active else 0,
                    now_iso,
                ),
            )

            for cert_in in v_in.initial_certifications:
                self._insert_vendor_cert_in_tx(conn, vid, cert_in)

            # Backfill any existing bom_items or tannery_batches matching company_name without vendor_id
            conn.execute(
                "UPDATE bom_items SET vendor_id = ? WHERE vendor_id IS NULL AND LOWER(supplier_name) = LOWER(?)",
                (vid, v_in.company_name.strip()),
            )
            conn.execute(
                "UPDATE tannery_batches SET vendor_id = ? WHERE vendor_id IS NULL AND LOWER(tannery_name) = LOWER(?)",
                (vid, v_in.company_name.strip()),
            )

            conn.commit()
            return self.get_vendor(vid, viewer_role=viewer_role)  # type: ignore
        finally:
            self._close_if_file(conn)

    def update_vendor(
        self,
        vendor_id: str,
        v_upd: VendorUpdate,
        viewer_role: str = "brand",
    ) -> Optional[VendorRecord]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM vendors_registry WHERE vendor_id = ? OR vendor_code = ?",
                (vendor_id, vendor_id),
            ).fetchone()
            if not row:
                return None
            real_vid = row["vendor_id"]

            new_code = v_upd.vendor_code.strip().upper() if v_upd.vendor_code is not None else row["vendor_code"]
            new_name = v_upd.company_name.strip() if v_upd.company_name is not None else row["company_name"]
            new_vat = v_upd.vat_number.strip() if v_upd.vat_number is not None else row["vat_number"]
            new_role = v_upd.supply_chain_role.strip() if v_upd.supply_chain_role is not None else row["supply_chain_role"]
            new_dist = v_upd.district_area.strip() if v_upd.district_area is not None else row["district_area"]
            new_city = v_upd.city_address.strip() if v_upd.city_address is not None else row["city_address"]
            new_iso = v_upd.country_iso2.strip().upper() if v_upd.country_iso2 is not None else row["country_iso2"]
            new_tier = v_upd.paas_tier.strip() if v_upd.paas_tier is not None else row["paas_tier"]
            new_qual = v_upd.qualification_status.strip() if v_upd.qualification_status is not None else row["qualification_status"]
            new_q = float(v_upd.quality_score) if v_upd.quality_score is not None else float(row["quality_score"])
            new_o = float(v_upd.otd_score) if v_upd.otd_score is not None else float(row["otd_score"])
            new_e = float(v_upd.esg_score) if v_upd.esg_score is not None else float(row["esg_score"])
            overall, _ = self.compute_vendor_rating(new_q, new_o, new_e)
            new_lead = int(v_upd.standard_lead_time_days) if v_upd.standard_lead_time_days is not None else int(row["standard_lead_time_days"])
            new_moq = v_upd.moq_description if v_upd.moq_description is not None else row["moq_description"]
            new_pay = v_upd.payment_terms_l6 if v_upd.payment_terms_l6 is not None else row["payment_terms_l6"]
            new_rate = (
                float(v_upd.hourly_or_unit_rate_eur_l6)
                if v_upd.hourly_or_unit_rate_eur_l6 is not None
                else float(row["hourly_or_unit_rate_eur_l6"])
            )
            new_plist = (
                json.dumps(v_upd.negotiated_price_list_l6)
                if v_upd.negotiated_price_list_l6 is not None
                else row["negotiated_price_list_json_l6"]
            )
            new_notes = (
                v_upd.internal_audit_notes_l6
                if v_upd.internal_audit_notes_l6 is not None
                else row["internal_audit_notes_l6"]
            )
            new_email = v_upd.contact_email.strip() if v_upd.contact_email is not None else row["contact_email"]
            new_dist_comp = v_upd.district_company_id if v_upd.district_company_id is not None else (row["district_company_id"] if "district_company_id" in row.keys() else None)
            new_active = (1 if v_upd.is_active else 0) if v_upd.is_active is not None else int(row["is_active"])

            conn.execute(
                """
                UPDATE vendors_registry
                SET vendor_code = ?, company_name = ?, vat_number = ?, supply_chain_role = ?,
                    district_area = ?, city_address = ?, country_iso2 = ?, paas_tier = ?,
                    qualification_status = ?, quality_score = ?, otd_score = ?, esg_score = ?,
                    overall_rating = ?, standard_lead_time_days = ?, moq_description = ?,
                    payment_terms_l6 = ?, hourly_or_unit_rate_eur_l6 = ?,
                    negotiated_price_list_json_l6 = ?, internal_audit_notes_l6 = ?,
                    contact_email = ?, district_company_id = ?, is_active = ?
                WHERE vendor_id = ?
                """,
                (
                    new_code,
                    new_name,
                    new_vat,
                    new_role,
                    new_dist,
                    new_city,
                    new_iso,
                    new_tier,
                    new_qual,
                    new_q,
                    new_o,
                    new_e,
                    overall,
                    new_lead,
                    new_moq,
                    new_pay,
                    new_rate,
                    new_plist,
                    new_notes,
                    new_email,
                    new_dist_comp,
                    new_active,
                    real_vid,
                ),
            )
            conn.commit()
            return self.get_vendor(real_vid, viewer_role=viewer_role)
        finally:
            self._close_if_file(conn)

    def delete_vendor(self, vendor_id: str) -> Optional[Dict[str, str]]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT vendor_id, company_name FROM vendors_registry WHERE vendor_id = ? OR vendor_code = ?",
                (vendor_id, vendor_id),
            ).fetchone()
            if not row:
                return None
            real_vid = row["vendor_id"]
            cname = row["company_name"]
            ref_count = 0
            for q, p in (
                ("SELECT COUNT(*) AS c FROM bom_items WHERE vendor_id = ? OR LOWER(supplier_name) = LOWER(?)", (real_vid, cname)),
                ("SELECT COUNT(*) AS c FROM tannery_batches WHERE vendor_id = ? OR LOWER(tannery_name) = LOWER(?)", (real_vid, cname)),
                ("SELECT COUNT(*) AS c FROM subcontractor_assignments WHERE LOWER(subcontractor_name) = LOWER(?)", (cname,)),
                ("SELECT COUNT(*) AS c FROM production_order_phases WHERE LOWER(subcontractor_name) = LOWER(?)", (cname,)),
            ):
                r = conn.execute(q, p).fetchone()
                ref_count += int(r["c"]) if r else 0

            if ref_count > 0:
                conn.execute("UPDATE vendors_registry SET is_active = 0 WHERE vendor_id = ?", (real_vid,))
                conn.commit()
                return {"status": "deactivated", "vendor_id": real_vid}

            conn.execute("DELETE FROM vendors_registry WHERE vendor_id = ?", (real_vid,))
            conn.commit()
            return {"status": "deleted", "vendor_id": real_vid}
        finally:
            self._close_if_file(conn)

    def list_vendor_certifications(self, vendor_id: str) -> Optional[List[VendorCertification]]:
        conn = self.get_connection()
        try:
            vrow = conn.execute(
                "SELECT vendor_id FROM vendors_registry WHERE vendor_id = ? OR vendor_code = ?",
                (vendor_id, vendor_id),
            ).fetchone()
            if not vrow:
                return None
            real_vid = vrow["vendor_id"]
            rows = conn.execute(
                "SELECT * FROM vendor_certifications WHERE vendor_id = ? ORDER BY valid_until ASC",
                (real_vid,),
            ).fetchall()
            return [self._row_to_vendor_cert(r) for r in rows]
        finally:
            self._close_if_file(conn)

    def add_vendor_certification(
        self,
        vendor_id: str,
        c_in: VendorCertificationCreate,
    ) -> Optional[VendorCertification]:
        conn = self.get_connection()
        try:
            vrow = conn.execute(
                "SELECT vendor_id FROM vendors_registry WHERE vendor_id = ? OR vendor_code = ?",
                (vendor_id, vendor_id),
            ).fetchone()
            if not vrow:
                return None
            real_vid = vrow["vendor_id"]
            cid = self._insert_vendor_cert_in_tx(conn, real_vid, c_in)
            conn.commit()
            crow = conn.execute(
                "SELECT * FROM vendor_certifications WHERE cert_id = ?",
                (cid,),
            ).fetchone()
            return self._row_to_vendor_cert(crow) if crow else None
        finally:
            self._close_if_file(conn)

    def delete_vendor_certification(self, vendor_id: str, cert_id: str) -> Optional[Dict[str, str]]:
        conn = self.get_connection()
        try:
            vrow = conn.execute(
                "SELECT vendor_id FROM vendors_registry WHERE vendor_id = ? OR vendor_code = ?",
                (vendor_id, vendor_id),
            ).fetchone()
            if not vrow:
                return None
            real_vid = vrow["vendor_id"]
            cur = conn.execute(
                "DELETE FROM vendor_certifications WHERE vendor_id = ? AND cert_id = ?",
                (real_vid, cert_id),
            )
            conn.commit()
            if cur.rowcount == 0:
                return None
            return {"status": "deleted", "cert_id": cert_id}
        finally:
            self._close_if_file(conn)

    def get_vendor_where_used(
        self,
        vendor_id: str,
        viewer_role: str = "brand",
    ) -> Optional[VendorWhereUsedResponse]:
        conn = self.get_connection()
        try:
            vrow = conn.execute(
                "SELECT * FROM vendors_registry WHERE vendor_id = ? OR vendor_code = ?",
                (vendor_id, vendor_id),
            ).fetchone()
            if not vrow:
                return None

            real_vid = vrow["vendor_id"]
            cname = vrow["company_name"]
            role_norm = (viewer_role or "brand").strip().lower()
            is_brand = role_norm == "brand"

            bom_rows = conn.execute(
                """
                SELECT bi.*, pv.variant_code, pv.pim_item_id
                FROM bom_items bi
                JOIN plm_production_variants pv ON bi.plm_variant_id = pv.plm_variant_id
                WHERE bi.vendor_id = ? OR LOWER(bi.supplier_name) = LOWER(?)
                ORDER BY pv.variant_code ASC, bi.level ASC
                """,
                (real_vid, cname),
            ).fetchall()

            sub_rows = conn.execute(
                """
                SELECT DISTINCT plm_variant_id
                FROM subcontractor_assignments
                WHERE LOWER(subcontractor_name) = LOWER(?)
                """,
                (cname,),
            ).fetchall()

            phase_rows = conn.execute(
                """
                SELECT DISTINCT po.order_id, po.plm_variant_id, po.status
                FROM production_order_phases pop
                JOIN production_orders po ON pop.order_id = po.order_id
                WHERE LOWER(pop.subcontractor_name) = LOWER(?) OR pop.subcontractor_id = ?
                """,
                (cname, real_vid),
            ).fetchall()

            tb_rows = conn.execute(
                """
                SELECT * FROM tannery_batches
                WHERE vendor_id = ? OR LOWER(tannery_name) = LOWER(?)
                ORDER BY created_at DESC
                """,
                (real_vid, cname),
            ).fetchall()
            tb_ids = {tb["batch_id"] for tb in tb_rows}

            impacted_var_ids = {r["plm_variant_id"] for r in bom_rows}
            impacted_var_ids.update(r["plm_variant_id"] for r in sub_rows)
            impacted_var_ids.update(r["plm_variant_id"] for r in phase_rows)

            if tb_ids:
                ph = ",".join("?" for _ in tb_ids)
                for po_r in conn.execute(
                    f"SELECT DISTINCT plm_variant_id FROM production_orders WHERE tannery_batch_id IN ({ph})",
                    list(tb_ids),
                ).fetchall():
                    impacted_var_ids.add(po_r["plm_variant_id"])

            variant_rows: List[sqlite3.Row] = []
            if impacted_var_ids:
                ph = ",".join("?" for _ in impacted_var_ids)
                variant_rows = conn.execute(
                    f"SELECT * FROM plm_production_variants WHERE plm_variant_id IN ({ph}) ORDER BY variant_code ASC",
                    list(impacted_var_ids),
                ).fetchall()

            impacted_pim_ids = {vr["pim_item_id"] for vr in variant_rows}
            pim_rows: List[sqlite3.Row] = []
            if impacted_pim_ids:
                ph = ",".join("?" for _ in impacted_pim_ids)
                pim_rows = conn.execute(
                    f"SELECT * FROM pim_commercial_items WHERE pim_item_id IN ({ph}) ORDER BY sku_code ASC",
                    list(impacted_pim_ids),
                ).fetchall()

            active_order_ids = {
                r["order_id"] for r in phase_rows if r["status"] not in ("completed", "cancelled")
            }
            if impacted_var_ids:
                ph = ",".join("?" for _ in impacted_var_ids)
                for po_r in conn.execute(
                    f"SELECT order_id FROM production_orders WHERE plm_variant_id IN ({ph}) AND status NOT IN ('completed', 'cancelled')",
                    list(impacted_var_ids),
                ).fetchall():
                    active_order_ids.add(po_r["order_id"])
            if tb_ids:
                ph = ",".join("?" for _ in tb_ids)
                for po_r in conn.execute(
                    f"SELECT order_id FROM production_orders WHERE tannery_batch_id IN ({ph}) AND status NOT IN ('completed', 'cancelled')",
                    list(tb_ids),
                ).fetchall():
                    active_order_ids.add(po_r["order_id"])

            impacted_bom_nodes: List[VendorImpactedBomNode] = []
            bom_pair_contribs: List[float] = []
            for br in bom_rows:
                b_meta = json.loads(br["metadata_json"] or "{}")
                b_keys = br.keys()
                raw_cost = float(b_meta.get("unit_cost_eur", 0.0))
                gross_contrib = float(br["unit_consumption"]) * (1.0 + float(br["waste_percentage"]) / 100.0) * raw_cost
                bom_pair_contribs.append(gross_contrib)
                impacted_bom_nodes.append(
                    VendorImpactedBomNode(
                        bom_item_id=br["bom_item_id"],
                        plm_variant_id=br["plm_variant_id"],
                        variant_code=br["variant_code"],
                        level=int(br["level"]),
                        component_type=br["component_type"],
                        material_name=br["material_name"],
                        unit_of_measure=br["unit_of_measure"],
                        unit_consumption=float(br["unit_consumption"]),
                        waste_percentage=float(br["waste_percentage"]),
                        master_color_id=br["master_color_id"] if "master_color_id" in b_keys else None,
                        unit_cost_eur_l6=round(raw_cost, 2) if is_brand else None,
                    )
                )

            impacted_variants = [
                VendorImpactedPlmVariant(
                    plm_variant_id=vr["plm_variant_id"],
                    pim_item_id=vr["pim_item_id"],
                    variant_code=vr["variant_code"],
                    colorway_name=vr["colorway_name"],
                    lifecycle_status=vr["lifecycle_status"],
                )
                for vr in variant_rows
            ]

            impacted_pims = [
                VendorImpactedPimModel(
                    pim_item_id=pr["pim_item_id"],
                    sku_code=pr["sku_code"],
                    model_name=pr["model_name"],
                    season=pr["season"],
                    category=pr["category"],
                )
                for pr in pim_rows
            ]

            impacted_batches = [
                VendorImpactedTanneryBatch(
                    batch_id=tb["batch_id"],
                    batch_code=tb["batch_code"],
                    leather_type=tb["leather_type"],
                    lwg_rating=tb["lwg_rating"],
                    available_qty_sqft=float(tb["available_qty_sqft"]),
                    master_color_id=tb["master_color_id"] if "master_color_id" in tb.keys() else None,
                )
                for tb in tb_rows
            ]

            pim_cnt = len(impacted_pims)
            var_cnt = len(impacted_variants)
            bom_cnt = len(impacted_bom_nodes)
            tb_cnt = len(impacted_batches)
            ord_cnt = len(active_order_ids)

            if pim_cnt >= 2 or bom_cnt >= 3:
                crit = "HIGH"
            elif pim_cnt >= 1 or bom_cnt >= 1 or tb_cnt >= 1:
                crit = "MEDIUM"
            else:
                crit = "LOW"

            summary = VendorImpactSummary(
                pim_models_count=pim_cnt,
                plm_variants_count=var_cnt,
                bom_nodes_count=bom_cnt,
                tannery_batches_count=tb_cnt,
                active_production_orders_count=ord_cnt,
                supply_chain_criticality=crit,
            )

            overall_val, _ = self.compute_vendor_rating(
                float(vrow["quality_score"]),
                float(vrow["otd_score"]),
                float(vrow["esg_score"]),
            )

            if is_brand:
                unit_rate = float(vrow["hourly_or_unit_rate_eur_l6"])
                avg_contrib = (
                    round(sum(bom_pair_contribs) / len(bom_pair_contribs), 2)
                    if bom_pair_contribs
                    else round(unit_rate, 2)
                )
                stock_val = round(
                    sum(float(tb["available_qty_sqft"]) * max(unit_rate, 4.5) for tb in tb_rows),
                    2,
                )
                seasonal_exp = round(avg_contrib * max(var_cnt, 1) * 250.0 + stock_val, 2)
                fin_exp: Optional[VendorFinancialExposureL6] = VendorFinancialExposureL6(
                    avg_bom_cost_contribution_per_pair_eur=avg_contrib,
                    tannery_stock_value_eur=stock_val,
                    estimated_seasonal_exposure_eur=seasonal_exp,
                    hourly_or_unit_rate_eur=unit_rate,
                    payment_terms=vrow["payment_terms_l6"] or "",
                )
            else:
                fin_exp = None

            return VendorWhereUsedResponse(
                vendor_id=real_vid,
                vendor_code=vrow["vendor_code"],
                company_name=cname,
                supply_chain_role=vrow["supply_chain_role"],
                district_area=vrow["district_area"],
                qualification_status=vrow["qualification_status"],
                paas_tier=vrow["paas_tier"],
                overall_rating=overall_val if is_brand else None,
                viewer_role=role_norm,
                l6_segregated=not is_brand,
                impact_summary=summary,
                financial_exposure_l6=fin_exp,
                impacted_pim_models=impacted_pims,
                impacted_plm_variants=impacted_variants,
                impacted_bom_nodes=impacted_bom_nodes,
                impacted_tannery_batches=impacted_batches,
            )
        finally:
            self._close_if_file(conn)

    # =========================================================================
    # Product Models (FTL-CEO-021)
    # =========================================================================

    def _row_to_product_model(self, conn: sqlite3.Connection, row: sqlite3.Row) -> ProductModel:
        mid = row["model_id"]
        p_count = conn.execute(
            "SELECT COUNT(*) FROM pim_commercial_items WHERE model_id = ?",
            (mid,),
        ).fetchone()[0]
        v_count = conn.execute(
            """
            SELECT COUNT(*) FROM plm_production_variants v
            JOIN pim_commercial_items p ON v.pim_item_id = p.pim_item_id
            WHERE p.model_id = ?
            """,
            (mid,),
        ).fetchone()[0]

        try:
            meta = json.loads(row["metadata_json"] or "{}")
        except Exception:
            meta = {}

        return ProductModel(
            model_id=mid,
            model_code=row["model_code"],
            name=row["name"],
            category=ProductCategory(row["category"]) if "category" in row.keys() and row["category"] else ProductCategory.FOOTWEAR,
            target_gender=row["target_gender"] if "target_gender" in row.keys() else "unisex",
            last_code=row["last_code"] if "last_code" in row.keys() else "Forma Standard",
            sole_construction=row["sole_construction"] if "sole_construction" in row.keys() else "Blake",
            heel_height_mm=float(row["heel_height_mm"]) if "heel_height_mm" in row.keys() else 25.0,
            default_size_range=row["default_size_range"] if "default_size_range" in row.keys() else "39-46",
            season_id=row["season_id"] if "season_id" in row.keys() else None,
            collection_id=row["collection_id"] if "collection_id" in row.keys() else None,
            description=row["description"] if "description" in row.keys() else "",
            cad_drawing_ref=row["cad_drawing_ref"] if "cad_drawing_ref" in row.keys() else "",
            is_active=bool(row["is_active"]) if "is_active" in row.keys() else True,
            metadata=meta,
            attached_products_count=p_count,
            attached_variants_count=v_count,
            created_at=self._parse_dt(row["created_at"]) or datetime.now(timezone.utc),
        )

    def save_product_model(self, model: ProductModelCreate, model_id: Optional[str] = None) -> ProductModel:
        conn = self.get_connection()
        try:
            mid = model_id or getattr(model, "model_id", None) or f"MOD-{uuid4().hex[:8].upper()}"
            now_iso = datetime.now(timezone.utc).isoformat()
            meta_json = json.dumps(model.metadata)
            cat_val = model.category.value if hasattr(model.category, "value") else str(model.category)

            conn.execute(
                """
                INSERT INTO product_models (
                    model_id, model_code, name, category, target_gender,
                    last_code, sole_construction, heel_height_mm, default_size_range,
                    season_id, collection_id, description, cad_drawing_ref,
                    is_active, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(model_id) DO UPDATE SET
                    model_code = excluded.model_code,
                    name = excluded.name,
                    category = excluded.category,
                    target_gender = excluded.target_gender,
                    last_code = excluded.last_code,
                    sole_construction = excluded.sole_construction,
                    heel_height_mm = excluded.heel_height_mm,
                    default_size_range = excluded.default_size_range,
                    season_id = excluded.season_id,
                    collection_id = excluded.collection_id,
                    description = excluded.description,
                    cad_drawing_ref = excluded.cad_drawing_ref,
                    is_active = excluded.is_active,
                    metadata_json = excluded.metadata_json
                """,
                (
                    mid,
                    model.model_code,
                    model.name,
                    cat_val,
                    model.target_gender,
                    model.last_code,
                    model.sole_construction,
                    model.heel_height_mm,
                    model.default_size_range,
                    model.season_id,
                    model.collection_id,
                    model.description,
                    model.cad_drawing_ref,
                    1 if model.is_active else 0,
                    meta_json,
                    now_iso,
                ),
            )
            conn.commit()
            res = self.get_product_model(mid)
            if not res:
                raise RuntimeError(f"Failed to retrieve saved product model '{mid}'")
            return res
        finally:
            self._close_if_file(conn)

    def get_product_model(self, model_id: str) -> Optional[ProductModel]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM product_models WHERE model_id = ? OR model_code = ?",
                (model_id, model_id),
            ).fetchone()
            if not row:
                return None
            return self._row_to_product_model(conn, row)
        finally:
            self._close_if_file(conn)

    def get_product_model_with_products(self, model_id: str) -> Optional[ProductModelWithProducts]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM product_models WHERE model_id = ? OR model_code = ?",
                (model_id, model_id),
            ).fetchone()
            if not row:
                return None
            real_mid = row["model_id"]
            base = self._row_to_product_model(conn, row)
            p_rows = conn.execute(
                "SELECT * FROM pim_commercial_items WHERE model_id = ? ORDER BY sku_code ASC",
                (real_mid,),
            ).fetchall()
            attached_items = [self._row_to_pim_item(conn, pr) for pr in p_rows]
            return ProductModelWithProducts(
                **base.model_dump(),
                attached_pim_items=attached_items,
            )
        finally:
            self._close_if_file(conn)

    def list_product_models(
        self,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> List[ProductModel]:
        conn = self.get_connection()
        try:
            sql = "SELECT * FROM product_models WHERE 1=1"
            params: List[Any] = []
            if category and category.strip() and category != "ALL":
                sql += " AND LOWER(category) = LOWER(?)"
                params.append(category.strip())
            if is_active is not None:
                sql += " AND is_active = ?"
                params.append(1 if is_active else 0)
            if search and search.strip():
                s = f"%{search.strip().lower()}%"
                sql += " AND (LOWER(model_code) LIKE ? OR LOWER(name) LIKE ? OR LOWER(last_code) LIKE ?)"
                params.extend([s, s, s])
            sql += " ORDER BY model_code ASC"
            rows = conn.execute(sql, params).fetchall()
            return [self._row_to_product_model(conn, r) for r in rows]
        finally:
            self._close_if_file(conn)

    def update_product_model(self, model_id: str, payload: ProductModelUpdate) -> Optional[ProductModel]:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM product_models WHERE model_id = ? OR model_code = ?",
                (model_id, model_id),
            ).fetchone()
            if not row:
                return None
            real_mid = row["model_id"]
            fields: List[str] = []
            params: List[Any] = []
            if payload.name is not None:
                fields.append("name = ?")
                params.append(payload.name.strip())
            if payload.category is not None:
                fields.append("category = ?")
                params.append(payload.category.value if hasattr(payload.category, "value") else str(payload.category))
            if payload.target_gender is not None:
                fields.append("target_gender = ?")
                params.append(payload.target_gender)
            if payload.last_code is not None:
                fields.append("last_code = ?")
                params.append(payload.last_code)
            if payload.sole_construction is not None:
                fields.append("sole_construction = ?")
                params.append(payload.sole_construction)
            if payload.heel_height_mm is not None:
                fields.append("heel_height_mm = ?")
                params.append(float(payload.heel_height_mm))
            if payload.default_size_range is not None:
                fields.append("default_size_range = ?")
                params.append(payload.default_size_range)
            if payload.season_id is not None:
                fields.append("season_id = ?")
                params.append(payload.season_id)
            if payload.collection_id is not None:
                fields.append("collection_id = ?")
                params.append(payload.collection_id)
            if payload.description is not None:
                fields.append("description = ?")
                params.append(payload.description)
            if payload.cad_drawing_ref is not None:
                fields.append("cad_drawing_ref = ?")
                params.append(payload.cad_drawing_ref)
            if payload.is_active is not None:
                fields.append("is_active = ?")
                params.append(1 if payload.is_active else 0)
            if payload.metadata is not None:
                fields.append("metadata_json = ?")
                params.append(json.dumps(payload.metadata))

            if fields:
                params.append(real_mid)
                conn.execute(f"UPDATE product_models SET {', '.join(fields)} WHERE model_id = ?", params)
                conn.commit()
            return self.get_product_model(real_mid)
        finally:
            self._close_if_file(conn)

    def delete_product_model(self, model_id: str) -> bool:
        conn = self.get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM product_models WHERE model_id = ? OR model_code = ?",
                (model_id, model_id),
            ).fetchone()
            if not row:
                return False
            real_mid = row["model_id"]
            conn.execute("UPDATE pim_commercial_items SET model_id = NULL WHERE model_id = ?", (real_mid,))
            res = conn.execute("DELETE FROM product_models WHERE model_id = ?", (real_mid,))
            conn.commit()
            return res.rowcount > 0
        finally:
            self._close_if_file(conn)

    def attach_product_to_model(self, model_id: str, pim_item_id: str) -> bool:
        conn = self.get_connection()
        try:
            m_row = conn.execute(
                "SELECT * FROM product_models WHERE model_id = ? OR model_code = ?",
                (model_id, model_id),
            ).fetchone()
            if not m_row:
                return False
            real_mid = m_row["model_id"]
            res = conn.execute(
                "UPDATE pim_commercial_items SET model_id = ? WHERE pim_item_id = ?",
                (real_mid, pim_item_id),
            )
            conn.commit()
            return res.rowcount > 0
        finally:
            self._close_if_file(conn)

    def detach_product_from_model(self, model_id: str, pim_item_id: str) -> bool:
        conn = self.get_connection()
        try:
            m_row = conn.execute(
                "SELECT * FROM product_models WHERE model_id = ? OR model_code = ?",
                (model_id, model_id),
            ).fetchone()
            real_mid = m_row["model_id"] if m_row else model_id
            res = conn.execute(
                "UPDATE pim_commercial_items SET model_id = NULL WHERE pim_item_id = ? AND model_id = ?",
                (pim_item_id, real_mid),
            )
            conn.commit()
            return res.rowcount > 0
        finally:
            self._close_if_file(conn)

    # =========================================================================
    # Albo Fornitori <-> Hub Distretto PaaS Linking (FTL-CEO-022)
    # =========================================================================

    def link_vendor_to_district_company(self, vendor_id: str, company_id: str) -> Optional[VendorRecord]:
        conn = self.get_connection()
        try:
            c_row = conn.execute("SELECT * FROM companies WHERE company_id = ?", (company_id,)).fetchone()
            if not c_row:
                return None
            res = conn.execute(
                "UPDATE vendors_registry SET district_company_id = ? WHERE vendor_id = ? OR vendor_code = ?",
                (company_id, vendor_id, vendor_id),
            )
            conn.commit()
            if res.rowcount == 0:
                return None
            return self.get_vendor(vendor_id)
        finally:
            self._close_if_file(conn)

    def unlink_vendor_from_district_company(self, vendor_id: str) -> Optional[VendorRecord]:
        conn = self.get_connection()
        try:
            res = conn.execute(
                "UPDATE vendors_registry SET district_company_id = NULL WHERE vendor_id = ? OR vendor_code = ?",
                (vendor_id, vendor_id),
            )
            conn.commit()
            if res.rowcount == 0:
                return None
            return self.get_vendor(vendor_id)
        finally:
            self._close_if_file(conn)

    def auto_link_vendors_to_district_companies(self) -> Dict[str, Any]:
        """Automatically match vendors_registry and companies by VAT number or matching company name."""
        conn = self.get_connection()
        try:
            vendors = conn.execute("SELECT vendor_id, vendor_code, company_name, vat_number, district_company_id FROM vendors_registry").fetchall()
            companies = conn.execute("SELECT company_id, legal_name, business_name, vat_number FROM companies").fetchall()

            linked_pairs: List[Dict[str, Any]] = []

            for v in vendors:
                if v["district_company_id"]:
                    continue  # already linked
                v_vat = (v["vat_number"] or "").strip().upper()
                v_name = (v["company_name"] or "").strip().lower()

                matched_company_id = None
                matched_company_name = None

                for c in companies:
                    c_vat = (c["vat_number"] or "").strip().upper()
                    c_legal = (c["legal_name"] or "").strip().lower()
                    c_biz = (c["business_name"] or "").strip().lower()

                    # Exact VAT match
                    if v_vat and c_vat and v_vat == c_vat:
                        matched_company_id = c["company_id"]
                        matched_company_name = c["legal_name"]
                        break

                    # Strong substring/name match
                    if (v_name in c_legal or c_legal in v_name) and len(v_name) > 6:
                        matched_company_id = c["company_id"]
                        matched_company_name = c["legal_name"]
                        break

                if matched_company_id:
                    conn.execute(
                        "UPDATE vendors_registry SET district_company_id = ? WHERE vendor_id = ?",
                        (matched_company_id, v["vendor_id"]),
                    )
                    linked_pairs.append({
                        "vendor_id": v["vendor_id"],
                        "vendor_code": v["vendor_code"],
                        "company_name": v["company_name"],
                        "district_company_id": matched_company_id,
                        "district_company_name": matched_company_name,
                    })

            conn.commit()
            return {
                "matched_count": len(linked_pairs),
                "linked_vendors": linked_pairs,
            }
        finally:
            self._close_if_file(conn)

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
