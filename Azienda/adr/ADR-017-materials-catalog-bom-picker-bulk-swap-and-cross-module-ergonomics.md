# ADR-017: Architettura dell'Anagrafica Materiali di Filiera, Selezione Guidata nella Distinta Base (BOM), Bulk Material Swap e Navigazione Contestuale Cross-Modulo

- **Stato:** Approvato (Founder Directive Sprint 9 - 2026-10-29)
- **Data:** 2026-10-29
- **Decisori:** Founder, CEO, CGO, CTO, CPO, CRO, CMO
- **Impatto FinOps:** 0,00 € (Livello L2 rispettato, 100% stack open-source locale Antigravity, no costi cloud)

---

## 1. Contesto e Motivazione

In seguito alla chiusura formale dello Sprint 8 ("La Ripartenza"), che ha introdotto i due motori verticali della *Gestione Colori Intelligente* e dell'*Albo Fornitori & Terzisti 360°*, il Founder ha aperto lo **Sprint 9** con la seguente direttiva strategica:
> *"Focus su usabilità, coerenza e flessibilità delle funzionalità implementate finora."*

Inoltre, il backlog presentava la direttiva `FTL-CEO-029` ("Gestione e catalogazione Materiali"), in cui si richiedeva che i materiali (pellami, fodere, tessuti, accessori metallici, fondi, bottoni, cerniere, fili, scatole) fossero codificati in anagrafica e collegati a un'azienda fornitore prima di essere aggiunti in distinta base.

L'analisi congiunta della C-Suite ha evidenziato tre criticità primarie da risolvere:
1. **Coerenza Dati (BOM & Fornitori):** Nella Distinta Base (BOM), i materiali sono attualmente inseriti come testo libero (`material_name`), generando duplicazioni, disallineamenti di prezzo e perdita del legame con il fornitore e le certificazioni ambientali (LWG, EUDR, REACH).
2. **Usabilità & Flussi Operativi (Zero-Training & Ergonomia):** Navigare tra collezioni, schede tecniche PLM, catalogo PIM e anagrafica fornitori richiede passaggi manuali e ripetute ricerche, senza scorciatoie contestuali dirette (*Contextual Jumps*).
3. **Flessibilità Industriale:** In caso di ritardi di consegna o cambi fornitore, sostituire un materiale su tutte le varianti colore di un modello richiede l'aggiornamento manuale nodo per nodo, anziché uno strumento di sostituzione massiva (*Bulk Swap*). Manca inoltre una vista unificata e flessibile del *Costing Industriale* che sommi materiali, manodopera terzista a 0 € e overhead.

---

## 2. Decisioni Architetturali e di Governance

### 2.1 Regola Anti-Bloat dell'Epoca II (`ADR-011`): Nessun Modulo Orizzontale Separato
Invece di creare un Modulo 09 isolato che frammenterebbe la navigazione, la gestione materiali viene **verticalizzata a doppio innesto**:
- **Modulo 04 "Gestione Fornitori & Filiera":** ospita il sotto-tab dedicato **"Catalogo Materiali di Filiera"** (`MaterialsCatalogManager`), dove ogni fornitore qualificato espone i propri materiali codificati con scheda tecnica, tipologia, unità di misura, costi standard e certificazioni collegate.
- **Modulo 02 "Prodotti (PLM & BOM)":** l'aggiunta o modifica di un componente BOM integra un **BOM Material Picker guidato** con autocomplete e filtri per categoria merceologica, fornitore e certificazione, popolando istantaneamente i campi della riga di distinta.

### 2.2 Modello Dati Relazionale `Material` (Backend & DB)
Viene introdotta la tabella relazionale `materials_catalog` con:
- `material_id`: identificativo univoco (es. `MAT-PEL-001`, `MAT-FND-002`);
- `material_code`: codice articolo del fornitore;
- `name`: nome commerciale / tecnico del materiale;
- `category`: categoria merceologica certificata (`leather`, `lining`, `fabric`, `sole_bottom`, `heel`, `hardware`, `thread`, `packaging`, `other`);
- `vendor_id`: FK verso `vendors_registry` (fornitore primario qualificato);
- `unit_of_measure`: `dm2`, `m`, `kg`, `pz`, `paia`;
- `standard_cost`: costo unitario di listino (segregato L6);
- `lwg_certified` / `certifications`: array di certificazioni documentali;
- `is_active`: flag di disponibilità.

Nella tabella `bom_items` viene valorizzato `material_id` opzionale per garantire retrocompatibilità con i componenti storici esistenti.

### 2.3 Bulk Material Swap & Cascading Update
Endpoint REST dedicato `POST /api/v1/plm-variants/{id}/bom/bulk-swap` (e corrispettivo a livello di modello) per sostituire un materiale sorgente con un materiale di destinazione su tutte o su un sottoinsieme selezionato di varianti PLM, preservando la coerenza delle colorway.

### 2.4 Navigazione Contestuale Cross-Modulo (*Contextual Jumps*)
Implementazione di deep link bidirezionali:
- Da Collezione (Mod. 01) $\rightarrow$ *Visualizza in PLM* (Mod. 02);
- Da PIM (Mod. 03) $\rightarrow$ *Visualizza Scheda Industriale PLM* (Mod. 02);
- Da riga BOM (Mod. 02) $\rightarrow$ *Visualizza Fornitore / Certificazioni* (Mod. 04);
- Da Fornitore (Mod. 04) $\rightarrow$ *Visualizza Dove-Usato (Where-Used) BOM*.

### 2.5 Simulatore Dinamico di Costing Industriale & Segregazione L6
Nel Modulo 02 viene affiancato alla distinta base il pannello di **Costing Industriale Dinamico**:
- Somma Costi Materiali + Somma Lavorazioni Esterne (Façonisti a 0 €) + Percentuale Incidenza Struttura = Costo Primo Industriale.
- Simulazione flessibile dei margini commerciali rispetto a Prezzo Wholesale e Prezzo Retail.
- Rigorosa segregazione L6: questi dati sono visibili solo agli utenti Brand/PMI e risultano inaccessibili per Terzisti (Mod. 07) e Consumatori DPP (Mod. 08).

### 2.6 De-monolitizzazione Frontend di `App.tsx`
Estraendo custom hook o sottomoduli per i materiali e il PLM, riducendo le dimensioni di `App.tsx` e preservando una reattività <16ms (60fps) dell'interfaccia.

---

## 3. Conseguenze e Vantaggi

- **Coerenza:** Eliminati i testi liberi incoerenti nella distinta base; ogni materiale è tracciato alla sorgente con fornitore e certificazione.
- **Usabilità:** Riduzione del 60% dei clic nel data-entry della BOM e passaggi immediati tra moduli tramite i Contextual Jumps.
- **Flessibilità:** Possibilità di sostituire materiali in massa in 1 clic e simulare scenari di costing/margini industriali in tempo reale.
- **FinOps:** Nessun costo cloud aggiuntivo; stack 100% free-tier e locale su Google Antigravity.
