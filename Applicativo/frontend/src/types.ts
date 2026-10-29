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
  | "seasons_collections"  // Modulo 01 (FTL-TECH-027)
  | "products"             // Modulo 02 (FTL-TECH-027)
  | "pim_catalog"          // Modulo 03 (FTL-TECH-027)
  | "vendor_management"    // Modulo 04 Gestione Fornitori (FTL-TECH-027)
  | "domain_registries"    // Modulo 05 (FTL-TECH-027)
  | "schema_studio"        // Modulo 06 (FTL-TECH-027)
  | "subcontractor_portal" // Modulo 07 (FTL-TECH-027)
  | "dpp_passport"         // Modulo 08 (FTL-TECH-027)
  | "training_academy"     // Modulo Formazione & Onboarding Hub
  | "tech_docs"            // Modulo Documentazione Tecnica & API
  // Backwards compatibility aliases
  | "district_paas"
  | "tannery_vault"
  | "production_orders"
  | "all"
  | "bridge_vertical_specs"
  | "bom_costing"
  | "training_academy"
  | "tech_docs";

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
  vendor_id?: string | null;
  master_color_id?: string | null;
  material_id?: string | null;
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
  primary_color_id?: string | null;
  secondary_color_id?: string | null;
  hardware_finish_color_id?: string | null;
  colorway_rule_preset?: string | null;
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

// ============================================================================
// Sprint 8 / FTL-CEO-021: Product Models Entity (Base Pattern & Last upstream of PIM)
// ============================================================================

export interface ProductModel {
  model_id: string;
  model_code: string;
  name: string;
  category: ProductCategory | string;
  target_gender?: string | null;
  last_code?: string | null;
  sole_construction?: string | null;
  heel_height_mm?: number | null;
  default_size_range?: string | null;
  season_id?: string | null;
  collection_id?: string | null;
  description?: string | null;
  cad_drawing_ref?: string | null;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  products_count?: number;
}

export interface ProductModelWithProducts extends ProductModel {
  products: PimCommercialItem[];
}

