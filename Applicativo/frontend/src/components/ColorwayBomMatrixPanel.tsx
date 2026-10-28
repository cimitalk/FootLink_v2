import React, { useEffect, useMemo, useState } from "react";
import {
  applyColorwayRuleToMappings,
  ColorwayExplosionPayload,
  computeLocalColorwayMatrix,
  findMasterColorById,
} from "../mockSeedData";
import {
  ColorwayBomNodeMapping,
  ColorwayMatrixResponse,
  MasterColor,
  PimCommercialItem,
  PlmProductionVariant,
  TanneryBatch,
  VendorRecord,
  ViewerSecurityRole,
} from "../types";
import { FINISH_TYPE_LABELS } from "./ColorIntelligenceStudio";

export const COLORWAY_RULE_LABELS: Record<string, string> = {
  tone_on_tone: "Tono su Tono Integrale (Tomaia · Suola · Filato)",
  contrast_white_sole: "Contrasto Sport-Luxury (Fondo Bianco Ottico + Fodera Avorio)",
  luxury_gold_hardware: "Lusso Classico (Minuteria Galvanica Oro Chiaro 24K)",
  luxury_palladium_hardware: "Lusso Contemporaneo (Minuteria Palladio Spazzolato)",
};

export const LAB_DIP_STATUS_META: Record<
  string,
  { label: string; badgeClass: string }
