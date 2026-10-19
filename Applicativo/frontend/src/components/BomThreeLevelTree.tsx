import React, { useState } from "react";
import { buildClientBomTree } from "../mockSeedData";
import {
  BomComponentType,
  BomItem,
  BomTreeNode,
  PimCommercialItem,
  PlmProductionVariant,
  ViewerSecurityRole,
} from "../types";

interface BomThreeLevelTreeProps {
  variant: PlmProductionVariant;
  pimItem?: PimCommercialItem;
  viewerRole?: ViewerSecurityRole;
  onAddBomItem: (bom: BomItem) => void;
}

const LEVEL_TAGS: Record<number, { label: string; desc: string }> = {
  1: { label: "LIVELLO 1", desc: "Macro-Componente / Assieme" },
  2: { label: "LIVELLO 2", desc: "Semilavorato / Materiale" },
  3: { label: "LIVELLO 3", desc: "Materia Prima / Chimico" },
};

export const BomThreeLevelTree: React.FC<BomThreeLevelTreeProps> = ({
  variant,
  pimItem,
  viewerRole = "brand",
  onAddBomItem,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSizeGrading, setShowSizeGrading] = useState(true);
  const [level, setLevel] = useState<number>(2);
  const [parentId, setParentId] = useState<string>(
    variant.bom_items[0]?.bom_item_id || ""
  );
  const [materialName, setMaterialName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [componentType, setComponentType] =
    useState<BomComponentType>("sub_assembly");
  const [originIso, setOriginIso] = useState("IT");
  const [uom, setUom] = useState("sqft");
  const [consumption, setConsumption] = useState<number>(1.2);
  const [wastePct, setWastePct] = useState<number>(4.0);
  const [recycledPct, setRecycledPct] = useState<number>(50);
  const [unitCostEur, setUnitCostEur] = useState<number>(6.5);
  const [certsInput, setCertsInput] = useState("LWG Gold, REACH");

  const tree = buildClientBomTree(variant.bom_items);

  const l1Count = variant.bom_items.filter((b) => b.level === 1).length;
  const l2Count = variant.bom_items.filter((b) => b.level === 2).length;
  const l3Count = variant.bom_items.filter((b) => b.level === 3).length;

  // L6 Costing calculations (visible only to Brand/PMI Owner)
  const materialsCostEur = Number(
    variant.bom_items
      .reduce((acc, b) => {
        const gross = b.unit_consumption * (1 + b.waste_percentage / 100);
        return acc + gross * (b.unit_cost_eur ?? 8.5);
      }, 0)
      .toFixed(2)
  );
  const laborCostEur = variant.standard_labor_cost_eur ?? 29.5;
  const totalIndustrialCostEur = Number((materialsCostEur + laborCostEur).toFixed(2));
  const wholesaleEur = pimItem?.wholesale_price_eur ?? 165;
  const wholesaleMarginPct =
    wholesaleEur > 0
      ? Number((((wholesaleEur - totalIndustrialCostEur) / wholesaleEur) * 100).toFixed(1))
      : 0;

  // Size grading simulation across 5 reference sizes
  const basePrimaryBom = variant.bom_items[0];
  const stepPct = variant.size_grading_step_pct ?? 2.8;
  const gradingSizes =
    pimItem?.category === "leather_goods"
      ? [{ size: "OS (Standard)", deltaSteps: 0 }]
      : pimItem?.category === "apparel"
      ? [
          { size: "IT 46", deltaSteps: -2 },
          { size: "IT 48", deltaSteps: -1 },
          { size: "IT 50 (Base)", deltaSteps: 0 },
          { size: "IT 52", deltaSteps: 1 },
          { size: "IT 54", deltaSteps: 2 },
        ]
      : [
          { size: "EU 39", deltaSteps: -3 },
          { size: "EU 40", deltaSteps: -2 },
          { size: "EU 42 (Base)", deltaSteps: 0 },
          { size: "EU 44", deltaSteps: 2 },
          { size: "EU 46", deltaSteps: 4 },
        ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim() || !supplierName.trim()) return;
    const newItem: BomItem = {
      bom_item_id: `BOM-L${level}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`,
      level,
      parent_bom_item_id:
        level > 1
          ? parentId || variant.bom_items[0]?.bom_item_id || null
          : null,
      component_type: componentType,
      material_name: materialName.trim(),
      supplier_name: supplierName.trim(),
      origin_country_iso2: originIso.trim().toUpperCase().slice(0, 2) || "IT",
      unit_of_measure: uom.trim() || "pcs",
      unit_consumption: Number(consumption) || 1.0,
      waste_percentage: Number(wastePct) || 3.0,
      recycled_content_pct: Number(recycledPct) || 0,
      certifications: certsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      unit_cost_eur: Number(unitCostEur) || 6.5,
      lot_certificate_id: `CERT-ESPR-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    onAddBomItem(newItem);
    setMaterialName("");
    setSupplierName("");
    setShowAddForm(false);
  };

  const renderNode = (node: BomTreeNode, depth = 0): React.ReactNode => {
    const tag = LEVEL_TAGS[node.level] || LEVEL_TAGS[3];
    const grossConsumption = (
      node.unit_consumption *
      (1 + node.waste_percentage / 100)
    ).toFixed(2);
    const lineCost = (
      Number(grossConsumption) * (node.unit_cost_eur ?? 8.5)
    ).toFixed(2);

    return (
      <div
        key={node.bom_item_id}
        className={`${
          depth > 0 ? "ml-4 sm:ml-7 pl-4 border-l-2 border-[#111111] mt-3" : "mt-3"
        }`}
      >
        <div className="p-4 rounded-2xl border border-[#E5E5E5] bg-[#F5F5F5] hover:border-[#111111] transition">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#111111] text-white">
                {tag.label} · {tag.desc}
              </span>
              <span className="mono-code text-xs text-[#707072]">
                {node.bom_item_id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-white border border-[#E5E5E5] px-2.5 py-0.5 rounded-full text-[#111111] font-semibold">
                Origine: <strong>{node.origin_country_iso2}</strong>
              </span>
              <span className="bg-white border border-[#E5E5E5] px-2.5 py-0.5 rounded-full text-[#111111] font-semibold">
                Riciclato: {node.recycled_content_pct}%
              </span>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-[#111111]">
                {node.material_name}
              </div>
              <div className="text-xs text-[#707072]">
                Fornitore: <span className="text-[#111111] font-semibold">{node.supplier_name}</span>{" "}
                · Cert ID:{" "}
                <span className="mono-code text-[11px]">
                  {node.lot_certificate_id || "CERT-LWG-2026"}
                </span>
              </div>
            </div>

            <div className="text-right text-xs text-[#707072]">
              <div>
                Netto:{" "}
                <strong className="mono-code text-[#111111]">
                  {node.unit_consumption} {node.unit_of_measure}
                </strong>{" "}
                (+{node.waste_percentage}% scarto ={" "}
                <strong className="mono-code text-[#111111]">
                  {grossConsumption} {node.unit_of_measure}
                </strong>
                )
              </div>
              {viewerRole === "brand" ? (
                <div className="mono-code text-[11px] font-bold text-[#111111] mt-0.5">
                  Costo L6: € {(node.unit_cost_eur ?? 8.5).toFixed(2)}/{node.unit_of_measure} →{" "}
                  <strong>€ {lineCost}</strong>
                </div>
              ) : (
                <div className="mono-code text-[11px] text-[#707072] mt-0.5">
                  🔒 Costo Unitario Oscurato (Vista Terzista 0 €)
                </div>
              )}
            </div>
          </div>

          {node.certifications.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {node.certifications.map((cert) => (
                <span
                  key={cert}
                  className="text-[10px] bg-white border border-[#E5E5E5] text-[#111111] px-2.5 py-0.5 rounded-full font-semibold"
                >
                  ✓ {cert}
                </span>
              ))}
            </div>
          )}
        </div>

        {node.children.length > 0 && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 h-full flex flex-col justify-between space-y-5">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E5E5E5]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#707072]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>MODULO 03 · INGEGNERIA DISTINTA BASE & COSTING L6</span>
            </div>
            <h3 className="display-title text-2xl sm:text-3xl text-[#111111] mt-1">
              ALBERO BOM A 3 LIVELLI ({variant.variant_code})
            </h3>
            <p className="text-xs text-[#707072] mt-0.5">
              Gerarchia industriale L1 → L2 → L3 con sviluppo consumi su scala taglie e
              segregazione costi L6.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSizeGrading(!showSizeGrading)}
              className="px-4 py-2 rounded-full border border-[#CCCCCC] bg-white text-[#111111] text-xs font-semibold hover:border-[#111111] transition"
            >
              {showSizeGrading ? "Nascondi Scala Taglie" : "Mostra Scala Taglie"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 rounded-full bg-[#111111] text-white text-xs font-semibold hover:bg-[#333333] transition"
            >
              {showAddForm ? "Chiudi" : "+ Nodo BOM (L1/L2/L3)"}
            </button>
          </div>
        </div>

        {/* L6 Cost Segregation Banner & Industrial Cost Sheet */}
        <div className="mt-4 bg-[#111111] text-white rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/15">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              FOGLIO COSTI INDUSTRIALI & SEGREGAZIONE L6 (ADR-006)
            </span>
            <span className="mono-code text-[11px] bg-white text-[#111111] px-3 py-0.5 rounded-full font-bold">
              {viewerRole === "brand"
                ? "RUOLO: BRAND / PMI OWNER (AUTORIZZATO L6)"
                : "RUOLO: LABORATORIO TERZISTA 0 € (COSTI OSCURATI)"}
            </span>
          </div>

          {viewerRole === "brand" ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div>
                <div className="text-[10px] uppercase text-white/60 font-semibold">
                  Costo Materiali BOM
                </div>
                <div className="display-title text-2xl text-white">
                  € {materialsCostEur.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-white/60 font-semibold">
                  Manodopera / Façon
                </div>
                <div className="display-title text-2xl text-white">
                  € {laborCostEur.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-white/60 font-semibold">
                  Costo Industriale Tot.
                </div>
                <div className="display-title text-2xl text-white">
                  € {totalIndustrialCostEur.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-white/60 font-semibold">
                  Margine Lordo B2B
                </div>
                <div className="display-title text-2xl text-white">
                  {wholesaleMarginPct}% (su € {wholesaleEur})
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-3 text-xs text-white/85">
              🔒 <strong>Protezione Riservatezza B2B (Livello L6):</strong> I costi unitari dei
              materiali, i compensi di lavorazione e i margini del Brand sono oscurati. Il
              laboratorio terzista visualizza esclusivamente i consumi fisici netti/lordi e i
              lotti da confermare a 0 €.
            </div>
          )}
        </div>

        {/* Size Grading Consumption Table */}
        {showSizeGrading && basePrimaryBom && (
          <div className="mt-4 bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111]">
                SVILUPPO CONSUMI PER SCALA TAGLIE ({basePrimaryBom.material_name})
              </span>
              <span className="mono-code text-[11px] text-[#707072]">
                Step Grading: +{stepPct}% / taglia · Sfrido: +{basePrimaryBom.waste_percentage}%
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {gradingSizes.map((g) => {
                const factor = 1 + (g.deltaSteps * stepPct) / 100;
                const netVal = (basePrimaryBom.unit_consumption * factor).toFixed(2);
                const grossVal = (
                  basePrimaryBom.unit_consumption *
                  factor *
                  (1 + basePrimaryBom.waste_percentage / 100)
                ).toFixed(2);
                return (
                  <div
                    key={g.size}
                    className="bg-white border border-[#E5E5E5] rounded-xl p-2.5 text-center"
                  >
                    <div className="text-[11px] font-bold text-[#111111]">{g.size}</div>
                    <div className="mono-code text-xs font-bold text-[#111111] mt-1">
                      {grossVal} {basePrimaryBom.unit_of_measure}
                    </div>
                    <div className="text-[10px] text-[#707072]">
                      Netto: {netVal} {basePrimaryBom.unit_of_measure}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Level Summary Pills */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-[#707072] font-bold uppercase">
              Livello 1 (Assiemi)
            </div>
            <div className="display-title text-2xl text-[#111111]">{l1Count}</div>
          </div>
          <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-[#707072] font-bold uppercase">
              Livello 2 (Semilavorati)
            </div>
            <div className="display-title text-2xl text-[#111111]">{l2Count}</div>
          </div>
          <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-[#707072] font-bold uppercase">
              Livello 3 (Materie Prime)
            </div>
            <div className="display-title text-2xl text-[#111111]">{l3Count}</div>
          </div>
        </div>

        {/* Add BOM Item Form */}
        {showAddForm && (
          <form
            onSubmit={handleAdd}
            className="mt-4 bg-[#F5F5F5] border border-[#111111] rounded-2xl p-4 space-y-3"
          >
            <div className="text-xs font-bold text-[#111111] uppercase">
              Aggiungi Componente alla Distinta Base ({variant.variant_code})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#707072] mb-1">
                  Livello BOM (1, 2 o 3)
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                >
                  <option value={1}>Livello 1 — Macro-Componente</option>
                  <option value={2}>Livello 2 — Semilavorato</option>
                  <option value={3}>Livello 3 — Materia Prima</option>
                </select>
              </div>

              {level > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] mb-1">
                    Nodo Padre (Livello {level - 1})
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                  >
                    {variant.bom_items
                      .filter((b) => b.level === level - 1)
                      .map((b) => (
                        <option key={b.bom_item_id} value={b.bom_item_id}>
                          {b.bom_item_id} ({b.material_name.slice(0, 22)})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#707072] mb-1">
                  Tipo Componente
                </label>
                <select
                  value={componentType}
                  onChange={(e) =>
                    setComponentType(e.target.value as BomComponentType)
                  }
                  className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                >
                  <option value="upper">upper (Tomaia / Quadrante)</option>
                  <option value="lining">lining (Fodera)</option>
                  <option value="insole">insole (Sottopiede)</option>
                  <option value="outsole">outsole (Suola)</option>
                  <option value="heel">heel (Tacco)</option>
                  <option value="hardware">hardware (Accessori / Galvanica)</option>
                  <option value="fabric">fabric (Tessuto / Filato)</option>
                  <option value="sub_assembly">sub_assembly (Sotto-assieme)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="Nome Materiale (es. Guardolo Cuoio Vegetale)"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                className="bg-white border border-[#CCCCCC] rounded-xl px-3 py-1.5 text-xs text-[#111111]"
              />
              <input
                type="text"
                required
                placeholder="Fornitore (es. Cuoificio Santa Croce Srl)"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="bg-white border border-[#CCCCCC] rounded-xl px-3 py-1.5 text-xs text-[#111111]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="ISO2 (IT)"
                value={originIso}
                onChange={(e) => setOriginIso(e.target.value)}
                className="bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
              />
              <input
                type="text"
                placeholder="UdM (sqft/m/pair)"
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
              />
              <input
                type="number"
                step="0.05"
                placeholder="Consumo"
                value={consumption}
                onChange={(e) => setConsumption(Number(e.target.value))}
                className="bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
              />
              <input
                type="number"
                step="0.5"
                placeholder="% Riciclato"
                value={recycledPct}
                onChange={(e) => setRecycledPct(Number(e.target.value))}
                className="bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
              />
              <input
                type="number"
                step="0.5"
                placeholder="Costo € (L6)"
                value={unitCostEur}
                onChange={(e) => setUnitCostEur(Number(e.target.value))}
                className="bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                placeholder="Certificazioni (separate da virgola)"
                value={certsInput}
                onChange={(e) => setCertsInput(e.target.value)}
                className="flex-1 bg-white border border-[#CCCCCC] rounded-xl px-3 py-1.5 text-xs text-[#111111]"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#111111] text-white font-semibold text-xs hover:bg-[#333333] transition"
              >
                Salva Nodo BOM
              </button>
            </div>
          </form>
        )}

        {/* Tree Render */}
        <div className="mt-2">{tree.map((rootNode) => renderNode(rootNode, 0))}</div>
      </div>
    </div>
  );
};
