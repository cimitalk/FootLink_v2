# MEMORY.md - Long-Term Project Memory (Multi-Epoch Architecture)

Questo file conserva i fatti durevoli, le decisioni architetturali e lo stato evolutivo di **Footlink** attraverso le sessioni su **Google Antigravity**, strutturato per **Epoche Esecutive**.

---

## 🏛️ Pilastri Invarianti del Manifesto di Fondazione (Tutte le Epoche)

1. **Dominio Core:** `1 Articolo PIM (Vendita) ↔ N Varianti PLM (Produzione)` per calzature, pelletteria e abbigliamento, con supporto nativo al Passaporto Digitale del Prodotto (DPP UE / ESPR Reg. 2024/1781 & EUDR Reg. 2023/1115).
2. **Stack Tecnologico Core (`ADR-002`):** `Python (FastAPI)` + `React 18 (TypeScript/Vite)` + `SQLite/PostgreSQL` orientato a soluzioni open-source e **free-tier**.
3. **Modello di Business a Rete & FinOps (`ADR-004`):** Terzisti/Façonisti a **Costo Zero (0,00 € perpetuo)** per viralità di filiera; PMI produttive con canone SaaS accessibile; Brand Moda in Enterprise Tier. Vincolo inderogabile di **Margine Lordo SaaS > 75%** e **Zero Spesa Monetaria Autonoma (> 0 € = Escalation L2 al Founder)**.
4. **Architettura del Repository a 3 Pilastri di Root (`ADR-005`):**
   - `Azienda/`: Governance, Manifesto, specifiche di ruolo C-Suite, ADR, Task Object JSON (`Azienda/tasks/`), OKR e documentazione strategica/operativa.
   - `Applicativo/`: Codice sorgente della piattaforma PLM+PIM (`backend/`, `frontend/`, `database/`).
   - `Portale_Founder_Control/`: Cabina di regia del Founder (`control_center.py` e `codebase_analytics.py` su `http://127.0.0.1:8080`).
5. **Orchestrazione C-Suite (`ADR-001`):** I 6 ruoli esecutivi (`CEO`, `CGO`, `CTO`, `CPO`, `CRO`, `CMO`) operano nativamente su **Google Antigravity** (`OpenClaw` in stato `suspended`).

---

## 🚀 EPOCA II — "LA VERTICALIZZAZIONE" (Da Sprint 8 in poi — Avviata il 26 Ottobre 2026)

### Direttiva Fondativa dell'Epoca II (Founder Directive)
- **La Regola della Verticalizzazione (`ADR-011` — *Zero Horizontal Bloat / Deep Vertical Capabilities*):**
  - Mentre gli Sprint da 1 a 7 (Epoca I) hanno costruito il perimetro orizzontale della piattaforma (9 moduli attivi + 1 in stand-by), lo **Sprint 8 ("La Ripartenza")** inaugura l'**Epoca II ("La Verticalizzazione")**.
  - **Direttiva del Founder:** *"La piattaforma Footlink è abbastanza ampia orizzontalmente a livello di numero di moduli, ma abbastanza limitata in termini di profondità funzionale all'interno di ogni modulo (inteso come numero di funzionalità disponibili per gli utenti)."*
  - È vietato introdurre nuovi moduli orizzontali superflui; ogni Sprint dell'Epoca II triplica la profondità funzionale, le automazioni di dominio, i controlli incrociati e gli strumenti operativi reali per gli utenti all'interno dei moduli esistenti.

