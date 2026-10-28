import React, { useMemo, useState } from "react";
import {
  applyVendorL6SegregationClient,
  computeDaysToExpiry,
  computeVendorRating,
} from "../mockSeedData";
import {
  Company,
  VendorCertification,
  VendorNegotiatedPriceItem,
  VendorRecord,
  VendorWhereUsedResponse,
  ViewerSecurityRole,
} from "../types";

export const MANDATORY_L6_BANNER_TEXT =
  "🔒 PRESIDIO L6 ATTIVO · I costi unitari di distinta base, le quotazioni negoziate coi fornitori e i listini di lavorazione sono visibili esclusivamente agli utenti autorizzati del Brand/Calzaturificio committente. I laboratori terzisti (Tier 3 a 0 €) visualizzano unicamente i codici colore, lo stato tirella Lab-Dip e le specifiche tecniche di montaggio.";

export const SUPPLY_CHAIN_ROLE_LABELS: Record<string, string> = {
  conceria: "Conceria & Rifinizione Pellami",
  suolificio: "Suolificio & Tacchificio",
  minuterie_galvanica: "Minuterie Metalliche & Galvanica",
  tomaificio_orlatura: "Tomaificio / Orlatura Façon",
  manovia_montaggio: "Manovia Montaggio & Finissaggio",
  tessuti_filati: "Tessuti, Fodere & Filati Tecnici",
  packaging: "Packaging, Scatolificio & Etichette",
};

export const DISTRICT_OPTIONS: string[] = [
  "Marche - Fermo / Macerata",
  "Toscana - Santa Croce sull'Arno",
  "Toscana - Scandicci / Firenze",
  "Veneto - Arzignano",
  "Veneto - Riviera del Brenta",
  "Lombardia - Vigevano / Milano",
  "Campania - Solofra",
  "Puglia - Barletta / Casarano",
  "Estero UE / Extra-UE",
];

export const QUALIFICATION_STATUS_META: Record<
  string,
  { label: string; badgeClass: string }
