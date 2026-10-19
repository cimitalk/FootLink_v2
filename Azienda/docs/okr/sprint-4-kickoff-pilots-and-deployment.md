# Direttiva Esecutiva Sprint 4: Lancio Pilota nei Distretti, Validazione sul Campo "Zero-Training Terzista", Deploy Free-Tier e Presidio Gate L2–L6

- **Documento ID:** `SPRINT-4-EXEC-DIR-2026-10-19`
- **Task di Riferimento:** [`FTL-CEO-004`](../../tasks/FTL-CEO-004.json)
- **Redatto e Firmato da:** CEO (`footlink-ceo`)
- **Riferimenti Normativi Interni:** [Manifesto di Fondazione v1.1](../../Manifesto_Fondazione_Footlink.md), [`OKR-2026-Q4-2027-Q1`](./OKR-2026-Q4-2027-Q1.md), [`ADR-001`](../../adr/ADR-001-antigravity-orchestration-and-task-schema.md), [`ADR-002`](../../adr/ADR-002-core-architecture-free-tier.md), [`ADR-003`](../../adr/ADR-003-domain-model-1-to-n-pim-plm.md), [`ADR-004`](../../adr/ADR-004-network-pricing-and-finops.md), [`ADR-005`](../../adr/ADR-005-repository-three-pillars-restructuring.md), [`ADR-006`](../../adr/ADR-006-unified-design-system-and-l6-cost-segregation.md)
- **Data di Emissione:** 19 Ottobre 2026
- **Stato:** Esecutivo — Vincolante per l'intera C-Suite (CGO, CTO, CPO, CRO, CMO)

---

## 1. Executive Summary Sprint 4

Con la chiusura dello **Sprint 3** (convergenza estetica integrale sul Design System v2.0 *Nike Editorial Minimalism*, rilascio della Home Iniziale a 6 moduli, motore PIM Data Quality Score 0–100%, Syndication Export `FEAT-05` e segregazione costi L6), l'infrastruttura tecnologica e funzionale di Footlink è completa, verificata e collaudata.

Lo **Sprint 4** ordina la transizione della startup dalla fase di sviluppo interno alla **fase di validazione sul campo con i primi Design Partner industriali nei distretti della moda e calzatura italiana e al deploy in produzione a costo zero**.

La direttiva esecutiva di Sprint 4 si articola su **6 direttrici operative non negoziabili**:

1. **Attivazione della Pipeline Commerciale 15 Prospect & Lettere d'Intenti (CRO):**
   - Esecuzione dell'outreach commerciale a freddo e a caldo sui **15 cluster profilati** nel [`Sales Playbook v0.1`](../finops/sales-playbook-v0.1.md) (Marche calzature, Toscana pelletteria, Veneto calzature/sportswear).
   - Obiettivo primario: condurre **≥ 8 demo guidate** della piattaforma e siglare **≥ 3 Lettere d'Intenti (LOI / Design Partner)** per avviare il collaudo in fabbrica.
   - Sottomissione del pacchetto formale **Gate L4** al Founder per la ratifica finale dei listini prima della presentazione ai clienti.
2. **Go-Live Comunicazione B2B & Campagna Inbound DPP UE (CMO):**
   - Sottomissione a **Gate L5 del Founder** per la pubblicazione della nuova Landing Page B2B e del primo blocco di 3 post LinkedIn tecnici dedicati alla soluzione del disallineamento tra ufficio tecnico e catalogo vendita.
   - Generazione organica a budget zero (**0 € Paid Ads**, vincolo L2) dei primi **≥ 25 Marketing Qualified Leads (MQL)** qualificati dai distretti.
