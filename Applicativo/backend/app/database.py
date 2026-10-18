"""Database Persistence Layer for Footlink (SQLite Local 0 EUR & PostgreSQL Free-Tier compatible per ADR-002)."""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional

from app.models import (
    BomComponentType,
    BomItem,
    PimCommercialItem,
    PlmLifecycleStatus,
    PlmProductionVariant,
    ProductCategory,
    ProductionPhase,
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
    """Unified SQLite/SQLAlchemy persistence gateway for 1 PIM <-> N PLM, 3-level BOM, and Subcontractor Portal."""

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
        """Create database tables from schema.sql (and SQLAlchemy metadata if enabled)."""
        if HAS_SQLALCHEMY and engine is not None and not self.db_url.startswith("sqlite"):
            Base.metadata.create_all(bind=engine)
            return

        conn = self.get_connection()
        try:
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

    def clear_all(self) -> None:
        conn = self.get_connection()
        try:
            conn.execute("DELETE FROM subcontractor_assignments")
            conn.execute("DELETE FROM bom_items")
            conn.execute("DELETE FROM plm_production_variants")
            conn.execute("DELETE FROM pim_commercial_items")
            conn.commit()
        finally:
            self._close_if_file(conn)

    def save_pim_item(self, item: PimCommercialItem) -> PimCommercialItem:
        """Insert or update a full 1 PIM Commercial Item and its N PLM Variants, 3-level BOM, and Subcontractors."""
        conn = self.get_connection()
        try:
            created_iso = (
                item.created_at.isoformat() if isinstance(item.created_at, datetime) else str(item.created_at)
            )
            cat_val = item.category.value if isinstance(item.category, ProductCategory) else str(item.category)
            conn.execute(
                """
                INSERT OR REPLACE INTO pim_commercial_items (
                    pim_item_id, sku_code, model_name, brand_tenant_id,
                    season, category, commercial_description_it, commercial_description_en,
                    retail_channels_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item.pim_item_id,
                    item.sku_code,
                    item.model_name,
                    item.brand_tenant_id,
                    item.season,
                    cat_val,
                    item.commercial_description_it,
                    item.commercial_description_en,
                    json.dumps(item.retail_channels),
                    created_iso,
                ),
            )

            # Clear existing variants for this PIM item before re-inserting current state
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
        conn.execute(
            """
            INSERT INTO plm_production_variants (
                plm_variant_id, pim_item_id, variant_code, colorway_name,
                size_range, last_or_pattern_code, lifecycle_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                variant.plm_variant_id,
                pim_item_id,
                variant.variant_code,
                variant.colorway_name,
                variant.size_range,
                variant.last_or_pattern_code,
                status_val,
                v_created,
            ),
        )

        for bom in variant.bom_items:
            comp_val = (
                bom.component_type.value
                if isinstance(bom.component_type, BomComponentType)
                else str(bom.component_type)
            )
            conn.execute(
                """
                INSERT INTO bom_items (
                    bom_item_id, plm_variant_id, level, parent_bom_item_id,
                    component_type, material_name, supplier_name, origin_country_iso2,
                    unit_of_measure, unit_consumption, waste_percentage,
                    recycled_content_pct, certifications_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                ),
            )

        for sub in variant.subcontractor_assignments:
            phase_val = sub.phase.value if isinstance(sub.phase, ProductionPhase) else str(sub.phase)
            conf_iso = (
                sub.confirmed_at.isoformat()
                if isinstance(sub.confirmed_at, datetime)
                else (str(sub.confirmed_at) if sub.confirmed_at else None)
            )
            conn.execute(
                """
                INSERT INTO subcontractor_assignments (
                    assignment_id, plm_variant_id, subcontractor_name, district,
                    phase, material_lot_code, completed, confirmed_at
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
                    conf_iso,
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
            return self._hydrate_pim_item(conn, row)
        finally:
            self._close_if_file(conn)

    def list_pim_items(self) -> List[PimCommercialItem]:
        conn = self.get_connection()
        try:
            rows = conn.execute("SELECT * FROM pim_commercial_items ORDER BY rowid ASC").fetchall()
            return [self._hydrate_pim_item(conn, r) for r in rows]
        finally:
            self._close_if_file(conn)

    def _hydrate_pim_item(self, conn: sqlite3.Connection, row: sqlite3.Row) -> PimCommercialItem:
        pim_id = row["pim_item_id"]
        variant_rows = conn.execute(
            "SELECT * FROM plm_production_variants WHERE pim_item_id = ? ORDER BY rowid ASC",
            (pim_id,),
        ).fetchall()

        variants: List[PlmProductionVariant] = []
        for vr in variant_rows:
            plm_id = vr["plm_variant_id"]
            bom_rows = conn.execute(
                "SELECT * FROM bom_items WHERE plm_variant_id = ? ORDER BY id ASC",
                (plm_id,),
            ).fetchall()
            sub_rows = conn.execute(
                "SELECT * FROM subcontractor_assignments WHERE plm_variant_id = ? ORDER BY id ASC",
                (plm_id,),
            ).fetchall()

            boms = [
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
                )
                for br in bom_rows
            ]

            subs = [
                SubcontractorAssignment(
                    assignment_id=sr["assignment_id"],
                    subcontractor_name=sr["subcontractor_name"],
                    district=sr["district"],
                    phase=ProductionPhase(sr["phase"]),
                    material_lot_code=sr["material_lot_code"],
                    completed=bool(sr["completed"]),
                    confirmed_at=self._parse_dt(sr["confirmed_at"]),
                )
                for sr in sub_rows
            ]

            variants.append(
                PlmProductionVariant(
                    plm_variant_id=plm_id,
                    pim_item_id=pim_id,
                    variant_code=vr["variant_code"],
                    colorway_name=vr["colorway_name"],
                    size_range=vr["size_range"],
                    last_or_pattern_code=vr["last_or_pattern_code"],
                    lifecycle_status=PlmLifecycleStatus(vr["lifecycle_status"]),
                    bom_items=boms,
                    subcontractor_assignments=subs,
                    created_at=self._parse_dt(vr["created_at"]) or datetime.now(timezone.utc),
                )
            )

        return PimCommercialItem(
            pim_item_id=pim_id,
            sku_code=row["sku_code"],
            model_name=row["model_name"],
            brand_tenant_id=row["brand_tenant_id"],
            season=row["season"],
            category=ProductCategory(row["category"]),
            commercial_description_it=row["commercial_description_it"],
            commercial_description_en=row["commercial_description_en"],
            retail_channels=json.loads(row["retail_channels_json"] or "[]"),
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

    def items(self) -> List[ Any ]:
        return [(i.pim_item_id, i) for i in self.db.list_pim_items()]

    def save(self, item: PimCommercialItem) -> PimCommercialItem:
        return self.db.save_pim_item(item)


db_manager = FootlinkSQLitePersistence(DATABASE_URL)


def get_db() -> Iterator[FootlinkSQLitePersistence]:
    """Dependency injection generator for FastAPI routes."""
    yield db_manager
