# PRD-007: Nuova Area PRODOTTI (PLM & Ingegneria BOM), Revisione Modulo PIM (Catalogo Commerciale) e Vault Conceria V2

**Versione:** 1.0  
**Data:** 19 Ottobre 2026  
**Autore:** Chief Product Officer (`footlink-cpo`)  
**Destinatari:** Founder, CEO, CTO, CGO, CRO, CMO  
**Riferimento Strategico:** [Manifesto di Fondazione Footlink](../../Manifesto_Fondazione_Footlink.md) · [`Role_CPO_Footlink.md`](../roles/Role_CPO_Footlink.md)  
**Direttive Founder Collegate:** [`FTL-CEO-009`](../../tasks/FTL-CEO-009.json), [`FTL-CEO-010`](../../tasks/FTL-CEO-010.json), [`FTL-CEO-011`](../../tasks/FTL-CEO-011.json), [`FTL-CEO-012`](../../tasks/FTL-CEO-012.json)  
**Task Prodotto:** [`FTL-PROD-007`](../../tasks/FTL-PROD-007.json)  
**Decision Record di Riferimento:** [`ADR-003`](../../adr/ADR-003-domain-model-1-to-n-pim-plm.md), [`ADR-006`](../../adr/ADR-006-unified-design-system-and-l6-cost-segregation.md), [`ADR-007`](../../adr/ADR-007-flexible-data-model-seasons-collections-domain-registries.md)  

---

## 1. Executive Summary & Visione di Prodotto

Con le direttive emanate nel Founder Control Center (`FTL-CEO-009`, `FTL-CEO-010`, `FTL-CEO-011`, `FTL-CEO-012`), il Founder ha impresso una svolta pragmatica e focalizzata sull'usabilità industriale di Footlink.

L'analisi di prodotto condotta dal CPO evidenzia la correttezza strategica di questa riorganizzazione:
1. **Scorporo della gestione Prodotti & Distinte Base:** la precedente schermata "04 Prodotti & Ponte 1:N" concentrava troppi compiti eterogenei (creazione varianti industriali, editing commerciale, costificazione e mapping), sovraccaricando l'operatore di fabbrica. La creazione di un'area ad-hoc **PRODOTTI (PLM & Ingegneria BOM)** separata dal modulo **PIM (Catalogo Commerciale)** restituisce chiarezza semantica, velocità operativa e allineamento perfetto con l'organizzazione reale dei brand e dei calzaturifici.
2. **PIM con Default 1:1 e Composizione 1:N Aggregata:** l'ufficio commerciale non deve essere costretto a configurazioni complesse: per impostazione predefinita ogni articolo PLM ingegnerizzato si riflette 1:1 nel catalogo commerciale, ma con la piena facoltà di comporre articoli commerciali 1:N (bundle promozionali, prodotti multi-sourcing da stabilimenti diversi), associarli a stagioni/collezioni ed esportare cataloghi e feed verso Shopify e showroom B2B.
3. **Evoluzione Professionale del Vault Conceria (Modulo 03):** rimozione delle diciture tecniche interne ("FTL-CEO-006"), vincolo obbligatorio di aggancio a un componente pelle di distinta base, eliminazione del payload base64 a favore di un vero upload di file PDF/immagini, e introduzione del template Excel scaricabile per l'import massivo dei lotti di pellame.
4. **Sospensione Temporanea Work Orders Hub (Modulo 02 in Stand-By):** congelamento della visibilità in piattaforma del Modulo 02, concentrando l'effort ingegneristico e l'attenzione degli utenti sull'eccellenza del binomio PLM/PIM e sulla gestione lotti conciari.

---

## 2. Nuova Architettura di Navigazione dei Moduli

In ottemperanza alla direttiva `FTL-CEO-011`, il **Modulo 02 (Work Orders Hub & Size Matrix)** viene posto in stato di **stand-by** e rimosso dalla barra di navigazione applicativa e dalla schermata principale Home Hub.

