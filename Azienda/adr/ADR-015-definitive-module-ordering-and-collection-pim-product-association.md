# ADR-015: Ordine Definitivo Moduli (01 Stagioni, 02 PLM, 03 PIM, 04 Fornitori), Associazione Prodotti PIM alle Collezioni ed Arricchimento Schede

**Stato:** Approvato (Direttive Founder FTL-TECH-027, FTL-PROD-014, FTL-CEO-028)  
**Data:** 28 Ottobre 2026  
**Decisori:** Founder, CEO, CPO, CTO  
**Contesto di Riferimento:** Epoca II ("La Verticalizzazione"), Sprint 8 — Consolidamento Ciclo di Vita Moda, PIM & Filiera  

---

## 1. Contesto e Motivazione

In data 28 Ottobre 2026, il Founder ha emanato tre direttive strategiche e operative prioritarie:

1. **[`FTL-TECH-027`](../tasks/FTL-TECH-027.json) — Ordine Definitivo Moduli:**  
   Il flusso naturale del ciclo di vita calzaturiero e di moda parte dalla definizione delle **Stagioni & Collezioni**, procede con la modellazione industriale e tecnica in **PLM (Prodotti & BOM)**, scende nella commercializzazione ed esportazione omnichannel in **PIM (Catalogo & Feed)**, e si collega alla catena di fornitura in **Gestione Fornitori**.  
   *Direttiva:* Riorganizzare la sequenza primaria del menù in:
   - `01 Stagioni & Collezioni`
   - `02 Prodotti (PLM & BOM)`
   - `03 PIM (Catalogo & Feed)`
   - `04 Gestione Fornitori`
   - `05 Anagrafiche di Dominio`
   - `06 Modello Dati Flessibile`
   - `07 Terzisti 0 €`
   - `08 Passaporto DPP`

2. **[`FTL-PROD-014`](../tasks/FTL-PROD-014.json) — Associazione Prodotti PIM alle Collezioni:**  
   Nel modulo 01 (Stagioni & Collezioni), dopo aver creato una collezione (es. Main Collection, Runway Capsule, Limited Edition), deve essere possibile associare prodotti filtrandoli direttamente dal catalogo PIM, con filtri avanzati per SKU, categoria, genere, orizzonte stagionale e stato di assegnazione, oltre alla possibilità di disassociare/rimuovere i prodotti dalla collezione.

3. **[`FTL-CEO-028`](../tasks/FTL-CEO-028.json) — Sincronizzazione PLM ➔ PIM, Inglobamento 1:N ed Arricchimento Commerciale:**  
   Ogni prodotto creato nel PLM deve essere immediatamente e automaticamente visibile nel PIM. Inoltre, l'utente commerciale deve poter arricchire la scheda PIM (storytelling, copy IT/EN, linea brand, occasione d'uso, tier prezzo, codici GTIN/HS, cura e fine vita). Quando viene composto un prodotto PIM aggregato (bundle/look 1:N), questo "ingloba" al proprio interno le varianti PLM componenti, mantenendo intatta la fonte di verità tecnica.

---

## 2. Decisioni Architetturali e Operative

### 2.1 Architettura della Sequenza dei Moduli (FTL-TECH-027)

La sequenza dei moduli è allineata su tutti i livelli applicativi:
- `Applicativo/frontend/src/types.ts`: Tipo union `ActiveWorkspaceModule`.
- `Applicativo/frontend/src/App.tsx`: Array `NAV_MODULES` e switch delle viste corpo.
- `Applicativo/frontend/src/components/FootlinkHomeHub.tsx`: Array `modules` del Launchpad.
- Banners di modulo:
  - Modulo 01: `MODULO 01 · GESTIONE STAGIONI & COLLEZIONI (FTL-TECH-027)`
  - Modulo 02: `MODULO 02 · PRODOTTI (PLM & BOM) (FTL-TECH-027)`
  - Modulo 03: `03 · PIM (CATALOGO COMMERCIALE & FEED) (FTL-TECH-027)`
  - Modulo 04: `MODULO 04 · GESTIONE FORNITORI & FILIERA 360° (FTL-TECH-027)`

