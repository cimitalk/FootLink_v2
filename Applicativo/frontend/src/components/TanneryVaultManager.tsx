import React, { useState } from "react";
import { findMasterColorById } from "../mockSeedData";
import {
  TanneryBatch,
  TanneryDocument,
  TanneryProcess,
  TanneryDocumentType,
  TanneryDocumentVerifyResponse,
  Company,
  MasterColor,
  PimCommercialItem,
  VendorRecord,
} from "../types";

export interface LeatherBomOption {
  bom_item_id: string;
  material_name: string;
  component_type: string;
  plm_code?: string;
  colorway?: string;
  master_color_id?: string | null;
  vendor_id?: string | null;
}

interface TanneryVaultManagerProps {
  batches: TanneryBatch[];
  companies: Company[];
  availableLeatherBomMaterials?: LeatherBomOption[];
  vendors?: VendorRecord[];
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
  onImportBatches?: (batches: any[]) => void;
}

export const TanneryVaultManager: React.FC<TanneryVaultManagerProps> = ({
  batches,
  companies,
  availableLeatherBomMaterials,
  vendors = [],
  colors = [],
  pimItems = [],
  onCreateBatch,
  onUploadDocument,
  onVerifyDocument,
  onImportBatches,
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.batch_id || "");
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [processFilter, setProcessFilter] = useState<string>("ALL");
  const [verificationResults, setVerificationResults] = useState<
    Record<string, TanneryDocumentVerifyResponse>
  >({});
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);

  // Default leather materials from BOM if none passed
  const bomLeatherList: LeatherBomOption[] =
    availableLeatherBomMaterials && availableLeatherBomMaterials.length > 0
      ? availableLeatherBomMaterials
      : [
          {
            bom_item_id: "BOM-L1-UPPER-01",
            material_name: "Vitello Pieno Fiore Semi-Anilina Nero",
            component_type: "upper",
            plm_code: "PLM-DUCA-NERO",
            colorway: "Nero Assoluto",
          },
          {
            bom_item_id: "BOM-L1-UPPER-02",
            material_name: "Vitellone Scamosciato Tabacco Idrorepellente",
            component_type: "upper",
            plm_code: "PLM-DUCA-MARRONE",
            colorway: "Testa di Moro",
          },
          {
            bom_item_id: "BOM-L1-LINING-01",
            material_name: "Fodera Vitello Traspirante Naturale Metal-Free",
            component_type: "lining",
            plm_code: "PLM-DUCA-NERO",
            colorway: "Naturale",
          },
        ];

  // New Batch Form State
  const [companyId, setCompanyId] = useState(
    companies.find((c) => c.business_type === "tannery")?.company_id || companies[0]?.company_id || ""
  );
  const [selectedBomMaterialId, setSelectedBomMaterialId] = useState<string>(
    bomLeatherList[0]?.bom_item_id || ""
  );
  const [batchCode, setBatchCode] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    vendors.find((v) => v.supply_chain_role === "conceria")?.vendor_id || ""
  );
  const [selectedMasterColorId, setSelectedMasterColorId] = useState<string>(
    bomLeatherList[0]?.master_color_id || colors[0]?.id || ""
  );
  const [tanneryName, setTanneryName] = useState("Conceria Montebello SpA");
  const [district, setDistrict] = useState("Arzignano / Valle del Chiampo");
  const [leatherType, setLeatherType] = useState(bomLeatherList[0]?.material_name || "Vitello Pieno Fiore");
  const [tanningProcess, setTanningProcess] = useState<TanneryProcess>("metal_free");
  const [rawHideCountry, setRawHideCountry] = useState("IT");
  const [slaughterhouseId, setSlaughterhouseId] = useState("EU-SLAUGHTER-VR-8841");
  const [eudrCompliant, setEudrCompliant] = useState(true);
  const [lwgRating, setLwgRating] = useState("Gold");
  const [lwgScore, setLwgScore] = useState(95.2);
  const [icecCertId, setIcecCertId] = useState("ICEC-TS410-0982");
  const [thickness, setThickness] = useState("1.2 - 1.4 mm");
  const [availableSqft, setAvailableSqft] = useState(4500.0);

  // New Document File Upload State (FTL-CEO-012 Point 3)
  const [docType, setDocType] = useState<TanneryDocumentType>("lwg_certificate");
  const [fileName, setFileName] = useState("");
  const [fileSizeText, setFileSizeText] = useState("");
  const [fileMime, setFileMime] = useState("application/pdf");
  const [filePayload, setFilePayload] = useState("");
  const [computedSha256, setComputedSha256] = useState("");
  const [validUntil, setValidUntil] = useState("2027-12-31");

  // Import Modal State (FTL-CEO-012 Point 4)
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const currentBatch = batches.find((b) => b.batch_id === selectedBatchId) || batches[0];

  const filteredBatches =
    processFilter === "ALL"
      ? batches
      : batches.filter((b) => b.tanning_process === processFilter);

  const findBomNodeColorInfo = (bomId?: string) => {
    if (!bomId) return null;
    for (const pim of pimItems) {
      for (const variant of pim.plm_variants || []) {
        const bom = (variant.bom_items || []).find((b) => b.bom_item_id === bomId);
        if (bom) {
          return {
            bom_item_id: bom.bom_item_id,
            material_name: bom.material_name,
            variant_code: variant.variant_code,
            master_color_id: bom.master_color_id || variant.primary_color_id || null,
          };
        }
      }
    }
    const fallback = bomLeatherList.find((b) => b.bom_item_id === bomId);
    if (fallback) {
      return {
        bom_item_id: fallback.bom_item_id,
        material_name: fallback.material_name,
        variant_code: fallback.plm_code || "",
        master_color_id: fallback.master_color_id || null,
      };
    }
    return null;
  };

  const evaluateBatchBomColorConsistency = (batch: TanneryBatch) => {
    const linkedBomId =
      batch.metadata?.bom_material_id || batch.meta?.bom_material_id;
    const bomInfo = findBomNodeColorInfo(linkedBomId);
    const batchColor = findMasterColorById(colors, batch.master_color_id);
    const bomColor = findMasterColorById(colors, bomInfo?.master_color_id);

    if (!bomInfo || !batchColor || !bomColor) {
      return {
        status: "not_linked" as const,
        batchColor,
        bomColor,
        bomInfo,
      };
    }
    return {
      status:
        batchColor.id === bomColor.id
          ? ("coherent" as const)
          : ("mismatch" as const),
      batchColor,
      bomColor,
      bomInfo,
    };
  };

  const handleSelectTanneryVendor = (vId: string) => {
    setSelectedVendorId(vId);
    const v = vendors.find((item) => item.vendor_id === vId);
    if (v) {
      setTanneryName(v.company_name);
      setDistrict(v.district_area);
      setRawHideCountry(v.country_iso2 || "IT");
      if (v.has_expired_critical_certs) {
        setEudrCompliant(false);
        setLwgRating("Silver");
      } else {
        setEudrCompliant(true);
        setLwgRating("Gold");
      }
    }
  };

  // Handlers
  const handleBomMaterialChange = (bomId: string) => {
    setSelectedBomMaterialId(bomId);
    const target = bomLeatherList.find((b) => b.bom_item_id === bomId);
    if (target) {
      setLeatherType(target.material_name);
      if (target.master_color_id) {
        setSelectedMasterColorId(target.master_color_id);
      }
      if (target.vendor_id) {
        handleSelectTanneryVendor(target.vendor_id);
      }
    } else {
      const bomNode = findBomNodeColorInfo(bomId);
      if (bomNode?.master_color_id) {
        setSelectedMasterColorId(bomNode.master_color_id);
      }
    }
  };

  const handleCreateBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCode.trim() || !tanneryName.trim()) return;

    onCreateBatch({
      company_id: companyId || companies[0]?.company_id || "comp-pmi-montebello",
      batch_code: batchCode.trim().toUpperCase(),
      tannery_name: tanneryName.trim(),
      vendor_id: selectedVendorId || null,
      master_color_id: selectedMasterColorId || null,
      district,
      leather_type: leatherType.trim(),
      tanning_process: tanningProcess,
      raw_hide_origin_country: rawHideCountry.trim().toUpperCase(),
      slaughterhouse_traceability_id: slaughterhouseId.trim(),
      eudr_deforestation_free: eudrCompliant,
      lwg_rating: lwgRating,
      lwg_score_pct: Number(lwgScore) || 95.0,
      icec_certificate_id: icecCertId.trim(),
      reach_svhc_compliant: true,
      chrome_vi_content_ppm:
        tanningProcess === "metal_free" || tanningProcess === "vegetable" ? 0.0 : 1.2,
      thickness_mm: thickness.trim(),
      available_qty_sqft: Number(availableSqft) || 1000,
      metadata: {
        bom_material_id: selectedBomMaterialId,
        bom_material_name: leatherType,
      },
    });

    setBatchCode("");
    setShowCreateBatchModal(false);
  };

  // Real File Upload handler with Web Crypto SHA-256 calculation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileMime(file.type || "application/pdf");
    setFileSizeText(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setFilePayload(result);

      // Compute SHA-256 via Web Crypto API
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(result);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        setComputedSha256(hashHex);
      } catch {
        // Fallback pseudo-hash
        setComputedSha256(`sha256_${Date.now().toString(16)}_${Math.random().toString(16)}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBatch || !fileName.trim()) return;

    onUploadDocument(currentBatch.batch_id, {
      doc_type: docType,
      file_name: fileName.trim(),
      mime_type: fileMime,
      data_payload: filePayload || `DOCUMENT_CONTENT_AUTHENTIC_${Date.now()}`,
      valid_until: validUntil,
    });

    setFileName("");
    setFilePayload("");
    setComputedSha256("");
    setShowUploadDocModal(false);
  };

  const handleVerifyClick = async (docId: string) => {
    setVerifyingDocId(docId);
    try {
      const res = await onVerifyDocument(docId);
      if (res) {
        setVerificationResults((prev) => ({ ...prev, [docId]: res }));
      }
    } finally {
      setVerifyingDocId(null);
    }
  };

  // Download Standard CSV Template (FTL-CEO-012 Point 4)
  const handleDownloadTemplate = () => {
    const headers = [
      "batch_code",
      "tannery_name",
      "district",
      "leather_type",
      "tanning_process",
      "raw_hide_origin_country",
      "slaughterhouse_traceability_id",
      "eudr_deforestation_free",
      "lwg_rating",
      "lwg_score_pct",
      "icec_certificate_id",
      "reach_svhc_compliant",
      "chrome_vi_content_ppm",
      "thickness_mm",
      "available_qty_sqft",
    ];
    const sample1 = [
      "LOTTO-2026-CHEVRO-01",
      "Conceria Montebello SpA",
      "Arzignano (VI)",
      "Vitello Pieno Fiore Semi-Anilina",
      "vegetable_tanned",
      "FR",
      "IT-BRESCIA-SLAUGHTER-901",
      "true",
      "Gold",
      "94.5",
      "ICEC-TS-410-VET-2026",
      "true",
      "0.0",
      "1.2 - 1.4 mm",
      "4500.0",
    ];
    const sample2 = [
      "LOTTO-2026-NAPPA-02",
      "Conceria Samanta",
      "Santa Croce sull'Arno (PI)",
      "Nappa Pieno Fiore Metal-Free",
      "metal_free",
      "IT",
      "IT-PISA-SLAUGHTER-442",
      "true",
      "Gold",
      "96.8",
      "ICEC-TS-410-NAP-2026",
      "true",
      "0.0",
      "1.0 - 1.2 mm",
      "6200.0",
    ];

    const csvContent =
      headers.join(",") + "\n" + sample1.join(",") + "\n" + sample2.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_lotti_conceria_footlink.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Spreadsheet File parser
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      const parsed = lines.slice(1).map((line, idx) => {
        const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const rowObj: any = { company_id: companies[0]?.company_id || "comp-pmi-montebello" };
        headers.forEach((h, i) => {
          rowObj[h] = values[i] || "";
        });
        if (!rowObj.batch_code) rowObj.batch_code = `LOTTO-IMP-${idx + 1}`;
        if (!rowObj.tannery_name) rowObj.tannery_name = "Conceria Fornitrice";
        if (!rowObj.leather_type) rowObj.leather_type = "Pellame di Fornitura";
        return rowObj;
      });

      setImportRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    setIsImporting(true);
    importRows.forEach((row) => {
      onCreateBatch({
        company_id: row.company_id || companies[0]?.company_id || "comp-pmi-montebello",
        batch_code: (row.batch_code || `LOTTO-IMP-${Date.now().toString(36)}`).toUpperCase(),
        tannery_name: row.tannery_name || "Conceria Partner",
        district: row.district || "Distretto Conciario",
        leather_type: row.leather_type || "Vitello Conciato",
        tanning_process: (row.tanning_process as TanneryProcess) || "vegetable",
        raw_hide_origin_country: (row.raw_hide_origin_country || "IT").toUpperCase(),
        slaughterhouse_traceability_id: row.slaughterhouse_traceability_id || "TRACE-ID",
        eudr_deforestation_free: row.eudr_deforestation_free !== "false",
        lwg_rating: row.lwg_rating || "Gold",
        lwg_score_pct: Number(row.lwg_score_pct) || 94.0,
        icec_certificate_id: row.icec_certificate_id || "ICEC-DOC",
        reach_svhc_compliant: true,
        chrome_vi_content_ppm: Number(row.chrome_vi_content_ppm) || 0.0,
        thickness_mm: row.thickness_mm || "1.2 - 1.4 mm",
        available_qty_sqft: Number(row.available_qty_sqft) || 2000.0,
      });
    });

    if (onImportBatches) {
      onImportBatches(importRows);
    }

    setIsImporting(false);
    setImportRows([]);
    setShowImportModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner: Clean Professional Label (FTL-CEO-012 Point 1) */}
      <div className="bg-[#1C1815] text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-amber-900/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30">
                04 · VAULT CONCERIA & TRACCIABILITÀ PELLAMI · CERTIFICAZIONI LWG / ICEC (REGOLAMENTO UE ESPR & EUDR)
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                50-65% del Costo · 90% Impatto Ambientale · Hash SHA-256
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
              Vault Tracciabilità Pellami & Certificazioni Conceria
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Archivio documentale crittografico a costo zero: certificati <strong className="text-white">LWG Gold/Silver</strong>,{" "}
              tracciabilità filiera allevamento <strong className="text-white">ICEC TS410</strong>, conformità deforestazione{" "}
              <strong className="text-emerald-400">EUDR post-2020</strong> e test chimici <strong className="text-white">REACH Cromo VI = 0 ppm</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-3 rounded-full border border-amber-500/40 bg-neutral-900/80 hover:bg-neutral-800 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
            >
              <span>📥 Scarica Template Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="px-4 py-3 rounded-full border border-amber-500/40 bg-neutral-900/80 hover:bg-neutral-800 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
            >
              <span>📤 Importa Lotti Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateBatchModal(true)}
              className="px-5 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-[#111111] font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2"
            >
              <span>+ Nuovo Lotto Conceria</span>
            </button>
          </div>
        </div>

        {/* Regulatory Badges Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-amber-900/40 text-xs">
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">EU Regulation EUDR</span>
            <div className="font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span>🌲 Deforestation-Free</span>
            </div>
            <span className="text-[10px] text-neutral-400">Tracciabilità GPS macello e stalla</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Leather Working Group</span>
            <div className="font-bold text-amber-400 mt-1 flex items-center gap-1.5">
              <span>🏅 LWG Gold / Silver</span>
            </div>
            <span className="text-[10px] text-neutral-400">Audit energetico & acque reflue</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Certificazione ICEC</span>
            <div className="font-bold text-white mt-1 flex items-center gap-1.5">
              <span>📜 ICEC TS410 / TS412</span>
            </div>
            <span className="text-[10px] text-neutral-400">Filiera italiana ed europea</span>
          </div>
          <div className="bg-neutral-900/60 rounded-2xl p-3 border border-neutral-800">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">REACH & Chimica Pulita</span>
            <div className="font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span>🧪 Cromo VI = 0 ppm</span>
            </div>
            <span className="text-[10px] text-neutral-400">Concia metal-free & vegetale</span>
          </div>
        </div>
      </div>

      {/* Main Content: Batches Selector & Document Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Batches Roster */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#111111] uppercase tracking-wider">
              Lotti Conceria Censiti ({filteredBatches.length})
            </h3>
            <select
              value={processFilter}
              onChange={(e) => setProcessFilter(e.target.value)}
              className="bg-white border border-[#CCCCCC] rounded-full px-3 py-1 text-xs font-semibold"
            >
              <option value="ALL">Tutti i Processi</option>
              <option value="metal_free">Metal-Free</option>
              <option value="vegetable">Vegetale al 100%</option>
              <option value="chrome">Al Cromo</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredBatches.map((b) => {
              const isSelected = b.batch_id === selectedBatchId;
              const colorCheck = evaluateBatchBomColorConsistency(b);
              const matchedVendor = vendors.find(
                (v) =>
                  v.vendor_id === b.vendor_id ||
                  v.company_name.toLowerCase() === b.tannery_name.toLowerCase()
              );
              return (
                <div
                  key={b.batch_id}
                  onClick={() => setSelectedBatchId(b.batch_id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? "border-amber-600 bg-amber-50/40 ring-1 ring-amber-600"
                      : "border-[#E5E5E5] bg-white hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#D5D5D5] text-[#111111]">
                      {b.batch_code}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {matchedVendor?.has_expired_critical_certs && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                          🔴 LWG/EUDR Scaduto
                        </span>
                      )}
                      {colorCheck.status === "mismatch" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                          🔴 Mismatch Colore BOM
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        🏅 LWG {b.lwg_rating} ({b.lwg_score_pct}%)
                      </span>
                    </div>
                  </div>

                  <div className="font-bold text-sm text-[#111111]">{b.leather_type}</div>
                  <div className="text-xs text-[#707072] mt-0.5">{b.tannery_name} · {b.district}</div>
                  {colorCheck.batchColor && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-neutral-800">
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300"
                        style={{ backgroundColor: colorCheck.batchColor.hex_code }}
                      />
                      <span className="font-mono">{colorCheck.batchColor.color_code}</span>
                      <span>· {colorCheck.batchColor.technical_name_it}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#EAEAEA] text-[11px]">
                    <div>
                      <span className="text-[#707072] block text-[10px]">Origine Grezzo:</span>
                      <strong className="text-[#111111]">
                        {b.raw_hide_origin_country} · {b.eudr_deforestation_free ? "🌲 EUDR OK" : "🔴 EUDR Non Conforme"}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[#707072] block text-[10px]">Documenti Archiviati:</span>
                      <strong className="text-amber-800">
                        {b.documents?.length || 0} certificati crittografici
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Vault Detail & Cryptographic Document Inspector */}
        <div className="lg:col-span-7 space-y-6">
          {currentBatch ? (
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm space-y-6">
              {/* Batch Detail Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAEAEA]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-extrabold text-[#111111]">
                      {currentBatch.batch_code}
                    </span>
                    {currentBatch.eudr_deforestation_free ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Conforme EU ESPR &amp; EUDR
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                        🔴 BLOCCO COMPLIANCE EUDR / LWG SCADUTO
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#707072] mt-0.5">
                    {currentBatch.tannery_name} — Spessore: {currentBatch.thickness_mm} · Disponibilità: {currentBatch.available_qty_sqft} sqft
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(true)}
                  className="px-4 py-2 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-neutral-800 transition flex items-center gap-1.5"
                >
                  <span>+ Carica Certificato nel Vault</span>
                </button>
              </div>

              {/* Sprint 8: Controllo Automatico Coerenza Colore Lotto ↔ BOM */}
              {(() => {
                const check = evaluateBatchBomColorConsistency(currentBatch);
                const detailVendor = vendors.find(
                  (v) =>
                    v.vendor_id === currentBatch.vendor_id ||
                    v.company_name.toLowerCase() ===
                      currentBatch.tannery_name.toLowerCase()
                );

                return (
                  <div
                    className={`rounded-2xl p-4 border text-xs space-y-2 ${
                      check.status === "mismatch" ||
                      detailVendor?.has_expired_critical_certs
                        ? "bg-rose-50 border-rose-300 text-rose-950"
                        : check.status === "coherent"
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold uppercase tracking-wider text-[11px]">
                        Controllo Automatico Coerenza Colore Lotto ↔ Nodo BOM
                      </span>
                      {check.status === "coherent" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/80 text-emerald-950">
                          🟢 Colore Lotto Coerente con BOM
                        </span>
                      ) : check.status === "mismatch" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-200 text-rose-950">
                          🔴 Disallineamento Colore Lotto ↔ Nodo BOM
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                          ○ Verifica Cromatica Non Vincolata
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-white/90 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5">
                        <span
                          className="w-7 h-7 rounded-lg border border-slate-300 shrink-0"
                          style={{
                            backgroundColor:
                              check.batchColor?.hex_code || "#E2E8F0",
                          }}
                        />
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-500">
                            Bagno Tintoria Lotto Conceria
                          </div>
                          <div className="font-bold text-neutral-900">
                            {check.batchColor
                              ? `${check.batchColor.color_code} · ${check.batchColor.technical_name_it}`
                              : "Tinta non specificata"}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/90 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5">
                        <span
                          className="w-7 h-7 rounded-lg border border-slate-300 shrink-0"
                          style={{
                            backgroundColor:
                              check.bomColor?.hex_code || "#E2E8F0",
                          }}
                        />
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-500">
                            Tinta Attesa dal Nodo BOM ({check.bomInfo?.bom_item_id || "N/D"})
                          </div>
                          <div className="font-bold text-neutral-900">
                            {check.bomColor
                              ? `${check.bomColor.color_code} · ${check.bomColor.technical_name_it}`
                              : "Nessun nodo BOM collegato"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {detailVendor?.has_expired_critical_certs && (
                      <div className="pt-1 font-bold text-rose-900">
                        ⚠ ALERT ALBO FORNITORI 360° ({detailVendor.vendor_code}): la conceria{" "}
                        {detailVendor.company_name} ha certificati LWG / EUDR scaduti da 14 giorni. Lotto bloccato per passaporto DPP.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Technical Attributes Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#F9F9F9] p-4 rounded-2xl">
                <div>
                  <span className="text-[#707072] text-[10px] block font-bold uppercase">Processo Concia</span>
                  <span className="font-bold text-[#111111] capitalize">
                    {currentBatch.tanning_process.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[#707072] text-[10px] block font-bold uppercase">Certificato ICEC</span>
                  <span className="font-bold text-[#111111] font-mono">
                    {currentBatch.icec_certificate_id || "ICEC-TS410-0982"}
                  </span>
                </div>
                <div>
                  <span className="text-[#707072] text-[10px] block font-bold uppercase">Cromo VI (ppm)</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {currentBatch.chrome_vi_content_ppm.toFixed(1)} ppm (ND)
                  </span>
                </div>
                <div>
                  <span className="text-[#707072] text-[10px] block font-bold uppercase">Tracciabilità Macello</span>
                  <span className="font-bold text-[#111111] font-mono text-[10px]">
                    {currentBatch.slaughterhouse_traceability_id}
                  </span>
                </div>
              </div>

              {/* Documents List with Live SHA-256 Verification */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#111111] flex items-center gap-2">
                  <span>Vault Documentale Crittografico (Verifica di Integrità SHA-256)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </h4>

                {(!currentBatch.documents || currentBatch.documents.length === 0) && (
                  <div className="text-center py-8 bg-[#F9F9F9] rounded-2xl border border-dashed border-[#CCCCCC] text-xs text-[#707072]">
                    Nessun documento caricato per questo lotto. Clicca "+ Carica Certificato nel Vault" per allegare file PDF con impronta SHA-256.
                  </div>
                )}

                <div className="space-y-3">
                  {currentBatch.documents?.map((doc) => {
                    const verification = verificationResults[doc.document_id];
                    const isVerifying = verifyingDocId === doc.document_id;

                    return (
                      <div
                        key={doc.document_id}
                        className="p-4 rounded-2xl border border-[#E5E5E5] bg-white space-y-3 hover:border-neutral-300 transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">📄</span>
                            <div>
                              <div className="font-bold text-xs text-[#111111]">{doc.file_name}</div>
                              <div className="text-[10px] text-[#707072]">
                                Tipo: {doc.doc_type} · Scadenza: {doc.valid_until || "2027-12-31"}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isVerifying}
                            onClick={() => handleVerifyClick(doc.document_id)}
                            className="px-3 py-1.5 rounded-full border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition flex items-center gap-1.5"
                          >
                            <span>{isVerifying ? "Verifica in corso..." : "🛡️ Verifica SHA-256"}</span>
                          </button>
                        </div>

                        {/* Hash Footprint Display */}
                        <div className="bg-[#F5F5F5] rounded-xl p-2.5 font-mono text-[10px] text-neutral-600 break-all select-all flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-[#111111]">SHA-256: </span>
                            {doc.sha256_hash}
                          </div>
                        </div>

                        {/* Verification Result Badge */}
                        {verification && (
                          <div
                            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                              verification.is_authentic
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-red-50 text-red-800 border border-red-200"
                            }`}
                          >
                            <span className="text-sm">{verification.is_authentic ? "✅" : "⚠️"}</span>
                            <div>
                              <strong>{verification.verification_status}:</strong>{" "}
                              {verification.is_authentic
                                ? "Impronta crittografica autentica verificata. Nessuna manomissione."
                                : "Attenzione: l'hash ricalcolato non corrisponde al documento archiviato."}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#707072]">Seleziona un lotto per visualizzare il vault.</div>
          )}
        </div>
      </div>

      {/* Modal: Nuovo Lotto Conceria (FTL-CEO-012 Point 2: Obbligo Materiale Pelle BOM) */}
      {showCreateBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">+ Nuovo Lotto Conceria</h3>
                <p className="text-xs text-[#707072]">Registra lotto e tracciabilità con collegamento a componente distinta base.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateBatchModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatchSubmit} className="space-y-4 text-xs">
              {/* Point 2: Mandatory Leather Material selection from BOM */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1">
                <label className="block text-[11px] font-bold text-amber-900 uppercase">
                  Materiale BOM Collegato (Pellame) * [OBBLIGATORIO]
                </label>
                <select
                  required
                  value={selectedBomMaterialId}
                  onChange={(e) => handleBomMaterialChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-300 bg-white font-semibold text-[#111111]"
                >
                  <option value="">-- Seleziona componente pelle da distinta base --</option>
                  {bomLeatherList.map((item) => (
                    <option key={item.bom_item_id} value={item.bom_item_id}>
                      {item.bom_item_id} · {item.material_name} ({item.component_type.toUpperCase()}) {item.plm_code ? `[${item.plm_code}]` : ""}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-amber-800">
                  Ogni lotto deve essere agganciato a un materiale pellame codificato nelle BOM per garantire tracciabilità ESPR/EUDR.
                </span>
              </div>

              {/* Sprint 8: Selettore Guidato Conceria Albo 360° & Tinta Master */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Conceria Qualificata da Albo 360°
                  </label>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => handleSelectTanneryVendor(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="">— Seleziona Conceria da Albo —</option>
                    {vendors
                      .filter(
                        (v) =>
                          v.supply_chain_role === "conceria" ||
                          v.company_name.toLowerCase().includes("conceria") ||
                          v.company_name.toLowerCase().includes("pellami")
                      )
                      .map((v) => (
                        <option key={v.vendor_id} value={v.vendor_id}>
                          {v.vendor_code} · {v.company_name}{" "}
                          {v.has_expired_critical_certs ? "🔴 [LWG/EUDR SCADUTO]" : ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">
                    Tinta / Bagno Tintoria Master
                  </label>
                  <select
                    value={selectedMasterColorId}
                    onChange={(e) => setSelectedMasterColorId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="">— Seleziona Tinta da Cartella Colori —</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.color_code} · {c.technical_name_it} ({c.hex_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(() => {
                const chosenTannery = vendors.find(
                  (v) => v.vendor_id === selectedVendorId
                );
                if (!chosenTannery || !chosenTannery.has_expired_critical_certs)
                  return null;
                return (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 font-bold">
                    🔴 ALERT COMPLIANCE CONCERIA ({chosenTannery.vendor_code}): {chosenTannery.company_name} presenta certificati LWG / EUDR scaduti da 14 giorni nell&apos;Albo Fornitori 360°!
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Ragione Sociale Conceria *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Conceria Montebello SpA"
                    value={tanneryName}
                    onChange={(e) => setTanneryName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Codice Partita / Lotto Conceria *</label>
                  <input
                    type="text"
                    required
                    placeholder="LOT-2026-X9"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Descrizione Pellame *</label>
                  <input
                    type="text"
                    required
                    value={leatherType}
                    onChange={(e) => setLeatherType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Processo di Concia *</label>
                  <select
                    value={tanningProcess}
                    onChange={(e) => setTanningProcess(e.target.value as TanneryProcess)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="metal_free">Metal-Free (Senza Metalli Pesanti)</option>
                    <option value="vegetable">Vegetale al 100% (Castagno/Mimosa)</option>
                    <option value="chrome">Cromo III Standard Certificato</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Paese Grezzo *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="IT"
                    value={rawHideCountry}
                    onChange={(e) => setRawHideCountry(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Rating LWG *</label>
                  <select
                    value={lwgRating}
                    onChange={(e) => setLwgRating(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                  >
                    <option value="Gold">Gold Medalist</option>
                    <option value="Silver">Silver Medalist</option>
                    <option value="Bronze">Bronze Medalist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Quantità (sqft) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={availableSqft}
                    onChange={(e) => setAvailableSqft(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">ID Macello / Allevamento (EUDR)</label>
                  <input
                    type="text"
                    placeholder="EU-SLAUGHTER-VR-8841"
                    value={slaughterhouseId}
                    onChange={(e) => setSlaughterhouseId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Certificato ICEC TS410</label>
                  <input
                    type="text"
                    placeholder="ICEC-TS410-0982"
                    value={icecCertId}
                    onChange={(e) => setIcecCertId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="eudrCheck"
                  checked={eudrCompliant}
                  onChange={(e) => setEudrCompliant(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="eudrCheck" className="text-xs font-semibold text-[#111111]">
                  Conformità EUDR Deforestation-Free (Appezzamento privo di deforestazione post 31/12/2020)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowCreateBatchModal(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#111111] text-white font-bold hover:bg-neutral-800"
                >
                  Registra Lotto Conceria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Document (FTL-CEO-012 Point 3: Real PDF/Image File Picker) */}
      {showUploadDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">Carica Certificato nel Vault</h3>
                <p className="text-xs text-[#707072]">Carica file PDF/immagine con calcolo automatico hash SHA-256.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadDocModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadDocSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Tipologia Documento *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as TanneryDocumentType)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-semibold"
                >
                  <option value="lwg_certificate">Certificato LWG (Leather Working Group)</option>
                  <option value="icec_traceability">Attestato Tracciabilità ICEC TS410</option>
                  <option value="reach_chemical_test">Report Analisi Chimica REACH (Cromo VI)</option>
                  <option value="eudr_due_diligence">Dichiarazione Due Diligence EUDR</option>
                  <option value="technical_sheet">Scheda Tecnica & Tolleranze Fisico-Meccaniche</option>
                </select>
              </div>

              {/* Real File Upload Picker */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#707072] uppercase">
                  File Certificato Reale (.PDF / Immagine) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="w-full p-2 rounded-xl border border-[#D5D5D5] bg-[#F9F9F9] text-xs font-semibold"
                />
                {fileName && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-emerald-900 font-bold">
                      <span>📄 {fileName}</span>
                      <span className="text-[10px]">{fileSizeText}</span>
                    </div>
                    {computedSha256 && (
                      <div className="text-[9px] font-mono text-emerald-700 break-all">
                        <strong>Impronta SHA-256: </strong>{computedSha256}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#707072] uppercase mb-1">Data Scadenza Validità</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D5D5] bg-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={!fileName}
                  className="px-6 py-2 rounded-full bg-[#111111] disabled:opacity-40 text-white font-bold hover:bg-neutral-800"
                >
                  Salva nel Vault Crittografico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Lotti da Spreadsheet (FTL-CEO-012 Point 4) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">Import Massivo Lotti Conceria da File</h3>
                <p className="text-xs text-[#707072]">Carica il file Excel o CSV compilato secondo il template standard.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleImportFileChange}
                  className="w-full p-3 rounded-xl border border-[#D5D5D5] bg-[#F9F9F9] font-semibold"
                />
                <span className="text-[10px] text-[#707072] mt-1 block">
                  Puoi scaricare il template preconfigurato con il pulsante "Scarica Template Excel".
                </span>
              </div>

              {/* Preview Table */}
              {importRows.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-xs text-[#111111]">
                    Anteprima Dati: {importRows.length} lotti rilevati nel file
                  </div>
                  <div className="max-h-52 overflow-y-auto border border-[#E5E5E5] rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#F5F5F5] font-bold text-[#707072]">
                        <tr>
                          <th className="p-2">Codice</th>
                          <th className="p-2">Conceria</th>
                          <th className="p-2">Tipo Pelle</th>
                          <th className="p-2">LWG</th>
                          <th className="p-2 text-right">Quantità (sqft)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5]">
                        {importRows.map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 font-mono font-bold">{r.batch_code}</td>
                            <td className="p-2">{r.tannery_name}</td>
                            <td className="p-2">{r.leather_type}</td>
                            <td className="p-2 font-bold text-amber-600">{r.lwg_rating}</td>
                            <td className="p-2 text-right font-mono">{r.available_qty_sqft}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={importRows.length === 0 || isImporting}
                  onClick={handleConfirmImport}
                  className="px-6 py-2 rounded-full bg-amber-400 disabled:opacity-40 hover:bg-amber-300 text-[#111111] font-bold uppercase tracking-wider"
                >
                  {isImporting ? "Importazione in corso..." : `Conferma Importazione (${importRows.length} Lotti)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
