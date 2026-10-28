# ADR-014: Riorganizzazione Menù a 8 Moduli, Unificazione del Modulo "03 Gestione Fornitori & Filiera" e Sequenza Tab PLM

**Stato:** Approvato (Direttiva Founder FTL-CEO-027)  
**Data:** 28 Ottobre 2026  
**Decisori:** Founder, CEO, CPO, CTO  
**Contesto di Riferimento:** Epoca II ("La Verticalizzazione"), Sprint 8 — Consolidamento Navigazione & Sinergia di Filiera  

---

## 1. Contesto e Motivazione

In data 28 Ottobre 2026, il Founder ha emanato la direttiva strategica ad alta priorità **[`FTL-CEO-027`](../tasks/FTL-CEO-027.json)** volta a ottimizzare l'architettura di navigazione della piattaforma e a eliminare la frammentazione funzionale esistente:

1. **Frammentazione della Filiera e dei Fornitori:**
   - Precedentemente, le entità di filiera erano disperse in tre moduli separati:
     - `01 PaaS Distretto & Utenti` (aziende distrettuali e utenti multi-tenant).
     - `06 Anagrafiche di Dominio` -> `🏭 ALBO FORNITORI & TERZISTI 360°` (anagrafica fornitori, scadenziario certificazioni, rating 40/30/30, where-used e segregazione L6).
     - `04 Vault Conceria & LWG` (lotti di pelle, certificati ambientali LWG/EUDR e documenti con verifica crittografica SHA-256).
   - Questa separazione creava un attrito operativo non necessario per i Brand e i responsabili degli acquisti, che dovevano navigare tra tre moduli distinti per monitorare lo stesso ecosistema di filiera.
   - **Direttiva:** Unificare tutte queste funzioni in un unico modulo centrale: **`03 Gestione Fornitori`**, trasformandolo in un gestionale completo dei fornitori delle filiere, delle aziende aderenti e dei loro utenti.

2. **Gerarchia Manifatturiera PLM (Modello prima del Prodotto):**
   - Nel Modulo Prodotti, i tab operativi non rispecchiavano l'assioma ontologico ratificato in [`ADR-013`](./ADR-013-product-model-construction-vs-product-style-separation.md).
   - **Direttiva:** Spostare `Prodotti (PLM & BOM)` a Modulo **01** della piattaforma e riordinare i tab interni esattamente in:  
     **`Modelli` -> `Prodotti` -> `Distinta base` -> `Colori`**.

3. **Rinumerazione e Streamlining del Menù Principale:**
   - Passare da 9 a 8 moduli operativi principali, razionalizzando la barra di navigazione globale e il Launchpad Home.

---

## 2. Decisioni Architetturali e Operative

### 2.1 La Nuova Architettura a 8 Moduli del Menù Globale

La navigazione primaria dell'applicativo (`NAV_MODULES` in `App.tsx` e `FootlinkHomeHub.tsx`) è riorganizzata come segue:

| Posizione Nuova | Nome Modulo | ID Workspace | Descrizione & Funzionalità | Posizione Precedente |
|:---:|---|---|---|:---:|
| **01** | **Prodotti (PLM & BOM)** | `products` | Modelleria, costruzione forma/CAD, varianti stile, distinte base multilivello L1/L2/L3 e Colorway Matrix | *era 02* |
| **02** | **PIM (Catalogo & Feed)** | `pim_catalog` | Catalogo commerciale omnicanale, articoli SKU, look/bundle aggregati 1:N, listini wholesale/retail e live feed Shopify/B2B | *era 03* |
| **03** | **Gestione Fornitori** | `vendor_management` | **Hub Gestionale Unificato della Filiera:** Albo Fornitori 360°, Aziende & Utenti Distretto PaaS e Vault Tracciabilità Lotti Conceria (LWG/EUDR) | *Unione di 01, 04 e tab Fornitori di 06* |
| **04** | **Stagioni & Collezioni** | `seasons_collections` | Calendario moda, gestione temporale del campionario e gerarchia Stagioni 1:N Collezioni | *era 05* |
| **05** | **Anagrafiche di Dominio** | `domain_registries` | Hub anagrafiche master: categorie merceologiche, codici HS doganali, fasi di lavorazione, tipi componenti BOM e Color Intelligence Studio | *era 06* |
| **06** | **Modello Dati Flessibile** | `schema_studio` | Founder Studio no-code per l'ispezione ed estensione runtime di attributi dinamici su PIM e PLM senza downtime DDL | *era 07* |
| **07** | **Terzisti 0 €** | `subcontractor_portal` | Portale smartphone ultra-leggero per laboratori façonisti: conferma avanzamento fase e lotti materiale in 3 clic a costo licenza 0,00 € perpetuo | *era 08* |
| **08** | **Passaporto DPP** | `dpp_passport` | Generatore del Passaporto Digitale UE conforme al Regolamento 2024/1781 (ESPR) con QR code SVG e vista pubblica vs ispettiva doganale | *era 09* |

