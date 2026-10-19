# 🏛️ Direttiva Esecutiva CEO: Realineamento Strategico su 4 Direttive del Founder (FTL-CEO-009, 010, 011, 012)

- **Documento ID:** `SPRINT-6-REALIGNMENT-2026-10-19`
- **Autore:** Chief Executive Officer (`footlink-ceo`)
- **Destinatari:** Founder, Chief Governance Officer (CGO), Chief Product Officer (CPO), Chief Technology Officer (CTO), Chief Revenue Officer (CRO), Chief Marketing Officer (CMO)
- **Task di Riferimento nel Founder Control Center:**
  - [`FTL-CEO-009`](../../tasks/FTL-CEO-009.json) — *Nuova area PRODOTTI (PLM & Distinte Base)*
  - [`FTL-CEO-010`](../../tasks/FTL-CEO-010.json) — *Revisione del Modulo PIM (Default 1:1, Aggregazione 1:N & Feed Esterni)*
  - [`FTL-CEO-011`](../../tasks/FTL-CEO-011.json) — *Stand-by del Modulo 02 Work Orders Hub & Size Matrix*
  - [`FTL-CEO-012`](../../tasks/FTL-CEO-012.json) — *Revisione Modulo 03 Vault Conceria & LWG (File Upload Reale, Template Excel, Validazione BOM)*
- **Data:** 19 Ottobre 2026
- **Stato:** Esecutivo — Mandato Operativo Immediato per la C-Suite

---

## 1. Visione Strategica & Priorità Operative

Il Founder ha registrato nel **Founder Control Center** 4 direttive ad alto impatto che riordinano la sequenza realizzativa di Footlink:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ SEQUENZA STRATEGICA DI REALINEAMENTO SPRINT 6                                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. FOCUS SU PRODOTTO & DISTINTA BASE (FTL-CEO-009)                                     │
│    Separare l'anagrafica tecnica PLM dal ponte commerciale: creare un'area "PRODOTTI"  │
│    ad alta velocità con griglia avanzata, gestione BOM integrata ed export Excel.      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. CHIAREZZA E POTENZA DEL PIM (FTL-CEO-010)                                           │
│    Rinominare la funzionalità in "PIM", attivare il default speculare 1:1 automatico    │
│    da PLM e abilitare l'aggregazione 1:N (bundle/look) con feed e-commerce e showroom. │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. CONGELAMENTO TEMPORANEO COMMESSE (FTL-CEO-011)                                      │
│    Mettere in stand-by il Modulo 02 (Commesse & Taglie) per non disperdere focus       │
│    prima che i cataloghi Prodotti, BOM e PIM siano perfettamente collaudati.           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. PRAGMATISMO INDUSTRIALE NEL VAULT CONCERIA (FTL-CEO-012)                            │
│    Rimuovere il gergo interno, vincolare i lotti ai pellami BOM, introdurre il vero     │
│    upload di file (PDF/immagini) e abilitare il caricamento massivo Excel con template.│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Questa riconfigurazione risponde a una logica industriale ineccepibile: **nella manifattura del lusso non si possono orchestrare commesse di fabbrica (Work Orders) se prima la gestione dei Prodotti PLM, la Distinta Base (BOM), il catalogo commerciale PIM e la tracciabilità delle pelli non offrono un'ergonomia perfetta e una velocità d'uso quotidiana.**

---

## 2. Dettaglio delle Direttive Operative per Ciascun Task

### 2.1 FTL-CEO-011: Stand-by Modulo 02 (Work Orders Hub & Size Matrix)
- **Motivazione Strategica:**
  L'orchestrazione avanzata delle commesse di produzione, delle curve taglia e dei fabbisogni con sfrido (ADR-008) richiede che i dati di base (modelli PLM, varianti colore e distinte base materiali) siano consolidati e privi di frizioni di inserimento. Attivare il Modulo 02 prematuramente rischia di generare confusione nei test utente del Founder.