La barra di navigazione e l'esperienza utente vengono riorganizzate nella seguente sequenza coerente:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ NUOVA MAPPA DI NAVIGAZIONE APPLICATIVA FOOTLINK OS (DS v2.0)                                          │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [👟 FOOTLINK]                                                                                          │
│                                                                                                        │
│   • Home Launchpad                    (Panoramica, Hero KPI Strip, Accesso Diretto)                    │
│   • 01 PaaS Distretto & Utenti        (Membership 3 Tier: Enterprise, PMI, Laboratori 0 €)             │
│   • 02 Prodotti (PLM & BOM)           [NUOVO] (Griglia Avanzata, Quick Edit, BOM 3 Livelli, Export)    │
│   • 03 PIM (Catalogo Commerciale)     [REVISIONATO] (Default 1:1, Aggregati 1:N, Feed Shopify/B2B)    │
│   • 04 Vault Conceria & Pellami       [REVISIONATO] (Lotti Conceria, File Upload PDF, Import Excel)    │
│   • 05 Stagioni & Collezioni          (Gerarchia Temporale Moda: 1 Stagione ↔ N Collezioni)            │
│   • 06 Anagrafiche di Dominio         (Master Data Hub, Fornitori, Fasi, Soft-Disable)                 │
│   • 07 Modello Dati Flessibile        (Founder Schema Studio, Attributi Dinamici No-Code)              │
│   • 08 Terzisti 0 €                   (Portale Mobile Smartphone "≤ 3 Clic a 0 €")                     │
│   • 09 Passaporto DPP                 (Live EU ESPR Passport, QR Code B2C vs Dossier Doganale L6)      │
│                                                                                                        │
│   [MODULO 02 WORK ORDERS HUB: IN STAND-BY · INVISIBILE DA UI · PRESERVATO NEL CORE BACKEND]            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Nuova Area PRODOTTI (PLM & Ingegneria BOM) — Specifica UX & Funzionale (FTL-CEO-009)

### 3.1 Scopo & Utenti Target
- **Ruoli:** Modellista, Direttore Tecnico Manifattura, Responsabile Ufficio Tecnico, Pianificatore di Produzione.
- **Obiettivo:** Gestire la vita tecnica, le varianti industriali, le schede di lavorazione e le distinte base a 3 livelli dei modelli calzaturieri, di pelletteria e di abbigliamento, con la massima ergonomia e velocità operativa.

