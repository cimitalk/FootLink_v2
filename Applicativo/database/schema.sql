-- ============================================================================
-- Footlink Core Database Schema (SQLite Local 0 EUR & PostgreSQL Neon/Supabase)
-- Architecture Reference: ADR-002, ADR-003, ADR-006, ADR-007
-- Domain: Footwear, Leather Goods & Apparel Supply Chain + EU ESPR DPP
-- Sprint 5: Seasons & Collections, Domain Registries & Dynamic Schema Attributes
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 0. Seasons & Collections (Sprint 5: 1 Season -> N Collections)
CREATE TABLE IF NOT EXISTS seasons (
    season_id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active'
        CHECK (status IN ('planning', 'active', 'production', 'archived')),
    start_date VARCHAR(32) NULL,
    end_date VARCHAR(32) NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collections (
    collection_id VARCHAR(64) PRIMARY KEY,
    season_id VARCHAR(64) NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_market VARCHAR(128) NOT NULL DEFAULT 'Global Luxury',
    status VARCHAR(32) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'approved', 'in_production', 'closed')),
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES seasons(season_id) ON DELETE CASCADE,
    UNIQUE (season_id, code)
);

-- 1. PIM Commercial Items (The "1" side: Master Sales & Omnichannel Catalog)
CREATE TABLE IF NOT EXISTS pim_commercial_items (
    pim_item_id VARCHAR(64) PRIMARY KEY,
    sku_code VARCHAR(128) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    brand_tenant_id VARCHAR(128) NOT NULL,
    season VARCHAR(32) NOT NULL,
    season_id VARCHAR(64) NULL,
    collection_id VARCHAR(64) NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('footwear', 'leather_goods', 'apparel')),
    commercial_description_it TEXT NOT NULL,
    commercial_description_en TEXT NOT NULL,
    retail_channels_json TEXT NOT NULL DEFAULT '["B2B Showroom", "E-Commerce"]',
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (brand_tenant_id, sku_code),
    FOREIGN KEY (season_id) REFERENCES seasons(season_id) ON DELETE SET NULL,
    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE SET NULL
);

-- 2. PLM Production Variants (The "N" side: Factory Technical Variants)
CREATE TABLE IF NOT EXISTS plm_production_variants (
    plm_variant_id VARCHAR(64) PRIMARY KEY,
    pim_item_id VARCHAR(64) NOT NULL,
    collection_id VARCHAR(64) NULL,
    variant_code VARCHAR(128) NOT NULL,
    colorway_name VARCHAR(128) NOT NULL,
    size_range VARCHAR(64) NOT NULL DEFAULT '35-42',
    last_or_pattern_code VARCHAR(128) NOT NULL,
    lifecycle_status VARCHAR(32) NOT NULL DEFAULT 'prototype'
        CHECK (lifecycle_status IN ('prototype', 'sample', 'industrialized', 'in_production', 'archived')),
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pim_item_id) REFERENCES pim_commercial_items(pim_item_id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE SET NULL,
    UNIQUE (pim_item_id, variant_code)
);

-- 3. Multi-Level Bill of Materials (BOM) - 3-Level Hierarchy (Level 1 -> Level 2 -> Level 3)
CREATE TABLE IF NOT EXISTS bom_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bom_item_id VARCHAR(64) NOT NULL,
    plm_variant_id VARCHAR(64) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
    parent_bom_item_id VARCHAR(64) NULL,
    component_type VARCHAR(32) NOT NULL
        CHECK (component_type IN ('upper', 'lining', 'insole', 'outsole', 'heel', 'hardware', 'fabric', 'packaging', 'sub_assembly')),
    material_name VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    origin_country_iso2 CHAR(2) NOT NULL,
    unit_of_measure VARCHAR(32) NOT NULL,
    unit_consumption REAL NOT NULL CHECK (unit_consumption > 0),
    waste_percentage REAL NOT NULL DEFAULT 5.0 CHECK (waste_percentage >= 0.0 AND waste_percentage <= 100.0),
    recycled_content_pct REAL NOT NULL DEFAULT 0.0 CHECK (recycled_content_pct >= 0.0 AND recycled_content_pct <= 100.0),
    certifications_json TEXT NOT NULL DEFAULT '[]',
    metadata_json TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (plm_variant_id) REFERENCES plm_production_variants(plm_variant_id) ON DELETE CASCADE,
    UNIQUE (plm_variant_id, bom_item_id)
);

-- 4. Subcontractor Assignments ("Portale Mobile Terzista 3 Clic a 0 EUR")
CREATE TABLE IF NOT EXISTS subcontractor_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id VARCHAR(64) NOT NULL,
    plm_variant_id VARCHAR(64) NOT NULL,
    subcontractor_name VARCHAR(255) NOT NULL,
    district VARCHAR(128) NOT NULL,
    phase VARCHAR(64) NOT NULL
        CHECK (phase IN ('tanning_material', 'cutting', 'stitching_upper', 'lasting_assembly', 'finishing', 'quality_control')),
    material_lot_code VARCHAR(128) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    confirmed_at TIMESTAMP NULL,
    FOREIGN KEY (plm_variant_id) REFERENCES plm_production_variants(plm_variant_id) ON DELETE CASCADE,
    UNIQUE (plm_variant_id, assignment_id)
);

-- 5. Domain Registries (Sprint 5: Master Data for PLM & PIM)
CREATE TABLE IF NOT EXISTS domain_registries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registry_domain VARCHAR(16) NOT NULL CHECK (registry_domain IN ('pim', 'plm')),
    registry_name VARCHAR(64) NOT NULL,
    entry_code VARCHAR(128) NOT NULL,
    label_it VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (registry_domain, registry_name, entry_code)
);

-- 6. Schema Attribute Definitions (Sprint 5: Dynamic schema extensions configurable by Founder)
CREATE TABLE IF NOT EXISTS schema_attribute_definitions (
    attribute_id VARCHAR(64) PRIMARY KEY,
    target_entity VARCHAR(32) NOT NULL CHECK (target_entity IN ('pim_item', 'plm_variant', 'bom_item')),
    field_key VARCHAR(128) NOT NULL,
    label_it VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    field_type VARCHAR(32) NOT NULL CHECK (field_type IN ('text', 'number', 'select', 'boolean', 'date')),
    options_json TEXT NOT NULL DEFAULT '[]',
    is_required BOOLEAN NOT NULL DEFAULT 0,
    default_value TEXT NULL,
    group_name VARCHAR(128) NOT NULL DEFAULT 'General',
    is_system BOOLEAN NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (target_entity, field_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_season_id ON collections(season_id);
CREATE INDEX IF NOT EXISTS idx_pim_items_season_id ON pim_commercial_items(season_id);
CREATE INDEX IF NOT EXISTS idx_pim_items_collection_id ON pim_commercial_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_plm_variants_pim_id ON plm_production_variants(pim_item_id);
CREATE INDEX IF NOT EXISTS idx_plm_variants_collection_id ON plm_production_variants(collection_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_variant_id ON bom_items(plm_variant_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_parent_id ON bom_items(plm_variant_id, parent_bom_item_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_variant_id ON subcontractor_assignments(plm_variant_id);
CREATE INDEX IF NOT EXISTS idx_domain_registries_lookup ON domain_registries(registry_domain, registry_name, is_active);
CREATE INDEX IF NOT EXISTS idx_schema_attributes_target ON schema_attribute_definitions(target_entity);
