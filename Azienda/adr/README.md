# 🏛️ Registro Decision Record (ADR) — Footlink

Questo registro raccoglie tutte le decisioni architetturali, di governance, di business e di processo (**Architecture / Any Decision Record**) della startup **Footlink**, secondo la gerarchia delle fonti definita nel [Manifesto di Fondazione](../Manifesto_Fondazione_Footlink.md) (Fonte #3 di verità).

---

## 📋 Indice degli ADR

| ID | Titolo | Stato | Proponente | Approvatore | Data | Task Correlato |
|---|---|:---:|---|---|---|---|
| [ADR-000](./ADR-000-template.md) | Template Ufficiale ADR v1.0 | 📘 Template | CGO | Founder | 2026-10-18 | — |
| [ADR-001](./ADR-001-antigravity-orchestration-and-task-schema.md) | Adozione Task Object Schema v1.0 e Orchestrazione C-Suite su Google Antigravity (`OpenClaw` *suspended*) | 🟢 Approvata | CGO + CTO | Founder | 2026-10-18 | [`FTL-GOV-001`](../tasks/FTL-GOV-001.json) |
| [ADR-002](./ADR-002-core-architecture-free-tier.md) | Architettura Core (Python / React / PostgreSQL) & Free-Tier Hosting | 🟢 Approvata (L3) | CTO | Founder (L3) | 2026-10-18 | [`FTL-TECH-001`](../tasks/FTL-TECH-001.json) |
| [ADR-003](./ADR-003-domain-model-1-to-n-pim-plm.md) | Modello di Dominio Core 1:N PIM (Vendita) ↔ PLM (Produzione) | 🟢 Approvata (L1) | CPO + CTO | CEO / Founder | 2026-10-18 | [`FTL-PROD-001`](../tasks/FTL-PROD-001.json) |
| [ADR-004](./ADR-004-network-pricing-and-finops.md) | Pricing di Rete (Terzisti a Costo Zero) & FinOps Unit Economics | 🟢 Approvata (L4) | CRO + CEO | Founder (L4) | 2026-10-18 | [`FTL-REV-001`](../tasks/FTL-REV-001.json) |
| [ADR-005](./ADR-005-repository-three-pillars-restructuring.md) | Riorganizzazione Repository in 3 Pilastri di Root (`Azienda/`, `Applicativo/`, `Portale_Founder_Control/`) | 🟢 Approvata (L1) | Founder + CGO | Founder | 2026-10-18 | [`FTL-GOV-002`](../tasks/FTL-GOV-002.json) |
| [ADR-006](./ADR-006-unified-design-system-and-l6-cost-segregation.md) | Unificazione Design System v2.0 (`MKT-BRAND-002` — Nike-Inspired Editorial Minimalism) e Segregazione Dati/Costi L6 (Brand/PMI vs Terzista 0 € & Consumatore vs Dogane) | 🟢 Approvata (L1/L6) | Founder + CGO + CMO + CPO + CTO | Founder | 2026-10-18 | [`FTL-GOV-003`](../tasks/FTL-GOV-003.json) |
| [ADR-007](./ADR-007-flexible-data-model-seasons-collections-domain-registries.md) | Architettura Modello Dati Dinamico, Gerarchia Stagione/Collezione 1:N, Anagrafiche di Dominio e Streamlining UX | 🟢 Approvata (L1) | CTO + CPO | CGO / Founder | 2026-10-19 | [`FTL-GOV-005`](../tasks/FTL-GOV-005.json) |
| [ADR-008](./ADR-008-production-orders-tannery-traceability-subcontractor-lifecycle.md) | Architettura PaaS Distrettuale Multi-Tenant (3 Livelli), Commesse di Produzione, Tracciabilità Lotti Conceria con Certificazioni Documentali e Matrice Taglie/Sfrido BOM | 🟡 Proposta (L3/L6) | CGO + CTO + CPO | Founder (L3/L6) | 2026-10-19 | [`FTL-GOV-006`](../tasks/FTL-GOV-006.json) |
| [ADR-009](./ADR-009-pause-work-orders-hub-and-refocus-plm-pim-leather-vault.md) | Sospensione Temporanea Work Orders Hub e Focalizzazione Architetturale su Separazione Area Prodotti PLM, PIM Feed E-Commerce e Vault Conceria | 🟢 Approvata (L1/L2/L3/L4) | Founder + CGO + CTO + CPO | Founder | 2026-10-19 | [`FTL-CEO-011`](../tasks/FTL-CEO-011.json) |
| [ADR-010](./ADR-010-product-hierarchies-merchandising-classifiers-and-bom-cloning.md) | Gerarchia Prodotti Multi-Livello, Classificatori Commerciali di Merchandising e Motore di Caricamento Rapido e Clonazione BOM | 🟢 Approvata (L1/L6) | Founder + C-Suite | Founder | 2026-10-20 | [`FTL-GOV-007`](../tasks/FTL-GOV-007.json) |

---

## 📏 Regole di Gestione del Registro (CGO)
1. **Immutabilità storica:** Un ADR approvato non viene cancellato; se una decisione cambia, lo stato passa a `Sostituita da ADR-XXX` e si crea un nuovo file.
2. **Naming convention:** `ADR-[NNN]-[slug-sintetico-in-inglese].md`.
3. **Escalation:** Le decisioni di livello **L2–L6** richiedono sempre l'approvazione esplicita del **Founder** tramite il **Founder Control Center** (`http://127.0.0.1:8080`).