### 3.2 Visualizzazione a Griglia Avanzata (Advanced Data Table)
La schermata principale è una tabella dati ad alta densità con design minimale (Nike Editorial Minimalism, sfondo neutro `#F9F9F9`, contrasto marcato su testi e badge):

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ AREA PRODOTTI (PLM & INGEGNERIA BOM)                                                                   │
│ Gestione rapida modelli industriali, distinte base a 3 livelli e schede tecniche di fabbricazione      │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Cerca codice, modello, colore, forma...]  [Tutte le Categorie ▾]  [Tutti gli Stati ▾]  [☑️ Solo Attivi]│
│                                                                                                        │
│ Azioni:  [➕ Nuovo Prodotto PLM]   [📊 Esporta Excel (.xlsx)]   [📄 Esporta CSV]                       │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PREVIEW │ CODICE PLM       │ MODELLO & COLORE          │ CATEGORIA    │ FORMA/PATRON │ STATO    │ BOM  │ COSTO L6 │ ATTIVO│ AZIONI   │
├─────────┼──────────────────┼───────────────────────────┼──────────────┼──────────────┼──────────┼──────┼──────────┼───────┼──────────┤
│ [👟 IMG]│ PLM-DUCA-NERO-01 │ Mocassino Duca - Vitello  │ 👟 Calzature │ FORMA-FM-108 │ Sample   │ 14 v │ € 68,40  │  [ON] │ ✏️ 🧬 👁️│
│ [👟 IMG]│ PLM-DUCA-TESTA-02│ Mocassino Duca - T.Moro   │ 👟 Calzature │ FORMA-FM-108 │ Industr. │ 14 v │ € 69,10  │  [ON] │ ✏️ 🧬 👁️│
│ [👜 IMG]│ PLM-ROMA-TOTE-BG │ Borsa Tote Roma - Taupe   │ 👜 Pelletter.│ MOD-TOTE-V1  │ In Prod. │ 22 v │ € 114,00 │  [ON] │ ✏️ 🧬 👁️│
│ [🧥 IMG]│ PLM-BLAZER-BLU-48│ Blazer Sartoriale Lana 130│ 🧥 Abbigliam.│ PATTERN-SLIM │ Prototype│  8 v │ € 145,50 │  [ON] │ ✏️ 🧬 👁️│
│ [👟 IMG]│ PLM-SNEAK-RETRO  │ Sneaker Cortina Vintage   │ 👟 Calzature │ FORMA-SN-22  │ Archived │ 12 v │ € 42,00  │ [OFF] │ ✏️ 🧬 👁️│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Caratteristiche della Griglia:
- **Badge Categoria Dinamico:** Icona e colore distintivo (`👟 Calzature`, `👜 Pelletteria`, `🧥 Abbigliamento`).
- **Lifecycle Switcher Rapido:** Menu a tendina inline per avanzare di stato (`Prototype` $\rightarrow$ `Sample` $\rightarrow$ `Industrialized` $\rightarrow$ `In Production` $\rightarrow$ `Archived`) senza aprire la scheda.
- **BOM Health Indicator:** Numero di nodi BOM presenti con semaforo verde se costificata al 100%, giallo se mancano materiali primari, grigio se vuota.
- **Costing L6 Segregato:** Colonna del costo industriale complessivo visibile solo con permessi Brand/PMI; mascherata automaticamente con dicitura `🔒 Segregato L6` per i profili terzisti.
- **Soft-Disable Switcher:** Toggle `[ON/OFF]` per disattivare l'articolo senza cancellarlo dal database. Se disattivato (`is_active = false`), il prodotto non è selezionabile per nuovi cicli o ordini, ma rimane intatto nello storico.
- **Pulsante Export Excel:** Generazione immediata del file `.xlsx` formattato contenente tutte le colonne visibili e filtrate, con intestazioni standard pronte per l'analisi di fabbrica.

### 3.3 Quick Create & Quick Edit Drawer (Inserimento Rapido in 60s)
1. **Modal Inserimento Rapido (`+ Nuovo Prodotto PLM`):**
   - Campi essenziali in unica schermata a 2 colonne:
     * Categoria Merceologica (Calzatura, Pelletteria, Abbigliamento)
     * Codice Variante PLM (auto-generato progressivo modificabile, es. `PLM-2026-085`)
     * Nome Modello & Cartella Colore
     * Scala Taglie di Riferimento (Donna 35-42, Uomo 38-46, Confezione 44-56)
     * Forma o Codice Cartamodello Patron
     * Stagione e Collezione di associazione
     * Opzione *"Clona distinta base da modello esistente"* (seleziona un modello sorgente e ne duplica l'albero BOM per velocizzare l'inserimento).
2. **Quick Edit Drawer Laterale:**
   - Cliccando su `✏️ Quick Edit` si apre un pannello scorrevole da destra senza abbandonare la griglia.
   - Consente di modificare descrizioni tecniche, stato di campionatura, calzata e attributi dinamici personalizzati in meno di 15 secondi.

