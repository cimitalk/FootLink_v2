import React, { useState } from "react";
import { DomainRegistryEntry, RegistryDomain } from "../types";

interface DomainRegistriesManagerProps {
  registries: DomainRegistryEntry[];
  onCreateEntry: (entry: {
    registry_domain: RegistryDomain;
    registry_name: string;
    entry_code: string;
    label_it: string;
    label_en: string;
    metadata?: Record<string, any>;
    is_active: boolean;
    sort_order: number;
  }) => void;
  onUpdateEntry?: (
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
  ) => void;
  onDeleteEntry: (domain: string, name: string, code: string) => void;
}

const PIM_REGISTRY_CONFIG = [
  { name: "categories", label: "Categorie Merceologiche", icon: "🏷️", desc: "Calzature, Pelletteria, Abbigliamento con codici doganali default" },
  { name: "retail_channels", label: "Canali di Vendita", icon: "🛍️", desc: "B2B Showroom, E-Commerce Flagship, Wholesale Boutique" },
  { name: "certifications", label: "Certificazioni Sostenibilità", icon: "🌱", desc: "LWG Gold, REACH, GRS, OEKO-TEX Standard 100" },
];

const PLM_REGISTRY_CONFIG = [
  { name: "production_phases", label: "Fasi di Lavorazione Fabbrica", icon: "⚙️", desc: "Concia, Taglio CAD, Giunteria, Montaggio, Finissaggio, QA" },
  { name: "component_types", label: "Tipologie Componenti BOM", icon: "🧩", desc: "Tomaia, Fodera, Sottopiede, Suola/Fondo, Tacco, Minuteria" },
  { name: "suppliers", label: "Fornitori & Concerie", icon: "🏭", desc: "Concerie e fornitori distrettuali con rating e paese d'origine" },
  { name: "subcontractors", label: "Laboratori Terzisti (0 €)", icon: "🤝", desc: "Façonisti di filiera a canone 0 EUR perpetuo con magic link" },
  { name: "size_scales", label: "Scale Taglie Certificate", icon: "📐", desc: "Calzatura Donna 35-42, Uomo 38-46, Abbigliamento IT 44-56" },
  { name: "units_of_measure", label: "Unità di Misura (UoM)", icon: "⚖️", desc: "sqft, m², m, paia, pezzi, kg con fattori di conversione" },
];

