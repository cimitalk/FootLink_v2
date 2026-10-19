# ADR-008: Architettura PaaS Distrettuale Multi-Tenant (3 Livelli), Commesse di Produzione, Tracciabilità Lotti Conceria con Certificazioni Documentali e Matrice Taglie/Sfrido BOM

- **Data:** 2026-10-19
- **Stato:** Proposta (Sottomessa ad Approvazione Founder L3/L6)
- **Proponenti:** CGO (`footlink-cgo`), CTO (`footlink-cto`), CPO (`footlink-cpo`)
- **Approvatore richiesto:** Founder (Presidio L3 Architettura Strutturale, L6 Segregazione Industriale, L2 FinOps Zero Spesa)
- **Task di Riferimento:** [`FTL-GOV-006`](../tasks/FTL-GOV-006.json), [`FTL-CEO-008`](../tasks/FTL-CEO-008.json), [`FTL-PROD-006`](../tasks/FTL-PROD-006.json), [`FTL-TECH-007`](../tasks/FTL-TECH-007.json), [`FTL-REV-005`](../tasks/FTL-REV-005.json), [`FTL-MKT-005`](../tasks/FTL-MKT-005.json)
- **Iniziativa di Origine:** [`FTL-CEO-006`](../tasks/FTL-CEO-006.json), [`FTL-CEO-007`](../tasks/FTL-CEO-007.json), Nuova Direttiva Sprint 6 Founder
- **Documenti Correlati:** [Manifesto di Fondazione](../Manifesto_Fondazione_Footlink.md), [`ADR-002`](./ADR-002-core-architecture-free-tier.md), [`ADR-003`](./ADR-003-domain-model-1-to-n-pim-plm.md), [`ADR-004`](./ADR-004-network-pricing-and-finops.md), [`ADR-006`](./ADR-006-unified-design-system-and-l6-cost-segregation.md), [`ADR-007`](./ADR-007-flexible-data-model-seasons-collections-domain-registries.md)

---

## 1. Contesto & Motivazione

A seguito della revisione delle priorità strategiche decisa dal **Founder per lo Sprint 6**, Footlink espande la propria missione architetturale: da strumento collaborativo PIM/PLM a **Piattaforma PaaS Distrettuale di Filiera (Platform-as-a-Service)** per la manifattura calzaturiera e pellettiera d'alta gamma Made in Italy (distretti di Fermo-Macerata, Santa Croce sull'Arno, Arzignano, Riviera del Brenta).

Il settore manifatturiero richiede la convergenza simultanea di quattro componenti industriali critiche:
1. **PaaS Distrettuale Multi-Company & Multi-Tenant su 3 Livelli (Enterprise, PMI, Piccoli Laboratori 0 EUR):** la filiera italiana è composta da grandi maison internazionali (Tier Enterprise), calzaturifici e pelletterie strutturate (Tier PMI) e centinaia di micro-laboratori artigianali e façonisti contoterzisti (Tier 3 a Costo Zero 0,00 EUR). La convivenza nello stesso distretto impone un'architettura multi-tenant che garantisca la segregazione assoluta dei dati tra brand competitor e l'adozione priva di barriere per i terzisti.
2. **Tracciabilità Lotti Conceria, Caricamento Certificazioni (LWG/ICEC/EUDR) e DPP a Doppia Vista:** il pellame costituisce il 50-70% del valore del manufatto. Le normative europee **ESPR (Reg. UE 2024/1781)**, **EUDR (Reg. UE 2023/1115 contro la deforestazione)** e gli standard di qualità (**LWG - Leather Working Group**, **ICEC**, conformità chimica **REACH SVHC**) impongono la tracciabilità documentata e non ripudiabile del lotto pelle. Ciò richiede il caricamento di documenti e certificati con verifica crittografica e un Passaporto Digitale del Prodotto (DPP) a **doppia vista** (B2C per il consumatore e B2B/Dogane L6 per gli organi ispettivi).
3. **Commesse di Produzione (Work Orders Hub) e Matrice Taglie & Fabbisogni BOM con Sfrido:** l'avvio della fabbricazione richiede l'articolazione della commessa per curva taglie (Size Breakdown Grid) e il calcolo deterministico del fabbisogno materiali (netto e lordo con fattore di sfrido/scrap percentuale per pelle e fodere).
4. **Ciclo di Vita Fasi Terzisti (Lifecycle Subcontractors) in 3 Clic:** avanzamento operativo distribuito delle lavorazioni (taglio, orlatura/giunteria, montaggio, suolatura, finissaggio) tramite Magic Link mobile a costo zero per i façonisti.

