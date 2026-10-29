/**
 * Initial Made-in-Italy Reference Dataset & Client-side Engines (DPP, Data Quality FEAT-05, Syndication Export, L6 Costing)
 * Covers all 3 Fashion & Luxury Supply Chain Sectors:
 * 1. Calzature (Footwear) — Mocassino Artigianale Duca (3 Varianti PLM)
 * 2. Pelletteria (Leather Goods) — Borsa Shopping Vela (2 Varianti PLM)
 * 3. Abbigliamento (Apparel) — Cappotto Sartoriale Brera (2 Varianti PLM)
 */

import {
  BomItem,
  BomTreeNode,
  BulkMaterialSwapPayload,
  BulkMaterialSwapResult,
  Collection,
  ColorwayBomNodeMapping,
  ColorwayMatrixResponse,
  DigitalProductPassport,
  DomainRegistryEntry,
  MasterColor,
  MaterialRecord,
  PimCommercialItem,
  PimDataQualityReport,
  PlmProductionVariant,
  ProductModel,
  ProductionOrder,
  SchemaAttributeDefinition,
  Season,
  SupplyChainStep,
  TanneryBatch,
  VendorCertification,
  VendorRecord,
  VendorWhereUsedResponse,
  ViewerSecurityRole,
} from "./types";

export const INITIAL_SEASONS: Season[] = [
  {
    season_id: "SEASON-PE26",
    code: "P/E 2026",
    name: "Primavera Estate 2026",
    year: 2026,
    status: "active",
    start_date: "2026-03-01",
    end_date: "2026-08-31",
    description: "Stagione Primavera/Estate 2026: focus su traspirabilità, suole biodegradabili e pellami LWG Gold.",
    collections: [
      {
        collection_id: "COLL-SEASON-PE26-MAIN26",
        season_id: "SEASON-PE26",
        code: "MAIN-26",
        name: "Main Collection",
        target_market: "Global Luxury",
        status: "approved",
        description: "Linea continuativa core presentata alle fashion week di Milano e Parigi.",
        products_count: 2,
      },
      {
        collection_id: "COLL-SEASON-PE26-FASH26",
        season_id: "SEASON-PE26",
        code: "FASH-26",
        name: "Fashion Runway",
        target_market: "B2B Showroom",
        status: "approved",
        description: "Modelli di tendenza per showroom d'avanguardia e department store di fascia alta.",
        products_count: 1,
      },
      {
        collection_id: "COLL-SEASON-PE26-CAPS26",
        season_id: "SEASON-PE26",
        code: "CAPS-26",
        name: "Limited Edition / Capsule",
        target_market: "Exclusive Direct",
        status: "draft",
        description: "Drop esclusivo in tiratura limitata con packaging 100% compostabile.",
        products_count: 0,
      },
    ],
    linked_products_count: 3,
  },
  {
    season_id: "SEASON-AI26",
    code: "A/I 2026-2027",
    name: "Autunno Inverno 2026/27",
    year: 2026,
    status: "planning",
    start_date: "2026-09-01",
    end_date: "2027-02-28",
    description: "Stagione Autunno/Inverno 2026-2027: concia al vegetale toscana, fondi carrarmato e lane certificate.",
    collections: [
      {
        collection_id: "COLL-SEASON-AI26-MAIN27",
        season_id: "SEASON-AI26",
        code: "MAIN-27",
        name: "Main Collection",
        target_market: "Global Luxury",
        status: "draft",
        description: "Linea autunnale con stivaletti e calzature foderate in shearling certificato.",
        products_count: 1,
      },
      {
        collection_id: "COLL-SEASON-AI26-CARR27",
        season_id: "SEASON-AI26",
        code: "CARR-27",
        name: "Carry Over Icons",
        target_market: "Omnichannel",
        status: "draft",
        description: "Modelli iconici carry-over a produzione continuativa tutto l'anno.",
        products_count: 0,
      },
    ],
    linked_products_count: 1,
  },
];

export const INITIAL_REGISTRIES: DomainRegistryEntry[] = [
  // PIM Registries
  {
    id: 1,
    registry_domain: "pim",
    registry_name: "categories",
    entry_code: "footwear",
    label_it: "Calzature (Footwear)",
    label_en: "Footwear",
    metadata: { default_hs_code: "6403.59.95", icon: "👞" },
    is_active: true,
    sort_order: 1,
  },
  {
    id: 2,
    registry_domain: "pim",
    registry_name: "categories",
    entry_code: "leather_goods",
    label_it: "Pelletteria (Leather Goods)",
    label_en: "Leather Goods",
    metadata: { default_hs_code: "4202.21.00", icon: "👜" },
    is_active: true,
    sort_order: 2,
  },
  {
    id: 3,
    registry_domain: "pim",
    registry_name: "categories",
    entry_code: "apparel",
    label_it: "Abbigliamento (Apparel)",
    label_en: "Apparel",
    metadata: { default_hs_code: "6201.20.00", icon: "🧥" },
    is_active: true,
    sort_order: 3,
  },
  {
    id: 4,
    registry_domain: "pim",
    registry_name: "retail_channels",
    entry_code: "showroom",
    label_it: "B2B Showroom Milano",
    label_en: "B2B Showroom",
    metadata: { commission_pct: 8.0 },
    is_active: true,
    sort_order: 1,
  },
  {
    id: 5,
    registry_domain: "pim",
    registry_name: "retail_channels",
    entry_code: "ecommerce",
    label_it: "E-Commerce Flagship",
    label_en: "Flagship Direct",
    metadata: { commission_pct: 0.0 },
    is_active: true,
    sort_order: 2,
  },
  {
    id: 6,
    registry_domain: "pim",
    registry_name: "retail_channels",
    entry_code: "wholesale",
    label_it: "Boutique Wholesale EU",
    label_en: "Wholesale Boutiques EU",
    metadata: { commission_pct: 12.0 },
    is_active: true,
    sort_order: 3,
  },
  {
    id: 7,
    registry_domain: "pim",
    registry_name: "certifications",
    entry_code: "lwg_gold",
    label_it: "Leather Working Group Gold",
    label_en: "LWG Gold Standard",
    metadata: { auditor: "LWG" },
    is_active: true,
    sort_order: 1,
  },
  {
    id: 8,
    registry_domain: "pim",
    registry_name: "certifications",
    entry_code: "reach",
    label_it: "Conforme Regolamento REACH UE",
    label_en: "EU REACH Compliant",
    metadata: { mandatory_eu: true },
    is_active: true,
    sort_order: 2,
  },
  {
    id: 9,
    registry_domain: "pim",
    registry_name: "certifications",
    entry_code: "grs",
    label_it: "Global Recycled Standard (GRS)",
    label_en: "GRS Recycled",
    metadata: { min_pct: 20 },
    is_active: true,
    sort_order: 3,
  },
  // PLM Registries
  {
    id: 10,
    registry_domain: "plm",
    registry_name: "production_phases",
    entry_code: "tanning_material",
    label_it: "Concia & Selezione Materie Prime",
    label_en: "Tanning & Material Selection",
    metadata: { department: "Conceria", lead_time_days: 14 },
    is_active: true,
    sort_order: 1,
  },
  {
    id: 11,
    registry_domain: "plm",
    registry_name: "production_phases",
    entry_code: "cutting",
    label_it: "Taglio CAD & Tranciatura",
    label_en: "CAD Cutting & Clicking",
    metadata: { department: "Taglio", lead_time_days: 4 },
    is_active: true,
    sort_order: 2,
  },
  {
    id: 12,
    registry_domain: "plm",
    registry_name: "production_phases",
    entry_code: "stitching_upper",
    label_it: "Giunteria & Cucitura Tomaia",
    label_en: "Closing & Upper Stitching",
    metadata: { department: "Giunteria", lead_time_days: 7 },
    is_active: true,
    sort_order: 3,
  },
  {
    id: 13,
    registry_domain: "plm",
    registry_name: "production_phases",
    entry_code: "lasting_assembly",
    label_it: "Montaggio su Forma & Suolatura",
    label_en: "Lasting & Bottom Assembly",
    metadata: { department: "Montaggio", lead_time_days: 5 },
    is_active: true,
    sort_order: 4,
  },
  {
    id: 14,
    registry_domain: "plm",
    registry_name: "production_phases",
    entry_code: "finishing",
    label_it: "Finissaggio & Stiratura",
    label_en: "Finishing & Burnishing",
    metadata: { department: "Finissaggio", lead_time_days: 3 },
    is_active: true,
    sort_order: 5,
  },
  {
    id: 15,
    registry_domain: "plm",
    registry_name: "production_phases",
    entry_code: "quality_control",
    label_it: "Controllo Qualità & Confezionamento",
    label_en: "Quality Inspection & Boxing",
    metadata: { department: "QA", lead_time_days: 2 },
    is_active: true,
    sort_order: 6,
  },
  {
    id: 16,
    registry_domain: "plm",
    registry_name: "component_types",
    entry_code: "upper",
    label_it: "Tomaia Principale",
    label_en: "Upper Shell",
    metadata: { bom_level: 1 },
    is_active: true,
    sort_order: 1,
  },
  {
    id: 17,
    registry_domain: "plm",
    registry_name: "component_types",
    entry_code: "lining",
    label_it: "Fodera Interna",
    label_en: "Inner Lining",
    metadata: { bom_level: 2 },
    is_active: true,
    sort_order: 2,
  },
  {
    id: 18,
    registry_domain: "plm",
    registry_name: "component_types",
    entry_code: "insole",
    label_it: "Sottopiede / Fusetto",
    label_en: "Insole / Shank Board",
    metadata: { bom_level: 2 },
    is_active: true,
    sort_order: 3,
  },
  {
    id: 19,
    registry_domain: "plm",
    registry_name: "component_types",
    entry_code: "outsole",
    label_it: "Suola / Fondo",
    label_en: "Outsole",
    metadata: { bom_level: 1 },
    is_active: true,
    sort_order: 4,
  },
  {
    id: 20,
    registry_domain: "plm",
    registry_name: "suppliers",
    entry_code: "conceria_chienti",
    label_it: "Conceria del Chienti Srl (Fermo)",
    label_en: "Chienti Tannery IT",
    metadata: { district: "Fermo-Macerata", rating: "A+" },
    is_active: true,
    sort_order: 1,
  },
  {
    id: 21,
    registry_domain: "plm",
    registry_name: "suppliers",
    entry_code: "conceria_santa_croce",
    label_it: "Conceria Santa Croce SpA (Pisa)",
    label_en: "Santa Croce Tannery IT",
    metadata: { district: "Santa Croce sull'Arno", rating: "A+" },
    is_active: true,
    sort_order: 2,
  },
  {
    id: 22,
    registry_domain: "plm",
    registry_name: "subcontractors",
    entry_code: "laboratorio_fm01",
    label_it: "Laboratorio Giunteria FM-01 (Fermo)",
    label_en: "FM-01 Upper Lab",
    metadata: { district: "Fermo", specialty: "Blake / Goodyear", license_cost: 0.0 },
    is_active: true,
    sort_order: 1,
  },
  {
    id: 23,
    registry_domain: "plm",
    registry_name: "size_scales",
    entry_code: "eu_shoes_woman",
    label_it: "Calzature Donna EU 35-42",
    label_en: "Women Shoes EU 35-42",
    metadata: { min: 35, max: 42, base: 37 },
    is_active: true,
    sort_order: 1,
  },
  {
    id: 24,
    registry_domain: "plm",
    registry_name: "size_scales",
    entry_code: "eu_shoes_man",
    label_it: "Calzature Uomo EU 38-46",
    label_en: "Men Shoes EU 38-46",
    metadata: { min: 38, max: 46, base: 42 },
    is_active: true,
    sort_order: 2,
  },
];

export const INITIAL_SCHEMA_ATTRIBUTES: SchemaAttributeDefinition[] = [
  // PIM Item attributes
  {
    attribute_id: "ATTR-PIM-GENDER",
    target_entity: "pim_item",
    field_key: "target_gender",
    label_it: "Genere Target",
    label_en: "Target Gender",
    field_type: "select",
    options: ["Uomo", "Donna", "Unisex", "Bambino"],
    is_required: false,
    default_value: "Unisex",
    group_name: "Commerciale & Marketing",
    is_system: true,
    description: "Segmentazione commerciale di collezione",
  },
  {
    attribute_id: "ATTR-PIM-SUST",
    target_entity: "pim_item",
    field_key: "sustainability_rating",
    label_it: "Rating Sostenibilità ESPR",
    label_en: "ESPR Sustainability Rating",
    field_type: "select",
    options: ["A - Eccellenza Circolare", "B - Alto Riciclo", "C - Standard UE ESPR"],
    is_required: false,
    default_value: "A - Eccellenza Circolare",
    group_name: "Sostenibilità & Normativa",
    is_system: false,
    description: "Grado di conformità circolare secondo la direttiva UE ESPR 2024/1781",
  },
  {
    attribute_id: "ATTR-PIM-DROP",
    target_entity: "pim_item",
    field_key: "collection_drop_number",
    label_it: "Numero Drop Campionario",
    label_en: "Sample Drop Number",
    field_type: "number",
    options: [],
    is_required: false,
    default_value: 1,
    group_name: "Commerciale & Marketing",
    is_system: false,
    description: "Sequenza di rilascio all'interno della collezione (Drop 1, 2, 3)",
  },
  // PLM Variant attributes
  {
    attribute_id: "ATTR-PLM-HEEL",
    target_entity: "plm_variant",
    field_key: "heel_height_mm",
    label_it: "Altezza Tacco (mm)",
    label_en: "Heel Height (mm)",
    field_type: "number",
    options: [],
    is_required: false,
    default_value: 22.0,
    group_name: "Specifiche Tecniche Fabbrica",
    is_system: false,
    description: "Quota millimetrica dell'altezza del tacco montato sulla forma",
  },
  {
    attribute_id: "ATTR-PLM-FINISH",
    target_entity: "plm_variant",
    field_key: "leather_finish",
    label_it: "Finitura Pellame",
    label_en: "Leather Finishing",
    field_type: "select",
    options: ["Spazzolato a Mano", "Anilina Naturale", "Scamosciato Idrorepellente", "Pieno Fiore Semilucido"],
    is_required: false,
    default_value: "Spazzolato a Mano",
    group_name: "Specifiche Tecniche Fabbrica",
    is_system: false,
    description: "Trattamento estetico e protettivo superficiale applicato sulla tomaia",
  },
  {
    attribute_id: "ATTR-PLM-WIDTH",
    target_entity: "plm_variant",
    field_key: "fitting_width",
    label_it: "Calzata Forma",
    label_en: "Fitting Width",
    field_type: "select",
    options: ["Stretta (C)", "Regolare (D/E)", "Comoda (EE)"],
    is_required: false,
    default_value: "Regolare (D/E)",
    group_name: "Specifiche Tecniche Fabbrica",
    is_system: false,
    description: "Larghezza di calzata calcolata sulla pianta della forma",
  },
  // BOM Item attributes
  {
    attribute_id: "ATTR-BOM-GRADE",
    target_entity: "bom_item",
    field_key: "batch_quality_grade",
    label_it: "Grado Selezione Materia Prima",
    label_en: "Raw Material Quality Grade",
    field_type: "select",
    options: ["Scelta I (Top Grade)", "Scelta II (Commerciale)", "Campionario"],
    is_required: false,
    default_value: "Scelta I (Top Grade)",
    group_name: "Controllo Qualità Fornitura",
    is_system: false,
    description: "Classificazione del lotto di pellame o componente ricevuto dal fornitore",
  },
];

export const INITIAL_PRODUCT_MODELS: ProductModel[] = [
  {
    model_id: "MOD-LOAFER-01",
    model_code: "MDL-FW-LOAFER",
    name: "Forma Mocassino Classico Duca",
    category: "footwear",
    target_gender: "Uomo",
    last_code: "FORMA-FM-108",
    sole_construction: "blake",
    heel_height_mm: 25.0,
    default_size_range: "38-46",
    season_id: "SEASON-PE26",
    collection_id: "COLL-SEASON-PE26-MAIN26",
    description: "Modello base mocassino con mascherina sagomata a mano e battistrada cucito Blake.",
    cad_drawing_ref: "CAD-2026-MC-01.dxf",
    is_active: true,
    products_count: 1,
  },
  {
    model_id: "MOD-SNEAKER-01",
    model_code: "MDL-FW-SNEAKER",
    name: "Forma Sneaker Cassetta Urban",
    category: "footwear",
    target_gender: "Unisex",
    last_code: "FORMA-SNK-202",
    sole_construction: "cassetta_cucita",
    heel_height_mm: 35.0,
    default_size_range: "36-46",
    season_id: "SEASON-PE26",
    collection_id: "COLL-SEASON-PE26-MAIN26",
    description: "Silhouette sneaker a cassetta con fondo gomma naturale e soletto estraibile.",
    cad_drawing_ref: "CAD-2026-SNK-02.dxf",
    is_active: true,
    products_count: 0,
  },
  {
    model_id: "MOD-TOTE-01",
    model_code: "MDL-LG-TOTE",
    name: "Cartamodello Shopping Tote Vela",
    category: "leather_goods",
    target_gender: "Donna",
    last_code: "PAT-TOTE-V1",
    sole_construction: "tubolare_sacchetto",
    heel_height_mm: 0.0,
    default_size_range: "TU",
    season_id: "SEASON-PE26",
    collection_id: "COLL-SEASON-PE26-MAIN26",
    description: "Cartamodello 3D tote bag sfoderata con costola tinta a mano e doppi manici rinforzati.",
    cad_drawing_ref: "CAD-2026-TOTE-01.cad",
    is_active: true,
    products_count: 1,
  },
  {
    model_id: "MOD-BOOT-01",
    model_code: "MDL-FW-CHELSEA",
    name: "Forma Stivaletto Chelsea Boot",
    category: "footwear",
    target_gender: "Uomo",
    last_code: "FORMA-BST-305",
    sole_construction: "goodyear",
    heel_height_mm: 30.0,
    default_size_range: "39-45",
    season_id: "SEASON-AI26",
    collection_id: "COLL-SEASON-AI26-CAPSULE",
    description: "Forma stivaletto chelsea inglese fondo roccia guardolo goodyear guardolo tempestato.",
    cad_drawing_ref: "CAD-2026-CHEL-03.dxf",
    is_active: true,
    products_count: 0,
  },
];

