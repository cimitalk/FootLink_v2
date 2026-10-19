# ADR-009: Sospensione Temporanea Work Orders Hub e Focalizzazione Architetturale su Separazione Area Prodotti PLM, PIM Feed E-Commerce e Vault Conceria

- **Data:** 2026-10-19
- **Stato:** Approvata (Direttiva Esecutiva Founder L1/L2/L3/L4)
- **Proponenti:** Founder, CGO (`footlink-cgo`), CEO (`footlink-ceo`), CTO (`footlink-cto`), CPO (`footlink-cpo`)
- **Approvatore:** Founder (Direttive `FTL-CEO-009`, `FTL-CEO-010`, `FTL-CEO-011`, `FTL-CEO-012`)
- **Task di Riferimento:** [`FTL-CEO-009`](../tasks/FTL-CEO-009.json), [`FTL-CEO-010`](../tasks/FTL-CEO-010.json), [`FTL-CEO-011`](../tasks/FTL-CEO-011.json), [`FTL-CEO-012`](../tasks/FTL-CEO-012.json), [`FTL-GOV-006`](../tasks/FTL-GOV-006.json)
- **Documenti Correlati:** [Manifesto di Fondazione](../Manifesto_Fondazione_Footlink.md), [`ADR-003`](./ADR-003-domain-model-1-to-n-pim-plm.md), [`ADR-007`](./ADR-007-flexible-data-model-seasons-collections-domain-registries.md), [`ADR-008`](./ADR-008-production-orders-tannery-traceability-subcontractor-lifecycle.md)

---

## 1. Contesto & Motivazione

A seguito dell'audit operativo del Founder tramite il **Founder Control Center** in data 19 Ottobre 2026, è emersa l'esigenza strategica di riordinare la roadmap esecutiva della piattaforma, operando un deciso **de-cluttering funzionale** ed eliminando le dispersioni prima del lancio operativo con i Design Partner di distretto.

In particolare:
1. **Sospensione Temporanea del Modulo 02 (Work Orders Hub & Size Matrix - ADR-008):** L'avanzamento esecutivo delle commesse di fabbrica, la pipeline Kanban e la matrice di ripartizione taglie rappresentano un livello di complessità manifatturiera che rischia di rallentare l'adozione se le fondamenta della modellazione prodotto (PLM) e della commercializzazione (PIM) non sono perfettamente rifinite e autonome.
2. **Scorporo e Creazione della Nuova Area "PRODOTTI PLM" (FTL-CEO-009):** La fusione tra anagrafica commerciale e ingegnerizzazione industriale nel modulo *"04 Prodotti & Ponte 1:N"* genera attrito cognitivo. L'ufficio modelleria e l'ingegneria di prodotto necessitano di un'area dedicata dove creare, modificare, disattivare e analizzare i prodotti industriali PLM, gestire le Distinte Base (BOM) multi-livello in modo rapido, navigare griglie dati avanzate ed effettuare export Excel per le schede di reparto.
3. **Revisione e Ridenominazione del Modulo 04 in "PIM" (FTL-CEO-010):** Il modulo deve diventare l'hub commerciale puro. La regola di business fondante viene semplificata: **di default, ogni articolo PIM corrisponde 1:1 all'articolo PLM**. L'aggregazione avanzata (1 PIM commercializza N varianti PLM) diventa una facoltà dell'utente per collezioni complesse. Vengono introdotti l'aggancio diretto a Stagioni e Collezioni, l'esportazione cataloghi e la generazione di **feed multicanale (JSON/CSV)** per alimentare e-commerce e canali esterni.
4. **Revisione del Modulo 03 "Vault Conceria & LWG" (FTL-CEO-012):**
   - Pulizia visuale della label tecnica (`FTL-CEO-006` da sostituire con intestazione commerciale conforme: *"Passaporto Pellami & Tracciabilità Conceria (ESPR & EUDR)"*).
   - Vincolo di integrità BOM: per creare un lotto di conceria deve essere obbligatoria la selezione di un materiale censito in BOM classificato come pelle/pellame.
   - Superamento del payload Base64 a favore del **caricamento reale di file PDF/JPG** archiviati in locale con hash SHA-256.
   - Caricamento massivo dei lotti da file **Excel con template scaricabile a costo zero**.