export interface PimCommercialItem {
  pim_item_id: string;
  sku_code: string;
  model_name: string;
  model_id?: string | null;
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
  vendor_id?: string | null;
  master_color_id?: string | null;
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

// ============================================================================
// Sprint 8 (Epoca II - La Verticalizzazione):
// 1. Color Intelligence Engine, Lab-Dip & Colorway BOM Matrix (FTL-TECH-022)
// 2. Vendor Hub 360°, Certifications, Scorecard L6 & Where-Used (FTL-TECH-023)
// ============================================================================

export interface MasterColor {
  id: string;
  color_id?: string;
  color_code: string;
  technical_name_it: string;
  technical_name_en: string;
  commercial_family: string;
  hex_code: string;
  pantone_tcx_code: string;
  ral_code: string;
  finish_type: string;
  applicable_domains: string[];
  season_id?: string | null;
  season_ids?: string[];
  recipe_notes?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ColorwayBomNodeMapping {
  id?: string;
  plm_variant_id: string;
  bom_item_id: string;
  level: number;
  parent_bom_item_id?: string | null;
  component_type: string;
  material_name: string;
  supplier_name: string;
  vendor_id?: string | null;
  master_color_id?: string | null;
  color_code?: string | null;
  technical_name_it?: string | null;
  commercial_family?: string | null;
  hex_code?: string | null;
  pantone_tcx_code?: string | null;
  ral_code?: string | null;
  finish_type?: string | null;
  part_role: string;
  galvanics_finish?: string | null;
  lab_dip_status:
    | "pending"
    | "submitted"
    | "approved"
    | "conditional_waiver"
    | "rejected"
    | "master_standard"
    | string;
  delta_e_value?: number | null;
  approved_by?: string | null;
  approved_at?: string | null;
  notes?: string;
  tannery_color_consistency?: "coherent" | "mismatch" | "not_linked" | string;
  linked_batch_code?: string | null;
}

export interface ColorwayMatrixResponse {
  plm_variant_id: string;
  variant_code: string;
  colorway_name: string;
  primary_color_id?: string | null;
  secondary_color_id?: string | null;
  hardware_finish_color_id?: string | null;
  colorway_rule_preset: string;
  total_bom_nodes: number;
  mapped_nodes_count: number;
  approved_nodes_count: number;
  rejected_nodes_count: number;
  colorway_readiness_pct: number;
  production_gate_blocked: boolean;
  mappings: ColorwayBomNodeMapping[];
}

export interface VendorCertification {
  cert_id: string;
  vendor_id: string;
  cert_type: string;
  cert_code: string;
  issuing_body: string;
  valid_from: string;
  valid_until: string;
  sha256_hash: string;
  days_to_expiry?: number;
  status: "valid" | "expiring_soon" | "expired" | "revoked" | string;
}

export interface VendorNegotiatedPriceItem {
  item_code: string;
  description: string;
  uom: string;
  unit_price_eur: number;
}

export interface VendorRecord {
  vendor_id: string;
  vendor_code: string;
  company_name: string;
  vat_number: string;
  district_company_id?: string | null;
  district_company?: Company | null;
  supply_chain_role: string;
  district_area: string;
  city_address?: string;
  country_iso2: string;
  paas_tier: "enterprise" | "pmi" | "subcontractor_zero_eur" | string;
  qualification_status: string;
  quality_score?: number | null;
  otd_score?: number | null;
  esg_score?: number | null;
  overall_rating?: number | null;
  rating_class?: string | null;
  standard_lead_time_days: number;
  moq_description?: string | null;
  payment_terms_l6?: string | null;
  hourly_or_unit_rate_eur_l6?: number | null;
  negotiated_price_list_l6?: VendorNegotiatedPriceItem[] | null;
  internal_audit_notes_l6?: string | null;
  contact_email: string;
  certifications: VendorCertification[];
  has_expired_critical_certs?: boolean;
  cert_semaphore_status?: "green" | "yellow" | "red" | string;
  l6_segregated?: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface VendorWhereUsedResponse {
  vendor_id: string;
  vendor_code: string;
  company_name: string;
  supply_chain_role: string;
  district_area?: string;
  paas_tier?: string;
  qualification_status: string;
  overall_rating?: number | null;
  has_expired_critical_certs?: boolean;
  l6_segregated?: boolean;
  impact_summary: {
    pim_models_count: number;
    plm_variants_count: number;
    bom_nodes_count: number;
    tannery_batches_count: number;
    active_production_orders_count: number;
    supply_chain_criticality: string;
  };
  financial_exposure_l6?: {
    avg_bom_cost_contribution_per_pair_eur: number;
    tannery_stock_value_eur?: number;
    estimated_seasonal_exposure_eur: number;
    hourly_or_unit_rate_eur?: number;
    payment_terms?: string;
  } | null;
  impacted_pim_items: Array<{
    pim_item_id: string;
    sku_code: string;
    model_name: string;
    season: string;
  }>;
  impacted_plm_variants: Array<{
    plm_variant_id: string;
    pim_item_id?: string;
    variant_code: string;
    colorway_name: string;
    lifecycle_status: string;
    bom_nodes_from_vendor: number;
  }>;
  impacted_bom_nodes: Array<{
    bom_item_id: string;
    plm_variant_id: string;
    variant_code: string;
    level: number;
    component_type: string;
    material_name: string;
    unit_of_measure: string;
    unit_consumption: number;
    unit_cost_eur_l6?: number | null;
  }>;
  impacted_tannery_batches: Array<{
    batch_id: string;
    batch_code: string;
    leather_type: string;
    lwg_rating: string;
    available_qty_sqft: number;
  }>;
}

// ============================================================================
// Sprint 9: Centralized Materials Catalog & Bulk Swap (FTL-TECH-031 / ADR-017)
// ============================================================================

export type MaterialCategory =
  | "leather"
  | "lining"
  | "fabric"
  | "sole_bottom"
  | "heel"
  | "hardware"
  | "thread"
  | "packaging"
  | "other";

export interface MaterialRecord {
  material_id: string;
  material_code: string;
  name: string;
  category: MaterialCategory | string;
  vendor_id?: string | null;
  vendor_name?: string | null;
  unit_of_measure: string;
  standard_cost: number;
  color_shade?: string | null;
  certifications: string[];
  technical_specs?: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BulkMaterialSwapPayload {
  source_material_id?: string | null;
  source_material_name?: string | null;
  target_material_id: string;
  target_material_name?: string | null;
  target_vendor_id?: string | null;
  target_unit_cost?: number | null;
  variant_ids?: string[] | null;
  update_costs?: boolean;
}

export interface BulkMaterialSwapResult {
  swapped_items_count: number;
  impacted_variants: string[];
  target_material_id: string;
  target_material_name: string;
  message: string;
}