- **Azione Operativa:**
  - Sospendere la visualizzazione del Modulo 02 (`production_orders`) da `NAV_MODULES` in `App.tsx` e dalla dashboard principale (`FootlinkHomeHub.tsx`).
  - Mantenere intatta la base di codice e i modelli dati nel backend per riattivazione rapida al completamento della fase di catalogazione.
  - Registrare in governance lo stato formale di `deferred_standby`.

### 2.2 FTL-CEO-012: Revisione del Modulo 03 (Vault Conceria & LWG)
- **Motivazione Strategica:**
  La conceria è l'interlocutore primario per la conformità ESPR ed EUDR. Le interfacce devono parlare il linguaggio industriale e supportare i flussi reali (documenti PDF ufficiali e fogli Excel di consegna lotti).
- **Interventi Obbligatori:**
  1. **Pulizia Label:** Sostituire la dicitura tecnica `FTL-CEO-006 · PASSAPORTO PELLAMI & CONCERIA (UE ESPR & EUDR)` con una dicitura chiara e professionale:  
     `VAULT CONCERIA & TRACCIABILITÀ PELLAMI · CERTIFICAZIONI LWG / ICEC (UE ESPR & EUDR)`.
  2. **Vincolo Obbligatorio Pelle da BOM:** Nel form di creazione lotto (`+ NUOVO LOTTO CONCERIA`), il campo materiale non deve essere un input testuale libero, ma un **selettore a discesa obbligatorio** filtrato esclusivamente sui materiali di tipo **PELLAME** (categoria `leather`, `upper`, `lining`) presenti nelle distinte base BOM attive a sistema.
  3. **Upload Reale di File Certificati:** Eliminare la textarea per payload stringa/base64 grezzo. Implementare un **componente di upload file reale (drag & drop e file picker)** per file PDF, JPG, PNG. Il sistema legge il file binario, ne ricava nome, estensione e dimensione, calcola l'impronta crittografica **SHA-256 a costo zero** (FinOps L2) e visualizza il documento allegato con badge di validità.
  4. **Download Template Excel & Caricamento Lotti Massivo:**
     - Aggiungere il pulsante `📥 Scarica Template Excel/CSV Lotti`.
     - Strutturare il template standard con le colonne: `batch_number`, `supplier_name`, `material_code`, `leather_type`, `tanning_method`, `raw_hide_origin`, `lwg_score`, `icec_certificate_id`, `reach_compliant`.
     - Aggiungere il pulsante `📤 Carica Lotti da Excel/CSV` con parser automatico, anteprima di validazione e salvataggio massivo istantaneo.

### 2.3 FTL-CEO-009: Nuova Area PRODOTTI (PLM Master Catalog & BOM Integrata)
- **Motivazione Strategica:**
  Separare nettamente il dominio ingegneristico di sviluppo prodotto (PLM) dal dominio commerciale di vendita (PIM). L'ufficio tecnico necessita di una "Control Room Prodotti" ad alta efficienza per censire modelli, varianti e distinte base.
- **Funzionalità dell'Area Prodotti:**
  1. **Visualizzazione a Griglia Avanzata:**
     - Tabella compatta e moderna con colonne essenziali (Codice Modello, Nome, Categoria, Genere, Stagione di Lancio, Numero Varianti, Stato BOM, Stato Attivo).
     - Ricerca testuale full-text, filtri rapidi combinati per Stagione, Categoria e Collezione.
     - Toggle di ordinamento su qualsiasi colonna.
  2. **Export Excel Istantaneo:**
     - Pulsante dedicato per esportare l'intero catalogo o la vista filtrata in formato Excel/CSV per condivisione con reparti modelleria e fornitori.
  3. **Gestione BOM (Distinta Base) Integrata:**
     - Accesso diretto alla distinta base del modello dalla griglia (drawer laterale o scheda contestuale).
     - Visualizzazione ad albero gerarchico a 3 livelli: L1 Componenti macro (Tomaia, Fodera, Fondo, Minuterie), L2 Materiali specifici con resa e unità di misura, L3 Lavorazioni associate.
     - Possibilità di aggiungere, modificare e cancellare righe BOM in linea senza navigare in schermate secondarie.
  4. **Inserimento e Modifica Rapida (Fast Entry):**
     - Form compatto ed ergonomico per la creazione istantanea di un nuovo modello con variante colore in meno di 60 secondi.
     - Azione "Duplica Prodotto" per clonare un modello esistente e derivarne una nuova variante o campionario.