Questa architettura complessa è vincolata a due **invarianti inderogabili** del [Manifesto di Fondazione](../Manifesto_Fondazione_Footlink.md):
- **Vincolo FinOps L2 ("Zero Spesa Monetaria Autonoma"):** infrastruttura Free-Tier (0,00 €/mese), storage documentale locale/gratuito, zero canoni SaaS esterni o blockchain proprietarie a pagamento; immutabilità garantita da hashing crittografico standard SHA-256.
- **Vincolo di Sicurezza & Segregazione Industriale L6 ("Segregazione Multi-Tenant Competitor & Brand vs Terzista"):**
  - *Isolamento orizzontale tra competitor:* se Brand A e Brand B impiegano lo stesso terzista distrettuale per la giunteria, i dati, i modelli, i volumi e le distinte base dei due brand devono rimanere ermeticamente separati. Il terzista non vede correlazioni e nessun brand può dedurre informazioni sul concorrente.
  - *Isolamento verticale brand-terzista:* nessun dato economico (costi pellame, compensi terzisti, mark-up, listini wholesale/retail, margini) può transitare verso i laboratori façonisti o verso la vista pubblica del DPP.

---

## 2. Opzioni Considerate

### Opzione A: Piattaforma Multi-Tenant Silos (Database Separati per Tenant) con Add-on Cloud Storage Commerciale
- **Descrizione:** Creare un'istanza database isolata o schema PostgreSQL dedicato per ciascuna azienda registrata e appoggiarsi ad AWS S3 / Azure Blob Storage a pagamento per i documenti di certificazione conciaria.
- **Pro:** Isolamento fisico nativo dei dati tra aziende.
- **Contro:**
  - **Violazione esplicita del vincolo FinOps L2:** genera costi fissi cloud per ogni tenant e costi di storage per gigabyte incompatibili con il vincolo 0,00 EUR/mese.
  - Complessità di manutenzione proibitiva per i centinaia di piccoli laboratori a 0 EUR (overhead di migrazione e provisioning).
  - Impossibilità di condividere ontologie anagrafiche master e tabelle di sistema distrettuali.

### Opzione B: Piattaforma PaaS Distrettuale Multi-Tenant a Discriminante `tenant_id`, Storage Documentale Free-Tier con Hashing SHA-256 e DTO Segregati L6 (Scelta)
- **Descrizione:** Architettura multi-tenant relazionale con colonna `tenant_id` (o `company_id`) presente su tutte le entità proprietarie, arricchita da policy applicative e dependency injection FastAPI per il filtraggio automatico per tenant e per ruolo. I documenti di certificazione conciaria (PDF/JPG LWG, ICEC, EUDR) sono archiviati su storage locale/Free-Tier e validati crittograficamente con hash SHA-256 nativo Python `hashlib`. I terzisti a 0 EUR accedono via token Magic Link limitati al contesto della singola commessa assegnata.
- **Pro:**
  - Piena aderenza al vincolo **FinOps L2 (0,00 €/mese)**: costo computazionale e di licenza pari a zero.
  - Isolamento orizzontale tra competitor garantito programmaticamente dal context tenant injection.
  - Protezione verticale L6 by-design grazie a DTO FastAPI Pydantic rigorosamente segregati (nessun campo economico inviato ai laboratori).
  - Flessibilità di onboarding distrettuale: laboratori façonisti operativi in 3 clic senza oneri contabili o informatici.
  - Verifica di autenticità e non-ripudio dei certificati di lotto tramite SHA-256 immutabile e verificabile nel DPP.
- **Contro:** Richiede test rigorosi di non-regressione e verifiche statiche/dinamiche di isolamento tenant nella suite di test.
- **Effort stimato:** L (3–7 giorni di implementazione full-stack coordinata).

---

## 3. Decisioni Architetturali

Si approva e ratifica l'**Opzione B**, articolata nelle seguenti 6 decisioni architetturali vincolanti.

### Decisione 1: Architettura PaaS Distrettuale e Modello Aziende/Utenti sui 3 Livelli

