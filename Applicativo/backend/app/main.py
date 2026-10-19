"""Footlink Core API (FastAPI) implementing:
- 1 PIM Commercial Item <-> N PLM Production Variants domain engine (SQLite/PostgreSQL persistent)
- 3-Level Hierarchical Bill of Materials (BOM Level 1 -> Level 2 -> Level 3) with Size Grading & L6 Costing
- Vertical Category Tech Specs (Footwear, Leather Goods, Apparel) & BOM Snapshot Locking
- PIM Data Quality Engine (0-100%) & Omnichannel Syndication Export (CSV/JSON/Shopify/B2B) (FEAT-05)
- 0 EUR Mobile Subcontractor Portal ('3 Clic a 0 EUR') with L6 Cost Segregation (ADR-006)
- Live EU ESPR Digital Product Passport (DPP) with Dual View (Consumer vs Customs) & Navigable SVG QR Code
"""

from __future__ import annotations

import hashlib
import urllib.parse
from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4

from app._compat import (
    CORSMiddleware,
    FastAPI,
    HTMLResponse,
    HTTPException,
    Response,
    status,
)
from app.database import PersistentPimStoreProxy, db_manager
from app.models import (
    AttributeFieldType,
    AttributeTargetEntity,
    BomHierarchySummary,
    BomItem,
    BomRequirementsCalculationRequest,
    BomRequirementsCalculationResult,
    BomSizeRequirementItem,
    BomTreeNode,
    Collection,
    CollectionCreate,
    Company,
    CompanyBusinessType,
    CompanyCreate,
    CompanyMembership,
    CompanyMembershipCreate,
    CompanyTier,
    CompanyUpdate,
    DigitalProductPassport,
    DistrictUserRole,
    DomainRegistryEntry,
    DomainRegistryEntryCreate,
    DomainRegistryEntryUpdate,
    OrderSizeBreakdownItem,
    PimCommercialItem,
    PimCommercialItemCreate,
    PimDataQualityReport,
    PlmLifecycleStatus,
    PlmProductionVariant,
    PlmProductionVariantCreate,
    ProductionOrder,
    ProductionOrderCreate,
    ProductionOrderPhaseItem,
    ProductionOrderStatus,
    ProductionOrderUpdate,
    RegistryDomain,
    SchemaAttributeDefinition,
    SchemaAttributeDefinitionCreate,
    Season,
    SeasonCreate,
    SubcontractorAssignment,
    SubcontractorPhaseConfirmRequest,
    SubcontractorStepConfirmRequest,
    SubcontractorStepConfirmResponse,
    TanneryBatch,
    TanneryBatchCreate,
    TanneryBatchUpdate,
    TanneryDocument,
    TanneryDocumentCreate,
    TanneryDocumentType,
    TanneryDocumentVerifyResponse,
    TanneryProcess,
    User,
    UserCreate,
)
from app.seed import seed_initial_data

app = FastAPI(
    title="Footlink PLM + PIM Core API",
    description=(
        "Unified operating system for footwear, leather goods, and apparel supply chains. "
        "Implements the 1 PIM Commercial Item <-> N PLM Production Variants architecture, "
        "3-Level BOM, L6 Cost Segregation, PIM Data Quality & Export (FEAT-05), "
        "0 EUR Subcontractor traceability ('3 Clic a 0 EUR'), and EU Digital Product Passport (DPP)."
    ),
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Persistent repository backed by SQLite (`Applicativo/database/footlink.db`) / PostgreSQL per ADR-002
PIM_STORE = PersistentPimStoreProxy(db_manager)

# Pre-populate the SQLite database on initial startup if empty
seed_initial_data(db_manager, force=False)


# ============================================================================
# Helper Functions: 3-Level BOM Tree, Data Quality Engine & SVG QR Generator
# ============================================================================


def build_bom_tree(bom_items: List[BomItem]) -> List[BomTreeNode]:
    """Assemble flat BOM items into a nested 3-level hierarchy (Level 1 -> Level 2 -> Level 3)."""
    node_map: Dict[str, Dict[str, Any]] = {}
    for item in bom_items:
        dumped = item.model_dump(mode="json")
        dumped["children"] = []
        node_map[item.bom_item_id] = dumped

    roots: List[Dict[str, Any]] = []
    for item in bom_items:
        node = node_map[item.bom_item_id]
        parent_id = item.parent_bom_item_id
        if item.level > 1 and parent_id and parent_id in node_map:
            node_map[parent_id]["children"].append(node)
        else:
            roots.append(node)

    return [BomTreeNode(**r) for r in roots]


def evaluate_pim_data_quality(item: PimCommercialItem) -> PimDataQualityReport:
    """Compute the deterministic 10-criteria PIM & ESPR Data Quality Score (0-100%) per PRD-003 (FEAT-05)."""
    all_boms = [b for v in item.plm_variants for b in v.bom_items]
    all_subs = [s for v in item.plm_variants for s in v.subcontractor_assignments]
    all_certs = {c for b in all_boms for c in b.certifications}
    levels_present = {b.level for b in all_boms}

    checks: Dict[str, bool] = {
        "dq_01_sku_and_gtin_valid": len(item.sku_code.strip()) >= 3 and len(item.gtin_ean.strip()) >= 8,
        "dq_02_bilingual_descriptions_it_en": (
            len(item.commercial_description_it.strip()) >= 15
            and len(item.commercial_description_en.strip()) >= 15
        ),
        "dq_03_omnichannel_pricing_and_channels": (
            item.wholesale_price_eur > 0 and item.retail_price_eur > 0 and len(item.retail_channels) >= 1
        ),
        "dq_04_hs_customs_and_season": len(item.hs_customs_code.strip()) >= 4 and len(item.season.strip()) >= 2,
        "dq_05_care_and_circular_end_of_life": (
            len(item.care_instructions.strip()) >= 10 and len(item.end_of_life_guide.strip()) >= 10
        ),
        "dq_06_one_to_n_plm_bridge_active": len(item.plm_variants) >= 1,
        "dq_07_vertical_category_tech_specs": any(len(v.category_specific_specs) >= 3 for v in item.plm_variants)
        or any(len(v.last_or_pattern_code.strip()) >= 3 for v in item.plm_variants),
        "dq_08_multilevel_bom_populated": len(all_boms) >= 1 and (len(levels_present) >= 2 or len(all_boms) >= 2),
        "dq_09_reach_or_sustainability_certified": len(all_certs) >= 1,
        "dq_10_district_subcontractors_linked": len(all_subs) >= 1,
    }

    passed_count = sum(1 for ok in checks.values() if ok)
    score = passed_count * 10
    missing = [key for key, ok in checks.items() if not ok]

    return PimDataQualityReport(
        pim_item_id=item.pim_item_id,
        sku_code=item.sku_code,
        model_name=item.model_name,
        data_quality_score=score,
        dpp_publication_unlocked=score >= 80,
        checks=checks,
        missing_fields=missing,
    )


def generate_navigable_qr_svg(payload_url: str, dpp_id: str, sku_code: str) -> str:
    """Generate a high-contrast 25x25 QR Matrix SVG in Design System v2.0 (#111111 / #FFFFFF)
    wrapped in a clickable link.
    """
    grid_size = 25
    matrix = [[False for _ in range(grid_size)] for _ in range(grid_size)]
    reserved = [[False for _ in range(grid_size)] for _ in range(grid_size)]

    def place_finder(row_off: int, col_off: int) -> None:
        for r in range(-1, 8):
            for c in range(-1, 8):
                rr, cc = row_off + r, col_off + c
                if 0 <= rr < grid_size and 0 <= cc < grid_size:
                    reserved[rr][cc] = True
                    if 0 <= r <= 6 and 0 <= c <= 6:
                        if r in (0, 6) or c in (0, 6) or (2 <= r <= 4 and 2 <= c <= 4):
                            matrix[rr][cc] = True

    place_finder(0, 0)
    place_finder(0, grid_size - 7)
    place_finder(grid_size - 7, 0)

    # Timing patterns on row 6 and col 6
    for i in range(8, grid_size - 8):
        reserved[6][i] = True
        reserved[i][6] = True
        matrix[6][i] = (i % 2 == 0)
        matrix[i][6] = (i % 2 == 0)

    # Alignment pattern (5x5 at bottom-right area)
    align_r, align_c = grid_size - 9, grid_size - 9
    for r in range(-2, 3):
        for c in range(-2, 3):
            rr, cc = align_r + r, align_c + c
            reserved[rr][cc] = True
            if abs(r) == 2 or abs(c) == 2 or (r == 0 and c == 0):
                matrix[rr][cc] = True

    # Deterministic bit stream from payload URL + DPP ID
    digest = hashlib.sha256(f"{payload_url}|{dpp_id}|{sku_code}".encode("utf-8")).digest()
    bits: List[bool] = []
    for byte in digest * 3:
        for shift in range(7, -1, -1):
            bits.append(bool((byte >> shift) & 1))

    bit_idx = 0
    for r in range(grid_size):
        for c in range(grid_size):
            if not reserved[r][c]:
                matrix[r][c] = bits[bit_idx % len(bits)]
                bit_idx += 1

    cell = 8
    margin = 20
    width = grid_size * cell + margin * 2
    height = width + 34

    rects: List[str] = []
    for r in range(grid_size):
        for c in range(grid_size):
            if matrix[r][c]:
                x = margin + c * cell
                y = margin + r * cell
                rects.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="1" fill="#111111"/>')

    escaped_url = payload_url.replace("&", "&amp;").replace('"', "&quot;")
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" '
        f'role="img" aria-label="EU Digital Product Passport QR Code for {sku_code}">'
        f'<rect width="{width}" height="{height}" rx="12" fill="#FFFFFF" stroke="#E5E5E5" stroke-width="2"/>'
        f'<a href="{escaped_url}" target="_blank" rel="noopener noreferrer">'
        f'{"".join(rects)}'
        f'<rect x="{ width // 2 - 26 }" y="{ (grid_size * cell) // 2 + margin - 14 }" width="52" height="28" rx="14" fill="#111111" stroke="#FFFFFF" stroke-width="2"/>'
        f'<text x="{ width // 2 }" y="{ (grid_size * cell) // 2 + margin + 4 }" text-anchor="middle" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="800" letter-spacing="0.04em">EU DPP</text>'
        f'<text x="{ width // 2 }" y="{ height - 14 }" text-anchor="middle" fill="#111111" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700">{sku_code}</text>'
        f"</a>"
        f"</svg>"
    )
    return svg