### 3.4 Gestione Integrata della Distinta Base (BOM a 3 Livelli)
Cliccando sull'icona `🧬 Distinta Base` della riga selezionata, la griglia si espande o apre la vista integrata dell'**Albero BOM a 3 Livelli** (`<BomThreeLevelTree />`):
- **Livello L1 (Assiemi/Macro-componenti):** Tomaia, Fodera, Soletto di montaggio, Battistrada/Suola, Tacco, Minuterie esterne.
- **Livello L2 (Semilavorati):** Tomaia scarnita e orlata, Suola prefresata con guardolo applicato.
- **Livello L3 (Materie Prime & Chimici):** Pellame di vitello o crosta, adesivi/mastici all'acqua, filati sintetici rinforzati, salpa e contrafforti.
- **Collegamento Obbligatorio Conceria:** Per ogni componente classificato come pellame, la distinta base richiede l'indicazione del **Lotto Conceria Validato**, collegandosi direttamente al Vault Conceria (Modulo 04).

---

## 4. Revisione Modulo PIM (Catalogo Commerciale) — Specifica UX & Funzionale (FTL-CEO-010)

### 4.1 Scopo & Utenti Target
- **Ruoli:** Brand Commercial Director, Merchandiser, E-commerce Manager, Responsabile Showroom B2B.
- **Obiettivo:** Centralizzare le informazioni di vendita rivolte al mercato, gestire listini prezzi, descrizioni di marketing bilingue, collezioni stagionali e alimentare feed esterni verso piattaforme e-commerce e marketplace.

### 4.2 Default 1:1 con PLM (Zero-Effort Commercial Catalog)
- **Regola di Sincronizzazione Automatica:** Per impostazione predefinita, ogni prodotto industriale creato nell'Area PRODOTTI (PLM) genera **immediatamente e automaticamente** una scheda commerciale corrispondente nel modulo PIM con relazione 1:1:
  * Codice SKU commerciale = `SKU-[Codice PLM]`
  * Nome Modello = Nome Modello PLM
  * Categoria, Stagione e Collezione = Ereditate dalla scheda PLM
  * Varianti Industriali Collegate = `[plm_variant_id]` (1:1)
- L'utente commerciale non deve riscrivere alcun dato tecnico: apre la scheda PIM e deve unicamente valorizzare i campi orientati alla vendita (Prezzo Wholesale, Prezzo Retail, Descrizione di Marketing IT/EN, Canali abilitati).

### 4.3 Composizione 1:N Aggregata (Articoli Commerciali Multi-Variante e Multi-Sourcing)
L'utente PIM ha la facoltà di creare schede commerciali con cardinalità **1 Articolo PIM $\leftrightarrow$ N Articoli PLM**:
- **Casi d'Uso Tipici:**
  * *Multi-Sourcing di Fornitura:* La scarpa commerciale `SKU-DUCA-CLASSIC` viene approvvigionata da 2 calzaturifici diversi (es. `PLM-DUCA-MARCHE` e `PLM-DUCA-VENETO`) con lievi differenze di lavorazione o fornitori di componenti, ma venduta sotto la stessa scheda commerciale e prezzo.
  * *Articolo Commerciale Multi-Colore:* Un Master Style commerciale che raggruppa le diverse varianti industriali di colore (Nero, Testa di Moro, Cuoio).
  * *Bundle o Kit Promozionale:* Un codice di vendita che raggruppa scarpa + cintura coordinata prodotte da laboratori differenti.
- **Interfaccia di Associazione 1:N:**
  * Nella scheda PIM è presente il pannello *"Varianti Industriali PLM Collegate"* con pulsante `➕ Associa Variante PLM`.
  * Selettore rapido con ricerca e spunta multipla per collegare le varianti desiderate con assegnazione dello stabilimento primario e secondario.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ SCHEDA COMMERCIALE PIM · SKU-DUCA-MOCASSINO-COM                                                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Nome Commerciale: Mocassino Artigianale Duca · Categoria: 👟 Calzature · Stagione: P/E 2026            │
