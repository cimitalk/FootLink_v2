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
- **Architettura del Repository a 3 Pilastri di Root (Sprint 2 — 18 Ottobre 2026):**
  - Il monorepo è strutturato in 3 cartelle principali a livello di root (`FTL-GOV-002`):
    1. `Azienda/`: Governance, Manifesto, specifiche di ruolo C-Suite, ADR, Task Object JSON (`Azienda/tasks/`), OKR e documentazione strategica/operativa.
    2. `Applicativo/`: Codice sorgente dell'MVP SaaS B2B (Backend FastAPI + SQLite/PostgreSQL, Frontend React UI, generatore QR DPP UE e Landing Page B2B).
    3. `Portale_Founder_Control/`: Dashboard e strumenti di supervisione e gatekeeping L2–L6 per il Founder.
- **Direttiva Esecutiva Sprint 2 e Audit Manifesto (`FTL-CEO-002` — Completato):**
  - Formalizzato in [`Azienda/docs/okr/sprint-2-kickoff-and-governance-audit.md`](./docs/okr/sprint-2-kickoff-and-governance-audit.md) l'allineamento tra gli OKR Q4 2026 – Q1 2027 e i deliverable operativi dello Sprint 2 (`FTL-TECH-002`, `FTL-PROD-002`, `FTL-TECH-003`, `FTL-MKT-002`, `FTL-REV-002`, `FTL-GOV-002`), certificando Cost-to-Serve infrastrutturale a **0 €/mese** (Margine Lordo SaaS prospettico > 82%), gratuità perpetua per i terzisti e risoluzione preventiva delle dipendenze incrociate `CTO ↔ CPO` e `CTO ↔ CMO`.
- **Sprint 5 — Modello Dati Flessibile, Calendario Stagioni & Collezioni, Tabelle Anagrafiche e Semplificazione UI (19 Ottobre 2026):**
  - **Decisione Architetturale (`ADR-007`):** Formalizzato il modello dati dinamico su base JSON relazionale (`metadata_json`) con validatore formale (`schema_attribute_definitions`), gerarchia calendario moda 1 Stagione ↔ N Collezioni, centralizzazione anagrafiche di dominio PIM/PLM, e semplificazione della UI a 7 moduli coerenti con il processo reale del settore lusso.
  - **Sviluppo Full-Stack:** Implementate API REST FastAPI e componenti React (`SeasonsCollectionsHub.tsx`, `DomainRegistriesManager.tsx`, `DataModelSchemaStudio.tsx`, `PimToPlmBridge.tsx`, `App.tsx`), con selettore globale di stagione e filtri omnicanale.
  - **Test & Validazione:** Test suite backend passante al 100% (`12 passed in 2.39s`), compilazione frontend senza errori, zero costi infrastrutturali aggiuntivi (FinOps L2 rispettato).
  - **Direttiva Founder `FTL-CEO-007` (Edit Tabelle Anagrafiche):** Introdotto l'editing inline/modale completo nel Modulo 03 con relative rotte `PUT`/`PATCH` su FastAPI e SQLite (`12 passed in 2.62s`).
