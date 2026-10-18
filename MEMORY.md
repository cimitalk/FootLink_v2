# MEMORY.md - Long-Term Project Memory

Questo file conserva i fatti durevoli, le decisioni architetturali e lo stato evolutivo di **Footlink** attraverso le sessioni su **Google Antigravity**.

## Stato Strategico & Governance (Ottobre 2026)

- **Costituzione e C-Suite v1.0 Approvate (17–18 Ottobre 2026):**
  - Approvati dal Founder il [Manifesto di Fondazione](./Manifesto_Fondazione_Footlink.md) e tutti i 6 ruoli della C-Suite ([CEO](./docs/roles/Role_CEO_Footlink.md), [CGO](./docs/roles/Role_CGO_Footlink.md), [CTO](./docs/roles/Role_CTO_Footlink.md), [CPO](./docs/roles/Role_CPO_Footlink.md), [CRO](./docs/roles/Role_CRO_Footlink.md), [CMO](./docs/roles/Role_CMO_Footlink.md)).
- **Transizione Piattaforma Agenti → Google Antigravity (18 Ottobre 2026):**
  - **Decisione del Founder (`ADR-001`):** **OpenClaw** viene posto in stato **`suspended`** (in quanto limitato nella visibilità modelli solo a Gemini Flash e meno efficiente sul consumo di crediti per il coordinamento multi-agente).
  - L'orchestrazione della C-Suite e lo sviluppo software vengono eseguiti nativamente su **Google Antigravity** (piano Pro 21,99 €/mese + 30 € di crediti) utilizzando sub-agenti specializzati (`invoke_subagent`) e persistenza Git-native nelle cartelle `adr/`, `tasks/` e `docs/`.
- **Pilastri Invarianti di Prodotto, Tecnologia e Business:**
  1. **Dominio Core:** `1 Articolo PIM (Vendita) ↔ N Articoli PLM (Produzione)` per calzature, pelletteria e abbigliamento, con supporto nativo al Passaporto Digitale del Prodotto (DPP UE).
  2. **Stack Tecnologico Core:** `Python (FastAPI)` + `React` + `PostgreSQL` orientato a soluzioni open-source e **free-tier** nella fase di bootstrap.
  3. **Modello di Business a Rete & FinOps:** Terzisti/Façonisti a **Costo Zero (0 €)** per viralità di filiera; PMI produttive con canone SaaS accessibile; Brand Moda in Enterprise Tier. Vincolo di **Margine Lordo SaaS > 75%** e **Zero Spesa Monetaria Autonoma (> 0 € = Escalation L2 al Founder)**.