│ Collezione: Main Collection · Prezzo Retail: € 450,00 · Prezzo Wholesale: € 180,00                    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ COMPOSIZIONE INDUSTRIALE MULTI-VARIANTE (RELAZIONE 1:N):                                               │
│                                                                                                        │
│   [Variante Primaria]   PLM-DUCA-NERO-01  · Vitello Nero    · Calzaturificio Marchigiano (MC)          │
│   [Variante Secondaria] PLM-DUCA-TESTA-02 · Vitello T. Moro · Calzaturificio Marchigiano (MC)          │
│   [Variante Esterna]    PLM-DUCA-SUEDE-03 · Camoscio Sabbia · Manifattura Toscana (FI)                 │
│                                                                                                        │
│   [➕ Collega Altra Variante PLM]                                          [Salva Configurazione]      │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Associazione a Stagioni & Collezioni Annidate
- Ogni articolo PIM è vincolato alla gerarchia temporale:
  * Selezione **Stagione** (es. `P/E 2026`) da menù dinamico alimentato da Modulo 05.
  * Selezione **Collezione** (es. `Main Collection`, `Fashion Runway`, `Capsule Collection`).
- Filtro rapido in testata PIM per visualizzare l'intero catalogo suddiviso per Collezione con indicatori di completezza dati (*Data Quality Score 0-100%*).

### 4.5 Esportazione Cataloghi Multi-Formato & Feed Esterni
La testata del Modulo PIM include una suite completa di syndication commerciale:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ESPORTAZIONE CATALOGHI & FEED ESTERNI CANALI COMMERCIALI                                              │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [📊 Esporta Excel .xlsx]   [📄 Esporta CSV]   [📑 Genera Lookbook PDF]   [🌐 Configura Feed Esterni ▾] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ FEED COMMERCIALI DISPONIBILI:                                                                          │
│                                                                                                        │
│  1. 🛍️ FEED SHOPIFY B2C (CSV / JSON API):                                                              │
│     Mappatura nativa conforme standard Shopify: Handle, Title, Body HTML, Vendor, Type, Tags,          │
│     Variant SKU, Variant Grams, Variant Price, Image URL.                                              │
│     Endpoint Live: GET /api/v1/pim/feeds/shopify-b2c.json                                              │
│                                                                                                        │
│  2. 👔 FEED SHOWROOM DIGITALE B2B (JOOR / NUORDER):                                                    │
│     Tracciato matrice taglie con prezzi wholesale EUR/USD, packaging unit e minimi d'ordine (MOQ).     │
│     Endpoint Live: GET /api/v1/pim/feeds/b2b-showroom.csv                                              │
│                                                                                                        │
│  3. 📦 JSON MASTER FEED INTEGRATION ERP:                                                               │
│     Albero completo PIM ↔ PLM per sincronizzazione automatica verso ERP di sede (SAP/AS400).          │
│     Endpoint Live: GET /api/v1/pim/feeds/master-catalog.json                                           │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Revisione Vault Conceria & Tracciabilità Pellami (Modulo 04) — Specifica UX (FTL-CEO-012)

In risposta ai 4 punti precisi formulati dal Founder nel task `FTL-CEO-012`:

### 5.1 Punto 1 — Pulizia Label & Naming Professionale
- **Cosa eliminare:** Rimozione integrale della dicitura tecnica `FTL-CEO-006 · PASSAPORTO PELLAMI & CONCERIA (UE ESPR & EUDR)`.
- **Nuova intestazione professionale:**
  * **Titolo Principale:** `VAULT CONCERIA & TRACCIABILITÀ PELLAMI`
  * **Badge di Contesto:** `Conformità Conciaria LWG, Tracciabilità ICEC e Regolamenti UE (ESPR & EUDR)`
  * La dicitura è elegante, autorevole, adatta sia al personale di fabbrica che alle demo di vendita verso i clienti.

