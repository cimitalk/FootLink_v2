# PRD-008: Specifiche Funzionali e Interaction Design per Tassonomia a 3+1 Livelli, Classificatori di Merchandising, Deep Copy BOM e Bulk Import Wizard

- **Data:** 20 Ottobre 2026
- **Autore:** Chief Product Officer (`footlink-cpo`)
- **Stato:** Approvato
- **Task di Riferimento:** [`FTL-PROD-010`](../../tasks/FTL-PROD-010.json)
- **ADR Correlata:** [`ADR-010`](../../adr/ADR-010-product-hierarchies-merchandising-classifiers-and-bom-cloning.md)

---

## 1. Obiettivo di Prodotto

Il presente documento definisce le specifiche funzionali e di interazione utente per lo **SPRINT 7**, incentrato sulla transizione da una gestione monodimensionale dei prodotti a un'architettura dati avanzata adatta a maison di lusso e PMI manifatturiere:
1. **Tassonomia Merceologica a 3+1 Livelli:** Organizzazione gerarchica ad albero (*Macro-Settore > Famiglia > Sotto-Famiglia/Tipologia > Costruzione Tecnica*).
2. **Matrice Classificatori Commerciali & Piramide di Collezione:** Gestione esplicita di *Carryover Iconico*, *Seasonal Core*, *Fashion Trend*, *Capsule Drop*, *Linea Brand*, *Occasione d'Uso*, *Fascia Prezzo* e *Canale*.
3. **Motore di Duplicazione con Deep Copy BOM:** Flusso per clonare una variante tecnica duplicando ricorsivamente l'intera distinta base a 3 livelli con tabella di sostituzione rapida materiali.
4. **BOM Template Library:** Preset pronti all'uso per tipologia di calzatura e pelletteria.
5. **Bulk Data Onboarding (Import/Export Massivo con Dry-Run):** Wizard in due fasi per caricamento di articoli e distinte basi con anteprima di validazione preventiva e prevenzione di dati orfani.

---

## 2. Modello Funzionale & Tassonomia

### 2.1 Albero Categorie Merceologiche
- **Livello 1 — Divisione / Macro-Settore:**
  - `footwear` (Calzature)
  - `leather_goods` (Pelletteria)
  - `apparel` (Abbigliamento)
- **Livello 2 — Famiglia:**
  - Calzature: `sneakers` (Sneakers), `formal` (Eleganti/Classiche), `loafers` (Mocassini), `boots` (Stivali & Stivaletti), `sandals` (Sandali & Ciabatte), `pumps` (Décolleté & Tacchi).
  - Pelletteria: `bags` (Borse), `small_leather_goods` (Piccola Pelletteria), `belts` (Cinture).
  - Abbigliamento: `outerwear` (Capispalla), `knitwear` (Maglieria), `trousers` (Pantaloni).
- **Livello 3 — Sotto-Famiglia / Tipologia:**
  - Sneakers: `low_top_cupsole` (Bassa Fondo Cassetta), `retro_runner` (Running Retrò), `skate` (Skate / Vulcanizzata), `chunky` (Platform / Chunky).
  - Eleganti: `derby` (Derby Francesina Aperta), `oxford` (Oxford Francesina Chiusa), `monkstrap` (Doppia Fibbia / Monkstrap).
  - Mocassini: `penny_loafer` (Penny Loafer con Mascherina), `driving_shoe` (Gommino da Guida / Tubolare), `tassel_loafer` (Mocassino con Nappe).
  - Stivali: `chelsea_boot` (Tronchetto con Elastico Chelsea), `combat_boot` (Anfibio / Stringato Militare), `ankle_boot` (Stivaletto con Zip).
  - Décolleté: `classic_pump_85` (Tacco 85 a Spillo), `kitten_heel` (Tacco Basso Rocchetto), `slingback` (Slingback / Tallone Scoperto).
- **Livello 4 — Tipo Costruzione / Lavorazione Manifatturiera:**
  - `cassetta_cucita` (Cassetta Cucita Box Sole)
  - `blake` (Cucitura Blake passante)
  - `goodyear` (Cucitura Goodyear con guardolo)
  - `tubolare_sacchetto` (Lavorazione Tubolare / Sacchetto bolognese)
  - `strobel` (Montaggio Strobel sportivo)
  - `ago` (Montaggio Tradizionale a Collante)

