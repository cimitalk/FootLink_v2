/**
 * Core TypeScript Domain Models for Footlink (Sprint 5 - Design System v2.0 & Full Process Suite)
 * Implements:
 * - 1 PIM Commercial Item <-> N PLM Production Variants
 * - Vertical Category Tech Specs (Footwear, Leather Goods, Apparel)
 * - 3-Level BOM with Size Grading & L6 Segregated Industrial Costing (ADR-006)
 * - PIM Data Quality Engine (0-100%) & Omnichannel Syndication Export (FEAT-05)
 * - 0 EUR Mobile Subcontractor Portal ("3 Clic a 0 €")
 * - Live EU ESPR Digital Product Passport (Consumer Public View vs Customs/Inspector L6 View)
 * - Sprint 5: Seasons & Collections (1 Season -> N Collections), Master Domain Registries, Dynamic Schema Studio (ADR-007)
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

export type ViewerSecurityRole = "brand" | "subcontractor";

export type ActiveWorkspaceModule =
  | "home"
  | "products"
  | "seasons_collections"
  | "domain_registries"
  | "schema_studio"
  | "subcontractor_portal"
  | "dpp_passport"
  // Legacy / granular aliases for full backwards compatibility
  | "all"
  | "pim_catalog"
  | "bridge_vertical_specs"
  | "bom_costing";

// ============================================================================
// Sprint 5: Seasons & Collections Types (ADR-007)
// ============================================================================

export type SeasonStatus = "planning" | "active" | "production" | "archived";

export type CollectionStatus = "draft" | "approved" | "in_production" | "closed";

export interface Collection {
  collection_id: string;
  season_id: string;
  code: string;
  name: string;
  target_market: string;
  status: CollectionStatus;
  description?: string;
  products_count?: number;
  created_at?: string;
}

export interface Season {
  season_id: string;
  code: string;
  name: string;
  year: number;
  status: SeasonStatus;
  start_date?: string | null;
  end_date?: string | null;
  description?: string;
  collections: Collection[];
  linked_products_count?: number;
  created_at?: string;
}

// ============================================================================
// Sprint 5: Domain Registries Types (Tabelle Anagrafiche di Dominio)
// ============================================================================

export type RegistryDomain = "pim" | "plm";

export interface DomainRegistryEntry {
  id?: number;
  registry_domain: RegistryDomain;
  registry_name: string;
  entry_code: string;
  label_it: string;
  label_en: string;
  metadata?: Record<string, any>;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

// ============================================================================
// Sprint 5: Dynamic Schema Attributes Types (Founder Data Model Studio)
// ============================================================================

export type AttributeFieldType = "text" | "number" | "select" | "boolean" | "date";

export type AttributeTargetEntity = "pim_item" | "plm_variant" | "bom_item";

export interface SchemaAttributeDefinition {
  attribute_id: string;
  target_entity: AttributeTargetEntity;
  field_key: string;
  label_it: string;
  label_en: string;
  field_type: AttributeFieldType;
  options: string[];
  is_required: boolean;
  default_value?: any;
  group_name: string;
  is_system: boolean;
  description?: string;
  created_at?: string;
}

// ============================================================================
// Subcontractor & BOM Types
// ============================================================================

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
  level: number; // 1 = Macro-Assembly, 2 = Semi-finished/Main Material, 3 = Raw Material/Chemical
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
  unit_cost_eur?: number; // L6 Brand-only unit cost
  lot_certificate_id?: string; // Customs/Inspector certificate reference
  custom_attributes?: Record<string, any>;
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
  collection_id?: string | null;
  variant_code: string;
  colorway_name: string;
  size_range: string;
  last_or_pattern_code: string;
  lifecycle_status: PlmLifecycleStatus;
  bom_version?: string;
  bom_snapshot_locked?: boolean;
  sample_base_size?: string;
  size_grading_step_pct?: number;
  standard_labor_cost_eur?: number;
  category_specific_specs?: Record<string, any>;
  custom_attributes?: Record<string, any>;
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
  season_id?: string | null;
  collection_id?: string | null;
  collection_name?: string | null;
  category: ProductCategory;
  commercial_description_it: string;
  commercial_description_en: string;
  retail_channels: string[];
  wholesale_price_eur?: number;
  retail_price_eur?: number;
  hs_customs_code?: string;
  gtin_ean?: string;
  publishing_status?: string;
  care_instructions?: string;
  end_of_life_guide?: string;
  custom_attributes?: Record<string, any>;
  plm_variants: PlmProductionVariant[];
  created_at?: string;
}

export interface PimDataQualityReport {
  pim_item_id: string;
  sku_code: string;
  model_name: string;
  data_quality_score: number;
  dpp_publication_unlocked: boolean;
  checks: Record<string, boolean>;
  missing_fields: string[];
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
  water_footprint_liters?: number;
  repairability_index: number;
  data_quality_score?: number;
  traceable_subcontractors_count: number;
  completed_subcontractor_steps_count: number;
  total_subcontractor_steps_count: number;
  bom_hierarchy_summary: BomHierarchySummary;
  espr_compliance_checklist: Record<string, boolean>;
  supply_chain_steps: SupplyChainStep[];
  customs_inspector_dossier?: Record<string, unknown>;
  generated_at: string;
  dpp_compliance_ready: boolean;
}