### 5.2 Punto 2 — Scelta Obbligatoria del Codice Materiale Pelle da BOM in "+ Nuovo Lotto"
- **Problema risolto:** Evitare la creazione di lotti orfani o non agganciati alla distinta base industriale.
- **Specifica UX:**
  * Nel modal `+ Nuovo Lotto Conceria`, il campo **"Codice Componente Pelle BOM"** diventa **obbligatorio (`required`)**.
  * Il menù a tendina visualizza l'elenco filtrato di tutti i componenti presenti nelle distinte base con classe materiale `leather` o tipo `upper` / `lining` (es. `BOM-L1-TOM-01 - Vitello Nappa Piuma 1.2mm`, `BOM-L1-FOD-01 - Fodera Capra Naturale`).
  * Non è consentito il salvataggio del lotto se il materiale pelle non è stato selezionato.
  * Un badge visualizza in tempo reale il modello PLM associato al componente selezionato.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MODAL: REGISTRAZIONE NUOVO LOTTO CONCERIA                                                             │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Azienda Conceria Fornitrice: [Conceria del Chienti S.r.l. ▾]                                           │
│ Codice Lotto Conceria:       [LOT-2026-CH-942        ]                                                 │
│                                                                                                        │
│ MATERIALE IN PELLE DA DISTINTA BASE (OBBLIGATORIO) *:                                                 │
│ [ Seleziona Materiale BOM Pelle...                                                         ▾ ]         │
│   • BOM-L1-TOM-01 · Vitello Pieno Fiore 1.2-1.4mm (Usato in: Mocassino Duca PLM-DUCA-NERO)           │
│   • BOM-L1-TOM-02 · Camoscio Idrorepellente 1.3mm (Usato in: Sneaker Cortina PLM-SNEAK)               │
│   • BOM-L1-FOD-01 · Fodera Capra Naturale Morbida (Usato in: Borsa Tote Roma PLM-ROMA)                │
│                                                                                                        │
│ Metodo di Concia: [Metal-Free Ecosostenibile ▾]   Origine Grezzo Allevamento: [Francia (FR) ▾]         │
│ Quantità Fornita (sqft / mq): [4.500 sqft]        Spessore Misurato: [1.2 - 1.4 mm]                   │
│                                                                                                        │
│ [Annulla]                                                            [✅ Registra Lotto & Salva]       │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Punto 3 — Upload di File Reali (PDF / Immagini) anziché Textarea Base64
- **Problema risolto:** Nessun operatore deve più convertire file in stringhe Base64 o incollare payload di testo grezzo.
- **Specifica UX:**
  * Il modal `+ Carica Certificato` sostituisce la textarea con una zona **Drag & Drop / File Picker** moderna:
    - Formati ammessi: `.pdf`, `.jpg`, `.jpeg`, `.png` (dimensione massima 15 MB).
    - Tipologia documento da selezionare: *Attestato LWG Gold/Silver*, *Certificato ICEC TS 410*, *Scheda di Sicurezza Fornitore*, *Rapporto Prova Chimica REACH (Cromo VI)*.
    - Data di rilascio e data di validità/scadenza.
    - Anteprima visuale del file caricato (icona PDF o thumbnail immagine, nome file, dimensione in KB/MB).
  * **Gestione Tecnica:** Il file viene inviato al backend tramite multipart `FormData`. Il backend salva il file in directory protetta locale e genera automaticamente l'impronta crittografica **SHA-256** per la verifica di non-ripudio a costo zero FinOps.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MODAL: CARICAMENTO CERTIFICATO NEL DOCUMENT VAULT                                                     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Lotto Conceria: LOT-2026-CH-942 (Conceria del Chienti) · Materiale: BOM-L1-TOM-01                      │
