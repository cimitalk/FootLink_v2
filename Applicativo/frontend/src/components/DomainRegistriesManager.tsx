import React, { useState } from "react";
import { DomainRegistryEntry, RegistryDomain } from "../types";

interface DomainRegistriesManagerProps {
  registries: DomainRegistryEntry[];
  onCreateEntry: (entry: {
    registry_domain: RegistryDomain;
    registry_name: string;
    entry_code: string;
    label_it: string;
    label_en: string;
    metadata?: Record<string, any>;
    is_active: boolean;
    sort_order: number;
  }) => void;
  onUpdateEntry?: (
    domain: string,
    name: string,
    code: string,
    updated: {
      label_it: string;
      label_en: string;
      metadata?: Record<string, any>;
      is_active?: boolean;
      sort_order?: number;
    }
  ) => void;
  onDeleteEntry: (domain: string, name: string, code: string) => void;
}

const PIM_REGISTRY_CONFIG = [
  { name: "collection_pyramids", label: "Piramidi di Collezione (Carryover)", icon: "⭐", desc: "Carryover continuativi, Seasonal Core, Trend Drop, Capsule Limited" },
  { name: "categories", label: "Categorie Merceologiche", icon: "🏷️", desc: "Calzature, Pelletteria, Abbigliamento con codici doganali default" },
  { name: "retail_channels", label: "Canali di Vendita", icon: "🛍️", desc: "B2B Showroom, E-Commerce Flagship, Wholesale Boutique" },
  { name: "certifications", label: "Certificazioni Sostenibilità", icon: "🌱", desc: "LWG Gold, REACH, GRS, OEKO-TEX Standard 100" },
];

const PLM_REGISTRY_CONFIG = [
  { name: "construction_types", label: "Tipi di Costruzione & Lavorazione", icon: "🔨", desc: "Lavorazioni tecniche artigianali legate a Calzature, Pelletteria o Abbigliamento" },
  { name: "production_phases", label: "Fasi di Lavorazione Fabbrica", icon: "⚙️", desc: "Concia, Taglio CAD, Giunteria, Montaggio, Finissaggio, QA" },
  { name: "component_types", label: "Tipologie Componenti BOM", icon: "🧩", desc: "Tomaia, Fodera, Sottopiede, Suola/Fondo, Tacco, Minuteria" },
  { name: "suppliers", label: "Fornitori & Concerie", icon: "🏭", desc: "Concerie e fornitori distrettuali con rating e paese d'origine" },
  { name: "subcontractors", label: "Laboratori Terzisti (0 €)", icon: "🤝", desc: "Façonisti di filiera a canone 0 EUR perpetuo con magic link" },
  { name: "size_scales", label: "Scale Taglie Certificate", icon: "📐", desc: "Calzatura Donna 35-42, Uomo 38-46, Abbigliamento IT 44-56" },
  { name: "units_of_measure", label: "Unità di Misura (UoM)", icon: "⚖️", desc: "sqft, m², m, paia, pezzi, kg con fattori di conversione" },
];

const SUGGESTED_PYRAMID_DEPENDENCIES = [
  "Never Out of Stock (NOS)",
  "Full-Price Protected",
  "Saldi Ammessi Fine Stagione",
  "Campionario Stagionale",
  "Pre-Order Showroom",
  "Quick Response (Lead Time < 21gg)",
  "Lancio Social / Drop",
  "Numerazione di Serie",
  "Tiratura Singola (No Riordini)",
  "Pellame LWG Gold Obbligatorio",
  "BOM Standardizzata",
  "Approvazione Sconti L2",
  "Esclusiva E-Commerce / Flagship",
];

