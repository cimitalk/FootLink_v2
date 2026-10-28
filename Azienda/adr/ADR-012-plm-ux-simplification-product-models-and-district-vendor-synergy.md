# ADR-012: Semplificazione UX PLM, Modello Dati "Modelli di Stile" e Sinergia Albo Fornitori con Distretto PaaS

**Stato:** Approvato (Direttive Founder FTL-CEO-020, FTL-CEO-021, FTL-CEO-022)  
**Data:** 28 Ottobre 2026  
**Decisori:** Founder, CEO, CPO, CTO  
**Contesto di Riferimento:** Epoca II ("La Verticalizzazione"), Sprint 8 Post-Collaudo  

---

## 1. Contesto e Motivazione

In data 28 Ottobre 2026, a seguito dell'ispezione della piattaforma e del collaudo E2E dello Sprint 8, il Founder ha inserito tre direttive strategiche ad alta priorità nel Founder Control Center:

1. **FTL-CEO-020 — Semplificazione UX/UI "02 Prodotti (PLM & BOM)":**
   La pagina del Modulo 02 era diventata eccessivamente lunga (oltre 4.000 pixel di scroll verticale), impilando contemporaneamente l'elenco delle varianti, la tabella filtri, la *Colorway BOM Matrix*, la gestione Lab-Dip, i controlli template e la distinta base a 3 livelli. La direttiva impone di riorganizzare l'interfaccia eliminando la confusione senza perdere alcuna funzionalità.
2. **FTL-CEO-021 — Gestione dei Modelli:**
   Nella filiera calzaturiera e pellettiera industriale, il **Modello** (lo stile base, la forma/last, la costruzione fondo, l'altezza tacco, la sagoma CAD) precede logicamente il prodotto commerciale. Nel sistema precedente il modello era un mero attributo testuale del PIM. La direttiva impone la creazione di un'entità autonoma **Modello di Base** capace di agganciare molteplici prodotti/SKU (realizzazioni materiale + colore) e distinte base, consentendo operazioni rapide di inserimento, aggancio e sgancio.
3. **FTL-CEO-022 — Gestione Albo Fornitori & Sinergia Distretto PaaS:**
   L'Albo Fornitori (Modulo 06) e l'Hub Distrettuale Aziende & Rete Operatori (Modulo 01) operavano come silos distinti. Il Founder ha evidenziato l'opportunità di unire le sinergie: collegare un fornitore accreditato nell'Albo ad un'azienda del distretto PaaS, abilitando identità univoca, sincronizzazione anagrafica, rating distrettuale e accesso rapido al Portale Terzisti 0 € con credenziali distrettuali nel rispetto del Presidio L6.

---

## 2. Decisioni Architetturali

### 2.1 Architettura UX a Tab Operativi per il Modulo 02 (PLM & BOM)
- Riorganizzazione interna di `PlmProductsManager` in **5 Tab Operativi**:
  1. `catalogo`: **Varianti & Prodotti PLM** (tabella sintetica, filtri, azioni rapide, lifecycle).
  2. `modelli`: **Gestione Modelli di Base** (anagrafica modelli, forma, costruzione, lista prodotti agganciati).
  3. `colorway`: **Colorway BOM Matrix & Lab-Dip** (matrice colori variante attiva, tolleranze $\Delta E$, 1-Click explosion).
  4. `bom_tree`: **Distinta Base L1/L2/L3 Ingegnerizzata** (albero distinta base, consumi, sfridi, fornitori e costing L6 integrato direttamente nel tab, rimuovendo il doppione a fondo pagina in `App.tsx`).
  5. `presets`: **Template & Preset BOM** (creazione, modifica e applicazione template distinta base).
- **Sticky Active Variant Banner:** Barra contestuale sempre visibile nei tab 2, 3 e 4 che mostra la variante attiva, colore, forma, stato lifecycle e selettore rapido per cambiare variante senza uscire dal flusso.

### 2.2 Entità e Relazione 1:N "Modelli di Stile" -> "Prodotti/SKU"
- Creazione della tabella `product_models` nel database SQLite:
  - Campi: `model_id`, `model_code`, `name`, `category`, `target_gender`, `last_code`, `sole_construction`, `heel_height_mm`, `default_size_range`, `season_id`, `collection_id`, `description`, `cad_drawing_ref`, `is_active`.
- Aggiunta della Foreign Key `model_id` in `pim_commercial_items`.
- Supporto alle operazioni industriali:
  - Creazione e modifica del Modello.
  - Aggancio di uno o più SKU esistenti al Modello (`/api/v1/product-models/{model_id}/attach-product`).
  - Sgancio di uno SKU dal Modello (`/api/v1/product-models/{model_id}/detach-product`).
  - Generazione guidata di un nuovo Prodotto commerciale a partire dal Modello (pre-popolamento automatico di forma, costruzione, range taglie).

### 2.3 Sinergia Bidirezionale Albo Fornitori <-> Hub Distretto PaaS
- Aggiunta della Foreign Key `district_company_id` in `vendors_registry` (`REFERENCES companies(company_id)`).
- Sincronizzazione automatica tramite P.IVA / Ragione Sociale (`POST /api/v1/vendors/auto-link-district`).
- Collegamento manuale con selezione da elenco aziende del distretto (`POST /api/v1/vendors/{vendor_id}/link-district-company`).
- Visualizzazione reciproca dei dati:
  - Nell'Albo Fornitori: badge azienda distrettuale, piano licenza (es. *Subcontractor 0 EUR*), utenti attivi e link al distretto.
  - Nel Modulo 01 PaaS Distretto: badge fornitore accreditato, rating sintetico, stato certificati LWG/EUDR e link all'Albo.

---

## 3. Conseguenze e Vantaggi

- **UX/UI:** La pagina PLM passa da 4.000px di scroll caotico ad un'esperienza fluida a tab tematici, con tempo di orientamento dell'utente ridotto dell'80%.
- **Allineamento al Flusso Industriale:** I modellisti e i product manager operano secondo la reale prassi calzaturiera (prima si definisce il Modello con forma e costruzione, poi si declinano i Prodotti in materiali e colori).
- **Efficienza di Rete:** L'integrazione tra Distretto e Albo Fornitori elimina doppie registrazioni, velocizza l'onboarding dei terzisti a 0 € e rafforza la governance del Presidio L6.
