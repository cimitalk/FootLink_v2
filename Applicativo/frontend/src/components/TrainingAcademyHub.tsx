import React, { useState, useEffect } from "react";
import { PimCommercialItem, ProductModel, VendorRecord } from "../types";

interface TrainingAcademyHubProps {
  pimItems: PimCommercialItem[];
  productModels?: ProductModel[];
  vendors?: VendorRecord[];
  onNavigateModule?: (moduleId: string) => void;
}

export const TrainingAcademyHub: React.FC<TrainingAcademyHubProps> = ({
  pimItems,
  productModels = [],
  vendors = [],
  onNavigateModule,
}) => {
  const [activeTab, setActiveTab] = useState<
    "paths" | "sandbox" | "exam" | "glossary" | "checklist"
  >("paths");

  const [selectedRole, setSelectedRole] = useState<
    "modelleria" | "color" | "commerciale" | "terzista" | "dpp" | "executive"
  >("modelleria");

  // Sandbox states
  const [sandboxUpperDm, setSandboxUpperDm] = useState<number>(16.5);
  const [sandboxUpperScrap, setSandboxUpperScrap] = useState<number>(18);
  const [sandboxLiningDm, setSandboxLiningDm] = useState<number>(13.0);
  const [sandboxLiningScrap, setSandboxLiningScrap] = useState<number>(12);
  const [sandboxSoleCost, setSandboxSoleCost] = useState<number>(6.8);

  const [sandboxStockIt, setSandboxStockIt] = useState<number>(850);
  const [sandboxStockPt, setSandboxStockPt] = useState<number>(400);

  const [sandboxDppLeather, setSandboxDppLeather] = useState<string>("100");
  const [sandboxDppRepair, setSandboxDppRepair] = useState<string>("A");
  const [sandboxDppRecycled, setSandboxDppRecycled] = useState<number>(30);

  // Exam state
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);

  // Checklist state
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("fl_react_checklist");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [glossarySearch, setGlossarySearch] = useState<string>("");

  useEffect(() => {
    try {
      localStorage.setItem("fl_react_checklist", JSON.stringify(checklist));
    } catch {
      // ignore
    }
  }, [checklist]);

  // Calculations
  const costUpper = sandboxUpperDm * (1 + sandboxUpperScrap / 100) * 0.85;
  const costLining = sandboxLiningDm * (1 + sandboxLiningScrap / 100) * 0.35;
  const costSoleTot = sandboxSoleCost + 1.8;
  const totalBomCost = costUpper + costLining + costSoleTot;

  const totalAggregatedStock = sandboxStockIt + sandboxStockPt;

  let dppScore = 70;
  if (sandboxDppLeather === "100") dppScore += 15;
  else if (sandboxDppLeather === "80") dppScore += 10;
  else dppScore += 4;

  if (sandboxDppRepair === "A") dppScore += 10;
  else if (sandboxDppRepair === "B") dppScore += 6;
  else dppScore += 2;

  dppScore += (sandboxDppRecycled / 60) * 5;

  const ROLES_INFO = {
    modelleria: {
      title: "01. Modellista & Sviluppatore Prodotto (PLM & Distinte Base)",
      duration: "35 Minuti",
      badge: "Ingegnerizzazione Prodotto",
      description:
        "Progettazione delle schede modello calzaturiero, quote costruttive della forma (Last), distinte base a 3 livelli (Upper, Lining, Sole) e calcolo sfridi di tranciatura.",
      modules: [
        {
          title: "Creazione della Scheda Modello (Product Model)",
          text: "Definisci l'archetipo geometrico: codice modello, numero forma (Last), altezza tacco e scala taglie Paris Point.",
        },
        {
          title: "Costruzione della Distinta Base a 3 Livelli",
          text: "Classifica i semilavorati nei 3 livelli calzaturieri. Assegna consumo netto e sfrido (16-20% per pellami pieno fiore).",
        },
        {
          title: "Semaforo di Conformità Fornitore (Vendor Guard)",
          text: "Il sistema impedisce l'approvazione del Tech Pack se un pellame proviene da un fornitore con certificazione LWG scaduta.",
        },
      ],
    },
    color: {
      title: "02. Color & Material Specialist (Color Studio & Concerie)",
      duration: "25 Minuti",
      badge: "Tracciabilità Pelli & Colori",
      description:
        "Gestione della cromia di collezione, coordinate Lab/Pantone, associazione lotti conciari certificati nel Tannery Vault e cartelle colori e-commerce.",
      modules: [
        {
          title: "Master Color & Famiglie Normalizzate",
          text: "Definizione della palette con codice HEX, coordinate Lab e mappatura sui canali digitali (es. Cognac Vintage -> Marrone).",
        },
        {
          title: "Tannery Vault & Certificazioni LWG",
          text: "Archiviazione lotti conciari, certificati ambientali Gold/Silver/Bronze e conformità REACH a tutela del passaporto europeo.",
        },
      ],
    },
    commerciale: {
      title: "03. Merchandiser & E-commerce Lead (PIM & Canali)",
      duration: "30 Minuti",
      badge: "Omnicanalità & Multi-Sourcing",
      description:
        "Gestione del catalogo vendibile, configurazione del Ponte 1:N PIM ↔ PLM e sincronizzazione con Shopify, marketplace e showroom B2B.",
      modules: [
        {
          title: "Articolo Commerciale PIM",
          text: "Titoli SEO, composizione calzaturiera UE, listini multivaluta e disaccoppiamento dalla singola distinta base fisica.",
        },
        {
          title: "Ponte 1:N PIM ↔ PLM",
          text: "Associazione di 1 SKU commerciale a N distinte base di produzione (stabilimento principale Italia e backup Portogallo).",
        },
      ],
    },
    terzista: {
      title: "04. Laboratori Terzisti & Fasonisti (Costo 0 €)",
      duration: "10 Minuti",
      badge: "Zero-Training Mobile UX",
      description:
        "Per orlatori, giunterie, suolifici e calzaturifici fasonisti. Accesso da qualsiasi smartphone a costo zero perpetuo (0,00 €) con privacy totale L6.",
      modules: [
        {
          title: "Accesso Commessa da Smartphone",
          text: "Apertura immediata dal link sicuro WhatsApp/Email senza login o installazioni.",
        },
        {
          title: "Avanzamento Lavorazione in 2 Tocchi",
          text: "Tocca 'Inizia Lavorazione' al ritiro del lotto; tocca 'Completato' alla consegna. In caso di difetti pelli, scatta una foto per notificare il brand.",
        },
      ],
    },
    dpp: {
      title: "05. Sustainability & Compliance Officer (DPP ESPR)",
      duration: "20 Minuti",
      badge: "Normativa UE 2024/1781",
      description:
        "Sintesi automatica del Passaporto Digitale di Prodotto, tracciabilità filiera pelli, calcolo carbon footprint e QR Code GS1 Digital Link.",
      modules: [
        {
          title: "Requisiti ESPR UE 2024/1781",
          text: "Tracciabilità obbligatoria dei componenti, percentuale riciclato nella suola e indice di riparabilità calzatura.",
        },
        {
          title: "Generazione QR Code GS1",
          text: "Emissione del cartellino intelligente scansionabile dal consumatore finale in negozio.",
        },
      ],
    },
    executive: {
      title: "06. Direzione Generale & Distretto PaaS",
      duration: "30 Minuti",
      badge: "Governance & Margini",
      description:
        "Coordinamento consorzi di distretto, gestione multi-tenant L6, costing industriale e monitoraggio FinOps delle commesse.",
      modules: [
        {
          title: "PaaS Distrettuale & Multi-Tenant",
          text: "Monitoraggio dei colli di bottiglia tra i reparti di taglio e giunteria dei laboratori del territorio.",
        },
        {
          title: "Governance L0–L6 & FinOps",
          text: "Politica a zero spesa autonoma e mantenimento del margine lordo di commessa > 75%.",
        },
      ],
    },
  };

  const CHECKLIST_ITEMS = [
    {
      id: "chk_1",
      title: "Crea la tua prima Stagione (es. FW26-27)",
      desc: "Imposta lo stato su 'Pianificazione' e associa la collezione principale.",
    },
    {
      id: "chk_2",
      title: "Configura un Modello di Stile (Product Model)",
      desc: "Inserisci codice modello, forma di calzatura e scala taglie Paris Point.",
    },
    {
      id: "chk_3",
      title: "Compila la BOM a 3 Livelli",
      desc: "Aggiungi tomaia, fodera e suola indicando i consumi netti e gli sfridi di tranciatura.",
    },
    {
      id: "chk_4",
      title: "Verifica le Concerie nel Tannery Vault",
      desc: "Assicurati che i fornitori di pellame abbiano una certificazione LWG attiva.",
    },
    {
      id: "chk_5",
      title: "Associa l'articolo PIM al Ponte 1:N",
      desc: "Collega lo SKU commerciale della sneaker alla variante di produzione primaria.",
    },
    {
      id: "chk_6",
      title: "Invia una Commessa Test a un Terzista",
      desc: "Assegna la fase di giunteria e collauda la vista mobile a costo zero.",
    },
    {
      id: "chk_7",
      title: "Genera il QR Code del Passaporto DPP",
      desc: "Sintetizza il passaporto conformità ESPR UE e stampa l'etichetta di test.",
    },
  ];

  const GLOSSARY = [
    {
      term: "Forma (Last)",
      cat: "Modelleria",
      desc: "Il modello tridimensionale su cui viene montata la scarpa e che ne definisce calzata e anatomia.",
    },
    {
      term: "Tomaia (Upper)",
      cat: "BOM Livello 1",
      desc: "La parte superiore che avvolge il piede, fustellata da pellami e cucita assieme con rinforzi.",
    },
    {
      term: "Fodera (Lining)",
      cat: "BOM Livello 2",
      desc: "Rivestimento interno a contatto col piede (vitello naturale, capra, microfibra traspirante).",
    },
    {
      term: "Fondo & Suola (Sole)",
      cat: "BOM Livello 3",
      desc: "Complesso inferiore composto da soletta di montaggio, cambrione d'acciaio, guardolo e battistrada.",
    },
    {
      term: "Tranciatura / Taglio",
      cat: "Produzione",
      desc: "Fase iniziale di taglio pelli con fustella a bandiera o a lama oscillante CNC con calcolo sfridi.",
    },
    {
      term: "Giunteria",
      cat: "Produzione",
      desc: "Assemblaggio e cucitura delle parti della tomaia con scarnitura bordi e applicazione minuteria.",
    },
    {
      term: "Ponte 1 : N PIM/PLM",
      cat: "Architettura",
      desc: "Associazione tra 1 articolo commerciale PIM vendibile e N distinte base PLM per multi-sourcing.",
    },
    {
      term: "Tannery Vault",
      cat: "Materiali",
      desc: "Registro dei lotti conciari con verifica certificati LWG (Gold, Silver, Bronze) e conformità REACH.",
    },
    {
      term: "DPP (Digital Product Passport)",
      cat: "Normativa UE",
      desc: "Passaporto digitale obbligatorio secondo la direttiva ESPR 2024/1781 per tracciabilità e riparabilità.",
    },
    {
      term: "Segregazione L6",
      cat: "Sicurezza",
      desc: "Filtro di sicurezza che protegge i margini e i costi del brand escludendo accessi terzi non autorizzati.",
    },
  ];

  const EXAM_QUESTIONS = [
    {
      q: "1. Nel paradigma Footlink, qual è la corretta relazione tra PIM commerciale e PLM produttivo?",
      options: [
        "1 articolo PIM corrisponde obbligatoriamente a 1 sola distinta base PLM",
        "1 articolo commerciale PIM può essere collegato a N varianti produttive PLM (Ponte 1:N)",
        "Il PIM gestisce solo i terzisti, mentre il PLM gestisce l'e-commerce",
        "Non vi è alcun collegamento tra PIM e PLM in calzatura",
      ],
      correct: 1,
      explanation:
        "Il Ponte 1:N permette di vendere un unico articolo approvvigionandolo da più stabilimenti produttivi.",
    },
    {
      q: "2. Quali sono i 3 livelli della distinta base (BOM) calzaturiera in Footlink?",
      options: [
        "Livello 1: Campione; Livello 2: Serie; Livello 3: Scarti",
        "Livello 1: Tomaia (Upper); Livello 2: Fodera & Accessori; Livello 3: Fondo & Suola",
        "Livello 1: Pelle; Livello 2: Tessuto; Livello 3: Plastica",
        "Livello 1: Costo materiale; Livello 2: Manodopera; Livello 3: Margine",
      ],
      correct: 1,
      explanation:
        "La distinta riflette la costruzione artigianale fisica: Tomaia, Fodera/Rinforzi e Fondo/Suola.",
    },
    {
      q: "3. Quanto costa l'accesso al portale per i laboratori terzisti e fasonisti esterni?",
      options: [
        "49 € al mese per utente",
        "0,00 € (Accesso gratuito a costo zero su mobile)",
        "Una percentuale sul valore del lotto",
        "Gratuito solo per i primi 14 giorni",
      ],
      correct: 1,
      explanation:
        "L'effetto rete Footlink garantisce l'accesso gratuito al 100% per tutti i fasonisti della filiera.",
    },
    {
      q: "4. Cosa garantisce il protocollo di Segregazione Multi-Tenant L6?",
      options: [
        "Che le immagini del catalogo vengano compresse in formato WebP",
        "Che nessun laboratorio terzista possa visualizzare costi, margini del brand o dati degli altri fornitori",
        "Che la piattaforma funzioni solo su computer desktop con licenza aziendale",
        "Che i dati vengano cancellati automaticamente ogni 6 mesi",
      ],
      correct: 1,
      explanation:
        "La segregazione L6 tutela il know-how e la riservatezza industriale dei distretti moda.",
    },
    {
      q: "5. Quale regolamento europeo sancisce l'obbligo del Passaporto Digitale di Prodotto (DPP)?",
      options: [
        "Regolamento UE ESPR 2024/1781 (Ecodesign for Sustainable Products)",
        "Direttiva Cookie GDPR 2016/679",
        "Codice della Strada Europeo",
        "Standard ISO 9001:2015",
      ],
      correct: 0,
      explanation:
        "L'ESPR 2024/1781 introduce i requisiti di ecodesign e il passaporto scansionabile per le calzature.",
    },
  ];

  const handleToggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedChecksCount = Object.values(checklist).filter(Boolean).length;
  const progressPct = Math.round(
    (completedChecksCount / CHECKLIST_ITEMS.length) * 100
  );

  const calculateExamScore = () => {
    let score = 0;
    EXAM_QUESTIONS.forEach((q, idx) => {
      if (examAnswers[idx] === q.correct) score++;
    });
    return score;
  };

  const filteredGlossary = GLOSSARY.filter(
    (g) =>
      g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      g.cat.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      g.desc.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="bg-[#111111] text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <span>🎓 FOOTLINK TRAINING ACADEMY</span>
            <span>•</span>
            <span>ENABLEMENT DI FILIERA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Polo di Formazione Ufficiale & Onboarding Guidato
          </h1>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">
            Percorsi di abilitazione operativa per Brand, Calzaturifici, Concerie e Terzisti. 
            Impara a gestire distinte base calzaturiere a 3 livelli, il ponte 1:N PIM/PLM e la conformità al passaporto europeo DPP in meno di 15 minuti.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="/training_portal.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#111111] text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>↗</span> Apri Portale Standalone a Schermo Intero
            </a>
            <a
              href="/tech_docs.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
            >
              <span>📖</span> Consulta Tech Docs & REST API
            </a>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5E5] pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab("paths")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "paths"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          🧭 1. Percorsi di Ruolo
        </button>
        <button
          onClick={() => setActiveTab("sandbox")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "sandbox"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          ⚡ 2. Simulatore Hands-On (Sandbox)
        </button>
        <button
          onClick={() => setActiveTab("exam")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "exam"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          🏆 3. Esame Certificazione
        </button>
        <button
          onClick={() => setActiveTab("glossary")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "glossary"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          📖 4. Glossario Tecnico
        </button>
        <button
          onClick={() => setActiveTab("checklist")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "checklist"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-[#F5F5F5] text-[#707072] hover:text-[#111111]"
          }`}
        >
          ✅ 5. Checklist 15 Minuti ({completedChecksCount}/7)
        </button>
      </div>

      {/* TAB 1: ROLE PATHS */}
      {activeTab === "paths" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {(
              [
                "modelleria",
                "color",
                "commerciale",
                "terzista",
                "dpp",
                "executive",
              ] as const
            ).map((roleKey) => (
              <button
                key={roleKey}
                onClick={() => setSelectedRole(roleKey)}
                className={`p-3 rounded-xl border text-left transition ${
                  selectedRole === roleKey
                    ? "border-[#111111] bg-[#111111] text-white shadow-sm"
                    : "border-[#E5E5E5] bg-white hover:border-[#111111] text-[#111111]"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-70">
                  {roleKey}
                </span>
                <span className="text-xs font-bold leading-tight block mt-1">
                  {ROLES_INFO[roleKey].title.split(" (")[0]}
                </span>
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E5E5] pb-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold bg-[#F5F5F5] text-[#111111] px-2.5 py-1 rounded-md border border-[#E5E5E5]">
                  {ROLES_INFO[selectedRole].badge}
                </span>
                <h3 className="text-xl font-extrabold text-[#111111] mt-2">
                  {ROLES_INFO[selectedRole].title}
                </h3>
                <p className="text-xs text-[#707072] mt-1 max-w-2xl leading-relaxed">
                  {ROLES_INFO[selectedRole].description}
                </p>
              </div>
              <div className="bg-[#F5F5F5] border border-[#E5E5E5] px-4 py-2 rounded-xl text-xs font-bold text-[#111111]">
                ⏱ Tempo: {ROLES_INFO[selectedRole].duration}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#707072]">
                Moduli Operativi Passo-Passo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ROLES_INFO[selectedRole].modules.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-2 hover:border-[#111111] transition"
                  >
                    <span className="w-6 h-6 rounded-md bg-[#111111] text-white text-xs font-bold flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <h5 className="text-xs font-bold text-[#111111]">{m.title}</h5>
                    <p className="text-xs text-[#707072] leading-relaxed">
                      {m.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {onNavigateModule && (
              <div className="pt-4 border-t border-[#E5E5E5] flex justify-between items-center text-xs">
                <span className="text-[#707072]">
                  Vuoi testare direttamente il modulo collegato a questo ruolo?
                </span>
                <button
                  onClick={() => {
                    if (selectedRole === "modelleria") onNavigateModule("products");
                    else if (selectedRole === "commerciale")
                      onNavigateModule("pim_catalog");
                    else if (selectedRole === "terzista")
                      onNavigateModule("subcontractor_portal");
                    else if (selectedRole === "dpp")
                      onNavigateModule("dpp_passport");
                    else onNavigateModule("home");
                  }}
                  className="px-4 py-2 rounded-lg bg-[#111111] text-white font-bold hover:bg-black transition"
                >
                  Vai al Modulo Applicativo ➔
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE SANDBOX */}
      {activeTab === "sandbox" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E5E5] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Laboratorio Interattivo
                </span>
                <h3 className="text-lg font-extrabold text-[#111111] mt-1">
                  Simulatore BOM a 3 Livelli (Upper / Lining / Sole)
                </h3>
                <p className="text-xs text-[#707072]">
                  Regola i consumi calzaturieri e gli sfridi per visualizzare il ricalcolo istantaneo del costo di produzione.
                </p>
              </div>
              <div className="bg-[#111111] text-white px-5 py-2.5 rounded-xl text-right">
                <span className="text-[10px] uppercase tracking-wider block opacity-70">
                  Costo Materiali Calcolato
                </span>
                <span className="text-xl font-extrabold text-amber-400">
                  € {totalBomCost.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* LEVEL 1: UPPER */}
              <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-3 text-xs">
                <div className="flex justify-between items-center font-bold text-[#111111]">
                  <span>Livello 1: Tomaia (Upper)</span>
                  <span className="text-[10px] text-sky-700 font-mono">Pellame Vitello</span>
                </div>
                <div>
                  <label className="block text-[#707072] mb-1">Consumo Netto (dm²): {sandboxUpperDm.toFixed(1)} dm²</label>
                  <input
                    type="range"
                    min="12"
                    max="22"
                    step="0.5"
                    value={sandboxUpperDm}
                    onChange={(e) => setSandboxUpperDm(parseFloat(e.target.value))}
                    className="w-full accent-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-[#707072] mb-1">Sfrido Tranciatura (%): {sandboxUpperScrap}%</label>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    step="1"
                    value={sandboxUpperScrap}
                    onChange={(e) => setSandboxUpperScrap(parseInt(e.target.value))}
                    className="w-full accent-[#111111]"
                  />
                </div>
                <div className="pt-2 border-t border-[#E5E5E5] flex justify-between font-bold">
                  <span>Subtotale Tomaia:</span>
                  <span>€ {costUpper.toFixed(2)}</span>
                </div>
              </div>

              {/* LEVEL 2: LINING */}
              <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-3 text-xs">
                <div className="flex justify-between items-center font-bold text-[#111111]">
                  <span>Livello 2: Fodera & Rinforzi</span>
                  <span className="text-[10px] text-amber-700 font-mono">Fodera Vitello</span>
                </div>
                <div>
                  <label className="block text-[#707072] mb-1">Consumo Fodera (dm²): {sandboxLiningDm.toFixed(1)} dm²</label>
                  <input
                    type="range"
                    min="8"
                    max="18"
                    step="0.5"
                    value={sandboxLiningDm}
                    onChange={(e) => setSandboxLiningDm(parseFloat(e.target.value))}
                    className="w-full accent-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-[#707072] mb-1">Sfrido Fodera (%): {sandboxLiningScrap}%</label>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="1"
                    value={sandboxLiningScrap}
                    onChange={(e) => setSandboxLiningScrap(parseInt(e.target.value))}
                    className="w-full accent-[#111111]"
                  />
                </div>
                <div className="pt-2 border-t border-[#E5E5E5] flex justify-between font-bold">
                  <span>Subtotale Fodera:</span>
                  <span>€ {costLining.toFixed(2)}</span>
                </div>
              </div>

              {/* LEVEL 3: SOLE */}
              <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-3 text-xs">
                <div className="flex justify-between items-center font-bold text-[#111111]">
                  <span>Livello 3: Fondo & Suola</span>
                  <span className="text-[10px] text-emerald-700 font-mono">Cassetta Gomma</span>
                </div>
                <div>
                  <label className="block text-[#707072] mb-1">Tipologia Fondo</label>
                  <select
                    value={sandboxSoleCost}
                    onChange={(e) => setSandboxSoleCost(parseFloat(e.target.value))}
                    className="w-full p-1.5 border border-[#E5E5E5] rounded bg-white font-semibold"
                  >
                    <option value="6.80">Cassetta Gomma Riciclata 30% (€ 6.80)</option>
                    <option value="9.50">Fondo Cuoio con Isola Antiscivolo (€ 9.50)</option>
                    <option value="4.20">Monoblocco EVA Extralight (€ 4.20)</option>
                  </select>
                </div>
                <div className="text-[11px] text-[#707072]">
                  Sottopiede montaggio con cambrione acciaio: <strong>€ 1.80</strong> (incluso)
                </div>
                <div className="pt-2 border-t border-[#E5E5E5] flex justify-between font-bold">
                  <span>Subtotale Fondo:</span>
                  <span>€ {costSoleTot.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SANDBOX 2: BRIDGE 1:N */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-[#111111]">
              Simulatore Ponte 1 PIM : N PLM (Multi-Sourcing Marche & Porto)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs">
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block">1 Articolo PIM Commerciale</span>
                <h4 className="font-bold text-[#111111] text-sm mt-1">Sneaker Venezia Heritage</h4>
                <p className="text-[#707072] mt-1">Prezzo Retail: <strong>€ 295,00</strong></p>
                <p className="text-indigo-900 font-extrabold mt-3 pt-2 border-t border-indigo-100">
                  Stock Aggregato: {totalAggregatedStock.toLocaleString("it-IT")} paia
                </p>
              </div>

              <div className="text-center font-bold text-[#707072] flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider bg-[#F5F5F5] px-3 py-1 rounded-full border border-[#E5E5E5]">
                  1 : N Bridge Engine
                </span>
                <span className="text-xl">➔</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-[#E5E5E5] flex justify-between items-center bg-[#FAFAFA]">
                  <div>
                    <span className="font-bold block text-[#111111]">PLM Marche (Primaria 70%)</span>
                    <span className="text-[10px] text-[#707072]">Lead Time 20 gg</span>
                  </div>
                  <input
                    type="number"
                    value={sandboxStockIt}
                    onChange={(e) => setSandboxStockIt(parseInt(e.target.value) || 0)}
                    className="w-20 p-1 border rounded text-right font-bold text-xs"
                  />
                </div>
                <div className="p-3 rounded-lg border border-[#E5E5E5] flex justify-between items-center bg-[#FAFAFA]">
                  <div>
                    <span className="font-bold block text-[#111111]">PLM Porto (Secondaria 30%)</span>
                    <span className="text-[10px] text-[#707072]">Lead Time 35 gg</span>
                  </div>
                  <input
                    type="number"
                    value={sandboxStockPt}
                    onChange={(e) => setSandboxStockPt(parseInt(e.target.value) || 0)}
                    className="w-20 p-1 border rounded text-right font-bold text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXAM */}
      {activeTab === "exam" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-[#111111]">
                Esame di Verifica "Footlink Certified Specialist"
              </h3>
              <p className="text-xs text-[#707072] mt-0.5">
                Rispondi alle domande operative per verificare la tua padronanza della piattaforma.
              </p>
            </div>
            <div className="text-xs font-bold bg-[#F5F5F5] px-3 py-1.5 rounded-lg border border-[#E5E5E5]">
              Soglia Superamento: 80% (4/5)
            </div>
          </div>

          <div className="space-y-6">
            {EXAM_QUESTIONS.map((q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-3 text-xs"
              >
                <h4 className="font-bold text-[#111111] text-sm">{q.q}</h4>
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <label
                      key={oIdx}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-[#E5E5E5] bg-white hover:bg-slate-50 cursor-pointer transition"
                    >
                      <input
                        type="radio"
                        name={`exam_q_${idx}`}
                        checked={examAnswers[idx] === oIdx}
                        onChange={() =>
                          setExamAnswers((prev) => ({ ...prev, [idx]: oIdx }))
                        }
                        className="accent-[#111111]"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {examSubmitted && (
                  <div
                    className={`p-3 rounded-lg text-xs mt-2 ${
                      examAnswers[idx] === q.correct
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                        : "bg-rose-50 text-rose-900 border border-rose-200"
                    }`}
                  >
                    <strong>
                      {examAnswers[idx] === q.correct
                        ? "Corretto!"
                        : "Non corretto."}
                    </strong>{" "}
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E5E5E5] flex justify-between items-center">
            <span className="text-xs text-[#707072]">
              Risposte selezionate: {Object.keys(examAnswers).length} su {EXAM_QUESTIONS.length}
            </span>
            <button
              onClick={() => setExamSubmitted(true)}
              className="px-6 py-2.5 rounded-xl bg-[#111111] text-white font-bold text-xs hover:bg-black transition shadow-sm"
            >
              Verifica Risposte ed Emetti Attestato ➔
            </button>
          </div>

          {examSubmitted && (
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111] text-center space-y-3">
              <span className="text-3xl">
                {calculateExamScore() >= 4 ? "🏆" : "⚠️"}
              </span>
              <h4 className="text-lg font-black text-[#111111]">
                {calculateExamScore() >= 4
                  ? "Congratulazioni! Esame Superato con Successo"
                  : "Esame non superato"}
              </h4>
              <p className="text-xs text-[#707072]">
                Punteggio: <strong>{calculateExamScore()} / {EXAM_QUESTIONS.length} ({calculateExamScore() * 20}%)</strong>
              </p>
              {calculateExamScore() >= 4 && (
                <div className="max-w-md mx-auto p-4 rounded-xl border border-amber-300 bg-white text-left text-xs space-y-1 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-amber-700">Attestato di Competenza</span>
                  <h5 className="font-extrabold text-[#111111]">Footlink Certified Specialist v2.0</h5>
                  <p className="text-[#707072] text-[11px]">BOM Calzaturiera 3 Livelli • Ponte 1:N PIM/PLM • Terzisti L6 • DPP ESPR</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GLOSSARY */}
      {activeTab === "glossary" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <input
              type="text"
              value={glossarySearch}
              onChange={(e) => setGlossarySearch(e.target.value)}
              placeholder="Filtra termine (es. Tomaia, Last, DPP, L6)..."
              className="w-full sm:w-80 px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#111111]"
            />
            <span className="text-xs text-[#707072] shrink-0 font-medium">
              {filteredGlossary.length} termini visualizzati
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredGlossary.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#E5E5E5] bg-white space-y-1 hover:border-[#111111] transition shadow-2xs"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-[#111111]">{item.term}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5F5F5] text-[#707072]">
                    {item.cat}
                  </span>
                </div>
                <p className="text-xs text-[#707072] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CHECKLIST */}
      {activeTab === "checklist" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-[#111111]">
                Checklist Operativa "Go-Live in 15 Minuti"
              </h3>
              <p className="text-xs text-[#707072] mt-0.5">
                Segna ogni passaggio man mano che crei la prima collezione in Footlink.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-[#111111] block">
                {progressPct}% Completato
              </span>
              <div className="w-28 bg-[#F5F5F5] h-2 rounded-full overflow-hidden mt-1 border border-[#E5E5E5]">
                <div
                  className="bg-[#10B981] h-2 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {CHECKLIST_ITEMS.map((item, idx) => (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                  checklist[item.id]
                    ? "bg-[#FAFAFA] border-emerald-300"
                    : "bg-white border-[#E5E5E5] hover:border-[#111111]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!checklist[item.id]}
                  onChange={() => handleToggleCheck(item.id)}
                  className="mt-1 w-4 h-4 accent-[#10B981]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#707072]">
                      0{idx + 1}.
                    </span>
                    <h4
                      className={`text-xs font-bold ${
                        checklist[item.id]
                          ? "line-through text-[#707072]"
                          : "text-[#111111]"
                      }`}
                    >
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[#707072] mt-0.5">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
