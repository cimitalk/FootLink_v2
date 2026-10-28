# PRD-009: Sprint 8 ("La Ripartenza") — Framework di Verticalizzazione Epoca II, Gestione Colori Intelligente (Colorway BOM Matrix) e Albo Fornitori Centralizzato a 360°

- **Versione:** 1.0  
- **Data:** 26 Ottobre 2026  
- **Autore:** Chief Product Officer (`footlink-cpo`)  
- **Stato:** Approvato — Mandato Esecutivo Sprint 8 ("La Ripartenza")  
- **Destinatari:** Founder, CEO (`footlink-ceo`), CTO (`footlink-cto`), CGO (`footlink-cgo`), CRO (`footlink-cro`), CMO (`footlink-cmo`)  
- **Riferimento Strategico:** [Manifesto di Fondazione Footlink](../../Manifesto_Fondazione_Footlink.md) · [`Role_CPO_Footlink.md`](../roles/Role_CPO_Footlink.md)  
- **Direttive Founder Collegate:** [`FTL-CEO-016`](../../tasks/FTL-CEO-016.json) (Reset & Ripartenza Epoca II), [`FTL-CEO-017`](../../tasks/FTL-CEO-017.json) (Gestione Colori Intelligente), [`FTL-CEO-018`](../../tasks/FTL-CEO-018.json) (Gestione Fornitori Centralizzata a 360°)  
- **Task Prodotto:** [`FTL-PROD-011`](../../tasks/FTL-PROD-011.json)  
- **Decision Record di Riferimento:** [`ADR-003`](../../adr/ADR-003-domain-model-1-to-n-pim-plm.md), [`ADR-006`](../../adr/ADR-006-unified-design-system-and-l6-cost-segregation.md), [`ADR-007`](../../adr/ADR-007-flexible-data-model-seasons-collections-domain-registries.md), [`ADR-010`](../../adr/ADR-010-product-hierarchies-merchandising-classifiers-and-bom-cloning.md), [`ADR-011`](../../adr/ADR-011-epoca-ii-verticalization-colorway-matrix-and-vendor-hub.md)

---

## 1. Visione di Prodotto dell'Epoca II ("La Verticalizzazione")

### 1.1 Analisi del Gap di Profondità Funzionale (Epoca I vs Epoca II)
Negli Sprint 1–7 (**Epoca I — La Fondazione Orizzontale**), Footlink ha costruito l'impalcatura architetturale e navigazionale completa della piattaforma: i 9 moduli applicativi (`01 District PaaS`, `02 Prodotti PLM & BOM`, `03 PIM Catalogo Commerciale`, `04 Vault Conceria`, `05 Stagioni & Collezioni`, `06 Anagrafiche di Dominio`, `07 Modello Dati Flessibile`, `08 Portale Terzisti 0 €`, `09 Passaporto DPP UE`), il ponte nativo **1 Articolo PIM (Vendita) ↔ N Varianti PLM (Produzione)** e il Design System editoriale unificato.

Tuttavia, l'audit di prodotto condotto con l'occhio critico del **Modello Utente Reale di Fabbrica** ha evidenziato un **gap di profondità funzionale (Vertical Depth Gap)**: molte entità critiche del ciclo di vita moda-lusso erano ancora gestite come *stringhe di testo libero* o *record anagrafici piatti*, anziché come **oggetti relazionali intelligenti** capaci di guidare automazioni, controlli di qualità e prevenzioni d'errore lungo la distinta base.

| Modulo Applicativo | Stato Fine Epoca I (Orizzontale) | Gap di Profondità Industriale Rilevato | Standard Target Epoca II ("La Verticalizzazione") |
| :--- | :--- | :--- | :--- |
| **`06 Anagrafiche` & `05 Stagioni`** | Elenchi base di codici/nomi per colori e fornitori senza legami operativi profondi. | Assenza di una **Cartella Colori Master** strutturata (Pantone TCX, RAL, Hex, Finitura, Famiglia Commerciale, Stagionalità) e di un **Albo Fornitori Qualificato** con scadenziario certificazioni e rating. | **Hub Anagrafici Intelligenti e Relazionali:** Master Color Palette con Lab-Dip e Vendor Hub a 360° con qualifica automatica, scadenziario LWG/ICEC/EUDR e analisi Where-Used. |
| **`02 Prodotti (PLM & BOM)`** | Variante PLM identificata da un campo testo `colorway_name`; nodi BOM L1/L2/L3 con fornitore e colore testuali. | Impossibile mappare varianti multi-tono (es. tomaia nera, fodera rossa, suola bianca, fibbia oro) a livello di singolo nodo BOM; nessun workflow di approvazione tirella/Lab-Dip; creazione manuale variante per variante. | **Colorway BOM Matrix & 1-Click Colorway Explosion:** Matrice colore per singolo nodo L1/L2/L3, stato Lab-Dip (`Delta-E`), fornitore agganciato da Albo Qualificato e generatore multi-variante automatico. |
| **`03 PIM (Catalogo Commerciale)`** | Sincronizzazione 1:1 e 1:N con attributi marketing e feed Shopify/B2B. | Il nome colore tecnico di fabbrica (*"Vitello Nero Spazzolato Anticato"*) finisce nei filtri e-commerce B2C/B2B senza normalizzazione automatica nella famiglia colore commerciale (*"Nero / Black"*). | **Auto-Mapping Colore E-Commerce & B2B Showroom:** Traduzione deterministica `technical_name_it` $\rightarrow$ `commercial_family` + `hex_code` per filtri faccettati Shopify Plus, JOOR e NuORDER. |
| **`04 Vault Conceria & Pellami`** | Lotti pelle agganciati a nodi BOM con upload PDF/immagini e verifica LWG/EUDR. | Possibilità di associare un lotto pelle di conceria con colore incongruente rispetto al colore previsto dal nodo Tomaia/Fodera nella Colorway BOM; fornitore conceria non validato rispetto allo scadenziario dell'Albo. | **Controllo Coerenza Colore & Guardia Fornitore Qualificato:** Verifica automatica colore Lotto Conceria $\leftrightarrow$ Nodo BOM e blocco/alert se la conceria ha certificazioni LWG/EUDR scadute nell'Albo. |
| **`01 PaaS Distretto` & `08 Terzisti 0 €`** | 3 Tier con Company Switcher e vista mobile "3 Clic a 0 €". | I terzisti e i fornitori inseriti nel PaaS non erano unificati con l'Albo Fornitori/Terzisti di produzione, mancando di calcolo automatico OTD/Qualità e segregazione granulare dei listini L6. | **Unificazione Albo Fornitori/Terzisti & Segregazione L6 Totale:** Unica anagrafica master condivisa, `0 €` perpetuo blindato per il Tier 3 Terzista, listini e valori aggregati Where-Used rigorosamente segregati L6. |

### 1.2 Nuovi Standard di Densità Funzionale per le 6 Personas Reali
Con lo **Sprint 8 ("La Ripartenza")**, ogni schermata e flusso di Footlink deve soddisfare i requisiti operativi quotidiani di **6 profili professionali reali** del distretto calzaturiero, pelletteria e abbigliamento:

