"""Seed Initial Made-in-Italy Supply Chain Data for Footlink:
- 1 PIM <-> N PLM across Footwear, Leather Goods, and Apparel
- 3-Level Hierarchical BOM with L6 Brand Costing & Lot Certificates
- Vertical Category Tech Specs & Size Grading Rules
- 0 EUR District Subcontractor Assignments
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import List

from app.database import FootlinkSQLitePersistence, db_manager
from app.models import (
    AttributeFieldType,
    AttributeTargetEntity,
    BomComponentType,
    BomItem,
    BomTemplateCreate,
    BomTemplateItem,
    CollectionCreate,
    CollectionStatus,
    CompanyBusinessType,
    CompanyCreate,
    CompanyMembershipCreate,
    CompanyTier,
    DistrictUserRole,
    DomainRegistryEntryCreate,
    MasterColorCreate,
    OrderSizeBreakdownItem,
    PimCommercialItem,
    PlmLifecycleStatus,
    PlmProductionVariant,
    ProductCategory,
    ProductCategoryCreate,
    ProductModelCreate,
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
    VendorCertificationCreate,
    VendorCreate,
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
        model_id="MOD-LOAFER-01",
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
        model_id="MOD-TOTE-01",
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


def seed_product_models(db: FootlinkSQLitePersistence) -> None:
    """FTL-CEO-021: Seed canonical base Product Models (Style / Last / Construction)."""
    models = [
        ProductModelCreate(
            model_code="MOD-LOAFER-01",
            name="Mocassino College Duca Penny Loafer",
            category=ProductCategory.FOOTWEAR,
            target_gender="men",
            last_code="Forma 402 - Classica Rotonda",
            sole_construction="Blake",
            heel_height_mm=25.0,
            default_size_range="39-46",
            season_id="SEASON-PE26",
            description="Mocassino iconico stile college penny loafer con vaschetta cucita a mano e montaggio Blake flessibile.",
            cad_drawing_ref="CAD-DUCA-LOAFER-REV4.dxf",
            is_active=True,
            metadata={"pattern_pieces": 6, "target_market": "Global Luxury Men"},
        ),
        ProductModelCreate(
            model_code="MOD-SNEAKER-01",
            name="Sneaker Heritage Marche 1980 Cupsole",
            category=ProductCategory.FOOTWEAR,
            target_gender="unisex",
            last_code="Forma Running 900",
            sole_construction="Strobel",
            heel_height_mm=32.0,
            default_size_range="36-46",
            season_id="SEASON-PE26",
            description="Sneaker rétro running con fondo cassetta bicolore TR, montaggio Strobel per massima flessibilità urbana.",
            cad_drawing_ref="CAD-SNEAKER-1980-V2.dxf",
            is_active=True,
            metadata={"pattern_pieces": 11, "target_market": "Contemporary Unisex"},
        ),
        ProductModelCreate(
            model_code="MOD-TOTE-01",
            name="Borsa Shopping Vela Tote",
            category=ProductCategory.LEATHER_GOODS,
            target_gender="women",
            last_code="Sagoma Modelleria Tote 12",
            sole_construction="Cemented",
            heel_height_mm=0.0,
            default_size_range="Unica",
            season_id="SEASON-PE26",
            description="Borsa tote capiente a doppio manico piatto, coste tinte a mano e fondo rinforzato con piedini galvanici protettivi.",
            cad_drawing_ref="CAD-TOTE-RIVIERA-V1.dxf",
            is_active=True,
            metadata={"pattern_pieces": 8, "target_market": "Luxury Leather Goods"},
        ),
        ProductModelCreate(
            model_code="MOD-BOOT-01",
            name="Stivale Cavallerizza Elegance",
            category=ProductCategory.FOOTWEAR,
            target_gender="women",
            last_code="Forma Sfilata 204",
            sole_construction="Goodyear",
            heel_height_mm=30.0,
            default_size_range="35-41",
            season_id="SEASON-PE26",
            description="Stivale alto cavallerizza in vitello pieno fiore con guardolo Goodyear e cerniera posteriore sagomata.",
            cad_drawing_ref="CAD-BOOT-CAV-2026.dxf",
            is_active=True,
            metadata={"pattern_pieces": 9, "target_market": "High Luxury Women"},
        ),
    ]
    for m in models:
        db.save_product_model(m, model_id=m.model_code)


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
        # Sprint 7 / FTL-PROD-011 & FTL-TECH-016: Piramidi di Collezione
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="collection_pyramids",
            entry_code="carryover_continuativo",
            label_it="⭐ Continuativo / Carryover (No Saldi)",
            label_en="Iconic Carryover (Always in Stock)",
            metadata={
                "priority": "iconic",
                "lifecycle_years": 3,
                "discount_allowed": False,
                "target_mix_pct": 40,
                "target_margin_pct": 68,
                "replenishment_type": "continuous",
                "dependencies": ["Never Out of Stock (NOS)", "Full-Price Protected", "BOM Standardizzata"],
            },
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="collection_pyramids",
            entry_code="seasonal_core",
            label_it="🌿 Stagionale Core",
            label_en="Seasonal Core Collection",
            metadata={
                "priority": "core",
                "lifecycle_years": 1,
                "discount_allowed": True,
                "target_mix_pct": 40,
                "target_margin_pct": 62,
                "replenishment_type": "seasonal_preorder",
                "depends_on": "carryover_continuativo",
                "dependencies": ["Campionario Stagionale", "Saldi Ammessi Fine Stagione", "Pre-Order Showroom"],
            },
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="collection_pyramids",
            entry_code="trend_drop",
            label_it="⚡ Trend Drop / Capsule",
            label_en="Trend Drop / Flash Release",
            metadata={
                "priority": "high_energy",
                "lifecycle_years": 0.5,
                "discount_allowed": True,
                "target_mix_pct": 15,
                "target_margin_pct": 70,
                "replenishment_type": "on_demand",
                "depends_on": "seasonal_core",
                "dependencies": ["Quick Response (Lead Time < 21gg)", "Lancio Social / Drop", "Tiratura Flessibile"],
            },
            sort_order=3,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PIM,
            registry_name="collection_pyramids",
            entry_code="capsule_limited",
            label_it="💎 Capsule Limited Edition",
            label_en="Capsule Limited Edition",
            metadata={
                "priority": "luxury_numbered",
                "lifecycle_years": 0.5,
                "discount_allowed": False,
                "target_mix_pct": 5,
                "target_margin_pct": 75,
                "replenishment_type": "one_shot",
                "depends_on": "carryover_continuativo",
                "dependencies": [
                    "Numerazione di Serie",
                    "Tiratura Singola (No Riordini)",
                    "Full-Price Protected",
                    "Pellame LWG Gold Obbligatorio",
                ],
            },
            sort_order=4,
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
        # Sprint 7 / FTL-PROD-011: Tipi di Costruzione legati gerarchicamente alla Categoria
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="construction_types",
            entry_code="cassetta_cucita",
            label_it="Fondo Cassetta Cucita",
            label_en="Stitched Cupsole",
            metadata={"category": "footwear", "description": "Fondo in gomma scatolata cucito lateralmente alla tomaia."},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="construction_types",
            entry_code="blake",
            label_it="Lavorazione Blake Artigianale",
            label_en="Blake Stitching",
            metadata={"category": "footwear", "description": "Cucitura passante tra suola, tomaia e sottopiede di montaggio."},
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="construction_types",
            entry_code="goodyear",
            label_it="Goodyear Welton Pregiato",
            label_en="Goodyear Welted",
            metadata={"category": "footwear", "description": "Doppia cucitura con guardolo interposto per risuolatura infinita."},
            sort_order=3,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="construction_types",
            entry_code="sacchetto",
            label_it="Lavorazione a Sacchetto (Bologna)",
            label_en="Sacchetto / Bologna Construction",
            metadata={"category": "footwear", "description": "Fodera chiusa a guanto, massima flessibilità e morbidezza."},
            sort_order=4,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="construction_types",
            entry_code="slip_lasting",
            label_it="Slip Lasting / Strobel",
            label_en="Slip Lasting / Strobel",
            metadata={"category": "footwear", "description": "Cucitura Strobel tra tomaia e soletta in tessuto per sneakers leggere."},
            sort_order=5,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="construction_types",
            entry_code="tubolare",
            label_it="Tubolare Mocassino",
            label_en="Tubular Moccasin",
            metadata={"category": "footwear", "description": "Tomaia che avvolge il piede inferiormente cucita a mascherina."},
            sort_order=6,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="construction_types",
            entry_code="costa_taglio_vivo",
            label_it="Costa a Taglio Vivo Tinto",
            label_en="Raw Edge Painted Finish",
            metadata={"category": "leather_goods", "description": "Bordo smussato, tinto a mano e lucidato a caldo per borse."},
            sort_order=7,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="construction_types",
            entry_code="rimboccato",
            label_it="Costruzione Rimboccata Lusso",
            label_en="Folded Edge Luxury Construction",
            metadata={"category": "leather_goods", "description": "Pelle ripiegata all'interno con interfodera rinforzata."},
            sort_order=8,
        ),
        # Sprint 7 / FTL-CEO-015: Scale Taglie legate a Categoria e Genere Target
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="size_scales",
            entry_code="eu_shoes_woman",
            label_it="Calzature Donna EU 35-42",
            label_en="Women Shoes EU 35-42",
            metadata={"category": "footwear", "target_gender": "donna", "min": 35, "max": 42, "step": 1.0, "base": 37, "sizes": ["35", "36", "37", "38", "39", "40", "41", "42"]},
            sort_order=1,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="size_scales",
            entry_code="eu_shoes_man",
            label_it="Calzature Uomo EU 38-46",
            label_en="Men Shoes EU 38-46",
            metadata={"category": "footwear", "target_gender": "uomo", "min": 38, "max": 46, "step": 1.0, "base": 42, "sizes": ["38", "39", "40", "41", "42", "43", "44", "45", "46"]},
            sort_order=2,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="size_scales",
            entry_code="it_apparel_standard",
            label_it="Abbigliamento IT 44-56",
            label_en="Apparel IT 44-56",
            metadata={"category": "apparel", "target_gender": "unisex", "min": 44, "max": 56, "step": 2.0, "base": 50, "sizes": ["IT 44", "IT 46", "IT 48", "IT 50", "IT 52", "IT 54", "IT 56"]},
            sort_order=3,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="size_scales",
            entry_code="tu_leather_goods",
            label_it="Pelletteria Taglia Unica (TU)",
            label_en="Leather Goods One Size (TU)",
            metadata={"category": "leather_goods", "target_gender": "unisex", "min": 1, "max": 1, "base": 1, "sizes": ["TU (Taglia Unica)"]},
            sort_order=4,
        ),
        DomainRegistryEntryCreate(
            registry_domain=RegistryDomain.PLM,
            registry_name="size_scales",
            entry_code="eu_shoes_kid",
            label_it="Calzature Bambino EU 24-34",
            label_en="Kids Shoes EU 24-34",
            metadata={"category": "footwear", "target_gender": "bambino", "min": 24, "max": 34, "base": 28, "sizes": ["24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34"]},
            sort_order=5,
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


def seed_product_categories_hierarchy(db: FootlinkSQLitePersistence) -> None:
    """Populate hierarchical product taxonomy (Macro-Settore > Famiglia > Sotto-famiglia/Tipologia) per ADR-010."""
    categories = [
        # Level 1: Macro-Settori
        ProductCategoryCreate(category_id="cat_footwear", parent_id=None, level=1, code="footwear", slug_path="footwear", label_it="Calzature", label_en="Footwear", icon="👞", sort_order=10),
        ProductCategoryCreate(category_id="cat_leather_goods", parent_id=None, level=1, code="leather_goods", slug_path="leather_goods", label_it="Pelletteria", label_en="Leather Goods", icon="👜", sort_order=20),
        ProductCategoryCreate(category_id="cat_apparel", parent_id=None, level=1, code="apparel", slug_path="apparel", label_it="Abbigliamento", label_en="Apparel", icon="🧥", sort_order=30),

        # Level 2: Famiglie Calzature
        ProductCategoryCreate(category_id="cat_fw_sneakers", parent_id="cat_footwear", level=2, code="sneakers", slug_path="footwear/sneakers", label_it="Sneakers", label_en="Sneakers", icon="👟", sort_order=10),
        ProductCategoryCreate(category_id="cat_fw_formal", parent_id="cat_footwear", level=2, code="formal", slug_path="footwear/formal", label_it="Scarpe Classiche / Eleganti", label_en="Formal & Classic", icon="👞", sort_order=20),
        ProductCategoryCreate(category_id="cat_fw_loafers", parent_id="cat_footwear", level=2, code="loafers", slug_path="footwear/loafers", label_it="Mocassini", label_en="Loafers", icon="👞", sort_order=30),
        ProductCategoryCreate(category_id="cat_fw_boots", parent_id="cat_footwear", level=2, code="boots", slug_path="footwear/boots", label_it="Stivali & Stivaletti", label_en="Boots & Ankle Boots", icon="🥾", sort_order=40),
        ProductCategoryCreate(category_id="cat_fw_pumps", parent_id="cat_footwear", level=2, code="pumps", slug_path="footwear/pumps", label_it="Décolleté & Tacchi", label_en="Pumps & Heels", icon="👠", sort_order=50),
        ProductCategoryCreate(category_id="cat_fw_sandals", parent_id="cat_footwear", level=2, code="sandals", slug_path="footwear/sandals", label_it="Sandali & Ciabatte", label_en="Sandals", icon="👡", sort_order=60),

        # Level 3: Sotto-famiglie Sneakers
        ProductCategoryCreate(category_id="cat_fw_snk_cupsole", parent_id="cat_fw_sneakers", level=3, code="low_top_cupsole", slug_path="footwear/sneakers/low-top-cupsole", label_it="Bassa Fondo Cassetta", label_en="Low-Top Cupsole", icon="👟", sort_order=10),
        ProductCategoryCreate(category_id="cat_fw_snk_runner", parent_id="cat_fw_sneakers", level=3, code="retro_runner", slug_path="footwear/sneakers/retro-runner", label_it="Running Retrò", label_en="Retro Runner", icon="🏃", sort_order=20),
        ProductCategoryCreate(category_id="cat_fw_snk_chunky", parent_id="cat_fw_sneakers", level=3, code="chunky_platform", slug_path="footwear/sneakers/chunky-platform", label_it="Chunky & Platform", label_en="Chunky Platform", icon="🧱", sort_order=30),

        # Level 3: Sotto-famiglie Classiche
        ProductCategoryCreate(category_id="cat_fw_for_derby", parent_id="cat_fw_formal", level=3, code="derby", slug_path="footwear/formal/derby", label_it="Derby Francesina Aperta", label_en="Derby", icon="👞", sort_order=10),
        ProductCategoryCreate(category_id="cat_fw_for_oxford", parent_id="cat_fw_formal", level=3, code="oxford", slug_path="footwear/formal/oxford", label_it="Oxford Francesina Chiusa", label_en="Oxford", icon="👞", sort_order=20),
        ProductCategoryCreate(category_id="cat_fw_for_monk", parent_id="cat_fw_formal", level=3, code="monkstrap", slug_path="footwear/formal/monkstrap", label_it="Doppia Fibbia / Monkstrap", label_en="Monkstrap", icon="👞", sort_order=30),

        # Level 3: Sotto-famiglie Mocassini
        ProductCategoryCreate(category_id="cat_fw_loa_penny", parent_id="cat_fw_loafers", level=3, code="penny_loafer", slug_path="footwear/loafers/penny-loafer", label_it="Penny Loafer con Mascherina", label_en="Penny Loafer", icon="👞", sort_order=10),
        ProductCategoryCreate(category_id="cat_fw_loa_driving", parent_id="cat_fw_loafers", level=3, code="driving_shoe", slug_path="footwear/loafers/driving-shoe", label_it="Gommino da Guida Tubolare", label_en="Driving Shoe", icon="🚗", sort_order=20),
        ProductCategoryCreate(category_id="cat_fw_loa_tassel", parent_id="cat_fw_loafers", level=3, code="tassel_loafer", slug_path="footwear/loafers/tassel-loafer", label_it="Mocassino con Nappine", label_en="Tassel Loafer", icon="👞", sort_order=30),

        # Level 3: Sotto-famiglie Stivali
        ProductCategoryCreate(category_id="cat_fw_boo_chelsea", parent_id="cat_fw_boots", level=3, code="chelsea_boot", slug_path="footwear/boots/chelsea-boot", label_it="Tronchetto Chelsea con Elastico", label_en="Chelsea Boot", icon="🥾", sort_order=10),
        ProductCategoryCreate(category_id="cat_fw_boo_combat", parent_id="cat_fw_boots", level=3, code="combat_boot", slug_path="footwear/boots/combat-boot", label_it="Anfibio / Stringato Militare", label_en="Combat Boot", icon="🥾", sort_order=20),

        # Level 3: Sotto-famiglie Tacchi
        ProductCategoryCreate(category_id="cat_fw_pmp_85", parent_id="cat_fw_pumps", level=3, code="pump_heel_85", slug_path="footwear/pumps/pump-heel-85", label_it="Décolleté Tacco 85 a Spillo", label_en="Classic Pump 85mm", icon="👠", sort_order=10),
        ProductCategoryCreate(category_id="cat_fw_pmp_sling", parent_id="cat_fw_pumps", level=3, code="slingback", slug_path="footwear/pumps/slingback", label_it="Slingback Tallone Scoperto", label_en="Slingback Pump", icon="👠", sort_order=20),

        # Level 2 & 3: Pelletteria
        ProductCategoryCreate(category_id="cat_lg_bags", parent_id="cat_leather_goods", level=2, code="bags", slug_path="leather_goods/bags", label_it="Borse", label_en="Bags", icon="👜", sort_order=10),
        ProductCategoryCreate(category_id="cat_lg_bag_tote", parent_id="cat_lg_bags", level=3, code="tote_bag", slug_path="leather_goods/bags/tote-bag", label_it="Borsa Shopping / Tote", label_en="Tote Bag", icon="👜", sort_order=10),
        ProductCategoryCreate(category_id="cat_lg_bag_shoulder", parent_id="cat_lg_bags", level=3, code="shoulder_bag", slug_path="leather_goods/bags/shoulder-bag", label_it="Borsa a Tracolla", label_en="Crossbody Bag", icon="👜", sort_order=20),
        ProductCategoryCreate(category_id="cat_lg_slg", parent_id="cat_leather_goods", level=2, code="small_leather_goods", slug_path="leather_goods/small-leather-goods", label_it="Piccola Pelletteria", label_en="Small Leather Goods", icon="👛", sort_order=20),
        ProductCategoryCreate(category_id="cat_lg_slg_wallet", parent_id="cat_lg_slg", level=3, code="wallet", slug_path="leather_goods/small-leather-goods/wallet", label_it="Portafoglio Bifold / Zip", label_en="Wallet", icon="👛", sort_order=10),

        # Level 2 & 3: Abbigliamento
        ProductCategoryCreate(category_id="cat_ap_outerwear", parent_id="cat_apparel", level=2, code="outerwear", slug_path="apparel/outerwear", label_it="Capispalla & Giacche", label_en="Outerwear", icon="🧥", sort_order=10),
        ProductCategoryCreate(category_id="cat_ap_out_leather_jacket", parent_id="cat_ap_outerwear", level=3, code="leather_jacket", slug_path="apparel/outerwear/leather-jacket", label_it="Giacca di Pelle / Biker", label_en="Leather Jacket", icon="🧥", sort_order=10),
    ]

    for cat in categories:
        db.save_category(cat)


def seed_bom_templates(db: FootlinkSQLitePersistence) -> None:
    """Populate pre-configured 3-level BOM standard templates per ADR-010."""
    templates = [
        BomTemplateCreate(
            template_id="BOM-TPL-SNEAKER-CUPSOLE",
            name="Preset Standard Sneaker Fondo Cassetta",
            category_id="cat_fw_snk_cupsole",
            construction_type="cassetta_cucita",
            description="Distinta base 3 livelli per sneaker con tomaia vitello, fodera pelle, suola a cassetta TR cucita e minuteria.",
            items=[
                BomTemplateItem(level=1, template_item_id="TPL-SNK-UPP", component_type=BomComponentType.UPPER, material_name="Vitello Pieno Fiore Concia Cromo 1.4mm", supplier_name="Conceria Distretto Veneto", origin_country_iso2="IT", unit_of_measure="dm2", unit_consumption=18.5, waste_percentage=15.0, recycled_content_pct=0.0, certifications=["LWG Gold", "ICEC TS 410", "REACH", "EUDR"], unit_cost_eur=14.50),
                BomTemplateItem(level=1, template_item_id="TPL-SNK-LIN", component_type=BomComponentType.LINING, material_name="Fodera Vitello Naturale Traspirante", supplier_name="Conceria Distretto Veneto", origin_country_iso2="IT", unit_of_measure="dm2", unit_consumption=12.0, waste_percentage=10.0, recycled_content_pct=0.0, certifications=["LWG Gold", "REACH"], unit_cost_eur=8.50),
                BomTemplateItem(level=2, parent_template_item_id="TPL-SNK-UPP", template_item_id="TPL-SNK-SALPA", component_type=BomComponentType.SUB_ASSEMBLY, material_name="Salpa Termoadesiva Contrafforte Tallone", supplier_name="Componenti Fermo-Macerata", origin_country_iso2="IT", unit_of_measure="pz", unit_consumption=1.0, waste_percentage=2.0, recycled_content_pct=25.0, certifications=["GRS", "OEKO-TEX"], unit_cost_eur=1.80),
                BomTemplateItem(level=2, template_item_id="TPL-SNK-SOLE", component_type=BomComponentType.OUTSOLE, material_name="Suola Monoblocco TR Gomma Cassetta", supplier_name="Suolificio Marchigiano", origin_country_iso2="IT", unit_of_measure="pa", unit_consumption=1.0, waste_percentage=1.0, recycled_content_pct=15.0, certifications=["GRS", "REACH"], unit_cost_eur=9.50),
                BomTemplateItem(level=2, template_item_id="TPL-SNK-FUSS", component_type=BomComponentType.INSOLE, material_name="Fussbett Anatomico Memory Foam Estraibile", supplier_name="Plantari & Soletti Srl", origin_country_iso2="IT", unit_of_measure="pa", unit_consumption=1.0, waste_percentage=1.0, recycled_content_pct=20.0, certifications=["REACH"], unit_cost_eur=3.80),
                BomTemplateItem(level=3, template_item_id="TPL-SNK-LACES", component_type=BomComponentType.HARDWARE, material_name="Lacci Cotone Cerato 120cm", supplier_name="Filati & Treccia Lucca", origin_country_iso2="IT", unit_of_measure="pa", unit_consumption=1.0, waste_percentage=0.0, recycled_content_pct=30.0, certifications=["GOTS", "OEKO-TEX"], unit_cost_eur=0.90),
                BomTemplateItem(level=3, template_item_id="TPL-SNK-EYE", component_type=BomComponentType.HARDWARE, material_name="Occhielli Alluminio Nichel-Free Galvanizzati", supplier_name="Minuterie Toscane", origin_country_iso2="IT", unit_of_measure="pz", unit_consumption=14.0, waste_percentage=2.0, recycled_content_pct=0.0, certifications=["REACH"], unit_cost_eur=0.08),
            ],
        ),
        BomTemplateCreate(
            template_id="BOM-TPL-LOAFER-CUOIO",
            name="Preset Mocassino Classico Fondo Cuoio",
            category_id="cat_fw_loa_penny",
            construction_type="tubolare_sacchetto",
            description="Distinta base 3 livelli per mocassino lavorazione tubolare con mascherina, fondo cuoio doppio e tacco con sottotacco in gomma.",
            items=[
                BomTemplateItem(level=1, template_item_id="TPL-LOA-UPP", component_type=BomComponentType.UPPER, material_name="Vitello Francese Spazzolato Pieno Fiore", supplier_name="Conceria Santa Croce sull'Arno", origin_country_iso2="IT", unit_of_measure="dm2", unit_consumption=16.0, waste_percentage=18.0, recycled_content_pct=0.0, certifications=["LWG Gold", "REACH", "EUDR"], unit_cost_eur=16.00),
                BomTemplateItem(level=1, template_item_id="TPL-LOA-LIN", component_type=BomComponentType.LINING, material_name="Fodera Capretto Naturale Morbido", supplier_name="Conceria Santa Croce sull'Arno", origin_country_iso2="IT", unit_of_measure="dm2", unit_consumption=10.0, waste_percentage=8.0, recycled_content_pct=0.0, certifications=["LWG Gold", "REACH"], unit_cost_eur=9.20),
                BomTemplateItem(level=2, template_item_id="TPL-LOA-SOLE", component_type=BomComponentType.OUTSOLE, material_name="Suola Cuoio Primofiore Concia Vegetale Lenta", supplier_name="Cuoificio Valdarno", origin_country_iso2="IT", unit_of_measure="pa", unit_consumption=1.0, waste_percentage=2.0, recycled_content_pct=0.0, certifications=["ICEC TS 410", "REACH"], unit_cost_eur=18.50),
                BomTemplateItem(level=2, template_item_id="TPL-LOA-HEEL", component_type=BomComponentType.HEEL, material_name="Tacco Cuoio Sovrapposto con Inserto Gomma", supplier_name="Tacchi & Forme Montegranaro", origin_country_iso2="IT", unit_of_measure="pa", unit_consumption=1.0, waste_percentage=1.0, recycled_content_pct=0.0, certifications=["REACH"], unit_cost_eur=5.80),
                BomTemplateItem(level=3, template_item_id="TPL-LOA-THREAD", component_type=BomComponentType.HARDWARE, material_name="Filo Cerato 1.2mm per Cucitura Vaschetta", supplier_name="Filati Cucirini SpA", origin_country_iso2="IT", unit_of_measure="mt", unit_consumption=4.5, waste_percentage=5.0, recycled_content_pct=0.0, certifications=["OEKO-TEX"], unit_cost_eur=0.45),
            ],
        ),
        BomTemplateCreate(
            template_id="BOM-TPL-DECOLLETE-PUMP",
            name="Preset Décolleté Tacco 85 a Spillo",
            category_id="cat_fw_pmp_85",
            construction_type="ago",
            description="Distinta base 3 livelli per scarpa da donna tacco alto 85mm con tacco rivestito e suola cuoio laccato.",
            items=[
                BomTemplateItem(level=1, template_item_id="TPL-PMP-UPP", component_type=BomComponentType.UPPER, material_name="Camoscio Baby Calf Idrorepellente", supplier_name="Conceria Chiampo", origin_country_iso2="IT", unit_of_measure="dm2", unit_consumption=12.0, waste_percentage=16.0, recycled_content_pct=0.0, certifications=["LWG Gold", "REACH"], unit_cost_eur=15.00),
                BomTemplateItem(level=1, template_item_id="TPL-PMP-LIN", component_type=BomComponentType.LINING, material_name="Fodera Capretto Laminato Oro", supplier_name="Conceria Santa Croce", origin_country_iso2="IT", unit_of_measure="dm2", unit_consumption=9.0, waste_percentage=8.0, recycled_content_pct=0.0, certifications=["LWG Gold"], unit_cost_eur=10.50),
                BomTemplateItem(level=2, template_item_id="TPL-PMP-HEEL", component_type=BomComponentType.HEEL, material_name="Tacco Strutturale ABS 85mm con Perno Acciaio", supplier_name="Tacchificio Riviera del Brenta", origin_country_iso2="IT", unit_of_measure="pa", unit_consumption=1.0, waste_percentage=1.0, recycled_content_pct=0.0, certifications=["REACH"], unit_cost_eur=6.20),
                BomTemplateItem(level=2, template_item_id="TPL-PMP-INSOLE", component_type=BomComponentType.INSOLE, material_name="Sottopiede Sagomato con Cambrione Temprato", supplier_name="Solettificio Brenta", origin_country_iso2="IT", unit_of_measure="pa", unit_consumption=1.0, waste_percentage=1.0, recycled_content_pct=0.0, certifications=["REACH"], unit_cost_eur=4.10),
                BomTemplateItem(level=2, template_item_id="TPL-PMP-SOLE", component_type=BomComponentType.OUTSOLE, material_name="Suola Cuoio Verniciata Bordo Tinto Nero", supplier_name="Cuoificio Valdarno", origin_country_iso2="IT", unit_of_measure="pa", unit_consumption=1.0, waste_percentage=2.0, recycled_content_pct=0.0, certifications=["REACH"], unit_cost_eur=14.00),
                BomTemplateItem(level=3, template_item_id="TPL-PMP-TOPLIFT", component_type=BomComponentType.HARDWARE, material_name="Sottotacco Poliuretano Anti-Rumore", supplier_name="Tacchificio Riviera del Brenta", origin_country_iso2="IT", unit_of_measure="pa", unit_consumption=1.0, waste_percentage=0.0, recycled_content_pct=0.0, certifications=["REACH"], unit_cost_eur=0.85),
            ],
        ),
        BomTemplateCreate(
            template_id="BOM-TPL-TOTE-BAG",
            name="Preset Borsa Shopping Tote Bag",
            category_id="cat_lg_bag_tote",
            construction_type="cassetta_cucita",
            description="Distinta base 3 livelli per borsa shopping a spalla in pelle con fodera in tela resinata e minuteria metallica galvanizzata.",
            items=[
                BomTemplateItem(level=1, template_item_id="TPL-BAG-UPP", component_type=BomComponentType.UPPER, material_name="Toro Pieno Fiore Granato Spessore 1.8mm", supplier_name="Conceria Ponte a Egola", origin_country_iso2="IT", unit_of_measure="dm2", unit_consumption=65.0, waste_percentage=20.0, recycled_content_pct=0.0, certifications=["LWG Gold", "REACH", "EUDR"], unit_cost_eur=13.50),
                BomTemplateItem(level=1, template_item_id="TPL-BAG-LIN", component_type=BomComponentType.LINING, material_name="Tessuto Twill Cotone Resinato Idrorepellente", supplier_name="Tessitura Prato", origin_country_iso2="IT", unit_of_measure="mt", unit_consumption=0.85, waste_percentage=5.0, recycled_content_pct=40.0, certifications=["GRS", "OEKO-TEX"], unit_cost_eur=7.50),
                BomTemplateItem(level=2, parent_template_item_id="TPL-BAG-UPP", template_item_id="TPL-BAG-SALPA", component_type=BomComponentType.SUB_ASSEMBLY, material_name="Salpa Rigenerata di Rinforzo Fondo e Manici", supplier_name="Salpificio Scandicci", origin_country_iso2="IT", unit_of_measure="pz", unit_consumption=1.0, waste_percentage=2.0, recycled_content_pct=80.0, certifications=["GRS"], unit_cost_eur=2.80),
                BomTemplateItem(level=3, template_item_id="TPL-BAG-ZIP", component_type=BomComponentType.HARDWARE, material_name="Cerniera Lampo Metallo Trancia Ottone 45cm", supplier_name="Cerniere Lampo Firenze", origin_country_iso2="IT", unit_of_measure="pz", unit_consumption=1.0, waste_percentage=0.0, recycled_content_pct=0.0, certifications=["REACH"], unit_cost_eur=3.40),
                BomTemplateItem(level=3, template_item_id="TPL-BAG-HOOKS", component_type=BomComponentType.HARDWARE, material_name="Moschettoni e Anelli Tracolla Ottone Massiccio", supplier_name="Accessori Moda Scandicci", origin_country_iso2="IT", unit_of_measure="pz", unit_consumption=4.0, waste_percentage=0.0, recycled_content_pct=0.0, certifications=["REACH"], unit_cost_eur=1.90),
            ],
        ),
    ]

    for tpl in templates:
        db.save_bom_template(tpl)


def seed_sprint8_master_colors(db: FootlinkSQLitePersistence) -> None:
    """Sprint 8 (FTL-TECH-022): Seed 10 Master & Seasonal Colors across Made-in-Italy finishes."""
    colors = [
        MasterColorCreate(
            id="MCOL-BLK-001",
            color_code="COL-BLK-001",
            technical_name_it="Nero Spazzolato Profondo",
            technical_name_en="Deep Brushed Black",
            commercial_family="Nero / Black",
            hex_code="#141414",
            pantone_tcx_code="PANTONE 19-4004 TCX",
            ral_code="RAL 9005",
            finish_type="pieno_fiore_naturale",
            applicable_domains=["pellame", "fodera", "suola", "filati", "packaging"],
            season_id=None,
            recipe_notes="Concia mista senza metalli pesanti, spazzolatura a cera di carnauba.",
            is_active=True,
        ),
        MasterColorCreate(
            id="MCOL-TAN-002",
            color_code="COL-TAN-002",
            technical_name_it="Cuoio Toscano Tamponato",
            technical_name_en="Hand-Burnished Tuscan Tan",
            commercial_family="Cuoio & Marrone",
            hex_code="#C68B59",
            pantone_tcx_code="PANTONE 18-1142 TCX",
            ral_code="RAL 8023",
            finish_type="pieno_fiore_naturale",
            applicable_domains=["pellame", "fodera", "suola", "filati"],
            season_id=None,
            recipe_notes="Concia lenta al vegetale con tannini di castagno e tamponatura manuale.",
            is_active=True,
        ),
        MasterColorCreate(
            id="MCOL-BRN-003",
            color_code="COL-BRN-003",
            technical_name_it="Testa di Moro Camoscio",
            technical_name_en="Dark Espresso Suede",
            commercial_family="Cuoio & Marrone",
            hex_code="#4A2E1B",
            pantone_tcx_code="PANTONE 19-1016 TCX",
            ral_code="RAL 8017",
            finish_type="scamosciato_suede",
            applicable_domains=["pellame", "suola", "filati"],
            season_id=None,
            recipe_notes="Crosta fiore smerigliata baby-calf con trattamento idrorepellente PFAS-free.",
            is_active=True,
        ),
        MasterColorCreate(
            id="MCOL-WHT-004",
            color_code="COL-WHT-004",
            technical_name_it="Bianco Ottico Pieno Fiore",
            technical_name_en="Optical White Full Grain",
            commercial_family="Bianco & Neutri",
            hex_code="#F8F8F6",
            pantone_tcx_code="PANTONE 11-0601 TCX",
            ral_code="RAL 9016",
            finish_type="pieno_fiore_naturale",
            applicable_domains=["pellame", "fodera", "suola", "filati"],
            season_id=None,
            recipe_notes="Rifinizione poliuretanica ad acqua anti-ingiallimento UV.",
            is_active=True,
        ),
        MasterColorCreate(
            id="MCOL-ECR-005",
            color_code="COL-ECR-005",
            technical_name_it="Avorio Istituzionale Packaging",
            technical_name_en="Institutional Ivory Packaging",
            commercial_family="Bianco & Neutri",
            hex_code="#F5F2EB",
            pantone_tcx_code="PANTONE 11-0105 TCX",
            ral_code="RAL 9001",
            finish_type="tessuto_tinto_filo",
            applicable_domains=["packaging", "fodera", "filati"],
            season_id=None,
            recipe_notes="Cotone organico GOTS non sbiancato e cartotecnica FSC Mix.",
            is_active=True,
        ),
        MasterColorCreate(
            id="MCOL-BLU-006",
            color_code="COL-BLU-006",
            technical_name_it="Blu Notte Oceano",
            technical_name_en="Midnight Ocean Blue",
            commercial_family="Blu / Blue",
            hex_code="#1B2A4A",
            pantone_tcx_code="PANTONE 19-4028 TCX",
            ral_code="RAL 5011",
            finish_type="pieno_fiore_naturale",
            applicable_domains=["pellame", "fodera", "suola", "filati"],
            season_id="SEASON-PE26",
            recipe_notes="Tintura passante in bottale P/E 2026, tolleranza spettrofotometrica Delta-E <= 0.8.",
            is_active=True,
        ),
        MasterColorCreate(
            id="MCOL-RED-007",
            color_code="COL-RED-007",
            technical_name_it="Bordeaux Imperiale",
            technical_name_en="Imperial Burgundy",
            commercial_family="Rosso & Bordeaux",
            hex_code="#5E1914",
            pantone_tcx_code="PANTONE 19-1725 TCX",
            ral_code="RAL 3005",
            finish_type="spazzolato_anticato",
            applicable_domains=["pellame", "suola", "filati"],
            season_id="SEASON-PE26",
            recipe_notes="Crust anticato a mano in forma con velatura bordeaux profondo.",
            is_active=True,
        ),
        MasterColorCreate(
            id="MCOL-GRN-008",
            color_code="COL-GRN-008",
            technical_name_it="Verde Bosco Oliva",
            technical_name_en="Olive Forest Green",
            commercial_family="Verde / Green",
            hex_code="#2D4028",
            pantone_tcx_code="PANTONE 19-0419 TCX",
            ral_code="RAL 6020",
            finish_type="grana_dollaro",
            applicable_domains=["pellame", "filati"],
            season_id="SEASON-PE26",
            recipe_notes="Vitello bottalato grana dollaro morbida, concia metal-free LWG Gold.",
            is_active=True,
        ),
        MasterColorCreate(
            id="MCOL-GLD-010",
            color_code="COL-GLD-010",
            technical_name_it="Oro Chiaro 24K Galvanico",
            technical_name_en="24K Light Gold Galvanic",
            commercial_family="Metallizzati & Galvaniche",
            hex_code="#D4AF37",
            pantone_tcx_code="PANTONE 16-0836 TCX",
            ral_code="RAL 1036",
            finish_type="galvanica_metallica",
            applicable_domains=["minuterie", "packaging"],
            season_id=None,
            recipe_notes="Bagno galvanico spessore 0.5 micron oro chiaro 24K nichel-free senza cianuri.",
            is_active=True,
        ),
        MasterColorCreate(
            id="MCOL-SLV-011",
            color_code="COL-SLV-011",
            technical_name_it="Palladio Lucido Nichel-Free",
            technical_name_en="Polished Nickel-Free Palladium",
            commercial_family="Metallizzati & Galvaniche",
            hex_code="#C0C5CE",
            pantone_tcx_code="PANTONE 14-4102 TCX",
            ral_code="RAL 9006",
            finish_type="galvanica_metallica",
            applicable_domains=["minuterie"],
            season_id=None,
            recipe_notes="Finitura galvanica palladio lucido ipoallergenica conforme REACH Allegato XVII.",
            is_active=True,
        ),
    ]
    for col in colors:
        db.save_master_color(col)


def seed_sprint8_vendors_and_certifications(db: FootlinkSQLitePersistence) -> None:
    """Sprint 8 (FTL-TECH-023): Seed 7 District Vendors & 0 EUR Subcontractors with dynamic certifications."""
    today = date.today()
    d_from = (today - timedelta(days=120)).isoformat()

    def _d(offset_days: int) -> str:
        return (today + timedelta(days=offset_days)).isoformat()

    vendors = [
        VendorCreate(
            vendor_id="VND-CONC-001",
            vendor_code="FOR-CONC-001",
            company_name="Conceria del Chienti S.p.A.",
            vat_number="IT01889910432",
            supply_chain_role="tannery",
            district_area="Marche - Fermo/Macerata",
            city_address="Zona Industriale Tolentino (MC)",
            country_iso2="IT",
            paas_tier="pmi",
            qualification_status="preferred_strategic",
            quality_score=95.0,
            otd_score=93.0,
            esg_score=96.0,
            standard_lead_time_days=14,
            moq_description="Minimo 300 sqft per colore / 100 sqft campionatura",
            payment_terms_l6="RIBA 60gg DFFM",
            hourly_or_unit_rate_eur_l6=7.85,
            negotiated_price_list_l6=[
                {"article": "Vitello Pieno Fiore Spazzolato 1.4mm", "uom": "sqft", "unit_price_eur": 7.80},
                {"article": "Crust Anticato Mano Cera", "uom": "sqft", "unit_price_eur": 8.10},
            ],
            internal_audit_notes_l6="Partner strategico primario per vitelli spazzolati e crust. Zero non conformità Cromo VI.",
            contact_email="qualita@conceriadelchienti.it",
            is_active=True,
            initial_certifications=[
                VendorCertificationCreate(
                    cert_id="VCERT-CONC001-LWG",
                    cert_type="LWG Gold",
                    cert_code="LWG-IT-CHIENTI-9921",
                    issuing_body="Leather Working Group",
                    valid_from=d_from,
                    valid_until=_d(280),
                ),
                VendorCertificationCreate(
                    cert_id="VCERT-CONC001-EUDR",
                    cert_type="EUDR Deforestation-Free",
                    cert_code="EUDR-DDS-2026-MC01",
                    issuing_body="ICEC / EU TRACES NT",
                    valid_from=d_from,
                    valid_until=_d(310),
                ),
            ],
        ),
        VendorCreate(
            vendor_id="VND-CONC-002",
            vendor_code="FOR-CONC-002",
            company_name="Conceria Sciarada S.r.l.",
            vat_number="IT02114450501",
            supply_chain_role="tannery",
            district_area="Toscana - Santa Croce/Scandicci",
            city_address="Via del Bosco 42, Santa Croce sull'Arno (PI)",
            country_iso2="IT",
            paas_tier="pmi",
            qualification_status="preferred_strategic",
            quality_score=94.0,
            otd_score=91.0,
            esg_score=95.0,
            standard_lead_time_days=16,
            moq_description="Minimo 250 sqft per bagno tintura",
            payment_terms_l6="RIBA 60gg DFFM",
            hourly_or_unit_rate_eur_l6=8.20,
            negotiated_price_list_l6=[
                {"article": "Vacchetta Toscana Concia Vegetale", "uom": "sqft", "unit_price_eur": 8.40},
                {"article": "Camoscio Idrorepellente PFAS-Free", "uom": "sqft", "unit_price_eur": 7.20},
            ],
            internal_audit_notes_l6="Eccellenza su scamosciati idrorepellenti e vacchetta vegetale Consorzio.",
            contact_email="labdip@sciarada-tannery.it",
            is_active=True,
            initial_certifications=[
                VendorCertificationCreate(
                    cert_id="VCERT-CONC002-LWG",
                    cert_type="LWG Gold",
                    cert_code="LWG-IT-SCIARADA-4410",
                    issuing_body="Leather Working Group",
                    valid_from=d_from,
                    valid_until=_d(210),
                ),
                VendorCertificationCreate(
                    cert_id="VCERT-CONC002-ICEC",
                    cert_type="ICEC TS 410",
                    cert_code="ICEC-TS410-SC-882",
                    issuing_body="Istituto Certificazione Qualità Pelle",
                    valid_from=d_from,
                    valid_until=_d(180),
                ),
            ],
        ),
        VendorCreate(
            vendor_id="VND-SUOL-003",
            vendor_code="FOR-SUOL-003",
            company_name="Suolificio Marche S.r.l.",
            vat_number="IT01993320445",
            supply_chain_role="sole_maker",
            district_area="Marche - Fermo/Macerata",
            city_address="Via dell'Industria 18, Sant'Elpidio a Mare (FM)",
            country_iso2="IT",
            paas_tier="pmi",
            qualification_status="qualified",
            district_company_id="comp-pmi-rossi",
            quality_score=88.0,
            otd_score=86.0,
            esg_score=84.0,
            standard_lead_time_days=12,
            moq_description="Minimo 80 paia per scala taglie",
            payment_terms_l6="Bonifico 60gg DFFM",
            hourly_or_unit_rate_eur_l6=12.40,
            negotiated_price_list_l6=[
                {"article": "Suola Cuoio Toscano Blake + Tacco", "uom": "pair", "unit_price_eur": 14.50},
                {"article": "Fondo Cassetta Gomma TR Riciclata", "uom": "pair", "unit_price_eur": 9.50},
            ],
            internal_audit_notes_l6="Rinnovo certificato ambientale ISO 14001 già calendarizzato con ente accreditato.",
            contact_email="tecnico@suolificiomarche.it",
            is_active=True,
            initial_certifications=[
                VendorCertificationCreate(
                    cert_id="VCERT-SUOL003-ISO9001",
                    cert_type="ISO 9001",
                    cert_code="ISO9001-IT-FM-3391",
                    issuing_body="DNV Business Assurance",
                    valid_from=d_from,
                    valid_until=_d(190),
                ),
                VendorCertificationCreate(
                    cert_id="VCERT-SUOL003-ISO14001",
                    cert_type="ISO 14001",
                    cert_code="ISO14001-IT-FM-1182",
                    issuing_body="DNV Business Assurance",
                    valid_from=d_from,
                    valid_until=_d(32),
                ),
            ],
        ),
        VendorCreate(
            vendor_id="VND-GALV-004",
            vendor_code="FOR-GALV-004",
            company_name="Galvanica Bruni Accessori Moda S.r.l.",
            vat_number="IT04551180487",
            supply_chain_role="hardware_galvanics",
            district_area="Toscana - Santa Croce/Scandicci",
            city_address="Via Pisana 115, Scandicci (FI)",
            country_iso2="IT",
            paas_tier="pmi",
            qualification_status="qualified",
            quality_score=91.0,
            otd_score=89.0,
            esg_score=90.0,
            standard_lead_time_days=18,
            moq_description="Minimo 100 pezzi per finitura galvanica",
            payment_terms_l6="RIBA 60gg DFFM",
            hourly_or_unit_rate_eur_l6=6.50,
            negotiated_price_list_l6=[
                {"article": "Morsetto Ottone Galvanica Oro 24K", "uom": "pair", "unit_price_eur": 6.50},
                {"article": "Zip Metallica Palladio Lucido", "uom": "pcs", "unit_price_eur": 9.20},
            ],
            internal_audit_notes_l6="Impianto galvanico a ciclo chiuso zero scarichi liquidi, test cessione nichel superato.",
            contact_email="qualita@galvanicabruni.it",
            is_active=True,
            initial_certifications=[
                VendorCertificationCreate(
                    cert_id="VCERT-GALV004-REACH",
                    cert_type="REACH SVHC Free",
                    cert_code="REACH-LAB-FI-2026-774",
                    issuing_body="Centro Qualità Tessile & Pelletteria",
                    valid_from=d_from,
                    valid_until=_d(240),
                ),
            ],
        ),
        VendorCreate(
            vendor_id="VND-TER-005",
            vendor_code="TER-ORL-005",
            company_name="Tomaificio & Orlatura F.lli Rossi",
            vat_number="IT03456789012",
            supply_chain_role="stitching_uppers_lab",
            district_area="Marche - Fermo/Macerata",
            city_address="Via Veregra 29, Montegranaro (FM)",
            country_iso2="IT",
            paas_tier="subcontractor_zero_eur",
            qualification_status="preferred_strategic",
            district_company_id="comp-lab-tomaificio",
            quality_score=93.0,
            otd_score=92.0,
            esg_score=90.0,
            standard_lead_time_days=7,
            moq_description="Lotti minimi 24 paia (Terzista a 0,00 EUR su Footlink)",
            payment_terms_l6="Bonifico 30gg DFFM Artigiani",
            hourly_or_unit_rate_eur_l6=14.50,
            negotiated_price_list_l6=[
                {"article": "Giunteria & Orlatura Mocassino Blake", "uom": "pair", "unit_price_eur": 14.50},
            ],
            internal_audit_notes_l6="Laboratorio storico 12 addetti, portale mobile 3-Clic attivo a 0 EUR.",
            contact_email="orlatura.rossi@artigianimarche.it",
            is_active=True,
            initial_certifications=[
                VendorCertificationCreate(
                    cert_id="VCERT-TER005-DURC",
                    cert_type="DURC Regolarità Contributiva",
                    cert_code="INPS-INAIL-FM-8839201",
                    issuing_body="INPS / INAIL",
                    valid_from=d_from,
                    valid_until=_d(95),
                ),
                VendorCertificationCreate(
                    cert_id="VCERT-TER005-SA8000",
                    cert_type="SA8000 Etica Lavoro",
                    cert_code="SA8000-IT-MARCHE-209",
                    issuing_body="Bureau Veritas",
                    valid_from=d_from,
                    valid_until=_d(140),
                ),
            ],
        ),
        VendorCreate(
            vendor_id="VND-TER-006",
            vendor_code="TER-MONT-006",
            company_name="Manovia Calzaturiera Riviera S.n.c.",
            vat_number="IT04567890123",
            supply_chain_role="lasting_assembly_lab",
            district_area="Veneto - Riviera del Brenta/Arzignano",
            city_address="Via Nazionale 84, Stra (VE)",
            country_iso2="IT",
            paas_tier="subcontractor_zero_eur",
            qualification_status="qualified",
            district_company_id="comp-lab-giunteria",
            quality_score=87.0,
            otd_score=85.0,
            esg_score=86.0,
            standard_lead_time_days=9,
            moq_description="Lotti minimi 30 paia (Terzista a 0,00 EUR su Footlink)",
            payment_terms_l6="Bonifico 30gg DFFM Artigiani",
            hourly_or_unit_rate_eur_l6=16.00,
            negotiated_price_list_l6=[
                {"article": " Premontaggio, Montaggio & Finissaggio", "uom": "pair", "unit_price_eur": 16.00},
            ],
            internal_audit_notes_l6="DURC in rinnovo automatico trimestrale entro 25 giorni.",
            contact_email="manovia.riviera@brentashoes.it",
            is_active=True,
            initial_certifications=[
                VendorCertificationCreate(
                    cert_id="VCERT-TER006-DURC",
                    cert_type="DURC Regolarità Contributiva",
                    cert_code="INPS-INAIL-VE-7710294",
                    issuing_body="INPS / INAIL",
                    valid_from=d_from,
                    valid_until=_d(25),
                ),
            ],
        ),
        VendorCreate(
            vendor_id="VND-CONC-009",
            vendor_code="FOR-CONC-009",
            company_name="Pellami Sud Import S.r.l.",
            vat_number="IT07774410638",
            supply_chain_role="tannery",
            district_area="Campania - Caserta/Napoli/Solofra",
            city_address="Zona Industriale Solofra (AV)",
            country_iso2="IT",
            paas_tier="pmi",
            qualification_status="blocked_expired_certs",
            quality_score=60.0,
            otd_score=55.0,
            esg_score=45.0,
            standard_lead_time_days=24,
            moq_description="Minimo 500 sqft",
            payment_terms_l6=" Pagamento anticipato / Bloccato",
            hourly_or_unit_rate_eur_l6=5.90,
            negotiated_price_list_l6=[],
            internal_audit_notes_l6="FORNITORE SOSPESO: Certificazioni LWG ed EUDR scadute. Vietato assegnare nuovi ordini.",
            contact_email="amministrazione@pellamisudimport.it",
            is_active=True,
            initial_certifications=[
                VendorCertificationCreate(
                    cert_id="VCERT-CONC009-LWG-EXP",
                    cert_type="LWG Bronze",
                    cert_code="LWG-IT-SUD-1029-EXP",
                    issuing_body="Leather Working Group",
                    valid_from=(today - timedelta(days=380)).isoformat(),
                    valid_until=_d(-14),
                ),
                VendorCertificationCreate(
                    cert_id="VCERT-CONC009-EUDR-EXP",
                    cert_type="EUDR Deforestation-Free",
                    cert_code="EUDR-DDS-2025-AV09-EXP",
                    issuing_body="EU TRACES NT",
                    valid_from=(today - timedelta(days=370)).isoformat(),
                    valid_until=_d(-5),
                ),
            ],
        ),
    ]
    for v in vendors:
        db.save_vendor(v)


def link_sprint8_seed_relations(db: FootlinkSQLitePersistence) -> None:
    """Idempotently link seeded PLM variants, BOM items, and Tannery Batches to Sprint 8 Master Colors
    and Vendors WITHOUT altering any existing fields checked by Epoca I tests.
    """
    conn = db.get_connection()
    try:
        now_iso = datetime.now(timezone.utc).isoformat()

        variant_color_links = [
            ("PLM-DUCA-NERO", "MCOL-BLK-001", "MCOL-TAN-002", None, "tone_on_tone"),
            ("PLM-DUCA-CUOIO", "MCOL-TAN-002", "MCOL-TAN-002", "MCOL-SLV-011", "tone_on_tone"),
            ("PLM-DUCA-BORDEAUX", "MCOL-RED-007", "MCOL-TAN-002", "MCOL-GLD-010", "luxury_gold_hardware"),
            ("PLM-VELA-COGNAC", "MCOL-TAN-002", "MCOL-ECR-005", None, "tone_on_tone"),
            ("PLM-VELA-OLIVA", "MCOL-GRN-008", "MCOL-GRN-008", "MCOL-SLV-011", "luxury_palladium_hardware"),
        ]
        for vid, pcol, scol, hwcol, preset in variant_color_links:
            conn.execute(
                """
                UPDATE plm_production_variants
                SET primary_color_id = COALESCE(primary_color_id, ?),
                    secondary_color_id = COALESCE(secondary_color_id, ?),
                    hardware_finish_color_id = COALESCE(hardware_finish_color_id, ?),
                    colorway_rule_preset = COALESCE(colorway_rule_preset, ?)
                WHERE plm_variant_id = ?
                """,
                (pcol, scol, hwcol, preset, vid),
            )

        # (plm_variant_id, bom_item_id, vendor_id, master_color_id, part_role, galvanics_finish, lab_dip_status, delta_e)
        bom_links = [
            ("PLM-DUCA-NERO", "BOM-DUCA-L1-UPPER", "VND-CONC-001", "MCOL-BLK-001", "tomaia_principale", None, "approved", 0.38),
            ("PLM-DUCA-NERO", "BOM-DUCA-L2-LINING", "VND-CONC-002", "MCOL-TAN-002", "fodera_interna", None, "approved", 0.52),
            ("PLM-DUCA-NERO", "BOM-DUCA-L3-THREAD", "VND-TER-005", "MCOL-BLK-001", "cuciture_filato", None, "master_standard", 0.20),
            ("PLM-DUCA-NERO", "BOM-DUCA-L1-SOLE", "VND-SUOL-003", "MCOL-TAN-002", "suola_fondo", None, "approved", 0.65),
            ("PLM-DUCA-NERO", "BOM-DUCA-L2-HEEL", "VND-SUOL-003", "MCOL-BLK-001", "tacco", None, "approved", 0.44),
            ("PLM-DUCA-NERO", "BOM-DUCA-L3-COMPOUND", "VND-SUOL-003", "MCOL-BLK-001", "sotto_assieme_tecnico", None, "master_standard", 0.30),
            ("PLM-DUCA-CUOIO", "BOM-DUCA2-L1-UPPER", "VND-CONC-002", "MCOL-TAN-002", "tomaia_principale", None, "approved", 0.45),
            ("PLM-DUCA-CUOIO", "BOM-DUCA2-L2-INSOLE", "VND-TER-006", "MCOL-TAN-002", "sottopiede", None, "approved", 0.60),
            ("PLM-DUCA-CUOIO", "BOM-DUCA2-L3-SHANK", "VND-GALV-004", "MCOL-SLV-011", "minuteria_accessori", "palladio_lucido", "master_standard", 0.15),
            ("PLM-DUCA-BORDEAUX", "BOM-DUCA3-L1-UPPER", "VND-CONC-001", "MCOL-RED-007", "tomaia_principale", None, "submitted", 0.92),
            ("PLM-DUCA-BORDEAUX", "BOM-DUCA3-L2-CLAMP", "VND-GALV-004", "MCOL-GLD-010", "minuteria_accessori", "oro_chiaro_24k", "master_standard", 0.18),
            ("PLM-DUCA-BORDEAUX", "BOM-DUCA3-L3-GALV", "VND-GALV-004", "MCOL-GLD-010", "sotto_assieme_tecnico", "oro_chiaro_24k", "master_standard", 0.12),
            ("PLM-VELA-COGNAC", "BOM-VELA-L1-BODY", "VND-CONC-002", "MCOL-TAN-002", "tomaia_principale", None, "approved", 0.41),
            ("PLM-VELA-COGNAC", "BOM-VELA-L2-HANDLE", "VND-TER-005", "MCOL-TAN-002", "riporto_secondario", None, "approved", 0.55),
            ("PLM-VELA-COGNAC", "BOM-VELA-L3-ROPE", "VND-TER-005", "MCOL-ECR-005", "sotto_assieme_tecnico", None, "master_standard", 0.25),
            ("PLM-VELA-OLIVA", "BOM-VELA2-L1-BODY", "VND-CONC-001", "MCOL-GRN-008", "tomaia_principale", None, "approved", 0.49),
            ("PLM-VELA-OLIVA", "BOM-VELA2-L2-ZIP", "VND-GALV-004", "MCOL-SLV-011", "minuteria_accessori", "palladio_lucido", "master_standard", 0.19),
            ("PLM-VELA-OLIVA", "BOM-VELA2-L3-TAPE", "VND-TER-006", "MCOL-GRN-008", "riporto_secondario", None, "approved", 0.62),
        ]

        for p_var_id, b_item_id, vend_id, mcol_id, p_role, galv, ld_status, de_val in bom_links:
            b_exists = conn.execute(
                "SELECT 1 FROM bom_items WHERE plm_variant_id = ? AND bom_item_id = ?",
                (p_var_id, b_item_id),
            ).fetchone()
            if not b_exists:
                continue
            conn.execute(
                """
                UPDATE bom_items
                SET vendor_id = COALESCE(vendor_id, ?),
                    master_color_id = COALESCE(master_color_id, ?)
                WHERE plm_variant_id = ? AND bom_item_id = ?
                """,
                (vend_id, mcol_id, p_var_id, b_item_id),
            )
            app_by = "Controllo Qualità Colore Distretto" if ld_status in ("approved", "master_standard") else None
            app_at = now_iso if ld_status in ("approved", "master_standard") else None
            conn.execute(
                """
                INSERT OR IGNORE INTO variant_colorway_bom_mappings (
                    id, plm_variant_id, bom_item_id, master_color_id,
                    part_role, galvanics_finish, lab_dip_status, delta_e_value,
                    approved_by, approved_at, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    f"CMAP-{b_item_id}",
                    p_var_id,
                    b_item_id,
                    mcol_id,
                    p_role,
                    galv,
                    ld_status,
                    de_val,
                    app_by,
                    app_at,
                    "Mappatura cromatica iniziale certificata Lab-Dip",
                ),
            )

        conn.execute(
            """
            UPDATE tannery_batches
            SET vendor_id = COALESCE(vendor_id, 'VND-CONC-001'),
                master_color_id = COALESCE(master_color_id, 'MCOL-BLK-001')
            WHERE batch_id = 'batch-montebello-lwg-gold'
            """
        )
        conn.commit()
    finally:
        db._close_if_file(conn)


