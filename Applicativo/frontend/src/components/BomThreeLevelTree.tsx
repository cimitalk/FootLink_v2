import React, { useState } from "react";
import { buildBomTree } from "../mockSeedData";
import {
  BomComponentType,
  BomItem,
  BomTreeNode,
  PlmProductionVariant,
} from "../types";

interface BomThreeLevelTreeProps {
  variant: PlmProductionVariant;
  onAddBomItem: (bomItem: BomItem) => void;
}

export const BomThreeLevelTree: React.FC<BomThreeLevelTreeProps> = ({
  variant,
  onAddBomItem,
}) => {
  const tree = buildBomTree(variant.bom_items);
  const [showForm, setShowForm] = useState(false);
  const [level, setLevel] = useState<number>(2);
  const [parentId, setParentId] = useState<string>(
    variant.bom_items[0]?.bom_item_id || ""
  );
  const [compType, setCompType] = useState<BomComponentType>("sub_assembly");
  const [materialName, setMaterialName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [originIso2, setOriginIso2] = useState("IT");
  const [uom, setUom] = useState("pair");
  const [consumption, setConsumption] = useState(1.0);
  const [recycledPct, setRecycledPct] = useState(40);
  const [certsInput, setCertsInput] = useState("LWG Gold, REACH");

  const handleCreateBom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim() || !supplierName.trim()) return;
    const newItem: BomItem = {
      bom_item_id: `BOM-L${level}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      level,
      parent_bom_item_id: level > 1 ? parentId : null,
      component_type: compType,
      material_name: materialName.trim(),
      supplier_name: supplierName.trim(),
      origin_country_iso2: originIso2.toUpperCase().slice(0, 2),
      unit_of_measure: uom,
      unit_consumption: Number(consumption),
      waste_percentage: 4.0,
      recycled_content_pct: Number(recycledPct),
      certifications: certsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onAddBomItem(newItem);
    setMaterialName("");
    setSupplierName("");
    setShowForm(false);
  };

  const renderNode = (node: BomTreeNode) => {
    const badgeColors: Record<number, string> = {
      1: "bg-sky-500/20 text-sky-300 border-sky-500/50",
      2: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      3: "bg-amber-500/20 text-amber-300 border-amber-500/50",
    };
    const levelLabels: Record<number, string> = {
      1: "LIVELLO 1 · Componente Diretto",
      2: "LIVELLO 2 · Sotto-Assieme / Semilavorato",
      3: "LIVELLO 3 · Materia Prima / Chimica / Filato",
    };

    return (
      <div
        key={node.bom_item_id}
        className={`mt-2.5 ${node.level > 1 ? "ml-6 pl-4 border-l-2 border-slate-700" : ""}`}
      >
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                  badgeColors[node.level] || badgeColors[1]
                }`}
              >
                {levelLabels[node.level] || `LIVELLO ${node.level}`}
              </span>
              <span className="text-xs font-mono text-slate-400">
                [{node.bom_item_id}]
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.certifications.map((cert) => (
                <span
                  key={cert}
                  className="text-[11px] bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 px-2 py-0.5 rounded-full font-semibold"
                >
                  ✓ {cert}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="font-bold text-white text-sm">
                {node.material_name}
              </span>
              <span className="text-xs text-slate-400 ml-2">
                · Fornitore: <strong className="text-slate-200">{node.supplier_name}</strong> ({node.origin_country_iso2})
              </span>
            </div>
            <div className="text-xs text-slate-300 flex gap-3">
              <span>
                Consumo:{" "}
                <strong>
                  {node.unit_consumption} {node.unit_of_measure}
                </strong>
              </span>
              <span>
                Sfrido: <strong>{node.waste_percentage}%</strong>
              </span>
              <span className="text-emerald-400 font-bold">
                ♻️ Riciclato: {node.recycled_content_pct}%
              </span>
            </div>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div>{node.children.map((child) => renderNode(child))}</div>
        )}
      </div>
    );
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-950/60 border border-purple-800/60 px-2.5 py-1 rounded-full">
            Multi-Level BOM · 3 Livelli di Profondità
          </span>
          <h3 className="text-lg font-bold text-white mt-2">
            Distinta Base Gerarchica (L1 → L2 → L3) — {variant.colorway_name}
          </h3>
          <p className="text-xs text-slate-400">
            Tracciabilità granulare dal componente principale (Tomaia/Suola/Quadrante) al semilavorato fino alla materia prima di Tier-2/Tier-3.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition"
        >
          + Aggiungi Nodo BOM (L1/L2/L3)
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateBom}
          className="bg-slate-950 border border-purple-800/70 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs"
        >
          <div>
            <label className="block text-slate-400 mb-1">Livello BOM (1-3)</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
            >
              <option value={1}>Livello 1 (Diretto)</option>
              <option value={2}>Livello 2 (Sotto-Assieme)</option>
              <option value={3}>Livello 3 (Materia Prima)</option>
            </select>
          </div>
          {level > 1 && (
            <div>
              <label className="block text-slate-400 mb-1">Nodo Padre (Parent ID)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
              >
                {variant.bom_items
                  .filter((b) => b.level === level - 1)
                  .map((b) => (
                    <option key={b.bom_item_id} value={b.bom_item_id}>
                      [L{b.level}] {b.material_name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-slate-400 mb-1">Nome Materiale / Componente</label>
            <input
              type="text"
              required
              placeholder="es. Contrafforte Termoplastico Riciclato"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Fornitore Certificato</label>
            <input
              type="text"
              required
              placeholder="es. TecnoSuole Marche Srl"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Tipo Componente</label>
            <select
              value={compType}
              onChange={(e) => setCompType(e.target.value as BomComponentType)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
            >
              <option value="upper">Upper (Tomaia/Quadrante)</option>
              <option value="lining">Lining (Fodera)</option>
              <option value="insole">Insole (Sottopiede)</option>
              <option value="outsole">Outsole (Suola)</option>
              <option value="heel">Heel (Tacco)</option>
              <option value="hardware">Hardware (Accessori Metallici)</option>
              <option value="fabric">Fabric (Tessuto/Nastro)</option>
              <option value="sub_assembly">Sub-Assembly (Semilavorato/Chimico)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">% Contenuto Riciclato</label>
            <input
              type="number"
              min={0}
              max={100}
              value={recycledPct}
              onChange={(e) => setRecycledPct(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Certificazioni (separate da virgola)</label>
            <input
              type="text"
              value={certsInput}
              onChange={(e) => setCertsInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-3 rounded-lg"
            >
              Inserisci in BOM
            </button>
          </div>
        </form>
      )}

      <div>{tree.map((rootNode) => renderNode(rootNode))}</div>
    </section>
  );
};
