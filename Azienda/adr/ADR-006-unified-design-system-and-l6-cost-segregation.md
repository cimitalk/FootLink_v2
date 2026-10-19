# ADR-006: Unificazione Design System v2.0 (`MKT-BRAND-002` — Nike-Inspired Editorial Minimalism) e Segregazione Dati/Costi L6 (Brand/PMI vs Terzista 0 € & Consumatore vs Dogane)

- **Data:** 2026-10-18
- **Stato:** Approvata (L1 + L6)
- **Proponente:** Founder + CGO (`footlink-cgo`) + CMO (`footlink-cmo`) + CPO (`footlink-cpo`) + CTO (`footlink-cto`)
- **Approvatore richiesto:** Founder (Direttiva Vincolante — Design System Unificato & Sicurezza Dati L6)
- **Task di riferimento:** [`FTL-GOV-003`](../tasks/FTL-GOV-003.json)
- **Documenti correlati:** [`MKT-BRAND-002`](../docs/marketing/brand-guidelines-v1.md), [`ADR-003`](./ADR-003-domain-model-1-to-n-pim-plm.md), [`ADR-004`](./ADR-004-network-pricing-and-finops.md), [`ADR-005`](./ADR-005-repository-three-pillars-restructuring.md)

---

## 1. Contesto

Con l'ingresso nello **Sprint 3** (Consolidamento Applicativo SaaS End-to-End in `Applicativo/`), emergono due esigenze architetturali e di governance non negoziabili emerse dal riesame del Founder:

1. **Coerenza Visiva Assoluta tra Brand Identity e Applicativo Prodotto:** Nel corso dello Sprint 2 il sito vetrina/marketing (`Azienda/docs/marketing/landing-page-copy.html`) è stato riallineato con successo al **Design System v2.0 (`MKT-BRAND-002` — Nike-Inspired Editorial Minimalism)**, mentre alcune viste dell'Applicativo (`Applicativo/frontend/` e preview statiche/FastAPI) presentavano ancora residui di estetica SaaS tradizionale (temi dark-slate `#0F172A`, badge multicolore, bordi arrotondati non-pill o diciture `1:N` nel logo). È necessario imporre un **unico Design System v2.0** su il 100% delle superfici di `Applicativo/`.
2. **Protezione Segreti Industriali e Segregazione Costi L6 nella Filiera Multi-Attore:** Il modello di business Footlink ([ADR-004](./ADR-004-network-pricing-and-finops.md)) prevede l'accesso **gratuito (0 € per sempre)** per i laboratori terzisti, tomaifici, suolifici e façonisti invitati dal Brand/PMI committente. Tuttavia, la distinta base PLM a 3 livelli ([ADR-003](./ADR-003-domain-model-1-to-n-pim-plm.md)) e il catalogo PIM contengono dati finanziari e industriali altamente confidenziali (`unit_cost_eur`, `standard_industrial_cost_eur`, `wholesale_price_eur`, `retail_price_eur`). Parallelamente, il **Passaporto Digitale del Prodotto UE (DPP — Reg. ESPR 2024/1781)** deve bilanciare la trasparenza verso il consumatore finale con la tutela della catena di fornitura B2B, riservando i dati fiscali/ispettivi completi (Ragione Sociale, GLN/P.IVA, codici certificazione LWG/REACH) alle sole autorità doganali/ispettive e al Brand proprietario.

---

## 2. Opzioni Considerate

### Opzione A: Mantenere stili differenziati tra Marketing (Light Editorial) e Applicativo SaaS (Dark-Slate B2B) e filtrare i costi solo via CSS/UI
- **Pro:** Nessun refactoring stilistico sui componenti React e sulle viste già scritte nello Sprint 2.
- **Contro:**
  - **Dissonanza cognitiva ed estetica:** Il cliente Brand/PMI passa da una landing page di livello editoriale (`nike.com/it` style) a un gestionale scuro con badge colorati da template SaaS generico.
  - **Violazione della Regola Aurea sul Marchio:** Rischio di ricomparsa della scritta `1:N` accanto al logotipo nelle navbar applicative.
  - **Rischio di sicurezza L6 (Data Leakage):** Nascondere i costi solo nel frontend senza un contratto formale di segregazione per ruolo espone i margini del Brand ai terzisti tramite ispezione dei payload API.
