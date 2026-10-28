"""Core Domain Models for Footlink:
- 1 PIM Commercial Item <-> N PLM Production Variants
- 3-Level BOM with Size Grading & L6 Segregated Industrial Costing (ADR-006)
- Vertical Category Tech Specs (Footwear, Leather Goods, Apparel)
- PIM Data Quality Score (0-100%) & Omnichannel Syndication Export (FEAT-05)
- 0 EUR Subcontractor Portal & EU ESPR Digital Product Passport (Consumer vs Customs View)
- Sprint 5: Seasons & Collections Hierarchy, Master Domain Registries & Dynamic Schema Attributes (ADR-007)
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from app._compat import BaseModel, Field


class ProductCategory(str, Enum):
    FOOTWEAR = "footwear"
    LEATHER_GOODS = "leather_goods"
    APPAREL = "apparel"


class PlmLifecycleStatus(str, Enum):
    PROTOTYPE = "prototype"
    SAMPLE = "sample"
    INDUSTRIALIZED = "industrialized"
    IN_PRODUCTION = "in_production"
    ARCHIVED = "archived"
    NEW_FROM_PIM = "new_from_pim"


class BomComponentType(str, Enum):
    UPPER = "upper"
    LINING = "lining"
    INSOLE = "insole"
    OUTSOLE = "outsole"
    HEEL = "heel"
    HARDWARE = "hardware"
    FABRIC = "fabric"
    PACKAGING = "packaging"
    SUB_ASSEMBLY = "sub_assembly"


class CarryoverStatus(str, Enum):
    CARRYOVER = "carryover"
    SEASONAL_CORE = "seasonal_core"
    SEASONAL_TREND = "seasonal_trend"
    CAPSULE_DROP = "capsule_drop"


class TargetOccasion(str, Enum):
    BUSINESS_FORMAL = "business_formal"
    SMART_CASUAL = "smart_casual"
    EVENING_GALA = "evening_gala"
    URBAN_ACTIVE = "urban_active"
    OUTDOOR_LEISURE = "outdoor_leisure"


class PriceTier(str, Enum):
    ENTRY_LUXURY = "entry_luxury"
    CORE_LUXURY = "core_luxury"
    HIGH_LUXURY = "high_luxury"
    BESPOKE = "bespoke"


class ConstructionType(str, Enum):
    CASSETTA_CUCITA = "cassetta_cucita"
    BLAKE = "blake"
    GOODYEAR = "goodyear"
    TUBOLARE_SACCHETTO = "tubolare_sacchetto"
    STROBEL = "strobel"
    AGO = "ago"



class ProductionPhase(str, Enum):
    TANNING_MATERIAL = "tanning_material"
    CUTTING = "cutting"
    STITCHING_UPPER = "stitching_upper"
    LASTING_ASSEMBLY = "lasting_assembly"
    FINISHING = "finishing"
    QUALITY_CONTROL = "quality_control"


# ============================================================================
# Sprint 5: Seasons & Collections Models (ADR-007)
# ============================================================================


class SeasonStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    PRODUCTION = "production"
    ARCHIVED = "archived"


class CollectionStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    IN_PRODUCTION = "in_production"
    CLOSED = "closed"


class CollectionCreate(BaseModel):
    """Payload to create a Collection belonging to a Season."""

    code: str = Field(..., min_length=2, description="Collection code, e.g., MAIN-26, FASHION-26, CAPSULE-01")
    name: str = Field(..., min_length=2, description="Display name, e.g., Main Collection, Runway, Capsule")
    target_market: str = Field(default="Global Luxury", description="Target market or channel segment")
    status: CollectionStatus = Field(default=CollectionStatus.DRAFT)
    description: str = Field(default="", description="Optional editorial summary")


class Collection(CollectionCreate):
    """Persisted Collection entity."""

    collection_id: str
    season_id: str
    products_count: int = Field(default=0, description="Total PIM items linked to this collection")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SeasonCreate(BaseModel):
    """Payload to create a Fashion Season."""

    code: str = Field(..., min_length=2, description="Season code, e.g., PE26, P/E 2026, AI26-27")
    name: str = Field(..., min_length=2, description="Display name, e.g., Primavera Estate 2026")
    year: int = Field(..., ge=2020, le=2050, description="Reference calendar year")
    status: SeasonStatus = Field(default=SeasonStatus.ACTIVE)
    start_date: Optional[str] = Field(default=None, description="ISO date YYYY-MM-DD")
    end_date: Optional[str] = Field(default=None, description="ISO date YYYY-MM-DD")
    description: str = Field(default="", description="Editorial overview of the season")
    initial_collections: List[CollectionCreate] = Field(default_factory=list)


class Season(BaseModel):
    """Persisted Fashion Season entity aggregating N Collections."""

    season_id: str
    code: str
    name: str
    year: int
    status: SeasonStatus = Field(default=SeasonStatus.ACTIVE)
    start_date: Optional[str] = Field(default=None)
    end_date: Optional[str] = Field(default=None)
    description: str = Field(default="")
    collections: List[Collection] = Field(default_factory=list)
    linked_products_count: int = Field(default=0, description="Total PIM items linked across all collections")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================================================
# Sprint 5: Domain Registries Models (Tabelle Anagrafiche di Dominio)
# ============================================================================


class RegistryDomain(str, Enum):
    PIM = "pim"
    PLM = "plm"


class DomainRegistryEntryCreate(BaseModel):
    """Payload to add a master data entry to a PLM or PIM registry."""

    registry_domain: RegistryDomain = Field(default=RegistryDomain.PLM)
    registry_name: str = Field(default="", description="e.g. suppliers, subcontractors, categories, phases")
    entry_code: str = Field(default="", description="Unique code within registry, e.g., LWG_GOLD, FERMO_LAB_01")
    code: Optional[str] = Field(default=None, description="Alias for entry_code")
    label_it: str = Field(..., min_length=2, description="Italian display label")
    label_en: str = Field(..., min_length=2, description="English display label")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Registry-specific extra parameters")
    is_active: bool = Field(default=True)
    sort_order: int = Field(default=0)


class DomainRegistryEntry(DomainRegistryEntryCreate):
    """Persisted Master Data entry."""

    id: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DomainRegistryEntryUpdate(BaseModel):
    """Payload to update an existing master data entry in a PLM or PIM registry."""

    label_it: Optional[str] = Field(default=None, min_length=1, description="Italian display label")
    label_en: Optional[str] = Field(default=None, description="English display label")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Registry-specific extra parameters")
    is_active: Optional[bool] = Field(default=None)
    sort_order: Optional[int] = Field(default=None)


# ============================================================================
# Sprint 5: Dynamic Schema Attributes Models (Founder Data Model Studio)
# ============================================================================


class AttributeFieldType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    SELECT = "select"
    BOOLEAN = "boolean"
    DATE = "date"


class AttributeTargetEntity(str, Enum):
    PIM_ITEM = "pim_item"
    PLM_VARIANT = "plm_variant"
    BOM_ITEM = "bom_item"


class SchemaAttributeDefinitionCreate(BaseModel):
    """Payload to define or extend a custom field on a domain entity."""

    target_entity: AttributeTargetEntity
    field_key: str = Field(..., min_length=2, description="Technical identifier, e.g. heel_height_mm")
    label_it: str = Field(..., min_length=2, description="Label in Italian")
    label_en: str = Field(..., min_length=2, description="Label in English")
    field_type: AttributeFieldType
    options: List[str] = Field(default_factory=list, description="Allowed options for select fields")
    is_required: bool = Field(default=False)
    default_value: Optional[Any] = Field(default=None)
    group_name: str = Field(default="Specifiche Tecniche", description="UI group heading")
    is_system: bool = Field(default=False, description="System core field vs user custom field")
    description: str = Field(default="")


class SchemaAttributeDefinition(SchemaAttributeDefinitionCreate):
    """Persisted Schema Attribute Definition."""

    attribute_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================================================
# Subcontractor Assignments & Portal Models
# ============================================================================


class SubcontractorAssignment(BaseModel):
    """Represents a 0 EUR Subcontractor ('Terzista') assigned to a specific production phase and lot."""

    assignment_id: str = Field(..., description="Unique assignment identifier")
    subcontractor_name: str = Field(..., min_length=2, description="Name of the partner subcontractor lab")
    district: str = Field(..., description="Manufacturing district, e.g., Fermo-Macerata, Santa Croce, Riviera del Brenta")
    phase: ProductionPhase
    material_lot_code: str = Field(..., description="Traceable batch/lot code confirmed by the subcontractor")
    completed: bool = Field(default=False, description="Zero-Training confirmation status from subcontractor portal")
    confirmed_at: Optional[datetime] = Field(default=None)


class SubcontractorStepConfirmRequest(BaseModel):
    """Payload for the 3-Click 0 EUR Mobile Subcontractor Portal confirmation."""

    pim_item_id: str = Field(..., description="Step 1 context: target PIM Commercial Item ID")
    plm_variant_id: str = Field(..., description="Step 1 context: target PLM Production Variant ID")
    assignment_id: str = Field(..., description="Step 1: selected subcontractor assignment ID")
    material_lot_code: str = Field(..., min_length=3, description="Step 2: verified or updated material batch/lot code")
    operator_note: Optional[str] = Field(default=None, description="Step 3 optional note on quality/completion")


class SubcontractorStepConfirmResponse(BaseModel):
    """Response returned after the 3rd click on the Subcontractor Mobile Portal."""

    status: str = Field(default="confirmed")
    clicks_required: int = Field(default=3)
    subcontractor_license_cost_eur: float = Field(default=0.0)
    pim_item_id: str
    plm_variant_id: str
    updated_assignment: SubcontractorAssignment
    dpp_ready: bool
    confirmed_steps_count: int
    total_steps_count: int


# ============================================================================
# Multi-Level BOM Models (3-Level Hierarchy & Costing)
# ============================================================================


class BomItem(BaseModel):
    """Multi-level Bill of Materials (BOM) line item for a PLM Production Variant (supports Level 1 -> Level 2 -> Level 3)."""

    bom_item_id: str = Field(..., description="Unique BOM line identifier")
    level: int = Field(default=1, ge=1, le=5, description="Hierarchy depth in the multi-level BOM (1 = direct, 2 = sub-assembly, 3 = raw/tier-2)")
    parent_bom_item_id: Optional[str] = Field(default=None, description="Parent BOM item ID required when level > 1")
    component_type: BomComponentType
    material_name: str = Field(..., min_length=2)
    supplier_name: str = Field(default="")
    vendor_id: Optional[str] = Field(default=None, description="Optional FK to vendors_registry (Sprint 8)")
    master_color_id: Optional[str] = Field(default=None, description="Optional FK to master_colors (Sprint 8)")
    origin_country_iso2: str = Field(..., min_length=2, max_length=2, pattern="^[A-Z]{2}$")
    unit_of_measure: str = Field(..., description="e.g., sqft, m2, pair, pcs, kg")
    unit_consumption: float = Field(..., gt=0, description="Net material consumption per unit/pair")
    waste_percentage: float = Field(default=5.0, ge=0.0, le=100.0)
    recycled_content_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    certifications: List[str] = Field(default_factory=list, description="e.g., LWG Gold, REACH, GRS, OEKO-TEX")
    unit_cost_eur: float = Field(default=11.50, ge=0.0, description="Internal Brand/PMI L6 unit material cost (hidden from 0 EUR Subcontractor view)")
    lot_certificate_id: str = Field(default="CERT-ESPR-2026-IT", description="Material certificate reference for Customs/Inspector DPP view")
    custom_attributes: Dict[str, Any] = Field(default_factory=dict, description="Dynamic custom attributes defined in schema studio")


class BomTreeNode(BaseModel):
    """Hierarchical node representation of a 3-Level BOM item with its nested children."""

    bom_item_id: str
    level: int
    parent_bom_item_id: Optional[str] = Field(default=None)
    component_type: BomComponentType
    material_name: str
    supplier_name: str = Field(default="")
    vendor_id: Optional[str] = Field(default=None)
    master_color_id: Optional[str] = Field(default=None)
    origin_country_iso2: str
    unit_of_measure: str
    unit_consumption: float
    waste_percentage: float
    recycled_content_pct: float
    certifications: List[str] = Field(default_factory=list)
    unit_cost_eur: float = Field(default=11.50)
    lot_certificate_id: str = Field(default="CERT-ESPR-2026-IT")
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)
    children: List[Dict[str, Any]] = Field(default_factory=list)


class BomHierarchySummary(BaseModel):
    """Summary of the 3-level BOM hierarchy across all N PLM variants of a PIM item."""

    level_1_count: int = Field(default=0)
    level_2_count: int = Field(default=0)
    level_3_count: int = Field(default=0)
    max_depth_reached: int = Field(default=1)
    total_components: int = Field(default=0)


# ============================================================================
# Sprint 7: Product Categories Hierarchy (Multi-Level Tree) & BOM Templates (ADR-010)
# ============================================================================


class ProductCategoryHierarchyNode(BaseModel):
    category_id: str
    parent_id: Optional[str] = None
    level: int = 1
    code: str
    slug_path: str
    label_it: str
    label_en: str
    icon: str = "🏷️"
    is_active: bool = True
    sort_order: int = 0
    children: List[ProductCategoryHierarchyNode] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class ProductCategoryCreate(BaseModel):
    category_id: Optional[str] = None
    parent_id: Optional[str] = None
    level: int = 1
    code: str
    slug_path: Optional[str] = None
    label_it: str
    label_en: str
    icon: str = "🏷️"
    is_active: bool = True
    sort_order: int = 0


class ProductCategoryUpdate(BaseModel):
    parent_id: Optional[str] = None
    label_it: Optional[str] = None
    label_en: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class BomTemplateItem(BaseModel):
    level: int = 1
    parent_template_item_id: Optional[str] = None
    template_item_id: str
    component_type: BomComponentType
    material_name: str
    supplier_name: str = "Fornitore Distrettuale Certificato"
    origin_country_iso2: str = "IT"
    unit_of_measure: str = "dm2"
    unit_consumption: float = 1.0
    waste_percentage: float = 5.0
    recycled_content_pct: float = 0.0
    certifications: List[str] = Field(default_factory=list)
    unit_cost_eur: float = 10.0


class BomTemplateCreate(BaseModel):
    template_id: Optional[str] = None
    name: str = Field(..., min_length=3)
    category_id: str
    construction_type: str = "cassetta_cucita"
    description: str = ""
    items: List[BomTemplateItem] = Field(default_factory=list)


class BomTemplate(BomTemplateCreate):
    template_id: str
    created_at: Optional[datetime] = None


class CreateBomTemplateFromVariantRequest(BaseModel):
    name: str = Field(..., min_length=3)
    category_id: str
    construction_type: str = "cassetta_cucita"
    description: str = ""


class BomItemMoveRequest(BaseModel):
    new_level: int = Field(..., ge=1, le=3)
    new_parent_id: Optional[str] = None


class VariantDeepCloneRequest(BaseModel):
    new_variant_code: str = Field(..., min_length=3)
    new_colorway_name: str = Field(..., min_length=2)
    new_size_range: Optional[str] = "35-42"
    new_last_or_pattern_code: Optional[str] = None
    clone_bom: bool = True
    material_replacements: Optional[Dict[str, str]] = None


class BulkImportValidationRow(BaseModel):
    row_number: int
    entity_type: str
    identifier: str
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    parsed_data: Dict[str, Any] = Field(default_factory=dict)


class BulkImportValidationResponse(BaseModel):
    total_rows: int
    valid_rows_count: int
    invalid_rows_count: int
    rows: List[BulkImportValidationRow] = Field(default_factory=list)
    summary: str


class BulkImportCommitRequest(BaseModel):
    import_type: str = "articles"  # 'articles' | 'bom' | 'all_in_one'
    valid_rows: List[Dict[str, Any]] = Field(default_factory=list)


class BulkImportCommitResponse(BaseModel):
    success: bool
    imported_items_count: int = 0
    imported_variants_count: int = 0
    imported_bom_count: int = 0
    message: str


# ============================================================================
# PLM Production Variants & PIM Commercial Items
# ============================================================================


class PlmProductionVariantCreate(BaseModel):
    """Payload to create a factory-level PLM Production Variant linked to 1 PIM Commercial Item."""

    variant_code: str = Field(..., min_length=3, description="Factory technical code, e.g., ART-880-VIT-NERO-40")
    colorway_name: str = Field(..., min_length=2)
    size_range: str = Field(default="35-42", description="Production size scale")
    last_or_pattern_code: str = Field(..., description="Shoe last ('forma') or bag/apparel pattern code")
    lifecycle_status: PlmLifecycleStatus = Field(default=PlmLifecycleStatus.PROTOTYPE)
    bom_version: str = Field(default="v1.0", description="Snapshot version of the BOM")
    bom_snapshot_locked: bool = Field(default=False, description="True when lifecycle reaches industrialized or in_production")
    sample_base_size: str = Field(default="42", description="Reference sample size for BOM grading")
    size_grading_step_pct: float = Field(default=2.8, description="Material consumption delta % per size step")
    standard_labor_cost_eur: float = Field(default=28.0, ge=0.0, description="Internal Brand/PMI L6 assembly/labor cost in EUR")
    collection_id: Optional[str] = Field(default=None, description="Optional variant-specific collection override")
    target_gender: Optional[str] = Field(default="unisex", description="Target gender: uomo, donna, unisex, bambino")
    category_id: Optional[str] = Field(default=None, description="FK to product_categories_hierarchy")
    sub_category_id: Optional[str] = Field(default=None, description="FK to sub-category hierarchy node")
    construction_type: Optional[str] = Field(default="cassetta_cucita", description="Manufacturing construction method")
    carryover_status: Optional[str] = Field(default="seasonal_core", description="Merchandising status: carryover, seasonal_core, seasonal_trend, capsule_drop")
    primary_color_id: Optional[str] = Field(default=None, description="Sprint 8 primary master_color_id")
    secondary_color_id: Optional[str] = Field(default=None, description="Sprint 8 secondary master_color_id")
    hardware_finish_color_id: Optional[str] = Field(default=None, description="Sprint 8 hardware galvanic master_color_id")
    colorway_rule_preset: Optional[str] = Field(default="tone_on_tone", description="Sprint 8 colorway rule preset")
    category_specific_specs: Dict[str, Any] = Field(
        default_factory=dict,
        description="Sector-specific technical attributes (Footwear: last/construction/sole; Leather Goods: CAD/galvanic/edge; Apparel: fit/gsm/POM)",
    )
    custom_attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dynamic attributes configured via Founder Data Model Studio",
    )
    bom_items: List[BomItem] = Field(default_factory=list)
    subcontractor_assignments: List[SubcontractorAssignment] = Field(default_factory=list)


# ============================================================================
# Product Models Hierarchy (FTL-CEO-021)
# ============================================================================


class ProductModelCreate(BaseModel):
    """Payload to define a base Product Model (Style / Last / Construction) prior to material+color SKU decline."""

    model_code: str = Field(..., min_length=2, description="Unique model code, e.g. MOD-OXFORD-01")
    name: str = Field(..., min_length=2, description="Model style name, e.g. Oxford Classic Cap-Toe")
    category: ProductCategory = Field(default=ProductCategory.FOOTWEAR)
    target_gender: str = Field(default="unisex", description="Target gender: men, women, unisex, kids")
    last_code: str = Field(default="Forma Standard", description="Last / Forma code")
    sole_construction: str = Field(default="Blake", description="Construction type: Goodyear, Blake, Strobel, Tubolare, etc.")
    heel_height_mm: float = Field(default=25.0, ge=0.0, description="Heel / bottom height in mm")
    default_size_range: str = Field(default="39-46", description="Standard size scale")
    season_id: Optional[str] = Field(default=None, description="FK to Season")
    collection_id: Optional[str] = Field(default=None, description="FK to Collection")
    description: str = Field(default="", description="Technical and styling model notes")
    cad_drawing_ref: str = Field(default="", description="CAD / pattern reference, e.g. DXF drawing code")
    is_active: bool = Field(default=True)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ProductModelUpdate(BaseModel):
    """Payload to update an existing Product Model."""

    name: Optional[str] = None
    category: Optional[ProductCategory] = None
    target_gender: Optional[str] = None
    last_code: Optional[str] = None
    sole_construction: Optional[str] = None
    heel_height_mm: Optional[float] = None
    default_size_range: Optional[str] = None
    season_id: Optional[str] = None
    collection_id: Optional[str] = None
    description: Optional[str] = None
    cad_drawing_ref: Optional[str] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class ProductModel(ProductModelCreate):
    """Persisted Product Model aggregating 1:N PIM Commercial Items / SKUs."""

    model_id: str
    attached_products_count: int = Field(default=0, description="Count of linked commercial PIM products")
    attached_variants_count: int = Field(default=0, description="Count of linked PLM production variants")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AttachProductRequest(BaseModel):
    """Request to link an existing PIM SKU to a Product Model."""

    pim_item_id: str = Field(..., description="Target PIM Commercial Item ID")


class DetachProductRequest(BaseModel):
    """Request to unlink a PIM SKU from a Product Model."""

    pim_item_id: str = Field(..., description="Target PIM Commercial Item ID")


class PlmProductionVariant(PlmProductionVariantCreate):
    """Persisted PLM Production Variant (the 'N' side of the 1 PIM <-> N PLM relationship)."""

    plm_variant_id: str
    pim_item_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PimInitialVariantPayload(PlmProductionVariantCreate):
    """FTL-CEO-028: initial PLM variant sent with a PIM creation request.

    `plm_variant_id` is optional so the SPA can keep the client-generated ID (offline-first),
    guaranteeing that the same PLM product is addressable in both PLM and PIM after a refresh.
    """

    plm_variant_id: Optional[str] = Field(default=None, description="Optional client-generated PLM variant ID")


class PimCommercialItemCreate(BaseModel):
    """Payload to create a commercial catalog item (the '1' side of the 1 PIM <-> N PLM relationship)."""

    pim_item_id: Optional[str] = Field(
        default=None, description="FTL-CEO-028: optional client-generated PIM ID (offline-first sync)"
    )
    model_id: Optional[str] = Field(default=None, description="FK to ProductModel (FTL-CEO-021)")
    sku_code: str = Field(..., min_length=3, description="Master commercial SKU")
    model_name: str = Field(..., min_length=2)
    brand_tenant_id: str = Field(..., description="Multi-tenant identifier for the Brand or SME")
    season: str = Field(..., description="Human-readable season, e.g., P/E 2026, SS26, FW26")
    season_id: Optional[str] = Field(default=None, description="FK to Season entity")
    collection_id: Optional[str] = Field(default=None, description="FK to Collection entity")
    collection_name: Optional[str] = Field(default=None, description="Human-readable collection name")
    category: ProductCategory = Field(default=ProductCategory.FOOTWEAR)
    category_id: Optional[str] = Field(default=None, description="FK to product_categories_hierarchy")
    sub_category_id: Optional[str] = Field(default=None, description="FK to sub-category hierarchy node")
    target_gender: Optional[str] = Field(default="unisex", description="Target gender: uomo, donna, unisex, bambino")
    carryover_status: Optional[str] = Field(default="seasonal_core", description="Merchandising status: carryover, seasonal_core, seasonal_trend, capsule_drop")
    brand_line: Optional[str] = Field(default="Main Line", description="Brand line: Main Line, Studio, Heritage, Atelier")
    target_occasion: Optional[str] = Field(default="smart_casual", description="Lifestyle occasion: business_formal, smart_casual, evening_gala, urban_active, outdoor_leisure")
    price_tier: Optional[str] = Field(default="core_luxury", description="Price segment: entry_luxury, core_luxury, high_luxury, bespoke")
    commercial_description_it: str = Field(..., min_length=5)
    commercial_description_en: str = Field(..., min_length=5)
    retail_channels: List[str] = Field(default_factory=lambda: ["B2B Showroom", "E-Commerce", "Wholesale"])
    wholesale_price_eur: float = Field(default=155.0, ge=0.0)
    retail_price_eur: float = Field(default=420.0, ge=0.0)
    hs_customs_code: str = Field(default="6403.59.95")
    gtin_ean: str = Field(default="8050012026018")
    publishing_status: str = Field(default="PUBLISHED")
    care_instructions: str = Field(
        default="Pulire con panno morbido, nutrire con cera naturale certificata e conservare su forma in cedro. Suola/componenti riparabili presso la rete ufficiale."
    )
    end_of_life_guide: str = Field(
        default="Programma Circolare Take-Back Footlink: restituzione gratuita a fine vita per disassemblaggio tomaia/fondo/accessori e riciclo filiera UE."
    )
    custom_attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dynamic custom attributes configured via Founder Data Model Studio",
    )
    initial_plm_variants: List[PimInitialVariantPayload] = Field(
        default_factory=list,
        description="Optional initial N PLM production variants created alongside the PIM item",
    )


class PimCommercialItem(BaseModel):
    """Persisted 1 PIM Commercial Item aggregating N PLM Production Variants."""

    pim_item_id: str
    model_id: Optional[str] = Field(default=None, description="FK to ProductModel (FTL-CEO-021)")
    sku_code: str
    model_name: str
    brand_tenant_id: str
    season: str
    season_id: Optional[str] = Field(default=None)
    collection_id: Optional[str] = Field(default=None)
    collection_name: Optional[str] = Field(default=None)
    category: ProductCategory
    category_id: Optional[str] = Field(default=None)
    sub_category_id: Optional[str] = Field(default=None)
    target_gender: Optional[str] = Field(default="unisex", description="Target gender: uomo, donna, unisex, bambino")
    carryover_status: Optional[str] = Field(default="seasonal_core")
    brand_line: Optional[str] = Field(default="Main Line")
    target_occasion: Optional[str] = Field(default="smart_casual")
    price_tier: Optional[str] = Field(default="core_luxury")
    commercial_description_it: str
    commercial_description_en: str
    retail_channels: List[str]
    wholesale_price_eur: float = Field(default=155.0)
    retail_price_eur: float = Field(default=420.0)
    hs_customs_code: str = Field(default="6403.59.95")
    gtin_ean: str = Field(default="8050012026018")
    publishing_status: str = Field(default="PUBLISHED")
    care_instructions: str = Field(
        default="Pulire con panno morbido, nutrire con cera naturale certificata e conservare su forma in cedro. Suola/componenti riparabili presso la rete ufficiale."
    )
    end_of_life_guide: str = Field(
        default="Programma Circolare Take-Back Footlink: restituzione gratuita a fine vita per disassemblaggio tomaia/fondo/accessori e riciclo filiera UE."
    )
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)
    plm_variants: List[PlmProductionVariant] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PimCommercialItemUpdate(BaseModel):
    """FTL-CEO-028: PIM enrichment payload (commercial fields only).

    PLM-owned data (variants, BOM, subcontractors, season/collection assignment) is intentionally
    excluded: PLM remains the industrial source of truth, PIM enriches it commercially.
    """

    model_name: Optional[str] = Field(default=None, min_length=2)
    commercial_description_it: Optional[str] = Field(default=None, min_length=5)
    commercial_description_en: Optional[str] = Field(default=None, min_length=5)
    retail_channels: Optional[List[str]] = None
    wholesale_price_eur: Optional[float] = Field(default=None, ge=0.0)
    retail_price_eur: Optional[float] = Field(default=None, ge=0.0)
    hs_customs_code: Optional[str] = None
    gtin_ean: Optional[str] = None
    publishing_status: Optional[str] = None
    care_instructions: Optional[str] = None
    end_of_life_guide: Optional[str] = None
    brand_line: Optional[str] = None
    target_occasion: Optional[str] = None
    price_tier: Optional[str] = None
    custom_attributes: Optional[Dict[str, Any]] = None


class ProductModelWithProducts(ProductModel):
    """Product Model with nested list of attached PIM items & PLM variants."""

    attached_pim_items: List[PimCommercialItem] = Field(default_factory=list)




# ============================================================================
# PIM Data Quality Report & Digital Product Passport
# ============================================================================


class PimDataQualityReport(BaseModel):
    """FEAT-05: Deterministic PIM & ESPR Data Quality Score (0-100%) and DPP publication gate."""

    pim_item_id: str
    sku_code: str
    model_name: str
    data_quality_score: int = Field(..., ge=0, le=100)
    dpp_publication_unlocked: bool
    checks: Dict[str, bool]
    missing_fields: List[str] = Field(default_factory=list)


class DigitalProductPassport(BaseModel):
    """EU ESPR Digital Product Passport (DPP) dynamically synthesized from 1 PIM Item + N PLM Variants."""

    dpp_id: str
    regulation_standard: str = Field(default="EU-ESPR-DPP-v1.0")
    pim_item_id: str
    sku_code: str
    model_name: str
    category: ProductCategory
    brand_tenant_id: str
    public_qr_url: str
    qr_target_url: str = Field(default="")
    qr_svg_endpoint: str = Field(default="")
    qr_svg_data_uri: str = Field(default="")
    total_plm_variants_covered: int
    countries_of_origin: List[str]
    certifications_verified: List[str]
    average_recycled_content_pct: float
    carbon_footprint_estimate_kg: float = Field(default=0.0)
    water_footprint_liters: float = Field(default=0.0)
    repairability_index: float = Field(default=8.5)
    data_quality_score: int = Field(default=100)
    traceable_subcontractors_count: int
    completed_subcontractor_steps_count: int = Field(default=0)
    total_subcontractor_steps_count: int = Field(default=0)
    bom_hierarchy_summary: BomHierarchySummary = Field(default_factory=BomHierarchySummary)
    espr_compliance_checklist: Dict[str, bool] = Field(default_factory=dict)
    supply_chain_steps: List[Dict[str, Any]]
    customs_inspector_dossier: Dict[str, Any] = Field(default_factory=dict)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    dpp_compliance_ready: bool


# ============================================================================
# Sprint 6: District PaaS (Companies & Users) - ADR-008
# ============================================================================


class CompanyTier(str, Enum):
    ENTERPRISE = "enterprise"
    PMI = "pmi"
    SUBCONTRACTOR_ZERO_EUR = "subcontractor_zero_eur"


class CompanyBusinessType(str, Enum):
    BRAND = "brand"
    MANUFACTURER = "manufacturer"
    TANNERY = "tannery"
    SUBCONTRACTOR_LAB = "subcontractor_lab"
    COMPONENTS_SUPPLIER = "components_supplier"


class DistrictUserRole(str, Enum):
    BRAND_ADMIN = "brand_admin"
    PRODUCT_MANAGER = "product_manager"
    FACTORY_TECH_LEAD = "factory_tech_lead"
    TANNERY_OPERATOR = "tannery_operator"
    SUBCONTRACTOR_OPERATOR = "subcontractor_operator"
    CUSTOMS_INSPECTOR = "customs_inspector"


class CompanyCreate(BaseModel):
    legal_name: str = Field(..., min_length=2)
    business_name: str = Field(..., min_length=2)
    vat_number: str = Field(..., min_length=5)
    district: str = Field(default="Fermo-Macerata")
    company_tier: CompanyTier = Field(default=CompanyTier.PMI)
    business_type: CompanyBusinessType = Field(default=CompanyBusinessType.MANUFACTURER)
    contact_email: str = Field(...)
    phone: str = Field(default="")
    website: str = Field(default="")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = Field(default=True)


class CompanyUpdate(BaseModel):
    legal_name: Optional[str] = None
    business_name: Optional[str] = None
    district: Optional[str] = None
    company_tier: Optional[CompanyTier] = None
    business_type: Optional[CompanyBusinessType] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class Company(CompanyCreate):
    company_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    email: str = Field(..., min_length=5)
    full_name: str = Field(..., min_length=2)
    password: Optional[str] = Field(default="Footlink2026!")
    is_platform_admin: bool = Field(default=False)
    is_active: bool = Field(default=True)


class User(BaseModel):
    user_id: str
    email: str
    full_name: str
    is_platform_admin: bool = Field(default=False)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CompanyMembershipCreate(BaseModel):
    company_id: str
    user_id: str
    role: DistrictUserRole = Field(default=DistrictUserRole.PRODUCT_MANAGER)
    status: str = Field(default="active")


class CompanyMembership(CompanyMembershipCreate):
    membership_id: str
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None
    company_business_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================================================
# Sprint 6: Tannery Batches & Document Vault (FTL-CEO-006)
# ============================================================================


class TanneryProcess(str, Enum):
    VEGETABLE = "vegetable"
    CHROME = "chrome"
    METAL_FREE = "metal_free"
    SYNTHETIC_BIO = "synthetic_bio"


class TanneryDocumentType(str, Enum):
    LWG_CERTIFICATE = "lwg_certificate"
    ICEC_TRACEABILITY = "icec_traceability"
    REACH_CHEMICAL_TEST = "reach_chemical_test"
    TECHNICAL_DATASHEET = "technical_datasheet"
    EUDR_DUE_DILIGENCE = "eudr_due_diligence"
    DELIVERY_NOTE = "delivery_note"


class TanneryDocumentCreate(BaseModel):
    doc_type: TanneryDocumentType
    file_name: str = Field(..., min_length=3)
    mime_type: str = Field(default="application/pdf")
    file_size_bytes: int = Field(default=0, ge=0)
    data_payload: str = Field(default="", description="Base64 encoded content or text payload")
    valid_until: Optional[str] = Field(default=None, description="ISO Date YYYY-MM-DD")
    is_verified: bool = Field(default=True)


class TanneryDocument(TanneryDocumentCreate):
    document_id: str
    batch_id: str
    sha256_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TanneryDocumentVerifyResponse(BaseModel):
    document_id: str
    batch_id: str
    file_name: str
    stored_sha256_hash: str
    computed_sha256_hash: str
    is_authentic: bool
    verification_status: str
    verified_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TanneryBatchCreate(BaseModel):
    company_id: str
    batch_code: str = Field(..., min_length=2)
    tannery_name: str = Field(default="")
    vendor_id: Optional[str] = Field(default=None, description="Optional FK to vendors_registry (Sprint 8)")
    master_color_id: Optional[str] = Field(default=None, description="Optional FK to master_colors (Sprint 8)")
    district: str = Field(default="Arzignano / Valle del Chiampo")
    leather_type: str = Field(default="Vitello Pieno Fiore")
    tanning_process: TanneryProcess = Field(default=TanneryProcess.METAL_FREE)
    raw_hide_origin_country: str = Field(default="IT", max_length=2)
    slaughterhouse_traceability_id: str = Field(default="")
    eudr_deforestation_free: bool = Field(default=True)
    lwg_rating: str = Field(default="Gold")
    lwg_score_pct: float = Field(default=94.5, ge=0.0, le=100.0)
    icec_certificate_id: str = Field(default="ICEC-TS410-0982")
    reach_svhc_compliant: bool = Field(default=True)
    chrome_vi_content_ppm: float = Field(default=0.0, ge=0.0)
    thickness_mm: str = Field(default="1.2 - 1.4 mm")
    available_qty_sqft: float = Field(default=5000.0, ge=0.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = Field(default=True)


class TanneryBatchUpdate(BaseModel):
    batch_code: Optional[str] = None
    tannery_name: Optional[str] = None
    vendor_id: Optional[str] = None
    master_color_id: Optional[str] = None
    district: Optional[str] = None
    leather_type: Optional[str] = None
    tanning_process: Optional[TanneryProcess] = None
    raw_hide_origin_country: Optional[str] = None
    slaughterhouse_traceability_id: Optional[str] = None
    eudr_deforestation_free: Optional[bool] = None
    lwg_rating: Optional[str] = None
    lwg_score_pct: Optional[float] = None
    icec_certificate_id: Optional[str] = None
    reach_svhc_compliant: Optional[bool] = None
    chrome_vi_content_ppm: Optional[float] = None
    thickness_mm: Optional[str] = None
    available_qty_sqft: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class TanneryBatch(TanneryBatchCreate):
    batch_id: str
    documents: List[TanneryDocument] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================================================
# Sprint 6: Production Orders Hub, Size Breakdown Matrix & BOM Wastage
# ============================================================================


class ProductionOrderStatus(str, Enum):
    DRAFT = "draft"
    RELEASED = "released"
    IN_PRODUCTION = "in_production"
    QUALITY_CHECK = "quality_check"
    COMPLETED = "completed"
    HALTED = "halted"
    CANCELLED = "cancelled"


class OrderSizeBreakdownItem(BaseModel):
    size_code: str = Field(..., description="Size label e.g., '39', '40', '41'")
    planned_quantity: int = Field(..., gt=0)
    completed_quantity: int = Field(default=0, ge=0)
    scrapped_quantity: int = Field(default=0, ge=0)


class ProductionOrderPhaseItem(BaseModel):
    phase_id: str
    order_id: str
    phase_code: ProductionPhase
    phase_sequence: int = Field(..., ge=1)
    subcontractor_name: str
    subcontractor_id: Optional[str] = None
    district: str = Field(default="Fermo-Macerata")
    status: str = Field(default="pending")
    target_quantity: int = Field(..., gt=0)
    conform_quantity: int = Field(default=0, ge=0)
    scrapped_quantity: int = Field(default=0, ge=0)
    waste_reason_code: Optional[str] = None
    material_lot_code: str = Field(default="")
    magic_token: str
    confirmed_at: Optional[datetime] = None
    operator_notes: str = Field(default="")


class ProductionOrderCreate(BaseModel):
    order_code: str = Field(..., min_length=2)
    company_id: str
    plm_variant_id: str
    pim_item_id: str
    season_id: Optional[str] = None
    collection_id: Optional[str] = None
    tannery_batch_id: Optional[str] = None
    status: ProductionOrderStatus = Field(default=ProductionOrderStatus.DRAFT)
    target_delivery_date: str = Field(..., description="ISO Date YYYY-MM-DD")
    notes: str = Field(default="")
    size_breakdown: List[OrderSizeBreakdownItem] = Field(..., min_length=1)
    phases: Optional[List[Dict[str, Any]]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ProductionOrderUpdate(BaseModel):
    status: Optional[ProductionOrderStatus] = None
    target_delivery_date: Optional[str] = None
    notes: Optional[str] = None
    tannery_batch_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ProductionOrder(BaseModel):
    order_id: str
    order_code: str
    company_id: str
    plm_variant_id: str
    pim_item_id: str
    variant_code: Optional[str] = None
    model_name: Optional[str] = None
    season_id: Optional[str] = None
    collection_id: Optional[str] = None
    tannery_batch_id: Optional[str] = None
    tannery_batch_code: Optional[str] = None
    status: ProductionOrderStatus
    total_planned_pairs: int
    total_completed_pairs: int = Field(default=0)
    total_scrapped_pairs: int = Field(default=0)
    start_date: Optional[str] = None
    target_delivery_date: str
    notes: str = Field(default="")
    size_breakdown: List[OrderSizeBreakdownItem] = Field(default_factory=list)
    phases: List[ProductionOrderPhaseItem] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SubcontractorPhaseConfirmRequest(BaseModel):
    """Payload sent by mobile subcontractor on phase completion (3-clic a 0 EUR)."""

    conform_quantity: int = Field(..., ge=0)
    scrapped_quantity: int = Field(default=0, ge=0)
    waste_reason_code: Optional[str] = None
    operator_notes: Optional[str] = None


class BomSizeRequirementItem(BaseModel):
    bom_item_id: str
    material_name: str
    component_type: str
    unit_of_measure: str
    base_consumption: float
    grading_delta_pct: float
    waste_percentage: float
    net_requirement: float
    gross_requirement_with_waste: float
    requirement_by_size: Dict[str, float]


class BomRequirementsCalculationRequest(BaseModel):
    plm_variant_id: str
    size_breakdown: List[OrderSizeBreakdownItem]
    custom_waste_override_pct: Optional[float] = None


class BomRequirementsCalculationResult(BaseModel):
    plm_variant_id: str
    total_pairs: int
    requirements: List[BomSizeRequirementItem]
    total_leather_sqft_gross: float = Field(default=0.0)
    total_soles_pairs_gross: int = Field(default=0)
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================================================
# Sprint 8 (Epoca II - La Verticalizzazione):
#   FTL-TECH-022: Color Intelligence Engine, Lab-Dip & Colorway BOM Matrix
#   FTL-TECH-023: Vendor Hub 360, SHA-256 Certifications, L6 Segregation & Where-Used
# ============================================================================


class MasterColorCreate(BaseModel):
    """Payload to create a Master or Seasonal Color entry."""

    id: Optional[str] = None
    color_id: Optional[str] = None
    color_code: str = Field(..., min_length=2, description="Unique industrial color code, e.g., COL-BLK-001")
    technical_name_it: str = Field(..., min_length=2, description="Italian technical name")
    technical_name_en: str = Field(default="", description="English technical name")
    commercial_family: str = Field(default="Nero / Black", description="Omnichannel commercial color family")
    hex_code: str = Field(default="#141414", pattern="^#[0-9A-Fa-f]{6}$", description="Validated 7-char RGB HEX")
    pantone_tcx_code: str = Field(default="", description="Pantone TCX/TPG reference")
    ral_code: str = Field(default="", description="RAL reference for hardware/soles")
    finish_type: str = Field(default="pieno_fiore_naturale", description="Surface/material finish type")
    applicable_domains: List[str] = Field(
        default_factory=lambda: ["pellame", "fodera", "suola", "minuterie", "filati", "packaging"]
    )
    season_id: Optional[str] = Field(default=None, description="Optional FK to Season (None/ALL_CARRYOVER = master)")
    season_ids: Optional[List[str]] = Field(default=None)
    recipe_notes: str = Field(default="", description="Tannery recipe or galvanic bath technical notes")
    is_active: bool = Field(default=True)


class MasterColorUpdate(BaseModel):
    """Payload to update an existing Master or Seasonal Color entry."""

    color_code: Optional[str] = None
    technical_name_it: Optional[str] = None
    technical_name_en: Optional[str] = None
    commercial_family: Optional[str] = None
    hex_code: Optional[str] = Field(default=None, pattern="^#[0-9A-Fa-f]{6}$")
    pantone_tcx_code: Optional[str] = None
    ral_code: Optional[str] = None
    finish_type: Optional[str] = None
    applicable_domains: Optional[List[str]] = None
    season_id: Optional[str] = None
    season_ids: Optional[List[str]] = None
    recipe_notes: Optional[str] = None
    is_active: Optional[bool] = None


class MasterColor(BaseModel):
    """Persisted Master or Seasonal Color entity."""

    id: str
    color_id: str
    color_code: str
    technical_name_it: str
    technical_name_en: str = Field(default="")
    commercial_family: str = Field(default="Nero / Black")
    hex_code: str = Field(default="#141414", pattern="^#[0-9A-Fa-f]{6}$")
    pantone_tcx_code: str = Field(default="")
    ral_code: str = Field(default="")
    finish_type: str = Field(default="pieno_fiore_naturale")
    applicable_domains: List[str] = Field(default_factory=list)
    season_id: Optional[str] = Field(default=None)
    season_ids: List[str] = Field(default_factory=lambda: ["ALL_CARRYOVER"])
    recipe_notes: str = Field(default="")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ColorwayBomMappingUpsertItem(BaseModel):
    """Single BOM node color & Lab-Dip assignment inside a variant's Colorway Matrix."""

    bom_item_id: str
    master_color_id: Optional[str] = None
    part_role: str = Field(default="tomaia_principale")
    galvanics_finish: Optional[str] = None
    lab_dip_status: str = Field(default="pending")
    delta_e_value: Optional[float] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    notes: str = Field(default="")


