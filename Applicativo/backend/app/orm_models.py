"""SQLAlchemy ORM Models for Footlink (SQLite Local 0 EUR & PostgreSQL Free-Tier compatible per ADR-002 & ADR-007)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List, Optional

try:
    from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text, UniqueConstraint  # type: ignore
    from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship  # type: ignore

    HAS_SQLALCHEMY = True

    class Base(DeclarativeBase):
        pass

    class SeasonORM(Base):
        __tablename__ = "seasons"

        season_id: Mapped[str] = mapped_column(String(64), primary_key=True)
        code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
        name: Mapped[str] = mapped_column(String(255), nullable=False)
        year: Mapped[int] = mapped_column(Integer, nullable=False)
        status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
        start_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
        end_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
        description: Mapped[str] = mapped_column(Text, nullable=False, default="")
        created_at: Mapped[str] = mapped_column(
            String(64),
            nullable=False,
            default=lambda: datetime.now(timezone.utc).isoformat(),
        )

        collections: Mapped[List["CollectionORM"]] = relationship(
            "CollectionORM",
            back_populates="season",
            cascade="all, delete-orphan",
            order_by="CollectionORM.code",
        )

    class CollectionORM(Base):
        __tablename__ = "collections"
        __table_args__ = (UniqueConstraint("season_id", "code", name="uq_season_collection_code"),)

        collection_id: Mapped[str] = mapped_column(String(64), primary_key=True)
        season_id: Mapped[str] = mapped_column(
            String(64),
            ForeignKey("seasons.season_id", ondelete="CASCADE"),
            nullable=False,
        )
        code: Mapped[str] = mapped_column(String(64), nullable=False)
        name: Mapped[str] = mapped_column(String(255), nullable=False)
        target_market: Mapped[str] = mapped_column(String(128), nullable=False, default="Global Luxury")
        status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
        description: Mapped[str] = mapped_column(Text, nullable=False, default="")
        created_at: Mapped[str] = mapped_column(
            String(64),
            nullable=False,
            default=lambda: datetime.now(timezone.utc).isoformat(),
        )

        season: Mapped["SeasonORM"] = relationship("SeasonORM", back_populates="collections")

    class DomainRegistryORM(Base):
        __tablename__ = "domain_registries"
        __table_args__ = (UniqueConstraint("registry_domain", "registry_name", "entry_code", name="uq_reg_domain_name_code"),)

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        registry_domain: Mapped[str] = mapped_column(String(16), nullable=False)
        registry_name: Mapped[str] = mapped_column(String(64), nullable=False)
        entry_code: Mapped[str] = mapped_column(String(128), nullable=False)
        label_it: Mapped[str] = mapped_column(String(255), nullable=False)
        label_en: Mapped[str] = mapped_column(String(255), nullable=False)
        metadata_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
        is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
        sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
        created_at: Mapped[str] = mapped_column(
            String(64),
            nullable=False,
            default=lambda: datetime.now(timezone.utc).isoformat(),
        )

    class SchemaAttributeDefinitionORM(Base):
        __tablename__ = "schema_attribute_definitions"
        __table_args__ = (UniqueConstraint("target_entity", "field_key", name="uq_target_field_key"),)

        attribute_id: Mapped[str] = mapped_column(String(64), primary_key=True)
        target_entity: Mapped[str] = mapped_column(String(32), nullable=False)
        field_key: Mapped[str] = mapped_column(String(128), nullable=False)
        label_it: Mapped[str] = mapped_column(String(255), nullable=False)
        label_en: Mapped[str] = mapped_column(String(255), nullable=False)
        field_type: Mapped[str] = mapped_column(String(32), nullable=False)
        options_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
        is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
        default_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
        group_name: Mapped[str] = mapped_column(String(128), nullable=False, default="General")
        is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
        description: Mapped[str] = mapped_column(Text, nullable=False, default="")
        created_at: Mapped[str] = mapped_column(
            String(64),
            nullable=False,
            default=lambda: datetime.now(timezone.utc).isoformat(),
        )

    class PimCommercialItemORM(Base):
        __tablename__ = "pim_commercial_items"
        __table_args__ = (UniqueConstraint("brand_tenant_id", "sku_code", name="uq_tenant_sku"),)

        pim_item_id: Mapped[str] = mapped_column(String(64), primary_key=True)
        sku_code: Mapped[str] = mapped_column(String(128), nullable=False)
        model_name: Mapped[str] = mapped_column(String(255), nullable=False)
        brand_tenant_id: Mapped[str] = mapped_column(String(128), nullable=False)
        season: Mapped[str] = mapped_column(String(32), nullable=False)
        season_id: Mapped[Optional[str]] = mapped_column(
            String(64),
            ForeignKey("seasons.season_id", ondelete="SET NULL"),
            nullable=True,
        )
        collection_id: Mapped[Optional[str]] = mapped_column(
            String(64),
            ForeignKey("collections.collection_id", ondelete="SET NULL"),
            nullable=True,
        )
        category: Mapped[str] = mapped_column(String(32), nullable=False, default="footwear")
        commercial_description_it: Mapped[str] = mapped_column(Text, nullable=False)
        commercial_description_en: Mapped[str] = mapped_column(Text, nullable=False)
        retail_channels_json: Mapped[str] = mapped_column(Text, nullable=False, default='["B2B Showroom", "E-Commerce"]')
        metadata_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
        created_at: Mapped[str] = mapped_column(
            String(64),
            nullable=False,
            default=lambda: datetime.now(timezone.utc).isoformat(),
        )

        plm_variants: Mapped[List["PlmProductionVariantORM"]] = relationship(
            "PlmProductionVariantORM",
            back_populates="pim_item",
            cascade="all, delete-orphan",
            order_by="PlmProductionVariantORM.created_at",
        )

    class PlmProductionVariantORM(Base):
        __tablename__ = "plm_production_variants"
        __table_args__ = (UniqueConstraint("pim_item_id", "variant_code", name="uq_pim_variant_code"),)

        plm_variant_id: Mapped[str] = mapped_column(String(64), primary_key=True)
        pim_item_id: Mapped[str] = mapped_column(
            String(64),
            ForeignKey("pim_commercial_items.pim_item_id", ondelete="CASCADE"),
            nullable=False,
        )
        collection_id: Mapped[Optional[str]] = mapped_column(
            String(64),
            ForeignKey("collections.collection_id", ondelete="SET NULL"),
            nullable=True,
        )
        variant_code: Mapped[str] = mapped_column(String(128), nullable=False)
        colorway_name: Mapped[str] = mapped_column(String(128), nullable=False)
        size_range: Mapped[str] = mapped_column(String(64), nullable=False, default="35-42")
        last_or_pattern_code: Mapped[str] = mapped_column(String(128), nullable=False)
        lifecycle_status: Mapped[str] = mapped_column(String(32), nullable=False, default="prototype")
        metadata_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
        created_at: Mapped[str] = mapped_column(
            String(64),
            nullable=False,
            default=lambda: datetime.now(timezone.utc).isoformat(),
        )

        pim_item: Mapped["PimCommercialItemORM"] = relationship("PimCommercialItemORM", back_populates="plm_variants")
        bom_items: Mapped[List["BomItemORM"]] = relationship(
            "BomItemORM",
            back_populates="plm_variant",
            cascade="all, delete-orphan",
            order_by="BomItemORM.id",
        )
        subcontractor_assignments: Mapped[List["SubcontractorAssignmentORM"]] = relationship(
            "SubcontractorAssignmentORM",
            back_populates="plm_variant",
            cascade="all, delete-orphan",
            order_by="SubcontractorAssignmentORM.id",
        )

    class BomItemORM(Base):
        __tablename__ = "bom_items"
        __table_args__ = (UniqueConstraint("plm_variant_id", "bom_item_id", name="uq_variant_bom_id"),)

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        bom_item_id: Mapped[str] = mapped_column(String(64), nullable=False)
        plm_variant_id: Mapped[str] = mapped_column(
            String(64),
            ForeignKey("plm_production_variants.plm_variant_id", ondelete="CASCADE"),
            nullable=False,
        )
        level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
        parent_bom_item_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
        component_type: Mapped[str] = mapped_column(String(32), nullable=False)
        material_name: Mapped[str] = mapped_column(String(255), nullable=False)
        supplier_name: Mapped[str] = mapped_column(String(255), nullable=False)
        origin_country_iso2: Mapped[str] = mapped_column(String(2), nullable=False)
        unit_of_measure: Mapped[str] = mapped_column(String(32), nullable=False)
        unit_consumption: Mapped[float] = mapped_column(Float, nullable=False)
        waste_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=5.0)
        recycled_content_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
        certifications_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
        metadata_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")

        plm_variant: Mapped["PlmProductionVariantORM"] = relationship("PlmProductionVariantORM", back_populates="bom_items")

    class SubcontractorAssignmentORM(Base):
        __tablename__ = "subcontractor_assignments"
        __table_args__ = (UniqueConstraint("plm_variant_id", "assignment_id", name="uq_variant_assignment_id"),)

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        assignment_id: Mapped[str] = mapped_column(String(64), nullable=False)
        plm_variant_id: Mapped[str] = mapped_column(
            String(64),
            ForeignKey("plm_production_variants.plm_variant_id", ondelete="CASCADE"),
            nullable=False,
        )
        subcontractor_name: Mapped[str] = mapped_column(String(255), nullable=False)
        district: Mapped[str] = mapped_column(String(128), nullable=False)
        phase: Mapped[str] = mapped_column(String(64), nullable=False)
        material_lot_code: Mapped[str] = mapped_column(String(128), nullable=False)
        completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
        confirmed_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

        plm_variant: Mapped["PlmProductionVariantORM"] = relationship(
            "PlmProductionVariantORM",
            back_populates="subcontractor_assignments",
        )

except ImportError:
    HAS_SQLALCHEMY = False

    class Base:  # type: ignore[no-redef]
        pass

    class SeasonORM:  # type: ignore[no-redef]
        __tablename__ = "seasons"

    class CollectionORM:  # type: ignore[no-redef]
        __tablename__ = "collections"

    class DomainRegistryORM:  # type: ignore[no-redef]
        __tablename__ = "domain_registries"

    class SchemaAttributeDefinitionORM:  # type: ignore[no-redef]
        __tablename__ = "schema_attribute_definitions"

    class PimCommercialItemORM:  # type: ignore[no-redef]
        __tablename__ = "pim_commercial_items"

    class PlmProductionVariantORM:  # type: ignore[no-redef]
        __tablename__ = "plm_production_variants"

    class BomItemORM:  # type: ignore[no-redef]
        __tablename__ = "bom_items"

    class SubcontractorAssignmentORM:  # type: ignore[no-redef]
        __tablename__ = "subcontractor_assignments"
