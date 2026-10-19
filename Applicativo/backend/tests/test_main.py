"""Unit and Domain Integration Tests for Footlink Backend:
- SQLite / SQLAlchemy Persistence & Made-in-Italy Seed Data (FTL-TECH-002)
- 1 PIM Commercial Item <-> N PLM Production Variants Bridge (FTL-TECH-002)
- 3-Level Hierarchical Bill of Materials (BOM Level 1 -> Level 2 -> Level 3) (FTL-TECH-002)
- 0 EUR Mobile Subcontractor Portal ('3 Clic a 0 EUR') (FTL-TECH-002)
- Live EU ESPR Digital Product Passport (DPP) & Navigable SVG QR Code Generator (FTL-TECH-003)
- Sprint 3 (FTL-TECH-004): Design System v2.0 DPP HTML/SVG, PIM Data Quality & Syndication Export (FEAT-05),
  Vertical Tech Specs, PLM Lifecycle Snapshot Locking, and L6 Cost Segregation (ADR-006).
"""

from __future__ import annotations

import pytest
from app._compat import get_test_client
from app.database import DEFAULT_SQLITE_PATH, db_manager
from app.main import PIM_STORE, app
from app.seed import seed_initial_data

client = get_test_client(app)


@pytest.fixture(autouse=True)
def clear_store():
    """Ensure clean seeded repository before each test."""
    seed_initial_data(db_manager, force=True)
    yield
    seed_initial_data(db_manager, force=True)


def test_health_check_free_tier_compliance():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["architecture_adr"] == "ADR-002"
    assert data["design_system_adr"] == "ADR-006"
    assert data["hosting_tier"] == "free-tier-0-eur"
    assert data["domain_model"] == "1-PIM-to-N-PLM"
    assert data["persistence_engine"] == "sqlite-sqlalchemy-ready"


def test_sqlite_persistence_and_initial_seed_data():
    """Verify SQLite database file creation and Made-in-Italy initial seed dataset (2 PIM items, 5 PLM variants, 3-level BOM)."""
    PIM_STORE.clear()
    seed_resp = client.post("/api/v1/seed")
    assert seed_resp.status_code == 200
    items = seed_resp.json()
    assert len(items) == 2
    assert DEFAULT_SQLITE_PATH.exists()

    skus = {item["sku_code"]: item for item in items}
    assert "FTL-FW26-LOAFER-01" in skus
    assert "FTL-FW26-TOTE-02" in skus

    loafer = skus["FTL-FW26-LOAFER-01"]
    assert len(loafer["plm_variants"]) == 3
    assert loafer["plm_variants"][0]["category_specific_specs"]["construction_method"] == "BLAKE_RAPID"

    # Verify 3-level BOM tree on first variant
    first_var_id = loafer["plm_variants"][0]["plm_variant_id"]
    tree_resp = client.get(f"/api/v1/pim-items/{loafer['pim_item_id']}/plm-variants/{first_var_id}/bom-tree")
    assert tree_resp.status_code == 200
    tree = tree_resp.json()
    assert len(tree) == 2  # Upper branch + Sole branch at Level 1
    assert tree[0]["level"] == 1
    assert len(tree[0]["children"]) == 1
    assert tree[0]["children"][0]["level"] == 2
    assert len(tree[0]["children"][0]["children"]) == 1
    assert tree[0]["children"][0]["children"][0]["level"] == 3


