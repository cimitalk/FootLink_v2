"""Seed Initial Made-in-Italy Supply Chain Data for Footlink:
- 1 PIM <-> N PLM across Footwear, Leather Goods, and Apparel
- 3-Level Hierarchical BOM with L6 Brand Costing & Lot Certificates
- Vertical Category Tech Specs & Size Grading Rules
- 0 EUR District Subcontractor Assignments
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from app.database import FootlinkSQLitePersistence, db_manager
from app.models import (
    AttributeFieldType,
    AttributeTargetEntity,
    BomComponentType,
    BomItem,
    CollectionCreate,
    CollectionStatus,
    CompanyBusinessType,
    CompanyCreate,
    CompanyMembershipCreate,
    CompanyTier,
    DistrictUserRole,
    DomainRegistryEntryCreate,
    OrderSizeBreakdownItem,
    PimCommercialItem,
    PlmLifecycleStatus,
    PlmProductionVariant,
    ProductCategory,
    ProductionOrderCreate,
    ProductionOrderStatus,
    ProductionPhase,
    RegistryDomain,
    SchemaAttributeDefinitionCreate,
    SeasonCreate,
    SeasonStatus,
    SubcontractorAssignment,
    TanneryBatchCreate,
    TanneryDocumentCreate,
    TanneryDocumentType,
    TanneryProcess,
    UserCreate,
)


def build_initial_seed_items() -> List[PimCommercialItem]:
    """Construct the canonical Made-in-Italy seed dataset across Footwear, Leather Goods, and Apparel."""
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
        season="P/E 2026",
        season_id="SEASON-PE26",
        collection_id="COLL-SEASON-PE26-MAIN26",
        collection_name="Main Collection",
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
        wholesale_price_eur=165.0,
        retail_price_eur=450.0,
        hs_customs_code="6403.59.95",
        gtin_ean="8050012026101",
        publishing_status="PUBLISHED",
        care_instructions="Spazzolare delicatamente dopo l'uso, applicare crema naturale certificata e inserire tendiscarpe in legno di cedro. Costruzione Blake risuolabile.",
        end_of_life_guide="Restituzione gratuita tramite programma Take-Back Footlink per separazione tomaia in vitello, cambrione in acciaio e suola in cuoio.",
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
                bom_version="v2.1 (Locked)",
                bom_snapshot_locked=True,
                sample_base_size="42",
                size_grading_step_pct=2.8,
                standard_labor_cost_eur=31.50,
                category_specific_specs={
                    "last_code": "FORMA-FM-108",
                    "last_fitting": "F (Regular Tailored)",
                    "size_scale_system": "EU_38_46",
                    "sample_base_size": "42",
                    "construction_method": "BLAKE_RAPID",
                    "upper_primary_material": "Vitello Pieno Fiore Spazzolato 1.4-1.6mm",
                    "upper_cutting_method": "TAGLIO_CAD_LAMA",
                    "lining_material": "Capra Concia Vegetale Metal-Free",
                    "insole_texon_spec": "Cuoio Rigenerato 3.5mm + Cambrione Acciaio",
                    "outsole_code_mold": "SUOLA-CUOIO-TOSC-45",
                    "outsole_material": "LEATHER",
                    "heel_code_height_mm": "TAC-22MM Cuoio Stratificato",
                },
                created_at=now_dt,
                bom_items=[
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
                        unit_cost_eur=7.80,
                        lot_certificate_id="CERT-LWG-CSC-8810",
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
                        unit_cost_eur=4.20,
                        lot_certificate_id="CERT-VEG-VLD-4412",
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
                        unit_cost_eur=0.12,
                        lot_certificate_id="CERT-GRS-FLM-1902",
                    ),
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
                        unit_cost_eur=14.50,
                        lot_certificate_id="CERT-LWG-SAD-3109",
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
                        unit_cost_eur=5.40,
                        lot_certificate_id="CERT-FSC-TCM-7701",
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
                        unit_cost_eur=6.00,
                        lot_certificate_id="CERT-GRS-GTC-5504",
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
                bom_version="v2.0 (Locked)",
                bom_snapshot_locked=True,
                sample_base_size="42",
                size_grading_step_pct=2.8,
                standard_labor_cost_eur=29.00,
                category_specific_specs={
                    "last_code": "FORMA-FM-108",
                    "last_fitting": "F (Regular Tailored)",
                    "size_scale_system": "EU_38_46",
                    "sample_base_size": "42",
                    "construction_method": "BLAKE",
                    "upper_primary_material": "Camoscio Idrorepellente Concia Mista",
                    "upper_cutting_method": "TRANCIA_FUSTELLA",
                    "lining_material": "Vitello Naturale Non Tinto",
                    "insole_texon_spec": "Lattice Anatomico + Cuoio Rigenerato",
                    "outsole_code_mold": "SUOLA-BRENTA-LIGHT",
                    "outsole_material": "LEATHER",
                    "heel_code_height_mm": "TAC-20MM Cuoio Naturale",
                },
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
                        unit_cost_eur=7.20,
                        lot_certificate_id="CERT-LWG-CVP-2201",
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
                        unit_cost_eur=6.80,
                        lot_certificate_id="CERT-GRS-SBR-6120",
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
                        unit_cost_eur=1.90,
                        lot_certificate_id="CERT-GRS-MMP-9012",
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
                bom_version="v1.2 (Sample Draft)",
                bom_snapshot_locked=False,
                sample_base_size="37",
                size_grading_step_pct=2.5,
                standard_labor_cost_eur=33.00,
                category_specific_specs={
                    "last_code": "FORMA-FM-108W",
                    "last_fitting": "E (Woman Tailored)",
                    "size_scale_system": "EU_36_41",
                    "sample_base_size": "37",
                    "construction_method": "GOODYEAR",
                    "upper_primary_material": "Vitello Crust Anticato a Mano",
                    "upper_cutting_method": "MANO",
                    "lining_material": "Capra Concia Vegetale",
                    "insole_texon_spec": "Cuoio Scolpito per Guardolo Goodyear",
                    "outsole_code_mold": "SUOLA-GOODYEAR-W37",
                    "outsole_material": "LEATHER",
                    "heel_code_height_mm": "TAC-25MM Cuoio Fasciato",
                },
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
                        unit_cost_eur=8.10,
                        lot_certificate_id="CERT-LWG-CCH-3318",
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
                        unit_cost_eur=6.50,
                        lot_certificate_id="CERT-RCH-AMC-7021",
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
                        unit_cost_eur=1.80,
                        lot_certificate_id="CERT-ISO-GEM-1180",
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
        season="P/E 2026",
        season_id="SEASON-PE26",
        collection_id="COLL-SEASON-PE26-FASH26",
        collection_name="Fashion Runway",
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
        wholesale_price_eur=240.0,
        retail_price_eur=680.0,
        hs_customs_code="4202.21.00",
        gtin_ean="8050012026202",
        publishing_status="PUBLISHED",
        care_instructions="Proteggere da pioggia intensa, nutrire con balsamo neutro per vacchetta vegetale e riporre nella dustbag in cotone GOTS.",
        end_of_life_guide="Servizio di rigenerazione costola/galvanica e ritiro garantito a fine vita presso Maison Firenze per recupero pellame e ottone.",
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
                bom_version="v2.0 (Locked)",
                bom_snapshot_locked=True,
                sample_base_size="OS (36x28x15 cm)",
                size_grading_step_pct=0.0,
                standard_labor_cost_eur=42.00,
                category_specific_specs={
                    "pattern_cad_code": "MOD-SCANDICCI-44-DXF",
                    "bag_dimensions_lwh_cm": "36 × 28 × 15 cm (Drop manico 24 cm)",
                    "leather_type_tanning": "VEGETABLE_TANNED (Consorzio Vera Pelle)",
                    "splitting_thickness_mm": "Spacco in testa 1.6mm / Scarnitura bordi 0.7mm",
                    "interlining_reinforcement": "Salpa Rigenerata Termoadesiva 0.9mm",
                    "hardware_galvanic_finish": "Ottone Spazzolato Nickel-Free 0.5 micron",
                    "closure_zip_spec": "Ponte magnetico invisibile + tasca zip passo 5",
                    "edge_finishing_type": "TINGIBORDO_A_MANO_3_MANI (Vernice ad acqua)",
                    "stitching_thread_step": "Filo Lino/rPET Tit. 20, passo 3.5 punti/cm",
                },
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
                        unit_cost_eur=8.40,
                        lot_certificate_id="CERT-VPT-SC-9901",
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
                        unit_cost_eur=16.50,
                        lot_certificate_id="CERT-PAS-FI-8820",
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
                        unit_cost_eur=2.10,
                        lot_certificate_id="CERT-GRS-TPC-4410",
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
                bom_version="v2.0 (Locked)",
                bom_snapshot_locked=True,
                sample_base_size="OS (36x28x15 cm)",
                size_grading_step_pct=0.0,
                standard_labor_cost_eur=39.50,
                category_specific_specs={
                    "pattern_cad_code": "MOD-SCANDICCI-44-DXF",
                    "bag_dimensions_lwh_cm": "36 × 28 × 15 cm (Drop manico 24 cm)",
                    "leather_type_tanning": "CHROME_FREE (LWG Gold Certified)",
                    "splitting_thickness_mm": "Spacco 1.4mm / Scarnitura 0.6mm",
                    "interlining_reinforcement": "Microfibra Rinforzata GRS 0.8mm",
                    "hardware_galvanic_finish": "Palladio Spazzolato Nickel-Free",
                    "closure_zip_spec": "Zip Metallica Passo 5 Ottone Riciclato",
                    "edge_finishing_type": "RIMBOCCATO",
                    "stitching_thread_step": "Filo Poliestere GRS Tit. 25, passo 4 punti/cm",
                },
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
                        unit_cost_eur=7.90,
                        lot_certificate_id="CERT-LWG-CTO-5501",
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
                        unit_cost_eur=9.20,
                        lot_certificate_id="CERT-RCH-MMF-3012",
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
                        unit_cost_eur=1.40,
                        lot_certificate_id="CERT-GRS-NEB-7741",
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


def seed_seasons_and_collections(db: FootlinkSQLitePersistence) -> None:
    """Seed Fashion Seasons and Collections (Sprint 5: 1 Season -> N Collections)."""
    pe26 = SeasonCreate(
        code="P/E 2026",
        name="Primavera Estate 2026",
        year=2026,
        status=SeasonStatus.ACTIVE,
        start_date="2026-03-01",
        end_date="2026-08-31",
        description="Stagione Primavera/Estate 2026: focus su traspirabilità, suole biodegradabili e pellami LWG Gold.",
        initial_collections=[
            CollectionCreate(
                code="MAIN-26",
                name="Main Collection",
                target_market="Global Luxury",
                status=CollectionStatus.APPROVED,
                description="Linea continuativa core presentata alle fashion week di Milano e Parigi.",
            ),
            CollectionCreate(
                code="FASH-26",
                name="Fashion Runway",
                target_market="B2B Showroom",
                status=CollectionStatus.APPROVED,
                description="Modelli di tendenza per showroom d'avanguardia e department store di fascia alta.",
            ),
            CollectionCreate(
                code="CAPS-26",
                name="Limited Edition / Capsule",
                target_market="Exclusive Direct",
                status=CollectionStatus.DRAFT,
                description="Drop esclusivo in tiratura limitata con packaging 100% compostabile.",
            ),
        ],
    )
    db.save_season(pe26, season_id="SEASON-PE26")

    ai26 = SeasonCreate(
        code="A/I 2026-2027",
        name="Autunno Inverno 2026/27",
        year=2026,
        status=SeasonStatus.PLANNING,
        start_date="2026-09-01",
        end_date="2027-02-28",
        description="Stagione Autunno/Inverno 2026-2027: concia al vegetale toscana, fondi carrarmato e lane certificate.",
        initial_collections=[
            CollectionCreate(
                code="MAIN-27",
                name="Main Collection",
                target_market="Global Luxury",
                status=CollectionStatus.DRAFT,
                description="Linea autunnale con stivaletti e calzature foderate in shearling certificato.",
            ),
            CollectionCreate(
                code="CARR-27",
                name="Carry Over Icons",
                target_market="Omnichannel",
                status=CollectionStatus.DRAFT,
                description="Modelli iconici carry-over a produzione continuativa tutto l'anno.",
            ),
        ],
    )
    db.save_season(ai26, season_id="SEASON-AI26")


def seed_domain_registries(db: FootlinkSQLitePersistence) -> None:
    """Seed master data registries for PIM & PLM (Sprint 5)."""
    registries = [
        # PIM Registries
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="categories",
            entry_code="footwear",
            label_it="Calzature (Footwear)",
            label_en="Footwear",
            metadata={"default_hs_code": "6403.59.95", "icon": "👞"},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="categories",
            entry_code="leather_goods",
            label_it="Pelletteria (Leather Goods)",
            label_en="Leather Goods",
            metadata={"default_hs_code": "4202.21.00", "icon": "👜"},
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="categories",
            entry_code="apparel",
            label_it="Abbigliamento (Apparel)",
            label_en="Apparel",
            metadata={"default_hs_code": "6201.20.00", "icon": "🧥"},
            sort_order=3,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="retail_channels",
            entry_code="showroom",
            label_it="B2B Showroom Milano",
            label_en="B2B Showroom",
            metadata={"priority": "high", "commission_pct": 8.0},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="retail_channels",
            entry_code="ecommerce",
            label_it="E-Commerce Flagship",
            label_en="Direct E-Commerce",
            metadata={"priority": "direct", "commission_pct": 0.0},
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="retail_channels",
            entry_code="wholesale",
            label_it="Boutique Wholesale EU",
            label_en="Wholesale Boutiques EU",
            metadata={"priority": "partner", "commission_pct": 12.0},
            sort_order=3,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="certifications",
            entry_code="lwg_gold",
            label_it="Leather Working Group Gold",
            label_en="LWG Gold Standard",
            metadata={"auditor": "LWG", "category": "Leather"},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="certifications",
            entry_code="reach",
            label_it="Conforme Regolamento REACH UE",
            label_en="EU REACH Compliant",
            metadata={"regulation": "EC 1907/2006", "mandatory_eu": True},
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="certifications",
            entry_code="grs",
            label_it="Global Recycled Standard (GRS)",
            label_en="GRS Recycled Content",
            metadata={"min_recycled_pct": 20},
            sort_order=3,
        ),
        # PLM Registries
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="production_phases",
            entry_code="tanning_material",
            label_it="Concia & Selezione Materie Prime",
            label_en="Tanning & Material Selection",
            metadata={"department": "Tannery", "lead_time_days": 14},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="production_phases",
            entry_code="cutting",
            label_it="Taglio CAD & Tranciatura",
            label_en="CAD Cutting & Clicking",
            metadata={"department": "Cutting Room", "lead_time_days": 4},
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="production_phases",
            entry_code="stitching_upper",
            label_it="Giunteria & Cucitura Tomaia",
            label_en="Closing & Upper Stitching",
            metadata={"department": "Stitching Room", "lead_time_days": 7},
            sort_order=3,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="production_phases",
            entry_code="lasting_assembly",
            label_it="Montaggio su Forma & Suolatura",
            label_en="Lasting & Bottom Assembly",
            metadata={"department": "Making Room", "lead_time_days": 5},
            sort_order=4,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="production_phases",
            entry_code="finishing",
            label_it="Finissaggio & Stiratura",
            label_en="Finishing & Burnishing",
            metadata={"department": "Finishing Room", "lead_time_days": 3},
            sort_order=5,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="production_phases",
            entry_code="quality_control",
            label_it="Controllo Qualità & Confezionamento",
            label_en="Quality Inspection & Boxing",
            metadata={"department": "QA", "lead_time_days": 2},
            sort_order=6,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="component_types",
            entry_code="upper",
            label_it="Tomaia Principale",
            label_en="Upper Shell",
            metadata={"bom_default_level": 1},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="component_types",
            entry_code="lining",
            label_it="Fodera Interna",
            label_en="Inner Lining",
            metadata={"bom_default_level": 2},
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="component_types",
            entry_code="insole",
            label_it="Sottopiede / Fusetto",
            label_en="Insole / Shank Board",
            metadata={"bom_default_level": 2},
            sort_order=3,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="component_types",
            entry_code="outsole",
            label_it="Suola / Fondo",
            label_en="Outsole",
            metadata={"bom_default_level": 1},
            sort_order=4,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="component_types",
            entry_code="heel",
            label_it="Tacco",
            label_en="Heel",
            metadata={"bom_default_level": 2},
            sort_order=5,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="component_types",
            entry_code="hardware",
            label_it="Minuteria Metallica",
            label_en="Metal Hardware",
            metadata={"bom_default_level": 2},
            sort_order=6,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="suppliers",
            entry_code="conceria_chienti",
            label_it="Conceria del Chienti Srl (Fermo)",
            label_en="Chienti Tannery IT",
            metadata={"district": "Fermo-Macerata", "country": "IT", "rating": "A+"},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="suppliers",
            entry_code="conceria_santa_croce",
            label_it="Conceria Santa Croce SpA (Pisa)",
            label_en="Santa Croce Tannery IT",
            metadata={"district": "Santa Croce sull'Arno", "country": "IT", "rating": "A+"},
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="suppliers",
            entry_code="suolificio_marche",
            label_it="Suolificio Marchigiano (Macerata)",
            label_en="Marchigiano Sole Co IT",
            metadata={"district": "Civitanova Marche", "country": "IT", "rating": "A"},
            sort_order=3,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="subcontractors",
            entry_code="laboratorio_fm01",
            label_it="Laboratorio Giunteria FM-01 (Fermo)",
            label_en="FM-01 Upper Lab",
            metadata={"district": "Fermo", "specialty": "Blake / Goodyear", "license_fee_eur": 0.0},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="subcontractors",
            entry_code="laboratorio_brenta",
            label_it="Laboratorio Montaggio Brenta (VE)",
            label_en="Brenta Lasting Lab",
            metadata={"district": "Riviera del Brenta", "specialty": "Donna Lusso", "license_fee_eur": 0.0},
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="size_scales",
            entry_code="eu_shoes_woman",
            label_it="Calzature Donna EU 35-42",
            label_en="Women Shoes EU 35-42",
            metadata={"min": 35, "max": 42, "step": 1.0, "base": 37},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="size_scales",
            entry_code="eu_shoes_man",
            label_it="Calzature Uomo EU 38-46",
            label_en="Men Shoes EU 38-46",
            metadata={"min": 38, "max": 46, "step": 1.0, "base": 42},
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="units_of_measure",
            entry_code="sqft",
            label_it="Piedi quadri (sqft)",
            label_en="Square feet (sqft)",
            metadata={"type": "area", "conversion_to_m2": 0.0929},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="units_of_measure",
            entry_code="pair",
            label_it="Paia (paia)",
            label_en="Pairs (pair)",
            metadata={"type": "count", "conversion_to_m2": 1.0},
            sort_order=2,
        ),
    ]
    for r in registries:
        db.save_registry_entry(r)


def seed_schema_attribute_definitions(db: FootlinkSQLitePersistence) -> None:
    """Seed configurable schema attribute definitions for the Founder Data Model Studio (Sprint 5)."""
    attrs = [
        # PIM Item attributes
        SchemaAttributeDefinitionCreate(
            target_entity=AttributeTargetEntity.PIM_ITEM,
            field_key="target_gender",
            label_it="Genere Target",
            label_en="Target Gender",
            field_type=AttributeFieldType.SELECT,
            options=["Uomo", "Donna", "Unisex", "Bambino"],
            is_required=False,
            default_value="Unisex",
            group_name="Commerciale & Marketing",
            is_system=True,
            description="Segmentazione commerciale del modello di collezione",
        ),
        SchemaAttributeDefinitionCreate(
            target_entity=AttributeTargetEntity.PIM_ITEM,
            field_key="sustainability_rating",
            label_it="Rating Sostenibilità ESPR",
            label_en="ESPR Sustainability Rating",
            field_type=AttributeFieldType.SELECT,
            options=["A - Eccellenza Circolare", "B - Alto Riciclo", "C - Standard UE ESPR"],
            is_required=False,
            default_value="A - Eccellenza Circolare",
            group_name="Sostenibilità & Normativa",
            is_system=False,
            description="Grado di conformità circolare secondo la direttiva UE ESPR 2024/1781",
        ),
        SchemaAttributeDefinitionCreate(
            target_entity=AttributeTargetEntity.PIM_ITEM,
            field_key="collection_drop_number",
            label_it="Numero Drop Campionario",
            label_en="Sample Drop Number",
            field_type=AttributeFieldType.NUMBER,
            is_required=False,
            default_value=1,
            group_name="Commerciale & Marketing",
            is_system=False,
            description="Sequenza di rilascio all'interno della collezione (Drop 1, 2, 3)",
        ),
        # PLM Variant attributes
        SchemaAttributeDefinitionCreate(
            target_entity=AttributeTargetEntity.PLM_VARIANT,
            field_key="heel_height_mm",
            label_it="Altezza Tacco (mm)",
            label_en="Heel Height (mm)",
            field_type=AttributeFieldType.NUMBER,
            is_required=False,
            default_value=22.0,
            group_name="Specifiche Tecniche Fabbrica",
            is_system=False,
            description="Quota millimetrica dell'altezza del tacco montato sulla forma",
        ),
        SchemaAttributeDefinitionCreate(
            target_entity=AttributeTargetEntity.PLM_VARIANT,
            field_key="leather_finish",
            label_it="Finitura Pellame",
            label_en="Leather Finishing",
            field_type=AttributeFieldType.SELECT,
            options=["Spazzolato a Mano", "Anilina Naturale", "Scamosciato Idrorepellente", "Pieno Fiore Semilucido"],
            is_required=False,
            default_value="Spazzolato a Mano",
            group_name="Specifiche Tecniche Fabbrica",
            is_system=False,
            description="Trattamento estetico e protettivo superficiale applicato sulla tomaia",
        ),
        SchemaAttributeDefinitionCreate(
            target_entity=AttributeTargetEntity.PLM_VARIANT,
            field_key="fitting_width",
            label_it="Calzata Forma",
            label_en="Fitting Width",
            field_type=AttributeFieldType.SELECT,
            options=["Stretta (C)", "Regolare (D/E)", "Comoda (EE)"],
            is_required=False,
            default_value="Regolare (D/E)",
            group_name="Specifiche Tecniche Fabbrica",
            is_system=False,
            description="Larghezza di calzata calcolata sulla pianta della forma",
        ),
        # BOM Item attributes
        SchemaAttributeDefinitionCreate(
            target_entity=AttributeTargetEntity.BOM_ITEM,
            field_key="batch_quality_grade",
            label_it="Grado Selezione Materia Prima",
            label_en="Raw Material Quality Grade",
            field_type=AttributeFieldType.SELECT,
            options=["Scelta I (Top Grade)", "Scelta II (Commerciale)", "Campionario"],
            is_required=False,
            default_value="Scelta I (Top Grade)",
            group_name="Controllo Qualità Fornitura",
            is_system=False,
            description="Classificazione del lotto di pellame o componente ricevuto dal fornitore",
        ),
    ]
    for a in attrs:
        db.save_attribute_definition(a)


def seed_district_companies_and_users(db: FootlinkSQLitePersistence) -> None:
    """Sprint 6: Seed PaaS Distrettuale Companies (3 Tiers), Users & Memberships."""
    companies = [
        CompanyCreate(
            legal_name="Tod's Group SpA",
            business_name="Tod's Luxury Brand",
            vat_number="IT01112220448",
            district="Fermo-Macerata",
            company_tier=CompanyTier.ENTERPRISE,
            business_type=CompanyBusinessType.BRAND,
            contact_email="supplychain@todsgroup.com",
            phone="+39 0734 8661",
            website="https://www.todsgroup.com",
            metadata={"brands": ["Tod's", "Hogan", "Fay", "Roger Vivier"], "audit_score_esg": 96.5},
            is_active=True,
        ),
        CompanyCreate(
            legal_name="Calzaturificio Rossi & Figli Srl",
            business_name="Calzaturificio Rossi",
            vat_number="IT01234567890",
            district="Fermo-Macerata",
            company_tier=CompanyTier.PMI,
            business_type=CompanyBusinessType.MANUFACTURER,
            contact_email="produzione@calzaturificiorossi.it",
            phone="+39 0734 871234",
            website="https://www.calzaturificiorossi.it",
            metadata={"capacity_pairs_day": 400, "certifications": ["ISO 9001", "SA8000"]},
            is_active=True,
        ),
        CompanyCreate(
            legal_name="Conceria Montebello SpA",
            business_name="Conceria Montebello Arzignano",
            vat_number="IT02345678901",
            district="Arzignano / Valle del Chiampo",
            company_tier=CompanyTier.PMI,
            business_type=CompanyBusinessType.TANNERY,
            contact_email="qualita@conceriamontebello.it",
            phone="+39 0444 670123",
            website="https://www.conceriamontebello.it",
            metadata={"lwg_rating": "Gold", "icec_cert": "ICEC-TS410-0982", "tanning_focus": "Metal-Free Bio-Circular"},
            is_active=True,
        ),
        CompanyCreate(
            legal_name="Tomaificio Façon Marche di Rossi Marco",
            business_name="Tomaificio Façon Marche (0 EUR)",
            vat_number="IT03456789012",
            district="Montegranaro",
            company_tier=CompanyTier.SUBCONTRACTOR_ZERO_EUR,
            business_type=CompanyBusinessType.SUBCONTRACTOR_LAB,
            contact_email="facon.marche@gmail.com",
            phone="+39 0734 890111",
            metadata={"operators_count": 8, "specialty": "Giunteria e Orlatura Tomaie Lusso"},
            is_active=True,
        ),
        CompanyCreate(
            legal_name="Laboratorio Adriatica Orlatura Snc",
            business_name="Giunteria Adriatica (0 EUR)",
            vat_number="IT04567890123",
            district="Civitanova Marche",
            company_tier=CompanyTier.SUBCONTRACTOR_ZERO_EUR,
            business_type=CompanyBusinessType.SUBCONTRACTOR_LAB,
            contact_email="adriatica.orlatura@libero.it",
            phone="+39 0733 778899",
            metadata={"operators_count": 6, "specialty": "Taglio CAD e Preparazione Fondi"},
            is_active=True,
        ),
    ]

    comp_ids = ["comp-ent-tods", "comp-pmi-rossi", "comp-pmi-montebello", "comp-lab-tomaificio", "comp-lab-giunteria"]
    for c, cid in zip(companies, comp_ids):
        db.save_company(c, company_id=cid)

    users = [
        UserCreate(email="founder@footlink.it", full_name="Alessandro Ciminari", is_platform_admin=True),
        UserCreate(email="elena.visconti@todsgroup.com", full_name="Elena Visconti", is_platform_admin=False),
        UserCreate(email="marco.rossi@calzaturificiorossi.it", full_name="Marco Rossi", is_platform_admin=False),
        UserCreate(email="giovanni.battaglia@conceriamontebello.it", full_name="Giovanni Battaglia", is_platform_admin=False),
        UserCreate(email="giuseppe.facon@gmail.com", full_name="Giuseppe Façonista", is_platform_admin=False),
    ]
    user_ids = ["usr-founder", "usr-brand-lead", "usr-factory-lead", "usr-tannery-qa", "usr-artisan"]
    for u, uid in zip(users, user_ids):
        db.save_user(u, user_id=uid)

    memberships = [
        CompanyMembershipCreate(company_id="comp-ent-tods", user_id="usr-founder", role=DistrictUserRole.BRAND_ADMIN),
        CompanyMembershipCreate(company_id="comp-ent-tods", user_id="usr-brand-lead", role=DistrictUserRole.BRAND_ADMIN),
        CompanyMembershipCreate(company_id="comp-pmi-rossi", user_id="usr-factory-lead", role=DistrictUserRole.FACTORY_TECH_LEAD),
        CompanyMembershipCreate(company_id="comp-pmi-montebello", user_id="usr-tannery-qa", role=DistrictUserRole.TANNERY_OPERATOR),
        CompanyMembershipCreate(company_id="comp-lab-tomaificio", user_id="usr-artisan", role=DistrictUserRole.SUBCONTRACTOR_OPERATOR),
    ]
    for m in memberships:
        db.save_membership(m)


def seed_tannery_batches_and_documents(db: FootlinkSQLitePersistence) -> None:
    """Sprint 6: Seed Tannery Leather Batches & Document Vault with SHA-256 Hashes."""
    batch = TanneryBatchCreate(
        company_id="comp-pmi-montebello",
        batch_code="LOT-MONTEBELLO-2026-X9",
        tannery_name="Conceria Montebello SpA",
        district="Arzignano / Valle del Chiampo",
        leather_type="Vitello Pieno Fiore Anilina",
        tanning_process=TanneryProcess.METAL_FREE,
        raw_hide_origin_country="IT",
        slaughterhouse_traceability_id="EU-SLAUGHTER-8841-VR",
        eudr_deforestation_free=True,
        lwg_rating="Gold",
        lwg_score_pct=95.2,
        icec_certificate_id="ICEC-TS410-0982",
        reach_svhc_compliant=True,
        chrome_vi_content_ppm=0.0,
        thickness_mm="1.2 - 1.4 mm",
        available_qty_sqft=4500.0,
        metadata={
            "tannery_vat_id": "IT02345678901",
            "botte_drum_id": "BOTTALE-N4",
            "finish_type": "Anilina Naturale Semilucida",
            "bally_flex_resistance_cycles": 50000,
            "veslic_rub_fastness": 500,
        },
        is_active=True,
    )
    saved_batch = db.save_tannery_batch(batch, batch_id="batch-montebello-lwg-gold")

    docs = [
        TanneryDocumentCreate(
            doc_type=TanneryDocumentType.LWG_CERTIFICATE,
            file_name="Certificato_LWG_Gold_Audit_2026_Montebello.pdf",
            mime_type="application/pdf",
            file_size_bytes=24810,
            data_payload="OFFICIAL_AUDIT_LWG_GOLD_RATING_SCORE_95_2_PERCENT_CONCERIA_MONTEBELLO_EXP_2027_12_31",
            valid_until="2027-12-31",
            is_verified=True,
        ),
        TanneryDocumentCreate(
            doc_type=TanneryDocumentType.ICEC_TRACEABILITY,
            file_name="ICEC_TS410_Tracciabilita_Filiera_Allevamento_Italia.pdf",
            mime_type="application/pdf",
            file_size_bytes=18450,
            data_payload="ICEC_CERTIFIED_TRACEABILITY_TS410_RAW_HIDE_ORIGIN_VERONA_ITALY_EUDR_COMPLIANT_POST_2020",
            valid_until="2028-06-30",
            is_verified=True,
        ),
        TanneryDocumentCreate(
            doc_type=TanneryDocumentType.REACH_CHEMICAL_TEST,
            file_name="Report_Analisi_Laboratorio_Cromo_VI_REACH_2026.pdf",
            mime_type="application/pdf",
            file_size_bytes=12600,
            data_payload="CHEMICAL_TEST_LAB_REPORT_ZERO_CHROME_VI_UNDER_0_3_PPM_NO_SVHC_SAFE_CIRCULAR_FOOTWEAR",
            valid_until="2027-01-31",
            is_verified=True,
        ),
    ]
    for d in docs:
        db.save_tannery_document(saved_batch.batch_id, d)


def seed_production_orders(db: FootlinkSQLitePersistence) -> None:
    """Sprint 6: Seed Production Orders Hub with Size Breakdown & Phases."""
    order = ProductionOrderCreate(
        order_code="COMM-2026-PE-084",
        company_id="comp-pmi-rossi",
        plm_variant_id="PLM-DUCA-NERO",
        pim_item_id="PIM-DUCA-001",
        season_id="SEASON-PE26",
        collection_id="COLL-SEASON-PE26-MAIN-26",
        tannery_batch_id="batch-montebello-lwg-gold",
        status=ProductionOrderStatus.IN_PRODUCTION,
        target_delivery_date="2026-05-30",
        notes="Commessa lancio P/E 2026 calzatura classica Blake in vitello anilina LWG Gold con suola cuoio.",
        size_breakdown=[
            OrderSizeBreakdownItem(size_code="39", planned_quantity=40, completed_quantity=0, scrapped_quantity=0),
            OrderSizeBreakdownItem(size_code="40", planned_quantity=80, completed_quantity=0, scrapped_quantity=0),
            OrderSizeBreakdownItem(size_code="41", planned_quantity=120, completed_quantity=0, scrapped_quantity=0),
            OrderSizeBreakdownItem(size_code="42", planned_quantity=140, completed_quantity=0, scrapped_quantity=0),
            OrderSizeBreakdownItem(size_code="43", planned_quantity=80, completed_quantity=0, scrapped_quantity=0),
            OrderSizeBreakdownItem(size_code="44", planned_quantity=40, completed_quantity=0, scrapped_quantity=0),
        ],
        phases=[
            {"phase_code": "cutting", "sequence": 1, "subcontractor_name": "Taglio CAD Marchigiano", "district": "Fermo-Macerata"},
            {"phase_code": "stitching_upper", "sequence": 2, "subcontractor_name": "Tomaificio Façon Marche (0 EUR)", "subcontractor_id": "comp-lab-tomaificio", "district": "Montegranaro"},
            {"phase_code": "lasting_assembly", "sequence": 3, "subcontractor_name": "Manovia Montaggio Adriatica", "subcontractor_id": "comp-lab-giunteria", "district": "Civitanova Marche"},
            {"phase_code": "finishing", "sequence": 4, "subcontractor_name": "Reparto Finissaggio & Confezione", "district": "Fermo"},
            {"phase_code": "quality_control", "sequence": 5, "subcontractor_name": "Collaudo Finale & Packaging QA", "district": "Fermo"},
        ],
        metadata={"priority": "high", "delivery_depot": "Hub Milano Lusso"},
    )
    db.save_production_order(order)


def seed_initial_data(db: FootlinkSQLitePersistence = db_manager, force: bool = False) -> List[PimCommercialItem]:
    """Populate the SQLite/PostgreSQL database with initial Made-in-Italy seed data if empty (or when force=True)."""
    if force:
        db.clear_all(clear_master_data=True)

    # Always seed seasons, domain registries and dynamic schema attributes if empty
    if len(db.list_seasons()) == 0:
        seed_seasons_and_collections(db)
    if len(db.list_registry_entries()) == 0:
        seed_domain_registries(db)
    if len(db.list_attribute_definitions()) == 0:
        seed_schema_attribute_definitions(db)

    # Sprint 6 Seeds: District Companies, Users, Tannery Batches, Documents & Production Orders
    if len(db.list_companies()) == 0:
        seed_district_companies_and_users(db)
    if len(db.list_tannery_batches()) == 0:
        seed_tannery_batches_and_documents(db)

    if db.count_pim_items() == 0:
        for item in build_initial_seed_items():
            db.save_pim_item(item)

    if len(db.list_production_orders()) == 0:
        seed_production_orders(db)

    return db.list_pim_items()


if __name__ == "__main__":
    seeded = seed_initial_data(db_manager, force=True)
    print(f"Seeded {len(seeded)} PIM Commercial Items into {db_manager.sqlite_path}")
    print(f"Seeded {len(db_manager.list_seasons())} Seasons, {len(db_manager.list_registry_entries())} Registries, {len(db_manager.list_attribute_definitions())} Schema Attributes")

