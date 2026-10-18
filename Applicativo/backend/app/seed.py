"""Seed Initial Made-in-Italy Supply Chain Data for Footlink (1 PIM <-> N PLM, 3-Level BOM, 0 EUR Subcontractors)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from app.database import FootlinkSQLitePersistence, db_manager
from app.models import (
    BomComponentType,
    BomItem,
    PimCommercialItem,
    PlmLifecycleStatus,
    PlmProductionVariant,
    ProductCategory,
    ProductionPhase,
    SubcontractorAssignment,
)


def build_initial_seed_items() -> List[PimCommercialItem]:
    """Construct the canonical Made-in-Italy seed dataset with 1 PIM <-> N PLM and 3-level BOM trees."""
    now_dt = datetime(2026, 10, 18, 8, 30, 0, tzinfo=timezone.utc)

    # =========================================================================
    # 1. PIM COMMERCIAL ITEM #1: Mocassino Artigianale Duca (Calzature)
    #    1 PIM Item <-> 3 PLM Production Variants
    # =========================================================================
    pim_duca = PimCommercialItem(
        pim_item_id="PIM-DUCA-001",
        sku_code="FTL-FW26-LOAFER-01",
        model_name="Mocassino Artigianale Duca",
        brand_tenant_id="TENANT-CALZATURIFICIO-ROSSI",
        season="FW26",
        category=ProductCategory.FOOTWEAR,
        commercial_description_it=(
            "Mocassino classico cucito Blake in vitello pieno fiore e camoscio certificato LWG Gold, "
            "lavorato nei distretti di Fermo-Macerata, Santa Croce sull'Arno e Riviera del Brenta."
        ),
        commercial_description_en=(
            "Blake-stitched artisanal loafer in LWG Gold certified full-grain calfskin and suede, "
            "crafted across Fermo-Macerata, Santa Croce sull'Arno, and Riviera del Brenta districts."
        ),
        retail_channels=["B2B Showroom Milano", "E-Commerce Flagship", "Boutique Wholesale"],
        created_at=now_dt,
        plm_variants=[
            # Variant 1A: Vitello Nero Spazzolato (Distretto Fermo-Macerata + Santa Croce)
            PlmProductionVariant(
                plm_variant_id="PLM-DUCA-NERO",
                pim_item_id="PIM-DUCA-001",
                variant_code="FTL-LOAFER-01-VIT-NERO",
                colorway_name="Vitello Nero Spazzolato",
                size_range="38-46",
                last_or_pattern_code="FORMA-FM-108",
                lifecycle_status=PlmLifecycleStatus.IN_PRODUCTION,
                created_at=now_dt,
                bom_items=[
                    # Level 1 -> Level 2 -> Level 3 (Upper assembly branch)
                    BomItem(
                        bom_item_id="BOM-DUCA-L1-UPPER",
                        level=1,
                        parent_bom_item_id=None,
                        component_type=BomComponentType.UPPER,
                        material_name="Tomaia Accoppiata Vitello Pieno Fiore Nero",
                        supplier_name="Conceria Santa Croce SpA",
                        origin_country_iso2="IT",
                        unit_of_measure="sqft",
                        unit_consumption=3.15,
                        waste_percentage=7.5,
                        recycled_content_pct=20.0,
                        certifications=["LWG Gold", "REACH", "ISO 14001"],
                    ),
                    BomItem(
                        bom_item_id="BOM-DUCA-L2-LINING",
                        level=2,
                        parent_bom_item_id="BOM-DUCA-L1-UPPER",
                        component_type=BomComponentType.LINING,
                        material_name="Fodera Capra Concia Vegetale",
                        supplier_name="Conceria Valdarno Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="sqft",
                        unit_consumption=2.40,
                        waste_percentage=6.0,
                        recycled_content_pct=35.0,
                        certifications=["LWG Gold", "Pelle Conciata al Vegetale"],
                    ),
                    BomItem(
                        bom_item_id="BOM-DUCA-L3-THREAD",
                        level=3,
                        parent_bom_item_id="BOM-DUCA-L2-LINING",
                        component_type=BomComponentType.SUB_ASSEMBLY,
                        material_name="Filato Cucitura Rinforzato rPET Titolo 20",
                        supplier_name="Filature Lombarde Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="m",
                        unit_consumption=18.5,
                        waste_percentage=2.0,
                        recycled_content_pct=100.0,
                        certifications=["GRS", "OEKO-TEX Standard 100"],
                    ),
                    # Level 1 -> Level 2 -> Level 3 (Sole assembly branch)
                    BomItem(
                        bom_item_id="BOM-DUCA-L1-SOLE",
                        level=1,
                        parent_bom_item_id=None,
                        component_type=BomComponentType.OUTSOLE,
                        material_name="Suola Cuoio Toscano Cucita Blake",
                        supplier_name="Suolificio Adriatico Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="pair",
                        unit_consumption=1.0,
                        waste_percentage=3.0,
                        recycled_content_pct=30.0,
                        certifications=["LWG Silver", "REACH"],
                    ),
                    BomItem(
                        bom_item_id="BOM-DUCA-L2-HEEL",
                        level=2,
                        parent_bom_item_id="BOM-DUCA-L1-SOLE",
                        component_type=BomComponentType.HEEL,
                        material_name="Tacco Stratificato Cuoio e Gomma Naturale",
                        supplier_name="Tacchificio Marche Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="pair",
                        unit_consumption=1.0,
                        waste_percentage=2.5,
                        recycled_content_pct=45.0,
                        certifications=["REACH", "FSC Mix"],
                    ),
                    BomItem(
                        bom_item_id="BOM-DUCA-L3-COMPOUND",
                        level=3,
                        parent_bom_item_id="BOM-DUCA-L2-HEEL",
                        component_type=BomComponentType.SUB_ASSEMBLY,
                        material_name="Mescola Battistrada Gomma Vergine & Riciclata",
                        supplier_name="GommaTech Civitanova Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="kg",
                        unit_consumption=0.18,
                        waste_percentage=1.5,
                        recycled_content_pct=65.0,
                        certifications=["GRS", "REACH"],
                    ),
                ],
                subcontractor_assignments=[
                    SubcontractorAssignment(
                        assignment_id="SUB-DUCA-01",
                        subcontractor_name="Conceria Santa Croce SpA",
                        district="Santa Croce sull'Arno",
                        phase=ProductionPhase.TANNING_MATERIAL,
                        material_lot_code="LOT-CSC-2026-104A",
                        completed=True,
                        confirmed_at=now_dt,
                    ),
                    SubcontractorAssignment(
                        assignment_id="SUB-DUCA-02",
                        subcontractor_name="Tomaificio Fratelli Bianchi",
                        district="Fermo-Macerata",
                        phase=ProductionPhase.STITCHING_UPPER,
                        material_lot_code="LOT-TFB-2026-219B",
                        completed=True,
                        confirmed_at=now_dt,
                    ),
                    SubcontractorAssignment(
                        assignment_id="SUB-DUCA-03",
                        subcontractor_name="Montaggio Artigiano Montegranaro",
                        district="Fermo-Macerata",
                        phase=ProductionPhase.LASTING_ASSEMBLY,
                        material_lot_code="LOT-MAM-2026-330C",
                        completed=False,
                        confirmed_at=None,
                    ),
                ],
            ),
            # Variant 1B: Camoscio Cuoio Idrorepellente (Distretto Riviera del Brenta)
            PlmProductionVariant(
                plm_variant_id="PLM-DUCA-CUOIO",
                pim_item_id="PIM-DUCA-001",
                variant_code="FTL-LOAFER-01-CAM-CUOIO",
                colorway_name="Camoscio Cuoio Idrorepellente",
                size_range="38-46",
                last_or_pattern_code="FORMA-FM-108",
                lifecycle_status=PlmLifecycleStatus.INDUSTRIALIZED,
                created_at=now_dt,
                bom_items=[
                    BomItem(
                        bom_item_id="BOM-DUCA2-L1-UPPER",
                        level=1,
                        parent_bom_item_id=None,
                        component_type=BomComponentType.UPPER,
                        material_name="Tomaia Camoscio Idrorepellente Cuoio Toscano",
                        supplier_name="Conceria Veneto Pelle Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="sqft",
                        unit_consumption=3.25,
                        waste_percentage=8.0,
                        recycled_content_pct=25.0,
                        certifications=["LWG Gold", "REACH"],
                    ),
                    BomItem(
                        bom_item_id="BOM-DUCA2-L2-INSOLE",
                        level=2,
                        parent_bom_item_id="BOM-DUCA2-L1-UPPER",
                        component_type=BomComponentType.INSOLE,
                        material_name="Sottopiede Anatomico Lattice e Cuoio Rigenerato",
                        supplier_name="Suolificio Brenta Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="pair",
                        unit_consumption=1.0,
                        waste_percentage=3.0,
                        recycled_content_pct=50.0,
                        certifications=["GRS", "REACH"],
                    ),
                    BomItem(
                        bom_item_id="BOM-DUCA2-L3-SHANK",
                        level=3,
                        parent_bom_item_id="BOM-DUCA2-L2-INSOLE",
                        component_type=BomComponentType.HARDWARE,
                        material_name="Cambrione Acciaio Temperato 85% Riciclato",
                        supplier_name="Minuterie Metalliche Padova",
                        origin_country_iso2="IT",
                        unit_of_measure="pair",
                        unit_consumption=1.0,
                        waste_percentage=1.0,
                        recycled_content_pct=85.0,
                        certifications=["GRS", "ISO 14001"],
                    ),
                ],
                subcontractor_assignments=[
                    SubcontractorAssignment(
                        assignment_id="SUB-DUCA-04",
                        subcontractor_name="Tranceria Riviera Srl",
                        district="Riviera del Brenta",
                        phase=ProductionPhase.CUTTING,
                        material_lot_code="LOT-TRV-2026-412A",
                        completed=True,
                        confirmed_at=now_dt,
                    ),
                    SubcontractorAssignment(
                        assignment_id="SUB-DUCA-05",
                        subcontractor_name="Finissaggio Artigiano Stra",
                        district="Riviera del Brenta",
                        phase=ProductionPhase.FINISHING,
                        material_lot_code="LOT-FAS-2026-518D",
                        completed=False,
                        confirmed_at=None,
                    ),
                ],
            ),
            # Variant 1C: Crust Bordeaux Anticato (Distretto Fermo-Macerata)
            PlmProductionVariant(
                plm_variant_id="PLM-DUCA-BORDEAUX",
                pim_item_id="PIM-DUCA-001",
                variant_code="FTL-LOAFER-01-CRUST-BORD",
                colorway_name="Crust Bordeaux Anticato Mano Cera",
                size_range="36-41",
                last_or_pattern_code="FORMA-FM-108W",
                lifecycle_status=PlmLifecycleStatus.SAMPLE,
                created_at=now_dt,
                bom_items=[
                    BomItem(
                        bom_item_id="BOM-DUCA3-L1-UPPER",
                        level=1,
                        parent_bom_item_id=None,
                        component_type=BomComponentType.UPPER,
                        material_name="Tomaia Crust Anticato Bordeaux",
                        supplier_name="Conceria Chienti Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="sqft",
                        unit_consumption=2.95,
                        waste_percentage=7.0,
                        recycled_content_pct=20.0,
                        certifications=["LWG Gold", "REACH"],
                    ),
                    BomItem(
                        bom_item_id="BOM-DUCA3-L2-CLAMP",
                        level=2,
                        parent_bom_item_id="BOM-DUCA3-L1-UPPER",
                        component_type=BomComponentType.HARDWARE,
                        material_name="Morsetto Frontale Ottone Nickel-Free",
                        supplier_name="Accessori Moda Civitanova",
                        origin_country_iso2="IT",
                        unit_of_measure="pair",
                        unit_consumption=1.0,
                        waste_percentage=1.0,
                        recycled_content_pct=60.0,
                        certifications=["REACH", "OEKO-TEX"],
                    ),
                    BomItem(
                        bom_item_id="BOM-DUCA3-L3-GALV",
                        level=3,
                        parent_bom_item_id="BOM-DUCA3-L2-CLAMP",
                        component_type=BomComponentType.SUB_ASSEMBLY,
                        material_name="Bagno Galvanico Eco-Gold Senza Cianuro",
                        supplier_name="Galvanica EcoMarche Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="pcs",
                        unit_consumption=2.0,
                        waste_percentage=0.5,
                        recycled_content_pct=50.0,
                        certifications=["ISO 14001", "REACH"],
                    ),
                ],
                subcontractor_assignments=[
                    SubcontractorAssignment(
                        assignment_id="SUB-DUCA-06",
                        subcontractor_name="Controllo Qualità Calzaturiero Marche",
                        district="Fermo-Macerata",
                        phase=ProductionPhase.QUALITY_CONTROL,
                        material_lot_code="LOT-CQM-2026-601E",
                        completed=True,
                        confirmed_at=now_dt,
                    ),
                ],
            ),
        ],
    )

    # =========================================================================
    # 2. PIM COMMERCIAL ITEM #2: Borsa Shopping Vela (Pelletteria)
    #    1 PIM Item <-> 2 PLM Production Variants
    # =========================================================================
    pim_vela = PimCommercialItem(
        pim_item_id="PIM-VELA-002",
        sku_code="FTL-FW26-TOTE-02",
        model_name="Borsa Shopping Vela",
        brand_tenant_id="TENANT-MAISON-FIRENZE",
        season="FW26",
        category=ProductCategory.LEATHER_GOODS,
        commercial_description_it=(
            "Shopping bag strutturata in vacchetta toscana conciata al vegetale e grana dollaro, "
            "prodotta tra Scandicci, Santa Croce sull'Arno e Tolentino con tracciabilità DPP UE."
        ),
        commercial_description_en=(
            "Structured tote bag in vegetable-tanned Tuscan vachetta and grained calfskin, "
            "crafted across Scandicci, Santa Croce sull'Arno, and Tolentino with full EU DPP traceability."
        ),
        retail_channels=["Boutique Diretta", "E-Commerce Global", "Department Stores EU"],
        created_at=now_dt,
        plm_variants=[
            # Variant 2A: Vacchetta Cognac Naturale (Scandicci + Santa Croce)
            PlmProductionVariant(
                plm_variant_id="PLM-VELA-COGNAC",
                pim_item_id="PIM-VELA-002",
                variant_code="FTL-TOTE-02-VAC-COGNAC",
                colorway_name="Vacchetta Cognac Naturale",
                size_range="OS",
                last_or_pattern_code="MOD-SCANDICCI-44",
                lifecycle_status=PlmLifecycleStatus.IN_PRODUCTION,
                created_at=now_dt,
                bom_items=[
                    BomItem(
                        bom_item_id="BOM-VELA-L1-BODY",
                        level=1,
                        parent_bom_item_id=None,
                        component_type=BomComponentType.UPPER,
                        material_name="Quadranti Vacchetta Conciata al Vegetale",
                        supplier_name="Consorzio Vera Pelle Santa Croce",
                        origin_country_iso2="IT",
                        unit_of_measure="sqft",
                        unit_consumption=6.80,
                        waste_percentage=9.0,
                        recycled_content_pct=30.0,
                        certifications=["LWG Gold", "Pelle Conciata al Vegetale", "REACH"],
                    ),
                    BomItem(
                        bom_item_id="BOM-VELA-L2-HANDLE",
                        level=2,
                        parent_bom_item_id="BOM-VELA-L1-BODY",
                        component_type=BomComponentType.SUB_ASSEMBLY,
                        material_name="Manici Tubolari Cuciti a Mano",
                        supplier_name="Pelletteria Artigiana Scandicci",
                        origin_country_iso2="IT",
                        unit_of_measure="pair",
                        unit_consumption=1.0,
                        waste_percentage=4.0,
                        recycled_content_pct=40.0,
                        certifications=["LWG Gold", "REACH"],
                    ),
                    BomItem(
                        bom_item_id="BOM-VELA-L3-ROPE",
                        level=3,
                        parent_bom_item_id="BOM-VELA-L2-HANDLE",
                        component_type=BomComponentType.FABRIC,
                        material_name="Anima Interna Corda Canapa Rigenerata",
                        supplier_name="Tessitura Pratese Circolare Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="m",
                        unit_consumption=1.40,
                        waste_percentage=1.5,
                        recycled_content_pct=95.0,
                        certifications=["GRS", "OEKO-TEX Standard 100"],
                    ),
                ],
                subcontractor_assignments=[
                    SubcontractorAssignment(
                        assignment_id="SUB-VELA-01",
                        subcontractor_name="Conceria San Miniato Srl",
                        district="Santa Croce sull'Arno",
                        phase=ProductionPhase.TANNING_MATERIAL,
                        material_lot_code="LOT-CSM-2026-771A",
                        completed=True,
                        confirmed_at=now_dt,
                    ),
                    SubcontractorAssignment(
                        assignment_id="SUB-VELA-02",
                        subcontractor_name="Pelletteria Artigiana Scandicci",
                        district="Scandicci-Firenze",
                        phase=ProductionPhase.STITCHING_UPPER,
                        material_lot_code="LOT-PAS-2026-882B",
                        completed=False,
                        confirmed_at=None,
                    ),
                ],
            ),
            # Variant 2B: Vitello Grana Dollaro Verde Oliva (Tolentino)
            PlmProductionVariant(
                plm_variant_id="PLM-VELA-OLIVA",
                pim_item_id="PIM-VELA-002",
                variant_code="FTL-TOTE-02-GRANA-OLIVA",
                colorway_name="Vitello Grana Dollaro Verde Oliva",
                size_range="OS",
                last_or_pattern_code="MOD-SCANDICCI-44",
                lifecycle_status=PlmLifecycleStatus.INDUSTRIALIZED,
                created_at=now_dt,
                bom_items=[
                    BomItem(
                        bom_item_id="BOM-VELA2-L1-BODY",
                        level=1,
                        parent_bom_item_id=None,
                        component_type=BomComponentType.UPPER,
                        material_name="Quadranti Vitello Grana Dollaro Oliva",
                        supplier_name="Conceria Tolentino SpA",
                        origin_country_iso2="IT",
                        unit_of_measure="sqft",
                        unit_consumption=6.60,
                        waste_percentage=8.5,
                        recycled_content_pct=25.0,
                        certifications=["LWG Gold", "REACH"],
                    ),
                    BomItem(
                        bom_item_id="BOM-VELA2-L2-ZIP",
                        level=2,
                        parent_bom_item_id="BOM-VELA2-L1-BODY",
                        component_type=BomComponentType.HARDWARE,
                        material_name="Chiusura Zip Metallica Ottone Spazzolato",
                        supplier_name="Minuterie Metalliche Firenze",
                        origin_country_iso2="IT",
                        unit_of_measure="pcs",
                        unit_consumption=1.0,
                        waste_percentage=1.0,
                        recycled_content_pct=55.0,
                        certifications=["REACH"],
                    ),
                    BomItem(
                        bom_item_id="BOM-VELA2-L3-TAPE",
                        level=3,
                        parent_bom_item_id="BOM-VELA2-L2-ZIP",
                        component_type=BomComponentType.FABRIC,
                        material_name="Nastro Supporto Zip 100% Poliestere Riciclato",
                        supplier_name="Nastri Eco Bergamo Srl",
                        origin_country_iso2="IT",
                        unit_of_measure="m",
                        unit_consumption=0.55,
                        waste_percentage=1.0,
                        recycled_content_pct=100.0,
                        certifications=["GRS", "OEKO-TEX Standard 100"],
                    ),
                ],
                subcontractor_assignments=[
                    SubcontractorAssignment(
                        assignment_id="SUB-VELA-03",
                        subcontractor_name="Laboratorio Pelletteria Tolentino",
                        district="Tolentino-Macerata",
                        phase=ProductionPhase.LASTING_ASSEMBLY,
                        material_lot_code="LOT-LPT-2026-910C",
                        completed=True,
                        confirmed_at=now_dt,
                    ),
                ],
            ),
        ],
    )

    return [pim_duca, pim_vela]


def seed_initial_data(db: FootlinkSQLitePersistence = db_manager, force: bool = False) -> List[PimCommercialItem]:
    """Populate the SQLite/PostgreSQL database with initial Made-in-Italy seed data if empty (or when force=True)."""
    if force:
        db.clear_all()
    if db.count_pim_items() == 0:
        for item in build_initial_seed_items():
            db.save_pim_item(item)
    return db.list_pim_items()


if __name__ == "__main__":
    seeded = seed_initial_data(db_manager, force=True)
    print(f"Seeded {len(seeded)} PIM Commercial Items into {db_manager.sqlite_path}")
