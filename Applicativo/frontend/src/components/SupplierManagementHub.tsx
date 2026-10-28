import React, { useState } from "react";
import { DistrictPaasManager } from "./DistrictPaasManager";
import { TanneryVaultManager, LeatherBomOption } from "./TanneryVaultManager";
import VendorHub360 from "./VendorHub360";
import {
  Company,
  CompanyMembership,
  CompanyTier,
  CompanyBusinessType,
  DistrictUserRole,
  MasterColor,
  PimCommercialItem,
  TanneryBatch,
  TanneryProcess,
  TanneryDocumentType,
  TanneryDocumentVerifyResponse,
  User,
  VendorCertification,
  VendorRecord,
  VendorWhereUsedResponse,
  ViewerSecurityRole,
} from "../types";

export type SupplierHubSubTab = "vendors" | "district" | "tannery";

interface SupplierManagementHubProps {
  // Vendors Props
  vendors: VendorRecord[];
  viewerRole: ViewerSecurityRole;
  onCreateVendor: (payload: Omit<VendorRecord, "vendor_id">) => Promise<void> | void;
  onUpdateVendor: (vendorId: string, payload: Partial<VendorRecord>) => Promise<void> | void;
  onDeleteVendor: (vendorId: string) => Promise<void> | void;
  onAddCertification: (
    vendorId: string,
    cert: Omit<VendorCertification, "cert_id" | "vendor_id">
  ) => Promise<void> | void;
  onDeleteCertification: (vendorId: string, certId: string) => Promise<void> | void;
  onFetchWhereUsed: (vendorId: string) => Promise<VendorWhereUsedResponse | null>;
  onLinkDistrictCompany?: (vendorId: string, companyId: string) => Promise<void> | void;
  onUnlinkDistrictCompany?: (vendorId: string) => Promise<void> | void;
  onAutoLinkDistrictCompanies?: () => Promise<{ matched_count: number; total_vendors: number } | void> | void;

  // District PaaS Props
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

  // Tannery Vault Props
  batches: TanneryBatch[];
  availableLeatherBomMaterials?: LeatherBomOption[];
  colors?: MasterColor[];
  pimItems?: PimCommercialItem[];
  onCreateBatch: (batch: {
    company_id: string;
    batch_code: string;
    tannery_name: string;
    vendor_id?: string | null;
    master_color_id?: string | null;
    district: string;
    leather_type: string;
    tanning_process: TanneryProcess;
    raw_hide_origin_country: string;
    slaughterhouse_traceability_id: string;
    eudr_deforestation_free: boolean;
    lwg_rating: string;
    lwg_score_pct: number;
    icec_certificate_id: string;
    reach_svhc_compliant: boolean;
    chrome_vi_content_ppm: number;
    thickness_mm: string;
    available_qty_sqft: number;
    metadata?: Record<string, any>;
  }) => void;
  onUploadDocument: (
    batchId: string,
    doc: {
      doc_type: TanneryDocumentType;
      file_name: string;
      mime_type: string;
      data_payload: string;
      valid_until?: string;
    }
  ) => void;
  onVerifyDocument: (documentId: string) => Promise<TanneryDocumentVerifyResponse | null>;
  onImportBatches?: (importedBatches: any[]) => void;

  // Optional sub-tab selector
  initialSubTab?: SupplierHubSubTab;
}

