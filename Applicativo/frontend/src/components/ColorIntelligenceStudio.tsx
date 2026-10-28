import React, { useMemo, useState } from "react";
import { MasterColor, Season, ViewerSecurityRole } from "../types";

export const FINISH_TYPE_LABELS: Record<string, string> = {
  pieno_fiore_anilina: "Pieno Fiore Anilina",
  concia_vegetale_naturale: "Concia Vegetale Naturale",
  scamosciato_velour: "Scamosciato / Velour",
  nappa_opaca: "Nappa Opaca Wet-White",
  spazzolato_abrasivato: "Spazzolato / Abrasivato Cera",
  stampa_dollaro_cervo: "Grana Dollaro / Cervo Bottalato",
  vernice_lucida: "Vernice Specchio / Patent",
  galvanica_oro_24k: "Galvanica Oro Chiaro 24K (Nickel-Free)",
  galvanica_palladio: "Galvanica Palladio Spazzolato",
  gomma_opaca: "Suola Gomma / Bio-TPU Opaco",
};

export const DOMAIN_LABELS: Record<string, string> = {
  pellame: "Pellame Tomaia",
  fodera: "Fodera Interna",
  suola: "Fondo & Suola",
  minuterie: "Minuterie & Galvanica",
  filati: "Filati & Giunteria",
  packaging: "Packaging & Dustbag",
};

export const COMMERCIAL_FAMILIES: string[] = [
  "Nero",
  "Marrone / Cuoio",
  "Bianco / Panna",
  "Blu",
  "Bordeaux / Rosso",
  "Verde",
  "Grigio / Tortora",
  "Oro / Metallizzato",
  "Argento / Palladio",
  "Multicolore / Stagionale",
];

interface ColorIntelligenceStudioProps {
  colors: MasterColor[];
  seasons: Season[];
  viewerRole: ViewerSecurityRole;
  onCreateColor: (payload: Omit<MasterColor, "id">) => Promise<void> | void;
  onUpdateColor: (colorId: string, payload: Partial<MasterColor>) => Promise<void> | void;
  onDeleteColor: (colorId: string) => Promise<void> | void;
  compactEmbedded?: boolean;
}

interface ColorFormState {
  color_code: string;
  technical_name_it: string;
  technical_name_en: string;
  commercial_family: string;
  hex_code: string;
  pantone_tcx_code: string;
  ral_code: string;
  finish_type: string;
  applicable_domains: string[];
  season_id: string;
  recipe_notes: string;
  is_active: boolean;
}

const DEFAULT_FORM_STATE: ColorFormState = {
  color_code: "COL-NEW-012",
  technical_name_it: "",
  technical_name_en: "",
  commercial_family: "Marrone / Cuoio",
  hex_code: "#8B5A2B",
  pantone_tcx_code: "18-1142 TCX",
  ral_code: "RAL 8001",
  finish_type: "pieno_fiore_anilina",
  applicable_domains: ["pellame", "filati"],
  season_id: "CARRYOVER",
  recipe_notes: "",
  is_active: true,
};

