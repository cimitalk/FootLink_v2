# 🏢 Azienda — Governance, Strategia & Deliverable C-Suite (`Azienda/`)

Questa cartella rappresenta il **Primo Pilastro** del repository Footlink ([ADR-005](./adr/ADR-005-repository-three-pillars-restructuring.md)) e racchiude l'intera struttura societaria, di governance, decisionale e documentale della **C-Suite autonoma** orchestrata su **Google Antigravity**.

---

## 🗂️ Struttura della Cartella `Azienda/`

```text
Azienda/
├── Manifesto_Fondazione_Footlink.md           # 📜 Costituzione & Governance (Fonte #1 di verità)
├── PIANO_PROSECUZIONE_STRATEGICO_EPOCA_2.md   # 🎯 Piano di Prosecuzione Strategico Epoca II (Sprint 8–12)
├── IDENTITY.md / SOUL.md / USER.md            # 🧠 Identità agente e direttive attive del Founder
├── MEMORY.md / DREAMS.md / memory/            # 🗂️ Memoria storica multi-epoca e log di sessione
├── adr/                                       # 🏛️ Architecture & Any Decision Records (Fonte #3)
│   ├── README.md                              #    Registro ADR ufficiale (ADR-000 .. ADR-011)
│   └── ADR-*.md                               #    Decisioni architetturali, di dominio e FinOps
├── tasks/                                     # 📋 Task Object JSON v1.0 & Dashboard (Fonte #4)
│   ├── README.md                              #    Stato live Multi-Epoca (Epoca II + Archivio Epoca I)
│   ├── schema/task-object-v1.schema.json
│   ├── FTL-*.json                             #    Task operativi attivi Epoca II (Sprint 8+)
│   └── archive_epoch_1/FTL-*.json             #    Archivio consolidato Epoca I (Sprint 1–7, 67/67 Done 👑👑)
└── docs/                                      # 📚 Deliverable di Dipartimento
    ├── roles/                                 #    Specifiche ufficiali dei 6 C-Level (Fonte #2)
    ├── governance/                            #    Compendio Epoca I e regole di processo CGO
    ├── okr/                                   #    Master Plan Epoca II, OKR e verbali C-Suite (CEO)
    ├── prd/                                   #    PRD-001..009, 1:N PIM/PLM, BOM, Colori, Fornitori, DPP (CPO)
    ├── technical/                             #    Blueprint tecnici e ottimizzazione multi-epoca (CTO)
    ├── finops/                                #    Unit Economics, Pricing a Rete, Cost-to-Serve (CRO/CTO)
    └── marketing/                             #    Posizionamento verticale, Brand Guidelines, DAM (CMO)
```

---

## 🏛️ Fonti di Verità (Ordine Gerarchico)
1. **[`Manifesto_Fondazione_Footlink.md`](./Manifesto_Fondazione_Footlink.md)** — Costituzione aziendale e matrice L0–L6.
2. **[`docs/roles/`](./docs/roles/)** — Mandati operativi di CEO, CGO, CTO, CPO, CRO, CMO.
3. **[`adr/README.md`](./adr/README.md)** — Registro immutabile delle decisioni approvate (`ADR-000`..`ADR-011`).
4. **[`tasks/README.md`](./tasks/README.md)** — Stato dei task validati contro [`tasks/schema/task-object-v1.schema.json`](./tasks/schema/task-object-v1.schema.json).
5. **[`PIANO_PROSECUZIONE_STRATEGICO_EPOCA_2.md`](./PIANO_PROSECUZIONE_STRATEGICO_EPOCA_2.md)** — Piano esecutivo dell'Epoca II (*"La Verticalizzazione"*, Sprint 8–12).