def test_one_pim_to_many_plm_variants_and_multilevel_bom_and_dpp():
    """Verify the core 1 PIM Commercial Item <-> N PLM Production Variants domain cardinality, 3-level BOM, and EU DPP."""
    pim_payload = {
        "sku_code": "FTL-LOAFER-001",
        "model_name": "Mocassino Artigianale Marche",
        "brand_tenant_id": "TENANT-ROSSI-CALZATURE",
        "season": "FW26",
        "category": "footwear",
        "commercial_description_it": "Mocassino cucito a mano in vitello pieno fiore certificato.",
        "commercial_description_en": "Hand-stitched loafer in certified full-grain calfskin.",
        "retail_channels": ["B2B Showroom", "E-Commerce"],
        "initial_plm_variants": [
            {
                "variant_code": "FTL-LOAFER-001-NERO",
                "colorway_name": "Nero Classico",
                "size_range": "38-46",
                "last_or_pattern_code": "FORMA-MARCHE-102",
                "lifecycle_status": "industrialized",
                "bom_items": [
                    {
                        "bom_item_id": "BOM-UPPER-01",
                        "level": 1,
                        "component_type": "upper",
                        "material_name": "Vitello Pieno Fiore Nero",
                        "supplier_name": "Conceria Santa Croce SpA",
                        "origin_country_iso2": "IT",
                        "unit_of_measure": "sqft",
                        "unit_consumption": 3.2,
                        "waste_percentage": 8.0,
                        "recycled_content_pct": 15.0,
                        "certifications": ["LWG Gold", "REACH"],
                    }
                ],
                "subcontractor_assignments": [
                    {
                        "assignment_id": "SUB-001",
                        "subcontractor_name": "Tomaificio Fratelli Bianchi",
                        "district": "Fermo-Macerata",
                        "phase": "stitching_upper",
                        "material_lot_code": "LOT-VIT-2026-88A",
                        "completed": True,
                    }
                ],
            },
            {
                "variant_code": "FTL-LOAFER-001-CUOIO",
                "colorway_name": "Cuoio Toscano",
                "size_range": "38-46",
                "last_or_pattern_code": "FORMA-MARCHE-102",
                "lifecycle_status": "sample",
                "bom_items": [
                    {
                        "bom_item_id": "BOM-UPPER-02",
                        "level": 1,
                        "component_type": "upper",
                        "material_name": "Vitello Vegetale Cuoio",
                        "supplier_name": "Conceria Valdarno Srl",
                        "origin_country_iso2": "IT",
                        "unit_of_measure": "sqft",
                        "unit_consumption": 3.25,
                        "waste_percentage": 7.5,
                        "recycled_content_pct": 25.0,
                        "certifications": ["LWG Gold", "Pelle Conciata al Vegetale"],
                    }
                ],
                "subcontractor_assignments": [
                    {
                        "assignment_id": "SUB-002",
                        "subcontractor_name": "Suolificio Adriatico",
                        "district": "Fermo-Macerata",
                        "phase": "lasting_assembly",
                        "material_lot_code": "LOT-CUOIO-2026-19B",
                        "completed": True,
                    }
                ],
            },
        ],
    }

    create_resp = client.post("/api/v1/pim-items", json=pim_payload)
    assert create_resp.status_code == 201
    created_pim = create_resp.json()
    pim_id = created_pim["pim_item_id"]
    assert len(created_pim["plm_variants"]) == 2

    # 2. Add a 3rd PLM Production Variant dynamically (proving 1:N extensibility)
    third_variant_payload = {
        "variant_code": "FTL-LOAFER-001-BORDEAUX",
        "colorway_name": "Bordeaux Suede",
        "size_range": "36-41",
        "last_or_pattern_code": "FORMA-MARCHE-102W",
        "lifecycle_status": "prototype",
        "bom_items": [
            {
                "bom_item_id": "BOM-SOLE-01",
                "level": 1,
                "component_type": "outsole",
                "material_name": "Fondo Cuoio Rigenerato",
                "supplier_name": "Suolificio Veneto",
                "origin_country_iso2": "IT",
                "unit_of_measure": "pair",
                "unit_consumption": 1.0,
                "waste_percentage": 2.0,
                "recycled_content_pct": 50.0,
                "certifications": ["GRS"],
            }
        ],
        "subcontractor_assignments": [],
    }
    add_var_resp = client.post(f"/api/v1/pim-items/{pim_id}/plm-variants", json=third_variant_payload)
    assert add_var_resp.status_code == 201
    third_variant = add_var_resp.json()
    plm_variant_id = third_variant["plm_variant_id"]

    # 3. Append a Level-2 sub-component and a Level-3 raw component to the BOM of the 3rd PLM variant
    level_2_bom = {
        "bom_item_id": "BOM-SOLE-HEEL-SUB01",
        "level": 2,
        "parent_bom_item_id": "BOM-SOLE-01",
        "component_type": "heel",
        "material_name": "Soprattacco Gomma Naturale",
        "supplier_name": "GommaTech Marche",
        "origin_country_iso2": "PT",
        "unit_of_measure": "pair",
        "unit_consumption": 1.0,
        "waste_percentage": 1.5,
        "recycled_content_pct": 30.0,
        "certifications": ["REACH"],
    }
    bom_resp_l2 = client.post(
        f"/api/v1/pim-items/{pim_id}/plm-variants/{plm_variant_id}/bom",
        json=level_2_bom,
    )
    assert bom_resp_l2.status_code == 201

    level_3_bom = {
        "bom_item_id": "BOM-SOLE-HEEL-GRANULE-L3",
        "level": 3,
        "parent_bom_item_id": "BOM-SOLE-HEEL-SUB01",
        "component_type": "sub_assembly",
        "material_name": "Granulo Caucciu Naturale Vulcanizzato",
        "supplier_name": "BioRubber Lusitania",
        "origin_country_iso2": "PT",
        "unit_of_measure": "kg",
        "unit_consumption": 0.15,
        "waste_percentage": 1.0,
        "recycled_content_pct": 30.0,
        "certifications": ["FSC", "REACH"],
    }
    bom_resp_l3 = client.post(
        f"/api/v1/pim-items/{pim_id}/plm-variants/{plm_variant_id}/bom",
        json=level_3_bom,
    )
    assert bom_resp_l3.status_code == 201
    assert len(bom_resp_l3.json()["bom_items"]) == 3

    # 4. Generate the EU Digital Product Passport (DPP) across the 1 PIM item and its 3 PLM variants
    dpp_resp = client.get(f"/api/v1/pim-items/{pim_id}/dpp-preview")
    assert dpp_resp.status_code == 200
    dpp = dpp_resp.json()
    assert dpp["sku_code"] == "FTL-LOAFER-001"
    assert dpp["total_plm_variants_covered"] == 3
    assert dpp["countries_of_origin"] == ["IT", "PT"]
    assert "LWG Gold" in dpp["certifications_verified"]
    assert "GRS" in dpp["certifications_verified"]
    assert dpp["average_recycled_content_pct"] == 30.0  # (15 + 25 + 50 + 30 + 30) / 5
    assert dpp["traceable_subcontractors_count"] == 2
    assert dpp["bom_hierarchy_summary"]["level_1_count"] == 3
    assert dpp["bom_hierarchy_summary"]["level_2_count"] == 1
    assert dpp["bom_hierarchy_summary"]["level_3_count"] == 1
    assert dpp["bom_hierarchy_summary"]["max_depth_reached"] == 3
    assert dpp["dpp_compliance_ready"] is True