export const DomainRegistriesManager: React.FC<DomainRegistriesManagerProps> = ({
  registries,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const [activeDomain, setActiveDomain] = useState<RegistryDomain>("plm");
  const [selectedRegistryName, setSelectedRegistryName] = useState<string>("production_phases");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state - Add
  const [entryCode, setEntryCode] = useState("");
  const [labelIt, setLabelIt] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [metaExtra, setMetaExtra] = useState("");

  // Form state - Edit (FTL-CEO-007)
  const [editingEntry, setEditingEntry] = useState<DomainRegistryEntry | null>(null);
  const [editLabelIt, setEditLabelIt] = useState("");
  const [editLabelEn, setEditLabelEn] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(1);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editMetaExtra, setEditMetaExtra] = useState("");

  // Construction types state (FTL-PROD-011)
  const [constructionCategory, setConstructionCategory] = useState<string>("footwear");
  const [constructionDesc, setConstructionDesc] = useState<string>("");
  const [editConstructionCategory, setEditConstructionCategory] = useState<string>("footwear");
  const [editConstructionDesc, setEditConstructionDesc] = useState<string>("");

  // Size Scales Visual Builder State (FTL-PROD-008 & FTL-CEO-015)
  const [scaleMainCategory, setScaleMainCategory] = useState<string>("footwear");
  const [scaleTargetGender, setScaleTargetGender] = useState<string>("donna");
  const [scaleCategory, setScaleCategory] = useState<string>("shoes_woman");
  const [scaleMin, setScaleMin] = useState<number>(35);
  const [scaleMax, setScaleMax] = useState<number>(42);
  const [scaleBase, setScaleBase] = useState<number>(37);
  const [scaleCustomSizes, setScaleCustomSizes] = useState<string>("35, 36, 37, 38, 39, 40, 41, 42");

  const [editScaleMainCategory, setEditScaleMainCategory] = useState<string>("footwear");
  const [editScaleTargetGender, setEditScaleTargetGender] = useState<string>("donna");
  const [editScaleCategory, setEditScaleCategory] = useState<string>("shoes_woman");
  const [editScaleMin, setEditScaleMin] = useState<number>(35);
  const [editScaleMax, setEditScaleMax] = useState<number>(42);
  const [editScaleBase, setEditScaleBase] = useState<number>(37);
  const [editScaleCustomSizes, setEditScaleCustomSizes] = useState<string>("35, 36, 37, 38, 39, 40, 41, 42");

  const applyScalePreset = (preset: "woman" | "man" | "kid" | "apparel" | "leather", isEdit = false) => {
    let mainCat = "footwear";
    let gender = "donna";
    let cat = "shoes_woman";
    let min = 35;
    let max = 42;
    let base = 37;
    let sizes = "35, 36, 37, 38, 39, 40, 41, 42";
    let code = "eu_shoes_woman_cert";
    let it = "Calzature Donna EU 35-42";
    let en = "Women Shoes EU 35-42";

    if (preset === "man") {
      mainCat = "footwear";
      gender = "uomo";
      cat = "shoes_man";
      min = 38;
      max = 46;
      base = 42;
      sizes = "38, 39, 40, 41, 42, 43, 44, 45, 46";
      code = "eu_shoes_man_cert";
      it = "Calzature Uomo EU 38-46";
      en = "Men Shoes EU 38-46";
    } else if (preset === "apparel") {
      mainCat = "apparel";
      gender = "unisex";
      cat = "apparel";
      min = 44;
      max = 56;
      base = 48;
      sizes = "44, 46, 48, 50, 52, 54, 56";
      code = "it_apparel_cert";
      it = "Abbigliamento IT 44-56";
      en = "Italian Apparel 44-56";
    } else if (preset === "kid") {
      mainCat = "footwear";
      gender = "bambino";
      cat = "shoes_kid";
      min = 24;
      max = 34;
      base = 28;
      sizes = "24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34";
      code = "eu_shoes_kid_cert";
      it = "Calzature Bambino EU 24-34";
      en = "Kids Shoes EU 24-34";
    } else if (preset === "leather") {
      mainCat = "leather_goods";
      gender = "unisex";
      cat = "leather_goods";
      min = 1;
      max = 1;
      base = 1;
      sizes = "TU";
      code = "leather_tu_cert";
      it = "Pelletteria Taglia Unica (TU)";
      en = "Leather Goods One Size (OS)";
    }

    if (isEdit) {
      setEditScaleMainCategory(mainCat);
      setEditScaleTargetGender(gender);
      setEditScaleCategory(cat);
      setEditScaleMin(min);
      setEditScaleMax(max);
      setEditScaleBase(base);
      setEditScaleCustomSizes(sizes);
      setEditLabelIt(it);
      setEditLabelEn(en);
    } else {
      setScaleMainCategory(mainCat);
      setScaleTargetGender(gender);
      setScaleCategory(cat);
      setScaleMin(min);
      setScaleMax(max);
      setScaleBase(base);
      setScaleCustomSizes(sizes);
      setEntryCode(code);
      setLabelIt(it);
      setLabelEn(en);
    }
  };

  // Collection Pyramids Visual Builder State (FTL-TECH-016)
  const [pyramidPriority, setPyramidPriority] = useState<string>("iconic");
  const [pyramidLifecycleYears, setPyramidLifecycleYears] = useState<number>(3);
  const [pyramidDiscountAllowed, setPyramidDiscountAllowed] = useState<boolean>(false);
  const [pyramidReplenishment, setPyramidReplenishment] = useState<string>("continuous");
  const [pyramidTargetMixPct, setPyramidTargetMixPct] = useState<number>(40);
  const [pyramidTargetMarginPct, setPyramidTargetMarginPct] = useState<number>(68);
  const [pyramidDependsOn, setPyramidDependsOn] = useState<string>("");
  const [pyramidDependencies, setPyramidDependencies] = useState<string[]>([
    "Never Out of Stock (NOS)",
    "Full-Price Protected",
    "BOM Standardizzata",
  ]);
  const [newDepInput, setNewDepInput] = useState<string>("");

  const [editPyramidPriority, setEditPyramidPriority] = useState<string>("iconic");
  const [editPyramidLifecycleYears, setEditPyramidLifecycleYears] = useState<number>(3);
  const [editPyramidDiscountAllowed, setEditPyramidDiscountAllowed] = useState<boolean>(false);
  const [editPyramidReplenishment, setEditPyramidReplenishment] = useState<string>("continuous");
  const [editPyramidTargetMixPct, setEditPyramidTargetMixPct] = useState<number>(40);
  const [editPyramidTargetMarginPct, setEditPyramidTargetMarginPct] = useState<number>(68);
  const [editPyramidDependsOn, setEditPyramidDependsOn] = useState<string>("");
  const [editPyramidDependencies, setEditPyramidDependencies] = useState<string[]>([]);
  const [editNewDepInput, setEditNewDepInput] = useState<string>("");

  const applyPyramidPreset = (
    preset: "carryover" | "seasonal_core" | "trend_drop" | "capsule",
    isEdit = false
  ) => {
    let code = "carryover_continuativo";
    let it = "⭐ Continuativo / Carryover (No Saldi)";
    let en = "Iconic Carryover (Always in Stock)";
    let priority = "iconic";
    let years = 3;
    let discount = false;
    let replenishment = "continuous";
    let targetMix = 40;
    let margin = 68;
    let depends = "";
    let deps = ["Never Out of Stock (NOS)", "Full-Price Protected", "BOM Standardizzata"];

    if (preset === "seasonal_core") {
      code = "seasonal_core";
      it = "🌿 Stagionale Core";
      en = "Seasonal Core Collection";
      priority = "core";
      years = 1;
      discount = true;
      replenishment = "seasonal_preorder";
      targetMix = 40;
      margin = 62;
      depends = "carryover_continuativo";
      deps = ["Campionario Stagionale", "Saldi Ammessi Fine Stagione", "Pre-Order Showroom"];
    } else if (preset === "trend_drop") {
      code = "trend_drop";
      it = "⚡ Trend Drop / Capsule";
      en = "Trend Drop / Flash Release";
      priority = "high_energy";
      years = 0.5;
      discount = true;
      replenishment = "on_demand";
      targetMix = 15;
      margin = 70;
      depends = "seasonal_core";
      deps = ["Quick Response (Lead Time < 21gg)", "Lancio Social / Drop", "Tiratura Flessibile"];
    } else if (preset === "capsule") {
      code = "capsule_limited";
      it = "💎 Capsule Limited Edition";
      en = "Capsule Limited Edition";
      priority = "luxury_numbered";
      years = 0.5;
      discount = false;
      replenishment = "one_shot";
      targetMix = 5;
      margin = 75;
      depends = "carryover_continuativo";
      deps = [
        "Numerazione di Serie",
        "Tiratura Singola (No Riordini)",
        "Full-Price Protected",
        "Pellame LWG Gold Obbligatorio",
      ];
    }

    if (isEdit) {
      setEditLabelIt(it);
      setEditLabelEn(en);
      setEditPyramidPriority(priority);
      setEditPyramidLifecycleYears(years);
      setEditPyramidDiscountAllowed(discount);
      setEditPyramidReplenishment(replenishment);
      setEditPyramidTargetMixPct(targetMix);
      setEditPyramidTargetMarginPct(margin);
      setEditPyramidDependsOn(depends);
      setEditPyramidDependencies(deps);
    } else {
      setEntryCode(code);
      setLabelIt(it);
      setLabelEn(en);
      setPyramidPriority(priority);
      setPyramidLifecycleYears(years);
      setPyramidDiscountAllowed(discount);
      setPyramidReplenishment(replenishment);
      setPyramidTargetMixPct(targetMix);
      setPyramidTargetMarginPct(margin);
      setPyramidDependsOn(depends);
      setPyramidDependencies(deps);
    }
  };

  const togglePyramidDep = (dep: string) => {
    setPyramidDependencies((prev) =>
      prev.includes(dep) ? prev.filter((d) => d !== dep) : [...prev, dep]
    );
  };

  const addCustomPyramidDep = () => {
    const trimmed = newDepInput.trim();
    if (!trimmed) return;
    if (!pyramidDependencies.includes(trimmed)) {
      setPyramidDependencies((prev) => [...prev, trimmed]);
    }
    setNewDepInput("");
  };

  const removePyramidDep = (dep: string) => {
    setPyramidDependencies((prev) => prev.filter((d) => d !== dep));
  };

  const toggleEditPyramidDep = (dep: string) => {
    setEditPyramidDependencies((prev) =>
      prev.includes(dep) ? prev.filter((d) => d !== dep) : [...prev, dep]
    );
  };

  const addEditCustomPyramidDep = () => {
    const trimmed = editNewDepInput.trim();
    if (!trimmed) return;
    if (!editPyramidDependencies.includes(trimmed)) {
      setEditPyramidDependencies((prev) => [...prev, trimmed]);
    }
    setEditNewDepInput("");
  };

  const removeEditPyramidDep = (dep: string) => {
    setEditPyramidDependencies((prev) => prev.filter((d) => d !== dep));
  };

  const currentConfigs = activeDomain === "pim" ? PIM_REGISTRY_CONFIG : PLM_REGISTRY_CONFIG;
  const currentConfig =
    currentConfigs.find((c) => c.name === selectedRegistryName) || currentConfigs[0];

  const handleDomainChange = (domain: RegistryDomain) => {
    setActiveDomain(domain);
    const firstReg = domain === "pim" ? PIM_REGISTRY_CONFIG[0].name : PLM_REGISTRY_CONFIG[0].name;
    setSelectedRegistryName(firstReg);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryCode.trim() || !labelIt.trim()) return;

    let parsedMeta: Record<string, any> = {};
    if (selectedRegistryName === "size_scales") {
      const sizeList = scaleCustomSizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      parsedMeta = {
        category: scaleMainCategory,
        target_gender: scaleTargetGender,
        sub_category: scaleCategory,
        min: Number(scaleMin) || 35,
        max: Number(scaleMax) || 42,
        base: Number(scaleBase) || 37,
        sizes: sizeList.length > 0 ? sizeList : ["35", "36", "37", "38", "39", "40", "41", "42"],
        grading_delta_pct: scaleMainCategory === "apparel" ? 3.4 : 2.8,
      };
    } else if (selectedRegistryName === "construction_types") {
      parsedMeta = {
        category: constructionCategory,
        description: constructionDesc.trim() || undefined,
      };
    } else if (selectedRegistryName === "collection_pyramids") {
      parsedMeta = {
        priority: pyramidPriority,
        lifecycle_years: Number(pyramidLifecycleYears) || 1,
        discount_allowed: pyramidDiscountAllowed,
        replenishment_type: pyramidReplenishment,
        target_mix_pct: Number(pyramidTargetMixPct) || 0,
        target_margin_pct: Number(pyramidTargetMarginPct) || 0,
        depends_on: pyramidDependsOn || undefined,
        dependencies: pyramidDependencies,
      };
    } else if (metaExtra.trim()) {
      try {
        parsedMeta = JSON.parse(metaExtra);
      } catch {
        parsedMeta = { note: metaExtra.trim() };
      }
    }

    onCreateEntry({
      registry_domain: activeDomain,
      registry_name: selectedRegistryName,
      entry_code: entryCode.trim().toLowerCase().replace(/[\s-]/g, "_"),
      label_it: labelIt.trim(),
      label_en: labelEn.trim() || labelIt.trim(),
      metadata: parsedMeta,
      is_active: true,
      sort_order: Number(sortOrder) || 1,
    });

    setEntryCode("");
    setLabelIt("");
    setLabelEn("");
    setMetaExtra("");
    setConstructionDesc("");
    setShowAddModal(false);
  };

  const handleStartEdit = (entry: DomainRegistryEntry) => {
    setEditingEntry(entry);
    setEditLabelIt(entry.label_it);
    setEditLabelEn(entry.label_en || "");
    setEditSortOrder(entry.sort_order ?? 1);
    setEditIsActive(entry.is_active ?? true);
    if (entry.registry_name === "size_scales" && entry.metadata) {
      setEditScaleCategory(entry.metadata.sub_category || entry.metadata.category || "shoes_woman");
      setEditScaleMainCategory(
        entry.metadata.category === "apparel"
          ? "apparel"
          : entry.metadata.category === "leather_goods"
          ? "leather_goods"
          : "footwear"
      );
      setEditScaleTargetGender(entry.metadata.target_gender || "donna");
      setEditScaleMin(entry.metadata.min ?? 35);
      setEditScaleMax(entry.metadata.max ?? 42);
      setEditScaleBase(entry.metadata.base ?? 37);
      if (Array.isArray(entry.metadata.sizes)) {
        setEditScaleCustomSizes(entry.metadata.sizes.join(", "));
      } else {
        setEditScaleCustomSizes("35, 36, 37, 38, 39, 40, 41, 42");
      }
    } else if (entry.registry_name === "construction_types" && entry.metadata) {
      setEditConstructionCategory(entry.metadata.category || "footwear");
      setEditConstructionDesc(entry.metadata.description || "");
    } else if (entry.registry_name === "collection_pyramids") {
      const meta = entry.metadata || {};
      setEditPyramidPriority(meta.priority || "iconic");
      setEditPyramidLifecycleYears(meta.lifecycle_years ?? 1);
      setEditPyramidDiscountAllowed(Boolean(meta.discount_allowed));
      setEditPyramidReplenishment(meta.replenishment_type || "continuous");
      setEditPyramidTargetMixPct(meta.target_mix_pct ?? 25);
      setEditPyramidTargetMarginPct(meta.target_margin_pct ?? 65);
      setEditPyramidDependsOn(meta.depends_on || "");
      setEditPyramidDependencies(
        Array.isArray(meta.dependencies) ? [...meta.dependencies] : []
      );
      setEditNewDepInput("");
    }
    setEditMetaExtra(
      entry.metadata && Object.keys(entry.metadata).length > 0
        ? JSON.stringify(entry.metadata, null, 2)
        : ""
    );
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !editLabelIt.trim() || !onUpdateEntry) return;

    let parsedMeta: Record<string, any> = {};
    if (editingEntry.registry_name === "size_scales") {
      const sizeList = editScaleCustomSizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      parsedMeta = {
        category: editScaleMainCategory,
        target_gender: editScaleTargetGender,
        sub_category: editScaleCategory,
        min: Number(editScaleMin) || 35,
        max: Number(editScaleMax) || 42,
        base: Number(editScaleBase) || 37,
        sizes: sizeList,
        grading_delta_pct: editScaleMainCategory === "apparel" ? 3.4 : 2.8,
      };
    } else if (editingEntry.registry_name === "construction_types") {
      parsedMeta = {
        category: editConstructionCategory,
        description: editConstructionDesc.trim() || undefined,
      };
    } else if (editingEntry.registry_name === "collection_pyramids") {
      parsedMeta = {
        priority: editPyramidPriority,
        lifecycle_years: Number(editPyramidLifecycleYears) || 1,
        discount_allowed: editPyramidDiscountAllowed,
        replenishment_type: editPyramidReplenishment,
        target_mix_pct: Number(editPyramidTargetMixPct) || 0,
        target_margin_pct: Number(editPyramidTargetMarginPct) || 0,
        depends_on: editPyramidDependsOn || undefined,
        dependencies: editPyramidDependencies,
      };
    } else if (editMetaExtra.trim()) {
      try {
        parsedMeta = JSON.parse(editMetaExtra);
      } catch {
        parsedMeta = { note: editMetaExtra.trim() };
      }
    }

    onUpdateEntry(
      editingEntry.registry_domain,
      editingEntry.registry_name,
      editingEntry.entry_code,
      {
        label_it: editLabelIt.trim(),
        label_en: editLabelEn.trim() || editLabelIt.trim(),
        metadata: parsedMeta,
        is_active: editIsActive,
        sort_order: Number(editSortOrder) || 1,
      }
    );

    setEditingEntry(null);
  };

  // Filter entries
  const currentEntries = registries.filter(
    (r) =>
      (r.registry_domain === activeDomain || (r.registry_domain as string) === activeDomain) &&
      r.registry_name === selectedRegistryName
  );

  const filteredEntries = currentEntries.filter(
    (e) =>
      e.label_it.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.entry_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.label_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="bg-[#111111] text-white p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9E9E9E]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            MODULO 03 · TABELLE ANAGRAFICHE DI DOMINIO
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Master Data PLM &amp; PIM
          </h2>
          <p className="text-sm text-[#CCCCCC] mt-1 max-w-2xl">
            Gestisci in modo centralizzato e flessibile le anagrafiche di filiera.
            Le tabelle alimentano dinamicamente tutti i menù a discesa e le validazioni nei moduli di prodotto.
          </p>
        </div>

        {/* Domain Tabs: PIM vs PLM */}
        <div className="flex items-center gap-2 bg-[#222222] p-1.5 rounded-full border border-[#333333]">
          <button
            type="button"
            onClick={() => handleDomainChange("plm")}
            className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition ${
              activeDomain === "plm"
                ? "bg-white text-[#111111] shadow-sm"
                : "text-[#9E9E9E] hover:text-white"
            }`}
          >
            🏭 Anagrafiche PLM Fabbrica
          </button>
          <button
            type="button"
            onClick={() => handleDomainChange("pim")}
            className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition ${
              activeDomain === "pim"
                ? "bg-white text-[#111111] shadow-sm"
                : "text-[#9E9E9E] hover:text-white"
            }`}
          >
            📦 Anagrafiche PIM Commerciale
          </button>
        </div>
      </div>

      {/* Main Split Layout: Registries List + Entries Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registry Selectors (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="px-1 text-xs font-bold uppercase tracking-wider text-[#707072]">
            Tabelle {activeDomain.toUpperCase()} Disponibili
          </div>

          {currentConfigs.map((cfg) => {
            const isSelected = cfg.name === selectedRegistryName;
            const count = registries.filter(
              (r) =>
                (r.registry_domain === activeDomain || (r.registry_domain as string) === activeDomain) &&
                r.registry_name === cfg.name
            ).length;

            return (
              <div
                key={cfg.name}
                onClick={() => setSelectedRegistryName(cfg.name)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? "border-[#111111] bg-white ring-1 ring-[#111111] shadow-sm"
                    : "border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white hover:border-[#CCCCCC]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{cfg.icon}</span>
                    <span className="text-xs font-extrabold text-[#111111]">
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5 rounded-full text-[#111111]">
                    {count}
                  </span>
                </div>
                <div className="text-[11px] text-[#707072] mt-1 line-clamp-1 pl-7">
                  {cfg.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Entries Table & CRUD (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-[#E5E5E5] p-6 rounded-2xl">
            {/* Table Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E5E5]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentConfig.icon}</span>
                  <h3 className="text-lg font-black text-[#111111]">
                    {currentConfig.label}
                  </h3>
                  <span className="text-xs font-mono font-bold bg-[#F5F5F5] px-2 py-0.5 rounded text-[#707072]">
                    {activeDomain}/{selectedRegistryName}
                  </span>
                </div>
                <p className="text-xs text-[#707072] mt-1">{currentConfig.desc}</p>
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Cerca per etichetta o codice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-[#E5E5E5] text-xs font-medium focus:outline-none focus:border-[#111111]"
                />
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-1.5 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-black transition whitespace-nowrap"
                >
                  + Aggiungi Voce
                </button>
              </div>
            </div>

            {/* Entries Table */}
            <div className="overflow-x-auto mt-4">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#707072] bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E5E5]">
                  Nessuna voce presente o corrispondente alla ricerca.
                  Clicca su <strong>+ Aggiungi Voce</strong> per inserire un nuovo elemento.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] text-[#707072] font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Ordine</th>
                      <th className="py-2.5 px-3">Codice Univoco</th>
                      <th className="py-2.5 px-3">Etichetta (IT)</th>
                      <th className="py-2.5 px-3">Etichetta (EN)</th>
                      <th className="py-2.5 px-3">Dettagli / Metadati</th>
                      <th className="py-2.5 px-3 text-right">Azione</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {filteredEntries.map((item) => (
                      <tr key={item.entry_code} className="hover:bg-[#FAFAFA] transition">
                        <td className="py-3 px-3 font-mono font-bold text-[#707072]">
                          #{item.sort_order}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded text-[11px]">
                            {item.entry_code}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-extrabold text-[#111111]">
                          {item.label_it}
                        </td>
                        <td className="py-3 px-3 text-[#707072]">
                          {item.label_en}
                        </td>
                        <td className="py-3 px-3">
                          {selectedRegistryName === "size_scales" && item.metadata ? (
                            <div className="space-y-1 max-w-sm">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border">
                                  {item.metadata?.category === "footwear" ? "👟 Calzature" : item.metadata?.category === "leather_goods" ? "👜 Pelletteria" : item.metadata?.category === "apparel" ? "🧥 Abbigliamento" : (item.metadata?.category || "Calzature")}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  {item.metadata?.target_gender === "donna" ? "♀ Donna" : item.metadata?.target_gender === "uomo" ? "♂ Uomo" : item.metadata?.target_gender === "bambino" ? "🧒 Bambino" : "⚥ Unisex"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(item.metadata.sizes)
                                  ? item.metadata.sizes
                                  : (item.metadata?.min !== undefined && item.metadata?.max !== undefined)
                                  ? Array.from(
                                      { length: item.metadata.max - item.metadata.min + 1 },
                                      (_, i) => (item.metadata?.min ?? 0) + i
                                    )
                                  : []
                                ).map((sz: any) => (
                                  <span
                                    key={String(sz)}
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                      String(sz) === String(item.metadata?.base) || String(sz).includes(` ${item.metadata?.base}`)
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "bg-white border border-[#CCCCCC] text-[#111111]"
                                    }`}
                                  >
                                    {String(sz)}
                                    {String(sz) === String(item.metadata?.base) ? " (Base)" : ""}
                                  </span>
                                ))}
                              </div>
                              <div className="text-[10px] text-[#707072]">
                                Base Campione: <strong className="text-[#111111]">{item.metadata.base ?? "42"}</strong> · Step BOM: <strong className="text-[#111111]">+{item.metadata.grading_delta_pct ?? 2.8}%</strong>
                              </div>
                            </div>
                          ) : selectedRegistryName === "construction_types" && item.metadata ? (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border">
                                {item.metadata?.category === "footwear" ? "👟 Calzature" : item.metadata?.category === "leather_goods" ? "👜 Pelletteria" : item.metadata?.category === "apparel" ? "🧥 Abbigliamento" : (item.metadata?.category || "👟 Calzature")}
                              </span>
                              {item.metadata?.description && (
                                <div className="text-[10px] text-neutral-500 italic mt-0.5">{item.metadata.description}</div>
                              )}
                            </div>
                          ) : selectedRegistryName === "collection_pyramids" ? (
                            <div className="space-y-1.5 max-w-md">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                    item.metadata?.priority === "iconic"
                                      ? "bg-amber-100 text-amber-900 border-amber-300"
                                      : item.metadata?.priority === "core"
                                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                      : item.metadata?.priority === "high_energy"
                                      ? "bg-purple-100 text-purple-900 border-purple-300"
                                      : "bg-rose-100 text-rose-900 border-rose-300"
                                  }`}
                                >
                                  {item.metadata?.priority === "iconic"
                                    ? "⭐ Continuativo / Iconic"
                                    : item.metadata?.priority === "core"
                                    ? "🌿 Seasonal Core"
                                    : item.metadata?.priority === "high_energy"
                                    ? "⚡ Trend Drop / Capsule"
                                    : item.metadata?.priority === "luxury_numbered"
                                    ? "💎 Capsule Limited"
                                    : (item.metadata?.priority || "Livello Piramide")}
                                </span>

                                {item.metadata?.lifecycle_years !== undefined && (
                                  <span className="text-[10px] font-mono bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full text-neutral-700">
                                    ⏱️ {item.metadata.lifecycle_years} {item.metadata.lifecycle_years === 1 ? "anno" : "anni"}
                                  </span>
                                )}

                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    item.metadata?.discount_allowed === false
                                      ? "bg-neutral-900 text-white"
                                      : "bg-blue-100 text-blue-800 border border-blue-200"
                                  }`}
                                >
                                  {item.metadata?.discount_allowed === false
                                    ? "🛡️ No Saldi (Full-Price)"
                                    : "🏷️ Saldi Ammessi"}
                                </span>

                                {item.metadata?.target_mix_pct && (
                                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                                    📊 Mix: {item.metadata.target_mix_pct}%
                                  </span>
                                )}
                              </div>

                              {item.metadata?.depends_on && (
                                <div className="text-[10px] font-semibold text-neutral-600 flex items-center gap-1">
                                  <span>↳ Dipende da:</span>
                                  <span className="font-mono bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded text-[9px]">
                                    {registries.find(
                                      (r) =>
                                        r.registry_name === "collection_pyramids" &&
                                        r.entry_code === item.metadata?.depends_on
                                    )?.label_it || item.metadata.depends_on}
                                  </span>
                                </div>
                              )}

                              {Array.isArray(item.metadata?.dependencies) && item.metadata.dependencies.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {item.metadata.dependencies.map((dep: string) => (
                                    <span
                                      key={dep}
                                      className="text-[9px] bg-neutral-50 border border-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded font-medium"
                                    >
                                      🔗 {dep}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : item.metadata && Object.keys(item.metadata).length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {Object.entries(item.metadata).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="text-[10px] bg-[#F5F5F5] border border-[#E5E5E5] px-1.5 py-0.5 rounded text-[#707072]"
                                >
                                  <strong>{k}:</strong> {String(v)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#9E9E9E] text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="text-[#111111] hover:text-black text-xs font-bold transition px-2.5 py-1 rounded-lg border border-[#CCCCCC] hover:border-[#111111] hover:bg-[#F5F5F5] flex items-center gap-1"
                              title="Modifica elemento della tabella anagrafica"
                            >
                              <span>✏️</span>
                              <span>Modifica</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onDeleteEntry(
                                  item.registry_domain,
                                  item.registry_name,
                                  item.entry_code
                                )
                              }
                              className="text-[#DC2626] hover:text-[#991B1B] text-xs font-bold transition px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"
                              title="Elimina voce da anagrafica"
                            >
                              Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Aggiungi Voce Anagrafica */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-xl">
            <h3 className="text-lg font-black text-[#111111]">
              Nuovo Elemento in {currentConfig.label}
            </h3>
            <p className="text-xs text-[#707072] mt-0.5">
              Inserisci una nuova voce anagrafica per la tabella <code>{selectedRegistryName}</code>.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Codice Chiave (Univoco, es. CONCERIA_ROSSI, SUOLA_VIBRAM) *
                </label>
                <input
                  type="text"
                  required
                  value={entryCode}
                  onChange={(e) => setEntryCode(e.target.value)}
                  placeholder="es. tomaia_vitello_pieno_fiore"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-mono font-bold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Etichetta Italiana *
                </label>
                <input
                  type="text"
                  required
                  value={labelIt}
                  onChange={(e) => setLabelIt(e.target.value)}
                  placeholder="es. Vitello Pieno Fiore 1.4mm"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Etichetta Inglese
                </label>
                <input
                  type="text"
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                  placeholder="es. Full-Grain Calfskin 1.4mm"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Ordine di Visualizzazione
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              {selectedRegistryName === "construction_types" ? (
                <div className="bg-[#F9F9F9] border border-[#CCCCCC] rounded-xl p-3.5 space-y-3">
                  <div className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                    🔨 Associazione Gerarchica a Categoria
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Categoria di Riferimento *
                    </label>
                    <select
                      value={constructionCategory}
                      onChange={(e) => setConstructionCategory(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-semibold"
                    >
                      <option value="footwear">👟 Calzature (Cassetta, Blake, Goodyear, Sacchetto, ecc.)</option>
                      <option value="leather_goods">👜 Pelletteria (Costa taglio vivo, Rimboccato, ecc.)</option>
                      <option value="apparel">🧥 Abbigliamento (Taglio vivo, Foderato, Sartoriale)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Descrizione Tecnica della Lavorazione
                    </label>
                    <input
                      type="text"
                      value={constructionDesc}
                      onChange={(e) => setConstructionDesc(e.target.value)}
                      placeholder="es. Cucitura passante tra suola e tomaia..."
                      className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              ) : selectedRegistryName === "size_scales" ? (
                <div className="bg-[#F9F9F9] border border-[#CCCCCC] rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                      📐 Configuratore Visuale Scala Taglie Certificate
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      Zero JSON
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#707072] uppercase block mb-1">
                      Template &amp; Preset Rapidi di Settore
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyScalePreset("woman")}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👠 Donna EU (35-42)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("man")}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👞 Uomo EU (38-46)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("apparel")}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        🧥 Abbigliamento IT (44-56)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("leather")}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👜 Pelletteria (TU)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("kid")}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        🧒 Bambino EU (24-34)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Categoria Merceologica *
                      </label>
                      <select
                        value={scaleMainCategory}
                        onChange={(e) => setScaleMainCategory(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-semibold"
                      >
                        <option value="footwear">👟 Calzature</option>
                        <option value="leather_goods">👜 Pelletteria</option>
                        <option value="apparel">🧥 Abbigliamento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Genere Target *
                      </label>
                      <select
                        value={scaleTargetGender}
                        onChange={(e) => setScaleTargetGender(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-semibold"
                      >
                        <option value="donna">♀ Donna</option>
                        <option value="uomo">♂ Uomo</option>
                        <option value="unisex">⚥ Unisex</option>
                        <option value="bambino">🧒 Bambino</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Taglia Min
                      </label>
                      <input
                        type="number"
                        value={scaleMin}
                        onChange={(e) => setScaleMin(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Taglia Max
                      </label>
                      <input
                        type="number"
                        value={scaleMax}
                        onChange={(e) => setScaleMax(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Base Campione
                      </label>
                      <input
                        type="number"
                        value={scaleBase}
                        onChange={(e) => setScaleBase(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Elenco Taglie Incluse (separate da virgola)
                    </label>
                    <input
                      type="text"
                      value={scaleCustomSizes}
                      onChange={(e) => setScaleCustomSizes(e.target.value)}
                      placeholder="es. 38, 39, 40, 41, 42, 43, 44, 45, 46"
                      className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-[#707072] uppercase block mb-1">
                      Anteprima Taglie Certificate:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {scaleCustomSizes
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((s) => (
                          <span
                            key={s}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              s === String(scaleBase)
                                ? "bg-emerald-500 text-white"
                                : "bg-white border border-[#CCCCCC] text-[#111111]"
                            }`}
                          >
                            {s} {s === String(scaleBase) ? "(Base)" : ""}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              ) : selectedRegistryName === "collection_pyramids" ? (
                <div className="bg-[#F9F9F9] border border-[#CCCCCC] rounded-xl p-3.5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">⭐</span>
                      <span className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                        Configuratore Piramide di Collezione
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      Zero JSON
                    </span>
                  </div>

                  {/* Presets rapidi */}
                  <div>
                    <label className="text-[10px] font-bold text-[#707072] uppercase block mb-1">
                      Template &amp; Preset Rapidi di Livello
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyPyramidPreset("carryover")}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-left transition flex items-center gap-1 ${
                          pyramidPriority === "iconic"
                            ? "bg-amber-100 border-amber-400 text-amber-900"
                            : "bg-white border-[#CCCCCC] hover:bg-neutral-100"
                        }`}
                      >
                        <span>⭐</span> Continuativo
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPyramidPreset("seasonal_core")}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-left transition flex items-center gap-1 ${
                          pyramidPriority === "core"
                            ? "bg-emerald-100 border-emerald-400 text-emerald-900"
                            : "bg-white border-[#CCCCCC] hover:bg-neutral-100"
                        }`}
                      >
                        <span>🌿</span> Seasonal Core
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPyramidPreset("trend_drop")}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-left transition flex items-center gap-1 ${
                          pyramidPriority === "high_energy"
                            ? "bg-purple-100 border-purple-400 text-purple-900"
                            : "bg-white border-[#CCCCCC] hover:bg-neutral-100"
                        }`}
                      >
                        <span>⚡</span> Trend Drop
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPyramidPreset("capsule")}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-left transition flex items-center gap-1 ${
                          pyramidPriority === "luxury_numbered"
                            ? "bg-rose-100 border-rose-400 text-rose-900"
                            : "bg-white border-[#CCCCCC] hover:bg-neutral-100"
                        }`}
                      >
                        <span>💎</span> Capsule Limited
                      </button>
                    </div>
                  </div>

                  {/* Grid Parametri Chiave */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Ruolo Strategico / Priorità *
                      </label>
                      <select
                        value={pyramidPriority}
                        onChange={(e) => setPyramidPriority(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="iconic">⭐ Iconic Carryover (Always in Stock)</option>
                        <option value="core">🌿 Seasonal Core (Volume Driver)</option>
                        <option value="high_energy">⚡ High Energy / Trend Drop</option>
                        <option value="luxury_numbered">💎 Luxury Numbered / Limited Edition</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Dipendenza Gerarchica (↳ Dipende da)
                      </label>
                      <select
                        value={pyramidDependsOn}
                        onChange={(e) => setPyramidDependsOn(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Nessuna (Livello Indipendente / Base) --</option>
                        {registries
                          .filter(
                            (r) =>
                              r.registry_name === "collection_pyramids" &&
                              r.is_active &&
                              r.entry_code !== entryCode
                          )
                          .map((p) => (
                            <option key={p.entry_code} value={p.entry_code}>
                              ↳ {p.label_it} ({p.entry_code})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Ciclo di Vita (Anni)
                      </label>
                      <select
                        value={String(pyramidLifecycleYears)}
                        onChange={(e) => setPyramidLifecycleYears(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-mono font-bold"
                      >
                        <option value="3">3 anni (Continuativo Pluriennale)</option>
                        <option value="2">2 anni (Biannuale)</option>
                        <option value="1">1 anno (Stagionale SS/FW)</option>
                        <option value="0.5">0.5 anni (6 Mesi / Spot)</option>
                        <option value="0.25">0.25 anni (3 Mesi / Flash Drop)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Politica Prezzo / Sconti
                      </label>
                      <select
                        value={pyramidDiscountAllowed ? "true" : "false"}
                        onChange={(e) => setPyramidDiscountAllowed(e.target.value === "true")}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="false">🛡️ Full-Price (No Saldi / Protetto)</option>
                        <option value="true">🏷️ Saldi Ammessi a Fine Stagione</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Tipo Riordino
                      </label>
                      <select
                        value={pyramidReplenishment}
                        onChange={(e) => setPyramidReplenishment(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="continuous">📦 Continuo (NOS)</option>
                        <option value="seasonal_preorder">📅 Su Campionario (Pre-Order)</option>
                        <option value="on_demand">⚡ Quick Response Terzista</option>
                        <option value="one_shot">🔒 Tiratura Singola (One-Shot)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Quota Mix Target Collezione (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={pyramidTargetMixPct}
                        onChange={(e) => setPyramidTargetMixPct(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-mono font-bold"
                        placeholder="es. 40"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Marginalità Minima Target (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={pyramidTargetMarginPct}
                        onChange={(e) => setPyramidTargetMarginPct(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-mono font-bold"
                        placeholder="es. 68"
                      />
                    </div>
                  </div>

                  {/* Dipendenze & Regole Operative (FTL-TECH-016: Facilità inserimento dipendenze) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-[#707072] uppercase">
                        🔗 Dipendenze e Vincoli di Livello (Clicca o Aggiungi)
                      </label>
                      <span className="text-[10px] text-[#707072]">
                        {pyramidDependencies.length} attive
                      </span>
                    </div>

                    {/* Suggestion Chips */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {SUGGESTED_PYRAMID_DEPENDENCIES.map((sug) => {
                        const isSelected = pyramidDependencies.includes(sug);
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => togglePyramidDep(sug)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition border ${
                              isSelected
                                ? "bg-[#111111] text-white border-black"
                                : "bg-white text-[#555555] border-[#D0D0D0] hover:border-[#888888]"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}
                            {sug}
                          </button>
                        );
                      })}
                    </div>

                    {/* Input personalizzato per nuova dipendenza */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newDepInput}
                        onChange={(e) => setNewDepInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomPyramidDep();
                          }
                        }}
                        placeholder="Aggiungi vincolo (es. Certificazione REACH, Min. 50 paia)..."
                        className="flex-1 bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={addCustomPyramidDep}
                        className="px-3 py-1.5 bg-[#111111] text-white rounded-lg text-xs font-bold hover:bg-black transition"
                      >
                        + Aggiungi
                      </button>
                    </div>

                    {/* Active Dependencies Chips */}
                    {pyramidDependencies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-white border border-[#E5E5E5] rounded-lg">
                        {pyramidDependencies.map((dep) => (
                          <span
                            key={dep}
                            className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#F0F0F0] text-[#111111] px-2 py-0.5 rounded-md border border-[#D5D5D5]"
                          >
                            <span>🔗 {dep}</span>
                            <button
                              type="button"
                              onClick={() => removePyramidDep(dep)}
                              className="text-red-500 hover:text-red-700 font-bold ml-0.5"
                              title="Rimuovi dipendenza"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Live Preview Card */}
                  <div className="bg-white border border-[#D8D8D8] rounded-lg p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-[#707072] font-mono mb-1">
                      <span>ANTEPRIMA SCHEDA PIRAMIDE</span>
                      <span>ZERO JSON ACTIVE</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          pyramidPriority === "iconic"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : pyramidPriority === "core"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : pyramidPriority === "high_energy"
                            ? "bg-purple-100 text-purple-900 border-purple-300"
                            : "bg-rose-100 text-rose-900 border-rose-300"
                        }`}
                      >
                        {labelIt || "Nome Piramide"}
                      </span>
                      {pyramidDependsOn && (
                        <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border">
                          ↳ Dipende da:{" "}
                          {registries.find(
                            (r) =>
                              r.registry_name === "collection_pyramids" &&
                              r.entry_code === pyramidDependsOn
                          )?.label_it || pyramidDependsOn}
                        </span>
                      )}
                      <span className="text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded-full border text-neutral-700">
                        ⏱️ {pyramidLifecycleYears}y
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          !pyramidDiscountAllowed
                            ? "bg-neutral-900 text-white"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {!pyramidDiscountAllowed ? "🛡️ Protetto" : "🏷️ Saldi OK"}
                      </span>
                      <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                        Mix: {pyramidTargetMixPct}% · Margine: {pyramidTargetMarginPct}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Metadati Aggiuntivi (JSON o note)
                  </label>
                  <textarea
                    rows={2}
                    value={metaExtra}
                    onChange={(e) => setMetaExtra(e.target.value)}
                    placeholder='es. {"district": "Fermo", "rating": "A+"} oppure note di testo'
                    className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-mono focus:outline-none focus:border-[#111111]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E5] font-bold text-xs hover:bg-[#F5F5F5] transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-black transition"
                >
                  Salva in Anagrafica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifica Voce Anagrafica (FTL-CEO-007) */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full">
                  MODIFICA ELEMENTO ANAGRAFICA
                </span>
                <h3 className="text-lg font-black text-[#111111] mt-1">
                  Modifica {editingEntry.label_it}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="text-[#707072] hover:text-[#111111] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#707072] mt-2">
              Aggiorna le etichette, l'ordine o i metadati per la voce della tabella{" "}
              <code className="font-bold text-[#111111]">{editingEntry.registry_name}</code>.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#707072] block mb-1">
                  Codice Chiave (Univoco Immutabile)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingEntry.entry_code}
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] text-xs font-mono font-bold text-[#707072] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Etichetta Italiana (IT) *
                </label>
                <input
                  type="text"
                  required
                  value={editLabelIt}
                  onChange={(e) => setEditLabelIt(e.target.value)}
                  placeholder="es. Vitello Pieno Fiore 1.4mm"
                  className="w-full p-2.5 rounded-lg border border-[#CCCCCC] focus:border-[#111111] text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Etichetta Inglese (EN)
                </label>
                <input
                  type="text"
                  value={editLabelEn}
                  onChange={(e) => setEditLabelEn(e.target.value)}
                  placeholder="es. Full-Grain Calfskin 1.4mm"
                  className="w-full p-2.5 rounded-lg border border-[#CCCCCC] focus:border-[#111111] text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Ordine Visualizzazione
                  </label>
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-[#CCCCCC] focus:border-[#111111] text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Stato Voce
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-semibold text-[#111111]">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#111111] border-[#CCCCCC] focus:ring-black"
                    />
                    <span>Attiva nei form</span>
                  </label>
                </div>
              </div>

              {editingEntry.registry_name === "construction_types" ? (
                <div className="bg-[#F9F9F9] border border-[#CCCCCC] rounded-xl p-3.5 space-y-3">
                  <div className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                    🔨 Associazione Gerarchica a Categoria
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Categoria di Riferimento *
                    </label>
                    <select
                      value={editConstructionCategory}
                      onChange={(e) => setEditConstructionCategory(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-semibold"
                    >
                      <option value="footwear">👟 Calzature (Cassetta, Blake, Goodyear, Sacchetto, ecc.)</option>
                      <option value="leather_goods">👜 Pelletteria (Costa taglio vivo, Rimboccato, ecc.)</option>
                      <option value="apparel">🧥 Abbigliamento (Taglio vivo, Foderato, Sartoriale)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Descrizione Tecnica della Lavorazione
                    </label>
                    <input
                      type="text"
                      value={editConstructionDesc}
                      onChange={(e) => setEditConstructionDesc(e.target.value)}
                      placeholder="es. Cucitura passante tra suola e tomaia..."
                      className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              ) : editingEntry.registry_name === "size_scales" ? (
                <div className="bg-[#F9F9F9] border border-[#CCCCCC] rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                      📐 Modifica Visuale Scala Taglie Certificate
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      Zero JSON
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#707072] uppercase block mb-1">
                      Template Rapidi
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyScalePreset("woman", true)}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👠 Donna EU (35-42)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("man", true)}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👞 Uomo EU (38-46)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("apparel", true)}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        🧥 Abbigliamento IT (44-56)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyScalePreset("leather", true)}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#CCCCCC] text-[11px] font-bold hover:bg-black hover:text-white transition"
                      >
                        👜 Pelletteria (TU)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Categoria Merceologica *
                      </label>
                      <select
                        value={editScaleMainCategory}
                        onChange={(e) => setEditScaleMainCategory(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-semibold"
                      >
                        <option value="footwear">👟 Calzature</option>
                        <option value="leather_goods">👜 Pelletteria</option>
                        <option value="apparel">🧥 Abbigliamento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Genere Target *
                      </label>
                      <select
                        value={editScaleTargetGender}
                        onChange={(e) => setEditScaleTargetGender(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-semibold"
                      >
                        <option value="donna">♀ Donna</option>
                        <option value="uomo">♂ Uomo</option>
                        <option value="unisex">⚥ Unisex</option>
                        <option value="bambino">🧒 Bambino</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Taglia Min
                      </label>
                      <input
                        type="number"
                        value={editScaleMin}
                        onChange={(e) => setEditScaleMin(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Taglia Max
                      </label>
                      <input
                        type="number"
                        value={editScaleMax}
                        onChange={(e) => setEditScaleMax(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Base Campione
                      </label>
                      <input
                        type="number"
                        value={editScaleBase}
                        onChange={(e) => setEditScaleBase(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                      Elenco Taglie Incluse (separate da virgola)
                    </label>
                    <input
                      type="text"
                      value={editScaleCustomSizes}
                      onChange={(e) => setEditScaleCustomSizes(e.target.value)}
                      placeholder="es. 38, 39, 40, 41, 42, 43, 44, 45, 46"
                      className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-[#707072] uppercase block mb-1">
                      Anteprima Taglie Certificate:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {editScaleCustomSizes
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((s) => (
                          <span
                            key={s}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              s === String(editScaleBase)
                                ? "bg-emerald-500 text-white"
                                : "bg-white border border-[#CCCCCC] text-[#111111]"
                            }`}
                          >
                            {s} {s === String(editScaleBase) ? "(Base)" : ""}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              ) : editingEntry.registry_name === "collection_pyramids" ? (
                <div className="bg-[#F9F9F9] border border-[#CCCCCC] rounded-xl p-3.5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">⭐</span>
                      <span className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                        Modifica Piramide di Collezione
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      Zero JSON
                    </span>
                  </div>

                  {/* Presets rapidi */}
                  <div>
                    <label className="text-[10px] font-bold text-[#707072] uppercase block mb-1">
                      Template &amp; Preset Rapidi di Livello
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyPyramidPreset("carryover", true)}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-left transition flex items-center gap-1 ${
                          editPyramidPriority === "iconic"
                            ? "bg-amber-100 border-amber-400 text-amber-900"
                            : "bg-white border-[#CCCCCC] hover:bg-neutral-100"
                        }`}
                      >
                        <span>⭐</span> Continuativo
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPyramidPreset("seasonal_core", true)}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-left transition flex items-center gap-1 ${
                          editPyramidPriority === "core"
                            ? "bg-emerald-100 border-emerald-400 text-emerald-900"
                            : "bg-white border-[#CCCCCC] hover:bg-neutral-100"
                        }`}
                      >
                        <span>🌿</span> Seasonal Core
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPyramidPreset("trend_drop", true)}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-left transition flex items-center gap-1 ${
                          editPyramidPriority === "high_energy"
                            ? "bg-purple-100 border-purple-400 text-purple-900"
                            : "bg-white border-[#CCCCCC] hover:bg-neutral-100"
                        }`}
                      >
                        <span>⚡</span> Trend Drop
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPyramidPreset("capsule", true)}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-left transition flex items-center gap-1 ${
                          editPyramidPriority === "luxury_numbered"
                            ? "bg-rose-100 border-rose-400 text-rose-900"
                            : "bg-white border-[#CCCCCC] hover:bg-neutral-100"
                        }`}
                      >
                        <span>💎</span> Capsule Limited
                      </button>
                    </div>
                  </div>

                  {/* Grid Parametri Chiave */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Ruolo Strategico / Priorità *
                      </label>
                      <select
                        value={editPyramidPriority}
                        onChange={(e) => setEditPyramidPriority(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="iconic">⭐ Iconic Carryover (Always in Stock)</option>
                        <option value="core">🌿 Seasonal Core (Volume Driver)</option>
                        <option value="high_energy">⚡ High Energy / Trend Drop</option>
                        <option value="luxury_numbered">💎 Luxury Numbered / Limited Edition</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Dipendenza Gerarchica (↳ Dipende da)
                      </label>
                      <select
                        value={editPyramidDependsOn}
                        onChange={(e) => setEditPyramidDependsOn(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Nessuna (Livello Indipendente / Base) --</option>
                        {registries
                          .filter(
                            (r) =>
                              r.registry_name === "collection_pyramids" &&
                              r.is_active &&
                              r.entry_code !== editingEntry.entry_code
                          )
                          .map((p) => (
                            <option key={p.entry_code} value={p.entry_code}>
                              ↳ {p.label_it} ({p.entry_code})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Ciclo di Vita (Anni)
                      </label>
                      <select
                        value={String(editPyramidLifecycleYears)}
                        onChange={(e) => setEditPyramidLifecycleYears(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-mono font-bold"
                      >
                        <option value="3">3 anni (Continuativo Pluriennale)</option>
                        <option value="2">2 anni (Biannuale)</option>
                        <option value="1">1 anno (Stagionale SS/FW)</option>
                        <option value="0.5">0.5 anni (6 Mesi / Spot)</option>
                        <option value="0.25">0.25 anni (3 Mesi / Flash Drop)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Politica Prezzo / Sconti
                      </label>
                      <select
                        value={editPyramidDiscountAllowed ? "true" : "false"}
                        onChange={(e) => setEditPyramidDiscountAllowed(e.target.value === "true")}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="false">🛡️ Full-Price (No Saldi / Protetto)</option>
                        <option value="true">🏷️ Saldi Ammessi a Fine Stagione</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Tipo Riordino
                      </label>
                      <select
                        value={editPyramidReplenishment}
                        onChange={(e) => setEditPyramidReplenishment(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="continuous">📦 Continuo (NOS)</option>
                        <option value="seasonal_preorder">📅 Su Campionario (Pre-Order)</option>
                        <option value="on_demand">⚡ Quick Response Terzista</option>
                        <option value="one_shot">🔒 Tiratura Singola (One-Shot)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Quota Mix Target Collezione (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editPyramidTargetMixPct}
                        onChange={(e) => setEditPyramidTargetMixPct(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-mono font-bold"
                        placeholder="es. 40"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#707072] uppercase mb-1">
                        Marginalità Minima Target (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editPyramidTargetMarginPct}
                        onChange={(e) => setEditPyramidTargetMarginPct(Number(e.target.value))}
                        className="w-full bg-white border border-[#CCCCCC] rounded-lg p-2 text-xs font-mono font-bold"
                        placeholder="es. 68"
                      />
                    </div>
                  </div>

                  {/* Dipendenze & Regole Operative (FTL-TECH-016: Facilità inserimento dipendenze) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-[#707072] uppercase">
                        🔗 Dipendenze e Vincoli di Livello (Clicca o Aggiungi)
                      </label>
                      <span className="text-[10px] text-[#707072]">
                        {editPyramidDependencies.length} attive
                      </span>
                    </div>

                    {/* Suggestion Chips */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {SUGGESTED_PYRAMID_DEPENDENCIES.map((sug) => {
                        const isSelected = editPyramidDependencies.includes(sug);
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => toggleEditPyramidDep(sug)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition border ${
                              isSelected
                                ? "bg-[#111111] text-white border-black"
                                : "bg-white text-[#555555] border-[#D0D0D0] hover:border-[#888888]"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}
                            {sug}
                          </button>
                        );
                      })}
                    </div>

                    {/* Input personalizzato per nuova dipendenza */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editNewDepInput}
                        onChange={(e) => setEditNewDepInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addEditCustomPyramidDep();
                          }
                        }}
                        placeholder="Aggiungi vincolo (es. Certificazione REACH, Min. 50 paia)..."
                        className="flex-1 bg-white border border-[#CCCCCC] rounded-lg p-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={addEditCustomPyramidDep}
                        className="px-3 py-1.5 bg-[#111111] text-white rounded-lg text-xs font-bold hover:bg-black transition"
                      >
                        + Aggiungi
                      </button>
                    </div>

                    {/* Active Dependencies Chips */}
                    {editPyramidDependencies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-white border border-[#E5E5E5] rounded-lg">
                        {editPyramidDependencies.map((dep) => (
                          <span
                            key={dep}
                            className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#F0F0F0] text-[#111111] px-2 py-0.5 rounded-md border border-[#D5D5D5]"
                          >
                            <span>🔗 {dep}</span>
                            <button
                              type="button"
                              onClick={() => removeEditPyramidDep(dep)}
                              className="text-red-500 hover:text-red-700 font-bold ml-0.5"
                              title="Rimuovi dipendenza"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Live Preview Card */}
                  <div className="bg-white border border-[#D8D8D8] rounded-lg p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-[#707072] font-mono mb-1">
                      <span>ANTEPRIMA SCHEDA PIRAMIDE</span>
                      <span>ZERO JSON ACTIVE</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          editPyramidPriority === "iconic"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : editPyramidPriority === "core"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : editPyramidPriority === "high_energy"
                            ? "bg-purple-100 text-purple-900 border-purple-300"
                            : "bg-rose-100 text-rose-900 border-rose-300"
                        }`}
                      >
                        {editLabelIt || "Nome Piramide"}
                      </span>
                      {editPyramidDependsOn && (
                        <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border">
                          ↳ Dipende da:{" "}
                          {registries.find(
                            (r) =>
                              r.registry_name === "collection_pyramids" &&
                              r.entry_code === editPyramidDependsOn
                          )?.label_it || editPyramidDependsOn}
                        </span>
                      )}
                      <span className="text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded-full border text-neutral-700">
                        ⏱️ {editPyramidLifecycleYears}y
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          !editPyramidDiscountAllowed
                            ? "bg-neutral-900 text-white"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {!editPyramidDiscountAllowed ? "🛡️ Protetto" : "🏷️ Saldi OK"}
                      </span>
                      <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                        Mix: {editPyramidTargetMixPct}% · Margine: {editPyramidTargetMarginPct}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Metadati e Parametri di Settore (JSON o note)
                  </label>
                  <textarea
                    rows={3}
                    value={editMetaExtra}
                    onChange={(e) => setEditMetaExtra(e.target.value)}
                    placeholder='es. {"district": "Fermo", "rating": "A+"}'
                    className="w-full p-2.5 rounded-lg border border-[#CCCCCC] focus:border-[#111111] text-xs font-mono focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-full border border-[#CCCCCC] font-bold text-xs hover:bg-[#F5F5F5] transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-black transition shadow-sm"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
