# 📋 Founder Control Dashboard — Registro Task (`Azienda/tasks/`)

Questa directory contiene i **Task Object JSON** della C-Suite di **Footlink**, validati secondo il [Task Object Schema v1.0](./schema/task-object-v1.schema.json) definito dal CGO e orchestrati tramite **Google Antigravity** (`OpenClaw` in stato *suspended*).

---

## 🚀 Sprint 1 — Bootstrap C-Suite & Fondamenta Governance

| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |
|---|:---:|---|:---:|:---:|---|:---:|
| [`FTL-GOV-001`](./FTL-GOV-001.json) | **CGO** | Setup del framework di governance e creazione del primo ADR | 🔴 `critical` | ✅ `done` | — | No (`L0`) |
| [`FTL-CEO-001`](./FTL-CEO-001.json) | **CEO** | Definizione OKR Q1 e Kick-off Ufficiale della C-Suite | 🔴 `critical` | ✅ `done` | `FTL-GOV-001` | No (`L1`) |
| [`FTL-TECH-001`](./FTL-TECH-001.json) | **CTO** | Setup architettura core (Python / React / PostgreSQL) e pipeline CI/CD | 🔴 `critical` | ✅ `done` | `FTL-GOV-001`, `FTL-CEO-001` | Sì (`L3`) |
| [`FTL-PROD-001`](./FTL-PROD-001.json) | **CPO** | PRD Core MVP: Modello Dati 1:N PIM/PLM e Scheda Tecnica Filiera | 🔴 `critical` | ✅ `done` | `FTL-GOV-001`, `FTL-CEO-001` | No (`L1`) |
| [`FTL-REV-001`](./FTL-REV-001.json) | **CRO** | Strategia GTM, Pricing Tier di Rete e Modello FinOps Iniziale | 🟠 `high` | ✅ `done` | `FTL-CEO-001`, `FTL-PROD-001` | Sì (`L4`) |
| [`FTL-MKT-001`](./FTL-MKT-001.json) | **CMO** | Brand Guidelines v1.0, Landing Page Free-Tier e Presidio LinkedIn | 🟠 `high` | ✅ `done` | `FTL-CEO-001`, `FTL-PROD-001` | Sì (`L5`) |

---

## ⚡ Sprint 2 — Riorganizzazione 3 Pilastri, Core Applicativo PLM/PIM & Go-To-Market

| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |
|---|:---:|---|:---:|:---:|---|:---:|
| [`FTL-GOV-002`](./FTL-GOV-002.json) | **CGO** | Riorganizzazione Repository a 3 Pilastri (Azienda, Applicativo, Portale_Founder_Control) e Governance Sprint 2 | 🔴 `critical` | ✅ `done` | `FTL-GOV-001` | No (`L1`) |
| [`FTL-CEO-002`](./FTL-CEO-002.json) | **CEO** | Direttiva Esecutiva Sprint 2, Allineamento OKR e Audit di Governance Manifesto | 🔴 `critical` | ✅ `done` | `FTL-CEO-001`, `FTL-GOV-002` | No (`L1`) |
| [`FTL-PROD-002`](./FTL-PROD-002.json) | **CPO** | PRD v2.0: Gestione Visuale Ponte 1 PIM <-> N PLM, Distinta Base BOM a 3 Livelli, Portale Mobile Terzista '3 Clic a 0 EUR' e Specifica UX Passaporto Digitale DPP UE | 🔴 `critical` | ✅ `done` | `FTL-PROD-001`, `FTL-TECH-001` | Sì (`L1`) |
| [`FTL-TECH-002`](./FTL-TECH-002.json) | **CTO** | Implementazione DB persistente (SQLite/PostgreSQL), API 1 PIM <-> N PLM, BOM a 3 livelli e UI React Portale Terzisti 0 € | 🔴 `critical` | ✅ `done` | `FTL-TECH-001`, `FTL-PROD-001` | Sì (`L3`) |
| [`FTL-TECH-003`](./FTL-TECH-003.json) | **CTO** | Generatore Live Passaporto Digitale del Prodotto (DPP UE / ESPR) con QR Code SVG navigabile | 🟠 `high` | ✅ `done` | `FTL-TECH-001`, `FTL-TECH-002` | Sì (`L3`) |
| [`FTL-MKT-002`](./FTL-MKT-002.json) | **CMO** | Pubblicazione Landing Page B2B con Demo Live del Passaporto Digitale DPP UE / ESPR, Ponte Commerciale-Fabbrica e Connessione Laboratori in Tempo Reale | 🟠 `high` | ✅ `done` | `FTL-MKT-001`, `FTL-PROD-001` | Sì (`L5`) |
| [`FTL-REV-002`](./FTL-REV-002.json) | **CRO** | Kit Operativo di Onboarding Design Partner Pilota nei Distretti (Marche, Toscana, Veneto) e Template LOI | 🟠 `high` | ✅ `done` | `FTL-REV-001`, `FTL-PROD-001` | Sì (`L4`) |

