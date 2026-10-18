/**
 * Initial Made-in-Italy Reference Dataset & Client-side DPP Synthesis Engine
 * Mirrors `Applicativo/backend/app/seed.py` so the React UI works both connected to FastAPI
 * (`http://127.0.0.1:8000`) and in standalone/offline mode.
 */

import {
  BomItem,
  BomTreeNode,
  DigitalProductPassport,
  PimCommercialItem,
  SupplyChainStep,
} from "./types";

export const INITIAL_PIM_ITEMS: PimCommercialItem[] = [
  {
    pim_item_id: "PIM-DUCA-001",
    sku_code: "FTL-FW26-LOAFER-01",
    model_name: "Mocassino Artigianale Duca",
    brand_tenant_id: "TENANT-CALZATURIFICIO-ROSSI",
    season: "FW26",
    category: "footwear",
    commercial_description_it:
      "Mocassino classico cucito Blake in vitello pieno fiore e camoscio certificato LWG Gold, lavorato nei distretti di Fermo-Macerata, Santa Croce sull'Arno e Riviera del Brenta.",
    commercial_description_en:
      "Blake-stitched artisanal loafer in LWG Gold certified full-grain calfskin and suede, crafted across Fermo-Macerata, Santa Croce sull'Arno, and Riviera del Brenta districts.",
    retail_channels: ["B2B Showroom Milano", "E-Commerce Flagship", "Boutique Wholesale"],
    plm_variants: [
      {
        plm_variant_id: "PLM-DUCA-NERO",
        pim_item_id: "PIM-DUCA-001",
        variant_code: "FTL-LOAFER-01-VIT-NERO",
        colorway_name: "Vitello Nero Spazzolato",
        size_range: "38-46",
        last_or_pattern_code: "FORMA-FM-108",
        lifecycle_status: "in_production",
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
            confirmed_at: "2026-10-18T08:30:00Z",
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
            confirmed_at: "2026-10-18T08:30:00Z",
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
            confirmed_at: "2026-10-18T08:30:00Z",
          },
        ],
      },
    ],
  },
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
    retail_channels: ["Boutique Diretta", "E-Commerce Global", "Department Stores EU"],
    plm_variants: [
      {
        plm_variant_id: "PLM-VELA-COGNAC",
        pim_item_id: "PIM-VELA-002",
        variant_code: "FTL-TOTE-02-VAC-COGNAC",
        colorway_name: "Vacchetta Cognac Naturale",
        size_range: "OS",
        last_or_pattern_code: "MOD-SCANDICCI-44",
        lifecycle_status: "in_production",
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
            confirmed_at: "2026-10-18T08:30:00Z",
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
            confirmed_at: "2026-10-18T08:30:00Z",
          },
        ],
      },
    ],
  },
];

