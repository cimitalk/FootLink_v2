import React, { useState } from "react";
import {
  ProductionOrder,
  ProductionOrderStatus,
  OrderSizeBreakdownItem,
  ProductionOrderPhaseItem,
  PimCommercialItem,
  PlmProductionVariant,
  TanneryBatch,
  Company,
  BomRequirementsCalculationResult,
} from "../types";

interface ProductionOrdersManagerProps {
  orders: ProductionOrder[];
  pimItems: PimCommercialItem[];
  tanneryBatches: TanneryBatch[];
  companies: Company[];
  onCreateOrder: (order: {
    order_code: string;
    company_id: string;
    plm_variant_id: string;
    pim_item_id: string;
    season_id?: string;
    collection_id?: string;
    tannery_batch_id?: string;
    status: ProductionOrderStatus;
    target_delivery_date: string;
    notes: string;
    size_breakdown: OrderSizeBreakdownItem[];
  }) => void;
  onCalculateRequirements: (
    variantId: string,
    sizeBreakdown: OrderSizeBreakdownItem[]
  ) => Promise<BomRequirementsCalculationResult | null>;
  onConfirmPhase: (
    magicToken: string,
    data: {
      conform_quantity: number;
      scrapped_quantity: number;
      waste_reason_code?: string;
      operator_notes?: string;
    }
  ) => Promise<boolean>;
}

const SIZE_PRESETS: Record<"shoes_men" | "shoes_women" | "apparel", OrderSizeBreakdownItem[]> = {
  shoes_men: [
    { size_code: "39", planned_quantity: 40, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "40", planned_quantity: 80, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "41", planned_quantity: 120, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "42", planned_quantity: 140, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "43", planned_quantity: 80, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "44", planned_quantity: 40, completed_quantity: 0, scrapped_quantity: 0 },
  ],
  shoes_women: [
    { size_code: "35", planned_quantity: 20, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "36", planned_quantity: 50, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "37", planned_quantity: 90, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "38", planned_quantity: 110, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "39", planned_quantity: 80, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "40", planned_quantity: 40, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "41", planned_quantity: 10, completed_quantity: 0, scrapped_quantity: 0 },
  ],
  apparel: [
    { size_code: "IT 46", planned_quantity: 30, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "IT 48", planned_quantity: 60, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "IT 50", planned_quantity: 90, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "IT 52", planned_quantity: 70, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "IT 54", planned_quantity: 40, completed_quantity: 0, scrapped_quantity: 0 },
    { size_code: "IT 56", planned_quantity: 10, completed_quantity: 0, scrapped_quantity: 0 },
  ],
};

