"""Unit and Domain Integration Tests for Footlink Backend (1 PIM <-> N PLM, Multi-level BOM, EU DPP)."""

import pytest
from fastapi.testclient import TestClient

from app.main import PIM_STORE, app

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_store():
    """Ensure clean in-memory repository before each test."""
    PIM_STORE.clear()
    yield
    PIM_STORE.clear()


def test_health_check_free_tier_compliance():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["architecture_adr"] == "ADR-002"
    assert data["hosting_tier"] == "free-tier-0-eur"
    assert data["domain_model"] == "1-PIM-to-N-PLM"


def test_one_pim_to_many_plm_variants_and_multilevel_bom_and_dpp():
    """Verify the core 1 PIM Commercial Item <-> N PLM Production Variants domain cardinality, multi-level BOM, and EU DPP."""
    # 1. Create 1 PIM Commercial Item with 2 initial PLM Production Variants
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

    # 3. Append a Level-2 sub-component to the BOM of the 3rd PLM variant (Multi-level BOM validation)
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
    bom_resp = client.post(
        f"/api/v1/pim-items/{pim_id}/plm-variants/{plm_variant_id}/bom",
        json=level_2_bom,
    )
    assert bom_resp.status_code == 201
    assert len(bom_resp.json()["bom_items"]) == 2

    # 4. Generate the EU Digital Product Passport (DPP) across the 1 PIM item and its 3 PLM variants
    dpp_resp = client.get(f"/api/v1/pim-items/{pim_id}/dpp-preview")
    assert dpp_resp.status_code == 200
    dpp = dpp_resp.json()
    assert dpp["sku_code"] == "FTL-LOAFER-001"
    assert dpp["total_plm_variants_covered"] == 3
    assert dpp["countries_of_origin"] == ["IT", "PT"]
    assert "LWG Gold" in dpp["certifications_verified"]
    assert "GRS" in dpp["certifications_verified"]
    assert dpp["average_recycled_content_pct"] == 30.0  # (15 + 25 + 50 + 30) / 4
    assert dpp["traceable_subcontractors_count"] == 2
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
