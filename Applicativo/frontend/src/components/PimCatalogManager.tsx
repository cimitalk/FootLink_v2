import React, { useState } from "react";
import { findMasterColorById } from "../mockSeedData";
import {
  PimCommercialItem,
  PlmProductionVariant,
  PlmLifecycleStatus,
  ProductCategory,
  Season,
  ViewerSecurityRole,
  DigitalProductPassport,
  MasterColor,
} from "../types";
import { FINISH_TYPE_LABELS } from "./ColorIntelligenceStudio";

interface PimCatalogManagerProps {
  pimItems: PimCommercialItem[];
  seasons: Season[];
  viewerRole: ViewerSecurityRole;
  colors?: MasterColor[];
  onSelectPim: (item: PimCommercialItem) => void;
  onCreatePimItem: (item: {
    sku_code: string;
    model_name: string;
    category: ProductCategory;
    target_gender?: string;
    lifecycle_status?: PlmLifecycleStatus;
    season: string;
    season_id?: string;
    collection_id?: string;
    wholesale_price_eur: number;
    retail_price_eur: number;
    commercial_description_it?: string;
    commercial_description_en?: string;
    custom_attributes?: Record<string, any>;
    initialVariant?: {
      variant_code?: string;
      colorway_name?: string;
      size_range?: string;
      last_or_pattern_code?: string;
      construction_type?: string;
      lifecycle_status?: PlmLifecycleStatus;
    };
  }) => void;
  onUpdatePimItem?: (pimItemId: string, patch: PimEnrichmentPatch) => void;
  onNavigateToPlm?: (pimItemId: string, variantId?: string) => void;
  onNavigateToDpp?: (pimItemId: string) => void;
}

/** FTL-CEO-028: commercial fields the PIM can enrich on top of PLM data. */
export interface PimEnrichmentPatch {
  model_name?: string;
  commercial_description_it?: string;
  commercial_description_en?: string;
  wholesale_price_eur?: number;
  retail_price_eur?: number;
  gtin_ean?: string;
  hs_customs_code?: string;
  publishing_status?: string;
  care_instructions?: string;
  end_of_life_guide?: string;
  brand_line?: string;
  target_occasion?: string;
  price_tier?: string;
  retail_channels?: string[];
}

const AGG_KEY = "aggregated_plm_variant_ids";

/** A PIM card is "da arricchire" when its commercial copy is still the auto-generated fallback. */
const needsEnrichment = (item: PimCommercialItem): boolean => {
  const desc = (item.commercial_description_it || "").trim();
  return (
    desc.length < 5 ||
    desc === item.model_name.trim() ||
    desc === `${item.model_name} · ${item.sku_code}` ||
    !item.gtin_ean
  );
};