def seed_initial_data(db: FootlinkSQLitePersistence = db_manager, force: bool = False) -> List[PimCommercialItem]:
    """Populate the SQLite/PostgreSQL database with initial Made-in-Italy seed data if empty (or when force=True)."""
    if force:
        db.clear_all(clear_master_data=True)

    # Always seed seasons, domain registries and dynamic schema attributes if empty
    if len(db.list_seasons()) == 0:
        seed_seasons_and_collections(db)
    if len(db.list_product_models()) == 0:
        seed_product_models(db)
    if len(db.list_registry_entries()) == 0:
        seed_domain_registries(db)
    if len(db.list_attribute_definitions()) == 0:
        seed_schema_attribute_definitions(db)

    # Sprint 7 Seeds: Product Categories Hierarchy (3+1 Levels) & BOM Templates
    if len(db.list_categories()) == 0:
        seed_product_categories_hierarchy(db)
    if len(db.list_bom_templates()) == 0:
        seed_bom_templates(db)

    # Sprint 8 Seeds: Master & Seasonal Color Palette + District Vendor Hub 360
    if len(db.list_master_colors()) == 0:
        seed_sprint8_master_colors(db)
    if len(db.list_vendors()) == 0:
        seed_sprint8_vendors_and_certifications(db)

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

    # Ensure Sprint 8 relational links on seeded BOMs, Variants & Tannery Batches are active
    link_sprint8_seed_relations(db)

    # FTL-CEO-022: Auto-link Albo vendors with District PaaS companies by VAT / name
    db.auto_link_vendors_to_district_companies()

    return db.list_pim_items()



if __name__ == "__main__":
    seeded = seed_initial_data(db_manager, force=True)
    print(f"Seeded {len(seeded)} PIM Commercial Items into {db_manager.sqlite_path}")
    print(f"Seeded {len(db_manager.list_seasons())} Seasons, {len(db_manager.list_registry_entries())} Registries, {len(db_manager.list_attribute_definitions())} Schema Attributes")