def test_multilevel_bom_requires_parent_id_when_level_gt_1():
    """Ensure BOM integrity: level > 1 without parent_bom_item_id is rejected with 422."""
    create_resp = client.post(
        "/api/v1/pim-items",
        json={
            "sku_code": "BAG-TOSCANA-01",
            "model_name": "Borsa Pelle Firenze",
            "brand_tenant_id": "TENANT-PELLETTERIA-FI",
            "season": "SS27",
            "category": "leather_goods",
            "commercial_description_it": "Borsa a spalla artigianale.",
            "commercial_description_en": "Artisanal shoulder leather bag.",
            "initial_plm_variants": [
                {
                    "variant_code": "BAG-01-COGNAC",
                    "colorway_name": "Cognac",
                    "size_range": "OS",
                    "last_or_pattern_code": "CARTAMODELLO-FI-09",
                }
            ],
        },
    )
    assert create_resp.status_code == 201
    pim = create_resp.json()
    pim_id = pim["pim_item_id"]
    plm_id = pim["plm_variants"][0]["plm_variant_id"]

    invalid_bom = {
        "bom_item_id": "BOM-SUB-ERR",
        "level": 2,
        "parent_bom_item_id": None,
        "component_type": "hardware",
        "material_name": "Fibbia Ottone Galvanizzato",
        "supplier_name": "Accessori Moda Srl",
        "origin_country_iso2": "IT",
        "unit_of_measure": "pcs",
        "unit_consumption": 2.0,
    }
    resp = client.post(f"/api/v1/pim-items/{pim_id}/plm-variants/{plm_id}/bom", json=invalid_bom)
    assert resp.status_code == 422