- **Impatto FinOps / Costi:** 0 € infrastrutturali, ma grave rischio reputazionale e legale/commerciale (L6).

### Opzione B: Unificazione Totale del Design System v2.0 (`MKT-BRAND-002`) su tutto `Applicativo/` + Segregazione Rigorosa L6 dei Costi e delle Viste DPP (Scelta)
- **Pro:**
  - **Esperienza Monolitica Premium:** Stessa identità visiva ad altissimo contrasto (`#FFFFFF` / `#F5F5F5` / `#111111`), stessa tipografia architettonica (`Barlow Condensed` 900 Uppercase + `Inter` + `JetBrains Mono`), stessi bottoni pill (`999px`) e stesso logo vettoriale `"The Dynamic Sole-Link"` (rigorosamente privo di `1:N`) tra marketing, web app React, preview standalone e viste servite da FastAPI (`/` e `/app-preview`).
  - **Sicurezza L6 By-Design:** Separazione netta a livello di API/DTO e di interfaccia tra **Vista Brand/PMI Owner**, **Vista Mobile Terzista (0 €)**, **Vista Pubblica Consumatore DPP** e **Vista Ispettiva/Doganale DPP**.
- **Contro:** Richiede il refactoring coordinato di `Applicativo/frontend/`, `Applicativo/backend/` e `Azienda/docs/prd/` nello Sprint 3.
- **Impatto FinOps / Costi:** 0 € di costi cloud; 100% conforme ai vincoli Free-Tier ([ADR-002](./ADR-002-core-architecture-free-tier.md)).
- **Effort stimato:** S (2–4h distribuite tra CGO, CPO, CTO, CMO).

---

## 3. Decisione

Si approva e si rende **immediatamente esecutiva e vincolante per lo Sprint 3 e successivi l'Opzione B**, articolata nelle due decisioni architetturali e di governance seguenti.

---

### Decisione 1 — Unificazione Design System v2.0 (`MKT-BRAND-002` — Nike-Inspired Editorial Minimalism) su tutto l'Applicativo (`Applicativo/`)

Ogni interfaccia utente appartenente al pilastro `Applicativo/` — inclusi l'applicazione **React 18 + TypeScript** (`Applicativo/frontend/src/`), la preview interattiva standalone (`Applicativo/frontend/preview_TechnicalSheet1toN.html`) e le viste HTML/UI servite dal backend **FastAPI** (`Applicativo/backend/app/main.py` su `/` e `/app-preview`) — deve rispettare **senza eccezioni** i seguenti parametri di design:

#### 1.1 Palette Monocromatica High-Contrast Obbligatoria
È **vietato** l'uso di temi dark-slate (`#0F172A`, `#1E293B`), gradienti blu/viola/arancioni e badge multicolore da template SaaS. L'unica palette ammessa è:

| Ruolo | Nome Token | Valore HEX | Token CSS | Prescrizione Vincolante |
| :--- | :--- | :---: | :--- | :--- |
| **Background Primary** | **Pure White** | `#FFFFFF` | `--bg-white` | Sfondo primario pagina, card attive su contenitori grigi, superfici editoriali |
| **Background Secondary** | **Light Bone / Nike Grey** | `#F5F5F5` | `--bg-grey` | Contenitori di sezione, card informative, moduli distinta base e box KPI |
| **Surface Spotlight** | **Pitch Black** | `#111111` | `--bg-black` | Blocchi Hero/Spotlight, bottoni primari pill, tab attivi, badge primari |
| **Text Primary** | **Pitch Black** | `#111111` | `--text-black` | Titoli H1–H4, testi principali, metriche e prezzi |
| **Text Secondary** | **Warm Neutral Grey** | `#707072` | `--text-grey` | Sottotitoli, etichette metadati, descrizioni secondarie |
| **Border & Hairline** | **Architectural Line** | `#E5E5E5` | `--border-light` | Divisori strutturali `1px solid #E5E5E5`, griglie architettoniche senza ombre pesanti |
| **Functional Live Dot** | **Signal Green (Solo Stato)** | `#10B981` | `--status-ok` | **Ammesso esclusivamente** per il live dot circolare `8px` di stato attivo / conformità verificata |