La piattaforma adotta un modello multi-company a 3 livelli operativi differenziati:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      FOOTLINK PAAS DISTRETTUALE MULTI-TENANT                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  TIER 1: ENTERPRISE (Grandi Brand / Gruppi Lusso)                                      │
│  - Tenant proprietario dedicato (`tenant_id`) con RBAC multi-utente                      │
│  - PIM/PLM completo, BOM a 3 livelli, gestione stagioni, costing industriale L6        │
│  - Work Orders Hub, controllo supply chain multi-livello, audit log completo           │
│  - Gestione documentale certificazioni lotti, generazione Passaporto DPP doppia vista  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  TIER 2: PMI (Calzaturifici Manifatturieri e Pelletterie Strutturate)                  │
│  - Tenant aziendale con profili operativi (Ufficio Tecnico, Taglio, Produzione, QA)    │
│  - Commesse di fabbrica con Matrice Taglie & Fabbisogni BOM con sfrido                 │
│  - Ricezione lotti conceria, validazione certificati LWG/ICEC/EUDR                     │
│  - Assegnazione lavorazioni a laboratori contoterzisti di distretto                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  TIER 3: PICCOLI LABORATORI FAÇONISTI (Contoterzisti Distrettuali — Costo 0,00 EUR)   │
│  - Nessun canone di ingresso, nessun abbonamento (Invarianza FinOps 0 €)               │
│  - Onboarding senza attrito: nessun software da installare, accesso via Magic Link     │
│  - Portale Mobile ergonomico "3 Clic" (< 90s) per smartphone e tablet di reparto       │
│  - Vista di sola lavorazione tecnica: presa in carico, avanzamento fase, resa/scarti   │
│  - Blindatura totale L6: NESSUN accesso a costi, prezzi, o dati di brand concorrenti   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Entità `companies` (Anagrafica Aziende PaaS):**
   - `id`: identificativo univoco (UUID / String)
   - `name`: ragione sociale (es. "Maison Marche Luxury S.p.A.", "Suolificio Piceno S.r.l.")
   - `tier`: enum (`enterprise`, `pmi`, `subcontractor_free`)
   - `vat_number`: Partita IVA / Codice Fiscale
   - `district`: distretto geografico (es. `fermo_macerata`, `santa_croce`, `arzignano`, `riviera_brenta`)
   - `status`: `active`, `suspended`, `pending_verification`
   - `created_at`, `updated_at`
2. **Entità `users` (Utenti e Credenziali di Accesso):**
   - `id`: identificativo univoco
   - `company_id`: foreign key verso la tabella `companies` (stabilisce il perimetro tenant)
   - `email`: email aziendale univoca
   - `role`: enum RBAC (`founder_admin`, `brand_admin`, `pmi_manager`, `technician`, `subcontractor_operator`, `auditor_customs`)
   - `is_active`: flag abilitazione utente
   - `last_login_at`: tracciamento accessi
3. **Meccanismo di Invito di Rete a Costo Zero:**
   - Un'azienda Tier Enterprise o PMI può censire e invitare un laboratorio contoterzista semplicemente inserendone ragione sociale, referente e recapito email/telefono.
   - Il sistema genera automaticamente una scheda `companies` di livello `subcontractor_free` con associato un token sicuro Magic Link a scadenza. Il terzista non paga nulla e accede immediatamente.

---

### Decisione 2: Gestione Documentale Certificazioni Lotti Pelle & Doppia Vista DPP

Per rispondere ai requisiti EUDR (Reg. UE 2023/1115), ESPR (Reg. UE 2024/1781) e alle certificazioni ambientali/sociali senza generare costi infrastrutturali:

1. **Entità `tannery_batches` (Lotti Conceria):**
   - `id`: identificativo univoco lotto
   - `tenant_id`: identificativo del brand/PMI proprietario
   - `batch_number`: codice lotto fornitore/conceria (es. `LOT-CONC-2026-X88`)
   - `supplier_id`: foreign key anagrafica fornitore conceria
   - `leather_type`: tipologia pellame (es. *Vitello Pieno Fiore*, *Camoscio*, *Nappa Piuma*)
   - `tanning_method`: classificazione metodo concia (`vegetable`, `chrome_free`, `wet_white`, `traditional_chrome`)
   - `raw_hide_origin_country`: paese di allevamento grezzo animale (conformità EUDR, es. `FR`, `DE`, `IT`)
   - `tanning_country`: paese in cui è avvenuta la concia (es. `IT`)
   - `lwg_rating`: rating Leather Working Group (`Gold`, `Silver`, `Bronze`, `Audited`, `None`)
   - `lwg_certificate_id`: identificativo univoco certificato LWG
   - `icec_certificate_id`: codice tracciabilità ICEC (es. `ICEC TS_PC_041`)
   - `eudr_compliance_flag`: flag booleano assenza deforestazione post 2020
   - `eudr_due_diligence_id`: identificativo dichiarazione Due Diligence EUDR
   - `reach_compliant`: conformità allegato XVII / SVHC REACH (Cromo VI < 3 ppm, assenza APEO)
   - `unit_cost_eur`: costo d'acquisto al mq/sqft (campo strettamente confidenziale **L6**)
   - `stock_quantity_available`: giacenza pellame disponibile (in sqft o mq)