class ColorwayMatrixUpsertRequest(BaseModel):
    """Payload for PUT /api/v1/plm-variants/{variant_id}/colorway-matrix."""

    primary_color_id: Optional[str] = None
    secondary_color_id: Optional[str] = None
    hardware_finish_color_id: Optional[str] = None
    colorway_rule_preset: Optional[str] = Field(default="tone_on_tone")
    mappings: List[ColorwayBomMappingUpsertItem] = Field(default_factory=list)


class ColorwayBomMappingRow(BaseModel):
    """Hydrated BOM node row inside ColorwayMatrixResponse."""

    id: Optional[str] = None
    plm_variant_id: str
    bom_item_id: str
    level: int = Field(default=1)
    parent_bom_item_id: Optional[str] = None
    component_type: str
    material_name: str
    supplier_name: str = Field(default="")
    vendor_id: Optional[str] = None
    master_color_id: Optional[str] = None
    color_code: Optional[str] = None
    technical_name_it: Optional[str] = None
    commercial_family: Optional[str] = None
    hex_code: Optional[str] = None
    pantone_tcx_code: Optional[str] = None
    ral_code: Optional[str] = None
    finish_type: Optional[str] = None
    part_role: str = Field(default="tomaia_principale")
    galvanics_finish: Optional[str] = None
    lab_dip_status: str = Field(default="pending")
    delta_e_value: Optional[float] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    notes: str = Field(default="")
    tannery_color_consistency: str = Field(default="not_linked")
    linked_batch_code: Optional[str] = None


