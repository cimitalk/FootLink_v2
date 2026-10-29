import React, { useEffect, useState } from "react";
import { BomThreeLevelTree } from "./components/BomThreeLevelTree";
import { DataModelSchemaStudio } from "./components/DataModelSchemaStudio";
import { DistrictPaasManager } from "./components/DistrictPaasManager";
import { DomainRegistriesManager } from "./components/DomainRegistriesManager";
import { FootlinkHomeHub } from "./components/FootlinkHomeHub";
import { LiveDppPassportGenerator } from "./components/LiveDppPassportGenerator";
import { PimCatalogManager } from "./components/PimCatalogManager";
import { PlmProductsManager } from "./components/PlmProductsManager";
import { ProductionOrdersManager } from "./components/ProductionOrdersManager";
import { SeasonsCollectionsHub } from "./components/SeasonsCollectionsHub";
import { SubcontractorMobilePortal } from "./components/SubcontractorMobilePortal";
import { SupplierManagementHub } from "./components/SupplierManagementHub";
import { TanneryVaultManager } from "./components/TanneryVaultManager";
import {
  ColorwayExplosionPayload,
  INITIAL_COMPANIES,
  INITIAL_MASTER_COLORS,
  INITIAL_MATERIALS,
  INITIAL_MEMBERSHIPS,
  INITIAL_PIM_ITEMS,
  INITIAL_PRODUCT_MODELS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_REGISTRIES,
  INITIAL_SCHEMA_ATTRIBUTES,
  INITIAL_SEASONS,
  INITIAL_TANNERY_BATCHES,
  INITIAL_USERS,
  INITIAL_VENDORS,
  applyVendorL6SegregationClient,
  bulkSwapMaterialClient,
  computeLocalColorwayMatrix,
  computeLocalWhereUsed,
  computeVendorRating,
  evaluateVendorCertificationsSemaphore,
  explodeColorwaysClient,
  synthesizeClientDpp,
} from "./mockSeedData";
import {
  ActiveWorkspaceModule,
  AttributeFieldType,
  AttributeTargetEntity,
  BomItem,
  BomRequirementsCalculationResult,
  BulkMaterialSwapPayload,
  BulkMaterialSwapResult,
  Collection,
  CollectionStatus,
  ColorwayMatrixResponse,
  Company,
  CompanyBusinessType,
  CompanyMembership,
  CompanyTier,
  DigitalProductPassport,
  DistrictUserRole,
  DomainRegistryEntry,
  MasterColor,
  MaterialRecord,
  OrderSizeBreakdownItem,
  PimCommercialItem,
  PlmLifecycleStatus,
  PlmProductionVariant,
  ProductCategory,
  ProductModel,
  ProductionOrder,
  ProductionOrderStatus,
  RegistryDomain,
  SchemaAttributeDefinition,
  Season,
  SeasonStatus,
  SubcontractorAssignment,
  TanneryBatch,
  TanneryDocumentType,
  TanneryDocumentVerifyResponse,
  TanneryProcess,
  User,
  VendorCertification,
  VendorRecord,
  VendorWhereUsedResponse,
  ViewerSecurityRole,
} from "./types";

const API_BASE = "http://127.0.0.1:8000";

function normalizeMasterColorRecord(raw: any): MasterColor {
  const resolvedId = raw.id || raw.color_id || raw.color_code;
  return {
    ...raw,
    id: resolvedId,
    color_id: raw.color_id || resolvedId,
    applicable_domains: Array.isArray(raw.applicable_domains)
      ? raw.applicable_domains
      : ["pellame"],
    is_active: raw.is_active !== false,
  };
}

function normalizeVendorApiRecord(raw: any): VendorRecord {
  const certs = Array.isArray(raw.certifications) ? raw.certifications : [];
  const sem = evaluateVendorCertificationsSemaphore(certs);
  return {
    ...raw,
    vendor_id: raw.vendor_id || raw.id || raw.vendor_code,
    certifications: sem.certifications,
    has_expired_critical_certs:
      typeof raw.has_expired_critical_certs === "boolean"
        ? raw.has_expired_critical_certs
        : sem.has_expired_critical_certs,
    cert_semaphore_status: raw.cert_semaphore_status || sem.cert_semaphore_status,
    is_active: raw.is_active !== false,
  };
}

