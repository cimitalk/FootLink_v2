"""Sprint 8 Automated Pytest Suite (Epoca II - La Verticalizzazione):
- FTL-TECH-022: Color Intelligence Engine, Master & Seasonal Color Palette,
  3-Level Colorway BOM Matrix, Lab-Dip & Delta-E Gate, 1-Click Colorway Explosion,
  Tannery <-> BOM Chromatic Consistency & PIM Omnichannel E-Commerce Translation.
- FTL-TECH-023: Vendor Hub 360, Deterministic 40/30/30 Vendor Rating,
  SHA-256 Certifications & Expiry Semaphores, 0 EUR Subcontractor Tier,
  Formal ADR-006/ADR-011 L6 Cost Segregation Audit & Relational Where-Used Analysis.
"""

from __future__ import annotations

import hashlib
import os
import sys
from datetime import date, timedelta

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

import pytest
from app._compat import get_test_client
from app.database import db_manager
from app.main import app
from app.seed import seed_initial_data

client = get_test_client(app)


@pytest.fixture(autouse=True)
def reset_sprint8_seed():
    """Ensure deterministic seeded database before and after each Sprint 8 test."""
    seed_initial_data(db_manager, force=True)
    yield
    seed_initial_data(db_manager, force=True)


# ============================================================================
# TEST-S8-01: Master Color Palette CRUD, HEX Validation, Filters & Soft-Delete
# ============================================================================


