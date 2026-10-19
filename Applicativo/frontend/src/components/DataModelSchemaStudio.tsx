import React, { useState } from "react";
import {
  AttributeFieldType,
  AttributeTargetEntity,
  SchemaAttributeDefinition,
} from "../types";

interface DataModelSchemaStudioProps {
  attributes: SchemaAttributeDefinition[];
  onCreateAttribute: (attr: {
    target_entity: AttributeTargetEntity;
    field_key: string;
    label_it: string;
    label_en: string;
    field_type: AttributeFieldType;
    options: string[];
    is_required: boolean;
    default_value?: any;
    group_name: string;
    is_system: boolean;
    description?: string;
  }) => void;
  onDeleteAttribute: (targetEntity: string, fieldKey: string) => void;
}

const ENTITY_CONFIGS: {
  entity: AttributeTargetEntity;
  label: string;
  badge: string;
  icon: string;
  desc: string;
}[] = [
  {
    entity: "pim_item",
    label: "Articolo Commerciale PIM",
    badge: "1 LATO COMMERCIALE",
    icon: "📦",
    desc: "Campi di vendita, catalogo, sostenibilità ESPR, pricing retail e canali distributivi",
  },
  {
    entity: "plm_variant",
    label: "Variante Industriale PLM",
    badge: "N LATO PRODUZIONE",
    icon: "🏭",
    desc: "Specifiche tecniche di fabbrica, quote tacco, finiture pellame, calzate e cartamodelli",
  },
  {
    entity: "bom_item",
    label: "Componente Distinta Base (BOM)",
    badge: "LIVELLI 1 → 2 → 3",
    icon: "🧩",
    desc: "Gradi di selezione fornitura, certificati di lotto, consumi e parametri materie prime",
  },
];

