# 📋 Founder Control Dashboard — Registro Task (`tasks/`)

Questa directory contiene i **Task Object JSON** della C-Suite di **Footlink**, validati secondo il [Task Object Schema v1.0](./schema/task-object-v1.schema.json) definito dal CGO e orchestrati tramite **Google Antigravity** (`OpenClaw` in stato *suspended*).

---

## 🚀 Stato Attuale: Primo Sprint (Bootstrap C-Suite)

| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |
|---|:---:|---|:---:|:---:|---|:---:|
| [`FTL-GOV-001`](./FTL-GOV-001.json) | **CGO** | Setup del framework di governance e creazione del primo ADR | 🔴 `critical` | ✅ `done` | — | No (`L0`) |
| [`FTL-CEO-001`](./FTL-CEO-001.json) | **CEO** | Definizione OKR Q1 e Kick-off Ufficiale della C-Suite | 🔴 `critical` | ✅ `done` | `FTL-GOV-001` | No (`L1`) |
| [`FTL-TECH-001`](./FTL-TECH-001.json) | **CTO** | Setup architettura core (Python / React / PostgreSQL) e pipeline CI/CD | 🔴 `critical` | ✅ `done` | `FTL-GOV-001`, `FTL-CEO-001` | Sì (`L3`) |
| [`FTL-PROD-001`](./FTL-PROD-001.json) | **CPO** | PRD Core MVP: Modello Dati 1:N PIM/PLM e Scheda Tecnica Filiera | 🔴 `critical` | ✅ `done` | `FTL-GOV-001`, `FTL-CEO-001` | No (`L1`) |
| [`FTL-REV-001`](./FTL-REV-001.json) | **CRO** | Strategia GTM, Pricing Tier di Rete e Modello FinOps Iniziale | 🟠 `high` | ✅ `done` | `FTL-CEO-001`, `FTL-PROD-001` | Sì (`L4`) |
| [`FTL-MKT-001`](./FTL-MKT-001.json) | **CMO** | Brand Guidelines v1.0, Landing Page Free-Tier e Presidio LinkedIn | 🟠 `high` | ✅ `done` | `FTL-CEO-001`, `FTL-PROD-001` | Sì (`L5`) |

---

## ⚙️ Regole di Aggiornamento
1. Ogni sub-agente di Google Antigravity, quando prende in carico un task, aggiorna `status` a `"in_progress"` e `updated_at` con il timestamp corrente.
2. Al termine della produzione dei deliverable in `docs/` o `adr/`, popola `output_artifacts`, imposta `status` a `"review"` (se richiede approvazione L2–L6 del Founder) oppure `"done"`.
3. Il **Founder Control Center** (`http://127.0.0.1:8080`) mantiene sincronizzato questo registro in tempo reale.
