# ADR-018: Semplificazione del Flusso d'Atelier, Stepper di Modelleria & Distinta Base e Dismissione Legacy Workspace

- **Data di Delibera:** 2026-10-29
- **Stato:** Approvato (C-Suite Consensus in risposta alle Direttive Founder `FTL-CEO-036` e `FTL-CEO-037`)
- **Autori:** CGO, CEO, CPO, CTO, CRO, CMO
- **Ambito:** Governance Architetturale, Ergonomia Modulo 02 (PLM & BOM), Navigazione di Processo, Pulizia Legacy

---

## 1. Contesto & Diagnosi

### 1.1. Direttiva Founder FTL-CEO-036: Decontestualizzazione "Apri Workspace Integrato Completo →"
Il Founder ha segnalato che il pulsante *"Apri Workspace Integrato Completo →"* presente nell'hero banner della Home Launchpad conduceva a una schermata (`activeModule === "all"` contenente il legacy `PimToPlmBridge`) disallineata con la navigazione a 8 moduli approvata con l'Epoca II (`ADR-011`, `ADR-014`, `ADR-015`).
- **Valutazione:** Tale schermata monolitica era un residuo architetturale degli Sprint 2–3, oggi superato dalla separazione netta tra Modulo 01 (Stagioni), Modulo 02 (Prodotti PLM & BOM) e Modulo 03 (PIM). 
- **Decisione:** Eliminazione del link ambiguo e reindirizzamento chiaro verso la fase iniziale del flusso industriale (`01 Stagioni & Collezioni`), con completa dismissione del rendering legacy in `App.tsx`.

### 1.2. Direttiva Founder FTL-CEO-037: Mancanza di Intuitività e Frammentazione in 6 Zone del Modulo 02
Il Founder ha evidenziato che la pagina `02 Prodotti (PLM & BOM)` presenta 6 zone funzionali eterogenee e apparentemente poco coordinate (Top Header con 5 bottoni sparsi, KPI strip, 4 Tab operativi, Sticky Context Bar, contenuti dei tab con filtri e drawer nidificati). Questa frammentazione complica la navigazione per l'Ufficio Modelleria e Prodotto.
Il Founder ha contestualmente tracciato il **miglior flusso logico organizzativo di fabbrica**:
1. Apertura nuova Stagione e creazione Collezioni;
2. Definizione dei Modelli (Forma, Costruzione, Scala Taglie);
3. Definizione delle Varianti per ogni modello (Colore Master, SKU);
4. Definizione delle BOM di ogni variante (con copia da modello/template);
5. Assegnazione materiali e fasi di lavorazione ai fornitori/façonisti;
6. Gestione fornitori e tracciabilità di filiera.

---

## 2. Decisione Architetturale

### 2.1. Introduzione dell'Atelier Process Stepper
Viene introdotta in cima al Modulo 02 una barra di navigazione di processo a 6 passi (**Atelier Process Stepper**), visibile e interattiva:
- **Passo 1 (Stagione):** Mostra la stagione attiva e permette il salto diretto a `01 Stagioni & Collezioni`.
- **Passo 2 (Modello):** Collega alla gestione Forme & Costruzioni (Tab `Modelli`).
- **Passo 3 (Varianti):** Collega alla definizione dello stile e dei colori (Tab `Prodotti`).
- **Passo 4 (BOM):** Collega alla distinta base a 3 livelli della variante attiva (Tab `Distinta Base`).
- **Passo 5 (Fornitori):** Collega all'albo fornitori e ai terzisti per le fasi di lavorazione (`04 Gestione Fornitori`).
- **Passo 6 (Tracciabilità/DPP):** Collega al Vault e al Passaporto Digitale (`08 Passaporto DPP`).

Lo stepper evidenzia lo step attivo, indica se il passo precedente è completato e offre un pulsante per avanzare alla fase successiva con un solo clic.

### 2.2. Coordinamento e Semplificazione delle 6 Zone di Modulo 02
1. **Raggruppamento Intuitivo della Testata:** 
   - Le azioni primarie di creazione (`+ Nuovo Modello`, `+ Nuova Variante PLM`) sono distinte dagli strumenti analitici e di importazione (`Import/Export CSV/Excel`, `Cartella Colori Master`, `1-Click Colorway Explosion`).
2. **Fluidità Inter-Fase (Ponti Diretti):**
   - Dal Tab `Modelli`: ogni card modello espone l'azione diretta *"➕ Crea Variante per questo Modello"*, che sposta automaticamente l'utente nel Tab `Prodotti` con il modello pre-selezionato.
   - Dal Tab `Prodotti`: ogni riga della tabella include l'azione *"🌿 Apri Distinta Base (BOM)"*, che seleziona la variante e apre all'istante l'albero BOM.
   - Dal Tab `Distinta Base`: un banner esplicita la relazione di derivazione (*"Variante [X] derivata da Modello [Y] su Forma [Z]"*), con il pulsante rapido per applicare il template BOM del modello.
3. **Eliminazione Definitiva del Legacy Monolith (`activeModule === "all"`):**
   - Rimozione di qualsiasi rinvio al vecchio monolite `PimToPlmBridge` e standardizzazione assoluta sulla pipeline a 8 moduli.

---

## 3. Conseguenze & Impatti

- **Usabilità & Zero-Training:** Il modellista e il responsabile prodotto non devono memorizzare la mappa mentale dell'applicazione: il flusso a 6 passi guida le operazioni dall'ideazione della collezione fino all'assegnazione delle fasi ai laboratori.
- **Coerenza di Dominio:** Risolto il disallineamento evidenziato dal Founder in `FTL-CEO-036`. La Home Launchpad ora guida coerentemente verso `01 Stagioni` oppure verso i moduli specifici.
- **FinOps & Riservatezza L6:** Invariata la rigorosa protezione L6 (nessun dato economico esposto a terzisti o consumatori).
