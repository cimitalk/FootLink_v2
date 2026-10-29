import React, { useState } from "react";
import { buildClientBomTree, findMasterColorById } from "../mockSeedData";
import {
  BomComponentType,
  BomItem,
  BomTreeNode,
  BulkMaterialSwapPayload,
  MasterColor,
  MaterialRecord,
  PimCommercialItem,
  PlmProductionVariant,
  VendorRecord,
  ViewerSecurityRole,
} from "../types";

interface BomThreeLevelTreeProps {
  variant: PlmProductionVariant;
  pimItem?: PimCommercialItem;
  viewerRole?: ViewerSecurityRole;
  vendors?: VendorRecord[];
  colors?: MasterColor[];
  materials?: MaterialRecord[];
  onAddBomItem: (bom: BomItem) => void;
  onUpdateBomItem?: (bom: BomItem) => void;
  onDeleteBomItem?: (bomItemId: string) => void;
  onMoveBomItem?: (bomItemId: string, newLevel: number, newParentId: string | null) => void;
  onDuplicateBomItem?: (bomItemId: string) => void;
  onBulkSwapMaterial?: (payload: BulkMaterialSwapPayload) => Promise<void> | void;
  onNavigateToVendor?: (vendorId: string) => void;
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
  vendors = [],
  colors = [],
  materials = [],
  onAddBomItem,
  onUpdateBomItem,
  onDeleteBomItem,
  onMoveBomItem,
  onDuplicateBomItem,
  onBulkSwapMaterial,
  onNavigateToVendor,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSizeGrading, setShowSizeGrading] = useState(true);
  const [level, setLevel] = useState<number>(2);
  const [parentId, setParentId] = useState<string>(
    variant.bom_items[0]?.bom_item_id || ""
  );
  const [materialName, setMaterialName] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedMaterialWarning, setSelectedMaterialWarning] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedMasterColorId, setSelectedMasterColorId] = useState<string>(
    variant.primary_color_id || ""
  );
  const [componentType, setComponentType] =
    useState<BomComponentType>("sub_assembly");
  const [originIso, setOriginIso] = useState("IT");
  const [uom, setUom] = useState("sqft");
  const [consumption, setConsumption] = useState<number>(1.2);
  const [wastePct, setWastePct] = useState<number>(4.0);
  const [recycledPct, setRecycledPct] = useState<number>(50);
  const [unitCostEur, setUnitCostEur] = useState<number>(6.5);
  const [certsInput, setCertsInput] = useState("LWG Gold, REACH");

  // FTL-TECH-014 / Sprint 9: Edit Modal State
  const [editingItem, setEditingItem] = useState<BomItem | null>(null);
  const [editMaterialName, setEditMaterialName] = useState("");
  const [editMaterialId, setEditMaterialId] = useState<string>("");
  const [editMaterialWarning, setEditMaterialWarning] = useState<string | null>(null);
  const [editSupplierName, setEditSupplierName] = useState("");
  const [editVendorId, setEditVendorId] = useState<string>("");
  const [editMasterColorId, setEditMasterColorId] = useState<string>("");
  const [editComponentType, setEditComponentType] = useState<BomComponentType>("upper");
  const [editOriginIso, setEditOriginIso] = useState("IT");
  const [editUom, setEditUom] = useState("dm2");
  const [editConsumption, setEditConsumption] = useState<number>(1.0);
  const [editWastePct, setEditWastePct] = useState<number>(3.0);
  const [editRecycledPct, setEditRecycledPct] = useState<number>(0);
  const [editUnitCostEur, setEditUnitCostEur] = useState<number>(8.5);
  const [editCertsInput, setEditCertsInput] = useState("");

  // Sprint 9: Bulk Material Swap State (FTL-TECH-031)
  const [showBulkSwapModal, setShowBulkSwapModal] = useState<boolean>(false);
  const [swapSourceMat, setSwapSourceMat] = useState<string>("");
  const [swapTargetMatId, setSwapTargetMatId] = useState<string>("");
  const [swapScope, setSwapScope] = useState<"variant" | "product">("variant");
  const [swapUpdateCosts, setSwapUpdateCosts] = useState<boolean>(true);
  const [swapLoading, setSwapLoading] = useState<boolean>(false);

  // Sprint 9: Flexible Industrial Costing Simulator State (FTL-REV-008)
  const [customLaborCost, setCustomLaborCost] = useState<number>(
    variant.standard_labor_cost_eur ?? 29.5
  );
  const [overheadPct, setOverheadPct] = useState<number>(10);
  const [whatIfMaterialDeltaPct, setWhatIfMaterialDeltaPct] = useState<number>(0);
  const [customWholesaleEur, setCustomWholesaleEur] = useState<number>(
    pimItem?.wholesale_price_eur ?? 165
  );
  const [customRetailEur, setCustomRetailEur] = useState<number>(
    pimItem?.retail_price_eur ?? 395
  );
  const [showSimulatorDetails, setShowSimulatorDetails] = useState<boolean>(false);

  // FTL-TECH-014: Move Modal State
  const [movingItem, setMovingItem] = useState<BomItem | null>(null);
  const [moveTargetLevel, setMoveTargetLevel] = useState<number>(1);
  const [moveTargetParentId, setMoveTargetParentId] = useState<string>("");

  // FTL-TECH-014: Delete Confirmation State
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // FTL-TECH-018: Drag and Drop & Compact UX State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [moveToast, setMoveToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

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

  // Sprint 9 / FTL-REV-008: Dynamic Industrial Costing Simulator with What-If sensitivity
  const adjustedMaterialsCostEur = Number(
    (materialsCostEur * (1 + whatIfMaterialDeltaPct / 100)).toFixed(2)
  );
  const overheadAmountEur = Number(
    (((adjustedMaterialsCostEur + customLaborCost) * overheadPct) / 100).toFixed(2)
  );
  const simTotalIndustrialCostEur = Number(
    (adjustedMaterialsCostEur + customLaborCost + overheadAmountEur).toFixed(2)
  );
  const simWholesaleMarginPct =
    customWholesaleEur > 0
      ? Number(
          (
            ((customWholesaleEur - simTotalIndustrialCostEur) /
              customWholesaleEur) *
            100
          ).toFixed(1)
        )
      : 0;
  const simWholesaleMarginEur = Number(
    (customWholesaleEur - simTotalIndustrialCostEur).toFixed(2)
  );
  const netRetailEur = customRetailEur / 1.22; // Net of 22% Italian VAT
  const simRetailMarginPct =
    netRetailEur > 0
      ? Number(
          (((netRetailEur - simTotalIndustrialCostEur) / netRetailEur) * 100).toFixed(1)
        )
      : 0;
  const simRetailMarginEur = Number(
    (netRetailEur - simTotalIndustrialCostEur).toFixed(2)
  );
  const simMarkupFactor =
    simTotalIndustrialCostEur > 0
      ? Number((customRetailEur / simTotalIndustrialCostEur).toFixed(2))
      : 0;

  // Distinct BOM material names for bulk swap
  const distinctBomMaterials = Array.from(
    new Set(variant.bom_items.map((b) => b.material_name))
  );

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

  // Guided Material Picker handlers
  const handleSelectMaterialForAdd = (mId: string) => {
    setSelectedMaterialId(mId);
    if (!mId) {
      setSelectedMaterialWarning(null);
      return;
    }
    const m = materials.find((item) => item.material_id === mId);
    if (!m) return;
    setMaterialName(m.name);
    setUom(m.unit_of_measure || "dm2");
    if (viewerRole === "brand") {
      setUnitCostEur(m.standard_cost || 0);
    }
    if (m.certifications && m.certifications.length > 0) {
      setCertsInput(m.certifications.join(", "));
    }
    if (m.technical_specs?.recycled_pct) {
      setRecycledPct(Number(m.technical_specs.recycled_pct) || 0);
    }
    if (m.vendor_id) {
      setSelectedVendorId(m.vendor_id);
      const v = vendors.find((vnd) => vnd.vendor_id === m.vendor_id);
      if (v) {
        setSupplierName(v.company_name);
        setOriginIso(v.country_iso2 || "IT");
        if (v.has_expired_critical_certs || v.cert_semaphore_status === "expired") {
          setSelectedMaterialWarning(
            `⚠️ Attenzione: Il fornitore associato "${v.company_name}" ha certificazioni LWG/EUDR scadute o non conformi.`
          );
        } else {
          setSelectedMaterialWarning(null);
        }
      }
    } else {
      setSelectedMaterialWarning(null);
    }
  };

  const handleSelectMaterialForEdit = (mId: string) => {
    setEditMaterialId(mId);
    if (!mId) {
      setEditMaterialWarning(null);
      return;
    }
    const m = materials.find((item) => item.material_id === mId);
    if (!m) return;
    setEditMaterialName(m.name);
    setEditUom(m.unit_of_measure || "dm2");
    if (viewerRole === "brand") {
      setEditUnitCostEur(m.standard_cost || 0);
    }
    if (m.certifications && m.certifications.length > 0) {
      setEditCertsInput(m.certifications.join(", "));
    }
    if (m.technical_specs?.recycled_pct) {
      setEditRecycledPct(Number(m.technical_specs.recycled_pct) || 0);
    }
    if (m.vendor_id) {
      setEditVendorId(m.vendor_id);
      const v = vendors.find((vnd) => vnd.vendor_id === m.vendor_id);
      if (v) {
        setEditSupplierName(v.company_name);
        setEditOriginIso(v.country_iso2 || "IT");
        if (v.has_expired_critical_certs || v.cert_semaphore_status === "expired") {
          setEditMaterialWarning(
            `⚠️ Attenzione: Il fornitore associato "${v.company_name}" ha certificazioni LWG/EUDR scadute o non conformi.`
          );
        } else {
          setEditMaterialWarning(null);
        }
      }
    } else {
      setEditMaterialWarning(null);
    }
  };

  const handleSelectVendorForAdd = (vId: string) => {
    setSelectedVendorId(vId);
    const v = vendors.find((item) => item.vendor_id === vId);
    if (v) {
      setSupplierName(v.company_name);
      setOriginIso(v.country_iso2 || "IT");
      if (v.certifications && v.certifications.length > 0) {
        setCertsInput(
          v.certifications
            .map((c) => c.cert_type.replace(/_/g, " "))
            .join(", ")
        );
      }
      if (
        viewerRole === "brand" &&
        typeof v.hourly_or_unit_rate_eur_l6 === "number"
      ) {
        setUnitCostEur(v.hourly_or_unit_rate_eur_l6);
      }
      if (v.has_expired_critical_certs || v.cert_semaphore_status === "expired") {
        setSelectedMaterialWarning(
          `⚠️ Attenzione: Il fornitore "${v.company_name}" ha certificazioni LWG/EUDR scadute o non conformi.`
        );
      } else {
        setSelectedMaterialWarning(null);
      }
    }
  };

  const handleSelectVendorForEdit = (vId: string) => {
    setEditVendorId(vId);
    const v = vendors.find((item) => item.vendor_id === vId);
    if (v) {
      setEditSupplierName(v.company_name);
      setEditOriginIso(v.country_iso2 || "IT");
      if (v.certifications && v.certifications.length > 0) {
        setEditCertsInput(
          v.certifications
            .map((c) => c.cert_type.replace(/_/g, " "))
            .join(", ")
        );
      }
      if (
        viewerRole === "brand" &&
        typeof v.hourly_or_unit_rate_eur_l6 === "number"
      ) {
        setEditUnitCostEur(v.hourly_or_unit_rate_eur_l6);
      }
      if (v.has_expired_critical_certs || v.cert_semaphore_status === "expired") {
        setEditMaterialWarning(
          `⚠️ Attenzione: Il fornitore "${v.company_name}" ha certificazioni LWG/EUDR scadute o non conformi.`
        );
      } else {
        setEditMaterialWarning(null);
      }
    }
  };

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
      material_id: selectedMaterialId || null,
      material_name: materialName.trim(),
      supplier_name: supplierName.trim(),
      vendor_id: selectedVendorId || null,
      master_color_id: selectedMasterColorId || null,
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
    setSelectedMaterialId("");
    setSelectedMaterialWarning(null);
    setSupplierName("");
    setSelectedVendorId("");
    setShowAddForm(false);
  };

  // FTL-TECH-014: Edit, Move, Delete handlers
  const openEditModal = (item: BomItem) => {
    setEditingItem(item);
    setEditMaterialName(item.material_name);
    setEditMaterialId(item.material_id || "");
    setEditMaterialWarning(null);
    setEditSupplierName(item.supplier_name);
    setEditVendorId(item.vendor_id || "");
    setEditMasterColorId(item.master_color_id || "");
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
      material_id: editMaterialId || editingItem.material_id || null,
      material_name: editMaterialName.trim(),
      supplier_name: editSupplierName.trim(),
      vendor_id: editVendorId || null,
      master_color_id: editMasterColorId || null,
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

  // Sprint 9: Execute Bulk Material Swap
  const handleExecuteBulkSwap = async () => {
    if (!swapTargetMatId) {
      alert("Seleziona il nuovo materiale dal Catalogo Materiali!");
      return;
    }
    const targetMat = materials.find((m) => m.material_id === swapTargetMatId);
    if (!targetMat) return;

    setSwapLoading(true);
    try {
      const payload: BulkMaterialSwapPayload = {
        source_material_name: swapSourceMat || null,
        target_material_id: targetMat.material_id,
        target_material_name: targetMat.name,
        target_vendor_id: targetMat.vendor_id || null,
        target_unit_cost: swapUpdateCosts ? targetMat.standard_cost : null,
        update_costs: swapUpdateCosts,
        variant_ids:
          swapScope === "variant"
            ? [variant.plm_variant_id]
            : pimItem?.plm_variants.map((v) => v.plm_variant_id) || [variant.plm_variant_id],
      };

      if (onBulkSwapMaterial) {
        await onBulkSwapMaterial(payload);
      }

      setMoveToast({
        message: `Sostituzione massiva completata: "${swapSourceMat || "Materiale"}" sostituito con "${targetMat.name}" su ${
          swapScope === "variant" ? "1 variante" : `${payload.variant_ids?.length || 1} varianti`
        }!`,
        type: "success",
      });
      setTimeout(() => setMoveToast(null), 4000);
      setShowBulkSwapModal(false);
    } catch (err: any) {
      setMoveToast({
        message: `Errore durante la sostituzione massiva: ${err.message || err}`,
        type: "error",
      });
      setTimeout(() => setMoveToast(null), 4000);
    } finally {
      setSwapLoading(false);
    }
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

  // FTL-TECH-018: Drag-and-Drop Tree Validation & Traversal
  const findNodeInTree = (nodes: BomTreeNode[], id: string): BomTreeNode | null => {
    for (const n of nodes) {
      if (n.bom_item_id === id) return n;
      const found = findNodeInTree(n.children, id);
      if (found) return found;
    }
    return null;
  };

  const isDescendant = (parent: BomTreeNode, targetId: string): boolean => {
    for (const c of parent.children) {
      if (c.bom_item_id === targetId) return true;
      if (isDescendant(c, targetId)) return true;
    }
    return false;
  };

  const getSubtreeDepth = (node: BomTreeNode): number => {
    if (!node.children || node.children.length === 0) return 0;
    return 1 + Math.max(...node.children.map(getSubtreeDepth));
  };

  const validateDrop = (
    draggedId: string,
    targetNode: BomTreeNode,
    currentTree: BomTreeNode[]
  ): { valid: boolean; reason?: string; newLevel: number; newParentId: string | null } => {
    if (draggedId === targetNode.bom_item_id) {
      return {
        valid: false,
        reason: "Non puoi rilasciare un elemento su se stesso.",
        newLevel: 0,
        newParentId: null,
      };
    }

    const draggedNode = findNodeInTree(currentTree, draggedId);
    if (!draggedNode) {
      return {
        valid: false,
        reason: "Elemento trascinato non trovato.",
        newLevel: 0,
        newParentId: null,
      };
    }

    if (isDescendant(draggedNode, targetNode.bom_item_id)) {
      return {
        valid: false,
        reason: "Impossibile inserire un nodo in un suo sotto-elemento (ciclo non permesso).",
        newLevel: 0,
        newParentId: null,
      };
    }

    if (targetNode.level >= 3) {
      return {
        valid: false,
        reason: "Livello 3 massimo raggiunto: le materie prime non possono avere sotto-elementi.",
        newLevel: 0,
        newParentId: null,
      };
    }

    const newLevel = targetNode.level + 1;
    const draggedDepth = getSubtreeDepth(draggedNode);
    if (newLevel + draggedDepth > 3) {
      return {
        valid: false,
        reason: `Spostando questo elemento a Livello ${newLevel}, i sotto-elementi supererebbero il Livello 3 consentito.`,
        newLevel,
        newParentId: null,
      };
    }

    if (draggedNode.parent_bom_item_id === targetNode.bom_item_id && draggedNode.level === newLevel) {
      return {
        valid: false,
        reason: "Questo elemento è già posizionato sotto questo genitore.",
        newLevel,
        newParentId: targetNode.bom_item_id,
      };
    }

    return { valid: true, newLevel, newParentId: targetNode.bom_item_id };
  };

  const handleDragStart = (e: React.DragEvent, node: BomTreeNode) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select")) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", node.bom_item_id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedNodeId(node.bom_item_id);
  };

  const handleDragEnd = () => {
    setDraggedNodeId(null);
    setDropTargetId(null);
  };

  const handleDragOverNode = (e: React.DragEvent, node: BomTreeNode) => {
    if (!draggedNodeId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTargetId !== node.bom_item_id) {
      setDropTargetId(node.bom_item_id);
    }
  };

  const handleDragLeaveNode = (e: React.DragEvent, node: BomTreeNode) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && (e.currentTarget as HTMLElement).contains(relatedTarget)) {
      return;
    }
    if (dropTargetId === node.bom_item_id) {
      setDropTargetId(null);
    }
  };

  const handleDropOnNode = (e: React.DragEvent, targetNode: BomTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedNodeId) return;

    const validation = validateDrop(draggedNodeId, targetNode, tree);
    if (!validation.valid) {
      setMoveToast({
        message: validation.reason || "Operazione di spostamento non consentita.",
        type: "error",
      });
      setTimeout(() => setMoveToast(null), 4000);
      setDraggedNodeId(null);
      setDropTargetId(null);
      return;
    }

    if (onMoveBomItem) {
      onMoveBomItem(draggedNodeId, validation.newLevel, validation.newParentId);
      setMoveToast({
        message: `Elemento ${draggedNodeId} spostato sotto "${targetNode.material_name}" a Livello ${validation.newLevel}!`,
        type: "success",
      });
      setTimeout(() => setMoveToast(null), 3500);
    }

    setDraggedNodeId(null);
    setDropTargetId(null);
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedNodeId) return;

    const draggedNode = findNodeInTree(tree, draggedNodeId);
    if (draggedNode && draggedNode.level === 1 && !draggedNode.parent_bom_item_id) {
      setMoveToast({
        message: `L'elemento ${draggedNodeId} è già un macro-componente di Livello 1 (Radice).`,
        type: "info",
      });
      setTimeout(() => setMoveToast(null), 3000);
      setDraggedNodeId(null);
      setDropTargetId(null);
      return;
    }

    if (onMoveBomItem) {
      onMoveBomItem(draggedNodeId, 1, null);
      setMoveToast({
        message: `Elemento ${draggedNodeId} promosso a Livello 1 (Radice / Macro-Componente)!`,
        type: "success",
      });
      setTimeout(() => setMoveToast(null), 3500);
    }

    setDraggedNodeId(null);
    setDropTargetId(null);
  };

  const handleDuplicateItem = (node: BomTreeNode) => {
    if (onDuplicateBomItem) {
      onDuplicateBomItem(node.bom_item_id);
    } else {
      // Fallback local subtree duplication
      const cloneSubtree = (srcNode: BomTreeNode, newParentId: string | null): BomItem[] => {
        const generatedId = `BOM-L${srcNode.level}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`;

        const clonedItem: BomItem = {
          bom_item_id: generatedId,
          level: srcNode.level,
          parent_bom_item_id: newParentId,
          component_type: srcNode.component_type,
          material_name: `${srcNode.material_name} (Copia)`,
          supplier_name: srcNode.supplier_name,
          origin_country_iso2: srcNode.origin_country_iso2,
          unit_of_measure: srcNode.unit_of_measure,
          unit_consumption: srcNode.unit_consumption,
          waste_percentage: srcNode.waste_percentage,
          recycled_content_pct: srcNode.recycled_content_pct,
          certifications: [...(srcNode.certifications || [])],
          unit_cost_eur: srcNode.unit_cost_eur,
          lot_certificate_id: `CERT-DUP-${Math.floor(1000 + Math.random() * 9000)}`,
        };

        const clonedItems: BomItem[] = [clonedItem];
        if (srcNode.children && srcNode.children.length > 0) {
          for (const child of srcNode.children) {
            clonedItems.push(...cloneSubtree(child, generatedId));
          }
        }
        return clonedItems;
      };

      const itemsToAdd = cloneSubtree(node, node.parent_bom_item_id ?? null);
      for (const item of itemsToAdd) {
        onAddBomItem(item);
      }
    }

    setMoveToast({
      message: `Elemento "${node.material_name}" duplicato con successo${
        node.children.length > 0 ? ` (inclusi ${node.children.length} sotto-elementi)` : ""
      }!`,
      type: "success",
    });
    setTimeout(() => setMoveToast(null), 3500);
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

    const isBeingDragged = draggedNodeId === node.bom_item_id;
    const isCurrentDropTarget = dropTargetId === node.bom_item_id;
    const dropValidation =
      draggedNodeId && isCurrentDropTarget
        ? validateDrop(draggedNodeId, node, tree)
        : null;
    const isDropValid = dropValidation?.valid ?? false;
    const invalidDropReason = dropValidation?.reason;

    return (
      <div
        key={node.bom_item_id}
        className={`${
          depth > 0
            ? "ml-3 sm:ml-5 pl-2.5 sm:pl-3.5 border-l-2 border-[#DCDCDC] mt-1.5"
            : "mt-2"
        }`}
      >
        <div
          draggable={true}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOverNode(e, node)}
          onDragLeave={(e) => handleDragLeaveNode(e, node)}
          onDrop={(e) => handleDropOnNode(e, node)}
          className={`p-2.5 rounded-xl border transition-all duration-150 ${
            isBeingDragged
              ? "opacity-35 border-dashed border-2 border-amber-500 bg-amber-50/40 scale-[0.99]"
              : isCurrentDropTarget
              ? isDropValid
                ? "ring-2 ring-emerald-500 bg-emerald-50/80 border-emerald-500 shadow-md scale-[1.008]"
                : "ring-2 ring-red-400 bg-red-50/60 border-red-300"
              : draggedNodeId
              ? "border-[#E0E0E0] bg-[#FAFAFA] hover:border-emerald-400"
              : "border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white hover:border-[#111111] shadow-2xs"
          }`}
        >
          {/* Riga 1: Grip drag, badge livello compatto, ID, origine, costo L6 e azioni */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Grip Handle per Drag & Drop */}
              <span
                className="cursor-grab active:cursor-grabbing text-[#9E9E9E] hover:text-[#111111] text-xs px-1 select-none transition"
                title="Trascina per spostare questo componente nella gerarchia BOM"
              >
                ⠿
              </span>

              {/* Badge Livello Compatto */}
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white ${
                  node.level === 1
                    ? "bg-[#111111]"
                    : node.level === 2
                    ? "bg-[#2563EB]"
                    : "bg-[#4B5563]"
                }`}
                title={`${tag.label}: ${tag.desc}`}
              >
                L{node.level} · {node.level === 1 ? "Macro" : node.level === 2 ? "Semilav." : "Mat. Prima"}
              </span>

              {/* Tipo Componente Tecnico */}
              <span className="text-[10px] font-semibold text-[#111111] bg-white border border-[#E0E0E0] px-2 py-0.5 rounded-md">
                {node.component_type}
              </span>

              {/* Codice ID BOM */}
              <span className="mono-code text-[10px] text-[#707072] font-semibold">
                {node.bom_item_id}
              </span>

              {/* Badge numero sotto-elementi se presenti */}
              {node.children.length > 0 && (
                <span className="font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded text-[9px] border border-emerald-300">
                  {node.children.length} {node.children.length === 1 ? "figlio" : "figli"}
                </span>
              )}
            </div>

            {/* Lato Destro Riga 1: Origine, Riciclato, Costo L6, Pulsanti */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="bg-white border border-[#E5E5E5] px-1.5 py-0.5 rounded text-[10px] text-[#111111] font-semibold">
                {node.origin_country_iso2}
              </span>
              {node.recycled_content_pct > 0 && (
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                  {node.recycled_content_pct}% ric.
                </span>
              )}

              {viewerRole === "brand" ? (
                <span className="mono-code text-[11px] font-bold text-[#111111] bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                  € {lineCost}
                </span>
              ) : (
                <span className="mono-code text-[10px] text-[#707072] bg-white border border-[#E5E5E5] px-1.5 py-0.5 rounded">
                  🔒 0 €
                </span>
              )}

              {/* Pulsanti Azione Compatti (Edit, Move, Delete) */}
              <div className="flex items-center gap-1 ml-1 pl-1 border-l border-[#E5E5E5]">
                <button
                  type="button"
                  draggable={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(node);
                  }}
                  title="Modifica parametri elemento BOM"
                  className="px-2 py-0.5 rounded-md border border-[#D5D5D5] bg-white hover:border-[#111111] hover:bg-[#F0F0F0] text-[#111111] text-[10px] font-semibold flex items-center gap-1 transition"
                >
                  ✏️ <span className="hidden sm:inline">Modifica</span>
                </button>
                <button
                  type="button"
                  draggable={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    openMoveModal(node);
                  }}
                  title="Sposta o riassegna livello gerarchico (manuale)"
                  className="px-2 py-0.5 rounded-md border border-[#D5D5D5] bg-white hover:border-[#111111] hover:bg-[#F0F0F0] text-[#111111] text-[10px] font-semibold flex items-center gap-1 transition"
                >
                  🔀 <span className="hidden sm:inline">Sposta</span>
                </button>
                <button
                  type="button"
                  draggable={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateItem(node);
                  }}
                  title="Duplica questa voce di distinta base (con eventuali sotto-elementi)"
                  className="px-2 py-0.5 rounded-md border border-[#D5D5D5] bg-white hover:border-[#111111] hover:bg-[#F0F0F0] text-[#111111] text-[10px] font-semibold flex items-center gap-1 transition"
                >
                  📋 <span className="hidden sm:inline">Duplica</span>
                </button>
                <button
                  type="button"
                  draggable={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingItemId(node.bom_item_id);
                  }}
                  title="Elimina questo elemento e relativi figli"
                  className="px-1.5 py-0.5 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-semibold flex items-center gap-1 transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          {/* Riga 2: Nome materiale, swatch colore, fornitore albo, certificazioni e consumi */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#EAEAEA]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#111111]">
                {node.material_name}
              </span>
              {node.material_id && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold"
                  title={`Collegato a Catalogo Materiali: ${node.material_id}`}
                >
                  🌿 Catalogo
                </span>
              )}
              {(() => {
                const nodeColor = findMasterColorById(colors, node.master_color_id);
                if (!nodeColor) return null;
                return (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-[#D5D5D5] text-[10px] font-semibold text-[#111111]">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300"
                      style={{ backgroundColor: nodeColor.hex_code }}
                    />
                    <span className="font-mono">{nodeColor.color_code}</span>
                    <span>· {nodeColor.technical_name_it}</span>
                  </span>
                );
              })()}
              <span className="text-[11px] text-[#707072]">
                · Fornitore: <span className="text-[#111111] font-semibold">{node.supplier_name}</span>
              </span>
              {(() => {
                const matchedVendor = vendors.find(
                  (v) =>
                    v.vendor_id === node.vendor_id ||
                    v.company_name.toLowerCase() === node.supplier_name.toLowerCase()
                );
                if (!matchedVendor) return null;
                return (
                  <>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {matchedVendor.vendor_code}
                    </span>
                    {matchedVendor.has_expired_critical_certs && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                        🔴 Cert. LWG/EUDR Scaduto
                      </span>
                    )}
                    {onNavigateToVendor && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToVendor(matchedVendor.vendor_id);
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-bold border border-indigo-200 transition"
                        title="Salta direttamente alla scheda fornitore in Modulo 04"
                      >
                        🏭 Scheda Fornitore ↗
                      </button>
                    )}
                  </>
                );
              })()}
              {node.certifications.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {node.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="text-[9px] bg-white border border-[#E5E5E5] text-[#111111] px-1.5 py-0.2 rounded font-medium"
                    >
                      ✓ {cert}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right text-[11px] text-[#707072]">
              <span>
                Netto:{" "}
                <strong className="mono-code text-[#111111]">
                  {node.unit_consumption} {node.unit_of_measure}
                </strong>{" "}
                (lordo {grossConsumption} con +{node.waste_percentage}% sfrido)
              </span>
              {viewerRole === "brand" && (
                <span className="mono-code text-[10px] text-[#707072] ml-2">
                  [€ {(node.unit_cost_eur ?? 8.5).toFixed(2)}/{node.unit_of_measure}]
                </span>
              )}
            </div>
          </div>

          {/* Feedback visivo immediato durante l'hover del Drag & Drop */}
          {isCurrentDropTarget && (
            <div
              className={`mt-1.5 pt-1 border-t border-dashed text-[11px] font-bold flex items-center justify-between ${
                isDropValid
                  ? "border-emerald-400 text-emerald-800"
                  : "border-red-300 text-red-600"
              }`}
            >
              {isDropValid ? (
                <span>
                  ↳ Rilascia qui per nidificare come <strong>Livello {node.level + 1}</strong> sotto &quot;{node.material_name}&quot;
                </span>
              ) : (
                <span>
                  ⛔ {invalidDropReason || "Operazione non consentita"}
                </span>
              )}
              <span className="text-[10px] font-normal text-[#707072]">
                Rilascia il pulsante del mouse per applicare
              </span>
            </div>
          )}
        </div>

        {/* Render Ricorsivo dei Figli */}
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
            {viewerRole === "brand" && (
              <button
                type="button"
                onClick={() => {
                  setSwapSourceMat(distinctBomMaterials[0] || "");
                  setSwapTargetMatId(materials[0]?.material_id || "");
                  setShowBulkSwapModal(true);
                }}
                className="px-4 py-2 rounded-full border border-purple-500 bg-purple-50 text-purple-900 text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5"
                title="Sostituisci un materiale su una o tutte le varianti di prodotto"
              >
                <span>🔄</span>
                <span>Sostituzione Massiva</span>
              </button>
            )}
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

        {/* L6 Cost Segregation Banner & Interactive Industrial Cost Simulator (FTL-REV-008 / ADR-006) */}
        <div className="mt-4 bg-[#111111] text-white rounded-2xl p-5 shadow-lg border border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/15">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              FOGLIO COSTI INDUSTRIALI &amp; SIMULATORE MARGINI DINAMICO (FTL-REV-008)
            </span>
            <div className="flex items-center gap-2">
              {viewerRole === "brand" && (
                <button
                  type="button"
                  onClick={() => setShowSimulatorDetails(!showSimulatorDetails)}
                  className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/20 text-emerald-400 border border-emerald-500/40 transition flex items-center gap-1"
                >
                  <span>⚡</span>
                  <span>{showSimulatorDetails ? "Comprimi Simulatore" : "Espandi Simulatore Dinamico What-If"}</span>
                </button>
              )}
              <span className="mono-code text-[11px] bg-white text-[#111111] px-3 py-0.5 rounded-full font-bold">
                {viewerRole === "brand"
                  ? "RUOLO: BRAND / PMI OWNER (AUTORIZZATO L6)"
                  : "RUOLO: LABORATORIO TERZISTA 0 € (COSTI OSCURATI)"}
              </span>
            </div>
          </div>

          {viewerRole === "brand" ? (
            <div className="space-y-4 pt-3">
              {/* Primary 4 KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-white/60 font-semibold flex items-center justify-between">
                    <span>Costo Materiali BOM</span>
                    {whatIfMaterialDeltaPct !== 0 && (
                      <span className={`text-[10px] font-bold ${whatIfMaterialDeltaPct > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                        {whatIfMaterialDeltaPct > 0 ? `+${whatIfMaterialDeltaPct}%` : `${whatIfMaterialDeltaPct}%`}
                      </span>
                    )}
                  </div>
                  <div className="display-title text-2xl text-white mt-1">
                    € {adjustedMaterialsCostEur.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-white/50">Base distinta: € {materialsCostEur.toFixed(2)}</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-white/60 font-semibold">
                    Manodopera / Façon
                  </div>
                  <div className="display-title text-2xl text-white mt-1">
                    € {customLaborCost.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-white/50">Lavorazione standard</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-white/60 font-semibold flex items-center justify-between">
                    <span>Costo Industriale Tot.</span>
                    <span className="text-[9px] text-sky-400 font-bold">+{overheadPct}% ovh</span>
                  </div>
                  <div className="display-title text-2xl text-emerald-400 mt-1">
                    € {simTotalIndustrialCostEur.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-white/50">Spese gen.: € {overheadAmountEur.toFixed(2)}</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-white/60 font-semibold flex items-center justify-between">
                    <span>Margine Lordo B2B</span>
                    <span className="text-[10px] font-bold text-white/70">€ {simWholesaleMarginEur}</span>
                  </div>
                  <div className={`display-title text-2xl mt-1 ${simWholesaleMarginPct >= 50 ? "text-emerald-400" : simWholesaleMarginPct >= 35 ? "text-amber-400" : "text-rose-400"}`}>
                    {simWholesaleMarginPct}%
                  </div>
                  <div className="text-[10px] text-white/50">su Wholesale € {customWholesaleEur}</div>
                </div>
              </div>

              {/* Expanded Interactive Simulation & What-If Panel */}
              {showSimulatorDetails && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>🎛️</span>
                      <span>Parametri di Simulazione Industriale &amp; Stress Test Resilienza Margini</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setWhatIfMaterialDeltaPct(0);
                        setCustomLaborCost(variant.standard_labor_cost_eur ?? 29.5);
                        setOverheadPct(10);
                        setCustomWholesaleEur(pimItem?.wholesale_price_eur ?? 165);
                        setCustomRetailEur(pimItem?.retail_price_eur ?? 395);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-neutral-300 transition"
                    >
                      ↺ Reimposta Valori Base
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Simulator Input 1: Manodopera */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-neutral-300 block">
                        Costo Manodopera / Façon (€/paio):
                      </label>
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        value={customLaborCost}
                        onChange={(e) => setCustomLaborCost(Number(e.target.value) || 0)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-neutral-400">Tariffa oraria terzista per fase taglio, orlatura e montaggio</p>
                    </div>

                    {/* Simulator Input 2: Overhead % */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-neutral-300 block">
                        % Spese Generali / Overhead Industriale:
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[0, 8, 10, 12, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setOverheadPct(pct)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                              overheadPct === pct
                                ? "bg-emerald-500 text-black shadow-sm"
                                : "bg-white/10 text-neutral-300 hover:bg-white/20"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-neutral-400">Quota ammortamento stampi, energia e logistica distrettuale</p>
                    </div>

                    {/* Simulator Input 3: Prezzi Commerciali */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-300 block">
                          Wholesale B2B (€):
                        </label>
                        <input
                          type="number"
                          step={1}
                          min={0}
                          value={customWholesaleEur}
                          onChange={(e) => setCustomWholesaleEur(Number(e.target.value) || 0)}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-300 block">
                          Retail B2C con IVA (€):
                        </label>
                        <input
                          type="number"
                          step={1}
                          min={0}
                          value={customRetailEur}
                          onChange={(e) => setCustomRetailEur(Number(e.target.value) || 0)}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* What-If Material Sensitivity Slider */}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                        <span>📈</span>
                        <span>What-If Stress Test: Sensibilità Inflazione Materie Prime &amp; Pellami</span>
                      </span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        whatIfMaterialDeltaPct > 0 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        whatIfMaterialDeltaPct < 0 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                        "bg-white/10 text-neutral-300"
                      }`}>
                        {whatIfMaterialDeltaPct > 0 ? `+${whatIfMaterialDeltaPct}%` : `${whatIfMaterialDeltaPct}%`} variazione costo materiali
                      </span>
                    </div>

                    <input
                      type="range"
                      min={-20}
                      max={30}
                      step={5}
                      value={whatIfMaterialDeltaPct}
                      onChange={(e) => setWhatIfMaterialDeltaPct(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                      <span>-20% (Efficienza Acquisti)</span>
                      <span>0% (Costo Standard Distinta)</span>
                      <span>+15% (Aumento LWG/Conceria)</span>
                      <span>+30% (Stress Test Inflazione)</span>
                    </div>
                  </div>

                  {/* Summary Comparison Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
                    <div className="bg-white/5 rounded-xl p-2.5">
                      <div className="text-[10px] text-neutral-400 uppercase font-semibold">Margine B2B Wholesale</div>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">{simWholesaleMarginPct}%</div>
                      <div className="text-[10px] text-neutral-400">€ {simWholesaleMarginEur} / paio</div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-2.5">
                      <div className="text-[10px] text-neutral-400 uppercase font-semibold">Margine Retail (Netto IVA 22%)</div>
                      <div className="text-base font-bold text-sky-400 mt-0.5">{simRetailMarginPct}%</div>
                      <div className="text-[10px] text-neutral-400">€ {simRetailMarginEur} (su € {netRetailEur.toFixed(2)})</div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-2.5">
                      <div className="text-[10px] text-neutral-400 uppercase font-semibold">Markup Industriale</div>
                      <div className="text-base font-bold text-amber-400 mt-0.5">{simMarkupFactor}x</div>
                      <div className="text-[10px] text-neutral-400">Retail / Costo Industriale</div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-2.5">
                      <div className="text-[10px] text-neutral-400 uppercase font-semibold">Soglia Redditività</div>
                      <div className={`text-base font-bold mt-0.5 ${simWholesaleMarginPct >= 45 ? "text-emerald-400" : "text-rose-400"}`}>
                        {simWholesaleMarginPct >= 45 ? "✅ Target Raggiunto" : "⚠️ Sotto Target (&lt; 45%)"}
                      </div>
                      <div className="text-[10px] text-neutral-400">Standard Footlink Luxury</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-3 text-xs text-white/85 flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <strong>Protezione Riservatezza B2B (Livello L6 Inderogabile):</strong> I costi unitari dei
                materiali, i compensi di lavorazione e i margini wholesale/retail del Brand sono completamente
                oscurati. Il laboratorio terzista e gli operatori visualizzano esclusivamente i consumi fisici
                netti/lordi e i codici lotto di tracciabilità.
              </div>
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

            {/* Guided BOM Material Picker (FTL-TECH-031 / PRD-010) */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>🌿</span>
                  <span>GUIDED BOM PICKER · SCEGLI DA CATALOGO MATERIALI FOOTLINK</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Auto-compilazione istantanea specifiche, fornitore, UoM e costo L6
                </span>
              </div>
              <select
                value={selectedMaterialId}
                onChange={(e) => handleSelectMaterialForAdd(e.target.value)}
                className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">— Seleziona Articolo dal Catalogo Materiali ({materials.length} disponibili) —</option>
                {materials.map((m) => {
                  const v = vendors.find((vnd) => vnd.vendor_id === m.vendor_id);
                  return (
                    <option key={m.material_id} value={m.material_id}>
                      [{m.category.toUpperCase()}] {m.material_code} · {m.name} — € {m.standard_cost.toFixed(2)} / {m.unit_of_measure} ({v ? v.company_name : "Nessun fornitore"})
                    </option>
                  );
                })}
              </select>
              {selectedMaterialWarning && (
                <div className="mt-2 text-[11px] bg-rose-100 border border-rose-300 text-rose-900 rounded-lg p-2 font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{selectedMaterialWarning}</span>
                </div>
              )}
            </div>

            {/* Step 2: Dati Materiale, Fornitore Qualificato da Albo 360° e Tinta Master */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
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
                  Seleziona da Albo Fornitori 360°
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => handleSelectVendorForAdd(e.target.value)}
                  className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#111111]"
                >
                  <option value="">— Scegli Partner Qualificato —</option>
                  {vendors.map((v) => (
                    <option key={v.vendor_id} value={v.vendor_id}>
                      {v.vendor_code} · {v.company_name}{" "}
                      {v.has_expired_critical_certs ? "🔴 [CERT. SCADUTO]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Ragione Sociale Fornitore *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Conceria Santa Croce S.p.A."
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Tinta / Finitura Master (Color Intelligence)
                </label>
                <select
                  value={selectedMasterColorId}
                  onChange={(e) => setSelectedMasterColorId(e.target.value)}
                  className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#111111]"
                >
                  <option value="">— Nessun Colore Specifico —</option>
                  {colors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.color_code} · {c.technical_name_it} ({c.hex_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const chosenVendor = vendors.find((v) => v.vendor_id === selectedVendorId);
              if (!chosenVendor || !chosenVendor.has_expired_critical_certs) return null;
              return (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs font-bold flex items-center justify-between gap-2">
                  <span>
                    🔴 BLOCCO / ALERT COMPLIANCE FORNITORE: {chosenVendor.company_name} ({chosenVendor.vendor_code}) presenta certificazioni LWG / EUDR scadute nell&apos;Albo Fornitori 360°!
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-950 text-[10px]">
                    Rischio Audit DPP UE
                  </span>
                </div>
              );
            })()}

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

        {/* FTL-TECH-018: Drag Feedback Toast */}
        {moveToast && (
          <div
            className={`mt-3 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in transition ${
              moveToast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : moveToast.type === "error"
                ? "bg-red-50 border-red-300 text-red-700"
                : "bg-blue-50 border-blue-300 text-blue-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{moveToast.type === "success" ? "✅" : moveToast.type === "error" ? "⚠️" : "ℹ️"}</span>
              <span>{moveToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setMoveToast(null)}
              className="text-xs hover:opacity-75 font-bold ml-2 px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* FTL-TECH-018: Root Drop Zone (Livello 1 / Macro-Componenti) */}
        {draggedNodeId ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDropTargetId("__ROOT__");
            }}
            onDragLeave={() => {
              if (dropTargetId === "__ROOT__") setDropTargetId(null);
            }}
            onDrop={handleDropOnRoot}
            className={`mt-3 p-3 rounded-xl border-2 border-dashed transition-all duration-150 flex items-center justify-between gap-3 ${
              dropTargetId === "__ROOT__"
                ? "border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-400"
                : "border-blue-300 bg-blue-50/50 hover:bg-blue-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📥</span>
              <div>
                <div className="text-xs font-bold text-[#111111]">
                  Rilascia qui per promuovere al Livello 1 (Radice / Macro-Componente)
                </div>
                <div className="text-[10px] text-[#707072]">
                  Il nodo trascinato <strong className="text-[#111111]">{draggedNodeId}</strong> diventerà un elemento primario indipendente senza genitore.
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#111111] text-white">
              Livello 1 (Root)
            </span>
          </div>
        ) : (
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-[#F8F8F8] border border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#707072]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💡</span>
              <span>
                <strong>Drag &amp; Drop attivo:</strong> trascina qualsiasi box tramite l&apos;icona <span className="font-mono font-bold text-black">⠿</span> per spostarlo nella gerarchia (o usa il pulsante <strong>🔀 Sposta</strong>).
              </span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-[#111111] hidden sm:inline">
              Gerarchia L1 → L2 → L3
            </span>
          </div>
        )}

        {/* Tree Render */}
        <div className="mt-2 space-y-1">{tree.map((rootNode) => renderNode(rootNode, 0))}</div>

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
                {/* Guided BOM Material Picker for Edit (FTL-TECH-031 / PRD-010) */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>🌿</span>
                      <span>AGGIORNA DA CATALOGO MATERIALI FOOTLINK</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      Sincronizza codice, specifiche e costo L6
                    </span>
                  </div>
                  <select
                    value={editMaterialId}
                    onChange={(e) => handleSelectMaterialForEdit(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">— Lascia Materiale Personalizzato o Seleziona da Catalogo —</option>
                    {materials.map((m) => {
                      const v = vendors.find((vnd) => vnd.vendor_id === m.vendor_id);
                      return (
                        <option key={m.material_id} value={m.material_id}>
                          [{m.category.toUpperCase()}] {m.material_code} · {m.name} — € {m.standard_cost.toFixed(2)} / {m.unit_of_measure} ({v ? v.company_name : "Nessun fornitore"})
                        </option>
                      );
                    })}
                  </select>
                  {editMaterialWarning && (
                    <div className="mt-2 text-[11px] bg-rose-100 border border-rose-300 text-rose-900 rounded-lg p-2 font-semibold flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{editMaterialWarning}</span>
                    </div>
                  )}
                </div>

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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Collega Partner da Albo 360°
                    </label>
                    <select
                      value={editVendorId}
                      onChange={(e) => handleSelectVendorForEdit(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-semibold bg-white"
                    >
                      <option value="">— Fornitore Manuale / Non Collegato —</option>
                      {vendors.map((v) => (
                        <option key={v.vendor_id} value={v.vendor_id}>
                          {v.vendor_code} · {v.company_name}{" "}
                          {v.has_expired_critical_certs ? "🔴 [SCADUTO]" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Tinta / Finitura Master
                    </label>
                    <select
                      value={editMasterColorId}
                      onChange={(e) => setEditMasterColorId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-semibold bg-white"
                    >
                      <option value="">— Nessun Colore Specifico —</option>
                      {colors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.color_code} · {c.technical_name_it} ({c.hex_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(() => {
                  const chosenEditVendor = vendors.find(
                    (v) => v.vendor_id === editVendorId
                  );
                  if (!chosenEditVendor || !chosenEditVendor.has_expired_critical_certs)
                    return null;
                  return (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold">
                      🔴 ALERT COMPLIANCE: {chosenEditVendor.company_name} presenta certificazioni LWG / EUDR scadute nell&apos;Albo Fornitori 360°!
                    </div>
                  );
                })()}

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

        {/* Sprint 9: Bulk Material Swap Modal (FTL-TECH-031 / ADR-017) */}
        {showBulkSwapModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-purple-200 animate-in fade-in zoom-in-95 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                    <span>🔄</span>
                    <span>SOSTITUZIONE MASSIVA MATERIALE (BULK SWAP) · ADR-017</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#111111] mt-0.5">
                    Sostituisci Materiale su Distinta Base
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkSwapModal(false)}
                  className="w-8 h-8 rounded-full border border-[#CCCCCC] hover:bg-[#F5F5F5] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-[#707072] leading-relaxed">
                Questa procedura consente di rimpiazzare in blocco tutte le occorrenze di un materiale
                nella distinta base di questa variante o di tutte le varianti collegate al modello.
              </div>

              {/* Step 1: Materiale Sorgente */}
              <div>
                <label className="block text-[11px] font-bold text-[#111111] uppercase mb-1">
                  1. Materiale Attuale da Sostituire *
                </label>
                <select
                  value={swapSourceMat}
                  onChange={(e) => setSwapSourceMat(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CCCCCC] text-xs font-semibold bg-white"
                >
                  <option value="">— Seleziona Materiale Presente in Distinta Base —</option>
                  {distinctBomMaterials.map((mat) => (
                    <option key={mat} value={mat}>
                      {mat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Nuovo Materiale dal Catalogo */}
              <div>
                <label className="block text-[11px] font-bold text-[#111111] uppercase mb-1">
                  2. Nuovo Materiale dal Catalogo FootLink *
                </label>
                <select
                  value={swapTargetMatId}
                  onChange={(e) => setSwapTargetMatId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-300 text-xs font-semibold bg-purple-50/40"
                >
                  <option value="">— Seleziona Materiale di Destinazione ({materials.length} articoli) —</option>
                  {materials.map((m) => {
                    const v = vendors.find((vnd) => vnd.vendor_id === m.vendor_id);
                    return (
                      <option key={m.material_id} value={m.material_id}>
                        [{m.category.toUpperCase()}] {m.material_code} · {m.name} — € {m.standard_cost.toFixed(2)} / {m.unit_of_measure} ({v ? v.company_name : "Nessun fornitore"})
                      </option>
                    );
                  })}
                </select>
                {(() => {
                  const targetM = materials.find((m) => m.material_id === swapTargetMatId);
                  if (!targetM) return null;
                  const v = vendors.find((vnd) => vnd.vendor_id === targetM.vendor_id);
                  return (
                    <div className="mt-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs space-y-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>{targetM.name}</span>
                        <span className="font-mono">€ {targetM.standard_cost.toFixed(2)} / {targetM.unit_of_measure}</span>
                      </div>
                      <div className="text-[10px] text-purple-800">
                        Fornitore: <strong>{v ? v.company_name : "Non associato"}</strong> · Certificazioni: {(targetM.certifications || []).join(", ") || "Nessuna"}
                      </div>
                      {v?.has_expired_critical_certs && (
                        <div className="text-[10px] text-rose-800 font-bold bg-rose-100 p-1 rounded">
                          ⚠️ Fornitore con certificazioni scadute nell&apos;Albo 360°
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Step 3: Ambito / Scope */}
              <div>
                <label className="block text-[11px] font-bold text-[#111111] uppercase mb-1">
                  3. Ambito di Applicazione della Sostituzione *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSwapScope("variant")}
                    className={`p-3 rounded-xl border text-left transition ${
                      swapScope === "variant"
                        ? "border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-300"
                        : "border-[#CCCCCC] bg-white text-neutral-700 hover:bg-[#F9F9F9]"
                    }`}
                  >
                    <div className="text-xs font-bold">🎯 Solo Questa Variante</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{variant.variant_code}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSwapScope("product")}
                    className={`p-3 rounded-xl border text-left transition ${
                      swapScope === "product"
                        ? "border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-300"
                        : "border-[#CCCCCC] bg-white text-neutral-700 hover:bg-[#F9F9F9]"
                    }`}
                  >
                    <div className="text-xs font-bold">🌐 Tutte le Varianti del Modello</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      {pimItem?.plm_variants?.length || 1} varianti collegate ({pimItem?.model_name || "Modello"})
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 4: Opzione Ricalcolo Costi */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="swapCostCheckbox"
                  checked={swapUpdateCosts}
                  onChange={(e) => setSwapUpdateCosts(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="swapCostCheckbox" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                  Ricalcola automaticamente il costo unitario con il costo standard del nuovo materiale
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowBulkSwapModal(false)}
                  className="px-4 py-2 rounded-full border border-[#CCCCCC] text-xs font-bold text-[#707072] hover:bg-[#F5F5F5] transition"
                  disabled={swapLoading}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkSwap}
                  disabled={swapLoading || !swapTargetMatId}
                  className="px-6 py-2 rounded-full bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {swapLoading ? (
                    <span>Elaborazione in corso...</span>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>Conferma ed Esegui Sostituzione Massiva</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
