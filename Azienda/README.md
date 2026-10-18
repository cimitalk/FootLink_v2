# 🏢 Azienda — Governance, Strategia & Deliverable C-Suite (`Azienda/`)

Questa cartella rappresenta il **Primo Pilastro** del repository Footlink ([ADR-005](./adr/ADR-005-repository-three-pillars-restructuring.md)) e racchiude l'intera struttura societaria, di governance, decisionale e documentale della **C-Suite autonoma** orchestrata su **Google Antigravity**.

---

## 🗂️ Struttura della Cartella `Azienda/`

```text
Azienda/
├── Manifesto_Fondazione_Footlink.md   # 📜 Costituzione & Governance (Fonte #1 di verità)
├── IDENTITY.md / SOUL.md / USER.md    # 🧠 Identità agente e direttive attive del Founder
├── MEMORY.md / DREAMS.md / memory/    # 🗂️ Memoria storica e log di sessione
├── adr/                               # 🏛️ Architecture & Any Decision Records (Fonte #3)
│   ├── README.md                      #    Registro ADR ufficiale (ADR-000 .. ADR-005+)
│   └── ADR-*.md                       #    Decisioni architetturali, di dominio e FinOps
├── tasks/                             # 📋 Task Object JSON v1.0 & Dashboard (Fonte #4)
│   ├── README.md                      #    Stato live di Sprint 1 e Sprint 2
│   ├── schema/task-object-v1.schema.json
│   └── FTL-*.json                     #    Task operativi C-Suite
└── docs/                              # 📚 Deliverable di Dipartimento
    ├── roles/                         #    Specifiche ufficiali dei 6 C-Level (Fonte #2)
    ├── governance/                    #    Regole di processo CGO
    ├── okr/                           #    OKR trimestrali e verbali C-Suite (CEO)
    ├── prd/                           #    PRD, modello 1:N PIM/PLM, BOM, DPP (CPO)
    ├── finops/                        #    Pricing a Rete, Cost-to-Serve, Playbook (CRO/CTO)
    └── marketing/                     #    Brand Guidelines, Piano Editoriale, Landing (CMO)
```

---

## 🏛️ Fonti di Verità (Ordine Gerarchico)
1. **[`Manifesto_Fondazione_Footlink.md`](./Manifesto_Fondazione_Footlink.md)** — Costituzione aziendale e matrice L0–L6.
2. **[`docs/roles/`](./docs/roles/)** — Mandati operativi di CEO, CGO, CTO, CPO, CRO, CMO.
3. **[`adr/README.md`](./adr/README.md)** — Registro immutabile delle decisioni approvate.
4. **[`tasks/README.md`](./tasks/README.md)** — Stato dei task validati contro [`tasks/schema/task-object-v1.schema.json`](./tasks/schema/task-object-v1.schema.json).