2. **Entità `batch_certification_documents` (Allegati e Documenti Certificativi):**
   - `id`: identificativo univoco allegato
   - `batch_id`: foreign key verso `tannery_batches`
   - `document_type`: classificazione documento (`lwg_certificate`, `icec_traceability`, `eudr_due_diligence`, `reach_chemical_test`, `technical_datasheet`, `commercial_invoice_hidden`)
   - `file_name`: nome del file caricato
   - `file_path`: percorso relativo sul filesystem protetto locale (Free-Tier, 0 € canoni cloud)
   - `file_sha256_hash`: impronta crittografica SHA-256 a 64 caratteri esadecimali calcolata all'atto del caricamento
   - `uploaded_at`: timestamp caricamento
   - `verified_by`: utente che ha validato il documento
   - `is_public_for_dpp`: flag per autorizzare la vista nel passaporto digitale pubblico
3. **Verifica Crittografica e Non-Ripudio a Costo Zero (L2):**
   - Ogni file caricato viene processato con la libreria standard Python `hashlib.sha256()`. L'impronta calcolata viene persistita nel database.
   - All'atto della consultazione del DPP o di un audit doganale, l'endpoint calcola in tempo reale l'hash del file salvato e lo confronta con il valore memorizzato, validando istantaneamente l'integrità del documento (`tamper-evident verification`) senza richiedere registrazioni notarili a pagamento o gas fee blockchain.
4. **Passaporto Digitale del Prodotto (DPP UE) a Doppia Vista:**
   - **Vista B2C Consumatore (Public DPP):**
     * Badge di sostenibilità concia (LWG Gold/Silver, Concia al Vegetale, Metal-Free).
     * Paese di origine grezzo animale e distretto conciario di lavorazione (storytelling etico).
     * Consigli di pulizia e manutenzione del pellame.
     * *Segregazione L6:* omette ragione sociale specifica della conceria se richiesta dal brand (protezione anti-poaching fornitura), non espone fatture, non espone costi.
   - **Vista B2B / Dogane & Ispettiva L6 (Customs & Regulatory Dossier):**
     * Accessibile tramite token riservato o credenziali auditor doganale.
     * Mostra codici certificato LWG/ICEC, Due Diligence EUDR completa, rapporto di prova analitico REACH Cromo VI, codici doganali TARIC (capitoli 41 per pelli, 64 per calzature).
     * Espone gli hash SHA-256 dei documenti ufficiali per verifica immediata di non contraffazione.

---

### Decisione 3: Matrice Taglie & Fabbisogni BOM con Sfrido

La generazione delle commesse di produzione deve gestire la variabilità dimensionale e la resa delle materie prime naturali:

1. **Matrice di Calzata e Ripartizione Taglie (Size Breakdown Grid):**
   - Una commessa (`production_orders`) si articola su una o più varianti PLM, ciascuna con associata la propria scala taglie (es. calzatura uomo EU 39-46, donna EU 35-41, mezza taglia UK/US).
   - Entità `production_order_size_items`:
     * `order_item_id`: legame con la variante di commessa
     * `size_code`: etichetta taglia (es. `39`, `40`, `41`, `42`, `43`, `44`, `45`)
     * `planned_pairs`: paia pianificate
     * `size_consumption_factor`: moltiplicatore di scala rispetto alla taglia base prototipo (es. taglia base 42 = 1.00; taglia 39 = 0.93; taglia 45 = 1.09)
2. **Fattore di Sfrido / Scrap Percentage (`waste_margin_pct`):**
   - Il pellame naturale presenta scarti fisiologici legati alla conformazione dell'animale (collo, pancia, groppone) e alla presenza di difetti naturali (punture di insetti, cicatrici, difetti di fiore).
   - Per ciascuna riga della distinta base di commessa relativa al pellame (`bom_items` con materiale pelle), viene configurato un coefficiente di sfrido standard:
     * Pellami lisci / vitelli pieno fiore di prima scelta: sfrido **15% - 20%**
     * Pellami scamosciati / nappe morbide: sfrido **20% - 25%**
     * Pelli pregiate / rettili / stampe piazzate: sfrido **25% - 35%**
     * Materiali tessili tecnici / fodere sintetiche a rotolo: sfrido **5% - 10%**
