import React, { useState } from "react";
import {
  Company,
  CompanyTier,
  CompanyBusinessType,
  CompanyMembership,
  DistrictUserRole,
  User,
} from "../types";

interface DistrictPaasManagerProps {
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  onCreateCompany: (company: {
    legal_name: string;
    business_name: string;
    vat_number: string;
    district: string;
    company_tier: CompanyTier;
    business_type: CompanyBusinessType;
    contact_email: string;
    phone?: string;
    website?: string;
    metadata?: Record<string, any>;
  }) => void;
  memberships: CompanyMembership[];
  onAddMember: (membership: {
    company_id: string;
    user_id: string;
    role: DistrictUserRole;
  }) => void;
  users: User[];
  onCreateUser: (user: { email: string; full_name: string }) => Promise<string | undefined>;
}

export const DistrictPaasManager: React.FC<DistrictPaasManagerProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  onCreateCompany,
  memberships,
  onAddMember,
  users,
  onCreateUser,
}) => {
  const [tierFilter, setTierFilter] = useState<CompanyTier | "ALL">("ALL");
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // New Company Form State
  const [legalName, setLegalName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [district, setDistrict] = useState("Fermo-Macerata");
  const [companyTier, setCompanyTier] = useState<CompanyTier>("subcontractor_zero_eur");
  const [businessType, setBusinessType] = useState<CompanyBusinessType>("subcontractor_lab");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");

  // New Member Form State
  const [isExistingUser, setIsExistingUser] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.user_id || "");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [memberRole, setMemberRole] = useState<DistrictUserRole>("subcontractor_operator");

  const currentCompany =
    companies.find((c) => c.company_id === selectedCompanyId) || companies[0];

  const currentMembers = memberships.filter(
    (m) => m.company_id === currentCompany?.company_id
  );

  const filteredCompanies =
    tierFilter === "ALL"
      ? companies
      : companies.filter((c) => c.company_tier === tierFilter);

  const handleCreateCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName.trim() || !businessName.trim() || !vatNumber.trim() || !contactEmail.trim()) {
      return;
    }
    onCreateCompany({
      legal_name: legalName.trim(),
      business_name: businessName.trim(),
      vat_number: vatNumber.trim(),
      district,
      company_tier: companyTier,
      business_type: businessType,
      contact_email: contactEmail.trim(),
      phone: phone.trim(),
      metadata: specialization ? { specialization: specialization.trim() } : {},
    });
    setLegalName("");
    setBusinessName("");
    setVatNumber("");
    setContactEmail("");
    setPhone("");
    setSpecialization("");
    setShowCreateCompanyModal(false);
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    let targetUserId = selectedUserId;
    if (!isExistingUser) {
      if (!newUserEmail.trim() || !newUserFullName.trim()) return;
      const createdId = await onCreateUser({
        email: newUserEmail.trim(),
        full_name: newUserFullName.trim(),
      });
      if (!createdId) return;
      targetUserId = createdId;
    }

    onAddMember({
      company_id: currentCompany.company_id,
      user_id: targetUserId,
      role: memberRole,
    });
    setShowAddMemberModal(false);
    setNewUserEmail("");
    setNewUserFullName("");
  };

  const getTierBadge = (tier: CompanyTier) => {
    switch (tier) {
      case "enterprise":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#111111] text-white tracking-wide">
            👑 ENTERPRISE (LUSSO)
          </span>
        );
      case "pmi":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            🏭 PMI DISTRETTO
          </span>
        );
      case "subcontractor_zero_eur":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            ✨ FAÇONISTA 0 € PERPETUO
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: District PaaS Multi-Tenant 3-Tier Architecture */}
      <div className="bg-[#111111] text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-neutral-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                MODULO 01 · DISTRICT PaaS NETWORK (ADR-008)
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Multi-Tenant Distrettuale · 3 Tiers · Zero-Spend FinOps
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
              Hub Distrettuale Aziende & Rete Operatori
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Piattaforma federata a 3 livelli: <strong className="text-white">Enterprise</strong> (Brand capofiliera Lusso),{" "}
              <strong className="text-white">PMI</strong> (Calzaturifici, Pelletterie e Concerie d'eccellenza), e{" "}
              <strong className="text-emerald-400">Laboratori Terzisti a 0 €</strong> (Façonisti, giunterie, orlatori con accesso illimitato).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateCompanyModal(true)}
              className="px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#111111] font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <span>+ Attiva Nuova Azienda</span>
            </button>
          </div>
        </div>

        {/* 3 Tier Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-neutral-800 text-xs">
          <div className="bg-neutral-900/80 rounded-2xl p-4 border border-neutral-800/80">
            <div className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Tier 1 · Enterprise</div>
            <div className="text-xl font-bold text-white mt-1">
              {companies.filter((c) => c.company_tier === "enterprise").length} Brand Attivi
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">Segregazione dati industriali L6, governance DPP & Audit doganali</div>
          </div>
          <div className="bg-neutral-900/80 rounded-2xl p-4 border border-neutral-800/80">
            <div className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Tier 2 · PMI Manifatturiere & Concerie</div>
            <div className="text-xl font-bold text-blue-400 mt-1">
              {companies.filter((c) => c.company_tier === "pmi").length} Fabbriche & Concerie
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">Lanci commesse, gestione distinte base BOM & lotti pelle LWG</div>
          </div>
          <div className="bg-neutral-900/80 rounded-2xl p-4 border border-neutral-800/80">
            <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Tier 3 · Terzisti & Façonisti 0 €</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {companies.filter((c) => c.company_tier === "subcontractor_zero_eur").length} Laboratori Artigiani
            </div>
            <div className="text-[11px] text-emerald-300 mt-1">Canone 0,00 € perpetuo · Avanzamento mobile via 3-clic QR</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Company Selector & Active Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Company Directory & Tier Filters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111111]">Directory Distrettuale</h2>
              <span className="text-xs text-[#707072] font-mono">{filteredCompanies.length} aziende</span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4 p-1 bg-[#F5F5F5] rounded-2xl">
              {(["ALL", "enterprise", "pmi", "subcontractor_zero_eur"] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    tierFilter === tier
                      ? "bg-white text-[#111111] shadow-sm font-bold"
                      : "text-[#707072] hover:text-[#111111]"
                  }`}
                >
                  {tier === "ALL"
                    ? "Tutte"
                    : tier === "enterprise"
                    ? "Enterprise"
                    : tier === "pmi"
                    ? "PMI"
                    : "0 € Terzisti"}
                </button>
              ))}
            </div>

            {/* Company Cards List */}
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredCompanies.map((c) => {
                const isSelected = c.company_id === currentCompany?.company_id;
                return (
                  <div
                    key={c.company_id}
                    onClick={() => onSelectCompany(c.company_id)}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-[#F9F9F9] border-[#111111] shadow-md ring-1 ring-[#111111]"
                        : "bg-white border-[#E5E5E5] hover:border-neutral-300 hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-[#111111] leading-snug">{c.business_name}</div>
                      {getTierBadge(c.company_tier)}
                    </div>
                    <div className="text-xs text-[#707072] mt-1 line-clamp-1">{c.legal_name}</div>
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#EAEAEA] text-[11px] text-[#707072]">
                      <span className="font-mono">P.IVA {c.vat_number}</span>
                      <span>•</span>
                      <span>{c.district}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Company Details & Team Members */}
        <div className="lg:col-span-8 space-y-6">
          {currentCompany ? (
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-7 shadow-sm space-y-6">
              {/* Header Profile */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#EAEAEA]">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    {getTierBadge(currentCompany.company_tier)}
                    <span className="text-xs text-[#707072] font-mono">ID: {currentCompany.company_id}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#111111]">{currentCompany.business_name}</h2>
                  <p className="text-xs text-[#707072]">{currentCompany.legal_name}</p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#707072]">Canone Piattaforma</div>
                  <div className="text-2xl font-black text-[#111111]">
                    {currentCompany.company_tier === "subcontractor_zero_eur" ? (
                      <span className="text-emerald-600">0,00 € / mese</span>
                    ) : currentCompany.company_tier === "pmi" ? (
                      <span>149,00 € / mese</span>
                    ) : (
                      <span>Enterprise Contract</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#707072]">
                    {currentCompany.company_tier === "subcontractor_zero_eur"
                      ? "Gratuito e senza limiti di operatori"
                      : "Fatturazione centralizzata distrettuale"}
                  </div>
                </div>
              </div>

              {/* Company Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-[#F5F5F5] rounded-2xl p-4">
                  <span className="text-[#707072] font-bold uppercase text-[10px]">Distretto Produttivo</span>
                  <p className="font-semibold text-sm text-[#111111] mt-1">{currentCompany.district}</p>
                </div>
                <div className="bg-[#F5F5F5] rounded-2xl p-4">
                  <span className="text-[#707072] font-bold uppercase text-[10px]">Tipologia Business</span>
                  <p className="font-semibold text-sm text-[#111111] mt-1 uppercase">{currentCompany.business_type}</p>
                </div>
                <div className="bg-[#F5F5F5] rounded-2xl p-4">
                  <span className="text-[#707072] font-bold uppercase text-[10px]">Contatti Operativi</span>
                  <p className="font-semibold text-sm text-[#111111] mt-1">{currentCompany.contact_email}</p>
                </div>
              </div>

              {/* Members & Operators Roster */}
              <div className="space-y-4 pt-4 border-t border-[#EAEAEA]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">
                      Operatori & Membri Associati ({currentMembers.length})
                    </h3>
                    <p className="text-xs text-[#707072]">
                      Profili operativi abilitati alla compilazione ordini, schede tecniche e avanzamento fasi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="px-4 py-2 rounded-full border border-[#111111] bg-white text-[#111111] hover:bg-[#F5F5F5] text-xs font-bold transition-all"
                  >
                    + Assegna Utente
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#EAEAEA]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F5F5] text-[#707072] uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3">Utente</th>
                        <th className="p-3">Ruolo di Filiera</th>
                        <th className="p-3">Stato</th>
                        <th className="p-3">Associazione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {currentMembers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-neutral-400">
                            Nessun utente assegnato a questa azienda. Clicca su "+ Assegna Utente" per abilitare un operatore.
                          </td>
                        </tr>
                      ) : (
                        currentMembers.map((m) => {
                          const userObj = users.find((u) => u.user_id === m.user_id);
                          return (
                            <tr key={m.membership_id} className="hover:bg-[#FAFAFA]">
                              <td className="p-3">
                                <div className="font-bold text-[#111111]">
                                  {m.user_full_name || userObj?.full_name || "Operatore"}
                                </div>
                                <div className="text-[11px] text-[#707072]">
                                  {m.user_email || userObj?.email || m.user_id}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="inline-block px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold bg-neutral-100 text-neutral-800">
                                  {m.role}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Attivo
                                </span>
                              </td>
                              <td className="p-3 text-[#707072] font-mono text-[11px]">
                                {m.created_at ? m.created_at.slice(0, 10) : "2026-10-19"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-400 bg-white rounded-3xl border border-[#E5E5E5]">
              Seleziona un'azienda dalla lista a sinistra.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Company */}
      {showCreateCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">Attivazione Azienda PaaS Distrettuale</h3>
                <p className="text-xs text-[#707072]">Registrazione nel network federato calzaturiero e conciario.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateCompanyModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompanySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Livello / Tier PaaS *</label>
                  <select
                    value={companyTier}
                    onChange={(e) => setCompanyTier(e.target.value as CompanyTier)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white text-[#111111] font-semibold"
                  >
                    <option value="subcontractor_zero_eur">✨ Laboratorio Terzista (0 € Canone)</option>
                    <option value="pmi">🏭 PMI Manifattura / Conceria (149 €/mese)</option>
                    <option value="enterprise">👑 Enterprise Brand Lusso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Tipologia Attività *</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as CompanyBusinessType)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white text-[#111111] font-semibold"
                  >
                    <option value="subcontractor_lab">Laboratorio Terzista (Façon)</option>
                    <option value="tannery">Conceria di Pellami</option>
                    <option value="manufacturer">Calzaturificio / Pelletteria</option>
                    <option value="brand">Brand di Proprietà</option>
                    <option value="components_supplier">Fornitore Componenti & Suole</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Ragione Sociale (Legale) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Calzaturificio Marchigiano S.r.l."
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Nome Commerciale *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Marchigiano Shoes"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Partita IVA / Codice Fiscale *</label>
                  <input
                    type="text"
                    required
                    placeholder="IT01234567890"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Distretto Industriale *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="Fermo-Macerata">Fermo-Macerata (Calzature Marche)</option>
                    <option value="Arzignano / Valle del Chiampo">Arzignano (Pelli & Concia Veneto)</option>
                    <option value="Santa Croce sull'Arno">Santa Croce sull'Arno (Concia Toscana)</option>
                    <option value="Scandicci">Scandicci (Pelletteria & Lusso Firenze)</option>
                    <option value="Riviera del Brenta">Riviera del Brenta (Calzatura Donna Lusso)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Email di Contatto *</label>
                  <input
                    type="email"
                    required
                    placeholder="amministrazione@fabbrica.it"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Telefono / WhatsApp Fabbrica</label>
                  <input
                    type="tel"
                    placeholder="+39 0734 889900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Specializzazione Produttiva</label>
                <input
                  type="text"
                  placeholder="Es. Montaggio Blake calzatura uomo, fresatura tacchi cuoio"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowCreateCompanyModal(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800"
                >
                  Attiva Azienda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Member */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">Assegna Operatore ad Azienda</h3>
                <p className="text-xs text-[#707072]">{currentCompany?.business_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4 text-xs">
              <div className="flex gap-4 p-1 bg-[#F5F5F5] rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsExistingUser(true)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    isExistingUser ? "bg-white text-[#111111] shadow-sm" : "text-[#707072]"
                  }`}
                >
                  Utente Registrato
                </button>
                <button
                  type="button"
                  onClick={() => setIsExistingUser(false)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    !isExistingUser ? "bg-white text-[#111111] shadow-sm" : "text-[#707072]"
                  }`}
                >
                  + Nuovo Utente
                </button>
              </div>

              {isExistingUser ? (
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Seleziona Operatore *</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    {users.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Nome e Cognome *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mario Rossi"
                      value={newUserFullName}
                      onChange={(e) => setNewUserFullName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Email Aziendale *</label>
                    <input
                      type="email"
                      required
                      placeholder="mario.rossi@fabbrica.it"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Ruolo Operativo *</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as DistrictUserRole)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                >
                  <option value="subcontractor_operator">Operatore Laboratorio Terzista</option>
                  <option value="factory_tech_lead">Responsabile Tecnico Fabbrica</option>
                  <option value="tannery_operator">Responsabile Conceria & Qualità Pelli</option>
                  <option value="product_manager">Product Manager / Merchandiser</option>
                  <option value="brand_admin">Amministratore Brand Enterprise</option>
                  <option value="customs_inspector">Ispettore Dogana & Certificatore L6</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800"
                >
                  Assegna Ruolo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
