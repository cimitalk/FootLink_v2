# ADR-008: Architettura Commesse di Produzione, Tracciabilità Lotti Conceria e Lifecycle Fasi Terzisti

- **Data:** 2026-10-19
- **Stato:** Proposta (Sottomessa ad Approvazione Founder L3/L6)
- **Proponenti:** CGO (`footlink-cgo`), CTO (`footlink-cto`), CPO (`footlink-cpo`)
- **Approvatore richiesto:** Founder (Presidio L3 Architettura Strutturale, L6 Segregazione Industriale, L2 FinOps Zero Spesa)
- **Task di Riferimento:** [`FTL-GOV-006`](../tasks/FTL-GOV-006.json), [`FTL-CEO-008`](../tasks/FTL-CEO-008.json), [`FTL-PROD-006`](../tasks/FTL-PROD-006.json), [`FTL-TECH-007`](../tasks/FTL-TECH-007.json)
- **Iniziativa di Origine:** [`FTL-CEO-006`](../tasks/FTL-CEO-006.json)
- **Documenti Correlati:** [Manifesto di Fondazione](../Manifesto_Fondazione_Footlink.md), [`ADR-003`](./ADR-003-domain-model-1-to-n-pim-plm.md), [`ADR-004`](./ADR-004-network-pricing-and-finops.md), [`ADR-006`](./ADR-006-unified-design-system-and-l6-cost-segregation.md), [`ADR-007`](./ADR-007-flexible-data-model-seasons-collections-domain-registries.md)

---

## 1. Contesto & Motivazione

Con il completamento dello **Sprint 5** ([`ADR-007`](./ADR-007-flexible-data-model-seasons-collections-domain-registries.md)), Footlink ha consolidato le fondamenta del modello di dati (flessibilità schemi, gerarchia Stagioni/Collezioni, anagrafiche master unificate PIM/PLM ed ergonomia UI). La piattaforma è ora pronta per compiere il passaggio decisivo: **transitare dalla modellazione statica del prodotto alla gestione dell'avanzamento esecutivo della produzione manifatturiera di filiera**.

Nel settore calzaturiero e pellettiero del lusso Made in Italy (distretti marchigiano, toscano e veneto), la produzione reale è governata da tre elementi indissolubili:
1. **La Commessa di Produzione (Production Order):** l'unità operativa che raggruppa quantità pianificate per modello/variante PLM, suddivisione per taglia (size breakdown), distinte base (BOM) istanziate e scadenze di consegna.
2. **La Tracciabilità del Lotto di Conceria (Tannery Batch Traceability):** il pellame rappresenta tra il 45% e il 65% del valore intrinseco e dell'impronta ambientale del manufatto. La normativa europea **ESPR (Reg. UE 2024/1781)**, le direttive anti-deforestazione (**EUDR**) e i protocolli di qualità (**LWG - Leather Working Group**, **ICEC**) impongono la tracciabilità documentata e verificabile del lotto di concia (tipo di concia vegetale/cromo/metal-free, provenienza del grezzo, codice certificato, conformità chimica REACH).
3. **Il Ciclo di Lavorazione Distribuito sui Terzisti (Subcontractor Phase Lifecycle):** la fabbricazione della calzatura di lusso richiede una sequenza precisa di fasi specializzate (Taglio, Giunteria/Orlatura, Montaggio, Applicazione Suola, Finissaggio e Collaudo), tradizionalmente affidate a laboratori artigianali e façonisti esterni indipendenti.

