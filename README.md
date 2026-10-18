# Footlink — Autonomous C-Suite & PLM+PIM Fashion Platform

Infrastruttura digitale integrata di **PLM** (Product Lifecycle Management) e **PIM** (Product Information Management) per la filiera **calzaturiera, della pelletteria e dell'abbigliamento**.

Questo repository è strutturato nei **3 pilastri principali di root** definiti dal Founder e formalizzati in [ADR-005](./Azienda/adr/ADR-005-repository-three-pillars-restructuring.md), orchestrati nativamente tramite **Google Antigravity** con supervisione del Founder (`OpenClaw` posto in stato *suspended* come da [ADR-001](./Azienda/adr/ADR-001-antigravity-orchestration-and-task-schema.md)):

1. **[`🏢 Azienda/`](./Azienda/)** — Governance, Manifesto di Fondazione, Ruoli C-Suite, Registro ADR (`adr/`), Task Object JSON (`tasks/`) e Deliverable di dipartimento (`docs/`).
2. **[`💻 Applicativo/`](./Applicativo/)** — Codice sorgente della piattaforma SaaS (`backend/` Python FastAPI, `frontend/` React TypeScript, `database/` PostgreSQL DDL & migrazioni).
3. **[`🎛️ Portale_Founder_Control/`](./Portale_Founder_Control/)** — Cabina di regia web locale del Founder (`control_center.py` su `http://127.0.0.1:8080`) per approvazioni L1–L6 e monitoraggio real-time.

---

## 🗂️ Struttura del Repository (3 Pilastri di Root)

```text
FootLink_v2/
├── Azienda/                                   # 🏢 PILASTRO 1: Governance, C-Suite & Documentazione
│   ├── Manifesto_Fondazione_Footlink.md       # 📜 Costituzione & Governance (Fonte #1 di verità)
│   ├── IDENTITY.md / SOUL.md / USER.md        # 🧠 Identità agente e direttive attive del Founder
│   ├── MEMORY.md / DREAMS.md / memory/        # 🗂️ Memoria storica e log di sessione
│   ├── adr/                                   # 🏛️ Architecture & Any Decision Records (Fonte #3)
│   │   ├── README.md                          #    Registro ADR ufficiale (ADR-000 .. ADR-005+)
│   │   └── ADR-*.md                           #    Decisioni architetturali, di dominio e FinOps
│   ├── tasks/                                 # 📋 Task Object JSON v1.0 & Dashboard (Fonte #4)
│   │   ├── README.md                          #    Stato live di Sprint 1 e Sprint 2
│   │   ├── schema/task-object-v1.schema.json
│   │   └── FTL-*.json                         #    Task operativi della C-Suite
│   └── docs/                                  # 📚 Documentazione e Deliverable di Dipartimento
│       ├── roles/                             #    Specifiche ufficiali dei 6 C-Level (Fonte #2)
│       ├── governance/                        #    Regole di processo CGO
│       ├── okr/                               #    OKR trimestrali e verbali C-Suite (CEO)
│       ├── prd/                               #    PRD, modello 1:N PIM/PLM, BOM, DPP (CPO)
│       ├── finops/                            #    Pricing a Rete, Cost-to-Serve, Playbook (CRO/CTO)
│       └── marketing/                         #    Brand Guidelines, Piano Editoriale, Landing (CMO)
├── Applicativo/                               # 💻 PILASTRO 2: Codice Sorgente Piattaforma PLM+PIM
│   ├── backend/                               # 🐍 API REST Python FastAPI + SQLAlchemy 2.0 + Pytest
│   ├── frontend/                              # ⚛️ SPA React 18 + TypeScript + Vite
│   └── database/                              # 🗄️ Schema PostgreSQL, migrazioni e seed dati
├── Portale_Founder_Control/                   # 🎛️ PILASTRO 3: Cabina di Regia del Founder
│   ├── control_center.py                      # 🖥️ Dashboard web zero-dependency (http://127.0.0.1:8080)
│   └── README.md                              # 📖 Guida operativa del Portale
├── AGENTS.md                                  # ⚙️ Regole operative del workspace per Google Antigravity
├── .agents/skills/                            # 🤖 Skill native Google Antigravity (c-suite-orchestrator)
└── .github/workflows/ci.yml                   # 🔄 Pipeline CI (Validazione JSON Schema + Pytest Backend)
```

---

## 📚 Documentazione Core & Ruoli C-Suite (Approvati v1.1)

