import React, { useEffect, useState } from "react";
import { BomThreeLevelTree } from "./components/BomThreeLevelTree";
import { DataModelSchemaStudio } from "./components/DataModelSchemaStudio";
import { DomainRegistriesManager } from "./components/DomainRegistriesManager";
import { FootlinkHomeHub } from "./components/FootlinkHomeHub";
import { LiveDppPassportGenerator } from "./components/LiveDppPassportGenerator";
import { PimToPlmBridge } from "./components/PimToPlmBridge";
import { SeasonsCollectionsHub } from "./components/SeasonsCollectionsHub";
import { SubcontractorMobilePortal } from "./components/SubcontractorMobilePortal";
import {
  INITIAL_PIM_ITEMS,
  INITIAL_REGISTRIES,
  INITIAL_SCHEMA_ATTRIBUTES,
  INITIAL_SEASONS,
  synthesizeClientDpp,
} from "./mockSeedData";
import {
  ActiveWorkspaceModule,
  AttributeFieldType,
  AttributeTargetEntity,
  BomItem,
  Collection,
  CollectionStatus,
  DigitalProductPassport,
  DomainRegistryEntry,
  PimCommercialItem,
  PlmLifecycleStatus,
  PlmProductionVariant,
  ProductCategory,
  RegistryDomain,
  SchemaAttributeDefinition,
  Season,
  SeasonStatus,
  SubcontractorAssignment,
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
      .then((data: DomainRegistryEntry[]) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setRegistries(data);
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
    commercial_description_it: string;
    commercial_description_en: string;
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
      lifecycle_status: "prototype",
      bom_version: "v1.0 (Draft)",
      bom_snapshot_locked: false,
      sample_base_size: payload.category === "apparel" ? "IT 50" : "42",
      size_grading_step_pct: payload.category === "apparel" ? 3.4 : 2.8,
      standard_labor_cost_eur: 32.0,
      custom_attributes: {},
      category_specific_specs: {
        "Codice Cartamodello / Forma": `MOD-${payload.category.toUpperCase()}-01`,
        "Scala Taglie": payload.category === "apparel" ? "IT 46-56" : "38-46",
        "Stato Ciclo di Vita": "prototype",
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

  const NAV_MODULES: { id: ActiveWorkspaceModule; label: string }[] = [
    { id: "home", label: "Home Launchpad" },
    { id: "products", label: "01 Prodotti & Ponte 1:N" },
    { id: "seasons_collections", label: "02 Stagioni & Collezioni" },
    { id: "domain_registries", label: "03 Anagrafiche di Dominio" },
    { id: "schema_studio", label: "04 Modello Dati Flessibile" },
    { id: "subcontractor_portal", label: "05 Terzisti 0 €" },
    { id: "dpp_passport", label: "06 Passaporto DPP" },
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

        {/* VIEW 1: MODULE 01 - PRODOTTI & PONTE 1:N (PLM + PIM) */}
        {(activeModule === "products" ||
          activeModule === "all" ||
          activeModule === "pim_catalog" ||
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
                />
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: MODULE 02 - STAGIONI & COLLEZIONI */}
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

        {/* VIEW 3: MODULE 03 - ANAGRAFICHE DI DOMINIO MASTER */}
        {activeModule === "domain_registries" && (
          <DomainRegistriesManager
            registries={registries}
            onCreateEntry={handleCreateRegistryEntry}
            onUpdateEntry={handleUpdateRegistryEntry}
            onDeleteEntry={handleDeleteRegistryEntry}
          />
        )}

        {/* VIEW 4: MODULE 04 - MODELLO DATI FLESSIBILE & FOUNDER STUDIO */}
        {activeModule === "schema_studio" && (
          <DataModelSchemaStudio
            attributes={schemaAttributes}
            onCreateAttribute={handleCreateSchemaAttribute}
            onDeleteAttribute={handleDeleteSchemaAttribute}
          />
        )}

        {/* VIEW 5: MODULE 05 - RETE TERZISTI 0 € */}
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
              />
            </div>
          </div>
        )}

        {/* VIEW 6: MODULE 06 - PASSAPORTO DIGITALE UE (DPP) */}
        {activeModule === "dpp_passport" && (
          <LiveDppPassportGenerator pimItem={currentPim} dpp={dppData} />
        )}
      </main>
    </div>
  );
};

export default App;