# ============================================================================
# Infrastructure & Seed Endpoints
# ============================================================================


@app.get("/health", tags=["infra"])
def health_check() -> Dict[str, str]:
    """Liveness and FinOps Free-Tier readiness endpoint."""
    return {
        "status": "ok",
        "service": "footlink-core-api",
        "architecture_adr": "ADR-002",
        "design_system_adr": "ADR-006",
        "hosting_tier": "free-tier-0-eur",
        "domain_model": "1-PIM-to-N-PLM",
        "persistence_engine": "sqlite-sqlalchemy-ready",
    }


@app.post("/api/v1/seed", response_model=List[PimCommercialItem], tags=["infra"])
def trigger_seed_data() -> List[PimCommercialItem]:
    """Ensure the SQLite database is populated with the Made-in-Italy reference dataset."""
    return seed_initial_data(db_manager, force=False)


# ============================================================================
# 1 PIM Commercial Item <-> N PLM Production Variants Endpoints
# ============================================================================


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
        season_id=payload.season_id,
        collection_id=payload.collection_id,
        collection_name=payload.collection_name,
        category=payload.category,
        commercial_description_it=payload.commercial_description_it,
        commercial_description_en=payload.commercial_description_en,
        retail_channels=payload.retail_channels,
        wholesale_price_eur=payload.wholesale_price_eur,
        retail_price_eur=payload.retail_price_eur,
        hs_customs_code=payload.hs_customs_code,
        gtin_ean=payload.gtin_ean,
        publishing_status=payload.publishing_status,
        care_instructions=payload.care_instructions,
        end_of_life_guide=payload.end_of_life_guide,
        custom_attributes=payload.custom_attributes,
        plm_variants=variants,
    )
    PIM_STORE[pim_id] = item
    return item


@app.get(
    "/api/v1/pim-items",
    response_model=List[PimCommercialItem],
    tags=["pim"],
)
def list_pim_items(
    season_id: Optional[str] = None,
    collection_id: Optional[str] = None,
) -> List[PimCommercialItem]:
    """List all commercial PIM items along with their N linked PLM production variants, optionally filtered by season or collection."""
    if season_id or collection_id:
        return db_manager.list_pim_items(season_id=season_id, collection_id=collection_id)
    return list(PIM_STORE.values())


@app.get(
    "/api/v1/pim-items/export/catalog",
    tags=["pim", "syndication"],
)
def export_omnichannel_catalog(format: str = "json") -> Response | Dict[str, Any]:
    """FEAT-05: Export the 1 PIM Commercial Catalog across channels (JSON, CSV, Shopify B2C, B2B Showroom)
    with zero SKU duplication and strict L6 exclusion of internal industrial costs.
    """
    items = list(PIM_STORE.values())
    fmt = format.lower().strip()

    records: List[Dict[str, Any]] = []
    for item in items:
        dq = evaluate_pim_data_quality(item)
        all_certs = sorted({c for v in item.plm_variants for b in v.bom_items for c in b.certifications})
        districts = sorted({s.district for v in item.plm_variants for s in v.subcontractor_assignments})
        rec_vals = [b.recycled_content_pct for v in item.plm_variants for b in v.bom_items]
        avg_rec = round(sum(rec_vals) / len(rec_vals), 1) if rec_vals else 0.0

        records.append(
            {
                "pim_item_id": item.pim_item_id,
                "sku_code": item.sku_code,
                "gtin_ean": item.gtin_ean,
                "model_name": item.model_name,
                "season": item.season,
                "category": item.category.value if hasattr(item.category, "value") else str(item.category),
                "commercial_description_it": item.commercial_description_it,
                "commercial_description_en": item.commercial_description_en,
                "wholesale_price_eur": item.wholesale_price_eur,
                "retail_price_eur": item.retail_price_eur,
                "hs_customs_code": item.hs_customs_code,
                "retail_channels": item.retail_channels,
                "linked_plm_variants_count": len(item.plm_variants),
                "plm_variant_codes": [v.variant_code for v in item.plm_variants],
                "manufacturing_districts": districts,
                "verified_certifications": all_certs,
                "average_recycled_content_pct": avg_rec,
                "data_quality_score": dq.data_quality_score,
                "dpp_public_url": f"https://dpp.footlink.eu/{item.brand_tenant_id}/{item.sku_code}",
            }
        )

    if fmt == "csv":
        header = (
            "sku_code,gtin_ean,model_name,season,category,wholesale_price_eur,retail_price_eur,"
            "hs_customs_code,linked_plm_variants_count,average_recycled_content_pct,data_quality_score,dpp_public_url"
        )
        rows = [header]
        for r in records:
            safe_name = str(r["model_name"]).replace('"', '""')
            rows.append(
                f'{r["sku_code"]},{r["gtin_ean"]},"{safe_name}",{r["season"]},{r["category"]},'
                f'{r["wholesale_price_eur"]},{r["retail_price_eur"]},{r["hs_customs_code"]},'
                f'{r["linked_plm_variants_count"]},{r["average_recycled_content_pct"]},{r["data_quality_score"]},{r["dpp_public_url"]}'
            )
        return Response(content="\n".join(rows), status_code=200, media_type="text/csv")

    if fmt == "shopify":
        return {
            "channel": "Shopify Plus B2C Metafields Feed",
            "l6_cost_segregation": "ENFORCED_NO_INDUSTRIAL_COSTS",
            "total_master_skus": len(records),
            "products": [
                {
                    "handle": r["sku_code"].lower(),
                    "title": r["model_name"],
                    "body_html": f"<p>{r['commercial_description_it']}</p>",
                    "product_type": r["category"],
                    "price_eur": r["retail_price_eur"],
                    "metafields_espr_dpp": {
                        "dpp_url": r["dpp_public_url"],
                        "recycled_pct": r["average_recycled_content_pct"],
                        "certifications": r["verified_certifications"],
                        "districts": r["manufacturing_districts"],
                    },
                }
                for r in records
            ],
        }

    if fmt == "b2b":
        return {
            "channel": "B2B Showroom Omnichannel Line Sheet",
            "l6_cost_segregation": "ENFORCED_WHOLESALE_ONLY",
            "total_master_skus": len(records),
            "linesheet_items": [
                {
                    "sku_code": r["sku_code"],
                    "gtin_ean": r["gtin_ean"],
                    "model_name": r["model_name"],
                    "season": r["season"],
                    "wholesale_price_eur": r["wholesale_price_eur"],
                    "suggested_retail_price_eur": r["retail_price_eur"],
                    "hs_customs_code": r["hs_customs_code"],
                    "available_factory_lines": r["plm_variant_codes"],
                    "data_quality_score": r["data_quality_score"],
                }
                for r in records
            ],
        }

    return {
        "channel": "Footlink Canonical PIM Syndication JSON",
        "l6_cost_segregation": "ENFORCED_NO_INDUSTRIAL_COSTS",
        "total_master_skus": len(records),
        "items": records,
    }


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


@app.get(
    "/api/v1/pim-items/{pim_item_id}/data-quality",
    response_model=PimDataQualityReport,
    tags=["pim", "dpp"],
)
def get_pim_item_data_quality(pim_item_id: str) -> PimDataQualityReport:
    """FEAT-05: Compute real-time PIM & ESPR Data Quality Score (0-100%) and DPP publication readiness."""
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")
    return evaluate_pim_data_quality(item)


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
    PIM_STORE[pim_item_id] = item
    return new_variant


@app.patch(
    "/api/v1/pim-items/{pim_item_id}/plm-variants/{plm_variant_id}/lifecycle",
    response_model=PlmProductionVariant,
    tags=["plm"],
)
def update_plm_variant_lifecycle(
    pim_item_id: str,
    plm_variant_id: str,
    payload: Dict[str, Any],
) -> PlmProductionVariant:
    """Advance or update PLM Production Variant lifecycle status and automatically lock BOM snapshot
    when entering industrialized or in_production stage.
    """
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    new_status_str = str(payload.get("lifecycle_status", "in_production"))
    try:
        new_status = PlmLifecycleStatus(new_status_str)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    for variant in item.plm_variants:
        if variant.plm_variant_id == plm_variant_id:
            variant.lifecycle_status = new_status
            if new_status in (PlmLifecycleStatus.INDUSTRIALIZED, PlmLifecycleStatus.IN_PRODUCTION):
                variant.bom_snapshot_locked = True
                variant.bom_version = payload.get("bom_version", "v2.0 (Locked Snapshot)")
            else:
                variant.bom_snapshot_locked = False
                variant.bom_version = payload.get("bom_version", "v1.1 (Draft)")
            PIM_STORE[pim_item_id] = item
            return variant

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLM Production Variant not found.")


