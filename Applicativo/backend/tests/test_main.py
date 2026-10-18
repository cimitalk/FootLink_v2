"""Unit and Domain Integration Tests for Footlink Backend:
- SQLite / SQLAlchemy Persistence & Made-in-Italy Seed Data (FTL-TECH-002)
- 1 PIM Commercial Item <-> N PLM Production Variants Bridge (FTL-TECH-002)
- 3-Level Hierarchical Bill of Materials (BOM Level 1 -> Level 2 -> Level 3) (FTL-TECH-002)
- 0 EUR Mobile Subcontractor Portal ('3 Clic a 0 EUR') (FTL-TECH-002)
- Live EU ESPR Digital Product Passport (DPP) & Navigable SVG QR Code Generator (FTL-TECH-003)
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
    """Ensure clean repository before each test, and restore initial seed data into footlink.db afterwards."""
    PIM_STORE.clear()
    yield
    seed_initial_data(db_manager, force=True)


def test_health_check_free_tier_compliance():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["architecture_adr"] == "ADR-002"
    assert data["hosting_tier"] == "free-tier-0-eur"
    assert data["domain_model"] == "1-PIM-to-N-PLM"
    assert data["persistence_engine"] == "sqlite-sqlalchemy-ready"


def test_sqlite_persistence_and_initial_seed_data():
    """Verify SQLite database file creation and Made-in-Italy initial seed dataset (2 PIM items, 5 PLM variants, 3-level BOM)."""
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
    """Verify FTL-TECH-003: Live EU ESPR Digital Product Passport QR SVG generation and navigable HTML page."""
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
    assert dpp["espr_compliance_checklist"]["unique_product_identifier"] is True
    assert dpp["espr_compliance_checklist"]["one_pim_to_n_plm_bridge"] is True
    assert dpp["espr_compliance_checklist"]["multilevel_bom_traceability"] is True

    # 2. Check standalone SVG QR endpoint
    svg_resp = client.get(f"/api/v1/pim-items/{pim_id}/dpp-qr.svg")
    assert svg_resp.status_code == 200
    assert "<svg" in svg_resp.text
    assert f'href="/dpp/{pim_id}"' in svg_resp.text
    assert "FTL-FW26-LOAFER-01" in svg_resp.text

    # 3. Check public HTML DPP Passport page reached via QR code
    html_resp = client.get(f"/dpp/{pim_id}")
    assert html_resp.status_code == 200
    assert "EU ESPR Digital Product Passport" in html_resp.text
    assert "Mocassino Artigianale Duca" in html_resp.text
    assert "1 ↔ 3 Varianti" in html_resp.text
