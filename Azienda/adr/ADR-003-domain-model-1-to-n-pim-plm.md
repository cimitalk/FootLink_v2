# ADR-003: Modello di Dominio Core `1 Articolo PIM (Vendita) ↔ N Articoli PLM (Produzione)` e Architettura Aggregazione DPP UE

- **Data:** 2026-10-18
- **Stato:** Approvata
- **Proponente:** CPO (`footlink-cpo`)
- **Approvatore richiesto:** CEO (L1 — Decisione tattica cross-team allineata al Manifesto di Fondazione e a `Role_CPO_Footlink.md`)
- **Task di riferimento:** `[FTL-PROD-001](../tasks/FTL-PROD-001.json)`

## Contesto
Nel settore manifatturiero della moda (calzature, pelletteria e abbigliamento), le aziende operano con una netta separazione operativa tra:
1. **La dimensione commerciale e di vendita (PIM — Product Information Management):** dove il prodotto è identificato da un codice articolo/modello commerciale univoco a catalogo (es. uno stivaletto o una borsa in una determinata variante colore), corredato da foto, descrizioni multilingua, prezzi B2B/B2C e Passaporto Digitale del Prodotto (DPP) rivolto al mercato.
2. **La dimensione tecnica, industriale e di filiera (PLM — Product Lifecycle Management):** dove lo stesso prodotto commerciale può essere ingegnerizzato e fabbricato attraverso **molteplici esecuzioni produttive** (es. produzione distribuita su due diversi calzaturifici/pelletterie terziste, utilizzo di pellami o accessori equivalenti di fornitori alternativi in second-sourcing, oppure varianti tecniche tra la prima produzione stagionale e i riassortimenti continuativi/carry-over).

I software tradizionali forzano un legame rigido `1:1` tra articolo tecnico e articolo commerciale (costringendo le aziende a creare falsi duplicati nel catalogo di vendita ogni volta che cambia un fornitore o un terzista) oppure mantengono PLM e PIM su database completamente scollegati (obbligando gli operatori a ricopiare i dati a mano su fogli Excel, perdendo la tracciabilità di lotto necessaria per il regolamento europeo **ESPR — Digital Product Passport**).

Inoltre, dal punto di vista FinOps e di adozione (`Manifesto di Fondazione v1.1`, Sezioni 6 e 7), il modello di dominio deve:
- Permettere l'accesso gratuito (`0 €`) e sicuro ai **laboratori terzisti** sui soli dati tecnici dell'Articolo PLM e del Lotto a loro assegnato, garantendo la totale segregazione dei prezzi commerciali (PIM) e dei costi industriali (Compliance L6);
- Operare con efficienza su database relazionale open-source (**PostgreSQL** su infrastruttura Free-Tier a `0 €/mese`) garantendo un Margine Lordo SaaS prospettico **> 75%**.

## Opzioni Considerate

