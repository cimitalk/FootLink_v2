import React, { useEffect, useState } from "react";
import { BomThreeLevelTree } from "./components/BomThreeLevelTree";
import { LiveDppPassportGenerator } from "./components/LiveDppPassportGenerator";
import { PimToPlmBridge } from "./components/PimToPlmBridge";
import { SubcontractorMobilePortal } from "./components/SubcontractorMobilePortal";
import { INITIAL_PIM_ITEMS, synthesizeClientDpp } from "./mockSeedData";
import {
  BomItem,
  DigitalProductPassport,
  PimCommercialItem,
  PlmLifecycleStatus,
  PlmProductionVariant,
} from "./types";

const API_BASE = "http://127.0.0.1:8000";

export const App: React.FC = () => {
  const [pimItems, setPimItems] = useState<PimCommercialItem[]>(INITIAL_PIM_ITEMS);
  const [selectedPimId, setSelectedPimId] = useState<string>(
    INITIAL_PIM_ITEMS[0].pim_item_id
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    INITIAL_PIM_ITEMS[0].plm_variants[0].plm_variant_id
  );
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [dppData, setDppData] = useState<DigitalProductPassport>(() =>
    synthesizeClientDpp(INITIAL_PIM_ITEMS[0])
  );

  // Sync with FastAPI backend if running on localhost:8000
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/pim-items`)
      .then((res) => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then((items: PimCommercialItem[]) => {
        if (items && items.length > 0) {
          setPimItems(items);
          setSelectedPimId(items[0].pim_item_id);
          setSelectedVariantId(items[0].plm_variants[0]?.plm_variant_id || "");
          setBackendConnected(true);
        }
      })
      .catch(() => {
        setBackendConnected(false);
      });
  }, []);

  const currentPim =
    pimItems.find((i) => i.pim_item_id === selectedPimId) || pimItems[0];
  const currentVariant =
    currentPim.plm_variants.find((v) => v.plm_variant_id === selectedVariantId) ||
    currentPim.plm_variants[0];

  useEffect(() => {
    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/pim-items/${currentPim.pim_item_id}/dpp-preview`)
        .then((res) => res.json())
        .then((dpp: DigitalProductPassport) => setDppData(dpp))
        .catch(() => setDppData(synthesizeClientDpp(currentPim)));
    } else {
      setDppData(synthesizeClientDpp(currentPim));
    }
  }, [currentPim, backendConnected]);

  const handleSelectPim = (item: PimCommercialItem) => {
    setSelectedPimId(item.pim_item_id);
    if (item.plm_variants.length > 0) {
      setSelectedVariantId(item.plm_variants[0].plm_variant_id);
    }
  };

  const handleSelectVariant = (variant: PlmProductionVariant) => {
    setSelectedVariantId(variant.plm_variant_id);
  };

  const handleAddVariant = (payload: {
    variant_code: string;
    colorway_name: string;
    size_range: string;
    last_or_pattern_code: string;
    lifecycle_status: PlmLifecycleStatus;
  }) => {
    const newVar: PlmProductionVariant = {
      plm_variant_id: `PLM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      pim_item_id: currentPim.pim_item_id,
      ...payload,
      bom_items: [
        {
          bom_item_id: `BOM-L1-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          level: 1,
          parent_bom_item_id: null,
          component_type: "upper",
          material_name: `Tomaia Certificata ${payload.colorway_name}`,
          supplier_name: "Conceria Certificata Distretto IT",
          origin_country_iso2: "IT",
          unit_of_measure: "sqft",
          unit_consumption: 3.1,
          waste_percentage: 6.5,
          recycled_content_pct: 30,
          certifications: ["LWG Gold", "REACH"],
        },
      ],
      subcontractor_assignments: [
        {
          assignment_id: `SUB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          subcontractor_name: "Laboratorio Partner Distretto",
          district: "Fermo-Macerata",
          phase: "stitching_upper",
          material_lot_code: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
          completed: false,
          confirmed_at: null,
        },
      ],
    };

    const updatedItems = pimItems.map((item) =>
      item.pim_item_id === currentPim.pim_item_id
        ? { ...item, plm_variants: [...item.plm_variants, newVar] }
        : item
    );
    setPimItems(updatedItems);
    setSelectedVariantId(newVar.plm_variant_id);
  };

  const handleAddBomItem = (newBom: BomItem) => {
    const updatedItems = pimItems.map((item) => {
      if (item.pim_item_id !== currentPim.pim_item_id) return item;
      return {
        ...item,
        plm_variants: item.plm_variants.map((v) =>
          v.plm_variant_id === currentVariant.plm_variant_id
            ? { ...v, bom_items: [...v.bom_items, newBom] }
            : v
        ),
      };
    });
    setPimItems(updatedItems);
  };

  const handleConfirmSubcontractorStep = (
    assignmentId: string,
    updatedLotCode: string
  ) => {
    const nowIso = new Date().toISOString();
    const updatedItems = pimItems.map((item) => {
      if (item.pim_item_id !== currentPim.pim_item_id) return item;
      return {
        ...item,
        plm_variants: item.plm_variants.map((v) => {
          if (v.plm_variant_id !== currentVariant.plm_variant_id) return v;
          return {
            ...v,
            subcontractor_assignments: v.subcontractor_assignments.map((a) =>
              a.assignment_id === assignmentId
                ? {
                    ...a,
                    material_lot_code: updatedLotCode,
                    completed: true,
                    confirmed_at: nowIso,
                  }
                : a
            ),
          };
        }),
      };
    });
    setPimItems(updatedItems);

    if (backendConnected) {
      fetch(`${API_BASE}/api/v1/subcontractor-portal/confirm-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pim_item_id: currentPim.pim_item_id,
          plm_variant_id: currentVariant.plm_variant_id,
          assignment_id: assignmentId,
          material_lot_code: updatedLotCode,
        }),
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center font-black text-slate-950 text-lg">
              FL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-white">
                  Footlink PLM + PIM Core OS
                </h1>
                <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700/70 px-2 py-0.5 rounded-full font-bold">
                  Free-Tier 0 € Infrastructure
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ponte 1 PIM ↔ N PLM · Distinta Base 3 Livelli · Portale Terzisti "3 Clic a 0 €" · Passaporto Digitale UE (ESPR)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-3 py-1 rounded-full font-semibold border ${
                backendConnected
                  ? "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                  : "bg-sky-950/80 border-sky-700 text-sky-300"
              }`}
            >
              {backendConnected
                ? "🟢 FastAPI + SQLite (footlink.db) Connesso"
                : "⚡ Modalità Interattiva Live (SQLite Seed Sync)"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 1. Core Bridge: 1 PIM Commercial Item <-> N PLM Production Variants */}
        <PimToPlmBridge
          pimItems={pimItems}
          selectedPim={currentPim}
          selectedVariant={currentVariant}
          onSelectPim={handleSelectPim}
          onSelectVariant={handleSelectVariant}
          onAddVariant={handleAddVariant}
        />

        {/* 2. Middle Split: 3-Level BOM Tree (Left 7 cols) + 3-Click 0 EUR Subcontractor Portal (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <BomThreeLevelTree
              variant={currentVariant}
              onAddBomItem={handleAddBomItem}
            />
          </div>
          <div className="lg:col-span-5">
            <SubcontractorMobilePortal
              variant={currentVariant}
              onConfirmStep={handleConfirmSubcontractorStep}
            />
          </div>
        </div>

        {/* 3. Live EU Digital Product Passport (DPP / ESPR) & Navigable QR Code Generator */}
        <LiveDppPassportGenerator pimItem={currentPim} dpp={dppData} />
      </main>
    </div>
  );
};

export default App;
