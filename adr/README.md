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

---

## 📏 Regole di Gestione del Registro (CGO)
1. **Immutabilità storica:** Un ADR approvato non viene cancellato; se una decisione cambia, lo stato passa a `Sostituita da ADR-XXX` e si crea un nuovo file.
2. **Naming convention:** `ADR-[NNN]-[slug-sintetico-in-inglese].md`.
3. **Escalation:** Le decisioni di livello **L2–L6** richiedono sempre l'approvazione esplicita del **Founder** tramite il **Founder Control Center** (`http://127.0.0.1:8080`).