### Sprint 8 — "La Ripartenza" (Elaborazione Strategica C-Suite, Ottimizzazione Multi-Epoca & Definizione Sprint 8)
- **Archiviazione Epoca I & Ottimizzazione Multi-Epoca Completate (`FTL-GOV-008`, `FTL-TECH-021`):**
  - Consolidato l'intero storico degli Sprint 1–7 in [`Azienda/docs/governance/epoch-1-historical-consolidation-sprints-1-7.md`](./docs/governance/epoch-1-historical-consolidation-sprints-1-7.md) e in [`Azienda/memory/archive/EPOCH-1-2026-10-18_to_2026-10-20-summary.md`](./memory/archive/EPOCH-1-2026-10-18_to_2026-10-20-summary.md).
  - Approvata [`ADR-011`](./adr/ADR-011-epoch-2-verticalization-governance-and-modular-depth.md) (Governance della Verticalizzazione e Segregazione L6 per Colori e Albo Fornitori).
  - Evoluto il **Founder Control Center v2.0** (`Portale_Founder_Control/control_center.py`) con **Selettore Epoca Interattivo** (`🚀 Epoca II: La Verticalizzazione` di default vs `📦 Archivio Epoca I: Sprint 1–7` vs `🌐 Vista Globale`), mappatura completa `S1..S8` e sincronizzazione strutturata di `Azienda/tasks/README.md`.
- **Master Plan Epoca II & Plenaria C-Suite (`FTL-CEO-019`, `FTL-PROD-012`, `FTL-REV-007`, `FTL-MKT-008`):**
  - Formalizzato il Piano Strategico in [`Azienda/PIANO_PROSECUZIONE_STRATEGICO_EPOCA_2.md`](./PIANO_PROSECUZIONE_STRATEGICO_EPOCA_2.md) e [`Azienda/docs/okr/epoch-2-masterplan-and-sprint-8-kickoff.md`](./docs/okr/epoch-2-masterplan-and-sprint-8-kickoff.md).
  - **Direttiva Founder (28 Ottobre 2026):** Lo Sprint 8 ("La Ripartenza") è confermato ed esecutivo; la pianificazione degli sprint successivi (Sprint 9+) non è predeterminata ma verrà definita di volta in volta dal Founder.
  - Creato l'archivio di backup consolidato dell'Epoca I in `_backups/epoca_1_audit_backup.tar.gz` (127 file, SHA-256 manifest, escluso da git per audit/ripristino).
  - Completato il triage esecutivo delle 2 Direttive Founder [`FTL-CEO-017`](./tasks/FTL-CEO-017.json) e [`FTL-CEO-018`](./tasks/FTL-CEO-018.json), trasformate nei **2 Motori Verticali dello Sprint 8** (specificati in [`PRD-009`](./docs/prd/PRD-009-sprint-8-verticalization-intelligent-color-and-vendor-hub.md) e nel blueprint tecnico [`epoch-2-technical-optimization-and-sprint-8-blueprint.md`](./docs/technical/epoch-2-technical-optimization-and-sprint-8-blueprint.md)):
    1. **Verticalizzazione 1 (`FTL-CEO-017` → `FTL-TECH-022`): Motore di Gestione Colori Intelligente & Colorway BOM Matrix:**
       - Cartelle Colori Master e Stagionali (`master_colors`: codice, nome tecnico PLM vs famiglia colore commerciale PIM, swatch HEX/RGB, riferimenti **Pantone TCX / RAL**, finitura superficiale *Opaco, Vernice, Metallizzato, Scamosciato, Goffrato, Tamponato*).
       - **Colorway BOM Matrix** su Distinta Base a 3 Livelli (`variant_colorway_bom_mappings`): abbinamento colore puntuale per ogni nodo L1/L2/L3 (Tomaia, Fodera, Suola, Tacco, Minuterie Galvaniche, Filato, Packaging) con workflow di approvazione **Tirella / Lab-Dip** (`In Attesa Tirella`, `Approvato Master`, `Rigettato Delta-E`, `In Deroga`).
       - **Acceleratori Intelligenti:** *1-Click Colorway Explosion* (generazione automatica di N varianti PLM da cartella colori), verifica coerenza colore con Lotti Conceria (`04 Vault`) e auto-mapping per feed e-commerce (`03 PIM`).
    2. **Verticalizzazione 2 (`FTL-CEO-018` → `FTL-TECH-023`): Albo Fornitori & Terzisti Centralizzato a 360° (Vendor Hub):**
       - Anagrafica qualificata (`vendors_registry`) per ruolo di filiera (*Conceria, Suolificio, Tacchificio, Minuterie, Tomaificio, Orlatura, Montaggio*) e distretto manifatturiero (*Marche, Toscana, Veneto, Campania, Puglia, Lombardia, Estero*), con **Terzisti a Costo Zero (0,00 € perpetuo)**.
       - **Qualifica ESG, Scadenziario Certificazioni & Vendor Rating (0–100):** controllo automatico scadenze LWG, ICEC, EUDR, REACH, ISO e DURC con semaforo visivo e blocco/alert su certificati scaduti; rating ponderato su Qualità (40%), Puntualità OTD (30%) ed ESG (30%).
       - **Parametri L6 & Vista "Impatto Fornitore (Where-Used)":** MOQ, Lead Time e listini rigorosamente segregati L6 (oscurati ai terzisti), selezione relazionale del fornitore nei nodi BOM e nel Vault Conceria, e query *Where-Used* istantanea (`< 1s`) per vedere tutti i modelli PIM, varianti PLM e lotti impattati da un fornitore.
