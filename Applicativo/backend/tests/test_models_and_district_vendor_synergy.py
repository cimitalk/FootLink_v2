"""Pytest Suite for Product Models (FTL-CEO-021) & Albo Fornitori District Synergy (FTL-CEO-022)."""

from __future__ import annotations

import pytest
from app._compat import get_test_client
from app.main import app


@pytest.fixture(scope="module")
def client() -> Any:
    return get_test_client(app)


def test_product_models_crud(client: TestClient) -> None:
    # 1. List seeded models
    res = client.get("/api/v1/product-models")
    assert res.status_code == 200, res.text
    models = res.json()
    assert len(models) >= 4
    codes = [m["model_code"] for m in models]
    assert "MOD-LOAFER-01" in codes
    assert "MOD-TOTE-01" in codes

    # 2. Create a new model
    new_model = {
        "model_code": "MOD-DERBY-02",
        "name": "Derby Francesina Cap-Toe",
        "category": "footwear",
        "target_gender": "men",
        "last_code": "Forma Inglese 108",
        "sole_construction": "Goodyear",
        "heel_height_mm": 28.0,
        "default_size_range": "39-46",
        "description": "Scarpa allacciata derby a 5 occhielli con puntina impunturata.",
        "cad_drawing_ref": "CAD-DERBY-108-V1.dxf",
        "is_active": True,
        "metadata": {"pattern_pieces": 7},
    }
    c_res = client.post("/api/v1/product-models", json=new_model)
    assert c_res.status_code == 201, c_res.text
    created = c_res.json()
    assert created["model_code"] == "MOD-DERBY-02"
    assert created["sole_construction"] == "Goodyear"
    mid = created["model_id"]

    # 3. Get model detail
    g_res = client.get(f"/api/v1/product-models/{mid}")
    assert g_res.status_code == 200, g_res.text
    detail = g_res.json()
    assert detail["name"] == "Derby Francesina Cap-Toe"
    assert "attached_pim_items" in detail

    # 4. Update model
    u_res = client.put(f"/api/v1/product-models/{mid}", json={"heel_height_mm": 30.0, "last_code": "Forma 108 Bis"})
    assert u_res.status_code == 200, u_res.text
    updated = u_res.json()
    assert updated["heel_height_mm"] == 30.0
    assert updated["last_code"] == "Forma 108 Bis"

    # 5. Delete model
    d_res = client.delete(f"/api/v1/product-models/{mid}")
    assert d_res.status_code == 200, d_res.text
    assert client.get(f"/api/v1/product-models/{mid}").status_code == 404


def test_product_models_attach_and_detach(client: TestClient) -> None:
    # 1. Get loafer model
    g_res = client.get("/api/v1/product-models/MOD-LOAFER-01")
    assert g_res.status_code == 200, g_res.text
    initial = g_res.json()
    initial_count = initial["attached_products_count"]

    # 2. Attach PIM item
    att_res = client.post("/api/v1/product-models/MOD-LOAFER-01/attach-product", json={"pim_item_id": "PIM-DUCA-001"})
    assert att_res.status_code == 200, att_res.text
    after_att = att_res.json()
    attached_ids = [p["pim_item_id"] for p in after_att["attached_pim_items"]]
    assert "PIM-DUCA-001" in attached_ids

    # 3. Detach PIM item
    det_res = client.post("/api/v1/product-models/MOD-LOAFER-01/detach-product", json={"pim_item_id": "PIM-DUCA-001"})
    assert det_res.status_code == 200, det_res.text
    after_det = det_res.json()
    detached_ids = [p["pim_item_id"] for p in after_det["attached_pim_items"]]
    assert "PIM-DUCA-001" not in detached_ids

    # Re-attach for ongoing consistency
    client.post("/api/v1/product-models/MOD-LOAFER-01/attach-product", json={"pim_item_id": "PIM-DUCA-001"})


def test_vendor_district_company_link_and_unlink(client: TestClient) -> None:
    # 1. Link vendor VND-CONC-001 to comp-pmi-montebello
    link_res = client.post(
        "/api/v1/vendors/VND-CONC-001/link-district-company",
        json={"company_id": "comp-pmi-montebello"},
    )
    assert link_res.status_code == 200, link_res.text
    vendor_linked = link_res.json()
    assert vendor_linked["district_company_id"] == "comp-pmi-montebello"
    assert vendor_linked["district_company"] is not None
    assert vendor_linked["district_company"]["legal_name"] == "Conceria Montebello SpA"

    # 2. Unlink vendor
    unlink_res = client.post("/api/v1/vendors/VND-CONC-001/unlink-district-company")
    assert unlink_res.status_code == 200, unlink_res.text
    vendor_unlinked = unlink_res.json()
    assert vendor_unlinked["district_company_id"] is None
    assert vendor_unlinked["district_company"] is None


def test_vendor_auto_link_district(client: TestClient) -> None:
    res = client.post("/api/v1/vendors/auto-link-district")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "matched_count" in data
    assert "linked_vendors" in data