### Opzione A: Modello Monolitico `1:1` (Unico Codice Articolo condiviso tra Produzione e Vendita)
- **Pro:** Schema database leggermente più semplice in fase iniziale (un'unica tabella `articles` per dati tecnici e commerciali).
- **Contro:** **Viola la realtà operativa dei distretti calzaturieri e pellettieri.** Se una PMI produce 500 paia dello stesso mocassino presso il Terzista A (con tomaia Conceria X) e 500 paia presso il Terzista B (con tomaia Conceria Y), il modello `1:1` obbliga a creare due SKU commerciali distinti sull'e-commerce/B2B oppure a sovrascrivere la distinta base perdendo la tracciabilità storica del lotto per il DPP UE. Viola inoltre il principio architetturale stabilito in `Role_CPO_Footlink.md`.
- **Impatto FinOps / Costi:** 0 € (Free-Tier), ma alto costo nascosto di refactoring futuro (debito tecnico critico).
- **Effort stimato:** S

### Opzione B: Modello Disaccoppiato `N:M` Libero tramite Tabelle di Mapping Manuale
- **Pro:** Massima flessibilità teorica (qualsiasi distinta base può essere collegata a qualsiasi insieme di prodotti commerciali).
- **Contro:** Eccessiva complessità cognitiva e UX per le PMI (viola il principio *PMI-first Thinking*). Rende ambiguo il calcolo automatico del Passaporto Digitale del Prodotto (DPP) e rallenta le query di aggregazione su database free-tier.
- **Impatto FinOps / Costi:** Maggiore consumo di CPU/query su DB per join multipli non gerarchici.
- **Effort stimato:** XL

### Opzione C: Modello Gerarchico Nativo `1 Articolo PIM (Vendita) ↔ N Articoli PLM (Produzione)` con BOM Multi-Livello e DPP di Lotto (Scelta Consigliata)
- **Pro:**
  - Rispecchia fedelmente i processi reali di calzature, pelletteria e abbigliamento: **1 identità commerciale di vendita (`PIM_ARTICLE`) governa N varianti tecniche/industriali di fabbricazione (`PLM_ARTICLE`)**.
  - Permette la **clonazione rapida con override** tra varianti PLM dello stesso articolo PIM (riduzione > 50% del data-entry tecnico).
  - Consente di generare il **Passaporto Digitale del Prodotto (DPP UE)** in modo deterministico: il template pubblico risiede sul PIM (1), mentre i dati di tracciabilità, materiali certificati e terzisti vengono iniettati dinamicamente dallo specifico `PLM_ARTICLE` + `PRODUCTION_LOT` (N).
  - Isola strutturalmente i dati visibili ai terzisti (che accedono solo al sotto-albero `PLM_ARTICLE` / `PRODUCTION_LOT` di propria competenza, a costo `0 €`).
- **Contro:** Richiede una progettazione accurata delle chiavi esterne e delle regole di ereditarietà/versioning della BOM fin dallo Sprint 1.
- **Impatto FinOps / Costi:** **0 € (Free-Tier)** — implementabile al 100% su PostgreSQL standard (tabelle relazionali + `JSONB` per gli attributi merceologici verticali) con latenza query P95 < 50 ms e Cost-to-Serve marginale prossimo allo zero.
- **Effort stimato:** M

## Decisione
Adottiamo l'**Opzione C**: il modello di dominio canonico di Footlink è fondato sulla cardinalità **`1 Articolo PIM (Commerciale/Vendita) ↔ N Articoli PLM (Industriale/Produzione)`**, formalizzata nella specifica [`PRD-001`](../docs/prd/PRD-001-mvp-pim-plm.md).

I vincoli architetturali e funzionali vincolanti per tutti i moduli sono:
1. **`PIM_ARTICLE` (1 — Lato Vendita):** Rappresenta l'entità commerciale univoca (SKU catalogo, attributi marketing, media, prezzi B2B/B2C, stato pubblicazione e template base DPP). Non può esistere in stato pubblicato senza almeno 1 `PLM_ARTICLE` valido associato.
2. **`PLM_ARTICLE` (N — Lato Produzione):** Rappresenta una specifica esecuzione industriale collegata tramite foreign key obbligatoria `pim_article_id` a un singolo `PIM_ARTICLE`. Contiene la Scheda Tecnica verticale (`FOOTWEAR`, `LEATHER_GOODS`, `APPAREL`), il ciclo di vita (`CONCEPT` → `PRODUCTION`), la **Distinta Base (BOM) multi-livello** (`BOM_NODE`) e genera i **Lotti di Produzione (`PRODUCTION_LOT`)** assegnati ai laboratori terzisti.
3. **Aggregazione Nativa DPP UE (ESPR):** Ogni `PRODUCTION_LOT` istanzia un Passaporto Digitale (`DPP_INSTANCE`) che combina gli attributi commerciali del padre `PIM_ARTICLE` con gli effettivi materiali, certificati (`LWG`, `REACH`, `GOTS`, `FSC`) e laboratori terzisti registrati sullo specifico `PLM_ARTICLE` e lotto.
4. **Segregazione Multi-Ruolo per Terzisti a 0 €:** Il ruolo `SUBCONTRACTOR` ha visibilità in lettura/conferma limitata esclusivamente alle entità `PLM_ARTICLE` (esclusi i campi di costo) e `PRODUCTION_LOT` a cui è esplicitamente associato.

## Conseguenze
- **Impatto positivo atteso:**
  - Allineamento totale tra ufficio stile/produzione e ufficio commerciale/e-commerce per PMI e Brand.
  - Conformità nativa ai requisiti europei ESPR / DPP a livello di singolo lotto produttivo.
  - Abilitazione tecnica del modello virale **"Terzisti a 0 €"** (accesso zero-friction limitato ai lotti PLM).
  - Schema database pulito, estensibile a calzature, pelletteria e abbigliamento senza migrazioni distruttive grazie all'uso combinato di colonne relazionali per la struttura `1:N` + `BOM` e `JSONB` validato via Pydantic per gli attributi merceologici specifici.
- **Rischi residui e mitigazioni:**
  - *Rischio:* Disallineamento tra una modifica tardiva sulla BOM di un `PLM_ARTICLE` e le informazioni di composizione mostrate sul `PIM_ARTICLE`.
  - *Mitigazione:* Introduzione di un trigger applicativo che ricalcola automaticamente il `data_quality_score` del `PIM_ARTICLE` e notifica il Brand Manager qualora una variante PLM attiva modifichi la composizione primaria dei materiali (es. cambio da vitello a pelle scamosciata).
- **Task derivati:**
  - [`FTL-TECH-001`](../tasks/FTL-TECH-001.json) (Implementazione schema PostgreSQL e API FastAPI secondo `ADR-003`)
  - [`FTL-REV-001`](../tasks/FTL-REV-001.json) (Strutturazione Pricing di Rete basato sulla separazione Ruolo Terzista PLM 0 € vs Tenant PMI/Brand PIM+PLM)
  - [`FTL-MKT-001`](../tasks/FTL-MKT-001.json) (Posizionamento di mercato e guida DPP UE basati sul ponte 1:N PIM/PLM)

## Approvazione
- **Approvata da:** CEO (`footlink-ceo`) & Founder (per mandato architetturale in `Role_CPO_Footlink.md`) — 2026-10-18
- **Note di approvazione:** Vincolo fondamentale di dominio. Nessun PR o schema database può violare la cardinalità `1 PIM_ARTICLE : N PLM_ARTICLE`.