- **Unit Economics & Posizionamento Epoca II:**
  - Analisi FinOps CRO ([`epoch-2-verticalization-unit-economics-and-sprint-8-finops.md`](./docs/finops/epoch-2-verticalization-unit-economics-and-sprint-8-finops.md)): Margine Lordo SaaS certificato a **87,06% (> 75%)**, ROI cliente **> 5,1x**, spesa autonoma **0,00 € (L2)**, Terzisti a **0,00 €**.
  - Posizionamento e Glossario UX CMO ([`epoch-2-vertical-positioning-and-sprint-8-narrative.md`](./docs/marketing/epoch-2-vertical-positioning-and-sprint-8-narrative.md)).
- **Completamento Integrale Sprint 8 (Sviluppo Full-Stack & Collaudo L6):**
  - [`FTL-TECH-022`](./tasks/FTL-TECH-022.json) (`done` — CTO): Sviluppo Full-Stack Verticalizzazione 1 (Color Intelligence Engine, Lab-Dip Delta-E, Colorway BOM Matrix, 1-Click Explosion, Conceria Color Consistency Guard, Auto-Mapping PIM).
  - [`FTL-TECH-023`](./tasks/FTL-TECH-023.json) (`done` — CTO): Sviluppo Full-Stack Verticalizzazione 2 (Albo Fornitori & Terzisti 360°, Scadenziario Certificazioni SHA-256, Rating 40/30/30, Segregazione L6 & Where-Used BOM).
  - [`FTL-PROD-013`](./tasks/FTL-PROD-013.json) (`done` — CPO): Collaudo UX/UI Verticale Sprint 8, Audit Segregazione L6 Fornitori e Certificazione Zero-Training ([`sprint-8-vertical-qa-and-l6-audit-report.md`](./docs/prd/sprint-8-vertical-qa-and-l6-audit-report.md)).
  - **Metriche di Rilascio Sprint 8:** **11/11 Task Done (100%)**, **36/36 Test Pytest Passanti (100%)**, **0 Errori TypeScript/Vite**, **0,00 € Spesa Autonoma (L2)**, Terzisti a **0,00 € Perpetuo (Tier 3)**.

---

## 📦 ARCHIVIO CONSOLIDATO EPOCA I — "FONDAZIONE & ESPANSIONE ORIZZONTALE" (Sprint 1–7: 17–20 Ottobre 2026)

> **Riferimento Storico Completo (Frozen Baseline):** Per il dettaglio analitico di tutti i 67 task completati, delle 10 ADR e di tutti i deliverable dell'Epoca I, consultare il compendio ufficiale: [`Azienda/docs/governance/epoch-1-historical-consolidation-sprints-1-7.md`](./docs/governance/epoch-1-historical-consolidation-sprints-1-7.md).

