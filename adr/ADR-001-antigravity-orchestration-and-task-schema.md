# ADR-001: Adozione Task Object Schema v1.0 e Orchestrazione C-Suite su Google Antigravity (`OpenClaw` Suspended)

- **Data:** 2026-10-18
- **Stato:** Approvata
- **Proponente:** CGO + CTO
- **Approvatore richiesto:** Founder (Livello L3 — Architettura di orchestrazione e governance)
- **Task di riferimento:** [`FTL-GOV-001`](../tasks/FTL-GOV-001.json)

## Contesto
Il progetto **Footlink** prevede una C-Suite autonoma composta da 6 ruoli (CEO, CGO, CTO, CPO, CRO, CMO) incaricata di progettare, sviluppare e portare sul mercato la piattaforma PLM+PIM per la filiera calzaturiera, della pelletteria e dell'abbigliamento.

Il Founder ha attivato il piano a pagamento **Google Antigravity / Google AI Pro** (21,99 €/mese + 30 € di crediti). Da un'analisi tecnica e FinOps è emerso che:
1. L'ambiente esterno **OpenClaw** vede esclusivamente il modello leggero *Gemini Flash*, insufficiente per garantire la profondità architetturale necessaria sui task complessi (modellazione relazionale 1:N PIM/PLM, BOM multi-livello, DPP europeo, unit economics FinOps e sviluppo full-stack Python/React/PostgreSQL).
2. L'esecuzione di 6 agenti autonomi con cicli di heartbeat su OpenClaw comporterebbe un elevato consumo dei 30 € di crediti in puro overhead di contesto.
3. **Google Antigravity** consente di invocare nativamente sub-agenti specializzati (`define_subagent` / `invoke_subagent`) con modelli di punta (`inherit` / `pro` per architettura e strategia, `flash` per validazioni leggere) mantenendo lo stato persistente dei task e delle decisioni direttamente nel repository GitHub (`adr/`, `tasks/`, `docs/`).

## Opzioni Considerate

### Opzione A: Mantenere l'orchestrazione su OpenClaw con modello Gemini Flash
- **Pro:** Daemon esterno separato dall'IDE.
- **Contro:** Qualità di ragionamento limitata al solo modello Flash; elevato consumo di crediti API per il ricaricamento continuo dei file di contesto; frammentazione tra ambiente di chat e ambiente di sviluppo codice.
- **Impatto FinOps / Costi:** Alto rischio di esaurimento rapido dei 30 € di crediti.
- **Effort stimato:** M

### Opzione B: Sospendere OpenClaw e adottare Google Antigravity + GitHub Native Governance (`adr/`, `tasks/`, `docs/`)
- **Pro:** Accesso diretto ai modelli top-tier di Google Antigravity nel medesimo ambiente in cui si scrive e testa il codice; allocazione selettiva del modello per singolo sub-agente (`pro` vs `flash`); zero overhead di infrastruttura esterna; tracciabilità Git totale tramite file JSON conformi al Task Object Schema v1.0.
- **Contro:** L'esecuzione dei sub-agenti avviene all'interno delle sessioni o automazioni di Google Antigravity.
- **Impatto FinOps / Costi:** 0 € di costi aggiuntivi; massima resa del piano da 21,99 €/mese e preservazione dei 30 € di crediti.
- **Effort stimato:** S (2–8 ore)

## Decisione
Si approva l'**Opzione B**:
1. **OpenClaw** viene posto formalmente in stato **`suspended`**.
2. **Google Antigravity** diventa la piattaforma primaria di orchestrazione della C-Suite tramite sub-agenti dedicati e skill di workspace (`.agents/skills/c-suite-orchestrator/`).
3. Il **Task Object Schema v1.0** definito dal CGO viene adottato come standard unico e validato tramite JSON Schema in [`tasks/schema/task-object-v1.schema.json`](../tasks/schema/task-object-v1.schema.json), con ogni task persistito come file JSON individuale nella directory [`tasks/`](../tasks/).
4. Il repository viene strutturato nelle directory canoniche `adr/`, `tasks/`, `docs/roles/`, `docs/governance/`, `docs/okr/`, `docs/prd/`, `docs/finops/` e `docs/marketing/`.

## Conseguenze
- **Impatto positivo atteso:** Qualità progettuale e di codice nettamente superiore grazie ai modelli avanzati di Antigravity; controllo granulare dei crediti FinOps; repository ordinato e pronto per lo scaffolding `backend/` e `frontend/`.
- **Rischi residui e mitigazioni:** Qualora in futuro servisse un bot di notifica esterna (es. Telegram/WhatsApp), potrà essere agganciato in sola lettura ai file JSON della cartella `tasks/`.
- **Task derivati:** [`FTL-GOV-001`](../tasks/FTL-GOV-001.json), [`FTL-CEO-001`](../tasks/FTL-CEO-001.json), [`FTL-TECH-001`](../tasks/FTL-TECH-001.json), [`FTL-PROD-001`](../tasks/FTL-PROD-001.json), [`FTL-REV-001`](../tasks/FTL-REV-001.json), [`FTL-MKT-001`](../tasks/FTL-MKT-001.json).

## Approvazione
- **Approvata da:** Founder — 2026-10-18
- **Note di approvazione:** OpenClaw sospeso; tutta la documentazione del repository aggiornata alla nuova impostazione Google Antigravity + GitHub.
