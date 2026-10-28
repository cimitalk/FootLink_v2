import React, { useState } from "react";
import {
  Collection,
  CollectionStatus,
  PimCommercialItem,
  Season,
  SeasonStatus,
} from "../types";

interface SeasonsCollectionsHubProps {
  seasons: Season[];
  pimItems: PimCommercialItem[];
  selectedSeasonId: string;
  selectedCollectionId?: string;
  onSelectSeason: (seasonId: string) => void;
  onSelectCollection?: (collectionId: string) => void;
  onCreateSeason: (season: {
    code: string;
    name: string;
    year: number;
    status: SeasonStatus;
    start_date?: string;
    end_date?: string;
    description?: string;
  }) => void;
  onCreateCollection: (
    seasonId: string,
    collection: {
      code: string;
      name: string;
      target_market: string;
      status: CollectionStatus;
      description?: string;
    }
  ) => void;
  onNavigateToProduct?: (pimItemId: string) => void;
  onAddProductsToCollection?: (collectionId: string, pimItemIds: string[]) => void;
  onRemoveProductFromCollection?: (pimItemId: string) => void;
}

export const SeasonsCollectionsHub: React.FC<SeasonsCollectionsHubProps> = ({
  seasons,
  pimItems,
  selectedSeasonId,
  selectedCollectionId,
  onSelectSeason,
  onSelectCollection,
  onCreateSeason,
  onCreateCollection,
  onNavigateToProduct,
  onAddProductsToCollection,
  onRemoveProductFromCollection,
}) => {
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [showNewColModal, setShowNewColModal] = useState(false);

  // Modal state for adding products to a collection (FTL-PROD-014)
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [targetCollection, setTargetCollection] = useState<Collection | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalCategory, setModalCategory] = useState<string>("ALL");
  const [modalGender, setModalGender] = useState<string>("ALL");
  const [modalSeasonScope, setModalSeasonScope] = useState<string>("CURRENT");
  const [modalOnlyUnassigned, setModalOnlyUnassigned] = useState(false);
  const [selectedPimIdsForAssignment, setSelectedPimIdsForAssignment] = useState<string[]>([]);

  // New Season form state
  const [newSeasonCode, setNewSeasonCode] = useState("");
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonYear, setNewSeasonYear] = useState(2026);
  const [newSeasonStatus, setNewSeasonStatus] = useState<SeasonStatus>("active");
  const [newSeasonDesc, setNewSeasonDesc] = useState("");

  // New Collection form state
  const [newColCode, setNewColCode] = useState("");
  const [newColName, setNewColName] = useState("");
  const [newColMarket, setNewColMarket] = useState("Global Luxury");
  const [newColStatus, setNewColStatus] = useState<CollectionStatus>("approved");
  const [newColDesc, setNewColDesc] = useState("");

  const activeSeason =
    seasons.find((s) => s.season_id === selectedSeasonId) || seasons[0];

  const handleCreateSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonCode.trim() || !newSeasonName.trim()) return;
    onCreateSeason({
      code: newSeasonCode.trim().toUpperCase(),
      name: newSeasonName.trim(),
      year: Number(newSeasonYear) || 2026,
      status: newSeasonStatus,
      description: newSeasonDesc.trim(),
    });
    setNewSeasonCode("");
    setNewSeasonName("");
    setNewSeasonDesc("");
    setShowNewSeasonModal(false);
  };

  const handleCreateCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColCode.trim() || !newColName.trim() || !activeSeason) return;
    onCreateCollection(activeSeason.season_id, {
      code: newColCode.trim().toUpperCase(),
      name: newColName.trim(),
      target_market: newColMarket.trim(),
      status: newColStatus,
      description: newColDesc.trim(),
    });
    setNewColCode("");
    setNewColName("");
    setNewColDesc("");
    setShowNewColModal(false);
  };

  const openAddProductsModal = (col: Collection) => {
    setTargetCollection(col);
    setModalSearch("");
    setModalCategory("ALL");
    setModalGender("ALL");
    setModalSeasonScope("CURRENT");
    setModalOnlyUnassigned(false);
    setSelectedPimIdsForAssignment([]);
    setShowAddProductsModal(true);
  };

  const handleToggleSelectPim = (pimId: string) => {
    setSelectedPimIdsForAssignment((prev) =>
      prev.includes(pimId) ? prev.filter((id) => id !== pimId) : [...prev, pimId]
    );
  };

  const handleConfirmAddProducts = () => {
    if (!targetCollection || selectedPimIdsForAssignment.length === 0) return;
    onAddProductsToCollection?.(targetCollection.collection_id, selectedPimIdsForAssignment);
    setShowAddProductsModal(false);
    setSelectedPimIdsForAssignment([]);
    setTargetCollection(null);
  };

  // Compute products associated with active season / collections
  const seasonProducts = pimItems.filter(
    (item) =>
      item.season_id === activeSeason?.season_id ||
      item.season.trim().toUpperCase() === activeSeason?.code.trim().toUpperCase()
  );

  const selectedCol = activeSeason?.collections.find(
    (c) => c.collection_id === selectedCollectionId
  );

  const displayedProducts = selectedCol
    ? seasonProducts.filter(
        (p) =>
          p.collection_id === selectedCol.collection_id ||
          p.collection_name?.trim().toLowerCase() === selectedCol.name.trim().toLowerCase()
      )
    : seasonProducts;

  // Filter products for the Add Products Modal (FTL-PROD-014)
  const filteredPimItemsForModal = pimItems.filter((p) => {
    // Season filter
    if (modalSeasonScope === "CURRENT") {
      const matchSeason =
        p.season_id === activeSeason?.season_id ||
        p.season.trim().toUpperCase() === activeSeason?.code.trim().toUpperCase();
      if (!matchSeason) return false;
    }
    // Category filter
    if (modalCategory !== "ALL" && p.category !== modalCategory) {
      return false;
    }
    // Gender filter
    if (modalGender !== "ALL" && p.target_gender?.toLowerCase() !== modalGender.toLowerCase()) {
      return false;
    }
    // Unassigned filter
    if (modalOnlyUnassigned && (p.collection_id || p.collection_name)) {
      return false;
    }
    // Search query
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      const matchSku = p.sku_code.toLowerCase().includes(q);
      const matchName = p.model_name.toLowerCase().includes(q);
      const matchDesc = p.commercial_description_it?.toLowerCase().includes(q);
      if (!matchSku && !matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="bg-[#111111] text-white p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9E9E9E]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            MODULO 01 · GESTIONE STAGIONI &amp; COLLEZIONI (FTL-TECH-027)
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Calendario Moda &amp; Campionari
          </h2>
          <p className="text-sm text-[#CCCCCC] mt-1 max-w-2xl">
            Struttura gerarchica a 2 livelli: 1 Stagione (es. <em>P/E 2026 - Primavera Estate 2026</em>)
            contiene diverse Collezioni (<em>Main Collection, Fashion Runway, Limited Edition / Capsule</em>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowNewSeasonModal(true)}
            className="px-4 py-2.5 rounded-full bg-white text-[#111111] text-xs font-extrabold uppercase tracking-wider hover:bg-[#F5F5F5] transition"
          >
            + Nuova Stagione
          </button>
        </div>
      </div>

      {/* Main Split Layout: Seasons Sidebar + Collections Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Seasons List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707072]">
              Stagioni Registrate ({seasons.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {seasons.map((s) => {
              const isSelected = s.season_id === activeSeason?.season_id;
              const productCount = pimItems.filter(
                (p) =>
                  p.season_id === s.season_id ||
                  p.season.trim().toUpperCase() === s.code.trim().toUpperCase()
              ).length;

              return (
                <div
                  key={s.season_id}
                  onClick={() => onSelectSeason(s.season_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? "border-[#111111] bg-white shadow-sm ring-1 ring-[#111111]"
                      : "border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white hover:border-[#CCCCCC]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-[#111111]">
                          {s.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            s.status === "active"
                              ? "bg-[#10B981]/10 text-[#059669] border border-[#10B981]/30"
                              : s.status === "production"
                              ? "bg-[#3B82F6]/10 text-[#2563EB] border border-[#3B82F6]/30"
                              : "bg-[#707072]/10 text-[#707072] border border-[#707072]/30"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#707072] font-medium mt-0.5">
                        {s.name}
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5 rounded-full text-[#111111]">
                      {s.year}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-xs text-[#707072]">
                    <span>
                      <strong>{s.collections.length}</strong> collezioni
                    </span>
                    <span>
                      <strong>{productCount}</strong> prodotti PIM
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Season Collections & Products (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeSeason ? (
            <>
              {/* Active Season Detail Header */}
              <div className="bg-white border border-[#E5E5E5] p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-[#111111]">
                        {activeSeason.code}
                      </span>
                      <span className="text-sm font-bold text-[#707072]">
                        — {activeSeason.name}
                      </span>
                    </div>
                    {activeSeason.description && (
                      <p className="text-xs text-[#707072] mt-1">
                        {activeSeason.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewColModal(true)}
                    className="px-3.5 py-2 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-black transition flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>+</span> Aggiungi Collezione a {activeSeason.code}
                  </button>
                </div>

                {/* Sub-Collections Cards */}
                <div className="mt-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#707072] mb-3">
                    Collezioni della Stagione ({activeSeason.collections.length})
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSeason.collections.map((col) => {
                      const colProducts = seasonProducts.filter(
                        (p) =>
                          p.collection_id === col.collection_id ||
                          p.collection_name?.trim().toLowerCase() ===
                            col.name.trim().toLowerCase()
                      );
                      const isSelected = selectedCollectionId === col.collection_id;

                      return (
                        <div
                          key={col.collection_id}
                          onClick={() => onSelectCollection?.(col.collection_id)}
                          className={`p-4 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? "border-[#111111] bg-[#FAFAFA] ring-1 ring-[#111111]"
                              : "border-[#E5E5E5] bg-white hover:border-[#CCCCCC]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-[#111111] text-sm">
                                  {col.name}
                                </span>
                                <span className="text-[10px] font-bold bg-[#F5F5F5] border border-[#E5E5E5] px-1.5 py-0.5 rounded text-[#707072]">
                                  {col.code}
                                </span>
                              </div>
                              <div className="text-xs text-[#707072] mt-1">
                                Target: <strong>{col.target_market}</strong>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                col.status === "approved"
                                  ? "bg-[#10B981]/10 text-[#059669] border border-[#10B981]/20"
                                  : col.status === "in_production"
                                  ? "bg-[#3B82F6]/10 text-[#2563EB] border border-[#3B82F6]/20"
                                  : "bg-[#707072]/10 text-[#707072] border border-[#707072]/20"
                              }`}
                            >
                              {col.status}
                            </span>
                          </div>

                          {col.description && (
                            <p className="text-xs text-[#707072] mt-2 line-clamp-2">
                              {col.description}
                            </p>
                          )}

                          <div className="mt-3 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-xs">
                            <span className="text-[#707072]">Prodotti collegati:</span>
                            <span className="font-extrabold text-[#111111]">
                              {colProducts.length} Modelli PIM
                            </span>
                          </div>

                          {onAddProductsToCollection && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddProductsModal(col);
                              }}
                              className="mt-3 w-full px-3 py-2 rounded-full bg-[#111111] text-white text-[11px] font-bold hover:bg-black transition"
                            >
                              ➕ Associa Prodotti dal PIM
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Products in Active Season Table */}
              <div className="bg-white border border-[#E5E5E5] p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#111111]">
                      {selectedCol
                        ? `Prodotti in ${selectedCol.name} (${activeSeason.code})`
                        : `Prodotti Gestiti in ${activeSeason.code}`}
                    </h3>
                    <p className="text-xs text-[#707072] mt-0.5">
                      {selectedCol
                        ? "Modelli PIM associati a questa collezione. Clicca di nuovo sulla collezione per vedere tutta la stagione."
                        : "Tutti i modelli PIM e le varianti industriali PLM pianificati per questa stagione."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCol && onAddProductsToCollection && (
                      <button
                        type="button"
                        onClick={() => openAddProductsModal(selectedCol)}
                        className="px-3 py-1 rounded-full bg-[#111111] text-white text-[11px] font-bold hover:bg-black transition"
                      >
                        ➕ Associa dal PIM
                      </button>
                    )}
                    <span className="text-xs font-bold bg-[#F5F5F5] px-2.5 py-1 rounded-full text-[#111111]">
                      {displayedProducts.length} Articoli
                    </span>
                  </div>
                </div>

                {displayedProducts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#707072] bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E5E5]">
                    {selectedCol ? (
                      <>
                        Nessun prodotto PIM associato a <strong>{selectedCol.name}</strong>.
                        Usa <strong>➕ Associa Prodotti dal PIM</strong> per aggiungerne.
                      </>
                    ) : (
                      <>
                        Nessun prodotto PIM attualmente assegnato a questa stagione.
                        Crea un nuovo prodotto assegnandogli la stagione <strong>{activeSeason.code}</strong>.
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E5E5] text-[#707072] font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">SKU &amp; Modello</th>
                          <th className="py-2.5 px-3">Collezione</th>
                          <th className="py-2.5 px-3">Categoria</th>
                          <th className="py-2.5 px-3">Varianti PLM</th>
                          <th className="py-2.5 px-3">Prezzo B2B / Retail</th>
                          <th className="py-2.5 px-3 text-right">Azione</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5]">
                        {displayedProducts.map((p) => (
                          <tr key={p.pim_item_id} className="hover:bg-[#FAFAFA] transition">
                            <td className="py-3 px-3">
                              <div className="font-extrabold text-[#111111]">{p.model_name}</div>
                              <div className="text-[11px] text-[#707072] font-mono">{p.sku_code}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-[#111111]">
                                {p.collection_name || "Main Collection"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[10px] font-bold uppercase bg-[#F5F5F5] px-2 py-0.5 rounded text-[#707072]">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-[#111111]">
                                {p.plm_variants.length} Varianti
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-[#111111]">
                                {p.wholesale_price_eur} € / {p.retail_price_eur} €
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {onRemoveProductFromCollection &&
                                  (p.collection_id || p.collection_name) && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveProductFromCollection(p.pim_item_id)}
                                      title="Rimuovi dalla collezione (il prodotto resta nel PIM)"
                                      className="px-2.5 py-1 rounded border border-[#E5E5E5] text-[#B91C1C] font-bold text-[11px] hover:bg-[#FEF2F2] transition"
                                    >
                                      ✕ Rimuovi dalla Collezione
                                    </button>
                                  )}
                                {onNavigateToProduct && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToProduct(p.pim_item_id)}
                                    className="px-2.5 py-1 rounded bg-[#111111] text-white font-bold text-[11px] hover:bg-black transition"
                                  >
                                    Apri Scheda →
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[#707072] bg-white rounded-2xl border border-[#E5E5E5]">
              Seleziona una stagione dall'elenco a sinistra per visualizzare le collezioni.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nuova Stagione */}
      {showNewSeasonModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-[#111111]">Crea Nuova Stagione</h3>
            <p className="text-xs text-[#707072] mt-0.5">
              Definisci un nuovo orizzonte temporale per il campionario (es. P/E 2027).
            </p>

            <form onSubmit={handleCreateSeasonSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Codice Stagione (es. P/E 2027, FW27) *
                </label>
                <input
                  type="text"
                  required
                  value={newSeasonCode}
                  onChange={(e) => setNewSeasonCode(e.target.value)}
                  placeholder="es. P/E 2027"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Nome Esteso Stagione *
                </label>
                <input
                  type="text"
                  required
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  placeholder="es. Primavera Estate 2027"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Anno</label>
                  <input
                    type="number"
                    value={newSeasonYear}
                    onChange={(e) => setNewSeasonYear(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Stato</label>
                  <select
                    value={newSeasonStatus}
                    onChange={(e) => setNewSeasonStatus(e.target.value as SeasonStatus)}
                    className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                  >
                    <option value="planning">Planning (Pianificazione)</option>
                    <option value="active">Active (Attiva / Campionario)</option>
                    <option value="production">Production (In Produzione)</option>
                    <option value="archived">Archived (Archiviata)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Descrizione Editoriale</label>
                <textarea
                  rows={2}
                  value={newSeasonDesc}
                  onChange={(e) => setNewSeasonDesc(e.target.value)}
                  placeholder="Note stilistiche, sostenibilità e moodboard di stagione..."
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-medium focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowNewSeasonModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E5] font-bold text-xs hover:bg-[#F5F5F5] transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-black transition"
                >
                  Salva Stagione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuova Collezione */}
      {showNewColModal && activeSeason && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-[#111111]">
              Aggiungi Collezione a {activeSeason.code}
            </h3>
            <p className="text-xs text-[#707072] mt-0.5">
              Crea una linea di campionario (es. Main collection, Fashion, Limited edition).
            </p>

            <form onSubmit={handleCreateCollectionSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Nome Collezione (es. Main Collection, Runway Capsule) *
                </label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="es. Limited Edition / Capsule"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Codice Sigla *</label>
                  <input
                    type="text"
                    required
                    value={newColCode}
                    onChange={(e) => setNewColCode(e.target.value)}
                    placeholder="es. CAPS-02"
                    className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Stato</label>
                  <select
                    value={newColStatus}
                    onChange={(e) => setNewColStatus(e.target.value as CollectionStatus)}
                    className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                  >
                    <option value="draft">Bozza (Draft)</option>
                    <option value="approved">Approvata (Approved)</option>
                    <option value="in_production">In Produzione</option>
                    <option value="closed">Chiusa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Mercato Target / Canale</label>
                <input
                  type="text"
                  value={newColMarket}
                  onChange={(e) => setNewColMarket(e.target.value)}
                  placeholder="es. Global Luxury / B2B Showroom"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Descrizione</label>
                <textarea
                  rows={2}
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="Dettagli e posizionamento di questa collezione..."
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-medium focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowNewColModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E5] font-bold text-xs hover:bg-[#F5F5F5] transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-black transition"
                >
                  Crea Collezione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Associa Prodotti dal PIM alla Collezione (FTL-PROD-014) */}
      {showAddProductsModal && targetCollection && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 pb-4 border-b border-[#E5E5E5] flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#111111]">
                  Associa Prodotti dal PIM a {targetCollection.name}
                </h3>
                <p className="text-xs text-[#707072] mt-0.5">
                  Seleziona i modelli commerciali PIM (con le relative varianti PLM) da inserire nella collezione{" "}
                  <strong>{targetCollection.code}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProductsModal(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F5] text-[#707072] hover:text-[#111111] flex items-center justify-center font-bold shrink-0"
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs border-b border-[#E5E5E5] bg-[#FAFAFA]">
              <div className="sm:col-span-2 lg:col-span-4">
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="🔍 Cerca per SKU, nome modello o descrizione..."
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] bg-white font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>
              <select
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value)}
                className="p-2.5 rounded-lg border border-[#E5E5E5] bg-white font-semibold focus:outline-none focus:border-[#111111]"
                aria-label="Categoria"
              >
                <option value="ALL">Tutte le categorie</option>
                <option value="footwear">👟 Calzature</option>
                <option value="leather_goods">👜 Pelletteria</option>
                <option value="apparel">🧥 Abbigliamento</option>
              </select>
              <select
                value={modalGender}
                onChange={(e) => setModalGender(e.target.value)}
                className="p-2.5 rounded-lg border border-[#E5E5E5] bg-white font-semibold focus:outline-none focus:border-[#111111]"
                aria-label="Genere"
              >
                <option value="ALL">Tutti i generi</option>
                <option value="donna">♀ Donna</option>
                <option value="uomo">♂ Uomo</option>
                <option value="unisex">⚥ Unisex</option>
                <option value="bambino">🧒 Bambino</option>
              </select>
              <select
                value={modalSeasonScope}
                onChange={(e) => setModalSeasonScope(e.target.value)}
                className="p-2.5 rounded-lg border border-[#E5E5E5] bg-white font-semibold focus:outline-none focus:border-[#111111]"
                aria-label="Stagione"
              >
                <option value="CURRENT">Solo stagione {activeSeason?.code}</option>
                <option value="ALL">Tutte le stagioni</option>
              </select>
              <label className="flex items-center gap-2 font-semibold text-[#111111] cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalOnlyUnassigned}
                  onChange={(e) => setModalOnlyUnassigned(e.target.checked)}
                />
                Solo non assegnati
              </label>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-6 py-3">
              {filteredPimItemsForModal.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#707072]">
                  Nessun prodotto PIM corrisponde ai filtri selezionati.
                </div>
              ) : (
                <div className="divide-y divide-[#E5E5E5]">
                  {filteredPimItemsForModal.map((p) => {
                    const alreadyIn = p.collection_id === targetCollection.collection_id;
                    const checked = selectedPimIdsForAssignment.includes(p.pim_item_id);
                    return (
                      <label
                        key={p.pim_item_id}
                        className={`flex items-center gap-3 py-2.5 text-xs ${
                          alreadyIn ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={alreadyIn}
                          checked={checked || alreadyIn}
                          onChange={() => handleToggleSelectPim(p.pim_item_id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-[#111111] truncate">{p.model_name}</div>
                          <div className="text-[11px] text-[#707072] font-mono">
                            {p.sku_code} · {p.season} · {p.plm_variants.length} varianti PLM
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase bg-[#F5F5F5] px-2 py-0.5 rounded text-[#707072]">
                          {p.category}
                        </span>
                        <span className="text-[10px] font-semibold text-[#707072] w-36 text-right truncate">
                          {alreadyIn
                            ? "✓ Già in collezione"
                            : p.collection_name
                            ? `In: ${p.collection_name}`
                            : "Non assegnato"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#E5E5E5] flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#707072]">
                {filteredPimItemsForModal.length} risultati · un prodotto già assegnato ad altra collezione verrà spostato.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductsModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E5] font-bold text-xs hover:bg-[#F5F5F5] transition"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={selectedPimIdsForAssignment.length === 0}
                  onClick={handleConfirmAddProducts}
                  className="px-4 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-black transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ✓ Associa alla Collezione ({selectedPimIdsForAssignment.length} selezionati)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