export const ProductionOrdersManager: React.FC<ProductionOrdersManagerProps> = ({
  orders,
  pimItems,
  tanneryBatches,
  companies,
  onCreateOrder,
  onCalculateRequirements,
  onConfirmPhase,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.order_id || "");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmPhaseModal, setShowConfirmPhaseModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<ProductionOrderPhaseItem | null>(null);

  // BOM Calculation State
  const [calcResult, setCalcResult] = useState<BomRequirementsCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // New Order Form State
  const [orderCode, setOrderCode] = useState(`COMM-2026-PE-${Math.floor(100 + Math.random() * 900)}`);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.company_id || "comp-pmi-rossi");
  const [selectedPimId, setSelectedPimId] = useState(pimItems[0]?.pim_item_id || "");
  const [selectedVariantId, setSelectedVariantId] = useState(
    pimItems[0]?.plm_variants[0]?.plm_variant_id || ""
  );
  const [selectedBatchId, setSelectedBatchId] = useState(tanneryBatches[0]?.batch_id || "");
  const [deliveryDate, setDeliveryDate] = useState("2026-06-30");
  const [notes, setNotes] = useState("");
  const [activePreset, setActivePreset] = useState<"shoes_men" | "shoes_women" | "apparel">("shoes_men");
  const [sizeGrid, setSizeGrid] = useState<OrderSizeBreakdownItem[]>(SIZE_PRESETS.shoes_men);

  // Phase Confirmation Form State
  const [conformQty, setConformQty] = useState(0);
  const [scrappedQty, setScrappedQty] = useState(0);
  const [wasteReason, setWasteReason] = useState("difetto_taglio_grana_pelle");
  const [operatorNotes, setOperatorNotes] = useState("");

  const currentOrder = orders.find((o) => o.order_id === selectedOrderId) || orders[0];

  const filteredOrders =
    statusFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const totalGridPairs = sizeGrid.reduce((sum, item) => sum + (Number(item.planned_quantity) || 0), 0);

  const handlePimChange = (pimId: string) => {
    setSelectedPimId(pimId);
    const item = pimItems.find((p) => p.pim_item_id === pimId);
    if (item && item.plm_variants.length > 0) {
      setSelectedVariantId(item.plm_variants[0].plm_variant_id);
    }
  };

  const handlePresetChange = (preset: "shoes_men" | "shoes_women" | "apparel") => {
    setActivePreset(preset);
    setSizeGrid(SIZE_PRESETS[preset]);
  };

  const handleSizeQuantityChange = (sizeCode: string, qty: number) => {
    setSizeGrid((prev) =>
      prev.map((s) => (s.size_code === sizeCode ? { ...s, planned_quantity: Math.max(0, qty) } : s))
    );
  };

  const handleCalculateClick = async () => {
    if (!selectedVariantId) return;
    setIsCalculating(true);
    try {
      const res = await onCalculateRequirements(selectedVariantId, sizeGrid);
      if (res) {
        setCalcResult(res);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim() || totalGridPairs === 0) return;

    const targetPim = pimItems.find((p) => p.pim_item_id === selectedPimId);

    onCreateOrder({
      order_code: orderCode.trim().toUpperCase(),
      company_id: selectedCompanyId,
      plm_variant_id: selectedVariantId,
      pim_item_id: selectedPimId,
      season_id: targetPim?.season_id || "SEASON-PE26",
      collection_id: targetPim?.collection_id || undefined,
      tannery_batch_id: selectedBatchId || undefined,
      status: "in_production",
      target_delivery_date: deliveryDate,
      notes: notes.trim(),
      size_breakdown: sizeGrid.filter((s) => s.planned_quantity > 0),
    });

    setShowCreateModal(false);
  };

  const handleOpenPhaseModal = (phase: ProductionOrderPhaseItem) => {
    setSelectedPhase(phase);
    setConformQty(phase.target_quantity);
    setScrappedQty(phase.scrapped_quantity || 0);
    setWasteReason("difetto_taglio_grana_pelle");
    setOperatorNotes("");
    setShowConfirmPhaseModal(true);
  };

  const handleConfirmPhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhase) return;

    const ok = await onConfirmPhase(selectedPhase.magic_token, {
      conform_quantity: Number(conformQty) || 0,
      scrapped_quantity: Number(scrappedQty) || 0,
      waste_reason_code: wasteReason,
      operator_notes: operatorNotes.trim(),
    });

    if (ok) {
      setShowConfirmPhaseModal(false);
      setSelectedPhase(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner: Production Work Orders & Size Matrix */}
      <div className="bg-[#111111] text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-neutral-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                MODULO 02 · WORK ORDERS HUB & SIZE MATRIX (ADR-008)
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Curva Taglie · Moltiplicatore Sfrido BOM · Avanzamento Fasi Terzisti
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
              Commesse di Produzione & Matrice Fabbisogni Taglie
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Generazione commessa collegata alla scheda PLM e al lotto conceria. Griglia taglie dinamica con calcolo automatico{" "}
              dei consumi industriali comprensivi di <strong className="text-amber-300">sfrido pelle (+18%)</strong>,{" "}
              <strong className="text-blue-300">sviluppo taglie (+2.8%/punto)</strong> e avanzamento fasi a 0 € con link mobile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(true);
                handleCalculateClick();
              }}
              className="px-5 py-3 rounded-full bg-blue-500 hover:bg-blue-400 text-[#111111] font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <span>+ Nuova Commessa con Matrice Taglie</span>
            </button>
          </div>
        </div>

        {/* Work Orders Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-neutral-800 text-xs">
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Commesse in Fabbrica</span>
            <div className="font-bold text-white text-lg mt-1">{orders.length} Ordini</div>
            <span className="text-[10px] text-neutral-400">Pianificate nel distretto</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Paia Totali Pianificate</span>
            <div className="font-bold text-blue-400 text-lg mt-1">
              {orders.reduce((sum, o) => sum + o.total_planned_pairs, 0).toLocaleString()} Paia
            </div>
            <span className="text-[10px] text-neutral-400">Ripartite su scala taglie</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Lotti Pelle Associati</span>
            <div className="font-bold text-amber-300 text-lg mt-1">
              {orders.filter((o) => o.tannery_batch_id).length} Tracciati LWG
            </div>
            <span className="text-[10px] text-neutral-400">Concia certificata e hash SHA-256</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Avanzamento Terzisti 0 €</span>
            <div className="font-bold text-emerald-400 text-lg mt-1">
              {orders.reduce(
                (sum, o) => sum + (o.phases?.filter((p) => p.status === "completed").length || 0),
                0
              )}{" "}
              Fasi Validate
            </div>
            <span className="text-[10px] text-neutral-400">Senza carta né formazione operatore</span>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Orders List & Detailed Work Order Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Orders List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111111]">Commesse di Filiera</h2>
              <span className="text-xs text-[#707072] font-mono">{filteredOrders.length} ordini</span>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-1.5 mb-4 p-1 bg-[#F5F5F5] rounded-2xl">
              {[
                { key: "ALL", label: "Tutte" },
                { key: "in_production", label: "In Produzione" },
                { key: "draft", label: "Bozze" },
                { key: "completed", label: "Completate" },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === st.key
                      ? "bg-white text-[#111111] shadow-sm font-bold"
                      : "text-[#707072] hover:text-[#111111]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Order Cards */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredOrders.map((o) => {
                const isSelected = o.order_id === currentOrder?.order_id;
                return (
                  <div
                    key={o.order_id}
                    onClick={() => setSelectedOrderId(o.order_id)}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-[#F8FBFF] border-blue-600 shadow-md ring-1 ring-blue-600"
                        : "bg-white border-[#E5E5E5] hover:border-neutral-300 hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                        {o.order_code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          o.status === "in_production"
                            ? "bg-blue-100 text-blue-900"
                            : o.status === "completed"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-neutral-100 text-neutral-800"
                        }`}
                      >
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-[#111111] mt-2">
                      {o.model_name || "Mocassino Artigianale"} ({o.variant_code || "PLM-VAR"})
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#707072] mt-3 pt-2 border-t border-[#EAEAEA]">
                      <span>Totale: <strong className="text-neutral-900">{o.total_planned_pairs} paia</strong></span>
                      <span className="font-mono">Consegna: {o.target_delivery_date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Detail, Size Matrix Breakdown & Phase Tracker */}
        <div className="lg:col-span-8 space-y-6">
          {currentOrder ? (
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-7 shadow-sm space-y-6">
              {/* Order Identity Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#EAEAEA]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                      COMMESSA: {currentOrder.order_code}
                    </span>
                    <span className="text-xs text-[#707072] font-mono">
                      Stagione: {currentOrder.season_id || "P/E 2026"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-[#111111]">
                    {currentOrder.model_name || "Mocassino Classico Blake"}
                  </h2>
                  <p className="text-xs text-[#707072] line-clamp-1">{currentOrder.notes || "Lancio di produzione calzatura"}</p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">Volume Totale</div>
                  <div className="text-2xl font-black text-[#111111]">{currentOrder.total_planned_pairs} Paia</div>
                  <div className="text-[11px] text-emerald-600 font-bold">
                    {currentOrder.total_completed_pairs} conformi · {currentOrder.total_scrapped_pairs} scarti
                  </div>
                </div>
              </div>

              {/* Dynamic Size Matrix Grid (Curva Taglie) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
                    Ripartizione Curva Taglie & Paia Pianificate
                  </h3>
                  <span className="text-xs text-[#707072] font-mono">
                    {currentOrder.size_breakdown.length} taglie configurate
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {currentOrder.size_breakdown.map((item) => (
                    <div
                      key={item.size_code}
                      className="bg-[#F5F5F5] rounded-2xl p-3 text-center border border-[#EAEAEA]"
                    >
                      <div className="text-[11px] font-bold text-[#707072] uppercase">Taglia</div>
                      <div className="text-lg font-black text-[#111111]">{item.size_code}</div>
                      <div className="text-xs font-bold text-blue-700 bg-blue-50 rounded-lg py-1 mt-1 border border-blue-200">
                        {item.planned_quantity} pz
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traceable Tannery Batch Connected */}
              {currentOrder.tannery_batch_id && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏷️</span>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Lotto Pelle Conceria Associato (FTL-CEO-006)
                      </div>
                      <div className="text-sm font-bold text-neutral-900">
                        {currentOrder.tannery_batch_code || currentOrder.tannery_batch_id}
                      </div>
                      <div className="text-[11px] text-neutral-600">
                        Tracciabilità filiera EUDR, rating LWG Gold e test chimici REACH
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900">
                    LWG Gold Verified
                  </span>
                </div>
              )}

              {/* Subcontractor Phases Tracker (Lifecycle Terzisti a 0 €) */}
              <div className="space-y-4 pt-4 border-t border-[#EAEAEA]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">
                      Avanzamento Fasi di Filiera ({currentOrder.phases?.length || 0} Fasi)
                    </h3>
                    <p className="text-xs text-[#707072]">
                      Monitoraggio in tempo reale: i terzisti confermano con magic link mobile 3-clic a canone 0,00 €.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentOrder.phases?.map((p) => {
                    const isCompleted = p.status === "completed";
                    return (
                      <div
                        key={p.phase_id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isCompleted
                            ? "bg-emerald-50/40 border-emerald-300"
                            : "bg-white border-[#EAEAEA]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              isCompleted
                                ? "bg-emerald-500 text-white"
                                : "bg-neutral-200 text-neutral-700"
                            }`}
                          >
                            {p.phase_sequence}
                          </span>
                          <div>
                            <div className="font-bold text-sm text-[#111111] flex items-center gap-2">
                              <span className="uppercase">{p.phase_code.replace(/_/g, " ")}</span>
                              <span className="text-xs text-[#707072] font-normal">
                                · {p.subcontractor_name} ({p.district})
                              </span>
                            </div>
                            <div className="text-[11px] text-[#707072] font-mono mt-0.5">
                              Obiettivo: {p.target_quantity} paia ·{" "}
                              {isCompleted ? (
                                <strong className="text-emerald-700">
                                  Conformi: {p.conform_quantity} · Scarti: {p.scrapped_quantity}
                                </strong>
                              ) : (
                                "In attesa di lavorazione"
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <span>✓</span> Completata
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPhaseModal(p)}
                              className="px-4 py-2 rounded-full bg-[#111111] hover:bg-neutral-800 text-white text-xs font-bold transition-all"
                            >
                              Valida Avanzamento (3 Clic)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-400 bg-white rounded-3xl border border-[#E5E5E5]">
              Seleziona una commessa di produzione dalla colonna di sinistra.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Work Order with Dynamic Size Grid & BOM Wastage */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">Lancio Commessa di Produzione</h3>
                <p className="text-xs text-[#707072]">
                  Configurazione curva taglie con calcolo automatico fabbisogni BOM e sfrido.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Codice Commessa *</label>
                  <input
                    type="text"
                    required
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Azienda Lancio (PMI/Brand) *</label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    {companies.map((c) => (
                      <option key={c.company_id} value={c.company_id}>
                        {c.business_name} ({c.company_tier})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Data Consegna Obiettivo *</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Articolo PIM & Variante PLM *</label>
                  <select
                    value={selectedPimId}
                    onChange={(e) => handlePimChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    {pimItems.map((p) => (
                      <option key={p.pim_item_id} value={p.pim_item_id}>
                        {p.model_name} ({p.sku_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Lotto Conceria Certificato (Pelle)</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    {tanneryBatches.map((b) => (
                      <option key={b.batch_id} value={b.batch_id}>
                        {b.batch_code} · {b.tannery_name} (LWG {b.lwg_rating})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Size Matrix Section */}
              <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#707072]">
                      Griglia Taglie & Ripartizione Paia
                    </span>
                    <h4 className="text-sm font-bold text-[#111111]">Curva di Fabbisogno per Taglia</h4>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-[#E5E5E5]">
                    {[
                      { key: "shoes_men", label: "Scarpe Uomo 39-44" },
                      { key: "shoes_women", label: "Scarpe Donna 35-41" },
                      { key: "apparel", label: "Abbigliamento 46-56" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => handlePresetChange(p.key as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          activePreset === p.key ? "bg-[#111111] text-white" : "text-[#707072] hover:text-[#111111]"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Inputs Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {sizeGrid.map((item) => (
                    <div key={item.size_code} className="bg-white p-2.5 rounded-xl border border-[#E5E5E5] text-center">
                      <span className="block text-[11px] font-bold text-[#707072]">Tg {item.size_code}</span>
                      <input
                        type="number"
                        min={0}
                        value={item.planned_quantity}
                        onChange={(e) => handleSizeQuantityChange(item.size_code, Number(e.target.value))}
                        className="w-full text-center font-bold text-sm mt-1 p-1 rounded-lg border border-[#D5D5D5] bg-[#FDFDFD]"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5] text-xs">
                  <span className="text-[#707072]">
                    Totale Paia Commessa: <strong className="text-neutral-900 text-sm">{totalGridPairs} paia</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCalculateClick}
                    disabled={isCalculating}
                    className="px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 font-bold hover:bg-blue-200 transition-all border border-blue-200"
                  >
                    {isCalculating ? "Calcolo in corso..." : "⚡ Ricalcola Sfrido & Fabbisogni"}
                  </button>
                </div>
              </div>

              {/* Real-Time BOM Requirements with Wastage (Sfrido) Display */}
              {calcResult && (
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                      Fabbisogno Netto vs Lordo con Sfrido (+18% Pelle, +2% Suole)
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                      Pelle Totale: {calcResult.total_leather_sqft_gross} sqft
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[#EAEAEA]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F5F5F5] text-[#707072] text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2.5">Componente BOM</th>
                          <th className="p-2.5">Consumo Base</th>
                          <th className="p-2.5">Fattore Sfrido</th>
                          <th className="p-2.5">Fabbisogno Netto</th>
                          <th className="p-2.5 text-right font-black">Fabbisogno Lordo (+Sfrido)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {calcResult.requirements.map((r) => (
                          <tr key={r.bom_item_id} className="hover:bg-[#FAFAFA]">
                            <td className="p-2.5 font-bold text-[#111111]">{r.material_name}</td>
                            <td className="p-2.5 font-mono text-[#707072]">
                              {r.base_consumption} {r.unit_of_measure}
                            </td>
                            <td className="p-2.5">
                              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                +{r.waste_percentage}%
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-[#707072]">
                              {r.net_requirement} {r.unit_of_measure}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-blue-900">
                              {r.gross_requirement_with_waste} {r.unit_of_measure}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Note Commessa</label>
                <input
                  type="text"
                  placeholder="Es. Commessa lancio P/E 2026 calzatura classica Blake in vitello anilina LWG Gold"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
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
                  className="px-6 py-2.5 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800"
                >
                  Lancia Commessa ({totalGridPairs} paia)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Phase (Subcontractor 3-Click Mobile Simulation) */}
      {showConfirmPhaseModal && selectedPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Mobile 3 Clic Terzisti (0 €)
                </span>
                <h3 className="text-lg font-bold text-[#111111] mt-1">
                  Valida Fase: {selectedPhase.phase_code.replace(/_/g, " ").toUpperCase()}
                </h3>
                <p className="text-xs text-[#707072]">{selectedPhase.subcontractor_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPhaseModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPhaseSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Pezzi Conformi *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={conformQty}
                    onChange={(e) => setConformQty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-bold text-sm text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Pezzi Scartati</label>
                  <input
                    type="number"
                    min={0}
                    value={scrappedQty}
                    onChange={(e) => setScrappedQty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-bold text-sm text-red-600"
                  />
                </div>
              </div>

              {scrappedQty > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Causale Scarto *</label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="difetto_taglio_grana_pelle">Difetto grana / cicatrice pelle</option>
                    <option value="errore_orlatura_filo">Errore orlatura filo / cucitura</option>
                    <option value="scarto_montaggio_forma">Tensione errata montaggio su forma</option>
                    <option value="macchia_collante">Macchia collante / mastice tomaia</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Note Artigiano</label>
                <input
                  type="text"
                  placeholder="Es. Lavorazione eseguita a regola d'arte"
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowConfirmPhaseModal(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Conferma Fase a 0 € (3 Clic)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
