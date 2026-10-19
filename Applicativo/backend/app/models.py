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
    supplier_name: str = Field(..., min_length=2)
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
    supplier_name: str
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


class PlmProductionVariant(PlmProductionVariantCreate):
    """Persisted PLM Production Variant (the 'N' side of the 1 PIM <-> N PLM relationship)."""

    plm_variant_id: str
    pim_item_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PimCommercialItemCreate(BaseModel):
    """Payload to create a commercial catalog item (the '1' side of the 1 PIM <-> N PLM relationship)."""

    sku_code: str = Field(..., min_length=3, description="Master commercial SKU")
    model_name: str = Field(..., min_length=2)
    brand_tenant_id: str = Field(..., description="Multi-tenant identifier for the Brand or SME")
    season: str = Field(..., description="Human-readable season, e.g., P/E 2026, SS26, FW26")
    season_id: Optional[str] = Field(default=None, description="FK to Season entity")
    collection_id: Optional[str] = Field(default=None, description="FK to Collection entity")
    collection_name: Optional[str] = Field(default=None, description="Human-readable collection name")
    category: ProductCategory = Field(default=ProductCategory.FOOTWEAR)
    target_gender: Optional[str] = Field(default="unisex", description="Target gender: uomo, donna, unisex, bambino")
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
    initial_plm_variants: List[PlmProductionVariantCreate] = Field(
        default_factory=list,
        description="Optional initial N PLM production variants created alongside the PIM item",
    )


class PimCommercialItem(BaseModel):
    """Persisted 1 PIM Commercial Item aggregating N PLM Production Variants."""

    pim_item_id: str
    sku_code: str
    model_name: str
    brand_tenant_id: str
    season: str
    season_id: Optional[str] = Field(default=None)
    collection_id: Optional[str] = Field(default=None)
    collection_name: Optional[str] = Field(default=None)
    category: ProductCategory
    target_gender: Optional[str] = Field(default="unisex", description="Target gender: uomo, donna, unisex, bambino")
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
    tannery_name: str = Field(..., min_length=2)
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
    size_breakdown: List[OrderSizeBreakdownItem] = Field(..., min_items=1)
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

