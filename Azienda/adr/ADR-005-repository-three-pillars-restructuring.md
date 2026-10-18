# ADR-005: Riorganizzazione Repository in 3 Pilastri di Root (`Azienda/`, `Applicativo/`, `Portale_Founder_Control/`)

- **Data:** 2026-10-18
- **Stato:** Approvata
- **Proponente:** Founder + CGO
- **Approvatore richiesto:** Founder (Direttiva Diretta — Governance & Struttura Repository)
- **Task di riferimento:** [`FTL-GOV-002`](../tasks/FTL-GOV-002.json)

## Contesto
Con il completamento dello Sprint 1 (Bootstrap C-Suite) e l'avvio dello Sprint 2 (Sviluppo Core Applicativo PLM/PIM, Database PostgreSQL, UI/UX Scheda Tecnica e Go-To-Market), la root del repository `FootLink_v2` rischiava di mescolare in un unico livello:
1. Documentazione strategica, governance, identità degli agenti, ADR, task e deliverable di dipartimento.
2. Codice sorgente del prodotto SaaS (backend FastAPI, frontend React, migrazioni database).
3. Il portale locale di supervisione e approvazione del Founder (`control_center.py`).

Su direttiva esplicita del **Founder**, è necessario imporre una separazione architetturale e organizzativa netta fin dalla root del repository, affinché ogni agente AI della C-Suite e ogni sviluppatore umano operi all'interno di confini di responsabilità inequivocabili.

## Opzioni Considerate

### Opzione A: Mantenere una struttura piatta in root (`adr/`, `tasks/`, `docs/`, `backend/`, `frontend/`, `tools/`)
- **Pro:** Path leggermente più brevi.
- **Contro:** Scarsa separazione visiva e concettuale tra l'"Azienda" (governance, strategia, marketing, finops), il "Prodotto Software" (`backend/`, `frontend/`, `database/`) e la "Cabina di Regia del Founder" (`control_center.py`).
- **Impatto FinOps / Costi:** 0 €, ma maggiore entropia cognitiva nei prompt di contesto dei sub-agenti.
- **Effort stimato:** Nullo.

### Opzione B: Riorganizzazione in 3 Cartelle Principali di Root (`Azienda/`, `Applicativo/`, `Portale_Founder_Control/`)
- **Pro:**
  1. **`🏢 Azienda/`**: Racchiude l'intera organizzazione aziendale autonoma (`Manifesto_Fondazione_Footlink.md`, `IDENTITY.md`, `SOUL.md`, `USER.md`, `MEMORY.md`, `DREAMS.md`, `adr/`, `tasks/`, `docs/`, `memory/`).
  2. **`💻 Applicativo/`**: Isola in modo pulito tutto lo stack tecnologico del prodotto (`backend/`, `frontend/`, `database/`), facilitando CI/CD, containerizzazione e deploy.
  3. **`🎛️ Portale_Founder_Control/`**: Dedica un ambiente autonomo e immediatamente accessibile al **Founder Control Center** (`control_center.py`) per il monitoraggio in tempo reale, la visualizzazione dei deliverable e il gatekeeping L1–L6.
- **Contro:** Richiede l'aggiornamento dei riferimenti nei task JSON, nella pipeline GitHub Actions (`.github/workflows/ci.yml`) e nel server `control_center.py`.
- **Impatto FinOps / Costi:** 0 € di spesa infrastrutturale; riduzione dei token di contesto per gli agenti tecnici (CTO lavora focalizzato in `Applicativo/`, ruoli di business in `Azienda/`).
- **Effort stimato:** S (2h)

## Decisione
Si approva ed esegue immediatamente l'**Opzione B**. La root del repository `/FootLink_v2` è strutturata inderogabilmente nei **3 pilastri principali**:

```text
FootLink_v2/
├── Azienda/                    # 🏢 Governance, Manifesto, ADR, Task JSON, Ruoli e Deliverable C-Suite
│   ├── Manifesto_Fondazione_Footlink.md
│   ├── IDENTITY.md / SOUL.md / USER.md / MEMORY.md / DREAMS.md
│   ├── adr/                    #    Architecture & Any Decision Records (ADR-000 .. ADR-005+)
│   ├── tasks/                  #    Task Object JSON v1.0 (FTL-*-001, FTL-*-002) & Schema
│   ├── docs/                   #    Deliverable di dipartimento (roles, governance, okr, prd, finops, marketing)
│   └── memory/                 #    Log storici di sessione
├── Applicativo/                # 💻 Codice Sorgente Piattaforma SaaS PLM+PIM
│   ├── backend/                #    Python FastAPI, SQLAlchemy 2.0, Pydantic v2, Pytest
│   ├── frontend/               #    React 18, TypeScript, Vite, UI/UX PIM ↔ PLM
│   └── database/               #    DDL SQL, script di migrazione e seed dati filiera
└── Portale_Founder_Control/    # 🎛️ Cabina di Regia e Approvazione del Founder (L1–L6)
    ├── control_center.py       #    Server web zero-dependency (http://127.0.0.1:8080)
    └── README.md               #    Guida operativa del Portale Founder Control
```

## Conseguenze
- **Impatto positivo atteso:** Massima chiarezza strutturale per il Founder e per i 6 sub-agenti C-Suite su Google Antigravity; separazione netta tra artefatti di governance (`Azienda/`), codice eseguibile del prodotto (`Applicativo/`) e strumenti di controllo (`Portale_Founder_Control/`).
- **Aggiornamenti applicati:**
  - Tutti gli `output_artifacts` nei file `Azienda/tasks/FTL-*.json` usano ora path relativi alla root prefissati con `Azienda/`, `Applicativo/` o `Portale_Founder_Control/`.
  - Il workflow `.github/workflows/ci.yml` valida `Azienda/tasks/*.json` contro `Azienda/tasks/schema/task-object-v1.schema.json` ed esegue i test pytest in `Applicativo/backend`.
  - `Portale_Founder_Control/control_center.py` legge nativamente i 3 pilastri e supporta i task di Sprint 1 e Sprint 2.

## Approvazione
- **Approvata da:** Founder — 2026-10-18
- **Note di approvazione:** Direttiva architetturale esecutiva per l'avvio dello Sprint 2.