export const App: React.FC = () => {
  const [pimItems, setPimItems] = useState<PimCommercialItem[]>(INITIAL_PIM_ITEMS);
  const [seasons, setSeasons] = useState<Season[]>(INITIAL_SEASONS);
  const [registries, setRegistries] = useState<DomainRegistryEntry[]>(INITIAL_REGISTRIES);
  const [schemaAttributes, setSchemaAttributes] = useState<SchemaAttributeDefinition[]>(
    INITIAL_SCHEMA_ATTRIBUTES
  );

  // Sprint 6 States: District PaaS, Tannery Vault & Work Orders Hub
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    INITIAL_COMPANIES[0].company_id
  );
  const [companyMemberships, setCompanyMemberships] = useState<CompanyMembership[]>(
    INITIAL_MEMBERSHIPS
  );
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [tanneryBatches, setTanneryBatches] = useState<TanneryBatch[]>(INITIAL_TANNERY_BATCHES);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(
    INITIAL_PRODUCTION_ORDERS
  );

  // Sprint 8 States: Color Intelligence Engine & Vendor Hub 360° (FTL-TECH-022 / FTL-TECH-023)
  const [masterColors, setMasterColors] = useState<MasterColor[]>(INITIAL_MASTER_COLORS);
  const [rawVendors, setRawVendors] = useState<VendorRecord[]>(INITIAL_VENDORS);
  const [vendors, setVendors] = useState<VendorRecord[]>(INITIAL_VENDORS);
  const [colorwayMatrices, setColorwayMatrices] = useState<
    Record<string, ColorwayMatrixResponse>
  >({});
  // Sprint 8 / FTL-CEO-021: Product Models upstream of PIM
  const [productModels, setProductModels] = useState<ProductModel[]>(INITIAL_PRODUCT_MODELS);

  const [selectedPimId, setSelectedPimId] = useState<string>(
    INITIAL_PIM_ITEMS[0].pim_item_id
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    INITIAL_PIM_ITEMS[0].plm_variants[0].plm_variant_id
  );
  const [activeModule, setActiveModule] = useState<ActiveWorkspaceModule>("home");
  const [viewerRole, setViewerRole] = useState<ViewerSecurityRole>("brand");
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>("ALL");
  // FTL-PROD-014: collection focused in Module 01 (click again to deselect)
  const [selectedHubCollectionId, setSelectedHubCollectionId] = useState<string | undefined>(undefined);

  // Sprint 9 / FTL-TECH-030 / FTL-TECH-031: Materials Catalog & Sub-Tab State
  const [materials, setMaterials] = useState<MaterialRecord[]>(INITIAL_MATERIALS);
  const [supplierHubSubTab, setSupplierHubSubTab] = useState<
    "vendors" | "district" | "tannery" | "materials"
  >("vendors");

  const [dppData, setDppData] = useState<DigitalProductPassport>(() =>
    synthesizeClientDpp(INITIAL_PIM_ITEMS[0])
  );

  // Sync with FastAPI backend if running on localhost:8000
  const refreshPimItems = () => {
    fetch(`${API_BASE}/api/v1/pim-items`)
      .then((res) => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then((items: PimCommercialItem[]) => {
        if (items && items.length > 0) {
          setPimItems(items);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/pim-items`)
      .then((res) => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then((items: PimCommercialItem[]) => {
        if (items && items.length > 0) {
          setPimItems(items);
          setSelectedPimId(items[0].pim_item_id);
          setSelectedVariantId(items[0].plm_variants[0]?.plm_variant_id || "");
          setBackendConnected(true);
        }
      })
      .catch(() => {
        setBackendConnected(false);
      });

    // Fetch master seasons
    fetch(`${API_BASE}/api/v1/seasons`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Season[]) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setSeasons(data);
        }
      })
      .catch(() => {});

    // Fetch master domain registries
    fetch(`${API_BASE}/api/v1/registries`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: any) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setRegistries(data);
        } else if (data && data.entries && Array.isArray(data.entries)) {
          setRegistries(data.entries);
        }
      })
      .catch(() => {});

    // Fetch dynamic schema attributes
    fetch(`${API_BASE}/api/v1/schema/entities/pim_item/attributes`)
      .then((res) => (res.ok ? res.json() : null))
      .then((pimAttrs) => {
        if (pimAttrs && Array.isArray(pimAttrs)) {
          fetch(`${API_BASE}/api/v1/schema/entities/plm_variant/attributes`)
            .then((r) => (r.ok ? r.json() : []))
            .then((plmAttrs) => {
              if (Array.isArray(plmAttrs)) {
                setSchemaAttributes([...pimAttrs, ...plmAttrs]);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    // Sprint 6 Fetches: Companies, Users, Batches, Orders
    fetch(`${API_BASE}/api/v1/companies`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Company[]) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setCompanies(data);
          setSelectedCompanyId(data[0].company_id);
          // Load memberships for primary company
          fetch(`${API_BASE}/api/v1/companies/${data[0].company_id}/members`)
            .then((r) => (r.ok ? r.json() : []))
            .then((memList: CompanyMembership[]) => {
              if (Array.isArray(memList) && memList.length > 0) {
                setCompanyMemberships(memList);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/users`)
      .then((res) => (res.ok ? res.json() : null))
      .then((uData: User[]) => {
        if (uData && Array.isArray(uData) && uData.length > 0) {
          setUsers(uData);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/tannery-batches`)
      .then((res) => (res.ok ? res.json() : null))
      .then((bData: TanneryBatch[]) => {
        if (bData && Array.isArray(bData) && bData.length > 0) {
          setTanneryBatches(bData);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/production-orders`)
      .then((res) => (res.ok ? res.json() : null))
      .then((oData: ProductionOrder[]) => {
        if (oData && Array.isArray(oData) && oData.length > 0) {
          setProductionOrders(oData);
        }
      })
      .catch(() => {});

    // Sprint 8 Fetch: Master Color Palette
    fetch(`${API_BASE}/api/v1/colors`)
      .then((res) => (res.ok ? res.json() : null))
      .then((cData: any) => {
        const list = Array.isArray(cData)
          ? cData
          : Array.isArray(cData?.colors)
          ? cData.colors
          : Array.isArray(cData?.items)
          ? cData.items
          : null;
        if (list && list.length > 0) {
          setMasterColors(list.map(normalizeMasterColorRecord));
        }
      })
      .catch(() => {});

    // Sprint 8 Fetch: Product Models
    fetch(`${API_BASE}/api/v1/product-models`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list: ProductModel[]) => {
        if (Array.isArray(list) && list.length > 0) {
          setProductModels(list);
        }
      })
      .catch(() => {});

    // Sprint 9 Fetch: Materials Catalog
    fetch(`${API_BASE}/api/v1/materials`)
      .then((res) => (res.ok ? res.json() : []))
      .then((mList: MaterialRecord[]) => {
        if (Array.isArray(mList) && mList.length > 0) {
          setMaterials(mList);
        }
      })
      .catch(() => {});
  }, []);

  // Sprint 8 Sync: Albo Fornitori & Terzisti 360° with L6 Segregation on viewerRole change
  useEffect(() => {
    setVendors(rawVendors.map((v) => applyVendorL6SegregationClient(v, viewerRole)));

    fetch(`${API_BASE}/api/v1/vendors?viewer_role=${viewerRole}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((vData: any) => {
        const list = Array.isArray(vData)
          ? vData
          : Array.isArray(vData?.vendors)
          ? vData.vendors
          : Array.isArray(vData?.items)
          ? vData.items
          : null;
        if (list && list.length > 0) {
          const normalized = list.map(normalizeVendorApiRecord);
          setVendors(normalized);
          if (viewerRole === "brand") {
            setRawVendors(normalized);
          }
        }
      })
      .catch(() => {});
  }, [viewerRole]);

  // Sprint 8 Sync: Variant Colorway BOM Matrix when backend is online
  useEffect(() => {
    if (!backendConnected || !selectedVariantId) return;
    fetch(`${API_BASE}/api/v1/plm-variants/${selectedVariantId}/colorway-matrix`)
      .then((res) => (res.ok ? res.json() : null))
      .then((matrix: ColorwayMatrixResponse | null) => {
        if (matrix && Array.isArray(matrix.mappings)) {
          setColorwayMatrices((prev) => ({
            ...prev,
            [selectedVariantId]: matrix,
          }));
        }
      })
      .catch(() => {});
  }, [backendConnected, selectedVariantId]);

  // Filter products by selected season if filter is active
  const filteredPimItems =
    selectedSeasonFilter === "ALL"
      ? pimItems
      : pimItems.filter(
          (i) =>
            i.season_id === selectedSeasonFilter ||
            i.season === selectedSeasonFilter ||
            (seasons.find((s) => s.season_id === selectedSeasonFilter)?.code === i.season)
        );

  const activePimList = filteredPimItems.length > 0 ? filteredPimItems : pimItems;

  const currentPim =
    activePimList.find((i) => i.pim_item_id === selectedPimId) ||
    pimItems.find((i) => i.pim_item_id === selectedPimId) ||
    activePimList[0] ||
    pimItems[0];

  const currentVariant =
    currentPim.plm_variants.find((v) => v.plm_variant_id === selectedVariantId) ||
    currentPim.plm_variants[0];

  useEffect(() => {
    if (backendConnected && currentPim) {
      fetch(`${API_BASE}/api/v1/pim-items/${currentPim.pim_item_id}/dpp-preview`)
        .then((res) => res.json())
        .then((dpp: DigitalProductPassport) => setDppData(dpp))
        .catch(() => setDppData(synthesizeClientDpp(currentPim)));
    } else if (currentPim) {
      setDppData(synthesizeClientDpp(currentPim));
    }
  }, [currentPim, backendConnected]);

  const handleSelectPim = (item: PimCommercialItem) => {
    setSelectedPimId(item.pim_item_id);
    if (item.plm_variants.length > 0) {
      setSelectedVariantId(item.plm_variants[0].plm_variant_id);
    }
  };

  const handleSelectVariant = (variant: PlmProductionVariant) => {
    setSelectedVariantId(variant.plm_variant_id);
  };

  const handleAddVariant = (payload: {
    variant_code: string;
    colorway_name: string;
    size_range: string;
    last_or_pattern_code: string;
    lifecycle_status: PlmLifecycleStatus;
    custom_attributes?: Record<string, any>;
  }) => {
    const newVar: PlmProductionVariant = {
      plm_variant_id: `PLM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      pim_item_id: currentPim.pim_item_id,
      ...payload,
      bom_version: "v1.1 (Draft)",
      bom_snapshot_locked: payload.lifecycle_status === "in_production",
      sample_base_size: currentPim.category === "apparel" ? "IT 50" : "42",
      size_grading_step_pct: currentPim.category === "apparel" ? 3.4 : 2.8,
      standard_labor_cost_eur: 30.0,
      custom_attributes: payload.custom_attributes || {},
      category_specific_specs: {
        "Codice Forma / Modello": payload.last_or_pattern_code,
        "Scala Taglie": payload.size_range,
        "Stato Ciclo di Vita": payload.lifecycle_status,
      },
      bom_items: [
        {
          bom_item_id: `BOM-L1-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          level: 1,
          parent_bom_item_id: null,
          component_type: currentPim.category === "apparel" ? "fabric" : "upper",
          material_name: `Materiale Certificato ${payload.colorway_name}`,
          supplier_name: "Conceria / Lanificio Partner Distretto IT",
          origin_country_iso2: "IT",
          unit_of_measure: currentPim.category === "apparel" ? "m" : "sqft",
          unit_consumption: currentPim.category === "apparel" ? 2.3 : 3.1,
          waste_percentage: 6.5,
          recycled_content_pct: 30,
          certifications: ["LWG Gold", "REACH", "GRS"],
          unit_cost_eur: 8.5,
          lot_certificate_id: "CERT-LWG-2026-IT",
        },
      ],
      subcontractor_assignments: [
        {
          assignment_id: `SUB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          subcontractor_name: "Laboratorio Partner Distretto",
          district: "Fermo-Macerata / Scandicci",
          phase: "stitching_upper",
          material_lot_code: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
          completed: false,
          confirmed_at: null,
        },
      ],
    };

    const updatedItems = pimItems.map((item) =>
      item.pim_item_id === currentPim.pim_item_id
        ? { ...item, plm_variants: [...item.plm_variants, newVar] }
        : item
    );
    setPimItems(updatedItems);
    setSelectedVariantId(newVar.plm_variant_id);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/pim-items/${currentPim.pim_item_id}/plm-variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVar),
      }).catch(() => {});
    }
  };

  const handleCreatePimItem = (payload: {
    sku_code: string;
    model_name: string;
    model_id?: string;
    season: string;
    season_id?: string;
    collection_id?: string;
    category: ProductCategory;
    target_gender?: string;
    lifecycle_status?: PlmLifecycleStatus;
    commercial_description_it?: string;
    commercial_description_en?: string;
    wholesale_price_eur: number;
    retail_price_eur: number;
    carryover_status?: string;
    brand_line?: string;
    target_occasion?: string;
    price_tier?: string;
    custom_attributes?: Record<string, any>;
    initialVariant?: {
      variant_code?: string;
      colorway_name?: string;
      size_range?: string;
      last_or_pattern_code?: string;
      construction_type?: string;
      carryover_status?: string;
      lifecycle_status?: PlmLifecycleStatus;
      custom_attributes?: Record<string, any>;
    };
  }) => {
    const { initialVariant: _initialVariant, ...pimPayload } = payload;
    const newPimId = `PIM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const foundModel = payload.model_id
      ? productModels.find((m) => m.model_id === payload.model_id)
      : null;

    const vCode =
      payload.initialVariant?.variant_code || `${payload.sku_code}-A1`;
    const cName =
      payload.initialVariant?.colorway_name || "Edizione Lancio Master";
    const sRange =
      payload.initialVariant?.size_range ||
      foundModel?.default_size_range ||
      (payload.category === "apparel" ? "IT 46-56" : "38-46");
    const lCode =
      payload.initialVariant?.last_or_pattern_code ||
      foundModel?.last_code ||
      `FORMA-${payload.category.toUpperCase()}-01`;
    const cType =
      payload.initialVariant?.construction_type ||
      foundModel?.sole_construction ||
      "cassetta_cucita";
    const cStatus =
      payload.initialVariant?.carryover_status || payload.carryover_status || "seasonal_core";
    const lStatus =
      payload.initialVariant?.lifecycle_status ||
      payload.lifecycle_status ||
      "prototype";

    const initialPlm: PlmProductionVariant = {
      plm_variant_id: `PLM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      pim_item_id: newPimId,
      variant_code: vCode,
      colorway_name: cName,
      primary_color_id:
        (payload.initialVariant as any)?.primary_color_id ||
        payload.initialVariant?.custom_attributes?.primary_color_id,
      size_range: sRange,
      last_or_pattern_code: lCode,
      target_gender: payload.target_gender || foundModel?.target_gender || "unisex",
      construction_type: cType,
      carryover_status: cStatus,
      lifecycle_status: lStatus,
      bom_version: "v1.0 (Draft)",
      bom_snapshot_locked: false,
      sample_base_size: payload.category === "apparel" ? "IT 50" : "42",
      size_grading_step_pct: payload.category === "apparel" ? 3.4 : 2.8,
      standard_labor_cost_eur: 32.0,
      custom_attributes: payload.initialVariant?.custom_attributes || {},
      category_specific_specs: {
        "Codice Cartamodello / Forma": lCode,
        "Scala Taglie": sRange,
        "Genere Target": payload.target_gender || "unisex",
        "Stato Ciclo di Vita": lStatus,
        "Tipo Costruzione": cType,
      },
      bom_items: [
        {
          bom_item_id: `BOM-L1-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          level: 1,
          parent_bom_item_id: null,
          component_type: payload.category === "apparel" ? "fabric" : "upper",
          material_name: "Materiale Principale Tracciato Made in Italy",
          supplier_name: "Fornitore Certificato Distretto IT",
          origin_country_iso2: "IT",
          unit_of_measure: payload.category === "apparel" ? "m" : "sqft",
          unit_consumption: payload.category === "apparel" ? 2.4 : 3.2,
          waste_percentage: 6.0,
          recycled_content_pct: 35.0,
          certifications: ["LWG Gold", "REACH", "GRS"],
          unit_cost_eur: 8.5,
          lot_certificate_id: "CERT-ESPR-2026-IT",
        },
      ],
      subcontractor_assignments: [
        {
          assignment_id: `SUB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          subcontractor_name: "Laboratorio Partner Distretto",
          district: "Distretto Italiano",
          phase: "stitching_upper",
          material_lot_code: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
          completed: false,
          confirmed_at: null,
        },
      ],
    };

    const newPim: PimCommercialItem = {
      pim_item_id: newPimId,
      brand_tenant_id: "TENANT-BRAND-ITALIA",
      target_gender: payload.target_gender || "unisex",
      retail_channels: ["B2B Showroom", "E-Commerce", "Wholesale EU"],
      hs_customs_code:
        payload.category === "footwear"
          ? "6403.59.95"
          : payload.category === "leather_goods"
          ? "4202.21.00"
          : "6201.20.00",
      gtin_ean: `8050012026${Math.floor(100 + Math.random() * 900)}`,
      publishing_status: "READY",
      care_instructions:
        "Trattare con prodotti naturali certificati. Componenti riparabili presso la rete ufficiale.",
      end_of_life_guide:
        "Programma Take-Back Footlink per riciclo e disassemblaggio circolare.",
      ...pimPayload,
      // Backend requires >= 5 chars for commercial descriptions
      commercial_description_it:
        (payload.commercial_description_it || "").trim().length >= 5
          ? payload.commercial_description_it!
          : `${payload.model_name} · ${payload.sku_code}`,
      commercial_description_en:
        (payload.commercial_description_en || "").trim().length >= 5
          ? payload.commercial_description_en!
          : `${payload.model_name} · ${payload.sku_code}`,
      plm_variants: [initialPlm],
    };

    setPimItems([...pimItems, newPim]);
    setSelectedPimId(newPim.pim_item_id);
    setSelectedVariantId(initialPlm.plm_variant_id);

    if (payload.model_id) {
      setProductModels((prev) =>
        prev.map((m) =>
          m.model_id === payload.model_id
            ? { ...m, products_count: (m.products_count || 0) + 1 }
            : m
        )
      );
    }

    if (backendConnected) {
      // FTL-CEO-028: send client IDs + initial PLM variant so PLM & PIM stay aligned after refresh
      const { plm_variants: _omitVariants, ...pimBody } = newPim;
      fetch(`${API_BASE}/api/v1/pim-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pimBody, initial_plm_variants: [initialPlm] }),
      }).catch(() => {});

      if (payload.model_id) {
        fetch(`${API_BASE}/api/v1/product-models/${payload.model_id}/attach-product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pim_item_id: newPimId }),
        }).catch(() => {});
      }
    }
  };

  const handleUpdateProductVariant = (
    pimItemId: string,
    variantId: string,
    payload: {
      model_name?: string;
      sku_code?: string;
      category?: ProductCategory;
      target_gender?: string;
      season_id?: string;
      variant_code?: string;
      colorway_name?: string;
      last_or_pattern_code?: string;
      size_range?: string;
      sample_base_size?: string;
      size_grading_step_pct?: number;
      lifecycle_status?: PlmLifecycleStatus;
      construction_type?: string;
      carryover_status?: string;
      custom_attributes?: Record<string, any>;
    }
  ) => {
    setPimItems((prev) =>
      prev.map((item) => {
        if (item.pim_item_id !== pimItemId) return item;
        const updatedVariants = item.plm_variants.map((v) => {
          if (v.plm_variant_id !== variantId) return v;
          return {
            ...v,
            variant_code: payload.variant_code ?? v.variant_code,
            colorway_name: payload.colorway_name ?? v.colorway_name,
            last_or_pattern_code: payload.last_or_pattern_code ?? v.last_or_pattern_code,
            size_range: payload.size_range ?? v.size_range,
            sample_base_size: payload.sample_base_size ?? v.sample_base_size,
            size_grading_step_pct: payload.size_grading_step_pct ?? v.size_grading_step_pct,
            target_gender: payload.target_gender ?? v.target_gender,
            lifecycle_status: payload.lifecycle_status ?? v.lifecycle_status,
            construction_type: payload.construction_type ?? v.construction_type,
            carryover_status: payload.carryover_status ?? v.carryover_status,
            custom_attributes: payload.custom_attributes
              ? { ...(v.custom_attributes || {}), ...payload.custom_attributes }
              : v.custom_attributes,
          };
        });

        return {
          ...item,
          model_name: payload.model_name ?? item.model_name,
          sku_code: payload.sku_code ?? item.sku_code,
          category: payload.category ?? item.category,
          target_gender: payload.target_gender ?? item.target_gender,
          season_id: payload.season_id ?? item.season_id,
          carryover_status: payload.carryover_status ?? item.carryover_status,
          plm_variants: updatedVariants,
        };
      })
    );

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/pim-items/${pimItemId}/plm-variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) => console.error("Error updating product variant:", err));
    }
  };

  const handleUpdateVariantLifecycle = (
    variantId: string,
    newStatus: PlmLifecycleStatus
  ) => {
    const isLocked = newStatus === "industrialized" || newStatus === "in_production";
    const updatedItems = pimItems.map((item) => {
      if (item.pim_item_id !== currentPim.pim_item_id) return item;
      return {
        ...item,
        plm_variants: item.plm_variants.map((v) =>
          v.plm_variant_id === variantId
            ? {
                ...v,
                lifecycle_status: newStatus,
                bom_snapshot_locked: isLocked,
                bom_version: isLocked
                  ? "v2.0 (Locked Production Snapshot)"
                  : "v1.1 (Draft)",
              }
            : v
        ),
      };
    });
    setPimItems(updatedItems);

    if (backendConnected) {
      fetch(
        `${API_BASE}/api/v1/pim-items/${currentPim.pim_item_id}/plm-variants/${variantId}/lifecycle`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lifecycle_status: newStatus,
            bom_version: isLocked
              ? "v2.0 (Locked Production Snapshot)"
              : "v1.1 (Draft)",
          }),
        }
      ).catch(() => {});
    }
  };

  const handleAddBomItem = (newBom: BomItem) => {
    setPimItems((prevPimItems) =>
      prevPimItems.map((item) => {
        if (item.pim_item_id !== currentPim.pim_item_id) return item;
        return {
          ...item,
          plm_variants: item.plm_variants.map((v) =>
            v.plm_variant_id === currentVariant.plm_variant_id
              ? { ...v, bom_items: [...v.bom_items, newBom] }
              : v
          ),
        };
      })
    );

    if (backendConnected) {
      fetch(
        `${API_BASE}/api/v1/pim-items/${currentPim.pim_item_id}/plm-variants/${currentVariant.plm_variant_id}/bom`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newBom),
        }
      ).catch(() => {});
    }
  };

  const handleDuplicateBomItem = (bomItemId: string) => {
    const currentVariantBoms = currentVariant.bom_items;
    const srcBom = currentVariantBoms.find((b) => b.bom_item_id === bomItemId);
    if (!srcBom) return;

    // Collect entire subtree
    const getSubtreeItems = (parentId: string): BomItem[] => {
      const direct = currentVariantBoms.filter((b) => b.parent_bom_item_id === parentId);
      const res: BomItem[] = [];
      for (const d of direct) {
        res.push(d);
        res.push(...getSubtreeItems(d.bom_item_id));
      }
      return res;
    };

    const subtree = [srcBom, ...getSubtreeItems(srcBom.bom_item_id)];
    const idMap = new Map<string, string>();
    subtree.forEach((b) => {
      idMap.set(
        b.bom_item_id,
        `BOM-L${b.level}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      );
    });

    const clonedItems: BomItem[] = subtree.map((b) => ({
      ...b,
      bom_item_id: idMap.get(b.bom_item_id)!,
      parent_bom_item_id:
        b.parent_bom_item_id && idMap.has(b.parent_bom_item_id)
          ? idMap.get(b.parent_bom_item_id)!
          : b.parent_bom_item_id,
      material_name: `${b.material_name} (Copia)`,
      certifications: [...(b.certifications || [])],
      lot_certificate_id: `CERT-DUP-${Math.floor(1000 + Math.random() * 9000)}`,
    }));

    setPimItems((prevPimItems) =>
      prevPimItems.map((item) => {
        if (item.pim_item_id !== currentPim.pim_item_id) return item;
        return {
          ...item,
          plm_variants: item.plm_variants.map((v) =>
            v.plm_variant_id === currentVariant.plm_variant_id
              ? { ...v, bom_items: [...v.bom_items, ...clonedItems] }
              : v
          ),
        };
      })
    );

    if (backendConnected) {
      fetch(
        `${API_BASE}/api/v1/pim-items/${currentPim.pim_item_id}/plm-variants/${currentVariant.plm_variant_id}/bom-items/${bomItemId}/duplicate`,
        { method: "POST" }
      ).catch(() => {});
    }
  };

  const handleUpdateBomItem = (updatedBom: BomItem) => {
    const updatedItems = pimItems.map((item) => {
      if (item.pim_item_id !== currentPim.pim_item_id) return item;
      return {
        ...item,
        plm_variants: item.plm_variants.map((v) =>
          v.plm_variant_id === currentVariant.plm_variant_id
            ? {
                ...v,
                bom_items: v.bom_items.map((b) =>
                  b.bom_item_id === updatedBom.bom_item_id ? updatedBom : b
                ),
              }
            : v
        ),
      };
    });
    setPimItems(updatedItems);

    if (backendConnected) {
      fetch(
        `${API_BASE}/api/v1/pim-items/${currentPim.pim_item_id}/plm-variants/${currentVariant.plm_variant_id}/bom-items/${updatedBom.bom_item_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedBom),
        }
      ).catch(() => {});
    }
  };

  const handleDeleteBomItem = (bomItemId: string) => {
    const currentVariantBoms = currentVariant.bom_items;
    const toDelete = new Set<string>([bomItemId]);
    let added = true;
    while (added) {
      added = false;
      for (const b of currentVariantBoms) {
        if (b.parent_bom_item_id && toDelete.has(b.parent_bom_item_id) && !toDelete.has(b.bom_item_id)) {
          toDelete.add(b.bom_item_id);
          added = true;
        }
      }
    }

    const updatedItems = pimItems.map((item) => {
      if (item.pim_item_id !== currentPim.pim_item_id) return item;
      return {
        ...item,
        plm_variants: item.plm_variants.map((v) =>
          v.plm_variant_id === currentVariant.plm_variant_id
            ? { ...v, bom_items: v.bom_items.filter((b) => !toDelete.has(b.bom_item_id)) }
            : v
        ),
      };
    });
    setPimItems(updatedItems);

    if (backendConnected) {
      fetch(
        `${API_BASE}/api/v1/pim-items/${currentPim.pim_item_id}/plm-variants/${currentVariant.plm_variant_id}/bom-items/${bomItemId}`,
        { method: "DELETE" }
      ).catch(() => {});
    }
  };

  const handleMoveBomItem = (bomItemId: string, newLevel: number, newParentId: string | null) => {
    const updatedItems = pimItems.map((item) => {
      if (item.pim_item_id !== currentPim.pim_item_id) return item;
      return {
        ...item,
        plm_variants: item.plm_variants.map((v) =>
          v.plm_variant_id === currentVariant.plm_variant_id
            ? {
                ...v,
                bom_items: v.bom_items.map((b) =>
                  b.bom_item_id === bomItemId
                    ? { ...b, level: newLevel, parent_bom_item_id: newLevel === 1 ? null : newParentId }
                    : b
                ),
              }
            : v
        ),
      };
    });
    setPimItems(updatedItems);

    if (backendConnected) {
      fetch(
        `${API_BASE}/api/v1/pim-items/${currentPim.pim_item_id}/plm-variants/${currentVariant.plm_variant_id}/bom-items/${bomItemId}/move`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_level: newLevel, new_parent_id: newParentId }),
        }
      ).catch(() => {});
    }
  };

  const handleAddSubcontractor = (newSub: SubcontractorAssignment) => {
    const updatedItems = pimItems.map((item) => {
      if (item.pim_item_id !== currentPim.pim_item_id) return item;
      return {
        ...item,
        plm_variants: item.plm_variants.map((v) =>
          v.plm_variant_id === currentVariant.plm_variant_id
            ? {
                ...v,
                subcontractor_assignments: [...v.subcontractor_assignments, newSub],
              }
            : v
        ),
      };
    });
    setPimItems(updatedItems);

    if (backendConnected) {
      fetch(
        `${API_BASE}/api/v1/pim-items/${currentPim.pim_item_id}/plm-variants/${currentVariant.plm_variant_id}/subcontractors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSub),
        }
      ).catch(() => {});
    }
  };

  const handleConfirmSubcontractorStep = (
    assignmentId: string,
    updatedLotCode: string
  ) => {
    const nowIso = new Date().toISOString();
    const updatedItems = pimItems.map((item) => {
      if (item.pim_item_id !== currentPim.pim_item_id) return item;
      return {
        ...item,
        plm_variants: item.plm_variants.map((v) => {
          if (v.plm_variant_id !== currentVariant.plm_variant_id) return v;
          return {
            ...v,
            subcontractor_assignments: v.subcontractor_assignments.map((a) =>
              a.assignment_id === assignmentId
                ? {
                    ...a,
                    material_lot_code: updatedLotCode,
                    completed: true,
                    confirmed_at: nowIso,
                  }
                : a
            ),
          };
        }),
      };
    });
    setPimItems(updatedItems);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/subcontractor-portal/confirm-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pim_item_id: currentPim.pim_item_id,
          plm_variant_id: currentVariant.plm_variant_id,
          assignment_id: assignmentId,
          material_lot_code: updatedLotCode,
        }),
      }).catch(() => {});
    }
  };

  // Seasons & Collections Handlers
  const handleCreateSeason = (seasonData: {
    code: string;
    name: string;
    year: number;
    status: SeasonStatus;
    start_date?: string;
    end_date?: string;
    description?: string;
  }) => {
    const newSeasonId = `SEASON-${seasonData.code.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}`;
    const newSeason: Season = {
      season_id: newSeasonId,
      ...seasonData,
      collections: [],
      linked_products_count: 0,
    };
    setSeasons([...seasons, newSeason]);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/seasons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSeason),
      }).catch(() => {});
    }
  };

  const handleCreateCollection = (
    seasonId: string,
    colData: {
      code: string;
      name: string;
      target_market: string;
      status: CollectionStatus;
      description?: string;
    }
  ) => {
    const newColId = `COLL-${seasonId}-${colData.code.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}`;
    const newCol: Collection = {
      collection_id: newColId,
      season_id: seasonId,
      ...colData,
      products_count: 0,
    };
    setSeasons(
      seasons.map((s) =>
        s.season_id === seasonId
          ? { ...s, collections: [...s.collections, newCol] }
          : s
      )
    );

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/seasons/${seasonId}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCol),
      }).catch(() => {});
    }
  };

  // Sprint 8 / FTL-PROD-014: Association of PIM Products to Collections
  const handleAddProductsToCollection = (collectionId: string, pimItemIds: string[]) => {
    let targetColName = "";
    let targetSeason: Season | undefined;
    for (const s of seasons) {
      const found = s.collections.find((c) => c.collection_id === collectionId);
      if (found) {
        targetColName = found.name;
        targetSeason = s;
        break;
      }
    }

    setPimItems((prev) =>
      prev.map((item) =>
        pimItemIds.includes(item.pim_item_id)
          ? {
              ...item,
              collection_id: collectionId,
              collection_name: targetColName || item.collection_name,
              season_id: targetSeason?.season_id ?? item.season_id,
              season: targetSeason?.code ?? item.season,
            }
          : item
      )
    );

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/collections/${collectionId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pim_item_ids: pimItemIds }),
      }).catch(() => {});
    }
  };

  const handleRemoveProductFromCollection = (pimItemId: string) => {
    const current = pimItems.find((i) => i.pim_item_id === pimItemId);
    const prevCollectionId = current?.collection_id;

    setPimItems((prev) =>
      prev.map((item) =>
        item.pim_item_id === pimItemId
          ? {
              ...item,
              collection_id: undefined,
              collection_name: undefined,
            }
          : item
      )
    );

    if (backendConnected && prevCollectionId) {
      fetch(`${API_BASE}/api/v1/collections/${prevCollectionId}/products/${pimItemId}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  };

  // Sprint 8 / FTL-CEO-028: Enrich PIM Commercial Item
  const handleUpdatePimItem = (
    pimItemId: string,
    patch: Partial<PimCommercialItem>
  ) => {
    setPimItems((prev) =>
      prev.map((item) => {
        if (item.pim_item_id === pimItemId) {
          return {
            ...item,
            ...patch,
          };
        }
        return item;
      })
    );

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/pim-items/${pimItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).catch(() => {});
    }
  };

  // Master Domain Registries Handlers
  const handleCreateRegistryEntry = (entry: {
    registry_domain: RegistryDomain;
    registry_name: string;
    entry_code: string;
    label_it: string;
    label_en: string;
    metadata?: Record<string, any>;
    is_active: boolean;
    sort_order: number;
  }) => {
    const newEntry: DomainRegistryEntry = {
      id: registries.length + 1,
      ...entry,
    };
    setRegistries([...registries, newEntry]);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/registries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      }).catch(() => {});
    }
  };

  const handleDeleteRegistryEntry = (domain: string, name: string, code: string) => {
    setRegistries(
      registries.filter(
        (r) =>
          !(
            r.registry_domain === domain &&
            r.registry_name === name &&
            r.entry_code === code
          )
      )
    );

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/registries/${domain}/${name}/${code}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  };

  const handleUpdateRegistryEntry = (
    domain: string,
    name: string,
    code: string,
    updated: {
      label_it: string;
      label_en: string;
      metadata?: Record<string, any>;
      is_active?: boolean;
      sort_order?: number;
    }
  ) => {
    setRegistries((prev) =>
      prev.map((r) =>
        r.registry_domain === domain && r.registry_name === name && r.entry_code === code
          ? {
              ...r,
              ...updated,
              metadata: updated.metadata !== undefined ? updated.metadata : r.metadata,
            }
          : r
      )
    );

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/registries/${domain}/${name}/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  };

  // Dynamic Schema Studio Handlers
  const handleCreateSchemaAttribute = (attr: {
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
  }) => {
    const newAttrId = `ATTR-${attr.target_entity.substring(0, 3).toUpperCase()}-${attr.field_key.toUpperCase()}`;
    const newAttr: SchemaAttributeDefinition = {
      attribute_id: newAttrId,
      ...attr,
    };
    setSchemaAttributes([...schemaAttributes, newAttr]);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/schema/entities/${attr.target_entity}/attributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAttr),
      }).catch(() => {});
    }
  };

  const handleDeleteSchemaAttribute = (targetEntity: string, fieldKey: string) => {
    setSchemaAttributes(
      schemaAttributes.filter(
        (a) => !(a.target_entity === targetEntity && a.field_key === fieldKey)
      )
    );

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/schema/entities/${targetEntity}/attributes/${fieldKey}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  };

  // ==========================================================================
  // Sprint 6 Handlers: District PaaS (Companies & Users)
  // ==========================================================================
  const handleCreateCompany = (companyData: {
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
  }) => {
    const newComp: Company = {
      company_id: `comp-${companyData.company_tier === "subcontractor_zero_eur" ? "lab" : companyData.company_tier}-${Date.now().toString(36)}`,
      is_active: true,
      created_at: new Date().toISOString(),
      ...companyData,
    };
    setCompanies((prev) => [newComp, ...prev]);
    setSelectedCompanyId(newComp.company_id);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((persisted: Company | null) => {
          if (persisted) {
            setCompanies((prev) =>
              prev.map((c) => (c.company_id === newComp.company_id ? persisted : c))
            );
            setSelectedCompanyId(persisted.company_id);
          }
        })
        .catch(() => {});
    }
  };

  const handleAddCompanyMember = (membershipData: {
    company_id: string;
    user_id: string;
    role: DistrictUserRole;
  }) => {
    const targetUser = users.find((u) => u.user_id === membershipData.user_id);
    const targetComp = companies.find((c) => c.company_id === membershipData.company_id);
    const newMem: CompanyMembership = {
      membership_id: `mem-${Date.now().toString(36)}`,
      company_id: membershipData.company_id,
      user_id: membershipData.user_id,
      role: membershipData.role,
      status: "active",
      user_full_name: targetUser?.full_name,
      user_email: targetUser?.email,
      company_business_name: targetComp?.business_name,
      created_at: new Date().toISOString(),
    };
    setCompanyMemberships((prev) => [...prev, newMem]);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/companies/${membershipData.company_id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(membershipData),
      }).catch(() => {});
    }
  };

  const handleCreateUser = async (userData: { email: string; full_name: string }): Promise<string | undefined> => {
    const newUid = `usr-${Date.now().toString(36)}`;
    const newU: User = {
      user_id: newUid,
      email: userData.email,
      full_name: userData.full_name,
      is_platform_admin: false,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newU]);

    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        if (res.ok) {
          const created: User = await res.json();
          setUsers((prev) => prev.map((u) => (u.user_id === newUid ? created : u)));
          return created.user_id;
        }
      } catch {}
    }
    return newUid;
  };

  // ==========================================================================
  // Sprint 6 Handlers: Tannery Leather Batches & Document Vault (FTL-CEO-006)
  // ==========================================================================
  const handleCreateTanneryBatch = (batchData: any) => {
    const newBatch: TanneryBatch = {
      batch_id: `batch-${Date.now().toString(36)}`,
      documents: [],
      is_active: true,
      created_at: new Date().toISOString(),
      ...batchData,
    };
    setTanneryBatches((prev) => [newBatch, ...prev]);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/tannery-batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchData),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((persisted: TanneryBatch | null) => {
          if (persisted) {
            setTanneryBatches((prev) =>
              prev.map((b) => (b.batch_id === newBatch.batch_id ? persisted : b))
            );
          }
        })
        .catch(() => {});
    }
  };

  const handleImportTanneryBatches = (newBatches: any[]) => {
    if (!newBatches || newBatches.length === 0) return;
    setTanneryBatches((prev) => [...newBatches, ...prev]);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/tannery-batches/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batches: newBatches }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((result) => {
          if (result && result.imported_batches) {
            fetch(`${API_BASE}/api/v1/tannery-batches`)
              .then((r) => (r.ok ? r.json() : []))
              .then((data) => {
                if (Array.isArray(data) && data.length > 0) setTanneryBatches(data);
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  };

  const handleUploadTanneryDocument = (batchId: string, docData: any) => {
    const newDocId = `doc-${Date.now().toString(36)}`;
    const mockHash = "a3f5c7e9b1d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4";
    const newDoc = {
      document_id: newDocId,
      batch_id: batchId,
      sha256_hash: mockHash,
      file_size_bytes: 24500,
      is_verified: true,
      created_at: new Date().toISOString(),
      ...docData,
    };

    setTanneryBatches((prev) =>
      prev.map((b) =>
        b.batch_id === batchId
          ? { ...b, documents: [...(b.documents || []), newDoc] }
          : b
      )
    );

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/tannery-batches/${batchId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((persistedDoc) => {
          if (persistedDoc) {
            setTanneryBatches((prev) =>
              prev.map((b) =>
                b.batch_id === batchId
                  ? {
                      ...b,
                      documents: (b.documents || []).map((d) =>
                        d.document_id === newDocId ? persistedDoc : d
                      ),
                    }
                  : b
              )
            );
          }
        })
        .catch(() => {});
    }
  };

  const handleVerifyTanneryDocument = async (
    documentId: string
  ): Promise<TanneryDocumentVerifyResponse | null> => {
    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/tannery-documents/${documentId}/verify`);
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }
    return {
      document_id: documentId,
      batch_id: "batch-montebello-lwg-gold",
      file_name: "Certificato_Verificato.pdf",
      stored_sha256_hash: "3b29c9bb8c9e4a3b8e4e7e6f8a9d1c2b3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      computed_sha256_hash: "3b29c9bb8c9e4a3b8e4e7e6f8a9d1c2b3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      is_authentic: true,
      verification_status: "MATCH_AUTHENTIC_SHA256",
      verified_at: new Date().toISOString(),
    };
  };

  // ==========================================================================
  // Sprint 6 Handlers: Production Orders Hub, Size Matrix & BOM Sfrido
  // ==========================================================================
  const handleCreateProductionOrder = (orderData: any) => {
    const newOid = `ord-${Date.now().toString(36)}`;
    const targetPim = pimItems.find((p) => p.pim_item_id === orderData.pim_item_id);
    const targetVar = targetPim?.plm_variants.find((v) => v.plm_variant_id === orderData.plm_variant_id);
    const targetBatch = tanneryBatches.find((b) => b.batch_id === orderData.tannery_batch_id);

    const totalPlanned = (orderData.size_breakdown || []).reduce(
      (sum: number, s: any) => sum + (Number(s.planned_quantity) || 0),
      0
    );

    const newOrder: ProductionOrder = {
      order_id: newOid,
      order_code: orderData.order_code,
      company_id: orderData.company_id,
      plm_variant_id: orderData.plm_variant_id,
      pim_item_id: orderData.pim_item_id,
      variant_code: targetVar?.variant_code,
      model_name: targetPim?.model_name,
      season_id: orderData.season_id,
      collection_id: orderData.collection_id,
      tannery_batch_id: orderData.tannery_batch_id,
      tannery_batch_code: targetBatch?.batch_code,
      status: orderData.status,
      total_planned_pairs: totalPlanned,
      total_completed_pairs: 0,
      total_scrapped_pairs: 0,
      target_delivery_date: orderData.target_delivery_date,
      notes: orderData.notes,
      size_breakdown: orderData.size_breakdown,
      phases: [
        {
          phase_id: `ph-cut-${newOid}`,
          order_id: newOid,
          phase_code: "cutting",
          phase_sequence: 1,
          subcontractor_name: "Taglio CAD Marchigiano",
          district: "Fermo-Macerata",
          status: "pending",
          target_quantity: totalPlanned,
          conform_quantity: 0,
          scrapped_quantity: 0,
          material_lot_code: targetBatch?.batch_code || "",
          magic_token: `tok-cut-${Date.now().toString(36)}`,
        },
        {
          phase_id: `ph-stitch-${newOid}`,
          order_id: newOid,
          phase_code: "stitching_upper",
          phase_sequence: 2,
          subcontractor_name: "Tomaificio Façon Marche (0 EUR)",
          subcontractor_id: "comp-lab-tomaificio",
          district: "Montegranaro",
          status: "pending",
          target_quantity: totalPlanned,
          conform_quantity: 0,
          scrapped_quantity: 0,
          material_lot_code: targetBatch?.batch_code || "",
          magic_token: `tok-stitch-${Date.now().toString(36)}`,
        },
        {
          phase_id: `ph-lasting-${newOid}`,
          order_id: newOid,
          phase_code: "lasting_assembly",
          phase_sequence: 3,
          subcontractor_name: "Manovia Montaggio Adriatica",
          subcontractor_id: "comp-lab-giunteria",
          district: "Civitanova Marche",
          status: "pending",
          target_quantity: totalPlanned,
          conform_quantity: 0,
          scrapped_quantity: 0,
          material_lot_code: "",
          magic_token: `tok-last-${Date.now().toString(36)}`,
        },
        {
          phase_id: `ph-finish-${newOid}`,
          order_id: newOid,
          phase_code: "finishing",
          phase_sequence: 4,
          subcontractor_name: "Reparto Finissaggio & Confezione",
          district: "Fermo",
          status: "pending",
          target_quantity: totalPlanned,
          conform_quantity: 0,
          scrapped_quantity: 0,
          material_lot_code: "",
          magic_token: `tok-fin-${Date.now().toString(36)}`,
        },
        {
          phase_id: `ph-qa-${newOid}`,
          order_id: newOid,
          phase_code: "quality_control",
          phase_sequence: 5,
          subcontractor_name: "Collaudo Finale & Packaging QA",
          district: "Fermo",
          status: "pending",
          target_quantity: totalPlanned,
          conform_quantity: 0,
          scrapped_quantity: 0,
          material_lot_code: "",
          magic_token: `tok-qa-${Date.now().toString(36)}`,
        },
      ],
      created_at: new Date().toISOString(),
    };

    setProductionOrders((prev) => [newOrder, ...prev]);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/production-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((persistedOrder: ProductionOrder | null) => {
          if (persistedOrder) {
            setProductionOrders((prev) =>
              prev.map((o) => (o.order_id === newOid ? persistedOrder : o))
            );
          }
        })
        .catch(() => {});
    }
  };

  const handleCalculateBomRequirements = async (
    variantId: string,
    sizeBreakdown: OrderSizeBreakdownItem[]
  ): Promise<BomRequirementsCalculationResult | null> => {
    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/production-orders/calculate-requirements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plm_variant_id: variantId,
            size_breakdown: sizeBreakdown,
          }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }

    const totalPairs = sizeBreakdown.reduce((sum, s) => sum + s.planned_quantity, 0);
    return {
      plm_variant_id: variantId,
      total_pairs: totalPairs,
      requirements: [
        {
          bom_item_id: "bom-mock-leather",
          material_name: "Vitello Pieno Fiore Anilina LWG Gold",
          component_type: "upper",
          unit_of_measure: "sqft",
          base_consumption: 3.2,
          grading_delta_pct: 2.8,
          waste_percentage: 18.0,
          net_requirement: Number((totalPairs * 3.2).toFixed(2)),
          gross_requirement_with_waste: Number((totalPairs * 3.2 * 1.18).toFixed(2)),
          requirement_by_size: {},
        },
        {
          bom_item_id: "bom-mock-sole",
          material_name: "Suola Cuoio Toscano Cucita Blake",
          component_type: "outsole",
          unit_of_measure: "pair",
          base_consumption: 1.0,
          grading_delta_pct: 0.0,
          waste_percentage: 2.0,
          net_requirement: totalPairs,
          gross_requirement_with_waste: Number((totalPairs * 1.02).toFixed(0)),
          requirement_by_size: {},
        },
      ],
      total_leather_sqft_gross: Number((totalPairs * 3.2 * 1.18).toFixed(2)),
      total_soles_pairs_gross: Number((totalPairs * 1.02).toFixed(0)),
      calculated_at: new Date().toISOString(),
    };
  };

  const handleConfirmSubcontractorPhase = async (
    magicToken: string,
    data: {
      conform_quantity: number;
      scrapped_quantity: number;
      waste_reason_code?: string;
      operator_notes?: string;
    }
  ): Promise<boolean> => {
    setProductionOrders((prev) =>
      prev.map((order) => {
        const hasPhase = order.phases?.some((p) => p.magic_token === magicToken);
        if (!hasPhase) return order;
        return {
          ...order,
          phases: order.phases.map((p) =>
            p.magic_token === magicToken
              ? {
                  ...p,
                  status: "completed",
                  conform_quantity: data.conform_quantity,
                  scrapped_quantity: data.scrapped_quantity,
                  waste_reason_code: data.waste_reason_code,
                  operator_notes: data.operator_notes,
                  confirmed_at: new Date().toISOString(),
                }
              : p
          ),
        };
      })
    );

    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/subcontractors/phases/${magicToken}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return res.ok;
      } catch {}
    }
    return true;
  };

  // ==========================================================================
  // Sprint 8 Handlers: Color Intelligence Engine & Colorway Matrix (FTL-TECH-022)
  // ==========================================================================
  const handleCreateColor = async (payload: Omit<MasterColor, "id">) => {
    const tempId = `MCOL-${Date.now().toString(36).toUpperCase()}`;
    const newColor: MasterColor = normalizeMasterColorRecord({
      ...payload,
      id: tempId,
      color_id: tempId,
      created_at: new Date().toISOString(),
    });
    setMasterColors((prev) => [newColor, ...prev]);

    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/colors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const persisted = normalizeMasterColorRecord(await res.json());
          setMasterColors((prev) =>
            prev.map((c) => (c.id === tempId ? persisted : c))
          );
        }
      } catch {}
    }
  };

  const handleUpdateColor = async (
    colorId: string,
    payload: Partial<MasterColor>
  ) => {
    setMasterColors((prev) =>
      prev.map((c) =>
        c.id === colorId || c.color_id === colorId
          ? normalizeMasterColorRecord({ ...c, ...payload })
          : c
      )
    );

    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/colors/${colorId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const persisted = normalizeMasterColorRecord(await res.json());
          setMasterColors((prev) =>
            prev.map((c) =>
              c.id === colorId || c.color_id === colorId ? persisted : c
            )
          );
        }
      } catch {}
    }
  };

  const handleDeleteColor = async (colorId: string) => {
    setMasterColors((prev) =>
      prev.filter((c) => c.id !== colorId && c.color_id !== colorId)
    );

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/api/v1/colors/${colorId}`, {
          method: "DELETE",
        });
      } catch {}
    }
  };

  const handleSaveColorwayMatrix = async (
    variantId: string,
    updatedMatrix: ColorwayMatrixResponse
  ) => {
    setColorwayMatrices((prev) => ({
      ...prev,
      [variantId]: updatedMatrix,
    }));

    const colorByBomId = new Map<string, string | null | undefined>();
    for (const m of updatedMatrix.mappings || []) {
      colorByBomId.set(m.bom_item_id, m.master_color_id);
    }

    setPimItems((prev) =>
      prev.map((pim) => ({
        ...pim,
        plm_variants: pim.plm_variants.map((v) => {
          if (v.plm_variant_id !== variantId) return v;
          return {
            ...v,
            primary_color_id: updatedMatrix.primary_color_id,
            secondary_color_id: updatedMatrix.secondary_color_id,
            hardware_finish_color_id: updatedMatrix.hardware_finish_color_id,
            colorway_rule_preset: updatedMatrix.colorway_rule_preset,
            bom_items: (v.bom_items || []).map((b) =>
              colorByBomId.has(b.bom_item_id)
                ? { ...b, master_color_id: colorByBomId.get(b.bom_item_id) ?? b.master_color_id }
                : b
            ),
          };
        }),
      }))
    );

    if (backendConnected) {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/plm-variants/${variantId}/colorway-matrix`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              primary_color_id: updatedMatrix.primary_color_id,
              secondary_color_id: updatedMatrix.secondary_color_id,
              hardware_finish_color_id: updatedMatrix.hardware_finish_color_id,
              colorway_rule_preset: updatedMatrix.colorway_rule_preset,
              mappings: updatedMatrix.mappings,
            }),
          }
        );
        if (res.ok) {
          const persisted: ColorwayMatrixResponse = await res.json();
          if (persisted && Array.isArray(persisted.mappings)) {
            setColorwayMatrices((prev) => ({
              ...prev,
              [variantId]: persisted,
            }));
          }
        }
      } catch {}
    }
  };

  const handleExplodeColorways = async (
    variantId: string,
    payload: ColorwayExplosionPayload
  ) => {
    const parentPim = pimItems.find((p) =>
      p.plm_variants.some((v) => v.plm_variant_id === variantId)
    );
    const baseVariant = parentPim?.plm_variants.find(
      (v) => v.plm_variant_id === variantId
    );
    if (!parentPim || !baseVariant) return;

    if (backendConnected) {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/plm-variants/${variantId}/explode-colorways`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.created_variants) && data.created_variants.length > 0) {
            setPimItems((prev) =>
              prev.map((p) =>
                p.pim_item_id === parentPim.pim_item_id
                  ? {
                      ...p,
                      plm_variants: [...p.plm_variants, ...data.created_variants],
                    }
                  : p
              )
            );
            setSelectedVariantId(data.created_variants[0].plm_variant_id);
          }
          refreshPimItems();
          return;
        }
      } catch {}
    }

    const { createdVariants, createdMatrices } = explodeColorwaysClient(
      baseVariant,
      parentPim,
      payload,
      masterColors,
      tanneryBatches
    );
    if (createdVariants.length > 0) {
      setPimItems((prev) =>
        prev.map((p) =>
          p.pim_item_id === parentPim.pim_item_id
            ? {
                ...p,
                plm_variants: [...p.plm_variants, ...createdVariants],
              }
            : p
        )
      );
      setColorwayMatrices((prev) => ({
        ...prev,
        ...createdMatrices,
      }));
      setSelectedVariantId(createdVariants[0].plm_variant_id);
    }
  };

  // ==========================================================================
  // Sprint 8 Handlers: Vendor Hub 360°, SHA-256 Certs & Where-Used (FTL-TECH-023)
  // ==========================================================================
  const syncVendorsLocalState = (
    updater: (prev: VendorRecord[]) => VendorRecord[]
  ) => {
    setRawVendors((prev) => {
      const nextRaw = updater(prev);
      setVendors(nextRaw.map((v) => applyVendorL6SegregationClient(v, viewerRole)));
      return nextRaw;
    });
  };

  const handleCreateVendor = async (payload: Omit<VendorRecord, "vendor_id">) => {
    const tempId = `VND-${Date.now().toString(36).toUpperCase()}`;
    const sem = evaluateVendorCertificationsSemaphore(payload.certifications || []);
    const rating = computeVendorRating(
      payload.quality_score,
      payload.otd_score,
      payload.esg_score
    );
    const newVendor: VendorRecord = {
      ...payload,
      ...rating,
      vendor_id: tempId,
      certifications: sem.certifications,
      has_expired_critical_certs: sem.has_expired_critical_certs,
      cert_semaphore_status: sem.cert_semaphore_status,
      is_active: payload.is_active !== false,
      created_at: new Date().toISOString(),
    };
    syncVendorsLocalState((prev) => [newVendor, ...prev]);

    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/vendors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const persisted = normalizeVendorApiRecord(await res.json());
          syncVendorsLocalState((prev) =>
            prev.map((v) => (v.vendor_id === tempId ? persisted : v))
          );
        }
      } catch {}
    }
  };

  const handleUpdateVendor = async (
    vendorId: string,
    payload: Partial<VendorRecord>
  ) => {
    syncVendorsLocalState((prev) =>
      prev.map((v) => {
        if (v.vendor_id !== vendorId) return v;
        const merged = { ...v, ...payload };
        const sem = evaluateVendorCertificationsSemaphore(merged.certifications || []);
        const rating = computeVendorRating(
          merged.quality_score,
          merged.otd_score,
          merged.esg_score
        );
        return {
          ...merged,
          ...rating,
          certifications: sem.certifications,
          has_expired_critical_certs: sem.has_expired_critical_certs,
          cert_semaphore_status: sem.cert_semaphore_status,
        };
      })
    );

    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/vendors/${vendorId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const persisted = normalizeVendorApiRecord(await res.json());
          syncVendorsLocalState((prev) =>
            prev.map((v) => (v.vendor_id === vendorId ? persisted : v))
          );
        }
      } catch {}
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    syncVendorsLocalState((prev) => prev.filter((v) => v.vendor_id !== vendorId));

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/api/v1/vendors/${vendorId}`, {
          method: "DELETE",
        });
      } catch {}
    }
  };

  const handleAddVendorCertification = async (
    vendorId: string,
    certPayload: Omit<VendorCertification, "cert_id" | "vendor_id">
  ) => {
    const tempCertId = `VCERT-${Date.now().toString(36).toUpperCase()}`;
    const newCert: VendorCertification = {
      ...certPayload,
      cert_id: tempCertId,
      vendor_id: vendorId,
    };

    syncVendorsLocalState((prev) =>
      prev.map((v) => {
        if (v.vendor_id !== vendorId) return v;
        const sem = evaluateVendorCertificationsSemaphore([
          ...(v.certifications || []),
          newCert,
        ]);
        return {
          ...v,
          certifications: sem.certifications,
          has_expired_critical_certs: sem.has_expired_critical_certs,
          cert_semaphore_status: sem.cert_semaphore_status,
        };
      })
    );

    if (backendConnected) {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/vendors/${vendorId}/certifications`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(certPayload),
          }
        );
        if (res.ok) {
          const persistedCert: VendorCertification = await res.json();
          syncVendorsLocalState((prev) =>
            prev.map((v) => {
              if (v.vendor_id !== vendorId) return v;
              const nextCerts = (v.certifications || []).map((c) =>
                c.cert_id === tempCertId ? { ...c, ...persistedCert } : c
              );
              const sem = evaluateVendorCertificationsSemaphore(nextCerts);
              return {
                ...v,
                certifications: sem.certifications,
                has_expired_critical_certs: sem.has_expired_critical_certs,
                cert_semaphore_status: sem.cert_semaphore_status,
              };
            })
          );
        }
      } catch {}
    }
  };

  const handleDeleteVendorCertification = async (
    vendorId: string,
    certId: string
  ) => {
    syncVendorsLocalState((prev) =>
      prev.map((v) => {
        if (v.vendor_id !== vendorId) return v;
        const filtered = (v.certifications || []).filter(
          (c) => c.cert_id !== certId
        );
        const sem = evaluateVendorCertificationsSemaphore(filtered);
        return {
          ...v,
          certifications: sem.certifications,
          has_expired_critical_certs: sem.has_expired_critical_certs,
          cert_semaphore_status: sem.cert_semaphore_status,
        };
      })
    );

    if (backendConnected) {
      try {
        await fetch(
          `${API_BASE}/api/v1/vendors/${vendorId}/certifications/${certId}`,
          {
            method: "DELETE",
          }
        );
      } catch {}
    }
  };

  const handleFetchVendorWhereUsed = async (
    vendorId: string
  ): Promise<VendorWhereUsedResponse | null> => {
    if (backendConnected) {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/vendors/${vendorId}/where-used?viewer_role=${viewerRole}`
        );
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }
    return computeLocalWhereUsed(
      vendorId,
      rawVendors,
      pimItems,
      tanneryBatches,
      productionOrders,
      viewerRole
    );
  };

  // Sprint 8 Handlers: District Company <-> Vendor Synergy (FTL-CEO-022)
  const handleLinkVendorDistrictCompany = async (vendorId: string, companyId: string) => {
    const comp = companies.find((c) => c.company_id === companyId);
    syncVendorsLocalState((prev) =>
      prev.map((v) =>
        v.vendor_id === vendorId
          ? { ...v, district_company_id: companyId, district_company: comp }
          : v
      )
    );

    if (backendConnected) {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/vendors/${vendorId}/link-district-company`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ district_company_id: companyId }),
          }
        );
        if (res.ok) {
          const updated = normalizeVendorApiRecord(await res.json());
          syncVendorsLocalState((prev) =>
            prev.map((v) => (v.vendor_id === vendorId ? updated : v))
          );
        }
      } catch (err) {
        console.warn("Backend link district company failed:", err);
      }
    }
  };

  const handleUnlinkVendorDistrictCompany = async (vendorId: string) => {
    syncVendorsLocalState((prev) =>
      prev.map((v) =>
        v.vendor_id === vendorId
          ? { ...v, district_company_id: null, district_company: null }
          : v
      )
    );

    if (backendConnected) {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/vendors/${vendorId}/link-district-company`,
          { method: "DELETE" }
        );
        if (res.ok) {
          const updated = normalizeVendorApiRecord(await res.json());
          syncVendorsLocalState((prev) =>
            prev.map((v) => (v.vendor_id === vendorId ? updated : v))
          );
        }
      } catch (err) {
        console.warn("Backend unlink district company failed:", err);
      }
    }
  };

  const handleAutoLinkDistrictCompanies = async () => {
    if (backendConnected) {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/vendors/auto-link-district-companies`,
          { method: "POST" }
        );
        if (res.ok) {
          const data = await res.json();
          // Reload vendors
          const vRes = await fetch(`${API_BASE}/api/v1/vendors?viewer_role=${viewerRole}`);
          if (vRes.ok) {
            const list = await vRes.json();
            const normalized = list.map(normalizeVendorApiRecord);
            setVendors(normalized);
            setRawVendors(normalized);
          }
          return { matched_count: data.matched_count, total_vendors: data.total_vendors };
        }
      } catch (err) {
        console.warn("Backend auto link failed:", err);
      }
    }

    // Client-side auto-link fallback
    let matches = 0;
    syncVendorsLocalState((prev) =>
      prev.map((v) => {
        if (!v.district_company_id) {
          const matchedCompany = companies.find(
            (c) =>
              (c.vat_number && c.vat_number.trim().toUpperCase() === v.vat_number.trim().toUpperCase()) ||
              c.legal_name.toLowerCase().includes(v.company_name.toLowerCase()) ||
              v.company_name.toLowerCase().includes(c.legal_name.toLowerCase())
          );
          if (matchedCompany) {
            matches++;
            return {
              ...v,
              district_company_id: matchedCompany.company_id,
              district_company: matchedCompany,
            };
          }
        }
        return v;
      })
    );
    return { matched_count: matches, total_vendors: rawVendors.length };
  };

  // Sprint 8 Handlers: Product Models (FTL-CEO-021)
  const handleCreateModel = async (
    modelPayload: Omit<ProductModel, "model_id" | "products_count" | "created_at">
  ) => {
    const newId = `MOD-${Date.now().toString(36).toUpperCase()}`;
    const newModel: ProductModel = {
      ...modelPayload,
      model_id: newId,
      products_count: 0,
      created_at: new Date().toISOString(),
    };
    setProductModels((prev) => [newModel, ...prev]);

    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/product-models`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modelPayload),
        });
        if (res.ok) {
          const persisted: ProductModel = await res.json();
          setProductModels((prev) =>
            prev.map((m) => (m.model_id === newId ? persisted : m))
          );
        }
      } catch (err) {
        console.warn("Backend create product model failed:", err);
      }
    }
  };

  const handleUpdateModel = async (
    modelId: string,
    payload: Partial<ProductModel>
  ) => {
    setProductModels((prev) =>
      prev.map((m) => (m.model_id === modelId ? { ...m, ...payload } : m))
    );

    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/product-models/${modelId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated: ProductModel = await res.json();
          setProductModels((prev) =>
            prev.map((m) => (m.model_id === modelId ? updated : m))
          );
        }
      } catch (err) {
        console.warn("Backend update product model failed:", err);
      }
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    setProductModels((prev) => prev.filter((m) => m.model_id !== modelId));
    setPimItems((prev) =>
      prev.map((p) => (p.model_id === modelId ? { ...p, model_id: null } : p))
    );

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/api/v1/product-models/${modelId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("Backend delete product model failed:", err);
      }
    }
  };

  const handleAttachProductToModel = async (modelId: string, pimItemId: string) => {
    setPimItems((prev) =>
      prev.map((p) => (p.pim_item_id === pimItemId ? { ...p, model_id: modelId } : p))
    );
    setProductModels((prev) =>
      prev.map((m) =>
        m.model_id === modelId
          ? { ...m, products_count: (m.products_count || 0) + 1 }
          : m
      )
    );

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/api/v1/product-models/${modelId}/attach-product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pim_item_id: pimItemId }),
        });
      } catch (err) {
        console.warn("Backend attach product to model failed:", err);
      }
    }
  };

  const handleDetachProductFromModel = async (modelId: string, pimItemId: string) => {
    setPimItems((prev) =>
      prev.map((p) => (p.pim_item_id === pimItemId ? { ...p, model_id: null } : p))
    );
    setProductModels((prev) =>
      prev.map((m) =>
        m.model_id === modelId
          ? { ...m, products_count: Math.max(0, (m.products_count || 1) - 1) }
          : m
      )
    );

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/api/v1/product-models/${modelId}/detach-product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pim_item_id: pimItemId }),
        });
      } catch (err) {
        console.warn("Backend detach product from model failed:", err);
      }
    }
  };

  const handleNavigateToProductFromHub = (pimItemId: string, variantId?: string) => {
    const target = pimItems.find((p) => p.pim_item_id === pimItemId);
    if (target) {
      setSelectedPimId(target.pim_item_id);
      if (variantId) {
        setSelectedVariantId(variantId);
      } else if (target.plm_variants.length > 0) {
        setSelectedVariantId(target.plm_variants[0].plm_variant_id);
      }
    }
    setActiveModule("products");
  };

  const handleNavigateToVendor = (vendorId: string) => {
    setSupplierHubSubTab("vendors");
    setActiveModule("vendor_management");
  };

  // Sprint 9 / FTL-TECH-030 / FTL-TECH-031: Materials Handlers
  const handleCreateMaterial = async (mat: Partial<MaterialRecord>) => {
    const newId = mat.material_id || `MAT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const record: MaterialRecord = {
      material_id: newId,
      material_code: mat.material_code || `MAT-COD-${Math.floor(100 + Math.random() * 900)}`,
      name: mat.name || "Nuovo Materiale",
      category: mat.category || "leather",
      vendor_id: mat.vendor_id || null,
      vendor_name: mat.vendor_name || (vendors.find((v) => v.vendor_id === mat.vendor_id)?.company_name) || null,
      unit_of_measure: mat.unit_of_measure || "dm2",
      standard_cost: Number(mat.standard_cost) || 0,
      color_shade: mat.color_shade || null,
      certifications: mat.certifications || [],
      technical_specs: mat.technical_specs || {},
      is_active: mat.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMaterials((prev) => [record, ...prev]);

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/api/v1/materials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });
      } catch (err) {
        console.warn("Backend create material failed:", err);
      }
    }
  };

  const handleUpdateMaterial = async (materialId: string, patch: Partial<MaterialRecord>) => {
    setMaterials((prev) =>
      prev.map((m) =>
        m.material_id === materialId
          ? {
              ...m,
              ...patch,
              updated_at: new Date().toISOString(),
            }
          : m
      )
    );

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/api/v1/materials/${materialId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      } catch (err) {
        console.warn("Backend update material failed:", err);
      }
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    setMaterials((prev) => prev.filter((m) => m.material_id !== materialId));

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/api/v1/materials/${materialId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("Backend delete material failed:", err);
      }
    }
  };

  const handleBulkSwapMaterial = async (payload: BulkMaterialSwapPayload) => {
    // 1. Client-side update for instant reactivity
    try {
      const clientResult = bulkSwapMaterialClient(
        pimItems,
        materials,
        vendors,
        payload,
        selectedPimId,
        selectedVariantId
      );
      setPimItems(clientResult.updatedPimItems);
    } catch (e) {
      console.warn("Local bulk swap error:", e);
    }

    // 2. Backend sync if connected
    if (backendConnected) {
      try {
        const endpoint =
          payload.variant_ids && payload.variant_ids.length > 1
            ? `${API_BASE}/api/v1/products/${selectedPimId}/bom/bulk-swap`
            : `${API_BASE}/api/v1/plm-variants/${selectedVariantId}/bom/bulk-swap`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          refreshPimItems();
        }
      } catch (err) {
        console.warn("Backend bulk swap failed:", err);
      }
    }
  };

  const availableLeatherBomMaterials = pimItems.flatMap((p) =>
    p.plm_variants.flatMap((v) =>
      v.bom_items
        .filter(
          (b) =>
            b.component_type === "upper" ||
            b.component_type === "lining" ||
            b.material_name.toLowerCase().includes("pelle") ||
            b.material_name.toLowerCase().includes("vitello") ||
            b.material_name.toLowerCase().includes("camoscio") ||
            b.material_name.toLowerCase().includes("nappa")
        )
        .map((b) => ({
          bom_item_id: b.bom_item_id,
          material_name: b.material_name,
          component_type: b.component_type,
          plm_code: v.variant_code,
          colorway: v.colorway_name,
          master_color_id: b.master_color_id ?? v.primary_color_id ?? null,
          vendor_id: b.vendor_id ?? null,
        }))
    )
  );

  const NAV_MODULES: { id: ActiveWorkspaceModule; label: string }[] = [
    { id: "home", label: "Home Launchpad" },
    { id: "seasons_collections", label: "01 Stagioni & Collezioni" },
    { id: "products", label: "02 Prodotti (PLM & BOM)" },
    { id: "pim_catalog", label: "03 PIM (Catalogo & Feed)" },
    { id: "vendor_management", label: "04 Gestione Fornitori" },
    { id: "domain_registries", label: "05 Anagrafiche di Dominio" },
    { id: "schema_studio", label: "06 Modello Dati Flessibile" },
    { id: "subcontractor_portal", label: "07 Terzisti 0 €" },
    { id: "dpp_passport", label: "08 Passaporto DPP" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#111111] pb-20">
      {/* Top Utility Bar (Nike Style) */}
      <div className="bg-[#F5F5F5] border-b border-[#E5E5E5] px-4 sm:px-8 py-2 text-xs font-semibold flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#111111]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            FOOTLINK OS · DESIGN SYSTEM V2.0
          </span>
          <span className="text-[#707072]">|</span>
          <span className="text-[#707072]">
            Infrastruttura Free-Tier 0,00 € · Regolamento UE 2024/1781 (ESPR)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* District PaaS Company Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#707072] uppercase">
              Azienda:
            </span>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="bg-white border border-[#CCCCCC] rounded-full px-3 py-1 text-xs font-bold text-[#111111]"
            >
              {companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_tier === "enterprise"
                    ? "🏢 "
                    : c.company_tier === "pmi"
                    ? "🏭 "
                    : "🛠️ "}
                  {c.business_name} ({c.company_tier.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Global Season Selector (Requisito 4 Founder) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#707072] uppercase">
              Stagione:
            </span>
            <select
              value={selectedSeasonFilter}
              onChange={(e) => setSelectedSeasonFilter(e.target.value)}
              className="bg-white border border-[#CCCCCC] rounded-full px-3 py-1 text-xs font-bold text-[#111111]"
            >
              <option value="ALL">Tutte le Stagioni ({pimItems.length})</option>
              {seasons.map((s) => (
                <option key={s.season_id} value={s.season_id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>
          </div>

          <span
            className={`px-3 py-0.5 rounded-full text-[11px] font-bold border ${
              backendConnected
                ? "bg-[#111111] text-white border-[#111111]"
                : "bg-white text-[#111111] border-[#E5E5E5]"
            }`}
          >
            {backendConnected
              ? "🟢 FastAPI + SQLite Connesso (8000)"
              : "⚡ Modalità Live Standalone (Seed Sync)"}
          </span>

          <div className="flex items-center gap-1 bg-white border border-[#E5E5E5] rounded-full p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setViewerRole("brand")}
              className={`px-2.5 py-0.5 rounded-full font-bold transition ${
                viewerRole === "brand" ? "bg-[#111111] text-white" : "text-[#707072]"
              }`}
            >
              Brand (L6)
            </button>
            <button
              type="button"
              onClick={() => setViewerRole("subcontractor")}
              className={`px-2.5 py-0.5 rounded-full font-bold transition ${
                viewerRole === "subcontractor"
                  ? "bg-[#111111] text-white"
                  : "text-[#707072]"
              }`}
            >
              Terzista 0 €
            </button>
          </div>
        </div>
      </div>

      {/* Main Header & Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E5E5E5] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo "The Dynamic Sole-Link" */}
          <div
            onClick={() => setActiveModule("home")}
            className="cursor-pointer flex items-center gap-3"
          >
            <svg
              width="156"
              height="30"
              viewBox="0 0 168 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="FOOTLINK"
            >
              <path d="M4 24L14.5 6H24L13.5 24H4Z" fill="#111111" />
              <path d="M15.5 24L23 11H31L23.5 24H15.5Z" fill="#111111" />
              <path d="M4 26.5H29.5L28 29H2.5L4 26.5Z" fill="#111111" />
              <text
                x="38"
                y="24"
                fill="#111111"
                fontFamily="'Barlow Condensed', 'Inter', sans-serif"
                fontWeight="900"
                fontSize="25"
                letterSpacing="-0.03em"
              >
                FOOTLINK
              </text>
            </svg>
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-[#707072] border-l border-[#E5E5E5] pl-3">
              PLM + PIM Core OS
            </span>
          </div>

          {/* Module Navigation Pills (Semplificazione UI - 7 Moduli chiari) */}
          <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {NAV_MODULES.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveModule(tab.id)}
                className={`px-3.5 py-1.5 rounded-full transition ${
                  activeModule === tab.id
                    ? "bg-[#111111] text-white"
                    : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111] hover:border-[#111111]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Training & Docs Quick Links */}
          <div className="flex items-center gap-2">
            <a
              href="/training_portal.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
              title="Apri Footlink Training Academy"
            >
              <span>🎓</span> Training Academy
            </a>
            <a
              href="/tech_docs.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
              title="Apri Documentazione Tecnica & API"
            >
              <span>📖</span> Docs Tecniche
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* VIEW 0: HOME LAUNCHPAD */}
        {activeModule === "home" && (
          <FootlinkHomeHub
            pimItems={activePimList}
            activeModule={activeModule}
            onNavigateModule={(mod) => setActiveModule(mod)}
            viewerRole={viewerRole}
            onChangeViewerRole={setViewerRole}
          />
        )}

        {/* VIEW 1: MODULE 01 - STAGIONI & COLLEZIONI - FTL-TECH-027 */}
        {activeModule === "seasons_collections" && (
          <SeasonsCollectionsHub
            seasons={seasons}
            pimItems={pimItems}
            selectedSeasonId={
              selectedSeasonFilter === "ALL" ? seasons[0]?.season_id : selectedSeasonFilter
            }
            onSelectSeason={(sId) => {
              setSelectedSeasonFilter(sId);
              setSelectedHubCollectionId(undefined);
            }}
            selectedCollectionId={selectedHubCollectionId}
            onSelectCollection={(cId) =>
              setSelectedHubCollectionId((prev) => (prev === cId ? undefined : cId))
            }
            onCreateSeason={handleCreateSeason}
            onCreateCollection={handleCreateCollection}
            onNavigateToProduct={handleNavigateToProductFromHub}
            onAddProductsToCollection={handleAddProductsToCollection}
            onRemoveProductFromCollection={handleRemoveProductFromCollection}
          />
        )}

        {/* VIEW 2: MODULE 02 - PRODOTTI (PLM & DISTINTA BASE BOM) - FTL-TECH-027 */}
        {activeModule === "products" && (
          <PlmProductsManager
            pimItems={activePimList}
            viewerRole={viewerRole}
            seasons={seasons}
            registries={registries}
            colors={masterColors}
            vendors={vendors}
            tanneryBatches={tanneryBatches}
            colorwayMatrices={colorwayMatrices}
            models={productModels}
            materials={materials}
            onNavigateModule={(mod) => setActiveModule(mod)}
            onBulkSwapMaterial={handleBulkSwapMaterial}
            onNavigateToVendor={handleNavigateToVendor}
            onCreateModel={handleCreateModel}
            onUpdateModel={handleUpdateModel}
            onDeleteModel={handleDeleteModel}
            onAttachProductToModel={handleAttachProductToModel}
            onDetachProductFromModel={handleDetachProductFromModel}
            onSaveColorwayMatrix={handleSaveColorwayMatrix}
            onExplodeColorways={handleExplodeColorways}
            onCreateColor={handleCreateColor}
            onUpdateColor={handleUpdateColor}
            onDeleteColor={handleDeleteColor}
            onSelectPim={handleSelectPim}
            onSelectVariant={handleSelectVariant}
            onAddVariant={handleAddVariant}
            onCreatePimItem={handleCreatePimItem}
            onUpdateVariantLifecycle={handleUpdateVariantLifecycle}
            onUpdateProductVariant={handleUpdateProductVariant}
            onAddBomItem={handleAddBomItem}
            onUpdateBomItem={handleUpdateBomItem}
            onDeleteBomItem={handleDeleteBomItem}
            onMoveBomItem={handleMoveBomItem}
            onDuplicateBomItem={handleDuplicateBomItem}
            onRefreshData={refreshPimItems}
          />
        )}

        {/* VIEW 3: MODULE 03 - PIM (CATALOGO COMMERCIALE & FEED SYNDICATION) - FTL-TECH-027 */}
        {activeModule === "pim_catalog" && (
          <PimCatalogManager
            pimItems={activePimList}
            seasons={seasons}
            viewerRole={viewerRole}
            colors={masterColors}
            onSelectPim={handleSelectPim}
            onCreatePimItem={handleCreatePimItem}
            onUpdatePimItem={handleUpdatePimItem}
            onNavigateToPlm={(pimId, variantId) => {
              handleNavigateToProductFromHub(pimId, variantId);
            }}
            onNavigateToDpp={(pimId) => {
              setSelectedPimId(pimId);
              setActiveModule("dpp_passport");
            }}
          />
        )}

        {/* VIEW 4: MODULE 04 - GESTIONE FORNITORI, DISTRETTO PaaS & CONCERIE - FTL-TECH-027 */}
        {(activeModule === "vendor_management" ||
          activeModule === "district_paas" ||
          activeModule === "tannery_vault") && (
          <SupplierManagementHub
            vendors={vendors}
            viewerRole={viewerRole}
            onCreateVendor={handleCreateVendor}
            onUpdateVendor={handleUpdateVendor}
            onDeleteVendor={handleDeleteVendor}
            onAddCertification={handleAddVendorCertification}
            onDeleteCertification={handleDeleteVendorCertification}
            onFetchWhereUsed={handleFetchVendorWhereUsed}
            onLinkDistrictCompany={handleLinkVendorDistrictCompany}
            onUnlinkDistrictCompany={handleUnlinkVendorDistrictCompany}
            onAutoLinkDistrictCompanies={handleAutoLinkDistrictCompanies}
            materials={materials}
            onCreateMaterial={handleCreateMaterial}
            onUpdateMaterial={handleUpdateMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onNavigateToVendor={handleNavigateToVendor}
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            onCreateCompany={handleCreateCompany}
            memberships={companyMemberships}
            onAddMember={handleAddCompanyMember}
            users={users}
            onCreateUser={handleCreateUser}
            batches={tanneryBatches}
            availableLeatherBomMaterials={availableLeatherBomMaterials}
            colors={masterColors}
            pimItems={pimItems}
            onCreateBatch={handleCreateTanneryBatch}
            onUploadDocument={handleUploadTanneryDocument}
            onVerifyDocument={handleVerifyTanneryDocument}
            onImportBatches={handleImportTanneryBatches}
            initialSubTab={
              activeModule === "district_paas"
                ? "district"
                : activeModule === "tannery_vault"
                ? "tannery"
                : supplierHubSubTab
            }
          />
        )}

        {/* MODULE IN STAND-BY: COMMESSE DI PRODUZIONE & MATRICE TAGLIE (ADR-009) */}
        {activeModule === "production_orders" && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 max-w-3xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto text-xl">
              ⏸️
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">
              Architecture Decision Record ADR-009 · Governance Notice
            </div>
            <h2 className="display-title text-2xl text-[#111111]">
              MODULO IN STAND-BY TEMPORANEO
            </h2>
            <p className="text-sm text-[#707072] max-w-xl mx-auto leading-relaxed">
              In conformità alla direttiva del Founder FTL-CEO-011 e ad ADR-009, il modulo Work Orders Hub &amp; Matrice Taglie è stato temporaneamente congelato per rifocalizzare la roadmap esecutiva su PLM &amp; Ingegneria BOM, Catalogo PIM Commerciale e Gestione Fornitori. I dati relazionali e le API backend rimangono preservati e integri.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveModule("products")}
                className="px-6 py-2.5 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-black transition"
              >
                Vai ad Area Prodotti (PLM) →
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("pim_catalog")}
                className="px-6 py-2.5 rounded-full border border-[#111111] bg-white text-[#111111] text-xs font-bold hover:bg-[#F5F5F5] transition"
              >
                Vai a Catalogo Commerciale (PIM) →
              </button>
            </div>
          </div>
        )}

        {/* VIEW 5: MODULE 05 - ANAGRAFICHE DI DOMINIO MASTER - FTL-CEO-027 */}
        {activeModule === "domain_registries" && (
          <DomainRegistriesManager
            registries={registries}
            onCreateEntry={handleCreateRegistryEntry}
            onUpdateEntry={handleUpdateRegistryEntry}
            onDeleteEntry={handleDeleteRegistryEntry}
            vendors={vendors}
            colors={masterColors}
            seasons={seasons}
            viewerRole={viewerRole}
            onCreateVendor={handleCreateVendor}
            onUpdateVendor={handleUpdateVendor}
            onDeleteVendor={handleDeleteVendor}
            onAddVendorCertification={handleAddVendorCertification}
            onDeleteVendorCertification={handleDeleteVendorCertification}
            onFetchVendorWhereUsed={handleFetchVendorWhereUsed}
            onCreateColor={handleCreateColor}
            onUpdateColor={handleUpdateColor}
            onDeleteColor={handleDeleteColor}
            companies={companies}
            onLinkDistrictCompany={handleLinkVendorDistrictCompany}
            onUnlinkDistrictCompany={handleUnlinkVendorDistrictCompany}
            onAutoLinkDistrictCompanies={handleAutoLinkDistrictCompanies}
          />
        )}

        {/* VIEW 6: MODULE 06 - MODELLO DATI FLESSIBILE & FOUNDER STUDIO - FTL-CEO-027 */}
        {activeModule === "schema_studio" && (
          <DataModelSchemaStudio
            attributes={schemaAttributes}
            onCreateAttribute={handleCreateSchemaAttribute}
            onDeleteAttribute={handleDeleteSchemaAttribute}
          />
        )}

        {/* VIEW 7: MODULE 07 - RETE TERZISTI 0 € - FTL-CEO-027 */}
        {activeModule === "subcontractor_portal" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <SubcontractorMobilePortal
                variant={currentVariant}
                colors={masterColors}
                colorwayMatrix={
                  colorwayMatrices[currentVariant.plm_variant_id] ||
                  computeLocalColorwayMatrix(
                    currentVariant,
                    masterColors,
                    tanneryBatches
                  )
                }
                onConfirmStep={handleConfirmSubcontractorStep}
                onAddSubcontractor={handleAddSubcontractor}
              />
            </div>
            <div className="lg:col-span-7">
              <BomThreeLevelTree
                variant={currentVariant}
                pimItem={currentPim}
                viewerRole={viewerRole}
                vendors={vendors}
                colors={masterColors}
                onAddBomItem={handleAddBomItem}
                onUpdateBomItem={handleUpdateBomItem}
                onDeleteBomItem={handleDeleteBomItem}
                onMoveBomItem={handleMoveBomItem}
                onDuplicateBomItem={handleDuplicateBomItem}
              />
            </div>
          </div>
        )}

        {/* VIEW 8: MODULE 08 - PASSAPORTO DIGITALE UE (DPP) - FTL-CEO-027 */}
        {activeModule === "dpp_passport" && (
          <LiveDppPassportGenerator pimItem={currentPim} dpp={dppData} />
        )}
      </main>
    </div>
  );
};

export default App;
