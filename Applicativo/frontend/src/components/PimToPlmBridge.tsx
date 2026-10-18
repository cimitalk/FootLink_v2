import React, { useState } from "react";
import {
  PimCommercialItem,
  PlmLifecycleStatus,
  PlmProductionVariant,
} from "../types";

interface PimToPlmBridgeProps {
  pimItems: PimCommercialItem[];
  selectedPim: PimCommercialItem;
  selectedVariant: PlmProductionVariant;
  onSelectPim: (item: PimCommercialItem) => void;
  onSelectVariant: (variant: PlmProductionVariant) => void;
  onAddVariant: (newVariant: {
    variant_code: string;
    colorway_name: string;
    size_range: string;
    last_or_pattern_code: string;
    lifecycle_status: PlmLifecycleStatus;
  }) => void;
}

export const PimToPlmBridge: React.FC<PimToPlmBridgeProps> = ({
  pimItems,
  selectedPim,
  selectedVariant,
  onSelectPim,
  onSelectVariant,
  onAddVariant,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [variantCode, setVariantCode] = useState("");
  const [colorwayName, setColorwayName] = useState("");
  const [sizeRange, setSizeRange] = useState("38-46");
  const [lastCode, setLastCode] = useState("FORMA-FM-108");
  const [status, setStatus] = useState<PlmLifecycleStatus>("prototype");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantCode.trim() || !colorwayName.trim()) return;
    onAddVariant({
      variant_code: variantCode.trim(),
      colorway_name: colorwayName.trim(),
      size_range: sizeRange.trim(),
      last_or_pattern_code: lastCode.trim(),
      lifecycle_status: status,
    });
    setVariantCode("");
    setColorwayName("");
    setShowAddModal(false);
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2.5 py-1 rounded-full">
            Core Domain Engine · ADR-002
          </span>
          <h2 className="text-xl font-bold text-white mt-2">
            Ponte Architetturale: 1 Articolo Commerciale PIM ↔ N Varianti Tecniche PLM
          </h2>
          <p className="text-sm text-slate-400">
            Un unico SKU omnicanale aggrega automaticamente N varianti produttive di fabbrica, ciascuna con propria Forma/Cartamodello, Distinta Base a 3 livelli e Terzisti.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(!showAddModal)}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20"
        >
          + Aggiungi Variante PLM (Lato N)
        </button>
      </div>

      {/* PIM Item Selector Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {pimItems.map((item) => {
          const isSelected = item.pim_item_id === selectedPim.pim_item_id;
          return (
            <button
              key={item.pim_item_id}
              onClick={() => onSelectPim(item)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                isSelected
                  ? "bg-sky-950/70 border-sky-500 text-white shadow-md"
                  : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <span className="text-2xl">
                {item.category === "footwear" ? "👞" : "👜"}
              </span>
              <div>
                <div className="text-xs font-mono text-sky-400">{item.sku_code}</div>
                <div className="font-bold text-sm">{item.model_name}</div>
                <div className="text-xs text-slate-400">
                  1 PIM ↔ {item.plm_variants.length} Varianti PLM
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add PLM Variant Inline Form */}
      {showAddModal && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-950 border border-sky-800/80 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-xs text-slate-400 mb-1">Codice Variante Tecnica</label>
            <input
              type="text"
              required
              placeholder="es. FTL-LOAFER-01-BLU"
              value={variantCode}
              onChange={(e) => setVariantCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Variante Colore / Materiale</label>
            <input
              type="text"
              required
              placeholder="es. Blu Navy Scamosciato"
              value={colorwayName}
              onChange={(e) => setColorwayName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Forma / Cartamodello</label>
            <input
              type="text"
              required
              value={lastCode}
              onChange={(e) => setLastCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Stato Ciclo Vita PLM</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PlmLifecycleStatus)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="prototype">Prototype</option>
              <option value="sample">Sample (Campionario)</option>
              <option value="industrialized">Industrialized</option>
              <option value="in_production">In Production</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm py-2 px-3 rounded-lg"
            >
              Salva Variante
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="bg-slate-800 text-slate-300 text-sm py-2 px-3 rounded-lg"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* 1 PIM <-> N PLM Visual Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: 1 PIM Commercial Master Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-sky-500/70 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
              LATO 1 · Articolo Commerciale PIM
            </span>
            <span className="text-xs font-mono text-slate-400">{selectedPim.season}</span>
          </div>
          <h3 className="text-lg font-extrabold text-white">{selectedPim.model_name}</h3>
          <div className="text-xs font-mono text-sky-400 mb-3">
            SKU Master: {selectedPim.sku_code} · ID: {selectedPim.pim_item_id}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {selectedPim.commercial_description_it}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedPim.retail_channels.map((ch) => (
              <span
                key={ch}
                className="text-[11px] bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full"
              >
                🛍️ {ch}
              </span>
            ))}
          </div>
        </div>

        {/* Center Connector */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center text-center">
          <div className="bg-sky-500/20 border border-sky-500/50 text-sky-300 text-xs font-extrabold px-3 py-1.5 rounded-full">
            1 ↔ {selectedPim.plm_variants.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ponte Nativo</div>
        </div>

        {/* Right: N PLM Production Variants */}
        <div className="lg:col-span-6 space-y-3">
          {selectedPim.plm_variants.map((variant) => {
            const active = variant.plm_variant_id === selectedVariant.plm_variant_id;
            return (
              <div
                key={variant.plm_variant_id}
                onClick={() => onSelectVariant(variant)}
                className={`cursor-pointer rounded-xl p-4 border transition ${
                  active
                    ? "bg-emerald-950/40 border-emerald-500 shadow-lg"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      LATO N · {variant.variant_code}
                    </span>
                    <h4 className="font-bold text-white text-sm">{variant.colorway_name}</h4>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-medium">
                    {variant.lifecycle_status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                  <span>📐 Forma/Modello: <strong className="text-slate-200">{variant.last_or_pattern_code}</strong></span>
                  <span>📏 Taglie: <strong className="text-slate-200">{variant.size_range}</strong></span>
                  <span>🧩 Nodi BOM: <strong className="text-emerald-400">{variant.bom_items.length}</strong></span>
                  <span>🏭 Fasi Terzisti: <strong className="text-amber-400">{variant.subcontractor_assignments.length}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