### 2.4 FTL-CEO-010: Revisione del Modulo 04 in "PIM" & Canali Commerciali
- **Motivazione Strategica:**
  Il PIM è il motore di distribuzione commerciale omnicanale. Deve azzerare il carico di lavoro per i prodotti semplici e offrire massima flessibilità per i prodotti composti.
- **Evoluzione del Modulo PIM:**
  1. **Ridenominazione Ufficiale:** Il modulo 04 assume il nome univoco di **"PIM" (Product Information Management)**.
  2. **Comportamento Default Speculare 1:1:**
     - Per impostazione predefinita, ogni volta che un articolo o una variante viene creata nel PLM, essa esiste immediatamente come articolo commerciale PIM 1:1, ereditando codici, descrizioni e immagini, senza che l'operatore debba eseguire passaggi manuali di associazione.
  3. **Aggregazione Commerciale 1:N per Prodotti Complessi:**
     - L'utente commerciale ha la facoltà di creare un articolo PIM aggregato (es. *Kit Scarpa + Cintura Abbinata*, *Cofanetto Regalo*, *Lookbook Completo Sneaker + Pochette*) associando N articoli industriali PLM distinti all'interno di un'unica scheda commerciale.
  4. **Aggancio a Stagioni & Collezioni Commerciali:**
     - Ogni scheda PIM espone chiaramente la Stagione e la Collezione di appartenenza, consentendo di preparare i listini per i lanci commerciali.
  5. **Export Cataloghi & Syndication Feed Esterni:**
     - Funzione di export catalogo commerciale formattato (Excel, CSV, PDF).
     - Generatore di **Feed Esterni Standardizzati** (formato JSON REST e CSV strutturato) pronti per essere consumati da e-commerce (Shopify, WooCommerce), piattaforme marketplace di moda e showroom virtuali B2B (JOOR, NuORDER).

---

## 3. Direttive Esecutive di Coordinamento per la C-Suite

### ⚖️ CGO (Chief Governance Officer)
- Aggiornare formalmente il registro dei task in `Azienda/tasks/`, sincronizzando `FTL-CEO-009`, `FTL-CEO-010`, `FTL-CEO-011`, `FTL-CEO-012`.
- Redigere l'addendum ad ADR-008 per formalizzare la sospensione temporanea del Modulo 02 e preparare la documentazione di governance per la nuova architettura Prodotti PLM vs PIM.
- Monitorare il rispetto dell'invariante FinOps L2 (zero spese monetarie).

### 🎯 CPO (Chief Product Officer)
- Ridisegnare i flussi utente e l'Interaction Design:
  - Mockup e specifiche per la nuova area autonoma **PRODOTTI (PLM)** con gestione BOM incorporata.
  - Flusso PIM con default 1:1 e modale per la creazione di bundle aggregati 1:N.
  - Flusso di upload file reale nel Vault Conceria e specifica per il template Excel scaricabile.
- Aggiornare il PRD di riferimento per riflettere la separazione tra PLM e PIM.