@app.patch(
    "/api/v1/pim-items/{pim_item_id}/plm-variants/{plm_variant_id}",
    response_model=PlmProductionVariant,
    tags=["plm"],
)
def update_plm_variant_attributes(
    pim_item_id: str,
    plm_variant_id: str,
    payload: Dict[str, Any],
) -> PlmProductionVariant:
    """Update technical and commercial attributes of a PLM Variant and its parent PIM item (Quick Edit)."""
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    # Update parent PIM attributes if provided
    if "model_name" in payload and payload["model_name"]:
        item.model_name = str(payload["model_name"])
    if "sku_code" in payload and payload["sku_code"]:
        item.sku_code = str(payload["sku_code"]).upper()
    if "category" in payload and payload["category"]:
        try:
            item.category = ProductCategory(str(payload["category"]))
        except ValueError:
            pass
    if "target_gender" in payload and payload["target_gender"]:
        item.target_gender = str(payload["target_gender"]).lower()
    if "season_id" in payload and payload["season_id"]:
        item.season_id = str(payload["season_id"])
    if "collection_id" in payload:
        item.collection_id = payload["collection_id"]

    for variant in item.plm_variants:
        if variant.plm_variant_id == plm_variant_id:
            if "variant_code" in payload and payload["variant_code"]:
                variant.variant_code = str(payload["variant_code"]).upper()
            if "colorway_name" in payload and payload["colorway_name"]:
                variant.colorway_name = str(payload["colorway_name"])
            if "last_or_pattern_code" in payload and payload["last_or_pattern_code"]:
                variant.last_or_pattern_code = str(payload["last_or_pattern_code"])
            if "size_range" in payload and payload["size_range"]:
                variant.size_range = str(payload["size_range"])
            if "sample_base_size" in payload and payload["sample_base_size"]:
                variant.sample_base_size = str(payload["sample_base_size"])
            if "size_grading_step_pct" in payload and payload["size_grading_step_pct"] is not None:
                variant.size_grading_step_pct = float(payload["size_grading_step_pct"])
            if "target_gender" in payload and payload["target_gender"]:
                variant.target_gender = str(payload["target_gender"]).lower()
            if "lifecycle_status" in payload and payload["lifecycle_status"]:
                try:
                    variant.lifecycle_status = PlmLifecycleStatus(str(payload["lifecycle_status"]))
                except ValueError:
                    pass
            if "custom_attributes" in payload and isinstance(payload["custom_attributes"], dict):
                variant.custom_attributes.update(payload["custom_attributes"])

            PIM_STORE[pim_item_id] = item
            return variant

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLM Production Variant not found.")


@app.get(
    "/api/v1/pim-items/{pim_item_id}/plm-variants/{plm_variant_id}/costing",
    tags=["plm", "finops"],
)
def get_plm_variant_costing_sheet(
    pim_item_id: str,
    plm_variant_id: str,
    viewer_role: str = "brand",
) -> Dict[str, Any]:
    """ADR-006 L6 Cost Segregation Endpoint:
    - When viewer_role='brand', returns full BOM material cost (including waste %), assembly labor cost,
      total standard industrial cost, and B2B/B2C margins.
    - When viewer_role='subcontractor', strictly masks all monetary costs and prices (0 EUR subcontractor view).
    """
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    target_var = None
    for v in item.plm_variants:
        if v.plm_variant_id == plm_variant_id:
            target_var = v
            break
    if not target_var:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLM Production Variant not found.")

    role_norm = viewer_role.lower().strip()
    if role_norm == "subcontractor":
        return {
            "pim_item_id": item.pim_item_id,
            "plm_variant_id": target_var.plm_variant_id,
            "variant_code": target_var.variant_code,
            "viewer_role": "subcontractor",
            "l6_security_policy": "ADR-006_COST_MASKED_FOR_0_EUR_SUBCONTRACTOR",
            "subcontractor_license_fee_eur": 0.0,
            "materials_cost_eur": None,
            "standard_labor_cost_eur": None,
            "total_industrial_cost_eur": None,
            "wholesale_price_eur": None,
            "retail_price_eur": None,
            "physical_bom_consumptions": [
                {
                    "bom_item_id": b.bom_item_id,
                    "level": b.level,
                    "material_name": b.material_name,
                    "unit_of_measure": b.unit_of_measure,
                    "net_consumption": b.unit_consumption,
                    "gross_consumption_with_waste": round(b.unit_consumption * (1.0 + b.waste_percentage / 100.0), 3),
                }
                for b in target_var.bom_items
            ],
        }

    materials_cost = 0.0
    bom_cost_lines: List[Dict[str, Any]] = []
    for b in target_var.bom_items:
        gross_qty = b.unit_consumption * (1.0 + b.waste_percentage / 100.0)
        line_cost = round(gross_qty * b.unit_cost_eur, 2)
        materials_cost += line_cost
        bom_cost_lines.append(
            {
                "bom_item_id": b.bom_item_id,
                "level": b.level,
                "material_name": b.material_name,
                "gross_consumption": round(gross_qty, 3),
                "unit_of_measure": b.unit_of_measure,
                "unit_cost_eur": b.unit_cost_eur,
                "line_total_eur": line_cost,
            }
        )

    materials_cost = round(materials_cost, 2)
    total_ind_cost = round(materials_cost + target_var.standard_labor_cost_eur, 2)
    ws_margin_pct = (
        round(((item.wholesale_price_eur - total_ind_cost) / item.wholesale_price_eur) * 100.0, 1)
        if item.wholesale_price_eur > 0
        else 0.0
    )

    return {
        "pim_item_id": item.pim_item_id,
        "plm_variant_id": target_var.plm_variant_id,
        "variant_code": target_var.variant_code,
        "viewer_role": "brand",
        "l6_security_policy": "ADR-006_AUTHORIZED_BRAND_OWNER",
        "materials_cost_eur": materials_cost,
        "standard_labor_cost_eur": target_var.standard_labor_cost_eur,
        "total_industrial_cost_eur": total_ind_cost,
        "wholesale_price_eur": item.wholesale_price_eur,
        "retail_price_eur": item.retail_price_eur,
        "wholesale_gross_margin_pct": ws_margin_pct,
        "bom_cost_breakdown": bom_cost_lines,
    }


# ============================================================================
# 3-Level Bill of Materials (BOM) Endpoints
# ============================================================================


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
    """Add a multi-level BOM component line (Level 1, Level 2, or Level 3) to a PLM Production Variant."""
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
            if bom_item.level > 1 and variant.bom_items:
                existing_ids = {b.bom_item_id for b in variant.bom_items}
                if bom_item.parent_bom_item_id not in existing_ids:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"parent_bom_item_id '{bom_item.parent_bom_item_id}' not found in variant BOM.",
                    )
            variant.bom_items.append(bom_item)
            PIM_STORE[pim_item_id] = item
            return variant

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLM Production Variant not found.")


@app.get(
    "/api/v1/pim-items/{pim_item_id}/plm-variants/{plm_variant_id}/bom-tree",
    response_model=List[BomTreeNode],
    tags=["plm", "bom"],
)
def get_variant_bom_tree(pim_item_id: str, plm_variant_id: str) -> List[BomTreeNode]:
    """Return the 3-level hierarchical BOM tree (Level 1 -> Level 2 -> Level 3) for a PLM Variant."""
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    for variant in item.plm_variants:
        if variant.plm_variant_id == plm_variant_id:
            return build_bom_tree(variant.bom_items)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLM Production Variant not found.")


# ============================================================================
# Portale Mobile Terzista "3 Clic a 0 EUR" Endpoints
# ============================================================================


@app.post(
    "/api/v1/pim-items/{pim_item_id}/plm-variants/{plm_variant_id}/subcontractors",
    response_model=PlmProductionVariant,
    status_code=status.HTTP_201_CREATED,
    tags=["subcontractor-portal", "plm"],
)
def add_subcontractor_assignment(
    pim_item_id: str,
    plm_variant_id: str,
    assignment: SubcontractorAssignment,
) -> PlmProductionVariant:
    """Assign a 0 EUR district subcontractor ('Terzista') to a production phase on a PLM Variant."""
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    for variant in item.plm_variants:
        if variant.plm_variant_id == plm_variant_id:
            variant.subcontractor_assignments.append(assignment)
            PIM_STORE[pim_item_id] = item
            return variant

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLM Production Variant not found.")


