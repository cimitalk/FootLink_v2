import React, { useEffect, useState } from "react";
import { BomThreeLevelTree } from "./components/BomThreeLevelTree";
import { DataModelSchemaStudio } from "./components/DataModelSchemaStudio";
import { DistrictPaasManager } from "./components/DistrictPaasManager";
import { DomainRegistriesManager } from "./components/DomainRegistriesManager";
import { FootlinkHomeHub } from "./components/FootlinkHomeHub";
import { LiveDppPassportGenerator } from "./components/LiveDppPassportGenerator";
import { PimCatalogManager } from "./components/PimCatalogManager";
import { PimToPlmBridge } from "./components/PimToPlmBridge";
import { PlmProductsManager } from "./components/PlmProductsManager";
import { ProductionOrdersManager } from "./components/ProductionOrdersManager";
import { SeasonsCollectionsHub } from "./components/SeasonsCollectionsHub";
import { SubcontractorMobilePortal } from "./components/SubcontractorMobilePortal";
import { TanneryVaultManager } from "./components/TanneryVaultManager";
import {
  INITIAL_COMPANIES,
  INITIAL_MEMBERSHIPS,
  INITIAL_PIM_ITEMS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_REGISTRIES,
  INITIAL_SCHEMA_ATTRIBUTES,
  INITIAL_SEASONS,
  INITIAL_TANNERY_BATCHES,
  INITIAL_USERS,
  synthesizeClientDpp,
} from "./mockSeedData";
import {
  ActiveWorkspaceModule,
  AttributeFieldType,
  AttributeTargetEntity,
  BomItem,
  BomRequirementsCalculationResult,
  Collection,
  CollectionStatus,
  Company,
  CompanyBusinessType,
  CompanyMembership,
  CompanyTier,
  DigitalProductPassport,
  DistrictUserRole,
  DomainRegistryEntry,
  OrderSizeBreakdownItem,
  PimCommercialItem,
  PlmLifecycleStatus,
  PlmProductionVariant,
  ProductCategory,
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
  ViewerSecurityRole,
} from "./types";

