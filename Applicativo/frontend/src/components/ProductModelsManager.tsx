import React, { useState, useMemo } from "react";
import {
  ActiveWorkspaceModule,
  ProductModel,
  PimCommercialItem,
  PlmProductionVariant,
  ProductCategory,
  ViewerSecurityRole,
  Season,
  DomainRegistryEntry,
} from "../types";

export interface ProductModelsManagerProps {
  models: ProductModel[];
  pimItems: PimCommercialItem[];
  seasons?: Season[];
  registries?: DomainRegistryEntry[];
  viewerRole: ViewerSecurityRole;
  onCreateModel: (
    model: Omit<ProductModel, "model_id" | "products_count" | "created_at">
  ) => Promise<void> | void;
  onUpdateModel: (
    modelId: string,
    model: Partial<ProductModel>
  ) => Promise<void> | void;
  onDeleteModel: (modelId: string) => Promise<void> | void;
  onAttachProduct?: (modelId: string, pimItemId: string) => Promise<void> | void;
  onDetachProduct?: (modelId: string, pimItemId: string) => Promise<void> | void;
  onCreateProductFromModel?: (model: ProductModel) => void;
  onCreatePimFromModel?: (model: ProductModel) => void;
  onSelectModel?: (model: ProductModel) => void;
  onSelectPimItem?: (item: PimCommercialItem) => void;
  onSelectVariantItem?: (
    variant: PlmProductionVariant,
    parentPim: PimCommercialItem,
    targetTab?: "catalogo" | "bom_tree"
  ) => void;
  onNavigateModule?: (mod: ActiveWorkspaceModule) => void;
}

export const CERTIFIED_SIZE_SCALES = [
  { code: "35-42", label: "Calzature Donna EU 35-42", category: "footwear", gender: "donna", sizes: "35, 36, 37, 38, 39, 40, 41, 42" },
  { code: "38-46", label: "Calzature Uomo EU 38-46", category: "footwear", gender: "uomo", sizes: "38, 39, 40, 41, 42, 43, 44, 45, 46" },
  { code: "39-46", label: "Calzature Uomo Standard EU 39-46", category: "footwear", gender: "uomo", sizes: "39, 40, 41, 42, 43, 44, 45, 46" },
  { code: "36-41", label: "Calzature Donna Comfort EU 36-41", category: "footwear", gender: "donna", sizes: "36, 37, 38, 39, 40, 41" },
  { code: "40-45", label: "Calzature Uomo Core EU 40-45", category: "footwear", gender: "uomo", sizes: "40, 41, 42, 43, 44, 45" },
  { code: "24-34", label: "Calzature Bambino EU 24-34", category: "footwear", gender: "bambino", sizes: "24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34" },
  { code: "IT 44-56", label: "Abbigliamento IT 44-56", category: "apparel", gender: "unisex", sizes: "IT 44, IT 46, IT 48, IT 50, IT 52, IT 54, IT 56" },
  { code: "IT 38-48", label: "Abbigliamento Donna IT 38-48", category: "apparel", gender: "donna", sizes: "IT 38, IT 40, IT 42, IT 44, IT 46, IT 48" },
  { code: "TU", label: "Pelletteria Taglia Unica (TU)", category: "leather_goods", gender: "unisex", sizes: "Taglia Unica" },
];

const CATEGORY_LABELS: Record<string, string> = {
  footwear: "Calzature (Forme & Suole)",
  leather_goods: "Pelletteria (Cartamodelli)",
  apparel: "Abbigliamento (Tracciati)",
};

const CONSTRUCTION_LABELS: Record<string, string> = {
  blake: "Cucito Blake Tradizionale",
  cassetta_cucita: "Fondo a Cassetta Cucito",
  goodyear: "Guardolo Goodyear Welted",
  tubolare_sacchetto: "Lavorazione a Sacchetto / Tubolare",
  strobel: "Strobel Flessibile",
  ago: "Incollato / Ago Classico",
};