#### 1.2 Architettura Tipografica a 3 Font
1. **Display & Headline (`'Barlow Condensed'`):**
   - `font-weight: 900` (ExtraBold/Black), `text-transform: uppercase`, `letter-spacing: -0.03em`, `line-height: 0.94`.
   - Obbligatorio per tutti gli header di sezione, titoli vista, nomi modello Hero e valori KPI giganti.
2. **Body & UI Copy (`'Inter'`):**
   - `font-weight: 400 / 500 / 600`, leggibilità cristallina, lessico concreto del distretto calzaturiero (zero gergo informatico astratto).
3. **Codici Tecnici, SKU, Lotti, Costi e Hash (`'JetBrains Mono'`):**
   - Obbligatorio per SKU (`FTL-2026-OXF01`), codici variante PLM, identificativi lotto conceria, hash SHA-256, GLN/P.IVA e valori monetari in Euro (`€`).

#### 1.3 Componentistica Pill-Shaped e Logotipo Ufficiale
- **Bottoni e Selettori 100% Pill-Shaped:** Tutti i bottoni d'azione primari e secondari, i selettori di vista e gli switcher di variante devono avere `border-radius: 999px`.
- **Logotipo Vettoriale Ufficiale `"The Dynamic Sole-Link"`:** Deve essere utilizzato esclusivamente il pittogramma SVG a due lame parallele inclinate a 22° su base dinamica abbinato al wordmark `FOOTLINK` in `'Barlow Condensed'` 900.
- **Divieto Tassativo della Dicitura `1:N` nel Logo:** È **severamente vietato** inserire la stringa `1:N` all'interno o a fianco del logotipo `FOOTLINK` in qualsiasi header, navbar o footer. Il concetto `1:N` resta unicamente l'architettura dati interna tra PIM e PLM.

---

### Decisione 2 — Segregazione Dati e Costi L6 (Brand/PMI Owner vs Terzista 0 € & Consumatore vs Dogane)

In conformità ai requisiti di **Privacy, Riservatezza Industriale e Compliance L6** del [Manifesto di Fondazione](../Manifesto_Fondazione_Footlink.md), l'accesso ai dati economici, fiscali e di tracciabilità è rigorosamente segregato per profilo attore sia a livello di **UI/UX** sia a livello di **payload API backend**:

#### 2.1 Segregazione Economica Filiera: Vista Brand/PMI Owner vs Vista Portale Mobile Terzista (0 €)

| Categoria Dato / Attributo | Vista Brand / PMI Owner (Tenant Pagante) | Vista Portale Mobile Terzista / Façonista (0 €) | Regola di Enforcement L6 |
| :--- | :---: | :---: | :--- |
| **Prezzi Commerciali PIM** (`wholesale_price_eur`, `retail_price_eur`, moltiplicatori e margini B2B/B2C) | ✅ **Visibile e Modificabile** | 🚫 **OSCURATO (L6)** | Mai esposto negli endpoint né nelle schermate destinate ai laboratori esterni |
| **Costi Industriali Standard PLM** (`standard_industrial_cost_eur` di variante e riepilogo costi lotto) | ✅ **Visibile e Calcolato** | 🚫 **OSCURATO (L6)** | Calcolato e mostrato solo nella console direzionale del Brand committente |
| **Costi Unitari Distinta Base (BOM L1/L2/L3)** (`unit_cost_eur` al mq/paio/ora di pellami, suole e fasi) | ✅ **Visibile nel Dettaglio BOM** | 🚫 **OSCURATO (L6)** | Il terzista vede solo quantità fisiche, unità di misura (`mq`, `paia`) e codici tecnici |
| **Dati Operativi di Lavorazione** (Codice Bolla/Lotto, fase assegnata Taglio/Orlatura/Montaggio, `lot_reference` materiale da validare, avanzamento in 3 tap) | ✅ **Visibile in Tempo Reale** | ✅ **Visibile e Operativo** | Il laboratorio opera in 3 tap a costo 0 € senza alcuna visibilità sui segreti commerciali del Brand |

#### 2.2 Segregazione Passaporto Digitale UE (DPP — Reg. ESPR 2024/1781): Vista Pubblica Consumatore vs Vista Ispettiva/Doganale

