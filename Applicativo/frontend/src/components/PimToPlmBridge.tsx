import React, { useState } from "react";
import { evaluateClientDataQuality, INITIAL_SCHEMA_ATTRIBUTES, INITIAL_SEASONS } from "../mockSeedData";
import {
  PimCommercialItem,
  PlmLifecycleStatus,
  PlmProductionVariant,
  ProductCategory,
  SchemaAttributeDefinition,
  Season,
  ViewerSecurityRole,
} from "../types";

export interface PimToPlmBridgeProps {
  pimItems: PimCommercialItem[];
  selectedPim: PimCommercialItem;
  selectedVariant: PlmProductionVariant;
  onSelectPim: (item: PimCommercialItem) => void;
  onSelectVariant: (variant: PlmProductionVariant) => void;
  onAddVariant: (payload: {
    variant_code: string;
    colorway_name: string;
    size_range: string;
    last_or_pattern_code: string;
    lifecycle_status: PlmLifecycleStatus;
    custom_attributes?: Record<string, any>;
  }) => void;
  onCreatePimItem?: (payload: {
    sku_code: string;
    model_name: string;
    season: string;
    season_id?: string;
    collection_id?: string;
    category: ProductCategory;
    commercial_description_it: string;
    commercial_description_en: string;
    wholesale_price_eur: number;
    retail_price_eur: number;
    custom_attributes?: Record<string, any>;
  }) => void;
  onUpdateVariantLifecycle?: (
    variantId: string,
    newStatus: PlmLifecycleStatus
  ) => void;
  viewerRole?: ViewerSecurityRole;
  seasons?: Season[];
  schemaAttributes?: SchemaAttributeDefinition[];
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  footwear: "CALZATURE (FOOTWEAR)",
  leather_goods: "PELLETTERIA (LEATHER GOODS)",
  apparel: "ABBIGLIAMENTO (APPAREL)",
};

const LIFECYCLE_STEPS: PlmLifecycleStatus[] = [
  "prototype",
  "sample",
  "industrialized",
  "in_production",
];

