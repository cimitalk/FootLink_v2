# 🏛️ Registro Decision Record (ADR) — Footlink

Questo registro raccoglie tutte le decisioni architetturali, di governance, di business e di processo (**Architecture / Any Decision Record**) della startup **Footlink**, secondo la gerarchia delle fonti definita nel [Manifesto di Fondazione](../Manifesto_Fondazione_Footlink.md) (Fonte #3 di verità).

A partire dallo **Sprint 8 ("La Ripartenza")**, il registro è strutturato in **due Epoche storiche** ai sensi di [`ADR-011`](./ADR-011-epoch-2-verticalization-governance-and-modular-depth.md):
- **🚀 Epoca II — La Verticalizzazione (Da Sprint 8):** Decisioni volte ad approfondire verticalmente le capacità funzionali, le automazioni e l'intelligenza di dominio all'interno dei 9 moduli esistenti (*Zero Horizontal Bloat / Deep Vertical Capabilities*).
- **📦 Archivio Consolidato Epoca I — Fondazione & Copertura Orizzontale (Sprint 1–7):** Baseline storica congelata e immutabile, sintetizzata nel [Compendio Storico Ufficiale dell'Epoca I (`epoch-1-historical-consolidation-sprints-1-7.md`)](../docs/governance/epoch-1-historical-consolidation-sprints-1-7.md).

---

## 🚀 Epoca II — La Verticalizzazione (Da Sprint 8)

| ID | Titolo | Stato | Proponente | Approvatore | Data | Task Correlato |
|---|---|:---:|---|---|---|---|
| [ADR-011](./ADR-011-epoch-2-verticalization-governance-and-modular-depth.md) | Governance dell'Epoca II ("La Verticalizzazione"), Congelamento Storico dell'Epoca I (`Frozen Baseline`), Regola *Zero Horizontal Bloat* e Presidi L6 per Gestione Colori Intelligente (`FTL-CEO-017`) & Albo Fornitori Centralizzato (`FTL-CEO-018`) | 🟢 Approvata (L1/L3/L6) | Founder + C-Suite | Founder | 2026-10-25 | [`FTL-GOV-008`](../tasks/FTL-GOV-008.json), [`FTL-CEO-019`](../tasks/FTL-CEO-019.json) |
| [ADR-012](./ADR-012-plm-ux-simplification-product-models-and-district-vendor-synergy.md) | Semplificazione UX PLM a Tab, Modello Dati "Modelli di Stile" 1:N e Sinergia Albo Fornitori con Distretto PaaS | 🟢 Approvata (L1/L2) | Founder + C-Suite | Founder | 2026-10-28 | [`FTL-CEO-020`](../tasks/FTL-CEO-020.json), [`FTL-CEO-021`](../tasks/FTL-CEO-021.json), [`FTL-CEO-022`](../tasks/FTL-CEO-022.json) |
| [ADR-013](./ADR-013-product-model-construction-vs-product-style-separation.md) | Separazione Ontologica e Funzionale tra Modello (Costruzione) e Prodotto (Stile) e Immutabilità di Forma e Scala Taglie nel PLM/PIM | 🟢 Approvata (L1/L2) | Founder + C-Suite | Founder | 2026-10-28 | [`FTL-CEO-025`](../tasks/FTL-CEO-025.json), [`FTL-CEO-026`](../tasks/FTL-CEO-026.json) |
| [ADR-014](./ADR-014-menu-reorganization-and-unified-supplier-management-hub.md) | Riorganizzazione Menù a 8 Moduli, Unificazione del Modulo "03 Gestione Fornitori & Filiera" e Sequenza Tab PLM | 🟢 Approvata (L1/L4) | Founder + C-Suite | Founder | 2026-10-28 | [`FTL-CEO-027`](../tasks/FTL-CEO-027.json) |
| [ADR-015](./ADR-015-definitive-module-ordering-and-collection-pim-product-association.md) | Ordine Definitivo Moduli (01 Stagioni, 02 PLM, 03 PIM, 04 Fornitori), Associazione Prodotti PIM alle Collezioni ed Arricchimento Schede | 🟢 Approvata (L1/L2) | Founder + C-Suite | Founder | 2026-10-28 | [`FTL-TECH-027`](../tasks/FTL-TECH-027.json), [`FTL-PROD-014`](../tasks/FTL-PROD-014.json), [`FTL-CEO-028`](../tasks/FTL-CEO-028.json) |
| [ADR-016](./ADR-016-plm-pim-model-ux-refinement-and-context-bar-redesign.md) | Rifinitura UX PLM/PIM, Ancoraggio Context Bar, Rimozione Banner e Duplicazioni, Scale Taglie e Colori Master | 🟢 Approvata (L1/L2) | Founder + C-Suite | Founder | 2026-10-29 | [`FTL-TECH-028`](../tasks/FTL-TECH-028.json), [`FTL-TECH-029`](../tasks/FTL-TECH-029.json), [`FTL-CEO-030`](../tasks/FTL-CEO-030.json), [`FTL-CEO-031`](../tasks/FTL-CEO-031.json), [`FTL-CEO-032`](../tasks/FTL-CEO-032.json), [`FTL-CEO-033`](../tasks/FTL-CEO-033.json), [`FTL-CEO-034`](../tasks/FTL-CEO-034.json) |
| [ADR-017](./ADR-017-materials-catalog-bom-picker-bulk-swap-and-cross-module-ergonomics.md) | Architettura dell'Anagrafica Materiali di Filiera, Selezione Guidata nella Distinta Base (BOM), Bulk Material Swap e Navigazione Contestuale Cross-Modulo | 🟢 Approvata (L1/L2) | Founder + C-Suite | Founder | 2026-10-29 | [`FTL-CEO-029`](../tasks/FTL-CEO-029.json), [`FTL-CEO-035`](../tasks/FTL-CEO-035.json), [`FTL-GOV-009`](../tasks/FTL-GOV-009.json), [`FTL-TECH-030`](../tasks/FTL-TECH-030.json), [`FTL-TECH-031`](../tasks/FTL-TECH-031.json) |
| [ADR-018](./ADR-018-atelier-process-streamlining-and-plm-navigation-coordination.md) | Semplificazione del Flusso d'Atelier, Stepper di Modelleria & Distinta Base e Dismissione Legacy Workspace | 🟢 Approvata (L1/L4) | Founder + C-Suite | Founder | 2026-10-29 | [`FTL-CEO-036`](../tasks/FTL-CEO-036.json), [`FTL-CEO-037`](../tasks/FTL-CEO-037.json) |
| [ADR-019](./ADR-019-footlink-public-website-architecture-motion-and-onboarding.md) | Architettura del Sito Web Pubblico Ufficiale, Motori di Computer Motion Vettoriale e Funnel di Onboarding Distrettuale | 🟢 Approvata (L1/L2) | Founder + C-Suite | Founder | 2026-10-29 | [`FTL-CEO-038`](../tasks/FTL-CEO-038.json) |
| [ADR-020](./ADR-020-ux-ui-anti-redundancy-standards-and-design-lead-mandate.md) | Standard di Coerenza UX/UI, Eliminazione delle Ridondanze di Navigazione (Max 2 Livelli) e Istituzione del Presidio di UX/UI Lead | 🟢 Approvata (L1/L2) | Founder + C-Suite | Founder | 2026-10-29 | [`FTL-CEO-039`](../tasks/FTL-CEO-039.json) |
| [ADR-021](./ADR-021-model-detail-simplification-and-pim-commercial-delegation.md) | Ottimizzazione Scheda Dettaglio Modello, Rimozione Azioni Duplicate e Delega Commerciale PIM a Modulo 03 | 🟢 Approvata (L1/L2) | Founder + C-Suite | Founder | 2026-10-29 | [`FTL-CEO-040`](../tasks/FTL-CEO-040.json) |

---

## 📦 Archivio Consolidato Epoca I — Fondazione & Copertura Orizzontale (Sprint 1–7)

> 📌 **Documento di Consolidamento Ufficiale:** Consulta il [Compendio Storico Ufficiale dell'Epoca I (Sprint 1–7)](../docs/governance/epoch-1-historical-consolidation-sprints-1-7.md) per l'analisi sprint per sprint, il censimento dei 67 Task `done` e la certificazione delle metriche alla chiusura dello Sprint 7 (👑👑).

| ID | Titolo | Sprint | Stato | Proponente | Approvatore | Data | Task Correlato |
|---|---|:---:|:---:|---|---|---|---|
| [ADR-000](./ADR-000-template.md) | Template Ufficiale ADR v1.0 | S1 | 📘 Template | CGO | Founder | 2026-10-18 | — |
| [ADR-001](./ADR-001-antigravity-orchestration-and-task-schema.md) | Adozione Task Object Schema v1.0 e Orchestrazione C-Suite su Google Antigravity (`OpenClaw` *suspended*) | S1 | 🟢 Approvata | CGO + CTO | Founder | 2026-10-18 | [`FTL-GOV-001`](../tasks/FTL-GOV-001.json) |
| [ADR-002](./ADR-002-core-architecture-free-tier.md) | Architettura Core (Python / React / PostgreSQL) & Free-Tier Hosting | S1 | 🟢 Approvata (L3) | CTO | Founder (L3) | 2026-10-18 | [`FTL-TECH-001`](../tasks/FTL-TECH-001.json) |
| [ADR-003](./ADR-003-domain-model-1-to-n-pim-plm.md) | Modello di Dominio Core 1:N PIM (Vendita) ↔ PLM (Produzione) | S1 | 🟢 Approvata (L1) | CPO + CTO | CEO / Founder | 2026-10-18 | [`FTL-PROD-001`](../tasks/FTL-PROD-001.json) |
| [ADR-004](./ADR-004-network-pricing-and-finops.md) | Pricing di Rete (Terzisti a Costo Zero) & FinOps Unit Economics | S1 | 🟢 Approvata (L4) | CRO + CEO | Founder (L4) | 2026-10-18 | [`FTL-REV-001`](../tasks/FTL-REV-001.json) |
| [ADR-005](./ADR-005-repository-three-pillars-restructuring.md) | Riorganizzazione Repository in 3 Pilastri di Root (`Azienda/`, `Applicativo/`, `Portale_Founder_Control/`) | S2 | 🟢 Approvata (L1) | Founder + CGO | Founder | 2026-10-18 | [`FTL-GOV-002`](../tasks/FTL-GOV-002.json) |
| [ADR-006](./ADR-006-unified-design-system-and-l6-cost-segregation.md) | Unificazione Design System v2.0 (`MKT-BRAND-002` — Nike-Inspired Editorial Minimalism) e Segregazione Dati/Costi L6 (Brand/PMI vs Terzista 0 € & Consumatore vs Dogane) | S3 | 🟢 Approvata (L1/L6) | Founder + CGO + CMO + CPO + CTO | Founder | 2026-10-18 | [`FTL-GOV-003`](../tasks/FTL-GOV-003.json) |
| [ADR-007](./ADR-007-flexible-data-model-seasons-collections-domain-registries.md) | Architettura Modello Dati Dinamico, Gerarchia Stagione/Collezione 1:N, Anagrafiche di Dominio e Streamlining UX | S5 | 🟢 Approvata (L1) | CTO + CPO | CGO / Founder | 2026-10-19 | [`FTL-GOV-005`](../tasks/FTL-GOV-005.json) |
| [ADR-008](./ADR-008-production-orders-tannery-traceability-subcontractor-lifecycle.md) | Architettura PaaS Distrettuale Multi-Tenant (3 Livelli), Commesse di Produzione, Tracciabilità Lotti Conceria con Certificazioni Documentali e Matrice Taglie/Sfrido BOM | S6 | 🟡 Parz. Sospesa (L3/L6) | CGO + CTO + CPO | Founder (L3/L6) | 2026-10-19 | [`FTL-GOV-006`](../tasks/FTL-GOV-006.json) |
| [ADR-009](./ADR-009-pause-work-orders-hub-and-refocus-plm-pim-leather-vault.md) | Sospensione Temporanea Work Orders Hub e Focalizzazione Architetturale su Separazione Area Prodotti PLM, PIM Feed E-Commerce e Vault Conceria | S6 | 🟢 Approvata (L1..L4) | Founder + CGO + CTO + CPO | Founder | 2026-10-19 | [`FTL-CEO-011`](../tasks/FTL-CEO-011.json) |
| [ADR-010](./ADR-010-product-hierarchies-merchandising-classifiers-and-bom-cloning.md) | Gerarchia Prodotti Multi-Livello, Classificatori Commerciali di Merchandising e Motore di Caricamento Rapido e Clonazione BOM | S7 | 🟢 Approvata (L1/L6) | Founder + C-Suite | Founder | 2026-10-20 | [`FTL-GOV-007`](../tasks/FTL-GOV-007.json) |

---

## 📏 Regole di Gestione del Registro (CGO)
1. **Immutabilità storica:** Un ADR approvato non viene cancellato; se una decisione cambia, lo stato passa a `Sostituita da ADR-XXX` e si crea un nuovo file. Gli ADR dell'Epoca I (`ADR-000` .. `ADR-010`) costituiscono una *Frozen Baseline* storica immutabile.
2. **Naming convention:** `ADR-[NNN]-[slug-sintetico-in-inglese].md`.
3. **Escalation:** Le decisioni di livello **L2–L6** richiedono sempre l'approvazione esplicita del **Founder** tramite il **Founder Control Center** (`http://127.0.0.1:8080`).