class ColorwayMatrixResponse(BaseModel):
    """Complete Colorway BOM Matrix & Lab-Dip readiness state for a PLM Production Variant."""

    plm_variant_id: str
    variant_code: str
    colorway_name: str
    primary_color_id: Optional[str] = None
    secondary_color_id: Optional[str] = None
    hardware_finish_color_id: Optional[str] = None
    colorway_rule_preset: str = Field(default="tone_on_tone")
    total_bom_nodes: int = Field(default=0)
    mapped_nodes_count: int = Field(default=0)
    approved_nodes_count: int = Field(default=0)
    rejected_nodes_count: int = Field(default=0)
    colorway_readiness_pct: float = Field(default=0.0)
    production_gate_blocked: bool = Field(default=False)
    mappings: List[ColorwayBomMappingRow] = Field(default_factory=list)


class ExplodeColorwaysRequest(BaseModel):
    """Payload for 1-Click Colorway Explosion across N target Master Colors."""

    target_color_ids: List[str]
    rule_preset: str = Field(default="tone_on_tone")
    lining_color_id: Optional[str] = None
    sole_color_id: Optional[str] = None
    hardware_color_id: Optional[str] = None
    auto_link_pim: bool = Field(default=True)


class ExplodeColorwaysResponse(BaseModel):
    """Result of 1-Click Colorway Explosion with hydrated PLM variants & 3-level BOMs."""

    source_variant_id: str
    pim_item_id: str
    rule_preset: str
    created_count: int
    created_variants: List[PlmProductionVariant] = Field(default_factory=list)


