import React from "react";
import { evaluateClientDataQuality } from "../mockSeedData";
import { FractalWaveBackground } from "./FractalWaveBackground";
import {
  ActiveWorkspaceModule,
  PimCommercialItem,
  ViewerSecurityRole,
} from "../types";

interface FootlinkHomeHubProps {
  pimItems: PimCommercialItem[];
  activeModule: ActiveWorkspaceModule;
  onNavigateModule: (mod: ActiveWorkspaceModule) => void;
  viewerRole: ViewerSecurityRole;
  onChangeViewerRole: (role: ViewerSecurityRole) => void;
}

export const FootlinkHomeHub: React.FC<FootlinkHomeHubProps> = ({
  pimItems,
  onNavigateModule,
  viewerRole,
  onChangeViewerRole,
}) => {
  const totalPim = pimItems.length;
  const totalPlm = pimItems.reduce((acc, i) => acc + i.plm_variants.length, 0);
  const totalBomNodes = pimItems.reduce(
    (acc, i) =>
      acc + i.plm_variants.reduce((vAcc, v) => vAcc + v.bom_items.length, 0),
    0
  );
  const allSubs = pimItems.flatMap((i) =>
    i.plm_variants.flatMap((v) => v.subcontractor_assignments)
  );
  const confirmedSubs = allSubs.filter((s) => s.completed).length;
  const avgDataQuality =
    totalPim > 0
      ? Math.round(
          pimItems.reduce(
            (acc, i) => acc + evaluateClientDataQuality(i).data_quality_score,
            0
          ) / totalPim
        )
      : 100;

  const modules = [
    {
      num: "01",
      id: "district_paas" as ActiveWorkspaceModule,
      tag: "DISTRICT PaaS & UTENTI (SPRINT 6)",
      title: "PIATTAFORMA PaaS DISTRETTUALE A 3 LIVELLI",
      desc: "Governance federata per il distretto calzaturiero e pellettiero: onboarding guidato per Brand Enterprise, PMI manifatturiere/concerie e Piccoli Laboratori Façonisti a canone 0 € perpetuo.",
      metric: "3 Tiers · Segregazione L6 · Multi-Company",
      cta: "Apri Hub PaaS Distrettuale",
    },
    {
      num: "02",
      id: "products" as ActiveWorkspaceModule,
      tag: "PLM & INGEGNERIA FABBRICA (FTL-CEO-009)",
      title: "PRODOTTI PLM & DISTINTE BASE A 3 LIVELLI",
      desc: "Area tecnica autonoma per la modelleria di fabbrica: griglia avanzata varianti, cartamodelli e forme, inserimento rapido in 60s, albero distinta base BOM integrato ed export Excel istantaneo.",
      metric: `${totalPlm} Varianti PLM · BOM 3 Livelli`,
      cta: "Apri Prodotti PLM & BOM",
    },
    {
      num: "03",
      id: "pim_catalog" as ActiveWorkspaceModule,
      tag: "PIM CATALOGO & FEED E-COMMERCE (FTL-CEO-010)",
      title: "PIM CATALOGO COMMERCIALE & FEED MULTI-CANALE",
      desc: "Gestione commerciale omnicanale: default 1:1 speculare da PLM, composizione look/bundle aggregati 1:N, listini wholesale/retail e syndication feed live per Shopify Plus, NuORDER e JOOR.",
      metric: `${totalPim} Master SKU · Feed Live Shopify/B2B`,
      cta: "Apri PIM Catalogo & Feed",
    },
    {
      num: "04",
      id: "tannery_vault" as ActiveWorkspaceModule,
      tag: "PELLAMI & CONCERIA ESPR/EUDR (FTL-CEO-012)",
      title: "VAULT TRACCIABILITÀ PELLAMI & CERTIFICAZIONI",
      desc: "Tracciabilità della concia e conformità EUDR/ESPR: lotti pelle collegati obbligatoriamente a BOM, upload reale file PDF/immagini con hash SHA-256 e importazione massiva da file Excel con template.",
      metric: "LWG Gold · Upload PDF Reale · Import Excel",
      cta: "Esplora Vault Conceria",
    },
    {
      num: "05",
      id: "seasons_collections" as ActiveWorkspaceModule,
      tag: "CALENDARIO MODA & FASHION",
      title: "STAGIONI & COLLEZIONI ANNIDATE",
      desc: "Gestione temporale del campionario: 1 Stagione (es. P/E 2026, A/I 2026-27) racchiude N Collezioni (Main Collection, Fashion Runway, Capsule Limited Edition) che governano i prodotti.",
      metric: "P/E 2026 · A/I 2026/27 Attive",
      cta: "Gestisci Calendario Moda",
    },
    {
      num: "06",
      id: "domain_registries" as ActiveWorkspaceModule,
      tag: "TABELLE MASTER CONDIVISE",
      title: "ANAGRAFICHE DI DOMINIO PIM & PLM",
      desc: "Hub centralizzato tabelle di dominio: categorie merceologiche, canali retail, codici doganali HS, fasi di lavorazione, tipi componenti BOM, fornitori e laboratori a 0 € con inline edit.",
      metric: "Master Registries PIM & PLM",
      cta: "Gestisci Tabelle Anagrafiche",
    },
    {
      num: "07",
      id: "schema_studio" as ActiveWorkspaceModule,
      tag: "FOUNDER STUDIO & NO-CODE",
      title: "MODELLO DATI FLESSIBILE & ESTENSIONI",
      desc: "Pannello interattivo per il Founder: ispezione e aggiunta dinamica di attributi personalizzati su PIM, PLM e BOM con riflesso immediato in UI e API senza downtime DDL.",
      metric: "Schema Estensibile Live",
      cta: "Apri Data Model Studio",
    },
    {
      num: "08",
      id: "subcontractor_portal" as ActiveWorkspaceModule,
      tag: "ZERO-FRICTION NETWORK",
      title: "PORTALE MOBILE TERZISTI '3 CLIC A 0 €'",
      desc: "Interfaccia smartphone ultra-leggera per tomaifici, suolifici, pelletterie e façonisti: conferma fase produttiva e lotto materiale a costo licenza 0 € per sempre.",
      metric: `${confirmedSubs}/${allSubs.length} Fasi Tracciate a 0 €`,
      cta: "Apri Portale Terzisti 0 €",
    },
    {
      num: "09",
      id: "dpp_passport" as ActiveWorkspaceModule,
      tag: "REGOLAMENTO UE 2024/1781",
      title: "PASSAPORTO DIGITALE UE (DPP) & QR LIVE",
      desc: "Generazione istantanea del Passaporto Digitale con cartellino QR SVG navigabile e conformità ESPR: vista pubblica consumatore vs ispettiva doganale.",
      metric: "100% Conformità ESPR · QR Live",
      cta: "Genera Passaporto DPP",
    },
  ];

  return (
    <section className="space-y-8">
      {/* Spotlight Hero Block with Computer Graphics Fractal Animated Wave Background (FTL-TECH-015) */}
      <div className="relative overflow-hidden bg-[#0a0a0a] text-white rounded-2xl p-6 sm:p-10 border border-[#1f242e] shadow-2xl">
        <FractalWaveBackground />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/15">
            <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shadow-[0_0_8px_#10B981]" />
              <span>HOME OPERATIVA FOOTLINK OS · DESIGN SYSTEM V2.0</span>
            </div>

            {/* L6 Security Role Switcher */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1 rounded-full">
              <button
                type="button"
                onClick={() => onChangeViewerRole("brand")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  viewerRole === "brand"
                    ? "bg-white text-[#111111]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Vista Brand / PMI (Costi L6 Visibili)
              </button>
              <button
                type="button"
                onClick={() => onChangeViewerRole("subcontractor")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  viewerRole === "subcontractor"
                    ? "bg-white text-[#111111]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Vista Terzista 0 € (Costi Oscurati L6)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-7 items-end">
            <div className="lg:col-span-8 space-y-4">
              <h2 className="display-title text-4xl sm:text-6xl text-white tracking-tight">
                DAL LABORATORIO AL PASSAPORTO DIGITALE UE. IN UN UNICO SISTEMA.
              </h2>
              <p className="text-sm sm:text-base text-white/80 max-w-3xl leading-relaxed">
                Benvenuto nella cabina operativa di <strong>Footlink</strong>. Seleziona uno dei{" "}
                <strong>6 moduli principali</strong> per governare il catalogo commerciale PIM,
                le varianti tecniche di fabbrica PLM per Calzature, Pelletteria e Abbigliamento,
                la distinta base a 3 livelli, i laboratori terzisti a 0 € e il Passaporto Digitale UE.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
              <button
                type="button"
                onClick={() => onNavigateModule("all")}
                className="px-6 py-3.5 rounded-full bg-white text-[#111111] font-semibold text-sm hover:bg-[#F5F5F5] transition shadow-lg hover:shadow-xl"
              >
                Apri Workspace Integrato Completo →
              </button>
            </div>
          </div>

          {/* 5 Live Executive KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-6 border-t border-white/15">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
                1. Catalogo Vendita (PIM)
              </div>
              <div className="display-title text-3xl sm:text-4xl text-white mt-1">
                {totalPim} SKU MASTER
              </div>
              <div className="text-xs text-white/70 mt-1">Calzature · Pelletteria · Abbigliamento</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
                2. Varianti Fabbrica (PLM)
              </div>
              <div className="display-title text-3xl sm:text-4xl text-white mt-1">
                {totalPlm} LINEE PLM
              </div>
              <div className="text-xs text-white/70 mt-1">Ponte Nativo 1 PIM ↔ N PLM</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
                3. PIM Data Quality (FEAT-05)
              </div>
              <div className="display-title text-3xl sm:text-4xl text-white mt-1">
                {avgDataQuality}% READY
              </div>
              <div className="text-xs text-white/70 mt-1">10/10 Criteri ESPR Verificati</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
                4. Rete Terzisti a 0 €
              </div>
              <div className="display-title text-3xl sm:text-4xl text-white mt-1">
                {confirmedSubs}/{allSubs.length} FASI
              </div>
              <div className="text-xs text-white/70 mt-1">Confermate in 3 Clic a 0 €</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 col-span-2 sm:col-span-1">
              <div className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
                5. Passaporto UE (ESPR)
              </div>
              <div className="display-title text-3xl sm:text-4xl text-white mt-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                100% LIVE
              </div>
              <div className="text-xs text-white/70 mt-1">QR Code SVG + Vista Dogane</div>
            </div>
          </div>
        </div>
      </div>

      {/* Architectural Grid of the 6 Core Footlink Modules */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#707072]">
              ARCHITETTURA FUNZIONALE FOOTLINK
            </div>
            <h3 className="display-title text-3xl sm:text-4xl text-[#111111] mt-1">
              I 6 MODULI PRINCIPALI DEL SISTEMA OPERATIVO
            </h3>
          </div>
          <p className="text-xs text-[#707072] max-w-md">
            Ogni modulo è interconnesso in tempo reale sul database relazionale: una conferma
            del laboratorio terzista aggiorna istantaneamente distinta base, costi e Passaporto Digitale UE.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m) => (
            <div
              key={m.num}
              className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl p-6 flex flex-col justify-between hover:border-[#111111] transition group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="display-title text-4xl text-[#111111]">{m.num}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-white text-[#111111] border border-[#E5E5E5] px-3 py-1 rounded-full">
                    {m.tag}
                  </span>
                </div>
                <h4 className="display-title text-2xl text-[#111111] mb-2">{m.title}</h4>
                <p className="text-xs text-[#707072] leading-relaxed mb-4">{m.desc}</p>
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-between gap-3">
                <span className="mono-code text-[11px] font-semibold text-[#111111] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  {m.metric}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateModule(m.id)}
                  className="px-4 py-2 rounded-full bg-[#111111] text-white text-xs font-semibold hover:bg-[#333333] transition shrink-0"
                >
                  {m.cta} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