---

## 🎨 Sprint 3 — Convergenza UX/UI Design System v2.0, Home Hub Iniziale & Processi Core

| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |
|---|:---:|---|:---:|:---:|---|:---:|
| [`FTL-GOV-003`](./FTL-GOV-003.json) | **CGO** | ADR-006: Unificazione Design System v2.0 (Nike-Inspired Editorial Minimalism) e Segregazione Costi L6 Brand vs Terzista | 🔴 `critical` | ✅ `done` | `FTL-GOV-002`, `FTL-MKT-002` | No (`L1`) |
| [`FTL-CEO-003`](./FTL-CEO-003.json) | **CEO** | Direttiva Esecutiva Sprint 3: Convergenza UX/UI Design System v2.0, Home Hub Modulare e Completamento Processi Core PIM/PLM | 🔴 `critical` | ✅ `done` | `FTL-CEO-002`, `FTL-GOV-003` | No (`L1`) |
| [`FTL-PROD-003`](./FTL-PROD-003.json) | **CPO** | PRD-003: Home Hub Modulare, Design System v2.0 Applicativo, PIM Data Quality & Export (FEAT-05) e Schede Tecniche Verticali Multi-Settore con Costing L6 | 🔴 `critical` | ✅ `done` | `FTL-PROD-002`, `FTL-MKT-002` | No (`L1`) |
| [`FTL-TECH-004`](./FTL-TECH-004.json) | **CTO** | Rifacimento UX/UI Design System v2.0, Home Hub Iniziale ed Evoluzione Full-Stack Processi Core (PIM Data Quality/Export, Schede Verticali, Scala Taglie, Costing L6, Workflow PLM) | 🔴 `critical` | ✅ `done` | `FTL-TECH-002`, `FTL-TECH-003`, `FTL-PROD-003` | Sì (`L3`) |

---

## 🏭 Sprint 4 — Lancio Pilota nei Distretti, Validazione sul Campo 'Zero-Training Terzista', Deploy Free-Tier & Gate L2–L6

| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |
|---|:---:|---|:---:|:---:|---|:---:|
| [`FTL-CEO-004`](./FTL-CEO-004.json) | **CEO** | Direttiva Esecutiva Sprint 4: Lancio Pilota nei Distretti, Validazione sul Campo 'Zero-Training Terzista', Deploy Free-Tier e Presidio Gate L2–L6 | 🔴 `critical` | ✅ `done` | `FTL-CEO-003`, `FTL-TECH-004` | No (`L1`) |
| [`FTL-GOV-004`](./FTL-GOV-004.json) | **CGO** | Audit Conformità GDPR, Data Protection Agreement (DPA) Filiera e Segregazione Multi-Tenant Dati Riservati L6 | 🔴 `critical` | ✅ `done` | `FTL-GOV-003`, `FTL-CEO-004` | No (`L6`) |
| [`FTL-REV-003`](./FTL-REV-003.json) | **CRO** | Attivazione Outreach 15 Prospect Pilota nei Distretti, Gestione Pipeline LOI e Dossier di Escalation L4 Listini | 🟠 `high` | ✅ `done` | `FTL-REV-002`, `FTL-CEO-004` | Sì (`L4`) |
| [`FTL-MKT-003`](./FTL-MKT-003.json) | **CMO** | Pacchetto Esecutivo Go-Live Comunicazione B2B, Dossier Gate L5 e Sequenza Primi 3 Post LinkedIn DPP UE | 🟠 `high` | ✅ `done` | `FTL-MKT-002`, `FTL-CEO-004` | Sì (`L5`) |
| [`FTL-PROD-004`](./FTL-PROD-004.json) | **CPO** | PRD-004: Protocollo di Validazione Pilota sul Campo 'Zero-Training Terzista' (≤ 3 Clic, < 90s) & Framework Benchmark SUS | 🔴 `critical` | ✅ `done` | `FTL-PROD-003`, `FTL-CEO-004` | No (`L1`) |
| [`FTL-TECH-005`](./FTL-TECH-005.json) | **CTO** | Hardening Backend/Frontend, Configurazione Deploy Cloud Free-Tier (0 EUR/mese), Endpoint Magic Link Terzisti e Test Suite | 🔴 `critical` | ✅ `done` | `FTL-TECH-004`, `FTL-CEO-004` | Sì (`L3`) |

---

## 🚀 Sprint 5 — Modello Dati Flessibile, Gerarchia Stagioni & Collezioni, Tabelle Anagrafiche e Semplificazione UI

| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |
|---|:---:|---|:---:|:---:|---|:---:|
| [`FTL-CEO-005`](./FTL-CEO-005.json) | **CEO** | Direttiva Esecutiva Sprint 5: Riorganizzazione Modello Dati Flessibile, Gerarchia Stagioni & Collezioni, Tabelle Anagrafiche e Semplificazione UI | 🔴 `critical` | ✅ `done` | `FTL-CEO-004`, `FTL-TECH-005` | No (`L1`) |
| [`FTL-GOV-005`](./FTL-GOV-005.json) | **CGO** | ADR-007: Architettura Modello Dati Dinamico, Gerarchia Stagione/Collezione 1:N, Anagrafiche di Dominio e Streamlining UX | 🔴 `critical` | ✅ `done` | `FTL-GOV-004`, `FTL-CEO-005` | No (`L1`) |
| [`FTL-PROD-005`](./FTL-PROD-005.json) | **CPO** | PRD-005: Specifica Funzionale e Modello di Dominio per Modello Dati Flessibile, Gestione Stagioni & Collezioni, Tabelle Anagrafiche Master PLM/PIM e Semplificazione UI | 🔴 `critical` | ✅ `done` | `FTL-CEO-005`, `FTL-GOV-005` | No (`L1`) |
| [`FTL-TECH-006`](./FTL-TECH-006.json) | **CTO** | Sviluppo Full-Stack Piattaforma: Schema Flessibile Configurabile dal Founder, Modulo Stagioni & Collezioni, Anagrafiche Master PLM/PIM, UI Streamlined e Test Suite | 🔴 `critical` | ✅ `done` | `FTL-TECH-005`, `FTL-PROD-005`, `FTL-GOV-005` | No (`L1`) |
| [`FTL-REV-004`](./FTL-REV-004.json) | **CRO** | Analisi Commerciale & FinOps Sprint 5: Impatto Modello Multi-Stagione, Gestione Collezioni e Cost-to-Serve Anagrafiche Rete | 🟠 `high` | ✅ `done` | `FTL-REV-003`, `FTL-CEO-005`, `FTL-PROD-005` | No (`L1`) |
| [`FTL-MKT-004`](./FTL-MKT-004.json) | **CMO** | Product & Brand Marketing Sprint 5: Naming e Tassonomia Moda/Lusso (Stagioni/Collezioni), UX Positioning e Guide Operative | 🟠 `high` | ✅ `done` | `FTL-MKT-003`, `FTL-CEO-005`, `FTL-PROD-005` | No (`L1`) |

---

## 👑 Nuove Iniziative & Direttive Founder — Backlog C-Suite