│ Tipologia Certificato: [Attestato Sostenibilità LWG (Gold/Silver) ▾]                                  │
│ Ente Emittente / Laboratorio: [Leather Working Group (Audit ID: LWG-IT-8491)]                         │
│ Scadenza Validità: [ 15 / 03 / 2027 ]                                                                  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ CARICAMENTO DOCUMENTO UFFICIALE (PDF o IMMAGINE):                                                      │
│                                                                                                        │
│   ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                         📄 Trascina qui il file del certificato                                   │ │
│   │                                       oppure                                                     │ │
│   │                             [ 📁 Sfoglia File dal Computer ]                                     │ │
│   │                                                                                                  │ │
│   │   Formati accettati: PDF, JPG, PNG · Dimensione massima: 15 MB                                   │ │
│   └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                        │
│ File Selezionato: 📜 Certificato_LWG_Gold_Chienti_2026.pdf (1.8 MB)  [❌ Rimuovi]                       │
│                                                                                                        │
│ [Annulla]                                                        [🚀 Carica File & Calcola Hash]      │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Punto 4 — Template Excel Scaricabile & Import Massivo Lotti
- **Problema risolto:** Consentire il caricamento rapido di decine di lotti di conceria all'inizio della stagione produttiva.
- **Specifica UX:**
  * Nella barra azioni del Vault Conceria sono presenti due pulsanti:
    * `📥 Scarica Template Excel (.xlsx)`
    * `📤 Importa Lotti da Excel/CSV`
  * **Struttura del Template Excel Ufficiale (`template_lotti_conceria_footlink.xlsx`):**
    - Contiene intestazioni colonne bloccate, menu a tendina per campi enum (`vegetable`, `chrome`, `metal_free`, `Gold`, `Silver`, `Bronze`) e una riga di esempio commentata.
    - Colonne previste:
      1. `codice_lotto_conceria` (obbligatorio)
      2. `ragione_sociale_conceria` (obbligatorio)
      3. `distretto_conciario` (Arzignano, Santa Croce, Fermo-Macerata, Solofra)
      4. `codice_materiale_bom_pelle` (obbligatorio, es. `BOM-L1-TOM-01`)
      5. `tipologia_pellame` (es. Vitello Pieno Fiore, Camoscio)
      6. `metodo_concia` (vegetable / chrome / metal_free)
      7. `paese_origine_grezzo` (ISO2 es. IT, FR, DE)
      8. `codice_tracciabilita_macello`
      9. `conforme_eudr_deforestazione` (SI/NO)
      10. `rating_lwg` (Gold / Silver / Bronze / Audited / None)
      11. `punteggio_lwg_pct` (es. 94.8)
      12. `codice_certificato_icec`
      13. `conforme_reach_svhc` (SI/NO)
      14. `cromo_vi_ppm` (es. 0.3)
      15. `spessore_mm` (es. 1.2-1.4)
      16. `quantita_disponibile_sqft` (es. 4500)
  * **Wizard di Importazione in 2 Passaggi:**
    1. *Caricamento File:* L'utente seleziona o trascina il file `.xlsx` o `.csv`.
    2. *Anteprima & Validazione Tabellare:* Il sistema analizza il file e mostra un prospetto prima del salvataggio:
       * Conteggio righe valide (es. *"18 lotti pronti per l'importazione"*).
       * Eventuali righe con errori evidenziate in rosso (es. *"Riga 5: codice materiale BOM inesistente"*).
       * Clic su `Conferma Importazione` per creare tutti i lotti validi nel database.

---

## 6. Specifiche Operative per l'Ingegneria Software (CTO Alignment)

Al fine di guidare il CTO e il team di sviluppo nella realizzazione senza attriti, si specificano i requisiti di interfaccia e architettura dei dati:

### 6.1 Riorganizzazione Componenti Frontend React:
1. **Creazione Componente `<PlmProductsManager />`:**
   - Scorpora la tabella varianti e le azioni di creazione/modifica/disattivazione PLM.
   - Integra il componente `<BomThreeLevelTree />` contestuale per ciascun prodotto.
   - Include motore di ricerca live, filtri per categoria/stato, pulsante export Excel (`xlsx` / `Blob`).