def test_subcontractor_portal_three_clicks_zero_eur_flow():
    """Verify the '3 Clic a 0 EUR' Mobile Subcontractor Portal workflow and immediate DPP update."""
    seed_resp = client.post("/api/v1/seed")
    assert seed_resp.status_code == 200
    duca = [i for i in seed_resp.json() if i["sku_code"] == "FTL-FW26-LOAFER-01"][0]
    pim_id = duca["pim_item_id"]
    nero_var = duca["plm_variants"][0]
    plm_id = nero_var["plm_variant_id"]

    # Confirm the pending step SUB-DUCA-03 in 3 clicks at 0 EUR cost
    confirm_payload = {
        "pim_item_id": pim_id,
        "plm_variant_id": plm_id,
        "assignment_id": "SUB-DUCA-03",
        "material_lot_code": "LOT-MAM-2026-330C-VERIFIED",
        "operator_note": "Montaggio completato e verificato con scansione mobile",
    }
    confirm_resp = client.post("/api/v1/subcontractor-portal/confirm-step", json=confirm_payload)
    assert confirm_resp.status_code == 200
    conf_data = confirm_resp.json()
    assert conf_data["status"] == "confirmed"
    assert conf_data["clicks_required"] == 3
    assert conf_data["subcontractor_license_cost_eur"] == 0.0
    assert conf_data["updated_assignment"]["completed"] is True
    assert conf_data["updated_assignment"]["material_lot_code"] == "LOT-MAM-2026-330C-VERIFIED"
    assert conf_data["updated_assignment"]["confirmed_at"] is not None
    assert conf_data["dpp_ready"] is True


def test_live_dpp_qr_svg_and_public_passport_html_page():
    """Verify FTL-TECH-003 & FTL-TECH-004: Live EU ESPR Digital Product Passport QR SVG generation and Design System v2.0 HTML page."""
    seed_resp = client.post("/api/v1/seed")
    assert seed_resp.status_code == 200
    duca = [i for i in seed_resp.json() if i["sku_code"] == "FTL-FW26-LOAFER-01"][0]
    pim_id = duca["pim_item_id"]

    # 1. Check enriched DPP preview JSON
    dpp_resp = client.get(f"/api/v1/pim-items/{pim_id}/dpp-preview")
    assert dpp_resp.status_code == 200
    dpp = dpp_resp.json()
    assert dpp["qr_target_url"] == f"/dpp/{pim_id}"
    assert dpp["qr_svg_data_uri"].startswith("data:image/svg+xml;utf8,")
    assert dpp["carbon_footprint_estimate_kg"] > 0
    assert dpp["repairability_index"] >= 8.0
    assert dpp["data_quality_score"] == 100
    assert dpp["espr_compliance_checklist"]["unique_product_identifier"] is True
    assert dpp["espr_compliance_checklist"]["one_pim_to_n_plm_bridge"] is True
    assert dpp["espr_compliance_checklist"]["multilevel_bom_traceability"] is True

    # 2. Check standalone SVG QR endpoint
    svg_resp = client.get(f"/api/v1/pim-items/{pim_id}/dpp-qr.svg")
    assert svg_resp.status_code == 200
    assert "<svg" in svg_resp.text
    assert f'href="/dpp/{pim_id}"' in svg_resp.text
    assert "FTL-FW26-LOAFER-01" in svg_resp.text

    # 3. Check public HTML DPP Passport page in Design System v2.0
    html_resp = client.get(f"/dpp/{pim_id}")
    assert html_resp.status_code == 200
    assert "EU ESPR Digital Product Passport" in html_resp.text
    assert "Mocassino Artigianale Duca" in html_resp.text
    assert "1 ↔ 3 Varianti" in html_resp.text
    assert "Barlow Condensed" in html_resp.text