- **Sprint 6 — Ridefinizione Priorità Founder & Framework di Governance (19 Ottobre 2026):**
  - **3 Priorità Esecutive del Founder:**
    1. *Pellami & Conceria:* Tracciabilità conciaria, caricamento e archiviazione documenti certificativi (LWG Gold/Silver, ICEC TS 410/412, Due Diligence EUDR anti-deforestazione post 2020, report analitici REACH), verifica di autenticità con hash crittografico SHA-256 a costo zero, ed esposizione nel Passaporto Digitale del Prodotto (DPP UE) a doppia vista (B2C consumatore vs B2B/Dogane L6).
    2. *Matrice Taglie & Fabbisogni BOM con Sfrido:* Work Orders Hub con Size Breakdown Grid per famiglie di calzata (Donna 35-42, Uomo 38-46 con mezzi numeri) e abbigliamento (IT 44-56), fattore di scala taglia e calcolo deterministico del fabbisogno materiali netto e lordo con percentuale di sfrido differenziata (15-25% per pellami).
    3. *Gestione Utenti & Aziende (PaaS Distrettuale 3 Tier):* Architettura multi-company distrettuale su 3 livelli di membership (Tier 1 Enterprise per Maison di lusso, Tier 2 PMI per calzaturifici strutturati, Tier 3 Piccoli Laboratori Façonisti a Costo Zero 0,00 EUR con onboarding istantaneo via Magic Link e fruizione in 3 Clic < 90s).
  - **ADR-008 Integrata & Aggiornata:** Copre la Governance PaaS Distrettuale, l'isolamento orizzontale tra Brand competitor che condividono terzisti, la segregazione verticale dei dati economici L6 via DTO Pydantic dedicati, la gestione documentale dei lotti pelle con hash SHA-256 e l'invarianza FinOps L2 (0,00 €/mese).
  - **Matrice dei Rischi & Presidio Gatekeeping L1-L6:** Formalizzato il protocollo in `Azienda/docs/governance/governance-risk-matrix-and-gatekeeping-sprint-6.md` con 7 scenari di rischio (inclusi leak competitor e violazioni FinOps) e criteri espliciti Go/No-Go.
  - **Ristrutturazione Task Object Sprint 6:** Tutti i 6 task canonici (`FTL-CEO-008`, `FTL-GOV-006`, `FTL-PROD-006`, `FTL-TECH-007`, `FTL-REV-005`, `FTL-MKT-005`) riscritti, sincronizzati e validati al 100% contro `task-object-v1.schema.json`.
- **Sprint 6 — Completamento Full-Stack & Validazione Esecutiva (19 Ottobre 2026):**
  - **Backend FastAPI & Database (`Applicativo/backend/`, `Applicativo/database/`):**
    - Tabelle DDL implementate: `companies`, `users`, `company_memberships`, `tannery_batches`, `tannery_documents`, `production_orders`, `order_size_breakdown`, `production_order_phases`.
    - API REST implementate: onboarding e gestione aziende/membri 3 tier, caricamento certificazioni conceria con hash SHA-256 e verifica tamper-proof a costo zero (FinOps L2), creazione commesse, calcolo fabbisogni BOM con sfrido e grading di calzata, avanzamento fasi terzista 0 € via Magic Token.
    - Test Suite: **18/18 test passati (100% pass rate in 8.57s via pytest runner)**.
  - **Frontend React 18 & Design System (`Applicativo/frontend/`):**
    - `DistrictPaasManager.tsx`: portale distrettuale multi-company con gestione 3 Tier (Enterprise, PMI, Laboratori 0 €) e company switcher.
    - `TanneryVaultManager.tsx`: vault tracciabilità lotti pelle, audit EUDR/ESPR, conformità REACH/Chrome VI, upload certificati LWG/ICEC e verifica live SHA-256 con badge verde crittografico.
    - `ProductionOrdersManager.tsx`: gestione commesse, matrice taglie (Donna, Uomo, Abbigliamento) con calcolo fabbisogni BOM netti e lordi con sfrido (18% pelle, 2% fondo, +2.8%/taglia), e modal avanzamento fase mobile.
    - `LiveDppPassportGenerator.tsx`: integrata la scheda dossier doganale/conceria riservata L6 e storytelling consumatore.
    - Compilazione TypeScript / Vite: **43 moduli trasformati con 0 errori (`npm run build` successo)**.
  - **Governance & FinOps:** Tutti i 6 Task Object dello Sprint 6 impostati a `done`. Zero spesa monetaria autonoma (`0,00 €`), Cost-to-Serve terzisti azzerato.