export function buildBomTree(items: BomItem[]): BomTreeNode[] {
  const map: Record<string, BomTreeNode> = {};
  for (const item of items) {
    map[item.bom_item_id] = { ...item, children: [] };
  }
  const roots: BomTreeNode[] = [];
  for (const item of items) {
    const node = map[item.bom_item_id];
    if (item.level > 1 && item.parent_bom_item_id && map[item.parent_bom_item_id]) {
      map[item.parent_bom_item_id].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function generateSvgQrMarkup(skuCode: string, dppId: string): string {
  const gridSize = 25;
  const matrix: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
  const reserved: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  const placeFinder = (rOff: number, cOff: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rOff + r;
        const cc = cOff + c;
        if (rr >= 0 && rr < gridSize && cc >= 0 && cc < gridSize) {
          reserved[rr][cc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
              matrix[rr][cc] = true;
            }
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, gridSize - 7);
  placeFinder(gridSize - 7, 0);

  for (let i = 8; i < gridSize - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  const seedStr = `${skuCode}|${dppId}|EU-ESPR-DPP`;
  let hash = 2166136261;
  const bits: boolean[] = [];
  for (let round = 0; round < 16; round++) {
    for (let i = 0; i < seedStr.length; i++) {
      hash ^= seedStr.charCodeAt(i) + round;
      hash = Math.imul(hash, 16777619);
      for (let b = 0; b < 8; b++) {
        bits.push(((hash >> b) & 1) === 1);
      }
    }
  }

  let idx = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!reserved[r][c]) {
        matrix[r][c] = bits[idx % bits.length];
        idx++;
      }
    }
  }

  const cell = 7;
  const margin = 16;
  const width = gridSize * cell + margin * 2;
  const height = width + 28;
  const rects: string[] = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (matrix[r][c]) {
        const x = margin + c * cell;
        const y = margin + r * cell;
        rects.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="1" fill="#0f172a"/>`);
      }
    }
  }

  const center = Math.floor((gridSize * cell) / 2) + margin;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    ${rects.join("")}
    <rect x="${width / 2 - 22}" y="${center - 12}" width="44" height="24" rx="5" fill="#0f172a" stroke="#ffffff" stroke-width="2"/>
    <text x="${width / 2}" y="${center + 4}" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="10" font-weight="800">EU DPP</text>
    <text x="${width / 2}" y="${height - 10}" text-anchor="middle" fill="#334155" font-family="monospace" font-size="9.5" font-weight="700">${skuCode}</text>
  </svg>`;
}

export function synthesizeClientDpp(item: PimCommercialItem): DigitalProductPassport {
  const countries = new Set<string>();
  const certs = new Set<string>();
  const recycled: number[] = [];
  const steps: SupplyChainStep[] = [];
  const subs = new Set<string>();
  const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  let maxDepth = 1;
  let totalComponents = 0;
  let completedSteps = 0;

  for (const v of item.plm_variants) {
    for (const b of v.bom_items) {
      totalComponents++;
      const lvl = Math.min(Math.max(b.level, 1), 3);
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
      if (b.level > maxDepth) maxDepth = b.level;
      countries.add(b.origin_country_iso2);
      b.certifications.forEach((c) => certs.add(c));
      recycled.push(b.recycled_content_pct);
    }
    for (const s of v.subcontractor_assignments) {
      subs.add(s.subcontractor_name);
      if (s.completed) completedSteps++;
      steps.push({
        plm_variant_id: v.plm_variant_id,
        variant_code: v.variant_code,
        assignment_id: s.assignment_id,
        phase: s.phase,
        subcontractor: s.subcontractor_name,
        district: s.district,
        material_lot_code: s.material_lot_code,
        completed: s.completed,
        confirmed_at: s.confirmed_at || null,
      });
    }
  }

  const avgRecycled =
    recycled.length > 0
      ? Math.round((recycled.reduce((a, b) => a + b, 0) / recycled.length) * 100) / 100
      : 0;
  const baseCo2 = item.category === "footwear" ? 14.8 : 18.2;
  const co2 = Math.round(baseCo2 * (1 - avgRecycled / 250) * 100) / 100;
  const dppId = `DPP-EU-${item.sku_code}`;
  const svgMarkup = generateSvgQrMarkup(item.sku_code, dppId);

  return {
    dpp_id: dppId,
    regulation_standard: "EU-ESPR-DPP-v1.0",
    pim_item_id: item.pim_item_id,
    sku_code: item.sku_code,
    model_name: item.model_name,
    category: item.category,
    brand_tenant_id: item.brand_tenant_id,
    public_qr_url: `https://dpp.footlink.eu/${item.brand_tenant_id}/${item.sku_code}`,
    qr_target_url: `/dpp/${item.pim_item_id}`,
    qr_svg_endpoint: `/api/v1/pim-items/${item.pim_item_id}/dpp-qr.svg`,
    qr_svg_data_uri: `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`,
    total_plm_variants_covered: item.plm_variants.length,
    countries_of_origin: Array.from(countries).sort(),
    certifications_verified: Array.from(certs).sort(),
    average_recycled_content_pct: avgRecycled,
    carbon_footprint_estimate_kg: co2,
    repairability_index: certs.has("LWG Gold") ? 9.2 : 8.4,
    traceable_subcontractors_count: subs.size,
    completed_subcontractor_steps_count: completedSteps,
    total_subcontractor_steps_count: steps.length,
    bom_hierarchy_summary: {
      level_1_count: levelCounts[1],
      level_2_count: levelCounts[2],
      level_3_count: levelCounts[3],
      max_depth_reached: maxDepth,
      total_components: totalComponents,
    },
    espr_compliance_checklist: {
      unique_product_identifier: true,
      one_pim_to_n_plm_bridge: item.plm_variants.length >= 1,
      multilevel_bom_traceability: totalComponents > 0,
      district_tier1_tier2_confirmed: steps.length > 0,
      chemical_reach_compliance: certs.has("REACH") || certs.has("LWG Gold"),
      circularity_and_repairability: avgRecycled > 0,
    },
    supply_chain_steps: steps,
    generated_at: new Date().toISOString(),
    dpp_compliance_ready: countries.size > 0 && steps.length > 0,
  };
}
