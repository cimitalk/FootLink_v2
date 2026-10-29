import React, { useState, useEffect } from "react";
import {
  ColorwayExplosionPayload,
  computeLocalColorwayMatrix,
  findMasterColorById,
} from "../mockSeedData";
import {
  PimCommercialItem,
  PlmProductionVariant,
  PlmLifecycleStatus,
  ProductCategory,
  ViewerSecurityRole,
  Season,
  BomItem,
  DomainRegistryEntry,
  CarryoverStatus,
  ConstructionType,
  ProductCategoryHierarchyNode,
  BomTemplate,
  BulkImportValidationResponse,
  BulkMaterialSwapPayload,
  ColorwayMatrixResponse,
  MasterColor,
  MaterialRecord,
  ProductModel,
  TanneryBatch,
  VendorRecord,
} from "../types";
import { BomThreeLevelTree } from "./BomThreeLevelTree";
import ColorIntelligenceStudio from "./ColorIntelligenceStudio";
import ColorwayBomMatrixPanel from "./ColorwayBomMatrixPanel";
import { ProductModelsManager } from "./ProductModelsManager";

interface PlmProductsManagerProps {
  pimItems: PimCommercialItem[];
  viewerRole: ViewerSecurityRole;
  seasons: Season[];
  registries?: DomainRegistryEntry[];
  colors?: MasterColor[];
  vendors?: VendorRecord[];
  tanneryBatches?: TanneryBatch[];
  colorwayMatrices?: Record<string, ColorwayMatrixResponse>;
  // Sprint 8 / FTL-CEO-021: Product Models upstream of PIM
  models?: ProductModel[];
  onCreateModel?: (
    model: Omit<ProductModel, "model_id" | "products_count" | "created_at">
  ) => Promise<void> | void;
  onUpdateModel?: (
    modelId: string,
    model: Partial<ProductModel>
  ) => Promise<void> | void;
  onDeleteModel?: (modelId: string) => Promise<void> | void;
  onAttachProductToModel?: (
    modelId: string,
    pimItemId: string
  ) => Promise<void> | void;
  onDetachProductFromModel?: (
    modelId: string,
    pimItemId: string
  ) => Promise<void> | void;
  onSaveColorwayMatrix?: (
    variantId: string,
    matrix: ColorwayMatrixResponse
  ) => Promise<void> | void;
  onExplodeColorways?: (
    variantId: string,
    payload: ColorwayExplosionPayload
  ) => Promise<void> | void;
  onCreateColor?: (payload: Omit<MasterColor, "id">) => Promise<void> | void;
  onUpdateColor?: (
    colorId: string,
    payload: Partial<MasterColor>
  ) => Promise<void> | void;
  onDeleteColor?: (colorId: string) => Promise<void> | void;
  onSelectPim: (item: PimCommercialItem) => void;
  onSelectVariant: (variant: PlmProductionVariant) => void;
  onAddVariant: (payload: {
    variant_code: string;
    colorway_name: string;
    size_range: string;
    last_or_pattern_code: string;
    lifecycle_status: PlmLifecycleStatus;
    target_gender?: string;
    construction_type?: string;
    carryover_status?: string;
    custom_attributes?: Record<string, any>;
  }) => void;
  onCreatePimItem: (item: {
    sku_code: string;
    model_name: string;
    model_id?: string;
    category: ProductCategory;
    target_gender?: string;
    season: string;
    season_id?: string;
    collection_id?: string;
    wholesale_price_eur: number;
    retail_price_eur: number;
    commercial_description_it?: string;
    commercial_description_en?: string;
    carryover_status?: string;
    brand_line?: string;
    target_occasion?: string;
    price_tier?: string;
    initialVariant?: {
      variant_code?: string;
      colorway_name?: string;
      size_range?: string;
      last_or_pattern_code?: string;
      construction_type?: string;
      carryover_status?: string;
      lifecycle_status?: PlmLifecycleStatus;
      primary_color_id?: string;
      custom_attributes?: Record<string, any>;
    };
  }) => void;
  onUpdateVariantLifecycle: (variantId: string, status: PlmLifecycleStatus) => void;
  onUpdateProductVariant?: (
    pimItemId: string,
    variantId: string,
    payload: {
      model_name?: string;
      sku_code?: string;
      category?: ProductCategory;
      target_gender?: string;
      season_id?: string;
      variant_code?: string;
      colorway_name?: string;
      last_or_pattern_code?: string;
      size_range?: string;
      sample_base_size?: string;
      size_grading_step_pct?: number;
      lifecycle_status?: PlmLifecycleStatus;
      construction_type?: string;
      carryover_status?: string;
      custom_attributes?: Record<string, any>;
    }
  ) => void;
  onAddBomItem?: (bom: BomItem) => void;
  onUpdateBomItem?: (bom: BomItem) => void;
  onDeleteBomItem?: (bomItemId: string) => void;
  onMoveBomItem?: (bomItemId: string, newLevel: number, newParentId: string | null) => void;
  onDuplicateBomItem?: (bomItemId: string) => void;
  onRefreshData?: () => void;

  // Sprint 9: Materials Catalog & Bulk Swap
  materials?: MaterialRecord[];
  onBulkSwapMaterial?: (payload: BulkMaterialSwapPayload) => Promise<void> | void;
  onNavigateToVendor?: (vendorId: string) => void;
}