export const DataModelSchemaStudio: React.FC<DataModelSchemaStudioProps> = ({
  attributes,
  onCreateAttribute,
  onDeleteAttribute,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<AttributeTargetEntity>("plm_variant");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [fieldKey, setFieldKey] = useState("");
  const [labelIt, setLabelIt] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [fieldType, setFieldType] = useState<AttributeFieldType>("select");
  const [rawOptions, setRawOptions] = useState("");
  const [groupName, setGroupName] = useState("Specifiche Tecniche Fabbrica");
  const [isRequired, setIsRequired] = useState(false);
  const [defaultVal, setDefaultVal] = useState("");
  const [description, setDescription] = useState("");

  const activeEntityConfig =
    ENTITY_CONFIGS.find((e) => e.entity === selectedEntity) || ENTITY_CONFIGS[1];

  const entityAttrs = attributes.filter(
    (a) => a.target_entity === selectedEntity || (a.target_entity as string) === selectedEntity
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldKey.trim() || !labelIt.trim()) return;

    const parsedOptions =
      fieldType === "select"
        ? rawOptions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    onCreateAttribute({
      target_entity: selectedEntity,
      field_key: fieldKey.trim().toLowerCase().replace(/[\s-]/g, "_"),
      label_it: labelIt.trim(),
      label_en: labelEn.trim() || labelIt.trim(),
      field_type: fieldType,
      options: parsedOptions,
      is_required: isRequired,
      default_value: defaultVal.trim() || undefined,
      group_name: groupName.trim() || "General",
      is_system: false,
      description: description.trim(),
    });

    setFieldKey("");
    setLabelIt("");
    setLabelEn("");
    setRawOptions("");
    setDefaultVal("");
    setDescription("");
    setShowAddModal(false);
  };

  // Group attributes by group_name
  const groupedAttrs = entityAttrs.reduce<Record<string, SchemaAttributeDefinition[]>>(
    (acc, attr) => {
      const g = attr.group_name || "General";
      if (!acc[g]) acc[g] = [];
      acc[g].push(attr);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="bg-[#111111] text-white p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9E9E9E]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            MODULO 04 · FOUNDER DATA MODEL STUDIO
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Modello Dati Flessibile &amp; Campi Custom
          </h2>
          <p className="text-sm text-[#CCCCCC] mt-1 max-w-2xl">
            Integra e correggi lo schema del modello dati in piena autonomia.
            I campi definiti qui vengono istantaneamente renderizzati nelle form di inserimento
            e nelle schede prodotto senza alterazioni del database.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-full bg-white text-[#111111] text-xs font-extrabold uppercase tracking-wider hover:bg-[#F5F5F5] transition whitespace-nowrap shadow-sm"
        >
          + Aggiungi Campo a {activeEntityConfig.label.split(" ")[0]}
        </button>
      </div>

      {/* Entity Selector Tabs (PIM, PLM, BOM) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ENTITY_CONFIGS.map((ec) => {
          const isSelected = ec.entity === selectedEntity;
          const count = attributes.filter(
            (a) => a.target_entity === ec.entity || (a.target_entity as string) === ec.entity
          ).length;

          return (
            <div
              key={ec.entity}
              onClick={() => setSelectedEntity(ec.entity)}
              className={`p-5 rounded-2xl border cursor-pointer transition ${
                isSelected
                  ? "border-[#111111] bg-white ring-1 ring-[#111111] shadow-sm"
                  : "border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white hover:border-[#CCCCCC]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{ec.icon}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[#707072] uppercase tracking-wider">
                  {ec.badge}
                </span>
              </div>
              <h3 className="font-black text-base text-[#111111] mt-3">{ec.label}</h3>
              <p className="text-xs text-[#707072] mt-1 line-clamp-2">{ec.desc}</p>
              <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-xs">
                <span className="text-[#707072]">Attributi definiti:</span>
                <span className="font-extrabold text-[#111111]">{count} Campi</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attributes Inspector by Group */}
      <div className="bg-white border border-[#E5E5E5] p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E5] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#111111]">
              Schema di {activeEntityConfig.label} ({entityAttrs.length} Campi)
            </h3>
            <p className="text-xs text-[#707072] mt-0.5">
              Visualizza e governa i campi visualizzati nelle maschere di inserimento dell'entità <code>{selectedEntity}</code>.
            </p>
          </div>
          <span className="text-xs font-mono bg-[#F5F5F5] border border-[#E5E5E5] px-2.5 py-1 rounded text-[#111111]">
            target: {selectedEntity}
          </span>
        </div>

        {Object.keys(groupedAttrs).length === 0 ? (
          <div className="text-center py-12 text-xs text-[#707072] bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E5E5]">
            Nessun attributo definito per questa entità.
            Clicca su <strong>+ Aggiungi Campo</strong> per estendere il modello dati.
          </div>
        ) : (
          Object.entries(groupedAttrs).map(([group, attrs]) => (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[#111111] rounded-full" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                  {group} ({attrs.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attrs.map((attr) => (
                  <div
                    key={attr.field_key}
                    className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white hover:border-[#CCCCCC] transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-extrabold text-sm text-[#111111]">
                            {attr.label_it}
                          </div>
                          <div className="text-[11px] font-mono text-[#707072]">
                            {attr.field_key}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            attr.field_type === "select"
                              ? "bg-[#3B82F6]/10 text-[#2563EB] border border-[#3B82F6]/20"
                              : attr.field_type === "number"
                              ? "bg-[#10B981]/10 text-[#059669] border border-[#10B981]/20"
                              : "bg-[#707072]/10 text-[#707072] border border-[#707072]/20"
                          }`}
                        >
                          {attr.field_type}
                        </span>
                      </div>

                      {attr.description && (
                        <p className="text-[11px] text-[#707072] mt-2 line-clamp-2">
                          {attr.description}
                        </p>
                      )}

                      {/* Select options badges */}
                      {attr.field_type === "select" && attr.options.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-[#E5E5E5]">
                          <div className="text-[10px] font-bold text-[#707072] uppercase mb-1">
                            Opzioni ({attr.options.length}):
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                            {attr.options.map((opt) => (
                              <span
                                key={opt}
                                className="text-[10px] bg-white border border-[#E5E5E5] px-1.5 py-0.5 rounded text-[#111111] font-medium"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-[11px]">
                      <span className="text-[#707072]">
                        {attr.is_system ? (
                          <span className="text-[#059669] font-bold flex items-center gap-1">
                            🔒 Core di Sistema
                          </span>
                        ) : (
                          <span className="text-[#3B82F6] font-bold">
                            ✨ Custom Founder
                          </span>
                        )}
                      </span>

                      {!attr.is_system && (
                        <button
                          type="button"
                          onClick={() => onDeleteAttribute(attr.target_entity, attr.field_key)}
                          className="text-[#DC2626] hover:text-[#991B1B] font-bold transition hover:underline"
                        >
                          Elimina
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Aggiungi Campo / Attributo Custom */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-[#111111]">
              Aggiungi Campo a {activeEntityConfig.label}
            </h3>
            <p className="text-xs text-[#707072] mt-0.5">
              Il campo sarà immediatamente disponibile nelle maschere di inserimento dell'applicativo.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Chiave Tecnica Univoca (snake_case, es. altezza_tacco_mm, rating_circolare) *
                </label>
                <input
                  type="text"
                  required
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value)}
                  placeholder="es. altezza_tacco_mm"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-mono font-bold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Etichetta Italiana (Visualizzata nella Form) *
                </label>
                <input
                  type="text"
                  required
                  value={labelIt}
                  onChange={(e) => setLabelIt(e.target.value)}
                  placeholder="es. Altezza Tacco (mm)"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Etichetta Inglese</label>
                <input
                  type="text"
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                  placeholder="es. Heel Height (mm)"
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Tipo di Dato</label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as AttributeFieldType)}
                    className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                  >
                    <option value="text">Testo (Text)</option>
                    <option value="number">Numero (Number)</option>
                    <option value="select">Scelta Multipla (Select)</option>
                    <option value="boolean">Booleano (Sì/No)</option>
                    <option value="date">Data (Date)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Gruppo Visuale</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="es. Specifiche Tecniche"
                    className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {fieldType === "select" && (
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Opzioni Selezionabili (Separate da virgola) *
                  </label>
                  <input
                    type="text"
                    required
                    value={rawOptions}
                    onChange={(e) => setRawOptions(e.target.value)}
                    placeholder="es. Basso (20mm), Medio (50mm), Alto (80mm)"
                    className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-medium focus:outline-none focus:border-[#111111]"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequiredCheckbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded border-[#E5E5E5]"
                />
                <label htmlFor="isRequiredCheckbox" className="font-bold text-[#111111]">
                  Campo Obbligatorio in fase di inserimento
                </label>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Descrizione / Note</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Spiega all'operatore di filiera a cosa serve questo attributo..."
                  className="w-full p-2.5 rounded-lg border border-[#E5E5E5] text-xs font-medium focus:outline-none focus:border-[#111111]"
                />
              </div>

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
                  Aggiungi Campo allo Schema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