3. **Formula di Calcolo Deterministica dei Fabbisogni:**
   $$\text{Fabbisogno Netto (sqft)} = \sum_{i=1}^{N} \left( \text{Paia Taglia}_i \times \text{Consumo Base Prototipo} \times \text{Fattore Taglia}_i \right)$$
   $$\text{Fabbisogno Lordo con Sfrido} = \text{Fabbisogno Netto} \times \left(1 + \frac{\text{Sfrido \%}}{100}\right)$$
4. **Allocazione Lotti di Conceria su Commessa:**
   - Il Work Orders Hub verifica che la giacenza disponibile nel lotto conciario (`stock_quantity_available` di `tannery_batches`) copra integralmente il Fabbisogno Lordo con Sfrido prima di procedere al lancio esecutivo della commessa (`status: in_production`).

---

### Decisione 4: Ciclo di Vita Fasi Terzisti (Lifecycle Subcontractors) in 3 Clic

L'avanzamento delle fasi affidate ai façonisti contoterzisti di distretto segue una state machine rigorosa ed ergonomica:

1. **State Machine Deterministica:**
   ```
   created ──> dispatched ──> accepted ──> in_work ──> completed ──> qa_passed
                  │              │            │           │
                  └── canceled   └── rejected └── on_hold └── qa_rejected (rework)
   ```
2. **Entità `production_phases_execution`:**
   - `id`: identificativo fase commessa
   - `tenant_id`: tenant del brand committente
   - `production_order_item_id`: variante commessa
   - `phase_code`: fase (`taglio`, `giunteria_orlatura`, `montaggio`, `suolatura`, `finissaggio`, `collaudo`)
   - `assigned_subcontractor_company_id`: ID azienda façonista assegnataria (Tier 3)
   - `assigned_pairs_by_size`: ripartizione paia da lavorare per taglia
   - `completed_pairs_by_size`: resa pezzi dichiarati conformi
   - `scrapped_pairs`: scarti registrati con motivazione
   - `magic_link_token`: token usa-e-getta crittografato per l'accesso mobile del terzista a 0 €
   - `status`: stato del ciclo operativo
   - `phase_agreed_price_eur`: compenso pattuito tra brand e terzista (**Segregato L6**: visibile solo al brand e al terzista specifico, mai a competitor o consumatori)
3. **Ergonomia Mobile "3 Clic" (< 90 Secondi):**
   - **Clic 1 (Accettazione & Verifica Lotto):** Il caporeparto façonista tocca il Magic Link ricevuto via messaggio; visualizza la bolla di lavorazione tecnica e valida la conformità del lotto pelle ricevuto dalla conceria.
   - **Clic 2 (Inizio Lavorazione):** Un tap su "Avvia Lavorazione" porta lo stato a `in_work` registrando timestamp automatico.
   - **Clic 3 (Dichiarazione Resa & Fine):** Un tap su "Lavorazione Conclusa", inserimento paia prodotte e trasmissione della commessa alla fase successiva o al collaudo del brand.

---

### Decisione 5: Isolamento Orizzontale Competitor e Segregazione Verticale L6

La coesistenza di molteplici brand e façonisti all'interno della stessa piattaforma PaaS distrettuale impone un modello di sicurezza a doppia barriera:

1. **Isolamento Orizzontale tra Brand Competitor:**
   - Nessun dato, commessa, distinta base, volume di produzione, fornitore o cliente può essere incrociato tra due aziende concorrenti.
   - Nel database, ogni query FastAPI applica sistematicamente il filtro vincolante `WHERE tenant_id = :current_tenant_id`.
   - Se un laboratorio façonista (Tier 3) lavora contemporaneamente per Brand A e Brand B, la sua interfaccia presenta le lavorazioni suddivise per singolo committente con credenziali di sessione indipendenti. Brand A non può in nessun modo rilevare se il laboratorio lavora per Brand B né stimare la capacità produttiva impegnata dal competitor.
