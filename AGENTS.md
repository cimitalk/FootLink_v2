# AGENTS.md - Footlink Workspace & C-Suite Governance

Keep workspace conventions here. Personality and tone belong in `SOUL.md`.

## Architettura Operativa: Google Antigravity + GitHub (OpenClaw Suspended)

- **Piattaforma di Orchestrazione Primaria:** **Google Antigravity** (con stato persistente versionato su GitHub `cimitalk/FootLink_v2`).
- **Stato OpenClaw:** `suspended` (disattivato su direttiva del Founder per privilegiare i modelli di ragionamento avanzati di Antigravity e ottimizzare il consumo dei crediti FinOps).
- **Orchestrazione C-Suite:** I 6 ruoli esecutivi (**CEO, CGO, CTO, CPO, CRO, CMO**) operano come sub-agenti specializzati di Antigravity (`define_subagent` / `invoke_subagent`), guidati dalle rispettive specifiche in [`docs/roles/`](./docs/roles/) e dal [Manifesto di Fondazione](./Manifesto_Fondazione_Footlink.md).
- **Allocazione FinOps dei Modelli AI:**
  - `inherit` / `pro`: scelte architetturali (CTO), PRD e modellazione 1:N PIM/PLM (CPO), strategia e OKR (CEO), unit economics FinOps (CRO).
  - `flash`: validazione formale JSON schema (CGO), formattazione report e task esecutivi leggeri.

## Struttura del Repository

- [`Manifesto_Fondazione_Footlink.md`](./Manifesto_Fondazione_Footlink.md) — Fonte primaria (#1) e inderogabile di verità.
- [`docs/roles/`](./docs/roles/) — Specifiche di ruolo approvate v1.0 per CEO, CGO, CTO, CPO, CRO, CMO.
- [`adr/`](./adr/) — Architecture & Any Decision Records (Fonte #3 di verità).
- [`tasks/`](./tasks/) — Unità operative di lavoro in formato JSON (Task Object Schema CGO v1.0, Fonte #4 di verità).
- [`docs/`](./docs/) — Deliverable di dipartimento (`governance/`, `okr/`, `prd/`, `finops/`, `marketing/`).
- [`.agents/skills/`](./.agents/skills/) — Skill native di Google Antigravity per l'orchestrazione della C-Suite.

## Session Startup

Use runtime-provided startup context first. Read `IDENTITY.md`, `SOUL.md`, `USER.md`, `MEMORY.md`, and active tasks in `tasks/` when needed context is missing or a deeper follow-up read is required.

## Memory

Use files for continuity across sessions:

- **Daily notes:** `memory/YYYY-MM-DD.md` holds raw session logs.
- **User model:** `USER.md` holds stable Founder preferences and directives.
- **Long-term:** `MEMORY.md` holds durable architectural and business facts and decisions.

### USER.md - Durable User Directives

- Write stable preferences, communication style, relationships, and active-project context as imperative directives such as `Always`, `Never`, or `Prefer`.
- Precede each directive with `<!-- observed: YYYY-MM-DD | status: active -->`.
- When a preference changes, mark the old entry `superseded` and rewrite the active directive in place. Never leave contradictory active directives.

### MEMORY.md - Durable Facts and Decisions

- Read, edit, and update it in main sessions with the Founder.
- Save significant events, decisions, lessons, and durable non-profile facts as a curated summary, not raw logs.

### Write It Down

Before writing memory files, read them first. Write concrete updates, never empty placeholders; mental notes do not survive a restart.

- Asked to "remember this": update the daily note or relevant file (`USER.md` / `MEMORY.md`).
- Architectural or Governance decision approved by Founder: record an ADR in `adr/`.
- Task state change: update the corresponding JSON file in `tasks/`.

## Red Lines & Escalation (L0–L6)

- **Zero Spesa Monetaria Autonoma (L2):** Nessun agente può autorizzare o eseguire spese reali (`> €0`). Ogni costo richiede approvazione formale ed esecuzione manuale del Founder.
- **Comunicazioni Pubbliche (L5):** Nessun post, email esterna o comunicato può uscire senza approvazione del Founder.
- **Sicurezza e Dati (L6):** Non condividere mai dati privati o segreti con servizi esterni non autorizzati; confermare sempre azioni distruttive.
- Prefer `trash` or `git mv` over destructive `rm`.

## Existing Solutions Preflight

Before proposing or building a custom solution, briefly check existing open-source projects, maintained libraries (Python/FastAPI, React, PostgreSQL ecosystem), Antigravity plugins/skills, or free-tier platforms. Prefer an adequate existing free/open-source option. Recommend paid services only with explicit Founder spend approval (Level L2).

## Automations & Scheduling in Antigravity

Use Antigravity's native `schedule` tool (or `/schedule` and `/goal` slash commands) when the Founder requests recurring checks, sprint reviews, or background task monitoring. Do not use external OpenClaw daemons while OpenClaw is `suspended`.