export const PlmProductsManager: React.FC<PlmProductsManagerProps> = ({
  pimItems,
  viewerRole,
  seasons,
  registries = [],
  colors = [],
  vendors = [],
  tanneryBatches = [],
  colorwayMatrices = {},
  models = [],
  materials = [],
  onBulkSwapMaterial,
  onNavigateToVendor,
  onCreateModel,
  onUpdateModel,
  onDeleteModel,
  onAttachProductToModel,
  onDetachProductFromModel,
  onSaveColorwayMatrix,
  onExplodeColorways,
  onCreateColor,
  onUpdateColor,
  onDeleteColor,
  onSelectPim,
  onSelectVariant,
  onAddVariant,
  onCreatePimItem,
  onUpdateVariantLifecycle,
  onUpdateProductVariant,
  onAddBomItem,
  onUpdateBomItem,
  onDeleteBomItem,
  onMoveBomItem,
  onDuplicateBomItem,
  onRefreshData,
}) => {
  const [selectedPimId, setSelectedPimId] = useState<string>(pimItems[0]?.pim_item_id || "");
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    pimItems[0]?.plm_variants[0]?.plm_variant_id || ""
  );
  // Sprint 8 / FTL-CEO-027: Operational Tabs Navigation (Modelli, Prodotti, Distinta Base, Colori)
  const [activeOperationalTab, setActiveOperationalTab] = useState<
    "modelli" | "catalogo" | "bom_tree" | "colorway" | "presets"
  >("modelli");
  const [bomSubTab, setBomSubTab] = useState<"tree" | "templates">("tree");

  const [showColorMatrixPanel, setShowColorMatrixPanel] = useState<boolean>(true);
  const [showColorStudioModal, setShowColorStudioModal] = useState<boolean>(false);
  const [triggerExplosionCounter, setTriggerExplosionCounter] = useState<number>(0);
  const [lifecycleGateError, setLifecycleGateError] = useState<string | null>(null);

  const handleSafeLifecycleChange = (
    variantItem: PlmProductionVariant,
    nextStatus: PlmLifecycleStatus
  ) => {
    if (nextStatus === "in_production") {
      const mat =
        colorwayMatrices[variantItem.plm_variant_id] ||
        computeLocalColorwayMatrix(variantItem, colors, tanneryBatches);
      if (mat.production_gate_blocked) {
        setLifecycleGateError(
          `🔴 GATE PRODUZIONE BLOCCATO (${variantItem.variant_code}): impossibile avviare la produzione in manovia finché sono presenti tirelle Lab-Dip rigettate o fuori tolleranza spettrofotometro (ΔE > 2.5). Approva o richiedi deroga nella Colorway BOM Matrix.`
        );
        return;
      }
    }
    setLifecycleGateError(null);
    onUpdateVariantLifecycle(variantItem.plm_variant_id, nextStatus);
  };
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [genderFilter, setGenderFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [carryoverFilter, setCarryoverFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<PlmProductionVariant & { parentPim: PimCommercialItem } | null>(null);
  const [cloneBomFromId, setCloneBomFromId] = useState<string>("");

  // Sprint 7: Deep Clone Modal State
  const [showDeepCloneModal, setShowDeepCloneModal] = useState(false);
  const [cloneTargetItem, setCloneTargetItem] = useState<(PlmProductionVariant & { parentPim: PimCommercialItem }) | null>(null);
  const [cloneNewCode, setCloneNewCode] = useState("");
  const [cloneNewColorway, setCloneNewColorway] = useState("");
  const [cloneNewSizeRange, setCloneNewSizeRange] = useState("35-42");
  const [cloneIncludeBom, setCloneIncludeBom] = useState(true);
  const [cloneReplacements, setCloneReplacements] = useState<Record<string, string>>({});
  const [isCloning, setIsCloning] = useState(false);

  // Sprint 7: BOM Template Library Modal State (FTL-CEO-014)
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTargetItem, setTemplateTargetItem] = useState<(PlmProductionVariant & { parentPim: PimCommercialItem }) | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<BomTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [templateModalTab, setTemplateModalTab] = useState<"apply" | "create_from_variant" | "edit_preset">("apply");
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetCategory, setNewPresetCategory] = useState("footwear");
  const [newPresetConstruction, setNewPresetConstruction] = useState("cassetta_cucita");
  const [newPresetDesc, setNewPresetDesc] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [editPresetName, setEditPresetName] = useState("");
  const [editPresetCategory, setEditPresetCategory] = useState("footwear");
  const [editPresetConstruction, setEditPresetConstruction] = useState("cassetta_cucita");
  const [editPresetDesc, setEditPresetDesc] = useState("");

  // Sprint 7: Bulk Import Modal State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportTab, setBulkImportTab] = useState<"template" | "validate" | "commit">("template");
  const [bulkImportType, setBulkImportType] = useState<"articles" | "bom">("articles");
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkValidationResult, setBulkValidationResult] = useState<BulkImportValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");

  // Sprint 7: Category Hierarchy
  const [categoriesList, setCategoriesList] = useState<ProductCategoryHierarchyNode[]>([]);

  // Fetch categories and templates from backend
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/v1/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategoriesList(data))
      .catch(() => {});

    fetch("http://127.0.0.1:8000/api/v1/bom-templates")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: BomTemplate[]) => {
        setAvailableTemplates(data);
        if (data.length > 0) setSelectedTemplateId(data[0].template_id);
      })
      .catch(() => {});
  }, []);

  // Quick Edit Full Form State
  const [editModelName, setEditModelName] = useState("");
  const [editSkuCode, setEditSkuCode] = useState("");
  const [editCategory, setEditCategory] = useState<ProductCategory>("footwear");
  const [editTargetGender, setEditTargetGender] = useState("unisex");
  const [editSeasonId, setEditSeasonId] = useState("");
  const [editVariantCode, setEditVariantCode] = useState("");
  const [editColorway, setEditColorway] = useState("");
  const [editLastCode, setEditLastCode] = useState("");
  const [editSizeRange, setEditSizeRange] = useState("");
  const [editSampleBaseSize, setEditSampleBaseSize] = useState("");
  const [editGradingStepPct, setEditGradingStepPct] = useState(2.8);
  const [editLifecycleStatus, setEditLifecycleStatus] = useState<PlmLifecycleStatus>("prototype");
  const [editConstructionType, setEditConstructionType] = useState<string>("cassetta_cucita");
  const [editCarryoverStatus, setEditCarryoverStatus] = useState<string>("seasonal_core");

  // New Product Form State (FTL-TECH-025: Base Model Mandatory)
  const [newSelectedModelId, setNewSelectedModelId] = useState<string>("");
  const [newModelName, setNewModelName] = useState("");
  const [newCategory, setNewCategory] = useState<ProductCategory>("footwear");
  const [newTargetGender, setNewTargetGender] = useState("unisex");
  const [newVariantCode, setNewVariantCode] = useState("");
  const [newColorway, setNewColorway] = useState("Nero Assoluto");
  const [newSizeRange, setNewSizeRange] = useState("Donna EU 35-42");
  const [newLastCode, setNewLastCode] = useState("FORMA-FM-108");
  const [newSeasonId, setNewSeasonId] = useState(seasons[0]?.season_id || "");
  const [newConstructionType, setNewConstructionType] = useState<string>("cassetta_cucita");
  const [newCarryoverStatus, setNewCarryoverStatus] = useState<string>("seasonal_core");
  // FTL-CEO-032: Selected Master Color for New PLM Variant
  const [newPrimaryColorId, setNewPrimaryColorId] = useState<string>("");

  // FTL-CEO-033: Dedicated PIM Product Creation Modal from Model
  const [showCreatePimModal, setShowCreatePimModal] = useState(false);
  const [pimModalModel, setPimModalModel] = useState<ProductModel | null>(null);
  const [pimModalSku, setPimModalSku] = useState("");
  const [pimModalName, setPimModalName] = useState("");
  const [pimModalSeasonId, setPimModalSeasonId] = useState(seasons[0]?.season_id || "");
  const [pimModalWholesaleEur, setPimModalWholesaleEur] = useState<number>(145.0);
  const [pimModalRetailEur, setPimModalRetailEur] = useState<number>(380.0);
  const [pimModalDescIt, setPimModalDescIt] = useState("");
  const [pimModalDescEn, setPimModalDescEn] = useState("");
  const [pimModalSelectedVariantIds, setPimModalSelectedVariantIds] = useState<string[]>([]);

  const handleOpenCreatePimModal = (model: ProductModel) => {
    setPimModalModel(model);
    const cleanCode = model.model_code.replace("MDL-", "");
    setPimModalSku(`SKU-${cleanCode}-${Math.floor(100 + Math.random() * 900)}`);
    setPimModalName(`${model.name} Commercial Line`);
    setPimModalSeasonId(model.season_id || seasons[0]?.season_id || "");
    setPimModalWholesaleEur(145.0);
    setPimModalRetailEur(380.0);
    setPimModalDescIt(`Articolo commerciale su base modello ${model.name}. Forma certificata ${model.last_code || "FM-108"}.`);
    setPimModalDescEn(`Commercial article based on model ${model.name}. Certified last ${model.last_code || "FM-108"}.`);
    const variantsForModel = allVariantsWithParent
      .filter((v) => v.parentPim.model_id === model.model_id || v.last_or_pattern_code === model.last_code)
      .map((v) => v.plm_variant_id);
    setPimModalSelectedVariantIds(variantsForModel);
    setShowCreatePimModal(true);
  };

  const handleCreatePimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pimModalModel || !pimModalSku.trim() || !pimModalName.trim()) return;

    const targetSeason = seasons.find((s) => s.season_id === pimModalSeasonId) || seasons[0];
    onCreatePimItem({
      sku_code: pimModalSku.trim().toUpperCase(),
      model_name: pimModalName.trim(),
      model_id: pimModalModel.model_id,
      category: (pimModalModel.category as ProductCategory) || "footwear",
      target_gender: pimModalModel.target_gender?.toLowerCase() || "unisex",
      season: targetSeason?.code || "PE26",
      season_id: targetSeason?.season_id,
      wholesale_price_eur: pimModalWholesaleEur,
      retail_price_eur: pimModalRetailEur,
      commercial_description_it: pimModalDescIt,
      commercial_description_en: pimModalDescEn,
      carryover_status: "seasonal_core",
      brand_line: "Main Line",
      target_occasion: "smart_casual",
      price_tier: "core_luxury",
      initialVariant: {
        variant_code: `PLM-${pimModalSku.trim().toUpperCase()}-V1`,
        colorway_name: "Edizione Lancio Master",
        size_range: pimModalModel.default_size_range || "38-46",
        last_or_pattern_code: pimModalModel.last_code || "FORMA-FM-108",
        construction_type: pimModalModel.sole_construction || "cassetta_cucita",
        carryover_status: "seasonal_core",
        lifecycle_status: "prototype",
      },
    });

    setShowCreatePimModal(false);
  };

  const handleSelectModelForNewProduct = (modelId: string) => {
    setNewSelectedModelId(modelId);
    const found = (models || []).find((m) => m.model_id === modelId);
    if (found) {
      setNewCategory(found.category as ProductCategory);
      setNewTargetGender(found.target_gender?.toLowerCase() || "unisex");
      setNewLastCode(found.last_code || "FORMA-FM-108");
      setNewConstructionType(found.sole_construction || "cassetta_cucita");
      setNewSizeRange(found.default_size_range || "38-46");
      if (found.season_id) setNewSeasonId(found.season_id);
      if (!newModelName.trim() || models?.some((m) => m.name === newModelName)) {
        setNewModelName(found.name);
      }
      if (!newVariantCode.trim() || newVariantCode.startsWith("PLM-") || newVariantCode.startsWith("FTL-")) {
        const cleanCode = found.model_code.replace("MDL-", "");
        setNewVariantCode(`PLM-${cleanCode}-${Math.floor(10 + Math.random() * 90)}`);
      }
    }
  };


  // Flatten all variants with parent PIM context
  const allVariantsWithParent = pimItems.flatMap((pim) =>
    pim.plm_variants.map((v) => ({
      ...v,
      parentPim: pim,
      isActive: (v as any).is_active !== false,
    }))
  );

  const currentPim = pimItems.find((p) => p.pim_item_id === selectedPimId) || pimItems[0];
  const currentVariant =
    currentPim?.plm_variants.find((v) => v.plm_variant_id === selectedVariantId) ||
    currentPim?.plm_variants[0];

  // Filtering
  const filteredVariants = allVariantsWithParent.filter((item) => {
    if (categoryFilter !== "ALL" && item.parentPim.category !== categoryFilter) return false;
    if (genderFilter !== "ALL") {
      const g = (item.target_gender || item.parentPim.target_gender || "unisex").toLowerCase();
      if (g !== genderFilter.toLowerCase()) return false;
    }
    if (statusFilter !== "ALL" && item.lifecycle_status !== statusFilter) return false;
    if (carryoverFilter !== "ALL") {
      const co = (item.carryover_status || item.parentPim.carryover_status || "seasonal_core").toLowerCase();
      if (co !== carryoverFilter.toLowerCase()) return false;
    }
    if (onlyActive && !item.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = item.variant_code.toLowerCase().includes(q);
      const matchName = item.parentPim.model_name.toLowerCase().includes(q);
      const matchColor = item.colorway_name.toLowerCase().includes(q);
      const matchLast = (item.last_or_pattern_code || "").toLowerCase().includes(q);
      const matchGender = (item.target_gender || item.parentPim.target_gender || "").toLowerCase().includes(q);
      const matchCarryover = (item.carryover_status || item.parentPim.carryover_status || "").toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchColor && !matchLast && !matchGender && !matchCarryover) return false;
    }
    return true;
  });

  const handleRowClick = (pimId: string, varId: string) => {
    setSelectedPimId(pimId);
    setSelectedVariantId(varId);
    const targetPim = pimItems.find((p) => p.pim_item_id === pimId);
    if (targetPim) {
      onSelectPim(targetPim);
      const targetVar = targetPim.plm_variants.find((v) => v.plm_variant_id === varId);
      if (targetVar) onSelectVariant(targetVar);
    }
  };

  // Sprint 7: Deep Clone Handlers
  const handleOpenDeepClone = (item: PlmProductionVariant & { parentPim: PimCommercialItem }) => {
    setCloneTargetItem(item);
    setCloneNewCode(`${item.variant_code}-V2`);
    setCloneNewColorway(`${item.colorway_name} (Variante)`);
    setCloneNewSizeRange(item.size_range || "35-42");
    setCloneIncludeBom(true);
    const mats: Record<string, string> = {};
    item.bom_items.filter((b) => b.level === 1).forEach((b) => {
      mats[b.material_name] = b.material_name;
    });
    setCloneReplacements(mats);
    setShowDeepCloneModal(true);
  };

  const handleExecuteDeepClone = async () => {
    if (!cloneTargetItem || !cloneNewCode.trim()) return;
    setIsCloning(true);
    try {
      const payload = {
        new_variant_code: cloneNewCode.trim().toUpperCase(),
        new_colorway_name: cloneNewColorway.trim(),
        new_size_range: cloneNewSizeRange,
        clone_bom: cloneIncludeBom,
        material_replacements: cloneReplacements,
      };
      const res = await fetch(`http://127.0.0.1:8000/api/v1/plm-variants/${cloneTargetItem.plm_variant_id}/deep-clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowDeepCloneModal(false);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.warn("Clone request error:", err);
    } finally {
      setIsCloning(false);
    }
  };

  // Sprint 7: Apply BOM Template Handlers
  const handleOpenTemplateModal = (item: PlmProductionVariant & { parentPim: PimCommercialItem }) => {
    setTemplateTargetItem(item);
    if (availableTemplates.length > 0) {
      setSelectedTemplateId(availableTemplates[0].template_id);
    }
    setShowTemplateModal(true);
  };

  const handleExecuteApplyTemplate = async () => {
    if (!templateTargetItem || !selectedTemplateId) return;
    setIsApplyingTemplate(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/bom-templates/${selectedTemplateId}/apply-to-variant/${templateTargetItem.plm_variant_id}`,
        { method: "POST" }
      );
      if (res.ok) {
        setShowTemplateModal(false);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.warn("Apply template error:", err);
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  // FTL-CEO-014: Preset BOM Management Handlers
  const handleCreatePresetFromVariant = async () => {
    if (!templateTargetItem || !newPresetName.trim()) return;
    setIsSavingPreset(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/bom-templates/create-from-variant/${templateTargetItem.plm_variant_id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newPresetName.trim(),
            category_id: newPresetCategory,
            construction_type: newPresetConstruction,
            description: newPresetDesc.trim(),
          }),
        }
      );
      if (res.ok) {
        const created: BomTemplate = await res.json();
        setAvailableTemplates((prev) => [...prev, created]);
        setSelectedTemplateId(created.template_id);
        setNewPresetName("");
        setNewPresetDesc("");
        setTemplateModalTab("apply");
      }
    } catch (err) {
      console.warn("Create preset error:", err);
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleUpdatePreset = async () => {
    const tpl = availableTemplates.find((t) => t.template_id === selectedTemplateId);
    if (!tpl || !editPresetName.trim()) return;
    setIsSavingPreset(true);
    try {
      const updatedPayload = {
        ...tpl,
        name: editPresetName.trim(),
        category_id: editPresetCategory,
        construction_type: editPresetConstruction,
        description: editPresetDesc.trim(),
      };
      const res = await fetch(`http://127.0.0.1:8000/api/v1/bom-templates/${selectedTemplateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
      });
      if (res.ok) {
        const updated: BomTemplate = await res.json();
        setAvailableTemplates((prev) =>
          prev.map((t) => (t.template_id === updated.template_id ? updated : t))
        );
        setTemplateModalTab("apply");
      }
    } catch (err) {
      console.warn("Update preset error:", err);
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleDeletePreset = async (templateId: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare definitivamente questo preset BOM?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/bom-templates/${templateId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const remaining = availableTemplates.filter((t) => t.template_id !== templateId);
        setAvailableTemplates(remaining);
        if (remaining.length > 0) {
          setSelectedTemplateId(remaining[0].template_id);
        } else {
          setSelectedTemplateId("");
        }
        setTemplateModalTab("apply");
      }
    } catch (err) {
      console.warn("Delete preset error:", err);
    }
  };

  // FTL-CEO-015: Group size scales by category & gender
  const getSizeScaleOptions = (cat: string, gender: string) => {
    const scales = registries.filter((r) => r.registry_name === "size_scales" && r.is_active);
    if (scales.length === 0) return null;

    const recommended: typeof scales = [];
    const others: typeof scales = [];

    scales.forEach((s) => {
      const metaCat = s.meta?.main_category || s.meta?.category;
      const metaGender = s.meta?.target_gender;

      const catMatches = !metaCat || metaCat === cat;
      const genderMatches =
        !metaGender ||
        metaGender === "unisex" ||
        gender === "unisex" ||
        metaGender.toLowerCase() === gender.toLowerCase();

      if (catMatches && genderMatches) {
        recommended.push(s);
      } else {
        others.push(s);
      }
    });

    return { recommended, others };
  };

  // FTL-PROD-011: Group construction types by category
  const getConstructionTypeOptions = (cat: string) => {
    const constructions = registries.filter((r) => r.registry_name === "construction_types" && r.is_active);
    if (constructions.length === 0) return null;

    const categorySpecific = constructions.filter((c) => {
      const cCat = c.meta?.category || "footwear";
      return cCat === cat;
    });
    const others = constructions.filter((c) => {
      const cCat = c.meta?.category || "footwear";
      return cCat !== cat;
    });

    return { categorySpecific, others };
  };

  // Sprint 7: Bulk Import Handlers
  const handleValidateBulk = async () => {
    if (!bulkCsvText.trim()) return;
    setIsValidating(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/bulk-import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ import_type: bulkImportType, csv_content: bulkCsvText }),
      });
      if (res.ok) {
        const data = await res.json();
        setBulkValidationResult(data);
        setBulkImportTab("validate");
      }
    } catch (err) {
      console.warn("Validate bulk error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCommitBulk = async () => {
    if (!bulkValidationResult || bulkValidationResult.valid_rows_count === 0) return;
    setIsCommitting(true);
    try {
      const validRows = bulkValidationResult.rows.filter((r) => r.is_valid).map((r) => r.parsed_data);
      const res = await fetch("http://127.0.0.1:8000/api/v1/bulk-import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ import_type: bulkImportType, valid_rows: validRows }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommitMessage(data.message);
        setBulkImportTab("commit");
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.warn("Commit bulk error:", err);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Codice Variante PLM",
      "Modello Industriale",
      "Categoria",
      "Lavorazione",
      "Piramide Collezione",
      "Genere Target",
      "Colore / Variante",
      "Forma / Patron",
      "Scala Taglie",
      "Stato Ciclo Vita",
      "Componenti BOM",
      "Costo Materiali (€)",
      "Costo Manodopera (€)",
      "Costo Industriale Totale (€)",
    ];

    const rows = filteredVariants.map((item) => {
      const matCost = item.bom_items.reduce(
        (sum, b) => sum + (b.unit_consumption * (1 + b.waste_percentage / 100)) * (b.unit_cost_eur || 0),
        0
      );
      const laborCost = item.standard_labor_cost_eur || 28.0;
      const totalCost = matCost + laborCost;

      return [
        `"${item.variant_code}"`,
        `"${item.parentPim.model_name}"`,
        `"${item.parentPim.category}"`,
        `"${item.construction_type || 'cassetta_cucita'}"`,
        `"${item.carryover_status || item.parentPim.carryover_status || 'seasonal_core'}"`,
        `"${item.target_gender || item.parentPim.target_gender || 'unisex'}"`,
        `"${item.colorway_name}"`,
        `"${item.last_or_pattern_code || 'N/D'}"`,
        `"${item.size_range}"`,
        `"${item.lifecycle_status}"`,
        item.bom_items.length,
        viewerRole === "brand" ? matCost.toFixed(2) : '"[PROTECTED_L6]"',
        viewerRole === "brand" ? laborCost.toFixed(2) : '"[PROTECTED_L6]"',
        viewerRole === "brand" ? totalCost.toFixed(2) : '"[PROTECTED_L6]"',
      ].join(",");
    });

    const csvContent = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `footlink_prodotti_plm_bom_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !newVariantCode.trim()) return;

    const targetSeason = seasons.find((s) => s.season_id === newSeasonId) || seasons[0];
    const generatedSku = `SKU-${newVariantCode.trim().toUpperCase()}`;

    // Create Commercial PIM Parent with Model association & linked initial PLM Variant (FTL-CEO-028)
    onCreatePimItem({
      sku_code: generatedSku,
      model_name: newModelName.trim(),
      model_id: newSelectedModelId || undefined,
      category: newCategory,
      target_gender: newTargetGender,
      season: targetSeason?.code || "PE26",
      season_id: targetSeason?.season_id,
      wholesale_price_eur: 145.0,
      retail_price_eur: 380.0,
      carryover_status: newCarryoverStatus,
      brand_line: "Main Line",
      target_occasion: "smart_casual",
      price_tier: "core_luxury",
      initialVariant: {
        variant_code: newVariantCode.trim().toUpperCase(),
        colorway_name: newColorway.trim(),
        primary_color_id:
          newPrimaryColorId && newPrimaryColorId !== "custom"
            ? newPrimaryColorId
            : undefined,
        size_range: newSizeRange.trim(),
        last_or_pattern_code: newLastCode.trim().toUpperCase(),
        construction_type: newConstructionType,
        carryover_status: newCarryoverStatus,
        lifecycle_status: "prototype",
        custom_attributes: {
          cloned_bom_source: cloneBomFromId || null,
          primary_color_id:
            newPrimaryColorId && newPrimaryColorId !== "custom"
              ? newPrimaryColorId
              : undefined,
          hex_code: colors?.find(
            (c) => c.id === newPrimaryColorId || c.color_id === newPrimaryColorId
          )?.hex_code,
        },
      },
    });

    // Reset Form
    setNewSelectedModelId("");
    setNewModelName("");
    setNewVariantCode("");
    setNewPrimaryColorId("");
    setShowCreateModal(false);
  };

  const handleOpenQuickEdit = (item: PlmProductionVariant & { parentPim: PimCommercialItem }) => {
    setEditingVariant(item);
    setEditModelName(item.parentPim.model_name);
    setEditSkuCode(item.parentPim.sku_code);
    setEditCategory(item.parentPim.category);
    setEditTargetGender(item.target_gender || item.parentPim.target_gender || "unisex");
    setEditSeasonId(item.parentPim.season_id || seasons[0]?.season_id || "");
    setEditVariantCode(item.variant_code);
    setEditColorway(item.colorway_name);
    setEditLastCode(item.last_or_pattern_code || "");
    setEditSizeRange(item.size_range);
    setEditSampleBaseSize(item.sample_base_size || (item.parentPim.category === "apparel" ? "IT 50" : "42"));
    setEditGradingStepPct(item.size_grading_step_pct || (item.parentPim.category === "apparel" ? 3.4 : 2.8));
    setEditLifecycleStatus(item.lifecycle_status);
    setEditConstructionType(item.construction_type || "cassetta_cucita");
    setEditCarryoverStatus(item.carryover_status || item.parentPim.carryover_status || "seasonal_core");
    setShowQuickEditModal(true);
  };

  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    if (onUpdateProductVariant) {
      onUpdateProductVariant(editingVariant.parentPim.pim_item_id, editingVariant.plm_variant_id, {
        model_name: editModelName.trim(),
        sku_code: editSkuCode.trim().toUpperCase(),
        category: editCategory,
        target_gender: editTargetGender,
        season_id: editSeasonId,
        variant_code: editVariantCode.trim().toUpperCase(),
        colorway_name: editColorway.trim(),
        last_or_pattern_code: editLastCode.trim().toUpperCase(),
        size_range: editSizeRange.trim(),
        sample_base_size: editSampleBaseSize.trim(),
        size_grading_step_pct: Number(editGradingStepPct) || 2.8,
        lifecycle_status: editLifecycleStatus,
        construction_type: editConstructionType,
        carryover_status: editCarryoverStatus,
      });
    } else {
      onUpdateVariantLifecycle(editingVariant.plm_variant_id, editLifecycleStatus);
    }
    setShowQuickEditModal(false);
  };

  const handleCreateProductFromModel = (model: ProductModel) => {
    setNewSelectedModelId(model.model_id);
    setNewModelName(model.name);
    setNewCategory(model.category as ProductCategory);
    setNewTargetGender(model.target_gender?.toLowerCase() || "unisex");
    setNewLastCode(model.last_code || "FORMA-FM-108");
    setNewConstructionType(model.sole_construction || "cassetta_cucita");
    setNewSizeRange(model.default_size_range || "38-46");
    if (model.season_id) setNewSeasonId(model.season_id);
    setNewVariantCode(`FTL-${model.model_code.replace("MDL-", "")}-01`);
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner: Area Prodotti PLM (FTL-CEO-009) */}
      <div className="bg-[#111111] text-white rounded-3xl p-8 shadow-2xl border border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                02 · PRODOTTI (PLM &amp; BOM) (FTL-TECH-027)
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Modelleria Fabbrica · Distinta Base a 3 Livelli · Costing L6 Riservato
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
              Area Prodotti PLM & Gestione Distinte Base (BOM)
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Area tecnica dedicata alla creazione rapida dei modelli industriali, cartamodelli e forme,
              costificazione accurata con sfrido percentuale e congelamento degli snapshot di produzione.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowColorStudioModal(true)}
              className="px-4 py-2.5 rounded-full border border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span>🎨 Cartella Colori Master</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowColorMatrixPanel(true);
                setTriggerExplosionCounter((c) => c + 1);
              }}
              className="px-4 py-2.5 rounded-full border border-sky-400/50 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span>⚡ 1-Click Colorway Explosion</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkImportTab("template");
                setShowBulkImportModal(true);
              }}
              className="px-4 py-2.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span>📥 Import Massivo CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-full border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span>📊 Esporta Excel / CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#111111] font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <span>+ Nuovo Prodotto PLM</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-neutral-800 text-xs">
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Varianti Tecniche PLM</span>
            <div className="text-xl font-extrabold text-white mt-1">{allVariantsWithParent.length}</div>
            <span className="text-[10px] text-emerald-400">Attive in fabbrica</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Ingegnerizzate con BOM</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {allVariantsWithParent.filter((v) => v.bom_items.length > 0).length}
            </div>
            <span className="text-[10px] text-neutral-400">Con distinta a 3 livelli</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">In Produzione</span>
            <div className="text-xl font-extrabold text-white mt-1">
              {allVariantsWithParent.filter((v) => v.lifecycle_status === "in_production").length}
            </div>
            <span className="text-[10px] text-neutral-400">Lotti autorizzati</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Policy Costi Industriali</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {viewerRole === "brand" ? "Livello L6 Attivo" : "Costi Mascherati 0 €"}
            </div>
            <span className="text-[10px] text-neutral-400">Segregazione automatica</span>
          </div>
        </div>
      </div>

      {lifecycleGateError && (
        <div className="bg-rose-50 border-2 border-rose-500 text-rose-950 rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 text-xs font-bold">
          <span>{lifecycleGateError}</span>
          <button
            type="button"
            onClick={() => setLifecycleGateError(null)}
            className="px-3 py-1 rounded-lg bg-rose-200 hover:bg-rose-300 text-rose-950 shrink-0"
          >
            ✕ Chiudi Alert
          </button>
        </div>
      )}

      {/* Sprint 8 / FTL-CEO-027: Operational Navigation Tabs Reorganized: Modelli, Prodotti, Distinta Base, Colori */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveOperationalTab("modelli")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeOperationalTab === "modelli"
              ? "bg-[#111111] text-white shadow-sm"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <span>📐</span>
          <span>Modelli</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-950 font-extrabold">
            {models?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOperationalTab("catalogo")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeOperationalTab === "catalogo"
              ? "bg-[#111111] text-white shadow-sm"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <span>📦</span>
          <span>Prodotti</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 text-neutral-300">
            {filteredVariants.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveOperationalTab("bom_tree");
            setBomSubTab("tree");
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeOperationalTab === "bom_tree"
              ? "bg-[#111111] text-white shadow-sm"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <span>🌿</span>
          <span>Distinta Base</span>
          {currentVariant && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
              {currentVariant.variant_code}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveOperationalTab("colorway")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeOperationalTab === "colorway"
              ? "bg-[#111111] text-white shadow-sm"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <span>🎨</span>
          <span>Colori</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-200 text-sky-950 font-bold">
            ΔE ≤ 2.5
          </span>
        </button>
      </div>

      {/* Sticky Active Variant Context Bar (FTL-CEO-020 & FTL-CEO-034: Ancoraggio Corretto & Distinzione Modello vs Variante) */}
      {currentVariant && (
        <div className="sticky top-[73px] z-30 bg-neutral-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-xl border border-neutral-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
              {(() => {
                const pc = findMasterColorById(colors, currentVariant.primary_color_id);
                return pc ? (
                  <span
                    className="w-5 h-5 rounded-full border border-white/40 shadow-xs"
                    style={{ backgroundColor: pc.hex_code }}
                    title={`${pc.color_code} - ${pc.technical_name_it}`}
                  />
                ) : (
                  "👟"
                );
              })()}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black text-emerald-400">
                  {currentVariant.variant_code}
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {currentVariant.colorway_name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  PIM: {currentPim?.sku_code} ({currentPim?.model_name})
                </span>
                {(() => {
                  const modelObj = (models || []).find((m) => m.model_id === currentPim?.model_id);
                  return modelObj ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                      📐 Modello: {modelObj.model_code} · {modelObj.name}
                    </span>
                  ) : currentPim?.model_id ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                      📐 Modello: {currentPim.model_id}
                    </span>
                  ) : null;
                })()}
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-2 flex-wrap">
                <span>Forma: <strong className="text-neutral-200 font-mono">{currentVariant.last_or_pattern_code}</strong></span>
                <span>·</span>
                <span>Scala: <strong className="text-neutral-200 font-mono">{currentVariant.size_range}</strong></span>
                <span>·</span>
                <span>Costruzione: <strong className="text-neutral-200">{currentVariant.construction_type || "Standard"}</strong></span>
                <span>·</span>
                <span>{currentVariant.bom_items.length} componenti BOM</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Quick Variant Switcher Dropdown */}
            <select
              value={currentVariant.plm_variant_id}
              onChange={(e) => {
                const found = allVariantsWithParent.find(
                  (item) => item.plm_variant_id === e.target.value
                );
                if (found) {
                  setSelectedPimId(found.parentPim.pim_item_id);
                  setSelectedVariantId(found.plm_variant_id);
                  onSelectPim(found.parentPim);
                  onSelectVariant(found);
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-800 text-white border border-neutral-700 hover:border-neutral-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
              title="Passa rapidamente ad un'altra variante PLM attiva"
            >
              {pimItems.map((pim) => (
                <optgroup key={pim.pim_item_id} label={`${pim.sku_code} - ${pim.model_name}`}>
                  {pim.plm_variants.map((v) => (
                    <option key={v.plm_variant_id} value={v.plm_variant_id}>
                      {v.variant_code} ({v.colorway_name}) [{v.lifecycle_status}]
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* Quick Lifecycle Status Dropdown */}
            <select
              value={currentVariant.lifecycle_status}
              onChange={(e) =>
                handleSafeLifecycleChange(
                  currentVariant,
                  e.target.value as PlmLifecycleStatus
                )
              }
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-800 text-amber-300 border border-neutral-700"
              title="Avanzamento Gate Ciclo di Vita PLM"
            >
              <option value="new_from_pim">🏷️ Nuovo da PIM</option>
              <option value="prototype">Prototipo</option>
              <option value="sample">Campione</option>
              <option value="industrialized">Industrializzato</option>
              <option value="in_production">In Produzione</option>
              <option value="archived">Archiviato</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB 1: Modelli di Base (Forme & Cartamodelli) - FTL-CEO-021 & FTL-CEO-027 */}
      {activeOperationalTab === "modelli" && (
        <ProductModelsManager
          models={models}
          pimItems={pimItems}
          seasons={seasons}
          registries={registries}
          viewerRole={viewerRole}
          onCreateModel={onCreateModel || (() => {})}
          onUpdateModel={onUpdateModel || (() => {})}
          onDeleteModel={onDeleteModel || (() => {})}
          onAttachProduct={onAttachProductToModel || (() => {})}
          onDetachProduct={onDetachProductFromModel || (() => {})}
          onCreateProductFromModel={handleCreateProductFromModel}
          onCreatePimFromModel={handleOpenCreatePimModal}
          onSelectPimItem={(pim) => {
            setSelectedPimId(pim.pim_item_id);
            if (pim.plm_variants && pim.plm_variants.length > 0) {
              setSelectedVariantId(pim.plm_variants[0].plm_variant_id);
              onSelectVariant(pim.plm_variants[0]);
            }
            onSelectPim(pim);
            setActiveOperationalTab("catalogo");
          }}
        />
      )}

      {/* TAB 2: Prodotti & Varianti PLM (Stile) */}
      {activeOperationalTab === "catalogo" && (
      <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Cerca codice, modello, colore, forma..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold w-72 focus:outline-none focus:border-[#111111]"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold text-[#111111]"
            >
              <option value="ALL">Tutte le Categorie</option>
              <option value="footwear">👟 Calzature</option>
              <option value="leather_goods">👜 Pelletteria</option>
              <option value="apparel">🧥 Abbigliamento</option>
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold text-[#111111]"
            >
              <option value="ALL">Tutti i Generi</option>
              <option value="donna">♀ Donna</option>
              <option value="uomo">♂ Uomo</option>
              <option value="unisex">⚥ Unisex</option>
              <option value="bambino">🧒 Bambino</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold text-[#111111]"
            >
              <option value="ALL">Tutti gli Stati</option>
              <option value="new_from_pim">🏷️ Nuovo da PIM</option>
              <option value="prototype">Prototipo</option>
              <option value="sample">Campione</option>
              <option value="industrialized">Industrializzato</option>
              <option value="in_production">In Produzione</option>
              <option value="archived">Archiviato</option>
            </select>

            <select
              value={carryoverFilter}
              onChange={(e) => setCarryoverFilter(e.target.value)}
              className="px-3 py-2 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs font-semibold text-[#111111]"
            >
              <option value="ALL">Tutte le Piramidi</option>
              <option value="carryover_continuativo">⭐ Continuativo / Carryover</option>
              <option value="seasonal_core">🌿 Stagionale Core</option>
              <option value="trend_drop">⚡ Trend Drop</option>
              <option value="capsule_limited">💎 Capsule Limited</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs font-bold text-[#707072] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="rounded text-[#111111]"
              />
              Solo Attivi
            </label>
          </div>

          <span className="text-xs text-[#707072] font-semibold">
            Visualizzati: <strong className="text-[#111111]">{filteredVariants.length}</strong> modelli PLM
          </span>
        </div>

        {/* Advanced Data Table */}
        <div className="overflow-x-auto border border-[#E5E5E5] rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F5] border-b border-[#E5E5E5] text-[#707072] uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Codice Variante PLM</th>
                <th className="py-3 px-4">Modello Industriale</th>
                <th className="py-3 px-4">Categoria &amp; Costruzione</th>
                <th className="py-3 px-4">Piramide &amp; Genere</th>
                <th className="py-3 px-4">Forma / Patron</th>
                <th className="py-3 px-4">Scala Taglie</th>
                <th className="py-3 px-4">Stato Ciclo Vita</th>
                <th className="py-3 px-4 text-center">BOM (L1/L2/L3)</th>
                <th className="py-3 px-4 text-right">Costo Industriale L6</th>
                <th className="py-3 px-4 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredVariants.map((item) => {
                const isSelected = item.plm_variant_id === selectedVariantId;
                const matCost = item.bom_items.reduce(
                  (sum, b) => sum + (b.unit_consumption * (1 + b.waste_percentage / 100)) * (b.unit_cost_eur || 0),
                  0
                );
                const totalCost = matCost + (item.standard_labor_cost_eur || 28.0);
                const gender = (item.target_gender || item.parentPim.target_gender || "unisex").toLowerCase();
                const construction = item.construction_type || "cassetta_cucita";
                const carryover = item.carryover_status || item.parentPim.carryover_status || "seasonal_core";

                return (
                  <tr
                    key={item.plm_variant_id}
                    onClick={() => handleRowClick(item.parentPim.pim_item_id, item.plm_variant_id)}
                    className={`cursor-pointer transition hover:bg-[#F9F9F9] ${
                      isSelected ? "bg-[#F5F5F5] font-semibold" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#111111] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {item.variant_code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#111111]">{item.parentPim.model_name}</div>
                      <div className="text-[11px] text-[#707072]">{item.colorway_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#111111] capitalize">
                        {item.parentPim.category === "footwear" ? "👟 Calzatura" : item.parentPim.category === "leather_goods" ? "👜 Pelletteria" : item.parentPim.category === "apparel" ? "🧥 Abbigliamento" : item.parentPim.category}
                      </div>
                      <div className="mt-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                          {construction === "cassetta_cucita" ? "Cassetta Cucita" :
                           construction === "blake" ? "Blake Artigianale" :
                           construction === "goodyear" ? "Goodyear Welton" :
                           construction === "sacchetto" ? "Sacchetto (Bologna)" :
                           construction === "slip_lasting" ? "Slip Lasting / Strobel" :
                           construction === "tubolare" ? "Tubolare Mocassino" :
                           construction === "costa_taglio_vivo" ? "Costa Taglio Vivo" :
                           construction === "rimboccato" ? "Rimboccato Lusso" : construction}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="mb-1">
                        {carryover === "carryover_continuativo" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            ⭐ Carryover
                          </span>
                        )}
                        {carryover === "trend_drop" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-800 border border-purple-300">
                            ⚡ Trend Drop
                          </span>
                        )}
                        {carryover === "capsule_limited" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
                            💎 Capsule
                          </span>
                        )}
                        {carryover === "seasonal_core" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            🌿 Seasonal Core
                          </span>
                        )}
                      </div>
                      <div>
                        {gender === "donna" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-100 text-pink-700 border border-pink-200">
                            ♀ Donna
                          </span>
                        )}
                        {gender === "uomo" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
                            ♂ Uomo
                          </span>
                        )}
                        {gender === "bambino" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            🧒 Bambino
                          </span>
                        )}
                        {gender !== "donna" && gender !== "uomo" && gender !== "bambino" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            ⚥ Unisex
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      {item.last_or_pattern_code || "FORMA-STD"}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">{item.size_range}</td>
                    <td className="py-3 px-4">
                      <select
                        value={item.lifecycle_status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleSafeLifecycleChange(
                            item,
                            e.target.value as PlmLifecycleStatus
                          )
                        }
                        className="bg-white border border-[#D5D5D5] rounded-full px-2.5 py-1 text-[11px] font-bold text-[#111111]"
                      >
                        <option value="new_from_pim">🏷️ Nuovo da PIM</option>
                        <option value="prototype">Prototipo</option>
                        <option value="sample">Campione</option>
                        <option value="industrialized">Industrializzato</option>
                        <option value="in_production">In Produzione</option>
                        <option value="archived">Archiviato</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.bom_items.length > 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.bom_items.length} Componenti
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {viewerRole === "brand" ? (
                        <span>€ {totalCost.toFixed(2)}</span>
                      ) : (
                        <span className="text-[#707072] text-[10px]">🔒 [L6 MASKED]</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          title="Apri Distinta Base a 3 Livelli"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPimId(item.parentPim.pim_item_id);
                            setSelectedVariantId(item.plm_variant_id);
                            onSelectPim(item.parentPim);
                            onSelectVariant(item);
                            setActiveOperationalTab("bom_tree");
                          }}
                          className="px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-bold text-[10px] text-emerald-800 hover:border-emerald-500 transition flex items-center gap-1"
                        >
                          <span>🌿 BOM</span>
                        </button>
                        <button
                          type="button"
                          title="Apri Matrice Colorway & Lab-Dip"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPimId(item.parentPim.pim_item_id);
                            setSelectedVariantId(item.plm_variant_id);
                            onSelectPim(item.parentPim);
                            onSelectVariant(item);
                            setActiveOperationalTab("colorway");
                          }}
                          className="px-2.5 py-1 rounded-full border border-sky-300 bg-sky-50 hover:bg-sky-100 font-bold text-[10px] text-sky-800 hover:border-sky-500 transition flex items-center gap-1"
                        >
                          <span>🎨 Colorway</span>
                        </button>
                        <button
                          type="button"
                          title="Modifica Rapida Parametri"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQuickEdit(item);
                          }}
                          className="px-2.5 py-1 rounded-full border border-[#D5D5D5] bg-white hover:bg-[#F5F5F5] font-bold text-[10px] text-[#111111] hover:border-black transition"
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          title="Duplica variante con distinta base ricorsiva"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeepClone(item);
                          }}
                          className="px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold text-[10px] text-blue-700 hover:border-blue-400 transition flex items-center gap-1"
                        >
                          <span>📋 Duplica</span>
                        </button>
                        <button
                          type="button"
                          title="Applica architettura BOM certificata"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTemplateModal(item);
                          }}
                          className="px-2.5 py-1 rounded-full border border-purple-200 bg-purple-50 hover:bg-purple-100 font-bold text-[10px] text-purple-700 hover:border-purple-400 transition flex items-center gap-1"
                        >
                          <span>✨ Preset BOM</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* TAB 3: Distinta Base Ingegnerizzata & Template BOM (FTL-TECH-026) */}
      {(activeOperationalTab === "bom_tree" || activeOperationalTab === "presets") && (
        <div className="space-y-4">
          {/* Sub-bar inside Distinta Base (FTL-TECH-026) */}
          <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-2xl p-2.5 shadow-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBomSubTab("tree");
                  if (activeOperationalTab === "presets") setActiveOperationalTab("bom_tree");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  bomSubTab === "tree" && activeOperationalTab !== "presets"
                    ? "bg-[#111111] text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <span>🌿 Struttura Distinta Base</span>
                {currentVariant && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-emerald-300">
                    {currentVariant.variant_code}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setBomSubTab("templates")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  bomSubTab === "templates" || activeOperationalTab === "presets"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100"
                }`}
              >
                <span>⚙️ Template BOM</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    bomSubTab === "templates" || activeOperationalTab === "presets"
                      ? "bg-purple-900 text-white"
                      : "bg-purple-200 text-purple-900"
                  }`}
                >
                  {availableTemplates.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveOperationalTab("colorway")}
                className="px-3 py-1.5 rounded-xl border border-sky-300 bg-sky-50 text-xs font-bold text-sky-800 hover:bg-sky-100 transition"
              >
                🎨 Apri Colori →
              </button>
              <button
                type="button"
                onClick={() => setActiveOperationalTab("catalogo")}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-800 hover:bg-neutral-100 transition"
              >
                ← Torna a Prodotti
              </button>
            </div>
          </div>

          {bomSubTab === "tree" && activeOperationalTab !== "presets" ? (
            currentVariant ? (
              <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">
                      INGEGNERIA DI PRODUZIONE &amp; DISTINTA BASE A 3 LIVELLI
                    </span>
                    <h3 className="text-xl font-extrabold text-[#111111]">
                      BOM Ingegnerizzata: {currentVariant.variant_code} ({currentPim?.model_name})
                    </h3>
                  </div>
                </div>

                <BomThreeLevelTree
                  variant={currentVariant}
                  pimItem={currentPim}
                  viewerRole={viewerRole}
                  vendors={vendors}
                  colors={colors}
                  materials={materials}
                  onAddBomItem={onAddBomItem || (() => {})}
                  onUpdateBomItem={onUpdateBomItem}
                  onDeleteBomItem={onDeleteBomItem}
                  onMoveBomItem={onMoveBomItem}
                  onDuplicateBomItem={onDuplicateBomItem}
                  onBulkSwapMaterial={onBulkSwapMaterial}
                  onNavigateToVendor={onNavigateToVendor}
                />
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Seleziona una variante dal catalogo per visualizzarne la Distinta Base.
              </div>
            )
          ) : (
            /* Sub-view: Template BOM (FTL-TECH-026) */
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                    ⚙️ Template BOM (Incluso in Distinta Base)
                  </span>
                  <h3 className="text-xl font-extrabold text-[#111111] mt-1">
                    Preset Distinte Base Industriali ({availableTemplates.length})
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Architetture di distinta base certificate da applicare rapidamente alle varianti di produzione.
                  </p>
                </div>
                {currentVariant && (
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateTargetItem({ ...currentVariant, parentPim: currentPim });
                      setTemplateModalTab("create_from_variant");
                      setShowTemplateModal(true);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition shrink-0"
                  >
                    ➕ Salva Variante Attuale come Preset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTemplates.map((tpl) => (
                  <div
                    key={tpl.template_id}
                    className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50 hover:bg-white hover:border-neutral-400 transition space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          {tpl.template_id}
                        </span>
                        <h4 className="font-bold text-sm text-[#111111] mt-1">{tpl.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {tpl.items?.length || 0} nodi
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 line-clamp-2">{tpl.description || "Nessuna descrizione"}</p>

                    <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-neutral-500 font-mono">{tpl.construction_type}</span>
                      {currentVariant && (
                        <button
                          type="button"
                          onClick={() => {
                            setTemplateTargetItem({ ...currentVariant, parentPim: currentPim });
                            setSelectedTemplateId(tpl.template_id);
                            setTemplateModalTab("apply");
                            setShowTemplateModal(true);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition"
                        >
                          Applica a Variante Attiva →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Colori (Colorway BOM Matrix & Lab-Dip Engine) */}
      {activeOperationalTab === "colorway" && (
        currentVariant ? (
          <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">
                  LAB-DIP &amp; COLORWAY INTELLIGENCE ENGINE
                </span>
                <h3 className="text-xl font-extrabold text-[#111111]">
                  Matrice Colorway: {currentVariant.variant_code} ({currentVariant.colorway_name})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveOperationalTab("bom_tree");
                    setBomSubTab("tree");
                  }}
                  className="px-3.5 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  🌿 Apri Distinta Base →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOperationalTab("catalogo")}
                  className="px-3.5 py-1.5 rounded-full border border-neutral-300 bg-white text-xs font-bold text-neutral-800 hover:bg-neutral-100 transition"
                >
                  ← Torna a Prodotti
                </button>
              </div>
            </div>

            <ColorwayBomMatrixPanel
              variant={currentVariant}
              parentPimItem={currentPim}
              colors={colors}
              vendors={vendors}
              tanneryBatches={tanneryBatches}
              matrix={colorwayMatrices[currentVariant.plm_variant_id]}
              viewerRole={viewerRole}
              onSaveMatrix={onSaveColorwayMatrix || (() => {})}
              onExplodeColorways={onExplodeColorways || (() => {})}
              onOpenColorStudioModal={() => setShowColorStudioModal(true)}
              externalTriggerExplosionCounter={triggerExplosionCounter}
            />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
            Seleziona una variante dal catalogo per visualizzarne la Matrice Colorway.
          </div>
        )
      )}

      {/* Modal: Nuovo Prodotto PLM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">+ Nuovo Prodotto PLM (Inserimento Rapido)</h3>
                <p className="text-xs text-[#707072]">Crea la variante tecnica di fabbrica e la scheda PIM speculare 1:1.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
              {/* FTL-TECH-025: Obbligatorio selezionare il modello di base di partenza */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Modello di Base di Riferimento (Forma &amp; Costruzione) *
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Regola FTL-TECH-025: Obbligatorio
                  </span>
                </div>

                <select
                  value={newSelectedModelId}
                  onChange={(e) => handleSelectModelForNewProduct(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Seleziona il Modello di Base Obbligatorio ({models?.length || 0} disponibili) --</option>
                  {models?.map((m) => (
                    <option key={m.model_id} value={m.model_id}>
                      [{m.model_code}] {m.name} · {m.last_code || "Forma N/D"} ({m.sole_construction || "Costruzione N/D"})
                    </option>
                  ))}
                </select>

                {newSelectedModelId ? (
                  <div className="text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                    <span>✅</span>
                    <span>Parametri ereditati dal modello: Forma <strong>{newLastCode}</strong>, Costruzione <strong>{newConstructionType}</strong>, Scala <strong>{newSizeRange}</strong>.</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-300 bg-amber-950/40 border border-amber-800/40 rounded-lg px-2.5 py-1">
                    ⚠️ Scegli un modello per ereditare automaticamente geometria forma, tipologia di costruzione e scala taglie.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Categoria *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="footwear">👟 Calzature</option>
                    <option value="leather_goods">👜 Pelletteria</option>
                    <option value="apparel">🧥 Abbigliamento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Genere Target *</label>
                  <select
                    value={newTargetGender}
                    onChange={(e) => setNewTargetGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="donna">♀ Donna</option>
                    <option value="uomo">♂ Uomo</option>
                    <option value="unisex">⚥ Unisex</option>
                    <option value="bambino">🧒 Bambino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Stagione *</label>
                  <select
                    value={newSeasonId}
                    onChange={(e) => setNewSeasonId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    {seasons.map((s) => (
                      <option key={s.season_id} value={s.season_id}>
                        {s.code} · {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Nome Modello Industriale *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Mocassino Tradizione Marche - Linea Duca"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Codice Variante PLM *</label>
                  <input
                    type="text"
                    required
                    placeholder="PLM-DUCA-ROSSO"
                    value={newVariantCode}
                    onChange={(e) => setNewVariantCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold text-xs"
                  />
                </div>

                {/* FTL-CEO-032: Selezione Colore / Variante collegata a Master Colors */}
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1 flex items-center justify-between">
                    <span>Colore Master / Variante *</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                      Cartella Colori (FTL-CEO-032)
                    </span>
                  </label>
                  {colors && colors.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={newPrimaryColorId}
                        onChange={(e) => {
                          const cid = e.target.value;
                          setNewPrimaryColorId(cid);
                          const chosen = colors.find((c) => c.id === cid || c.color_id === cid);
                          if (chosen) {
                            setNewColorway(chosen.technical_name_it);
                            if (newSelectedModelId) {
                              const foundModel = (models || []).find((m) => m.model_id === newSelectedModelId);
                              const cleanCode = (foundModel?.model_code || "PRD").replace("MDL-", "");
                              const cleanColor = chosen.color_code.replace(/[^A-Za-z0-9]/g, "");
                              setNewVariantCode(`PLM-${cleanCode}-${cleanColor}`);
                            }
                          }
                        }}
                        className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold text-xs"
                      >
                        <option value="">-- Seleziona Colore Master di Sistema --</option>
                        {colors
                          .filter((c) => c.is_active !== false)
                          .map((col) => (
                            <option key={col.id || col.color_id} value={col.id || col.color_id}>
                              {col.color_code} · {col.technical_name_it} ({col.commercial_family} · {col.pantone_tcx_code || col.hex_code})
                            </option>
                          ))}
                        <option value="custom">✏️ Altro / Nome Personalizzato</option>
                      </select>

                      {/* Preview swatch & details */}
                      {(() => {
                        const chosen = colors.find((c) => c.id === newPrimaryColorId || c.color_id === newPrimaryColorId);
                        return chosen ? (
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                            <span
                              className="w-4 h-4 rounded-full border border-slate-300 shadow-xs shrink-0"
                              style={{ backgroundColor: chosen.hex_code }}
                            />
                            <span className="font-bold text-slate-800">{chosen.technical_name_it}</span>
                            <span className="font-mono text-slate-500">({chosen.color_code})</span>
                            <span className="text-slate-400">· Pantone {chosen.pantone_tcx_code || "—"}</span>
                          </div>
                        ) : newPrimaryColorId === "custom" || !newPrimaryColorId ? (
                          <input
                            type="text"
                            required
                            placeholder="es. Bordeaux Spazzolato"
                            value={newColorway}
                            onChange={(e) => setNewColorway(e.target.value)}
                            className="w-full p-2 rounded-xl border border-[#D5D5D5] bg-white font-semibold text-xs"
                          />
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Bordeaux Spazzolato"
                      value={newColorway}
                      onChange={(e) => setNewColorway(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    />
                  )}
                </div>
              </div>

              {/* FTL-CEO-025 & FTL-CEO-026: Parametri Costruttivi Bloccati dal Modello di Base */}
              <div className="p-3 bg-neutral-100 rounded-2xl border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-600 tracking-wider flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>Costruzione Modello (Immutabile a livello di Prodotto)</span>
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-500">
                    Modello: {models?.find((m) => m.model_id === newSelectedModelId)?.model_code || "Non selezionato"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Forma / Cartamodello 🔒
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={newLastCode || "—"}
                      className="w-full p-2 rounded-xl border border-neutral-300 bg-white font-mono text-neutral-700 font-bold cursor-not-allowed text-xs"
                      title="Forma e cartamodello sono definiti unicamente a livello di Modello (FTL-CEO-025)"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Scala Taglie 🔒
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={newSizeRange || "—"}
                      className="w-full p-2 rounded-xl border border-neutral-300 bg-white font-mono text-neutral-700 font-bold cursor-not-allowed text-xs"
                      title="La scala taglie è definita unicamente a livello di Modello (FTL-CEO-025)"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Tipo Costruzione 🔒
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={newConstructionType || "—"}
                      className="w-full p-2 rounded-xl border border-neutral-300 bg-white text-neutral-700 font-bold cursor-not-allowed text-xs"
                      title="La tipologia di costruzione è definita unicamente a livello di Modello"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-neutral-500 italic">
                  💡 Regola di Fondazione (FTL-CEO-026): Il Modello è la Costruzione. Il Prodotto è lo Stile (Materiali, Colori, Combinazioni). Forma e Scala Taglie si modificano solo nei Modelli.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Piramide di Collezione *</label>
                  {registries.filter((r) => r.registry_name === "collection_pyramids" && r.is_active).length > 0 ? (
                    <select
                      value={newCarryoverStatus}
                      onChange={(e) => setNewCarryoverStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    >
                      {registries
                        .filter((r) => r.registry_name === "collection_pyramids" && r.is_active)
                        .map((reg) => (
                          <option key={reg.entry_code} value={reg.entry_code}>
                            {reg.label_it}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <select
                      value={newCarryoverStatus}
                      onChange={(e) => setNewCarryoverStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    >
                      <option value="carryover_continuativo">⭐ Continuativo / Carryover (No Saldi)</option>
                      <option value="seasonal_core">🌿 Stagionale Core</option>
                      <option value="trend_drop">⚡ Trend Drop / Capsule</option>
                      <option value="capsule_limited">💎 Capsule Limited Edition</option>
                    </select>
                  )}
                </div>

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                  Clona Distinta Base da Modello Esistente (Opzionale)
                </label>
                <select
                  value={cloneBomFromId}
                  onChange={(e) => setCloneBomFromId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                >
                  <option value="">-- Nessuna (Inizia con distinta vuota) --</option>
                  {allVariantsWithParent.map((v) => (
                    <option key={v.plm_variant_id} value={v.plm_variant_id}>
                      {v.variant_code} ({v.parentPim.model_name}) · {v.bom_items.length} componenti
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#EAEAEA]">
                <div className="text-[11px]">
                  {!newSelectedModelId && (
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Seleziona un modello di base obbligatorio</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={!newSelectedModelId || !newModelName.trim() || !newVariantCode.trim()}
                    className="px-6 py-2 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    Salva e Ingegnerizza BOM
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuovo Articolo Commerciale PIM da Modello (FTL-CEO-033) */}
      {showCreatePimModal && pimModalModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Sede Commerciale 1:N (FTL-CEO-033)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Modello: {pimModalModel.model_code}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#111111] mt-1">
                  + Nuovo Articolo Commerciale PIM
                </h3>
                <p className="text-xs text-[#707072]">
                  Crea la scheda commerciale PIM collegata al modello base e alle sue varianti PLM.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatePimModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePimSubmit} className="space-y-4 text-xs">
              {/* Box Modello Ereditato */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider block">
                    Modello di Riferimento Ereditato
                  </span>
                  <strong className="text-neutral-900 font-extrabold text-sm">
                    {pimModalModel.name} ({pimModalModel.model_code})
                  </strong>
                  <div className="text-[11px] text-indigo-700 mt-0.5">
                    Forma: <strong className="font-mono">{pimModalModel.last_code}</strong> · Costruzione: <strong>{pimModalModel.sole_construction}</strong> · Scala: <strong>{pimModalModel.default_size_range}</strong>
                  </div>
                </div>
                <span className="text-2xl">📐</span>
              </div>

              {/* SKU & Nome Commerciale */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Codice SKU PIM *
                  </label>
                  <input
                    type="text"
                    required
                    value={pimModalSku}
                    onChange={(e) => setPimModalSku(e.target.value)}
                    placeholder="es. SKU-FM108-01"
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Nome Commerciale Articolo *
                  </label>
                  <input
                    type="text"
                    required
                    value={pimModalName}
                    onChange={(e) => setPimModalName(e.target.value)}
                    placeholder="es. Sneaker Urban Runner Heritage"
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold text-xs"
                  />
                </div>
              </div>

              {/* Stagione & Genere */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Stagione di Riferimento *
                  </label>
                  <select
                    value={pimModalSeasonId}
                    onChange={(e) => setPimModalSeasonId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold text-xs"
                  >
                    {seasons.map((s) => (
                      <option key={s.season_id} value={s.season_id}>
                        {s.code} · {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Categoria &amp; Genere (Ereditati da Modello)
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={`${pimModalModel.category} · ${pimModalModel.target_gender || "Unisex"}`}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-neutral-100 font-semibold text-neutral-600 cursor-not-allowed text-xs"
                  />
                </div>
              </div>

              {/* Prezzi Wholesale & Retail */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Prezzo Wholesale B2B (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={pimModalWholesaleEur}
                    onChange={(e) => setPimModalWholesaleEur(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Prezzo Retail Consigliato (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={pimModalRetailEur}
                    onChange={(e) => setPimModalRetailEur(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Descrizione Commerciale */}
              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                  Descrizione Commerciale Showroom &amp; E-Commerce (IT)
                </label>
                <textarea
                  rows={2}
                  value={pimModalDescIt}
                  onChange={(e) => setPimModalDescIt(e.target.value)}
                  placeholder="Descrizione storytelling per buyer e clienti..."
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white text-xs"
                />
              </div>

              {/* Selezione Varianti PLM associate */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Varianti Tecniche PLM Collegate
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Modello: {pimModalModel.model_code}
                  </span>
                </div>
                {allVariantsWithParent.filter(
                  (v) =>
                    v.parentPim.model_id === pimModalModel.model_id ||
                    v.last_or_pattern_code === pimModalModel.last_code
                ).length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {allVariantsWithParent
                      .filter(
                        (v) =>
                          v.parentPim.model_id === pimModalModel.model_id ||
                          v.last_or_pattern_code === pimModalModel.last_code
                      )
                      .map((v) => {
                        const isChecked = pimModalSelectedVariantIds.includes(v.plm_variant_id);
                        return (
                          <label
                            key={v.plm_variant_id}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                              isChecked
                                ? "bg-indigo-50 border-indigo-300 text-indigo-950"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPimModalSelectedVariantIds([
                                      ...pimModalSelectedVariantIds,
                                      v.plm_variant_id,
                                    ]);
                                  } else {
                                    setPimModalSelectedVariantIds(
                                      pimModalSelectedVariantIds.filter(
                                        (id) => id !== v.plm_variant_id
                                      )
                                    );
                                  }
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="font-mono font-bold">{v.variant_code}</span>
                              <span>·</span>
                              <span>{v.colorway_name}</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {v.lifecycle_status}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-200">
                    ℹ️ Nessuna variante PLM pre-esistente per questo modello. Verrà creata una variante di lancio iniziale predefinita agganciata alla forma e alla scala taglie certificate del modello.
                  </div>
                )}
              </div>

              {/* Bottoni submit / cancel */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowCreatePimModal(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={!pimModalSku.trim() || !pimModalName.trim()}
                  className="px-6 py-2 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  Crea Articolo Commerciale PIM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Edit Completo Tutti gli Attributi (FTL-TECH-008) */}
      {showQuickEditModal && editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                  FTL-TECH-008 · Quick Edit Completo
                </span>
                <h3 className="text-lg font-bold text-[#111111] mt-1">
                  Modifica Prodotto PLM &amp; Anagrafica PIM
                </h3>
                <p className="text-xs text-[#707072] font-mono">
                  {editingVariant.variant_code} · {editingVariant.parentPim.model_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickEditModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-4 text-xs">
              {/* FTL-CEO-025 & FTL-CEO-026: Direttiva Fondativa Modello vs Prodotto */}
              <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-3 text-xs border border-slate-800 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🔒</span>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                      Governance FTL-CEO-025 · Il Modello è la Costruzione, il Prodotto è lo Stile
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Forma geometrica, Cartamodello 3D e Scala Taglie appartengono al Modello di Base e non sono modificabili qui. In questa maschera modifichi gli attributi di Stile (Colore, Materiali, Nome commerciale, Variante PLM).
                    </p>
                  </div>
                </div>
              </div>

              {/* Sezione 1: Attributi Modello Commerciale PIM */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-600">
                  📦 Dati Principali Modello (PIM)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Nome Modello Industriale *
                    </label>
                    <input
                      type="text"
                      required
                      value={editModelName}
                      onChange={(e) => setEditModelName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      SKU Commerciale *
                    </label>
                    <input
                      type="text"
                      required
                      value={editSkuCode}
                      onChange={(e) => setEditSkuCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Categoria *
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    >
                      <option value="footwear">👟 Calzature</option>
                      <option value="leather_goods">👜 Pelletteria</option>
                      <option value="apparel">🧥 Abbigliamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Piramide *
                    </label>
                    {registries.filter((r) => r.registry_name === "collection_pyramids" && r.is_active).length > 0 ? (
                      <select
                        value={editCarryoverStatus}
                        onChange={(e) => setEditCarryoverStatus(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                      >
                        {registries
                          .filter((r) => r.registry_name === "collection_pyramids" && r.is_active)
                          .map((reg) => (
                            <option key={reg.entry_code} value={reg.entry_code}>
                              {reg.label_it}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <select
                        value={editCarryoverStatus}
                        onChange={(e) => setEditCarryoverStatus(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                      >
                        <option value="carryover_continuativo">⭐ Continuativo / Carryover</option>
                        <option value="seasonal_core">🌿 Stagionale Core</option>
                        <option value="trend_drop">⚡ Trend Drop</option>
                        <option value="capsule_limited">💎 Capsule Limited</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Genere Target *
                    </label>
                    <select
                      value={editTargetGender}
                      onChange={(e) => setEditTargetGender(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    >
                      <option value="donna">♀ Donna</option>
                      <option value="uomo">♂ Uomo</option>
                      <option value="unisex">⚥ Unisex</option>
                      <option value="bambino">🧒 Bambino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Stagione *
                    </label>
                    <select
                      value={editSeasonId}
                      onChange={(e) => setEditSeasonId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    >
                      {seasons.map((s) => (
                        <option key={s.season_id} value={s.season_id}>
                          {s.code} · {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sezione 2: Attributi Variante Tecnica PLM */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-600">
                  ⚙️ Specifiche Variante Fabbrica (PLM)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Codice Variante PLM *
                    </label>
                    <input
                      type="text"
                      required
                      value={editVariantCode}
                      onChange={(e) => setEditVariantCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Colore / Variante *
                    </label>
                    <input
                      type="text"
                      required
                      value={editColorway}
                      onChange={(e) => setEditColorway(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1 flex items-center justify-between">
                      <span>Forma / Cartamodello 🔒</span>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Vincolo Modello (FTL-CEO-025)
                      </span>
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={editLastCode}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 bg-neutral-100 font-mono text-neutral-600 font-bold cursor-not-allowed"
                      title="Forma e cartamodello sono vincolati al Modello di Base e non modificabili dal Prodotto"
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      🔒 Modificabile unicamente nella scheda 📐 Modelli
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1 flex items-center justify-between">
                      <span>Scala Taglie 🔒</span>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Vincolo Modello
                      </span>
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={editSizeRange}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 bg-neutral-100 font-mono text-neutral-600 font-bold cursor-not-allowed"
                      title="La scala taglie appartiene al Modello di Base (FTL-CEO-025)"
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      🔒 Bloccata: eredità geometrica del modello
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Taglia Base Campione
                    </label>
                    <input
                      type="text"
                      value={editSampleBaseSize}
                      onChange={(e) => setEditSampleBaseSize(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                      placeholder="es. 37 o 42"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Passo Sviluppo %
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={editGradingStepPct}
                      onChange={(e) => setEditGradingStepPct(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1 flex items-center justify-between">
                      <span>Tipo di Costruzione 🔒</span>
                      <span className="text-[9px] font-bold text-neutral-600 bg-neutral-200 px-1.5 py-0.2 rounded">
                        Modello
                      </span>
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={editConstructionType}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 bg-neutral-100 text-neutral-600 font-bold cursor-not-allowed"
                      title="La tipologia di costruzione è vincolata al Modello di Base"
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      🔒 Definito a livello di Modello
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Stato Ciclo di Vita *
                    </label>
                    <select
                      value={editLifecycleStatus}
                      onChange={(e) => setEditLifecycleStatus(e.target.value as PlmLifecycleStatus)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-bold text-[#111111]"
                    >
                      <option value="new_from_pim">🏷️ Nuovo da PIM</option>
                      <option value="prototype">Prototipo</option>
                      <option value="sample">Campione</option>
                      <option value="industrialized">Industrializzato</option>
                      <option value="in_production">In Produzione</option>
                      <option value="archived">Archiviato</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowQuickEditModal(false)}
                  className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800 transition shadow-lg"
                >
                  ✓ Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Duplicazione Variante & Clonazione Ricorsiva Distinta Base (BOM) */}
      {showDeepCloneModal && cloneTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  Sprint 7 · Deep Variant &amp; BOM Cloning
                </span>
                <h3 className="text-lg font-bold text-[#111111] mt-1">
                  Duplica Variante con Distinta Base Ricorsiva
                </h3>
                <p className="text-xs text-[#707072] font-mono">
                  Sorgente: {cloneTargetItem.variant_code} ({cloneTargetItem.parentPim.model_name}) · {cloneTargetItem.bom_items.length} componenti BOM
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeepCloneModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Nuovo Codice Variante PLM *
                  </label>
                  <input
                    type="text"
                    required
                    value={cloneNewCode}
                    onChange={(e) => setCloneNewCode(e.target.value)}
                    placeholder="PLM-SNEAK-B1"
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Nuovo Nome Colore / Variante *
                  </label>
                  <input
                    type="text"
                    required
                    value={cloneNewColorway}
                    onChange={(e) => setCloneNewColorway(e.target.value)}
                    placeholder="Testa di Moro"
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1 flex items-center justify-between">
                  <span>Scala Taglie 🔒</span>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Vincolo Modello (FTL-CEO-025)
                  </span>
                </label>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={cloneNewSizeRange}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 bg-neutral-100 font-mono text-neutral-600 font-bold cursor-not-allowed"
                  title="La scala taglie è vincolata al Modello di Base (FTL-CEO-025)"
                />
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  🔒 Ereditata dal Modello di Base. La duplicazione genera una nuova declinazione di Stile (colore / materiali).
                </span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#111111]">
                  <input
                    type="checkbox"
                    checked={cloneIncludeBom}
                    onChange={(e) => setCloneIncludeBom(e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <span>Clona ricorsivamente la distinta base a 3 livelli (BOM)</span>
                </label>

                {cloneIncludeBom && Object.keys(cloneReplacements).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-neutral-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Sostituzione Materiali Livello 1 (Opzionale):
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {Object.keys(cloneReplacements).map((origMat) => (
                        <div key={origMat} className="grid grid-cols-2 gap-2 items-center bg-white p-2 rounded-lg border border-neutral-200">
                          <span className="text-[11px] text-neutral-700 truncate font-medium" title={origMat}>
                            {origMat}
                          </span>
                          <input
                            type="text"
                            value={cloneReplacements[origMat]}
                            onChange={(e) =>
                              setCloneReplacements({
                                ...cloneReplacements,
                                [origMat]: e.target.value,
                              })
                            }
                            placeholder="Nuovo materiale..."
                            className="p-1.5 rounded-lg border border-neutral-300 text-xs font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowDeepCloneModal(false)}
                  className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 transition"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={isCloning || !cloneNewCode.trim()}
                  onClick={handleExecuteDeepClone}
                  className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isCloning ? "Duplicazione in corso..." : "📋 Duplica Variante & Genera BOM"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Libreria Preset Distinte Base (BOM Templates) - FTL-CEO-014 */}
      {showTemplateModal && templateTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                  Sprint 7 · Gestione & Libreria Preset BOM (FTL-CEO-014)
                </span>
                <h3 className="text-lg font-bold text-[#111111] mt-1">
                  Preset Distinte Base Industriali
                </h3>
                <p className="text-xs text-[#707072] font-mono">
                  Variante Attiva: {templateTargetItem.variant_code} ({templateTargetItem.parentPim.model_name}) · {templateTargetItem.bom_items.length} componenti
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs navigation */}
            <div className="flex border-b border-neutral-200 gap-2 pb-1 text-xs">
              <button
                type="button"
                onClick={() => setTemplateModalTab("apply")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  templateModalTab === "apply"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                ⚡ Seleziona &amp; Applica
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentTpl = availableTemplates.find((t) => t.template_id === selectedTemplateId);
                  if (currentTpl) {
                    setEditPresetName(currentTpl.name);
                    setEditPresetCategory(currentTpl.category_id);
                    setEditPresetConstruction(currentTpl.construction_type || "cassetta_cucita");
                    setEditPresetDesc(currentTpl.description || "");
                  }
                  setTemplateModalTab("edit_preset");
                }}
                disabled={!selectedTemplateId}
                className={`px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-40 ${
                  templateModalTab === "edit_preset"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                ✏️ Modifica Preset
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewPresetName(`Preset da ${templateTargetItem.variant_code}`);
                  setNewPresetCategory(templateTargetItem.parentPim.category || "footwear");
                  setNewPresetConstruction(templateTargetItem.construction_type || "cassetta_cucita");
                  setNewPresetDesc(`Preset estratto da ${templateTargetItem.variant_code} (${templateTargetItem.bom_items.length} componenti).`);
                  setTemplateModalTab("create_from_variant");
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  templateModalTab === "create_from_variant"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                ➕ Crea da Variante Attuale
              </button>
            </div>

            {/* TAB 1: APPLICA PRESET */}
            {templateModalTab === "apply" && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-[#707072] uppercase">
                      Seleziona Preset BOM Disponibile *
                    </label>
                    {selectedTemplateId && (
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(selectedTemplateId)}
                        className="text-red-600 hover:text-red-800 font-bold text-[11px] flex items-center gap-1"
                      >
                        🗑️ Elimina Preset
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D5D5D5] bg-white font-semibold text-xs"
                  >
                    {availableTemplates.map((tpl) => (
                      <option key={tpl.template_id} value={tpl.template_id}>
                        {tpl.name} · ({tpl.items.length} componenti - {tpl.construction_type || tpl.category_id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Anteprima componenti del template selezionato */}
                {availableTemplates.find((t) => t.template_id === selectedTemplateId) && (
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111111] text-sm">
                        {availableTemplates.find((t) => t.template_id === selectedTemplateId)?.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-800">
                        {availableTemplates.find((t) => t.template_id === selectedTemplateId)?.construction_type || availableTemplates.find((t) => t.template_id === selectedTemplateId)?.category_id}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#707072]">
                      {availableTemplates.find((t) => t.template_id === selectedTemplateId)?.description}
                    </p>
                    <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-white max-h-52">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-neutral-100 border-b border-neutral-200 font-bold text-neutral-600">
                          <tr>
                            <th className="p-2">Livello</th>
                            <th className="p-2">Tipo</th>
                            <th className="p-2">Materiale / Descrizione</th>
                            <th className="p-2 text-right">Consumo</th>
                            <th className="p-2 text-right">Sfrido %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {availableTemplates
                            .find((t) => t.template_id === selectedTemplateId)
                            ?.items.map((it, idx) => (
                              <tr key={idx} className="hover:bg-neutral-50">
                                <td className="p-2 font-mono font-bold text-purple-700">L{it.level}</td>
                                <td className="p-2 capitalize">{it.component_type}</td>
                                <td className="p-2 font-medium">{it.material_name}</td>
                                <td className="p-2 text-right font-mono">
                                  {it.unit_consumption} {it.unit_of_measure}
                                </td>
                                <td className="p-2 text-right font-mono text-amber-600">
                                  +{it.waste_percentage}%
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                  ⚠️ <strong>Nota Applicativa:</strong> L&apos;applicazione del template popolerà istantaneamente la distinta base della variante {templateTargetItem.variant_code} con i codici e parametri pre-ingegnerizzati.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 transition"
                  >
                    Chiudi
                  </button>
                  <button
                    type="button"
                    disabled={isApplyingTemplate || !selectedTemplateId}
                    onClick={handleExecuteApplyTemplate}
                    className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {isApplyingTemplate ? "Applicazione in corso..." : "✨ Applica Preset a BOM"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MODIFICA PRESET */}
            {templateModalTab === "edit_preset" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Nome Preset *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPresetName}
                    onChange={(e) => setEditPresetName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Categoria di Riferimento *
                    </label>
                    <input
                      type="text"
                      required
                      value={editPresetCategory}
                      onChange={(e) => setEditPresetCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Tipo di Costruzione *
                    </label>
                    <input
                      type="text"
                      required
                      value={editPresetConstruction}
                      onChange={(e) => setEditPresetConstruction(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Descrizione Tecnica Preset
                  </label>
                  <textarea
                    rows={3}
                    value={editPresetDesc}
                    onChange={(e) => setEditPresetDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                  <button
                    type="button"
                    onClick={() => setTemplateModalTab("apply")}
                    className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 transition"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    disabled={isSavingPreset || !editPresetName.trim()}
                    onClick={handleUpdatePreset}
                    className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingPreset ? "Salvataggio..." : "💾 Salva Modifiche Preset"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CREA DA VARIANTE ATTUALE */}
            {templateModalTab === "create_from_variant" && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs">
                  ✨ Verranno estratti <strong>{templateTargetItem.bom_items.length} componenti</strong> dall&apos;albero BOM attuale della variante <strong>{templateTargetItem.variant_code}</strong> e salvati come un preset riutilizzabile da tutta l&apos;azienda.
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Nome Nuovo Preset *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Preset Sneakers Fondo Cassetta Marche"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Categoria *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPresetCategory}
                      onChange={(e) => setNewPresetCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                      Tipo Costruzione *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPresetConstruction}
                      onChange={(e) => setNewPresetConstruction(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Descrizione Preset
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descrivi l'architettura tecnica e le specifiche del preset..."
                    value={newPresetDesc}
                    onChange={(e) => setNewPresetDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                  <button
                    type="button"
                    onClick={() => setTemplateModalTab("apply")}
                    className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 transition"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    disabled={isSavingPreset || !newPresetName.trim() || templateTargetItem.bom_items.length === 0}
                    onClick={handleCreatePresetFromVariant}
                    className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingPreset ? "Creazione in corso..." : "✨ Salva come Nuovo Preset BOM"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Wizard Onboarding Massivo CSV / Excel con Dry-Run */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Sprint 7 · Fast Onboarding Wizard
                </span>
                <h3 className="text-lg font-bold text-[#111111] mt-1">
                  Onboarding Massivo Articoli &amp; Distinte Base (BOM)
                </h3>
                <p className="text-xs text-[#707072]">
                  Validazione preventiva Dry-Run, correzione errori in tempo reale e commit transazionale nel database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Navigazione Tab */}
            <div className="flex border-b border-neutral-200 gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setBulkImportTab("template")}
                className={`pb-2.5 border-b-2 transition ${
                  bulkImportTab === "template"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-neutral-500 hover:text-black"
                }`}
              >
                1. 📄 Template CSV &amp; Specifiche
              </button>
              <button
                type="button"
                onClick={() => setBulkImportTab("validate")}
                className={`pb-2.5 border-b-2 transition ${
                  bulkImportTab === "validate"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-neutral-500 hover:text-black"
                }`}
              >
                2. 🔍 Validazione Dry-Run
              </button>
              <button
                type="button"
                onClick={() => setBulkImportTab("commit")}
                className={`pb-2.5 border-b-2 transition ${
                  bulkImportTab === "commit"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-neutral-500 hover:text-black"
                }`}
              >
                3. 🚀 Conferma &amp; Commit
              </button>
            </div>

            {/* TAB 1: Template CSV */}
            {bulkImportTab === "template" && (
              <div className="space-y-4 text-xs">
                <p className="text-neutral-600 leading-relaxed">
                  Scarica i modelli CSV ufficiali con le intestazioni conformi allo schema del database PostgreSQL FootLink. Compila i campi e incolla il contenuto nel tab successivo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111111]">📦 Articoli &amp; Varianti PLM</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-700">PIM + PLM</span>
                    </div>
                    <p className="text-[11px] text-neutral-600">
                      Include SKU, modello, categoria, genere, forma, lavorazione, piramide carryover, prezzi e taglie.
                    </p>
                    <a
                      href="http://127.0.0.1:8000/api/v1/bulk-import/template/articles"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-neutral-300 hover:border-black font-bold text-xs text-[#111111] transition shadow-sm"
                    >
                      <span>📥 Scarica Template Articoli (.csv)</span>
                    </a>
                  </div>

                  <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111111]">⚙️ Distinte Base (BOM a 3 Livelli)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-700">BOM L1-L3</span>
                    </div>
                    <p className="text-[11px] text-neutral-600">
                      Include codice variante, livello distinte (1, 2, 3), componenti, fornitore, consumo e sfrido %.
                    </p>
                    <a
                      href="http://127.0.0.1:8000/api/v1/bulk-import/template/bom"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-neutral-300 hover:border-black font-bold text-xs text-[#111111] transition shadow-sm"
                    >
                      <span>📥 Scarica Template Distinte Base (.csv)</span>
                    </a>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setBulkImportTab("validate")}
                    className="px-6 py-2.5 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800 transition shadow"
                  >
                    Procedi a Validazione Dry-Run →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Validazione Dry-Run */}
            {bulkImportTab === "validate" && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] font-bold text-[#707072] uppercase">Tipo Dati:</label>
                    <select
                      value={bulkImportType}
                      onChange={(e) => {
                        setBulkImportType(e.target.value as "articles" | "bom");
                        setBulkValidationResult(null);
                      }}
                      className="p-2 rounded-xl border border-neutral-300 font-semibold bg-white"
                    >
                      <option value="articles">📦 Articoli &amp; Varianti PLM</option>
                      <option value="bom">⚙️ Distinte Base (BOM)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(`http://127.0.0.1:8000/api/v1/bulk-import/template/${bulkImportType}`);
                        if (res.ok) {
                          const txt = await res.text();
                          setBulkCsvText(txt);
                        }
                      } catch {}
                    }}
                    className="text-emerald-700 hover:underline font-bold text-[11px]"
                  >
                    Carica Esempio Demo
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Incolla Contenuto CSV con intestazioni:
                  </label>
                  <textarea
                    rows={6}
                    value={bulkCsvText}
                    onChange={(e) => setBulkCsvText(e.target.value)}
                    placeholder="Incolla qui le righe CSV..."
                    className="w-full p-3 font-mono text-[11px] rounded-2xl border border-neutral-300 bg-neutral-50 focus:bg-white focus:outline-none focus:border-black"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={isValidating || !bulkCsvText.trim()}
                    onClick={handleValidateBulk}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow disabled:opacity-50 flex items-center gap-2"
                  >
                    {isValidating ? "Validazione Dry-Run in corso..." : "🔍 Esegui Validazione Dry-Run"}
                  </button>

                  {bulkValidationResult && (
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border">
                        Righe: {bulkValidationResult.total_rows}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Valide: {bulkValidationResult.valid_rows_count}
                      </span>
                      {bulkValidationResult.invalid_rows_count > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          Errori: {bulkValidationResult.invalid_rows_count}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Tabella Risultati Validazione */}
                {bulkValidationResult && (
                  <div className="space-y-3 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                      Report Validazione Preventiva:
                    </div>
                    <div className="overflow-x-auto border border-neutral-200 rounded-2xl max-h-56 bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-neutral-100 border-b border-neutral-200 font-bold text-neutral-600">
                          <tr>
                            <th className="p-2">Riga #</th>
                            <th className="p-2">Identificativo</th>
                            <th className="p-2 text-center">Esito</th>
                            <th className="p-2">Dettagli / Errori</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {bulkValidationResult.rows.map((r) => (
                            <tr key={r.row_number} className={r.is_valid ? "hover:bg-neutral-50" : "bg-rose-50/50"}>
                              <td className="p-2 font-mono font-bold">{r.row_number}</td>
                              <td className="p-2 font-mono font-semibold">
                                {r.parsed_data.sku_code || r.parsed_data.variant_code || "N/D"}
                              </td>
                              <td className="p-2 text-center">
                                {r.is_valid ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    ✓ Valido
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                    ✕ Non Valido
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                {r.is_valid ? (
                                  <span className="text-neutral-500">Pronto per inserimento transazionale</span>
                                ) : (
                                  <span className="text-rose-700 font-semibold">{r.errors.join("; ")}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {bulkValidationResult.valid_rows_count > 0 && (
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setBulkImportTab("commit")}
                          className="px-6 py-2.5 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800 transition shadow"
                        >
                          Procedi al Commit ({bulkValidationResult.valid_rows_count} righe) →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Conferma & Commit */}
            {bulkImportTab === "commit" && (
              <div className="space-y-4 text-xs">
                {commitMessage ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span>🎉</span>
                      <span>Importazione Massiva Completata con Successo!</span>
                    </div>
                    <p className="text-xs">{commitMessage}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkImportModal(false);
                        setCommitMessage("");
                        setBulkValidationResult(null);
                        setBulkCsvText("");
                      }}
                      className="mt-2 px-5 py-2 rounded-full bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition"
                    >
                      Chiudi e Torna al Catalogo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                      <h4 className="font-bold text-[#111111]">Riepilogo Inserimento Transazionale</h4>
                      <p className="text-neutral-600">
                        Stai per inserire <strong>{bulkValidationResult?.valid_rows_count || 0}</strong> righe validate nel database FootLink.
                      </p>
                      <ul className="list-disc list-inside text-neutral-500 space-y-1">
                        <li>I dati verranno salvati su PostgreSQL/SQLite in modalità transazionale ACID.</li>
                        <li>Gli articoli e le varianti PLM risulteranno subito attivi nel catalogo e nel modulo BOM.</li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setBulkImportTab("validate")}
                        className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 transition"
                      >
                        ← Indietro a Validazione
                      </button>
                      <button
                        type="button"
                        disabled={isCommitting || !bulkValidationResult || bulkValidationResult.valid_rows_count === 0}
                        onClick={handleCommitBulk}
                        className="px-7 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                      >
                        {isCommitting ? "Inserimento in corso..." : "🚀 Conferma & Inserisci nel Database"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Cartella Colori Master (Color Intelligence Studio) */}
      {showColorStudioModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
                🎨 Accesso Diretto PLM → Cartella Colori Master
              </span>
              <button
                type="button"
                onClick={() => setShowColorStudioModal(false)}
                className="px-3.5 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800"
              >
                ✕ Chiudi Cartella Colori
              </button>
            </div>
            <ColorIntelligenceStudio
              colors={colors}
              seasons={seasons}
              viewerRole={viewerRole}
              onCreateColor={onCreateColor || (() => {})}
              onUpdateColor={onUpdateColor || (() => {})}
              onDeleteColor={onDeleteColor || (() => {})}
              compactEmbedded={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