### 2.2 Nuovo Componente Unificato: `SupplierManagementHub.tsx`

È stato creato il componente orchestratore [`SupplierManagementHub.tsx`](file:///Users/a.ciminaritodsgroup.com/Projects/FootLink_v2/Applicativo/frontend/src/components/SupplierManagementHub.tsx) che accorpa in un'unica suite con Design System v2.0 (*Luxury Editorial Minimalism*):
1. **Banner Executive con 4 Metric Pills Live:**
   - Totale Fornitori accreditati nell'Albo (con indicazione laboratori Tier 3 a 0 €).
   - Aziende distrettuali aderenti e utenti accreditati.
   - Semaforo di conformità scadenze certificati (LWG, ICEC, EUDR, REACH, ISO, DURC).
   - Lotti conceria tracciati con documenti crittografici SHA-256.
2. **Sub-Navigazione Ergonomica a 3 Macro-Aree:**
   - `🏭 ALBO FORNITORI & TERZISTI 360°`: Anagrafica fornitori, qualifica ESG, rating ponderato 40/30/30, analisi impatto *Where-Used* sulla distinta base BOM, collegamento bidirezionale con aziende distrettuali e segregazione L6.
   - `🏢 AZIENDE & UTENTI DISTRETTO PaaS`: Onboarding guidato per aziende di filiera (Brand Enterprise, PMI, Concerie, Façonisti a 0 €), configurazione multi-tenant, gestione credenziali, ruoli e inviti.
   - `📦 VAULT CONCERIA & TRACCIABILITÀ LOTTI`: Registro lotti di concia collegati alla distinta base, upload file reali PDF/immagini con hash SHA-256, conformità EUDR/ESPR, rating LWG e verifica di coerenza colore.
3. **Retrocompatibilità Totale:**
   - La rotta `vendor_management` gestisce anche i codici legacy `district_paas` e `tannery_vault`, aprendo automaticamente la sotto-scheda corrispondente senza rotture di contratti API o deep link preesistenti.

### 2.3 Riordino Tab Operativi in `PlmProductsManager.tsx`

All'interno del modulo `01 Prodotti (PLM & BOM)`, i tab operativi sono stati riordinati in modo che la definizione della costruzione (Modello) preceda l'espressione stilistica (Prodotto):
1. **`📐 Modelli`**: anagrafica modello di base, codice forma (*last*), costruzione suola, altezza tacco, scala taglie certificata, upload cartamodello CAD 3D e visualizzazione biforcata (Varianti PLM vs SKU PIM).
2. **`📦 Prodotti`**: catalogo varianti PLM, filtri rapidi, ricerca, snapshot lifecycle e visualizzazione compatta.
3. **`🌿 Distinta Base`**: albero ingegnerizzato L1/L2/L3, costing manodopera e materiali L6, sfrido percentuale e sub-tab integrato per Template/Preset BOM.
4. **`🎨 Colori`**: Colorway BOM Matrix, tolleranze spettrofotometriche Lab-Dip ($\Delta E \le 2.5$) e 1-Click Colorway Explosion.

---

## 3. Conseguenze e Vantaggi

- **Eliminazione dei Silos di Filiera:** I responsabili supply-chain e acquisti governano fornitori, aziende distrettuali, credenziali utenti e certificati conceria in un unico pannello integrato.
- **Flusso Logico Naturale:** Il PLM riflette fedelmente il ciclo calzaturiero (*prima la forma e il cartamodello, poi lo stile, poi la distinta base e le varianti colore*).
- **Semplicità di Navigazione:** Il menù principale passa da 9 a 8 moduli senza sacrificare alcuna funzionalità.
- **Integrità Verificata:** 0 errori TypeScript/Vite, 40/40 test Pytest backend superati, pieno rispetto dei presidi di sicurezza e segregazione L6 a costo FinOps 0,00 € (L2).
