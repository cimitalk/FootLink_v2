import React, { useEffect, useState } from "react";
import { findMasterColorById } from "../mockSeedData";
import {
  ColorwayMatrixResponse,
  MasterColor,
  PlmProductionVariant,
  ProductionPhase,
  SubcontractorAssignment,
} from "../types";

interface SubcontractorMobilePortalProps {
  variant: PlmProductionVariant;
  colors?: MasterColor[];
  colorwayMatrix?: ColorwayMatrixResponse;
  onConfirmStep: (assignmentId: string, updatedLotCode: string) => void;
  onAddSubcontractor?: (assignment: SubcontractorAssignment) => void;
}

const PHASE_LABELS: Record<ProductionPhase, string> = {
  tanning_material: "1. Concia / Tessitura Materia Prima",
  cutting: "2. Taglio Tomaia / Quadranti / Pezza",
  stitching_upper: "3. Orlatura / Giunteria / Confezione",
  lasting_assembly: "4. Montaggio & Assemblaggio",
  finishing: "5. Finissaggio & Stiratura",
  quality_control: "6. Controllo Qualità & Collaudo DPP",
};

export const SubcontractorMobilePortal: React.FC<
  SubcontractorMobilePortalProps
> = ({
  variant,
  colors = [],
  colorwayMatrix,
  onConfirmStep,
  onAddSubcontractor,
}) => {
  const assignments = variant.subcontractor_assignments;
  const firstPending =
    assignments.find((a) => !a.completed) || assignments[0];

  const [selectedId, setSelectedId] = useState<string>(
    firstPending?.assignment_id || ""
  );
  const [lotCode, setLotCode] = useState<string>(
    firstPending?.material_lot_code || ""
  );
  const [justConfirmedToast, setJustConfirmedToast] = useState<string | null>(
    null
  );
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubDistrict, setNewSubDistrict] = useState("Fermo-Macerata");
  const [newSubPhase, setNewSubPhase] =
    useState<ProductionPhase>("lasting_assembly");
  const [newSubLot, setNewSubLot] = useState("LOT-DIST-2026-901");

  useEffect(() => {
    const nextTarget =
      variant.subcontractor_assignments.find((a) => !a.completed) ||
      variant.subcontractor_assignments[0];
    if (nextTarget) {
      setSelectedId(nextTarget.assignment_id);
      setLotCode(nextTarget.material_lot_code);
    }
  }, [variant]);

  const currentAssign =
    assignments.find((a) => a.assignment_id === selectedId) || assignments[0];

  const handleSelectAssign = (a: SubcontractorAssignment) => {
    setSelectedId(a.assignment_id);
    setLotCode(a.material_lot_code);
    setJustConfirmedToast(null);
  };

  const handleClickConfirm = () => {
    if (!currentAssign) return;
    const finalLot = lotCode.trim() || currentAssign.material_lot_code;
    onConfirmStep(currentAssign.assignment_id, finalLot);
    setJustConfirmedToast(
      `Fase "${PHASE_LABELS[currentAssign.phase]}" confermata in 3 clic a 0 € da ${currentAssign.subcontractor_name}. Passaporto Digitale UE sincronizzato.`
    );
  };

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !onAddSubcontractor) return;
    const created: SubcontractorAssignment = {
      assignment_id: `SUB-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`,
      subcontractor_name: newSubName.trim(),
      district: newSubDistrict.trim(),
      phase: newSubPhase,
      material_lot_code: newSubLot.trim().toUpperCase(),
      completed: false,
      confirmed_at: null,
    };
    onAddSubcontractor(created);
    setNewSubName("");
    setShowInviteForm(false);
  };

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 h-full flex flex-col justify-between space-y-5">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2 pb-4 border-b border-[#E5E5E5]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#707072]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>MODULO 05 · RETE VIRALE TERZISTI A COSTO 0 €</span>
            </div>
            <h3 className="display-title text-2xl sm:text-3xl text-[#111111] mt-1">
              PORTALE MOBILE TERZISTA "3 CLIC A 0 €"
            </h3>
            <p className="text-xs text-[#707072] mt-0.5">
              Zero formazione, zero canone per sempre, nessun costo industriale esposto (L6).
            </p>
          </div>
          {onAddSubcontractor && (
            <button
              type="button"
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="px-4 py-2 rounded-full border border-[#111111] bg-white text-[#111111] text-xs font-semibold hover:bg-[#F5F5F5] transition"
            >
              {showInviteForm ? "Chiudi Invito" : "+ Invita Terzista a 0 €"}
            </button>
          )}
        </div>

        {/* Invite New District Subcontractor Form */}
        {showInviteForm && (
          <form
            onSubmit={handleCreateInvite}
            className="mt-4 bg-[#F5F5F5] border border-[#111111] rounded-2xl p-4 space-y-3"
          >
            <div className="text-xs font-bold uppercase text-[#111111]">
              Genera Magic Link & Bolla QR per Nuovo Laboratorio Terzista (Licenza 0 €)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="Ragione Sociale Laboratorio (es. Tomaificio Stella)"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
              <input
                type="text"
                required
                placeholder="Distretto (es. Fermo-Macerata / Santa Croce)"
                value={newSubDistrict}
                onChange={(e) => setNewSubDistrict(e.target.value)}
                className="bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={newSubPhase}
                onChange={(e) =>
                  setNewSubPhase(e.target.value as ProductionPhase)
                }
                className="bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              >
                {Object.entries(PHASE_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Lotto Pre-assegnato"
                value={newSubLot}
                onChange={(e) => setNewSubLot(e.target.value)}
                className="bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#111111] text-white text-xs font-semibold hover:bg-[#333333] transition"
            >
              Invia Magic Link WhatsApp/QR al Laboratorio (0 € Forever)
            </button>
          </form>
        )}

        {/* Smartphone Simulator Frame (375px Mobile Ergonomics, High Contrast) */}
        <div className="mt-4 mx-auto max-w-[390px] bg-[#F5F5F5] border-2 border-[#111111] rounded-[28px] p-5 space-y-4">
          {/* Phone Top Bar */}
          <div className="flex items-center justify-between text-[11px] text-[#707072] border-b border-[#E5E5E5] pb-2.5">
            <span className="font-bold text-[#111111] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              FOOTLINK MOBILE · 0 €
            </span>
            <span className="mono-code font-semibold text-[#111111]">
              {variant.variant_code}
            </span>
          </div>

          {/* Sprint 8: Tirella Colore & Presidio L6 0,00 € Perpetuo */}
          {(() => {
            const activeColor =
              findMasterColorById(colors, variant.primary_color_id) ||
              findMasterColorById(colors, variant.bom_items?.[0]?.master_color_id);
            const isGateBlocked = colorwayMatrix?.production_gate_blocked;
            return (
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-8 h-8 rounded-xl border border-slate-300 shadow-inner shrink-0"
                      style={{
                        backgroundColor: activeColor?.hex_code || "#141414",
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] font-bold text-[#707072]">
                        {activeColor?.color_code || "COL-STD"} ·{" "}
                        {activeColor?.pantone_tcx_code || "Pantone Master"}
                      </div>
                      <div className="text-xs font-extrabold text-[#111111] truncate">
                        {activeColor?.technical_name_it || variant.colorway_name}
                      </div>
                    </div>
                  </div>

                  {isGateBlocked ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-900 border border-rose-300 shrink-0">
                      🔴 TIRELLA BLOCCATA
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                      ● TIRELLA APPROVATA MASTER
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-[#F0F0F0] text-[10px]">
                  <span className="font-bold text-emerald-800">
                    🤝 0,00 € Canone Perpetuo
                  </span>
                  <span className="font-semibold text-[#707072]">
                    🔒 Zero Costi/Listini Esposti (L6)
                  </span>
                </div>
              </div>
            );
          })()}

          {/* CLIC 1: Select Department / Phase Assignment */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-2">
              FASE 1 (CLIC 1) — Seleziona Reparto & Lavorazione
            </div>
            <div className="space-y-2">
              {assignments.map((a) => {
                const isSelected = a.assignment_id === currentAssign?.assignment_id;
                return (
                  <button
                    key={a.assignment_id}
                    type="button"
                    onClick={() => handleSelectAssign(a)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-[#111111] border-[#111111] text-white"
                        : "bg-white border-[#E5E5E5] text-[#111111] hover:border-[#111111]"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">
                        {a.subcontractor_name}{" "}
                        <span
                          className={
                            isSelected ? "text-white/70" : "text-[#707072]"
                          }
                        >
                          ({a.district})
                        </span>
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isSelected ? "text-white/85" : "text-[#707072]"
                        }`}
                      >
                        {PHASE_LABELS[a.phase] || a.phase}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                        isSelected
                          ? "bg-white text-[#111111]"
                          : "bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5]"
                      }`}
                    >
                      {a.completed && (
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      )}
                      {a.completed ? "CONFERMATO" : "DA CONFERMARE"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CLIC 2: Verify or Scan Material Lot Code */}
          {currentAssign && (
            <div className="bg-white border border-[#E5E5E5] rounded-2xl p-3.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                FASE 2 (CLIC 2) — Verifica Lotto Materiale Certificato
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lotCode}
                  onChange={(e) => setLotCode(e.target.value)}
                  className="flex-1 bg-[#F5F5F5] border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs mono-code font-bold text-[#111111]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLotCode(
                      `${currentAssign.material_lot_code.replace(
                        /-OK$/,
                        ""
                      )}-OK`
                    )
                  }
                  className="px-3.5 py-2 bg-white hover:bg-[#F5F5F5] text-[#111111] rounded-full text-[11px] font-bold border border-[#111111]"
                >
                  QR Scan
                </button>
              </div>
            </div>
          )}

          {/* CLIC 3: Confirm Completion in 1 Tap (>= 56px Touch Target, Pill Shape) */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1.5">
              FASE 3 (CLIC 3) — Conferma Fine Lavorazione & Aggiorna DPP UE
            </div>
            <button
              type="button"
              onClick={handleClickConfirm}
              className="w-full min-h-[56px] py-3.5 px-5 rounded-full bg-[#111111] hover:bg-[#333333] text-white font-bold text-sm transition flex items-center justify-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span>CONFERMA FASE & LOTTO IN 1 TOCCO (0 €)</span>
            </button>
          </div>

          {justConfirmedToast && (
            <div className="bg-white border border-[#111111] text-[#111111] rounded-2xl p-3 text-xs font-medium flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] mt-1 shrink-0" />
              <span>{justConfirmedToast}</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] text-[#707072] text-center pt-2 border-t border-[#E5E5E5]">
        Tempo medio di conferma in manovia: <strong className="text-[#111111]">&lt; 10 secondi</strong>{" "}
        · Canone Terzista: <strong className="text-[#111111]">0,00 € per sempre</strong>
      </div>
    </div>
  );
};
