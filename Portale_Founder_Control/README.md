# 🎛️ Portale Founder Control — Footlink (`Portale_Founder_Control/`)

Il **Founder Control Center** è il terzo pilastro di root del repository Footlink ([ADR-005](../Azienda/adr/ADR-005-repository-three-pillars-restructuring.md)). Fornisce al Founder una cabina di regia web in tempo reale, senza dipendenze esterne (solo libreria standard Python 3), per supervisionare la C-Suite autonoma su Google Antigravity.

---

## 🚀 Avvio Rapido

Dalla root del progetto (`FootLink_v2/`):

```bash
python3 Portale_Founder_Control/control_center.py
```

Apri il browser su: **`http://127.0.0.1:8080`** (oppure imposta la variabile d'ambiente `FOOTLINK_PORT`).

---

## 🛠️ Funzionalità Principali

1. **Vista Architetturale a 3 Pilastri:** Monitoraggio unificato di `🏢 Azienda/`, `💻 Applicativo/` e `🎛️ Portale_Founder_Control/`.
2. **Kanban Board & Knowledge Hub Multi-Epoca ([`ADR-011`](../Azienda/adr/ADR-011-epoch-2-verticalization-governance-and-modular-depth.md)):** Visualizza e sincronizza in tempo reale sia i task attivi dell'**Epoca II ("La Verticalizzazione", Sprint 8+)** in `Azienda/tasks/*.json`, sia l'archivio storico consolidato dell'**Epoca I (Sprint 1–7, 67/67 Done 👑👑)** in `Azienda/tasks/archive_epoch_1/*.json`, rigenerando automaticamente [`Azienda/tasks/README.md`](../Azienda/tasks/README.md).
3. **Coda Approvazioni Founder (Gatekeeper L1–L6):** Consente al Founder di approvare i task in stato `review` o di inserire direttive e richieste di modifica direttamente nei file JSON.
4. **AI Quota Circuit Breaker (`paused_ai_quota`):** Pulsante rapido per mettere in pausa ordinata i task attivi o ripristinarli.
5. **Document & Prototype Viewer:** Renderizza in modale interattiva i file Markdown (`ADR`, `PRD`, `OKR`, `FinOps`), i prototipi HTML (con switch responsive Desktop 100% / Mobile 375px) e il codice sorgente di `Applicativo/`.
