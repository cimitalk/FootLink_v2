"""Footlink Core API (FastAPI) implementing the 1 PIM <-> N PLM domain engine, Multi-level BOM, and EU DPP generator."""

from __future__ import annotations

from typing import Dict, List
from uuid import uuid4
from fastapi import FastAPI, HTTPException, status

from app.models import (
    BomItem,
    DigitalProductPassport,
    PimCommercialItem,
    PimCommercialItemCreate,
    PlmProductionVariant,
    PlmProductionVariantCreate,
)

app = FastAPI(
    title="Footlink PLM + PIM Core API",
    description=(
        "Unified operating system for footwear, leather goods, and apparel supply chains. "
        "Implements the 1 PIM Commercial Item <-> N PLM Production Variants architecture, "
        "Multi-level BOM, 0 EUR Subcontractor traceability, and EU Digital Product Passport (DPP)."
    ),
    version="0.1.0",
)

# In-memory repository for MVP bootstrap & unit testing (backed by PostgreSQL in staging/production per ADR-002)
PIM_STORE: Dict[str, PimCommercialItem] = {}


@app.get("/health", tags=["infra"])
def health_check() -> Dict[str, str]:
    """Liveness and FinOps Free-Tier readiness endpoint."""
    return {
        "status": "ok",
        "service": "footlink-core-api",
        "architecture_adr": "ADR-002",
        "hosting_tier": "free-tier-0-eur",
        "domain_model": "1-PIM-to-N-PLM",
    }


@app.post(
    "/api/v1/pim-items",
    response_model=PimCommercialItem,
    status_code=status.HTTP_201_CREATED,
    tags=["pim", "plm"],
)
def create_pim_item(payload: PimCommercialItemCreate) -> PimCommercialItem:
    """Create 1 Commercial Item (PIM) and optionally initialize N Production Variants (PLM)."""
    for existing in PIM_STORE.values():
        if existing.sku_code == payload.sku_code and existing.brand_tenant_id == payload.brand_tenant_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"SKU '{payload.sku_code}' already exists for tenant '{payload.brand_tenant_id}'.",
            )

    pim_id = f"PIM-{uuid4().hex[:8].upper()}"
    variants: List[PlmProductionVariant] = []

    for v_payload in payload.initial_plm_variants:
        plm_variant = PlmProductionVariant(
            plm_variant_id=f"PLM-{uuid4().hex[:8].upper()}",
            pim_item_id=pim_id,
            **v_payload.model_dump(),
        )
        variants.append(plm_variant)

    item = PimCommercialItem(
        pim_item_id=pim_id,
        sku_code=payload.sku_code,
        model_name=payload.model_name,
        brand_tenant_id=payload.brand_tenant_id,
        season=payload.season,
        category=payload.category,
        commercial_description_it=payload.commercial_description_it,
        commercial_description_en=payload.commercial_description_en,
        retail_channels=payload.retail_channels,
        plm_variants=variants,
    )
    PIM_STORE[pim_id] = item
    return item


@app.get(
    "/api/v1/pim-items",
    response_model=List[PimCommercialItem],
    tags=["pim"],
)
def list_pim_items() -> List[PimCommercialItem]:
    """List all commercial PIM items along with their N linked PLM production variants."""
    return list(PIM_STORE.values())


@app.get(
    "/api/v1/pim-items/{pim_item_id}",
    response_model=PimCommercialItem,
    tags=["pim", "plm"],
)
def get_pim_item(pim_item_id: str) -> PimCommercialItem:
    """Retrieve a single PIM Commercial Item and its N associated PLM Production Variants."""
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")
    return item


@app.post(
    "/api/v1/pim-items/{pim_item_id}/plm-variants",
    response_model=PlmProductionVariant,
    status_code=status.HTTP_201_CREATED,
    tags=["plm"],
)
def add_plm_variant_to_pim_item(
    pim_item_id: str,
    payload: PlmProductionVariantCreate,
) -> PlmProductionVariant:
    """Attach a new PLM Production Variant (the 'N' side) to an existing PIM Commercial Item (the '1' side)."""
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    for existing_var in item.plm_variants:
        if existing_var.variant_code == payload.variant_code:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"PLM Variant code '{payload.variant_code}' already linked to PIM item '{pim_item_id}'.",
            )

    new_variant = PlmProductionVariant(
        plm_variant_id=f"PLM-{uuid4().hex[:8].upper()}",
        pim_item_id=pim_item_id,
        **payload.model_dump(),
    )
    item.plm_variants.append(new_variant)
    return new_variant


@app.post(
    "/api/v1/pim-items/{pim_item_id}/plm-variants/{plm_variant_id}/bom",
    response_model=PlmProductionVariant,
    status_code=status.HTTP_201_CREATED,
    tags=["plm", "bom"],
)
def append_bom_item(
    pim_item_id: str,
    plm_variant_id: str,
    bom_item: BomItem,
) -> PlmProductionVariant:
    """Add a multi-level BOM component line to a specific PLM Production Variant."""
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    for variant in item.plm_variants:
        if variant.plm_variant_id == plm_variant_id:
            if bom_item.level > 1 and not bom_item.parent_bom_item_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Multi-level BOM items with level > 1 must specify parent_bom_item_id.",
                )
            variant.bom_items.append(bom_item)
            return variant

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLM Production Variant not found.")


@app.get(
    "/api/v1/pim-items/{pim_item_id}/dpp-preview",
    response_model=DigitalProductPassport,
    tags=["dpp", "pim", "plm"],
)
def generate_dpp_preview(pim_item_id: str) -> DigitalProductPassport:
    """Synthesize an EU Digital Product Passport (DPP) preview from 1 PIM Item and its N PLM Variants."""
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    if not item.plm_variants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate EU DPP: at least 1 PLM Production Variant with BOM is required.",
        )

    countries = set()
    certifications = set()
    recycled_values: List[float] = []
    supply_chain_steps: List[Dict[str, str]] = []
    subcontractors = set()

    for variant in item.plm_variants:
        for bom in variant.bom_items:
            countries.add(bom.origin_country_iso2)
            for cert in bom.certifications:
                certifications.add(cert)
            recycled_values.append(bom.recycled_content_pct)

        for assign in variant.subcontractor_assignments:
            subcontractors.add(assign.subcontractor_name)
            supply_chain_steps.append(
                {
                    "variant_code": variant.variant_code,
                    "phase": assign.phase.value,
                    "subcontractor": assign.subcontractor_name,
                    "district": assign.district,
                    "material_lot_code": assign.material_lot_code,
                }
            )

    avg_recycled = round(sum(recycled_values) / len(recycled_values), 2) if recycled_values else 0.0
    dpp_ready = len(countries) > 0 and len(supply_chain_steps) > 0

    return DigitalProductPassport(
        dpp_id=f"DPP-EU-{item.sku_code}",
        pim_item_id=item.pim_item_id,
        sku_code=item.sku_code,
        model_name=item.model_name,
        category=item.category,
        brand_tenant_id=item.brand_tenant_id,
        public_qr_url=f"https://dpp.footlink.eu/{item.brand_tenant_id}/{item.sku_code}",
        total_plm_variants_covered=len(item.plm_variants),
        countries_of_origin=sorted(countries),
        certifications_verified=sorted(certifications),
        average_recycled_content_pct=avg_recycled,
        traceable_subcontractors_count=len(subcontractors),
        supply_chain_steps=supply_chain_steps,
        dpp_compliance_ready=dpp_ready,
    )
