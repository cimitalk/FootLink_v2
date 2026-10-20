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
  onUpdateBomItem?: (bom: BomItem) => void;
  onDeleteBomItem?: (bomItemId: string) => void;
  onMoveBomItem?: (bomItemId: string, newLevel: number, newParentId: string | null) => void;
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
  onUpdateBomItem,
  onDeleteBomItem,
  onMoveBomItem,
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

  // FTL-TECH-014: Edit Modal State
  const [editingItem, setEditingItem] = useState<BomItem | null>(null);
  const [editMaterialName, setEditMaterialName] = useState("");
  const [editSupplierName, setEditSupplierName] = useState("");
  const [editComponentType, setEditComponentType] = useState<BomComponentType>("upper");
  const [editOriginIso, setEditOriginIso] = useState("IT");
  const [editUom, setEditUom] = useState("dm2");
  const [editConsumption, setEditConsumption] = useState<number>(1.0);
  const [editWastePct, setEditWastePct] = useState<number>(3.0);
  const [editRecycledPct, setEditRecycledPct] = useState<number>(0);
  const [editUnitCostEur, setEditUnitCostEur] = useState<number>(8.5);
  const [editCertsInput, setEditCertsInput] = useState("");

  // FTL-TECH-014: Move Modal State
  const [movingItem, setMovingItem] = useState<BomItem | null>(null);
  const [moveTargetLevel, setMoveTargetLevel] = useState<number>(1);
  const [moveTargetParentId, setMoveTargetParentId] = useState<string>("");

  // FTL-TECH-014: Delete Confirmation State
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

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

  // FTL-TECH-014: Edit, Move, Delete handlers
  const openEditModal = (item: BomItem) => {
    setEditingItem(item);
    setEditMaterialName(item.material_name);
    setEditSupplierName(item.supplier_name);
    setEditComponentType(item.component_type);
    setEditOriginIso(item.origin_country_iso2 || "IT");
    setEditUom(item.unit_of_measure || "dm2");
    setEditConsumption(item.unit_consumption);
    setEditWastePct(item.waste_percentage);
    setEditRecycledPct(item.recycled_content_pct);
    setEditUnitCostEur(item.unit_cost_eur ?? 8.5);
    setEditCertsInput((item.certifications || []).join(", "));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updated: BomItem = {
      ...editingItem,
      material_name: editMaterialName.trim(),
      supplier_name: editSupplierName.trim(),
      component_type: editComponentType,
      origin_country_iso2: editOriginIso.trim().toUpperCase().slice(0, 2) || "IT",
      unit_of_measure: editUom.trim() || "pcs",
      unit_consumption: Number(editConsumption) || 1.0,
      waste_percentage: Number(editWastePct) || 0,
      recycled_content_pct: Number(editRecycledPct) || 0,
      unit_cost_eur: Number(editUnitCostEur) || 0,
      certifications: editCertsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (onUpdateBomItem) {
      onUpdateBomItem(updated);
    }
    setEditingItem(null);
  };

  const openMoveModal = (item: BomItem) => {
    setMovingItem(item);
    setMoveTargetLevel(item.level);
    setMoveTargetParentId(item.parent_bom_item_id || "");
  };

  const handleSaveMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingItem) return;
    if (moveTargetLevel > 1 && !moveTargetParentId) {
      alert("Per i livelli 2 e 3 è obbligatorio selezionare un nodo genitore!");
      return;
    }
    if (onMoveBomItem) {
      onMoveBomItem(
        movingItem.bom_item_id,
        moveTargetLevel,
        moveTargetLevel === 1 ? null : moveTargetParentId
      );
    }
    setMovingItem(null);
  };

  const handleConfirmDelete = (itemId: string) => {
    if (onDeleteBomItem) {
      onDeleteBomItem(itemId);
    }
    setDeletingItemId(null);
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

          {/* Action buttons: Edit, Move, Delete (FTL-TECH-014) */}
          <div className="mt-3 pt-2.5 border-t border-[#E5E5E5] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-[11px] text-[#707072] flex items-center gap-2">
              <span>ID: <strong className="mono-code text-[#111111]">{node.bom_item_id}</strong></span>
              {node.children.length > 0 && (
                <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[10px] border border-emerald-300">
                  {node.children.length} sotto-elementi
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openEditModal(node)}
                title="Modifica parametri elemento BOM"
                className="px-2.5 py-1 rounded-lg border border-[#D5D5D5] bg-white hover:border-[#111111] hover:bg-[#F9F9F9] text-[#111111] text-[11px] font-semibold flex items-center gap-1 transition shadow-2xs"
              >
                ✏️ <span>Modifica</span>
              </button>
              <button
                type="button"
                onClick={() => openMoveModal(node)}
                title="Sposta o riassegna livello gerarchico"
                className="px-2.5 py-1 rounded-lg border border-[#D5D5D5] bg-white hover:border-[#111111] hover:bg-[#F9F9F9] text-[#111111] text-[11px] font-semibold flex items-center gap-1 transition shadow-2xs"
              >
                🔀 <span>Sposta</span>
              </button>
              <button
                type="button"
                onClick={() => setDeletingItemId(node.bom_item_id)}
                title="Elimina questo elemento e relativi figli"
                className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold flex items-center gap-1 transition shadow-2xs"
              >
                🗑️ <span>Elimina</span>
              </button>
            </div>
          </div>
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
            className="mt-4 bg-[#F9F9F9] border-2 border-[#111111] rounded-2xl p-5 space-y-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E5E5]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Nuovo Componente Distinta Base
                </span>
                <h4 className="text-sm font-extrabold text-[#111111] mt-1">
                  Aggiungi Nodo alla Distinta Base ({variant.variant_code})
                </h4>
              </div>
              <span className="text-xs text-[#707072]">
                Gerarchia L1 (Assieme) → L2 (Semilavorato) → L3 (Materia Prima)
              </span>
            </div>

            {/* Step 1: Gerarchia & Tipologia */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  1. Livello Gerarchico BOM *
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value={1}>Livello 1 — Macro-Componente / Assieme (Tomaia, Suola, Fodera)</option>
                  <option value={2}>Livello 2 — Semilavorato (Fodera vitello, Sottopiede cuoio)</option>
                  <option value={3}>Livello 3 — Materia Prima / Chimico (Filo, Collante, Tintura)</option>
                </select>
                <p className="text-[10px] text-[#707072] mt-0.5">Profondità nell'albero distinta base</p>
              </div>

              {level > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-[#111111] mb-1">
                    2. Componente Padre (Livello {level - 1}) *
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    {variant.bom_items
                      .filter((b) => b.level === level - 1)
                      .map((b) => (
                        <option key={b.bom_item_id} value={b.bom_item_id}>
                          {b.bom_item_id} · {b.material_name}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-[#707072] mt-0.5">Aggancia il nodo al genitore superiore</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  {level > 1 ? "3." : "2."} Tipo Componente Tecnico *
                </label>
                <select
                  value={componentType}
                  onChange={(e) =>
                    setComponentType(e.target.value as BomComponentType)
                  }
                  className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="upper">Tomaia / Taglio Principale (upper)</option>
                  <option value="lining">Fodera Interna (lining)</option>
                  <option value="insole">Sottopiede / Fusetto (insole)</option>
                  <option value="outsole">Suola / Battistrada (outsole)</option>
                  <option value="heel">Tacco / Sopratacco (heel)</option>
                  <option value="hardware">Minuteria Metallica / Galvanica (hardware)</option>
                  <option value="fabric">Tessuto / Nastro / Stringhe (fabric)</option>
                  <option value="packaging">Packaging & Scatola (packaging)</option>
                  <option value="sub_assembly">Sotto-Assieme Lavorato (sub_assembly)</option>
                </select>
                <p className="text-[10px] text-[#707072] mt-0.5">Classificazione per passaporto DPP</p>
              </div>
            </div>

            {/* Step 2: Dati Materiale e Fornitore */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Nome Materiale &amp; Specifiche Tecniche *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Vitello Pieno Fiore Concia Minerale 1.3-1.5mm"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Fornitore / Conceria Accreditata *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Conceria del Chienti SpA"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            {/* Step 3: Indicatori di Consumo & Costing con etichette chiare */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-3.5 space-y-3">
              <div className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                Parametri di Consumo, Sfrido Industriale e Costing L6
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                    Paese Origine
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="IT"
                    value={originIso}
                    onChange={(e) => setOriginIso(e.target.value.toUpperCase())}
                    className="w-full bg-[#FAFAFA] border border-[#CCCCCC] rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold text-[#111111]"
                  />
                  <span className="text-[9px] text-[#707072]">Codice ISO-2</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                    Unità di Misura
                  </label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#CCCCCC] rounded-lg px-2 py-1.5 text-xs font-semibold text-[#111111]"
                  >
                    <option value="sqft">sqft (Piedi²)</option>
                    <option value="m2">m² (Metri²)</option>
                    <option value="pair">pair (Paia)</option>
                    <option value="pcs">pcs (Pezzi)</option>
                    <option value="m">m (Metri lineari)</option>
                    <option value="kg">kg (Chilogrammi)</option>
                  </select>
                  <span className="text-[9px] text-[#707072]">Unità calcolo</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                    Consumo Netto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={consumption}
                    onChange={(e) => setConsumption(Number(e.target.value))}
                    className="w-full bg-[#FAFAFA] border border-[#CCCCCC] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#111111]"
                  />
                  <span className="text-[9px] text-[#707072]">Netto per paio/capo</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                    Sfrido / Scarto %
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={wastePct}
                    onChange={(e) => setWastePct(Number(e.target.value))}
                    className="w-full bg-[#FAFAFA] border border-[#CCCCCC] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#111111]"
                  />
                  <span className="text-[9px] text-[#707072]">Es. 18% pelle, 3% fondo</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                    % Riciclato (ESPR)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={recycledPct}
                    onChange={(e) => setRecycledPct(Number(e.target.value))}
                    className="w-full bg-[#FAFAFA] border border-[#CCCCCC] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-emerald-600"
                  />
                  <span className="text-[9px] text-[#707072]">Materia prima 2ª</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                    Costo Unitario (€)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={unitCostEur}
                    onChange={(e) => setUnitCostEur(Number(e.target.value))}
                    className="w-full bg-[#FAFAFA] border border-[#CCCCCC] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#111111]"
                  />
                  <span className="text-[9px] text-amber-700 font-bold">🔒 Riservato L6</span>
                </div>
              </div>

              <div className="text-[11px] bg-[#F5F5F5] rounded-lg p-2 text-[#707072] flex items-center justify-between">
                <span>
                  Fabbisogno Lordo Totale con Sfrido:{" "}
                  <strong className="text-[#111111] font-mono">
                    {(consumption * (1 + wastePct / 100)).toFixed(2)} {uom}
                  </strong>
                </span>
                <span>
                  Costo Lordo Componente:{" "}
                  <strong className="text-[#111111] font-mono">
                    € {(consumption * (1 + wastePct / 100) * unitCostEur).toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Step 4: Certificazioni Ambientali & Tracciabilità */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-[#111111]">
                  Certificazioni Ambientali &amp; Conformità Chimica del Fornitore
                </label>
                <span className="text-[10px] text-[#707072]">
                  Clicca sui badge rapidi o digita liberamente
                </span>
              </div>
              <input
                type="text"
                placeholder="Es. LWG Gold, ICEC TS 410, REACH SVHC-Free, GRS 4.0, FSC"
                value={certsInput}
                onChange={(e) => setCertsInput(e.target.value)}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-[#707072] font-bold">Aggiungi rapidamente:</span>
                {[
                  "LWG Gold (Conceria)",
                  "ICEC TS 410 (Tracciabilità)",
                  "REACH SVHC-Free",
                  "EUDR Deforestation-Free",
                  "GRS (Riciclato)",
                  "OEKO-TEX Standard 100",
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      const clean = c.split(" ")[0];
                      const current = certsInput ? certsInput.split(",").map((s) => s.trim()) : [];
                      if (!current.includes(clean)) {
                        setCertsInput(current.concat(clean).filter(Boolean).join(", "));
                      }
                    }}
                    className="px-2 py-0.5 rounded-full bg-white border border-[#E5E5E5] text-[10px] font-semibold text-[#111111] hover:bg-[#F0F0F0] hover:border-[#111111] transition"
                  >
                    + {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-full border border-[#CCCCCC] text-xs font-bold text-[#707072] hover:bg-white transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-black transition shadow-sm"
              >
                Salva Componente in Distinta Base
              </button>
            </div>
          </form>
        )}

        {/* Tree Render */}
        <div className="mt-2">{tree.map((rootNode) => renderNode(rootNode, 0))}</div>

        {/* FTL-TECH-014: Modal Modifica Elemento BOM */}
        {editingItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#CCCCCC] animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#707072]">
                    ✏️ MODIFICA COMPONENTE DISTINTA BASE
                  </div>
                  <div className="text-lg font-bold text-[#111111]">
                    {editingItem.material_name} ({editingItem.bom_item_id})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="w-8 h-8 rounded-full border border-[#CCCCCC] hover:bg-[#F5F5F5] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Nome Materiale *
                    </label>
                    <input
                      type="text"
                      required
                      value={editMaterialName}
                      onChange={(e) => setEditMaterialName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Fornitore Distrettuale *
                    </label>
                    <input
                      type="text"
                      required
                      value={editSupplierName}
                      onChange={(e) => setEditSupplierName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Tipologia Componente
                    </label>
                    <select
                      value={editComponentType}
                      onChange={(e) => setEditComponentType(e.target.value as BomComponentType)}
                      className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-semibold"
                    >
                      <option value="upper">Tomaia / Taglio Esterno</option>
                      <option value="lining">Fodera Interna</option>
                      <option value="insole">Sottopiede / Fussbett</option>
                      <option value="outsole">Suola / Fondo Monoblocco</option>
                      <option value="heel">Tacco / Zeppa</option>
                      <option value="sub_assembly">Salpa / Rinforzo / Puntale</option>
                      <option value="hardware">Minuteria Metallica / Accessorio</option>
                      <option value="chemical">Adesivo / Finissaggio Chimico</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Origine Paese ISO
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editOriginIso}
                      onChange={(e) => setEditOriginIso(e.target.value.toUpperCase())}
                      className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Unità Misura (UoM)
                    </label>
                    <select
                      value={editUom}
                      onChange={(e) => setEditUom(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-semibold"
                    >
                      <option value="sqft">Piedi Quadri (sqft)</option>
                      <option value="dm2">Decimetri Quadri (dm2)</option>
                      <option value="mt">Metri Lineari (mt)</option>
                      <option value="pa">Paia (pa)</option>
                      <option value="pz">Pezzi (pz)</option>
                      <option value="kg">Chilogrammi (kg)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Consumo Netto
                    </label>
                    <input
                      type="number"
                      step={0.01}
                      min={0.01}
                      value={editConsumption}
                      onChange={(e) => setEditConsumption(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-[#CCCCCC] text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Scarto (%)
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={editWastePct}
                      onChange={(e) => setEditWastePct(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-[#CCCCCC] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Riciclato (%)
                    </label>
                    <input
                      type="number"
                      step={1}
                      min={0}
                      max={100}
                      value={editRecycledPct}
                      onChange={(e) => setEditRecycledPct(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-[#CCCCCC] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Costo Unitario € (L6)
                    </label>
                    <input
                      type="number"
                      step={0.05}
                      min={0}
                      value={editUnitCostEur}
                      onChange={(e) => setEditUnitCostEur(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-[#CCCCCC] text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Certificazioni Sostenibilità (separate da virgola)
                  </label>
                  <input
                    type="text"
                    value={editCertsInput}
                    onChange={(e) => setEditCertsInput(e.target.value)}
                    placeholder="LWG Gold, REACH, GRS, OEKO-TEX, EUDR"
                    className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-semibold"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-full border border-[#CCCCCC] text-xs font-bold text-[#707072] hover:bg-[#F5F5F5] transition"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-black transition shadow-sm"
                  >
                    Salva Modifiche Componente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FTL-TECH-014: Modal Sposta Elemento BOM */}
        {movingItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#CCCCCC] animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#707072]">
                    🔀 SPOSTA / RIASSEGNA NODO ALBERO BOM
                  </div>
                  <div className="text-base font-bold text-[#111111]">
                    {movingItem.material_name} ({movingItem.bom_item_id})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMovingItem(null)}
                  className="w-8 h-8 rounded-full border border-[#CCCCCC] hover:bg-[#F5F5F5] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveMove} className="mt-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Nuovo Livello Gerarchico *
                  </label>
                  <select
                    value={moveTargetLevel}
                    onChange={(e) => {
                      const lvl = Number(e.target.value);
                      setMoveTargetLevel(lvl);
                      if (lvl === 1) setMoveTargetParentId("");
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-semibold"
                  >
                    <option value={1}>Livello 1: Macro-Componente / Assieme (Root)</option>
                    <option value={2}>Livello 2: Semilavorato / Materiale (Figlio di L1)</option>
                    <option value={3}>Livello 3: Materia Prima / Chimico / Minuteria (Figlio di L2 o L1)</option>
                  </select>
                </div>

                {moveTargetLevel > 1 && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Seleziona Nodo Genitore (Parent) *
                    </label>
                    <select
                      value={moveTargetParentId}
                      required
                      onChange={(e) => setMoveTargetParentId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-semibold"
                    >
                      <option value="">-- Seleziona elemento padre --</option>
                      {variant.bom_items
                        .filter(
                          (b) =>
                            b.bom_item_id !== movingItem.bom_item_id &&
                            b.level < moveTargetLevel
                        )
                        .map((b) => (
                          <option key={b.bom_item_id} value={b.bom_item_id}>
                            [L{b.level}] {b.material_name} ({b.bom_item_id})
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-[#707072] mt-1">
                      Per garantire la coerenza dell'albero a 3 livelli, il nodo padre deve appartenere a un livello gerarchico superiore.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
                  <button
                    type="button"
                    onClick={() => setMovingItem(null)}
                    className="px-4 py-2 rounded-full border border-[#CCCCCC] text-xs font-bold text-[#707072] hover:bg-[#F5F5F5] transition"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-black transition shadow-sm"
                  >
                    Applica Spostamento Albero
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FTL-TECH-014: Modal Conferma Eliminazione */}
        {deletingItemId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mb-3">
                🗑️
              </div>
              <h4 className="text-lg font-bold text-[#111111]">
                Conferma eliminazione componente BOM?
              </h4>
              <p className="text-xs text-[#707072] mt-2">
                Stai per eliminare il nodo <strong className="text-[#111111]">{deletingItemId}</strong>.
                Se questo elemento contiene sotto-componenti gerarchici (L2 o L3), verranno rimossi ricorsivamente a cascata per garantire l'integrità della distinta base.
              </p>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setDeletingItemId(null)}
                  className="px-4 py-2 rounded-full border border-[#CCCCCC] text-xs font-bold text-[#707072] hover:bg-[#F5F5F5] transition"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(deletingItemId)}
                  className="px-5 py-2 rounded-full bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition shadow-sm"
                >
                  Elimina Definitivamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
