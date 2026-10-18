"""Core Domain Models for Footlink (1 PIM Commercial Item <-> N PLM Production Variants, 3-Level BOM, 0 EUR Subcontractor Portal & EU DPP)."""

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
    children: List[Dict[str, Any]] = Field(default_factory=list)


class BomHierarchySummary(BaseModel):
    """Summary of the 3-level BOM hierarchy across all N PLM variants of a PIM item."""

    level_1_count: int = Field(default=0)
    level_2_count: int = Field(default=0)
    level_3_count: int = Field(default=0)
    max_depth_reached: int = Field(default=1)
    total_components: int = Field(default=0)


class PlmProductionVariantCreate(BaseModel):
    """Payload to create a factory-level PLM Production Variant linked to 1 PIM Commercial Item."""

    variant_code: str = Field(..., min_length=3, description="Factory technical code, e.g., ART-880-VIT-NERO-40")
    colorway_name: str = Field(..., min_length=2)
    size_range: str = Field(default="35-42", description="Production size scale")
    last_or_pattern_code: str = Field(..., description="Shoe last ('forma') or bag/apparel pattern code")
    lifecycle_status: PlmLifecycleStatus = Field(default=PlmLifecycleStatus.PROTOTYPE)
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
    season: str = Field(..., description="e.g., FW26, SS27")
    category: ProductCategory = Field(default=ProductCategory.FOOTWEAR)
    commercial_description_it: str = Field(..., min_length=5)
    commercial_description_en: str = Field(..., min_length=5)
    retail_channels: List[str] = Field(default_factory=lambda: ["B2B Showroom", "E-Commerce", "Wholesale"])
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
    category: ProductCategory
    commercial_description_it: str
    commercial_description_en: str
    retail_channels: List[str]
    plm_variants: List[PlmProductionVariant] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
    repairability_index: float = Field(default=8.5)
    traceable_subcontractors_count: int
    completed_subcontractor_steps_count: int = Field(default=0)
    total_subcontractor_steps_count: int = Field(default=0)
    bom_hierarchy_summary: BomHierarchySummary = Field(default_factory=BomHierarchySummary)
    espr_compliance_checklist: Dict[str, bool] = Field(default_factory=dict)
    supply_chain_steps: List[Dict[str, Any]]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    dpp_compliance_ready: bool