- **Sprint 1 (17–18 Ott 2026) — Bootstrap C-Suite & Fondamenta Governance (`ADR-001`..`ADR-004`):**
  - Approvazione Manifesto v1.1 e 6 ruoli C-Suite; transizione a Google Antigravity (`OpenClaw` *suspended*); setup stack Python/React/PostgreSQL free-tier; modello dati `1 PIM ↔ N PLM`; Network Pricing con Terzisti a 0 € e Margine Lordo > 75%. (`6/6 task done`).
- **Sprint 2 (18 Ott 2026) — Riorganizzazione a 3 Pilastri & Core Applicativo (`ADR-005`):**
  - Struttura monorepo in `Azienda/`, `Applicativo/`, `Portale_Founder_Control/`; implementazione DB persistente, BOM a 3 livelli, Portale Mobile Terzisti "3 Clic a 0 €", Generatore Live DPP UE con QR SVG e Landing Page B2B. (`7/7 task done`).
- **Sprint 3 (18–19 Ott 2026) — Design System v2.0 & Segregazione L6 (`ADR-006`):**
  - Unificazione UX *Luxury Editorial Minimalism*, Home Hub modulare, PIM Data Quality Score (0–100%), schede tecniche verticali multi-settore e segregazione costi L6 Brand vs Terzista e Consumatore vs Dogane. (`4/4 task done`).
- **Sprint 4 (19 Ott 2026) — Lancio Pilota Distretti, Validazione Zero-Training & Deploy Free-Tier:**
  - Audit GDPR e DPA multi-tenant L6, attivazione pipeline 15 prospect pilota (Marche, Toscana, Veneto), protocollo SUS Zero-Training (`≤ 3 clic, < 90s`), endpoint Magic Link e configurazione deploy 0 €/mese. (`6/6 task done`).
- **Sprint 5 (19 Ott 2026) — Modello Dati Flessibile, Stagioni/Collezioni & Anagrafiche (`ADR-007`):**
  - Motore attributi dinamici (`DataModelSchemaStudio`), gerarchia `1 Stagione ↔ N Collezioni`, centralizzazione Anagrafiche di Dominio con inline/modal edit (`FTL-CEO-007`). (`8/8 task done`).
- **Sprint 6 (19 Ott 2026) — PaaS Distrettuale 3 Tier, Vault Conceria SHA-256 & Scorporo PLM/PIM (`ADR-008`, `ADR-009`):**
  - Architettura PaaS a 3 livelli (Enterprise, PMI, Laboratori 0 €), Vault Tracciabilità Pellami EUDR/LWG con verifica crittografica SHA-256 a 0 € e import CSV, scorporo Area Prodotti PLM (`FTL-CEO-009`), PIM Hub con feed Shopify/B2B (`FTL-CEO-010`), stand-by strategico Work Orders Hub (`ADR-009` / `FTL-CEO-011`), Scale Taglie Certificate Zero-JSON, Genere Target e Quick Edit atomico. (`17/17 task done`).
- **Sprint 7 (20 Ott 2026) — Tassonomia 3+1 Livelli, Bulk Onboarding, BOM Drag&Drop/Duplicazione, DAM & Codebase Analytics (`ADR-010`) — 👑👑 Doppio Riconoscimento Founder:**
  - Albero categorie `product_categories_hierarchy` con CTE ricorsive, classificatori di merchandising e configuratore visuale Piramidi di Collezione Zero-JSON, Deep Clone variante/BOM e Preset BOM, Bulk Import CSV con Dry-Run, Albero BOM Compact (-58% ingombro) con Drag & Drop HTML5 nativo e duplicazione ricorsiva sotto-alberi, Hero Frattale 60fps con telemetria, Suite DAM a 6 cartelle e Codebase Analytics con impronta MB su disco. (`19/19 task done` — **Totale Epoca I: 67/67 Task Done, 26/26 Test Pytest, 0 Errori Vite, 0,00 € Spesa Autonoma**).