### 💻 CTO (Chief Technology Officer)
- **Frontend (`Applicativo/frontend/`):**
  - Aggiornare `NAV_MODULES` in `App.tsx`: nascondere Modulo 02; introdurre il tab `PRODOTTI (PLM)`; rinominare il tab 04 in `PIM`.
  - Creare il nuovo componente `ProductsPlmManager.tsx` con griglia ad alte prestazioni, filtri, export Excel e gestione BOM integrata (`BomThreeLevelTree`).
  - Riconfigurare `PimToPlmBridge.tsx` / `PimCatalogManager.tsx`: default 1:1, builder 1:N e generatore feed esterni.
  - Aggiornare `TanneryVaultManager.tsx`: correggere label, dropdown materiale vincolato su pelle BOM, drag & drop file upload con hash SHA-256 e pulsanti template/import Excel.
- **Backend (`Applicativo/backend/`):**
  - Esporre endpoint per upload file reale con calcolo hash SHA-256 e storage locale.
  - Esporre endpoint per template Excel e import massivo lotti conceria.
  - Esporre endpoint per esportazione feed PIM multicanale (JSON/CSV).
  - Verificare che la test suite Pytest rimanga al 100% passante con zero regressioni.

### 💰 CRO (Chief Revenue Officer)
- Valorizzare commercialmente la distinzione tra PLM (valore per la fabbrica e l'ufficio tecnico) e PIM (valore per le vendite e il canale commerciale).
- Sfruttare la funzione di import massivo Excel lotti conceria per accelerare l'onboarding delle concerie a canone zero/PMI.

### 📣 CMO (Chief Marketing Officer)
- Riorientare la comunicazione di prodotto: valorizzare Footlink come la prima soluzione che unisce un PLM industriale con BOM a 3 livelli a un PIM per feed e-commerce e B2B integrato con tracciabilità conciaria reale.

---

## 4. Criteri di Accettazione per Chiusura Task nel Founder Control Center

I 4 task saranno dichiarati **DONE** nel Founder Control Center al verificarsi dei seguenti criteri oggettivi:

| Task ID | Deliverable Primario | Criteri di Accettazione (Definition of Done) |
|---|---|---|
| **FTL-CEO-011** | Stand-by Modulo 02 Commesse | 1. Modulo 02 rimosso dalla barra di navigazione e dai collegamenti rapidi della Home Launchpad.<br>2. Codice sorgente preservato e documentato lo stato di stand-by.<br>3. Nessuna rottura di compilazione frontend o test backend. |
| **FTL-CEO-012** | Revisione Vault Conceria | 1. Label pulita senza codici di task interni.<br>2. Selettore materiale obbligatorio nel form lotto, popolato solo da materiali pelle (`leather`/`upper`/`lining`) presenti in BOM.<br>3. Upload reale file (PDF, JPG, PNG) con hash SHA-256 automatico al posto della textarea base64.<br>4. Download template Excel disponibile e caricamento lotti da Excel funzionante con feedback di validazione. |
| **FTL-CEO-009** | Nuova Area PRODOTTI (PLM) | 1. Modulo PRODOTTI accessibile come voce primaria di navigazione.<br>2. Griglia avanzata con ricerca, ordinamento e filtri combinati per stagione/collezione.<br>3. Pulsante export Excel funzionante per il catalogo prodotti.<br>4. Gestione della distinta base (BOM) integrata direttamente nella vista prodotto con editing componenti.<br>5. Inserimento e duplicazione rapida prodotti attiva e verificata. |
| **FTL-CEO-010** | Revisione Modulo PIM & Feed | 1. Modulo rinominato ufficialmente in PIM.<br>2. Default 1:1 attivo: ogni articolo PLM è immediatamente presente nel PIM.<br>3. Funzione di aggregazione 1:N per creare bundle commerciali complessi da più articoli PLM.<br>4. Associazione esplicita a Stagioni e Collezioni.<br>5. Esportazione catalogo e generazione feed per sistemi esterni (e-commerce/B2B) collaudata. |

---

*La presente direttiva entra in vigore immediatamente. L'intera C-Suite è allineata all'esecuzione.*

**Firmato:**  
*Chief Executive Officer (`footlink-ceo`)*  
*Footlink — 19 Ottobre 2026*
