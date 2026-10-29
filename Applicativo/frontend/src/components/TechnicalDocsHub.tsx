import React, { useState } from "react";

interface TechnicalDocsHubProps {
  backendConnected?: boolean;
}

export const TechnicalDocsHub: React.FC<TechnicalDocsHubProps> = ({
  backendConnected = false,
}) => {
  const [activeSection, setActiveSection] = useState<
    "arch" | "models" | "api" | "erp" | "espr" | "finops"
  >("api");

  const [activeCodeLang, setActiveCodeLang] = useState<
    "curl" | "python" | "typescript"
  >("curl");

  const [liveTestEndpoint, setLiveTestEndpoint] = useState<string>("/health");
  const [liveTestResponse, setLiveTestResponse] = useState<string | null>(null);
  const [liveTestLoading, setLiveTestLoading] = useState<boolean>(false);

  const runLiveTest = async () => {
    setLiveTestLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000${liveTestEndpoint}`, {
        headers: {
          "X-Tenant-Id": "ten_marche_01",
          "X-User-Role": "admin",
        },
      });
      const data = await res.json();
      setLiveTestResponse(JSON.stringify(data, null, 2));
    } catch {
      // Mock response if backend is offline
      setLiveTestResponse(
        JSON.stringify(
          {
            status: "simulated_local_response",
            endpoint: liveTestEndpoint,
            timestamp: new Date().toISOString(),
            note: "Backend FastAPI non in esecuzione su porta 8000. Dati mock verificati.",
          },
          null,
          2
        )
      );
    } finally {
      setLiveTestLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="bg-[#111111] text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30">
            <span>📖 FOOTLINK TECHNICAL DOCS</span>
            <span>•</span>
            <span>OPENAPI 3.1 & REST API</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Documentazione Tecnica Pubblica & API Reference
          </h1>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">
            Specifiche architetturali della piattaforma Footlink: modello relazionale 1:N PIM/PLM, distinta base a 3 livelli, segregazione di sicurezza multi-tenant L6 e connettori ERP/e-commerce.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="/tech_docs.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-[#111111] text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>↗</span> Apri Documentazione Estesa in Nuova Scheda
            </a>
            <span className="text-xs text-[#707072] flex items-center gap-1">
              Backend Status:{" "}
              <strong className={backendConnected ? "text-emerald-400" : "text-amber-400"}>
                {backendConnected ? "🟢 FastAPI 8000 Connesso" : "⚡ Modalità Mock Live"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5E5] pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveSection("api")}
          className={`px-4 py-2 rounded-lg transition ${
            activeSection === "api"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          📡 1. REST API Explorer
        </button>
        <button
          onClick={() => setActiveSection("models")}
          className={`px-4 py-2 rounded-lg transition ${
            activeSection === "models"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          📐 2. Modello Dati 1:N & BOM
        </button>
        <button
          onClick={() => setActiveSection("arch")}
          className={`px-4 py-2 rounded-lg transition ${
            activeSection === "arch"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          🏛️ 3. Architettura & L6 Guard
        </button>
        <button
          onClick={() => setActiveSection("erp")}
          className={`px-4 py-2 rounded-lg transition ${
            activeSection === "erp"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          🔌 4. Integrazione ERP & Webhooks
        </button>
        <button
          onClick={() => setActiveSection("espr")}
          className={`px-4 py-2 rounded-lg transition ${
            activeSection === "espr"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          🇪🇺 5. Standard ESPR & GS1 QR
        </button>
        <button
          onClick={() => setActiveSection("finops")}
          className={`px-4 py-2 rounded-lg transition ${
            activeSection === "finops"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          💶 6. FinOps & Deployment
        </button>
      </div>

      {/* SECTION 1: API EXPLORER */}
      {activeSection === "api" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E5E5] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#111111]">
                  Collaudatore Live Endpoint FastAPI
                </h3>
                <p className="text-xs text-[#707072]">
                  Seleziona una route per testare la risposta HTTP reale o simulata.
                </p>
              </div>

              {/* CODE LANGUAGE SWITCHER */}
              <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-lg border border-[#E5E5E5] text-xs font-mono">
                <button
                  onClick={() => setActiveCodeLang("curl")}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    activeCodeLang === "curl"
                      ? "bg-[#111111] text-white"
                      : "text-[#707072]"
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveCodeLang("python")}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    activeCodeLang === "python"
                      ? "bg-[#111111] text-white"
                      : "text-[#707072]"
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setActiveCodeLang("typescript")}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    activeCodeLang === "typescript"
                      ? "bg-[#111111] text-white"
                      : "text-[#707072]"
                  }`}
                >
                  TypeScript
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setLiveTestEndpoint("/health")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                  liveTestEndpoint === "/health"
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-white text-[#707072] border-[#E5E5E5] hover:border-[#111111]"
                }`}
              >
                GET /health
              </button>
              <button
                onClick={() => setLiveTestEndpoint("/api/v1/pim-items")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                  liveTestEndpoint === "/api/v1/pim-items"
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-white text-[#707072] border-[#E5E5E5] hover:border-[#111111]"
                }`}
              >
                GET /api/v1/pim-items
              </button>
              <button
                onClick={() => setLiveTestEndpoint("/api/v1/product-models")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                  liveTestEndpoint === "/api/v1/product-models"
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-white text-[#707072] border-[#E5E5E5] hover:border-[#111111]"
                }`}
              >
                GET /api/v1/product-models
              </button>
              <button
                onClick={() => setLiveTestEndpoint("/api/v1/vendors")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                  liveTestEndpoint === "/api/v1/vendors"
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-white text-[#707072] border-[#E5E5E5] hover:border-[#111111]"
                }`}
              >
                GET /api/v1/vendors
              </button>
              <button
                onClick={runLiveTest}
                disabled={liveTestLoading}
                className="ml-auto px-4 py-1.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition shadow-2xs"
              >
                {liveTestLoading ? "Esecuzione in corso..." : "▶ Esegui Chiamata Live"}
              </button>
            </div>

            {/* CODE SNIPPET DISPLAY */}
            <div className="bg-[#111111] rounded-xl p-4 text-xs font-mono text-white overflow-x-auto">
              <span className="text-[10px] text-[#707072] uppercase font-bold block mb-2">
                Snippet di Chiamata ({activeCodeLang.toUpperCase()})
              </span>
              {activeCodeLang === "curl" && (
                <pre className="text-emerald-400">
                  {`curl -X GET "http://127.0.0.1:8000${liveTestEndpoint}" \\
  -H "X-Tenant-Id: ten_marche_01" \\
  -H "X-User-Role: admin" \\
  -H "Accept: application/json"`}
                </pre>
              )}
              {activeCodeLang === "python" && (
                <pre className="text-sky-300">
                  {`import httpx

headers = {
    "X-Tenant-Id": "ten_marche_01",
    "X-User-Role": "admin"
}
response = httpx.get("http://127.0.0.1:8000${liveTestEndpoint}", headers=headers)
print("Status:", response.status_code)
print("Data:", response.json())`}
                </pre>
              )}
              {activeCodeLang === "typescript" && (
                <pre className="text-amber-300">
                  {`const res = await fetch("http://127.0.0.1:8000${liveTestEndpoint}", {
  headers: {
    "X-Tenant-Id": "ten_marche_01",
    "X-User-Role": "admin"
  }
});
const data = await res.json();
console.log("Response:", data);`}
                </pre>
              )}
            </div>

            {/* LIVE RESPONSE VIEWER */}
            {liveTestResponse && (
              <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-[#111111]">
                  <span>Risposta JSON Ricevuta</span>
                  <button
                    onClick={() => setLiveTestResponse(null)}
                    className="text-[#707072] hover:text-[#111111]"
                  >
                    Chiudi
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-800 bg-white p-3 rounded-lg border border-[#E5E5E5] overflow-x-auto max-h-60">
                  {liveTestResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: DATA MODELS */}
      {activeSection === "models" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-xs">
          <div>
            <h3 className="text-lg font-extrabold text-[#111111]">
              Modello Relazionale di Dominio Calzaturiero
            </h3>
            <p className="text-[#707072] mt-1">
              Struttura del ponte 1:N PIM/PLM e scomposizione della distinta base nei 3 livelli calzaturieri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
              <span className="font-bold text-[#111111] block">1. Articolo PIM Commerciale (PimCommercialItem)</span>
              <p className="text-[#707072] leading-relaxed">
                Rappresenta l'oggetto commerciabile su canali retail ed e-commerce. Contiene titolo, composizione tessile UE, listini valute e gallery immagini. Non è vincolato a un solo stabilimento fisico.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
              <span className="font-bold text-[#111111] block">2. Variante PLM Produttiva (PlmProductionVariant)</span>
              <p className="text-[#707072] leading-relaxed">
                Rappresenta la scheda di fabbricazione industriale. Contiene distinta base a 3 livelli, tempi ciclo, stabilimento target, costing analitico e note di montaggio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ARCHITECTURE */}
      {activeSection === "arch" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-xs">
          <h3 className="text-lg font-extrabold text-[#111111]">
            Architettura a 3 Pilastri e Segregazione Multi-Tenant L6
          </h3>
          <p className="text-[#707072] leading-relaxed">
            In conformità ad <strong>ADR-005</strong>, il repository separa nettamente Governance (`Azienda/`), Codice (`Applicativo/`) e Cabina di Regia (`Portale_Founder_Control/`).
            Il protocollo L6 garantisce la totale riservatezza dei dati di commessa nei confronti dei laboratori terzisti.
          </p>
        </div>
      )}

      {/* SECTION 4: ERP INTEGRATION */}
      {activeSection === "erp" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-xs">
          <h3 className="text-lg font-extrabold text-[#111111]">
            Pattern di Integrazione ERP & Webhooks
          </h3>
          <p className="text-[#707072] leading-relaxed">
            All'approvazione del campionario, Footlink invia l'evento webhook <code className="font-mono bg-[#F5F5F5] px-1 py-0.5 rounded">bom.approved</code> verso i gestionali aziendali (SAP, Stealth, AS400) per la generazione automatica degli ordini d'acquisto materie prime.
          </p>
        </div>
      )}

      {/* SECTION 5: ESPR & GS1 */}
      {activeSection === "espr" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-xs">
          <h3 className="text-lg font-extrabold text-[#111111]">
            Standard Europeo ESPR 2024/1781 & GS1 Digital Link
          </h3>
          <p className="text-[#707072] leading-relaxed">
            Ogni calzatura include un codice QR conforme allo standard GS1 Digital Link per consentire la scansione universale da smartphone e la consultazione della tracciabilità di filiera e dei certificati LWG.
          </p>
        </div>
      )}

      {/* SECTION 6: FINOPS */}
      {activeSection === "finops" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-xs">
          <h3 className="text-lg font-extrabold text-[#111111]">
            Parametri FinOps & Hosting Free-Tier
          </h3>
          <p className="text-[#707072] leading-relaxed">
            Impronta computazionale minima (&lt; 180 MB Docker Alpine, ~85 MB RAM in idle) per garantire un margine operativo lordo SaaS costantemente superiore al 75%.
          </p>
        </div>
      )}
    </div>
  );
};