1. **👩‍🎨 Colorista & Ufficio Stile (Material & Color Designer):**
   - Gestisce le **Cartelle Colori Stagionali e Continuative** con codifica rigorosa (`HEX`, `Pantone TCX`, `RAL`, tipo finitura superficiale).
   - Governa il ciclo di approvazione delle **Tirelle / Lab-Dip** per ogni accoppiata Materiale–Colore, registrando letture spettrofotometriche ($\Delta E$) ed emettendo approvazioni master o deroghe condizionate (`conditional_waiver`).
   - Esplode in **1 clic** un modello prototipo approvato in $N$ varianti colore stagionali applicando regole cromatiche predefinite (*Tono su Tono*, *Contrasto Fondo*, *Galvanica Oro vs Palladio*).
2. **📐 Modellista & Tecnico Distinta Base (PLM / BOM Engineer):**
   - Non digita più stringhe libere per colori o fornitori: compila la **Colorway BOM Matrix** assegnando a ogni nodo L1 (Tomaia, Fodera, Suola, Tacco, Minuterie), L2 (Semilavorati) e L3 (Pellami, Filati, Chimici, Scatola) il colore esatto dalla Cartella Colori e il Fornitore dall'Albo Qualificato.
   - Visualizza istantaneamente alert di incongruenza cromatica con i lotti conceria o alert di certificazione scaduta sul fornitore selezionato.
3. **💼 Buyer & Ufficio Acquisti (Procurement & Sourcing Manager):**
   - Governa l'**Albo Fornitori & Terzisti a 360°** filtrando per ruolo di filiera (*Conceria, Suolificio, Tacchificio, Galvanica, Tomaificio, Montaggio*) e distretto geografico (*Fermo-Macerata, Santa Croce, Riviera del Brenta, Caserta, Vigevano*).
   - Controlla lead time standard, MOQ, condizioni di pagamento, listini prezzi riservati (L6) e utilizza il pannello **"Impatto Fornitore (Where-Used)"** per sapere in 1 secondo su quali modelli, varianti BOM e lotti pesa ciascun fornitore e per quale valore economico aggregato.
4. **🛡️ Responsabile Qualità, Sostenibilità & Compliance ESG (QA / ESG Officer):**
   - Monitora lo **Scadenziario Attivo Certificazioni** (`LWG Gold/Silver/Bronze`, `ICEC`, `EUDR Due Diligence`, `REACH SVHC`, `ISO 9001/14001`, `DURC`) con calcolo automatico dei giorni residui e semaforo visivo.
   - Valuta il **Vendor Rating Multi-Parametrico (0–100)** calcolato su *Qualità Lotti (40%)*, *Puntualità OTD (30%)* e *Conformità ESG/Documentale (30%)*, ponendo in stato `probation_warning` o `blocked_expired_certs` i fornitori non conformi.
5. **🛍️ Merchandiser & Digital E-Commerce Manager:**
   - Beneficia dell'**Auto-Mapping Colore E-Commerce** nel modulo `03 PIM Hub`: la nuance tecnica di fabbrica (*"Camoscio Visone Bruciato Idroripellente"*) viene automaticamente esposta nei feed B2C/B2B con la famiglia commerciale normalizzata (*"Marrone / Brown"*) e lo swatch esadecimale ufficiale, azzerando le bonifiche manuali sui cataloghi Shopify Plus, JOOR e NuORDER.
6. **🛠️ Artigiano Terzista / Façonista (`Tier 3 — 0 € Perpetuo`):**
   - Continua a operare con **Zero Costi di Licenza (0 € per sempre)** e **Zero Complessità (≤ 3 clic su smartphone)**.
   - Vede chiaramente il codice colore, lo swatch visivo e la finitura richiesta per la lavorazione assegnata, mentre tutti i dati sensibili di listino, MOQ, condizioni di pagamento e valore economico Where-Used restano **100% invisibili e segregati a livello L6**.

---

## 2. Verticalizzazione 1 (`FTL-CEO-017`): Gestione Colori Intelligente & Colorway BOM Matrix

### 2.1 Anagrafica Master Colori & Cartelle Stagionali (`06 Anagrafiche` & `05 Stagioni`)
Il colore cessa di essere un attributo testuale effimero e diventa un'entità di dominio strutturata (**Master Color Registry**), governata all'interno di `06 Anagrafiche di Dominio` (Tab dedicato **"🎨 Cartella Colori Master & Lab-Dip"**) e collegata nativamente a `05 Stagioni & Collezioni`.

#### Schema Attributi dell'Entità Master Colore (`ColorMasterRecord`)
| Campo Tecnico | Tipo Dati | Obblig. | Esempio Reale | Descrizione Funzionale e Regole di Business |
| :--- | :--- | :---: | :--- | :--- |
| `color_id` | `UUID / String` | Sì | `clr-001-blk-deep` | Identificativo univoco immutabile del colore nel database. |
| `color_code` | `String (Unique)` | Sì | `COL-BLK-001` | Codice parlante standardizzato aziendale (es. `COL-{FAM}-{PROG}`). |
| `technical_name_it` | `String` | Sì | *Nero Spazzolato Profondo* | Nome tecnico-industriale utilizzato da modellisti, concerie e reparti produttivi. |
| `technical_name_en` | `String` | Opz. | *Deep Brushed Black* | Traduzione tecnica internazionale per fornitori esteri e passaporto DPP. |
| `commercial_family` | `Enum` | Sì | `Nero / Black` | Famiglia cromatica normalizzata per filtri e-commerce B2C/B2B (`Nero / Black`, `Bianco / White`, `Marrone / Brown`, `Cuoio / Tan`, `Beige / Nude`, `Blu / Navy`, `Rosso / Burgundy`, `Verde / Olive`, `Grigio / Grey`, `Oro / Gold`, `Argento / Palladium`, `Multicolore`). |
| `hex_code` | `String (#RRGGBB)` | Sì | `#141414` | Codice esadecimale validato per la renderizzazione dello swatch visivo in tutta la UI e nei feed digitali. |
| `pantone_tcx_code` | `String` | Sì | `PANTONE 19-4005 TCX` | Riferimento universale Pantone Fashion, Home + Interiors (TCX/TPG) per la comunicazione cromatica con concerie e tessiture. |
| `ral_code` | `String` | Opz. | `RAL 9005` | Riferimento standard RAL (fondamentale per verniciatura tacchi in ABS, minuterie metalliche laccate e fondi in poliuretano/TPU). |
| `finish_type` | `Enum` | Sì | `hand_antiqued` | Finitura superficiale:<ul><li>`matte` (Opaco / Naturale Pieno Fiore)</li><li>`patent_gloss` (Vernice Specchio / Lucido)</li><li>`metallic` (Metallizzato / Laminato / Galvanico)</li><li>`suede_velvet` (Camoscio / Nabuk / Velluto)</li><li>`embossed_grain` (Stampato Grana / Dollaro / Croco)</li><li>`hand_antiqued` (Spazzolato / Anticato a Mano / Tamponato)</li></ul> |
| `season_ids` | `Array<String>` | Sì | `["ALL_CARRYOVER", "FW26-27"]` | Associazione alle **Cartelle Stagionali** (`05 Stagioni`) o marcatura come **Colore Continuativo (`ALL_CARRYOVER`)** sempre disponibile. |
| `applicable_categories` | `Array<Enum>` | Sì | `["leather", "soles"]` | Ambiti merceologici di applicabilità del colore:<ul><li>`leather` (Pellami Tomaia & Fodera)</li><li>`fabrics_synthetics` (Tessuti, Tele, Nastri & Filati)</li><li>`soles_heels` (Fondi, Suole, Guardoli & Tacchi)</li><li>`hardware_trims` (Minuterie Metalliche, Fibbie, Occhielli, Zip)</li><li>`packaging` (Scatole, Dustbag & Cartellini)</li></ul> |
| `is_active` | `Boolean` | Sì | `true` | Soft-disable per archiviare colori fuori produzione preservando lo storico delle BOM passate. |

