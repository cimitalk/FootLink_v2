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

export type CarryoverStatus = "carryover" | "seasonal_core" | "seasonal_trend" | "capsule_drop";

export type ConstructionType = "cassetta_cucita" | "blake" | "goodyear" | "tubolare_sacchetto" | "strobel" | "ago";

export interface ProductCategoryHierarchyNode {
  category_id: string;
  parent_id?: string | null;
  level: number;
  code: string;
  slug_path: string;
  label_it: string;
  label_en: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  children?: ProductCategoryHierarchyNode[];
}

export interface BomTemplateItem {
  level: number;
  parent_template_item_id?: string | null;
  template_item_id: string;
  component_type: BomComponentType;
  material_name: string;
  supplier_name: string;
  origin_country_iso2: string;
  unit_of_measure: string;
  unit_consumption: number;
  waste_percentage: number;
  recycled_content_pct: number;
  certifications: string[];
  unit_cost_eur: number;
}

export interface BomTemplate {
  template_id: string;
  name: string;
  category_id: string;
  construction_type: string;
  description: string;
  items: BomTemplateItem[];
  created_at?: string;
}

export interface BulkImportValidationRow {
  row_number: number;
  entity_type: string;
  identifier: string;
  is_valid: boolean;
  errors: string[];
  parsed_data: Record<string, any>;
}

export interface BulkImportValidationResponse {
  total_rows: number;
  valid_rows_count: number;
  invalid_rows_count: number;
  rows: BulkImportValidationRow[];
  summary: string;
}


export type PlmLifecycleStatus =
  | "prototype"
  | "sample"
  | "industrialized"
  | "in_production"
  | "archived"
  | "new_from_pim";

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
  | "district_paas"
  | "production_orders"
  | "tannery_vault"
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
  meta?: Record<string, any>;
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
  target_gender?: string;
  category_id?: string | null;
  sub_category_id?: string | null;
  construction_type?: string;
  carryover_status?: CarryoverStatus | string;
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
  category_id?: string | null;
  sub_category_id?: string | null;
  target_gender?: string;
  carryover_status?: CarryoverStatus | string;
  brand_line?: string;
  target_occasion?: string;
  price_tier?: string;
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

// ============================================================================
// Sprint 6: District PaaS (ADR-008 - 3-Tier Multi-Company Governance)
// ============================================================================

export type CompanyTier = "enterprise" | "pmi" | "subcontractor_zero_eur";

export type CompanyBusinessType =
  | "brand"
  | "manufacturer"
  | "tannery"
  | "subcontractor_lab"
  | "components_supplier";

export type DistrictUserRole =
  | "brand_admin"
  | "product_manager"
  | "factory_tech_lead"
  | "tannery_operator"
  | "subcontractor_operator"
  | "customs_inspector";

export interface Company {
  company_id: string;
  legal_name: string;
  business_name: string;
  vat_number: string;
  district: string;
  company_tier: CompanyTier;
  business_type: CompanyBusinessType;
  contact_email: string;
  phone?: string;
  website?: string;
  metadata?: Record<string, any>;
  meta?: Record<string, any>;
  is_active: boolean;
  created_at?: string;
}

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  is_platform_admin: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface CompanyMembership {
  membership_id: string;
  company_id: string;
  user_id: string;
  role: DistrictUserRole;
  status: string;
  user_email?: string;
  user_full_name?: string;
  company_business_name?: string;
  created_at?: string;
}

// ============================================================================
// Sprint 6: Tannery Leather Batches & Document Vault (FTL-CEO-006)
// ============================================================================

export type TanneryProcess = "vegetable" | "chrome" | "metal_free" | "synthetic_bio";

export type TanneryDocumentType =
  | "lwg_certificate"
  | "icec_traceability"
  | "reach_chemical_test"
  | "eudr_due_diligence"
  | "technical_sheet"
  | "invoice_transport";

export interface TanneryDocument {
  document_id: string;
  batch_id: string;
  doc_type: TanneryDocumentType;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  sha256_hash: string;
  data_payload?: string;
  valid_until?: string | null;
  is_verified: boolean;
  created_at?: string;
}

export interface TanneryDocumentVerifyResponse {
  document_id: string;
  batch_id: string;
  file_name: string;
  stored_sha256_hash: string;
  computed_sha256_hash: string;
  is_authentic: boolean;
  verification_status: string;
  verified_at: string;
}

export interface TanneryBatch {
  batch_id: string;
  company_id: string;
  batch_code: string;
  tannery_name: string;
  district: string;
  leather_type: string;
  tanning_process: TanneryProcess;
  raw_hide_origin_country: string;
  slaughterhouse_traceability_id: string;
  eudr_deforestation_free: boolean;
  lwg_rating: string;
  lwg_score_pct: number;
  icec_certificate_id: string;
  reach_svhc_compliant: boolean;
  chrome_vi_content_ppm: number;
  thickness_mm: string;
  available_qty_sqft: number;
  metadata?: Record<string, any>;
  meta?: Record<string, any>;
  is_active: boolean;
  documents: TanneryDocument[];
  created_at?: string;
}

// ============================================================================
// Sprint 6: Production Orders Hub, Size Breakdown & BOM Wastage (ADR-008)
// ============================================================================

export type ProductionOrderStatus =
  | "draft"
  | "released"
  | "in_production"
  | "quality_check"
  | "completed"
  | "halted"
  | "cancelled";

export interface OrderSizeBreakdownItem {
  id?: number;
  size_code: string;
  planned_quantity: number;
  completed_quantity?: number;
  scrapped_quantity?: number;
}

export interface ProductionOrderPhaseItem {
  phase_id: string;
  order_id: string;
  phase_code: ProductionPhase;
  phase_sequence: number;
  subcontractor_name: string;
  subcontractor_id?: string | null;
  district: string;
  status: string;
  target_quantity: number;
  conform_quantity: number;
  scrapped_quantity: number;
  waste_reason_code?: string | null;
  material_lot_code: string;
  magic_token: string;
  confirmed_at?: string | null;
  operator_notes?: string;
}

export interface ProductionOrder {
  order_id: string;
  order_code: string;
  company_id: string;
  plm_variant_id: string;
  pim_item_id: string;
  variant_code?: string;
  model_name?: string;
  season_id?: string | null;
  collection_id?: string | null;
  tannery_batch_id?: string | null;
  tannery_batch_code?: string | null;
  status: ProductionOrderStatus;
  total_planned_pairs: number;
  total_completed_pairs: number;
  total_scrapped_pairs: number;
  start_date?: string | null;
  target_delivery_date: string;
  notes: string;
  size_breakdown: OrderSizeBreakdownItem[];
  phases: ProductionOrderPhaseItem[];
  metadata?: Record<string, any>;
  meta?: Record<string, any>;
  created_at?: string;
}

export interface BomSizeRequirementItem {
  bom_item_id: string;
  material_name: string;
  component_type: string;
  unit_of_measure: string;
  base_consumption: number;
  grading_delta_pct: number;
  waste_percentage: number;
  net_requirement: number;
  gross_requirement_with_waste: number;
  requirement_by_size: Record<string, number>;
}

export interface BomRequirementsCalculationResult {
  plm_variant_id: string;
  total_pairs: number;
  requirements: BomSizeRequirementItem[];
  total_leather_sqft_gross: number;
  total_soles_pairs_gross: number;
  calculated_at: string;
}