export const INITIAL_PIM_ITEMS: PimCommercialItem[] = [
  // =========================================================================
  // 1. CALZATURE (FOOTWEAR) — 1 PIM <-> 3 PLM Variants
  // =========================================================================
  {
    pim_item_id: "PIM-DUCA-001",
    sku_code: "FTL-FW26-LOAFER-01",
    model_name: "Mocassino Artigianale Duca",
    model_id: "MOD-LOAFER-01",
    brand_tenant_id: "TENANT-CALZATURIFICIO-ROSSI",
    season: "P/E 2026",
    season_id: "SEASON-PE26",
    collection_id: "COLL-SEASON-PE26-MAIN26",
    collection_name: "Main Collection",
    custom_attributes: {
      target_gender: "Uomo",
      sustainability_rating: "A - Eccellenza Circolare",
      collection_drop_number: 1,
    },
    category: "footwear",
    commercial_description_it:
      "Mocassino classico cucito Blake in vitello pieno fiore e camoscio certificato LWG Gold, lavorato nei distretti di Fermo-Macerata, Santa Croce sull'Arno e Riviera del Brenta.",
    commercial_description_en:
      "Blake-stitched artisanal loafer in LWG Gold certified full-grain calfskin and suede, crafted across Fermo-Macerata, Santa Croce sull'Arno, and Riviera del Brenta districts.",
    retail_channels: ["B2B Showroom Milano", "Shopify Flagship B2C", "Boutique Wholesale EU"],
    wholesale_price_eur: 165.0,
    retail_price_eur: 450.0,
    hs_customs_code: "6403.59.95",
    gtin_ean: "8050012026101",
    publishing_status: "PUBLISHED",
    care_instructions:
      "Spazzolare delicatamente dopo l'uso, nutrire con cera naturale certificata e conservare su tendiscarpe in cedro. Costruzione Blake interamente risuolabile.",
    end_of_life_guide:
      "Programma Take-Back Footlink: ritiro gratuito a fine vita per separazione tomaia in vitello, cambrione in acciaio e suola in cuoio vegetale.",
    plm_variants: [
      {
        plm_variant_id: "PLM-DUCA-NERO",
        pim_item_id: "PIM-DUCA-001",
        variant_code: "FTL-LOAFER-01-VIT-NERO",
        colorway_name: "Vitello Nero Spazzolato",
        primary_color_id: "MCOL-BLK-001",
        secondary_color_id: "MCOL-TAN-002",
        hardware_finish_color_id: "MCOL-SLV-011",
        colorway_rule_preset: "tone_on_tone",
        size_range: "38-46",
        last_or_pattern_code: "FORMA-FM-108",
        lifecycle_status: "in_production",
        bom_version: "v2.1 (Locked)",
        bom_snapshot_locked: true,
        sample_base_size: "42",
        size_grading_step_pct: 2.8,
        standard_labor_cost_eur: 31.5,
        category_specific_specs: {
          "Codice Forma (Last)": "FORMA-FM-108",
          "Calzata (Fitting)": "F (Regular Tailored)",
          "Sistema Scala Taglie": "EU 38-46 (Base 42)",
          "Tecnica Costruzione": "BLAKE_RAPID",
          "Taglio Tomaia": "TAGLIO_CAD_LAMA",
          "Sottopiede Montaggio": "Cuoio Rigenerato 3.5mm + Lamina Acciaio",
          "Codice Suola / Stampo": "SUOLA-CUOIO-TOSC-45",
          "Codice Tacco & Altezza": "TAC-22MM Cuoio Stratificato",
        },
        bom_items: [
          {
            bom_item_id: "BOM-DUCA-L1-UPPER",
            level: 1,
            parent_bom_item_id: null,
            component_type: "upper",
            material_name: "Tomaia Accoppiata Vitello Pieno Fiore Nero",
            supplier_name: "Conceria Santa Croce SpA",
            vendor_id: "VND-CONC-SC-01",
            master_color_id: "MCOL-BLK-001",
            origin_country_iso2: "IT",
            unit_of_measure: "sqft",
            unit_consumption: 3.15,
            waste_percentage: 7.5,
            recycled_content_pct: 20.0,
            certifications: ["LWG Gold", "REACH", "ISO 14001"],
            unit_cost_eur: 7.8,
            lot_certificate_id: "CERT-LWG-CSC-8810",
          },
          {
            bom_item_id: "BOM-DUCA-L2-LINING",
            level: 2,
            parent_bom_item_id: "BOM-DUCA-L1-UPPER",
            component_type: "lining",
            material_name: "Fodera Capra Concia Vegetale",
            supplier_name: "Conceria Montebello S.p.A.",
            vendor_id: "VND-CONC-ARZ-02",
            master_color_id: "MCOL-TAN-002",
            origin_country_iso2: "IT",
            unit_of_measure: "sqft",
            unit_consumption: 2.4,
            waste_percentage: 6.0,
            recycled_content_pct: 35.0,
            certifications: ["LWG Gold", "Pelle Conciata al Vegetale"],
            unit_cost_eur: 4.2,
            lot_certificate_id: "CERT-VEG-VLD-4412",
          },
          {
            bom_item_id: "BOM-DUCA-L3-THREAD",
            level: 3,
            parent_bom_item_id: "BOM-DUCA-L2-LINING",
            component_type: "sub_assembly",
            material_name: "Filato Cucitura Rinforzato rPET Titolo 20",
            supplier_name: "Filature Lombarde Srl",
            vendor_id: "VND-TEX-LOM-07",
            master_color_id: "MCOL-BLK-001",
            origin_country_iso2: "IT",
            unit_of_measure: "m",
            unit_consumption: 18.5,
            waste_percentage: 2.0,
            recycled_content_pct: 100.0,
            certifications: ["GRS", "OEKO-TEX Standard 100"],
            unit_cost_eur: 0.12,
            lot_certificate_id: "CERT-GRS-FLM-1902",
          },
          {
            bom_item_id: "BOM-DUCA-L1-SOLE",
            level: 1,
            parent_bom_item_id: null,
            component_type: "outsole",
            material_name: "Suola Cuoio Toscano Cucita Blake",
            supplier_name: "Suolificio Adriatico Srl",
            vendor_id: "VND-SUOL-FM-03",
            master_color_id: "MCOL-BLK-001",
            origin_country_iso2: "IT",
            unit_of_measure: "pair",
            unit_consumption: 1.0,
            waste_percentage: 3.0,
            recycled_content_pct: 30.0,
            certifications: ["LWG Silver", "REACH"],
            unit_cost_eur: 14.5,
            lot_certificate_id: "CERT-LWG-SAD-3109",
          },
          {
            bom_item_id: "BOM-DUCA-L2-HEEL",
            level: 2,
            parent_bom_item_id: "BOM-DUCA-L1-SOLE",
            component_type: "heel",
            material_name: "Tacco Stratificato Cuoio e Gomma Naturale",
            supplier_name: "Suolificio Adriatico Srl",
            vendor_id: "VND-SUOL-FM-03",
            master_color_id: "MCOL-BLK-001",
            origin_country_iso2: "IT",
            unit_of_measure: "pair",
            unit_consumption: 1.0,
            waste_percentage: 2.5,
            recycled_content_pct: 45.0,
            certifications: ["REACH", "FSC Mix"],
            unit_cost_eur: 5.4,
            lot_certificate_id: "CERT-FSC-TCM-7701",
          },
          {
            bom_item_id: "BOM-DUCA-L3-COMPOUND",
            level: 3,
            parent_bom_item_id: "BOM-DUCA-L2-HEEL",
            component_type: "sub_assembly",
            material_name: "Mescola Battistrada Gomma Vergine & Riciclata",
            supplier_name: "Suolificio Adriatico Srl",
            vendor_id: "VND-SUOL-FM-03",
            master_color_id: "MCOL-BLK-001",
            origin_country_iso2: "IT",
            unit_of_measure: "kg",
            unit_consumption: 0.18,
            waste_percentage: 1.5,
            recycled_content_pct: 65.0,
            certifications: ["GRS", "REACH"],
            unit_cost_eur: 6.0,
            lot_certificate_id: "CERT-GRS-GTC-5504",
          },
        ],
        subcontractor_assignments: [
          {
            assignment_id: "SUB-DUCA-01",
            subcontractor_name: "Conceria Santa Croce SpA",
            district: "Santa Croce sull'Arno",
            phase: "tanning_material",
            material_lot_code: "LOT-CSC-2026-104A",
            completed: true,
            confirmed_at: "2026-10-18T08:30:00Z",
          },
          {
            assignment_id: "SUB-DUCA-02",
            subcontractor_name: "Tomaificio Fratelli Bianchi",
            district: "Fermo-Macerata",
            phase: "stitching_upper",
            material_lot_code: "LOT-TFB-2026-219B",
            completed: true,
            confirmed_at: "2026-10-18T09:15:00Z",
          },
          {
            assignment_id: "SUB-DUCA-03",
            subcontractor_name: "Montaggio Artigiano Montegranaro",
            district: "Fermo-Macerata",
            phase: "lasting_assembly",
            material_lot_code: "LOT-MAM-2026-330C",
            completed: false,
            confirmed_at: null,
          },
        ],
      },
      {
        plm_variant_id: "PLM-DUCA-CUOIO",
        pim_item_id: "PIM-DUCA-001",
        variant_code: "FTL-LOAFER-01-CAM-CUOIO",
        colorway_name: "Camoscio Cuoio Idrorepellente",
        primary_color_id: "MCOL-TAN-002",
        secondary_color_id: "MCOL-ECR-005",
        hardware_finish_color_id: "MCOL-SLV-011",
        colorway_rule_preset: "tone_on_tone",
        size_range: "38-46",
        last_or_pattern_code: "FORMA-FM-108",
        lifecycle_status: "industrialized",
        bom_version: "v2.0 (Locked)",
        bom_snapshot_locked: true,
        sample_base_size: "42",
        size_grading_step_pct: 2.8,
        standard_labor_cost_eur: 29.0,
        category_specific_specs: {
          "Codice Forma (Last)": "FORMA-FM-108",
          "Calzata (Fitting)": "F (Regular Tailored)",
          "Sistema Scala Taglie": "EU 38-46 (Base 42)",
          "Tecnica Costruzione": "BLAKE",
          "Taglio Tomaia": "TRANCIA_FUSTELLA",
          "Sottopiede Montaggio": "Lattice Anatomico + Cuoio Rigenerato",
          "Codice Suola / Stampo": "SUOLA-BRENTA-LIGHT",
          "Codice Tacco & Altezza": "TAC-20MM Cuoio Naturale",
        },
        bom_items: [
          {
            bom_item_id: "BOM-DUCA2-L1-UPPER",
            level: 1,
            parent_bom_item_id: null,
            component_type: "upper",
            material_name: "Tomaia Camoscio Idrorepellente Cuoio Toscano",
            supplier_name: "Conceria Santa Croce SpA",
            vendor_id: "VND-CONC-SC-01",
            master_color_id: "MCOL-TAN-002",
            origin_country_iso2: "IT",
            unit_of_measure: "sqft",
            unit_consumption: 3.25,
            waste_percentage: 8.0,
            recycled_content_pct: 25.0,
            certifications: ["LWG Gold", "REACH"],
            unit_cost_eur: 7.2,
            lot_certificate_id: "CERT-LWG-CVP-2201",
          },
          {
            bom_item_id: "BOM-DUCA2-L2-INSOLE",
            level: 2,
            parent_bom_item_id: "BOM-DUCA2-L1-UPPER",
            component_type: "insole",
            material_name: "Sottopiede Anatomico Lattice e Cuoio Rigenerato",
            supplier_name: "Suolificio Adriatico Srl",
            vendor_id: "VND-SUOL-FM-03",
            master_color_id: "MCOL-ECR-005",
            origin_country_iso2: "IT",
            unit_of_measure: "pair",
            unit_consumption: 1.0,
            waste_percentage: 3.0,
            recycled_content_pct: 50.0,
            certifications: ["GRS", "REACH"],
            unit_cost_eur: 6.8,
            lot_certificate_id: "CERT-GRS-SBR-6120",
          },
          {
            bom_item_id: "BOM-DUCA2-L3-SHANK",
            level: 3,
            parent_bom_item_id: "BOM-DUCA2-L2-INSOLE",
            component_type: "hardware",
            material_name: "Cambrione Acciaio Temperato 85% Riciclato",
            supplier_name: "Galvanica EcoMarche Srl",
            vendor_id: "VND-GALV-FM-04",
            master_color_id: "MCOL-SLV-011",
            origin_country_iso2: "IT",
            unit_of_measure: "pair",
            unit_consumption: 1.0,
            waste_percentage: 1.0,
            recycled_content_pct: 85.0,
            certifications: ["GRS", "ISO 14001"],
            unit_cost_eur: 1.9,
            lot_certificate_id: "CERT-GRS-MMP-9012",
          },
        ],
        subcontractor_assignments: [
          {
            assignment_id: "SUB-DUCA-04",
            subcontractor_name: "Tranceria Riviera Srl",
            district: "Riviera del Brenta",
            phase: "cutting",
            material_lot_code: "LOT-TRV-2026-412A",
            completed: true,
            confirmed_at: "2026-10-18T10:00:00Z",
          },
          {
            assignment_id: "SUB-DUCA-05",
            subcontractor_name: "Finissaggio Artigiano Stra",
            district: "Riviera del Brenta",
            phase: "finishing",
            material_lot_code: "LOT-FAS-2026-518D",
            completed: false,
            confirmed_at: null,
          },
        ],
      },
      {
        plm_variant_id: "PLM-DUCA-BORDEAUX",
        pim_item_id: "PIM-DUCA-001",
        variant_code: "FTL-LOAFER-01-CRUST-BORD",
        colorway_name: "Crust Bordeaux Anticato Mano Cera",
        primary_color_id: "MCOL-RED-007",
        secondary_color_id: "MCOL-TAN-002",
        hardware_finish_color_id: "MCOL-GLD-010",
        colorway_rule_preset: "luxury_gold_hardware",
        size_range: "36-41",
        last_or_pattern_code: "FORMA-FM-108W",
        lifecycle_status: "sample",
        bom_version: "v1.2 (Sample Draft)",
        bom_snapshot_locked: false,
        sample_base_size: "37",
        size_grading_step_pct: 2.5,
        standard_labor_cost_eur: 33.0,
        category_specific_specs: {
          "Codice Forma (Last)": "FORMA-FM-108W",
          "Calzata (Fitting)": "E (Woman Tailored)",
          "Sistema Scala Taglie": "EU 36-41 (Base 37)",
          "Tecnica Costruzione": "GOODYEAR",
          "Taglio Tomaia": "MANO",
          "Sottopiede Montaggio": "Cuoio Scolpito per Guardolo Goodyear",
          "Codice Suola / Stampo": "SUOLA-GOODYEAR-W37",
          "Codice Tacco & Altezza": "TAC-25MM Cuoio Fasciato",
        },
        bom_items: [
          {
            bom_item_id: "BOM-DUCA3-L1-UPPER",
            level: 1,
            parent_bom_item_id: null,
            component_type: "upper",
            material_name: "Tomaia Crust Anticato Bordeaux",
            supplier_name: "Pellami Sud Import S.r.l.",
            vendor_id: "VND-CONC-SUD-09",
            master_color_id: "MCOL-RED-007",
            origin_country_iso2: "IT",
            unit_of_measure: "sqft",
            unit_consumption: 2.95,
            waste_percentage: 7.0,
            recycled_content_pct: 20.0,
            certifications: ["LWG Silver", "REACH"],
            unit_cost_eur: 8.1,
            lot_certificate_id: "CERT-LWG-CCH-3318",
          },
          {
            bom_item_id: "BOM-DUCA3-L2-CLAMP",
            level: 2,
            parent_bom_item_id: "BOM-DUCA3-L1-UPPER",
            component_type: "hardware",
            material_name: "Morsetto Frontale Ottone Nickel-Free",
            supplier_name: "Galvanica EcoMarche Srl",
            vendor_id: "VND-GALV-FM-04",
            master_color_id: "MCOL-GLD-010",
            origin_country_iso2: "IT",
            unit_of_measure: "pair",
            unit_consumption: 1.0,
            waste_percentage: 1.0,
            recycled_content_pct: 60.0,
            certifications: ["REACH", "OEKO-TEX"],
            unit_cost_eur: 6.5,
            lot_certificate_id: "CERT-RCH-AMC-7021",
          },
          {
            bom_item_id: "BOM-DUCA3-L3-GALV",
            level: 3,
            parent_bom_item_id: "BOM-DUCA3-L2-CLAMP",
            component_type: "sub_assembly",
            material_name: "Bagno Galvanico Eco-Gold Senza Cianuro",
            supplier_name: "Galvanica EcoMarche Srl",
            vendor_id: "VND-GALV-FM-04",
            master_color_id: "MCOL-GLD-010",
            origin_country_iso2: "IT",
            unit_of_measure: "pcs",
            unit_consumption: 2.0,
            waste_percentage: 0.5,
            recycled_content_pct: 50.0,
            certifications: ["ISO 14001", "REACH"],
            unit_cost_eur: 1.8,
            lot_certificate_id: "CERT-ISO-GEM-1180",
          },
        ],
        subcontractor_assignments: [
          {
            assignment_id: "SUB-DUCA-06",
            subcontractor_name: "Controllo Qualità Calzaturiero Marche",
            district: "Fermo-Macerata",
            phase: "quality_control",
            material_lot_code: "LOT-CQM-2026-601E",
            completed: true,
            confirmed_at: "2026-10-18T10:30:00Z",
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 2. PELLETTERIA (LEATHER GOODS) — 1 PIM <-> 2 PLM Variants
  // =========================================================================
  {
    pim_item_id: "PIM-VELA-002",
    sku_code: "FTL-FW26-TOTE-02",
    model_name: "Borsa Shopping Vela",
    model_id: "MOD-TOTE-01",
    brand_tenant_id: "TENANT-MAISON-FIRENZE",
    season: "FW26",
    category: "leather_goods",
    commercial_description_it:
      "Shopping bag strutturata in vacchetta toscana conciata al vegetale e grana dollaro, prodotta tra Scandicci, Santa Croce sull'Arno e Tolentino con tracciabilità DPP UE.",
    commercial_description_en:
      "Structured tote bag in vegetable-tanned Tuscan vachetta and grained calfskin, crafted across Scandicci, Santa Croce sull'Arno, and Tolentino with full EU DPP traceability.",
    retail_channels: ["Boutique Diretta", "Shopify E-Commerce Global", "Department Stores EU"],
    wholesale_price_eur: 240.0,
    retail_price_eur: 680.0,
    hs_customs_code: "4202.21.00",
    gtin_ean: "8050012026202",
    publishing_status: "PUBLISHED",
    care_instructions:
      "Proteggere da pioggia intensa, nutrire con balsamo neutro per vacchetta vegetale e riporre nella dustbag in cotone GOTS.",
    end_of_life_guide:
      "Servizio di rigenerazione costola/galvanica e ritiro garantito a fine vita presso Maison Firenze per recupero pellame e ottone.",
    plm_variants: [
      {
        plm_variant_id: "PLM-VELA-COGNAC",
        pim_item_id: "PIM-VELA-002",
        variant_code: "FTL-TOTE-02-VAC-COGNAC",
        colorway_name: "Vacchetta Cognac Naturale",
        primary_color_id: "MCOL-TAN-002",
        secondary_color_id: "MCOL-ECR-005",
        hardware_finish_color_id: "MCOL-GLD-010",
        colorway_rule_preset: "luxury_gold_hardware",
        size_range: "OS",
        last_or_pattern_code: "MOD-SCANDICCI-44",
        lifecycle_status: "in_production",
        bom_version: "v2.0 (Locked)",
        bom_snapshot_locked: true,
        sample_base_size: "OS (36x28x15 cm)",
        size_grading_step_pct: 0.0,
        standard_labor_cost_eur: 42.0,
        category_specific_specs: {
          "Codice Cartamodello / DXF": "MOD-SCANDICCI-44-DXF",
          "Dimensioni (L × A × P cm)": "36 × 28 × 15 cm (Luce manico 24 cm)",
          "Pellame & Concia": "VEGETABLE_TANNED (Consorzio Vera Pelle)",
          "Spessore Spaccatura / Scarnitura": "Spacco in testa 1.6mm / Scarnitura 0.7mm",
          "Rinforzi Interni": "Salpa Rigenerata Termoadesiva 0.9mm",
          "Accessori & Galvanica": "Ottone Spazzolato Nickel-Free 0.5 micron",
          "Costruzione Costola / Bordo": "TINGIBORDO_A_MANO_3_MANI (Base Acqua)",
          "Titolo Filo & Passo Cucitura": "Filo Lino/rPET Tit. 20, passo 3.5 pt/cm",
        },
        bom_items: [
          {
            bom_item_id: "BOM-VELA-L1-BODY",
            level: 1,
            parent_bom_item_id: null,
            component_type: "upper",
            material_name: "Quadranti Vacchetta Conciata al Vegetale",
            supplier_name: "Conceria Santa Croce SpA",
            vendor_id: "VND-CONC-SC-01",
            master_color_id: "MCOL-TAN-002",
            origin_country_iso2: "IT",
            unit_of_measure: "sqft",
            unit_consumption: 6.8,
            waste_percentage: 9.0,
            recycled_content_pct: 30.0,
            certifications: ["LWG Gold", "Pelle Conciata al Vegetale", "REACH"],
            unit_cost_eur: 8.4,
            lot_certificate_id: "CERT-VPT-SC-9901",
          },
          {
            bom_item_id: "BOM-VELA-L2-HANDLE",
            level: 2,
            parent_bom_item_id: "BOM-VELA-L1-BODY",
            component_type: "sub_assembly",
            material_name: "Manici Tubolari Cuciti a Mano",
            supplier_name: "Tomaificio Fratelli Bianchi",
            vendor_id: "VND-LAB-ORL-05",
            master_color_id: "MCOL-TAN-002",
            origin_country_iso2: "IT",
            unit_of_measure: "pair",
            unit_consumption: 1.0,
            waste_percentage: 4.0,
            recycled_content_pct: 40.0,
            certifications: ["LWG Gold", "REACH"],
            unit_cost_eur: 16.5,
            lot_certificate_id: "CERT-PAS-FI-8820",
          },
          {
            bom_item_id: "BOM-VELA-L3-ROPE",
            level: 3,
            parent_bom_item_id: "BOM-VELA-L2-HANDLE",
            component_type: "fabric",
            material_name: "Anima Interna Corda Canapa Rigenerata",
            supplier_name: "Filature Lombarde Srl",
            vendor_id: "VND-TEX-LOM-07",
            master_color_id: "MCOL-ECR-005",
            origin_country_iso2: "IT",
            unit_of_measure: "m",
            unit_consumption: 1.4,
            waste_percentage: 1.5,
            recycled_content_pct: 95.0,
            certifications: ["GRS", "OEKO-TEX Standard 100"],
            unit_cost_eur: 2.1,
            lot_certificate_id: "CERT-GRS-TPC-4410",
          },
        ],
        subcontractor_assignments: [
          {
            assignment_id: "SUB-VELA-01",
            subcontractor_name: "Conceria San Miniato Srl",
            district: "Santa Croce sull'Arno",
            phase: "tanning_material",
            material_lot_code: "LOT-CSM-2026-771A",
            completed: true,
            confirmed_at: "2026-10-18T08:45:00Z",
          },
          {
            assignment_id: "SUB-VELA-02",
            subcontractor_name: "Pelletteria Artigiana Scandicci",
            district: "Scandicci-Firenze",
            phase: "stitching_upper",
            material_lot_code: "LOT-PAS-2026-882B",
            completed: false,
            confirmed_at: null,
          },
        ],
      },
      {
        plm_variant_id: "PLM-VELA-OLIVA",
        pim_item_id: "PIM-VELA-002",
        variant_code: "FTL-TOTE-02-GRANA-OLIVA",
        colorway_name: "Vitello Grana Dollaro Verde Oliva",
        primary_color_id: "MCOL-GRN-008",
        secondary_color_id: "MCOL-ECR-005",
        hardware_finish_color_id: "MCOL-SLV-011",
        colorway_rule_preset: "luxury_palladium_hardware",
        size_range: "OS",
        last_or_pattern_code: "MOD-SCANDICCI-44",
        lifecycle_status: "industrialized",
        bom_version: "v2.0 (Locked)",
        bom_snapshot_locked: true,
        sample_base_size: "OS (36x28x15 cm)",
        size_grading_step_pct: 0.0,
        standard_labor_cost_eur: 39.5,
        category_specific_specs: {
          "Codice Cartamodello / DXF": "MOD-SCANDICCI-44-DXF",
          "Dimensioni (L × A × P cm)": "36 × 28 × 15 cm (Luce manico 24 cm)",
          "Pellame & Concia": "CHROME_FREE (LWG Gold Certified)",
          "Spessore Spaccatura / Scarnitura": "Spacco 1.4mm / Scarnitura 0.6mm",
          "Rinforzi Interni": "Microfibra Rinforzata GRS 0.8mm",
          "Accessori & Galvanica": "Palladio Spazzolato Nickel-Free",
          "Costruzione Costola / Bordo": "RIMBOCCATO",
          "Titolo Filo & Passo Cucitura": "Filo Poliestere GRS Tit. 25, passo 4 pt/cm",
        },
        bom_items: [
          {
            bom_item_id: "BOM-VELA2-L1-BODY",
            level: 1,
            parent_bom_item_id: null,
            component_type: "upper",
            material_name: "Quadranti Vitello Grana Dollaro Oliva",
            supplier_name: "Conceria Montebello S.p.A.",
            vendor_id: "VND-CONC-ARZ-02",
            master_color_id: "MCOL-GRN-008",
            origin_country_iso2: "IT",
            unit_of_measure: "sqft",
            unit_consumption: 6.6,
            waste_percentage: 8.5,
            recycled_content_pct: 25.0,
            certifications: ["LWG Gold", "REACH"],
            unit_cost_eur: 7.9,
            lot_certificate_id: "CERT-LWG-CTO-5501",
          },
          {
            bom_item_id: "BOM-VELA2-L2-ZIP",
            level: 2,
            parent_bom_item_id: "BOM-VELA2-L1-BODY",
            component_type: "hardware",
            material_name: "Chiusura Zip Metallica Palladio Spazzolato",
            supplier_name: "Galvanica EcoMarche Srl",
            vendor_id: "VND-GALV-FM-04",
            master_color_id: "MCOL-SLV-011",
            origin_country_iso2: "IT",
            unit_of_measure: "pcs",
            unit_consumption: 1.0,
            waste_percentage: 1.0,
            recycled_content_pct: 55.0,
            certifications: ["REACH"],
            unit_cost_eur: 9.2,
            lot_certificate_id: "CERT-RCH-MMF-3012",
          },
          {
            bom_item_id: "BOM-VELA2-L3-TAPE",
            level: 3,
            parent_bom_item_id: "BOM-VELA2-L2-ZIP",
            component_type: "fabric",
            material_name: "Nastro Supporto Zip 100% Poliestere Riciclato",
            supplier_name: "Filature Lombarde Srl",
            vendor_id: "VND-TEX-LOM-07",
            master_color_id: "MCOL-GRN-008",
            origin_country_iso2: "IT",
            unit_of_measure: "m",
            unit_consumption: 0.55,
            waste_percentage: 1.0,
            recycled_content_pct: 100.0,
            certifications: ["GRS", "OEKO-TEX Standard 100"],
            unit_cost_eur: 1.4,
            lot_certificate_id: "CERT-GRS-NEB-7741",
          },
        ],
        subcontractor_assignments: [
          {
            assignment_id: "SUB-VELA-03",
            subcontractor_name: "Laboratorio Pelletteria Tolentino",
            district: "Tolentino-Macerata",
            phase: "lasting_assembly",
            material_lot_code: "LOT-LPT-2026-910C",
            completed: true,
            confirmed_at: "2026-10-18T11:10:00Z",
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 3. ABBIGLIAMENTO (APPAREL) — 1 PIM <-> 2 PLM Variants
  // =========================================================================
  {
    pim_item_id: "PIM-BRERA-003",
    sku_code: "FTL-FW26-COAT-03",
    model_name: "Cappotto Sartoriale Brera",
    brand_tenant_id: "TENANT-ATELIER-MILANO",
    season: "FW26",
    category: "apparel",
    commercial_description_it:
      "Cappotto doppiopetto sartoriale in drappo di lana vergine e cashmere rigenerato GRS del distretto di Biella e Prato, confezionato in Umbria con tracciabilità DPP UE.",
    commercial_description_en:
      "Double-breasted tailored overcoat in Biella virgin wool and Prato GRS recycled cashmere cloth, tailored in Umbria with full EU ESPR Digital Product Passport traceability.",
    retail_channels: ["Showroom Milano", "Shopify Flagship B2C", "Luxury Multi-Brand"],
    wholesale_price_eur: 310.0,
    retail_price_eur: 890.0,
    hs_customs_code: "6201.20.00",
    gtin_ean: "8050012026303",
    publishing_status: "PUBLISHED",
    care_instructions:
      "Lavaggio a secco delicato (P), non candeggiare, stirare a vapore max 110°C con panno interposto. Bottoni in corozo sostituibili.",
    end_of_life_guide:
      "Rientro circolare nel distretto di Prato per sfilacciatura meccanica delle fibre di lana/cashmere e separazione fodera cupro.",
    plm_variants: [
      {
        plm_variant_id: "PLM-BRERA-NAVY",
        pim_item_id: "PIM-BRERA-003",
        variant_code: "FTL-COAT-03-DRAP-NAVY",
        colorway_name: "Blu Navy Notte Biella",
        primary_color_id: "MCOL-BLU-006",
        secondary_color_id: "MCOL-BLU-006",
        hardware_finish_color_id: "MCOL-SLV-011",
        colorway_rule_preset: "tone_on_tone",
        size_range: "IT 46-56",
        last_or_pattern_code: "CAD-COAT-BRERA-50",
        lifecycle_status: "in_production",
        bom_version: "v2.0 (Locked)",
        bom_snapshot_locked: true,
        sample_base_size: "IT 50",
        size_grading_step_pct: 3.4,
        standard_labor_cost_eur: 54.0,
        category_specific_specs: {
          "Vestibilità (Fit)": "TAILORED (Doppiopetto Strutturato)",
          "Scala Taglie Abbigliamento": "IT_46_56 (Taglia Base Campione IT 50)",
          "Composizione Fibrosa (%)": "75% Lana Vergine RWS, 25% Cashmere Riciclato GRS",
          "Grammatura & Altezza Pezza": "540 g/m² · Altezza utile 152 cm",
          "Variante Colore / Bagno Tintoria": "Navy Blue Pantone 19-4024 TCX · Bagno #44",
          "Tabella Punti di Misura (POM)": "Torace 112cm (±0.5), Spalla 47cm, Lunghezza 108cm",
          "Finissaggio Capo": "Decatissaggio a vapore Biella Zero-Formaldeide",
          "Simboli Manutenzione (ISO 3758)": "DRY_CLEAN_P · DO_NOT_BLEACH · IRON_LOW",
        },
        bom_items: [
          {
            bom_item_id: "BOM-BRERA-L1-FABRIC",
            level: 1,
            parent_bom_item_id: null,
            component_type: "fabric",
            material_name: "Drappo Lana RWS & Cashmere Rigenerato 540g",
            supplier_name: "Filature Lombarde Srl",
            vendor_id: "VND-TEX-LOM-07",
            master_color_id: "MCOL-BLU-006",
            origin_country_iso2: "IT",
            unit_of_measure: "m",
            unit_consumption: 2.35,
            waste_percentage: 6.5,
            recycled_content_pct: 25.0,
            certifications: ["GRS", "OEKO-TEX Standard 100", "REACH"],
            unit_cost_eur: 34.0,
            lot_certificate_id: "CERT-RWS-LSB-2091",
          },
          {
            bom_item_id: "BOM-BRERA-L2-LINING",
            level: 2,
            parent_bom_item_id: "BOM-BRERA-L1-FABRIC",
            component_type: "lining",
            material_name: "Fodera Bemberg Cupro Circolare",
            supplier_name: "Filature Lombarde Srl",
            vendor_id: "VND-TEX-LOM-07",
            master_color_id: "MCOL-BLU-006",
            origin_country_iso2: "IT",
            unit_of_measure: "m",
            unit_consumption: 1.9,
            waste_percentage: 5.0,
            recycled_content_pct: 60.0,
            certifications: ["GRS", "OEKO-TEX Standard 100"],
            unit_cost_eur: 8.5,
            lot_certificate_id: "CERT-GRS-TCS-6044",
          },
          {
            bom_item_id: "BOM-BRERA-L3-YARN",
            level: 3,
            parent_bom_item_id: "BOM-BRERA-L2-LINING",
            component_type: "sub_assembly",
            material_name: "Fiocco Cashmere Rigenerato Cardato Prato",
            supplier_name: "Filature Lombarde Srl",
            vendor_id: "VND-TEX-LOM-07",
            master_color_id: "MCOL-BLU-006",
            origin_country_iso2: "IT",
            unit_of_measure: "kg",
            unit_consumption: 0.42,
            waste_percentage: 2.0,
            recycled_content_pct: 100.0,
            certifications: ["GRS", "ISO 14001"],
            unit_cost_eur: 19.0,
            lot_certificate_id: "CERT-GRS-FCP-8812",
          },
        ],
        subcontractor_assignments: [
          {
            assignment_id: "SUB-BRERA-01",
            subcontractor_name: "Lanificio & Finissaggio Biella",
            district: "Biella-Piemonte",
            phase: "tanning_material",
            material_lot_code: "LOT-LFB-2026-301A",
            completed: true,
            confirmed_at: "2026-10-18T07:50:00Z",
          },
          {
            assignment_id: "SUB-BRERA-02",
            subcontractor_name: "Manifattura Sartoriale Perugia",
            district: "Perugia-Umbria",
            phase: "stitching_upper",
            material_lot_code: "LOT-MSP-2026-409B",
            completed: true,
            confirmed_at: "2026-10-18T11:30:00Z",
          },
        ],
      },
      {
        plm_variant_id: "PLM-BRERA-CAMEL",
        pim_item_id: "PIM-BRERA-003",
        variant_code: "FTL-COAT-03-DRAP-CAMEL",
        colorway_name: "Cammello Naturale Prato",
        primary_color_id: "MCOL-TAN-002",
        secondary_color_id: "MCOL-ECR-005",
        hardware_finish_color_id: "MCOL-BRN-003",
        colorway_rule_preset: "tone_on_tone",
        size_range: "IT 46-56",
        last_or_pattern_code: "CAD-COAT-BRERA-50",
        lifecycle_status: "sample",
        bom_version: "v1.1 (Sample Draft)",
        bom_snapshot_locked: false,
        sample_base_size: "IT 50",
        size_grading_step_pct: 3.4,
        standard_labor_cost_eur: 52.0,
        category_specific_specs: {
          "Vestibilità (Fit)": "REGULAR (Linea Classica)",
          "Scala Taglie Abbigliamento": "IT_46_56 (Taglia Base Campione IT 50)",
          "Composizione Fibrosa (%)": "70% Lana Cardata Rigenerata, 30% Cammello",
          "Grammatura & Altezza Pezza": "560 g/m² · Altezza utile 150 cm",
          "Variante Colore / Bagno Tintoria": "Natural Camel Non Tinto · Bagno #12",
          "Tabella Punti di Misura (POM)": "Torace 114cm (±0.5), Spalla 48cm, Lunghezza 109cm",
          "Finissaggio Capo": "Garzatura Naturale a Cardo Vegetale",
          "Simboli Manutenzione (ISO 3758)": "DRY_CLEAN_P · DO_NOT_BLEACH · IRON_LOW",
        },
        bom_items: [
          {
            bom_item_id: "BOM-BRERA2-L1-FABRIC",
            level: 1,
            parent_bom_item_id: null,
            component_type: "fabric",
            material_name: "Drappo Cammello & Lana Rigenerata Prato",
            supplier_name: "Filature Lombarde Srl",
            vendor_id: "VND-TEX-LOM-07",
            master_color_id: "MCOL-TAN-002",
            origin_country_iso2: "IT",
            unit_of_measure: "m",
            unit_consumption: 2.4,
            waste_percentage: 6.0,
            recycled_content_pct: 70.0,
            certifications: ["GRS", "REACH"],
            unit_cost_eur: 29.5,
            lot_certificate_id: "CERT-GRS-LCP-5102",
          },
          {
            bom_item_id: "BOM-BRERA2-L2-BUTTONS",
            level: 2,
            parent_bom_item_id: "BOM-BRERA2-L1-FABRIC",
            component_type: "hardware",
            material_name: "Bottoni Corozo Naturale Incisi Laser (Set 10 pz)",
            supplier_name: "Galvanica EcoMarche Srl",
            vendor_id: "VND-GALV-FM-04",
            master_color_id: "MCOL-BRN-003",
            origin_country_iso2: "IT",
            unit_of_measure: "pcs",
            unit_consumption: 10.0,
            waste_percentage: 1.0,
            recycled_content_pct: 100.0,
            certifications: ["FSC Mix", "OEKO-TEX Standard 100"],
            unit_cost_eur: 0.45,
            lot_certificate_id: "CERT-FSC-BBG-1190",
          },
        ],
        subcontractor_assignments: [
          {
            assignment_id: "SUB-BRERA-03",
            subcontractor_name: "Taglio CAD Sartoriale Empoli",
            district: "Empoli-Toscana",
            phase: "cutting",
            material_lot_code: "LOT-TCE-2026-712C",
            completed: false,
            confirmed_at: null,
          },
        ],
      },
    ],
  },
];

export function buildClientBomTree(bomItems: BomItem[]): BomTreeNode[] {
  const map = new Map<string, BomTreeNode>();
  for (const item of bomItems) {
    map.set(item.bom_item_id, { ...item, children: [] });
  }
  const roots: BomTreeNode[] = [];
  for (const item of bomItems) {
    const node = map.get(item.bom_item_id)!;
    if (item.level > 1 && item.parent_bom_item_id && map.has(item.parent_bom_item_id)) {
      map.get(item.parent_bom_item_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/**
 * FEAT-05: Deterministic 10-criteria PIM & ESPR Data Quality Score (0-100%)
 */
export function evaluateClientDataQuality(item: PimCommercialItem): PimDataQualityReport {
  const allBoms = item.plm_variants.flatMap((v) => v.bom_items);
  const allSubs = item.plm_variants.flatMap((v) => v.subcontractor_assignments);
  const certs = new Set(allBoms.flatMap((b) => b.certifications));
  const levels = new Set(allBoms.map((b) => b.level));

  const checks: Record<string, boolean> = {
    "01. Codice Master SKU & GTIN/EAN Univoco":
      item.sku_code.trim().length >= 3 && (item.gtin_ean || "8050012026").trim().length >= 8,
    "02. Descrizioni Commerciali Multilingua (IT + EN)":
      item.commercial_description_it.trim().length >= 15 &&
      item.commercial_description_en.trim().length >= 15,
    "03. Pricing Wholesale/Retail & Canali Omnicanale":
      (item.wholesale_price_eur ?? 150) > 0 &&
      (item.retail_price_eur ?? 400) > 0 &&
      item.retail_channels.length >= 1,
    "04. Codice Doganale HS & Stagione Commerciale":
      (item.hs_customs_code || "6403.59").trim().length >= 4 && item.season.trim().length >= 2,
    "05. Guida Cura, Riparabilità & Fine Vita Circolare":
      (item.care_instructions || "Pulire con panno").length >= 10 &&
      (item.end_of_life_guide || "Take-back").length >= 10,
    "06. Ponte Attivo 1 Articolo PIM ↔ N Varianti PLM": item.plm_variants.length >= 1,
    "07. Scheda Tecnica Verticale di Settore Compilata": item.plm_variants.some(
      (v) =>
        Object.keys(v.category_specific_specs || {}).length >= 3 ||
        v.last_or_pattern_code.trim().length >= 3
    ),
    "08. Distinta Base (BOM) Multi-Livello Strutturata":
      allBoms.length >= 2 && levels.size >= 2,
    "09. Conformità Chimica REACH / Certificazioni LWG-GRS": certs.size >= 1,
    "10. Tracciabilità Lotti & Terzisti Distrettuali (0 €)": allSubs.length >= 1,
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const score = passed * 10;
  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);

  return {
    pim_item_id: item.pim_item_id,
    sku_code: item.sku_code,
    model_name: item.model_name,
    data_quality_score: score,
    dpp_publication_unlocked: score >= 80,
    checks,
    missing_fields: missing,
  };
}

/**
 * Generate a deterministic client-side SVG QR code in Design System v2.0 (#111111 on #FFFFFF)
 */
export function buildClientQrSvgDataUri(skuCode: string, pimItemId: string): string {
  const size = 21;
  const cell = 8;
  const margin = 16;
  const width = size * cell + margin * 2;
  const height = width + 28;
  const rects: string[] = [];

  const isFinder = (r: number, c: number, ro: number, co: number) => {
    const dr = r - ro;
    const dc = c - co;
    if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return null;
    if (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)) {
      return true;
    }
    return false;
  };

  let hash = 2166136261;
  const seedStr = `${skuCode}|${pimItemId}|EU-DPP-V2`;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const f1 = isFinder(r, c, 0, 0);
      const f2 = isFinder(r, c, 0, size - 7);
      const f3 = isFinder(r, c, size - 7, 0);
      let dark = false;
      if (f1 !== null) dark = f1;
      else if (f2 !== null) dark = f2;
      else if (f3 !== null) dark = f3;
      else if (r === 6 || c === 6) dark = (r + c) % 2 === 0;
      else {
        const bit = Math.abs((hash ^ (r * 31 + c * 17)) % 7);
        dark = bit < 3;
      }
      if (dark) {
        rects.push(
          `<rect x="${margin + c * cell}" y="${margin + r * cell}" width="${cell}" height="${cell}" rx="1" fill="#111111"/>`
        );
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" rx="12" fill="#FFFFFF" stroke="#E5E5E5" stroke-width="2"/>
    ${rects.join("")}
    <rect x="${width / 2 - 24}" y="${(size * cell) / 2 + margin - 12}" width="48" height="24" rx="12" fill="#111111" stroke="#FFFFFF" stroke-width="2"/>
    <text x="${width / 2}" y="${(size * cell) / 2 + margin + 4}" text-anchor="middle" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="9.5" font-weight="800">EU DPP</text>
    <text x="${width / 2}" y="${height - 10}" text-anchor="middle" fill="#111111" font-family="monospace" font-size="9.5" font-weight="700">${skuCode}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function synthesizeClientDpp(item: PimCommercialItem): DigitalProductPassport {
  const countries = new Set<string>();
  const certs = new Set<string>();
  const recycledVals: number[] = [];
  const steps: SupplyChainStep[] = [];
  const subs = new Set<string>();
  const certAuditLog: Array<Record<string, unknown>> = [];

  let l1 = 0;
  let l2 = 0;
  let l3 = 0;
  let maxDepth = 1;
  let totalBom = 0;
  let completedSteps = 0;

  for (const variant of item.plm_variants) {
    for (const bom of variant.bom_items) {
      totalBom += 1;
      if (bom.level === 1) l1 += 1;
      else if (bom.level === 2) l2 += 1;
      else l3 += 1;
      if (bom.level > maxDepth) maxDepth = bom.level;
      countries.add(bom.origin_country_iso2);
      bom.certifications.forEach((c) => certs.add(c));
      recycledVals.push(bom.recycled_content_pct);
      certAuditLog.push({
        variant_code: variant.variant_code,
        bom_item_id: bom.bom_item_id,
        material_name: bom.material_name,
        supplier_legal_name: bom.supplier_name,
        origin_country_iso2: bom.origin_country_iso2,
        lot_certificate_id: bom.lot_certificate_id || "CERT-ESPR-2026-IT",
        certifications: bom.certifications,
      });
    }

    for (const assign of variant.subcontractor_assignments) {
      subs.add(assign.subcontractor_name);
      if (assign.completed) completedSteps += 1;
      steps.push({
        plm_variant_id: variant.plm_variant_id,
        variant_code: variant.variant_code,
        assignment_id: assign.assignment_id,
        phase: assign.phase,
        subcontractor: assign.subcontractor_name,
        district: assign.district,
        material_lot_code: assign.material_lot_code,
        completed: assign.completed,
        confirmed_at: assign.confirmed_at || null,
      });
    }
  }

  const avgRecycled =
    recycledVals.length > 0
      ? Number((recycledVals.reduce((a, b) => a + b, 0) / recycledVals.length).toFixed(2))
      : 0;

  const baseCo2 =
    item.category === "footwear" ? 14.8 : item.category === "leather_goods" ? 18.2 : 16.4;
  const co2 = Number((baseCo2 * (1 - avgRecycled / 250)).toFixed(2));
  const waterLiters = Number((baseCo2 * 8.4 * (1 - avgRecycled / 300)).toFixed(1));
  const repairability = certs.has("LWG Gold") || certs.has("GRS") ? 9.2 : 8.4;
  const dq = evaluateClientDataQuality(item);

  return {
    dpp_id: `DPP-EU-${item.sku_code}`,
    regulation_standard: "EU-ESPR-DPP-v1.0",
    pim_item_id: item.pim_item_id,
    sku_code: item.sku_code,
    model_name: item.model_name,
    category: item.category,
    brand_tenant_id: item.brand_tenant_id,
    public_qr_url: `https://dpp.footlink.eu/${item.brand_tenant_id}/${item.sku_code}`,
    qr_target_url: `http://127.0.0.1:8000/dpp/${item.pim_item_id}`,
    qr_svg_endpoint: `http://127.0.0.1:8000/api/v1/pim-items/${item.pim_item_id}/dpp-qr.svg`,
    qr_svg_data_uri: buildClientQrSvgDataUri(item.sku_code, item.pim_item_id),
    total_plm_variants_covered: item.plm_variants.length,
    countries_of_origin: Array.from(countries).sort(),
    certifications_verified: Array.from(certs).sort(),
    average_recycled_content_pct: avgRecycled,
    carbon_footprint_estimate_kg: co2,
    water_footprint_liters: waterLiters,
    repairability_index: repairability,
    data_quality_score: dq.data_quality_score,
    traceable_subcontractors_count: subs.size,
    completed_subcontractor_steps_count: completedSteps,
    total_subcontractor_steps_count: steps.length,
    bom_hierarchy_summary: {
      level_1_count: l1,
      level_2_count: l2,
      level_3_count: l3,
      max_depth_reached: maxDepth,
      total_components: totalBom,
    },
    espr_compliance_checklist: {
      unique_product_identifier: true,
      one_pim_to_n_plm_bridge: item.plm_variants.length >= 1,
      multilevel_bom_traceability: totalBom > 0,
      district_tier1_tier2_confirmed: steps.length > 0,
      chemical_reach_compliance: certs.has("REACH") || certs.has("LWG Gold"),
      circularity_and_repairability: avgRecycled > 0,
    },
    supply_chain_steps: steps,
    customs_inspector_dossier: {
      hs_customs_code: item.hs_customs_code || "6403.59.95",
      gtin_ean: item.gtin_ean || "8050012026101",
      brand_tenant_id: item.brand_tenant_id,
      espr_regulation_ref: "EU 2024/1781 (ESPR)",
      svhc_reach_status: "COMPLIANT_ZERO_SVHC_ABOVE_0_1_PCT",
      material_certificates_audit_log: certAuditLog,
    },
    generated_at: new Date().toISOString(),
    dpp_compliance_ready: countries.size > 0 && steps.length > 0,
  };
}

// ============================================================================
// Sprint 6 Mock Data: District Companies, Users, Batches & Production Orders
// ============================================================================

export const INITIAL_COMPANIES = [
  {
    company_id: "comp-ent-tods",
    legal_name: "Tod's S.p.A.",
    business_name: "Tod's Group",
    vat_number: "IT01112223334",
    district: "Fermo-Macerata",
    company_tier: "enterprise" as const,
    business_type: "brand" as const,
    contact_email: "governance@todsgroup.com",
    phone: "+39 0734 866111",
    website: "https://www.todsgroup.com",
    is_active: true,
  },
  {
    company_id: "comp-pmi-rossi",
    legal_name: "Calzaturificio Rossi S.r.l.",
    business_name: "Calzaturificio Rossi",
    vat_number: "IT01234567890",
    district: "Fermo-Macerata",
    company_tier: "pmi" as const,
    business_type: "manufacturer" as const,
    contact_email: "produzione@calzaturificiorossi.it",
    phone: "+39 0734 891234",
    is_active: true,
  },
  {
    company_id: "comp-pmi-montebello",
    legal_name: "Conceria Montebello S.p.A.",
    business_name: "Conceria Montebello",
    vat_number: "IT02345678901",
    district: "Arzignano / Valle del Chiampo",
    company_tier: "pmi" as const,
    business_type: "tannery" as const,
    contact_email: "qualita@montebello.it",
    phone: "+39 0444 670111",
    website: "https://www.conceriamontebello.com",
    is_active: true,
  },
  {
    company_id: "comp-lab-tomaificio",
    legal_name: "Tomaificio Façon Marche S.n.c.",
    business_name: "Tomaificio Façon Marche",
    vat_number: "IT03456789012",
    district: "Fermo-Macerata",
    company_tier: "subcontractor_zero_eur" as const,
    business_type: "subcontractor_lab" as const,
    contact_email: "laboratorio@tomaificiomarche.it",
    phone: "+39 333 4567890",
    is_active: true,
  },
  {
    company_id: "comp-lab-giunteria",
    legal_name: "Giunteria Adriatica Artigiana",
    business_name: "Giunteria Adriatica (0 €)",
    vat_number: "IT04567890123",
    district: "Civitanova Marche",
    company_tier: "subcontractor_zero_eur" as const,
    business_type: "subcontractor_lab" as const,
    contact_email: "giunteria@adriaticafacon.it",
    is_active: true,
  },
];

export const INITIAL_USERS = [
  {
    user_id: "usr-founder",
    email: "founder@footlink.eu",
    full_name: "Alessandro Ciminari (Founder)",
    is_platform_admin: true,
    is_active: true,
  },
  {
    user_id: "usr-brand-lead",
    email: "brand.lead@todsgroup.com",
    full_name: "Beatrice Moretti (Brand Manager)",
    is_platform_admin: false,
    is_active: true,
  },
  {
    user_id: "usr-factory-lead",
    email: "marco.rossi@calzaturificiorossi.it",
    full_name: "Marco Rossi (Resp. Produzione)",
    is_platform_admin: false,
    is_active: true,
  },
  {
    user_id: "usr-tannery-qa",
    email: "giovanni.concia@montebello.it",
    full_name: "Giovanni Montebello (Resp. Conceria)",
    is_platform_admin: false,
    is_active: true,
  },
  {
    user_id: "usr-artisan",
    email: "paolo.artigiano@tomaificiomarche.it",
    full_name: "Paolo Fermani (Maestro Orlatore)",
    is_platform_admin: false,
    is_active: true,
  },
];

export const INITIAL_MEMBERSHIPS = [
  {
    membership_id: "mem-01",
    company_id: "comp-ent-tods",
    user_id: "usr-founder",
    role: "brand_admin" as const,
    status: "active",
    user_full_name: "Alessandro Ciminari (Founder)",
    user_email: "founder@footlink.eu",
    company_business_name: "Tod's Group",
  },
  {
    membership_id: "mem-02",
    company_id: "comp-pmi-rossi",
    user_id: "usr-factory-lead",
    role: "factory_tech_lead" as const,
    status: "active",
    user_full_name: "Marco Rossi (Resp. Produzione)",
    user_email: "marco.rossi@calzaturificiorossi.it",
    company_business_name: "Calzaturificio Rossi",
  },
  {
    membership_id: "mem-03",
    company_id: "comp-pmi-montebello",
    user_id: "usr-tannery-qa",
    role: "tannery_operator" as const,
    status: "active",
    user_full_name: "Giovanni Montebello (Resp. Conceria)",
    user_email: "giovanni.concia@montebello.it",
    company_business_name: "Conceria Montebello",
  },
  {
    membership_id: "mem-04",
    company_id: "comp-lab-tomaificio",
    user_id: "usr-artisan",
    role: "subcontractor_operator" as const,
    status: "active",
    user_full_name: "Paolo Fermani (Maestro Orlatore)",
    user_email: "paolo.artigiano@tomaificiomarche.it",
    company_business_name: "Tomaificio Façon Marche",
  },
];

export const INITIAL_TANNERY_BATCHES: TanneryBatch[] = [
  {
    batch_id: "batch-montebello-lwg-gold",
    company_id: "comp-pmi-montebello",
    batch_code: "LOT-MONTEBELLO-2026-X9",
    tannery_name: "Conceria Montebello S.p.A.",
    vendor_id: "VND-CONC-ARZ-02",
    master_color_id: "MCOL-TAN-002",
    district: "Arzignano / Valle del Chiampo",
    leather_type: "Fodera Capra Concia Vegetale",
    tanning_process: "metal_free" as const,
    raw_hide_origin_country: "IT",
    slaughterhouse_traceability_id: "EU-SLAUGHTER-8841-VR",
    eudr_deforestation_free: true,
    lwg_rating: "Gold",
    lwg_score_pct: 95.2,
    icec_certificate_id: "ICEC-TS410-0982",
    reach_svhc_compliant: true,
    chrome_vi_content_ppm: 0.0,
    thickness_mm: "1.0 - 1.2 mm",
    available_qty_sqft: 4500.0,
    metadata: {
      bom_material_id: "BOM-DUCA-L2-LINING",
      bom_material_name: "Fodera Capra Concia Vegetale",
    },
    is_active: true,
    documents: [
      {
        document_id: "doc-lwg-gold",
        batch_id: "batch-montebello-lwg-gold",
        doc_type: "lwg_certificate" as const,
        file_name: "Certificato_LWG_Gold_Audit_2026_Montebello.pdf",
        mime_type: "application/pdf",
        file_size_bytes: 24810,
        sha256_hash: "3b29c9bb8c9e4a3b8e4e7e6f8a9d1c2b3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
        valid_until: "2027-12-31",
        is_verified: true,
      },
      {
        document_id: "doc-icec-trace",
        batch_id: "batch-montebello-lwg-gold",
        doc_type: "icec_traceability" as const,
        file_name: "ICEC_TS410_Tracciabilita_Filiera_Allevamento_Italia.pdf",
        mime_type: "application/pdf",
        file_size_bytes: 18450,
        sha256_hash: "5f4dcc3b5aa765d61d8327deb882cf992b9699aaf4e4b7c6c4e1f7c227f54921",
        valid_until: "2028-06-30",
        is_verified: true,
      },
    ],
  },
  {
    batch_id: "batch-santacroce-nero-01",
    company_id: "comp-pmi-rossi",
    batch_code: "LOT-CSC-2026-104A",
    tannery_name: "Conceria Santa Croce SpA",
    vendor_id: "VND-CONC-SC-01",
    master_color_id: "MCOL-BLK-001",
    district: "Toscana · Santa Croce sull'Arno",
    leather_type: "Tomaia Accoppiata Vitello Pieno Fiore Nero",
    tanning_process: "vegetable" as const,
    raw_hide_origin_country: "IT",
    slaughterhouse_traceability_id: "EU-SLAUGHTER-4102-PI",
    eudr_deforestation_free: true,
    lwg_rating: "Gold",
    lwg_score_pct: 97.4,
    icec_certificate_id: "ICEC-TS410-1104",
    reach_svhc_compliant: true,
    chrome_vi_content_ppm: 0.0,
    thickness_mm: "1.3 - 1.5 mm",
    available_qty_sqft: 6200.0,
    metadata: {
      bom_material_id: "BOM-DUCA-L1-UPPER",
      bom_material_name: "Tomaia Accoppiata Vitello Pieno Fiore Nero",
    },
    is_active: true,
    documents: [
      {
        document_id: "doc-csc-lwg",
        batch_id: "batch-santacroce-nero-01",
        doc_type: "lwg_certificate" as const,
        file_name: "Certificato_LWG_Gold_SantaCroce_2026.pdf",
        mime_type: "application/pdf",
        file_size_bytes: 31200,
        sha256_hash: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
        valid_until: "2027-09-30",
        is_verified: true,
      },
    ],
  },
  {
    batch_id: "batch-sud-import-mismatch",
    company_id: "comp-pmi-rossi",
    batch_code: "LOT-SOLOFRA-2026-ERR14",
    tannery_name: "Pellami Sud Import S.r.l.",
    vendor_id: "VND-CONC-SUD-09",
    master_color_id: "MCOL-BRN-003",
    district: "Campania · Solofra",
    leather_type: "Tomaia Crust Anticato (Bagno Difforme Moro vs Bordeaux)",
    tanning_process: "chrome" as const,
    raw_hide_origin_country: "IT",
    slaughterhouse_traceability_id: "EU-SLAUGHTER-7719-AV",
    eudr_deforestation_free: false,
    lwg_rating: "Silver",
    lwg_score_pct: 74.0,
    icec_certificate_id: "ICEC-EXPIRED-041",
    reach_svhc_compliant: true,
    chrome_vi_content_ppm: 1.1,
    thickness_mm: "1.2 - 1.4 mm",
    available_qty_sqft: 1850.0,
    metadata: {
      bom_material_id: "BOM-DUCA3-L1-UPPER",
      bom_material_name: "Tomaia Crust Anticato Bordeaux",
    },
    is_active: true,
    documents: [],
  },
];

export const INITIAL_PRODUCTION_ORDERS = [
  {
    order_id: "ord-seed-001",
    order_code: "COMM-2026-PE-084",
    company_id: "comp-pmi-rossi",
    plm_variant_id: "PLM-DUCA-NERO",
    pim_item_id: "PIM-DUCA-001",
    variant_code: "FTL-DUCA-NERO-A1",
    model_name: "Mocassino Artigianale Duca",
    season_id: "SEASON-PE26",
    collection_id: "COLL-SEASON-PE26-MAIN26",
    tannery_batch_id: "batch-montebello-lwg-gold",
    tannery_batch_code: "LOT-MONTEBELLO-2026-X9",
    status: "in_production" as const,
    total_planned_pairs: 500,
    total_completed_pairs: 160,
    total_scrapped_pairs: 2,
    target_delivery_date: "2026-05-30",
    notes: "Commessa lancio P/E 2026 calzatura classica Blake in vitello anilina LWG Gold con suola cuoio.",
    size_breakdown: [
      { size_code: "39", planned_quantity: 40, completed_quantity: 40, scrapped_quantity: 0 },
      { size_code: "40", planned_quantity: 80, completed_quantity: 60, scrapped_quantity: 1 },
      { size_code: "41", planned_quantity: 120, completed_quantity: 60, scrapped_quantity: 1 },
      { size_code: "42", planned_quantity: 140, completed_quantity: 0, scrapped_quantity: 0 },
      { size_code: "43", planned_quantity: 80, completed_quantity: 0, scrapped_quantity: 0 },
      { size_code: "44", planned_quantity: 40, completed_quantity: 0, scrapped_quantity: 0 },
    ],
    phases: [
      {
        phase_id: "ph-01",
        order_id: "ord-seed-001",
        phase_code: "cutting" as const,
        phase_sequence: 1,
        subcontractor_name: "Taglio CAD Marchigiano",
        district: "Fermo-Macerata",
        status: "completed",
        target_quantity: 500,
        conform_quantity: 498,
        scrapped_quantity: 2,
        material_lot_code: "LOT-MONTEBELLO-2026-X9",
        magic_token: "tok-cutting-seed-01",
        operator_notes: "Taglio eseguito a controllo numerico con tolleranza 0.2mm",
      },
      {
        phase_id: "ph-02",
        order_id: "ord-seed-001",
        phase_code: "stitching_upper" as const,
        phase_sequence: 2,
        subcontractor_name: "Tomaificio Façon Marche (0 EUR)",
        subcontractor_id: "comp-lab-tomaificio",
        district: "Montegranaro",
        status: "in_progress",
        target_quantity: 498,
        conform_quantity: 160,
        scrapped_quantity: 0,
        material_lot_code: "LOT-MONTEBELLO-2026-X9",
        magic_token: "tok-stitch-seed-02",
      },
      {
        phase_id: "ph-03",
        order_id: "ord-seed-001",
        phase_code: "lasting_assembly" as const,
        phase_sequence: 3,
        subcontractor_name: "Manovia Montaggio Adriatica",
        subcontractor_id: "comp-lab-giunteria",
        district: "Civitanova Marche",
        status: "pending",
        target_quantity: 498,
        conform_quantity: 0,
        scrapped_quantity: 0,
        material_lot_code: "LOT-SUOLA-CUOIO-26",
        magic_token: "tok-lasting-seed-03",
      },
      {
        phase_id: "ph-04",
        order_id: "ord-seed-001",
        phase_code: "finishing" as const,
        phase_sequence: 4,
        subcontractor_name: "Reparto Finissaggio & Confezione",
        district: "Fermo",
        status: "pending",
        target_quantity: 498,
        conform_quantity: 0,
        scrapped_quantity: 0,
        material_lot_code: "",
        magic_token: "tok-finish-seed-04",
      },
      {
        phase_id: "ph-05",
        order_id: "ord-seed-001",
        phase_code: "quality_control" as const,
        phase_sequence: 5,
        subcontractor_name: "Collaudo Finale & Packaging QA",
        district: "Fermo",
        status: "pending",
        target_quantity: 498,
        conform_quantity: 0,
        scrapped_quantity: 0,
        material_lot_code: "",
        magic_token: "tok-qa-seed-05",
      },
    ],
  },
];

// ============================================================================
// Sprint 8 (Epoca II - La Verticalizzazione):
// 1. Color Intelligence Engine, Lab-Dip & Colorway BOM Matrix (FTL-TECH-022)
// 2. Vendor Hub 360°, Certifications, Scorecard L6 & Where-Used (FTL-TECH-023)
// ============================================================================

function offsetIsoDateFromToday(daysOffset: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

export const INITIAL_MASTER_COLORS: MasterColor[] = [
  {
    id: "MCOL-BLK-001",
    color_id: "MCOL-BLK-001",
    color_code: "COL-BLK-001",
    technical_name_it: "Nero Vitello Anilina",
    technical_name_en: "Aniline Calf Black",
    commercial_family: "Nero",
    hex_code: "#141414",
    pantone_tcx_code: "19-4005 TCX",
    ral_code: "RAL 9005",
    finish_type: "pieno_fiore_anilina",
    applicable_domains: ["pellame", "fodera", "suola", "filati"],
    season_id: null,
    season_ids: ["CARRYOVER"],
    recipe_notes: "Tintura passante in bottale a base acqua, rifinizione anilina pura senza pigmenti coprenti (ΔE target ≤ 0.8).",
    is_active: true,
    created_at: "2026-01-10T09:00:00Z",
  },
  {
    id: "MCOL-TAN-002",
    color_id: "MCOL-TAN-002",
    color_code: "COL-TAN-002",
    technical_name_it: "Cuoio Naturale Toscano",
    technical_name_en: "Tuscan Natural Tan",
    commercial_family: "Marrone / Cuoio",
    hex_code: "#C68B59",
    pantone_tcx_code: "17-1230 TCX",
    ral_code: "RAL 8023",
    finish_type: "concia_vegetale_naturale",
    applicable_domains: ["pellame", "fodera", "suola", "filati"],
    season_id: null,
    season_ids: ["CARRYOVER"],
    recipe_notes: "Tannini naturali di castagno e quebracho Santa Croce sull'Arno, ingrassaggio leggero a sego vegetale.",
    is_active: true,
    created_at: "2026-01-10T09:05:00Z",
  },
  {
    id: "MCOL-BRN-003",
    color_id: "MCOL-BRN-003",
    color_code: "COL-BRN-003",
    technical_name_it: "Testa di Moro Scamosciato",
    technical_name_en: "Dark Espresso Suede",
    commercial_family: "Marrone / Cuoio",
    hex_code: "#4A2E1B",
    pantone_tcx_code: "19-1217 TCX",
    ral_code: "RAL 8017",
    finish_type: "scamosciato_velour",
    applicable_domains: ["pellame", "minuterie", "filati"],
    season_id: "SEASON-AI26",
    season_ids: ["SEASON-AI26"],
    recipe_notes: "Smerigliatura fine 400 grit, idrorepellenza fluorocarbon-free PFAS-0 verificata REACH.",
    is_active: true,
    created_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "MCOL-WHT-004",
    color_id: "MCOL-WHT-004",
    color_code: "COL-WHT-004",
    technical_name_it: "Bianco Ottico Nappa",
    technical_name_en: "Optic White Nappa",
    commercial_family: "Bianco / Panna",
    hex_code: "#F8F8F6",
    pantone_tcx_code: "11-0601 TCX",
    ral_code: "RAL 9016",
    finish_type: "nappa_opaca",
    applicable_domains: ["pellame", "fodera", "suola", "filati"],
    season_id: "SEASON-PE26",
    season_ids: ["SEASON-PE26"],
    recipe_notes: "Concia wet-white esente da cromo, test anti-ingiallimento UV superato 72h ISO 105-B02.",
    is_active: true,
    created_at: "2026-01-18T11:00:00Z",
  },
  {
    id: "MCOL-ECR-005",
    color_id: "MCOL-ECR-005",
    color_code: "COL-ECR-005",
    technical_name_it: "Panna / Avorio Fodera",
    technical_name_en: "Natural Ivory Lining",
    commercial_family: "Bianco / Panna",
    hex_code: "#F5F2EB",
    pantone_tcx_code: "11-0105 TCX",
    ral_code: "RAL 9001",
    finish_type: "pieno_fiore_anilina",
    applicable_domains: ["fodera", "filati", "packaging"],
    season_id: null,
    season_ids: ["CARRYOVER"],
    recipe_notes: "Standard fodera capra/vitello metal-free ipoallergenica con solidità allo sfregamento a umido ≥ 4/5.",
    is_active: true,
    created_at: "2026-01-20T09:30:00Z",
  },
  {
    id: "MCOL-BLU-006",
    color_id: "MCOL-BLU-006",
    color_code: "COL-BLU-006",
    technical_name_it: "Blu Notte Riviera",
    technical_name_en: "Riviera Midnight Blue",
    commercial_family: "Blu",
    hex_code: "#1B2A4A",
    pantone_tcx_code: "19-4024 TCX",
    ral_code: "RAL 5011",
    finish_type: "pieno_fiore_anilina",
    applicable_domains: ["pellame", "fodera", "filati"],
    season_id: "SEASON-AI26",
    season_ids: ["SEASON-PE26", "SEASON-AI26"],
    recipe_notes: "Punto blu profondo sotto illuminante D65 e TL84 senza metamerismo verso il viola.",
    is_active: true,
    created_at: "2026-02-02T14:15:00Z",
  },
  {
    id: "MCOL-RED-007",
    color_id: "MCOL-RED-007",
    color_code: "COL-RED-007",
    technical_name_it: "Bordeaux Spazzolato",
    technical_name_en: "Brushed Cordovan Burgundy",
    commercial_family: "Bordeaux / Rosso",
    hex_code: "#5E1914",
    pantone_tcx_code: "19-1627 TCX",
    ral_code: "RAL 3005",
    finish_type: "spazzolato_abrasivato",
    applicable_domains: ["pellame", "suola", "filati"],
    season_id: "SEASON-AI26",
    season_ids: ["SEASON-AI26"],
    recipe_notes: "Fondo crust bordeaux con velatura cera carnauba spazzolata in manovia a 900 rpm.",
    is_active: true,
    created_at: "2026-02-05T15:20:00Z",
  },
  {
    id: "MCOL-GRN-008",
    color_id: "MCOL-GRN-008",
    color_code: "COL-GRN-008",
    technical_name_it: "Verde Bosco Montegranaro",
    technical_name_en: "Montegranaro Forest Green",
    commercial_family: "Verde",
    hex_code: "#2D4028",
    pantone_tcx_code: "19-6026 TCX",
    ral_code: "RAL 6005",
    finish_type: "stampa_dollaro_cervo",
    applicable_domains: ["pellame", "filati"],
    season_id: "SEASON-AI26",
    season_ids: ["SEASON-AI26"],
    recipe_notes: " Bottalatura morbida 8 ore grana dollaro naturale, mano burrosa per pelletteria e mocassino destrutturato.",
    is_active: true,
    created_at: "2026-02-10T10:40:00Z",
  },
  {
    id: "MCOL-GLD-010",
    color_id: "MCOL-GLD-010",
    color_code: "COL-GLD-010",
    technical_name_it: "Oro Chiaro 24K Nickel-Free",
    technical_name_en: "24K Light Gold Nickel-Free",
    commercial_family: "Oro / Metallizzato",
    hex_code: "#D4AF37",
    pantone_tcx_code: "16-0836 TCX",
    ral_code: "RAL 1036",
    finish_type: "galvanica_oro_24k",
    applicable_domains: ["minuterie", "packaging"],
    season_id: null,
    season_ids: ["CARRYOVER"],
    recipe_notes: "Spessore deposito galvanico 0.5 micron Au 24K esente cianuro e nichel (EN 1811 conforme), nebbia salina 96h.",
    is_active: true,
    created_at: "2026-01-12T08:00:00Z",
  },
  {
    id: "MCOL-SLV-011",
    color_id: "MCOL-SLV-011",
    color_code: "COL-SLV-011",
    technical_name_it: "Palladio Spazzolato",
    technical_name_en: "Brushed Palladium",
    commercial_family: "Argento / Palladio",
    hex_code: "#C0C5CE",
    pantone_tcx_code: "14-4102 TCX",
    ral_code: "RAL 9006",
    finish_type: "galvanica_palladio",
    applicable_domains: ["minuterie"],
    season_id: null,
    season_ids: ["CARRYOVER"],
    recipe_notes: "Finitura palladio satinato anti-impronta PVD/galvanica ipoallergenica REACH Allegato XVII.",
    is_active: true,
    created_at: "2026-01-12T08:15:00Z",
  },
];

export function computeDaysToExpiry(validUntilIso: string): number {
  if (!validUntilIso) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(validUntilIso);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function computeVendorRating(
  qualityScore?: number | null,
  otdScore?: number | null,
  esgScore?: number | null
): { overall_rating: number; rating_class: string } {
  const q = typeof qualityScore === "number" ? qualityScore : 80;
  const o = typeof otdScore === "number" ? otdScore : 80;
  const e = typeof esgScore === "number" ? esgScore : 80;
  const overall = Math.round((0.4 * q + 0.3 * o + 0.3 * e) * 10) / 10;
  let ratingClass = "C";
  if (overall >= 92) ratingClass = "A+";
  else if (overall >= 82) ratingClass = "A";
  else if (overall >= 70) ratingClass = "B";
  return { overall_rating: overall, rating_class: ratingClass };
}

export function evaluateVendorCertificationsSemaphore(
  certs: VendorCertification[]
): {
  certifications: VendorCertification[];
  has_expired_critical_certs: boolean;
  cert_semaphore_status: "green" | "yellow" | "red";
} {
  let hasExpired = false;
  let hasExpiringSoon = false;

  const enriched = (certs || []).map((cert) => {
    const days = computeDaysToExpiry(cert.valid_until);
    let status: VendorCertification["status"] = cert.status;
    if (status !== "revoked") {
      if (days < 0) {
        status = "expired";
      } else if (days <= 60) {
        status = "expiring_soon";
      } else {
        status = "valid";
      }
    }
    if (status === "expired" || status === "revoked") {
      hasExpired = true;
    } else if (status === "expiring_soon") {
      hasExpiringSoon = true;
    }
    return {
      ...cert,
      days_to_expiry: days,
      status,
    };
  });

  const semaphore: "green" | "yellow" | "red" = hasExpired
    ? "red"
    : hasExpiringSoon
    ? "yellow"
    : "green";

  return {
    certifications: enriched,
    has_expired_critical_certs: hasExpired,
    cert_semaphore_status: semaphore,
  };
}

const RAW_INITIAL_VENDORS: VendorRecord[] = [
  {
    vendor_id: "VND-CONC-SC-01",
    vendor_code: "FOR-CONC-001",
    company_name: "Conceria Santa Croce S.p.A.",
    vat_number: "IT01482910504",
    supply_chain_role: "conceria",
    district_area: "Toscana - Santa Croce sull'Arno",
    city_address: "Via del Bosco 42, 56029 Santa Croce sull'Arno (PI)",
    country_iso2: "IT",
    paas_tier: "enterprise",
    qualification_status: "qualified",
    quality_score: 97,
    otd_score: 94,
    esg_score: 98,
    overall_rating: 96.4,
    rating_class: "A+",
    standard_lead_time_days: 18,
    moq_description: "300 sqft per colore continuativo · 600 sqft tinta a campione",
    payment_terms_l6: "Ri.Ba. 60 gg F.M.",
    hourly_or_unit_rate_eur_l6: 9.2,
    negotiated_price_list_l6: [
      {
        item_code: "PEL-VIT-ANI-14",
        description: "Vitello Pieno Fiore Anilina 1.3-1.5mm LWG Gold",
        uom: "sqft",
        unit_price_eur: 9.2,
      },
      {
        item_code: "PEL-VAC-VEG-16",
        description: "Vacchetta Conciata al Vegetale Toscana 1.6mm",
        uom: "sqft",
        unit_price_eur: 8.4,
      },
    ],
    internal_audit_notes_l6: "Partner strategico Tier-1 per tomaie vitello e vacchetta vegetale. Sconto volume 3.5% oltre 18.000 sqft/stagione.",
    contact_email: "qualita@concertsantacroce.it",
    certifications: [
      {
        cert_id: "VCERT-SC-01",
        vendor_id: "VND-CONC-SC-01",
        cert_type: "LWG_GOLD",
        cert_code: "LWG-IT-SC-9841-GOLD",
        issuing_body: "Leather Working Group (BLC Audit)",
        valid_from: "2025-09-01",
        valid_until: offsetIsoDateFromToday(340),
        sha256_hash: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
        status: "valid",
      },
      {
        cert_id: "VCERT-SC-02",
        vendor_id: "VND-CONC-SC-01",
        cert_type: "EUDR_DUE_DILIGENCE",
        cert_code: "EUDR-DDS-2026-IT-4401",
        issuing_body: "EU TRACES Deforestation-Free Registry",
        valid_from: "2026-01-01",
        valid_until: offsetIsoDateFromToday(260),
        sha256_hash: "4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c",
        status: "valid",
      },
      {
        cert_id: "VCERT-SC-03",
        vendor_id: "VND-CONC-SC-01",
        cert_type: "ICEC_TS410",
        cert_code: "ICEC-TS410-1104",
        issuing_body: "ICEC Istituto Certificazione Area Pelle",
        valid_from: "2025-06-15",
        valid_until: offsetIsoDateFromToday(295),
        sha256_hash: "7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f",
        status: "valid",
      },
    ],
    is_active: true,
    created_at: "2026-01-05T08:30:00Z",
  },
  {
    vendor_id: "VND-CONC-ARZ-02",
    vendor_code: "FOR-CONC-002",
    company_name: "Conceria Montebello S.p.A.",
    vat_number: "IT02894120247",
    supply_chain_role: "conceria",
    district_area: "Veneto - Arzignano",
    city_address: "Via dell'Industria Conciaria 18, 36071 Arzignano (VI)",
    country_iso2: "IT",
    paas_tier: "enterprise",
    qualification_status: "qualified",
    quality_score: 96,
    otd_score: 95,
    esg_score: 96,
    overall_rating: 95.7,
    rating_class: "A+",
    standard_lead_time_days: 15,
    moq_description: "250 sqft fodera/scamosciato · 500 sqft grana dollaro",
    payment_terms_l6: "Bonifico 60 gg D.F.",
    hourly_or_unit_rate_eur_l6: 6.8,
    negotiated_price_list_l6: [
      {
        item_code: "PEL-CAP-VEG-10",
        description: "Fodera Capra Concia Vegetale Metal-Free",
        uom: "sqft",
        unit_price_eur: 4.1,
      },
      {
        item_code: "PEL-CAM-IDR-14",
        description: "Camoscio Vitello Idrorepellente PFAS-Free",
        uom: "sqft",
        unit_price_eur: 7.6,
      },
      {
        item_code: "PEL-DOL-OLI-14",
        description: "Vitello Grana Dollaro Chrome-Free",
        uom: "sqft",
        unit_price_eur: 7.9,
      },
    ],
    internal_audit_notes_l6: "Impianto depurazione acque circolari certificato LWG Gold 96.5%. Zero non conformità cromo VI negli ultimi 24 mesi.",
    contact_email: "compliance@conceriamontebello.it",
    certifications: [
      {
        cert_id: "VCERT-ARZ-01",
        vendor_id: "VND-CONC-ARZ-02",
        cert_type: "LWG_GOLD",
        cert_code: "LWG-IT-VI-7712-GOLD",
        issuing_body: "Leather Working Group",
        valid_from: "2025-11-01",
        valid_until: offsetIsoDateFromToday(410),
        sha256_hash: "3b29c9bb8c9e4a3b8e4e7e6f8a9d1c2b3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
        status: "valid",
      },
      {
        cert_id: "VCERT-ARZ-02",
        vendor_id: "VND-CONC-ARZ-02",
        cert_type: "EUDR_DUE_DILIGENCE",
        cert_code: "EUDR-DDS-2026-IT-8890",
        issuing_body: "EU TRACES Deforestation-Free Registry",
        valid_from: "2026-01-15",
        valid_until: offsetIsoDateFromToday(310),
        sha256_hash: "5f4dcc3b5aa765d61d8327deb882cf992b9699aaf4e4b7c6c4e1f7c227f54921",
        status: "valid",
      },
    ],
    is_active: true,
    created_at: "2026-01-06T09:00:00Z",
  },
  {
    vendor_id: "VND-SUOL-FM-03",
    vendor_code: "FOR-SUOL-003",
    company_name: "Suolificio Adriatico Bio S.r.l.",
    vat_number: "IT01984310442",
    district_company_id: "comp-pmi-rossi",
    supply_chain_role: "suolificio",
    district_area: "Marche - Fermo / Macerata",
    city_address: "Zona Industriale Brancadoro, 63811 Sant'Elpidio a Mare (FM)",
    country_iso2: "IT",
    paas_tier: "pmi",
    qualification_status: "qualified",
    quality_score: 91,
    otd_score: 89,
    esg_score: 90,
    overall_rating: 90.1,
    rating_class: "A",
    standard_lead_time_days: 14,
    moq_description: "120 paia per stampo / sviluppo scala 39-45",
    payment_terms_l6: "Ri.Ba. 60/90 gg F.M.",
    hourly_or_unit_rate_eur_l6: 6.4,
    negotiated_price_list_l6: [
      {
        item_code: "SUO-BIO-TPU-01",
        description: "Suola Monoblocco Bio-TPU 60% Riciclato",
        uom: "pair",
        unit_price_eur: 6.4,
      },
      {
        item_code: "SUO-GOM-NAT-02",
        description: "Suola Gomma Para Naturale & Sughero 50% GRS",
        uom: "pair",
        unit_price_eur: 6.8,
      },
    ],
    internal_audit_notes_l6: "Stampi esclusivi custoditi in comodato gratuito con clausola NDA firmata.",
    contact_email: "tecnico@suolificioadriatico.it",
    certifications: [
      {
        cert_id: "VCERT-SUO-01",
        vendor_id: "VND-SUOL-FM-03",
        cert_type: "ISO_14001",
        cert_code: "ISO14001-DNV-2025-881",
        issuing_body: "DNV Business Assurance Italy",
        valid_from: "2025-05-01",
        valid_until: offsetIsoDateFromToday(220),
        sha256_hash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        status: "valid",
      },
      {
        cert_id: "VCERT-SUO-02",
        vendor_id: "VND-SUOL-FM-03",
        cert_type: "DURC_REGOLARITA",
        cert_code: "INPS-INAIL-44291088",
        issuing_body: "INPS / INAIL Sportello Unico",
        valid_from: "2026-01-10",
        valid_until: offsetIsoDateFromToday(95),
        sha256_hash: "2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c",
        status: "valid",
      },
    ],
    is_active: true,
    created_at: "2026-01-08T10:00:00Z",
  },
  {
    vendor_id: "VND-GALV-FM-04",
    vendor_code: "FOR-GALV-004",
    company_name: "Galvanica EcoMarche S.r.l.",
    vat_number: "IT02114090438",
    supply_chain_role: "minuterie_galvanica",
    district_area: "Marche - Fermo / Macerata",
    city_address: "Via Einaudi 74, 62012 Civitanova Marche (MC)",
    country_iso2: "IT",
    paas_tier: "pmi",
    qualification_status: "qualified",
    quality_score: 95,
    otd_score: 92,
    esg_score: 94,
    overall_rating: 93.8,
    rating_class: "A+",
    standard_lead_time_days: 12,
    moq_description: "200 pezzi per bagno galvanico Oro 24K / Palladio",
    payment_terms_l6: "Ri.Ba. 60 gg F.M.",
    hourly_or_unit_rate_eur_l6: 6.5,
    negotiated_price_list_l6: [
      {
        item_code: "MIN-MOR-AU24",
        description: "Morsetto Ottone Fresato Bagno Oro Chiaro 24K Nickel-Free",
        uom: "pair",
        unit_price_eur: 6.5,
      },
      {
        item_code: "MIN-ZIP-PAL",
        description: "Zip Metallica Lusso Palladio Spazzolato",
        uom: "pcs",
        unit_price_eur: 9.2,
      },
      {
        item_code: "MIN-CAM-ACC",
        description: "Cambrione Acciaio Temperato 85% Riciclato",
        uom: "pair",
        unit_price_eur: 1.9,
      },
    ],
    internal_audit_notes_l6: "Bagni galvanici a ciclo chiuso senza cianuro. Test rilascio nichel EN 1811 allegato ad ogni DDT.",
    contact_email: "lab@galvanicaecomarche.it",
    certifications: [
      {
        cert_id: "VCERT-GAL-01",
        vendor_id: "VND-GALV-FM-04",
        cert_type: "REACH_SVHC_NICKEL_FREE",
        cert_code: "REACH-EN1811-2026-094",
        issuing_body: " Eurofins Textile & Footwear Testing",
        valid_from: "2026-01-12",
        valid_until: offsetIsoDateFromToday(280),
        sha256_hash: "8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e",
        status: "valid",
      },
      {
        cert_id: "VCERT-GAL-02",
        vendor_id: "VND-GALV-FM-04",
        cert_type: "ISO_14001",
        cert_code: "ISO14001-TUV-1180",
        issuing_body: "TÜV Italia S.r.l.",
        valid_from: "2025-07-01",
        valid_until: offsetIsoDateFromToday(240),
        sha256_hash: "6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c",
        status: "valid",
      },
    ],
    is_active: true,
    created_at: "2026-01-09T11:20:00Z",
  },
  {
    vendor_id: "VND-LAB-ORL-05",
    vendor_code: "TER-ORL-005",
    company_name: "Tomaificio Artigiano Fratelli Bianchi",
    vat_number: "IT01667200449",
    district_company_id: "comp-lab-tomaificio",
    supply_chain_role: "tomaificio_orlatura",
    district_area: "Marche - Fermo / Macerata",
    city_address: "Via Fermana Nord 112, 63812 Montegranaro (FM)",
    country_iso2: "IT",
    paas_tier: "subcontractor_zero_eur",
    qualification_status: "qualified",
    quality_score: 94,
    otd_score: 91,
    esg_score: 88,
    overall_rating: 91.3,
    rating_class: "A",
    standard_lead_time_days: 10,
    moq_description: "50 paia / borse per lancio manovia façon",
    payment_terms_l6: "Bonifico 30 gg F.M. Tutela Artigiana",
    hourly_or_unit_rate_eur_l6: 14.5,
    negotiated_price_list_l6: [
      {
        item_code: "LAV-ORL-MOC",
        description: "Orlatura Completa Tomaia + Vaschetta Cucita a Mano",
        uom: "pair",
        unit_price_eur: 14.5,
      },
      {
        item_code: "LAV-MAN-TUB",
        description: "Giunteria Manici Tubolari Pelletteria Cuciti a Mano",
        uom: "pair",
        unit_price_eur: 16.5,
      },
    ],
    internal_audit_notes_l6: "Laboratorio façon storico (18 addetti). Accesso Portale Mobile QR Magic-Link a 0,00 € perpetuo (Manifesto Pilastro 3).",
    contact_email: "produzione@tomaificiobianchi.it",
    certifications: [
      {
        cert_id: "VCERT-ORL-01",
        vendor_id: "VND-LAB-ORL-05",
        cert_type: "DURC_REGOLARITA",
        cert_code: "INPS-INAIL-88412019",
        issuing_body: "INPS / INAIL Marche",
        valid_from: "2026-01-15",
        valid_until: offsetIsoDateFromToday(104),
        sha256_hash: "0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
        status: "valid",
      },
      {
        cert_id: "VCERT-ORL-02",
        vendor_id: "VND-LAB-ORL-05",
        cert_type: "SA8000_SOCIAL",
        cert_code: "SA8000-ETHIC-FM-204",
        issuing_body: "Bureau Veritas Social Audit Filiera",
        valid_from: "2025-10-01",
        valid_until: offsetIsoDateFromToday(290),
        sha256_hash: "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
        status: "valid",
      },
    ],
    is_active: true,
    created_at: "2026-01-11T08:45:00Z",
  },
  {
    vendor_id: "VND-LAB-MON-06",
    vendor_code: "TER-MON-006",
    company_name: "Manovia Montaggio Riviera S.n.c.",
    vat_number: "IT03319080271",
    district_company_id: "comp-lab-giunteria",
    supply_chain_role: "manovia_montaggio",
    district_area: "Veneto - Riviera del Brenta",
    city_address: "Via Nazionale 89, 30039 Stra (VE)",
    country_iso2: "IT",
    paas_tier: "subcontractor_zero_eur",
    qualification_status: "qualified",
    quality_score: 93,
    otd_score: 90,
    esg_score: 89,
    overall_rating: 90.9,
    rating_class: "A",
    standard_lead_time_days: 9,
    moq_description: "40 paia montaggio Blake Rapid / Goodyear",
    payment_terms_l6: "Bonifico 30 gg D.F.",
    hourly_or_unit_rate_eur_l6: 18.0,
    negotiated_price_list_l6: [
      {
        item_code: "LAV-MON-BLK",
        description: "Premontaggio, Montaggio e Cucitura Blake Rapid + Finissaggio",
        uom: "pair",
        unit_price_eur: 18.0,
      },
    ],
    internal_audit_notes_l6: "Terzista Tier 3 a 0,00 € perpetuo. Eccellente tenuta su calzature eleganti uomo/donna.",
    contact_email: "manovia@montaggioriviera.it",
    certifications: [
      {
        cert_id: "VCERT-MON-01",
        vendor_id: "VND-LAB-MON-06",
        cert_type: "DURC_REGOLARITA",
        cert_code: "INPS-INAIL-91204411",
        issuing_body: "INPS / INAIL Veneto",
        valid_from: "2026-01-20",
        valid_until: offsetIsoDateFromToday(110),
        sha256_hash: "e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
        status: "valid",
      },
      {
        cert_id: "VCERT-MON-02",
        vendor_id: "VND-LAB-MON-06",
        cert_type: "ISO_9001",
        cert_code: "ISO9001-CSQ-7710",
        issuing_body: "IMQ / CSQ Certificazione Qualità",
        valid_from: "2025-09-10",
        valid_until: offsetIsoDateFromToday(275),
        sha256_hash: "f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5",
        status: "valid",
      },
    ],
    is_active: true,
    created_at: "2026-01-12T14:00:00Z",
  },
  {
    vendor_id: "VND-TEX-LOM-07",
    vendor_code: "FOR-TEX-007",
    company_name: "Filature & Fodere Lombarde S.r.l.",
    vat_number: "IT08841290963",
    supply_chain_role: "tessuti_filati",
    district_area: "Lombardia - Vigevano / Milano",
    city_address: "Corso Novara 156, 27029 Vigevano (PV)",
    country_iso2: "IT",
    paas_tier: "pmi",
    qualification_status: "qualified_with_reserve",
    quality_score: 88,
    otd_score: 86,
    esg_score: 89,
    overall_rating: 87.7,
    rating_class: "A",
    standard_lead_time_days: 14,
    moq_description: "50 metri tessuto/fodera · 20 coni filato cerato rPET",
    payment_terms_l6: "Ri.Ba. 60 gg F.M.",
    hourly_or_unit_rate_eur_l6: 8.5,
    negotiated_price_list_l6: [
      {
        item_code: "FIL-RPET-20",
        description: "Filato Cerato Alta Tenacità 100% rPET Tit. 20",
        uom: "m",
        unit_price_eur: 0.35,
      },
      {
        item_code: "TEX-DRP-RWS",
        description: "Drappo Lana RWS & Cashmere Rigenerato 540g",
        uom: "m",
        unit_price_eur: 34.0,
      },
      {
        item_code: "TEX-FOD-CUP",
        description: "Fodera Bemberg Cupro Circolare",
        uom: "m",
        unit_price_eur: 8.5,
      },
    ],
    internal_audit_notes_l6: "Rinnovo annuale certificato OEKO-TEX Standard 100 richiesto entro 38 giorni per mantenere classe A.",
    contact_email: "certificazioni@filaturelombarde.it",
    certifications: [
      {
        cert_id: "VCERT-TEX-01",
        vendor_id: "VND-TEX-LOM-07",
        cert_type: "GRS_RECYCLED",
        cert_code: "GRS-ICEA-2025-4410",
        issuing_body: "ICEA Istituto Certificazione Etica Ambientale",
        valid_from: "2025-08-01",
        valid_until: offsetIsoDateFromToday(215),
        sha256_hash: "a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6",
        status: "valid",
      },
      {
        cert_id: "VCERT-TEX-02",
        vendor_id: "VND-TEX-LOM-07",
        cert_type: "OEKO_TEX_100",
        cert_code: "OEKO-CENTROCO-26-091",
        issuing_body: "Centrocot Busto Arsizio",
        valid_from: "2025-05-15",
        valid_until: offsetIsoDateFromToday(38),
        sha256_hash: "b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7",
        status: "expiring_soon",
      },
    ],
    is_active: true,
    created_at: "2026-01-14T16:10:00Z",
  },
  {
    vendor_id: "VND-CONC-SUD-09",
    vendor_code: "FOR-CONC-009",
    company_name: "Pellami Sud Import S.r.l.",
    vat_number: "IT04128900641",
    supply_chain_role: "conceria",
    district_area: "Campania - Solofra",
    city_address: "Via Melito 24, 83029 Solofra (AV)",
    country_iso2: "IT",
    paas_tier: "pmi",
    qualification_status: "suspended",
    quality_score: 64,
    otd_score: 68,
    esg_score: 52,
    overall_rating: 61.6,
    rating_class: "C",
    standard_lead_time_days: 24,
    moq_description: "400 sqft crust bordeaux / moro",
    payment_terms_l6: "Bonifico Anticipato / Bloccato Audit ESG",
    hourly_or_unit_rate_eur_l6: 8.1,
    negotiated_price_list_l6: [
      {
        item_code: "PEL-CRU-BOR-13",
        description: "Crust Ovino/Vitello Anticato Spazzolabile",
        uom: "sqft",
        unit_price_eur: 8.1,
      },
    ],
    internal_audit_notes_l6: "ALERT CRITICO: Certificati LWG Silver ed EUDR Due Diligence scaduti da 14 giorni + difformità bagno tintoria Lotto LOT-SOLOFRA-2026-ERR14 (ΔE 2.8). Blocco nuovi ordini.",
    contact_email: "amministrazione@pellamisudimport.it",
    certifications: [
      {
        cert_id: "VCERT-SUD-01",
        vendor_id: "VND-CONC-SUD-09",
        cert_type: "LWG_SILVER",
        cert_code: "LWG-IT-AV-3318-EXP",
        issuing_body: "Leather Working Group",
        valid_from: "2024-04-01",
        valid_until: offsetIsoDateFromToday(-14),
        sha256_hash: "d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9",
        status: "expired",
      },
      {
        cert_id: "VCERT-SUD-02",
        vendor_id: "VND-CONC-SUD-09",
        cert_type: "EUDR_DUE_DILIGENCE",
        cert_code: "EUDR-DDS-EXP-0091",
        issuing_body: "EU TRACES Deforestation-Free Registry",
        valid_from: "2025-04-01",
        valid_until: offsetIsoDateFromToday(-14),
        sha256_hash: "e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
        status: "expired",
      },
    ],
    is_active: true,
    created_at: "2026-01-16T12:00:00Z",
  },
];

export const INITIAL_VENDORS: VendorRecord[] = RAW_INITIAL_VENDORS.map((vendor) => {
  const sem = evaluateVendorCertificationsSemaphore(vendor.certifications);
  const rating = computeVendorRating(vendor.quality_score, vendor.otd_score, vendor.esg_score);
  const districtComp = vendor.district_company_id
    ? (INITIAL_COMPANIES.find((c) => c.company_id === vendor.district_company_id) as any)
    : undefined;
  return {
    ...vendor,
    ...rating,
    district_company: districtComp,
    certifications: sem.certifications,
    has_expired_critical_certs: sem.has_expired_critical_certs,
    cert_semaphore_status: sem.cert_semaphore_status,
    l6_segregated: false,
  };
});

export function findMasterColorById(
  colors: MasterColor[],
  colorId?: string | null
): MasterColor | undefined {
  if (!colorId) return undefined;
  return colors.find(
    (c) => c.id === colorId || c.color_id === colorId || c.color_code === colorId
  );
}

export function applyVendorL6SegregationClient(
  vendor: VendorRecord,
  viewerRole: ViewerSecurityRole
): VendorRecord {
  const sem = evaluateVendorCertificationsSemaphore(vendor.certifications || []);
  if (viewerRole === "brand") {
    const rating =
      typeof vendor.overall_rating === "number" && vendor.rating_class
        ? { overall_rating: vendor.overall_rating, rating_class: vendor.rating_class }
        : computeVendorRating(vendor.quality_score, vendor.otd_score, vendor.esg_score);
    return {
      ...vendor,
      ...rating,
      certifications: sem.certifications,
      has_expired_critical_certs: sem.has_expired_critical_certs,
      cert_semaphore_status: sem.cert_semaphore_status,
      l6_segregated: false,
    };
  }
  return {
    ...vendor,
    certifications: sem.certifications,
    has_expired_critical_certs: sem.has_expired_critical_certs,
    cert_semaphore_status: sem.cert_semaphore_status,
    quality_score: null,
    otd_score: null,
    esg_score: null,
    overall_rating: null,
    rating_class: null,
    moq_description: null,
    payment_terms_l6: null,
    hourly_or_unit_rate_eur_l6: null,
    negotiated_price_list_l6: null,
    internal_audit_notes_l6: null,
    l6_segregated: true,
  };
}

export function computeLocalWhereUsed(
  vendorId: string,
  vendors: VendorRecord[],
  pimItems: PimCommercialItem[],
  tanneryBatches: TanneryBatch[],
  productionOrders: ProductionOrder[],
  viewerRole: ViewerSecurityRole
): VendorWhereUsedResponse | null {
  const rawVendor = vendors.find((v) => v.vendor_id === vendorId);
  if (!rawVendor) return null;
  const vendor = applyVendorL6SegregationClient(rawVendor, viewerRole);

  const impactedPimMap = new Map<
    string,
    { pim_item_id: string; sku_code: string; model_name: string; season: string }
  >();
  const impactedVariants: VendorWhereUsedResponse["impacted_plm_variants"] = [];
  const impactedBomNodes: VendorWhereUsedResponse["impacted_bom_nodes"] = [];

  let totalBomCostContribution = 0;
  let variantMatchesCount = 0;

  for (const pim of pimItems) {
    for (const variant of pim.plm_variants || []) {
      const matchingNodes = (variant.bom_items || []).filter(
        (b) =>
          b.vendor_id === vendorId ||
          b.supplier_name.toLowerCase().trim() === rawVendor.company_name.toLowerCase().trim()
      );
      if (matchingNodes.length > 0) {
        impactedPimMap.set(pim.pim_item_id, {
          pim_item_id: pim.pim_item_id,
          sku_code: pim.sku_code,
          model_name: pim.model_name,
          season: pim.season,
        });
        impactedVariants.push({
          plm_variant_id: variant.plm_variant_id,
          pim_item_id: pim.pim_item_id,
          variant_code: variant.variant_code,
          colorway_name: variant.colorway_name,
          lifecycle_status: variant.lifecycle_status,
          bom_nodes_from_vendor: matchingNodes.length,
        });
        variantMatchesCount += 1;

        for (const node of matchingNodes) {
          const unitCost = typeof node.unit_cost_eur === "number" ? node.unit_cost_eur : 0;
          const grossConsumption = node.unit_consumption * (1 + (node.waste_percentage || 0) / 100);
          totalBomCostContribution += unitCost * grossConsumption;

          impactedBomNodes.push({
            bom_item_id: node.bom_item_id,
            plm_variant_id: variant.plm_variant_id,
            variant_code: variant.variant_code,
            level: node.level,
            component_type: node.component_type,
            material_name: node.material_name,
            unit_of_measure: node.unit_of_measure,
            unit_consumption: node.unit_consumption,
            unit_cost_eur_l6: viewerRole === "brand" ? unitCost : null,
          });
        }
      }
    }
  }

  const impactedBatches = (tanneryBatches || [])
    .filter(
      (b) =>
        b.vendor_id === vendorId ||
        b.tannery_name.toLowerCase().trim() === rawVendor.company_name.toLowerCase().trim()
    )
    .map((b) => ({
      batch_id: b.batch_id,
      batch_code: b.batch_code,
      leather_type: b.leather_type,
      lwg_rating: b.lwg_rating,
      available_qty_sqft: b.available_qty_sqft,
    }));

  const impactedVariantIds = new Set(impactedVariants.map((v) => v.plm_variant_id));
  const activeOrders = (productionOrders || []).filter((o) =>
    impactedVariantIds.has(o.plm_variant_id)
  );

  const avgBomContribution =
    variantMatchesCount > 0
      ? Math.round((totalBomCostContribution / variantMatchesCount) * 100) / 100
      : 0;

  const unitRate = rawVendor.hourly_or_unit_rate_eur_l6 || 7.5;
  const tanneryStockVal = Math.round(
    impactedBatches.reduce((acc, b) => acc + b.available_qty_sqft * unitRate, 0)
  );
  const seasonalPairsBaseline =
    activeOrders.reduce((acc, o) => acc + (o.total_planned_pairs || 0), 0) ||
    Math.max(impactedVariants.length * 350, 350);
  const estimatedSeasonalExposure = Math.round(
    avgBomContribution * seasonalPairsBaseline + tanneryStockVal * 0.35
  );

  let criticality = "ORDINARIA";
  if (vendor.has_expired_critical_certs && impactedBomNodes.length > 0) {
    criticality = "CRITICA · BLOCCO COMPLIANCE CERTIFICATI";
  } else if (impactedVariants.length >= 3 || activeOrders.length > 0) {
    criticality = "ALTA · PARTNER STRATEGICO DI MANOVIA";
  } else if (impactedVariants.length >= 1) {
    criticality = "MEDIA · FORNITURA ATTIVA";
  }

  return {
    vendor_id: vendor.vendor_id,
    vendor_code: vendor.vendor_code,
    company_name: vendor.company_name,
    supply_chain_role: vendor.supply_chain_role,
    district_area: vendor.district_area,
    paas_tier: vendor.paas_tier,
    qualification_status: vendor.qualification_status,
    overall_rating: viewerRole === "brand" ? rawVendor.overall_rating ?? null : null,
    has_expired_critical_certs: vendor.has_expired_critical_certs,
    l6_segregated: viewerRole !== "brand",
    impact_summary: {
      pim_models_count: impactedPimMap.size,
      plm_variants_count: impactedVariants.length,
      bom_nodes_count: impactedBomNodes.length,
      tannery_batches_count: impactedBatches.length,
      active_production_orders_count: activeOrders.length,
      supply_chain_criticality: criticality,
    },
    financial_exposure_l6:
      viewerRole === "brand"
        ? {
            avg_bom_cost_contribution_per_pair_eur: avgBomContribution,
            tannery_stock_value_eur: tanneryStockVal,
            estimated_seasonal_exposure_eur: estimatedSeasonalExposure,
            hourly_or_unit_rate_eur: rawVendor.hourly_or_unit_rate_eur_l6 ?? undefined,
            payment_terms: rawVendor.payment_terms_l6 ?? undefined,
          }
        : null,
    impacted_pim_items: Array.from(impactedPimMap.values()),
    impacted_plm_variants: impactedVariants,
    impacted_bom_nodes: impactedBomNodes,
    impacted_tannery_batches: impactedBatches,
  };
}

export function inferPartRoleFromBomItem(item: BomItem): string {
  switch (item.component_type) {
    case "upper":
    case "fabric":
      return "tomaia_principale";
    case "lining":
    case "insole":
      return "fodera_interna";
    case "outsole":
    case "heel":
      return "fondo_suola";
    case "hardware":
      return "minuteria_galvanica";
    case "packaging":
      return "packaging_scatola";
    default:
      return item.level === 3 ? "filato_cucitura" : "sotto_assieme";
  }
}

export function computeLocalColorwayMatrix(
  variant: PlmProductionVariant,
  colors: MasterColor[],
  tanneryBatches: TanneryBatch[],
  existingMappings?: ColorwayBomNodeMapping[]
): ColorwayMatrixResponse {
  const existingByBomId = new Map<string, ColorwayBomNodeMapping>();
  for (const m of existingMappings || []) {
    existingByBomId.set(m.bom_item_id, m);
  }

  const primaryColor = findMasterColorById(colors, variant.primary_color_id);
  const secondaryColor = findMasterColorById(colors, variant.secondary_color_id);
  const hardwareColor = findMasterColorById(colors, variant.hardware_finish_color_id);

  const mappings: ColorwayBomNodeMapping[] = (variant.bom_items || []).map((bom, idx) => {
    const prev = existingByBomId.get(bom.bom_item_id);
    const defaultRole = inferPartRoleFromBomItem(bom);
    const chosenColorId =
      prev?.master_color_id ??
      bom.master_color_id ??
      (bom.component_type === "hardware"
        ? hardwareColor?.id
        : bom.component_type === "lining"
        ? secondaryColor?.id
        : primaryColor?.id) ??
      null;
    const colorObj = findMasterColorById(colors, chosenColorId);

    // Check linked tannery batch consistency
    const linkedBatch = (tanneryBatches || []).find(
      (tb) => tb.metadata?.bom_material_id === bom.bom_item_id
    );
    let consistency: "coherent" | "mismatch" | "not_linked" = "not_linked";
    if (linkedBatch && linkedBatch.master_color_id && colorObj) {
      const batchColor = findMasterColorById(colors, linkedBatch.master_color_id);
      consistency =
        batchColor && batchColor.id === colorObj.id ? "coherent" : "mismatch";
    }

    // Realistic default lab-dip status & spectrophotometer ΔE
    let defaultStatus: ColorwayBomNodeMapping["lab_dip_status"] =
      variant.lifecycle_status === "in_production" ||
      variant.lifecycle_status === "industrialized"
        ? "master_standard"
        : "approved";
    let defaultDeltaE = Number((0.45 + (idx % 4) * 0.22).toFixed(2));

    if (bom.bom_item_id === "BOM-DUCA3-L1-UPPER" && !prev) {
      defaultStatus = "rejected";
      defaultDeltaE = 2.84;
    } else if (variant.lifecycle_status === "sample" && idx > 0 && !prev) {
      defaultStatus = "submitted";
      defaultDeltaE = 1.35;
    }

    const labStatus = prev?.lab_dip_status ?? defaultStatus;
    const deltaE = prev?.delta_e_value !== undefined ? prev.delta_e_value : defaultDeltaE;

    return {
      id: prev?.id || `CWM-${variant.plm_variant_id}-${bom.bom_item_id}`,
      plm_variant_id: variant.plm_variant_id,
      bom_item_id: bom.bom_item_id,
      level: bom.level,
      parent_bom_item_id: bom.parent_bom_item_id,
      component_type: bom.component_type,
      material_name: bom.material_name,
      supplier_name: bom.supplier_name,
      vendor_id: bom.vendor_id ?? null,
      master_color_id: colorObj?.id ?? chosenColorId,
      color_code: colorObj?.color_code ?? null,
      technical_name_it: colorObj?.technical_name_it ?? null,
      commercial_family: colorObj?.commercial_family ?? null,
      hex_code: colorObj?.hex_code ?? null,
      pantone_tcx_code: colorObj?.pantone_tcx_code ?? null,
      ral_code: colorObj?.ral_code ?? null,
      finish_type: colorObj?.finish_type ?? null,
      part_role: prev?.part_role ?? defaultRole,
      galvanics_finish:
        prev?.galvanics_finish ??
        (bom.component_type === "hardware"
          ? colorObj?.finish_type || "galvanica_oro_24k"
          : null),
      lab_dip_status: labStatus,
      delta_e_value: deltaE,
      approved_by:
        prev?.approved_by ??
        (labStatus === "approved" || labStatus === "master_standard"
          ? "Direzione Qualità & Stile"
          : null),
      approved_at:
        prev?.approved_at ??
        (labStatus === "approved" || labStatus === "master_standard"
          ? "2026-03-10T10:00:00Z"
          : null),
      notes:
        prev?.notes ??
        (bom.bom_item_id === "BOM-DUCA3-L1-UPPER"
          ? "Tirella Solofra fuori tolleranza ΔE 2.84 (viraggio moro su fondo bordeaux)."
          : ""),
      tannery_color_consistency: consistency,
      linked_batch_code: linkedBatch?.batch_code ?? null,
    };
  });

  const totalNodes = mappings.length;
  const mappedCount = mappings.filter((m) => Boolean(m.master_color_id)).length;
  const approvedCount = mappings.filter((m) =>
    ["approved", "master_standard", "conditional_waiver"].includes(m.lab_dip_status)
  ).length;
  const rejectedCount = mappings.filter(
    (m) =>
      m.lab_dip_status === "rejected" ||
      (typeof m.delta_e_value === "number" && m.delta_e_value > 2.5)
  ).length;

  const readinessPct =
    totalNodes > 0 ? Math.round((approvedCount / totalNodes) * 100) : 100;

  return {
    plm_variant_id: variant.plm_variant_id,
    variant_code: variant.variant_code,
    colorway_name: variant.colorway_name,
    primary_color_id: variant.primary_color_id ?? primaryColor?.id ?? null,
    secondary_color_id: variant.secondary_color_id ?? secondaryColor?.id ?? null,
    hardware_finish_color_id:
      variant.hardware_finish_color_id ?? hardwareColor?.id ?? null,
    colorway_rule_preset: variant.colorway_rule_preset || "tone_on_tone",
    total_bom_nodes: totalNodes,
    mapped_nodes_count: mappedCount,
    approved_nodes_count: approvedCount,
    rejected_nodes_count: rejectedCount,
    colorway_readiness_pct: readinessPct,
    production_gate_blocked: rejectedCount > 0,
    mappings,
  };
}

export function applyColorwayRuleToMappings(
  mappings: ColorwayBomNodeMapping[],
  rulePreset: string,
  primaryColorId: string | null | undefined,
  secondaryColorId: string | null | undefined,
  hardwareColorId: string | null | undefined,
  colors: MasterColor[]
): {
  mappings: ColorwayBomNodeMapping[];
  resolvedSecondaryId: string | null;
  resolvedHardwareId: string | null;
} {
  const primary = findMasterColorById(colors, primaryColorId) || colors[0];
  const whiteOptic =
    findMasterColorById(colors, "MCOL-WHT-004") ||
    colors.find((c) => c.commercial_family.toLowerCase().includes("bianco")) ||
    primary;
  const ivoryLining =
    findMasterColorById(colors, "MCOL-ECR-005") ||
    findMasterColorById(colors, secondaryColorId) ||
    primary;
  const gold24k =
    findMasterColorById(colors, "MCOL-GLD-010") ||
    findMasterColorById(colors, hardwareColorId) ||
    primary;
  const palladium =
    findMasterColorById(colors, "MCOL-SLV-011") ||
    findMasterColorById(colors, hardwareColorId) ||
    primary;

  let effectiveSecondary = findMasterColorById(colors, secondaryColorId) || ivoryLining;
  let effectiveHardware = findMasterColorById(colors, hardwareColorId) || palladium;

  if (rulePreset === "tone_on_tone") {
    effectiveSecondary = findMasterColorById(colors, secondaryColorId) || primary;
    effectiveHardware = findMasterColorById(colors, hardwareColorId) || palladium;
  } else if (rulePreset === "contrast_white_sole") {
    effectiveSecondary = ivoryLining;
    effectiveHardware = palladium;
  } else if (rulePreset === "luxury_gold_hardware") {
    effectiveSecondary = findMasterColorById(colors, secondaryColorId) || ivoryLining;
    effectiveHardware = gold24k;
  } else if (rulePreset === "luxury_palladium_hardware") {
    effectiveSecondary = findMasterColorById(colors, secondaryColorId) || ivoryLining;
    effectiveHardware = palladium;
  }

  const nextMappings = mappings.map((m) => {
    let targetColor: MasterColor | undefined = primary;
    if (m.component_type === "hardware") {
      targetColor = effectiveHardware;
    } else if (m.component_type === "lining" || m.component_type === "insole") {
      targetColor = effectiveSecondary;
    } else if (
      m.component_type === "outsole" ||
      m.component_type === "heel" ||
      m.component_type === "sole"
    ) {
      targetColor = rulePreset === "contrast_white_sole" ? whiteOptic : primary;
    } else {
      targetColor = primary;
    }

    return {
      ...m,
      master_color_id: targetColor?.id ?? m.master_color_id,
      color_code: targetColor?.color_code ?? m.color_code,
      technical_name_it: targetColor?.technical_name_it ?? m.technical_name_it,
      commercial_family: targetColor?.commercial_family ?? m.commercial_family,
      hex_code: targetColor?.hex_code ?? m.hex_code,
      pantone_tcx_code: targetColor?.pantone_tcx_code ?? m.pantone_tcx_code,
      ral_code: targetColor?.ral_code ?? m.ral_code,
      finish_type: targetColor?.finish_type ?? m.finish_type,
      galvanics_finish:
        m.component_type === "hardware"
          ? targetColor?.finish_type || m.galvanics_finish
          : m.galvanics_finish,
    };
  });

  return {
    mappings: nextMappings,
    resolvedSecondaryId: effectiveSecondary?.id ?? null,
    resolvedHardwareId: effectiveHardware?.id ?? null,
  };
}

export interface ColorwayExplosionPayload {
  target_color_ids: string[];
  rule_preset: string;
  lining_color_id?: string | null;
  sole_color_id?: string | null;
  hardware_color_id?: string | null;
  auto_link_pim?: boolean;
}

export function explodeColorwaysClient(
  baseVariant: PlmProductionVariant,
  pimItem: PimCommercialItem,
  payload: ColorwayExplosionPayload,
  colors: MasterColor[],
  tanneryBatches: TanneryBatch[]
): {
  createdVariants: PlmProductionVariant[];
  createdMatrices: Record<string, ColorwayMatrixResponse>;
} {
  const createdVariants: PlmProductionVariant[] = [];
  const createdMatrices: Record<string, ColorwayMatrixResponse> = {};
  const existingCodes = new Set(
    (pimItem.plm_variants || []).map((v) => v.variant_code.toUpperCase())
  );

  for (const colorId of payload.target_color_ids) {
    const targetColor = findMasterColorById(colors, colorId);
    if (!targetColor) continue;

    const shortSlug = targetColor.color_code
      .replace(/^COL-/i, "")
      .replace(/[^A-Z0-9]/gi, "")
      .slice(0, 6)
      .toUpperCase();
    const basePrefix = baseVariant.variant_code.split("-").slice(0, 3).join("-");
    let candidateCode = `${basePrefix}-${shortSlug}`;
    let suffix = 2;
    while (existingCodes.has(candidateCode.toUpperCase())) {
      candidateCode = `${basePrefix}-${shortSlug}${suffix}`;
      suffix += 1;
    }
    existingCodes.add(candidateCode.toUpperCase());

    const newVariantId = `PLM-EXP-${shortSlug}-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      Math.random() * 90 + 10
    )}`;

    const baseMatrix = computeLocalColorwayMatrix(baseVariant, colors, tanneryBatches);
    const propagated = applyColorwayRuleToMappings(
      baseMatrix.mappings,
      payload.rule_preset,
      targetColor.id,
      payload.lining_color_id,
      payload.hardware_color_id,
      colors
    );

    const soleOverride = findMasterColorById(colors, payload.sole_color_id);

    const clonedBomItems: BomItem[] = (baseVariant.bom_items || []).map((bom, idx) => {
      const mappedNode = propagated.mappings.find((m) => m.bom_item_id === bom.bom_item_id);
      const effectiveNodeColor =
        (bom.component_type === "outsole" || bom.component_type === "heel") &&
        soleOverride
          ? soleOverride
          : findMasterColorById(colors, mappedNode?.master_color_id) || targetColor;

      const newBomId = `${bom.bom_item_id}-${shortSlug}-${idx + 1}`;
      return {
        ...bom,
        bom_item_id: newBomId,
        master_color_id: effectiveNodeColor.id,
        material_name:
          bom.component_type === "upper" || bom.component_type === "fabric"
            ? `${bom.material_name.split(" ").slice(0, 3).join(" ")} — ${targetColor.technical_name_it}`
            : bom.material_name,
      };
    });

    // Remap parent_bom_item_id references inside the cloned 3-level tree
    const oldToNewId = new Map<string, string>();
    (baseVariant.bom_items || []).forEach((oldBom, idx) => {
      oldToNewId.set(oldBom.bom_item_id, clonedBomItems[idx].bom_item_id);
    });
    const normalizedBomItems = clonedBomItems.map((b, idx) => {
      const origParent = baseVariant.bom_items[idx]?.parent_bom_item_id;
      return {
        ...b,
        parent_bom_item_id: origParent ? oldToNewId.get(origParent) || origParent : null,
      };
    });

    const newVariant: PlmProductionVariant = {
      ...baseVariant,
      plm_variant_id: newVariantId,
      pim_item_id: pimItem.pim_item_id,
      variant_code: candidateCode,
      colorway_name: `${targetColor.technical_name_it} (${targetColor.pantone_tcx_code})`,
      primary_color_id: targetColor.id,
      secondary_color_id: propagated.resolvedSecondaryId,
      hardware_finish_color_id: propagated.resolvedHardwareId,
      colorway_rule_preset: payload.rule_preset,
      lifecycle_status: "sample",
      bom_version: "v1.0 (Colorway Explosion)",
      bom_snapshot_locked: false,
      bom_items: normalizedBomItems,
    };

    const initialMatrix = computeLocalColorwayMatrix(newVariant, colors, tanneryBatches);
    const pendingMatrix: ColorwayMatrixResponse = {
      ...initialMatrix,
      colorway_readiness_pct: 0,
      approved_nodes_count: 0,
      rejected_nodes_count: 0,
      production_gate_blocked: false,
      mappings: initialMatrix.mappings.map((m) => ({
        ...m,
        lab_dip_status: "pending",
        delta_e_value: null,
        approved_by: null,
        approved_at: null,
        notes: "Generato via 1-Click Colorway Explosion — In attesa invio tirella Lab-Dip.",
      })),
    };

    createdVariants.push(newVariant);
    createdMatrices[newVariantId] = pendingMatrix;
  }

  return { createdVariants, createdMatrices };
}

// ============================================================================
// Sprint 9: Centralized Materials Catalog & Bulk Material Swap (FTL-TECH-031 / ADR-017)
// ============================================================================

export const INITIAL_MATERIALS: MaterialRecord[] = [
  {
    material_id: "MAT-PEL-001",
    material_code: "ART-CALF-01",
    name: "Vitello Pieno Fiore Nappa 1.3mm",
    category: "leather",
    vendor_id: "VND-CONC-SC-01",
    vendor_name: "Conceria Santa Croce S.p.A.",
    unit_of_measure: "dm2",
    standard_cost: 0.85,
    color_shade: "Nero Intenso",
    certifications: ["LWG Gold", "EUDR Deforestation-Free"],
    technical_specs: { thickness_mm: 1.3, temper: "soft", tannage: "chrome_free" },
    is_active: true,
  },
  {
    material_id: "MAT-PEL-002",
    material_code: "ART-SUEDE-02",
    name: "Camoscio Suede Idrorepellente PFAS-Free 1.2mm",
    category: "leather",
    vendor_id: "VND-CONC-SC-01",
    vendor_name: "Conceria Santa Croce S.p.A.",
    unit_of_measure: "dm2",
    standard_cost: 0.75,
    color_shade: "Tabacco",
    certifications: ["LWG Gold", "ICEC TS 410"],
    technical_specs: { thickness_mm: 1.2, water_repellent: true, pfas_free: true },
    is_active: true,
  },
  {
    material_id: "MAT-PEL-003",
    material_code: "ART-VEG-03",
    name: "Vacchetta Toscana Concia Vegetale Naturale",
    category: "leather",
    vendor_id: "VND-CONC-SC-01",
    vendor_name: "Conceria Santa Croce S.p.A.",
    unit_of_measure: "dm2",
    standard_cost: 0.90,
    color_shade: "Cuoio Naturale",
    certifications: ["Consorzio Vera Pelle Vegetale", "LWG Gold"],
    technical_specs: { thickness_mm: 1.4, tannage: "vegetable_tanned" },
    is_active: true,
  },
  {
    material_id: "MAT-FOD-001",
    material_code: "ART-LIN-CALF-01",
    name: "Fodera Vitello Traspirante Concia Cromo-Free",
    category: "lining",
    vendor_id: "VND-CONC-SC-01",
    vendor_name: "Conceria Santa Croce S.p.A.",
    unit_of_measure: "dm2",
    standard_cost: 0.45,
    color_shade: "Naturale",
    certifications: ["REACH SVHC Compliant", "LWG Gold"],
    technical_specs: { thickness_mm: 0.8, breathable: true },
    is_active: true,
  },
  {
    material_id: "MAT-FOD-002",
    material_code: "ART-LIN-MESH-02",
    name: "Fodera Tecnica Mesh 3D Antibatterica Air-Flow",
    category: "lining",
    vendor_id: "VND-SUOL-FM-01",
    vendor_name: "Suolificio del Tronto S.r.l.",
    unit_of_measure: "m",
    standard_cost: 14.50,
    color_shade: "Nero Tecnico",
    certifications: ["OEKO-TEX Standard 100", "GRS Recycled"],
    technical_specs: { mesh_density: "3D spacer", weight_gsm: 220 },
    is_active: true,
  },
  {
    material_id: "MAT-TES-001",
    material_code: "ART-CANV-01",
    name: "Canvas Cotone Organico Spigato 380g",
    category: "fabric",
    vendor_id: "VND-SUOL-FM-01",
    vendor_name: "Suolificio del Tronto S.r.l.",
    unit_of_measure: "m",
    standard_cost: 18.20,
    color_shade: "Ecrù Naturale",
    certifications: ["GOTS Organic Cotton", "OEKO-TEX"],
    technical_specs: { composition: "100% Organic Cotton", weight_gsm: 380 },
    is_active: true,
  },
  {
    material_id: "MAT-FND-001",
    material_code: "ART-SOLE-CASSETTA-01",
    name: "Fondo Cassetta Gomma TR Riciclata Bicolore",
    category: "sole_bottom",
    vendor_id: "VND-SUOL-FM-01",
    vendor_name: "Suolificio del Tronto S.r.l.",
    unit_of_measure: "paia",
    standard_cost: 9.80,
    color_shade: "Bianco Latte / Fondo Miele",
    certifications: ["ISO 9001", "ISO 14001"],
    technical_specs: { recycled_content_pct: 30.0, hardness_shore_a: 65 },
    is_active: true,
  },
  {
    material_id: "MAT-FND-002",
    material_code: "ART-SOLE-CUOIO-02",
    name: "Suola Cuoio Toscano Lavorazione Blake con Mezza Pianta TPU",
    category: "sole_bottom",
    vendor_id: "VND-SUOL-FM-01",
    vendor_name: "Suolificio del Tronto S.r.l.",
    unit_of_measure: "paia",
    standard_cost: 15.50,
    color_shade: "Nero Rifinito a Mano",
    certifications: ["Consorzio Cuoio di Toscana", "ISO 9001"],
    technical_specs: { thickness_mm: 5.0, construction: "blake" },
    is_active: true,
  },
  {
    material_id: "MAT-TAC-001",
    material_code: "ART-HEEL-85-01",
    name: "Tacco Rocchetto 85mm Fasciato Cuoio Rigenerato con Sottotacco TPU",
    category: "heel",
    vendor_id: "VND-SUOL-FM-01",
    vendor_name: "Suolificio del Tronto S.r.l.",
    unit_of_measure: "paia",
    standard_cost: 4.80,
    color_shade: "Cuoio Naturale",
    certifications: ["FSC Certified Wood Core"],
    technical_specs: { height_mm: 85, shape: "spool_rocchetto" },
    is_active: true,
  },
  {
    material_id: "MAT-MET-001",
    material_code: "ART-HW-EYELET-01",
    name: "Occhielli Metallici Ottone Trattamento Palladio Anti-Ossidazione",
    category: "hardware",
    vendor_id: "VND-GALV-FI-01",
    vendor_name: "Minuterie Metalliche Fiorenza S.p.A.",
    unit_of_measure: "pz",
    standard_cost: 0.12,
    color_shade: "Palladio Lucido",
    certifications: ["UNI EN 12472 Nickel-Free", "REACH"],
    technical_specs: { diameter_mm: 8, finish: "palladium" },
    is_active: true,
  },
  {
    material_id: "MAT-MET-002",
    material_code: "ART-HW-ZIP-02",
    name: "Cerniera Lampo Tranciata Metallo Finitura Oro Chiaro 18cm",
    category: "hardware",
    vendor_id: "VND-GALV-FI-01",
    vendor_name: "Minuterie Metalliche Fiorenza S.p.A.",
    unit_of_measure: "pz",
    standard_cost: 2.45,
    color_shade: "Oro Chiaro Satinato",
    certifications: ["Nickel-Free", "ISO 9001"],
    technical_specs: { length_cm: 18, teeth_size: "M5" },
    is_active: true,
  },
  {
    material_id: "MAT-FIL-001",
    material_code: "ART-THR-COATS-01",
    name: "Filato Poliestere Alta Tenacità per Calzatura Titolo 20",
    category: "thread",
    vendor_id: "VND-GALV-FI-01",
    vendor_name: "Minuterie Metalliche Fiorenza S.p.A.",
    unit_of_measure: "m",
    standard_cost: 0.04,
    color_shade: "Nero",
    certifications: ["OEKO-TEX Standard 100"],
    technical_specs: { ticket_size: 20, breaking_strength_cn: 9500 },
    is_active: true,
  },
  {
    material_id: "MAT-PCK-001",
    material_code: "ART-BOX-LUX-01",
    name: "Scatola Calzatura Rigida Avana Cartone Riciclato con Logo a Caldo",
    category: "packaging",
    vendor_id: "VND-SUOL-FM-01",
    vendor_name: "Suolificio del Tronto S.r.l.",
    unit_of_measure: "pz",
    standard_cost: 3.20,
    color_shade: "Avana / Nero",
    certifications: ["FSC Recycled 100%"],
    technical_specs: { dimensions_cm: "34x22x12", recycled_pct: 100 },
    is_active: true,
  },
];

export function bulkSwapMaterialClient(
  pimItems: PimCommercialItem[],
  materials: MaterialRecord[],
  vendors: VendorRecord[],
  payload: BulkMaterialSwapPayload,
  activePimId?: string,
  activeVariantId?: string
): { updatedPimItems: PimCommercialItem[]; result: BulkMaterialSwapResult } {
  const targetMat = materials.find((m) => m.material_id === payload.target_material_id);
  if (!targetMat) {
    throw new Error(`Target Material '${payload.target_material_id}' not found.`);
  }

  const targetName = payload.target_material_name || targetMat.name;
  const targetVendorId = payload.target_vendor_id || targetMat.vendor_id;
  const targetCost = payload.target_unit_cost ?? targetMat.standard_cost;
  const vendorObj = vendors.find((v) => v.vendor_id === targetVendorId);
  const vendorName = vendorObj ? vendorObj.company_name : targetMat.vendor_name || "";

  let swappedCount = 0;
  const impactedVariants: string[] = [];

  const targetVariantIds =
    payload.variant_ids && payload.variant_ids.length > 0 ? new Set(payload.variant_ids) : null;

  const updatedPimItems = pimItems.map((pim) => {
    if (activePimId && pim.pim_item_id !== activePimId && targetVariantIds === null) {
      return pim;
    }

    const updatedVariants = pim.plm_variants.map((variant) => {
      if (targetVariantIds && !targetVariantIds.has(variant.plm_variant_id)) {
        return variant;
      }
      if (!targetVariantIds && activeVariantId && activePimId && variant.plm_variant_id !== activeVariantId) {
        // preserve other variant if strictly isolated
      }

      let variantImpacted = false;
      const updatedBom = variant.bom_items.map((item) => {
        let match = false;
        if (payload.source_material_id && item.material_id === payload.source_material_id) {
          match = true;
        } else if (
          payload.source_material_name &&
          item.material_name.trim().toLowerCase() === payload.source_material_name.trim().toLowerCase()
        ) {
          match = true;
        }

        if (match) {
          swappedCount++;
          variantImpacted = true;
          return {
            ...item,
            material_id: targetMat.material_id,
            material_name: targetName,
            vendor_id: targetVendorId,
            supplier_name: vendorName || item.supplier_name,
            unit_cost_eur: payload.update_costs !== false ? targetCost : item.unit_cost_eur,
          };
        }
        return item;
      });

      if (variantImpacted) {
        impactedVariants.push(variant.plm_variant_id);
        return {
          ...variant,
          bom_items: updatedBom,
        };
      }
      return variant;
    });

    return {
      ...pim,
      plm_variants: updatedVariants,
    };
  });

  return {
    updatedPimItems,
    result: {
      swapped_items_count: swappedCount,
      impacted_variants: Array.from(new Set(impactedVariants)),
      target_material_id: targetMat.material_id,
      target_material_name: targetName,
      message: `Sostituiti con successo ${swappedCount} componenti su ${impactedVariants.length} varianti con '${targetName}'.`,
    },
  };
}



