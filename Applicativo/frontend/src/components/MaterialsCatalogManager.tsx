import React, { useMemo, useState } from "react";
import { MaterialCategory, MaterialRecord, VendorRecord, ViewerSecurityRole } from "../types";

interface MaterialsCatalogManagerProps {
  materials: MaterialRecord[];
  vendors: VendorRecord[];
  viewerRole: ViewerSecurityRole;
  onCreateMaterial?: (mat: Partial<MaterialRecord>) => Promise<void> | void;
  onUpdateMaterial?: (materialId: string, patch: Partial<MaterialRecord>) => Promise<void> | void;
  onDeleteMaterial?: (materialId: string) => Promise<void> | void;
  onNavigateToVendor?: (vendorId: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  all: { label: "Tutti i Materiali", icon: "📦" },
  leather: { label: "Pellami Pregiati", icon: "🐂" },
  lining: { label: "Fodere Traspiranti", icon: "🧤" },
  fabric: { label: "Tessuti & Canvas", icon: "🧵" },
  sole_bottom: { label: "Fondi & Suole", icon: "👟" },
  heel: { label: "Tacchi & Sottotacchi", icon: "👠" },
  hardware: { label: "Minuterie Metalliche", icon: "🔩" },
  thread: { label: "Filati Alta Tenacità", icon: "🧶" },
  packaging: { label: "Packaging & Scatole", icon: "🎁" },
  other: { label: "Altri Componenti", icon: "⚙️" },
};

export const MaterialsCatalogManager: React.FC<MaterialsCatalogManagerProps> = ({
  materials,
  vendors,
  viewerRole,
  onCreateMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onNavigateToVendor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialRecord | null>(null);

  // Form states for creation
  const [newCode, setNewCode] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [newCategory, setNewCategory] = useState<MaterialCategory>("leather");
  const [newVendorId, setNewVendorId] = useState<string>("");
  const [newUom, setNewUom] = useState<string>("dm2");
  const [newStandardCost, setNewStandardCost] = useState<number>(1.0);
  const [newColorShade, setNewColorShade] = useState<string>("");
  const [newCertifications, setNewCertifications] = useState<string>("LWG Gold, EUDR");

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (showActiveOnly && !m.is_active) return false;
      if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
      if (selectedVendorFilter !== "all" && m.vendor_id !== selectedVendorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchCode = m.material_code.toLowerCase().includes(q);
        const matchColor = m.color_shade?.toLowerCase().includes(q) || false;
        if (!matchName && !matchCode && !matchColor) return false;
      }
      return true;
    });
  }, [materials, selectedCategory, selectedVendorFilter, searchQuery, showActiveOnly]);

  const handleOpenCreate = () => {
    const nextNum = String(materials.length + 1).padStart(3, "0");
    setNewCode(`ART-MAT-${nextNum}`);
    setNewName("");
    setNewCategory("leather");
    setNewVendorId(vendors[0]?.vendor_id || "");
    setNewUom("dm2");
    setNewStandardCost(1.2);
    setNewColorShade("Nero / Naturale");
    setNewCertifications("LWG Gold, REACH");
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    const certList = newCertifications
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const vendorObj = vendors.find((v) => v.vendor_id === newVendorId);

    const payload: Partial<MaterialRecord> = {
      material_id: `MAT-${newCategory.substring(0, 3).toUpperCase()}-${String(Date.now()).slice(-4)}`,
      material_code: newCode.trim(),
      name: newName.trim(),
      category: newCategory,
      vendor_id: newVendorId || null,
      vendor_name: vendorObj ? vendorObj.company_name : "",
      unit_of_measure: newUom,
      standard_cost: Number(newStandardCost) || 0.0,
      color_shade: newColorShade.trim() || null,
      certifications: certList,
      is_active: true,
      technical_specs: { created_via: "MaterialsCatalogManager_Sprint9" },
    };

    if (onCreateMaterial) {
      await onCreateMaterial(payload);
    }
    setShowCreateModal(false);
  };

  const handleToggleActive = async (m: MaterialRecord) => {
    if (onUpdateMaterial) {
      await onUpdateMaterial(m.material_id, { is_active: !m.is_active });
    }
  };

  const isL6Segregated = viewerRole !== "brand";

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <h2 className="text-lg font-black tracking-tight text-[#111111] uppercase font-['Barlow_Condensed']">
              Catalogo Materiali di Filiera (Sprint 9 — FTL-CEO-029)
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#111111] text-white px-2.5 py-0.5 rounded-full">
              {materials.length} Certificati
            </span>
          </div>
          <p className="text-xs text-[#707072] mt-1 max-w-2xl">
            Anagrafica centralizzata di materie prime, semilavorati e accessori collegati ai fornitori dell'Albo.
            Tutti i componenti qui codificati sono selezionabili direttamente nel <strong>BOM Material Picker</strong> del Modulo 02.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              showActiveOnly
                ? "bg-[#F5F5F5] border-[#111111] text-[#111111]"
                : "bg-white border-[#E5E5E5] text-[#707072]"
            }`}
          >
            {showActiveOnly ? "✓ Solo Attivi" : "Mostra Tutti"}
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#111111] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-black transition flex items-center gap-1.5 shadow-sm"
          >
            <span>➕</span> Nuovo Materiale
          </button>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => {
          const isSelected = selectedCategory === catKey;
          const count =
            catKey === "all"
              ? materials.length
              : materials.filter((m) => m.category === catKey).length;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                isSelected
                  ? "bg-[#111111] text-white shadow-sm"
                  : "bg-white border border-[#E5E5E5] text-[#707072] hover:text-[#111111] hover:border-[#111111]"
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-[#F5F5F5] text-[#707072]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filter Row */}
      <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per nome, codice articolo, colore..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
          />
          <span className="absolute left-3 top-2.5 text-xs text-[#707072]">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-[#707072] hover:text-[#111111]"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-[#707072] uppercase tracking-wider">Fornitore:</label>
          <select
            value={selectedVendorFilter}
            onChange={(e) => setSelectedVendorFilter(e.target.value)}
            className="bg-white border border-[#E5E5E5] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
          >
            <option value="all">Tutti i Fornitori ({vendors.length})</option>
            {vendors.map((v) => (
              <option key={v.vendor_id} value={v.vendor_id}>
                {v.company_name} ({v.district_area.split("-")[0].trim()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Grid / Table */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-12 text-center space-y-3">
          <span className="text-3xl">📦</span>
          <h3 className="text-sm font-bold text-[#111111]">Nessun materiale trovato</h3>
          <p className="text-xs text-[#707072] max-w-md mx-auto">
            Non ci sono materiali corrispondenti ai filtri attivi. Prova a modificare la ricerca o registra un nuovo materiale nel catalogo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => {
            const vendor = vendors.find((v) => v.vendor_id === mat.vendor_id);
            const catInfo = CATEGORY_LABELS[mat.category] || CATEGORY_LABELS["other"];
            return (
              <div
                key={mat.material_id}
                className={`bg-white border rounded-2xl p-4 space-y-3 transition hover:shadow-md flex flex-col justify-between ${
                  mat.is_active ? "border-[#E5E5E5]" : "border-[#E5E5E5] opacity-60 bg-gray-50/50"
                }`}
              >
                {/* Card Top */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5]">
                      <span>{catInfo.icon}</span>
                      <span>{catInfo.label.split(" ")[0]}</span>
                    </span>

                    <span className="text-[11px] font-mono text-[#707072] font-semibold">
                      {mat.material_code}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#111111] line-clamp-2 leading-snug">
                    {mat.name}
                  </h4>

                  {/* Vendor strip */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F0F0F0] text-xs">
                    <span className="text-[#707072] text-[11px]">Fornitore:</span>
                    {vendor ? (
                      <button
                        type="button"
                        onClick={() => onNavigateToVendor && onNavigateToVendor(vendor.vendor_id)}
                        className="font-bold text-[#111111] hover:underline flex items-center gap-1 text-[11px] truncate max-w-[180px]"
                        title="Apri scheda fornitore in Modulo 04"
                      >
                        <span>🏭</span>
                        <span className="truncate">{vendor.company_name}</span>
                        {vendor.has_expired_critical_certs && (
                          <span className="text-red-500 text-[10px]" title="Certificazioni critiche scadute">
                            ⚠️
                          </span>
                        )}
                      </button>
                    ) : (
                      <span className="text-[#707072] text-[11px] italic">Non assegnato</span>
                    )}
                  </div>

                  {/* Shade and UOM */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#F9F9F9] rounded-xl p-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#707072] block">Tonalità/Colore</span>
                      <span className="font-semibold text-[#111111] text-[11px] truncate block">
                        {mat.color_shade || "N.D."}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#707072] block">Unità di Misura</span>
                      <span className="font-semibold text-[#111111] text-[11px] uppercase block">
                        {mat.unit_of_measure}
                      </span>
                    </div>
                  </div>

                  {/* Certifications badges */}
                  {mat.certifications && mat.certifications.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {mat.certifications.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[9px] font-bold"
                        >
                          ✓ {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Bottom / Cost & Actions */}
                <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#707072] block">Costo Standard</span>
                    {isL6Segregated ? (
                      <span className="text-xs text-[#707072] italic">Riservato L6</span>
                    ) : (
                      <span className="text-sm font-black text-[#111111] font-mono">
                        € {mat.standard_cost.toFixed(2)}
                        <span className="text-[10px] font-normal text-[#707072]"> /{mat.unit_of_measure}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingMaterial(mat)}
                      className="px-2.5 py-1 bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] rounded-lg text-xs font-semibold transition"
                      title="Modifica Materiale"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(mat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                        mat.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                      title={mat.is_active ? "Disattiva Materiale" : "Attiva Materiale"}
                    >
                      {mat.is_active ? "Attivo" : "Off"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">➕</span>
                <h3 className="text-base font-black uppercase tracking-tight text-[#111111] font-['Barlow_Condensed']">
                  Nuovo Materiale di Filiera
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F5] text-[#707072] hover:text-[#111111] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                    Codice Materiale / SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                    Categoria Merceologica
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MaterialCategory)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    <option value="leather">Pellame (leather)</option>
                    <option value="lining">Fodera (lining)</option>
                    <option value="fabric">Tessuto (fabric)</option>
                    <option value="sole_bottom">Fondo / Suola (sole_bottom)</option>
                    <option value="heel">Tacco (heel)</option>
                    <option value="hardware">Minuteria Metallica (hardware)</option>
                    <option value="thread">Filato (thread)</option>
                    <option value="packaging">Packaging (packaging)</option>
                    <option value="other">Altro (other)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                  Nome Commerciale & Tecnico
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="es. Vitello Pieno Fiore Nappa 1.3mm"
                  className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                    Fornitore Accreditato
                  </label>
                  <select
                    value={newVendorId}
                    onChange={(e) => setNewVendorId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    <option value="">Nessuno / Da definire</option>
                    {vendors.map((v) => (
                      <option key={v.vendor_id} value={v.vendor_id}>
                        {v.company_name} ({v.supply_chain_role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                    Tonalità / Colore di Riferimento
                  </label>
                  <input
                    type="text"
                    value={newColorShade}
                    onChange={(e) => setNewColorShade(e.target.value)}
                    placeholder="es. Nero Intenso / Tabacco"
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                    Unità di Misura (UOM)
                  </label>
                  <select
                    value={newUom}
                    onChange={(e) => setNewUom(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    <option value="dm2">Decimetri quadri (dm2)</option>
                    <option value="m">Metri lineari (m)</option>
                    <option value="paia">Paia (paia)</option>
                    <option value="pz">Pezzi (pz)</option>
                    <option value="kg">Chilogrammi (kg)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                    Costo Standard (€ / UOM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newStandardCost}
                    onChange={(e) => setNewStandardCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                  Certificazioni (separate da virgola)
                </label>
                <input
                  type="text"
                  value={newCertifications}
                  onChange={(e) => setNewCertifications(e.target.value)}
                  placeholder="es. LWG Gold, EUDR Deforestation-Free, REACH"
                  className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#F5F5F5] text-[#111111] rounded-full text-xs font-semibold hover:bg-[#E5E5E5] transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111111] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-black transition shadow-md"
                >
                  Salva nel Catalogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <h3 className="text-base font-black uppercase tracking-tight text-[#111111] font-['Barlow_Condensed']">
                Modifica: {editingMaterial.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMaterial(null)}
                className="w-8 h-8 rounded-full bg-[#F5F5F5] text-[#707072] hover:text-[#111111] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                  Nome Materiale
                </label>
                <input
                  type="text"
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                    Costo Standard (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingMaterial.standard_cost}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        standard_cost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                    Tonalità / Colore
                  </label>
                  <input
                    type="text"
                    value={editingMaterial.color_shade || ""}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        color_shade: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block mb-1">
                  Fornitore Associato
                </label>
                <select
                  value={editingMaterial.vendor_id || ""}
                  onChange={(e) => {
                    const vid = e.target.value;
                    const v = vendors.find((vend) => vend.vendor_id === vid);
                    setEditingMaterial({
                      ...editingMaterial,
                      vendor_id: vid || null,
                      vendor_name: v ? v.company_name : "",
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="">Nessuno</option>
                  {vendors.map((v) => (
                    <option key={v.vendor_id} value={v.vendor_id}>
                      {v.company_name} ({v.supply_chain_role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
              {onDeleteMaterial && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Vuoi disattivare/eliminare questo materiale dal catalogo?")) {
                      await onDeleteMaterial(editingMaterial.material_id);
                      setEditingMaterial(null);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-full text-xs font-semibold transition"
                >
                  🗑️ Rimuovi
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 bg-[#F5F5F5] text-[#111111] rounded-full text-xs font-semibold hover:bg-[#E5E5E5] transition"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (onUpdateMaterial) {
                      await onUpdateMaterial(editingMaterial.material_id, editingMaterial);
                    }
                    setEditingMaterial(null);
                  }}
                  className="px-5 py-2 bg-[#111111] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-black transition shadow-md"
                >
                  Aggiorna
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
