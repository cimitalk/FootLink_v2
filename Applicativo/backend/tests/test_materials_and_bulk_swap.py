"""Test Suite for Sprint 9: Centralized Materials Catalog & Bulk Material Swap
Task FTL-TECH-030 / ADR-017
"""

import pytest
from starlette.testclient import TestClient

from app.database import db_manager
from app.main import app
from app.models import (
    BulkMaterialSwapRequest,
    MaterialCreate,
    MaterialUpdate,
)
from app.seed import seed_initial_data


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure database is seeded with initial data including Sprint 9 materials."""
    seed_initial_data(db_manager, force=True)


@pytest.fixture
def client():
    return TestClient(app)


def test_sprint9_materials_catalog_initial_seed_and_filters(client):
    """Verify that materials catalog is populated with footwear/leather goods materials and filterable."""
    res = client.get("/api/v1/materials")
    assert res.status_code == 200
    materials = res.json()
    assert len(materials) >= 10

    # Verify leather category filter
    res_leather = client.get("/api/v1/materials?category=leather")
    assert res_leather.status_code == 200
    leathers = res_leather.json()
    assert len(leathers) >= 3
    assert all(m["category"] == "leather" for m in leathers)

    # Verify vendor filter
    res_vendor = client.get("/api/v1/materials?vendor_id=VND-CONC-001")
    assert res_vendor.status_code == 200
    v_mats = res_vendor.json()
    assert len(v_mats) >= 2
    assert all(m["vendor_id"] == "VND-CONC-001" for m in v_mats)


def test_sprint9_material_crud_lifecycle(client):
    """Test full CRUD lifecycle for registering and updating a new material."""
    payload = {
        "material_id": "MAT-TEST-001",
        "material_code": "ART-TEST-ALBO-01",
        "name": "Vitello Pieno Fiore Premium Test",
        "category": "leather",
        "vendor_id": "VND-CONC-001",
        "unit_of_measure": "dm2",
        "standard_cost": 1.15,
        "color_shade": "Moro Caffè",
        "certifications": ["LWG Gold", "REACH"],
        "technical_specs": {"thickness_mm": 1.4, "temper": "firm"},
        "is_active": True,
    }
    # 1. Create
    res_create = client.post("/api/v1/materials", json=payload)
    assert res_create.status_code == 201
    created = res_create.json()
    assert created["material_id"] == "MAT-TEST-001"
    assert created["standard_cost"] == 1.15
    assert created["vendor_name"] is not None

    # 2. Get by ID
    res_get = client.get("/api/v1/materials/MAT-TEST-001")
    assert res_get.status_code == 200
    fetched = res_get.json()
    assert fetched["name"] == "Vitello Pieno Fiore Premium Test"

    # 3. Patch
    patch_payload = {
        "standard_cost": 1.25,
        "color_shade": "Moro Scuro Lucido",
    }
    res_patch = client.patch("/api/v1/materials/MAT-TEST-001", json=patch_payload)
    assert res_patch.status_code == 200
    patched = res_patch.json()
    assert patched["standard_cost"] == 1.25
    assert patched["color_shade"] == "Moro Scuro Lucido"

    # 4. Delete
    res_del = client.delete("/api/v1/materials/MAT-TEST-001")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "success"


def test_sprint9_bulk_material_swap_on_variant(client):
    """Test Bulk Material Swap replacing a material on a variant and updating BOM lines."""
    # First, let's find a variant and its BOM
    pim_res = client.get("/api/v1/pim-items")
    assert pim_res.status_code == 200
    pims = pim_res.json()
    assert len(pims) > 0

    first_pim = pims[0]
    variant = first_pim["plm_variants"][0]
    variant_id = variant["plm_variant_id"]

    # Target material from catalog
    target_mat_id = "MAT-PEL-002"  # Camoscio Suede Idrorepellente
    target_mat_res = client.get(f"/api/v1/materials/{target_mat_id}")
    assert target_mat_res.status_code == 200
    target_mat = target_mat_res.json()

    # Find the upper or first bom item material name
    bom_item = variant["bom_items"][0]
    source_name = bom_item["material_name"]

    # Execute swap
    swap_req = {
        "source_material_name": source_name,
        "target_material_id": target_mat_id,
        "update_costs": True,
    }
    swap_res = client.post(f"/api/v1/plm-variants/{variant_id}/bom/bulk-swap", json=swap_req)
    assert swap_res.status_code == 200
    swap_result = swap_res.json()
    assert swap_result["swapped_items_count"] >= 1
    assert variant_id in swap_result["impacted_variants"]

    # Verify that the variant's BOM now reflects the target material
    updated_pim = client.get(f"/api/v1/pim-items/{first_pim['pim_item_id']}").json()
    updated_var = next(v for v in updated_pim["plm_variants"] if v["plm_variant_id"] == variant_id)
    updated_bom_item = next(b for b in updated_var["bom_items"] if b["bom_item_id"] == bom_item["bom_item_id"])

    assert updated_bom_item["material_id"] == target_mat_id
    assert updated_bom_item["material_name"] == target_mat["name"]
    assert updated_bom_item["unit_cost_eur"] == target_mat["standard_cost"]


def test_sprint9_bulk_material_swap_on_product(client):
    """Test Bulk Material Swap across all variants of a product."""
    pim_res = client.get("/api/v1/pim-items")
    pims = pim_res.json()
    product = pims[0]
    prod_id = product["pim_item_id"]

    target_sole_id = "MAT-FND-001"  # Fondo Cassetta Gomma TR
    target_sole_res = client.get(f"/api/v1/materials/{target_sole_id}").json()

    # Find sole component
    sample_bom = product["plm_variants"][0]["bom_items"]
    sole_item = next((b for b in sample_bom if "suola" in b["material_name"].lower() or "fondo" in b["material_name"].lower() or b["component_type"] == "outsole"), sample_bom[0])

    swap_req = {
        "source_material_name": sole_item["material_name"],
        "target_material_id": target_sole_id,
        "update_costs": True,
    }

    swap_res = client.post(f"/api/v1/products/{prod_id}/bom/bulk-swap", json=swap_req)
    assert swap_res.status_code == 200
    res_data = swap_res.json()
    assert res_data["swapped_items_count"] >= 1
    assert len(res_data["impacted_variants"]) >= 1
