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

## ⚙️ Regole di Aggiornamento
1. Ogni sub-agente di Google Antigravity, quando prende in carico un task, aggiorna `status` a `"in_progress"` e `updated_at` con il timestamp corrente.
2. Al termine della produzione dei deliverable in `Azienda/docs/`, `Azienda/adr/` o `Applicativo/`, popola `output_artifacts`, imposta `status` a `"review"` (se richiede approvazione L2–L6 del Founder) oppure `"done"`.
3. Il **Founder Control Center** (`Portale_Founder_Control/control_center.py` su `http://127.0.0.1:8080`) mantiene sincronizzato questo registro in tempo reale.
