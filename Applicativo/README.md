# 💻 Applicativo — Piattaforma SaaS PLM + PIM (`Applicativo/`)

Questa cartella rappresenta il **Secondo Pilastro** del repository Footlink ([ADR-005](../Azienda/adr/ADR-005-repository-three-pillars-restructuring.md)) e contiene tutto il codice sorgente eseguibile della piattaforma B2B **PLM (Product Lifecycle Management) + PIM (Product Information Management)** per la filiera calzaturiera, della pelletteria e dell'abbigliamento.

---

## 🗂️ Struttura della Cartella `Applicativo/`

```text
Applicativo/
├── backend/       # 🐍 API REST Python 3.11+ & FastAPI
│   ├── app/       #    Modelli dominio 1:N PIM↔PLM, BOM multi-livello, DPP UE, SQLAlchemy/Pydantic
│   ├── tests/     #    Suite di test automatizzati Pytest
│   └── requirements.txt
├── frontend/      # ⚛️ Single Page Application React 18 + TypeScript + Vite
│   └── src/       #    Interfacce Brand/PMI (Scheda Tecnica, BOM, PIM) e Portale Terzisti 0€
└── database/      # 🗄️ Schema PostgreSQL, DDL SQL, migrazioni e seed dati filiera
```

---

## 🏗️ Principi Tecnici di Riferimento
- **Stack Core ([ADR-002](../Azienda/adr/ADR-002-core-architecture-free-tier.md)):** Python (FastAPI) + React (TypeScript) + PostgreSQL su infrastruttura **100% Free-Tier** (0 € di costo fisso in fase di bootstrap).
- **Modello di Dominio ([ADR-003](../Azienda/adr/ADR-003-domain-model-1-to-n-pim-plm.md)):** Relazione **1 Articolo PIM (Vendita) ↔ N Articoli PLM (Produzione)** con Distinta Base (BOM) gerarchica e Passaporto Digitale del Prodotto (DPP UE ESPR).
- **Esecuzione Test Backend:**
  ```bash
  pytest Applicativo/backend
  ```