- **Sprint 6 — Direttive Esecutive del Founder FTL-CEO-009 .. 012 & ADR-009 (19 Ottobre 2026):**
  - **ADR-009 Deliberata:** Formalizzata la sospensione temporanea (stand-by) del Modulo 02 (Work Orders Hub & Size Matrix da ADR-008) per focalizzare le risorse di sviluppo sul perfezionamento dell'area tecnica PLM e dell'hub commerciale PIM.
  - **4 Direttive Founder Strutturate, Sviluppate e Validate al 100% (Task Object Schema v1.0):**
    1. `FTL-CEO-009`: Nuova Area Prodotti PLM (`PlmProductsManager.tsx`) scorporata con griglia avanzata, filtri stagione/categoria/stato, quick edit, soft-disable, export Excel/CSV e albero Distinta Base (BOM a 3 livelli) integrato nativamente.
    2. `FTL-CEO-010`: Revisione Modulo 04 in "PIM Hub" (`PimCatalogManager.tsx`) con default 1:1, aggregatore 1:N per look/bundle commerciali, associazione dinamica a Stagioni e Collezioni, ed esportazione feed multicanale live (Shopify Plus JSON, NuORDER/JOOR B2B Wholesale) con segregazione industriale L6.
    3. `FTL-CEO-011`: Stand-by visuale del Modulo 02 Work Orders Hub (preservato nel DB e nel backend, ma occultato da router UI e navigazione principale tramite banner informativo ADR-009).
    4. `FTL-CEO-012`: Revisione Modulo 03 Vault Conceria (`TanneryVaultManager.tsx`) con label professionale ("Passaporto Pellami & Tracciabilità Conceria ESPR & EUDR"), dropdown obbligatorio di associazione a materiali pelle da distinta base BOM, upload reale di file PDF/immagini con hash SHA-256 calcolato via Web Crypto API a 0 €, e importazione massiva di lotti con template CSV scaricabile.
  - **Backend FastAPI & Test Suite:** Aggiunti gli endpoint `/api/v1/tannery-batches/template/download`, `/api/v1/tannery-batches/import`, `/api/v1/pim-items/feed/shopify`, `/api/v1/pim-items/feed/b2b` e `/api/v1/plm-variants/export`. Test suite backend passata al 100% (**18/18 test passati**).
  - **Frontend React 18 & Design System:** Compilazione Vite completata con 0 errori (`tsc && vite build` successo).
  - **Sprint 6 — Perfezionamento UX PLM/BOM, Scale Taglie Certificate, Genere Target e Quick Edit Completo (19 Ottobre 2026):**
    - Risolti, sviluppati e validati con esito 100% positivo tutti i 6 task critici inseriti dal Founder nel Control Center (`FTL-PROD-008`, `FTL-PROD-009`, `FTL-TECH-008`, `FTL-TECH-009`, `FTL-TECH-010`, `FTL-TECH-011`):
      1. `FTL-PROD-008` (CPO): **Scale Taglie Certificate** nelle Anagrafiche di Dominio con **Visual Scale Builder** zero-JSON per creazione e modifica (preset Donna EU 35-42, Uomo EU 38-46, Abbigliamento IT 44-56, Pelletteria TU, Bambino EU 24-34, taglie dinamiche, chip colorati in tabella e persistenza a DB).
      2. `FTL-PROD-009` (CPO): Form **+ Nodo BOM (L1/L2/L3)** riprogettata con etichette chiare, unità di misura, consumo netto, sfrido industriale %, contenuto riciclato ESPR %, costo unitario con badge di segregazione L6 e chip di selezione certificazioni (+ LWG Gold, + ICEC TS 410, + REACH, + EUDR, + GRS).
      3. `FTL-TECH-008` (CTO): **Quick Edit Completo** su tutti gli attributi del modello PIM e della variante tecnica PLM con form bi-livello e salvataggio atomico tramite nuovo endpoint backend `PATCH /api/v1/pim-items/{pim_item_id}/plm-variants/{plm_variant_id}`.
      4. `FTL-TECH-009` (CTO): Associazione a prodotti PLM delle **Scale Taglie Certificate** definite nelle anagrafiche di dominio (`registries`) tramite selettore dropdown sia in creazione che in Quick Edit.
      5. `FTL-TECH-010` (CTO): Creazione nuovo modello da PIM (`+ NUOVO MODELLO PIM`) con assegnazione automatica alla variante PLM generata dello stato ciclo vita `new_from_pim` ("🏷️ Nuovo da PIM"), integrato nell'enum backend/frontend, nella tabella e nei filtri.
      6. `FTL-TECH-011` (CTO): **Genere Target** (`target_gender`: Donna ♀, Uomo ♂, Unisex ⚥, Bambino 🧒) pienamente gestito in creazione/modifica PLM e PIM, con colonna dedicata con badge visivi e filtro dropdown nella toolbar della tabella PLM.
    - **Validazione & FinOps:** Compilazione Vite completata con 0 errori (`npm run build`), test suite backend 100% passante (`18/18 passed in pytest`), tutti i 6 Task Object marcati `done` a zero spesa autonoma (FinOps L2 rispettato, 0,00 €).



