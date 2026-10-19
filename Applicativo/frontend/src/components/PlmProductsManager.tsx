import React, { useState } from "react";
import {
  PimCommercialItem,
  PlmProductionVariant,
  PlmLifecycleStatus,
  ProductCategory,
  ViewerSecurityRole,
  Season,
  BomItem,
  DomainRegistryEntry,
} from "../types";
import { BomThreeLevelTree } from "./BomThreeLevelTree";

interface PlmProductsManagerProps {
  pimItems: PimCommercialItem[];
  viewerRole: ViewerSecurityRole;
  seasons: Season[];
  registries?: DomainRegistryEntry[];
  onSelectPim: (item: PimCommercialItem) => void;
  onSelectVariant: (variant: PlmProductionVariant) => void;
  onAddVariant: (payload: {
    variant_code: string;
    colorway_name: string;
    size_range: string;
    last_or_pattern_code: string;
    lifecycle_status: PlmLifecycleStatus;
    target_gender?: string;
    custom_attributes?: Record<string, any>;
  }) => void;
  onCreatePimItem: (item: {
    sku_code: string;
    model_name: string;
    category: ProductCategory;
    target_gender?: string;
    season: string;
    season_id?: string;
    collection_id?: string;
    wholesale_price_eur: number;
    retail_price_eur: number;
    commercial_description_it?: string;
    commercial_description_en?: string;
  }) => void;
  onUpdateVariantLifecycle: (variantId: string, status: PlmLifecycleStatus) => void;
  onUpdateProductVariant?: (
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
      custom_attributes?: Record<string, any>;
    }
  ) => void;
  onAddBomItem?: (bom: BomItem) => void;
}