const API_BASE = "http://127.0.0.1:8000";

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
  const [showBomDrawerInProducts, setShowBomDrawerInProducts] = useState<boolean>(true);

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
  }, []);

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
    custom_attributes?: Record<string, any>;
  }) => {
    const newPimId = `PIM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const initialPlm: PlmProductionVariant = {
      plm_variant_id: `PLM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      pim_item_id: newPimId,
      variant_code: `${payload.sku_code}-A1`,
      colorway_name: "Edizione Lancio Master",
      size_range: payload.category === "apparel" ? "IT 46-56" : "38-46",
      last_or_pattern_code: `FORMA-${payload.category.toUpperCase()}-01`,
      target_gender: payload.target_gender || "unisex",
      lifecycle_status: payload.lifecycle_status || "new_from_pim",
      bom_version: "v1.0 (Draft)",
      bom_snapshot_locked: false,
      sample_base_size: payload.category === "apparel" ? "IT 50" : "42",
      size_grading_step_pct: payload.category === "apparel" ? 3.4 : 2.8,
      standard_labor_cost_eur: 32.0,
      custom_attributes: {},
      category_specific_specs: {
        "Codice Cartamodello / Forma": `MOD-${payload.category.toUpperCase()}-01`,
        "Scala Taglie": payload.category === "apparel" ? "IT 46-56" : "38-46",
        "Genere Target": payload.target_gender || "unisex",
        "Stato Ciclo di Vita": payload.lifecycle_status || "new_from_pim",
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
      ...payload,
      commercial_description_it: payload.commercial_description_it || payload.model_name,
      commercial_description_en: payload.commercial_description_en || payload.model_name,
      plm_variants: [initialPlm],
    };

    setPimItems([...pimItems, newPim]);
    setSelectedPimId(newPim.pim_item_id);
    setSelectedVariantId(initialPlm.plm_variant_id);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/pim-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPim),
      }).catch(() => {});
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
    const updatedItems = pimItems.map((item) => {
      if (item.pim_item_id !== currentPim.pim_item_id) return item;
      return {
        ...item,
        plm_variants: item.plm_variants.map((v) =>
          v.plm_variant_id === currentVariant.plm_variant_id
            ? { ...v, bom_items: [...v.bom_items, newBom] }
            : v
        ),
      };
    });
    setPimItems(updatedItems);

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

  const handleNavigateToProductFromHub = (pimItemId: string) => {
    const target = pimItems.find((p) => p.pim_item_id === pimItemId);
    if (target) {
      setSelectedPimId(target.pim_item_id);
      if (target.plm_variants.length > 0) {
        setSelectedVariantId(target.plm_variants[0].plm_variant_id);
      }
    }
    setActiveModule("products");
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
        }))
    )
  );

  const NAV_MODULES: { id: ActiveWorkspaceModule; label: string }[] = [
    { id: "home", label: "Home Launchpad" },
    { id: "district_paas", label: "01 PaaS Distretto & Utenti" },
    { id: "products", label: "02 Prodotti (PLM & BOM)" },
    { id: "pim_catalog", label: "03 PIM (Catalogo & Feed)" },
    { id: "tannery_vault", label: "04 Vault Conceria & LWG" },
    { id: "seasons_collections", label: "05 Stagioni & Collezioni" },
    { id: "domain_registries", label: "06 Anagrafiche di Dominio" },
    { id: "schema_studio", label: "07 Modello Dati Flessibile" },
    { id: "subcontractor_portal", label: "08 Terzisti 0 €" },
    { id: "dpp_passport", label: "09 Passaporto DPP" },
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

        {/* VIEW 1: MODULE 01 - PAAS DISTRETTO & GESTIONE UTENTI */}
        {activeModule === "district_paas" && (
          <DistrictPaasManager
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            onCreateCompany={handleCreateCompany}
            memberships={companyMemberships}
            onAddMember={handleAddCompanyMember}
            users={users}
            onCreateUser={handleCreateUser}
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
              MODULO 02 IN STAND-BY TEMPORANEO
            </h2>
            <p className="text-sm text-[#707072] max-w-xl mx-auto leading-relaxed">
              In conformità alla direttiva del Founder FTL-CEO-011 e ad ADR-009, il modulo Work Orders Hub &amp; Matrice Taglie è stato temporaneamente congelato per rifocalizzare la roadmap esecutiva su PLM &amp; Ingegneria BOM, Catalogo PIM Commerciale e Vault Conceria. I dati relazionali e le API backend rimangono preservati e integri.
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

        {/* VIEW 2: MODULE 02 - PRODOTTI (PLM & DISTINTA BASE BOM) */}
        {activeModule === "products" && (
          <PlmProductsManager
            pimItems={activePimList}
            viewerRole={viewerRole}
            seasons={seasons}
            registries={registries}
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
            onRefreshData={refreshPimItems}
          />
        )}

        {/* VIEW 3: MODULE 03 - PIM (CATALOGO COMMERCIALE & FEED SYNDICATION) */}
        {activeModule === "pim_catalog" && (
          <PimCatalogManager
            pimItems={activePimList}
            seasons={seasons}
            viewerRole={viewerRole}
            onSelectPim={handleSelectPim}
            onCreatePimItem={handleCreatePimItem}
            onNavigateToPlm={(pimId) => {
              handleNavigateToProductFromHub(pimId);
            }}
            onNavigateToDpp={(pimId) => {
              setSelectedPimId(pimId);
              setActiveModule("dpp_passport");
            }}
          />
        )}

        {/* VIEW 4: MODULE 04 - VAULT CONCERIA & CERTIFICAZIONI LWG/ICEC */}
        {activeModule === "tannery_vault" && (
          <TanneryVaultManager
            batches={tanneryBatches}
            companies={companies}
            availableLeatherBomMaterials={availableLeatherBomMaterials}
            onCreateBatch={handleCreateTanneryBatch}
            onUploadDocument={handleUploadTanneryDocument}
            onVerifyDocument={handleVerifyTanneryDocument}
            onImportBatches={handleImportTanneryBatches}
          />
        )}

        {/* LEGACY BRIDGE / SPECIFICHE VERTICALI / BOM COSTING */}
        {(activeModule === "all" ||
          activeModule === "bridge_vertical_specs" ||
          activeModule === "bom_costing") && (
          <div className="space-y-6">
            <PimToPlmBridge
              pimItems={activePimList}
              selectedPim={currentPim}
              selectedVariant={currentVariant}
              onSelectPim={handleSelectPim}
              onSelectVariant={handleSelectVariant}
              onAddVariant={handleAddVariant}
              onCreatePimItem={handleCreatePimItem}
              onUpdateVariantLifecycle={handleUpdateVariantLifecycle}
              viewerRole={viewerRole}
              seasons={seasons}
              schemaAttributes={schemaAttributes}
            />

            {/* Ingegneria BOM 3 Livelli & Costing L6 Integrato */}
            <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">
                    INGEGNERIA DI PRODUZIONE & COSTI INDUSTRIALI L6
                  </div>
                  <h3 className="display-title text-2xl text-[#111111]">
                    DISTINTA BASE (BOM) A 3 LIVELLI & CONSUMI ({currentVariant.variant_code})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBomDrawerInProducts(!showBomDrawerInProducts)}
                  className="px-4 py-2 rounded-full border border-[#111111] bg-white text-[#111111] text-xs font-semibold hover:bg-[#F5F5F5]"
                >
                  {showBomDrawerInProducts ? "Comprimi Distinta Base ▲" : "Espandi Distinta Base ▼"}
                </button>
              </div>

              {showBomDrawerInProducts && (
                <BomThreeLevelTree
                  variant={currentVariant}
                  pimItem={currentPim}
                  viewerRole={viewerRole}
                  onAddBomItem={handleAddBomItem}
                  onUpdateBomItem={handleUpdateBomItem}
                  onDeleteBomItem={handleDeleteBomItem}
                  onMoveBomItem={handleMoveBomItem}
                />
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: MODULE 05 - STAGIONI & COLLEZIONI */}
        {activeModule === "seasons_collections" && (
          <SeasonsCollectionsHub
            seasons={seasons}
            pimItems={pimItems}
            selectedSeasonId={
              selectedSeasonFilter === "ALL" ? seasons[0]?.season_id : selectedSeasonFilter
            }
            onSelectSeason={(sId) => setSelectedSeasonFilter(sId)}
            onCreateSeason={handleCreateSeason}
            onCreateCollection={handleCreateCollection}
            onNavigateToProduct={handleNavigateToProductFromHub}
          />
        )}

        {/* VIEW 6: MODULE 06 - ANAGRAFICHE DI DOMINIO MASTER */}
        {activeModule === "domain_registries" && (
          <DomainRegistriesManager
            registries={registries}
            onCreateEntry={handleCreateRegistryEntry}
            onUpdateEntry={handleUpdateRegistryEntry}
            onDeleteEntry={handleDeleteRegistryEntry}
          />
        )}

        {/* VIEW 7: MODULE 07 - MODELLO DATI FLESSIBILE & FOUNDER STUDIO */}
        {activeModule === "schema_studio" && (
          <DataModelSchemaStudio
            attributes={schemaAttributes}
            onCreateAttribute={handleCreateSchemaAttribute}
            onDeleteAttribute={handleDeleteSchemaAttribute}
          />
        )}

        {/* VIEW 8: MODULE 08 - RETE TERZISTI 0 € */}
        {activeModule === "subcontractor_portal" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <SubcontractorMobilePortal
                variant={currentVariant}
                onConfirmStep={handleConfirmSubcontractorStep}
                onAddSubcontractor={handleAddSubcontractor}
              />
            </div>
            <div className="lg:col-span-7">
              <BomThreeLevelTree
                variant={currentVariant}
                pimItem={currentPim}
                viewerRole={viewerRole}
                onAddBomItem={handleAddBomItem}
                onUpdateBomItem={handleUpdateBomItem}
                onDeleteBomItem={handleDeleteBomItem}
                onMoveBomItem={handleMoveBomItem}
              />
            </div>
          </div>
        )}

        {/* VIEW 9: MODULE 09 - PASSAPORTO DIGITALE UE (DPP) */}
        {activeModule === "dpp_passport" && (
          <LiveDppPassportGenerator pimItem={currentPim} dpp={dppData} />
        )}
      </main>
    </div>
  );
};

export default App;
