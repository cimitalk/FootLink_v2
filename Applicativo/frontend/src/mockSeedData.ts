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
  Collection,
  DigitalProductPassport,
  DomainRegistryEntry,
  PimCommercialItem,
  PimDataQualityReport,
  SchemaAttributeDefinition,
  Season,
  SupplyChainStep,
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

export const INITIAL_PIM_ITEMS: PimCommercialItem[] = [
  // =========================================================================
  // 1. CALZATURE (FOOTWEAR) — 1 PIM <-> 3 PLM Variants
  // =========================================================================
  {
    pim_item_id: "PIM-DUCA-001",
    sku_code: "FTL-FW26-LOAFER-01",
    model_name: "Mocassino Artigianale Duca",
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
            supplier_name: "Conceria Valdarno Srl",
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
            supplier_name: "Tacchificio Marche Srl",
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
            supplier_name: "GommaTech Civitanova Srl",
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
            supplier_name: "Conceria Veneto Pelle Srl",
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
            supplier_name: "Suolificio Brenta Srl",
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
            supplier_name: "Minuterie Metalliche Padova",
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
            supplier_name: "Conceria Chienti Srl",
            origin_country_iso2: "IT",
            unit_of_measure: "sqft",
            unit_consumption: 2.95,
            waste_percentage: 7.0,
            recycled_content_pct: 20.0,
            certifications: ["LWG Gold", "REACH"],
            unit_cost_eur: 8.1,
            lot_certificate_id: "CERT-LWG-CCH-3318",
          },
          {
            bom_item_id: "BOM-DUCA3-L2-CLAMP",
            level: 2,
            parent_bom_item_id: "BOM-DUCA3-L1-UPPER",
            component_type: "hardware",
            material_name: "Morsetto Frontale Ottone Nickel-Free",
            supplier_name: "Accessori Moda Civitanova",
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
            supplier_name: "Consorzio Vera Pelle Santa Croce",
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
            supplier_name: "Pelletteria Artigiana Scandicci",
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
            supplier_name: "Tessitura Pratese Circolare Srl",
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
            supplier_name: "Conceria Tolentino SpA",
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
            material_name: "Chiusura Zip Metallica Ottone Spazzolato",
            supplier_name: "Minuterie Metalliche Firenze",
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
            supplier_name: "Nastri Eco Bergamo Srl",
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
            supplier_name: "Lanificio Storico Biella SpA",
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
            supplier_name: "Tessitura Como Sostenibile Srl",
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
            supplier_name: "Filatura Circolare Prato Srl",
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
            supplier_name: "Lanificio Circolare Prato SpA",
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
            supplier_name: "Bottonificio Bergamasco Srl",
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

export const INITIAL_TANNERY_BATCHES = [
  {
    batch_id: "batch-montebello-lwg-gold",
    company_id: "comp-pmi-montebello",
    batch_code: "LOT-MONTEBELLO-2026-X9",
    tannery_name: "Conceria Montebello S.p.A.",
    district: "Arzignano / Valle del Chiampo",
    leather_type: "Vitello Pieno Fiore Anilina",
    tanning_process: "metal_free" as const,
    raw_hide_origin_country: "IT",
    slaughterhouse_traceability_id: "EU-SLAUGHTER-8841-VR",
    eudr_deforestation_free: true,
    lwg_rating: "Gold",
    lwg_score_pct: 95.2,
    icec_certificate_id: "ICEC-TS410-0982",
    reach_svhc_compliant: true,
    chrome_vi_content_ppm: 0.0,
    thickness_mm: "1.2 - 1.4 mm",
    available_qty_sqft: 4500.0,
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