Tutto questo deve avvenire nel rigoroso rispetto del vincolo **FinOps L2 (Zero Spesa Monetaria Autonoma — 0,00 EUR)** e del vincolo **L6 (Segregazione Dati Industriali Riservati)**.

---

## 2. Decisioni Architetturali

### Decisione 1: Sospensione Temporanea Modulo 02 (Stand-by Work Orders Hub)
- Il **Modulo 02 ("Work Orders Hub & Size Matrix")** viene posto in stato di **sospensione operativa (stand-by)**.
- **Impatto Applicativo:**
  - Il componente non viene rimosso dal repository (la base architetturale in [`ADR-008`](./ADR-008-production-orders-tannery-traceability-subcontractor-lifecycle.md) resta salvaguardata come target futuro), ma viene nascosto dalla barra di navigazione e dal rendering principale della UI (`App.tsx`).
  - L'effort di ingegnerizzazione del team per lo Sprint in corso viene interamente riallocato su: Area Prodotti PLM, Modulo PIM Feed E-Commerce, e Perfezionamento Vault Conceria.

---

### Decisione 2: Architettura Nuova "Area Prodotti PLM" (FTL-CEO-009)
Viene istituita una rotta e un modulo visuale autonomo dedicato all'ingegneria manifatturiera (`PlmProductsManager.tsx`):
1. **Separazione Funzionale:** Gestione esclusiva delle entità `plm_products` e delle relative varianti tecniche.
2. **Ciclo di Vita Prodotto:** Creazione rapida, modifica in-place, duplicazione e disattivazione logica (soft-delete / `is_active: false`).
3. **Gestione Nativa Distinte Base (BOM):**
   - Incorporamento della distinta base multi-livello (L1 Materiali Tomaia/Fodera, L2 Componenti Strutturali/Fondo, L3 Accessori/Minuterie) direttamente all'interno della vista di dettaglio del prodotto PLM.
   - Calcolo automatico dei consumi unitari e costing industriale standard.
4. **Grid Avanzata & Export Excel a Costo Zero:**
   - Tabella interattiva con filtri multi-colonna (stagione, categoria calzatura, forma, tipo costruzione).
   - Generazione di file Excel/CSV lato client o via streaming backend senza dipendenza da licenze commerciali (FinOps L2).

---

### Decisione 3: Riconfigurazione Modulo 04 in "PIM Hub & E-Commerce Feeds" (FTL-CEO-010)
Il Modulo 04 viene ridefinito come il centro di comando commerciale (`PimCatalogManager.tsx`):
1. **Regola di Default Semplificata (1:1 Automatico):**
   - All'approvazione di un prodotto PLM, il sistema genera o sincronizza automaticamente un corrispondente articolo commerciale PIM 1:1, riducendo l'overhead per calzaturifici e PMI.
2. **Aggregazione Opzionale 1:N:**
   - L'utente commerciale mantiene la facoltà di aggregare N varianti PLM (es. diversi pellami o colori industriali) sotto un unico codice PIM padre (Master Commercial Style).
3. **Associazione Gerarchica:**
   - Classificazione obbligatoria per `season_id` e `collection_id` (in accordo ad [`ADR-007`](./ADR-007-flexible-data-model-seasons-collections-domain-registries.md)).
4. **Export Multicanale & Feed E-Commerce:**
   - Endpoint per generare feed esportabili in formato standard:
     * JSON Feed (per integrazione REST con Shopify, Magento, WooCommerce, FARFETCH).
     * CSV/Excel Catalog Export (per showroom, buyer B2B e agenti commerciali).
   - **Vincolo L6 vincolante:** I feed commerciali esportano prezzi retail, wholesale, descrizioni di marketing e composizione materiale; **escludono categoricamente costi industriali di fabbrica, compensi ai façonisti e margini riservati del brand**.