export const ProductModelsManager: React.FC<ProductModelsManagerProps> = ({
  models,
  pimItems,
  seasons = [],
  registries = [],
  viewerRole,
  onCreateModel,
  onUpdateModel,
  onDeleteModel,
  onAttachProduct,
  onDetachProduct,
  onCreateProductFromModel,
  onCreatePimFromModel,
  onSelectModel,
  onSelectPimItem,
  onSelectVariantItem,
  onNavigateModule,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(
    models[0]?.model_id || null
  );

  // Modal Create/Edit Model State
  const [showModelModal, setShowModelModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ProductModel | null>(null);
  const [formModelCode, setFormModelCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<ProductCategory>("footwear");
  const [formTargetGender, setFormTargetGender] = useState("Uomo");
  const [formLastCode, setFormLastCode] = useState("");
  const [formSoleConstruction, setFormSoleConstruction] = useState("blake");
  const [formHeelHeightMm, setFormHeelHeightMm] = useState<number>(25);
  const [formDefaultSizeRange, setFormDefaultSizeRange] = useState("38-46");
  const [formCadRef, setFormCadRef] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSeasonId, setFormSeasonId] = useState("");
  const [formCollectionId, setFormCollectionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CAD / 3D File Attachment State (FTL-CEO-023)
  const [formCadFile, setFormCadFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Quick Action Feedback Banner
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const isBrand = viewerRole === "brand";

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Filtered Models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (categoryFilter !== "ALL" && m.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [
          m.model_code,
          m.name,
          m.last_code || "",
          m.sole_construction || "",
          m.description || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [models, categoryFilter, searchQuery]);

  // FTL-CEO-030: Unified Certified Size Scales from Domain Registries & Presets
  const availableSizeScales = useMemo(() => {
    const registryScales = (registries || [])
      .filter((r) => r.registry_name === "size_scales" && r.is_active !== false)
      .map((r) => {
        const meta = r.metadata || r.meta || {};
        const code = meta.code || (meta.min && meta.max ? `${meta.min}-${meta.max}` : r.entry_code);
        return {
          code: code,
          label: r.label_it || r.label_en || r.entry_code,
          category: meta.category || meta.main_category || "footwear",
          gender: meta.target_gender || "unisex",
          sizes: meta.sizes
            ? Array.isArray(meta.sizes)
              ? meta.sizes.join(", ")
              : String(meta.sizes)
            : meta.min && meta.max
            ? `${meta.min} .. ${meta.max}`
            : "",
        };
      });

    const combined = [...CERTIFIED_SIZE_SCALES];
    registryScales.forEach((rs) => {
      if (
        !combined.some(
          (c) =>
            c.code.toLowerCase() === rs.code.toLowerCase() ||
            c.label.toLowerCase() === rs.label.toLowerCase()
        )
      ) {
        combined.push(rs);
      }
    });
    return combined;
  }, [registries]);

  // Selected Model Object
  const selectedModel = useMemo(() => {
    return models.find((m) => m.model_id === selectedModelId) || null;
  }, [models, selectedModelId]);

  // Attached PIM products for the selected model
  const attachedProducts = useMemo(() => {
    if (!selectedModel) return [];
    return pimItems.filter((p) => p.model_id === selectedModel.model_id);
  }, [pimItems, selectedModel]);

  // Attached PLM technical variants for the selected model (FTL-CEO-024)
  const attachedPlmVariants = useMemo(() => {
    if (!selectedModel) return [];
    return attachedProducts.flatMap((pim) =>
      (pim.plm_variants || []).map((v) => ({
        ...v,
        parentPim: pim,
      }))
    );
  }, [attachedProducts, selectedModel]);

  // CAD File processing helper (FTL-CEO-023)
  const handleProcessCadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormCadFile({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        dataUrl,
      });
      setFormCadRef(file.name);
      showFeedback(`File CAD/3D "${file.name}" allegato con successo.`);
    };
    reader.readAsDataURL(file);
  };

  // Download CAD / 3D File (FTL-CEO-023)
  const handleDownloadCadFile = (model: ProductModel) => {
    const fileName = model.cad_drawing_ref || `${model.model_code}_cartamodello.dxf`;
    const cadAttachment = model.metadata?.cad_attachment;

    if (cadAttachment?.dataUrl) {
      const link = document.createElement("a");
      link.href = cadAttachment.dataUrl;
      link.download = cadAttachment.name || fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Deterministic CAD vector DXF export format
      const sampleCadContent = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n999\nFootLink CAD/3D Vector Spec\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n999\nMODEL_CODE: ${model.model_code}\n999\nMODEL_NAME: ${model.name}\n999\nLAST_CODE: ${model.last_code || "N/A"}\n999\nCONSTRUCTION: ${model.sole_construction || "N/A"}\n999\nSIZE_RANGE: ${model.default_size_range || "N/A"}\n999\nCAD_REF: ${fileName}\n0\nENDSEC\n0\nEOF\n`;
      const blob = new Blob([sampleCadContent], { type: "application/dxf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.endsWith(".dxf") || fileName.endsWith(".dwg") || fileName.endsWith(".cad") ? fileName : `${fileName}.dxf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    showFeedback(`Download avviato per ${fileName}`);
  };

  // Handlers
  const handleOpenCreateModel = () => {
    setEditingModel(null);
    setFormModelCode(`MDL-${formCategory === "footwear" ? "FW" : formCategory === "leather_goods" ? "LG" : "AP"}-${String(models.length + 1).padStart(2, "0")}`);
    setFormName("");
    setFormCategory("footwear");
    setFormTargetGender("Uomo");
    setFormLastCode("FORMA-FM-109");
    setFormSoleConstruction("blake");
    setFormHeelHeightMm(25);
    setFormDefaultSizeRange("38-46");
    setFormCadRef("");
    setFormCadFile(null);
    setFormDescription("");
    setFormSeasonId(seasons[0]?.season_id || "");
    setFormCollectionId(seasons[0]?.collections[0]?.collection_id || "");
    setShowModelModal(true);
  };

  const handleOpenEditModel = (model: ProductModel) => {
    setEditingModel(model);
    setFormModelCode(model.model_code);
    setFormName(model.name);
    setFormCategory(model.category as ProductCategory);
    setFormTargetGender(model.target_gender || "Uomo");
    setFormLastCode(model.last_code || "");
    setFormSoleConstruction(model.sole_construction || "blake");
    setFormHeelHeightMm(model.heel_height_mm ?? 25);
    setFormDefaultSizeRange(model.default_size_range || "38-46");
    setFormCadRef(model.cad_drawing_ref || "");
    setFormCadFile(model.metadata?.cad_attachment || null);
    setFormDescription(model.description || "");
    setFormSeasonId(model.season_id || "");
    setFormCollectionId(model.collection_id || "");
    setShowModelModal(true);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formModelCode.trim() || !formName.trim()) return;
    setIsSubmitting(true);
    const finalCadRef = (formCadRef || formCadFile?.name || "").trim();
    const metadataPayload = {
      ...(editingModel?.metadata || {}),
      ...(formCadFile ? { cad_attachment: formCadFile } : {}),
    };

    try {
      if (editingModel) {
        await onUpdateModel(editingModel.model_id, {
          model_code: formModelCode.trim().toUpperCase(),
          name: formName.trim(),
          category: formCategory,
          target_gender: formTargetGender,
          last_code: formLastCode.trim().toUpperCase(),
          sole_construction: formSoleConstruction,
          heel_height_mm: Number(formHeelHeightMm),
          default_size_range: formDefaultSizeRange.trim(),
          cad_drawing_ref: finalCadRef,
          description: formDescription.trim(),
          season_id: formSeasonId || null,
          collection_id: formCollectionId || null,
          metadata: metadataPayload,
        });
        showFeedback(`Modello "${formName}" aggiornato con successo.`);
      } else {
        await onCreateModel({
          model_code: formModelCode.trim().toUpperCase(),
          name: formName.trim(),
          category: formCategory,
          target_gender: formTargetGender,
          last_code: formLastCode.trim().toUpperCase(),
          sole_construction: formSoleConstruction,
          heel_height_mm: Number(formHeelHeightMm),
          default_size_range: formDefaultSizeRange.trim(),
          cad_drawing_ref: finalCadRef,
          description: formDescription.trim(),
          season_id: formSeasonId || null,
          collection_id: formCollectionId || null,
          is_active: true,
          metadata: metadataPayload,
        });
        showFeedback(`Nuovo Modello di Base "${formName}" creato con successo.`);
      }
      setShowModelModal(false);
    } catch (err: any) {
      alert("Errore durante il salvataggio del modello: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModel = async (model: ProductModel) => {
    const attachedCount = pimItems.filter((p) => p.model_id === model.model_id).length;
    if (attachedCount > 0) {
      if (
        !window.confirm(
          `Attenzione: ci sono ${attachedCount} prodotti commerciali PIM associati a questo modello. Se elimini il modello, i prodotti verranno sganciati. Vuoi procedere?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Sei sicuro di voler eliminare il modello "${model.name}" (${model.model_code})?`)) {
        return;
      }
    }

    try {
      await onDeleteModel(model.model_id);
      showFeedback(`Modello ${model.model_code} eliminato.`);
      if (selectedModelId === model.model_id) {
        setSelectedModelId(models.find((m) => m.model_id !== model.model_id)?.model_id || null);
      }
    } catch (err: any) {
      alert("Errore durante l'eliminazione: " + (err.message || err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
          <span>✅ {feedbackMessage}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Intro Header Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                FTL-CEO-026
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                📐 Il Modello è la Costruzione · Il Prodotto è lo Stile
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                Sede Unica per Scala Taglie &amp; Forma (FTL-CEO-025)
              </span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-900">
              MODELLI DI BASE (FORME, COSTRUZIONE &amp; CARTAMODELLI)
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Un <strong>Modello</strong> rappresenta la forma (last) e le caratteristiche tecniche costruttive (costruzione suola, tacco, cartamodello 3D e scala taglie).
              Il <strong>Prodotto</strong> è la declinazione di stile del modello in materiali, colori e finiture.
            </p>
          </div>

          {isBrand && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenCreateModel}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white transition shadow-sm flex items-center gap-2"
              >
                <span>➕ Nuovo Modello di Base</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters Strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <span className="text-xs font-bold text-slate-500">Settore:</span>
            {["ALL", "footwear", "leather_goods", "apparel"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat === "ALL"
                  ? "Tutti i Settori"
                  : cat === "footwear"
                  ? "👠 Calzature"
                  : cat === "leather_goods"
                  ? "👜 Pelletteria"
                  : "🧥 Abbigliamento"}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Cerca per codice, forma, nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Models List + Right Model Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Models Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Modelli Censiti ({filteredModels.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Seleziona un modello per ispezionare
            </span>
          </div>

          {filteredModels.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Nessun modello trovato con i filtri attuali.
            </div>
          ) : (
            filteredModels.map((model) => {
              const attachedPims = pimItems.filter((p) => p.model_id === model.model_id);
              const totalVariants = attachedPims.reduce(
                (acc, p) => acc + (p.plm_variants?.length || 0),
                0
              );
              const isSelected = selectedModelId === model.model_id;

              return (
                <div
                  key={model.model_id}
                  onClick={() => {
                    setSelectedModelId(model.model_id);
                    onSelectModel?.(model);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20"
                      : "bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:shadow-sm"
                  }`}
                >
                  {/* Row 1: Code, Category & Count Pill */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded shrink-0 ${
                          isSelected
                            ? "bg-slate-800 text-emerald-300 border border-slate-700"
                            : "bg-slate-100 text-slate-900 border border-slate-200"
                        }`}
                      >
                        {model.model_code}
                      </span>
                      <span
                        className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full truncate ${
                          isSelected
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {CATEGORY_LABELS[model.category]?.split(" ")[0] || model.category}
                      </span>
                    </div>

                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        totalVariants > 0
                          ? isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : isSelected
                          ? "bg-slate-800 text-slate-400"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      🏭 {totalVariants} {totalVariants === 1 ? "Variante PLM" : "Varianti PLM"}
                    </span>
                  </div>

                  {/* Row 2: Model Name */}
                  <h3
                    className={`text-xs sm:text-sm font-extrabold mt-1 truncate ${
                      isSelected ? "text-white" : "text-neutral-900"
                    }`}
                  >
                    {model.name}
                  </h3>

                  {/* Row 3: Compact Specs Strip (Single source of action on detail view) */}
                  <div
                    className={`mt-1.5 pt-1.5 flex items-center justify-between text-[10.5px] border-t gap-1 ${
                      isSelected ? "border-slate-800 text-slate-300" : "border-slate-100 text-slate-600"
                    }`}
                  >
                    <div className="truncate">
                      <span>Forma: <strong className="font-mono">{model.last_code || "—"}</strong></span>
                      <span className="mx-1 opacity-40">·</span>
                      <span>Taglie: <strong>{model.default_size_range || "—"}</strong></span>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <span>Selezionato</span>
                          <span>●</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold group-hover:text-slate-600 transition">
                          Ispeziona →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Model Details & Attached PIM Products (7 cols) */}
        <div className="lg:col-span-7">
          {selectedModel ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Header of Selected Model */}
              <div className="border-b border-slate-200 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
                        {selectedModel.model_code}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {CATEGORY_LABELS[selectedModel.category] || selectedModel.category}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Genere: {selectedModel.target_gender || "Unisex"}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-neutral-900 mt-2">
                      {selectedModel.name}
                    </h2>
                    {selectedModel.description && (
                      <p className="text-xs text-slate-600 mt-1 max-w-xl">
                        {selectedModel.description}
                      </p>
                    )}
                  </div>

                  {/* Modifica ed eliminazione del modello selezionato */}
                  {isBrand && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModel(selectedModel)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs flex items-center justify-center gap-1.5"
                        title="Modifica anagrafica modello, geometria forma, cartamodello e costruzione"
                      >
                        <span>✏️ Modifica Modello</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteModel(selectedModel)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition shadow-xs flex items-center justify-center gap-1"
                        title="Elimina questo modello di base"
                      >
                        <span>🗑️ Elimina</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Technical Specifications Matrix */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                      Forma / Last Code
                    </span>
                    <strong className="font-mono text-sm text-neutral-900">
                      {selectedModel.last_code || "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                      Tipo Costruzione
                    </span>
                    <strong className="text-xs text-neutral-900">
                      {CONSTRUCTION_LABELS[selectedModel.sole_construction || ""] || selectedModel.sole_construction || "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                      Altezza Tacco
                    </span>
                    <strong className="text-sm text-neutral-900">
                      {selectedModel.heel_height_mm != null ? `${selectedModel.heel_height_mm} mm` : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                      Scala Taglie Default
                    </span>
                    <strong className="text-sm text-neutral-900">
                      {selectedModel.default_size_range || "—"}
                    </strong>
                  </div>
                </div>

                {/* CAD / 3D Cartamodello Dedicated Box (FTL-CEO-023) */}
                <div className="mt-4 p-3.5 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg">
                      📐
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Riferimento CAD / Cartamodello 3D
                        </span>
                        {selectedModel.cad_drawing_ref && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">
                            ALLEGATO PRONTO
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs font-semibold text-slate-200 mt-0.5 flex items-center gap-2">
                        <span>{selectedModel.cad_drawing_ref || "Nessun cartamodello o file CAD allegato"}</span>
                        {selectedModel.metadata?.cad_attachment?.size && (
                          <span className="text-[10px] text-slate-400">
                            ({(selectedModel.metadata.cad_attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedModel.cad_drawing_ref ? (
                      <button
                        type="button"
                        onClick={() => handleDownloadCadFile(selectedModel)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-sm"
                        title="Scarica il file CAD / cartamodello 3D allegato"
                      >
                        <span>⬇️ Scarica File CAD</span>
                      </button>
                    ) : (
                      isBrand && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModel(selectedModel)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
                        >
                          ➕ Allega File CAD
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Livello 2: Varianti Tecniche PLM di Produzione & Distinte Base */}
              <div className="space-y-3 bg-slate-50/70 border border-slate-200 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-600 text-white tracking-widest">
                        INGEGNERIA PLM &amp; MANOVIA
                      </span>
                      <h3 className="text-sm font-extrabold text-neutral-900">
                        Varianti Tecniche di Produzione &amp; Distinte Base ({attachedPlmVariants.length})
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Schede tecniche di fabbrica e manovia che condividono la geometria e la costruzione di questo modello base.
                    </p>
                  </div>

                  {onCreateProductFromModel && isBrand && (
                    <button
                      type="button"
                      onClick={() => onCreateProductFromModel(selectedModel)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <span>➕ Nuova Variante PLM</span>
                    </button>
                  )}
                </div>

                {attachedPlmVariants.length === 0 ? (
                  <div className="p-6 text-center bg-white border border-dashed border-slate-300 rounded-xl space-y-2">
                    <p className="text-xs text-slate-600 font-medium">
                      Nessuna variante tecnica PLM è attualmente creata per questo modello.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Regola di governance: un prodotto PLM può esistere solo se agganciato ad un Modello base.
                    </p>
                    {onCreateProductFromModel && isBrand && (
                      <button
                        type="button"
                        onClick={() => onCreateProductFromModel(selectedModel)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition"
                      >
                        ➕ Crea Primo Prodotto PLM da questo Modello
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {attachedPlmVariants.map((v) => (
                      <div
                        key={v.plm_variant_id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 shadow-xs transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-900 text-white">
                                {v.variant_code}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {v.colorway_name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {v.lifecycle_status.replace("_", " ")}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                              <span>📐 Forma: <strong>{v.last_or_pattern_code || selectedModel.last_code}</strong></span>
                              <span>⚙️ Scala: <strong>{v.size_range}</strong></span>
                              <span>🧩 Distinta Base: <strong>{v.bom_items?.length || 0} comp.</strong></span>
                              {v.subcontractor_assignments && v.subcontractor_assignments.length > 0 && (
                                <span>🏭 Terzisti: <strong>{v.subcontractor_assignments.length} fasi</strong></span>
                              )}
                              {isBrand && v.standard_labor_cost_eur != null && (
                                <span className="font-mono text-slate-800 font-bold">
                                  Manodopera L6: € {v.standard_labor_cost_eur.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {onSelectVariantItem ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onSelectVariantItem(v, v.parentPim, "bom_tree")}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs"
                                  title="Ingegnerizza o visualizza la distinta base a 3 livelli per questa variante"
                                >
                                  <span>🌿 BOM</span>
                                  <span>→</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onSelectVariantItem(v, v.parentPim, "catalogo")}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-xs"
                                  title="Visualizza questa variante nella scheda tecnica di produzione"
                                >
                                  <span>📦 Scheda Tecnica</span>
                                  <span>→</span>
                                </button>
                              </>
                            ) : (
                              onSelectPimItem && (
                                <button
                                  type="button"
                                  onClick={() => onSelectPimItem(v.parentPim)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1 shadow-xs"
                                >
                                  <span>Apri nel Catalogo / BOM</span>
                                  <span>→</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Raccordo Ontologico Modulo 03 PIM: Governance Commerciale demandata */}
              <div className="p-4 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/20 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                    🏷️
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900">
                      Governance Commerciale PIM &amp; Listini di Vendita
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      L&apos;aggancio commerciale 1:N con articoli di vendita, listini wholesale/retail, canali e-commerce e showroom è interamente governato nel modulo dedicato.
                    </p>
                  </div>
                </div>
                {onNavigateModule && (
                  <button
                    type="button"
                    onClick={() => onNavigateModule("pim_catalog")}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shrink-0 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Vai a 03 PIM (Catalogo Commerciale)</span>
                    <span>↗</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
              Seleziona un modello dalla colonna di sinistra per visualizzarne i dettagli ingegneristici e gli articoli PIM associati.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Crea / Modifica Modello di Base */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  {editingModel ? "✏️ Modifica Modello di Base" : "➕ Nuovo Modello di Base (Forma & Costruzione)"}
                </h3>
                <p className="text-xs text-slate-500">
                  Definisci i parametri geometrici e costruttivi a monte del catalogo commerciale PIM.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModelModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Codice Modello *
                  </label>
                  <input
                    type="text"
                    required
                    value={formModelCode}
                    onChange={(e) => setFormModelCode(e.target.value.toUpperCase())}
                    placeholder="es. MDL-FW-LOAFER"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nome Modello / Silhouette *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="es. Forma Mocassino Classico Duca"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Settore Merceologico
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="footwear">👠 Calzature</option>
                    <option value="leather_goods">👜 Pelletteria</option>
                    <option value="apparel">🧥 Abbigliamento</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Target Genere
                  </label>
                  <select
                    value={formTargetGender}
                    onChange={(e) => setFormTargetGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Uomo">Uomo</option>
                    <option value="Donna">Donna</option>
                    <option value="Unisex">Unisex</option>
                    <option value="Bambino">Bambino</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Codice Forma / Cartamodello (Last Code) *</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                      Sede Unica (FTL-CEO-025)
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLastCode}
                    onChange={(e) => setFormLastCode(e.target.value)}
                    placeholder="es. FORMA-FM-108"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Definita qui a livello di modello. Ereditata e bloccata su tutti i prodotti PLM e PIM.
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tipo Costruzione Suola
                  </label>
                  <select
                    value={formSoleConstruction}
                    onChange={(e) => setFormSoleConstruction(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="blake">Blake Cucito Tradizionale</option>
                    <option value="cassetta_cucita">Cassetta Cucita (Sneaker)</option>
                    <option value="goodyear">Goodyear Welted</option>
                    <option value="tubolare_sacchetto">Tubolare / Sacchetto</option>
                    <option value="strobel">Strobel Flessibile</option>
                    <option value="ago">Incollato / Ago Classico</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Altezza Tacco (mm)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="160"
                    value={formHeelHeightMm}
                    onChange={(e) => setFormHeelHeightMm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                {/* FTL-CEO-030: Sostituzione casella testo con select anagrafiche di dominio certificate */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Scala Taglie Certificata *</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                      Sede Unica (FTL-CEO-025 &amp; 030)
                    </span>
                  </label>
                  <select
                    required
                    value={formDefaultSizeRange}
                    onChange={(e) => setFormDefaultSizeRange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-xs"
                  >
                    <option value="">-- Seleziona Scala Taglie Certificata --</option>
                    {availableSizeScales.map((s) => (
                      <option key={`${s.code}-${s.label}`} value={s.code}>
                        {s.code} · {s.label} ({s.gender})
                      </option>
                    ))}
                    {formDefaultSizeRange &&
                      !availableSizeScales.some((s) => s.code === formDefaultSizeRange) && (
                        <option value={formDefaultSizeRange}>
                          {formDefaultSizeRange} (Valore Precedente)
                        </option>
                      )}
                  </select>
                  {(() => {
                    const matched = availableSizeScales.find(
                      (s) => s.code === formDefaultSizeRange
                    );
                    return matched?.sizes ? (
                      <div className="mt-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                        <strong>Taglie incluse:</strong> {matched.sizes}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Definita qui a livello di modello. Ereditata e bloccata su tutti i prodotti PLM e PIM.
                      </span>
                    );
                  })()}
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Riferimento CAD / Cartamodello 3D (Upload File &amp; Riferimento Vettoriale)
                  </label>

                  {/* Drag & Drop File Zone (FTL-CEO-023) */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleProcessCadFile(file);
                    }}
                    className={`p-3.5 border-2 border-dashed rounded-xl transition text-center ${
                      isDraggingFile
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50"
                    }`}
                  >
                    <input
                      type="file"
                      id="cad-file-upload-input"
                      accept=".dxf,.dwg,.cad,.stp,.step,.obj,.stl,.pdf,.zip,.iges"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessCadFile(file);
                      }}
                    />

                    {formCadFile || formCadRef ? (
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5">
                        <div className="flex items-center gap-2.5 text-left">
                          <span className="text-xl">📐</span>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-900 block truncate max-w-xs">
                              {formCadFile?.name || formCadRef}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              {formCadFile
                                ? `${(formCadFile.size / 1024).toFixed(1)} KB · File pronto per l'associazione`
                                : "Riferimento CAD / Cartamodello registrato"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="cad-file-upload-input"
                            className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                          >
                            Sostituisci
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setFormCadFile(null);
                              setFormCadRef("");
                            }}
                            className="px-2 py-1 text-[11px] font-bold rounded bg-rose-50 hover:bg-rose-100 text-rose-600"
                          >
                            ✕ Rimuovi
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label
                          htmlFor="cad-file-upload-input"
                          className="cursor-pointer inline-flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-emerald-700"
                        >
                          <span>📁 Trascina qui il file CAD / 3D oppure clicca per sfogliare</span>
                        </label>
                        <p className="text-[10px] text-slate-500">
                          Formati accettati: .dxf, .dwg, .cad, .stp, .step, .obj, .stl, .pdf
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Manual Override Input */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Oppure codice/percorso manuale:
                    </span>
                    <input
                      type="text"
                      value={formCadRef}
                      onChange={(e) => setFormCadRef(e.target.value)}
                      placeholder="es. CAD-2026-MC-01.dxf"
                      className="flex-1 px-2.5 py-1 rounded-lg border border-slate-300 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Stagione di Riferimento
                  </label>
                  <select
                    value={formSeasonId}
                    onChange={(e) => setFormSeasonId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">Nessuna / Continuativo</option>
                    {seasons.map((s) => (
                      <option key={s.season_id} value={s.season_id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Descrizione Ingegneristica &amp; Note di Manovia
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Specifiche tecniche su mascherina, tiraggio tomaia, pianta, cambrione..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white transition disabled:opacity-50"
                >
                  {isSubmitting ? "Salvataggio..." : editingModel ? "Aggiorna Modello" : "Crea Modello"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
