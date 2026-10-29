# ADR-020: Standard di Coerenza UX/UI, Eliminazione delle Ridondanze di Navigazione e Istituzione del Presidio di UX/UI Lead

- **Status:** Approvato (Founder Directive)
- **Data:** 29 Ottobre 2026
- **Autori:** C-Suite Footlink (CEO, CGO, CPO, CTO, CMO)
- **Task Collegati:** [`FTL-CEO-039`](../tasks/FTL-CEO-039.json), [`FTL-CEO-037`](../tasks/FTL-CEO-037.json)
- **Riferimenti Normativi:** [Manifesto di Fondazione Footlink](../Manifesto_Fondazione_Footlink.md), [`ADR-006`](./ADR-006-unified-design-system-and-l6-cost-segregation.md), [`ADR-011`](./ADR-011-epoch-2-verticalization-governance-and-modular-depth.md), [`ADR-018`](./ADR-018-atelier-process-streamlining-and-plm-navigation-coordination.md)

---

## 1. Contesto & Segnalazioni del Founder

Durante la revisione visiva di Modulo 02 (Prodotti PLM & BOM), il Founder ha identificato due gravi anomalie di User Experience e Interaction Design (documentate graficamente tramite screenshot annotato):

1. **Segnalazione Rossa (ID 1, 2, 3) — Triplice Sovrapposizione di Navigazione:**
   - **Elemento 1:** Barra di navigazione globale a 8 moduli in testata dell'applicazione.
   - **Elemento 2:** Card "Atelier Stepper" a 6 macro-box orizzontali che replicavano sia i moduli globali (01 Stagioni, 04 Fornitori, 08 DPP), sia le sotto-aree interne del PLM.
   - **Elemento 3:** Barra dei 4 Tab Operativi (`Modelli`, `Prodotti`, `Distinta Base`, `Colori`) posta immediatamente sotto allo stepper.
   - *Verdetto Founder:* Tre livelli di controllo visivamente e funzionalmente sovrapposti, ripetuti per 3 volte, con enorme consumo di spazio verticale (oltre 260px di sole barre) e disorientamento dell'utente.

2. **Segnalazione Viola (ID 1, 2) — Incoerenza di Selezione Modelli vs Sticky Variant Bar:**
   - **Elemento 1:** Sticky Active Variant Context Bar (barra scura di variante con codice variante, PIM master, dropdown di variante e selettore ciclo di vita).
   - **Elemento 2:** Tabellone di gestione `Modelli di Base (Forme & Costruzione)` con lista a sinistra dei modelli censiti (`MDL-FW-LOAFER`, `MDL-FW-SNEAKER`) e scheda tecnica a destra.
   - *Verdetto Founder:* Quando l'utente si trova nel tab `Modelli`, la presenza fluttuante in alto di una barra agganciata ad una singola *variante commerciale/colore* (es. `FTL-LOAFER-01-VIT-NERO Vitello Nero`) genera totale incoerenza e sovraffollamento cognitivo. Se l'utente seleziona il modello `Sneaker`, la barra sopra continua ad indicare il mocassino nero, rompendo la gerarchia semantica Modello (geometria 1) ➔ Prodotti (varianti N).

---

## 2. Decisione Architetturale & Principi di Design System

Il team C-Suite delibera le seguenti tre regole inderogabili di UX/UI per l'intero applicativo Footlink:

### Regola 1: Principio dei 2 Livelli Massimi di Navigazione (Anti-Redundancy Rule)
- È tassativamente vietato impilare più di 2 livelli di navigazione attiva sullo schermo:
  - **Livello 1 (Global):** Barra orizzontale degli 8 moduli core (01 Stagioni, 02 Prodotti, 03 PIM, etc.).
  - **Livello 2 (Local Module Tabs):** Barra integrata dei sotto-tab interni del modulo attivo.
- **Risoluzione Segnalazione Rossa:** Viene eliminato integralmente il box stepper a 6 card giganti (Elemento 2). Il concetto di flusso atelier viene fuso direttamente nei Tab Operativi di Livello 2 (Elemento 3), integrando una sola riga discreta di breadcrumb semantica (`01 Stagioni ➔ 02 Ingegneria PLM ➔ 04 Fornitori ➔ 08 Passaporto DPP`).

### Regola 2: Principio di Isolamento dello Scope Contestuale (Contextual Scope Isolation)
- Una barra di stato/contesto (Sticky Bar) deve appartenere rigorosamente allo stesso scope logico dei dati visualizzati:
  - Nel tab **`📐 1. Modelli di Base`**, l'entità primaria è il **Modello** (Forma, Fondo, Costruzione, Taglie, CAD 3D). La Sticky Bar di *Variante di Prodotto* è **tassativamente nascosta**.
  - Nei tab **`📦 2. Varianti & Stile`**, **`🌿 3. Distinta Base (BOM)`** e **`🎨 4. Colori & Lab-Dip`**, dove l'utente lavora sulla singola variante tecnica/commerciale, la Sticky Variant Bar è attiva ed espone le azioni pertinenti.

### Regola 3: Sincronizzazione della Selezione Modello ➔ Variante
- Quando l'utente seleziona un Modello nella lista di sinistra (`ProductModelsManager`), il sistema pre-sincronizza automaticamente il contesto sulla prima variante di quel modello, garantendo che un eventuale passaggio a `Distinta Base` o `Prodotti` rifletta il modello appena ispezionato.

---

## 3. Istituzione del Ruolo di UX/UI Lead (Design System & Ergonomics Lead)

In accoglimento della raccomandazione del Founder (*"valuta se è il caso di aggiungere al team un Leader di UX/UI per coordinare e governare questi aspetti"*), viene formalizzato il presidio specialistico:

- **Denominazione:** **Lead UX/UI Designer & Ergonomics Officer** (profilato in [`Azienda/docs/roles/Role_UX_Lead_Footlink.md`](../docs/roles/Role_UX_Lead_Footlink.md)).
- **Collocazione Organizzativa:** Riporta congiuntamente al **CPO** (per la coerenza del PRD e delle feature) e al **CMO** (per l'aderenza al Design System `MKT-BRAND-002` Nike Editorial Minimalism).
- **Mandato & Potere di Veto (Design Review Gate):**
  - Nessun componente frontend può essere mergiato su `main` se introduce più di 2 livelli di navigazione visibile.
  - Nessuna informazione di sottolivello (es. variante) può inquinare la vista di un'entità sovraordinata (es. modello base).
  - Obbligo di densità visiva ad alta leggibilità calzaturiera e rispetto dei vincoli touch/mouse ergonomici.

---

## 4. Conseguenze & Impatto

- **Positivi:**
  - Riduzione di oltre 200px di ingombro verticale inutile nella testata di Modulo 02.
  - Eliminazione istantanea del disorientamento tra Modello e Variante.
  - Rispetto rigoroso del principio zero-bloat (`ADR-011`) sia nel layout che nel codice React.
- **Verifiche di Conformità:**
  - Build Vite + TypeScript senza warning né errori.
  - Test Pytest invariati a 46/46 passed (100%).