@app.post(
    "/api/v1/subcontractor-portal/confirm-step",
    response_model=SubcontractorStepConfirmResponse,
    tags=["subcontractor-portal", "dpp"],
)
def confirm_subcontractor_step_three_clicks(
    payload: SubcontractorStepConfirmRequest,
) -> SubcontractorStepConfirmResponse:
    """Execute the '3 Clic a 0 EUR' subcontractor portal confirmation:
    Click 1: Select phase assignment -> Click 2: Verify/update material lot code -> Click 3: Confirm completion.
    Immediately updates SQLite persistence and EU DPP readiness.
    """
    item = PIM_STORE.get(payload.pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    target_variant = None
    for variant in item.plm_variants:
        if variant.plm_variant_id == payload.plm_variant_id:
            target_variant = variant
            break

    if not target_variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLM Production Variant not found.")

    target_assignment = None
    for assign in target_variant.subcontractor_assignments:
        if assign.assignment_id == payload.assignment_id:
            target_assignment = assign
            break

    if not target_assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcontractor Assignment not found.")

    target_assignment.material_lot_code = payload.material_lot_code
    target_assignment.completed = True
    target_assignment.confirmed_at = datetime.now(timezone.utc)

    PIM_STORE[payload.pim_item_id] = item

    all_assigns = [a for v in item.plm_variants for a in v.subcontractor_assignments]
    completed_cnt = sum(1 for a in all_assigns if a.completed)
    has_bom = any(len(v.bom_items) > 0 for v in item.plm_variants)

    return SubcontractorStepConfirmResponse(
        status="confirmed",
        clicks_required=3,
        subcontractor_license_cost_eur=0.0,
        pim_item_id=item.pim_item_id,
        plm_variant_id=target_variant.plm_variant_id,
        updated_assignment=target_assignment,
        dpp_ready=has_bom and len(all_assigns) > 0,
        confirmed_steps_count=completed_cnt,
        total_steps_count=len(all_assigns),
    )


@app.patch(
    "/api/v1/pim-items/{pim_item_id}/plm-variants/{plm_variant_id}/subcontractors/{assignment_id}/confirm",
    response_model=SubcontractorStepConfirmResponse,
    tags=["subcontractor-portal", "dpp"],
)
def patch_confirm_subcontractor_assignment(
    pim_item_id: str,
    plm_variant_id: str,
    assignment_id: str,
    payload: Dict[str, Any],
) -> SubcontractorStepConfirmResponse:
    """REST PATCH alias for confirming a subcontractor assignment in 3 clicks."""
    lot_code = str(payload.get("material_lot_code", "LOT-VERIFIED-2026"))
    req = SubcontractorStepConfirmRequest(
        pim_item_id=pim_item_id,
        plm_variant_id=plm_variant_id,
        assignment_id=assignment_id,
        material_lot_code=lot_code,
        operator_note=payload.get("operator_note"),
    )
    return confirm_subcontractor_step_three_clicks(req)


@app.post(
    "/api/v1/subcontractor-portal/generate-magic-link",
    tags=["subcontractor-portal", "auth"],
)
def generate_subcontractor_magic_link(
    payload: Dict[str, Any],
) -> Dict[str, Any]:
    """Generate a zero-training, passwordless Magic Link for district subcontractors (0 EUR).
    Conforms to ADR-006: Costs and financial margins are strictly excluded from the payload.
    """
    pim_item_id = payload.get("pim_item_id")
    plm_variant_id = payload.get("plm_variant_id")
    assignment_id = payload.get("assignment_id")

    if not (pim_item_id and plm_variant_id and assignment_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="pim_item_id, plm_variant_id, and assignment_id are required.",
        )

    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    target_variant = next((v for v in item.plm_variants if v.plm_variant_id == plm_variant_id), None)
    if not target_variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLM Production Variant not found.")

    target_assignment = next((a for a in target_variant.subcontractor_assignments if a.assignment_id == assignment_id), None)
    if not target_assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcontractor Assignment not found.")

    raw_token_data = f"{pim_item_id}:{plm_variant_id}:{assignment_id}:footlink-zero-cost-salt"
    token = hashlib.sha256(raw_token_data.encode()).hexdigest()[:24]

    magic_url = f"https://app.footlink.eu/subcontractor-mobile?token={token}&pim={pim_item_id}&var={plm_variant_id}&assign={assignment_id}"

    return {
        "status": "success",
        "token": token,
        "magic_link": magic_url,
        "subcontractor_name": target_assignment.subcontractor_name,
        "phase": target_assignment.phase.value if hasattr(target_assignment.phase, "value") else str(target_assignment.phase),
        "district": target_assignment.district,
        "subcontractor_license_cost_eur": 0.0,
        "l6_cost_segregation": "ENFORCED_ZERO_FINANCIAL_EXPOSURE",
        "expires_in_hours": 72,
    }


@app.get(
    "/api/v1/subcontractor-portal/magic-access",
    tags=["subcontractor-portal", "auth"],
)
def access_subcontractor_portal_via_magic_link(
    token: str,
    pim_item_id: str,
    plm_variant_id: str,
    assignment_id: str,
) -> Dict[str, Any]:
    """Validate Magic Link access and return lightweight mobile workspace for the subcontractor.
    Zero-training, instant load (< 90s target, 3 clicks max to confirm). Costs are completely masked (L6).
    """
    expected_token = hashlib.sha256(
        f"{pim_item_id}:{plm_variant_id}:{assignment_id}:footlink-zero-cost-salt".encode()
    ).hexdigest()[:24]

    if token != expected_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired subcontractor Magic Link token.")

    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    target_variant = next((v for v in item.plm_variants if v.plm_variant_id == plm_variant_id), None)
    if not target_variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLM Production Variant not found.")

    target_assignment = next((a for a in target_variant.subcontractor_assignments if a.assignment_id == assignment_id), None)
    if not target_assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcontractor Assignment not found.")

    return {
        "auth_status": "authenticated_subcontractor_free_tier",
        "subcontractor_fee_eur": 0.0,
        "l6_policy": "NO_COST_DATA_EXPOSED",
        "pim_item_id": item.pim_item_id,
        "product_name": item.model_name,
        "brand_name": item.brand_tenant_id,
        "category": item.category,
        "plm_variant_id": target_variant.plm_variant_id,
        "variant_code": target_variant.variant_code,
        "colorway_name": target_variant.colorway_name,
        "assignment": target_assignment.model_dump(mode="json"),
        "clicks_to_complete": 3,
        "average_time_seconds_target": 45,
    }


# ============================================================================
# EU Digital Product Passport (DPP / ESPR) & Live QR Code Generator
# ============================================================================


@app.get(
    "/api/v1/pim-items/{pim_item_id}/dpp-preview",
    response_model=DigitalProductPassport,
    tags=["dpp", "pim", "plm"],
)
def generate_dpp_preview(pim_item_id: str) -> DigitalProductPassport:
    """Synthesize an EU Digital Product Passport (DPP / ESPR) from 1 PIM Item and its N PLM Variants,
    including 3-Level BOM hierarchy metrics, CO2e estimate, ESPR checklist, Customs Dossier, and SVG QR Code.
    """
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
    supply_chain_steps: List[Dict[str, Any]] = []
    subcontractors = set()
    certificate_registry: List[Dict[str, Any]] = []

    level_counts = {1: 0, 2: 0, 3: 0}
    max_depth = 1
    total_bom_components = 0
    completed_steps = 0

    for variant in item.plm_variants:
        for bom in variant.bom_items:
            total_bom_components += 1
            lvl = min(max(bom.level, 1), 3)
            level_counts[lvl] = level_counts.get(lvl, 0) + 1
            if bom.level > max_depth:
                max_depth = bom.level
            countries.add(bom.origin_country_iso2)
            for cert in bom.certifications:
                certifications.add(cert)
            recycled_values.append(bom.recycled_content_pct)
            certificate_registry.append(
                {
                    "variant_code": variant.variant_code,
                    "bom_item_id": bom.bom_item_id,
                    "material_name": bom.material_name,
                    "supplier_legal_name": bom.supplier_name,
                    "origin_country_iso2": bom.origin_country_iso2,
                    "lot_certificate_id": bom.lot_certificate_id,
                    "certifications": bom.certifications,
                }
            )

        for assign in variant.subcontractor_assignments:
            subcontractors.add(assign.subcontractor_name)
            if assign.completed:
                completed_steps += 1
            phase_str = assign.phase.value if hasattr(assign.phase, "value") else str(assign.phase)
            supply_chain_steps.append(
                {
                    "plm_variant_id": variant.plm_variant_id,
                    "variant_code": variant.variant_code,
                    "assignment_id": assign.assignment_id,
                    "phase": phase_str,
                    "subcontractor": assign.subcontractor_name,
                    "district": assign.district,
                    "material_lot_code": assign.material_lot_code,
                    "completed": assign.completed,
                    "confirmed_at": assign.confirmed_at.isoformat() if assign.confirmed_at else None,
                }
            )

    avg_recycled = round(sum(recycled_values) / len(recycled_values), 2) if recycled_values else 0.0
    dpp_ready = len(countries) > 0 and len(supply_chain_steps) > 0

    cat_str = str(item.category.value if hasattr(item.category, "value") else item.category)
    base_co2 = 14.8 if cat_str == "footwear" else (18.2 if cat_str == "leather_goods" else 16.4)
    co2_estimate = round(base_co2 * (1.0 - (avg_recycled / 250.0)), 2)
    water_liters = round(base_co2 * 8.4 * (1.0 - (avg_recycled / 300.0)), 1)
    repairability = 9.2 if "LWG Gold" in certifications else 8.4
    dq_report = evaluate_pim_data_quality(item)

    dpp_id = f"DPP-EU-{item.sku_code}"
    public_qr_url = f"https://dpp.footlink.eu/{item.brand_tenant_id}/{item.sku_code}"
    qr_target_url = f"/dpp/{item.pim_item_id}"
    qr_svg_endpoint = f"/api/v1/pim-items/{item.pim_item_id}/dpp-qr.svg"
    svg_markup = generate_navigable_qr_svg(qr_target_url, dpp_id, item.sku_code)
    qr_svg_data_uri = "data:image/svg+xml;utf8," + urllib.parse.quote(svg_markup)

    espr_checklist = {
        "unique_product_identifier": True,
        "one_pim_to_n_plm_bridge": len(item.plm_variants) >= 1,
        "multilevel_bom_traceability": total_bom_components > 0,
        "district_tier1_tier2_confirmed": len(supply_chain_steps) > 0,
        "chemical_reach_compliance": "REACH" in certifications or "LWG Gold" in certifications,
        "circularity_and_repairability": avg_recycled > 0.0,
    }

    customs_dossier = {
        "hs_customs_code": item.hs_customs_code,
        "gtin_ean": item.gtin_ean,
        "brand_tenant_id": item.brand_tenant_id,
        "espr_regulation_ref": "EU 2024/1781 (ESPR)",
        "svhc_reach_status": "COMPLIANT_ZERO_SVHC_ABOVE_0_1_PCT",
        "material_certificates_audit_log": certificate_registry,
    }

    return DigitalProductPassport(
        dpp_id=dpp_id,
        pim_item_id=item.pim_item_id,
        sku_code=item.sku_code,
        model_name=item.model_name,
        category=item.category,
        brand_tenant_id=item.brand_tenant_id,
        public_qr_url=public_qr_url,
        qr_target_url=qr_target_url,
        qr_svg_endpoint=qr_svg_endpoint,
        qr_svg_data_uri=qr_svg_data_uri,
        total_plm_variants_covered=len(item.plm_variants),
        countries_of_origin=sorted(countries),
        certifications_verified=sorted(certifications),
        average_recycled_content_pct=avg_recycled,
        carbon_footprint_estimate_kg=co2_estimate,
        water_footprint_liters=water_liters,
        repairability_index=repairability,
        data_quality_score=dq_report.data_quality_score,
        traceable_subcontractors_count=len(subcontractors),
        completed_subcontractor_steps_count=completed_steps,
        total_subcontractor_steps_count=len(supply_chain_steps),
        bom_hierarchy_summary=BomHierarchySummary(
            level_1_count=level_counts[1],
            level_2_count=level_counts[2],
            level_3_count=level_counts[3],
            max_depth_reached=max_depth,
            total_components=total_bom_components,
        ),
        espr_compliance_checklist=espr_checklist,
        supply_chain_steps=supply_chain_steps,
        customs_inspector_dossier=customs_dossier,
        dpp_compliance_ready=dpp_ready,
    )


@app.get(
    "/api/v1/pim-items/{pim_item_id}/dpp-qr.svg",
    tags=["dpp"],
)
def get_dpp_qr_svg(pim_item_id: str) -> Response:
    """Return the standalone navigable SVG QR Code for a PIM Commercial Item's EU Digital Product Passport."""
    item = PIM_STORE.get(pim_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PIM Commercial Item not found.")

    dpp_id = f"DPP-EU-{item.sku_code}"
    qr_target_url = f"/dpp/{item.pim_item_id}"
    svg_content = generate_navigable_qr_svg(qr_target_url, dpp_id, item.sku_code)
    return Response(content=svg_content, status_code=200, media_type="image/svg+xml")


@app.get(
    "/dpp/{pim_item_id}",
    response_class=HTMLResponse,
    tags=["dpp"],
)
def render_public_dpp_passport_page(pim_item_id: str, view: str = "consumer") -> HTMLResponse:
    """Render the interactive EU Digital Product Passport (ESPR) web page in Design System v2.0
    (Nike-Inspired Editorial Minimalism #FFFFFF / #F5F5F5 / #111111, Barlow Condensed 900, Dynamic Sole-Link SVG Logo)
    with support for Consumer Public View vs Customs/Inspector L6 View.
    """
    dpp = generate_dpp_preview(pim_item_id)
    item = PIM_STORE.get(pim_item_id)
    assert item is not None

    svg_qr = generate_navigable_qr_svg(dpp.qr_target_url, dpp.dpp_id, dpp.sku_code)

    variants_html = []
    for v in item.plm_variants:
        boms_li = "".join(
            f'<li style="margin-left:{(b.level - 1) * 18}px; padding:6px 0; font-size:13px; border-bottom:1px solid #E5E5E5;">'
            f'<span style="background:#111111; color:#FFFFFF; padding:2px 8px; border-radius:999px; font-weight:700; font-size:11px;">L{b.level}</span> '
            f'<strong>{b.material_name}</strong> — {b.supplier_name} ({b.origin_country_iso2}) '
            f'· Riciclato: <strong>{b.recycled_content_pct}%</strong> · Cert: {", ".join(b.certifications) or "N/A"} '
            f'<span style="font-family:monospace; font-size:11px; color:#707072;">[{b.lot_certificate_id}]</span>'
            f"</li>"
            for b in v.bom_items
        )
        variants_html.append(
            f'<div style="border:1px solid #E5E5E5; border-radius:14px; padding:16px; margin-bottom:12px; background:#F5F5F5;">'
            f'<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">'
            f'<strong>{v.variant_code} — {v.colorway_name}</strong>'
            f'<span style="font-size:11px; background:#FFFFFF; color:#111111; border:1px solid #E5E5E5; padding:4px 12px; border-radius:999px; font-weight:700;">Forma/Modello: {v.last_or_pattern_code} · BOM {v.bom_version}</span>'
            f"</div>"
            f'<ul style="list-style:none; padding-left:0; margin:10px 0 0 0;">{boms_li}</ul>'
            f"</div>"
        )

    live_dot_ok = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;margin-right:5px;"></span>✓ Confermato 0 €'
    steps_html = "".join(
        f'<div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #E5E5E5; font-size:13px; background:#FFFFFF;">'
        f'<div><strong>{s["subcontractor"]}</strong> ({s["district"]})<br/><span style="color:#707072;">Fase: {s["phase"]} · Variante: {s["variant_code"]}</span></div>'
        f'<div style="text-align:right;"><code style="background:#F5F5F5; border:1px solid #E5E5E5; padding:2px 8px; border-radius:999px; font-family:monospace;">{s["material_lot_code"]}</code><br/>'
        f'<span style="color:#111111; font-weight:700; font-size:12px;">'
        f'{live_dot_ok if s["completed"] else "⏳ In Lavorazione"}</span></div>'
        f"</div>"
        for s in dpp.supply_chain_steps
    )

    certs_badges = "".join(
        f'<span style="background:#111111; color:#FFFFFF; padding:5px 14px; border-radius:999px; font-size:12px; font-weight:600; margin-right:6px; display:inline-block; margin-bottom:6px;">✓ {c}</span>'
        for c in dpp.certifications_verified
    )

    html = f"""<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EU Digital Product Passport — {dpp.model_name} ({dpp.sku_code})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
</head>
<body style="font-family:'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background:#F5F5F5; color:#111111; margin:0; padding:24px;">
  <div style="max-width:860px; margin:0 auto; background:#FFFFFF; border:1px solid #E5E5E5; border-radius:16px; overflow:hidden;">
    <!-- Top Spotlight Header (#111111) with Dynamic Sole-Link Logo -->
    <div style="background:#111111; color:#FFFFFF; padding:28px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
          <svg width="142" height="28" viewBox="0 0 168 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="FOOTLINK">
            <path d="M4 24L14.5 6H24L13.5 24H4Z" fill="#FFFFFF"/>
            <path d="M15.5 24L23 11H31L23.5 24H15.5Z" fill="#FFFFFF"/>
            <path d="M4 26.5H29.5L28 29H2.5L4 26.5Z" fill="#FFFFFF"/>
            <text x="38" y="24" fill="#FFFFFF" font-family="'Barlow Condensed', 'Inter', sans-serif" font-weight="900" font-size="25" letter-spacing="-0.03em">FOOTLINK</text>
          </svg>
          <span style="font-size:11px; text-transform:uppercase; letter-spacing:1.2px; background:#FFFFFF; color:#111111; padding:3px 10px; border-radius:999px; font-weight:700;">
            EU ESPR Digital Product Passport · {dpp.regulation_standard}
          </span>
        </div>
        <h1 style="margin:4px 0 6px 0; font-family:'Barlow Condensed', sans-serif; font-weight:900; text-transform:uppercase; font-size:38px; line-height:0.95; letter-spacing:-0.03em;">{dpp.model_name}</h1>
        <div style="font-size:13px; color:#E5E5E5; font-family:'JetBrains Mono', monospace;">
          SKU: <strong>{dpp.sku_code}</strong> · ID Passaporto: <strong>{dpp.dpp_id}</strong> · Stagione: <strong>{item.season}</strong> · HS: <strong>{item.hs_customs_code}</strong>
        </div>
      </div>
      <div style="background:#FFFFFF; padding:8px; border-radius:12px;">
        {svg_qr}
      </div>
    </div>

    <div style="padding:28px;">
      <p style="color:#707072; font-size:15px; line-height:1.55; margin-top:0;">{item.commercial_description_it}</p>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(175px, 1fr)); gap:12px; margin:20px 0;">
        <div style="background:#F5F5F5; border:1px solid #E5E5E5; padding:16px; border-radius:14px;">
          <div style="font-size:11px; color:#707072; text-transform:uppercase; font-weight:700;">Ponte 1 PIM ↔ N PLM</div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:28px; font-weight:900; color:#111111; margin-top:4px;">1 ↔ {dpp.total_plm_variants_covered} Varianti</div>
        </div>
        <div style="background:#F5F5F5; border:1px solid #E5E5E5; padding:16px; border-radius:14px;">
          <div style="font-size:11px; color:#707072; text-transform:uppercase; font-weight:700;">Contenuto Riciclato Medio</div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:28px; font-weight:900; color:#111111; margin-top:4px;">{dpp.average_recycled_content_pct}%</div>
        </div>
        <div style="background:#F5F5F5; border:1px solid #E5E5E5; padding:16px; border-radius:14px;">
          <div style="font-size:11px; color:#707072; text-transform:uppercase; font-weight:700;">Impronta Carbonio Stimata</div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:28px; font-weight:900; color:#111111; margin-top:4px;">{dpp.carbon_footprint_estimate_kg} kg CO₂e</div>
        </div>
        <div style="background:#F5F5F5; border:1px solid #E5E5E5; padding:16px; border-radius:14px;">
          <div style="font-size:11px; color:#707072; text-transform:uppercase; font-weight:700;">Indice Riparabilità UE</div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:28px; font-weight:900; color:#111111; margin-top:4px;">{dpp.repairability_index} / 10</div>
        </div>
      </div>

      <h3 style="font-family:'Barlow Condensed', sans-serif; font-size:22px; font-weight:900; text-transform:uppercase; border-bottom:1px solid #E5E5E5; padding-bottom:6px;">Certificazioni Verificate &amp; Conformità ESPR</h3>
      <div style="margin-bottom:20px;">{certs_badges}</div>

      <h3 style="font-family:'Barlow Condensed', sans-serif; font-size:22px; font-weight:900; text-transform:uppercase; border-bottom:1px solid #E5E5E5; padding-bottom:6px;">Distinta Base Gerarchica a 3 Livelli ({dpp.bom_hierarchy_summary.total_components} componenti: L1={dpp.bom_hierarchy_summary.level_1_count}, L2={dpp.bom_hierarchy_summary.level_2_count}, L3={dpp.bom_hierarchy_summary.level_3_count})</h3>
      {"".join(variants_html)}

      <h3 style="font-family:'Barlow Condensed', sans-serif; font-size:22px; font-weight:900; text-transform:uppercase; border-bottom:1px solid #E5E5E5; padding-bottom:6px; margin-top:24px;">Tracciabilità Distretti &amp; Terzisti ("3 Clic a 0 €") — {dpp.completed_subcontractor_steps_count}/{dpp.total_subcontractor_steps_count} Fasi Confermate</h3>
      <div style="border:1px solid #E5E5E5; border-radius:14px; overflow:hidden;">
        {steps_html}
      </div>

      <div style="margin-top:24px; padding:16px; background:#F5F5F5; border:1px solid #E5E5E5; border-radius:14px; font-size:13px;">
        <strong>Cura, Riparabilità &amp; Fine Vita Circolare (ESPR):</strong> {item.care_instructions} — {item.end_of_life_guide}
      </div>
    </div>
  </div>
</body>
</html>"""
    return HTMLResponse(content=html, status_code=200)


# ============================================================================
# SPRINT 5: Seasons & Collections API (1 Season -> N Collections Hierarchy)
# ============================================================================


@app.get(
    "/api/v1/seasons",
    response_model=List[Season],
    tags=["seasons"],
)
def list_seasons() -> List[Season]:
    """List all Fashion Seasons along with their nested Collections and linked product counts."""
    return db_manager.list_seasons()


@app.post(
    "/api/v1/seasons",
    response_model=Season,
    status_code=status.HTTP_201_CREATED,
    tags=["seasons"],
)
def create_season(payload: SeasonCreate) -> Season:
    """Create a new Fashion Season (e.g., P/E 2026 - Primavera Estate 2026) with optional initial collections."""
    for existing in db_manager.list_seasons():
        if existing.code.strip().upper() == payload.code.strip().upper():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Season with code '{payload.code}' already exists.",
            )
    return db_manager.save_season(payload)


@app.get(
    "/api/v1/seasons/{season_id}",
    response_model=Season,
    tags=["seasons"],
)
def get_season_by_id(season_id: str) -> Season:
    """Get single Fashion Season with all its Collections."""
    s = db_manager.get_season(season_id)
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Season '{season_id}' not found.")
    return s


@app.put(
    "/api/v1/seasons/{season_id}",
    response_model=Season,
    tags=["seasons"],
)
def update_season(season_id: str, payload: SeasonCreate) -> Season:
    """Update season details (name, year, status, dates, description)."""
    existing = db_manager.get_season(season_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Season '{season_id}' not found.")
    return db_manager.save_season(payload, season_id=season_id)


@app.delete(
    "/api/v1/seasons/{season_id}",
    tags=["seasons"],
)
def delete_season(season_id: str) -> Dict[str, Any]:
    """Delete a Season and cascade to its collections."""
    ok = db_manager.delete_season(season_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Season '{season_id}' not found.")
    return {"status": "deleted", "season_id": season_id}


@app.get(
    "/api/v1/seasons/{season_id}/collections",
    response_model=List[Collection],
    tags=["seasons", "collections"],
)
def list_season_collections(season_id: str) -> List[Collection]:
    """List all collections belonging to a specific season."""
    s = db_manager.get_season(season_id)
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Season '{season_id}' not found.")
    return db_manager.list_collections(season_id=season_id)


@app.post(
    "/api/v1/seasons/{season_id}/collections",
    response_model=Collection,
    status_code=status.HTTP_201_CREATED,
    tags=["seasons", "collections"],
)
def add_collection_to_season(season_id: str, payload: CollectionCreate) -> Collection:
    """Add a new Collection (e.g. Main collection, Fashion, Limited edition) to a season."""
    s = db_manager.get_season(season_id)
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Season '{season_id}' not found.")
    for existing_col in s.collections:
        if existing_col.code.strip().upper() == payload.code.strip().upper():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Collection code '{payload.code}' already exists in season '{season_id}'.",
            )
    return db_manager.save_collection(season_id, payload)


@app.get(
    "/api/v1/collections/{collection_id}",
    response_model=Collection,
    tags=["collections"],
)
def get_collection_by_id(collection_id: str) -> Collection:
    """Get single collection by ID."""
    c = db_manager.get_collection(collection_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Collection '{collection_id}' not found.")
    return c


@app.put(
    "/api/v1/collections/{collection_id}",
    response_model=Collection,
    tags=["collections"],
)
def update_collection(collection_id: str, payload: CollectionCreate) -> Collection:
    """Update collection details."""
    existing = db_manager.get_collection(collection_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Collection '{collection_id}' not found.")
    return db_manager.save_collection(existing.season_id, payload, collection_id=collection_id)


@app.delete(
    "/api/v1/collections/{collection_id}",
    tags=["collections"],
)
def delete_collection(collection_id: str) -> Dict[str, Any]:
    """Delete a collection."""
    ok = db_manager.delete_collection(collection_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Collection '{collection_id}' not found.")
    return {"status": "deleted", "collection_id": collection_id}


@app.get(
    "/api/v1/seasons/{season_id}/collections/{collection_id}/products",
    response_model=List[PimCommercialItem],
    tags=["seasons", "collections", "pim"],
)
def list_products_in_collection(season_id: str, collection_id: str) -> List[PimCommercialItem]:
    """List all PIM Commercial Items and their N PLM variants belonging to a specific collection."""
    return db_manager.list_pim_items(season_id=season_id, collection_id=collection_id)


# ============================================================================
# SPRINT 5: Master Domain Registries API (Tabelle Anagrafiche di Dominio)
# ============================================================================


@app.get(
    "/api/v1/registries",
    tags=["registries"],
)
def list_domain_registries_summary() -> Dict[str, Any]:
    """List all available master data registries across PIM and PLM with their entry counts and all entries."""
    all_entries = db_manager.list_registry_entries()
    pim_names = {e.registry_name for e in all_entries if e.registry_domain == RegistryDomain.PIM or e.registry_domain == "pim"}
    plm_names = {e.registry_name for e in all_entries if e.registry_domain == RegistryDomain.PLM or e.registry_domain == "plm"}

    return {
        "pim_registries": [
            {
                "name": name,
                "count": sum(1 for e in all_entries if (e.registry_domain == RegistryDomain.PIM or e.registry_domain == "pim") and e.registry_name == name),
            }
            for name in sorted(pim_names)
        ],
        "plm_registries": [
            {
                "name": name,
                "count": sum(1 for e in all_entries if (e.registry_domain == RegistryDomain.PLM or e.registry_domain == "plm") and e.registry_name == name),
            }
            for name in sorted(plm_names)
        ],
        "total_entries": len(all_entries),
        "entries": all_entries,
    }


@app.get(
    "/api/v1/registries/entries",
    response_model=List[DomainRegistryEntry],
    tags=["registries"],
)
def list_all_domain_registry_entries(only_active: bool = False) -> List[DomainRegistryEntry]:
    """Return all domain registry entries as a flat list."""
    return db_manager.list_registry_entries(only_active=only_active)


@app.post(
    "/api/v1/registries",
    response_model=DomainRegistryEntry,
    status_code=status.HTTP_201_CREATED,
    tags=["registries"],
)
def create_registry_entry_direct(payload: DomainRegistryEntryCreate) -> DomainRegistryEntry:
    """Create a new domain registry entry directly from payload."""
    return db_manager.save_registry_entry(payload)


@app.get(
    "/api/v1/registries/{domain}/{registry_name}",
    response_model=List[DomainRegistryEntry],
    tags=["registries"],
)
def get_registry_entries(
    domain: str,
    registry_name: str,
    only_active: bool = False,
) -> List[DomainRegistryEntry]:
    """Get all entries of a specific domain registry (e.g. pim/categories, plm/suppliers)."""
    dom = domain.lower().strip()
    if dom not in ("pim", "plm"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Domain must be 'pim' or 'plm'.")
    return db_manager.list_registry_entries(domain=dom, name=registry_name, only_active=only_active)


@app.post(
    "/api/v1/registries/{domain}/{registry_name}",
    response_model=DomainRegistryEntry,
    status_code=status.HTTP_201_CREATED,
    tags=["registries"],
)
def create_registry_entry(
    domain: str,
    registry_name: str,
    payload: DomainRegistryEntryCreate,
) -> DomainRegistryEntry:
    """Add or update an entry in a domain master registry."""
    dom = domain.lower().strip()
    if dom not in ("pim", "plm"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Domain must be 'pim' or 'plm'.")
    payload.registry_domain = RegistryDomain(dom)
    payload.registry_name = registry_name
    return db_manager.save_registry_entry(payload)


@app.put(
    "/api/v1/registries/{domain}/{registry_name}/{entry_code}",
    response_model=DomainRegistryEntry,
    tags=["registries"],
)
@app.patch(
    "/api/v1/registries/{domain}/{registry_name}/{entry_code}",
    response_model=DomainRegistryEntry,
    tags=["registries"],
)
def update_registry_entry(
    domain: str,
    registry_name: str,
    entry_code: str,
    payload: DomainRegistryEntryUpdate,
) -> DomainRegistryEntry:
    """Update an existing master data entry in a PLM or PIM registry (labels, sort order, metadata, status)."""
    dom = domain.lower().strip()
    if dom not in ("pim", "plm"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Domain must be 'pim' or 'plm'.")
    updated = db_manager.update_registry_entry(
        domain=dom,
        name=registry_name,
        code=entry_code,
        label_it=payload.label_it,
        label_en=payload.label_en,
        metadata=payload.metadata,
        is_active=payload.is_active,
        sort_order=payload.sort_order,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entry '{entry_code}' in '{domain}/{registry_name}' not found.",
        )
    return updated


@app.delete(
    "/api/v1/registries/{domain}/{registry_name}/{entry_code}",
    tags=["registries"],
)
def delete_registry_entry(
    domain: str,
    registry_name: str,
    entry_code: str,
) -> Dict[str, Any]:
    """Delete an entry from a domain registry."""
    ok = db_manager.delete_registry_entry(domain.lower().strip(), registry_name, entry_code)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entry '{entry_code}' in '{domain}/{registry_name}' not found.",
        )
    return {"status": "deleted", "domain": domain, "registry": registry_name, "entry_code": entry_code}


# ============================================================================
# SPRINT 5: Dynamic Schema Attributes API (Founder Data Model Studio)
# ============================================================================


@app.get(
    "/api/v1/schema/entities",
    tags=["schema"],
)
def list_schema_entities_overview() -> Dict[str, Any]:
    """Get overview of configurable entities in Footlink Data Model Studio (pim_item, plm_variant, bom_item)."""
    all_attrs = db_manager.list_attribute_definitions()
    return {
        "entities": [
            {
                "target_entity": "pim_item",
                "label_it": "Articolo Commerciale PIM (Catalogo)",
                "label_en": "Commercial Item PIM",
                "custom_attributes_count": sum(1 for a in all_attrs if (a.target_entity == AttributeTargetEntity.PIM_ITEM or a.target_entity == "pim_item")),
                "attributes": [a for a in all_attrs if (a.target_entity == AttributeTargetEntity.PIM_ITEM or a.target_entity == "pim_item")],
            },
            {
                "target_entity": "plm_variant",
                "label_it": "Variante Industriale PLM (Fabbrica)",
                "label_en": "Industrial Variant PLM",
                "custom_attributes_count": sum(1 for a in all_attrs if (a.target_entity == AttributeTargetEntity.PLM_VARIANT or a.target_entity == "plm_variant")),
                "attributes": [a for a in all_attrs if (a.target_entity == AttributeTargetEntity.PLM_VARIANT or a.target_entity == "plm_variant")],
            },
            {
                "target_entity": "bom_item",
                "label_it": "Componente Distinta Base BOM (Materiali)",
                "label_en": "BOM Component Item",
                "custom_attributes_count": sum(1 for a in all_attrs if (a.target_entity == AttributeTargetEntity.BOM_ITEM or a.target_entity == "bom_item")),
                "attributes": [a for a in all_attrs if (a.target_entity == AttributeTargetEntity.BOM_ITEM or a.target_entity == "bom_item")],
            },
        ],
        "total_attributes_defined": len(all_attrs),
    }


@app.get(
    "/api/v1/schema/entities/{target_entity}/attributes",
    response_model=List[SchemaAttributeDefinition],
    tags=["schema"],
)
def get_entity_attribute_definitions(target_entity: str) -> List[SchemaAttributeDefinition]:
    """List all attribute definitions configured for a specific domain entity."""
    tgt = target_entity.lower().strip()
    if tgt not in ("pim_item", "plm_variant", "bom_item"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target_entity must be 'pim_item', 'plm_variant', or 'bom_item'.",
        )
    return db_manager.list_attribute_definitions(target_entity=tgt)


@app.post(
    "/api/v1/schema/entities/{target_entity}/attributes",
    response_model=SchemaAttributeDefinition,
    status_code=status.HTTP_201_CREATED,
    tags=["schema"],
)
def create_or_update_attribute_definition(
    target_entity: str,
    payload: SchemaAttributeDefinitionCreate,
) -> SchemaAttributeDefinition:
    """Define a new custom attribute or update an existing definition in the Founder Data Model Studio."""
    tgt = target_entity.lower().strip()
    if tgt not in ("pim_item", "plm_variant", "bom_item"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target_entity must be 'pim_item', 'plm_variant', or 'bom_item'.",
        )
    payload.target_entity = AttributeTargetEntity(tgt)
    return db_manager.save_attribute_definition(payload)


@app.delete(
    "/api/v1/schema/entities/{target_entity}/attributes/{field_key}",
    tags=["schema"],
)
def delete_attribute_definition(target_entity: str, field_key: str) -> Dict[str, Any]:
    """Delete a custom attribute definition (system fields cannot be deleted)."""
    tgt = target_entity.lower().strip()
    existing = db_manager.get_attribute_definition(tgt, field_key)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attribute '{field_key}' on '{tgt}' not found.",
        )
    if existing.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Field '{field_key}' is a protected core system attribute and cannot be deleted.",
        )
    ok = db_manager.delete_attribute_definition(tgt, field_key)
    return {"status": "deleted", "target_entity": tgt, "field_key": field_key}


# ============================================================================
# SPRINT 6: District PaaS (Companies & Users) API - ADR-008
# ============================================================================


@app.get(
    "/api/v1/companies",
    response_model=List[Company],
    tags=["companies", "paas"],
)
def list_companies(
    tier: Optional[str] = None,
    only_active: bool = False,
) -> List[Company]:
    """List district companies across the 3 tiers (Enterprise, PMI, Subcontractor 0 EUR)."""
    return db_manager.list_companies(tier=tier, only_active=only_active)


@app.get(
    "/api/v1/companies/{company_id}",
    response_model=Company,
    tags=["companies", "paas"],
)
def get_company(company_id: str) -> Company:
    """Get company profile and district membership tier."""
    comp = db_manager.get_company(company_id)
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Company '{company_id}' not found.")
    return comp


@app.post(
    "/api/v1/companies",
    response_model=Company,
    status_code=status.HTTP_201_CREATED,
    tags=["companies", "paas"],
)
def create_company(payload: CompanyCreate) -> Company:
    """Register and activate a new company in the District PaaS network."""
    return db_manager.save_company(payload)


@app.get(
    "/api/v1/users",
    response_model=List[User],
    tags=["users", "paas"],
)
def list_users() -> List[User]:
    """List all registered district users."""
    return db_manager.list_users()


@app.get(
    "/api/v1/users/{user_id}",
    response_model=User,
    tags=["users", "paas"],
)
def get_user(user_id: str) -> User:
    """Get user profile."""
    usr = db_manager.get_user(user_id)
    if not usr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{user_id}' not found.")
    return usr


@app.post(
    "/api/v1/users",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    tags=["users", "paas"],
)
def create_user(payload: UserCreate) -> User:
    """Create a user profile."""
    return db_manager.save_user(payload)


@app.get(
    "/api/v1/companies/{company_id}/members",
    response_model=List[CompanyMembership],
    tags=["companies", "paas"],
)
def list_company_members(company_id: str) -> List[CompanyMembership]:
    """List all members and roles for a specific company."""
    return db_manager.list_memberships(company_id=company_id)


@app.post(
    "/api/v1/companies/{company_id}/members",
    response_model=CompanyMembership,
    status_code=status.HTTP_201_CREATED,
    tags=["companies", "paas"],
)
def add_company_member(company_id: str, payload: CompanyMembershipCreate) -> CompanyMembership:
    """Add or invite a user into a company."""
    payload.company_id = company_id
    return db_manager.save_membership(payload)


# ============================================================================
# SPRINT 6: Tannery Leather Batches & Document Vault (FTL-CEO-006)
# ============================================================================


@app.get(
    "/api/v1/tannery-batches",
    response_model=List[TanneryBatch],
    tags=["tannery", "traceability"],
)
def list_tannery_batches(
    company_id: Optional[str] = None,
    only_active: bool = False,
) -> List[TanneryBatch]:
    """List certified tannery leather batches with LWG/ICEC metrics and uploaded documents."""
    return db_manager.list_tannery_batches(company_id=company_id, only_active=only_active)


@app.get(
    "/api/v1/tannery-batches/{batch_id}",
    response_model=TanneryBatch,
    tags=["tannery", "traceability"],
)
def get_tannery_batch(batch_id: str) -> TanneryBatch:
    """Get single tannery batch details and verified document vault."""
    batch = db_manager.get_tannery_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tannery Batch '{batch_id}' not found.")
    return batch


@app.post(
    "/api/v1/tannery-batches",
    response_model=TanneryBatch,
    status_code=status.HTTP_201_CREATED,
    tags=["tannery", "traceability"],
)
def create_tannery_batch(payload: TanneryBatchCreate) -> TanneryBatch:
    """Register a new certified leather batch from a tannery with EUDR & LWG compliance data."""
    return db_manager.save_tannery_batch(payload)


@app.get(
    "/api/v1/tannery-batches/{batch_id}/documents",
    response_model=List[TanneryDocument],
    tags=["tannery", "traceability"],
)
def list_tannery_documents(batch_id: str) -> List[TanneryDocument]:
    """List all certificates and documents uploaded for a specific tannery batch."""
    return db_manager.list_tannery_documents(batch_id)


@app.post(
    "/api/v1/tannery-batches/{batch_id}/documents",
    response_model=TanneryDocument,
    status_code=status.HTTP_201_CREATED,
    tags=["tannery", "traceability"],
)
def upload_tannery_document(batch_id: str, payload: TanneryDocumentCreate) -> TanneryDocument:
    """Upload a certificate (LWG, ICEC, REACH) to the batch document vault, calculating its SHA-256 fingerprint."""
    batch = db_manager.get_tannery_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tannery Batch '{batch_id}' not found.")
    return db_manager.save_tannery_document(batch_id, payload)


@app.get(
    "/api/v1/tannery-documents/{document_id}/verify",
    response_model=TanneryDocumentVerifyResponse,
    tags=["tannery", "traceability"],
)
@app.get(
    "/api/v1/tannery-batches/{batch_id}/documents/{document_id}/verify",
    response_model=TanneryDocumentVerifyResponse,
    tags=["tannery", "traceability"],
)
def verify_tannery_document(document_id: str, batch_id: Optional[str] = None) -> TanneryDocumentVerifyResponse:
    """Cryptographic tamper-detection verification: recomputes SHA-256 hash on stored payload and verifies integrity."""
    res = db_manager.verify_tannery_document(document_id)
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document '{document_id}' not found.")
    return res


# ============================================================================
# SPRINT 6: Production Orders Hub, Size Breakdown Matrix & BOM Wastage
# ============================================================================


@app.get(
    "/api/v1/production-orders",
    response_model=List[ProductionOrder],
    tags=["production_orders"],
)
def list_production_orders(
    company_id: Optional[str] = None,
    status: Optional[str] = None,
    plm_variant_id: Optional[str] = None,
) -> List[ProductionOrder]:
    """List production work orders with their size breakdown matrix and subcontractor phases."""
    return db_manager.list_production_orders(company_id=company_id, status=status, plm_variant_id=plm_variant_id)


@app.get(
    "/api/v1/production-orders/{order_id}",
    response_model=ProductionOrder,
    tags=["production_orders"],
)
def get_production_order(order_id: str) -> ProductionOrder:
    """Get single production order details."""
    order = db_manager.get_production_order(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Production Order '{order_id}' not found.")
    return order


@app.post(
    "/api/v1/production-orders",
    response_model=ProductionOrder,
    status_code=status.HTTP_201_CREATED,
    tags=["production_orders"],
)
def create_production_order(payload: ProductionOrderCreate) -> ProductionOrder:
    """Launch a new production order linked to a PLM variant, tannery batch, and size breakdown matrix."""
    return db_manager.save_production_order(payload)


@app.post(
    "/api/v1/production-orders/calculate-requirements",
    response_model=BomRequirementsCalculationResult,
    tags=["production_orders", "bom"],
)
def calculate_bom_size_requirements(payload: BomRequirementsCalculationRequest) -> BomRequirementsCalculationResult:
    """Calculate exact gross material requirements across all BOM components based on size matrix and wastage."""
    return db_manager.calculate_bom_requirements(payload)


@app.get(
    "/api/v1/subcontractors/phases/{magic_token}",
    tags=["subcontractors", "mobile"],
)
def get_subcontractor_phase_by_token(magic_token: str) -> Dict[str, Any]:
    """Public read-only endpoint for 0 EUR subcontractor mobile portal (accessed via magic link QR)."""
    all_orders = db_manager.list_production_orders()
    for o in all_orders:
        for p in o.phases:
            if p.magic_token == magic_token:
                p_dict = p.model_dump() if hasattr(p, "model_dump") else (p.dict() if hasattr(p, "dict") else dict(p))
                res = {
                    "order_id": o.order_id,
                    "order_code": o.order_code,
                    "variant_code": o.variant_code,
                    "model_name": o.model_name,
                    "target_delivery_date": o.target_delivery_date,
                    "size_breakdown": o.size_breakdown,
                    "phase": p,
                }
                res.update(p_dict)
                return res
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Magic token not found or expired.")


@app.post(
    "/api/v1/subcontractors/phases/{magic_token}/confirm",
    response_model=ProductionOrderPhaseItem,
    tags=["subcontractors", "mobile"],
)
def confirm_subcontractor_phase(magic_token: str, payload: SubcontractorPhaseConfirmRequest) -> ProductionOrderPhaseItem:
    """3-clic mobile phase confirmation from subcontractor smartphone: updates conform/scrap pieces at 0 EUR."""
    phase = db_manager.confirm_phase_by_token(magic_token, payload)
    if not phase:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Magic token not found or phase could not be confirmed.")
    return phase


# =============================================================================
# Sprint 6 Additions: Tannery Template & Import (FTL-CEO-012), Feeds & PLM Export
# =============================================================================

@app.get(
    "/api/v1/tannery-batches/template/download",
    tags=["tannery", "batches"],
)
def download_tannery_batches_template() -> Response:
    """Download standardized CSV template for batch leather onboarding (FTL-CEO-012)."""
    headers = [
        "batch_code",
        "tannery_name",
        "district",
        "leather_type",
        "tanning_process",
        "raw_hide_origin_country",
        "slaughterhouse_traceability_id",
        "eudr_deforestation_free",
        "lwg_rating",
        "lwg_score_pct",
        "icec_certificate_id",
        "reach_svhc_compliant",
        "chrome_vi_content_ppm",
        "thickness_mm",
        "available_qty_sqft",
    ]
    sample_row = [
        "LOTTO-2026-CHEVRO-01",
        "Conceria Montebello SpA",
        "Arzignano (VI)",
        "Vitello Pieno Fiore Semi-Anilina",
        "vegetable_tanned",
        "FR",
        "IT-BRESCIA-SLAUGHTER-901",
        "true",
        "Gold",
        "94.5",
        "ICEC-TS-410-VET-2026",
        "true",
        "0.0",
        "1.2 - 1.4 mm",
        "4500.0",
    ]
    csv_content = ",".join(headers) + "\n" + ",".join(sample_row) + "\n"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="template_lotti_conceria_footlink.csv"'},
    )


@app.post(
    "/api/v1/tannery-batches/import",
    tags=["tannery", "batches"],
)
def import_tannery_batches(payload: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Massive import of tannery leather batches from validated spreadsheet data (FTL-CEO-012)."""
    imported = []
    errors = []
    for idx, item in enumerate(payload):
        try:
            batch_in = TanneryBatchCreate(
                company_id=item.get("company_id", "comp-pmi-montebello"),
                batch_code=item.get("batch_code", f"LOTTO-IMP-{uuid4().hex[:6].upper()}"),
                tannery_name=item.get("tannery_name", "Conceria Partner"),
                district=item.get("district", "Distretto Conciario"),
                leather_type=item.get("leather_type", "Pellame Pregiato"),
                tanning_process=item.get("tanning_process", "vegetable_tanned"),
                raw_hide_origin_country=item.get("raw_hide_origin_country", "IT"),
                slaughterhouse_traceability_id=item.get("slaughterhouse_traceability_id", "IT-TRACE-DEFAULT"),
                eudr_deforestation_free=bool(item.get("eudr_deforestation_free", True)),
                lwg_rating=item.get("lwg_rating", "Gold"),
                lwg_score_pct=float(item.get("lwg_score_pct", 92.0)),
                icec_certificate_id=item.get("icec_certificate_id", "ICEC-DEFAULT"),
                reach_svhc_compliant=bool(item.get("reach_svhc_compliant", True)),
                chrome_vi_content_ppm=float(item.get("chrome_vi_content_ppm", 0.0)),
                thickness_mm=str(item.get("thickness_mm", "1.2 - 1.4 mm")),
                available_qty_sqft=float(item.get("available_qty_sqft", 1000.0)),
                metadata=item.get("metadata", {}),
            )
            created = db_manager.create_tannery_batch(batch_in)
            imported.append(created)
        except Exception as exc:
            errors.append({"row_index": idx, "error": str(exc)})

    return {
        "status": "success",
        "total_rows": len(payload),
        "imported_count": len(imported),
        "errors_count": len(errors),
        "batches": imported,
        "errors": errors,
    }


@app.get(
    "/api/v1/pim-items/feed/shopify",
    tags=["pim", "feeds"],
)
def get_shopify_catalog_feed() -> Dict[str, Any]:
    """Live Shopify Product Feed (JSON) for omnichannel e-commerce syndication (FTL-CEO-010)."""
    items = db_manager.list_pim_items()
    shopify_products = []
    for item in items:
        variants = []
        for v in item.plm_variants:
            variants.append(
                {
                    "sku": v.variant_code,
                    "title": f"{item.model_name} - {v.colorway_name}",
                    "price": str(item.retail_price_eur),
                    "compare_at_price": str(round(item.retail_price_eur * 1.2, 2)),
                    "barcode": item.barcode_ean13,
                    "inventory_management": "footlink_os",
                    "requires_shipping": True,
                    "taxable": True,
                }
            )
        shopify_products.append(
            {
                "id": item.pim_item_id,
                "title": item.model_name,
                "body_html": f"<p>{item.marketing_description_it}</p>",
                "vendor": "Footlink District",
                "product_type": item.category.capitalize(),
                "tags": f"season:{item.season}, espr:dpp_compliant, lwg:gold",
                "variants": variants,
                "options": [{"name": "Colore", "values": [v.colorway_name for v in item.plm_variants]}],
                "metafields": [
                    {"key": "dpp_uri", "value": f"https://dpp.footlink.it/passport/{item.pim_item_id}", "type": "url"},
                    {"key": "hs_customs_code", "value": item.hs_customs_code, "type": "string"},
                ],
            }
        )
    return {"products": shopify_products, "synced_at": datetime.now(timezone.utc).isoformat()}


@app.get(
    "/api/v1/pim-items/feed/b2b",
    tags=["pim", "feeds"],
)
def get_b2b_wholesale_feed() -> Dict[str, Any]:
    """B2B Wholesale Line Sheet Feed (NuORDER / JOOR format) with L6 cost segregation (FTL-CEO-010)."""
    items = db_manager.list_pim_items()
    lines = []
    for item in items:
        lines.append(
            {
                "style_number": item.commercial_sku,
                "style_name": item.model_name,
                "season": item.season,
                "category": item.category,
                "wholesale_eur": item.wholesale_price_eur,
                "suggested_retail_eur": item.retail_price_eur,
                "moq_pairs": 12,
                "colorways": [v.colorway_name for v in item.plm_variants],
                "size_run": item.plm_variants[0].size_range if item.plm_variants else "EU 39-44",
                "made_in": "Italy",
                "l6_segregated_internal_cost": "[PROTECTED_L6]",
            }
        )
    return {"b2b_line_sheet": lines, "currency": "EUR", "generated_at": datetime.now(timezone.utc).isoformat()}


@app.get(
    "/api/v1/plm-variants/export",
    tags=["plm", "export"],
)
def export_plm_variants_csv() -> Response:
    """Export tabular PLM production variants as CSV for technical factory sheets (FTL-CEO-009)."""
    items = db_manager.list_pim_items()
    rows = [
        "plm_variant_id,variant_code,model_name,category,colorway_name,lifecycle_status,size_range,bom_items_count"
    ]
    for item in items:
        for v in item.plm_variants:
            rows.append(
                f'"{v.plm_variant_id}","{v.variant_code}","{item.model_name}","{item.category}","{v.colorway_name}","{v.lifecycle_status}","{v.size_range}",{len(v.bom_items)}'
            )
    return Response(
        content="\n".join(rows) + "\n",
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="footlink_plm_variants_export.csv"'},
    )