> = {
  master_standard: {
    label: "● TIRELLA MASTER STANDARD",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  approved: {
    label: "✓ TIRELLA APPROVATA",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  conditional_waiver: {
    label: "◐ APPROVATA CON DEROGA",
    badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
  },
  submitted: {
    label: "⏳ IN VALUTAZIONE SPETTROFOTOMETRO",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
  },
  pending: {
    label: "○ IN ATTESA INVIO TIRELLA",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
  rejected: {
    label: "✕ TIRELLA RIGETTATA · BLOCCO",
    badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
  },
};

const PART_ROLE_LABELS: Record<string, string> = {
  tomaia_principale: "Tomaia / Quadrante Principale",
  fodera_interna: "Fodera Interna",
  fondo_suola: "Fondo / Suola / Guardolo",
  minuteria_galvanica: "Minuteria & Accessorio Galvanico",
  filato_cucitura: "Filato / Giunteria / Rinforzo",
  sotto_assieme: "Sotto-Assieme Lavorato",
  packaging_scatola: "Packaging & Corredo",
};

interface ColorwayBomMatrixPanelProps {
  variant: PlmProductionVariant;
  parentPimItem?: PimCommercialItem;
  colors: MasterColor[];
  vendors: VendorRecord[];
  tanneryBatches: TanneryBatch[];
  matrix?: ColorwayMatrixResponse;
  viewerRole: ViewerSecurityRole;
  onSaveMatrix: (
    variantId: string,
    updatedMatrix: ColorwayMatrixResponse
  ) => Promise<void> | void;
  onExplodeColorways: (
    variantId: string,
    payload: ColorwayExplosionPayload
  ) => Promise<void> | void;
  onOpenColorStudioModal?: () => void;
  externalTriggerExplosionCounter?: number;
}

export const ColorwayBomMatrixPanel: React.FC<ColorwayBomMatrixPanelProps> = ({
  variant,
  parentPimItem,
  colors,
  vendors,
  tanneryBatches,
  matrix,
  viewerRole,
  onSaveMatrix,
  onExplodeColorways,
  onOpenColorStudioModal,
  externalTriggerExplosionCounter = 0,
}) => {
  const computedFallback = useMemo(
    () =>
      computeLocalColorwayMatrix(
        variant,
        colors,
        tanneryBatches,
        matrix?.mappings
      ),
    [variant, colors, tanneryBatches, matrix]
  );

  const [primaryColorId, setPrimaryColorId] = useState<string>(
    matrix?.primary_color_id || computedFallback.primary_color_id || ""
  );
  const [secondaryColorId, setSecondaryColorId] = useState<string>(
    matrix?.secondary_color_id || computedFallback.secondary_color_id || ""
  );
  const [hardwareColorId, setHardwareColorId] = useState<string>(
    matrix?.hardware_finish_color_id ||
      computedFallback.hardware_finish_color_id ||
      ""
  );
  const [rulePreset, setRulePreset] = useState<string>(
    matrix?.colorway_rule_preset ||
      computedFallback.colorway_rule_preset ||
      "tone_on_tone"
  );
  const [draftMappings, setDraftMappings] = useState<ColorwayBomNodeMapping[]>(
    matrix?.mappings || computedFallback.mappings
  );
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // 1-Click Colorway Explosion Wizard State
  const [isExplosionOpen, setIsExplosionOpen] = useState(false);
  const [selectedExplosionColors, setSelectedExplosionColors] = useState<string[]>([]);
  const [explosionRule, setExplosionRule] = useState<string>("luxury_gold_hardware");
  const [explosionLiningId, setExplosionLiningId] = useState<string>("MCOL-ECR-005");
  const [explosionSoleId, setExplosionSoleId] = useState<string>("");
  const [explosionHardwareId, setExplosionHardwareId] = useState<string>("MCOL-GLD-010");
  const [isExploding, setIsExploding] = useState(false);

  const isReadOnlySubcontractor = viewerRole !== "brand";

  useEffect(() => {
    const base = matrix || computedFallback;
    setPrimaryColorId(base.primary_color_id || "");
    setSecondaryColorId(base.secondary_color_id || "");
    setHardwareColorId(base.hardware_finish_color_id || "");
    setRulePreset(base.colorway_rule_preset || "tone_on_tone");
    setDraftMappings(base.mappings);
    setSaveFeedback(null);
  }, [variant.plm_variant_id, matrix, computedFallback]);

  useEffect(() => {
    if (externalTriggerExplosionCounter > 0) {
      openExplosionWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTriggerExplosionCounter]);

  const metrics = useMemo(() => {
    const total = draftMappings.length;
    const mapped = draftMappings.filter((m) => Boolean(m.master_color_id)).length;
    const approved = draftMappings.filter((m) =>
      ["approved", "master_standard", "conditional_waiver"].includes(
        m.lab_dip_status
      )
    ).length;
    const rejected = draftMappings.filter(
      (m) =>
        m.lab_dip_status === "rejected" ||
        (typeof m.delta_e_value === "number" && m.delta_e_value > 2.5)
    ).length;
    const mismatchCount = draftMappings.filter(
      (m) => m.tannery_color_consistency === "mismatch"
    ).length;
    const readinessPct = total > 0 ? Math.round((approved / total) * 100) : 100;
    const gateBlocked = rejected > 0;
    return {
      total,
      mapped,
      approved,
      rejected,
      mismatchCount,
      readinessPct,
      gateBlocked,
    };
  }, [draftMappings]);

  const handleNodeColorChange = (bomItemId: string, newColorId: string) => {
    const chosen = findMasterColorById(colors, newColorId);
    setDraftMappings((prev) =>
      prev.map((m) => {
        if (m.bom_item_id !== bomItemId) return m;
        // Re-evaluate tannery batch consistency
        const linkedBatch = tanneryBatches.find(
          (tb) => tb.metadata?.bom_material_id === bomItemId
        );
        let consistency: "coherent" | "mismatch" | "not_linked" = "not_linked";
        if (linkedBatch && linkedBatch.master_color_id && chosen) {
          const bCol = findMasterColorById(colors, linkedBatch.master_color_id);
          consistency = bCol && bCol.id === chosen.id ? "coherent" : "mismatch";
        }
        return {
          ...m,
          master_color_id: chosen?.id ?? null,
          color_code: chosen?.color_code ?? null,
          technical_name_it: chosen?.technical_name_it ?? null,
          commercial_family: chosen?.commercial_family ?? null,
          hex_code: chosen?.hex_code ?? null,
          pantone_tcx_code: chosen?.pantone_tcx_code ?? null,
          ral_code: chosen?.ral_code ?? null,
          finish_type: chosen?.finish_type ?? null,
          galvanics_finish:
            m.component_type === "hardware"
              ? chosen?.finish_type || m.galvanics_finish
              : m.galvanics_finish,
          tannery_color_consistency: consistency,
          linked_batch_code: linkedBatch?.batch_code ?? m.linked_batch_code,
        };
      })
    );
  };

  const handleNodeDeltaEChange = (bomItemId: string, rawVal: string) => {
    const parsed = rawVal === "" ? null : Number(rawVal);
    setDraftMappings((prev) =>
      prev.map((m) => {
        if (m.bom_item_id !== bomItemId) return m;
        let autoStatus = m.lab_dip_status;
        if (typeof parsed === "number" && !Number.isNaN(parsed)) {
          if (parsed > 2.5) autoStatus = "rejected";
        }
        return {
          ...m,
          delta_e_value:
            parsed !== null && !Number.isNaN(parsed) ? parsed : null,
          lab_dip_status: autoStatus,
        };
      })
    );
  };

  const handleQuickLabDipStatus = (
    bomItemId: string,
    nextStatus: ColorwayBomNodeMapping["lab_dip_status"]
  ) => {
    setDraftMappings((prev) =>
      prev.map((m) => {
        if (m.bom_item_id !== bomItemId) return m;
        return {
          ...m,
          lab_dip_status: nextStatus,
          approved_by:
            nextStatus === "approved" ||
            nextStatus === "master_standard" ||
            nextStatus === "conditional_waiver"
              ? "Direzione Qualità & Stile"
              : null,
          approved_at:
            nextStatus === "approved" ||
            nextStatus === "master_standard" ||
            nextStatus === "conditional_waiver"
              ? new Date().toISOString()
              : null,
        };
      })
    );
  };

  const handlePropagateRule = () => {
    const res = applyColorwayRuleToMappings(
      draftMappings,
      rulePreset,
      primaryColorId,
      secondaryColorId,
      hardwareColorId,
      colors
    );
    if (res.resolvedSecondaryId) setSecondaryColorId(res.resolvedSecondaryId);
    if (res.resolvedHardwareId) setHardwareColorId(res.resolvedHardwareId);
    setDraftMappings(res.mappings);
    setSaveFeedback(
      `Regola "${COLORWAY_RULE_LABELS[rulePreset] || rulePreset}" propagata su tutti i ${res.mappings.length} nodi BOM L1/L2/L3.`
    );
  };

  const handlePersistMatrix = async () => {
    const updated: ColorwayMatrixResponse = {
      plm_variant_id: variant.plm_variant_id,
      variant_code: variant.variant_code,
      colorway_name: variant.colorway_name,
      primary_color_id: primaryColorId || null,
      secondary_color_id: secondaryColorId || null,
      hardware_finish_color_id: hardwareColorId || null,
      colorway_rule_preset: rulePreset,
      total_bom_nodes: metrics.total,
      mapped_nodes_count: metrics.mapped,
      approved_nodes_count: metrics.approved,
      rejected_nodes_count: metrics.rejected,
      colorway_readiness_pct: metrics.readinessPct,
      production_gate_blocked: metrics.gateBlocked,
      mappings: draftMappings,
    };
    await onSaveMatrix(variant.plm_variant_id, updated);
    setSaveFeedback(
      "✓ Matrice Varianti Colore, ΔE Spettrofotometro e stati Lab-Dip salvati e sincronizzati con la BOM."
    );
  };

  const openExplosionWizard = () => {
    const upperColors = colors.filter(
      (c) =>
        (c.applicable_domains || []).includes("pellame") &&
        c.id !== variant.primary_color_id
    );
    setSelectedExplosionColors(
      upperColors.slice(0, 3).map((c) => c.id)
    );
    setExplosionRule(rulePreset || "luxury_gold_hardware");
    setIsExplosionOpen(true);
  };

  const toggleExplosionColor = (colorId: string) => {
    setSelectedExplosionColors((prev) =>
      prev.includes(colorId)
        ? prev.filter((id) => id !== colorId)
        : [...prev, colorId]
    );
  };

  const handleConfirmExplosion = async () => {
    if (selectedExplosionColors.length === 0) return;
    setIsExploding(true);
    try {
      await onExplodeColorways(variant.plm_variant_id, {
        target_color_ids: selectedExplosionColors,
        rule_preset: explosionRule,
        lining_color_id: explosionLiningId || null,
        sole_color_id: explosionSoleId || null,
        hardware_color_id: explosionHardwareId || null,
        auto_link_pim: true,
      });
      setIsExplosionOpen(false);
    } finally {
      setIsExploding(false);
    }
  };

  const renderDeltaEBadge = (deltaE?: number | null) => {
    if (deltaE === null || deltaE === undefined) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
          Non misurato
        </span>
      );
    }
    if (deltaE <= 1.0) {
      return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
          ≤1.0 Eccellente
        </span>
      );
    }
    if (deltaE <= 1.8) {
      return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
          ≤1.8 Conforme
        </span>
      );
    }
    if (deltaE <= 2.5) {
      return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
          Limite Deroga
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300">
        &gt;2.5 Fuori Tolleranza
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header + Gate Produzione */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-900 text-white">
              FTL-TECH-022 · LAB-DIP &amp; ΔE GATE
            </span>
            {metrics.gateBlocked ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                🔴 GATE PRODUZIONE BLOCCATO ({metrics.rejected} Tirella Rigettata / ΔE &gt; 2.5)
              </span>
            ) : metrics.readinessPct === 100 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                🟢 SBLOCCATO PER MANOVIA (100% Tirelle Conformi)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300">
                🟡 CAMPIONARIO IN CORSO ({metrics.readinessPct}% Tirelle Approvate)
              </span>
            )}
            {metrics.mismatchCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                ⚠ {metrics.mismatchCount} Mismatch Lotto Conceria
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-base font-bold tracking-tight text-neutral-900">
            MATRICE VARIANTI COLORE (COLORWAY BOM MATRIX)
          </h3>
          <p className="text-xs text-slate-600">
            Variante <span className="font-mono font-semibold text-neutral-900">{variant.variant_code}</span> ·{" "}
            {variant.colorway_name} — Approvazione tirelle Lab-Dip, tolleranza ΔE spettrofotometro e coerenza lotti conceria.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenColorStudioModal && (
            <button
              type="button"
              onClick={onOpenColorStudioModal}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-neutral-800 hover:bg-slate-50"
            >
              🎨 Apri Cartella Colori
            </button>
          )}
          {!isReadOnlySubcontractor && (
            <>
              <button
                type="button"
                onClick={openExplosionWizard}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400 text-amber-950 text-xs font-bold hover:bg-amber-500/25 transition"
              >
                ⚡ Esplodi N Varianti da Cartella Colori (1-Click)
              </button>
              <button
                type="button"
                onClick={handlePersistMatrix}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 shadow-sm"
              >
                💾 Salva Matrice &amp; Lab-Dip
              </button>
            </>
          )}
        </div>
      </div>

      {/* Readiness Progress Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-neutral-800">
            Readiness Tirelle Lab-Dip ({metrics.approved}/{metrics.total} nodi BOM approvati)
          </span>
          <span className="font-mono font-bold text-neutral-900">
            {metrics.readinessPct}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              metrics.gateBlocked
                ? "bg-rose-600"
                : metrics.readinessPct === 100
                ? "bg-emerald-600"
                : "bg-amber-500"
            }`}
            style={{ width: `${Math.max(metrics.readinessPct, 6)}%` }}
          />
        </div>
      </div>

      {/* Regola Cromatica & Colori Guida */}
      {!isReadOnlySubcontractor && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tinta Primaria Tomaia / Corpo
            </label>
            <select
              value={primaryColorId}
              onChange={(e) => setPrimaryColorId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">— Seleziona Tinta —</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.color_code} · {c.technical_name_it}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tinta Secondaria / Fodera
            </label>
            <select
              value={secondaryColorId}
              onChange={(e) => setSecondaryColorId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">— Seleziona Fodera —</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.color_code} · {c.technical_name_it}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Finitura Galvanica Minuterie
            </label>
            <select
              value={hardwareColorId}
              onChange={(e) => setHardwareColorId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">— Seleziona Galvanica —</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.color_code} · {c.technical_name_it}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Preset Regola Cromatica BOM
            </label>
            <select
              value={rulePreset}
              onChange={(e) => setRulePreset(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              {Object.entries(COLORWAY_RULE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handlePropagateRule}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-neutral-900 text-neutral-900 font-bold hover:bg-neutral-900 hover:text-white transition"
            >
              🪄 Propaga Regola sulla BOM
            </button>
          </div>
        </div>
      )}

      {saveFeedback && (
        <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
          {saveFeedback}
        </div>
      )}

      {/* Tabella Sinottica L1/L2/L3 BOM Matrix */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-2.5 px-3">LIVELLO &amp; COMPONENTE</th>
              <th className="py-2.5 px-3">FORNITORE ALBO</th>
              <th className="py-2.5 px-3">COLORE ASSEGNATO (SWATCH + PANTONE)</th>
              <th className="py-2.5 px-3">RUOLO / GALVANICA</th>
              <th className="py-2.5 px-3">ΔE SPETTROFOTOMETRO</th>
              <th className="py-2.5 px-3">STATO TIRELLA / LAB-DIP</th>
              <th className="py-2.5 px-3">COERENZA LOTTO CONCERIA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {draftMappings.map((row) => {
              const vendorObj = vendors.find(
                (v) =>
                  v.vendor_id === row.vendor_id ||
                  v.company_name.toLowerCase() === row.supplier_name.toLowerCase()
              );
              const statusMeta =
                LAB_DIP_STATUS_META[row.lab_dip_status] ||
                LAB_DIP_STATUS_META.pending;

              return (
                <tr key={row.bom_item_id} className="hover:bg-slate-50/70">
                  {/* 1. Livello & Componente */}
                  <td className="py-3 px-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                          row.level === 1
                            ? "bg-neutral-900 text-white"
                            : row.level === 2
                            ? "bg-slate-200 text-neutral-900 ml-2"
                            : "bg-slate-100 text-slate-700 border border-slate-300 ml-4"
                        }`}
                      >
                        {row.level === 1
                          ? "L1"
                          : row.level === 2
                          ? "↳ L2"
                          : "↳↳ L3"}
                      </span>
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {row.material_name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {row.bom_item_id} · {row.component_type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Fornitore Albo */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-neutral-800">
                      {row.supplier_name}
                    </div>
                    {vendorObj && (
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-mono text-[10px] text-slate-500">
                          {vendorObj.vendor_code}
                        </span>
                        {vendorObj.has_expired_critical_certs && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            🔴 Cert. LWG/EUDR Scaduto
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 3. Colore Assegnato */}
                  <td className="py-3 px-3 min-w-[230px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-md border border-slate-300 shadow-inner shrink-0"
                        style={{ backgroundColor: row.hex_code || "#E2E8F0" }}
                      />
                      <div className="flex-1">
                        {!isReadOnlySubcontractor ? (
                          <select
                            value={row.master_color_id || ""}
                            onChange={(e) =>
                              handleNodeColorChange(row.bom_item_id, e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white"
                          >
                            <option value="">— Seleziona Tinta —</option>
                            {colors.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.color_code} · {c.technical_name_it}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="font-semibold text-neutral-900">
                            {row.color_code} · {row.technical_name_it}
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {row.hex_code || "—"} · {row.pantone_tcx_code || "Pantone N/D"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 4. Ruolo / Galvanica */}
                  <td className="py-3 px-3">
                    <div className="text-[11px] font-medium text-neutral-800">
                      {PART_ROLE_LABELS[row.part_role] || row.part_role}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {FINISH_TYPE_LABELS[row.galvanics_finish || row.finish_type || ""] ||
                        row.finish_type ||
                        "Standard"}
                    </div>
                  </td>

                  {/* 5. ΔE Spettrofotometro */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1">
                      {!isReadOnlySubcontractor ? (
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="15"
                          value={
                            row.delta_e_value !== null &&
                            row.delta_e_value !== undefined
                              ? row.delta_e_value
                              : ""
                          }
                          onChange={(e) =>
                            handleNodeDeltaEChange(row.bom_item_id, e.target.value)
                          }
                          placeholder="ΔE"
                          className="w-20 px-2 py-1 font-mono text-xs border border-slate-300 rounded-md"
                        />
                      ) : (
                        <span className="font-mono font-bold text-neutral-900">
                          {row.delta_e_value ?? "—"}
                        </span>
                      )}
                      <div>{renderDeltaEBadge(row.delta_e_value)}</div>
                    </div>
                  </td>

                  {/* 6. Stato Tirella / Lab-Dip */}
                  <td className="py-3 px-3 min-w-[210px]">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                    {!isReadOnlySubcontractor && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickLabDipStatus(
                              row.bom_item_id,
                              "master_standard"
                            )
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        >
                          ✓ Approva Master
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickLabDipStatus(
                              row.bom_item_id,
                              "conditional_waiver"
                            )
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                        >
                          Deroga
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickLabDipStatus(row.bom_item_id, "rejected")
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                        >
                          ✕ Rigetta
                        </button>
                      </div>
                    )}
                  </td>

                  {/* 7. Coerenza Lotto Conceria */}
                  <td className="py-3 px-3">
                    {row.tannery_color_consistency === "coherent" ? (
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          🟢 Coerente con Lotto
                        </span>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                          {row.linked_batch_code}
                        </div>
                      </div>
                    ) : row.tannery_color_consistency === "mismatch" ? (
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          🔴 Mismatch Colore Lotto
                        </span>
                        <div className="font-mono text-[10px] text-rose-700 font-semibold mt-0.5">
                          {row.linked_batch_code}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        — Nessun Lotto Collegato
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modale Wizard: 1-Click Colorway Explosion */}
      {isExplosionOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  1-Click Colorway Explosion · Automazione Campionari
                </span>
                <h3 className="text-base font-bold text-neutral-900">
                  ⚡ Esplodi N Varianti Colore da Modello Base ({variant.variant_code})
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Clona istantaneamente l&apos;albero BOM a 3 livelli di{" "}
                  <strong>{parentPimItem?.model_name || variant.colorway_name}</strong>{" "}
                  rimappando automaticamente Tomaia, Fodera, Suola, Filati e Galvaniche.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExplosionOpen(false)}
                className="text-slate-400 hover:text-neutral-900 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-900 mb-2">
                  1. Seleziona le Tinte Tomaia / Corpo da Generare ({selectedExplosionColors.length} selezionate)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {colors.map((c) => {
                    const checked = selectedExplosionColors.includes(c.id);
                    const isCurrentBase = c.id === variant.primary_color_id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleExplosionColor(c.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition ${
                          checked
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                            : "border-slate-200 bg-slate-50 text-neutral-800 hover:bg-slate-100"
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-md border border-white/40 shadow-inner shrink-0"
                          style={{ backgroundColor: c.hex_code }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] font-bold truncate">
                            {c.color_code} {isCurrentBase ? "(Base)" : ""}
                          </div>
                          <div className="font-semibold truncate">
                            {c.technical_name_it}
                          </div>
                        </div>
                        <span className="text-xs font-bold">
                          {checked ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-neutral-900 mb-1">
                    2. Regola di Abbinamento Automatico Componenti BOM
                  </label>
                  <select
                    value={explosionRule}
                    onChange={(e) => setExplosionRule(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {Object.entries(COLORWAY_RULE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-900 mb-1">
                    Fodera Interna Standard (Override Opzionale)
                  </label>
                  <select
                    value={explosionLiningId}
                    onChange={(e) => setExplosionLiningId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Automatica da Regola</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.color_code} · {c.technical_name_it}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-900 mb-1">
                    Fondo / Suola (Override Opzionale)
                  </label>
                  <select
                    value={explosionSoleId}
                    onChange={(e) => setExplosionSoleId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Automatica da Regola</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.color_code} · {c.technical_name_it}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-900 mb-1">
                    Finitura Galvanica Minuterie
                  </label>
                  <select
                    value={explosionHardwareId}
                    onChange={(e) => setExplosionHardwareId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Automatica da Regola</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.color_code} · {c.technical_name_it}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Anteprima Live Varianti */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="font-bold text-neutral-900">
                  3. Anteprima Varianti PLM &amp; Matrici BOM da Generare ({selectedExplosionColors.length})
                </div>
                {selectedExplosionColors.length === 0 ? (
                  <p className="text-slate-500">
                    Seleziona almeno una tinta dalla Cartella Colori per visualizzare l&apos;anteprima.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedExplosionColors.map((cid) => {
                      const col = findMasterColorById(colors, cid);
                      if (!col) return null;
                      const slug = col.color_code
                        .replace(/^COL-/i, "")
                        .slice(0, 6)
                        .toUpperCase();
                      const previewCode = `${variant.variant_code
                        .split("-")
                        .slice(0, 3)
                        .join("-")}-${slug}`;
                      return (
                        <div
                          key={cid}
                          className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{ backgroundColor: col.hex_code }}
                            />
                            <span className="font-mono font-bold text-neutral-900">
                              {previewCode}
                            </span>
                            <span className="text-slate-700">
                              — {col.technical_name_it} ({col.pantone_tcx_code})
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {variant.bom_items.length} Nodi BOM L1/L2/L3 + Lab-Dip Pending
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsExplosionOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={selectedExplosionColors.length === 0 || isExploding}
                  onClick={handleConfirmExplosion}
                  className="px-5 py-2 rounded-lg bg-neutral-900 text-white font-bold hover:bg-neutral-800 disabled:opacity-40 shadow-sm"
                >
                  🚀 Genera {selectedExplosionColors.length} Varianti e Matrici BOM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorwayBomMatrixPanel;