class TanneryColorConsistencyItem(BaseModel):
    """Cross-check record between Tannery Leather Batch color and BOM leather node color."""

    batch_id: str
    batch_code: str
    tannery_name: str
    vendor_id: Optional[str] = None
    batch_master_color_id: Optional[str] = None
    batch_color_code: Optional[str] = None
    batch_color_name_it: Optional[str] = None
    batch_hex_code: Optional[str] = None
    plm_variant_id: Optional[str] = None
    variant_code: Optional[str] = None
    bom_item_id: Optional[str] = None
    bom_material_name: Optional[str] = None
    bom_master_color_id: Optional[str] = None
    bom_color_code: Optional[str] = None
    bom_color_name_it: Optional[str] = None
    bom_hex_code: Optional[str] = None
    status: str = Field(default="unmapped", description="coherent | mismatch | unmapped")
    message: str = Field(default="")


class PimVariantColorEcommerceItem(BaseModel):
    """Omnichannel commercial color translation for a single PLM Variant."""

    plm_variant_id: str
    variant_code: str
    colorway_name: str
    master_color_id: Optional[str] = None
    color_code: Optional[str] = None
    technical_name_it: str
    technical_name_en: str = Field(default="")
    commercial_family: str
    hex_code: str
    pantone_tcx_code: str = Field(default="")
    finish_type: str = Field(default="")