2. **Aggiornamento Componente `<PimCommercialCatalog />` (ex `PimToPlmBridge`):**
   - Schermata focalizzata sui dati di vendita, listini wholesale/retail e canali.
   - Default 1:1 nativo e drawer di associazione 1:N aggregata.
   - Componente di esportazione formati commerciali e feed live (Shopify, Joor B2B, JSON Master).
3. **Aggiornamento Componente `<TanneryVaultManager />`:**
   - Modifica label header: rimuovere stringhe interne `FTL-CEO-006`.
   - Modifica form nuovo lotto: `select` obbligatorio su materiali BOM con `material_class === 'leather'`.
   - Modifica modal upload: eliminare `textarea` base64 e inserire input `type="file"` con anteprima e supporto PDF/PNG/JPG.
   - Aggiunta pulsante download template Excel e modal di upload/validazione massiva.
4. **Aggiornamento `NAV_MODULES` in `App.tsx` e `FootlinkHomeHub.tsx`:**
   - Rimuovere `production_orders` dalla navigazione attiva.
   - Impostare i nuovi moduli ordinati da 01 a 09.

### 6.2 Endpoint Backend FastAPI Necessari / Da Aggiornare:
- `POST /api/v1/plm/products` — Creazione rapida articolo PLM (con auto-creazione opzionale 1:1 nel PIM).
- `PUT /api/v1/plm/products/{id}/status` — Modifica rapida stato di ciclo o disattivazione soft (`is_active = false`).
- `GET /api/v1/plm/products/export/excel` — Generazione file binario Excel dei prodotti industriali e BOM.
- `GET /api/v1/pim/feeds/shopify-b2c` & `GET /api/v1/pim/feeds/b2b-showroom` — Endpoint di syndication feed per canali esterni.
- `POST /api/v1/tannery/batches/import/excel` — Parsing multipart file Excel e inserimento massivo lotti validati.
- `GET /api/v1/tannery/templates/batches-excel` — Download file template preconfigurato.
- `POST /api/v1/tannery/batches/{id}/documents/upload` — Upload multipart del file binario PDF/immagine con calcolo SHA-256 e salvataggio locale.

---

## 7. Criteri di Accettazione Esecutivi (Acceptance Criteria)

1. ✅ **Modulo 02 in Stand-By:** Il modulo Work Orders Hub non è più visibile né nella barra di navigazione né nella griglia principale di Home Hub.
2. ✅ **Nuova Area PRODOTTI (PLM):** Presenza di una griglia avanzata per articoli industriali con filtri per categoria/stato, ricerca rapida, switch attivo/disattivo soft, export Excel funzionante e gestione dell'albero BOM a 3 livelli integrata.
3. ✅ **Quick Inserimento PLM:** Possibilità di creare un nuovo prodotto industriale in meno di 60 secondi con campi minimi essenziali e opzione di clonazione BOM.
4. ✅ **Modulo PIM Catalogo Commerciale:** Riflesso automatico 1:1 degli articoli PLM come schede commerciali di default, con possibilità di comporre articoli aggregati 1:N, assegnazione a stagioni/collezioni ed export feed per Shopify e B2B.
5. ✅ **Label Vault Conceria:** Totale assenza di riferimenti a codici task interni (`FTL-CEO-006`); nuova intestazione professionale "Vault Conceria & Tracciabilità Pellami".
6. ✅ **Obbligatorietà Pelle in Lotto Conceria:** Impossibile salvare un nuovo lotto se non è stato selezionato un materiale di tipo pelle presente in una distinta base attiva.
7. ✅ **File Upload Reale nel Vault:** Upload di certificati in formato PDF o JPG/PNG tramite file picker nativo (nessuna textarea per stringhe base64), con calcolo automatico dell'hash SHA-256.
8. ✅ **Template & Import Excel Lotti:** Presenza del template Excel scaricabile e funzionamento della procedura di importazione massiva con anteprima e validazione delle righe.

---

*Documento approvato dal Chief Product Officer (CPO) di Footlink in data 19 Ottobre 2026 in attuazione delle direttive del Founder.*