export const ColorIntelligenceStudio: React.FC<ColorIntelligenceStudioProps> = ({
  colors,
  seasons,
  viewerRole,
  onCreateColor,
  onUpdateColor,
  onDeleteColor,
  compactEmbedded = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [seasonFilter, setSeasonFilter] = useState<string>("ALL");
  const [familyFilter, setFamilyFilter] = useState<string>("ALL");
  const [finishFilter, setFinishFilter] = useState<string>("ALL");
  const [domainFilter, setDomainFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [form, setForm] = useState<ColorFormState>(DEFAULT_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);

  const isReadOnlySubcontractor = viewerRole !== "brand";

  const kpis = useMemo(() => {
    const activeCount = colors.filter((c) => c.is_active !== false).length;
    const carryoverCount = colors.filter(
      (c) => !c.season_id || c.season_id === "CARRYOVER"
    ).length;
    const seasonalCount = colors.length - carryoverCount;
    const finishesSet = new Set(colors.map((c) => c.finish_type).filter(Boolean));
    const familiesSet = new Set(colors.map((c) => c.commercial_family).filter(Boolean));
    return {
      total: colors.length,
      activeCount,
      carryoverCount,
      seasonalCount,
      finishesCount: finishesSet.size,
      familiesCount: familiesSet.size,
    };
  }, [colors]);

  const availableFamilies = useMemo(() => {
    const set = new Set<string>(COMMERCIAL_FAMILIES);
    colors.forEach((c) => {
      if (c.commercial_family) set.add(c.commercial_family);
    });
    return Array.from(set);
  }, [colors]);

  const filteredColors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return colors.filter((c) => {
      if (seasonFilter === "CARRYOVER") {
        if (c.season_id && c.season_id !== "CARRYOVER") return false;
      } else if (seasonFilter !== "ALL") {
        const matchesPrimary = c.season_id === seasonFilter;
        const matchesList = (c.season_ids || []).includes(seasonFilter);
        if (!matchesPrimary && !matchesList) return false;
      }

      if (familyFilter !== "ALL" && c.commercial_family !== familyFilter) {
        return false;
      }
      if (finishFilter !== "ALL" && c.finish_type !== finishFilter) {
        return false;
      }
      if (
        domainFilter !== "ALL" &&
        !(c.applicable_domains || []).includes(domainFilter)
      ) {
        return false;
      }

      if (q) {
        const hay = [
          c.color_code,
          c.technical_name_it,
          c.technical_name_en,
          c.commercial_family,
          c.hex_code,
          c.pantone_tcx_code,
          c.ral_code,
          FINISH_TYPE_LABELS[c.finish_type] || c.finish_type,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [colors, searchQuery, seasonFilter, familyFilter, finishFilter, domainFilter]);

  const resolveSeasonLabel = (color: MasterColor): string => {
    if (!color.season_id || color.season_id === "CARRYOVER") {
      return "Continuativo Carryover";
    }
    const found = seasons.find((s) => s.season_id === color.season_id);
    return found ? `${found.code} · ${found.name}` : color.season_id;
  };

  const openCreateModal = () => {
    const nextIdx = colors.length + 12;
    setEditingColorId(null);
    setForm({
      ...DEFAULT_FORM_STATE,
      color_code: `COL-FTL-${String(nextIdx).padStart(3, "0")}`,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (color: MasterColor) => {
    setEditingColorId(color.id);
    setForm({
      color_code: color.color_code,
      technical_name_it: color.technical_name_it,
      technical_name_en: color.technical_name_en || "",
      commercial_family: color.commercial_family,
      hex_code: color.hex_code || "#141414",
      pantone_tcx_code: color.pantone_tcx_code || "",
      ral_code: color.ral_code || "",
      finish_type: color.finish_type || "pieno_fiore_anilina",
      applicable_domains:
        color.applicable_domains && color.applicable_domains.length > 0
          ? color.applicable_domains
          : ["pellame"],
      season_id: color.season_id || "CARRYOVER",
      recipe_notes: color.recipe_notes || "",
      is_active: color.is_active !== false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const toggleDomain = (domainKey: string) => {
    setForm((prev) => {
      const exists = prev.applicable_domains.includes(domainKey);
      const next = exists
        ? prev.applicable_domains.filter((d) => d !== domainKey)
        : [...prev.applicable_domains, domainKey];
      return {
        ...prev,
        applicable_domains: next.length > 0 ? next : [domainKey],
      };
    });
  };

  const handleSaveColor = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = form.color_code.trim().toUpperCase();
    const cleanNameIt = form.technical_name_it.trim();
    const cleanHex = form.hex_code.trim().startsWith("#")
      ? form.hex_code.trim().toUpperCase()
      : `#${form.hex_code.trim().toUpperCase()}`;

    if (!cleanCode || !cleanNameIt) {
      setFormError("Inserire Codice Colore univoco e Nome Tecnico Italiano (Conceria/Manovia).");
      return;
    }
    if (!/^#[0-9A-F]{6}$/i.test(cleanHex)) {
      setFormError("Il codice cromatico HEX deve rispettare il formato #RRGGBB (es. #C68B59).");
      return;
    }

    const payload: Omit<MasterColor, "id"> = {
      color_code: cleanCode,
      technical_name_it: cleanNameIt,
      technical_name_en: form.technical_name_en.trim() || cleanNameIt,
      commercial_family: form.commercial_family,
      hex_code: cleanHex,
      pantone_tcx_code: form.pantone_tcx_code.trim() || "N/D",
      ral_code: form.ral_code.trim() || "N/D",
      finish_type: form.finish_type,
      applicable_domains: form.applicable_domains,
      season_id: form.season_id === "CARRYOVER" ? null : form.season_id,
      season_ids: [form.season_id],
      recipe_notes: form.recipe_notes.trim(),
      is_active: form.is_active,
    };

    if (editingColorId) {
      await onUpdateColor(editingColorId, payload);
    } else {
      await onCreateColor(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header Editoriale */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-neutral-900 text-white">
                EPOCA II · SPRINT 8
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
                Pantone FHI TCX · RAL · Spettrofotometro ΔE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                Auto-Mapping PIM E-Commerce & B2B
              </span>
            </div>
            <h2 className="mt-2 text-lg md:text-xl font-bold tracking-tight text-neutral-900">
              COLOR INTELLIGENCE · ARCHIVIO TINTE, TIRELLE &amp; FINITURE
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
               Libreria cromatica centralizzata per pellami, fodere, fondi/suole, filati e bagni galvanici Nickel-Free.
              Collega in tempo reale i nodi BOM L1/L2/L3, i lotti del Vault Conceria e la traduzione commerciale omnicanale PIM.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  viewMode === "grid"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-slate-600 hover:text-neutral-900"
                }`}
              >
                ▦ Swatch Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  viewMode === "table"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-slate-600 hover:text-neutral-900"
                }`}
              >
                ☰ Tabella Tecnica
              </button>
            </div>

            {!isReadOnlySubcontractor ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition shadow-sm"
              >
                + NUOVA TINTA / CODICE COLORE
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                👁 Consultazione Tecnica Terzista (0,00 €)
              </span>
            )}
          </div>
        </div>

        {/* KPI Strip */}
        {!compactEmbedded && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-lg p-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Tinte Master Codificate
              </div>
              <div className="text-xl font-bold text-neutral-900 mt-0.5">
                {kpis.total}{" "}
                <span className="text-xs font-normal text-emerald-700">
                  ({kpis.activeCount} attive)
                </span>
              </div>
            </div>
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-lg p-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Carryover vs Stagionali
              </div>
              <div className="text-xl font-bold text-neutral-900 mt-0.5">
                {kpis.carryoverCount}{" "}
                <span className="text-xs font-normal text-slate-500">
                  Cont. · {kpis.seasonalCount} Collezione
                </span>
              </div>
            </div>
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-lg p-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Finiture &amp; Bagni Galvanici
              </div>
              <div className="text-xl font-bold text-neutral-900 mt-0.5">
                {kpis.finishesCount}{" "}
                <span className="text-xs font-normal text-slate-500">
                  standard qualificati
                </span>
              </div>
            </div>
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-lg p-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Famiglie Omnicanale PIM
              </div>
              <div className="text-xl font-bold text-neutral-900 mt-0.5">
                {kpis.familiesCount}{" "}
                <span className="text-xs font-normal text-slate-500">
                  filtri B2C/B2B pronti
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra Filtri Rapidi */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Ricerca Rapida
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Codice, Nome, Pantone TCX, HEX..."
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Stagione / Carryover
            </label>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-neutral-900"
            >
              <option value="ALL">Tutte le Stagioni</option>
              <option value="CARRYOVER">Continuativi Carryover</option>
              {seasons.map((s) => (
                <option key={s.season_id} value={s.season_id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Famiglia E-Commerce (PIM)
            </label>
            <select
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-neutral-900"
            >
              <option value="ALL">Tutte le Famiglie</option>
              {availableFamilies.map((fam) => (
                <option key={fam} value={fam}>
                  {fam}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Finitura Superficiale
            </label>
            <select
              value={finishFilter}
              onChange={(e) => setFinishFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-neutral-900"
            >
              <option value="ALL">Tutte le Finiture</option>
              {Object.entries(FINISH_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              AmbitoComponente BOM
            </label>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-neutral-900"
            >
              <option value="ALL">Tutti gli Ambiti</option>
              {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vista Swatch Card Editoriale */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {filteredColors.map((color) => (
            <div
              key={color.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Pantone-style Color Header */}
                <div
                  className="h-24 w-full relative border-b border-slate-200 flex items-end justify-between p-2.5"
                  style={{ backgroundColor: color.hex_code }}
                >
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/90 text-neutral-900 shadow-sm">
                    {color.hex_code.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900/80 text-white backdrop-blur-sm">
                    {color.pantone_tcx_code}
                  </span>
                </div>

                {/* Metadata Body */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[11px] font-bold text-neutral-900 bg-slate-100 px-2 py-0.5 rounded">
                      {color.color_code}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {resolveSeasonLabel(color)}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-neutral-900 leading-snug">
                      {color.technical_name_it}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {color.technical_name_en}
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-100 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Famiglia PIM:</span>
                      <span className="font-semibold text-neutral-800">
                        {color.commercial_family}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Finitura:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[140px]">
                        {FINISH_TYPE_LABELS[color.finish_type] || color.finish_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">RAL Classic:</span>
                      <span className="font-mono text-slate-700">
                        {color.ral_code || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {(color.applicable_domains || []).map((dom) => (
                      <span
                        key={dom}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
                      >
                        {DOMAIN_LABELS[dom] || dom}
                      </span>
                    ))}
                  </div>

                  {color.recipe_notes && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 pt-1 italic">
                      {color.recipe_notes}
                    </p>
                  )}
                </div>
              </div>

              {!isReadOnlySubcontractor && (
                <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openEditModal(color)}
                    className="text-xs font-semibold text-neutral-800 hover:text-black"
                  >
                    ✎ Modifica Ricetta
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteColor(color.id)}
                    className="text-[11px] font-medium text-rose-600 hover:text-rose-800"
                  >
                    Archivia
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Vista Tabella Tecnica Pantone/RAL */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Swatch &amp; Codice</th>
                  <th className="py-3 px-4">Nome Tecnico (Conceria / Export)</th>
                  <th className="py-3 px-4">Famiglia PIM Omnicanale</th>
                  <th className="py-3 px-4">Coordinate Pantone / RAL</th>
                  <th className="py-3 px-4">Finitura &amp; Ambiti BOM</th>
                  <th className="py-3 px-4">Stagione</th>
                  {!isReadOnlySubcontractor && (
                    <th className="py-3 px-4 text-right">Azioni</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredColors.map((color) => (
                  <tr key={color.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-7 h-7 rounded-lg border border-slate-300 shadow-inner shrink-0"
                          style={{ backgroundColor: color.hex_code }}
                        />
                        <div>
                          <div className="font-mono font-bold text-neutral-900">
                            {color.color_code}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {color.hex_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">
                        {color.technical_name_it}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {color.technical_name_en}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-neutral-800">
                        {color.commercial_family}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-neutral-900 font-semibold">
                        {color.pantone_tcx_code}
                      </div>
                      <div className="text-slate-500">{color.ral_code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-800">
                        {FINISH_TYPE_LABELS[color.finish_type] || color.finish_type}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(color.applicable_domains || []).map((d) => (
                          <span
                            key={d}
                            className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]"
                          >
                            {DOMAIN_LABELS[d] || d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-700">
                      {resolveSeasonLabel(color)}
                    </td>
                    {!isReadOnlySubcontractor && (
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(color)}
                          className="px-2.5 py-1 rounded border border-slate-300 text-neutral-800 hover:bg-slate-100 font-medium"
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteColor(color.id)}
                          className="px-2.5 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 font-medium"
                        >
                          Archivia
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredColors.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
          Nessuna tinta o finitura corrisponde ai filtri selezionati nella Cartella Colori Master.
        </div>
      )}

      {/* Modale Zero-JSON: Creazione / Modifica Tinta Master */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Color Intelligence Engine · Zero-JSON UX
                </span>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingColorId
                    ? `Modifica Tinta Master · ${form.color_code}`
                    : "Codifica Nuova Tinta / Finitura Galvanica Master"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-neutral-900 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveColor} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                  {formError}
                </div>
              )}

              {/* Live Pantone Swatch Card Preview */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div
                  className="w-16 h-16 rounded-xl border border-slate-300 shadow-inner shrink-0"
                  style={{ backgroundColor: form.hex_code }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono font-bold text-slate-500">
                    ANTEPRIMA TIRELLA DIGITALE · {form.color_code || "COL-XXX"}
                  </div>
                  <div className="text-sm font-bold text-neutral-900 truncate">
                    {form.technical_name_it || "Nome Tecnico Italiano..."}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Famiglia PIM: <strong>{form.commercial_family}</strong> ·{" "}
                    {FINISH_TYPE_LABELS[form.finish_type] || form.finish_type} ·{" "}
                    <span className="font-mono">{form.pantone_tcx_code}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <input
                    type="color"
                    value={/^#[0-9A-F]{6}$/i.test(form.hex_code) ? form.hex_code : "#8B5A2B"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        hex_code: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-10 h-8 rounded cursor-pointer border border-slate-300"
                    title="Selettore Colore Nativo"
                  />
                  <input
                    type="text"
                    value={form.hex_code}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, hex_code: e.target.value }))
                    }
                    className="w-24 px-2 py-1 text-center font-mono text-[11px] border border-slate-300 rounded"
                    placeholder="#RRGGBB"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Codice Colore Master *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.color_code}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, color_code: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="COL-TAN-002"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pantone FHI TCX
                  </label>
                  <input
                    type="text"
                    value={form.pantone_tcx_code}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pantone_tcx_code: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="17-1230 TCX"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Codice RAL Classic
                  </label>
                  <input
                    type="text"
                    value={form.ral_code}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, ral_code: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="RAL 8023"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome Tecnico Conceria / Manovia (IT) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.technical_name_it}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        technical_name_it: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Es. Cuoio Naturale Toscano"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Technical Name B2B Showroom (EN)
                  </label>
                  <input
                    type="text"
                    value={form.technical_name_en}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        technical_name_en: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Es. Tuscan Natural Tan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Famiglia Commerciale PIM (B2C)
                  </label>
                  <select
                    value={form.commercial_family}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        commercial_family: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {availableFamilies.map((fam) => (
                      <option key={fam} value={fam}>
                        {fam}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Finitura Superficiale / Bagno
                  </label>
                  <select
                    value={form.finish_type}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, finish_type: e.target.value }))
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {Object.entries(FINISH_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stagione di Riferimento
                  </label>
                  <select
                    value={form.season_id}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, season_id: e.target.value }))
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="CARRYOVER">Continuativo Carryover</option>
                    {seasons.map((s) => (
                      <option key={s.season_id} value={s.season_id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Ambiti Applicativi Distinta Base (BOM L1/L2/L3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(DOMAIN_LABELS).map(([domKey, domLabel]) => {
                    const checked = form.applicable_domains.includes(domKey);
                    return (
                      <button
                        key={domKey}
                        type="button"
                        onClick={() => toggleDomain(domKey)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                          checked
                            ? "bg-neutral-900 text-white border-neutral-900"
                            : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {checked ? "✓ " : "+ "}
                        {domLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ricetta Tintoriale / Tolleranza ΔE / Specifica Micron Galvanica
                </label>
                <textarea
                  rows={2}
                  value={form.recipe_notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, recipe_notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Note per conceria o laboratorio galvanico (es. bottalatura 8h PFAS-free, spessore 0.5 micron Au 24K EN 1811)..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 shadow-sm"
                >
                  {editingColorId ? "💾 Aggiorna Tinta Master" : "💾 Registra Tinta in Archivio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorIntelligenceStudio;