### 2.2 Associazione Prodotti dal PIM alle Collezioni (FTL-PROD-014)

1. **Frontend (`SeasonsCollectionsHub.tsx`):**
   - Aggiunto il pulsante `➕ Associa Prodotti dal PIM` su ciascuna card di collezione.
   - Implementato il modale di associazione multi-criterio con:
     - Ricerca testuale full-text (SKU, modello, descrizione).
     - Filtro per categoria merceologica (Calzature, Pelletteria, Abbigliamento).
     - Filtro per genere target (Uomo, Donna, Unisex, Bambino).
     - Filtro per orizzonte stagionale (Stagione corrente vs Tutte).
     - Switch "Solo non assegnati".
     - Selezione multipla a checkbox e badge visivo per articoli già assegnati.
   - Filtro dinamico dei prodotti per collezione selezionata nella tabella, con pill di stato e pulsante `✕ Rimuovi dalla Collezione` per ciascuna riga.
2. **Backend API (`database.py` & `main.py`):**
   - `POST /api/v1/collections/{collection_id}/products`: Endpoint atomico che riceve `{"pim_item_ids": [...]}` e aggiorna `collection_id`, `collection_name` e la stagione del prodotto via query SQL mirata senza toccare le varianti industriali PLM.
   - `DELETE /api/v1/collections/{collection_id}/products/{pim_item_id}`: Rimuove l'assegnazione alla collezione lasciando intatto l'articolo PIM e la sua variante tecnica PLM.

### 2.3 Sincronizzazione PLM ➔ PIM ed Arricchimento Schede (FTL-CEO-028)

1. **Sincronizzazione Automatica PLM ➔ PIM:**
   - Alla creazione di un prodotto in PLM (`handleCreateProductSubmit`), viene invocato `onCreatePimItem` trasmettendo sia i metadati di catalogo sia `initialVariant` con codice variante, colorway, last code, scala taglie, costruzione e stato di ciclo di vita.
   - Entrambe le entità condividono gli identificatori generati lato client e persistiti su SQLite (`PIM_STORE`), garantendo consistenza tra le viste anche dopo il ricaricamento della pagina.
2. **Arricchimento Scheda PIM:**
   - Nel modulo PIM (`PimCatalogManager.tsx`), ogni card commerciale presenta il badge `⚠ Da arricchire (nuovo dal PLM)` qualora manchino i testi storytelling o il codice GTIN/EAN.
   - Pulsante `✏️ Arricchisci` su ciascuna card: apre il modale dedicato che consente l'editing di copy italiano/inglese, linea brand, occasione d'uso, tier di prezzo, prezzi B2B/Retail, GTIN, HS code e istruzioni circolari, visualizzando in sola lettura le varianti PLM inglobate protette.
   - Backend endpoint: `PATCH /api/v1/pim-items/{pim_item_id}` via schema Pydantic `PimCommercialItemUpdate`.
3. **Inglobamento 1:N in Articoli Aggregati:**
   - La composizione di bundle/look commerciali salva nell'attributo `aggregated_plm_variant_ids` i puntatori alle varianti tecniche selezionate, mostrando nella card commerciale PIM l'elenco dei prodotti PLM inglobati con navigazione rapida a un clic verso la scheda tecnica.

---

## 3. Conseguenze e Conformità

- **Zero Spesa Monetaria (L2):** 0,00 € di spesa esterna o cloud a pagamento.
- **Integrità e Backward Compatibility:** Tutti i 42 test pytest del backend continuano a passare con esito verde (100%).
- **Build Frontend:** Compilazione TypeScript (`tsc --noEmit`) e bundle Vite (`npm run build`) validati con 0 errori.
- **Tracciabilità:** ADR collegato direttamente ai task operativi FTL-TECH-027, FTL-PROD-014 e FTL-CEO-028.