class PimColorwaysEcommerceResponse(BaseModel):
    """Omnichannel e-commerce & B2B colorway translation for 1 PIM Commercial Item."""

    pim_item_id: str
    sku_code: str
    model_name: str
    commercial_color_families: List[str] = Field(default_factory=list)
    variants_color_map: List[PimVariantColorEcommerceItem] = Field(default_factory=list)


# ============================================================================
# Sprint 8: Vendor Hub 360, SHA-256 Certifications, L6 Segregation & Where-Used
# ============================================================================


class VendorCertificationCreate(BaseModel):
    """Payload to register a certification on a Vendor or Subcontractor."""

    cert_id: Optional[str] = None
    cert_type: str = Field(..., min_length=2)
    cert_code: str = Field(..., min_length=2)
    issuing_body: str = Field(..., min_length=2)
    valid_from: str
    valid_until: str
    sha256_hash: Optional[str] = None
    status: Optional[str] = None


class VendorCertification(BaseModel):
    """Persisted Vendor Certification with SHA-256 fingerprint and live expiry countdown."""

    cert_id: str
    vendor_id: str
    cert_type: str
    cert_code: str
    issuing_body: str
    valid_from: str
    valid_until: str
    days_to_expiry: int = Field(default=0)
    sha256_hash: str
    status: str = Field(default="valid")