Task e direttive inseriti direttamente dal Founder via **Founder Control Center** per analisi, prioritizzazione strategica (CEO/CGO) ed esecuzione da parte dei C-Level responsabili.

| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |
|---|:---:|---|:---:|:---:|---|:---:|
| [`FTL-CEO-006`](./FTL-CEO-006.json) | **CEO** | Analisi Strategica Modulo Passaporto Digitale Pellami e Tracciabilità Conceria | 🟠 `high` | ✅ `done` | — | No (`L1`) |
| [`FTL-CEO-007`](./FTL-CEO-007.json) | **CEO** | Edit degli elementi presenti in tabella | 🔴 `critical` | ✅ `done` | — | No (`L1`) |
| [`FTL-CEO-008`](./FTL-CEO-008.json) | **CEO** | Direttiva Esecutiva Sprint 6: PaaS Distrettuale 3 Tier, Tracciabilità Conceria EUDR/LWG e Matrice Taglie con Sfrido BOM | 🔴 `critical` | ✅ `done` | `FTL-CEO-005`, `FTL-CEO-007` | No (`L1`) |
| [`FTL-CEO-009`](./FTL-CEO-009.json) | **CEO** | Nuova Area Prodotti PLM: Scorporo dal Ponte 1:N, Gestione BOM Nativa & Export Excel | 🟠 `high` | ✅ `done` | `FTL-CEO-011` | No (`L1`) |
| [`FTL-CEO-010`](./FTL-CEO-010.json) | **CEO** | Revisione Modulo 04 in PIM Hub: Default 1:1, Aggregazione 1:N, Export Cataloghi & E-Commerce Feeds | 🟠 `high` | ✅ `done` | `FTL-CEO-009`, `FTL-CEO-011` | Sì (`L4`) |
| [`FTL-CEO-011`](./FTL-CEO-011.json) | **CEO** | Sospensione Temporanea Modulo 02 Work Orders Hub (ADR-009) & Allineamento C-Suite | 🟠 `high` | ✅ `done` | — | No (`L1`) |
| [`FTL-CEO-012`](./FTL-CEO-012.json) | **CEO** | Revisione Modulo 03: Vault Conceria, Upload File PDF Reali, Vincolo BOM Pelle & Import Excel | 🟠 `high` | ✅ `done` | `FTL-CEO-011` | No (`L2`) |
| [`FTL-CEO-013`](./FTL-CEO-013.json) | **CEO** | Direttiva Esecutiva Sprint 7: Gerarchia Prodotti, Classificatori Merchandising e Motore di Caricamento Rapido Articoli & BOM | 🔴 `critical` | ✅ `done` | `FTL-CEO-008`, `FTL-CEO-009` | No (`L1`) |
| [`FTL-CEO-014`](./FTL-CEO-014.json) | **CTO** | Preset BOM | 🟠 `high` | ✅ `done` | — | No (`L1`) |
| [`FTL-CEO-015`](./FTL-CEO-015.json) | **CTO** | Miglioria su scala taglie | 🟠 `high` | ✅ `done` | — | No (`L1`) |
| [`FTL-CEO-016`](./FTL-CEO-016.json) | **CEO** | Rivedere la piramide di collezione | 🟠 `high` | ✅ `done` | `FTL-TECH-016` | No (`L2`) |
| [`FTL-CEO-017`](./FTL-CEO-017.json) | **CEO** | Gestione Colori Intelligente | 🟠 `high` | 📥 `backlog` | — | Sì (`L2`) |
| [`FTL-CEO-018`](./FTL-CEO-018.json) | **CEO** | Gestione dei fornitori ed albo centralizzata | 🟠 `high` | 📥 `backlog` | — | Sì (`L2`) |
| [`FTL-GOV-006`](./FTL-GOV-006.json) | **CGO** | Governance PaaS Distrettuale 3 Tier, Formalizzazione ADR-008 e Presidio Gatekeeping L1-L6 | 🔴 `critical` | ✅ `done` | `FTL-GOV-005`, `FTL-CEO-008` | Sì (`L3`) |
| [`FTL-GOV-007`](./FTL-GOV-007.json) | **CGO** | ADR-010: Architettura Tassonomia Multi-Livello, Merchandising Matrix e Motore Atomico di Import/Clonazione BOM con Segregazione L6 | 🔴 `critical` | ✅ `done` | `FTL-CEO-013` | No (`L1`) |
| [`FTL-MKT-005`](./FTL-MKT-005.json) | **CMO** | Posizionamento PaaS Distrettuale & Storytelling Tracciabilità Conceria EUDR/LWG | 🟠 `high` | ✅ `done` | `FTL-CEO-008`, `FTL-PROD-006` | Sì (`L5`) |
| [`FTL-MKT-006`](./FTL-MKT-006.json) | **CMO** | Glossario Tassonomia Moda/Lusso, Allineamento Standard B2B (NuORDER/JOOR) e Guide Visive all'Onboarding Rapido di Campionario | 🟠 `high` | ✅ `done` | `FTL-CEO-013`, `FTL-PROD-010` | No (`L1`) |
| [`FTL-MKT-007`](./FTL-MKT-007.json) | **CMO** | Modifica Materiali di comunicazione | 🟠 `high` | ✅ `done` | — | No (`L2`) |
| [`FTL-PROD-006`](./FTL-PROD-006.json) | **CPO** | PRD-006: PaaS Distrettuale 3 Tier, Work Orders Hub con Matrice Taglie/Sfrido BOM e Vault Lotti Conceria | 🔴 `critical` | ✅ `done` | `FTL-CEO-006`, `FTL-CEO-007`, `FTL-PROD-005` | No (`L1`) |
| [`FTL-PROD-007`](./FTL-PROD-007.json) | **CPO** | PRD-007: Nuova Area PRODOTTI (PLM & BOM), Modulo PIM Catalogo Commerciale e Revisione Vault Conceria | 🔴 `critical` | ✅ `done` | `FTL-CEO-009`, `FTL-CEO-010`, `FTL-CEO-011`, `FTL-CEO-012` | No (`L1`) |
| [`FTL-PROD-008`](./FTL-PROD-008.json) | **CPO** | 06 Anagrafiche di Dominio | 🟠 `high` | ✅ `done` | — | No (`L0`) |
| [`FTL-PROD-009`](./FTL-PROD-009.json) | **CPO** | 02 Prodotti (PLM & BOM) - + Nodo BOM (L1/L2/L3) | 🟠 `high` | ✅ `done` | — | No (`L0`) |
| [`FTL-PROD-010`](./FTL-PROD-010.json) | **CPO** | PRD-008: Specifiche Funzionali e Interaction Design per Tassonomia a 3 Livelli, Classificatori di Collezione, Deep Copy BOM e Bulk Import Wizard | 🔴 `critical` | ✅ `done` | `FTL-CEO-013`, `FTL-GOV-007` | No (`L1`) |
| [`FTL-PROD-011`](./FTL-PROD-011.json) | **CPO** | PIRAMIDE e TIPO DI COSTRUZIONE editabili | 🟠 `high` | ✅ `done` | — | No (`L1`) |
| [`FTL-REV-005`](./FTL-REV-005.json) | **CRO** | Packaging Commerciale PaaS Distrettuale 3 Tier & Analisi FinOps Invarianza 0 € Terzisti | 🟠 `high` | ✅ `done` | `FTL-CEO-008`, `FTL-PROD-006` | Sì (`L4`) |
| [`FTL-REV-006`](./FTL-REV-006.json) | **CRO** | Analisi Impatto Commerciale & FinOps Sprint 7: Riduzione TTV a < 2h, Enablement Vendite Enterprise e Tutela Gratuita Terzisti | 🟠 `high` | ✅ `done` | `FTL-CEO-013`, `FTL-PROD-010` | No (`L1`) |
| [`FTL-TECH-007`](./FTL-TECH-007.json) | **CTO** | Sviluppo Full-Stack PaaS Distrettuale 3 Tier, Vault Lotti Conceria SHA-256 e Matrice Taglie/Sfrido BOM | 🔴 `critical` | ✅ `done` | `FTL-PROD-006`, `FTL-GOV-006` | Sì (`L3`) |
| [`FTL-TECH-008`](./FTL-TECH-008.json) | **CTO** | 02 Prodotti (PLM & BOM) - Azione Quick Edit | 🟠 `high` | ✅ `done` | — | No (`L0`) |
| [`FTL-TECH-009`](./FTL-TECH-009.json) | **CTO** | 02 Prodotti (PLM & BOM) - Gestione taglie | 🟠 `high` | ✅ `done` | — | No (`L0`) |
| [`FTL-TECH-010`](./FTL-TECH-010.json) | **CTO** | 03 PIM (Catalogo & Feed) - "+ NUOVO MODELLO PIM" | 🟠 `high` | ✅ `done` | — | No (`L0`) |
| [`FTL-TECH-011`](./FTL-TECH-011.json) | **CTO** | 02 Prodotti (PLM & BOM) - Genere Target non disponibile | 🟠 `high` | ✅ `done` | — | No (`L0`) |
| [`FTL-TECH-012`](./FTL-TECH-012.json) | **CTO** | Sviluppo Full-Stack: DDL Gerarchia Categorie, Query CTE Ricorsive, API Deep Copy BOM, Template Engine, Parser Bulk Import Atomico e Componenti UI React | 🔴 `critical` | ✅ `done` | `FTL-PROD-010`, `FTL-GOV-007` | No (`L1`) |
| [`FTL-TECH-013`](./FTL-TECH-013.json) | **CTO** | Link presenti su portale founder controllccenter | 🟠 `high` | ✅ `done` | — | No (`L1`) |
| [`FTL-TECH-014`](./FTL-TECH-014.json) | **CTO** | Gestione ALBERO BOM A 3 LIVELLI | 🟠 `high` | ✅ `done` | — | No (`L1`) |
| [`FTL-TECH-015`](./FTL-TECH-015.json) | **CTO** | Modifica banner su home | 🔴 `critical` | ✅ `done` | — | No (`L1`) |
| [`FTL-TECH-016`](./FTL-TECH-016.json) | **CTO** | Gestione Piramidi di Collezione con json da migliorare | 🟠 `high` | ✅ `done` | — | No (`L2`) |
| [`FTL-TECH-017`](./FTL-TECH-017.json) | **CTO** | Reportistica su codebase | 🟠 `high` | ✅ `done` | — | No (`L2`) |
| [`FTL-TECH-018`](./FTL-TECH-018.json) | **CTO** | Ottimizzazione Compattezza e Drag and Drop Nativo su Albero Distinta Base (BOM) | 🟠 `high` | ✅ `done` | `FTL-TECH-014` | No (`L2`) |
| [`FTL-TECH-019`](./FTL-TECH-019.json) | **CTO** | Duplicazione Ricorsiva Voci e Sotto-alberi Distinta Base (BOM) | 🟠 `high` | ✅ `done` | `FTL-TECH-014`, `FTL-TECH-018` | No (`L2`) |
| [`FTL-TECH-020`](./FTL-TECH-020.json) | **CTO** | Codebase Analytics: Impronta Disco Globale, Metriche MB su 3 Pilastri e Top Notice | 🟠 `high` | ✅ `done` | `FTL-TECH-017` | No (`L2`) |

---

## ⚙️ Regole di Aggiornamento
1. Ogni sub-agente di Google Antigravity, quando prende in carico un task, aggiorna `status` a `"in_progress"` e `updated_at` con il timestamp corrente.
2. Al termine della produzione dei deliverable in `Azienda/docs/`, `Azienda/adr/` o `Applicativo/`, popola `output_artifacts`, imposta `status` a `"review"` (se richiede approvazione L2–L6 del Founder) oppure `"done"`.
3. Il **Founder Control Center** (`Portale_Founder_Control/control_center.py` su `http://127.0.0.1:8080`) mantiene sincronizzato questo registro in tempo reale.
