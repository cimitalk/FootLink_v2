---
name: c-suite-orchestrator
description: Orchestrates Footlink's autonomous C-Suite (CEO, CGO, CTO, CPO, CRO, CMO) inside Google Antigravity using native subagents, enforcing the 3-pillar repository structure (Azienda/, Applicativo/, Portale_Founder_Control/), Manifesto di Fondazione, Task Object Schema v1.0, ADR tracking, and FinOps credit optimization. Activate when launching or coordinating C-Level tasks or sprints.
---

# Footlink C-Suite Orchestrator Skill (Google Antigravity)

Use this skill whenever the Founder asks to run, coordinate, or review tasks assigned to Footlink's C-Suite (**CEO, CGO, CTO, CPO, CRO, CMO**).

## 1. Three-Pillar Repository Structure (`ADR-005`)

All C-Suite subagents MUST respect the 3 root folders:
- **`Azienda/`**: Governance, Manifesto (`Azienda/Manifesto_Fondazione_Footlink.md`), Role specs (`Azienda/docs/roles/`), ADRs (`Azienda/adr/`), Task Objects (`Azienda/tasks/`), and Department Deliverables (`Azienda/docs/`).
- **`Applicativo/`**: Application source code (`Applicativo/backend/`, `Applicativo/frontend/`, `Applicativo/database/`).
- **`Portale_Founder_Control/`**: Founder Control Center web dashboard (`Portale_Founder_Control/control_center.py`).

## 2. Sub-Agent Definition & Invocation Pattern

When invoking one or more C-Suite roles in Google Antigravity:

1. **Define or Reuse the Role Subagent (`define_subagent` / `invoke_subagent`):**
   - `footlink-ceo` → System prompt grounded in [`Azienda/docs/roles/Role_CEO_Footlink.md`](../../../Azienda/docs/roles/Role_CEO_Footlink.md) & [`Azienda/Manifesto_Fondazione_Footlink.md`](../../../Azienda/Manifesto_Fondazione_Footlink.md)
   - `footlink-cgo` → System prompt grounded in [`Azienda/docs/roles/Role_CGO_Footlink.md`](../../../Azienda/docs/roles/Role_CGO_Footlink.md) & [`Azienda/Manifesto_Fondazione_Footlink.md`](../../../Azienda/Manifesto_Fondazione_Footlink.md)
   - `footlink-cto` → System prompt grounded in [`Azienda/docs/roles/Role_CTO_Footlink.md`](../../../Azienda/docs/roles/Role_CTO_Footlink.md) & [`Azienda/Manifesto_Fondazione_Footlink.md`](../../../Azienda/Manifesto_Fondazione_Footlink.md)
   - `footlink-cpo` → System prompt grounded in [`Azienda/docs/roles/Role_CPO_Footlink.md`](../../../Azienda/docs/roles/Role_CPO_Footlink.md) & [`Azienda/Manifesto_Fondazione_Footlink.md`](../../../Azienda/Manifesto_Fondazione_Footlink.md)
   - `footlink-cro` → System prompt grounded in [`Azienda/docs/roles/Role_CRO_Footlink.md`](../../../Azienda/docs/roles/Role_CRO_Footlink.md) & [`Azienda/Manifesto_Fondazione_Footlink.md`](../../../Azienda/Manifesto_Fondazione_Footlink.md)
   - `footlink-cmo` → System prompt grounded in [`Azienda/docs/roles/Role_CMO_Footlink.md`](../../../Azienda/docs/roles/Role_CMO_Footlink.md) & [`Azienda/Manifesto_Fondazione_Footlink.md`](../../../Azienda/Manifesto_Fondazione_Footlink.md)

2. **Model Tier Selection (FinOps Rule):**
   - Always pass `Model: "inherit"` (unless the Founder explicitly requests a specific tier, or `flash` for lightweight CGO schema checks).
   - Launch independent tasks **in parallel** in a single `invoke_subagent` call once their dependencies in `Azienda/tasks/` are `done`.

3. **Mandatory Post-Execution Checklist:**
   - Update the corresponding `Azienda/tasks/FTL-XXX-NNN.json` file (`status`, `updated_at`, `output_artifacts` with root-relative paths prefixed by `Azienda/`, `Applicativo/`, or `Portale_Founder_Control/`, and `actual_effort`).
   - Update the summary table in [`Azienda/tasks/README.md`](../../../Azienda/tasks/README.md) and, if an ADR was created, [`Azienda/adr/README.md`](../../../Azienda/adr/README.md).
   - Surface any **L2–L6 Escalation** clearly to the Founder for approval in `Portale_Founder_Control/control_center.py`.