export const PimCatalogManager: React.FC<PimCatalogManagerProps> = ({
  pimItems,
  seasons,
  viewerRole,
  colors = [],
  onSelectPim,
  onCreatePimItem,
  onUpdatePimItem,
  onNavigateToPlm,
  onNavigateToDpp,
}) => {
  const [selectedPimId, setSelectedPimId] = useState<string>(pimItems[0]?.pim_item_id || "");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyToEnrich, setOnlyToEnrich] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "feeds" | "aggregate_builder">("catalog");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);

  // PIM Enrichment modal state (FTL-CEO-028)
  const [enrichItem, setEnrichItem] = useState<PimCommercialItem | null>(null);
  const [enrichForm, setEnrichForm] = useState<PimEnrichmentPatch>({});

  // New PIM Item Form State
  const [newSku, setNewSku] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newCategory, setNewCategory] = useState<ProductCategory>("footwear");
  const [newTargetGender, setNewTargetGender] = useState("unisex");
  const [newSeasonId, setNewSeasonId] = useState(seasons[0]?.season_id || "");
  const [newCollectionId, setNewCollectionId] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState(160.0);
  const [retailPrice, setRetailPrice] = useState(395.0);
  const [descIt, setDescIt] = useState("");

  // Aggregate 1:N Builder State
  const [aggName, setAggName] = useState("Look Luxury Marche - Mocassino & Cintura");
  const [aggSku, setAggSku] = useState("BUNDLE-PE26-001");
  const [selectedVariantsForAgg, setSelectedVariantsForAgg] = useState<string[]>([]);

  const allPlmVariants = pimItems.flatMap((p) =>
    p.plm_variants.map((v) => ({ ...v, parentPim: p }))
  );

  const currentItem = pimItems.find((p) => p.pim_item_id === selectedPimId) || pimItems[0];

  // Filtering
  const filteredItems = pimItems.filter((item) => {
    if (selectedSeasonId !== "ALL") {
      const sMatch = item.season_id === selectedSeasonId || item.season === seasons.find((s) => s.season_id === selectedSeasonId)?.code;
      if (!sMatch) return false;
    }
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    if (onlyToEnrich && !needsEnrichment(item)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSku = (item.sku_code || (item as any).commercial_sku || "").toLowerCase().includes(q);
      const matchName = item.model_name.toLowerCase().includes(q);
      if (!matchSku && !matchName) return false;
    }
    return true;
  });

  const handleCopyFeedUrl = (feedKey: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedFeed(feedKey);
    setTimeout(() => setCopiedFeed(null), 2500);
  };

  const resolveVariantMasterColor = (
    v: PlmProductionVariant
  ): MasterColor | undefined => {
    return (
      findMasterColorById(colors, v.primary_color_id) ||
      findMasterColorById(colors, v.bom_items?.[0]?.master_color_id)
    );
  };

  const handleExportCatalog = (format: "csv" | "json") => {
    if (format === "json") {
      const sanitizedOmnichannelPayload = filteredItems.map((item) => ({
        pim_item_id: item.pim_item_id,
        sku_code: item.sku_code,
        model_name: item.model_name,
        category: item.category,
        season: item.season,
        wholesale_price_eur: item.wholesale_price_eur,
        retail_price_eur: item.retail_price_eur,
        hs_customs_code: item.hs_customs_code,
        gtin_ean: item.gtin_ean,
        variants_omnichannel: item.plm_variants.map((v) => {
          const mc = resolveVariantMasterColor(v);
          return {
            variant_code: v.variant_code,
            technical_colorway_it: mc?.technical_name_it || v.colorway_name,
            color_family: mc?.commercial_family || "N/D",
            color_hex: mc?.hex_code || "#111111",
            color_finish:
              (mc && (FINISH_TYPE_LABELS[mc.finish_type] || mc.finish_type)) ||
              "Standard",
            pantone_reference: mc?.pantone_tcx_code || "N/D",
            size_range: v.size_range,
          };
        }),
      }));
      const jsonStr = JSON.stringify(sanitizedOmnichannelPayload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `footlink_pim_catalog_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const headers = [
      "SKU Commerciale",
      "Nome Modello",
      "Categoria",
      "Stagione",
      "Collezione",
      "Prezzo Wholesale (€)",
      "Prezzo Retail (€)",
      "Codice HS Doganale",
      "Barcode EAN",
      "Varianti PLM Collegate",
      "color_family",
      "color_hex",
      "color_finish",
      "pantone_reference",
    ];

    const rows = filteredItems.map((item) => {
      const mappedColors = item.plm_variants
        .map((v) => resolveVariantMasterColor(v))
        .filter((c): c is MasterColor => Boolean(c));
      const famStr = Array.from(
        new Set(mappedColors.map((c) => c.commercial_family))
      ).join(" | ");
      const hexStr = mappedColors.map((c) => c.hex_code).join(" | ");
      const finStr = mappedColors
        .map((c) => FINISH_TYPE_LABELS[c.finish_type] || c.finish_type)
        .join(" | ");
      const panStr = mappedColors.map((c) => c.pantone_tcx_code).join(" | ");

      return [
        `"${item.sku_code || (item as any).commercial_sku || ""}"`,
        `"${item.model_name}"`,
        `"${item.category}"`,
        `"${item.season}"`,
        `"${item.collection_name || "Main Collection"}"`,
        item.wholesale_price_eur || 0,
        item.retail_price_eur || 0,
        `"${item.hs_customs_code || "6403.59.95"}"`,
        `"${item.gtin_ean || (item as any).barcode_ean13 || "8052109841235"}"`,
        item.plm_variants.length,
        `"${famStr || "Standard"}"`,
        `"${hexStr || "#111111"}"`,
        `"${finStr || "Standard"}"`,
        `"${panStr || "N/D"}"`,
      ];
    });

    const csvContent = headers.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `footlink_pim_catalog_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !newSku.trim()) return;

    const targetSeason = seasons.find((s) => s.season_id === newSeasonId) || seasons[0];
    onCreatePimItem({
      sku_code: newSku.trim().toUpperCase(),
      model_name: newModelName.trim(),
      category: newCategory,
      target_gender: newTargetGender,
      lifecycle_status: "new_from_pim",
      season: targetSeason?.code || "PE26",
      season_id: targetSeason?.season_id,
      collection_id: newCollectionId || undefined,
      wholesale_price_eur: Number(wholesalePrice) || 150.0,
      retail_price_eur: Number(retailPrice) || 380.0,
      commercial_description_it: descIt.trim(),
    });

    setNewModelName("");
    setNewSku("");
    setDescIt("");
    setShowCreateModal(false);
  };

  const handleCreateAggregate = () => {
    if (!aggName.trim() || !aggSku.trim() || selectedVariantsForAgg.length === 0) return;
    const components = allPlmVariants.filter((v) =>
      selectedVariantsForAgg.includes(v.plm_variant_id)
    );
    const first = components[0]?.parentPim;
    const targetSeason =
      seasons.find((s) => s.season_id === first?.season_id) || seasons[0];
    const sku = aggSku.trim().toUpperCase();

    // FTL-CEO-028: the PIM aggregate "encompasses" the selected PLM variants by reference.
    // Component variants stay owned by their PLM product (no BOM/lifecycle duplication);
    // a single kitting variant represents the commercial pack in PLM.
    onCreatePimItem({
      sku_code: sku,
      model_name: aggName.trim(),
      category: first?.category || "footwear",
      season: targetSeason?.code || "PE26",
      season_id: targetSeason?.season_id,
      wholesale_price_eur: components.reduce((s, v) => s + (v.parentPim.wholesale_price_eur || 0), 0) || 280.0,
      retail_price_eur: components.reduce((s, v) => s + (v.parentPim.retail_price_eur || 0), 0) || 650.0,
      commercial_description_it: `Prodotto commerciale aggregato (1:N) composto da ${components.length} varianti PLM: ${components
        .map((v) => v.variant_code)
        .join(", ")}.`,
      custom_attributes: {
        [AGG_KEY]: components.map((v) => v.plm_variant_id),
        aggregated_pim_item_ids: Array.from(new Set(components.map((v) => v.parentPim.pim_item_id))),
      },
      initialVariant: {
        variant_code: `${sku}-KIT`,
        colorway_name: "Kit commerciale (confezionamento bundle)",
        size_range: components[0]?.size_range,
        last_or_pattern_code: "KIT-BUNDLE",
        construction_type: "kitting_bundle",
        lifecycle_status: "new_from_pim",
      },
    });

    setSelectedVariantsForAgg([]);
    setActiveTab("catalog");
  };

  const openEnrichModal = (item: PimCommercialItem) => {
    setEnrichItem(item);
    setEnrichForm({
      model_name: item.model_name,
      commercial_description_it: item.commercial_description_it || "",
      commercial_description_en: item.commercial_description_en || "",
      wholesale_price_eur: item.wholesale_price_eur,
      retail_price_eur: item.retail_price_eur,
      gtin_ean: item.gtin_ean || "",
      hs_customs_code: item.hs_customs_code || "",
      publishing_status: item.publishing_status || "READY",
      care_instructions: item.care_instructions || "",
      end_of_life_guide: item.end_of_life_guide || "",
      brand_line: item.brand_line || "Main Line",
      target_occasion: item.target_occasion || "smart_casual",
      price_tier: item.price_tier || "core_luxury",
      retail_channels: item.retail_channels || [],
    });
  };

  const handleEnrichSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrichItem || !onUpdatePimItem) return;
    onUpdatePimItem(enrichItem.pim_item_id, {
      ...enrichForm,
      wholesale_price_eur: Number(enrichForm.wholesale_price_eur) || 0,
      retail_price_eur: Number(enrichForm.retail_price_eur) || 0,
    });
    setEnrichItem(null);
  };

  const plmVariantsTotal = allPlmVariants.length;
  const toEnrichCount = pimItems.filter(needsEnrichment).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner: Modulo PIM (FTL-CEO-010) */}
      <div className="bg-[#1C1C1E] text-white rounded-3xl p-8 shadow-2xl border border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                03 · PIM (CATALOGO COMMERCIALE &amp; FEED) (FTL-TECH-027)
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Default 1:1 Speculare · Aggregazione 1:N · Feed E-Commerce & B2B
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
              Catalogo Commerciale Omnicanale & Feed Syndication
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Gestione commerciale centralizzata del catalogo: sincronizzazione istantanea 1:1 con i modelli PLM,
              creazione di look/bundle aggregati 1:N, associazione a stagioni moda ed esportazione di feed live per Shopify,
              showroom digitali (NuORDER / JOOR) e Passaporto DPP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleExportCatalog("json")}
              className="px-4 py-2.5 rounded-full border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span>📦 Esporta Feed JSON (Color Metafields)</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportCatalog("csv")}
              className="px-4 py-2.5 rounded-full border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span>📥 Esporta Catalogo CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-full bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <span>+ Nuovo Modello PIM</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs within PIM */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === "catalog"
                ? "bg-white text-[#111111]"
                : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            📋 Schede Commerciali (Default 1:1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("aggregate_builder")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === "aggregate_builder"
                ? "bg-white text-[#111111]"
                : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            🧩 Aggregatore Look & Bundle (1:N)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("feeds")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === "feeds"
                ? "bg-white text-[#111111]"
                : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            📡 Feed Syndication (Shopify · B2B · DPP)
          </button>
        </div>
      </div>

      {/* TAB 1: CATALOG GRID */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Cerca per SKU, modello o codice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold w-72 focus:outline-none focus:border-[#111111]"
              />

              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="px-3 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold text-[#111111]"
              >
                <option value="ALL">Tutte le Stagioni</option>
                {seasons.map((s) => (
                  <option key={s.season_id} value={s.season_id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold text-[#111111]"
              >
                <option value="ALL">Tutte le Categorie</option>
                <option value="footwear">👟 Calzature</option>
                <option value="leather_goods">👜 Pelletteria</option>
                <option value="apparel">🧥 Abbigliamento</option>
              </select>

              <label className="flex items-center gap-1.5 px-3 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold text-[#111111] cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyToEnrich}
                  onChange={(e) => setOnlyToEnrich(e.target.checked)}
                />
                Solo da arricchire ({toEnrichCount})
              </label>
            </div>

            <div className="text-xs text-[#707072] font-semibold text-right">
              <div>
                Totale Schede: <strong className="text-[#111111]">{filteredItems.length}</strong>
              </div>
              <div
                className="text-[10px] text-emerald-700"
                title="FTL-CEO-028: ogni prodotto creato nel PLM è automaticamente una scheda PIM"
              >
                ✓ {plmVariantsTotal} varianti PLM · 100% presenti nel PIM
              </div>
            </div>
          </div>

          {/* Catalog Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isSelected = item.pim_item_id === selectedPimId;
              const skuDisplay = item.sku_code || (item as any).commercial_sku || "SKU-AUTO";

              return (
                <div
                  key={item.pim_item_id}
                  onClick={() => {
                    setSelectedPimId(item.pim_item_id);
                    onSelectPim(item);
                  }}
                  className={`bg-white border rounded-3xl p-6 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between ${
                    isSelected ? "border-[#111111] ring-2 ring-[#111111]/10" : "border-[#E5E5E5]"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                        {skuDisplay}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[#707072] bg-[#F5F5F5] px-2.5 py-0.5 rounded-full">
                        {item.season}
                      </span>
                    </div>

                    {needsEnrichment(item) && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        ⚠ Da arricchire (nuovo dal PLM)
                      </span>
                    )}

                    <div>
                      <h3 className="font-extrabold text-base text-[#111111]">{item.model_name}</h3>
                      <p className="text-xs text-[#707072] line-clamp-2 mt-1">
                        {item.commercial_description_it || (item as any).marketing_description_it || "Nessuna descrizione commerciale inserita."}
                      </p>
                    </div>

                    {/* Associated PLM Variants & Omnichannel Color Auto-Mapping */}
                    <div className="bg-[#F5F5F5] rounded-2xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#707072] uppercase">
                          Varianti PLM &amp; Auto-Mapping Colore ({item.plm_variants.length})
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                          B2C/B2B Sync
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {item.plm_variants.map((v) => {
                          const mc = resolveVariantMasterColor(v);
                          return (
                            <div
                              key={v.plm_variant_id}
                              className="bg-white border border-[#D5D5D5] px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                  style={{
                                    backgroundColor: mc?.hex_code || "#111111",
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="font-mono text-[10px] font-bold text-[#111111] truncate">
                                    {v.variant_code}
                                  </div>
                                  <div className="text-[10px] text-[#707072] truncate">
                                    {mc?.technical_name_it || v.colorway_name}
                                  </div>
                                </div>
                              </div>
                              {mc && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-neutral-900 shrink-0">
                                  → {mc.commercial_family}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* FTL-CEO-028: PLM components encompassed by a 1:N aggregate */}
                    {Array.isArray(item.custom_attributes?.[AGG_KEY]) &&
                      item.custom_attributes[AGG_KEY].length > 0 && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 space-y-1.5 text-xs">
                          <div className="text-[10px] font-bold text-blue-700 uppercase">
                            Prodotti PLM inglobati ({item.custom_attributes[AGG_KEY].length})
                          </div>
                          {(item.custom_attributes[AGG_KEY] as string[]).map((vid) => {
                            const comp = allPlmVariants.find((v) => v.plm_variant_id === vid);
                            return (
                              <button
                                key={vid}
                                type="button"
                                disabled={!comp || !onNavigateToPlm}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (comp) onNavigateToPlm?.(comp.parentPim.pim_item_id, vid);
                                }}
                                className="w-full text-left bg-white border border-blue-100 px-2.5 py-1.5 rounded-lg hover:border-blue-300 disabled:opacity-60"
                              >
                                <span className="font-mono text-[10px] font-bold text-[#111111]">
                                  {comp?.variant_code || vid}
                                </span>
                                <span className="text-[10px] text-[#707072]">
                                  {" "}· {comp ? comp.parentPim.model_name : "variante non trovata"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#EAEAEA] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#707072] font-semibold uppercase">Prezzo Retail / WS</div>
                      <div className="font-bold text-sm text-[#111111]">
                        € {item.retail_price_eur || 390.0} / <span className="text-neutral-500 font-normal">€ {item.wholesale_price_eur || 155.0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onUpdatePimItem && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEnrichModal(item);
                          }}
                          className="px-3 py-1 rounded-full border border-[#D5D5D5] bg-white text-[#111111] text-[10px] font-bold hover:border-[#111111]"
                        >
                          ✏️ Arricchisci
                        </button>
                      )}
                      {onNavigateToPlm && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToPlm(item.pim_item_id, item.plm_variants[0]?.plm_variant_id);
                          }}
                          className="px-3 py-1 rounded-full bg-[#111111] text-white text-[10px] font-bold hover:bg-neutral-800"
                        >
                          Apri PLM ➔
                        </button>
                      )}
                      {onNavigateToDpp && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToDpp(item.pim_item_id);
                          }}
                          className="px-3 py-1 rounded-full bg-emerald-500 text-[#111111] text-[10px] font-bold hover:bg-emerald-400"
                        >
                          DPP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AGGREGATE 1:N BUILDER */}
      {activeTab === "aggregate_builder" && (
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 space-y-6 shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-0.5 rounded-full">
              MODELLO 1 PIM : N PLM (AGGIUNTO DA FOUNDER)
            </span>
            <h2 className="text-2xl font-extrabold text-[#111111] mt-2">
              Componi un Articolo Commerciale Aggregato
            </h2>
            <p className="text-xs text-[#707072] max-w-2xl mt-1">
              Combina più varianti tecniche di fabbrica (ad esempio multi-sourcing, pack coordinati, o famiglie colore)
              in un'unica offerta commerciale pronta per la distribuzione.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                  Nome Articolo Aggregato PIM *
                </label>
                <input
                  type="text"
                  value={aggName}
                  onChange={(e) => setAggName(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#D5D5D5] bg-white font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                  SKU Commerciale Bundle *
                </label>
                <input
                  type="text"
                  value={aggSku}
                  onChange={(e) => setAggSku(e.target.value.toUpperCase())}
                  className="w-full p-3 rounded-2xl border border-[#D5D5D5] bg-white font-mono font-bold text-xs uppercase"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-[#707072] uppercase">
                Seleziona Varianti PLM da Aggregare ({selectedVariantsForAgg.length} selezionate)
              </label>
              <div className="max-h-60 overflow-y-auto border border-[#E5E5E5] rounded-2xl divide-y divide-[#E5E5E5] p-2 bg-[#F5F5F5]">
                {allPlmVariants.map((v) => {
                  const isChecked = selectedVariantsForAgg.includes(v.plm_variant_id);
                  return (
                    <label
                      key={v.plm_variant_id}
                      className="flex items-center justify-between p-2 hover:bg-white rounded-xl cursor-pointer text-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVariantsForAgg([...selectedVariantsForAgg, v.plm_variant_id]);
                            } else {
                              setSelectedVariantsForAgg(selectedVariantsForAgg.filter((id) => id !== v.plm_variant_id));
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <div>
                          <span className="font-bold font-mono">{v.variant_code}</span>
                          <span className="text-neutral-500 text-[11px] ml-2">({v.parentPim.model_name})</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-[#D5D5D5]">
                        {v.colorway_name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#EAEAEA]">
            <button
              type="button"
              disabled={selectedVariantsForAgg.length === 0}
              onClick={handleCreateAggregate}
              className="px-6 py-3 rounded-full bg-blue-600 disabled:opacity-40 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition"
            >
              Crea Articolo Aggregato (1:N)
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: OMNICHANNEL FEEDS */}
      {activeTab === "feeds" && (
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 space-y-6 shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-0.5 rounded-full">
              OMNICHANNEL SYNDICATION HUB (FTL-CEO-010)
            </span>
            <h2 className="text-2xl font-extrabold text-[#111111] mt-2">
              Feed E-Commerce & Showroom B2B Esterni
            </h2>
            <p className="text-xs text-[#707072] max-w-3xl mt-1">
              Connettori dinamici standardizzati per alimentare negozi online (Shopify), showroom digitali
              (NuORDER / JOOR) e cataloghi multicanale. I costi industriali L6 sono rigorosamente segregati.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shopify Feed Card */}
            <div className="border border-[#E5E5E5] rounded-2xl p-6 bg-[#FAFAFA] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛍️</span>
                  <div>
                    <h3 className="font-bold text-sm text-[#111111]">Feed Shopify Plus (B2C)</h3>
                    <p className="text-[11px] text-[#707072]">JSON compatibile con metafields ESPR DPP</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Attivo 24/7
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#D5D5D5] font-mono text-[11px] text-[#111111] break-all select-all">
                http://127.0.0.1:8000/api/v1/pim-items/feed/shopify
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-[#707072]">Include: Prezzi retail, immagini, EAN, DPP URL</span>
                <button
                  type="button"
                  onClick={() => handleCopyFeedUrl("shopify", "http://127.0.0.1:8000/api/v1/pim-items/feed/shopify")}
                  className="px-4 py-1.5 rounded-full bg-[#111111] text-white text-[11px] font-bold hover:bg-neutral-800"
                >
                  {copiedFeed === "shopify" ? "✓ Copiato!" : "Copia URL Feed"}
                </button>
              </div>
            </div>

            {/* B2B Showroom Feed Card */}
            <div className="border border-[#E5E5E5] rounded-2xl p-6 bg-[#FAFAFA] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💼</span>
                  <div>
                    <h3 className="font-bold text-sm text-[#111111]">Feed B2B Wholesale (NuORDER / JOOR)</h3>
                    <p className="text-[11px] text-[#707072]">Line sheet con prezzi wholesale (Costi L6 mascherati)</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  L6 Segregato
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#D5D5D5] font-mono text-[11px] text-[#111111] break-all select-all">
                http://127.0.0.1:8000/api/v1/pim-items/feed/b2b
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-[#707072]">Include: MOQ, Scala taglie, Valuta EUR/USD, Pantone TCX</span>
                <button
                  type="button"
                  onClick={() => handleCopyFeedUrl("b2b", "http://127.0.0.1:8000/api/v1/pim-items/feed/b2b")}
                  className="px-4 py-1.5 rounded-full bg-[#111111] text-white text-[11px] font-bold hover:bg-neutral-800"
                >
                  {copiedFeed === "b2b" ? "✓ Copiato!" : "Copia URL Feed"}
                </button>
              </div>
            </div>
          </div>

          {/* Sprint 8: Auto-Mapping Colore Commerciale Omnicanale Preview */}
          <div className="border border-[#E5E5E5] rounded-2xl p-6 bg-[#FAFAFA] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  COLOR INTELLIGENCE → PIM SYNDICATION
                </span>
                <h3 className="text-base font-extrabold text-[#111111] mt-1">
                  Auto-Mapping Colore Commerciale Omnicanale (Metafields B2C &amp; B2B)
                </h3>
                <p className="text-xs text-[#707072]">
                  Traduzione automatica senza intervento manuale dal lessico di conceria/fabbrica ai filtri standardizzati di ricerca Shopify Plus (`color_family`, `color_hex`, `color_finish`) e line-sheet JOOR/NuORDER (`pantone_reference`).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportCatalog("json")}
                className="px-4 py-2 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-neutral-800"
              >
                📦 Scarica Payload Feed JSON
              </button>
            </div>

            <div className="overflow-x-auto bg-white border border-[#E5E5E5] rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">SKU &amp; Variante PLM</th>
                    <th className="py-2.5 px-3">Tinta Fabbrica (technical_name_it)</th>
                    <th className="py-2.5 px-3">Filtro E-Commerce (color_family)</th>
                    <th className="py-2.5 px-3">Swatch &amp; color_hex</th>
                    <th className="py-2.5 px-3">Finitura (color_finish)</th>
                    <th className="py-2.5 px-3">Showroom B2B (pantone_reference)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPlmVariants.map((v) => {
                    const mc = resolveVariantMasterColor(v);
                    return (
                      <tr key={v.plm_variant_id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">
                          {v.parentPim.sku_code} · {v.variant_code}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {mc?.technical_name_it || v.colorway_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-900 text-white">
                            {mc?.commercial_family || "Standard"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{
                                backgroundColor: mc?.hex_code || "#111111",
                              }}
                            />
                            <span>{mc?.hex_code || "#111111"}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {(mc &&
                            (FINISH_TYPE_LABELS[mc.finish_type] ||
                              mc.finish_type)) ||
                            "Standard"}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-neutral-900">
                          {mc?.pantone_tcx_code || "N/D"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuovo Modello PIM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">+ Nuovo Modello Commerciale PIM</h3>
                <p className="text-xs text-[#707072]">Definisci lo stile di catalogo e listini di vendita.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Categoria *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="footwear">👟 Calzature</option>
                    <option value="leather_goods">👜 Pelletteria</option>
                    <option value="apparel">🧥 Abbigliamento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Genere Target *</label>
                  <select
                    value={newTargetGender}
                    onChange={(e) => setNewTargetGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="donna">♀ Donna</option>
                    <option value="uomo">♂ Uomo</option>
                    <option value="unisex">⚥ Unisex</option>
                    <option value="bambino">🧒 Bambino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Stagione *</label>
                  <select
                    value={newSeasonId}
                    onChange={(e) => setNewSeasonId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    {seasons.map((s) => (
                      <option key={s.season_id} value={s.season_id}>
                        {s.code} · {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">SKU Commerciale *</label>
                  <input
                    type="text"
                    required
                    placeholder="SKU-2026-X1"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Nome Modello *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mocassino Tradizione Marche"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Prezzo Wholesale (€) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Prezzo Retail (€) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Descrizione Commerciale IT</label>
                <textarea
                  rows={2}
                  value={descIt}
                  onChange={(e) => setDescIt(e.target.value)}
                  placeholder="Descrizione per e-commerce e catalogo buyer..."
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800"
                >
                  Salva nel PIM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Arricchimento Scheda PIM (FTL-CEO-028) */}
      {enrichItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#111111]">
                    Arricchisci Scheda Commerciale PIM
                  </h3>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {enrichItem.sku_code}
                  </span>
                </div>
                <p className="text-xs text-[#707072]">
                  Completa i campi commerciali PIM mantenendo la perfetta sincronizzazione con le {enrichItem.plm_variants.length} varianti PLM industriali.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnrichItem(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrichSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Basic Commercial Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Nome Modello Commerciale *
                  </label>
                  <input
                    type="text"
                    required
                    value={enrichForm.model_name || ""}
                    onChange={(e) => setEnrichForm({ ...enrichForm, model_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Linea Brand
                  </label>
                  <select
                    value={enrichForm.brand_line || "Main Line"}
                    onChange={(e) => setEnrichForm({ ...enrichForm, brand_line: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="Main Line">Main Line</option>
                    <option value="Studio">Studio</option>
                    <option value="Heritage">Heritage</option>
                    <option value="Atelier">Atelier</option>
                    <option value="Signature Capsule">Signature Capsule</option>
                  </select>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                  Descrizione Commerciale IT (E-Commerce & Showroom) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={enrichForm.commercial_description_it || ""}
                  onChange={(e) => setEnrichForm({ ...enrichForm, commercial_description_it: e.target.value })}
                  placeholder="Descrizione storytelling in italiano (minimo 5 caratteri)..."
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                  Descrizione Commerciale EN (Global Syndication) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={enrichForm.commercial_description_en || ""}
                  onChange={(e) => setEnrichForm({ ...enrichForm, commercial_description_en: e.target.value })}
                  placeholder="Commercial storytelling in English..."
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                />
              </div>

              {/* Pricing & Tier */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Prezzo Wholesale (€) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={enrichForm.wholesale_price_eur ?? 0}
                    onChange={(e) => setEnrichForm({ ...enrichForm, wholesale_price_eur: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Prezzo Retail (€) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={enrichForm.retail_price_eur ?? 0}
                    onChange={(e) => setEnrichForm({ ...enrichForm, retail_price_eur: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Fascia Prezzo (Tier)
                  </label>
                  <select
                    value={enrichForm.price_tier || "core_luxury"}
                    onChange={(e) => setEnrichForm({ ...enrichForm, price_tier: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="entry_luxury">Entry Luxury</option>
                    <option value="core_luxury">Core Luxury</option>
                    <option value="high_luxury">High Luxury</option>
                    <option value="bespoke">Bespoke / Couture</option>
                  </select>
                </div>
              </div>

              {/* Occasion & Status & Identifiers */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Occasione d'Uso
                  </label>
                  <select
                    value={enrichForm.target_occasion || "smart_casual"}
                    onChange={(e) => setEnrichForm({ ...enrichForm, target_occasion: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="business_formal">Business Formal</option>
                    <option value="smart_casual">Smart Casual</option>
                    <option value="evening_gala">Evening Gala</option>
                    <option value="urban_active">Urban Active</option>
                    <option value="outdoor_leisure">Outdoor Leisure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Stato Catalogo
                  </label>
                  <select
                    value={enrichForm.publishing_status || "READY"}
                    onChange={(e) => setEnrichForm({ ...enrichForm, publishing_status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="DRAFT">Draft (Bozza)</option>
                    <option value="READY">Ready (Pronto)</option>
                    <option value="PUBLISHED">Published (Pubblicato)</option>
                    <option value="ARCHIVED">Archived (Archiviato)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Codice GTIN / EAN
                  </label>
                  <input
                    type="text"
                    value={enrichForm.gtin_ean || ""}
                    onChange={(e) => setEnrichForm({ ...enrichForm, gtin_ean: e.target.value })}
                    placeholder="es. 8050012026018"
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Circularity & Care */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Istruzioni di Cura (DPP)
                  </label>
                  <textarea
                    rows={2}
                    value={enrichForm.care_instructions || ""}
                    onChange={(e) => setEnrichForm({ ...enrichForm, care_instructions: e.target.value })}
                    placeholder="Istruzioni manutenzione..."
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Guida Fine Vita (Circolarità)
                  </label>
                  <textarea
                    rows={2}
                    value={enrichForm.end_of_life_guide || ""}
                    onChange={(e) => setEnrichForm({ ...enrichForm, end_of_life_guide: e.target.value })}
                    placeholder="Programma take-back / disassemblaggio..."
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
                  />
                </div>
              </div>

              {/* Encompassed PLM Variants Box */}
              <div className="bg-[#F5F5F5] rounded-2xl p-3 border border-[#E5E5E5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#707072]">
                    Varianti Industriali PLM Inglobate ({enrichItem.plm_variants.length})
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    ✓ Fonte di Verità PLM Protetta
                  </span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {enrichItem.plm_variants.map((v) => (
                    <div
                      key={v.plm_variant_id}
                      className="bg-white border border-[#E5E5E5] p-2 rounded-lg flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#111111]">{v.variant_code}</span>
                        <span className="text-[#707072]">{v.colorway_name}</span>
                        <span className="text-[10px] bg-[#F5F5F5] px-1.5 py-0.5 rounded text-[#707072]">
                          Taglie: {v.size_range}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {v.lifecycle_status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setEnrichItem(null)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800 transition shadow-sm"
                >
                  Salva Arricchimento PIM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