export const PimToPlmBridge: React.FC<PimToPlmBridgeProps> = ({
  pimItems,
  selectedPim,
  selectedVariant,
  onSelectPim,
  onSelectVariant,
  onAddVariant,
  onCreatePimItem,
  onUpdateVariantLifecycle,
  viewerRole = "brand",
  seasons = INITIAL_SEASONS,
  schemaAttributes = INITIAL_SCHEMA_ATTRIBUTES,
}) => {
  const [lang, setLang] = useState<"IT" | "EN">("IT");
  const [showAddVariantForm, setShowAddVariantForm] = useState(false);
  const [showNewPimModal, setShowNewPimModal] = useState(false);
  const [showDataQualityDrawer, setShowDataQualityDrawer] = useState(false);
  const [exportFormatPreview, setExportFormatPreview] = useState<
    "NONE" | "JSON" | "CSV" | "SHOPIFY" | "B2B"
  >("NONE");

  // New PLM Variant state
  const [variantCode, setVariantCode] = useState("");
  const [colorwayName, setColorwayName] = useState("");
  const [sizeRange, setSizeRange] = useState("38-46");
  const [lastOrPattern, setLastOrPattern] = useState("FORMA-FM-108");
  const [lifecycle, setLifecycle] = useState<PlmLifecycleStatus>("sample");
  const [plmCustomAttrs, setPlmCustomAttrs] = useState<Record<string, any>>({});

  // New PIM Item state
  const [newSku, setNewSku] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newSeasonId, setNewSeasonId] = useState<string>(seasons[0]?.season_id || "SEASON-PE26");
  const [newCollectionId, setNewCollectionId] = useState<string>(
    seasons[0]?.collections?.[0]?.collection_id || "COLL-SEASON-PE26-MAIN26"
  );
  const [newCategory, setNewCategory] = useState<ProductCategory>("footwear");
  const [newDescIt, setNewDescIt] = useState("");
  const [newDescEn, setNewDescEn] = useState("");
  const [newWholesale, setNewWholesale] = useState(175);
  const [newRetail, setNewRetail] = useState(480);
  const [pimCustomAttrs, setPimCustomAttrs] = useState<Record<string, any>>({});

  const dqReport = evaluateClientDataQuality(selectedPim);

  const activeSeasonObj = seasons.find((s) => s.season_id === newSeasonId) || seasons[0];
  const activeCollections = activeSeasonObj?.collections || [];

  const pimSchemaFields = schemaAttributes.filter((a) => a.target_entity === "pim_item");
  const plmSchemaFields = schemaAttributes.filter((a) => a.target_entity === "plm_variant");

  const handleSubmitVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantCode.trim() || !colorwayName.trim()) return;
    onAddVariant({
      variant_code: variantCode.trim().toUpperCase(),
      colorway_name: colorwayName.trim(),
      size_range: sizeRange.trim(),
      last_or_pattern_code: lastOrPattern.trim().toUpperCase(),
      lifecycle_status: lifecycle,
      custom_attributes: plmCustomAttrs,
    });
    setVariantCode("");
    setColorwayName("");
    setPlmCustomAttrs({});
    setShowAddVariantForm(false);
  };

  const handleSubmitNewPim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newModelName.trim() || !onCreatePimItem) return;
    const seasonCode = activeSeasonObj ? activeSeasonObj.code : "P/E 2026";
    onCreatePimItem({
      sku_code: newSku.trim().toUpperCase(),
      model_name: newModelName.trim(),
      season: seasonCode,
      season_id: newSeasonId,
      collection_id: newCollectionId,
      category: newCategory,
      commercial_description_it:
        newDescIt.trim() ||
        `${newModelName.trim()} realizzato nei distretti italiani con tracciabilità DPP UE.`,
      commercial_description_en:
        newDescEn.trim() ||
        `${newModelName.trim()} crafted in Italian districts with full EU DPP traceability.`,
      wholesale_price_eur: Number(newWholesale) || 160,
      retail_price_eur: Number(newRetail) || 440,
      custom_attributes: pimCustomAttrs,
    });
    setNewSku("");
    setNewModelName("");
    setNewDescIt("");
    setNewDescEn("");
    setPimCustomAttrs({});
    setShowNewPimModal(false);
  };

  const buildSyndicationPreviewText = () => {
    if (exportFormatPreview === "CSV") {
      const header =
        "sku_code,gtin_ean,model_name,season,category,wholesale_price_eur,retail_price_eur,hs_customs_code,plm_variants_count,data_quality_score";
      const rows = pimItems.map(
        (i) =>
          `${i.sku_code},${i.gtin_ean || "8050012026"},"${i.model_name}",${i.season},${i.category},${i.wholesale_price_eur ?? 165},${i.retail_price_eur ?? 450},${i.hs_customs_code || "6403.59.95"},${i.plm_variants.length},${evaluateClientDataQuality(i).data_quality_score}`
      );
      return [header, ...rows].join("\n");
    }
    if (exportFormatPreview === "SHOPIFY") {
      return JSON.stringify(
        {
          channel: "Shopify Plus B2C Metafields Feed (Zero Duplicazione SKU)",
          l6_cost_segregation: "ENFORCED_NO_INDUSTRIAL_COSTS",
          products: pimItems.map((i) => ({
            handle: i.sku_code.toLowerCase(),
            title: i.model_name,
            product_type: i.category,
            retail_price_eur: i.retail_price_eur ?? 450,
            espr_dpp_url: `https://dpp.footlink.eu/${i.brand_tenant_id}/${i.sku_code}`,
            linked_factory_variants: i.plm_variants.length,
          })),
        },
        null,
        2
      );
    }
    if (exportFormatPreview === "B2B") {
      return JSON.stringify(
        {
          channel: "B2B Showroom Omnichannel Line Sheet",
          l6_cost_segregation: "WHOLESALE_ONLY_NO_FACTORY_COSTS",
          linesheet: pimItems.map((i) => ({
            sku_code: i.sku_code,
            gtin_ean: i.gtin_ean,
            model_name: i.model_name,
            season: i.season,
            wholesale_price_eur: i.wholesale_price_eur ?? 165,
            suggested_retail_eur: i.retail_price_eur ?? 450,
            hs_customs_code: i.hs_customs_code,
            plm_production_lines: i.plm_variants.map((v) => v.variant_code),
          })),
        },
        null,
        2
      );
    }
    return JSON.stringify(
      {
        channel: "Footlink Canonical PIM Syndication JSON (FEAT-05)",
        l6_cost_segregation: "ENFORCED_NO_INDUSTRIAL_COSTS",
        total_master_skus: pimItems.length,
        items: pimItems.map((i) => ({
          sku_code: i.sku_code,
          model_name: i.model_name,
          season: i.season,
          category: i.category,
          description_it: i.commercial_description_it,
          description_en: i.commercial_description_en,
          plm_variants_linked: i.plm_variants.map((v) => v.variant_code),
          data_quality_score: evaluateClientDataQuality(i).data_quality_score,
        })),
      },
      null,
      2
    );
  };

  const verticalSpecs = selectedVariant.category_specific_specs || {
    "Codice Forma / Modello": selectedVariant.last_or_pattern_code,
    "Scala Taglie": selectedVariant.size_range,
    "Versione Snapshot BOM": selectedVariant.bom_version || "v2.0 (Locked)",
  };

  return (
    <section className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#707072]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>MODULO 01 & 02 · ARCHITETTURA CORE 1 ARTICOLO PIM ↔ N VARIANTI PLM</span>
          </div>
          <h2 className="display-title text-3xl sm:text-4xl text-[#111111] mt-1">
            PONTE COMMERCIALE-FABBRICA, DATA QUALITY & SCHEDE VERTICALI
          </h2>
          <p className="text-xs sm:text-sm text-[#707072] mt-1">
            Un unico Master SKU commerciale alimenta B2B, E-Commerce e Passaporto Digitale UE,
            mentre in fabbrica governa <strong>N varianti tecniche PLM</strong> su Calzature,
            Pelletteria e Abbigliamento.
          </p>
        </div>

        {/* Action Pills: Data Quality, Export Catalog, New PIM, New PLM */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowDataQualityDrawer(!showDataQualityDrawer)}
            className="px-4 py-2.5 rounded-full border border-[#111111] bg-white text-[#111111] text-xs font-semibold hover:bg-[#F5F5F5] transition flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Data Quality & Export ({dqReport.data_quality_score}%)</span>
          </button>

          {onCreatePimItem && (
            <button
              type="button"
              onClick={() => setShowNewPimModal(!showNewPimModal)}
              className="px-4 py-2.5 rounded-full border border-[#CCCCCC] bg-white text-[#111111] text-xs font-semibold hover:border-[#111111] transition"
            >
              + Nuovo Articolo PIM (Vendita)
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddVariantForm(!showAddVariantForm)}
            className="px-5 py-2.5 rounded-full bg-[#111111] text-white text-xs font-semibold hover:bg-[#333333] transition"
          >
            {showAddVariantForm
              ? "Chiudi Form PLM"
              : "+ Nuova Variante Tecnica PLM (N)"}
          </button>
        </div>
      </div>

      {/* FEAT-05: PIM Data Quality & Omnichannel Syndication Export Drawer */}
      {showDataQualityDrawer && (
        <div className="bg-[#F5F5F5] border border-[#111111] rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5]">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#707072]">
                MODULO 01 · FEAT-05 PIM DATA QUALITY ENGINE & OMNICHANNEL SYNDICATION
              </div>
              <h3 className="display-title text-2xl sm:text-3xl text-[#111111] mt-1">
                SCORE COMPLETEZZA PIM & ESPR: {dqReport.data_quality_score}/100 —{" "}
                {dqReport.dpp_publication_unlocked
                  ? "GATE PUBBLICAZIONE DPP SBLOCCATO"
                  : "PUBBLICAZIONE DPP BLOCCATA (< 80%)"}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["JSON", "CSV", "SHOPIFY", "B2B"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() =>
                    setExportFormatPreview(exportFormatPreview === fmt ? "NONE" : fmt)
                  }
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                    exportFormatPreview === fmt
                      ? "bg-[#111111] text-white"
                      : "bg-white text-[#111111] border border-[#CCCCCC] hover:border-[#111111]"
                  }`}
                >
                  Esporta {fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {Object.entries(dqReport.checks).map(([criterion, ok]) => (
              <div
                key={criterion}
                className="bg-white border border-[#E5E5E5] rounded-xl p-3 flex items-start gap-2 text-xs"
              >
                <span
                  className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                    ok ? "bg-[#10B981]" : "bg-[#111111]"
                  }`}
                />
                <span className="font-medium text-[#111111] leading-snug">
                  {criterion}
                </span>
              </div>
            ))}
          </div>

          {exportFormatPreview !== "NONE" && (
            <div className="bg-[#111111] text-white rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="mono-code font-semibold">
                  SYNDICATION FEED LIVE ({exportFormatPreview}) — ZERO DUPLICAZIONE SKU · COSTI INDUSTRIALI L6 ESCLUSI
                </span>
                <button
                  type="button"
                  onClick={() => setExportFormatPreview("NONE")}
                  className="text-white underline text-xs"
                >
                  Chiudi anteprima
                </button>
              </div>
              <pre className="mono-code text-xs text-white/90 overflow-x-auto max-h-56 p-3 bg-white/5 rounded-lg">
                {buildSyndicationPreviewText()}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Modal / Form: + Nuovo Articolo PIM (Vendita) */}
      {showNewPimModal && (
        <form
          onSubmit={handleSubmitNewPim}
          className="bg-[#F5F5F5] border border-[#111111] rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="display-title text-2xl text-[#111111]">
              CREA NUOVO ARTICOLO COMMERCIALE PIM (MASTER SKU) + PRIMA VARIANTE PLM
            </h3>
            <button
              type="button"
              onClick={() => setShowNewPimModal(false)}
              className="text-xs font-semibold text-[#707072] hover:text-[#111111]"
            >
              Annulla ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Codice Master SKU *
              </label>
              <input
                type="text"
                required
                placeholder="es. FTL-SS27-SNEAK-04"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Nome Commerciale Modello *
              </label>
              <input
                type="text"
                required
                placeholder="es. Sneaker Sartoriale Navigli"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Stagione *
              </label>
              <select
                value={newSeasonId}
                onChange={(e) => {
                  const sId = e.target.value;
                  setNewSeasonId(sId);
                  const sObj = seasons.find((s) => s.season_id === sId);
                  if (sObj && sObj.collections && sObj.collections.length > 0) {
                    setNewCollectionId(sObj.collections[0].collection_id);
                  } else {
                    setNewCollectionId("");
                  }
                }}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              >
                {seasons.map((s) => (
                  <option key={s.season_id} value={s.season_id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Collezione (Annidata) *
              </label>
              <select
                value={newCollectionId}
                onChange={(e) => setNewCollectionId(e.target.value)}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              >
                {activeCollections.map((c) => (
                  <option key={c.collection_id} value={c.collection_id}>
                    {c.name} ({c.code})
                  </option>
                ))}
                {activeCollections.length === 0 && (
                  <option value="">Nessuna collezione definita</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Settore Merceologico
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              >
                <option value="footwear">Calzature (Footwear)</option>
                <option value="leather_goods">Pelletteria (Leather Goods)</option>
                <option value="apparel">Abbigliamento (Apparel)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Wholesale B2B (€)
              </label>
              <input
                type="number"
                value={newWholesale}
                onChange={(e) => setNewWholesale(Number(e.target.value))}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Retail Suggerito B2C (€)
              </label>
              <input
                type="number"
                value={newRetail}
                onChange={(e) => setNewRetail(Number(e.target.value))}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Descrizione Commerciale IT (opzionale, generata automaticamente se vuota)"
              value={newDescIt}
              onChange={(e) => setNewDescIt(e.target.value)}
              className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
            />
            <input
              type="text"
              placeholder="Commercial Description EN (optional)"
              value={newDescEn}
              onChange={(e) => setNewDescEn(e.target.value)}
              className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
            />
          </div>

          {pimSchemaFields.length > 0 && (
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">
                Attributi Personalizzati Modello Dati (Configurati nel Data Model Studio)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pimSchemaFields.map((field) => (
                  <div key={field.attribute_id}>
                    <label className="block text-[11px] font-semibold text-[#111111] mb-1">
                      {field.label_it} {field.is_required && "*"}
                    </label>
                    {field.field_type === "select" ? (
                      <select
                        value={pimCustomAttrs[field.field_key] ?? field.default_value ?? ""}
                        onChange={(e) =>
                          setPimCustomAttrs({
                            ...pimCustomAttrs,
                            [field.field_key]: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                      >
                        <option value="">Seleziona...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.field_type === "number" ? (
                      <input
                        type="number"
                        value={pimCustomAttrs[field.field_key] ?? field.default_value ?? ""}
                        onChange={(e) =>
                          setPimCustomAttrs({
                            ...pimCustomAttrs,
                            [field.field_key]: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                      />
                    ) : field.field_type === "boolean" ? (
                      <label className="flex items-center gap-2 h-[34px] px-2.5 bg-white border border-[#CCCCCC] rounded-xl cursor-pointer hover:border-[#111111] transition">
                        <input
                          type="checkbox"
                          checked={Boolean(pimCustomAttrs[field.field_key] ?? field.default_value ?? false)}
                          onChange={(e) =>
                            setPimCustomAttrs({
                              ...pimCustomAttrs,
                              [field.field_key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-[#CCCCCC] text-[#111111] focus:ring-0 cursor-pointer accent-[#111111]"
                        />
                        <span className="text-xs font-medium text-[#111111]">
                          {Boolean(pimCustomAttrs[field.field_key] ?? field.default_value ?? false)
                            ? "Sì (Attivo)"
                            : "No (Disattivo)"}
                        </span>
                      </label>
                    ) : field.field_type === "date" ? (
                      <input
                        type="date"
                        value={pimCustomAttrs[field.field_key] ?? field.default_value ?? ""}
                        onChange={(e) =>
                          setPimCustomAttrs({
                            ...pimCustomAttrs,
                            [field.field_key]: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={pimCustomAttrs[field.field_key] ?? field.default_value ?? ""}
                        onChange={(e) =>
                          setPimCustomAttrs({
                            ...pimCustomAttrs,
                            [field.field_key]: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#111111] text-white text-xs font-semibold hover:bg-[#333333] transition"
            >
              Salva Master SKU PIM & Inizializza Variante PLM #1
            </button>
          </div>
        </form>
      )}

      {/* Modal / Form: + Nuova Variante Tecnica PLM (N) */}
      {showAddVariantForm && (
        <form
          onSubmit={handleSubmitVariant}
          className="bg-[#F5F5F5] border border-[#111111] rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="display-title text-2xl text-[#111111]">
              AGGIUNGI N-ESIMA VARIANTE DI PRODUZIONE PLM A{" "}
              <span className="underline">{selectedPim.sku_code}</span> (ZERO DUPLICAZIONE PIM)
            </h3>
            <button
              type="button"
              onClick={() => setShowAddVariantForm(false)}
              className="text-xs font-semibold text-[#707072] hover:text-[#111111]"
            >
              Annulla ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Codice Tecnico Variante PLM *
              </label>
              <input
                type="text"
                required
                placeholder="es. FTL-LOAFER-01-BLU"
                value={variantCode}
                onChange={(e) => setVariantCode(e.target.value)}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Variante Colore / Pellame *
              </label>
              <input
                type="text"
                required
                placeholder="es. Vitello Blu Notte LWG"
                value={colorwayName}
                onChange={(e) => setColorwayName(e.target.value)}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Scala Taglie
              </label>
              <input
                type="text"
                value={sizeRange}
                onChange={(e) => setSizeRange(e.target.value)}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Codice Forma / Cartamodello
              </label>
              <input
                type="text"
                value={lastOrPattern}
                onChange={(e) => setLastOrPattern(e.target.value)}
                className="w-full bg-white border border-[#CCCCCC] rounded-xl px-3 py-2 text-xs text-[#111111]"
              />
            </div>
            <div className="flex flex-col justify-between">
              <label className="block text-[11px] font-bold uppercase text-[#707072] mb-1">
                Stato Ciclo di Vita PLM
              </label>
              <div className="flex gap-2">
                <select
                  value={lifecycle}
                  onChange={(e) => setLifecycle(e.target.value as PlmLifecycleStatus)}
                  className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-2 text-xs text-[#111111]"
                >
                  <option value="prototype">prototype</option>
                  <option value="sample">sample</option>
                  <option value="industrialized">industrialized</option>
                  <option value="in_production">in_production</option>
                </select>
              </div>
            </div>
          </div>

          {plmSchemaFields.length > 0 && (
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">
                Campi Tecnici Dinamici Variante PLM (Studio Modello Dati)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plmSchemaFields.map((field) => (
                  <div key={field.attribute_id}>
                    <label className="block text-[11px] font-semibold text-[#111111] mb-1">
                      {field.label_it} {field.is_required && "*"}
                    </label>
                    {field.field_type === "select" ? (
                      <select
                        value={plmCustomAttrs[field.field_key] ?? field.default_value ?? ""}
                        onChange={(e) =>
                          setPlmCustomAttrs({
                            ...plmCustomAttrs,
                            [field.field_key]: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                      >
                        <option value="">Seleziona...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.field_type === "number" ? (
                      <input
                        type="number"
                        value={plmCustomAttrs[field.field_key] ?? field.default_value ?? ""}
                        onChange={(e) =>
                          setPlmCustomAttrs({
                            ...plmCustomAttrs,
                            [field.field_key]: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                      />
                    ) : field.field_type === "boolean" ? (
                      <label className="flex items-center gap-2 h-[34px] px-2.5 bg-white border border-[#CCCCCC] rounded-xl cursor-pointer hover:border-[#111111] transition">
                        <input
                          type="checkbox"
                          checked={Boolean(plmCustomAttrs[field.field_key] ?? field.default_value ?? false)}
                          onChange={(e) =>
                            setPlmCustomAttrs({
                              ...plmCustomAttrs,
                              [field.field_key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-[#CCCCCC] text-[#111111] focus:ring-0 cursor-pointer accent-[#111111]"
                        />
                        <span className="text-xs font-medium text-[#111111]">
                          {Boolean(plmCustomAttrs[field.field_key] ?? field.default_value ?? false)
                            ? "Sì (Attivo)"
                            : "No (Disattivo)"}
                        </span>
                      </label>
                    ) : field.field_type === "date" ? (
                      <input
                        type="date"
                        value={plmCustomAttrs[field.field_key] ?? field.default_value ?? ""}
                        onChange={(e) =>
                          setPlmCustomAttrs({
                            ...plmCustomAttrs,
                            [field.field_key]: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={plmCustomAttrs[field.field_key] ?? field.default_value ?? ""}
                        onChange={(e) =>
                          setPlmCustomAttrs({
                            ...plmCustomAttrs,
                            [field.field_key]: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-[#CCCCCC] rounded-xl px-2.5 py-1.5 text-xs text-[#111111]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#111111] text-white font-semibold text-xs hover:bg-[#333333]"
            >
              Crea Variante PLM
            </button>
          </div>
        </form>
      )}

      {/* Sector & Master SKU Selector Tabs */}
      <div className="flex flex-wrap gap-3">
        {pimItems.map((item) => {
          const isSelected = item.pim_item_id === selectedPim.pim_item_id;
          const itmSeason = seasons.find((s) => s.season_id === item.season_id || s.code === item.season);
          const itmCollection = itmSeason?.collections?.find((c) => c.collection_id === item.collection_id);
          return (
            <button
              key={item.pim_item_id}
              type="button"
              onClick={() => onSelectPim(item)}
              className={`px-5 py-3.5 rounded-2xl border text-left transition flex items-center gap-3.5 ${
                isSelected
                  ? "bg-[#111111] border-[#111111] text-white"
                  : "bg-[#F5F5F5] border-[#E5E5E5] text-[#111111] hover:border-[#111111]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white text-[#111111]"
                        : "bg-white text-[#707072] border border-[#E5E5E5]"
                    }`}
                  >
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className="mono-code text-xs font-bold">{item.sku_code}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-[#E5E5E5] text-[#111111]"
                    }`}
                  >
                    {itmSeason?.code || item.season || "P/E 2026"}
                  </span>
                </div>
                <div className="display-title text-xl mt-1">{item.model_name}</div>
                <div
                  className={`text-[11px] mt-0.5 flex items-center gap-2 ${
                    isSelected ? "text-white/75" : "text-[#707072]"
                  }`}
                >
                  <span>1 Articolo PIM ↔ <strong>{item.plm_variants.length} Varianti PLM</strong></span>
                  {itmCollection && (
                    <span>· {itmCollection.name}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Visual Split Bridge: Left (1 PIM Commercial Item) <-> Center Connector <-> Right (N PLM Production Variants) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN (5 cols): 1 PIM COMMERCIAL ITEM */}
        <div className="lg:col-span-5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-[#111111] text-white px-3 py-1 rounded-full">
                LATO VENDITA · 1 ARTICOLO PIM
              </span>
              <div className="flex items-center gap-1 bg-white border border-[#E5E5E5] rounded-full p-0.5">
                <button
                  type="button"
                  onClick={() => setLang("IT")}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    lang === "IT" ? "bg-[#111111] text-white" : "text-[#707072]"
                  }`}
                >
                  IT
                </button>
                <button
                  type="button"
                  onClick={() => setLang("EN")}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    lang === "EN" ? "bg-[#111111] text-white" : "text-[#707072]"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <h3 className="display-title text-3xl text-[#111111]">
              {selectedPim.model_name}
            </h3>

            {/* Season & Collection Badges */}
            {(() => {
              const curSeason = seasons.find((s) => s.season_id === selectedPim.season_id || s.code === selectedPim.season);
              const curCollection = curSeason?.collections?.find((c) => c.collection_id === selectedPim.collection_id);
              return (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-bold uppercase bg-[#111111] text-white px-3 py-1 rounded-full">
                    {curSeason ? `${curSeason.code} · ${curSeason.name}` : selectedPim.season}
                  </span>
                  {curCollection && (
                    <span className="text-xs font-semibold bg-white border border-[#CCCCCC] text-[#111111] px-3 py-1 rounded-full">
                      Collezione: {curCollection.name} ({curCollection.code})
                    </span>
                  )}
                </div>
              );
            })()}

            <p className="mono-code text-xs text-[#707072] mt-2">
              SKU: <strong className="text-[#111111]">{selectedPim.sku_code}</strong> · GTIN:{" "}
              <strong className="text-[#111111]">
                {selectedPim.gtin_ean || "8050012026101"}
              </strong>{" "}
              · HS:{" "}
              <strong className="text-[#111111]">
                {selectedPim.hs_customs_code || "6403.59.95"}
              </strong>
            </p>

            <p className="text-xs text-[#111111] mt-3 leading-relaxed bg-white p-3.5 rounded-xl border border-[#E5E5E5]">
              {lang === "IT"
                ? selectedPim.commercial_description_it
                : selectedPim.commercial_description_en}
            </p>

            {/* Dynamic Custom Attributes for PIM (Founder Schema Extensions) */}
            {selectedPim.custom_attributes && Object.keys(selectedPim.custom_attributes).length > 0 && (
              <div className="mt-3 bg-white border border-[#E5E5E5] rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#707072] flex items-center justify-between">
                  <span>Attributi Personalizzati PIM (Estensioni Founder)</span>
                  <span className="mono-code text-[10px] text-[#10B981] font-bold">SCHEMA STUDIO LIVE</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedPim.custom_attributes).map(([k, v]) => {
                    const def = schemaAttributes.find((a) => a.field_key === k);
                    const label = def ? def.label_it : k;
                    return (
                      <div key={k} className="bg-[#F5F5F5] rounded-lg p-2 text-xs">
                        <div className="text-[10px] font-bold text-[#707072] uppercase">{label}</div>
                        <div className="font-semibold text-[#111111] mt-0.5">
                          {typeof v === "boolean"
                            ? v
                              ? "Sì (Attivo)"
                              : "No (Disattivo)"
                            : String(v)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* L6 Commercial Pricing Box (Visible only to Brand/PMI Owner) */}
            <div className="mt-3 bg-white border border-[#E5E5E5] rounded-xl p-3.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#707072] mb-1">
                <span>Listini Commerciali Omnicanale</span>
                <span className="mono-code text-[10px] text-[#111111]">
                  {viewerRole === "brand" ? "L6 BRAND VIEW" : "L6 PROTETTO"}
                </span>
              </div>
              {viewerRole === "brand" ? (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <div className="text-[11px] text-[#707072]">Wholesale B2B</div>
                    <div className="display-title text-2xl text-[#111111]">
                      € {(selectedPim.wholesale_price_eur ?? 165).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#707072]">Retail Suggerito B2C</div>
                    <div className="display-title text-2xl text-[#111111]">
                      € {(selectedPim.retail_price_eur ?? 450).toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-semibold text-[#707072] py-1">
                  🔒 Prezzi Wholesale/Retail oscurati nella vista Laboratorio Terzista (Compliance ADR-006 L6).
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#E5E5E5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#707072] uppercase text-[11px]">
                Completezza Dati PIM & ESPR
              </span>
              <span className="mono-code font-bold text-[#111111]">
                {dqReport.data_quality_score}% (DPP Ready)
              </span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#E5E5E5]">
              <div
                className="h-full bg-[#111111]"
                style={{ width: `${dqReport.data_quality_score}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {selectedPim.retail_channels.map((ch) => (
                <span
                  key={ch}
                  className="text-[11px] bg-white border border-[#E5E5E5] text-[#111111] px-3 py-1 rounded-full font-medium"
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER CONNECTOR (1 col): 1 <-> N */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center py-2">
          <div className="w-12 h-12 rounded-full bg-[#111111] text-white flex items-center justify-center font-black text-xs tracking-tighter">
            1 : N
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#707072] mt-2 text-center">
            Ponte Live
          </div>
        </div>

        {/* RIGHT COLUMN (6 cols): N PLM PRODUCTION VARIANTS */}
        <div className="lg:col-span-6 bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white border border-[#111111] text-[#111111] px-3 py-1 rounded-full">
                LATO FABBRICA · {selectedPim.plm_variants.length} VARIANTI TECNICHE PLM
              </span>
              <span className="mono-code text-xs text-[#707072]">
                Seleziona variante per BOM & Terzisti
              </span>
            </div>

            <div className="space-y-3">
              {selectedPim.plm_variants.map((variant) => {
                const isVarSelected =
                  variant.plm_variant_id === selectedVariant.plm_variant_id;
                const doneSteps = variant.subcontractor_assignments.filter(
                  (a) => a.completed
                ).length;
                const totalSteps = variant.subcontractor_assignments.length;

                return (
                  <div
                    key={variant.plm_variant_id}
                    onClick={() => onSelectVariant(variant)}
                    className={`cursor-pointer p-4 rounded-2xl border transition ${
                      isVarSelected
                        ? "bg-white border-2 border-[#111111]"
                        : "bg-white/70 border-[#E5E5E5] hover:border-[#111111]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="mono-code text-xs font-bold text-[#111111]">
                          {variant.variant_code}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#111111] text-white">
                          {variant.lifecycle_status}
                        </span>
                        <span className="mono-code text-[11px] px-2.5 py-0.5 rounded-full border border-[#E5E5E5] bg-[#F5F5F5] text-[#111111]">
                          BOM {variant.bom_version || "v2.0"}
                        </span>
                      </div>
                      <span className="text-xs text-[#707072] font-medium">
                        Taglie: <strong className="text-[#111111]">{variant.size_range}</strong>
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-[#111111]">
                          {variant.colorway_name}
                        </div>
                        <div className="text-xs text-[#707072]">
                          Forma / Modello:{" "}
                          <span className="mono-code text-[#111111] font-semibold">
                            {variant.last_or_pattern_code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-[#F5F5F5] border border-[#E5E5E5] px-3 py-1 rounded-full font-semibold text-[#111111]">
                          BOM: {variant.bom_items.length} nodi
                        </span>
                        <span className="bg-[#F5F5F5] border border-[#E5E5E5] px-3 py-1 rounded-full font-semibold text-[#111111] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                          Terzisti 0 €: {doneSteps}/{totalSteps}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modulo 04: PLM Lifecycle Workflow & BOM Snapshot Freeze */}
          <div className="pt-4 border-t border-[#E5E5E5] bg-white rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">
                MODULO 04 · WORKFLOW CICLO DI VITA PLM & SNAPSHOT BOM ({selectedVariant.variant_code})
              </div>
              <span className="mono-code text-[11px] font-bold text-[#111111] flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedVariant.bom_snapshot_locked ? "bg-[#10B981]" : "bg-[#111111]"
                  }`}
                />
                {selectedVariant.bom_snapshot_locked
                  ? `Snapshot Congelato (${selectedVariant.bom_version || "v2.0 Locked"})`
                  : `In Bozza (${selectedVariant.bom_version || "v1.1 Draft"})`}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isActive = selectedVariant.lifecycle_status === step;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() =>
                      onUpdateVariantLifecycle &&
                      onUpdateVariantLifecycle(selectedVariant.plm_variant_id, step)
                    }
                    className={`px-3 py-2 rounded-full text-xs font-semibold uppercase transition ${
                      isActive
                        ? "bg-[#111111] text-white"
                        : "bg-[#F5F5F5] text-[#707072] border border-[#E5E5E5] hover:border-[#111111] hover:text-[#111111]"
                    }`}
                  >
                    {idx + 1}. {step.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Category Technical Datasheet (Footwear / Leather Goods / Apparel) */}
      <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">
              SCHEDA TECNICA VERTICALE DI SETTORE · {CATEGORY_LABELS[selectedPim.category]}
            </div>
            <h3 className="display-title text-2xl text-[#111111] mt-0.5">
              SPECIFICHE COSTRUTTIVE & PARAMETRI DI FABBRICA ({selectedVariant.variant_code})
            </h3>
          </div>
          <span className="mono-code text-xs bg-white border border-[#E5E5E5] px-3.5 py-1.5 rounded-full font-semibold text-[#111111]">
            Taglia Base Campione: {selectedVariant.sample_base_size || "42"} · Grading:{" "}
            {selectedVariant.size_grading_step_pct ?? 2.8}% / taglia
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(verticalSpecs).map(([label, val]) => (
            <div
              key={label}
              className="bg-white border border-[#E5E5E5] rounded-xl p-3.5"
            >
              <div className="text-[11px] font-bold uppercase text-[#707072]">
                {label}
              </div>
              <div className="text-xs font-bold text-[#111111] mt-1">{val}</div>
            </div>
          ))}
          {selectedVariant.custom_attributes &&
            Object.entries(selectedVariant.custom_attributes).map(([k, v]) => {
              const def = schemaAttributes.find((a) => a.field_key === k);
              const label = def ? def.label_it : k;
              return (
                <div
                  key={k}
                  className="bg-white border border-[#10B981]/40 rounded-xl p-3.5"
                >
                  <div className="text-[11px] font-bold uppercase text-[#10B981] flex items-center justify-between">
                    <span>{label}</span>
                    <span className="text-[9px] bg-[#10B981]/10 px-1.5 py-0.5 rounded">CUSTOM</span>
                  </div>
                  <div className="text-xs font-bold text-[#111111] mt-1">
                    {typeof v === "boolean"
                      ? v
                        ? "Sì (Attivo)"
                        : "No (Disattivo)"
                      : String(v)}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
};