### 2.2 Classificatori di Merchandising
- **Piramide di Collezione (`carryover_status`):**
  - `carryover`: Iconico Continuativo (modelli permanenti, a magazzino, mai a saldo).
  - `seasonal_core`: Cuore della Collezione (volumi principali della stagione).
  - `seasonal_trend`: Moda & Sfilata (articoli di tendenza ad alta visibilità).
  - `capsule_drop`: Edizione Limitata / Drop (capsule collection o collaborazioni speciali).
- **Linea di Prodotto (`brand_line`):** Main Line, Second Line, Heritage Archives, Atelier / Lab.
- **Occasione d'Uso (`target_occasion`):** Business Formal, Smart Casual, Gala / Evening, Urban Active, Outdoor Leisure.
- **Fascia Prezzo (`price_tier`):** Entry Luxury, Core Luxury, High Luxury, Bespoke.

---

## 3. Interaction Design & Flussi Utente

### 3.1 Flusso "Duplica Variante con BOM"
1. L'utente clicca l'azione **"Duplica Variante"** nella tabella `PlmProductsManager`.
2. Si apre la modale con:
   - Codice Nuova Variante (proposto in automatico, es. `MOD-01-V2`).
   - Nome Colore / Variante (es. *Camoscio Deserto*).
   - Scala Taglie associata.
   - Switch *"Clona Distinta Base (BOM a 3 livelli)"* (attivo di default).
   - Tabella *"Sostituzione Rapida Materiali"*: elenco dei materiali L1 con dropdown per sostituire un materiale su tutti i nodi di tomaia o fodera con un clic.
3. Al clic su *"Conferma e Clona"*, il backend esegue la duplicazione atomica.

### 3.2 Flusso "Applica Template BOM"
1. Nella vista di dettaglio di una variante con BOM vuota o incompleta, l'utente trova il pulsante **"✨ Applica Preset BOM"**.
2. Un selettore propone i template disponibili:
   - *Preset Sneaker Cupsole Cassetta* (Tomaia vitello L1, Fodera spugna/pelle L1, Soletto estraibile L2, Fondo cassetta TR/Gomma L2, Lacci e minuteria L3).
   - *Preset Mocassino Classico Fondo Cuoio* (Tomaia vitello pieno fiore L1, Fodera capra L1, Suola cuoio con guardolo L2, Tacco cuoio/gomma L2, Filo cerato e passalacci L3).
   - *Preset Décolleté Tacco 85* (Tomaia camoscio L1, Fodera capretto L1, Sottopiede sagomato L2, Tacco ABS laccato L2, Suoletta cuoio e sottotacco PU L3).
   - *Preset Borsa Shopping Tote* (Pannelli pelle L1, Fodera cotone cerato L1, Rinforzi interni e salpa L2, Zip e moschettoni ottone L3).
3. Con un clic, l'albero BOM a 3 livelli viene generato istantaneamente.

### 3.3 Flusso "Bulk Onboarding Wizard"
1. L'utente accede alla modale *"📥 Importa Dati da File"*.
2. **Step 1 — Download Template:** Pulsanti per scaricare i file template CSV/Excel:
   - *Template Articoli & Varianti* (con colonne gerarchia, classificatori, stagioni, prezzi, scale taglie).
   - *Template Distinta Base Multi-Livello* (con codici variante, livello L1/L2/L3, tipo componente, materiale, fornitore, UoM, consumo, sfrido %).
3. **Step 2 — Caricamento & Validazione Dry-Run:**
   - Trascina il file compilato.
   - Clicca *"Valida File"*: il backend analizza ogni riga senza scrivere su DB.
   - Viene visualizzata una tabella con righe in verde (valide) e in rosso (errori specifici con spiegazione es. *"Collezione non trovata"* o *"Nodo padre BOM inesistente"*).
4. **Step 3 — Commit Atomico:**
   - Se ci sono righe valide, l'utente può procedere con *"Importa Righe Valide a Database"*.

---

## 4. Criteri di Accettazione

1. La navigazione gerarchica delle categorie è disponibile nei form di creazione, quick edit e filtri dell'Area Prodotti PLM e PIM Hub.
2. I badge visivi della piramide di collezione (`Carryover`, `Seasonal`, `Capsule`) sono renderizzati in tabella con colori distintivi.
3. La duplicazione variante clona tutti i nodi BOM L1, L2, L3 preservando la struttura padre-figlio.
4. L'applicazione di un BOM template popola la distinta base in < 1 secondo.
5. Il download dei template CSV e la validazione Dry-Run restituiscono feedback immediato senza corruzione dei dati a database.
