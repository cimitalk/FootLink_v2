# Role Specification: Lead UX/UI Designer & Ergonomics Officer (v1.0)

**Codice Ruolo:** `UX-LEAD`  
**Dipartimento:** Product Design & Brand Experience  
**Riporta a:** Chief Product Officer (CPO) & Chief Marketing Officer (CMO)  
**Fonte di Verità:** [Manifesto di Fondazione](../../Manifesto_Fondazione_Footlink.md) & [`ADR-020`](../../adr/ADR-020-ux-ui-anti-redundancy-standards-and-design-lead-mandate.md)

---

## 1. Missione del Ruolo

Il **Lead UX/UI Designer & Ergonomics Officer** garantisce che Footlink mantenga un'esperienza utente impeccabile, fluida, priva di ridondanze visive e tarata sui ritmi operativi reali dell'atelier calzaturiero marchigiano/veneto e dei brand del lusso.

Il suo compito fondamentale è fare da **custode del Design System** (`MKT-BRAND-002` Nike Editorial Minimalism) e governare la navigazione applicativa, evitando rigorosamente che proliferino barre di controllo sovrapposte, stepper duplicativi o elementi fluttuanti disallineati rispetto al contesto di lavoro.

---

## 2. Principi Inderogabili di Design (Design Dogmas)

1. **Massimo 2 Livelli di Navigazione (Anti-Stacking Rule):**
   - *Livello 1:* Navigazione Globale dei Moduli Core (01 Stagioni, 02 PLM, 03 PIM, etc.).
   - *Livello 2:* Barra integrata dei sotto-tab funzionali del modulo attivo.
   - *Divieto:* Nessun terzo livello fluttuante, box stepper intermedi o duplicazioni orizzontali di tab già presenti.
2. **Isolamento dello Scope Contestuale (Contextual Scope Isolation):**
   - Una barra contestuale o un selettore non può mai mostrare informazioni di entità figlie/sottostanti quando si sta operando su entità maestre (es. nessuna sticky bar di Variante/Colore mentre si ispeziona l'anagrafica Forma/Modello).
3. **Regola dei "Zero Clic Inutili" & Densità Industriale:**
   - Massima leggibilità, font monospaziati per codici tecnici, contrasti elevati per l'uso in reparto manovia/laboratorio, e transizioni di stato chiare senza flash cognitivi.

---

## 3. Responsabilità & Compiti Chiave

- **Audit di Usabilità Continuo:** Revisione periodica di tutti gli 8 moduli per scovare ridondanze visive, bottoni duplicati o incongruenze terminologiche.
- **Design Review Gate:** Potere di veto formale sulle PR frontend che violano i principi di navigazione a 2 livelli o introducono incoerenze contestuali.
- **Micro-Interazioni Ergonomiche:** Ottimizzazione di drawer, dropdown, feedback visivi e stati vuoti guidati.
- **Coordinamento con CPO e CTO:** Traduzione delle specifiche di prodotto (PRD) in componenti visivi armoniosi e collaborativi con gli ingegneri React.