2. **Segregazione Verticale Dati Riservati L6 (Brand vs Terzisti):**
   - I façonisti terzisti vedono esclusivamente i dati strettamente necessari alla lavorazione manuale e meccanica: modello, sagome, quote per taglia, istruzioni tecniche, tolleranze qualitative e codice lotto conceria da verificare.
   - **Blindatura Economica Assoluta:**
     * Il costo d'acquisto del pellame al mq/sqft (`unit_cost_eur`) è rimosso alla radice dai serializer/DTO destinati al terzista.
     * I costi di lavorazione delle altre fasi e il costo industriale standard complessivo sono oscurati.
     * I prezzi wholesale, i prezzi retail e i margini commerciali sono inaccessibili.
   - **Architettura DTO Separata (FastAPI / Pydantic):**
     * `BrandProductionOrderFullDTO`: include tutti i costi industriali, mark-up, margini e prezzi di vendita.
     * `SubcontractorPhaseWorkorderDTO`: include solo codici tecnici, taglie, lotti e specifiche operative. Campi economici fisicamente assenti dallo schema.
     * `PublicDPPTraceabilityDTO`: espone al consumatore gli indicatori ambientali, omettendo dettagli contrattuali privati e listini industriali.

---

### Decisione 6: FinOps Invariante a Costo Zero (L2)

- Nessun costo monetario aggiuntivo per l'attivazione della PaaS distrettuale.
- I micro-laboratori accedono gratuitamente (Cost-to-Serve pari a 0,00 EUR/mese, assorbito dal piano Free-Tier di Footlink).
- Storage documentale basato su filesystem locale o volumi cloud gratuiti già inclusi nel piano base, con controllo quote per prevenire abusi.
- Hashing crittografico SHA-256 eseguito dalla CPU host standard senza servizi esterni a pagamento.

---

## 4. Conseguenze & Vincoli

- **Impatto Positivo Atteso:**
  - Standardizzazione industriale della filiera distrettuale: convergenza digitale tra maison del lusso, calzaturifici PMI e micro-laboratori façonisti.
  - Piena aderenza alle direttive europee ESPR (Reg. UE 2024/1781) e anti-deforestazione EUDR (Reg. UE 2023/1115).
  - Tracciabilità inalterabile del pellame con garanzia crittografica SHA-256 a costo zero.
  - Eliminazione degli sprechi di pellame grazie al calcolo deterministico del fabbisogno BOM con sfrido.
  - Blindatura totale dei segreti industriali dei Brand e isolamento perfetto tra competitor di distretto.
- **Rischi Residui & Mitigazione:**
  - *Rischio saturazione storage con PDF pesanti:* mitigato con limite dimensionale a 5 MB per file e compressione automatica lato client/server.
  - *Rischio mancata adozione da parte di piccoli laboratori:* mitigato dall'esperienza d'uso mobile senza password in 3 clic (< 90 secondi).
  - *Rischio data-leakage tra competitor tramite errori di configurazione:* mitigato da test automatizzati di isolamento tenant nella suite CI/CD di backend.
- **Task Derivati per lo Sprint 6:**
  - [`FTL-CEO-008`](../tasks/FTL-CEO-008.json) — Direttiva Esecutiva Sprint 6: PaaS Distrettuale 3 Tier, Pellami/Conceria EUDR & Matrice Taglie con Sfrido
  - [`FTL-GOV-006`](../tasks/FTL-GOV-006.json) — ADR-008 Integrata, Matrice Rischio & Presidio Gatekeeping L1-L6
  - [`FTL-PROD-006`](../tasks/FTL-PROD-006.json) — PRD-006: Work Orders Hub con Matrice Taglie/Sfrido, Passaporto Pellami con Upload Documenti e PaaS Distrettuale
  - [`FTL-TECH-007`](../tasks/FTL-TECH-007.json) — Sviluppo Full-Stack PaaS Distrettuale Multi-Tenant, Commesse, Lotti Conceria con Upload Documenti e Hash SHA-256
  - [`FTL-REV-005`](../tasks/FTL-REV-005.json) — Analisi FinOps & Commerciale PaaS Distrettuale (Tier Enterprise, PMI, Terzisti 0 € e Add-on EUDR/DPP)
  - [`FTL-MKT-005`](../tasks/FTL-MKT-005.json) — Posizionamento e Comunicazione PaaS Distrettuale & DPP Conceria (Storytelling ESPR/EUDR nei Distretti)

---

## 5. Approvazione Formale

- **Proposta da:** Chief Governance Officer (`footlink-cgo`), Chief Technology Officer (`footlink-cto`), Chief Product Officer (`footlink-cpo`) — 19 Ottobre 2026
- **Sottomessa per Approvazione Formale a:** Founder (Control Center)
- **Stato:** Sottomessa con richiesta di approvazione per sblocco gate L3/L6