Questa complessità operativa deve convivere con due **vincoli inderogabili** stabiliti dal [Manifesto di Fondazione](../Manifesto_Fondazione_Footlink.md):
- **Vincolo FinOps L2 ("Zero Spesa Monetaria Autonoma"):** l'intera architettura deve operare su infrastruttura Free-Tier (0 €/mese), senza attivare servizi cloud a pagamento, abbonamenti SaaS esterni o API proprietarie a canone per enti certificatori.
- **Vincolo di Sicurezza & Riservatezza Industriale L6 ("Segregazione Dati Brand vs Terzisti"):** i façonisti e i laboratori esterni devono poter operare a Costo Zero (0 €) in "3 Clic", ma **non devono in alcun caso visualizzare dati economici confidenziali** (costo d'acquisto dei pellami presso la conceria, costo orario o totale delle altre fasi, costo industriale standard, listini wholesale/retail del brand o margini commerciali).

---

## 2. Opzioni Considerate

### Opzione A: Gestione Commesse Delegata a ERP Esterni e Tracciabilità PDF Allegata
- **Descrizione:** Mantenere Footlink come puro archivio PIM/PLM, delegando la gestione commesse all'ERP del brand e allegando le certificazioni conceria come PDF statici non indicizzati.
- **Pro:** Ridotto effort di sviluppo full-stack nello Sprint 6.
- **Contro:**
  - Perdita del valore cardine di Footlink come orchestratore collaborativo di filiera.
  - Impossibilità di alimentare in tempo reale il Passaporto Digitale del Prodotto (DPP UE) con dati verificati di lotto.
  - Mancata adozione da parte dei façonisti, costretti a doppie registrazioni manuali o scambi via email/WhatsApp.
  - Nessuna garanzia programmatica di segregazione dei dati industriali L6.

### Opzione B: Modulo Commesse Nativo, Tracciabilità Lotti Conceria con Hash SHA-256 e State Machine Fasi Terzisti Segregata L6 (Scelta)
- **Descrizione:** Introdurre un'architettura nativa per le Commesse di Produzione, i Lotti di Conceria e il Lifecycle delle Fasi Esecutive, orchestrata tramite FastAPI, SQLite/PostgreSQL e componenti React ad alta ergonomia (Design System v2.0).
- **Pro:**
  - Copertura integrale del ciclo di vita: dalla distinta base alla commessa, dal lotto conciario alla bolla di fase del terzista, fino al QR code DPP finale.
  - Segregazione rigorosa L6 a livello di Schema relazionale e DTO FastAPI (prevenzione by-design di data-leakage economico).
  - Portale Terzista 0 € ottimizzato per smartphone e tablet ("3 Clic" per presa in carico, avanzamento e resa).
  - Piena aderenza FinOps L2: costi operativi 0 €/mese grazie all'uso di hash SHA-256 locali per l'immutabilità dei certificati di lotto.
- **Contro:** Richiede un coordinamento strutturato tra CPO (PRD-006) e CTO (FTL-TECH-007) nello Sprint 6.
- **Effort stimato:** M (3–5 giorni di sviluppo full-stack coordinato).

---

## 3. Decisioni Architetturali

Si approva e si ratifica l'**Opzione B**, articolata nelle seguenti 5 decisioni architetturali vincolanti.

### Decisione 1: Modello Dati Commessa di Produzione (`production_orders` & `production_order_items`)
Vengono introdotte due entità relazionali con vincolo di integrità referenziale con il catalogo PIM/PLM e il calendario Stagioni/Collezioni:
1. `production_orders`:
   - `id`: identificativo univoco (UUID / Integer)
   - `order_number`: codice identificativo leggibile (es. `COMM-2026-001`)
   - `brand_id`: tenant proprietario committente
   - `season_id` & `collection_id`: aggancio alla gerarchia di moda ([ADR-007](./ADR-007-flexible-data-model-seasons-collections-domain-registries.md))
   - `status`: enum rigoroso (`draft`, `planned`, `in_production`, `quality_control`, `completed`, `shipped`, `cancelled`)
   - `order_date`: data emissione ordine
   - `target_delivery_date`: data obiettivo consegna magazzino/cliente
   - `total_pairs_planned`: somma totale paia/pezzi pianificati
   - `total_pairs_produced`: consuntivo pezzi collaudati conformi
   - `notes`: note operative di commessa
   - `metadata_json`: attributi dinamici estendibili dal Founder
2. `production_order_items`:
   - `id`: identificativo riga
   - `production_order_id`: foreign key verso la commessa
   - `plm_variant_id`: foreign key verso la variante PLM del modello
   - `size_breakdown_json`: dizionario JSON della griglia taglie/quantità (es. `{"39": 30, "40": 60, "41": 80, "42": 80, "43": 40, "44": 20}`)
   - `planned_quantity`: totale paia per la specifica variante
   - `produced_quantity`: paia effettive collaudate
   - `assigned_bom_id`: distinta base attiva congelata al momento del lancio della commessa

### Decisione 2: Sottosistema Tracciabilità Lotti Conceria (`tannery_batches`)
Per gestire l'origine, la chimica e la sostenibilità dei pellami a supporto del Passaporto Digitale (DPP UE) e degli audit di filiera:
1. `tannery_batches`:
   - `id`: identificativo lotto
   - `batch_number`: codice lotto fornitore/conceria (es. `LOT-CONC-2026-X88`)
   - `supplier_registry_id`: legame con l'anagrafica fornitori (`domain_registries` plm/suppliers)
   - `leather_type`: tipologia pellame (es. *Vitello Pieno Fiore*, *Camoscio*, *Nappa Piuma*, *Tessuto Tecnico*)
   - `tanning_method`: classificazione metodo concia (`vegetable`, `chrome_free`, `wet_white`, `traditional_chrome`)
   - `raw_hide_origin`: paese di origine del grezzo animale (es. *Francia*, *Italia*, *Germania* - conformità EUDR)
   - `lwg_score`: livello certificazione Leather Working Group (`Gold`, `Silver`, `Bronze`, `Audited`, `None`)
   - `lwg_certificate_id`: codice identificativo verificabile LWG
   - `icec_certificate_id`: codice identificativo tracciabilità ICEC (es. *ICEC TS_PC_041*)
   - `reach_compliant`: flag booleano di conformità sostanze chimiche vietate (REACH SVHC)
   - `chemical_safety_pass`: flag superamento test capitolato chimico
   - `certificate_hash`: impronta SHA-256 della scheda tecnica/bolla per garanzia di non-ripudio a costo zero
   - `unit_cost_eur`: costo d'acquisto al mq/piede (campo segregato L6, non accessibile ai terzisti)
   - `received_date` & `quality_status`: stato accettazione all'ingresso magazzino (`accepted`, `quarantine`, `rejected`)
2. Associazione Lotto ↔ Commessa:
   - Ciascuna riga di componente della distinta base commessa (`bom_items` di livello L1 pellame) associa uno o più `tannery_batches`, garantendo il tracking puntuale su quali lotti di concia siano stati impiegati nel lotto di calzature.

### Decisione 3: State Machine Lifecycle Fasi Terzisti (`production_phases_execution`)
Il ciclo di avanzamento della commessa tra i laboratori esterni segue una state machine deterministica:
1. Stati della Fase:
   ```
   created → dispatched → accepted → in_work → completed → qa_passed
               │            │           │          │
               └── canceled  └── rejected└── on_hold└── qa_rejected (rework)
   ```
2. Entità `production_phases_execution`:
   - `id`: identificativo esecuzione fase
   - `production_order_item_id`: legame con la riga variante di commessa
   - `phase_code`: codice fase da anagrafica (`taglio`, `giunteria_orlatura`, `montaggio`, `suolatura`, `finissaggio`)
   - `subcontractor_registry_id`: laboratorio façonista assegnatario (`domain_registries` plm/subcontractors)
   - `status`: stato del ciclo operativo
   - `assigned_quantity`: quantità da lavorare per taglia
   - `completed_quantity`: quantità lavorata dichiarata
   - `defect_quantity`: scarti o difetti riscontrati
   - `dispatched_at`, `started_at`, `completed_at`, `inspected_at`
   - `magic_link_token`: token sicuro usa-e-getta per accesso diretto mobile del terzista a 0 €
   - `phase_cost_eur`: costo pattuito con il brand (segregato L6, visibile solo al brand)
3. Ergonomia Mobile "3 Clic":
   - **Clic 1 (Accettazione & Verifica Lotto):** Il terzista apre il link, visualizza la bolla e convalida il lotto di materiale in ingresso.
   - **Clic 2 (Inizio Lavorazione):** Transizione a `in_work` con timestamp automatico.
   - **Clic 3 (Dichiarazione Resa & Fine):** Inserimento pezzi conformi e trasmissione al brand per il collaudo di fase.

### Decisione 4: Segregazione Dati Industriali Riservati L6 e Architettura DTO
Per prevenire categoricamente leak di know-how o margini finanziari verso i laboratori o competitor:
1. **Separazione DTO Backend (FastAPI):**
   - `ProductionOrderBrandDetailDTO`: restituisce l'albero completo inclusi costi pellame (`unit_cost_eur`), compensi façon (`phase_cost_eur`), costi industriali complessivi e margini commerciali.
   - `SubcontractorPhaseWorkorderDTO`: espone **esclusivamente** codice commessa anonimizzato, modello, griglia taglie/quantità, specifiche tecniche di lavorazione, tolleranze qualitative e codice lotto conceria da verificare. **Nessun campo economico è presente nel modello Pydantic.**
   - `DPPPublicTraceabilityDTO`: espone al consumatore e al QR code i dati di sostenibilità (metodo di concia, rating LWG, distretto di manifattura) omettendo ragioni sociali contrattuali di sub-fornitura e dettagli fiscali privati (protezione anti-supplier poaching).
2. **Access Control Layer:**
   - La risoluzione dei permessi avviene a livello di endpoint FastAPI tramite dependency injection (`get_current_tenant_role`), impedendo l'accesso ai campi L6 anche in caso di manomissione dei parametri lato client.

### Decisione 5: FinOps Invariante a Costo Zero (L2)
- La persistenza risiede nei motori SQLite e PostgreSQL nativi già configurati.
- L'immutabilità della tracciabilità di lotto e delle dichiarazioni di fase è garantita da hash crittografici SHA-256 generati tramite libreria standard Python (`hashlib`), azzerando la necessità di blockchain proprietarie o servizi notarili a pagamento.
- Nessun costo infrastrutturale o canone aggiuntivo: rispetto rigoroso del vincolo **0 €/mese**.

---

## 4. Conseguenze & Vincoli

- **Impatto Positivo Atteso:**
  - Piena tracciabilità di filiera conforme a ESPR UE 2024/1781 e requisiti di passaporto digitale.
  - Sincronizzazione in tempo reale dello stato avanzamento commesse tra brand e façonisti.
  - Salvaguardia totale dei segreti industriali e dei margini economici del Brand committente.
  - Esperienza ultra-semplificata per i laboratori artigianali privi di competenze informatiche.
- **Rischi Residui & Mitigazione:**
  - *Rischio mancata adozione da parte dei terzisti:* mitigato dal Magic Link a 3 tap senza necessità di download app, registrazione password o costi di abbonamento.
  - *Rischio incongruenza scarti/resi:* mitigato dal workflow di collaudo e accettazione di fase (`qa_passed` / `rework_needed`).
- **Task Derivati per lo Sprint 6:**
  - [`FTL-CEO-008`](../tasks/FTL-CEO-008.json) — Direttiva Esecutiva Sprint 6
  - [`FTL-GOV-006`](../tasks/FTL-GOV-006.json) — Formalizzazione ADR-008 e Monitoraggio Matrice L2/L6
  - [`FTL-PROD-006`](../tasks/FTL-PROD-006.json) — PRD-006: Specifica Funzionale Commesse & Tracciabilità Lotti Conceria
  - [`FTL-TECH-007`](../tasks/FTL-TECH-007.json) — Sviluppo Full-Stack Commesse, Lotti Conceria e Lifecycle Terzisti
  - [`FTL-REV-005`](../tasks/FTL-REV-005.json) — Analisi FinOps & Commerciale Modulo Commesse e Conceria
  - [`FTL-MKT-005`](../tasks/FTL-MKT-005.json) — Storytelling e Posizionamento DPP Conceria & Filiera

---

## 5. Approvazione

- **Proposta da:** Chief Governance Officer (`footlink-cgo`), Chief Technology Officer (`footlink-cto`), Chief Product Officer (`footlink-cpo`) — 19 Ottobre 2026
- **Sottomessa per Approvazione Formale a:** Founder (Control Center)
- **Stato:** Sottomessa con richiesta di approvazione per sblocco gate L3/L6