3. **Hardening Applicativo, Flusso Magic Link e Deploy Cloud Free-Tier a 0 € (CTO):**
   - Predisposizione dei manifesti di deploy cloud (Render / Docker) a **0,00 €/mese di spesa infrastrutturale** in conformità ad [`ADR-002`](../../adr/ADR-002-core-architecture-free-tier.md), mantenendo il Margine Lordo SaaS prospettico **> 82%**.
   - Esposizione degli endpoint di accesso rapido con **Magic Link / Tokenless** per consentire l'accesso immediato da smartphone ai terzisti a 0 € senza registrazione o password.
   - Mantenimento della test suite Pytest al 100% passante e latenza API P95 **< 250 ms**.
4. **Protocollo Operativo di Validazione in Fabbrica "Zero-Training Terzista" (CPO):**
   - Pubblicazione di `PRD-004` recante il protocollo standard di validazione mobile per i laboratori façonisti invitati: tempo medio di completamento **< 90 secondi** e **≤ 3 tocchi** per validazione lotto/fase.
   - Definizione del framework di rilevazione del **System Usability Score (target SUS ≥ 80/100)** e della metrica di riduzione degli errori di trascrizione tra distinta base PLM e scheda commerciale PIM.
5. **Audit di Sicurezza Dati Filiera L6 & Conformità GDPR (CGO):**
   - Pubblicazione dell'audit di conformità GDPR (art. 28) con accordo quadro DPA (Data Protection Agreement) per regolare il trattamento dei dati industriali tra Brand committenti e terzisti a 0 €.
   - Certificazione del perimetro di sicurezza **Livello L6**: garanzia assoluta che nessun dato economico riservato (prezzi wholesale, margini industriali, costi di lavorazione) sia accessibile ai terzisti o esposto nel Passaporto Digitale pubblico.
6. **Presidio Cabina di Regia & Governance Founder Control Center (CEO):**
   - Monitoraggio in tempo reale dei task nel [Founder Control Center](../../Portale_Founder_Control/control_center.py).
   - Tempestiva risoluzione dei blocchi inter-dipartimentali (< 24 ore) e presidio del limite FinOps di zero spesa monetaria autonoma (L2).

---

## 2. Matrice di Allineamento Sprint 4 ↔ OKR Trimestrali (Q4 2026 / Q1 2027)

| Key Result (`OKR-2026-Q4-2027-Q1.md`) | Target Trimestrale | Milestone Operativa Sprint 4 |
| :--- | :--- | :--- |
| **`KR B.1`** *(Objective B)* | 15 aziende pilota profilate e ≥ 3 Design Partner contrattualizzati | **In Attivazione (`FTL-REV-003`):** Pipeline CRM aperta, prime 8 demo schedulate e dossier LOI pronto per ratifica Founder. |
| **`KR B.2`** *(Objective B)* | Viralità di filiera: ≥ 3 terzisti registrati a 0 € per ogni partner attivo (≥ 9 terzisti totali) | **Ingegnerizzato (`FTL-TECH-005` & `FTL-PROD-004`):** Magic Link e onboarding smartphone senza login attivi per garantire adozione a zero attrito. |
| **`KR B.3`** *(Objective B)* | Margine Lordo SaaS prospettico ≥ 78% con modello di pricing ADR-004 | **Confermato FinOps:** Cost-to-Serve a 0 €/mese su tier gratuiti; Margine Lordo SaaS certificato tra **82,4% e 88,0%**. |
| **`KR A.2`** *(Objective A)* | MVP funzionante su stack Python + React + PostgreSQL su hosting 0 €/mese con test ≥ 80% | **Completato & Pronto al Deploy (`FTL-TECH-005`):** Dockerfile e blueprint cloud a costo 0 con 100% test passanti. |
| **`KR CPO-1.3`** *(Objective CPO-1)* | Flusso "Zero-Training Terzista" in ≤ 3 clic e < 5 minuti da smartphone | **Standardizzato (`FTL-PROD-004`):** Protocollo di test in reparto con cronometraggio e checklist di verifica lotti. |
| **`KR CMO-1.3`** *(Objective CMO-1)* | 12 contenuti B2B (post LinkedIn + guide SEO) sottoposti a Gate L5 | **Predisposto (`FTL-MKT-003`):** Primi 3 post tecnici pronti nel dossier L5 per autorizzazione Founder. |
| **`KR CGO-1.4`** *(Objective CGO-1)* | Conformità GDPR e segregazione multi-tenant L6 prima dell'onboarding partner | **Blindato (`FTL-GOV-004`):** Checklist DPA e verifica blocco costi industriali L6 nei payload API. |

