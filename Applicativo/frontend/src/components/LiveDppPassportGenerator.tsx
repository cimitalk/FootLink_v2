import React, { useState } from "react";
import { generateSvgQrMarkup } from "../mockSeedData";
import { DigitalProductPassport, PimCommercialItem } from "../types";

interface LiveDppPassportGeneratorProps {
  pimItem: PimCommercialItem;
  dpp: DigitalProductPassport;
}

const CHECKLIST_LABELS: Record<string, string> = {
  unique_product_identifier: "Identificativo Univoco UE (SKU + DPP ID)",
  one_pim_to_n_plm_bridge: "Copertura Ponte 1 PIM ↔ N Varianti PLM",
  multilevel_bom_traceability: "Distinta Base (BOM) Multi-Livello L1→L2→L3",
  district_tier1_tier2_confirmed: "Tracciabilità Terzisti Distretto (Tier 1 & Tier 2)",
  chemical_reach_compliance: "Conformità Chimica UE REACH / LWG",
  circularity_and_repairability: "Metriche Riciclato & Indice Riparabilità ESPR",
};

export const LiveDppPassportGenerator: React.FC<
  LiveDppPassportGeneratorProps
> = ({ pimItem, dpp }) => {
  const [showPublicPassportModal, setShowPublicPassportModal] = useState(false);
  const svgMarkup = generateSvgQrMarkup(dpp.sku_code, dpp.dpp_id);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-300 bg-sky-950/70 border border-sky-800/70 px-2.5 py-1 rounded-full">
            FTL-TECH-003 · Regolamento UE ESPR Digital Product Passport
          </span>
          <h3 className="text-lg font-bold text-white mt-2">
            Generatore Live Passaporto Digitale del Prodotto (DPP UE) & QR Code Navigabile
          </h3>
          <p className="text-xs text-slate-400">
            Sintesi istantanea dai dati 1 PIM ↔ {dpp.total_plm_variants_covered} PLM, BOM a 3 livelli e conferme terzisti a 0 €. Clicca sul QR Code per aprire la vista pubblica consumatore/dogana.
          </p>
        </div>
        <button
          onClick={() => setShowPublicPassportModal(true)}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition"
        >
          🔍 Apri Passaporto Pubblico UE (Simula Scansione QR)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Navigable SVG QR Code Card */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center flex flex-col items-center">
          <div
            onClick={() => setShowPublicPassportModal(true)}
            title="Clicca per aprire il Passaporto Digitale Pubblico UE"
            className="cursor-pointer transform hover:scale-105 transition p-2 bg-white rounded-2xl shadow-lg"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
          <div className="mt-3 text-xs font-mono text-sky-400 font-bold">
            {dpp.dpp_id}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            URL Pubblico: <code className="text-slate-200">{dpp.public_qr_url}</code>
          </div>
          <button
            onClick={() => setShowPublicPassportModal(true)}
            className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold py-2 px-3 rounded-lg border border-slate-700"
          >
            🔗 Naviga QR Code ({dpp.qr_target_url})
          </button>
        </div>

        {/* Right: ESPR Metrics, BOM Summary & Checklist */}
        <div className="lg:col-span-8 space-y-4">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Varianti PLM Coperte</div>
              <div className="text-lg font-extrabold text-white">
                1 ↔ {dpp.total_plm_variants_covered}
              </div>
              <div className="text-[10px] text-sky-400">
                BOM: {dpp.bom_hierarchy_summary.total_components} nodi (3 liv.)
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Contenuto Riciclato</div>
              <div className="text-lg font-extrabold text-emerald-400">
                {dpp.average_recycled_content_pct}%
              </div>
              <div className="text-[10px] text-slate-400">Media ponderata BOM</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Impronta Carbonio</div>
              <div className="text-lg font-extrabold text-sky-400">
                {dpp.carbon_footprint_estimate_kg} kg
              </div>
              <div className="text-[10px] text-slate-400">CO₂e stimata / unità</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Indice Riparabilità</div>
              <div className="text-lg font-extrabold text-purple-400">
                {dpp.repairability_index} / 10
              </div>
              <div className="text-[10px] text-emerald-400">
                {dpp.completed_subcontractor_steps_count}/{dpp.total_subcontractor_steps_count} Fasi OK
              </div>
            </div>
          </div>

          {/* ESPR Compliance Checklist */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-200">
                Checklist Conformità Regolamento UE ESPR ({dpp.regulation_standard})
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  dpp.dpp_compliance_ready
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                    : "bg-amber-950 text-amber-300 border border-amber-700"
                }`}
              >
                {dpp.dpp_compliance_ready ? "✓ PRONTO PER DOGANA & RETAIL UE" : "In Completamento"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(dpp.espr_compliance_checklist).map(([key, ok]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800"
                >
                  <span className={ok ? "text-emerald-400 font-bold" : "text-amber-400"}>
                    {ok ? "✓" : "⏳"}
                  </span>
                  <span className="text-slate-300">
                    {CHECKLIST_LABELS[key] || key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Supply Chain Steps Timeline */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-200 mb-2.5">
              Filiera Tracciata nei Distretti Italiani ({dpp.traceable_subcontractors_count} Laboratori Partner a 0 €)
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {dpp.supply_chain_steps.map((step) => (
                <div
                  key={`${step.plm_variant_id}-${step.assignment_id}`}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-900 px-3 py-2 rounded-lg border border-slate-800"
                >
                  <div>
                    <span className="font-bold text-white">{step.subcontractor}</span>
                    <span className="text-slate-400 ml-1.5">
                      ({step.district}) · Variante: <code className="text-sky-300">{step.variant_code}</code>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-950 px-2 py-0.5 rounded text-[11px] text-amber-300 border border-slate-800">
                      {step.material_lot_code}
                    </code>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        step.completed
                          ? "bg-emerald-950 text-emerald-300"
                          : "bg-amber-950 text-amber-300"
                      }`}
                    >
                      {step.completed ? "✓ Verificato" : "⏳ In Corso"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Public EU Digital Product Passport Modal (Simulates Scanning/Clicking the QR Code) */}
      {showPublicPassportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-300">
            <div className="bg-gradient-to-r from-blue-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-sky-400 font-bold">
                  🇪🇺 EU ESPR Digital Product Passport · Vista Pubblica QR Code
                </div>
                <h3 className="text-xl font-extrabold mt-1">
                  {pimItem.model_name} ({pimItem.sku_code})
                </h3>
                <div className="text-xs text-slate-300">
                  ID Passaporto: {dpp.dpp_id} · Brand Tenant: {dpp.brand_tenant_id}
                </div>
              </div>
              <button
                onClick={() => setShowPublicPassportModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                ✕ Chiudi
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-slate-600 leading-relaxed">
                {pimItem.commercial_description_it}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-500">Paesi d'Origine</div>
                  <div className="text-base font-extrabold text-slate-900">
                    {dpp.countries_of_origin.join(", ")}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-500">Contenuto Riciclato</div>
                  <div className="text-base font-extrabold text-emerald-700">
                    {dpp.average_recycled_content_pct}%
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-500">Carbon Footprint</div>
                  <div className="text-base font-extrabold text-sky-700">
                    {dpp.carbon_footprint_estimate_kg} kg CO₂e
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-500">Riparabilità UE</div>
                  <div className="text-base font-extrabold text-purple-700">
                    {dpp.repairability_index} / 10
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  Certificazioni di Filiera Verificate
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {dpp.certifications_verified.map((c) => (
                    <span
                      key={c}
                      className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full font-semibold"
                    >
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  Tracciabilità Lotti & Distretti Manifatturieri ({dpp.completed_subcontractor_steps_count}/{dpp.total_subcontractor_steps_count} fasi confermate)
                </h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 text-xs">
                  {dpp.supply_chain_steps.map((s) => (
                    <div
                      key={`${s.plm_variant_id}-${s.assignment_id}`}
                      className="p-2.5 flex items-center justify-between"
                    >
                      <div>
                        <strong>{s.subcontractor}</strong> — {s.district}
                        <div className="text-slate-500">
                          Fase: {s.phase} · Variante: {s.variant_code}
                        </div>
                      </div>
                      <div className="text-right">
                        <code className="bg-slate-100 px-2 py-0.5 rounded font-mono">
                          {s.material_lot_code}
                        </code>
                        <div
                          className={`font-bold mt-0.5 ${
                            s.completed ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {s.completed ? "✓ Lotto Certificato" : "⏳ In Lavorazione"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
