---
name: c-suite-orchestrator
description: Orchestrates Footlink's autonomous C-Suite (CEO, CGO, CTO, CPO, CRO, CMO) inside Google Antigravity using native subagents, enforcing the Manifesto di Fondazione, Task Object Schema v1.0, ADR tracking, and FinOps credit optimization. Activate when launching or coordinating C-Level tasks or sprints.
---

# Footlink C-Suite Orchestrator Skill (Google Antigravity)

Use this skill whenever the Founder asks to run, coordinate, or review tasks assigned to Footlink's C-Suite (**CEO, CGO, CTO, CPO, CRO, CMO**).

## 1. Sub-Agent Definition & Invocation Pattern

When invoking one or more C-Suite roles in Google Antigravity:

1. **Define or Reuse the Role Subagent (`define_subagent` / `invoke_subagent`):**
   - `footlink-ceo` → System prompt grounded in [`docs/roles/Role_CEO_Footlink.md`](../../../docs/roles/Role_CEO_Footlink.md) & [`Manifesto_Fondazione_Footlink.md`](../../../Manifesto_Fondazione_Footlink.md)
   - `footlink-cgo` → System prompt grounded in [`docs/roles/Role_CGO_Footlink.md`](../../../docs/roles/Role_CGO_Footlink.md) & [`Manifesto_Fondazione_Footlink.md`](../../../Manifesto_Fondazione_Footlink.md)
   - `footlink-cto` → System prompt grounded in [`docs/roles/Role_CTO_Footlink.md`](../../../docs/roles/Role_CTO_Footlink.md) & [`Manifesto_Fondazione_Footlink.md`](../../../Manifesto_Fondazione_Footlink.md)
   - `footlink-cpo` → System prompt grounded in [`docs/roles/Role_CPO_Footlink.md`](../../../docs/roles/Role_CPO_Footlink.md) & [`Manifesto_Fondazione_Footlink.md`](../../../Manifesto_Fondazione_Footlink.md)
   - `footlink-cro` → System prompt grounded in [`docs/roles/Role_CRO_Footlink.md`](../../../docs/roles/Role_CRO_Footlink.md) & [`Manifesto_Fondazione_Footlink.md`](../../../Manifesto_Fondazione_Footlink.md)
   - `footlink-cmo` → System prompt grounded in [`docs/roles/Role_CMO_Footlink.md`](../../../docs/roles/Role_CMO_Footlink.md) & [`Manifesto_Fondazione_Footlink.md`](../../../Manifesto_Fondazione_Footlink.md)

2. **Model Tier Selection (FinOps Rule):**
   - Always pass `Model: "inherit"` (unless the Founder explicitly requests a specific tier, or `flash` for lightweight CGO schema checks).
   - Launch independent tasks **in parallel** in a single `invoke_subagent` call (e.g., `FTL-TECH-001` + `FTL-PROD-001`, or `FTL-REV-001` + `FTL-MKT-001`) once their dependencies in `tasks/` are `done`.

3. **Mandatory Post-Execution Checklist:**
   - Update the corresponding `tasks/FTL-XXX-NNN.json` file (`status`, `updated_at`, `output_artifacts`, `actual_effort`).
   - Update the summary table in [`tasks/README.md`](../../../tasks/README.md) and, if an ADR was created, [`adr/README.md`](../../../adr/README.md).
   - Surface any **L2–L6 Escalation** clearly to the Founder for approval.