def test_sprint3_pim_data_quality_export_l6_costing_and_lifecycle():
    """Verify Sprint 3 (FTL-TECH-004): FEAT-05 Data Quality & Syndication Export, ADR-006 L6 Cost Segregation, and PLM Lifecycle Snapshot Locking."""
    seed_resp = client.post("/api/v1/seed")
    assert seed_resp.status_code == 200
    duca = [i for i in seed_resp.json() if i["sku_code"] == "FTL-FW26-LOAFER-01"][0]
    pim_id = duca["pim_item_id"]
    first_var_id = duca["plm_variants"][0]["plm_variant_id"]
    sample_var_id = duca["plm_variants"][2]["plm_variant_id"]

    # 1. Data Quality Score (FEAT-05)
    dq_resp = client.get(f"/api/v1/pim-items/{pim_id}/data-quality")
    assert dq_resp.status_code == 200
    dq = dq_resp.json()
    assert dq["data_quality_score"] == 100
    assert dq["dpp_publication_unlocked"] is True

    # 2. Omnichannel Catalog Export (JSON, CSV, Shopify, B2B) without duplicating Master SKU
    exp_json = client.get("/api/v1/pim-items/export/catalog?format=json").json()
    assert exp_json["total_master_skus"] == 2
    assert exp_json["l6_cost_segregation"] == "ENFORCED_NO_INDUSTRIAL_COSTS"

    exp_csv = client.get("/api/v1/pim-items/export/catalog?format=csv")
    assert exp_csv.status_code == 200
    assert "FTL-FW26-LOAFER-01" in exp_csv.text

    exp_shopify = client.get("/api/v1/pim-items/export/catalog?format=shopify").json()
    assert exp_shopify["total_master_skus"] == 2

    # 3. L6 Cost Segregation: Brand sees full industrial cost, Subcontractor sees masked null costs
    brand_cost = client.get(
        f"/api/v1/pim-items/{pim_id}/plm-variants/{first_var_id}/costing?viewer_role=brand"
    ).json()
    assert brand_cost["l6_security_policy"] == "ADR-006_AUTHORIZED_BRAND_OWNER"
    assert brand_cost["total_industrial_cost_eur"] > 0
    assert brand_cost["wholesale_gross_margin_pct"] > 0

    sub_cost = client.get(
        f"/api/v1/pim-items/{pim_id}/plm-variants/{first_var_id}/costing?viewer_role=subcontractor"
    ).json()
    assert sub_cost["l6_security_policy"] == "ADR-006_COST_MASKED_FOR_0_EUR_SUBCONTRACTOR"
    assert sub_cost["total_industrial_cost_eur"] is None
    assert sub_cost["wholesale_price_eur"] is None

    # 4. PLM Lifecycle Transition & BOM Snapshot Locking
    lc_resp = client.patch(
        f"/api/v1/pim-items/{pim_id}/plm-variants/{sample_var_id}/lifecycle",
        json={"lifecycle_status": "in_production", "bom_version": "v2.0 (Locked Production Snapshot)"},
    )
    assert lc_resp.status_code == 200
    updated_var = lc_resp.json()
    assert updated_var["lifecycle_status"] == "in_production"
    assert updated_var["bom_snapshot_locked"] is True