| Documento | Ruolo / Ambito | Stato | Descrizione |
|---|---|:---:|---|
| [📜 Manifesto di Fondazione](./Azienda/Manifesto_Fondazione_Footlink.md) | **Costituzione & Governance** | 🟢 Approvato v1.1 | Visione, principi operativi agenti AI su Antigravity, zero spesa autonoma e matrice escalation (L0–L6). |
| [👤 Role: CEO](./Azienda/docs/roles/Role_CEO_Footlink.md) | **Chief Executive Officer** | 🟢 Approvato v1.1 | Visione, coordinamento C-Suite, arbitraggio blocchi (< 24h), supervisione FinOps e interfaccia Founder. |
| [🏛️ Role: CGO](./Azienda/docs/roles/Role_CGO_Footlink.md) | **Chief Governance Officer** | 🟢 Approvato v1.1 | Task Object Schema JSON v1.0, stato `paused_ai_quota`, registro `Azienda/adr/` e ordine dei 3 pilastri. |
| [🛠️ Role: CTO](./Azienda/docs/roles/Role_CTO_Footlink.md) | **Chief Technology Officer** | 🟢 Approvato v1.1 | Architettura Python + React + PostgreSQL in `Applicativo/`, free-tier hosting e report Cost-to-Serve. |
| [📦 Role: CPO](./Azienda/docs/roles/Role_CPO_Footlink.md) | **Chief Product Officer** | 🟢 Approvato v1.1 | Modello dati **1 PIM (Vendita) ↔ N PLM (Produzione)**, schede tecniche, BOM, DPP e scoring RICE. |
| [💰 Role: CRO](./Azienda/docs/roles/Role_CRO_Footlink.md) | **Chief Revenue Officer** | 🟢 Approvato v1.1 | Modello a rete (Terzisti a costo zero, PMI SaaS, Brand Enterprise) e FinOps Unit Economics (Margine > 75%). |
| [📢 Role: CMO](./Azienda/docs/roles/Role_CMO_Footlink.md) | **Chief Marketing Officer** | 🟢 Approvato v1.1 | Brand identity, marketing organico B2B nei distretti (LinkedIn, SEO, fiere), zero ads e controllo uscite L5. |

---

## 🏗️ Principi Architetturali e di Business Fondamentali

1. **Il Ponte PIM ↔ PLM (1 : N):** 1 articolo commerciale PIM rivolto alla **vendita** può essere associato a **uno o più articoli PLM** rivolti alla **produzione** (multi-sourcing, lotti diversi, laboratori differenti).
2. **Effetto Rete a Costo Zero:** I laboratori terzisti accedono e collaborano **a costo zero (0 €)**, rendendo virale l'adozione per le PMI produttive e i Brand.
3. **Gestione FinOps Rigorosa:** Monitoraggio continuo del *Cost-to-Serve* (consumo computazionale e crediti AI per cliente e per sub-agente) per garantire un margine lordo SaaS costantemente superiore al 75%.
4. **Zero Spesa Monetaria Autonoma:** Nessun agente AI ha facoltà di spesa monetaria reale (> €0) né di firma contrattuale; tutte le spese e gli accordi sono riservati al Founder (Livello L2).
5. **AI Quota & Circuit Breaker:** In caso di esaurimento crediti o rate-limit del piano Google Antigravity / Google AI Pro, l'operatività va in pausa ordinata (`paused_ai_quota`) fino al ciclo successivo senza creare disservizi.

---

## 🎛️ Avvio del Portale Founder Control Center

```bash
python3 Portale_Founder_Control/control_center.py
```

Consulta la **[Founder Control Dashboard (`Azienda/tasks/README.md`)](./Azienda/tasks/README.md)** per lo stato aggiornato di **Sprint 1** e **Sprint 2**.

---

## ⚙️ Standard Operativi
- **Piattaforma Orchestrazione Agenti:** **Google Antigravity** (Sub-Agents C-Suite & GitHub Native Governance; `OpenClaw` *suspended* — vedi [ADR-001](./Azienda/adr/ADR-001-antigravity-orchestration-and-task-schema.md))
- **Struttura Repository:** 3 Pilastri di Root (`Azienda/`, `Applicativo/`, `Portale_Founder_Control/` — vedi [ADR-005](./Azienda/adr/ADR-005-repository-three-pillars-restructuring.md))
- **Task Schema:** [JSON Schema v1.0](./Azienda/tasks/schema/task-object-v1.schema.json)
- **Registro Decisioni:** [Registro ADR (`Azienda/adr/`)](./Azienda/adr/README.md)
- **Convenzione Commit:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