class VendorCreate(BaseModel):
    """Payload to create a Vendor or 0 EUR Subcontractor in Vendor Hub 360."""

    vendor_id: Optional[str] = None
    vendor_code: str = Field(default="", description="Unique vendor code, auto-generated if empty")
    company_name: str = Field(..., min_length=2)
    vat_number: str = Field(..., min_length=5)
    supply_chain_role: str = Field(default="tannery")
    district_area: str = Field(default="Marche - Fermo/Macerata")
    city_address: str = Field(default="")
    country_iso2: str = Field(default="IT", min_length=2, max_length=2)
    paas_tier: str = Field(default="subcontractor_zero_eur")
    qualification_status: str = Field(default="qualified")
    quality_score: float = Field(default=92.0, ge=0.0, le=100.0)
    otd_score: float = Field(default=90.0, ge=0.0, le=100.0)
    esg_score: float = Field(default=94.0, ge=0.0, le=100.0)
    standard_lead_time_days: int = Field(default=14, ge=0)
    moq_description: str = Field(default="Minimo 50 paia / 300 sqft")
    payment_terms_l6: str = Field(default="RIBA 60gg DFFM")
    hourly_or_unit_rate_eur_l6: float = Field(default=18.50, ge=0.0)
    negotiated_price_list_l6: List[Dict[str, Any]] = Field(default_factory=list)
    internal_audit_notes_l6: str = Field(default="")
    contact_email: str = Field(default="qualita@fornitore-distretto.it")
    district_company_id: Optional[str] = Field(default=None, description="FK to District PaaS Company")
    is_active: bool = Field(default=True)
    initial_certifications: List[VendorCertificationCreate] = Field(default_factory=list)


