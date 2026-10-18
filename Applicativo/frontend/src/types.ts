/**
 * Core TypeScript Domain Models for Footlink
 * Implements 1 PIM Commercial Item <-> N PLM Production Variants, 3-Level BOM,
 * 0 EUR Mobile Subcontractor Portal ("3 Clic a 0 €"), and Live EU ESPR DPP Generator.
 */

export type ProductCategory = "footwear" | "leather_goods" | "apparel";

export type PlmLifecycleStatus =
  | "prototype"
  | "sample"
  | "industrialized"
  | "in_production"
  | "archived";

export type BomComponentType =
  | "upper"
  | "lining"
  | "insole"
  | "outsole"
  | "heel"
  | "hardware"
  | "fabric"
  | "packaging"
  | "sub_assembly";

export type ProductionPhase =
  | "tanning_material"
  | "cutting"
  | "stitching_upper"
  | "lasting_assembly"
  | "finishing"
  | "quality_control";

export interface SubcontractorAssignment {
  assignment_id: string;
  subcontractor_name: string;
  district: string;
  phase: ProductionPhase;
  material_lot_code: string;
  completed: boolean;
  confirmed_at?: string | null;
}

export interface BomItem {
  bom_item_id: string;
  level: number; // 1 = Direct, 2 = Sub-assembly, 3 = Tier-2/Raw Material
  parent_bom_item_id?: string | null;
  component_type: BomComponentType;
  material_name: string;
  supplier_name: string;
  origin_country_iso2: string;
  unit_of_measure: string;
  unit_consumption: number;
  waste_percentage: number;
  recycled_content_pct: number;
  certifications: string[];
}

export interface BomTreeNode extends BomItem {
  children: BomTreeNode[];
}

export interface BomHierarchySummary {
  level_1_count: number;
  level_2_count: number;
  level_3_count: number;
  max_depth_reached: number;
  total_components: number;
}

export interface PlmProductionVariant {
  plm_variant_id: string;
  pim_item_id: string;
  variant_code: string;
  colorway_name: string;
  size_range: string;
  last_or_pattern_code: string;
  lifecycle_status: PlmLifecycleStatus;
  bom_items: BomItem[];
  subcontractor_assignments: SubcontractorAssignment[];
  created_at?: string;
}

export interface PimCommercialItem {
  pim_item_id: string;
  sku_code: string;
  model_name: string;
  brand_tenant_id: string;
  season: string;
  category: ProductCategory;
  commercial_description_it: string;
  commercial_description_en: string;
  retail_channels: string[];
  plm_variants: PlmProductionVariant[];
  created_at?: string;
}

export interface SupplyChainStep {
  plm_variant_id: string;
  variant_code: string;
  assignment_id: string;
  phase: ProductionPhase | string;
  subcontractor: string;
  district: string;
  material_lot_code: string;
  completed: boolean;
  confirmed_at?: string | null;
}

export interface DigitalProductPassport {
  dpp_id: string;
  regulation_standard: string;
  pim_item_id: string;
  sku_code: string;
  model_name: string;
  category: ProductCategory;
  brand_tenant_id: string;
  public_qr_url: string;
  qr_target_url: string;
  qr_svg_endpoint: string;
  qr_svg_data_uri: string;
  total_plm_variants_covered: number;
  countries_of_origin: string[];
  certifications_verified: string[];
  average_recycled_content_pct: number;
  carbon_footprint_estimate_kg: number;
  repairability_index: number;
  traceable_subcontractors_count: number;
  completed_subcontractor_steps_count: number;
  total_subcontractor_steps_count: number;
  bom_hierarchy_summary: BomHierarchySummary;
  espr_compliance_checklist: Record<string, boolean>;
  supply_chain_steps: SupplyChainStep[];
  generated_at: string;
  dpp_compliance_ready: boolean;
}
