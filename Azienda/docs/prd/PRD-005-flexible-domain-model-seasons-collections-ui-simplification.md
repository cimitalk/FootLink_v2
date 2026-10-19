# PRD-005: Specifica Funzionale e Modello di Dominio per Modello Dati Flessibile, Gestione Stagioni & Collezioni, Tabelle Anagrafiche Master PLM/PIM e Semplificazione UI

**Data:** 19 Ottobre 2026  
**Autore:** CPO (`footlink-cpo`)  
**Revisione Tecnica:** CTO (`footlink-cto`)  
**Stato:** Approvato  
**Task di Riferimento:** [`FTL-PROD-005`](../../tasks/FTL-PROD-005.json)  
**Decision Record:** [`ADR-007`](../../adr/ADR-007-flexible-data-model-seasons-collections-domain-registries.md)  

---

## 1. Executive Summary & Obiettivi di Prodotto

Il presente documento definisce le specifiche funzionali e di interazione per l'evoluzione di Footlink nello **Sprint 5**. Sulla base delle direttive del Founder, Footlink introduce quattro pilastri funzionali:
1. **Founder Data Model Studio (Estendibilità dello Schema):** Capacità per il Founder e gli amministratori di configurare dinamicamente campi custom su Articoli PIM, Varianti PLM e Componenti BOM, con riflesso automatico nelle form di inserimento, nelle API e nelle viste di dettaglio.
2. **Semplificazione dell'Interfaccia Utente (UI Decongestione):** Revisione radicale del layout per ridurre il carico cognitivo degli utenti industriali, eliminando ridondanze e organizzando i flussi in modo coerente secondo il ciclo di vita del prodotto.
3. **Gestione Master Anagrafiche di Dominio (PIM & PLM):** Centralizzazione e standardizzazione dei dati tabellari (Fasi di produzione, Tipologie componenti, Fornitori, Laboratori terzisti, Scale taglie, Categorie, Canali, Certificazioni).
4. **Albero Gerarchico Stagioni & Collezioni:** Gestione a calendario tipica della moda (1 Stagione es. *P/E 2026* racchiude *N Collezioni* es. *Main Collection*, *Fashion*, *Capsule*) a cui agganciare tutti i prodotti PIM e le varianti PLM, con filtri globali e dashboard aggregata.

---

## 2. Modello di Dominio & Entità

### 2.1 Gerarchia Stagioni & Collezioni
```text
┌────────────────────────────────────────────────────────┐
│  STAGIONE (Season)                                     │
│  - season_id (PK): e.g. "SEASON-PE26"                  │
│  - code: "PE26" o "P/E 2026"                           │
│  - name: "Primavera Estate 2026"                       │
│  - year: 2026                                          │
│  - status: planning | active | production | archived   │
│  - start_date / end_date                               │
└───────────────────────────┬────────────────────────────┘
                            │ 1 : N
                            ▼
┌────────────────────────────────────────────────────────┐
│  COLLEZIONE (Collection)                               │
│  - collection_id (PK): e.g. "COLL-PE26-MAIN"           │
│  - season_id (FK)                                      │
│  - code: "MAIN-26"                                     │
│  - name: "Main Collection"                             │
│  - target_market: "Global Luxury / B2B Wholesale"      │
│  - status: draft | approved | in_production | closed   │
└───────────────────────────┬────────────────────────────┘
                            │ 1 : N
                            ▼
┌────────────────────────────────────────────────────────┐
│  ARTICOLO COMMERCIALE PIM (PimCommercialItem)          │
│  - pim_item_id, sku_code, model_name                   │
│  - season_id (FK) -> agganciato alla Stagione          │
│  - collection_id (FK) -> agganciato alla Collezione    │
└───────────────────────────┬────────────────────────────┘
                            │ 1 : N
                            ▼
┌────────────────────────────────────────────────────────┐
│  VARIANTI INDUSTRIALI PLM (PlmProductionVariant)       │
│  - plm_variant_id, variant_code, colorway_name         │
│  - ereditano o specializzano la Collezione di appartenenza
└────────────────────────────────────────────────────────┘
```