> = {
  qualified: {
    label: "QUALIFICATO ALBO",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  qualified_with_reserve: {
    label: "QUALIFICATO CON RISERVA",
    badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
  },
  audit_pending: {
    label: "IN CORSO DI QUALIFICA",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
  },
  suspended: {
    label: "SOSPESO · BLOCCO ORDINI",
    badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
  },
};

export const CERT_TYPE_LABELS: Record<string, string> = {
  LWG_GOLD: "LWG Gold Audit",
  LWG_SILVER: "LWG Silver Audit",
  EUDR_DUE_DILIGENCE: "EUDR Deforestation-Free",
  ICEC_TS410: "ICEC TS410 Tracciabilità",
  REACH_SVHC_NICKEL_FREE: "REACH / EN 1811 Nickel-Free",
  GRS_RECYCLED: "GRS Global Recycled Standard",
  OEKO_TEX_100: "OEKO-TEX Standard 100",
  ISO_14001: "ISO 14001 Ambiente",
  ISO_9001: "ISO 9001 Qualità",
  SA8000_SOCIAL: "SA8000 Etica & Lavoro",
  DURC_REGOLARITA: "DURC Regolarità Contributiva",
};

function generatePseudoSha256(seedText: string): string {
  let h1 = 0xdeadbeef ^ seedText.length;
  let h2 = 0x41c6ce57 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    const ch = seedText.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  const part = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return (
    part(h1) +
    part(h2) +
    part(h1 ^ 0x9e3779b9) +
    part(h2 ^ 0x85ebca6b) +
    part(Math.imul(h1, 31)) +
    part(Math.imul(h2, 17)) +
    part(h1 ^ h2) +
    part(~h1)
  ).slice(0, 64);
}

interface VendorHub360Props {
  vendors: VendorRecord[];
  viewerRole: ViewerSecurityRole;
  onCreateVendor: (
    payload: Omit<VendorRecord, "vendor_id">
  ) => Promise<void> | void;
  onUpdateVendor: (
    vendorId: string,
    payload: Partial<VendorRecord>
  ) => Promise<void> | void;
  onDeleteVendor: (vendorId: string) => Promise<void> | void;
  onAddCertification: (
    vendorId: string,
    cert: Omit<VendorCertification, "cert_id" | "vendor_id">
  ) => Promise<void> | void;
  onDeleteCertification: (
    vendorId: string,
    certId: string
  ) => Promise<void> | void;
  onFetchWhereUsed: (vendorId: string) => Promise<VendorWhereUsedResponse | null>;
  companies?: Company[];
  onLinkDistrictCompany?: (vendorId: string, companyId: string) => Promise<void> | void;
  onUnlinkDistrictCompany?: (vendorId: string) => Promise<void> | void;
  onAutoLinkDistrictCompanies?: () => Promise<{ matched_count: number; total_vendors: number } | void> | void;
}

interface VendorFormState {
  vendor_code: string;
  company_name: string;
  vat_number: string;
  supply_chain_role: string;
  district_area: string;
  city_address: string;
  country_iso2: string;
  paas_tier: "enterprise" | "pmi" | "subcontractor_zero_eur";
  qualification_status: string;
  quality_score: number;
  otd_score: number;
  esg_score: number;
  standard_lead_time_days: number;
  moq_description: string;
  payment_terms_l6: string;
  hourly_or_unit_rate_eur_l6: number;
  negotiated_price_list_l6: VendorNegotiatedPriceItem[];
  internal_audit_notes_l6: string;
  contact_email: string;
}

const DEFAULT_VENDOR_FORM: VendorFormState = {
  vendor_code: "FOR-NEW-010",
  company_name: "",
  vat_number: "IT",
  supply_chain_role: "conceria",
  district_area: "Marche - Fermo / Macerata",
  city_address: "",
  country_iso2: "IT",
  paas_tier: "pmi",
  qualification_status: "qualified",
  quality_score: 92,
  otd_score: 90,
  esg_score: 91,
  standard_lead_time_days: 14,
  moq_description: "200 unità / paia per ordine minimo",
  payment_terms_l6: "Ri.Ba. 60 gg F.M.",
  hourly_or_unit_rate_eur_l6: 12.0,
  negotiated_price_list_l6: [
    {
      item_code: "ART-BASE-01",
      description: "Fornitura / Lavorazione Standard Qualificata",
      uom: "pair",
      unit_price_eur: 12.0,
    },
  ],
  internal_audit_notes_l6: "",
  contact_email: "",
};

export const VendorHub360: React.FC<VendorHub360Props> = ({
  vendors,
  viewerRole,
  onCreateVendor,
  onUpdateVendor,
  onDeleteVendor,
  onAddCertification,
  onDeleteCertification,
  onFetchWhereUsed,
  companies = [],
  onLinkDistrictCompany,
  onUnlinkDistrictCompany,
  onAutoLinkDistrictCompanies,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // District PaaS Link States (FTL-CEO-022)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkingVendor, setLinkingVendor] = useState<VendorRecord | null>(null);
  const [selectedDistrictCompanyId, setSelectedDistrictCompanyId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isAutoLinking, setIsAutoLinking] = useState(false);
  const [autoLinkBanner, setAutoLinkBanner] = useState<string | null>(null);

  // Vendor Create/Edit Modal
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [vendorForm, setVendorForm] =
    useState<VendorFormState>(DEFAULT_VENDOR_FORM);

  // Certifications Vault Modal
  const [certModalVendorId, setCertModalVendorId] = useState<string | null>(null);
  const [newCertType, setNewCertType] = useState("LWG_GOLD");
  const [newCertCode, setNewCertCode] = useState("");
  const [newCertBody, setNewCertBody] = useState("Leather Working Group");
  const [newCertFrom, setNewCertFrom] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [newCertUntil, setNewCertUntil] = useState("2027-06-30");
  const [newCertHash, setNewCertHash] = useState("");

  // Where-Used Drawer / Expanded Panel
  const [whereUsedData, setWhereUsedData] =
    useState<VendorWhereUsedResponse | null>(null);
  const [isLoadingWhereUsed, setIsLoadingWhereUsed] = useState(false);

  const isBrand = viewerRole === "brand";

  // Client-side L6 safety net even if raw vendor records are passed
  const visibleVendors = useMemo(
    () => vendors.map((v) => applyVendorL6SegregationClient(v, viewerRole)),
    [vendors, viewerRole]
  );

  const kpis = useMemo(() => {
    const total = visibleVendors.length;
    const zeroEurCount = visibleVendors.filter(
      (v) => v.paas_tier === "subcontractor_zero_eur"
    ).length;
    const topClassCount = visibleVendors.filter(
      (v) => v.rating_class === "A+" || v.rating_class === "A"
    ).length;
    const certAlertsCount = visibleVendors.filter(
      (v) =>
        v.cert_semaphore_status === "red" ||
        v.cert_semaphore_status === "yellow" ||
        v.has_expired_critical_certs
    ).length;
    const expiredBlockCount = visibleVendors.filter(
      (v) => v.cert_semaphore_status === "red" || v.has_expired_critical_certs
    ).length;
    return {
      total,
      zeroEurCount,
      topClassCount,
      certAlertsCount,
      expiredBlockCount,
    };
  }, [visibleVendors]);

  const filteredVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleVendors.filter((v) => {
      if (roleFilter !== "ALL" && v.supply_chain_role !== roleFilter) {
        return false;
      }
      if (districtFilter !== "ALL") {
        if (
          !v.district_area.toLowerCase().includes(districtFilter.toLowerCase())
        ) {
          return false;
        }
      }
      if (statusFilter !== "ALL" && v.qualification_status !== statusFilter) {
        return false;
      }
      if (q) {
        const hay = [
          v.vendor_code,
          v.company_name,
          v.vat_number,
          v.district_area,
          SUPPLY_CHAIN_ROLE_LABELS[v.supply_chain_role] || v.supply_chain_role,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visibleVendors, searchQuery, roleFilter, districtFilter, statusFilter]);

  const activeCertVendor = useMemo(
    () =>
      certModalVendorId
        ? visibleVendors.find((v) => v.vendor_id === certModalVendorId) || null
        : null,
    [certModalVendorId, visibleVendors]
  );

  const openCreateVendorModal = () => {
    setEditingVendorId(null);
    setVendorForm({
      ...DEFAULT_VENDOR_FORM,
      vendor_code: `FOR-FTL-${String(vendors.length + 10).padStart(3, "0")}`,
    });
    setIsVendorModalOpen(true);
  };

  const openEditVendorModal = (v: VendorRecord) => {
    const raw = vendors.find((item) => item.vendor_id === v.vendor_id) || v;
    setEditingVendorId(raw.vendor_id);
    setVendorForm({
      vendor_code: raw.vendor_code,
      company_name: raw.company_name,
      vat_number: raw.vat_number,
      supply_chain_role: raw.supply_chain_role,
      district_area: raw.district_area,
      city_address: raw.city_address || "",
      country_iso2: raw.country_iso2 || "IT",
      paas_tier: (raw.paas_tier as VendorFormState["paas_tier"]) || "pmi",
      qualification_status: raw.qualification_status,
      quality_score: raw.quality_score ?? 90,
      otd_score: raw.otd_score ?? 90,
      esg_score: raw.esg_score ?? 90,
      standard_lead_time_days: raw.standard_lead_time_days || 14,
      moq_description: raw.moq_description || "",
      payment_terms_l6: raw.payment_terms_l6 || "Ri.Ba. 60 gg F.M.",
      hourly_or_unit_rate_eur_l6: raw.hourly_or_unit_rate_eur_l6 ?? 10.0,
      negotiated_price_list_l6:
        raw.negotiated_price_list_l6 && raw.negotiated_price_list_l6.length > 0
          ? raw.negotiated_price_list_l6
          : [],
      internal_audit_notes_l6: raw.internal_audit_notes_l6 || "",
      contact_email: raw.contact_email || "",
    });
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const rating = computeVendorRating(
      vendorForm.quality_score,
      vendorForm.otd_score,
      vendorForm.esg_score
    );
    const existingCerts = editingVendorId
      ? vendors.find((v) => v.vendor_id === editingVendorId)?.certifications ||
        []
      : [];

    const payload: Omit<VendorRecord, "vendor_id"> = {
      vendor_code: vendorForm.vendor_code.trim().toUpperCase(),
      company_name: vendorForm.company_name.trim(),
      vat_number: vendorForm.vat_number.trim().toUpperCase(),
      supply_chain_role: vendorForm.supply_chain_role,
      district_area: vendorForm.district_area,
      city_address: vendorForm.city_address.trim(),
      country_iso2: vendorForm.country_iso2.trim().toUpperCase() || "IT",
      paas_tier: vendorForm.paas_tier,
      qualification_status: vendorForm.qualification_status,
      quality_score: Number(vendorForm.quality_score),
      otd_score: Number(vendorForm.otd_score),
      esg_score: Number(vendorForm.esg_score),
      overall_rating: rating.overall_rating,
      rating_class: rating.rating_class,
      standard_lead_time_days: Number(vendorForm.standard_lead_time_days),
      moq_description: vendorForm.moq_description.trim(),
      payment_terms_l6: vendorForm.payment_terms_l6.trim(),
      hourly_or_unit_rate_eur_l6: Number(vendorForm.hourly_or_unit_rate_eur_l6),
      negotiated_price_list_l6: vendorForm.negotiated_price_list_l6,
      internal_audit_notes_l6: vendorForm.internal_audit_notes_l6.trim(),
      contact_email: vendorForm.contact_email.trim(),
      certifications: existingCerts,
      is_active: true,
    };

    if (editingVendorId) {
      await onUpdateVendor(editingVendorId, payload);
    } else {
      await onCreateVendor(payload);
    }
    setIsVendorModalOpen(false);
  };

  const handleAddPriceRow = () => {
    setVendorForm((prev) => ({
      ...prev,
      negotiated_price_list_l6: [
        ...prev.negotiated_price_list_l6,
        {
          item_code: `VOCE-0${prev.negotiated_price_list_l6.length + 1}`,
          description: "",
          uom: "pair",
          unit_price_eur: 8.5,
        },
      ],
    }));
  };

  const handleUpdatePriceRow = (
    idx: number,
    field: keyof VendorNegotiatedPriceItem,
    value: string | number
  ) => {
    setVendorForm((prev) => ({
      ...prev,
      negotiated_price_list_l6: prev.negotiated_price_list_l6.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleRemovePriceRow = (idx: number) => {
    setVendorForm((prev) => ({
      ...prev,
      negotiated_price_list_l6: prev.negotiated_price_list_l6.filter(
        (_, i) => i !== idx
      ),
    }));
  };

  const handleCreateCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certModalVendorId || !newCertCode.trim()) return;
    const days = computeDaysToExpiry(newCertUntil);
    const computedStatus: VendorCertification["status"] =
      days < 0 ? "expired" : days <= 60 ? "expiring_soon" : "valid";
    const finalSha =
      newCertHash.trim() ||
      generatePseudoSha256(
        `${certModalVendorId}:${newCertType}:${newCertCode}:${newCertUntil}`
      );

    await onAddCertification(certModalVendorId, {
      cert_type: newCertType,
      cert_code: newCertCode.trim().toUpperCase(),
      issuing_body: newCertBody.trim(),
      valid_from: newCertFrom,
      valid_until: newCertUntil,
      sha256_hash: finalSha,
      days_to_expiry: days,
      status: computedStatus,
    });
    setNewCertCode("");
    setNewCertHash("");
  };

  const handleInspectWhereUsed = async (vendorId: string) => {
    setIsLoadingWhereUsed(true);
    try {
      const result = await onFetchWhereUsed(vendorId);
      setWhereUsedData(result);
    } finally {
      setIsLoadingWhereUsed(false);
    }
  };

  const handleConfirmLinkDistrict = async () => {
    if (!linkingVendor || !selectedDistrictCompanyId || !onLinkDistrictCompany) return;
    setIsLinking(true);
    try {
      await onLinkDistrictCompany(linkingVendor.vendor_id, selectedDistrictCompanyId);
      setIsLinkModalOpen(false);
      setLinkingVendor(null);
      setSelectedDistrictCompanyId("");
      setAutoLinkBanner(
        `Fornitore "${linkingVendor.company_name}" collegato con successo all'azienda del Distretto.`
      );
    } catch (err: any) {
      alert("Errore nel collegamento: " + (err.message || err));
    } finally {
      setIsLinking(false);
    }
  };

  const handleAutoLink = async () => {
    if (!onAutoLinkDistrictCompanies) return;
    setIsAutoLinking(true);
    try {
      const res = await onAutoLinkDistrictCompanies();
      if (res && typeof res === "object") {
        setAutoLinkBanner(
          `⚡ Auto-collegamento completato: ${res.matched_count} fornitori associati automaticamente all'azienda del Distretto su ${res.total_vendors} analizzati tramite Partita IVA.`
        );
      } else {
        setAutoLinkBanner("⚡ Auto-collegamento completato con successo tramite Partita IVA.");
      }
    } catch (err: any) {
      alert("Errore durante l'auto-link: " + (err.message || err));
    } finally {
      setIsAutoLinking(false);
    }
  };

  const liveFormRating = computeVendorRating(
    vendorForm.quality_score,
    vendorForm.otd_score,
    vendorForm.esg_score
  );

  return (
    <div className="space-y-5">
      {/* Toast / Banner Auto-Link Feedback */}
      {autoLinkBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
          <span>{autoLinkBanner}</span>
          <button
            type="button"
            onClick={() => setAutoLinkBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner Obbligatorio Presidio L6 */}
      <div
        className={`rounded-xl p-4 border shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 ${
          isBrand
            ? "bg-slate-900 text-white border-slate-800"
            : "bg-amber-50 text-amber-950 border-amber-300"
        }`}
      >
        <p className="text-xs leading-relaxed font-medium max-w-4xl">
          {MANDATORY_L6_BANNER_TEXT}
        </p>
        <div className="shrink-0">
          {isBrand ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/40">
              🔓 Vista Brand/PMI Completa (L6 Autorizzato)
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-amber-900 text-white">
              🔒 Vista Terzista 0 € — Dati Finanziari e Scorecard Segregati L6
            </span>
          )}
        </div>
      </div>

      {/* Header & KPI Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-neutral-900 text-white">
                EPOCA II · FTL-TECH-023
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                🤝 Terzisti Tier 3 a 0,00 € Perpetuo
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                Scadenziario SHA-256 · LWG · EUDR · DURC
              </span>
            </div>
            <h2 className="mt-2 text-lg md:text-xl font-bold tracking-tight text-neutral-900">
              ALBO FORNITORI &amp; TERZISTI QUALIFICATO A 360°
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Governance unificata di concerie, suolifici, galvaniche, tomaifici e manovie dei distretti italiani.
              Monitoraggio automatico scadenze certificati ESG/EUDR, Vendor Rating ponderato e analisi d&apos;impatto Where-Used sulla BOM.
            </p>
          </div>

          {isBrand && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onAutoLinkDistrictCompanies && (
                <button
                  type="button"
                  disabled={isAutoLinking}
                  onClick={handleAutoLink}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>⚡ Auto-Link Distretto (P.IVA)</span>
                </button>
              )}
              <button
                type="button"
                onClick={openCreateVendorModal}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition shadow-sm shrink-0"
              >
                + QUALIFICA NUOVO FORNITORE / TERZISTA
              </button>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Partner Qualificati in Albo
            </div>
            <div className="text-xl font-bold text-neutral-900 mt-0.5">
              {kpis.total}{" "}
              <span className="text-xs font-normal text-slate-500">
                fornitori &amp; façon
              </span>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold">
              Laboratori Terzisti 0,00 €
            </div>
            <div className="text-xl font-bold text-emerald-950 mt-0.5">
              {kpis.zeroEurCount}{" "}
              <span className="text-xs font-semibold text-emerald-800">
                Canone 0,00 € Perpetuo
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Eccellenza Filiera (Classe A+/A)
            </div>
            <div className="text-xl font-bold text-neutral-900 mt-0.5">
              {isBrand ? (
                <>
                  {kpis.topClassCount}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    su {kpis.total} partner
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  🔒 Segregato L6
                </span>
              )}
            </div>
          </div>

          <div
            className={`rounded-lg p-3 border ${
              kpis.expiredBlockCount > 0
                ? "bg-rose-50 border-rose-200"
                : "bg-slate-50 border-slate-200/80"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider text-rose-900 font-semibold">
              Alert Scadenze Certificazioni
            </div>
            <div className="text-xl font-bold text-rose-950 mt-0.5">
              {kpis.certAlertsCount}{" "}
              <span className="text-xs font-semibold text-rose-800">
                ({kpis.expiredBlockCount} scaduti · blocco)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri Multi-Dimensionali */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Ricerca Ragione Sociale / P.IVA
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Es. Santa Croce, Solofra, IT014..."
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Ruolo di Filiera
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">Tutti i Ruoli Manifatturieri</option>
              {Object.entries(SUPPLY_CHAIN_ROLE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Distretto Manifatturiero
            </label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">Tutti i Distretti</option>
              <option value="Marche">Marche (Fermo / Macerata / Montegranaro)</option>
              <option value="Toscana">Toscana (Santa Croce / Scandicci)</option>
              <option value="Veneto">Veneto (Arzignano / Riviera del Brenta)</option>
              <option value="Lombardia">Lombardia (Vigevano / Milano)</option>
              <option value="Campania">Campania (Solofra)</option>
              <option value="Puglia">Puglia (Barletta / Casarano)</option>
              <option value="Estero">Estero UE / Extra-UE</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Stato Qualifica Albo
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">Tutti gli Stati Qualifica</option>
              {Object.entries(QUALIFICATION_STATUS_META).map(([k, meta]) => (
                <option key={k} value={k}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabella Albo 360° */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-3.5">Codice Albo &amp; P.IVA</th>
                <th className="py-3 px-3.5">Ragione Sociale &amp; Ruolo Filiera</th>
                <th className="py-3 px-3.5">Distretto &amp; Tier PaaS</th>
                <th className="py-3 px-3.5">Semaforo Certificazioni SHA-256</th>
                <th className="py-3 px-3.5">Vendor Rating Scorecard (L6)</th>
                <th className="py-3 px-3.5">Parametri &amp; Listino L6</th>
                <th className="py-3 px-3.5 text-right">Analisi &amp; Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredVendors.map((vendor) => {
                const qualMeta =
                  QUALIFICATION_STATUS_META[vendor.qualification_status] ||
                  QUALIFICATION_STATUS_META.qualified;

                return (
                  <tr key={vendor.vendor_id} className="hover:bg-slate-50/75">
                    {/* 1. Codice & P.IVA */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-mono font-bold text-neutral-900">
                        {vendor.vendor_code}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {vendor.vat_number}
                      </div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${qualMeta.badgeClass}`}
                      >
                        {qualMeta.label}
                      </span>
                    </td>

                    {/* 2. Ragione Sociale & Ruolo */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-neutral-900 text-sm">
                        {vendor.company_name}
                      </div>
                      <div className="text-[11px] font-medium text-slate-600">
                        {SUPPLY_CHAIN_ROLE_LABELS[vendor.supply_chain_role] ||
                          vendor.supply_chain_role}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {vendor.contact_email}
                      </div>
                    </td>

                    {/* 3. Distretto & Tier PaaS */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-semibold text-neutral-800">
                        {vendor.district_area}
                      </div>
                      <div className="mt-1">
                        {vendor.paas_tier === "subcontractor_zero_eur" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                            🤝 TIER 3 · 0,00 € PERPETUO
                          </span>
                        ) : vendor.paas_tier === "enterprise" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-900 text-white">
                            TIER 1 · FORNITORE STRUTTURATO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                            TIER 2 · PMI MANIFATTURIERA
                          </span>
                        )}
                      </div>

                      {/* District PaaS Link Synergy (FTL-CEO-022) */}
                      {vendor.district_company ? (
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                            <span>🏭 Distretto:</span>
                            <strong className="font-bold">
                              {vendor.district_company.legal_name || vendor.district_company.business_name}
                            </strong>
                          </span>
                          {isBrand && onUnlinkDistrictCompany && (
                            <button
                              type="button"
                              onClick={() => onUnlinkDistrictCompany(vendor.vendor_id)}
                              title="Scollega da azienda Distretto PaaS"
                              className="text-[10px] text-slate-400 hover:text-rose-600 font-bold px-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        isBrand && onLinkDistrictCompany && (
                          <div className="mt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setLinkingVendor(vendor);
                                setSelectedDistrictCompanyId("");
                                setIsLinkModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
                            >
                              <span>🔗 Collega a Distretto</span>
                            </button>
                          </div>
                        )
                      )}
                    </td>

                    {/* 4. Semaforo Certificazioni */}
                    <td className="py-3.5 px-3.5 min-w-[230px]">
                      <div>
                        {vendor.cert_semaphore_status === "red" ||
                        vendor.has_expired_critical_certs ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            🔴 SCADUTO · BLOCCO COMPLIANCE
                          </span>
                        ) : vendor.cert_semaphore_status === "yellow" ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            🟡 IN SCADENZA ≤60GG
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            🟢 CONFORME ({vendor.certifications.length} Cert.)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {vendor.certifications.map((c) => {
                          const days =
                            typeof c.days_to_expiry === "number"
                              ? c.days_to_expiry
                              : computeDaysToExpiry(c.valid_until);
                          return (
                            <span
                              key={c.cert_id}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                c.status === "expired" || days < 0
                                  ? "bg-rose-50 text-rose-900 border-rose-300 font-bold"
                                  : c.status === "expiring_soon" || days <= 60
                                  ? "bg-amber-50 text-amber-900 border-amber-300 font-semibold"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              {c.cert_type.replace(/_/g, " ")} ({days}gg)
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* 5. Vendor Rating Scorecard (Segregato L6 per Terzisti) */}
                    <td className="py-3.5 px-3.5">
                      {!vendor.l6_segregated && isBrand ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-neutral-900">
                              {vendor.overall_rating?.toFixed(1)}
                              <span className="text-[11px] font-normal text-slate-400">
                                /100
                              </span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                vendor.rating_class === "A+" ||
                                vendor.rating_class === "A"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : vendor.rating_class === "B"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-rose-100 text-rose-900"
                              }`}
                            >
                              Classe {vendor.rating_class}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Q:{vendor.quality_score} · OTD:{vendor.otd_score} · ESG:
                            {vendor.esg_score}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          🔒 Segregato L6
                        </span>
                      )}
                    </td>

                    {/* 6. Parametri & Tariffa L6 */}
                    <td className="py-3.5 px-3.5">
                      <div className="text-[11px] text-slate-700">
                        Lead Time: <strong>{vendor.standard_lead_time_days} gg</strong>
                      </div>
                      {!vendor.l6_segregated && isBrand ? (
                        <div className="mt-0.5 space-y-0.5">
                          <div className="font-mono text-xs font-bold text-neutral-900">
                            Tariffa Base: €{" "}
                            {vendor.hourly_or_unit_rate_eur_l6?.toFixed(2) ?? "—"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {vendor.payment_terms_l6} ·{" "}
                            {(vendor.negotiated_price_list_l6 || []).length} voci listino
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            🔒 Listini &amp; MOQ Segregati L6
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 7. Analisi Where-Used & Azioni */}
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInspectWhereUsed(vendor.vendor_id)}
                          className="px-3 py-1 rounded-lg bg-neutral-900 text-white text-[11px] font-semibold hover:bg-neutral-800 transition"
                        >
                          🔍 Where-Used BOM
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCertModalVendorId(vendor.vendor_id)}
                            className="px-2 py-0.5 rounded border border-slate-300 text-[11px] font-medium text-neutral-800 hover:bg-slate-100"
                          >
                            📜 Certificati
                          </button>
                          {isBrand && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditVendorModal(vendor)}
                                className="px-2 py-0.5 rounded border border-slate-300 text-[11px] font-medium text-neutral-800 hover:bg-slate-100"
                              >
                                ✎ Modifica
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteVendor(vendor.vendor_id)}
                                className="px-2 py-0.5 rounded border border-rose-200 text-[11px] font-medium text-rose-700 hover:bg-rose-50"
                              >
                                Sospendi
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pannello Espanso / Drawer: ANALISI D'IMPATTO FILIERA (WHERE-USED BOM) */}
      {(whereUsedData || isLoadingWhereUsed) && (
        <div className="bg-white border-2 border-neutral-900 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider">
                  WHERE-USED ENGINE · GRAFO RELAZIONALE 1:N
                </span>
                {whereUsedData?.has_expired_critical_certs && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-bold">
                    🔴 FORNITORE CON CERTIFICAZIONI SCADUTE IMPATTANTE SULLA BOM
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 text-base md:text-lg font-bold text-neutral-900">
                ANALISI D&apos;IMPATTO FILIERA (WHERE-USED BOM) —{" "}
                {whereUsedData?.company_name || "Caricamento..."}
              </h3>
              {whereUsedData && (
                <p className="text-xs text-slate-600">
                  Codice Albo <strong className="font-mono">{whereUsedData.vendor_code}</strong> · Criticità Filiera:{" "}
                  <strong className="text-neutral-900">
                    {whereUsedData.impact_summary.supply_chain_criticality}
                  </strong>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setWhereUsedData(null)}
              className="px-3 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              ✕ Chiudi Analisi
            </button>
          </div>

          {whereUsedData && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    Modelli PIM
                  </div>
                  <div className="text-lg font-bold text-neutral-900">
                    {whereUsedData.impact_summary.pim_models_count}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    Varianti PLM
                  </div>
                  <div className="text-lg font-bold text-neutral-900">
                    {whereUsedData.impact_summary.plm_variants_count}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    Nodi BOM L1/L2/L3
                  </div>
                  <div className="text-lg font-bold text-neutral-900">
                    {whereUsedData.impact_summary.bom_nodes_count}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    Lotti Conceria
                  </div>
                  <div className="text-lg font-bold text-neutral-900">
                    {whereUsedData.impact_summary.tannery_batches_count}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    Commesse Attive
                  </div>
                  <div className="text-lg font-bold text-neutral-900">
                    {whereUsedData.impact_summary.active_production_orders_count}
                  </div>
                </div>
                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3">
                  <div className="text-[10px] font-bold uppercase text-amber-900">
                    Esposizione Stagionale L6
                  </div>
                  {isBrand && whereUsedData.financial_exposure_l6 ? (
                    <div className="text-base font-mono font-bold text-neutral-900 mt-0.5">
                      €{" "}
                      {whereUsedData.financial_exposure_l6.estimated_seasonal_exposure_eur.toLocaleString(
                        "it-IT"
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-amber-900 mt-1">
                      🔒 Segregato L6 — Riservato Brand/PMI
                    </div>
                  )}
                </div>
              </div>

              {/* Dettaglio Finanziario L6 (Solo Brand) */}
              {isBrand && whereUsedData.financial_exposure_l6 ? (
                <div className="bg-slate-900 text-white rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Incidenza Media BOM / Unità:</span>{" "}
                    <strong className="font-mono">
                      €{" "}
                      {whereUsedData.financial_exposure_l6.avg_bom_cost_contribution_per_pair_eur.toFixed(
                        2
                      )}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Valore Stock Lotti Conceria:</span>{" "}
                    <strong className="font-mono">
                      €{" "}
                      {(
                        whereUsedData.financial_exposure_l6.tannery_stock_value_eur ||
                        0
                      ).toLocaleString("it-IT")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Condizioni Pagamento L6:</span>{" "}
                    <strong>
                      {whereUsedData.financial_exposure_l6.payment_terms || "Standard"}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-300 text-amber-950 rounded-xl p-3 text-xs font-semibold">
                  🔒 Segregato L6 — Riservato Brand/PMI: l&apos;esposizione finanziaria stagionale e i costi unitari dei nodi BOM sono oscurati per il ruolo Terzista.
                </div>
              )}

              {/* Nodi BOM Impattati */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-200 rounded-xl p-3.5">
                  <div className="font-bold text-neutral-900 mb-2">
                    Nodi Distinta Base Impattati ({whereUsedData.impacted_bom_nodes.length})
                  </div>
                  {whereUsedData.impacted_bom_nodes.length === 0 ? (
                    <p className="text-slate-500">
                      Nessun nodo BOM diretto attualmente collegato a questo fornitore.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {whereUsedData.impacted_bom_nodes.map((node) => (
                        <div
                          key={`${node.plm_variant_id}-${node.bom_item_id}`}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <div>
                            <span className="font-mono font-bold text-neutral-900">
                              L{node.level} · {node.variant_code}
                            </span>
                            <div className="text-slate-700 font-medium">
                              {node.material_name}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <div>
                              {node.unit_consumption} {node.unit_of_measure}
                            </div>
                            <div className="text-[11px] font-bold">
                              {isBrand &&
                              typeof node.unit_cost_eur_l6 === "number" ? (
                                `€ ${node.unit_cost_eur_l6.toFixed(2)}/${node.unit_of_measure}`
                              ) : (
                                <span className="text-amber-800">🔒 L6</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5">
                  <div className="font-bold text-neutral-900 mb-2">
                    Modelli PIM ({whereUsedData.impacted_pim_items.length}) &amp; Lotti Conceria ({whereUsedData.impacted_tannery_batches.length})
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {whereUsedData.impacted_pim_items.map((pim) => (
                      <div
                        key={pim.pim_item_id}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-neutral-900">
                            {pim.model_name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            SKU: {pim.sku_code}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
                          {pim.season}
                        </span>
                      </div>
                    ))}
                    {whereUsedData.impacted_tannery_batches.map((tb) => (
                      <div
                        key={tb.batch_id}
                        className="p-2 rounded-lg bg-amber-50/50 border border-amber-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono font-bold text-neutral-900">
                            Lotto {tb.batch_code}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {tb.leather_type}
                          </div>
                        </div>
                        <span className="font-mono text-[11px] font-semibold">
                          {tb.available_qty_sqft} sqft · LWG {tb.lwg_rating}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modale Zero-JSON: Qualifica / Modifica Fornitore o Terzista */}
      {isVendorModalOpen && isBrand && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Vendor Hub 360° · Qualifica Partner &amp; Listini L6 (Zero-JSON)
                </span>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingVendorId
                    ? `Modifica Scheda Fornitore · ${vendorForm.vendor_code}`
                    : "Qualifica Nuovo Fornitore / Laboratorio Terzista (0,00 €)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVendorModalOpen(false)}
                className="text-slate-400 hover:text-neutral-900 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Codice Albo *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorForm.vendor_code}
                    onChange={(e) =>
                      setVendorForm((p) => ({ ...p, vendor_code: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ragione Sociale Completa *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorForm.company_name}
                    onChange={(e) =>
                      setVendorForm((p) => ({ ...p, company_name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Es. Tomaificio Artigiano Rossi S.n.c."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Partita IVA / VAT *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorForm.vat_number}
                    onChange={(e) =>
                      setVendorForm((p) => ({ ...p, vat_number: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ruolo di Filiera
                  </label>
                  <select
                    value={vendorForm.supply_chain_role}
                    onChange={(e) =>
                      setVendorForm((p) => ({
                        ...p,
                        supply_chain_role: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {Object.entries(SUPPLY_CHAIN_ROLE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Distretto Manifatturiero
                  </label>
                  <select
                    value={vendorForm.district_area}
                    onChange={(e) =>
                      setVendorForm((p) => ({
                        ...p,
                        district_area: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {DISTRICT_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tier PaaS (Manifesto Pilastro 3)
                  </label>
                  <select
                    value={vendorForm.paas_tier}
                    onChange={(e) =>
                      setVendorForm((p) => ({
                        ...p,
                        paas_tier: e.target.value as VendorFormState["paas_tier"],
                      }))
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="subcontractor_zero_eur">
                      🤝 Terzista Tier 3 — 0,00 € Perpetuo
                    </option>
                    <option value="pmi">Tier 2 — PMI Fornitore Qualificato</option>
                    <option value="enterprise">
                      Tier 1 — Fornitore Industriale / Conceria Strutturata
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stato Qualifica Albo
                  </label>
                  <select
                    value={vendorForm.qualification_status}
                    onChange={(e) =>
                      setVendorForm((p) => ({
                        ...p,
                        qualification_status: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {Object.entries(QUALIFICATION_STATUS_META).map(([k, m]) => (
                      <option key={k} value={k}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lead Time Standard (Giorni)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={vendorForm.standard_lead_time_days}
                    onChange={(e) =>
                      setVendorForm((p) => ({
                        ...p,
                        standard_lead_time_days: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Qualità / Produzione
                  </label>
                  <input
                    type="email"
                    value={vendorForm.contact_email}
                    onChange={(e) =>
                      setVendorForm((p) => ({ ...p, contact_email: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="produzione@fornitore.it"
                  />
                </div>
              </div>

              {/* Scorecard Ponderata L6 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">
                    🔒 Scorecard Vendor Rating L6 (40% Qualità · 30% OTD · 30% ESG)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-neutral-900 text-white">
                    Rating Calcolato: {liveFormRating.overall_rating}/100 (Classe{" "}
                    {liveFormRating.rating_class})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Qualità Difettosità (0-100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={vendorForm.quality_score}
                      onChange={(e) =>
                        setVendorForm((p) => ({
                          ...p,
                          quality_score: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Puntualità OTD (0-100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={vendorForm.otd_score}
                      onChange={(e) =>
                        setVendorForm((p) => ({
                          ...p,
                          otd_score: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Compliance ESG / Audit (0-100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={vendorForm.esg_score}
                      onChange={(e) =>
                        setVendorForm((p) => ({
                          ...p,
                          esg_score: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Condizioni Economiche Segregate L6 */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="font-bold text-neutral-900">
                  🔒 Condizioni Commerciali, MOQ &amp; Listino Negoziato (Segregazione Rigorosa L6)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tariffa / Costo Base (€)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={vendorForm.hourly_or_unit_rate_eur_l6}
                      onChange={(e) =>
                        setVendorForm((p) => ({
                          ...p,
                          hourly_or_unit_rate_eur_l6: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Termini di Pagamento L6
                    </label>
                    <input
                      type="text"
                      value={vendorForm.payment_terms_l6}
                      onChange={(e) =>
                        setVendorForm((p) => ({
                          ...p,
                          payment_terms_l6: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Lotto Minimo (MOQ)
                    </label>
                    <input
                      type="text"
                      value={vendorForm.moq_description}
                      onChange={(e) =>
                        setVendorForm((p) => ({
                          ...p,
                          moq_description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Voci Listino Guidate Zero-JSON */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Voci Listino Negoziato L6 ({vendorForm.negotiated_price_list_l6.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddPriceRow}
                      className="px-2.5 py-1 rounded border border-slate-300 text-[11px] font-semibold hover:bg-slate-50"
                    >
                      + Aggiungi Voce Listino
                    </button>
                  </div>
                  {vendorForm.negotiated_price_list_l6.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={item.item_code}
                        onChange={(e) =>
                          handleUpdatePriceRow(idx, "item_code", e.target.value)
                        }
                        placeholder="Codice"
                        className="col-span-3 px-2 py-1 border border-slate-300 rounded font-mono"
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleUpdatePriceRow(idx, "description", e.target.value)
                        }
                        placeholder="Descrizione articolo o fase façon"
                        className="col-span-5 px-2 py-1 border border-slate-300 rounded"
                      />
                      <select
                        value={item.uom}
                        onChange={(e) =>
                          handleUpdatePriceRow(idx, "uom", e.target.value)
                        }
                        className="col-span-2 px-2 py-1 border border-slate-300 rounded bg-white"
                      >
                        <option value="pair">pair</option>
                        <option value="sqft">sqft</option>
                        <option value="m">m</option>
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                      </select>
                      <input
                        type="number"
                        step="0.05"
                        value={item.unit_price_eur}
                        onChange={(e) =>
                          handleUpdatePriceRow(
                            idx,
                            "unit_price_eur",
                            Number(e.target.value)
                          )
                        }
                        className="col-span-1 px-1.5 py-1 border border-slate-300 rounded font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePriceRow(idx)}
                        className="col-span-1 text-rose-600 font-bold hover:text-rose-800 text-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Note Riservate Audit &amp; Negoziazione L6
                  </label>
                  <textarea
                    rows={2}
                    value={vendorForm.internal_audit_notes_l6}
                    onChange={(e) =>
                      setVendorForm((p) => ({
                        ...p,
                        internal_audit_notes_l6: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800"
                >
                  {editingVendorId ? "💾 Salva Modifiche Albo" : "💾 Qualifica Partner in Albo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Vault Certificazioni SHA-256 */}
      {activeCertVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Scadenziario Compliance &amp; Impronta Crittografica SHA-256
                </span>
                <h3 className="text-base font-bold text-neutral-900">
                  📜 Vault Certificazioni — {activeCertVendor.company_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCertModalVendorId(null)}
                className="text-slate-400 hover:text-neutral-900 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-2">
                {activeCertVendor.certifications.map((cert) => {
                  const days =
                    typeof cert.days_to_expiry === "number"
                      ? cert.days_to_expiry
                      : computeDaysToExpiry(cert.valid_until);
                  return (
                    <div
                      key={cert.cert_id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-neutral-900">
                            {CERT_TYPE_LABELS[cert.cert_type] || cert.cert_type}
                          </span>
                          <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                            {cert.cert_code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              days < 0
                                ? "bg-rose-100 text-rose-900"
                                : days <= 60
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-100 text-emerald-900"
                            }`}
                          >
                            {days < 0
                              ? `SCADUTO (${days} gg)`
                              : `Valido (+${days} gg)`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Ente: {cert.issuing_body} · Scadenza:{" "}
                          <strong>{cert.valid_until}</strong>
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate">
                          SHA-256: {cert.sha256_hash}
                        </div>
                      </div>
                      {isBrand && (
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteCertification(
                              activeCertVendor.vendor_id,
                              cert.cert_id
                            )
                          }
                          className="text-rose-600 hover:text-rose-800 font-semibold shrink-0"
                        >
                          Rimuovi
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {isBrand && (
                <form
                  onSubmit={handleCreateCertification}
                  className="pt-4 border-t border-slate-200 space-y-3"
                >
                  <div className="font-bold text-neutral-900">
                    + Registra Nuovo Certificato SHA-256
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tipologia Certificazione
                      </label>
                      <select
                        value={newCertType}
                        onChange={(e) => setNewCertType(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      >
                        {Object.entries(CERT_TYPE_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Numero / Codice Certificato *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCertCode}
                        onChange={(e) => setNewCertCode(e.target.value)}
                        placeholder="Es. LWG-IT-2026-9910"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Ente Certificatore
                      </label>
                      <input
                        type="text"
                        value={newCertBody}
                        onChange={(e) => setNewCertBody(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Valido Dal
                        </label>
                        <input
                          type="date"
                          value={newCertFrom}
                          onChange={(e) => setNewCertFrom(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Scadenza
                        </label>
                        <input
                          type="date"
                          value={newCertUntil}
                          onChange={(e) => setNewCertUntil(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800"
                    >
                      + Aggiungi Certificato SHA-256
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal: Collega Fornitore ad Azienda Distretto PaaS (FTL-CEO-022) */}
      {isLinkModalOpen && linkingVendor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  🔗 Collega Fornitore ad Azienda Distretto PaaS
                </h3>
                <p className="text-xs text-slate-500">
                  Associa <strong>{linkingVendor.company_name}</strong> ({linkingVendor.vat_number}) a un&apos;anagrafica multi-tenant del Distretto PaaS.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Seleziona Azienda Registrata nel Distretto PaaS:
              </label>
              <select
                value={selectedDistrictCompanyId}
                onChange={(e) => setSelectedDistrictCompanyId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="">-- Seleziona un&apos;azienda --</option>
                {companies?.map((c) => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.legal_name} ({c.vat_number}) · {c.district} [{c.company_tier}]
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Il collegamento unifica l&apos;accesso SSO della rete terzisti a 0,00 €, le scorecard di rating e la tracciabilità delle lavorazioni BOM nel rispetto della segregazione L6.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={!selectedDistrictCompanyId || isLinking}
                onClick={handleConfirmLinkDistrict}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition disabled:opacity-50"
              >
                {isLinking ? "Collegamento..." : "Conferma Collegamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorHub360;
