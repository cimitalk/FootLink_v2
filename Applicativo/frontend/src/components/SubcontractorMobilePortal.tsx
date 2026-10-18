import React, { useEffect, useState } from "react";
import { PlmProductionVariant, SubcontractorAssignment } from "../types";

interface SubcontractorMobilePortalProps {
  variant: PlmProductionVariant;
  onConfirmStep: (assignmentId: string, updatedLotCode: string) => void;
}

const PHASE_LABELS: Record<string, string> = {
  tanning_material: "Concia & Pelle",
  cutting: "Taglio / Tranceria",
  stitching_upper: "Orlatura / Tomaificio",
  lasting_assembly: "Montaggio / Suolatura",
  finishing: "Finissaggio & Spazzolatura",
  quality_control: "Controllo Qualità Finale",
};

export const SubcontractorMobilePortal: React.FC<
  SubcontractorMobilePortalProps
> = ({ variant, onConfirmStep }) => {
  const assignments = variant.subcontractor_assignments;
  const [selectedAssignment, setSelectedAssignment] =
    useState<SubcontractorAssignment | null>(assignments[0] || null);
  const [clickStep, setClickStep] = useState<number>(1);
  const [lotCodeInput, setLotCodeInput] = useState<string>(
    assignments[0]?.material_lot_code || ""
  );
  const [justConfirmed, setJustConfirmed] = useState<boolean>(false);

  useEffect(() => {
    const firstPending =
      assignments.find((a) => !a.completed) || assignments[0] || null;
    setSelectedAssignment(firstPending);
    setLotCodeInput(firstPending?.material_lot_code || "");
    setClickStep(1);
    setJustConfirmed(false);
  }, [variant.plm_variant_id]);

  const handleSelectPhaseClick1 = (assign: SubcontractorAssignment) => {
    setSelectedAssignment(assign);
    setLotCodeInput(assign.material_lot_code);
    setClickStep(2);
    setJustConfirmed(false);
  };

  const handleVerifyLotClick2 = () => {
    setClickStep(3);
  };

  const handleConfirmCompletionClick3 = () => {
    if (!selectedAssignment) return;
    onConfirmStep(selectedAssignment.assignment_id, lotCodeInput.trim());
    setJustConfirmed(true);
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/70 border border-emerald-800/70 px-2.5 py-1 rounded-full">
              Zero-Training UX · Costo Licenza Terzista 0,00 €
            </span>
            <h3 className="text-lg font-bold text-white mt-2">
              Portale Mobile Terzista "3 Clic a 0 €"
            </h3>
            <p className="text-xs text-slate-400">
              Simulatore Smartphone per Tomaifici, Suolifici, Concerie e Pelletterie dei distretti italiani.
            </p>
          </div>
        </div>

        {/* Smartphone Bezel Simulator */}
        <div className="max-w-sm mx-auto bg-slate-950 border-4 border-slate-700 rounded-[32px] p-4 shadow-2xl">
          {/* Top Speaker Bar */}
          <div className="w-16 h-1.5 bg-slate-700 rounded-full mx-auto mb-3" />

          <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span>📱 Footlink Terzista Web-App</span>
              <span className="text-emerald-400 font-bold">FREE 0 €</span>
            </div>

            {/* 3-Click Progress Stepper */}
            <div className="grid grid-cols-3 gap-1.5 mb-4 text-center text-[11px] font-bold">
              <div
                className={`py-1.5 rounded-lg border ${
                  clickStep >= 1
                    ? "bg-sky-500/20 border-sky-500 text-sky-300"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                }`}
              >
                1. Scegli Fase
              </div>
              <div
                className={`py-1.5 rounded-lg border ${
                  clickStep >= 2
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                }`}
              >
                2. Lotto Pelle
              </div>
              <div
                className={`py-1.5 rounded-lg border ${
                  clickStep >= 3 || justConfirmed
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                }`}
              >
                3. Conferma
              </div>
            </div>

            {/* Step 1: Select Subcontractor Assignment */}
            <div className="space-y-2 mb-3">
              <div className="text-xs font-bold text-slate-300">
                CLIC 1 · Seleziona Lavorazione Assegnata:
              </div>
              {assignments.map((assign) => {
                const isSelected =
                  selectedAssignment?.assignment_id === assign.assignment_id;
                return (
                  <button
                    key={assign.assignment_id}
                    type="button"
                    onClick={() => handleSelectPhaseClick1(assign)}
                    className={`w-full text-left p-2.5 rounded-xl border transition text-xs ${
                      isSelected
                        ? "bg-sky-950/70 border-sky-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{assign.subcontractor_name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          assign.completed
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                            : "bg-amber-950 text-amber-300 border border-amber-700"
                        }`}
                      >
                        {assign.completed ? "✓ Completato" : "⏳ Da Confermare"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      📍 {assign.district} ·{" "}
                      {PHASE_LABELS[assign.phase] || assign.phase}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step 2: Verify/Update Material Batch Lot Code */}
            {selectedAssignment && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-3">
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  CLIC 2 · Verifica / Scansiona Lotto Materiale:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lotCodeInput}
                    onChange={(e) => {
                      setLotCodeInput(e.target.value);
                      setClickStep(2);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyLotClick2}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg"
                  >
                    Valida Lotto
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: 1-Tap Confirm */}
            {selectedAssignment && (
              <button
                type="button"
                onClick={handleConfirmCompletionClick3}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition"
              >
                ✓ CLIC 3 · Conferma Fase & Aggiorna DPP UE (0 €)
              </button>
            )}

            {justConfirmed && (
              <div className="mt-3 bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs p-2.5 rounded-xl text-center font-semibold">
                🎉 Fase confermata in 3 clic! Passaporto Digitale UE aggiornato in tempo reale.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