---

## 3. Matrice Deliverable Sprint 4 per la C-Suite

| Task ID | C-Level Owner | Titolo Task | Deliverable di Output | Stato / Gate |
| :--- | :---: | :--- | :--- | :---: |
| **[`FTL-CEO-004`](../../tasks/FTL-CEO-004.json)** | **CEO** | Direttiva Esecutiva Sprint 4: Lancio Pilota, Validazione sul Campo e Deploy | `Azienda/docs/okr/sprint-4-kickoff-pilots-and-deployment.md` | ✅ `done` |
| **[`FTL-GOV-004`](../../tasks/FTL-GOV-004.json)** | **CGO** | Audit GDPR, DPA di Filiera e Segregazione Multi-Tenant Dati Riservati L6 | `Azienda/docs/governance/audit-gdpr-and-l6-multi-tenant-data-segregation.md` | ✅ `done` |
| **[`FTL-REV-003`](../../tasks/FTL-REV-003.json)** | **CRO** | Attivazione Outreach 15 Prospect Distretti, Tracking LOI e Dossier Listini L4 | `Azienda/docs/finops/pilot-pipeline-tracking-and-loi-dossier.md` | 🟣 `review` (Gate L4) |
| **[`FTL-MKT-003`](../../tasks/FTL-MKT-003.json)** | **CMO** | Pacchetto Go-Live Comunicazione Esterna, Dossier Gate L5 e 3 Post LinkedIn | `Azienda/docs/marketing/go-live-launch-kit-and-founder-l5-package.md` | 🟣 `review` (Gate L5) |
| **[`FTL-PROD-004`](../../tasks/FTL-PROD-004.json)** | **CPO** | PRD-004: Protocollo Validazione Pilota "Zero-Training Terzista" e Metriche SUS | `Azienda/docs/prd/PRD-004-pilot-validation-protocol-and-zero-training-ux.md` | ✅ `done` |
| **[`FTL-TECH-005`](../../tasks/FTL-TECH-005.json)** | **CTO** | Hardening Backend, Magic Link Terzisti, Deploy Cloud Free-Tier e Test Suite | `Applicativo/render.yaml`, `backend/Dockerfile`, `backend/app/main.py` | 🟣 `review` (Gate L3) |

---

## 4. Certificazione FinOps & Gatekeeping Founder (L2–L6)

1. **Zero Spesa Monetaria Autonoma (L2):** Confermata spesa a **0,00 €** per tutte le attività di Sprint 4. Nessun agente può acquistare software o sottoscrivere canoni cloud a pagamento.
2. **Escalation al Founder:**
   - **Gate L3 (Architettura & Deploy Cloud):** L'esecuzione del deploy esterno dell'Applicativo è pronta e documentata in `FTL-TECH-005` in attesa del benestare del Founder.
   - **Gate L4 (Listini & Condizioni Commerciali Pilota):** I listini di rete (`ADR-004`) e le agevolazioni per i primi 3 Design Partner sono presentati in `FTL-REV-003` per approvazione Founder.
   - **Gate L5 (Comunicazione Esterna & Social):** I testi dei post LinkedIn e la Landing Page B2B sono pronti in `FTL-MKT-003` e non saranno diffusi pubblicamente senza esplicito via libera del Founder.

---

**Firmato digitalmente:**  
*Chief Executive Officer (`footlink-ceo`)*  
*Footlink S.r.l. (in costituzione) — Google Antigravity & GitHub*
