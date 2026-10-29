# 📐 Linee Guida Ergonomiche, Design System & Anti-Ridondanza — Sprint 9

**Autore:** Lead UX/UI Designer & Ergonomics Officer  
**Approvatori:** CEO, CPO, Founder  
**Data:** 2026-10-29  
**Riferimenti:** ADR-011, ADR-013, ADR-020, ADR-021, FTL-CEO-039, FTL-CEO-040

---

## 1. Principi Fondamentali di Usabilità Footlink

### 1.1 Regola dei Massimi Due Livelli di Navigazione (Max-2-Levels Rule)
- In nessuna schermata dell'applicativo possono coesistere più di due livelli di navigazione contemporanei:
  - **Livello 1 (Global Suite Nav):** La barra superiore dei 8 Moduli Footlink (01 Stagioni, 02 PLM, 03 PIM, 04 Fornitori, 05 Anagrafiche, 06 Modello Dati, 07 Terzisti, 08 Passaporto DPP).
  - **Livello 2 (Modulo Operational Nav):** I tab operativi interni al modulo (es. in Modulo 02: `1. Modelli di Base`, `2. Varianti & Stile`, `3. Distinta Base BOM`, `4. Colori & Lab-Dip`).
- **Divieto Assoluto:** È categoricamente vietato inserire un Livello 3 (sotto-barre tab o nested horizontal steppers). Le articolazioni interne devono essere risolte con sezioni semantiche verticali ben titolate o accordion contestuali.

### 1.2 Principio del "Single Source of Action"
- Un'azione primaria di gestione (es. `Modifica Modello`, `Elimina`, `Configura`) deve esistere in **un solo punto naturale** dell'interfaccia.
- Nelle viste Master/Detail (colonna sinistra elenco + colonna destra dettaglio):
  - La card nella colonna di sinistra serve **esclusivamente** a selezionare, filtrare e consultare lo stato sintetico.
  - Le azioni di modifica, eliminazione e gestione anagrafica risiedono tassativamente nella **testata della scheda dettaglio di destra**.

### 1.3 Isolamento dello Scope Contestuale
- Nessun elemento contestuale fluttuante (es. Sticky Bar o Breadcrumb di Variante) deve apparire in sezioni dove il suo contesto non è pertinente.
- Nella gestione dei **Modelli di Base (Forme e Costruzioni)**, la Sticky Variant Bar è disattivata per evitare che l'operatore veda riferimenti a specifiche varianti commerciali mentre lavora sulla geometria pura della sagoma o sul cartamodello.

### 1.4 Separazione Ontologica Fabbrica (PLM) vs Commercio (PIM)
- Modulo 02 governa le specifiche fisiche, la manovia, le distinte base e i costi industriali.
- Modulo 03 governa l'aggregazione commerciale 1:N, i listini prezzi, i canali showroom e i feed digitali.
- La scheda tecnica del Modello non deve mai ospitare form di inserimento prezzi di vendita o gestione listini; tali azioni sono reindirizzate con eleganza a Modulo 03 con pulsante dedicato.

---

## 2. Checklist di Design Review per Nuove Feature
Ogni pull request o modifica visiva deve superare i seguenti 4 punti:
- [ ] La vista rispetta la regola Max-2-Levels?
- [ ] Non esistono pulsanti di azione duplicati fra liste e schede dettaglio?
- [ ] Le sticky bar fluttuanti rispettano l'isolamento dello scope contestuale?
- [ ] I badge di stato utilizzano i colori semantici certificati del Design System (Verde = Produzione/Approvato, Grigio = Bozza/Base, Indaco = Commerciale PIM, Ambra = Attenzione/L2 Lock)?