def test_sprint4_subcontractor_magic_link_zero_training_and_l6_security():
    """Verify Sprint 4 (FTL-TECH-005 & FTL-PROD-004): Subcontractor Magic Link generation, passwordless mobile access, and zero L6 cost exposure."""
    seed_resp = client.post("/api/v1/seed")
    assert seed_resp.status_code == 200
    loafer = [i for i in seed_resp.json() if i["sku_code"] == "FTL-FW26-LOAFER-01"][0]
    pim_id = loafer["pim_item_id"]
    var_id = loafer["plm_variants"][0]["plm_variant_id"]
    assign = loafer["plm_variants"][0]["subcontractor_assignments"][0]
    assign_id = assign["assignment_id"]

    # 1. Generate passwordless Magic Link for district subcontractor
    gen_resp = client.post(
        "/api/v1/subcontractor-portal/generate-magic-link",
        json={"pim_item_id": pim_id, "plm_variant_id": var_id, "assignment_id": assign_id},
    )
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()
    assert gen_data["status"] == "success"
    assert "token" in gen_data
    assert gen_data["subcontractor_license_cost_eur"] == 0.0
    assert gen_data["l6_cost_segregation"] == "ENFORCED_ZERO_FINANCIAL_EXPOSURE"
    token = gen_data["token"]

    # 2. Access mobile portal via Magic Link token
    auth_resp = client.get(
        f"/api/v1/subcontractor-portal/magic-access?token={token}&pim_item_id={pim_id}&plm_variant_id={var_id}&assignment_id={assign_id}"
    )
    assert auth_resp.status_code == 200
    auth_data = auth_resp.json()
    assert auth_data["auth_status"] == "authenticated_subcontractor_free_tier"
    assert auth_data["subcontractor_fee_eur"] == 0.0
    assert auth_data["clicks_to_complete"] == 3
    assert auth_data["average_time_seconds_target"] <= 90
    assert "assignment" in auth_data
    assert auth_data["assignment"]["assignment_id"] == assign_id

    # 3. Security verification: Verify invalid token returns 401 Unauthorized
    bad_resp = client.get(
        f"/api/v1/subcontractor-portal/magic-access?token=INVALID-TOKEN-999&pim_item_id={pim_id}&plm_variant_id={var_id}&assignment_id={assign_id}"
    )
    assert bad_resp.status_code == 401


# ============================================================================
# SPRINT 5 TEST SUITE (ADR-007): Seasons, Collections, Registries & Schema Studio
# ============================================================================


def test_seasons_and_collections_api():
    """Verify Season -> Collections 1:N hierarchy, creation, and listing."""
    # 1. List initial seeded seasons
    resp = client.get("/api/v1/seasons")
    assert resp.status_code == 200
    seasons = resp.json()
    assert len(seasons) >= 2
    codes = [s["code"] for s in seasons]
    assert "P/E 2026" in codes
    assert "A/I 2026-2027" in codes

    pe26 = next(s for s in seasons if s["code"] == "P/E 2026")
    assert len(pe26["collections"]) >= 3
    col_codes = [c["code"] for c in pe26["collections"]]
    assert "MAIN-26" in col_codes
    assert "FASH-26" in col_codes
    assert "CAPS-26" in col_codes

    # 2. Create new Season
    new_season_payload = {
        "code": "CRUISE-27",
        "name": "Collezione Resort Cruise 2027",
        "year": 2027,
        "status": "planning",
        "description": "Edizione speciale Riviera e Resort",
        "initial_collections": [
            {
                "code": "RESORT-01",
                "name": "Resort Capsule",
                "target_market": "High Luxury",
                "status": "draft",
                "description": "Modelli da sfilata mare e resort",
            }
        ],
    }
    create_resp = client.post("/api/v1/seasons", json=new_season_payload)
    assert create_resp.status_code == 201
    created_season = create_resp.json()
    assert created_season["code"] == "CRUISE-27"
    assert len(created_season["collections"]) == 1

    # 3. Add collection to newly created season
    add_col_resp = client.post(
        f"/api/v1/seasons/{created_season['season_id']}/collections",
        json={
            "code": "BEACH-02",
            "name": "Beachwear Leather Icons",
            "target_market": "Boutique",
            "status": "approved",
            "description": "Sandali e ciabattine artigianali",
        },
    )
    assert add_col_resp.status_code == 201
    created_col = add_col_resp.json()
    assert created_col["code"] == "BEACH-02"