---

### 2.2 Colorway Matrix sulla Distinta Base a 3 Livelli (`02 Prodotti PLM & BOM`)
Nella realtà industriale calzaturiera e di pelletteria, una variante colore (es. *"Mocassino Duca — Variante Bicolore Nero/Bianco con Morsetto Oro"*) non applica lo stesso colore a tutti i componenti:
- La **Tomaia Esterna (L1/L3)** è in *Nero Spazzolato Profondo (`COL-BLK-001`)*;
- La **Mascherina / Riporto (L1/L3)** è in *Bianco Ottico Pieno Fiore (`COL-WHT-004`)*;
- La **Fodera Interna (L1/L3)** è in *Cuoio Naturale Vegetale (`COL-TAN-002`)*;
- Il **Morsetto Metallico (L1/L3)** è in *Oro Chiaro Galvanico (`COL-GLD-010`)*;
- La **Suola in Cuoio (L2)** ha bordo *Nero Fresato (`COL-BLK-001`)* e battistrada *Naturale (`COL-TAN-002`)*;
- Il **Filato di Orlatura (L3)** è *Tono su Tono Nero (`COL-BLK-001`)*.

#### Superamento del Campo Testo `colorway_name`
1. **Header Variante PLM Arricchito:**
   - Ogni Variante PLM in `02 Prodotti (PLM & BOM)` conserva `colorway_name` come etichetta descrittiva parlante, ma introduce:
     - `master_color_id` (colore dominante della variante, collegato a `ColorMasterRecord`);
     - `secondary_color_id` (opzionale, per varianti bicolore/color-block);
     - `hardware_finish_color_id` (colore galvanica minuterie: es. Oro, Palladio, Rutenio, Verniciato Tono su Tono);
     - `colorway_rule_preset` (`tone_on_tone`, `contrast_white_sole`, `bicolor_editorial`, `custom_matrix`).
2. **Matrice di Abbinamento Colore per Nodo BOM (`Colorway BOM Mapping`):**
   - Ogni singolo nodo dell'albero BOM a 3 livelli (**L1 Assiemi**, **L2 Semilavorati**, **L3 Materie Prime/Pellami/Minuterie/Filati/Packaging**) viene esteso con i campi strutturati di colore e approvazione:
     - `assigned_color_id`: riferimento diretto a un colore valido della Cartella Colori Master (filtrato per `applicable_categories` compatibili col nodo BOM);
     - `color_position_note`: specifica applicativa sul componente (es. *"Tomaia + Tallone"*, *"Bordo Lissonato"*, *"Galvanica Lucida Nickel-Free"*);
     - `lab_dip_status`: stato del **Workflow Approvazione Tirella / Lab-Dip**;
     - `delta_e_value`: valore numerico $\Delta E$ misurato allo spettrofotometro (target eccellenza $\Delta E \le 1.0$, tolleranza industriale $\Delta E \le 1.8$);
     - `spectrophotometer_note`: nota tecnica dell'ufficio stile/qualità (es. *"Luce D65 conforme; leggero metamerismo sotto TL84 accettato"*);
     - `lab_dip_approved_at` e `lab_dip_approved_by`: data e firmatario dell'approvazione ufficio stile.

#### Stati del Workflow Approvazione Tirella / Lab-Dip per Nodo BOM
| Codice Stato | Badge UI | Significato Operativo e Gate di Produzione |
| :--- | :--- | :--- |
| `pending_lab_dip` | `🟡 In Attesa Tirella` | Tirella colore richiesta al fornitore/conceria; il modello può stare in stato `Prototype` o `Sample`, ma mostra un warning se si tenta il passaggio a `In Production`. |
| `approved_master` | `🟢 Master Approvato` | Tirella fisica/spettrofotometrica conforme ($\Delta E \le 1.5$) rispetto al master della Cartella Colori. Semaforo verde per l'industrializzazione e il lancio in produzione. |
| `conditional_waiver` | `🔵 Deroga Stile` | Scostamento cromatico lieve ($1.5 < \Delta E \le 2.5$) accettato in deroga dall'Ufficio Stile per non ritardare la consegna del lotto. Sblocca la produzione con tracciatura della nota. |
| `rejected_delta_e` | `🔴 Rifiutato (ΔE Fuori Tolleranza)` | Tirella bocciata ($\Delta E > 2.5$ o difetto di finitura/mano). **Gate Bloccante:** impedisce l'avanzamento della variante allo stato `In Production` finché non viene approvata una nuova tirella o sostituito il lotto. |

