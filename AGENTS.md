# AGENTS.md - Footlink Workspace & C-Suite Governance

Keep workspace conventions here. Personality and tone belong in `Azienda/SOUL.md`.

## Architettura Operativa: Google Antigravity + GitHub (OpenClaw Suspended)

- **Piattaforma di Orchestrazione Primaria:** **Google Antigravity** (con stato persistente versionato su GitHub `cimitalk/FootLink_v2`).
- **Stato OpenClaw:** `suspended` (disattivato su direttiva del Founder per privilegiare i modelli di ragionamento avanzati di Antigravity e ottimizzare il consumo dei crediti FinOps).
- **Orchestrazione C-Suite:** I 6 ruoli esecutivi (**CEO, CGO, CTO, CPO, CRO, CMO**) operano come sub-agenti specializzati di Antigravity (`define_subagent` / `invoke_subagent`), guidati dalle rispettive specifiche in [`Azienda/docs/roles/`](./Azienda/docs/roles/) e dal [Manifesto di Fondazione](./Azienda/Manifesto_Fondazione_Footlink.md).
- **Allocazione FinOps dei Modelli AI:**
  - `inherit` / `pro`: scelte architetturali (CTO), PRD e modellazione 1:N PIM/PLM (CPO), strategia e OKR (CEO), unit economics FinOps (CRO).
  - `flash`: validazione formale JSON schema (CGO), formattazione report e task esecutivi leggeri.

## Struttura del Repository a 3 Pilastri ([ADR-005](./Azienda/adr/ADR-005-repository-three-pillars-restructuring.md))

La root del repository è organizzata rigorosamente in **3 cartelle principali**:

1. **[`Azienda/`](./Azienda/)** — Governance, Identità Agenti e Deliverable C-Suite:
   - [`Azienda/Manifesto_Fondazione_Footlink.md`](./Azienda/Manifesto_Fondazione_Footlink.md) — Fonte primaria (#1) e inderogabile di verità.
   - [`Azienda/docs/roles/`](./Azienda/docs/roles/) — Specifiche di ruolo approvate v1.1 per CEO, CGO, CTO, CPO, CRO, CMO (Fonte #2).
   - [`Azienda/adr/`](./Azienda/adr/) — Architecture & Any Decision Records (Fonte #3).
   - [`Azienda/tasks/`](./Azienda/tasks/) — Unità operative di lavoro in formato JSON (Task Object Schema CGO v1.0, Fonte #4).
   - [`Azienda/docs/`](./Azienda/docs/) — Deliverable di dipartimento (`governance/`, `okr/`, `prd/`, `finops/`, `marketing/`).
2. **[`Applicativo/`](./Applicativo/)** — Codice sorgente della piattaforma PLM+PIM:
   - [`Applicativo/backend/`](./Applicativo/backend/) — API FastAPI, SQLAlchemy 2.0, Pydantic v2, Pytest.
   - [`Applicativo/frontend/`](./Applicativo/frontend/) — SPA React 18 + TypeScript + Vite.
   - [`Applicativo/database/`](./Applicativo/database/) — Schema PostgreSQL, migrazioni e seed dati.
3. **[`Portale_Founder_Control/`](./Portale_Founder_Control/)** — Cabina di regia del Founder:
   - [`Portale_Founder_Control/control_center.py`](./Portale_Founder_Control/control_center.py) — Dashboard web locale (`http://127.0.0.1:8080`) per approvazioni L1–L6 e sincronizzazione task.

## Session Startup

Use runtime-provided startup context first. Read `Azienda/IDENTITY.md`, `Azienda/SOUL.md`, `Azienda/USER.md`, `Azienda/MEMORY.md`, and active tasks in `Azienda/tasks/` when needed context is missing or a deeper follow-up read is required.

## Memory

Use files inside `Azienda/` for continuity across sessions:

- **Daily notes:** `Azienda/memory/YYYY-MM-DD.md` holds raw session logs.
- **User model:** `Azienda/USER.md` holds stable Founder preferences and directives.
- **Long-term:** `Azienda/MEMORY.md` holds durable architectural and business facts and decisions.

### Write It Down

Before writing memory files, read them first. Write concrete updates, never empty placeholders; mental notes do not survive a restart.

- Asked to "remember this": update the daily note or relevant file (`Azienda/USER.md` / `Azienda/MEMORY.md`).
- Architectural or Governance decision approved by Founder: record an ADR in `Azienda/adr/`.
- Task state change: update the corresponding JSON file in `Azienda/tasks/`.

## Red Lines & Escalation (L0–L6)

- **Zero Spesa Monetaria Autonoma (L2):** Nessun agente può autorizzare o eseguire spese reali (`> €0`). Ogni costo richiede approvazione formale ed esecuzione manuale del Founder.
- **Comunicazioni Pubbliche (L5):** Nessun post, email esterna o comunicato può uscire senza approvazione del Founder.
- **Sicurezza e Dati (L6):** Non condividere mai dati privati o segreti con servizi esterni non autorizzati; confermare sempre azioni distruttive.
- Prefer `trash` or `git mv` over destructive `rm`.

## Existing Solutions Preflight

Before proposing or building a custom solution, briefly check existing open-source projects, maintained libraries (Python/FastAPI, React, PostgreSQL ecosystem), Antigravity plugins/skills, or free-tier platforms. Prefer an adequate existing free/open-source option. Recommend paid services only with explicit Founder spend approval (Level L2).

## Automations & Scheduling in Antigravity

Use Antigravity's native `schedule` tool (or `/schedule` and `/goal` slash commands) when the Founder requests recurring checks, sprint reviews, or background task monitoring. Do not use external OpenClaw daemons while OpenClaw is `suspended`.