def test_domain_registries_api():
    """Verify Master Data Registries for PLM & PIM (CRUD and categorization)."""
    # 1. Summary of registries
    summary_resp = client.get("/api/v1/registries")
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert summary["total_entries"] >= 10
    assert any(r["name"] == "categories" for r in summary["pim_registries"])
    assert any(r["name"] == "suppliers" for r in summary["plm_registries"])

    # 2. Get specific registry entries
    cat_resp = client.get("/api/v1/registries/pim/categories")
    assert cat_resp.status_code == 200
    categories = cat_resp.json()
    assert len(categories) >= 3
    cat_codes = [c["entry_code"] for c in categories]
    assert "footwear" in cat_codes
    assert "leather_goods" in cat_codes

    # 3. Add a new supplier registry entry
    new_sup = {
        "registry_domain": "plm",
        "registry_name": "suppliers",
        "entry_code": "conceria_veneto_lux",
        "label_it": "Conceria Veneto Luxury Srl (Arzignano)",
        "label_en": "Veneto Luxury Tannery IT",
        "metadata": {"district": "Chiampo-Arzignano", "country": "IT", "rating": "A++"},
        "is_active": True,
        "sort_order": 10,
    }
    sup_resp = client.post("/api/v1/registries/plm/suppliers", json=new_sup)
    assert sup_resp.status_code == 201
    assert sup_resp.json()["entry_code"] == "conceria_veneto_lux"

    # 4. Update the added supplier entry (FTL-CEO-007)
    update_payload = {
        "label_it": "Conceria Veneto Luxury Srl (Aggiornato)",
        "label_en": "Veneto Luxury Tannery IT (Updated)",
        "metadata": {"district": "Chiampo-Arzignano", "country": "IT", "rating": "AAA"},
        "sort_order": 5,
        "is_active": True,
    }
    upd_resp = client.put("/api/v1/registries/plm/suppliers/conceria_veneto_lux", json=update_payload)
    assert upd_resp.status_code == 200
    upd_data = upd_resp.json()
    assert upd_data["label_it"] == "Conceria Veneto Luxury Srl (Aggiornato)"
    assert upd_data["metadata"]["rating"] == "AAA"
    assert upd_data["sort_order"] == 5

    # 5. Delete the added supplier entry
    del_resp = client.delete("/api/v1/registries/plm/suppliers/conceria_veneto_lux")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "deleted"


def test_dynamic_schema_attributes_api():
    """Verify Founder Data Model Studio: dynamic schema attribute definition, listing, and protection."""
    # 1. Overview of entities
    overview_resp = client.get("/api/v1/schema/entities")
    assert overview_resp.status_code == 200
    overview = overview_resp.json()
    assert len(overview["entities"]) == 3
    entity_names = [e["target_entity"] for e in overview["entities"]]
    assert "pim_item" in entity_names
    assert "plm_variant" in entity_names
    assert "bom_item" in entity_names

    # 2. Get attributes defined on plm_variant
    plm_attrs_resp = client.get("/api/v1/schema/entities/plm_variant/attributes")
    assert plm_attrs_resp.status_code == 200
    plm_attrs = plm_attrs_resp.json()
    attr_keys = [a["field_key"] for a in plm_attrs]
    assert "heel_height_mm" in attr_keys
    assert "leather_finish" in attr_keys

    # 3. Founder creates a new custom attribute on plm_variant: 'tanning_fragrance_note'
    new_attr_payload = {
        "target_entity": "plm_variant",
        "field_key": "fragrance_note",
        "label_it": "Nota Olfattiva Concia Naturale",
        "label_en": "Natural Tanning Fragrance Note",
        "field_type": "select",
        "options": ["Legno di Cedro", "Tannino di Castagno", "Agrumi di Sicilia", "Nessuna"],
        "is_required": False,
        "default_value": "Tannino di Castagno",
        "group_name": "Esperienza Sensoriale",
        "is_system": False,
        "description": "Sentore olfattivo certificato rilasciato dalla tomaia in concia vegetale",
    }
    create_attr_resp = client.post("/api/v1/schema/entities/plm_variant/attributes", json=new_attr_payload)
    assert create_attr_resp.status_code == 201
    created_attr = create_attr_resp.json()
    assert created_attr["field_key"] == "fragrance_note"
    assert created_attr["field_type"] == "select"

    # 4. Delete the custom attribute
    del_attr_resp = client.delete("/api/v1/schema/entities/plm_variant/attributes/fragrance_note")
    assert del_attr_resp.status_code == 200
    assert del_attr_resp.json()["status"] == "deleted"

    # 5. Security check: Attempting to delete a system attribute must fail with 403 Forbidden
    del_sys_resp = client.delete("/api/v1/schema/entities/pim_item/attributes/target_gender")
    assert del_sys_resp.status_code == 403