| Categoria Dato / Attributo DPP | Vista Pubblica Consumatore (Scansione QR Cartellino) | Vista Ispettiva / Doganale & Brand Audit (`L6 Verified`) | Regola di Enforcement L6 |
| :--- | :---: | :---: | :--- |
| **Origine Geografica & Distretto** (Regione/Paese delle fasi di Taglio, Orlatura, Montaggio e Finitura) | ✅ **Visibile** (es. *Distretto di Fermo-Macerata, Marche, IT*) | ✅ **Visibile** + Indirizzo stabilimento e coordinate audit | Tutela il know-how di filiera del Brand verso i competitor pur garantendo trasparenza totale al consumatore |
| **Materiali, Sostenibilità & Riparabilità** (Composizione %, Carbon Footprint `kg CO2e`, circolarità, istruzioni cura/riparazione) | ✅ **Visibile** (4 quadranti immediati in 3 secondi) | ✅ **Visibile** + Metodologia di calcolo LCA/PEF e riferimenti tecnici | Piena conformità ESPR 2024/1781 per l'acquirente finale |
| **Anagrafica Fiscale Fornitori Tier-1 / Tier-2** (`supplier_legal_name` Ragione Sociale completa, `supplier_gln_or_vat` GLN / Partita IVA) | 🔒 **Protetto / Anonimizzato** (mostrato solo il ruolo/distretto certificato) | ✅ **Visibile Integrale** (Ragione Sociale + GLN / P.IVA verificata) | Previene il "supplier poaching" (sottrazione di fornitori/terzisti da parte di concorrenti tramite semplice scansione QR in negozio) |
| **Estremi Certificazioni di Lotto** (`cert_id` numero certificato **LWG Gold / REACH**, `lot_reference` interno conceria, hash SHA-256 della bolla) | 🔒 **Badge Stato Verificato** (*LWG Gold Certified* / *REACH Compliant*) | ✅ **Visibile Integrale** (Numero certificato, ente emissore, scadenza, hash immutabile) | Riservato a verifiche doganali, enti certificatori e audit di conformità del Brand |

---

## 4. Conseguenze

### Impatto Positivo Atteso
1. **Unicità Estetica Assoluta (`MKT-BRAND-002`):** Chiunque apra la landing page, la web app React o le viste di anteprima FastAPI sperimenta la medesima interfaccia editoriale in stile `nike.com/it`, priva di rumore visivo SaaS e con il nuovo logotipo `"The Dynamic Sole-Link"` senza `1:N`.
2. **Adozione Senza Attrito da parte di Brand e Terzisti:** I Brand calzaturieri hanno la certezza matematica che invitare gratuitamente i propri laboratori su Footlink non esporrà mai i costi industriali della BOM né i margini wholesale/retail, e che il QR Code DPP pubblico non regalerà ai concorrenti l'elenco nominativo delle concerie e dei façonisti con relativa P.IVA.

### Azioni Obbligatorie per la C-Suite nello Sprint 3
- **CPO (`footlink-cpo` — `FTL-PROD-003`):** Aggiornare `Azienda/docs/prd/PRD-002-technical-sheet-ui-ux.md` codificando la matrice di visibilità L6 (Brand vs Terzista 0 € e Consumatore vs Dogane) e le specifiche UI v2.0.
- **CTO (`footlink-cto` — `FTL-TECH-003`):**
  - Rifattorizzare `Applicativo/frontend/src/components/TechnicalSheet1toN.tsx`, `Applicativo/frontend/preview_TechnicalSheet1toN.html` e `Applicativo/backend/app/main.py` con il Design System v2.0 (`#FFFFFF`/`#F5F5F5`/`#111111`, `Barlow Condensed` 900, bottoni pill `999px`, logo SVG senza `1:N`) e con le viste interattive che dimostrano la segregazione L6 dei costi e del DPP.
  - Garantire che gli schemi e gli endpoint backend supportino il filtraggio dei campi sensibili L6 e che l'intera suite `pytest` passi al 100%.
- **CMO (`footlink-cmo` — `FTL-MKT-003`):** Allineare i materiali di vendita e la presentazione commerciale ai casi d'uso reali dell'Applicativo v2.0 e alla garanzia di riservatezza costi L6.

---

## 5. Approvazione
- **Approvata da:** Founder — 2026-10-18
- **Note di approvazione:** Direttiva esecutiva di Sprint 3 per l'unificazione del Design System v2.0 (`MKT-BRAND-002`) su tutto l'Applicativo e la blindatura L6 dei costi industriali/commerciali e dei dati ispettivi DPP.