def test_s8_01a_master_colors_seed_crud_and_hex_validation():
    """TEST-S8-01a: Verify 10 seeded colors, CRUD lifecycle on /api/v1/colors, and 422 on invalid HEX."""
    resp = client.get("/api/v1/colors")
    assert resp.status_code == 200
    colors = resp.json()
    assert len(colors) == 10

    blk = next(c for c in colors if c["id"] == "MCOL-BLK-001")
    assert blk["color_id"] == "MCOL-BLK-001"
    assert blk["color_code"] == "COL-BLK-001"
    assert blk["hex_code"] == "#141414"
    assert "ALL_CARRYOVER" in blk["season_ids"]
    assert "pellame" in blk["applicable_domains"]

    # Invalid HEX formats must return 422
    bad_hex_1 = client.post(
        "/api/v1/colors",
        json={
            "color_code": "COL-BAD-HEX1",
            "technical_name_it": "Colore Esadecimale Errato",
            "hex_code": "141414",
        },
    )
    assert bad_hex_1.status_code == 422

    bad_hex_2 = client.post(
        "/api/v1/colors",
        json={
            "color_code": "COL-BAD-HEX2",
            "technical_name_it": "Colore Esadecimale Non Valido",
            "hex_code": "#ZZZZZZ",
        },
    )
    assert bad_hex_2.status_code == 422

    # Valid POST with ALL_CARRYOVER season_id safety (must store NULL in SQLite without FK failure)
    create_resp = client.post(
        "/api/v1/colors",
        json={
            "color_code": "COL-SABBIA-26",
            "technical_name_it": "Sabbia Adriatica Nabuk",
            "technical_name_en": "Adriatic Sand Nubuck",
            "commercial_family": "Bianco & Neutri",
            "hex_code": "#d8c3a5",
            "pantone_tcx_code": "PANTONE 14-1116 TCX",
            "ral_code": "RAL 1015",
            "finish_type": "nabuk_vellutato",
            "applicable_domains": ["pellame", "suola"],
            "season_id": "ALL_CARRYOVER",
            "recipe_notes": "Smerigliatura fine idrorepellente",
        },
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    cid = created["id"]
    assert created["color_id"] == cid
    assert created["hex_code"] == "#D8C3A5"
    assert created["season_id"] is None
    assert created["season_ids"] == ["ALL_CARRYOVER"]

    # PUT update
    upd_resp = client.put(
        f"/api/v1/colors/{cid}",
        json={
            "technical_name_it": "Sabbia Adriatica Nabuk Extra",
            "hex_code": "#DCC7AA",
            "season_id": "SEASON-PE26",
        },
    )
    assert upd_resp.status_code == 200
    updated = upd_resp.json()
    assert updated["technical_name_it"] == "Sabbia Adriatica Nabuk Extra"
    assert updated["hex_code"] == "#DCC7AA"
    assert updated["season_id"] == "SEASON-PE26"
    assert "SEASON-PE26" in updated["season_ids"]

    # Unreferenced color hard-deletes cleanly
    del_resp = client.delete(f"/api/v1/colors/{cid}")
    assert del_resp.status_code == 200
    assert del_resp.json() == {"status": "deleted", "color_id": cid}
    assert client.get(f"/api/v1/colors/{cid}").status_code == 404


def test_s8_01b_master_colors_filters_and_soft_deactivate():
    """TEST-S8-01b: Verify season_id, commercial_family, finish_type, domain filters and FK-safe soft-deactivation."""
    pe26_resp = client.get("/api/v1/colors?season_id=SEASON-PE26")
    assert pe26_resp.status_code == 200
    pe26_colors = pe26_resp.json()
    assert len(pe26_colors) == 3
    assert all(c["season_id"] == "SEASON-PE26" for c in pe26_colors)

    carry_resp = client.get("/api/v1/colors?season_id=ALL_CARRYOVER")
    assert carry_resp.status_code == 200
    assert len(carry_resp.json()) == 7
    assert all(c["season_id"] is None for c in carry_resp.json())

    galv_resp = client.get("/api/v1/colors?finish_type=galvanica_metallica")
    assert galv_resp.status_code == 200
    assert {c["id"] for c in galv_resp.json()} == {"MCOL-GLD-010", "MCOL-SLV-011"}

    fam_resp = client.get("/api/v1/colors?commercial_family=Cuoio%20%26%20Marrone")
    assert fam_resp.status_code == 200
    assert {c["id"] for c in fam_resp.json()} == {"MCOL-TAN-002", "MCOL-BRN-003"}

    dom_resp = client.get("/api/v1/colors?domain=minuterie")
    assert dom_resp.status_code == 200
    assert {c["id"] for c in dom_resp.json()} == {"MCOL-GLD-010", "MCOL-SLV-011"}

    # Soft-deactivate a color referenced in variant_colorway_bom_mappings
    soft_del = client.delete("/api/v1/colors/MCOL-BLK-001")
    assert soft_del.status_code == 200
    assert soft_del.json() == {"status": "deactivated", "color_id": "MCOL-BLK-001"}

    blk_after = client.get("/api/v1/colors/MCOL-BLK-001")
    assert blk_after.status_code == 200
    assert blk_after.json()["is_active"] is False

    active_list = client.get("/api/v1/colors?active_only=true")
    assert active_list.status_code == 200
    assert "MCOL-BLK-001" not in {c["id"] for c in active_list.json()}


# ============================================================================
# TEST-S8-02: 3-Level Colorway BOM Matrix, Lab-Dip, Delta-E & Production Gate
# ============================================================================


def test_s8_02_colorway_matrix_3_levels_lab_dip_delta_e_and_production_gate():
    """TEST-S8-02: Verify GET/PUT /api/v1/plm-variants/{id}/colorway-matrix across L1/L2/L3 BOM nodes."""
    # 1. Inspect PLM-DUCA-NERO (6 BOM nodes across levels 1, 2, 3, all approved/master_standard)
    m_nero = client.get("/api/v1/plm-variants/PLM-DUCA-NERO/colorway-matrix")
    assert m_nero.status_code == 200
    nero_data = m_nero.json()
    assert nero_data["total_bom_nodes"] == 6
    assert nero_data["mapped_nodes_count"] == 6
    assert nero_data["approved_nodes_count"] == 6
    assert nero_data["colorway_readiness_pct"] == 100.0
    assert nero_data["production_gate_blocked"] is False
    assert {row["level"] for row in nero_data["mappings"]} == {1, 2, 3}

    # 2. Inspect PLM-DUCA-BORDEAUX (3 BOM nodes: 1 submitted, 2 master_standard -> 66.7%)
    m_bord = client.get("/api/v1/plm-variants/PLM-DUCA-BORDEAUX/colorway-matrix")
    assert m_bord.status_code == 200
    bord_data = m_bord.json()
    assert bord_data["total_bom_nodes"] == 3
    assert bord_data["approved_nodes_count"] == 2
    assert bord_data["colorway_readiness_pct"] == 66.7
    assert bord_data["production_gate_blocked"] is False

    # 3. Reject L1 Upper Lab-Dip with excessive Delta-E (3.4 > 2.5) -> gate MUST block
    put_rej = client.put(
        "/api/v1/plm-variants/PLM-DUCA-BORDEAUX/colorway-matrix",
        json={
            "primary_color_id": "MCOL-RED-007",
            "hardware_finish_color_id": "MCOL-GLD-010",
            "colorway_rule_preset": "luxury_gold_hardware",
            "mappings": [
                {
                    "bom_item_id": "BOM-DUCA3-L1-UPPER",
                    "master_color_id": "MCOL-RED-007",
                    "part_role": "tomaia_principale",
                    "lab_dip_status": "rejected",
                    "delta_e_value": 3.4,
                    "notes": "Viraggio eccessivo verso il violaceo allo spettrofotometro",
                }
            ],
        },
    )
    assert put_rej.status_code == 200
    rej_data = put_rej.json()
    assert rej_data["rejected_nodes_count"] == 1
    assert rej_data["production_gate_blocked"] is True
    assert rej_data["colorway_readiness_pct"] == 66.7

    # 4. Approve new Lab-Dip bath with Delta-E = 0.62 -> readiness reaches 100% & gate unlocks
    put_app = client.put(
        "/api/v1/plm-variants/PLM-DUCA-BORDEAUX/colorway-matrix",
        json={
            "primary_color_id": "MCOL-BLU-006",
            "mappings": [
                {
                    "bom_item_id": "BOM-DUCA3-L1-UPPER",
                    "master_color_id": "MCOL-BLU-006",
                    "part_role": "tomaia_principale",
                    "lab_dip_status": "approved",
                    "delta_e_value": 0.62,
                    "approved_by": "Elena Visconti - QA Colore",
                    "notes": "Secondo bagno conforme allo standard Pantone",
                }
            ],
        },
    )
    assert put_app.status_code == 200
    app_data = put_app.json()
    assert app_data["rejected_nodes_count"] == 0
    assert app_data["approved_nodes_count"] == 3
    assert app_data["colorway_readiness_pct"] == 100.0
    assert app_data["production_gate_blocked"] is False
    upper_row = next(r for r in app_data["mappings"] if r["bom_item_id"] == "BOM-DUCA3-L1-UPPER")
    assert upper_row["master_color_id"] == "MCOL-BLU-006"
    assert upper_row["approved_at"] is not None


# ============================================================================
# TEST-S8-03: 1-Click Colorway Explosion (Deep L1->L2->L3 BOM Clone & Presets)
# ============================================================================


def test_s8_03a_explode_colorways_3_variants_gold_hardware_and_l1_l2_l3_remap():
    """TEST-S8-03a: Explode 3 new PLM variants in 1 click with luxury_gold_hardware and verify L1->L2->L3 BOM tree."""
    src_bom_ids = {
        b["bom_item_id"]
        for v in client.get("/api/v1/pim-items/PIM-DUCA-001").json()["plm_variants"]
        if v["plm_variant_id"] == "PLM-DUCA-BORDEAUX"
        for b in v["bom_items"]
    }
    assert len(src_bom_ids) == 3

    exp_resp = client.post(
        "/api/v1/plm-variants/PLM-DUCA-BORDEAUX/explode-colorways",
        json={
            "target_color_ids": ["MCOL-BLU-006", "MCOL-GRN-008", "MCOL-BRN-003"],
            "rule_preset": "luxury_gold_hardware",
            "auto_link_pim": True,
        },
    )
    assert exp_resp.status_code == 201
    exp_data = exp_resp.json()
    assert exp_data["source_variant_id"] == "PLM-DUCA-BORDEAUX"
    assert exp_data["pim_item_id"] == "PIM-DUCA-001"
    assert exp_data["created_count"] == 3
    assert len(exp_data["created_variants"]) == 3

    for idx, expected_col in enumerate(["MCOL-BLU-006", "MCOL-GRN-008", "MCOL-BRN-003"]):
        new_var = exp_data["created_variants"][idx]
        assert new_var["primary_color_id"] == expected_col
        assert new_var["hardware_finish_color_id"] == "MCOL-GLD-010"
        assert new_var["lifecycle_status"] == "prototype"
        boms = new_var["bom_items"]
        assert len(boms) == 3

        new_ids = {b["bom_item_id"] for b in boms}
        assert new_ids.isdisjoint(src_bom_ids)

        l1 = next(b for b in boms if b["level"] == 1)
        l2 = next(b for b in boms if b["level"] == 2)
        l3 = next(b for b in boms if b["level"] == 3)
        assert l1["parent_bom_item_id"] is None
        assert l2["parent_bom_item_id"] == l1["bom_item_id"]
        assert l3["parent_bom_item_id"] == l2["bom_item_id"]
        assert l1["vendor_id"] == "VND-CONC-001"
        assert l2["vendor_id"] == "VND-GALV-004"

        # Check Colorway Matrix on exploded variant for luxury_gold_hardware rule
        mat_resp = client.get(f"/api/v1/plm-variants/{new_var['plm_variant_id']}/colorway-matrix")
        assert mat_resp.status_code == 200
        mat = mat_resp.json()
        hw_row = next(r for r in mat["mappings"] if r["component_type"] == "hardware")
        assert hw_row["master_color_id"] == "MCOL-GLD-010"
        assert hw_row["galvanics_finish"] == "oro_chiaro_24k"
        assert hw_row["lab_dip_status"] == "master_standard"


def test_s8_03b_explode_colorways_contrast_white_sole_rule():
    """TEST-S8-03b: Verify contrast_white_sole assigns MCOL-WHT-004 to outsole and target color to upper/heel."""
    exp_resp = client.post(
        "/api/v1/plm-variants/PLM-DUCA-NERO/explode-colorways",
        json={
            "target_color_ids": ["MCOL-BLU-006"],
            "rule_preset": "contrast_white_sole",
        },
    )
    assert exp_resp.status_code == 201
    new_var = exp_resp.json()["created_variants"][0]
    assert len(new_var["bom_items"]) == 6

    mat = client.get(f"/api/v1/plm-variants/{new_var['plm_variant_id']}/colorway-matrix").json()
    upper_row = next(r for r in mat["mappings"] if r["component_type"] == "upper")
    sole_row = next(r for r in mat["mappings"] if r["component_type"] == "outsole")
    heel_row = next(r for r in mat["mappings"] if r["component_type"] == "heel")
    assert upper_row["master_color_id"] == "MCOL-BLU-006"
    assert heel_row["master_color_id"] == "MCOL-BLU-006"
    assert sole_row["master_color_id"] == "MCOL-WHT-004"
    assert sole_row["hex_code"] == "#F8F8F6"


# ============================================================================
# TEST-S8-04: Tannery <-> BOM Color Consistency & PIM E-Commerce Colorways
# ============================================================================


def test_s8_04_tannery_color_consistency_and_pim_colorways_ecommerce():
    """TEST-S8-04: Verify /api/v1/tannery-batches/color-consistency and /api/v1/pim-items/{id}/colorways-ecommerce."""
    cons_resp = client.get("/api/v1/tannery-batches/color-consistency")
    assert cons_resp.status_code == 200
    checks = cons_resp.json()
    assert len(checks) >= 2

    nero_check = next(c for c in checks if c["plm_variant_id"] == "PLM-DUCA-NERO")
    assert nero_check["status"] == "coherent"
    assert nero_check["batch_master_color_id"] == "MCOL-BLK-001"
    assert nero_check["bom_master_color_id"] == "MCOL-BLK-001"

    bord_check = next(c for c in checks if c["plm_variant_id"] == "PLM-DUCA-BORDEAUX")
    assert bord_check["status"] == "mismatch"
    assert bord_check["batch_master_color_id"] == "MCOL-BLK-001"
    assert bord_check["bom_master_color_id"] == "MCOL-RED-007"

    # PIM E-Commerce commercial color translation
    ecom_resp = client.get("/api/v1/pim-items/PIM-DUCA-001/colorways-ecommerce")
    assert ecom_resp.status_code == 200
    ecom = ecom_resp.json()
    assert ecom["pim_item_id"] == "PIM-DUCA-001"
    assert ecom["sku_code"] == "FTL-FW26-LOAFER-01"
    assert ecom["commercial_color_families"] == [
        "Nero / Black",
        "Cuoio & Marrone",
        "Rosso & Bordeaux",
    ]
    assert len(ecom["variants_color_map"]) == 3
    assert all(v["hex_code"].startswith("#") for v in ecom["variants_color_map"])


# ============================================================================
# TEST-S8-05: Vendor Hub 360 CRUD, 40/30/30 Rating, SHA-256 Certs & 0 EUR Tier
# ============================================================================


def test_s8_05a_vendor_hub_crud_deterministic_rating_and_subcontractor_zero_eur():
    """TEST-S8-05a: Verify 7 seeded vendors, deterministic 40/30/30 rating formula, and subcontractor_zero_eur tier."""
    resp = client.get("/api/v1/vendors?viewer_role=brand")
    assert resp.status_code == 200
    vendors = resp.json()
    assert len(vendors) == 7

    # Check blocked vendor VND-CONC-009: 0.40*60 + 0.30*55 + 0.30*45 = 54.0 -> class C
    blocked = next(v for v in vendors if v["vendor_id"] == "VND-CONC-009")
    assert blocked["overall_rating"] == 54.0
    assert blocked["rating_class"] == "C"
    assert blocked["qualification_status"] == "blocked_expired_certs"
    assert blocked["has_expired_critical_certs"] is True
    assert blocked["cert_semaphore_status"] == "red"

    # Filter 0 EUR Subcontractors
    sub_resp = client.get("/api/v1/vendors?paas_tier=subcontractor_zero_eur")
    assert sub_resp.status_code == 200
    subs = sub_resp.json()
    assert {s["vendor_id"] for s in subs} == {"VND-TER-005", "VND-TER-006"}

    # Create new vendor and verify exact 40/30/30 rating: 0.40*80 + 0.30*90 + 0.30*70 = 32 + 27 + 21 = 80.0 (A)
    create_v = client.post(
        "/api/v1/vendors",
        json={
            "vendor_code": "TER-TAG-099",
            "company_name": "Tranceria CAD Fermo Artigiana",
            "vat_number": "IT09998880441",
            "supply_chain_role": "cutting_lab",
            "district_area": "Marche - Fermo/Macerata",
            "paas_tier": "subcontractor_zero_eur",
            "qualification_status": "qualified",
            "quality_score": 80.0,
            "otd_score": 90.0,
            "esg_score": 70.0,
        },
    )
    assert create_v.status_code == 201
    v_new = create_v.json()
    vid = v_new["vendor_id"]
    assert v_new["overall_rating"] == 80.0
    assert v_new["rating_class"] == "A"
    assert v_new["paas_tier"] == "subcontractor_zero_eur"

    # Update scores via PUT -> 0.40*95 + 0.30*95 + 0.30*90 = 38 + 28.5 + 27 = 93.5 (A+)
    upd_v = client.put(
        f"/api/v1/vendors/{vid}",
        json={"quality_score": 95.0, "otd_score": 95.0, "esg_score": 90.0},
    )
    assert upd_v.status_code == 200
    assert upd_v.json()["overall_rating"] == 93.5
    assert upd_v.json()["rating_class"] == "A+"

    # Unreferenced vendor hard-deletes cleanly
    del_v = client.delete(f"/api/v1/vendors/{vid}")
    assert del_v.status_code == 200
    assert del_v.json() == {"status": "deleted", "vendor_id": vid}


def test_s8_05b_vendor_certifications_sha256_and_expiry_semaphores():
    """TEST-S8-05b: Verify green/yellow/red certification semaphores and SHA-256 fingerprint generation."""
    v_green = client.get("/api/v1/vendors/VND-CONC-001").json()
    assert v_green["cert_semaphore_status"] == "green"
    assert all(c["status"] == "valid" and c["days_to_expiry"] > 60 for c in v_green["certifications"])

    v_yellow = client.get("/api/v1/vendors/VND-SUOL-003").json()
    assert v_yellow["cert_semaphore_status"] == "yellow"
    assert any(c["status"] == "expiring_soon" and 0 <= c["days_to_expiry"] <= 60 for c in v_yellow["certifications"])

    v_red = client.get("/api/v1/vendors/VND-CONC-009").json()
    assert v_red["cert_semaphore_status"] == "red"
    assert all(c["status"] == "expired" and c["days_to_expiry"] < 0 for c in v_red["certifications"])

    # Add a new certification and verify deterministic SHA-256 hash
    valid_until = (date.today() + timedelta(days=45)).isoformat()
    cert_resp = client.post(
        "/api/v1/vendors/VND-GALV-004/certifications",
        json={
            "cert_type": "ISO 14001",
            "cert_code": "ISO14001-GALV-2026-FI",
            "issuing_body": "TÜV Italia",
            "valid_from": "2026-01-01",
            "valid_until": valid_until,
        },
    )
    assert cert_resp.status_code == 201
    cert = cert_resp.json()
    expected_sha = hashlib.sha256(
        f"VND-GALV-004:ISO 14001:ISO14001-GALV-2026-FI:{valid_until}".encode("utf-8")
    ).hexdigest()
    assert cert["sha256_hash"] == expected_sha
    assert len(cert["sha256_hash"]) == 64
    assert cert["status"] == "expiring_soon"
    assert cert["days_to_expiry"] == 45

    # Vendor semaphore updates to yellow when a <=60d cert is attached
    v_galv = client.get("/api/v1/vendors/VND-GALV-004").json()
    assert v_galv["cert_semaphore_status"] == "yellow"

    # Delete certification -> semaphore returns to green
    del_c = client.delete(f"/api/v1/vendors/VND-GALV-004/certifications/{cert['cert_id']}")
    assert del_c.status_code == 200
    assert client.get("/api/v1/vendors/VND-GALV-004").json()["cert_semaphore_status"] == "green"


# ============================================================================
# TEST-S8-06: Formal L6 Segregation Audit (Subcontractor & Consumer Views)
# ============================================================================


def test_s8_06_formal_l6_segregation_audit_on_vendors_and_where_used():
    """TEST-S8-06: Mathematical verification that ALL L6 commercial/financial/rating fields are None when viewer_role != 'brand'."""
    l6_vendor_fields = [
        "quality_score",
        "otd_score",
        "esg_score",
        "overall_rating",
        "rating_class",
        "moq_description",
        "payment_terms_l6",
        "hourly_or_unit_rate_eur_l6",
        "negotiated_price_list_l6",
        "internal_audit_notes_l6",
    ]

    for non_brand_role in ("subcontractor", "consumer"):
        list_resp = client.get(f"/api/v1/vendors?viewer_role={non_brand_role}")
        assert list_resp.status_code == 200
        vendors = list_resp.json()
        assert len(vendors) >= 7
        for v in vendors:
            assert v["l6_segregated"] is True
            for field_name in l6_vendor_fields:
                assert v[field_name] is None, f"L6 leak on {field_name} for role {non_brand_role}"

        single_resp = client.get(f"/api/v1/vendors/VND-CONC-001?viewer_role={non_brand_role}")
        assert single_resp.status_code == 200
        sv = single_resp.json()
        assert sv["l6_segregated"] is True
        for field_name in l6_vendor_fields:
            assert sv[field_name] is None

        wu_resp = client.get(f"/api/v1/vendors/VND-CONC-001/where-used?viewer_role={non_brand_role}")
        assert wu_resp.status_code == 200
        wu = wu_resp.json()
        assert wu["l6_segregated"] is True
        assert wu["overall_rating"] is None
        assert wu["financial_exposure_l6"] is None
        assert len(wu["impacted_bom_nodes"]) >= 3
        for node in wu["impacted_bom_nodes"]:
            assert node["unit_cost_eur_l6"] is None


# ============================================================================
# TEST-S8-07: Brand Where-Used Impact Analysis & Bidirectional Vendor Auto-Link
# ============================================================================


def test_s8_07_brand_where_used_analysis_and_bidirectional_vendor_autolink():
    """TEST-S8-07: Verify Brand Where-Used across PIM, PLM, L1/L2/L3 BOM, Tannery Batches & L6 Financial Exposure + Auto-Link."""
    wu_resp = client.get("/api/v1/vendors/VND-CONC-001/where-used?viewer_role=brand")
    assert wu_resp.status_code == 200
    wu = wu_resp.json()

    assert wu["l6_segregated"] is False
    assert wu["overall_rating"] == 94.7
    summary = wu["impact_summary"]
    assert summary["pim_models_count"] == 2
    assert summary["plm_variants_count"] == 3
    assert summary["bom_nodes_count"] == 3
    assert summary["tannery_batches_count"] == 1
    assert summary["active_production_orders_count"] >= 1
    assert summary["supply_chain_criticality"] == "HIGH"

    fin = wu["financial_exposure_l6"]
    assert fin is not None
    assert fin["avg_bom_cost_contribution_per_pair_eur"] > 0
    assert fin["tannery_stock_value_eur"] > 0
    assert fin["estimated_seasonal_exposure_eur"] > fin["tannery_stock_value_eur"]
    assert fin["payment_terms"] == "RIBA 60gg DFFM"
    assert all(n["unit_cost_eur_l6"] is not None and n["unit_cost_eur_l6"] > 0 for n in wu["impacted_bom_nodes"])

    # Verify L1/L2/L3 BOM depth coverage on VND-SUOL-003 (used at L1, L2, and L3 in PLM-DUCA-NERO)
    wu_sole = client.get("/api/v1/vendors/VND-SUOL-003/where-used?viewer_role=brand").json()
    assert {n["level"] for n in wu_sole["impacted_bom_nodes"]} == {1, 2, 3}

    # Verify Bidirectional Auto-Link on TanneryBatch (vendor_id -> auto-populates tannery_name)
    tb_auto = client.post(
        "/api/v1/tannery-batches",
        json={
            "company_id": "comp-pmi-montebello",
            "batch_code": "LOT-AUTOLINK-S8-01",
            "tannery_name": "",
            "vendor_id": "VND-CONC-002",
            "master_color_id": "MCOL-TAN-002",
            "available_qty_sqft": 1200.0,
        },
    )
    assert tb_auto.status_code == 201
    assert tb_auto.json()["tannery_name"] == "Conceria Sciarada S.r.l."
    assert tb_auto.json()["vendor_id"] == "VND-CONC-002"

    # Verify Bidirectional Auto-Link on BomItem (supplier_name -> auto-resolves vendor_id)
    bom_auto = client.post(
        "/api/v1/pim-items/PIM-DUCA-001/plm-variants/PLM-DUCA-CUOIO/bom-items",
        json={
            "bom_item_id": "BOM-S8-AUTOLINK-GALV",
            "level": 2,
            "parent_bom_item_id": "BOM-DUCA2-L1-UPPER",
            "component_type": "hardware",
            "material_name": "Fibbia Laterale Ottone",
            "supplier_name": "Galvanica Bruni Accessori Moda S.r.l.",
            "origin_country_iso2": "IT",
            "unit_of_measure": "pair",
            "unit_consumption": 1.0,
            "waste_percentage": 1.0,
            "unit_cost_eur": 5.50,
        },
    )
    assert bom_auto.status_code == 201
    added_node = next(b for b in bom_auto.json()["bom_items"] if b["bom_item_id"] == "BOM-S8-AUTOLINK-GALV")
    assert added_node["vendor_id"] == "VND-GALV-004"