class VendorUpdate(BaseModel):
    """Payload to update an existing Vendor or Subcontractor."""

    vendor_code: Optional[str] = None
    company_name: Optional[str] = None
    vat_number: Optional[str] = None
    supply_chain_role: Optional[str] = None
    district_area: Optional[str] = None
    city_address: Optional[str] = None
    country_iso2: Optional[str] = None
    paas_tier: Optional[str] = None
    qualification_status: Optional[str] = None
    quality_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    otd_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    esg_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    standard_lead_time_days: Optional[int] = Field(default=None, ge=0)
    moq_description: Optional[str] = None
    payment_terms_l6: Optional[str] = None
    hourly_or_unit_rate_eur_l6: Optional[float] = Field(default=None, ge=0.0)
    negotiated_price_list_l6: Optional[List[Dict[str, Any]]] = None
    internal_audit_notes_l6: Optional[str] = None
    contact_email: Optional[str] = None
    district_company_id: Optional[str] = None
    is_active: Optional[bool] = None


class VendorRecord(BaseModel):
    """Serialized Vendor / Subcontractor record with centralized L6 Cost Segregation support."""

    vendor_id: str
    vendor_code: str
    company_name: str
    vat_number: str
    supply_chain_role: str
    district_area: str
    city_address: str = Field(default="")
    country_iso2: str = Field(default="IT")
    paas_tier: str = Field(default="subcontractor_zero_eur")
    qualification_status: str = Field(default="qualified")
    quality_score: Optional[float] = None
    otd_score: Optional[float] = None
    esg_score: Optional[float] = None
    overall_rating: Optional[float] = None
    rating_class: Optional[str] = None
    standard_lead_time_days: int = Field(default=14)
    moq_description: Optional[str] = None
    payment_terms_l6: Optional[str] = None
    hourly_or_unit_rate_eur_l6: Optional[float] = None
    negotiated_price_list_l6: Optional[List[Dict[str, Any]]] = None
    internal_audit_notes_l6: Optional[str] = None
    contact_email: str = Field(default="")
    is_active: bool = Field(default=True)
    certifications: List[VendorCertification] = Field(default_factory=list)
    has_expired_critical_certs: bool = Field(default=False)
    cert_semaphore_status: str = Field(default="green")
    l6_segregated: bool = Field(default=False)
    district_company_id: Optional[str] = None
    district_company: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VendorDistrictLinkRequest(BaseModel):
    """Payload to link an Albo Vendor to a District PaaS Company (FTL-CEO-022)."""

    company_id: str = Field(..., description="Target Company ID in District PaaS (Modulo 01)")