export const PlmProductsManager: React.FC<PlmProductsManagerProps> = ({
  pimItems,
  viewerRole,
  seasons,
  registries = [],
  onSelectPim,
  onSelectVariant,
  onAddVariant,
  onCreatePimItem,
  onUpdateVariantLifecycle,
  onUpdateProductVariant,
  onAddBomItem,
}) => {
  const [selectedPimId, setSelectedPimId] = useState<string>(pimItems[0]?.pim_item_id || "");
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    pimItems[0]?.plm_variants[0]?.plm_variant_id || ""
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [genderFilter, setGenderFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<PlmProductionVariant & { parentPim: PimCommercialItem } | null>(null);
  const [cloneBomFromId, setCloneBomFromId] = useState<string>("");

  // Quick Edit Full Form State
  const [editModelName, setEditModelName] = useState("");
  const [editSkuCode, setEditSkuCode] = useState("");
  const [editCategory, setEditCategory] = useState<ProductCategory>("footwear");
  const [editTargetGender, setEditTargetGender] = useState("unisex");
  const [editSeasonId, setEditSeasonId] = useState("");
  const [editVariantCode, setEditVariantCode] = useState("");
  const [editColorway, setEditColorway] = useState("");
  const [editLastCode, setEditLastCode] = useState("");
  const [editSizeRange, setEditSizeRange] = useState("");
  const [editSampleBaseSize, setEditSampleBaseSize] = useState("");
  const [editGradingStepPct, setEditGradingStepPct] = useState(2.8);
  const [editLifecycleStatus, setEditLifecycleStatus] = useState<PlmLifecycleStatus>("prototype");

  // New Product Form State
  const [newModelName, setNewModelName] = useState("");
  const [newCategory, setNewCategory] = useState<ProductCategory>("footwear");
  const [newTargetGender, setNewTargetGender] = useState("unisex");
  const [newVariantCode, setNewVariantCode] = useState("");
  const [newColorway, setNewColorway] = useState("Nero Assoluto");
  const [newSizeRange, setNewSizeRange] = useState("Donna EU 35-42");
  const [newLastCode, setNewLastCode] = useState("FORMA-FM-108");
  const [newSeasonId, setNewSeasonId] = useState(seasons[0]?.season_id || "");

  // Flatten all variants with parent PIM context
  const allVariantsWithParent = pimItems.flatMap((pim) =>
    pim.plm_variants.map((v) => ({
      ...v,
      parentPim: pim,
      isActive: (v as any).is_active !== false,
    }))
  );

  const currentPim = pimItems.find((p) => p.pim_item_id === selectedPimId) || pimItems[0];
  const currentVariant =
    currentPim?.plm_variants.find((v) => v.plm_variant_id === selectedVariantId) ||
    currentPim?.plm_variants[0];

  // Filtering
  const filteredVariants = allVariantsWithParent.filter((item) => {
    if (categoryFilter !== "ALL" && item.parentPim.category !== categoryFilter) return false;
    if (genderFilter !== "ALL") {
      const g = (item.target_gender || item.parentPim.target_gender || "unisex").toLowerCase();
      if (g !== genderFilter.toLowerCase()) return false;
    }
    if (statusFilter !== "ALL" && item.lifecycle_status !== statusFilter) return false;
    if (onlyActive && !item.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = item.variant_code.toLowerCase().includes(q);
      const matchName = item.parentPim.model_name.toLowerCase().includes(q);
      const matchColor = item.colorway_name.toLowerCase().includes(q);
      const matchLast = (item.last_or_pattern_code || "").toLowerCase().includes(q);
      const matchGender = (item.target_gender || item.parentPim.target_gender || "").toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchColor && !matchLast && !matchGender) return false;
    }
    return true;
  });

  const handleRowClick = (pimId: string, varId: string) => {
    setSelectedPimId(pimId);
    setSelectedVariantId(varId);
    const targetPim = pimItems.find((p) => p.pim_item_id === pimId);
    if (targetPim) {
      onSelectPim(targetPim);
      const targetVar = targetPim.plm_variants.find((v) => v.plm_variant_id === varId);
      if (targetVar) onSelectVariant(targetVar);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Codice Variante PLM",
      "Modello Industriale",
      "Categoria",
      "Genere Target",
      "Colore / Variante",
      "Forma / Patron",
      "Scala Taglie",
      "Stato Ciclo Vita",
      "Componenti BOM",
      "Costo Materiali (€)",
      "Costo Manodopera (€)",
      "Costo Industriale Totale (€)",
    ];

    const rows = filteredVariants.map((item) => {
      const matCost = item.bom_items.reduce(
        (sum, b) => sum + (b.unit_consumption * (1 + b.waste_percentage / 100)) * (b.unit_cost_eur || 0),
        0
      );
      const laborCost = item.standard_labor_cost_eur || 28.0;
      const totalCost = matCost + laborCost;

      return [
        `"${item.variant_code}"`,
        `"${item.parentPim.model_name}"`,
        `"${item.parentPim.category}"`,
        `"${item.target_gender || item.parentPim.target_gender || 'unisex'}"`,
        `"${item.colorway_name}"`,
        `"${item.last_or_pattern_code || 'N/D'}"`,
        `"${item.size_range}"`,
        `"${item.lifecycle_status}"`,
        item.bom_items.length,
        viewerRole === "brand" ? matCost.toFixed(2) : '"[PROTECTED_L6]"',
        viewerRole === "brand" ? laborCost.toFixed(2) : '"[PROTECTED_L6]"',
        viewerRole === "brand" ? totalCost.toFixed(2) : '"[PROTECTED_L6]"',
      ].join(",");
    });

    const csvContent = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `footlink_prodotti_plm_bom_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !newVariantCode.trim()) return;

    const targetSeason = seasons.find((s) => s.season_id === newSeasonId) || seasons[0];
    const generatedSku = `SKU-${newVariantCode.trim().toUpperCase()}`;

    // Create Commercial PIM Parent
    onCreatePimItem({
      sku_code: generatedSku,
      model_name: newModelName.trim(),
      category: newCategory,
      target_gender: newTargetGender,
      season: targetSeason?.code || "PE26",
      season_id: targetSeason?.season_id,
      wholesale_price_eur: 145.0,
      retail_price_eur: 380.0,
    });

    // Create PLM Production Variant
    onAddVariant({
      variant_code: newVariantCode.trim().toUpperCase(),
      colorway_name: newColorway.trim(),
      size_range: newSizeRange.trim(),
      last_or_pattern_code: newLastCode.trim().toUpperCase(),
      target_gender: newTargetGender,
      lifecycle_status: "prototype",
      custom_attributes: {
        cloned_bom_source: cloneBomFromId || null,
      },
    });

    // Reset Form
    setNewModelName("");
    setNewVariantCode("");
    setShowCreateModal(false);
  };

  const handleOpenQuickEdit = (item: PlmProductionVariant & { parentPim: PimCommercialItem }) => {
    setEditingVariant(item);
    setEditModelName(item.parentPim.model_name);
    setEditSkuCode(item.parentPim.sku_code);
    setEditCategory(item.parentPim.category);
    setEditTargetGender(item.target_gender || item.parentPim.target_gender || "unisex");
    setEditSeasonId(item.parentPim.season_id || seasons[0]?.season_id || "");
    setEditVariantCode(item.variant_code);
    setEditColorway(item.colorway_name);
    setEditLastCode(item.last_or_pattern_code || "");
    setEditSizeRange(item.size_range);
    setEditSampleBaseSize(item.sample_base_size || (item.parentPim.category === "apparel" ? "IT 50" : "42"));
    setEditGradingStepPct(item.size_grading_step_pct || (item.parentPim.category === "apparel" ? 3.4 : 2.8));
    setEditLifecycleStatus(item.lifecycle_status);
    setShowQuickEditModal(true);
  };

  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    if (onUpdateProductVariant) {
      onUpdateProductVariant(editingVariant.parentPim.pim_item_id, editingVariant.plm_variant_id, {
        model_name: editModelName.trim(),
        sku_code: editSkuCode.trim().toUpperCase(),
        category: editCategory,
        target_gender: editTargetGender,
        season_id: editSeasonId,
        variant_code: editVariantCode.trim().toUpperCase(),
        colorway_name: editColorway.trim(),
        last_or_pattern_code: editLastCode.trim().toUpperCase(),
        size_range: editSizeRange.trim(),
        sample_base_size: editSampleBaseSize.trim(),
        size_grading_step_pct: Number(editGradingStepPct) || 2.8,
        lifecycle_status: editLifecycleStatus,
      });
    } else {
      onUpdateVariantLifecycle(editingVariant.plm_variant_id, editLifecycleStatus);
    }
    setShowQuickEditModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner: Area Prodotti PLM (FTL-CEO-009) */}
      <div className="bg-[#111111] text-white rounded-3xl p-8 shadow-2xl border border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                02 · PLM & INGEGNERIA DI PRODUZIONE (FTL-CEO-009)
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Modelleria Fabbrica · Distinta Base a 3 Livelli · Costing L6 Riservato
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
              Area Prodotti PLM & Gestione Distinte Base (BOM)
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Area tecnica dedicata alla creazione rapida dei modelli industriali, cartamodelli e forme,
              costificazione accurata con sfrido percentuale e congelamento degli snapshot di produzione.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-full border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span>📊 Esporta Excel / CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#111111] font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <span>+ Nuovo Prodotto PLM</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-neutral-800 text-xs">
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Varianti Tecniche PLM</span>
            <div className="text-xl font-extrabold text-white mt-1">{allVariantsWithParent.length}</div>
            <span className="text-[10px] text-emerald-400">Attive in fabbrica</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Ingegnerizzate con BOM</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {allVariantsWithParent.filter((v) => v.bom_items.length > 0).length}
            </div>
            <span className="text-[10px] text-neutral-400">Con distinta a 3 livelli</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">In Produzione</span>
            <div className="text-xl font-extrabold text-white mt-1">
              {allVariantsWithParent.filter((v) => v.lifecycle_status === "in_production").length}
            </div>
            <span className="text-[10px] text-neutral-400">Lotti autorizzati</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Policy Costi Industriali</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {viewerRole === "brand" ? "Livello L6 Attivo" : "Costi Mascherati 0 €"}
            </div>
            <span className="text-[10px] text-neutral-400">Segregazione automatica</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Filters & Advanced Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Cerca codice, modello, colore, forma..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold w-72 focus:outline-none focus:border-[#111111]"
            />

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

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold text-[#111111]"
            >
              <option value="ALL">Tutti i Generi</option>
              <option value="donna">♀ Donna</option>
              <option value="uomo">♂ Uomo</option>
              <option value="unisex">⚥ Unisex</option>
              <option value="bambino">🧒 Bambino</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold text-[#111111]"
            >
              <option value="ALL">Tutti gli Stati</option>
              <option value="new_from_pim">🏷️ Nuovo da PIM</option>
              <option value="prototype">Prototipo</option>
              <option value="sample">Campione</option>
              <option value="industrialized">Industrializzato</option>
              <option value="in_production">In Produzione</option>
              <option value="archived">Archiviato</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs font-bold text-[#707072] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="rounded text-[#111111]"
              />
              Solo Attivi
            </label>
          </div>

          <span className="text-xs text-[#707072] font-semibold">
            Visualizzati: <strong className="text-[#111111]">{filteredVariants.length}</strong> modelli PLM
          </span>
        </div>

        {/* Advanced Data Table */}
        <div className="overflow-x-auto border border-[#E5E5E5] rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F5] border-b border-[#E5E5E5] text-[#707072] uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Codice Variante PLM</th>
                <th className="py-3 px-4">Modello Industriale</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Genere Target</th>
                <th className="py-3 px-4">Forma / Patron</th>
                <th className="py-3 px-4">Scala Taglie</th>
                <th className="py-3 px-4">Stato Ciclo Vita</th>
                <th className="py-3 px-4 text-center">BOM (L1/L2/L3)</th>
                <th className="py-3 px-4 text-right">Costo Industriale L6</th>
                <th className="py-3 px-4 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredVariants.map((item) => {
                const isSelected = item.plm_variant_id === selectedVariantId;
                const matCost = item.bom_items.reduce(
                  (sum, b) => sum + (b.unit_consumption * (1 + b.waste_percentage / 100)) * (b.unit_cost_eur || 0),
                  0
                );
                const totalCost = matCost + (item.standard_labor_cost_eur || 28.0);
                const gender = (item.target_gender || item.parentPim.target_gender || "unisex").toLowerCase();

                return (
                  <tr
                    key={item.plm_variant_id}
                    onClick={() => handleRowClick(item.parentPim.pim_item_id, item.plm_variant_id)}
                    className={`cursor-pointer transition hover:bg-[#F9F9F9] ${
                      isSelected ? "bg-[#F5F5F5] font-semibold" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#111111] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {item.variant_code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#111111]">{item.parentPim.model_name}</div>
                      <div className="text-[11px] text-[#707072]">{item.colorway_name}</div>
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {item.parentPim.category === "footwear" ? "👟 Calzatura" : item.parentPim.category}
                    </td>
                    <td className="py-3 px-4">
                      {gender === "donna" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 border border-pink-200">
                          ♀ Donna
                        </span>
                      )}
                      {gender === "uomo" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
                          ♂ Uomo
                        </span>
                      )}
                      {gender === "bambino" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          🧒 Bambino
                        </span>
                      )}
                      {gender !== "donna" && gender !== "uomo" && gender !== "bambino" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                          ⚥ Unisex
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      {item.last_or_pattern_code || "FORMA-STD"}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">{item.size_range}</td>
                    <td className="py-3 px-4">
                      <select
                        value={item.lifecycle_status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          onUpdateVariantLifecycle(
                            item.plm_variant_id,
                            e.target.value as PlmLifecycleStatus
                          )
                        }
                        className="bg-white border border-[#D5D5D5] rounded-full px-2.5 py-1 text-[11px] font-bold text-[#111111]"
                      >
                        <option value="new_from_pim">🏷️ Nuovo da PIM</option>
                        <option value="prototype">Prototipo</option>
                        <option value="sample">Campione</option>
                        <option value="industrialized">Industrializzato</option>
                        <option value="in_production">In Produzione</option>
                        <option value="archived">Archiviato</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.bom_items.length > 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.bom_items.length} Componenti
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {viewerRole === "brand" ? (
                        <span>€ {totalCost.toFixed(2)}</span>
                      ) : (
                        <span className="text-[#707072] text-[10px]">🔒 [L6 MASKED]</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenQuickEdit(item);
                        }}
                        className="px-3 py-1 rounded-full border border-[#D5D5D5] bg-white hover:bg-[#F5F5F5] font-bold text-[10px] text-[#111111] hover:border-black transition"
                      >
                        Quick Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integrated BOM Tree for Selected Variant */}
      {currentVariant && (
        <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-3xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">
                DISTINTA BASE INTEGRATA A 3 LIVELLI
              </span>
              <h3 className="text-xl font-extrabold text-[#111111]">
                Struttura BOM: {currentVariant.variant_code} ({currentPim?.model_name})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-[#E5E5E5] text-[#111111]">
                Scala: {currentVariant.size_range}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-[#E5E5E5] text-emerald-600">
                Grading Step: +{currentVariant.size_grading_step_pct}%
              </span>
            </div>
          </div>

          <BomThreeLevelTree
            variant={currentVariant}
            pimItem={currentPim}
            viewerRole={viewerRole}
            onAddBomItem={onAddBomItem || (() => {})}
          />
        </div>
      )}

      {/* Modal: Nuovo Prodotto PLM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">+ Nuovo Prodotto PLM (Inserimento Rapido)</h3>
                <p className="text-xs text-[#707072]">Crea la variante tecnica di fabbrica e la scheda PIM speculare 1:1.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
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

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Nome Modello Industriale *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Mocassino Tradizione Marche - Linea Duca"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Codice Variante PLM *</label>
                  <input
                    type="text"
                    required
                    placeholder="PLM-DUCA-ROSSO"
                    value={newVariantCode}
                    onChange={(e) => setNewVariantCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Colore / Variante *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bordeaux Spazzolato"
                    value={newColorway}
                    onChange={(e) => setNewColorway(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Forma / Cartamodello *</label>
                  <input
                    type="text"
                    required
                    placeholder="FORMA-FM-108"
                    value={newLastCode}
                    onChange={(e) => setNewLastCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Scala Taglie Certificata *</label>
                  {registries.filter((r) => r.registry_name === "size_scales" && r.is_active).length > 0 ? (
                    <select
                      value={newSizeRange}
                      onChange={(e) => setNewSizeRange(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono font-semibold"
                    >
                      {registries
                        .filter((r) => r.registry_name === "size_scales" && r.is_active)
                        .map((reg) => (
                          <option key={reg.entry_code} value={reg.label_it}>
                            {reg.label_it} ({reg.entry_code})
                          </option>
                        ))}
                      <option value="Donna EU 35-42">Donna EU 35-42 (Default)</option>
                      <option value="Uomo EU 38-46">Uomo EU 38-46</option>
                      <option value="Abbigliamento IT 44-56">Abbigliamento IT 44-56</option>
                      <option value="Pelletteria TU">Pelletteria Taglia Unica (TU)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Donna EU 35-42"
                      value={newSizeRange}
                      onChange={(e) => setNewSizeRange(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                  Clona Distinta Base da Modello Esistente (Opzionale)
                </label>
                <select
                  value={cloneBomFromId}
                  onChange={(e) => setCloneBomFromId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                >
                  <option value="">-- Nessuna (Inizia con distinta vuota) --</option>
                  {allVariantsWithParent.map((v) => (
                    <option key={v.plm_variant_id} value={v.plm_variant_id}>
                      {v.variant_code} ({v.parentPim.model_name}) · {v.bom_items.length} componenti
                    </option>
                  ))}
                </select>
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
                  Salva e Ingegnerizza BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Edit Completo Tutti gli Attributi (FTL-TECH-008) */}
      {showQuickEditModal && editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                  FTL-TECH-008 · Quick Edit Completo
                </span>
                <h3 className="text-lg font-bold text-[#111111] mt-1">
                  Modifica Prodotto PLM &amp; Anagrafica PIM
                </h3>
                <p className="text-xs text-[#707072] font-mono">
                  {editingVariant.variant_code} · {editingVariant.parentPim.model_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickEditModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-4 text-xs">
              {/* Sezione 1: Attributi Modello Commerciale PIM */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-600">
                  📦 Dati Principali Modello (PIM)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Nome Modello Industriale *
                    </label>
                    <input
                      type="text"
                      required
                      value={editModelName}
                      onChange={(e) => setEditModelName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      SKU Commerciale *
                    </label>
                    <input
                      type="text"
                      required
                      value={editSkuCode}
                      onChange={(e) => setEditSkuCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Categoria *
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    >
                      <option value="footwear">👟 Calzature</option>
                      <option value="leather_goods">👜 Pelletteria</option>
                      <option value="apparel">🧥 Abbigliamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Genere Target *
                    </label>
                    <select
                      value={editTargetGender}
                      onChange={(e) => setEditTargetGender(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    >
                      <option value="donna">♀ Donna</option>
                      <option value="uomo">♂ Uomo</option>
                      <option value="unisex">⚥ Unisex</option>
                      <option value="bambino">🧒 Bambino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Stagione *
                    </label>
                    <select
                      value={editSeasonId}
                      onChange={(e) => setEditSeasonId(e.target.value)}
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
              </div>

              {/* Sezione 2: Attributi Variante Tecnica PLM */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-600">
                  ⚙️ Specifiche Variante Fabbrica (PLM)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Codice Variante PLM *
                    </label>
                    <input
                      type="text"
                      required
                      value={editVariantCode}
                      onChange={(e) => setEditVariantCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Colore / Variante *
                    </label>
                    <input
                      type="text"
                      required
                      value={editColorway}
                      onChange={(e) => setEditColorway(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Forma / Cartamodello *
                    </label>
                    <input
                      type="text"
                      required
                      value={editLastCode}
                      onChange={(e) => setEditLastCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Scala Taglie Certificata *
                    </label>
                    {registries.filter((r) => r.registry_name === "size_scales" && r.is_active).length > 0 ? (
                      <select
                        value={editSizeRange}
                        onChange={(e) => setEditSizeRange(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono font-semibold"
                      >
                        {registries
                          .filter((r) => r.registry_name === "size_scales" && r.is_active)
                          .map((reg) => (
                            <option key={reg.entry_code} value={reg.label_it}>
                              {reg.label_it} ({reg.entry_code})
                            </option>
                          ))}
                        <option value="Donna EU 35-42">Donna EU 35-42</option>
                        <option value="Uomo EU 38-46">Uomo EU 38-46</option>
                        <option value="Abbigliamento IT 44-56">Abbigliamento IT 44-56</option>
                        <option value="Pelletteria TU">Pelletteria TU</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={editSizeRange}
                        onChange={(e) => setEditSizeRange(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Taglia Base Campione
                    </label>
                    <input
                      type="text"
                      value={editSampleBaseSize}
                      onChange={(e) => setEditSampleBaseSize(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                      placeholder="es. 37 o 42"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Passo Sviluppo %
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={editGradingStepPct}
                      onChange={(e) => setEditGradingStepPct(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Stato Ciclo di Vita *
                  </label>
                  <select
                    value={editLifecycleStatus}
                    onChange={(e) => setEditLifecycleStatus(e.target.value as PlmLifecycleStatus)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-bold text-[#111111]"
                  >
                    <option value="new_from_pim">🏷️ Nuovo da PIM</option>
                    <option value="prototype">Prototipo</option>
                    <option value="sample">Campione</option>
                    <option value="industrialized">Industrializzato</option>
                    <option value="in_production">In Produzione</option>
                    <option value="archived">Archiviato</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowQuickEditModal(false)}
                  className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800 transition shadow-lg"
                >
                  ✓ Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