export const SupplierManagementHub: React.FC<SupplierManagementHubProps> = ({
  vendors,
  viewerRole,
  onCreateVendor,
  onUpdateVendor,
  onDeleteVendor,
  onAddCertification,
  onDeleteCertification,
  onFetchWhereUsed,
  onLinkDistrictCompany,
  onUnlinkDistrictCompany,
  onAutoLinkDistrictCompanies,
  companies,
  selectedCompanyId,
  onSelectCompany,
  onCreateCompany,
  memberships,
  onAddMember,
  users,
  onCreateUser,
  batches,
  availableLeatherBomMaterials,
  colors,
  pimItems,
  onCreateBatch,
  onUploadDocument,
  onVerifyDocument,
  onImportBatches,
  initialSubTab = "vendors",
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SupplierHubSubTab>(initialSubTab);

  // Compute key metrics
  const activeVendorsCount = vendors.filter((v) => v.is_active !== false).length;
  const zeroEurVendorsCount = vendors.filter(
    (v) => v.paas_tier === "subcontractor_zero_eur"
  ).length;
  const validCertsVendorsCount = vendors.filter(
    (v) => v.cert_semaphore_status === "valid"
  ).length;
  const expiredCertsVendorsCount = vendors.filter(
    (v) => v.cert_semaphore_status === "expired" || v.has_expired_critical_certs
  ).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Executive Header Banner: Modulo 03 Gestione Fornitori */}
      <div className="bg-[#111111] text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-neutral-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                MODULO 04 · GESTIONE FORNITORI &amp; FILIERA 360° (FTL-TECH-027)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-neutral-300">
                Direttiva Founder FTL-TECH-027 · Architettura Unificata
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Presidio L6 Segregato
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
              Gestionale Fornitori, Filiera Distrettuale &amp; Vault Concerie
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Hub unificato di governance della filiera manifatturiera calzaturiera e pellettiera:
              Albo Fornitori e Façonisti a 360°, Onboarding Aziende Distretto PaaS &amp; Utenti accreditati,
              e Vault Conceria con tracciabilità lotti crittografici SHA-256 e conformità LWG / EUDR.
            </p>
          </div>

          {/* 4 Live Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-neutral-400">Albo Fornitori</div>
              <div className="text-2xl font-black text-white mt-0.5">{vendors.length}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">{zeroEurVendorsCount} a 0 € perpetuo</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-neutral-400">Aziende Distretto</div>
              <div className="text-2xl font-black text-white mt-0.5">{companies.length}</div>
              <div className="text-[10px] text-sky-400 font-semibold">{users.length} Utenti Accreditati</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-neutral-400">Certificazioni</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">{validCertsVendorsCount}</div>
              <div className="text-[10px] text-neutral-400">
                {expiredCertsVendorsCount > 0 ? (
                  <span className="text-rose-400 font-bold">{expiredCertsVendorsCount} Scadute</span>
                ) : (
                  "Tutte Valide"
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-neutral-400">Vault Conceria</div>
              <div className="text-2xl font-black text-amber-400 mt-0.5">{batches.length}</div>
              <div className="text-[10px] text-neutral-300 font-semibold">Lotti LWG / EUDR</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ergonomic Sub-Navigation Bar for Modulo 03 */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("vendors")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition flex items-center gap-2 ${
              activeSubTab === "vendors"
                ? "bg-[#111111] text-white shadow-sm"
                : "text-[#555555] hover:bg-[#F5F5F5] hover:text-[#111111]"
            }`}
          >
            <span>🏭</span>
            <span>ALBO FORNITORI &amp; TERZISTI 360°</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeSubTab === "vendors" ? "bg-neutral-800 text-neutral-200" : "bg-neutral-200 text-neutral-800"
              }`}
            >
              {vendors.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("district")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition flex items-center gap-2 ${
              activeSubTab === "district"
                ? "bg-[#111111] text-white shadow-sm"
                : "text-[#555555] hover:bg-[#F5F5F5] hover:text-[#111111]"
            }`}
          >
            <span>🏢</span>
            <span>AZIENDE &amp; UTENTI DISTRETTO PaaS</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeSubTab === "district" ? "bg-neutral-800 text-neutral-200" : "bg-neutral-200 text-neutral-800"
              }`}
            >
              {companies.length} aziende · {users.length} utenti
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("tannery")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition flex items-center gap-2 ${
              activeSubTab === "tannery"
                ? "bg-[#111111] text-white shadow-sm"
                : "text-[#555555] hover:bg-[#F5F5F5] hover:text-[#111111]"
            }`}
          >
            <span>📦</span>
            <span>VAULT CONCERIA &amp; TRACCIABILITÀ LOTTI</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeSubTab === "tannery" ? "bg-neutral-800 text-neutral-200" : "bg-neutral-200 text-neutral-800"
              }`}
            >
              {batches.length} lotti
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-xl text-neutral-600 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Gestione Fornitori Attiva</span>
        </div>
      </div>

      {/* SUB-VIEW 1: ALBO FORNITORI & TERZISTI 360° */}
      {activeSubTab === "vendors" && (
        <VendorHub360
          vendors={vendors}
          viewerRole={viewerRole}
          onCreateVendor={onCreateVendor}
          onUpdateVendor={onUpdateVendor}
          onDeleteVendor={onDeleteVendor}
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onFetchWhereUsed={onFetchWhereUsed}
          companies={companies}
          onLinkDistrictCompany={onLinkDistrictCompany}
          onUnlinkDistrictCompany={onUnlinkDistrictCompany}
          onAutoLinkDistrictCompanies={onAutoLinkDistrictCompanies}
        />
      )}

      {/* SUB-VIEW 2: AZIENDE & UTENTI DISTRETTO PaaS */}
      {activeSubTab === "district" && (
        <DistrictPaasManager
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={onSelectCompany}
          onCreateCompany={onCreateCompany}
          memberships={memberships}
          onAddMember={onAddMember}
          users={users}
          onCreateUser={onCreateUser}
        />
      )}

      {/* SUB-VIEW 3: VAULT CONCERIA & TRACCIABILITÀ LOTTI */}
      {activeSubTab === "tannery" && (
        <TanneryVaultManager
          batches={batches}
          companies={companies}
          availableLeatherBomMaterials={availableLeatherBomMaterials}
          vendors={vendors}
          colors={colors}
          pimItems={pimItems}
          onCreateBatch={onCreateBatch}
          onUploadDocument={onUploadDocument}
          onVerifyDocument={onVerifyDocument}
          onImportBatches={onImportBatches}
        />
      )}
    </div>
  );
};

export default SupplierManagementHub;