class VendorAutoLinkResult(BaseModel):
    """Result of bulk auto-linking Albo vendors to District PaaS companies by VAT / legal name."""

    matched_count: int
    linked_vendors: List[Dict[str, Any]] = Field(default_factory=list)



class VendorImpactSummary(BaseModel):
    """Supply chain blast-radius metrics for a Vendor Where-Used query."""

    pim_models_count: int = Field(default=0)
    plm_variants_count: int = Field(default=0)
    bom_nodes_count: int = Field(default=0)
    tannery_batches_count: int = Field(default=0)
    active_production_orders_count: int = Field(default=0)
    supply_chain_criticality: str = Field(default="LOW")


class VendorFinancialExposureL6(BaseModel):
    """L6 Brand-only financial exposure metrics for a Vendor Where-Used query."""

    avg_bom_cost_contribution_per_pair_eur: float = Field(default=0.0)
    tannery_stock_value_eur: float = Field(default=0.0)
    estimated_seasonal_exposure_eur: float = Field(default=0.0)
    hourly_or_unit_rate_eur: float = Field(default=0.0)
    payment_terms: str = Field(default="")


class VendorImpactedPimModel(BaseModel):
    pim_item_id: str
    sku_code: str
    model_name: str
    season: str
    category: str


class VendorImpactedPlmVariant(BaseModel):
    plm_variant_id: str
    pim_item_id: str
    variant_code: str
    colorway_name: str
    lifecycle_status: str
    bom_nodes_from_vendor: int = Field(default=0)


class VendorImpactedBomNode(BaseModel):
    bom_item_id: str
    plm_variant_id: str
    variant_code: str
    level: int
    component_type: str
    material_name: str
    unit_of_measure: str
    unit_consumption: float
    waste_percentage: float
    master_color_id: Optional[str] = None
    unit_cost_eur_l6: Optional[float] = None


class VendorImpactedTanneryBatch(BaseModel):
    batch_id: str
    batch_code: str
    leather_type: str
    lwg_rating: str
    available_qty_sqft: float
    master_color_id: Optional[str] = None


class VendorWhereUsedResponse(BaseModel):
    """Relational Where-Used analysis across BOM, PLM Variants, PIM Models, Tannery Batches & Orders."""

    vendor_id: str
    vendor_code: str
    company_name: str
    supply_chain_role: str
    district_area: str
    qualification_status: str
    paas_tier: str
    overall_rating: Optional[float] = None
    has_expired_critical_certs: bool = Field(default=False)
    viewer_role: str = Field(default="brand")
    l6_segregated: bool = Field(default=False)
    impact_summary: VendorImpactSummary
    financial_exposure_l6: Optional[VendorFinancialExposureL6] = None
    impacted_pim_models: List[VendorImpactedPimModel] = Field(default_factory=list)
    impacted_pim_items: List[VendorImpactedPimModel] = Field(default_factory=list)
    impacted_plm_variants: List[VendorImpactedPlmVariant] = Field(default_factory=list)
    impacted_bom_nodes: List[VendorImpactedBomNode] = Field(default_factory=list)
    impacted_tannery_batches: List[VendorImpactedTanneryBatch] = Field(default_factory=list)


