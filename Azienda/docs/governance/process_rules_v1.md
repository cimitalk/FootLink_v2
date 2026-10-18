# 🏛️ Regole Operative di Processo della C-Suite (v1.0)

- **Documento:** `docs/governance/process_rules_v1.md`
- **Owner:** Chief Governance Officer (CGO)
- **Riferimento ADR:** [ADR-001](../../adr/ADR-001-antigravity-orchestration-and-task-schema.md)
- **Task di origine:** [`FTL-GOV-001`](../../tasks/FTL-GOV-001.json)
- **Stato:** Attivo e vincolante

---

## 1. Orchestrazione Nativa su Google Antigravity (`OpenClaw` Suspended)

In conformità con l'[ADR-001](../../adr/ADR-001-antigravity-orchestration-and-task-schema.md):
1. La piattaforma **OpenClaw** è posta in stato **`suspended`**.
2. I 6 membri della C-Suite (**CEO, CGO, CTO, CPO, CRO, CMO**) vengono eseguiti come **sub-agenti nativi di Google Antigravity** (`define_subagent` / `invoke_subagent`) seguendo la skill di workspace [`.agents/skills/c-suite-orchestrator/SKILL.md`](../../.agents/skills/c-suite-orchestrator/SKILL.md).
3. Tutta la memoria di stato è **Git-native**: nessuna decisione o avanzamento esiste se non è committato nei file di [`adr/`](../../adr/), [`tasks/`](../../tasks/) e [`docs/`](../).

---

## 2. Ciclo di Vita di un Task (`tasks/FTL-XXX-NNN.json`)

Ogni attività della C-Suite deve avere un file corrispondente in [`tasks/`](../../tasks/) conforme a [`tasks/schema/task-object-v1.schema.json`](../../tasks/schema/task-object-v1.schema.json):

1. **Presa in carico (`todo` → `in_progress`):**
   - Verifica che tutti i task elencati in `dependencies` siano in stato `done`.
   - Aggiorna `status: "in_progress"` e `updated_at`.
2. **Esecuzione e Deliverable:**
   - Produce gli artefatti nella cartella di competenza (`docs/okr/`, `docs/prd/`, `docs/finops/`, `docs/marketing/`, `adr/`, `backend/`, `frontend/`).
   - Registra i path relativi nel campo `output_artifacts`.
3. **Escalation e Revisione (`in_progress` → `review` o `done`):**
   - Se il task comporta decisioni di livello **L2 (Spesa > 0 €), L3 (Architettura), L4 (Pricing), L5 (Comunicazione esterna) o L6 (Sicurezza/GDPR)**, imposta `requires_escalation: true`, compila `escalation_reason` e porta lo stato a `review` in attesa della delibera del **Founder**.
   - Se il task è di livello **L0/L1** e rispetta tutti gli `acceptance_criteria`, può passare a `done` aggiornando `actual_effort` e la tabella riassuntiva in [`tasks/README.md`](../../tasks/README.md).

---

## 3. Disciplina FinOps sull'Uso dei Modelli AI in Antigravity

Per massimizzare il rendimento del piano **Google Antigravity Pro (21,99 €/mese + 30 € di crediti)**:
- **Modello `inherit` / `pro`:** da utilizzare per task ad alta densità cognitiva e progettuale (`FTL-CEO-001`, `FTL-TECH-001`, `FTL-PROD-001`, `FTL-REV-001`, scrittura codice core e ADR).
- **Modello `flash`:** da utilizzare per task di verifica sintattica JSON, audit formale CGO, riassunti veloci o formattazione documentale.
- **Zero Chiacchiere Inter-Agente:** I sub-agenti comunicano attraverso artefatti concreti salvati su disco (`docs/`, `adr/`, `tasks/`), evitando loop conversazionali improduttivi.