def test_pim_and_plm_with_seasons_and_custom_attributes():
    """Verify creating PIM and PLM items with season, collection, and dynamic custom attributes."""
    # 1. Create a PIM item linked to Season P/E 2026 and Collection MAIN-26 with custom attributes
    pim_payload = {
        "sku_code": "FTL-PE26-SNEAKER-01",
        "model_name": "Sneaker Iconica Brenta",
        "brand_tenant_id": "TENANT-CALZATURIFICIO-ROSSI",
        "season": "P/E 2026",
        "season_id": "SEASON-PE26",
        "collection_id": "COLL-SEASON-PE26-MAIN26",
        "collection_name": "Main Collection",
        "category": "footwear",
        "commercial_description_it": "Sneaker artigianale in pelle di vitello e fondo cassetta cucito.",
        "commercial_description_en": "Artisanal sneaker in calfskin with stitched cupsole.",
        "wholesale_price_eur": 140.0,
        "retail_price_eur": 380.0,
        "hs_customs_code": "6403.59.95",
        "gtin_ean": "8050012026999",
        "custom_attributes": {
            "target_gender": "Unisex",
            "sustainability_rating": "A - Eccellenza Circolare",
            "collection_drop_number": 1,
        },
        "initial_plm_variants": [
            {
                "variant_code": "FTL-SNK-01-WHITE",
                "colorway_name": "Bianco Ottico & Camoscio Tortora",
                "size_range": "36-45",
                "last_or_pattern_code": "FORMA-SNK-BRENTA-04",
                "lifecycle_status": "prototype",
                "collection_id": "COLL-SEASON-PE26-MAIN26",
                "custom_attributes": {
                    "heel_height_mm": 18.0,
                    "leather_finish": "Pieno Fiore Semilucido",
                    "fitting_width": "Regolare (D/E)",
                },
            }
        ],
    }
    resp = client.post("/api/v1/pim-items", json=pim_payload)
    assert resp.status_code == 201
    created_pim = resp.json()
    assert created_pim["season_id"] == "SEASON-PE26"
    assert created_pim["collection_id"] == "COLL-SEASON-PE26-MAIN26"
    assert created_pim["custom_attributes"]["target_gender"] == "Unisex"
    assert len(created_pim["plm_variants"]) == 1
    assert created_pim["plm_variants"][0]["custom_attributes"]["heel_height_mm"] == 18.0

    # 2. Verify filter by season_id
    filtered_resp = client.get(f"/api/v1/pim-items?season_id=SEASON-PE26")
    assert filtered_resp.status_code == 200
    items = filtered_resp.json()
    assert any(i["sku_code"] == "FTL-PE26-SNEAKER-01" for i in items)

    # 3. Verify collection products endpoint
    col_prod_resp = client.get("/api/v1/seasons/SEASON-PE26/collections/COLL-SEASON-PE26-MAIN26/products")
    assert col_prod_resp.status_code == 200
    col_items = col_prod_resp.json()
    assert any(i["sku_code"] == "FTL-PE26-SNEAKER-01" for i in col_items)


