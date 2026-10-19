import React, { useState } from "react";
import {
  PimCommercialItem,
  PlmProductionVariant,
  PlmLifecycleStatus,
  ProductCategory,
  Season,
  ViewerSecurityRole,
  DigitalProductPassport,
} from "../types";

interface PimCatalogManagerProps {
  pimItems: PimCommercialItem[];
  seasons: Season[];
  viewerRole: ViewerSecurityRole;
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
  }) => void;
  onNavigateToPlm?: (pimItemId: string, variantId?: string) => void;
  onNavigateToDpp?: (pimItemId: string) => void;
}

export const PimCatalogManager: React.FC<PimCatalogManagerProps> = ({
  pimItems,
  seasons,
  viewerRole,
  onSelectPim,
  onCreatePimItem,
  onNavigateToPlm,
  onNavigateToDpp,
}) => {
  const [selectedPimId, setSelectedPimId] = useState<string>(pimItems[0]?.pim_item_id || "");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"catalog" | "feeds" | "aggregate_builder">("catalog");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);

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

  const handleExportCatalog = (format: "csv" | "json") => {
    if (format === "json") {
      const jsonStr = JSON.stringify(filteredItems, null, 2);
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
    ];

    const rows = filteredItems.map((item) => [
      `"${item.sku_code || (item as any).commercial_sku || ''}"`,
      `"${item.model_name}"`,
      `"${item.category}"`,
      `"${item.season}"`,
      `"${item.collection_name || 'Main Collection'}"`,
      item.wholesale_price_eur || 0,
      item.retail_price_eur || 0,
      `"${item.hs_customs_code || '6403.59.95'}"`,
      `"${item.gtin_ean || (item as any).barcode_ean13 || '8052109841235'}"`,
      item.plm_variants.length,
    ]);

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
    if (!aggName.trim() || !aggSku.trim()) return;
    const targetSeason = seasons[0];

    onCreatePimItem({
      sku_code: aggSku.trim().toUpperCase(),
      model_name: aggName.trim(),
      category: "footwear",
      season: targetSeason?.code || "PE26",
      season_id: targetSeason?.season_id,
      wholesale_price_eur: 280.0,
      retail_price_eur: 650.0,
      commercial_description_it: `Prodotto commerciale aggregato (1:N) composto da ${selectedVariantsForAgg.length} varianti PLM industriali.`,
    });

    setSelectedVariantsForAgg([]);
    setActiveTab("catalog");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner: Modulo PIM (FTL-CEO-010) */}
      <div className="bg-[#1C1C1E] text-white rounded-3xl p-8 shadow-2xl border border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                03 · PIM (PRODUCT INFORMATION MANAGEMENT) · FTL-CEO-010
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
            </div>

            <div className="text-xs text-[#707072] font-semibold">
              Totale Schede: <strong className="text-[#111111]">{filteredItems.length}</strong>
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

                    <div>
                      <h3 className="font-extrabold text-base text-[#111111]">{item.model_name}</h3>
                      <p className="text-xs text-[#707072] line-clamp-2 mt-1">
                        {item.commercial_description_it || (item as any).marketing_description_it || "Nessuna descrizione commerciale inserita."}
                      </p>
                    </div>

                    {/* Associated PLM Variants */}
                    <div className="bg-[#F5F5F5] rounded-2xl p-3 space-y-1.5 text-xs">
                      <div className="text-[10px] font-bold text-[#707072] uppercase">
                        Varianti PLM Industriali Collegate ({item.plm_variants.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.plm_variants.map((v) => (
                          <span
                            key={v.plm_variant_id}
                            className="bg-white border border-[#D5D5D5] px-2 py-0.5 rounded-md font-mono text-[10px] font-bold text-[#111111]"
                          >
                            {v.variant_code} ({v.colorway_name})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#EAEAEA] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#707072] font-semibold uppercase">Prezzo Retail / WS</div>
                      <div className="font-bold text-sm text-[#111111]">
                        € {item.retail_price_eur || 390.0} / <span className="text-neutral-500 font-normal">€ {item.wholesale_price_eur || 155.0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
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
                <span className="text-[10px] text-[#707072]">Include: MOQ, Scala taglie, Valuta EUR/USD</span>
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
    </div>
  );
};