---

### Decisione 4: Perfezionamento Architetturale Modulo 03 "Vault Conceria & LWG" (FTL-CEO-012)
1. **Restyling Label & Naming:**
   - Eliminazione della dicitura tecnica interna *"FTL-CEO-006"*.
   - Nuova intestazione UX: **"Passaporto Pellami & Tracciabilità Conceria (ESPR & EUDR)"**.
2. **Vincolo Referenziale BOM:**
   - La modale di creazione "+ Nuovo Lotto Conceria" impone la selezione vincolante di un codice materiale pelle precedentemente censito nella distinta base (`bom_items` con `category = 'upper_leather' | 'lining_leather'`).
3. **Upload File PDF/Immagini Reali con Hash SHA-256 (Costo Zero L2):**
   - Sostituzione dei payload Base64 con caricamento form-data `multipart/form-data`.
   - Archiviazione su filesystem locale protetto (`uploads/certificates/{tenant_id}/`).
   - Calcolo istantaneo dell'impronta crittografica SHA-256 standard (`hashlib.sha256()`).
4. **Caricamento Massivo Excel Lotti con Template Scaricabile:**
   - Download da interfaccia del file template pre-compilato (`template_lotti_conceria.xlsx` o `.csv`).
   - Parser backend con validazione formale delle righe e rollback in caso di errore di schema.

---

## 3. Matrice dei Rischi e Presidio Gatekeeping L1-L6

| Livello | Ambito Presidiato | Rischio Mitigato | Azione di Governance |
|:---:|---|---|---|
| **L1** | **Coordinamento C-Suite** | Disallineamento tra CTO (sviluppo) e CPO (design UX) | Chiusura formale Modulo 02, emissione direttive di riallineamento e congelamento dipendenze. |
| **L2** | **Vincolo FinOps Zero Spesa (0,00 EUR)** | Costi occulti di storage cloud (S3) o librerie Excel a pagamento | Uso esclusivo di storage locale, parsing nativo Python / client-side JS. Zero canoni SaaS. |
| **L3** | **Architettura Strutturale** | Rottura relazioni DB tra PIM e PLM | Mantenimento della foreign key opzionale `plm_product_id` e defaulting a mapping 1:1. |
| **L4** | **Business & Feeds Commerciali** | Esposizione cataloghi a buyer esterni | Definizione formati standard di interscambio per partner commerciali B2B/E-commerce. |
| **L5** | **Comunicazione & Naming** | Naming confuso per gli utenti ("FTL-CEO-006") | Pulizia UI, adozione di etichette orientate al valore di business e conformità europea. |
| **L6** | **Segregazione Dati Riservati** | Leakage di costi di produzione nei feed e-commerce o export Excel | Serializzatori FastAPI rigorosi: esclusione perimetrale di `unit_cost`, `labor_cost`, mark-up. |

---

## 4. Conseguenze & Vincoli

- **Impatto Positivo:**
  - Drastica semplificazione dell'esperienza d'uso per i calzaturifici: il flusso PLM diventa naturale, immediato e centrato sulle BOM.
  - PIM pronto per l'integrazione omnicanale ed e-commerce moderno.
  - Gestione lotti conceria conforme alla realtà industriale (PDF ufficiali e caricamento massivo da fogli Excel fornitore).
  - Concentrazione massima dell'effort tecnologico senza dispersioni.
- **Vincoli Confermato:**
  - Nessun incremento di costo infrastrutturale (0,00 €).
  - La logica delle commesse di produzione (ADR-008) non è cancellata ma "ibernata" per un successivo sprint di esecuzione di fabbrica.

---

## 5. Approvazione Formale

- **Proposta da:** Chief Governance Officer (`footlink-cgo`)
- **Approvata da:** Founder (Direttive `FTL-CEO-009`, `FTL-CEO-010`, `FTL-CEO-011`, `FTL-CEO-012`)
- **Data:** 19 Ottobre 2026
- **Stato:** Approvata & Esecutiva