export const DomainRegistriesManager: React.FC<DomainRegistriesManagerProps> = ({
  registries,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const [activeDomain, setActiveDomain] = useState<RegistryDomain>("plm");
  const [selectedRegistryName, setSelectedRegistryName] = useState<string>("production_phases");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state - Add
  const [entryCode, setEntryCode] = useState("");
  const [labelIt, setLabelIt] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [metaExtra, setMetaExtra] = useState("");

  // Form state - Edit (FTL-CEO-007)
  const [editingEntry, setEditingEntry] = useState<DomainRegistryEntry | null>(null);
  const [editLabelIt, setEditLabelIt] = useState("");
  const [editLabelEn, setEditLabelEn] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(1);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editMetaExtra, setEditMetaExtra] = useState("");

  // Size Scales Visual Builder State (FTL-PROD-008)
  const [scaleCategory, setScaleCategory] = useState<string>("shoes_woman");
  const [scaleMin, setScaleMin] = useState<number>(35);
  const [scaleMax, setScaleMax] = useState<number>(42);
  const [scaleBase, setScaleBase] = useState<number>(37);
  const [scaleCustomSizes, setScaleCustomSizes] = useState<string>("35, 36, 37, 38, 39, 40, 41, 42");

  const [editScaleCategory, setEditScaleCategory] = useState<string>("shoes_woman");
  const [editScaleMin, setEditScaleMin] = useState<number>(35);
  const [editScaleMax, setEditScaleMax] = useState<number>(42);
  const [editScaleBase, setEditScaleBase] = useState<number>(37);
  const [editScaleCustomSizes, setEditScaleCustomSizes] = useState<string>("35, 36, 37, 38, 39, 40, 41, 42");

  const applyScalePreset = (preset: "woman" | "man" | "kid" | "apparel" | "leather", isEdit = false) => {
    let cat = "shoes_woman";
    let min = 35;
    let max = 42;
    let base = 37;
    let sizes = "35, 36, 37, 38, 39, 40, 41, 42";
    let code = "eu_shoes_woman_cert";
    let it = "Calzature Donna EU 35-42";
    let en = "Women Shoes EU 35-42";

    if (preset === "man") {
      cat = "shoes_man";
      min = 38;
      max = 46;
      base = 42;
      sizes = "38, 39, 40, 41, 42, 43, 44, 45, 46";
      code = "eu_shoes_man_cert";
      it = "Calzature Uomo EU 38-46";
      en = "Men Shoes EU 38-46";
    } else if (preset === "apparel") {
      cat = "apparel";
      min = 44;
      max = 56;
      base = 48;
      sizes = "44, 46, 48, 50, 52, 54, 56";
      code = "it_apparel_cert";
      it = "Abbigliamento IT 44-56";
      en = "Italian Apparel 44-56";
    } else if (preset === "kid") {
      cat = "shoes_kid";
      min = 24;
      max = 34;
      base = 28;
      sizes = "24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34";
      code = "eu_shoes_kid_cert";
      it = "Calzature Bambino EU 24-34";
      en = "Kids Shoes EU 24-34";
    } else if (preset === "leather") {
      cat = "leather_goods";
      min = 1;
      max = 1;
      base = 1;
      sizes = "TU";
      code = "leather_tu_cert";
      it = "Pelletteria Taglia Unica (TU)";
      en = "Leather Goods One Size (OS)";
    }

    if (isEdit) {
      setEditScaleCategory(cat);
      setEditScaleMin(min);
      setEditScaleMax(max);
      setEditScaleBase(base);
      setEditScaleCustomSizes(sizes);
      setEditLabelIt(it);
      setEditLabelEn(en);
    } else {
      setScaleCategory(cat);
      setScaleMin(min);
      setScaleMax(max);
      setScaleBase(base);
      setScaleCustomSizes(sizes);
      setEntryCode(code);
      setLabelIt(it);
      setLabelEn(en);
    }
  };

  const currentConfigs = activeDomain === "pim" ? PIM_REGISTRY_CONFIG : PLM_REGISTRY_CONFIG;
  const currentConfig =
    currentConfigs.find((c) => c.name === selectedRegistryName) || currentConfigs[0];

  const handleDomainChange = (domain: RegistryDomain) => {
    setActiveDomain(domain);
    const firstReg = domain === "pim" ? PIM_REGISTRY_CONFIG[0].name : PLM_REGISTRY_CONFIG[0].name;
    setSelectedRegistryName(firstReg);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryCode.trim() || !labelIt.trim()) return;

    let parsedMeta: Record<string, any> = {};
    if (selectedRegistryName === "size_scales") {
      const sizeList = scaleCustomSizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      parsedMeta = {
        category: scaleCategory,
        min: Number(scaleMin) || 35,
        max: Number(scaleMax) || 42,
        base: Number(scaleBase) || 37,
        sizes: sizeList.length > 0 ? sizeList : ["35", "36", "37", "38", "39", "40", "41", "42"],
        grading_delta_pct: scaleCategory === "apparel" ? 3.4 : 2.8,
      };
    } else if (metaExtra.trim()) {
      try {
        parsedMeta = JSON.parse(metaExtra);
      } catch {
        parsedMeta = { note: metaExtra.trim() };
      }
    }

    onCreateEntry({
      registry_domain: activeDomain,
      registry_name: selectedRegistryName,
      entry_code: entryCode.trim().toLowerCase().replace(/[\s-]/g, "_"),
      label_it: labelIt.trim(),
      label_en: labelEn.trim() || labelIt.trim(),
      metadata: parsedMeta,
      is_active: true,
      sort_order: Number(sortOrder) || 1,
    });

    setEntryCode("");
    setLabelIt("");
    setLabelEn("");
    setMetaExtra("");
    setShowAddModal(false);
  };

  const handleStartEdit = (entry: DomainRegistryEntry) => {
    setEditingEntry(entry);
    setEditLabelIt(entry.label_it);
    setEditLabelEn(entry.label_en || "");
    setEditSortOrder(entry.sort_order ?? 1);
    setEditIsActive(entry.is_active ?? true);
    if (entry.registry_name === "size_scales" && entry.metadata) {
      setEditScaleCategory(entry.metadata.category || "shoes_woman");
      setEditScaleMin(entry.metadata.min ?? 35);
      setEditScaleMax(entry.metadata.max ?? 42);
      setEditScaleBase(entry.metadata.base ?? 37);
      if (Array.isArray(entry.metadata.sizes)) {
        setEditScaleCustomSizes(entry.metadata.sizes.join(", "));
      } else {
        setEditScaleCustomSizes("35, 36, 37, 38, 39, 40, 41, 42");
      }
    }
    setEditMetaExtra(
      entry.metadata && Object.keys(entry.metadata).length > 0
        ? JSON.stringify(entry.metadata, null, 2)
        : ""
    );
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !editLabelIt.trim() || !onUpdateEntry) return;

    let parsedMeta: Record<string, any> = {};
    if (editingEntry.registry_name === "size_scales") {
      const sizeList = editScaleCustomSizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      parsedMeta = {
        category: editScaleCategory,
        min: Number(editScaleMin) || 35,
        max: Number(editScaleMax) || 42,
        base: Number(editScaleBase) || 37,
        sizes: sizeList,
        grading_delta_pct: editScaleCategory === "apparel" ? 3.4 : 2.8,
      };
    } else if (editMetaExtra.trim()) {
      try {
        parsedMeta = JSON.parse(editMetaExtra);
      } catch {
        parsedMeta = { note: editMetaExtra.trim() };
      }
    }

    onUpdateEntry(
      editingEntry.registry_domain,
      editingEntry.registry_name,
      editingEntry.entry_code,
      {
        label_it: editLabelIt.trim(),
        label_en: editLabelEn.trim() || editLabelIt.trim(),
        metadata: parsedMeta,
        is_active: editIsActive,
        sort_order: Number(editSortOrder) || 1,
      }
    );

    setEditingEntry(null);
  };

  // Filter entries
  const currentEntries = registries.filter(
    (r) =>
      (r.registry_domain === activeDomain || (r.registry_domain as string) === activeDomain) &&
      r.registry_name === selectedRegistryName
  );

  const filteredEntries = currentEntries.filter(
    (e) =>
      e.label_it.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.entry_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.label_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="bg-[#111111] text-white p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9E9E9E]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            MODULO 03 · TABELLE ANAGRAFICHE DI DOMINIO
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Master Data PLM &amp; PIM
          </h2>
          <p className="text-sm text-[#CCCCCC] mt-1 max-w-2xl">
            Gestisci in modo centralizzato e flessibile le anagrafiche di filiera.
            Le tabelle alimentano dinamicamente tutti i menù a discesa e le validazioni nei moduli di prodotto.
          </p>
        </div>

        {/* Domain Tabs: PIM vs PLM */}
        <div className="flex items-center gap-2 bg-[#222222] p-1.5 rounded-full border border-[#333333]">
          <button
            type="button"
            onClick={() => handleDomainChange("plm")}
            className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition ${
              activeDomain === "plm"
                ? "bg-white text-[#111111] shadow-sm"
                : "text-[#9E9E9E] hover:text-white"
            }`}
          >
            🏭 Anagrafiche PLM Fabbrica
          </button>
          <button
            type="button"
            onClick={() => handleDomainChange("pim")}
            className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition ${
              activeDomain === "pim"
                ? "bg-white text-[#111111] shadow-sm"
                : "text-[#9E9E9E] hover:text-white"
            }`}
          >
            📦 Anagrafiche PIM Commerciale
          </button>
        </div>
      </div>

      {/* Main Split Layout: Registries List + Entries Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registry Selectors (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="px-1 text-xs font-bold uppercase tracking-wider text-[#707072]">
            Tabelle {activeDomain.toUpperCase()} Disponibili
          </div>

          {currentConfigs.map((cfg) => {
            const isSelected = cfg.name === selectedRegistryName;
            const count = registries.filter(
              (r) =>
                (r.registry_domain === activeDomain || (r.registry_domain as string) === activeDomain) &&
                r.registry_name === cfg.name
            ).length;

            return (
              <div
                key={cfg.name}
                onClick={() => setSelectedRegistryName(cfg.name)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? "border-[#111111] bg-white ring-1 ring-[#111111] shadow-sm"
                    : "border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white hover:border-[#CCCCCC]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{cfg.icon}</span>
                    <span className="text-xs font-extrabold text-[#111111]">
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5 rounded-full text-[#111111]">
                    {count}
                  </span>
                </div>
                <div className="text-[11px] text-[#707072] mt-1 line-clamp-1 pl-7">
                  {cfg.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Entries Table & CRUD (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-[#E5E5E5] p-6 rounded-2xl">
            {/* Table Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E5E5]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentConfig.icon}</span>
                  <h3 className="text-lg font-black text-[#111111]">
                    {currentConfig.label}
                  </h3>
                  <span className="text-xs font-mono font-bold bg-[#F5F5F5] px-2 py-0.5 rounded text-[#707072]">
                    {activeDomain}/{selectedRegistryName}
                  </span>
                </div>
                <p className="text-xs text-[#707072] mt-1">{currentConfig.desc}</p>
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Cerca per etichetta o codice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-[#E5E5E5] text-xs font-medium focus:outline-none focus:border-[#111111]"
                />
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-1.5 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-black transition whitespace-nowrap"
                >
                  + Aggiungi Voce
                </button>
              </div>
            </div>

            {/* Entries Table */}
            <div className="overflow-x-auto mt-4">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#707072] bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E5E5]">
                  Nessuna voce presente o corrispondente alla ricerca.
                  Clicca su <strong>+ Aggiungi Voce</strong> per inserire un nuovo elemento.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] text-[#707072] font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Ordine</th>
                      <th className="py-2.5 px-3">Codice Univoco</th>
                      <th className="py-2.5 px-3">Etichetta (IT)</th>
                      <th className="py-2.5 px-3">Etichetta (EN)</th>
                      <th className="py-2.5 px-3">Dettagli / Metadati</th>
                      <th className="py-2.5 px-3 text-right">Azione</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {filteredEntries.map((item) => (
                      <tr key={item.entry_code} className="hover:bg-[#FAFAFA] transition">
                        <td className="py-3 px-3 font-mono font-bold text-[#707072]">
                          #{item.sort_order}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded text-[11px]">
                            {item.entry_code}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-extrabold text-[#111111]">
                          {item.label_it}
                        </td>
                        <td className="py-3 px-3 text-[#707072]">
                          {item.label_en}
                        </td>
                        <td className="py-3 px-3">
                          {selectedRegistryName === "size_scales" && item.metadata ? (
                            <div className="space-y-1 max-w-sm">
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(item.metadata.sizes)
                                  ? item.metadata.sizes
                                  : (item.metadata?.min !== undefined && item.metadata?.max !== undefined)
                                  ? Array.from(
                                      { length: item.metadata.max - item.metadata.min + 1 },
                                      (_, i) => (item.metadata?.min ?? 0) + i
                                    )
                                  : []
                                ).map((sz: any) => (
                                  <span
                                    key={String(sz)}
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                      String(sz) === String(item.metadata?.base) || String(sz).includes(` ${item.metadata?.base}`)
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "bg-white border border-[#CCCCCC] text-[#111111]"
                                    }`}
                                  >
                                    {String(sz)}
                                    {String(sz) === String(item.metadata?.base) ? " (Base)" : ""}
                                  </span>
                                ))}
                              </div>
                              <div className="text-[10px] text-[#707072]">
                                Base Campione: <strong className="text-[#111111]">{item.metadata.base ?? "42"}</strong> · Step BOM: <strong className="text-[#111111]">+{item.metadata.grading_delta_pct ?? 2.8}%</strong>
                              </div>
                            </div>
                          ) : item.metadata && Object.keys(item.metadata).length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {Object.entries(item.metadata).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="text-[10px] bg-[#F5F5F5] border border-[#E5E5E5] px-1.5 py-0.5 rounded text-[#707072]"
                                >
                                  <strong>{k}:</strong> {String(v)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#9E9E9E] text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="text-[#111111] hover:text-black text-xs font-bold transition px-2.5 py-1 rounded-lg border border-[#CCCCCC] hover:border-[#111111] hover:bg-[#F5F5F5] flex items-center gap-1"
                              title="Modifica elemento della tabella anagrafica"
                            >
                              <span>✏️</span>
                              <span>Modifica</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onDeleteEntry(
                                  item.registry_domain,
                                  item.registry_name,
                                  item.entry_code
                                )
                              }
                              className="text-[#DC2626] hover:text-[#991B1B] text-xs font-bold transition px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"
                              title="Elimina voce da anagrafica"
                            >
                              Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Aggiungi Voce Anagrafica */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-[#111111]">
              Nuovo Elemento in {currentConfig.label}
            </h3>
            <p className="text-xs text-[#707072] mt-0.5">
              Inserisci una nuova voce anagrafica per la tabella <code>{selectedRegistryName}</code>.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Codice Chiave (Univoco, es. CONCERIA_ROSSI, SUOLA_VIBRAM) *
                </label>
                <input
                  type="text"
                  required
                  value={entryCode}
                  onChange={(e) => setEntryCode(e.target.value)}
                  placeholder="es. tomaia_vitello_pieno_fiore"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-mono font-bold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Etichetta Italiana *
                </label>
                <input
                  type="text"
                  required
                  value={labelIt}
                  onChange={(e) => setLabelIt(e.target.value)}
                  placeholder="es. Vitello Pieno Fiore 1.4mm"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Etichetta Inglese
                </label>
                <input
                  type="text"
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                  placeholder="es. Full-Grain Calfskin 1.4mm"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Ordine di Visualizzazione
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              {selectedRegistryName === "size_scales" ? (
                <div className="bg-[#F9F9F9] border border-[#CCCCCC] rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                      📐 Configuratore Visuale Scala Taglie Certificate
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      Zero JSON
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#707072] uppercase block mb-1">
                      Template &amp; Preset Rapidi di Settore
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyScalePreset("woman")}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👠 Donna EU (35-42)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("man")}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👞 Uomo EU (38-46)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("apparel")}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        🧥 Abbigliamento IT (44-56)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("leather")}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👜 Pelletteria (TU)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("kid")}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        🧒 Bambino EU (24-34)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Taglia Min
                      </label>
                      <input
                        type="number"
                        value={scaleMin}
                        onChange={(e) => setScaleMin(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Taglia Max
                      </label>
                      <input
                        type="number"
                        value={scaleMax}
                        onChange={(e) => setScaleMax(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Base Campione
                      </label>
                      <input
                        type="number"
                        value={scaleBase}
                        onChange={(e) => setScaleBase(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Elenco Taglie Incluse (separate da virgola)
                    </label>
                    <input
                      type="text"
                      value={scaleCustomSizes}
                      onChange={(e) => setScaleCustomSizes(e.target.value)}
                      placeholder="es. 38, 39, 40, 41, 42, 43, 44, 45, 46"
                      className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-[#707072] uppercase block mb-1">
                      Anteprima Taglie Certificate:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {scaleCustomSizes
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((s) => (
                          <span
                            key={s}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              s === String(scaleBase)
                                ? "bg-emerald-500 text-white"
                                : "bg-white border border-[#CCCCCC] text-[#111111]"
                            }`}
                          >
                            {s} {s === String(scaleBase) ? "(Base)" : ""}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Metadati Aggiuntivi (JSON o note)
                  </label>
                  <textarea
                    rows={2}
                    value={metaExtra}
                    onChange={(e) => setMetaExtra(e.target.value)}
                    placeholder='es. {"district": "Fermo", "rating": "A+"} oppure note di testo'
                    className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-mono focus:outline-none focus:border-[#111111]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E5] font-bold text-xs hover:bg-[#F5F5F5] transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-black transition"
                >
                  Salva in Anagrafica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifica Voce Anagrafica (FTL-CEO-007) */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full">
                  MODIFICA ELEMENTO ANAGRAFICA
                </span>
                <h3 className="text-lg font-black text-[#111111] mt-1">
                  Modifica {editingEntry.label_it}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="text-[#707072] hover:text-[#111111] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#707072] mt-2">
              Aggiorna le etichette, l'ordine o i metadati per la voce della tabella{" "}
              <code className="font-bold text-[#111111]">{editingEntry.registry_name}</code>.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#707072] block mb-1">
                  Codice Chiave (Univoco Immutabile)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingEntry.entry_code}
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] text-xs font-mono font-bold text-[#707072] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Etichetta Italiana (IT) *
                </label>
                <input
                  type="text"
                  required
                  value={editLabelIt}
                  onChange={(e) => setEditLabelIt(e.target.value)}
                  placeholder="es. Vitello Pieno Fiore 1.4mm"
                  className="w-full p-2.5 rounded-lg border border-[#CCCCCC] focus:border-[#111111] text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Etichetta Inglese (EN)
                </label>
                <input
                  type="text"
                  value={editLabelEn}
                  onChange={(e) => setEditLabelEn(e.target.value)}
                  placeholder="es. Full-Grain Calfskin 1.4mm"
                  className="w-full p-2.5 rounded-lg border border-[#CCCCCC] focus:border-[#111111] text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Ordine Visualizzazione
                  </label>
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-[#CCCCCC] focus:border-[#111111] text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Stato Voce
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-semibold text-[#111111]">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#111111] border-[#CCCCCC] focus:ring-black"
                    />
                    <span>Attiva nei form</span>
                  </label>
                </div>
              </div>

              {editingEntry.registry_name === "size_scales" ? (
                <div className="bg-[#F9F9F9] border border-[#CCCCCC] rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                      📐 Modifica Visuale Scala Taglie Certificate
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      Zero JSON
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#707072] uppercase block mb-1">
                      Template Rapidi
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyScalePreset("woman", true)}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👠 Donna EU (35-42)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("man", true)}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👞 Uomo EU (38-46)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("apparel", true)}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        🧥 Abbigliamento IT (44-56)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("leather", true)}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👜 Pelletteria (TU)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Taglia Min
                      </label>
                      <input
                        type="number"
                        value={editScaleMin}
                        onChange={(e) => setEditScaleMin(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Taglia Max
                      </label>
                      <input
                        type="number"
                        value={editScaleMax}
                        onChange={(e) => setEditScaleMax(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Base Campione
                      </label>
                      <input
                        type="number"
                        value={editScaleBase}
                        onChange={(e) => setEditScaleBase(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Elenco Taglie Incluse (separate da virgola)
                    </label>
                    <input
                      type="text"
                      value={editScaleCustomSizes}
                      onChange={(e) => setEditScaleCustomSizes(e.target.value)}
                      placeholder="es. 38, 39, 40, 41, 42, 43, 44, 45, 46"
                      className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-[#707072] uppercase block mb-1">
                      Anteprima Taglie Certificate:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {editScaleCustomSizes
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((s) => (
                          <span
                            key={s}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              s === String(editScaleBase)
                                ? "bg-emerald-500 text-white"
                                : "bg-white border border-[#CCCCCC] text-[#111111]"
                            }`}
                          >
                            {s} {s === String(editScaleBase) ? "(Base)" : ""}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Metadati e Parametri di Settore (JSON o note)
                  </label>
                  <textarea
                    rows={3}
                    value={editMetaExtra}
                    onChange={(e) => setEditMetaExtra(e.target.value)}
                    placeholder='es. {"district": "Fermo", "rating": "A+"}'
                    className="w-full p-2.5 rounded-lg border border-[#CCCCCC] focus:border-[#111111] text-xs font-mono focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-full border border-[#CCCCCC] font-bold text-xs hover:bg-[#F5F5F5] transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-black transition shadow-sm"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