#### Wireframe UX: Colorway BOM Matrix in `02 Prodotti (PLM & BOM)`
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🎨 COLORWAY BOM MATRIX — PLM-DUCA-NERO-01 · Mocassino Duca (Colore Master: COL-BLK-001 Nero Spazzolato #141414)   │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Regola Cromatica: [Tono su Tono + Galvanica Oro ▾]  │ Readiness Tirelle Lab-Dip: [████████░░ 83% (5/6 Approvate)] │
│ Azioni Rapide:    [🪄 Propaga Colore Master su Tomaia/Filati]  [⚡ Esplodi N Varianti da Cartella Colori (1-Click)]│
├──────────┬───────────────────────────┬─────────────────────────────┬──────────────────────┬──────────┬───────────┤
│ LIVELLO  │ NODO COMPONENTE BOM       │ COLORE ASSEGNATO (SWATCH)   │ FORNITORE ALBO       │ ΔE SPETT.│ STATO LAB │
├──────────┼───────────────────────────┼─────────────────────────────┼──────────────────────┼──────────┼───────────┤
│ L1 · TOM │ Tomaia Vitello Spazzolato │ [■ #141414] COL-BLK-001     │ Conceria del Chienti │ ΔE 0.6   │ 🟢 Master │
│          │                           │ Nero Spazzolato · PANTONE.. │ (🟢 Qualificato LWG) │ D65 OK   │ 22/10/2026│
├──────────┼───────────────────────────┼─────────────────────────────┼──────────────────────┼──────────┼───────────┤
│ L1 · FOD │ Fodera Capra Pieno Fiore  │ [■ #C68B59] COL-TAN-002     │ Conceria Sciarada    │ ΔE 0.9   │ 🟢 Master │
│          │                           │ Cuoio Naturale · Matte      │ (🟢 Qualificato LWG) │ D65 OK   │ 21/10/2026│
├──────────┼───────────────────────────┼─────────────────────────────┼──────────────────────┼──────────┼───────────┤
│ L1 · MIN │ Morsetto Frontale Ottone  │ [■ #D4AF37] COL-GLD-010     │ Galvanica Bruni      │ ΔE 0.4   │ 🟢 Master │
│          │                           │ Oro Chiaro 24K · Metallic   │ (🟢 Qualificato ISO) │ Lucido OK│ 20/10/2026│
├──────────┼───────────────────────────┼─────────────────────────────┼──────────────────────┼──────────┼───────────┤
│ L2 · FON │ Suola Cuoio + Guardolo    │ [■ #141414] COL-BLK-001     │ Suolificio Marche    │ ΔE 1.9   │ 🔵 Deroga │
│          │                           │ Lissa Nera Opaca · RAL 9005 │ (🟢 Qualificato)     │ Bordo OK │ 24/10/2026│
├──────────┼───────────────────────────┼─────────────────────────────┼──────────────────────┼──────────┼───────────┤
│ L3 · FIL │ Filato Orlatura Titolo 30 │ [■ #141414] COL-BLK-001     │ Cucirini Tre Stelle  │ ΔE 0.5   │ 🟢 Master │
│          │                           │ Nero Intenso · Matte        │ (🟢 Qualificato)     │ —        │ 19/10/2026│
├──────────┼───────────────────────────┼─────────────────────────────┼──────────────────────┼──────────┼───────────┤
│ L3 · PKG │ Scatola Rigida + Dustbag  │ [■ #F5F2EB] COL-ECR-005     │ Scatolificio Adriat. │ —        │ 🟡 Attesa │
│          │                           │ Avorio Istituzionale        │ (🟡 Audit in corso)  │ In test  │ [Approva] │
└──────────┴───────────────────────────┴─────────────────────────────┴──────────────────────┴──────────┴───────────┘
```

---

### 2.3 Funzionalità "Intelligenti" per l'Utente (Acceleratori Verticali)

#### A. Generatore Multi-Variante da Cartella Colori ("1-Click Colorway Explosion")
- **Problema Reale:** Quando un calzaturificio o un brand sviluppa un nuovo modello (es. *Sneaker Cortina* o *Mocassino Duca*) e decide di produrlo in **6 colori della Cartella Stagionale FW26/27**, oggi il modellista deve duplicare manualmente 6 volte il modello e modificare a mano $6 \times 14 = 84$ righe di distinta base.
- **Soluzione Footlink ("1-Click Colorway Explosion"):**
  1. Dalla barra strumenti di `02 Prodotti (PLM & BOM)` o dal dettaglio di un modello PLM Master, l'utente clicca **`⚡ Genera Multi-Variante da Cartella Colori`**.
  2. Si apre il wizard interattivo in un'unica vista:
     - **Selezione Modello Sorgente:** es. `PLM-DUCA-NERO-01` (con la sua BOM a 3 livelli già strutturata).
     - **Selezione Multipla Colori Target dalla Cartella Stagionale:** l'utente spunta $N$ colori (es. `COL-BRN-003 Testa di Moro`, `COL-RED-007 Bordeaux Imperiale`, `COL-BLU-004 Blu Notte`, `COL-GRN-008 Verde Bosco`).
     - **Scelta della Regola di Abbinamento Intelligente (`Colorway Explosion Rule`):**
       - **`tone_on_tone` (Tono su Tono Integrale):** assegna il colore target a Tomaia, Suola/Guardolo e Filati; mantiene la Fodera in Cuoio Naturale (`COL-TAN-002`) e la Galvanica predefinita.
       - **`contrast_white_sole` (Sport / Contrasto Fondo Bianco):** assegna il colore target a Tomaia e Filati, ma fissa la Suola Cassetta in *Bianco Ottico (`COL-WHT-004`)*.
       - **`luxury_gold_hardware` (Lusso Galvanica Oro):** assegna il colore target alla Tomaia, mantiene la Suola in Cuoio/Nero e imposta tutte le Minuterie Metalliche su *Oro Chiaro (`COL-GLD-010`)*.
       - **`luxury_palladium_hardware` (Lusso Galvanica Palladio):** come sopra, ma imposta tutte le Minuterie Metalliche su *Palladio Lucido (`COL-SLV-011`)*.
     - **Opzione PIM Sync:** switch *"Aggancia automaticamente le nuove varianti al modello commerciale PIM (Ponte 1:N)"* (attivo di default).
  3. Al clic su **`🚀 Genera N Varianti e Matrici BOM`**, il sistema crea atomicamente le $N$ varianti PLM con codici parlanti auto-generati (`PLM-DUCA-BRN-02`, `PLM-DUCA-RED-03`, ...), clona l'albero BOM a 3 livelli di ciascuna applicando la matrice colore selezionata e imposta i nuovi abbinamenti su `pending_lab_dip` (o `approved_master` se la combinazione materiale-colore è già stata certificata in stagione).

#### B. Controllo Automatico di Coerenza Colore Lotto Conceria ↔ BOM (`04 Vault Conceria`)
- **Problema Reale:** In reparto capita che a un nodo BOM Tomaia configurato su *"Testa di Moro (`COL-BRN-003`)"* venga erroneamente agganciato un lotto pelle del Vault Conceria registrato come *"Nero (`COL-BLK-001`)"* o *"Cuoio (`COL-TAN-002`)"*, generando scarti di taglio costosissimi.
- **Soluzione Footlink (Color Consistency Guard):**
  - Ogni lotto nel modulo `04 Vault Conceria` include il riferimento strutturato `color_id` (oltre alla descrizione storica).
  - Il motore di validazione incrociata confronta in tempo reale `tannery_batch.color_id` con `bom_node.assigned_color_id`:
    - **Match Esatto (`🟢 Coerente`):** il colore del lotto pelle coincide con il colore assegnato al nodo BOM Tomaia/Fodera.
    - **Mismatch Famiglia/Codice (`🔴 Disallineamento Colore Lotto ↔ BOM`):** se il lotto pelle ha un `color_id` diverso da quello previsto nella Colorway BOM Matrix del prodotto, Footlink mostra un **alert visivo immediato** sia in `02 Prodotti (PLM & BOM)` sia in `04 Vault Conceria`, bloccando la validazione finale del Passaporto DPP finché l'incongruenza non viene corretta o autorizzata.

#### C. Auto-Mapping E-Commerce & B2B Showroom (`03 PIM Hub`)
- **Problema Reale:** L'ufficio tecnico chiama i colori *"Vitello Anticatura Imperiale Bordeaux"* o *"Suede Visone Bruciato"*, ma su Shopify Plus, JOOR e NuORDER i buyer e i consumatori filtrano per *"Rosso / Burgundy"* o *"Marrone / Brown"*.
- **Soluzione Footlink (Zero-Effort Commercial Color Normalization):**
  - Quando una o più varianti PLM sono collegate a un articolo commerciale nel modulo `03 PIM Hub`, il sistema legge automaticamente il `master_color_id` di ciascuna variante PLM e popola senza intervento umano:
    - **Nuance Tecnica / Editorial Name:** `technical_name_it` (es. *Bordeaux Imperiale Tamponato a Mano*);
    - **Filtro Famiglia E-Commerce B2C/B2B:** `commercial_family` (es. *Rosso / Burgundy*);
    - **Swatch Esadecimale UI & Feed:** `hex_code` (es. `#5E1914`);
    - **Riferimento Pantone:** `pantone_tcx_code` per i buyer B2B su JOOR/NuORDER.
  - Il pannello di export `Shopify Plus B2C` e `B2B Showroom` include automaticamente i metafield `color_family`, `color_hex`, `color_finish` e `pantone_reference`.

---

## 3. Verticalizzazione 2 (`FTL-CEO-018`): Gestione Fornitori ed Albo Centralizzato a 360°

### 3.1 Albo Fornitori & Terzisti Unificato (`06 Anagrafiche` & `01 District PaaS`)
In linea con la direttiva del Founder `FTL-CEO-018`, la gestione dei fornitori di materie prime/componenti e dei laboratori terzisti di lavorazione viene unificata in un **Albo Fornitori & Terzisti Centralizzato a 360°**, accessibile sia dal modulo `06 Anagrafiche di Dominio` (Tab principale **"🏭 Albo Fornitori & Terzisti 360°"**) sia sincronizzato nativamente con i tenant del modulo `01 PaaS Distretto`.

#### Schema Attributi dell'Entità Fornitore / Terzista (`VendorMasterRecord`)
| Campo Tecnico | Tipo Dati | Obblig. | Esempio Reale | Descrizione Funzionale e Regole di Business |
| :--- | :--- | :---: | :--- | :--- |
| `vendor_id` | `UUID / String` | Sì | `vnd-001-chienti` | Identificativo univoco immutabile del fornitore/terzista. |
| `vendor_code` | `String (Unique)` | Sì | `FOR-CONC-001` | Codice albo strutturato (es. `FOR-CONC-001`, `TER-ORL-004`). |
| `company_name` | `String` | Sì | *Conceria del Chienti S.p.A.* | Ragione sociale completa dell'azienda. |
| `vat_number` | `String` | Sì | `IT01458920431` | Partita IVA / Codice Fiscale comunitario o internazionale. |
| `supply_chain_role` | `Enum` | Sì | `tannery` | Ruolo specialistico nella filiera moda:<ul><li>`tannery` (*Conceria*)</li><li>`sole_maker` (*Suolificio / Fondificio*)</li><li>`heel_maker` (*Tacchificio*)</li><li>`hardware_galvanic` (*Minuterie Metalliche & Galvanica*)</li><li>`textile_mill` (*Tessitura / Filati / Nastri*)</li><li>`upper_cutting` (*Tomaificio / Taglio*)</li><li>`stitching_edging` (*Orlatura / Giunteria*)</li><li>`lasting_assembly` (*Montaggio & Finissaggio Calzatura/Pelletteria*)</li><li>`box_packaging` (*Scatolificio & Packaging*)</li></ul> |
| `district_area` | `Enum` | Sì | `Marche - Fermo/Macerata` | Distretto industriale di appartenenza:<ul><li>`Marche - Fermo/Macerata`</li><li>`Toscana - Santa Croce/Scandicci`</li><li>`Veneto - Riviera del Brenta/Arzignano`</li><li>`Campania - Caserta/Napoli/Solofra`</li><li>`Puglia - Barletta/Casarano`</li><li>`Lombardia - Vigevano/Parabiago`</li><li>`Estero - UE / Extra-UE`</li></ul> |
| `country_iso2` | `String (2)` | Sì | `IT` | Codice ISO 3166-1 alpha-2 del paese di produzione (pre-compila automaticamente l'origine nei nodi BOM e nel Passaporto DPP). |
| `city_address` | `String` | Sì | *Tolentino (MC)* | Comune e sede dello stabilimento produttivo principale (utile per calcolo km filiera corta ESG). |
| `paas_tier` | `Enum` | Sì | `tier_2_pmi_supplier` | Inquadramento PaaS Distrettuale:<ul><li>`tier_2_pmi_supplier` (Fornitore Strutturato / Conceria / Suolificio PMI)</li><li>`tier_3_subcontractor_zero_eur` (**Terzista / Laboratorio Façon a 0 € perpetuo!**)</li></ul> |
| `qualification_status` | `Enum` | Sì | `qualified_active` | Stato di qualifica nell'Albo:<ul><li>`qualified_active` (`🟢 Qualificato Attivo`)</li><li>`under_audit` (`🟡 In Audit / Riqualifica`)</li><li>`probation_warning` (`🟠 Con Riserva / Warning`)</li><li>`blocked_expired_certs` (`🔴 Bloccato - Certificazioni Scadute`)</li></ul> |

---

### 3.2 Qualifica Albo, Scadenziario Certificazioni & Vendor Rating Multi-Parametrico

#### 1. Scadenziario Attivo Certificazioni con Semaforo Automatico
Ogni scheda Fornitore nell'Albo integra un registro strutturato delle certificazioni aziendali (`VendorCertificationRecord`), calcolando in tempo reale i **giorni residui alla scadenza (`days_to_expiry`)** rispetto alla data corrente:
- **Tipologie Certificazioni Gestite:**
  - `LWG` (*Leather Working Group — Gold / Silver / Bronze*)
  - `ICEC` (*Istituto di Certificazione della Qualità per l'Industria Conciaria*)
  - `EUDR_DDS` (*Regolamento UE Deforestazione Zero — Due Diligence Statement*)
  - `REACH_SVHC` (*Conformità Chimica Europea REACH / Assenza Cromo VI e PFAS*)
  - `ISO_9001_14001` (*Gestione Qualità ISO 9001 / Gestione Ambientale ISO 14001*)
  - `DURC_SOCIAL` (*DURC Regolarità Contributiva & Audit Etico SA8000 / Sicurezza Lavoro*)
- **Regola Semaforica Automatica:**
  - `🟢 Valida (> 60 giorni a scadenza)`: certificazione pienamente operativa;
  - `🟡 In Scadenza (1 .. 60 giorni a scadenza)`: alert preventivo per l'Ufficio Acquisti/Qualità per richiedere il rinnovo;
  - `🔴 Scaduta (< 0 giorni)`: la certificazione è scaduta. Se si tratta di una certificazione critica (`LWG`, `EUDR_DDS`, `REACH_SVHC`, `DURC_SOCIAL`), il fornitore viene evidenziato con badge di allerta e qualsiasi tentativo di assegnarlo a nuovi nodi BOM o lotti conceria innesca un **Blocco/Alert di Conformità**.

#### 2. Algoritmo Deterministico di Vendor Rating Multi-Parametrico (`0–100`)
Per superare le valutazioni soggettive, Footlink calcola per ogni fornitore/terzista un **Indice Sintetico di Vendor Rating (`overall_vendor_rating`, scala `0–100`)** basato sulla media ponderata di 3 pilastri misurabili:

$$\text{Vendor Rating} = (0.40 \times \text{Score Qualità Lotti}) + (0.30 \times \text{Score Puntualità OTD}) + (0.30 \times \text{Score Conformità ESG/Doc})$$

1. **Qualità Lotti & Conformità Tecnica (`quality_score`: peso 40%):**
   - Misura la percentuale di lotti/commesse accettati al controllo qualità senza non-conformità, resi o bocciature Lab-Dip ($\Delta E$).
2. **Puntualità delle Consegne — On-Time Delivery (`otd_score`: peso 30%):**
   - Misura la percentuale di ordini di fornitura o fasi di lavorazione façon consegnati entro il Lead Time pattuito.
3. **Conformità ESG, Tracciabilità & Documentazione (`esg_compliance_score`: peso 30%):**
   - Misura la completezza e validità temporale delle certificazioni nello scadenziario (LWG, EUDR, REACH, DURC) e la tracciabilità di filiera corta.

| Fascia Punteggio | Classe di Merito Fornitore | Azione Consigliata dal Sistema |
| :---: | :--- | :--- |
| **`90 – 100`** | `🏆 Classe A+ (Strategic Partner)` | Fornitore d'eccellenza: priorità nell'assegnazione modelli continuativi e fast-track campionatura. |
| **`75 – 89`** | `🟢 Classe A (Qualificato Affidabile)` | Fornitore pienamente qualificato per produzione standard. |
| **`60 – 74`** | `🟠 Classe B (Sotto Osservazione)` | Richiesto piano di miglioramento su puntualità OTD o rinnovo certificazioni in scadenza. |
| **`< 60`** | `🔴 Classe C (Critico / Bloccato)` | Sconsigliato per nuove assegnazioni BOM; audit ispettivo obbligatorio. |

---

### 3.3 Parametri Operativi/Listini L6 & Analisi "Where-Used" su BOM e Conceria

#### 1. Parametri Operativi di Fornitura e Listini Componenti/Lavorazioni (Segregazione L6)
All'interno della scheda Fornitore sono gestiti i parametri contrattuali e di approvvigionamento (**rigorosamente protetti da Segregazione L6** secondo [`ADR-006`](../../adr/ADR-006-unified-design-system-and-l6-cost-segregation.md): visibili solo ai ruoli Brand Enterprise / PMI Calzaturificio, **completamente oscurati quando la vista attiva è `Tier 3 — Terzista 0 €`**):
- `standard_lead_time_days`: tempo medio di approntamento merce o lavorazione (es. `15 gg` per conceria, `5 gg` per orlatura terzista);
- `moq_quantity` e `moq_uom`: quantità minima d'ordine (es. `300 sqft` per pellami, `100 paia` per suole, `50 paia` per montaggio);
- `currency`: valuta di fatturazione (`EUR`);
- `payment_terms`: condizioni di pagamento (es. `RIBA 60 gg DFFM`, `Bonifico 30 gg vista fattura`);
- `negotiated_price_list` (Listino Prezzi Concordato L6): elenco strutturato degli articoli/lavorazioni forniti con codice articolo fornitore, descrizione, unità di misura (`sqft`, `paio`, `pz`, `mt`) e prezzo unitario netto concordato (`unit_price_eur`).

#### 2. Collegamento Relazionale Diretto con BOM (`02 PLM`) e Lotti Conceria (`04 Vault`)
- **Selezione Guidata da Albo Qualificato:**
  - Sia nell'editor dei nodi BOM (`02 Prodotti PLM & BOM`) sia nel form di creazione/modifica Lotto Pellame (`04 Vault Conceria`), il campo Fornitore non è più un testo libero ma un **selettore relazionale collegato a `vendor_id` dell'Albo**.
  - **Pre-compilazione Intelligente:** non appena l'utente seleziona un fornitore dall'Albo (es. *Conceria del Chienti S.p.A.*), Footlink pre-compila automaticamente:
    1. Nazione di origine (`country_iso2 = IT`) e Distretto (`Marche - Fermo/Macerata`);
    2. Certificazioni attive (`LWG Gold`, `EUDR Conforme`, `REACH SVHC Conforme`);
    3. Costo unitario base (L6) attinto dal listino concordato del fornitore, se presente.
  - **Gate / Alert Fornitore con Certificazioni Scadute:**
    - Se l'utente seleziona un fornitore il cui stato è `blocked_expired_certs` o che presenta certificazioni `LWG`/`EUDR_DDS`/`REACH_SVHC` scadute, il sistema visualizza un **Banner Critico di Blocco/Alert** (*"⚠️ ATTENZIONE: Il fornitore selezionato presenta certificazioni EUDR/LWG scadute nell'Albo. Impossibile certificare il Passaporto DPP UE finché i documenti non vengono rinnovati."*).

#### 3. Pannello "Impatto Fornitore (Where-Used Analysis)" a 360°
Cliccando su qualsiasi fornitore o terzista nell'Albo (`06 Anagrafiche`), si apre il pannello analitico **"🔍 Impatto Fornitore (Where-Used Analysis)"** che interroga trasversalmente l'intero grafo relazionale di Footlink:
1. **Modelli Commerciali PIM Impattati (`03 PIM Hub`):** elenco di tutti gli SKU di vendita la cui catena produttiva dipende da quel fornitore.
2. **Varianti Tecniche PLM Impattate (`02 Prodotti PLM`):** elenco delle varianti modello/colore attive in cui il fornitore è coinvolto.
3. **Nodi Distinta Base L1/L2/L3 (`BOM Nodes`):** dettaglio esatto di quali componenti (es. *Tomaia L1*, *Suola Cassetta L2*, *Morsetto L1*) sono forniti da quell'azienda, con consumo unitario e costo nodo.
4. **Lotti Pellame in Magazzino/Conceria (`04 Vault Conceria`):** tutti i lotti registrati per quella conceria con metratura disponibile (`sqft`) e stato conformità.
5. **Valore Economico Aggregato & Rischio di Concentrazione (Segregato L6):**
   - Calcolo istantaneo del **Valore Economico Totale Annuo / Stagionale Impegnato (€)** verso quel fornitore (somma del valore dei lotti e dell'incidenza sui nodi BOM per i volumi pianificati).
   - Se l'utente commuta la vista su **Terzista 0 € (`Tier 3`)**, tutti gli importi monetari, i listini e il valore aggregato Where-Used vengono mascherati con badge `🔒 Segregato L6 — Riservato Brand/PMI`.

#### Wireframe UX: Albo Fornitori 360° & Pannello Where-Used (`06 Anagrafiche`)
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🏭 ALBO FORNITORI & TERZISTI CENTRALIZZATO A 360°                                                                │
│ Qualifica di filiera, Scadenziario Certificazioni LWG/EUDR, Vendor Rating (0-100) e Analisi Impatto Where-Used   │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Cerca ragione sociale, P.IVA, codice...] [Ruolo Filiera: Tutti ▾] [Distretto: Tutti ▾] [Stato Qualifica: ▾]  │
├──────────────┬──────────────────────────┬───────────────────┬─────────────────────┬───────────┬──────────────────┤
│ CODICE ALBO  │ RAGIONE SOCIALE & RUOLO  │ DISTRETTO & PAAS  │ SCADENZIARIO CERT.  │ RATING    │ STATO QUALIFICA  │
├──────────────┼──────────────────────────┼───────────────────┼─────────────────────┼───────────┼──────────────────┤
│ FOR-CONC-001 │ Conceria del Chienti SpA │ Marche (IT)       │ 🟢 LWG Gold (+280g) │ 🏆 96/100 │ 🟢 Qualificato   │
│              │ 🐄 Conceria Pellami      │ Tier 2 PMI        │ 🟢 EUDR / REACH OK  │ Q:98 O:94 │ [🔍 Where-Used]  │
├──────────────┼──────────────────────────┼───────────────────┼─────────────────────┼───────────┼──────────────────┤
│ FOR-SUOL-002 │ Suolificio Marche Srl    │ Marche (IT)       │ 🟢 ISO 9001 (+190g) │ 🟢 88/100 │ 🟢 Qualificato   │
│              │ 👟 Suolificio / Fondi    │ Tier 2 PMI        │ 🟡 ISO 14001 (+32g) │ Q:90 O:86 │ [🔍 Where-Used]  │
├──────────────┼──────────────────────────┼───────────────────┼─────────────────────┼───────────┼──────────────────┤
│ TER-ORL-004  │ Tomaificio F.lli Rossi   │ Marche (IT)       │ 🟢 DURC OK (+95g)   │ 🏆 92/100 │ 🟢 Qualificato   │
│              │ 🧵 Orlatura & Tomaificio │ Tier 3 (0 € Perp.)│ 🟢 Audit Etico OK   │ Q:95 O:90 │ [🔍 Where-Used]  │
├──────────────┼──────────────────────────┼───────────────────┼─────────────────────┼───────────┼──────────────────┤
│ FOR-CONC-009 │ Pellami Sud Import Srl   │ Campania (IT)     │ 🔴 LWG Scad. (-14g) │ 🔴 54/100 │ 🔴 Bloccato Cert.│
│              │ 🐄 Conceria Pellami      │ Tier 2 PMI        │ 🔴 EUDR Mancante    │ Q:68 O:60 │ [🔍 Where-Used]  │
└──────────────┴──────────────────────────┴───────────────────┴─────────────────────┴───────────┴──────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔍 DETTAGLIO 360° & ANALISI WHERE-USED: FOR-CONC-001 — Conceria del Chienti S.p.A. (P.IVA IT01458920431)         │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 📊 VENDOR RATING: 96/100  [Qualità Lotti (40%): 98/100 │ Puntualità OTD (30%): 94/100 │ ESG & Doc (30%): 96/100] │
│ 🛡️ CERTIFICAZIONI ATTIVE: [🟢 LWG Gold #LWG-IT-8841 · Scade tra 280 gg] [🟢 EUDR DDS #EU-2026-991 · +310 gg]     │
│ 🔒 PARAMETRI & LISTINO L6: Lead Time: 14 gg │ MOQ: 300 sqft │ Pagamento: RIBA 60gg │ Vitello Spazzolato: €4,80/pq│
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🔗 IMPATTO FORNITORE SULLA FILIERA (WHERE-USED ANALYSIS LIVE):                                                   │
│   • Modelli Commerciali PIM Collegati (3):   PIM-DUCA-001 (Mocassino Duca), PIM-CORTINA-002, PIM-ROMA-BAG-01     │
│   • Varianti Tecniche PLM Impattate (5):     PLM-DUCA-NERO-01, PLM-DUCA-TESTA-02, PLM-CORTINA-WHT-01 ...         │
│   • Nodi Distinta Base BOM L1/L2/L3 (7):     BOM-L1-TOM-01 (Tomaia Vitello), BOM-L3-PEL-04 (Crosta Rinforzo) ... │
│   • Lotti Conceria Attivi nel Vault (4):     LOT-CHI-2026-01 (4.500 sqft), LOT-CHI-2026-02 (3.200 sqft) ...      │
│   • 💰 Valore Economico Aggregato Impegnato (Segregato L6): € 64.280,00 (38,4% del budget pellami stagionale)    │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Valutazione RICE Score, User Stories e Criteri di Accettazione Verificabili

### 4.1 Matrice di Prioritizzazione RICE Score (Sprint 8 — Epoca II)
Formula standard CPO Footlink: $\text{RICE Score} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort (Person-Weeks)}}$.

| ID Feature | Titolo Funzionalità Verticale | Reach (Utenti/Distretto) | Impact (0.25–3.0) | Confidence (%) | Effort (Settimane-Uomo) | **RICE Score** | Priorità Sprint 8 |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`FEAT-S8-01`** | **Anagrafica Master Colori & Cartelle Stagionali (`HEX`, `Pantone TCX`, `RAL`, Finitura, Famiglia B2C)** | 100% | 3.0 (Massimo) | 100% | 0.8 | **375.0** | **P0 — Critica** |
| **`FEAT-S8-02`** | **Colorway BOM Matrix per Nodo L1/L2/L3 & Workflow Approvazione Tirella / Lab-Dip ($\Delta E$)** | 100% | 3.0 (Massimo) | 95% | 1.0 | **285.0** | **P0 — Critica** |
| **`FEAT-S8-03`** | **Generatore Multi-Variante "1-Click Colorway Explosion" da Cartella Colori Stagionale** | 95% | 3.0 (Massimo) | 95% | 1.0 | **270.8** | **P0 — Critica** |
| **`FEAT-S8-04`** | **Albo Fornitori & Terzisti 360° (Ruoli Filiera, Distretti, Tier 3 a 0 € Perpetuo)** | 100% | 3.0 (Massimo) | 100% | 0.9 | **333.3** | **P0 — Critica** |
| **`FEAT-S8-05`** | **Scadenziario Attivo Certificazioni (LWG/ICEC/EUDR/REACH/DURC) & Vendor Rating 0–100** | 100% | 3.0 (Massimo) | 95% | 0.9 | **316.7** | **P0 — Critica** |
| **`FEAT-S8-06`** | **Listini/Parametri Segregati L6, Guardia Fornitore su BOM/Conceria & Pannello "Where-Used"** | 100% | 3.0 (Massimo) | 95% | 1.0 | **285.0** | **P0 — Critica** |
| **`FEAT-S8-07`** | **Controllo Coerenza Colore Lotto Conceria ↔ BOM & Auto-Mapping E-Commerce (`03 PIM Hub`)** | 90% | 2.5 (Alto) | 95% | 0.7 | **305.4** | **P0 — Critica** |

---

### 4.2 User Stories Verticali per Ruolo di Fabbrica

1. **US-S8-01 (Colorista / Ufficio Stile — Cartella Colori & Lab-Dip):**
   > *"Come **Colorista del Brand**, voglio codificare nella Cartella Colori ogni nuance con codice `COL-*`, nome tecnico, famiglia commerciale e-commerce, swatch `HEX`, codice `Pantone TCX`, `RAL` e tipo di finitura (`spazzolato`, `camoscio`, `vernice`, `galvanico`), e voglio registrare l'approvazione della tirella Lab-Dip ($\Delta E$) su ogni nodo BOM, così da impedire che un articolo vada in produzione con un pellame o una minuteria dal tono errato."*

2. **US-S8-02 (Modellista PLM — 1-Click Colorway Explosion):**
   > *"Come **Modellista Calzaturiero**, una volta ingegnerizzata la distinta base a 3 livelli del prototipo Nero, voglio selezionare 4 nuovi colori dalla Cartella Stagionale FW26/27 e generare in 1 clic le 4 varianti PLM complete di Colorway BOM Matrix applicando la regola 'Tono su Tono con Galvanica Oro' o 'Contrasto Suola Bianca', risparmiando l'85% del tempo di data-entry."*

3. **US-S8-03 (Responsabile Qualità Conceria — Controllo Coerenza Colore Lotto ↔ BOM):**
   > *"Come **Responsabile Qualità Pellami**, voglio che Footlink verifichi automaticamente se il colore del lotto pelle registrato nel Vault Conceria coincide con il colore assegnato al nodo Tomaia/Fodera nella BOM del prodotto, segnalandomi immediatamente eventuali incongruenze cromatiche prima del taglio."*

4. **US-S8-04 (Merchandiser / E-Commerce Manager — Auto-Mapping Colore B2C/B2B):**
   > *"Come **E-Commerce Manager**, voglio che il modulo `03 PIM Hub` traduca automaticamente la denominazione tecnica di fabbrica (es. 'Nero Spazzolato Profondo') nella famiglia colore normalizzata ('Nero / Black') con codice esadecimale `#141414` nei feed Shopify Plus e B2B Showroom, senza dover riclassificare manualmente gli SKU."*

5. **US-S8-05 (Buyer / Ufficio Acquisti — Albo Fornitori 360°, Rating & Where-Used):**
   > *"Come **Responsabile Acquisti**, voglio consultare l'Albo Fornitori e Terzisti con il Vendor Rating 0–100 (40% Qualità, 30% OTD, 30% ESG), i listini riservati L6 e il pannello 'Impatto Fornitore (Where-Used)', così da vedere all'istante tutti i modelli PIM, le varianti PLM, i nodi BOM e i lotti conceria che dipendono da un fornitore e il valore economico totale impegnato."*

6. **US-S8-06 (Compliance & ESG Officer — Scadenziario Certificazioni & Blocco Fornitori Scaduti):**
   > *"Come **Responsabile Sostenibilità & Compliance ESPR**, voglio che lo scadenziario certificazioni (LWG, ICEC, EUDR, REACH, ISO, DURC) calcoli i giorni a scadenza con semaforo visivo e mostri un blocco/alert immediato se un modellista tenta di usare in distinta base o nel Vault un fornitore con certificazioni scadute."*

7. **US-S8-07 (Terzista / Façonista a 0 € — Semplicità Mobile e Segregazione L6):**
   > *"Come **Titolare di Tomaificio Terzista (`Tier 3 — 0 €`)**, voglio continuare ad accedere gratuitamente a Footlink visualizzando chiaramente il colore e la finitura richiesti per la mia lavorazione, mentre il Brand ha la certezza matematica che i listini prezzi, i MOQ e il valore economico Where-Used siano 100% invisibili al mio profilo."*

---

### 4.3 Criteri di Accettazione Verificabili (Acceptance Criteria)

- [ ] **AC-S8-01 (Master Color Registry):** Nel modulo `06 Anagrafiche` (e collegato a `05 Stagioni`) è operativa l'Anagrafica Master Colori con tutti i campi obbligatori (`color_id`, `color_code`, `technical_name_it`, `commercial_family`, `hex_code`, `pantone_tcx_code`, `ral_code`, `finish_type`, `season_ids`, `applicable_categories`), filtri per stagione/finitura/categoria e creazione nuovo colore con anteprima live dello swatch.
- [ ] **AC-S8-02 (Colorway BOM Matrix & Lab-Dip Workflow):** Nel modulo `02 Prodotti (PLM & BOM)` ogni nodo dell'albero BOM a 3 livelli (L1, L2, L3) visualizza e permette di modificare il colore assegnato dalla Cartella Colori (`assigned_color_id`), il valore spettrofotometrico `delta_e_value`, la nota stile e lo stato approvazione tirella (`pending_lab_dip`, `approved_master`, `conditional_waiver`, `rejected_delta_e`), con indicatore percentuale di *Lab-Dip Readiness* sulla variante.
- [ ] **AC-S8-03 (1-Click Colorway Explosion):** È attivo il generatore multi-variante da Cartella Colori che, dato un modello PLM master e $N$ colori selezionati con una regola di abbinamento (`tone_on_tone`, `contrast_white_sole`, `luxury_gold_hardware`, `luxury_palladium_hardware`), genera in automatico le $N$ varianti PLM clonando l'albero BOM a 3 livelli e popolando la Colorway BOM Matrix di ciascun nodo.
- [ ] **AC-S8-04 (Controllo Coerenza Colore Conceria ↔ BOM & Auto-Mapping PIM):** Il modulo `04 Vault Conceria` verifica automaticamente la coerenza tra il colore del lotto pelle e il colore assegnato al nodo BOM collegato segnalando eventuali mismatch; il modulo `03 PIM Hub` espone automaticamente la `commercial_family`, l'`hex_code` e il riferimento `Pantone TCX` derivati dalla Cartella Colori nei dettagli SKU e nei payload di export Shopify/B2B.
- [ ] **AC-S8-05 (Albo Fornitori & Terzisti 360° Unificato):** Nel modulo `06 Anagrafiche` (sincronizzato con `01 District PaaS`) è operativo l'Albo Fornitori e Terzisti con scheda profonda (`vendor_code`, `company_name`, `vat_number`, `supply_chain_role`, `district_area`, `paas_tier` con garanzia **0 € perpetuo per `tier_3_subcontractor_zero_eur`**, `qualification_status`).
- [ ] **AC-S8-06 (Scadenziario Certificazioni & Vendor Rating 0–100):** Ogni fornitore espone lo scadenziario certificazioni (`LWG`, `ICEC`, `EUDR_DDS`, `REACH_SVHC`, `ISO_9001_14001`, `DURC_SOCIAL`) con calcolo automatico dei giorni residui e semaforo (`🟢 Valida`, `🟡 In Scadenza`, `🔴 Scaduta`), nonché il calcolo deterministico del **Vendor Rating (0–100)** ponderato su *Qualità Lotti (40%)*, *Puntualità OTD (30%)* e *Conformità ESG/Documentale (30%)*.
- [ ] **AC-S8-07 (Listini L6, Guardia Fornitore su BOM/Conceria & Pannello Where-Used):**
  1. I parametri operativi e il listino prezzi del fornitore sono visibili ai profili Brand/PMI e **rigorosamente oscurati (`🔒 Segregato L6`)** quando è attivo il profilo Terzista 0 €;
  2. La selezione di un fornitore nei nodi BOM (`02 PLM`) o nei lotti (`04 Vault`) pre-compila paese d'origine, certificazioni e costo base, mostrando un **alert/blocco visivo** se il fornitore ha certificazioni critiche scadute (`blocked_expired_certs`);
  3. Il pannello **"Impatto Fornitore (Where-Used)"** mostra istantaneamente tutti i Modelli PIM, le Varianti PLM, i Nodi BOM L1/L2/L3 e i Lotti Conceria collegati al fornitore, con il valore economico aggregato (segregato L6).

---

*Documento redatto e firmato dal Chief Product Officer (`footlink-cpo`) il 26 Ottobre 2026 per lo Sprint 8 ("La Ripartenza" — Epoca II).*