### 2.2 Studio Modello Dati (Dynamic Schema Attribute Definitions)
Ogni entità di dominio (`pim_item`, `plm_variant`, `bom_item`) supporta un insieme dinamico di attributi configurati nella tabella `schema_attribute_definitions`:
- **field_key:** Chiave tecnica univoca (snake_case, es. `heel_height_mm`, `sustainability_rating`).
- **target_entity:** Entità a cui si applica (`pim_item`, `plm_variant`, `bom_item`).
- **label_it / label_en:** Etichette multilingue per la UI.
- **field_type:** `text`, `number`, `select` (con array di opzioni), `boolean`, `date`.
- **options:** Opzioni predefinite per i tipi `select`.
- **is_required:** Flag di obbligatorietà per la validazione.
- **default_value:** Valore predefinito se omesso.
- **group_name:** Raggruppamento visuale (es. "Specifiche Tecniche", "Sostenibilità", "Commerciale").
- **is_system:** `True` se campo core di sistema non cancellabile, `False` se creato dal Founder.

### 2.3 Tabelle Anagrafiche di Dominio (Domain Registries)
Due macro-aree con entità strutturate in `domain_registries`:
- **Anagrafiche PIM:**
  - `categories`: Categorie merceologiche (Footwear, Leather Goods, Apparel) con codici doganali default.
  - `retail_channels`: Canali distributivi (B2B Showroom, E-Commerce Direct, Wholesale EU, Flagship Boutique).
  - `brand_tenants`: Marchi e licenze industriali gestite.
  - `certifications`: Standard di conformità (LWG Gold, REACH, GRS, OEKO-TEX, FSC).
  - `customs_codes`: Codici doganali TARIC / HS standard.
- **Anagrafiche PLM:**
  - `production_phases`: Fasi industriali (Concia, Taglio, Giunteria, Montaggio, Finissaggio, Controllo Qualità).
  - `component_types`: Componenti della distinta base BOM (Tomaia, Fodera, Sottopiede, Fondo, Tacco, Minuterie).
  - `suppliers`: Fornitori di materie prime con distretto e rating sostenibilità.
  - `subcontractors`: Laboratori terzisti con distretto, fase principale e indicatore costo licenza 0 €.
  - `size_scales`: Scale taglie certificate (35-42 Donna, 39-46 Uomo, IT 44-56 Abbigliamento, Unica).
  - `units_of_measure`: Unità di misura standard (sqft, m2, m, paia, pz, kg).

---

## 3. Interaction Design & Semplificazione UI

### 3.1 Principi di Semplificazione Visiva (Nike-Inspired Editorial Minimalism)
1. **Gerarchia a 6 Macro-Aree Focalizzate:**
   Eliminazione dei tab frammentati e ridondanti. L'applicazione si struttura in 6 percorsi univoci:
   - 📦 **01 Prodotti & Ponte 1:N** — Il cuore operativo del PLM+PIM: selezione prodotto rapida, scheda tecnica essenziale e gestione varianti.
   - 🗓️ **02 Stagioni & Collezioni** — Vista ad albero gerarchico della pianificazione di campionario.
   - 📚 **03 Anagrafiche di Dominio** — Gestione centralizzata dei dati master PIM & PLM con ricerca e filtri.
   - ⚙️ **04 Modello Dati & Campi** — Studio visuale per il Founder per aggiungere o modificare campi dello schema.
   - 🏭 **05 Laboratori Terzisti** — Portale mobile 3-clic a costo 0 EUR per i façonisti.
   - 🌍 **06 Passaporto DPP** — Visualizzatore ESPR e generatore QR SVG per consumatori e dogane.
2. **Filtro Globale di Stagione:** Nella barra di testata, l'utente può selezionare la Stagione di lavoro attiva (es. `Tutte`, `P/E 2026`, `A/I 2026-27`), filtrando istantaneamente i prodotti e le collezioni.
3. **Progressive Disclosure:** Dettagli analitici pesanti (calcolo costing segregato L6, payload JSON grezzi per export multicanale) vengono collocati all'interno di drawer e pannelli espandibili a richiesta anziché occupare lo spazio visivo iniziale.

---

## 4. Requisiti di Accettazione

- [x] L'utente Founder può aggiungere un nuovo attributo (es. `Altezza Tacco mm`) all'entità `Variante PLM`, e vederlo apparire immediatamente nella form di creazione variante e nella scheda di dettaglio.
- [x] La piattaforma include la gestione di Stagioni (es. P/E 2026) e delle relative Collezioni (Main Collection, Fashion, Capsule).
- [x] Ogni nuovo Articolo PIM e Variante PLM può essere associato a una Stagione e Collezione.
- [x] Le anagrafiche di dominio PIM e PLM sono interrogabili, modificabili e utilizzate come fonti per i selettori a discesa.
- [x] L'interfaccia utente rispetta i canoni del Design System v2.0 con zero rumore visivo ed ergonomia ottimizzata per i distretti industriali.
