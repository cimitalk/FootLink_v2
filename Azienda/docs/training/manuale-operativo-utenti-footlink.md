# Manuale Operativo Utente — Piattaforma Footlink PLM + PIM
**Autore:** Ufficio Formazione & Customer Enablement Footlink  
**Versione:** 2.0 (Epoca II)  
**Destinatari:** Modellisti, Tecnici di Produzione, Buyer, Merchandiser, Responsabili Concerie, Fasonisti  

---

## 1. Accesso alla Piattaforma e Guida all'Interfaccia

### 1.1 Navigazione Principale
All'apertura della piattaforma Footlink, l'interfaccia si presenta divisa in tre aree ergonomiche:
1. **Header Superiore (Top Bar):**
   - **Logo & Selettore Moduli:** Consente il salto rapido tra i moduli chiave: *Home Hub*, *Stagioni & Collezioni*, *Modelli & PLM*, *BOM 3 Livelli*, *Color Studio*, *PIM Commerciale*, *Ponte 1:N*, *Fornitori & Terzisti*, *Tannery Vault*, *Ordini di Produzione*, *Passaporto DPP*.
   - **Tasti Formazione Rapida:** Accesso diretto con un clic a **🎓 Training Academy** e **📖 Documentazione Tecnica**.
   - **Selettore Distretto & Tenant:** Permette di cambiare contesto aziendale o visualizzare la vista distrettuale per i brand capofila.
2. **Dashboard Operativa (Center Canvas):**
   - Area dinamica di visualizzazione tabelle, alberi BOM, matrici colori o moduli di dettaglio.
3. **Pannello Contestuale (Drawer / Inspector Laterale):**
   - Mostra dettagli approfonditi dell'elemento selezionato (es. conformità fornitore, dove-usato del materiale, QR code del DPP).

---

## 2. Guida Passo-Passo per Modulo Operativo

### Modulo A: Creazione Stagione e Collezione
1. Navigare su **Stagioni & Collezioni** (`Seasons & Collections Hub`).
2. Cliccare su **Nuova Stagione**:
   - Inserire il codice univoco (es. `FW2026-27` o `SS2027`).
   - Selezionare lo stato iniziale: `Pianificazione` (Planning).
   - Definire le date di inizio sviluppo prototipo, freeze della collezione e inizio consegne ai negozi.
3. All'interno della stagione, cliccare **Crea Collezione**:
   - Es. *Main Collection Uomo*, *Capsule Sneaker Donna*, *Accessori Pelletteria*.
   - Associare il budget target e il responsabile di linea.

### Modulo B: Inserimento del Modello di Stile (Product Model)
1. Accedere a **Modelli di Prodotto** (`Product Models Manager`).
2. Cliccare su **Nuovo Modello**:
   - **Codice Modello:** es. `MOD-SNK-042` (Sneaker Heritage Cupsole).
   - **Nome Stile:** es. *Venezia Runner*.
   - **Forma / Last:** inserire il numero forma di riferimento (es. *Forma 883/E*).
   - **Genere & Categoria:** es. *Uomo / Calzature / Sneaker Bassa*.
   - **Altezza Tacco / Drop:** es. *25 mm / drop 10 mm*.
   - **Scala Taglie:** selezionare *Paris Point 39–46* con passo mezza taglia.
3. Salvare la scheda di modelleria.

### Modulo C: Distinta Base a 3 Livelli (BOM 3-Level Engine)
La distinta base in Footlink riflette la costruzione artigianale della scarpa:

```text
[BOM CALZATURA]
├── LIVELLO 1: TOMAIA (Upper)
│   ├── Pellame Vitello Pieno Fiore (Consumo: 16.5 dm² - Scarto: 18%)
│   ├── Fodera Linguetta Microfibra (Consumo: 2.2 dm²)
│   ├── Puntale Termoplastico 0.8 mm (1 paio)
│   └── Contrafforte Rigenerato di Cuoio (1 paio)
├── LIVELLO 2: FODERA & ACCESSORI (Lining & Trims)
│   ├── Fodera Vitello Naturale Traspirante (Consumo: 14.0 dm²)
│   ├── Imbottitura Collo Schiuma Memory (1 paio)
│   └── Stringhe Cotone Cerato 120 cm (1 paio)
└── LIVELLO 3: FONDO & SUOLA (Sole & Bottom)
    ├── Sottopiede di Montaggio con Cambrione in Acciaio (1 paio)
    ├── Suola Cassetta in Gomma Riciclata 30% (1 paio)
    └── Sottopiede Estraibile con Fusbet Anatomico in Pelle (1 paio)
```

**Procedura di inserimento componenti:**
1. Cliccare sul livello desiderato (+ Aggiungi Componente a Tomaia, Fodera o Fondo).
2. Selezionare il materiale dal catalogo pre-caricato o digitarne uno nuovo.
3. Inserire il **Consumo Netto** e la **Percentuale di Scarto di Tranciatura** (es. $15\%$ per pellami di prima scelta, $22\%$ per pelli con difettosità naturale o pezzature ridotte).
4. Indicare il fornitore abituale:
   - Se il fornitore ha una certificazione LWG valida, compare il semaforo verde 🟢.
   - Se il fornitore ha certificazioni scadute o mancanti, il sistema mostra un warning ambrato 🟡 o rosso 🔴, bloccando l'approvazione per la conformità sostenibile.

### Modulo D: Color Intelligence Studio & Matrice Colorway
1. Aprire **Color Intelligence Studio**.
2. Definire o selezionare i **Master Color** della stagione (es. *Testa di Moro*, *Cognac Vintage*, *Bianco Ghiaccio*, *Blu Notte*).
3. Utilizzare il wizard **Esplosione Colorway**:
   - Selezionare il modello base.
   - Scegliere la combinazione cromatica per i 3 livelli (es. Variante 01: Tomaia Cognac + Fodera Naturale + Fondo Miele; Variante 02: Tomaia Notte + Fodera Grigia + Fondo Nero).
   - Cliccare su **Genera Varianti PLM**: il sistema clona istantaneamente la distinta base aggiornando i codici colore dei singoli componenti in modo coordinato, azzerando le 3 ore di lavoro manuale per variante!

### Modulo E: Gestione del Ponte PIM ↔ PLM (1 : N)
Questo è il cuore dell'integrazione di Footlink:
1. Accedere al modulo **Ponte PIM ↔ PLM**.
2. Nella colonna sinistra (Catalogo PIM), selezionare l'articolo commerciale vendibile (es. `SKU-COM-1002 - Sneaker Venezia Cognac`).
3. Nella colonna destra (Varianti Produttive PLM), trascinare o spuntare le varianti fisiche di produzione:
   - **Variante Principale (Stabilimento Marche):** `PLM-SNK-042-IT` (per ordini boutique e mercato UE).
   - **Variante Secondaria (Stabilimento Porto):** `PLM-SNK-042-PT` (per volumi elevati o mercati overseas).
4. Assegnare le priorità di evasione e le regole di stock unificato. Il canale e-commerce vedrà una sola scheda commerciale con disponibilità aggregata, mentre la produzione gestirà ordini e distinte base distinte.

### Modulo F: Commesse e Subcontractor Mobile Portal (Zero-Cost L6)
1. Accedere a **Ordini di Produzione & Terzisti**.
2. Creare una nuova commessa per un lotto di produzione (es. 500 paia).
3. Assegnare le fasi ai rispettivi laboratori specializzati:
   - *Fase 1: Tranciatura / Taglio* $\rightarrow$ Tranceria Adriatica
   - *Fase 2: Giunteria* $\rightarrow$ Laboratorio Giunteria Picena
   - *Fase 3: Montaggio e Suolatura* $\rightarrow$ Calzaturificio Marchigiano
4. Inviare la commessa: il terzista riceve una notifica con un link monouso sicuro.
5. **Esperienza del Terzista:**
   - Apre la pagina sul proprio smartphone (nessun login complesso richiesto).
   - Visualizza solo i dati della sua fase (segregazione L6: non vede i costi degli altri terzisti né il prezzo di vendita del brand!).
   - Tocca **"Inizia Lavorazione"** quando ritira i bancali di tomaie fustellate.
   - Tocca **"Completato (500/500 paia)"** quando consegna le tomaie giuntate al montaggio.
   - Può allegare foto in caso di anomalie (es. pellame segnato o soletta non conforme).

### Modulo G: Generazione e Stampa del Passaporto Digitale DPP
1. Aprire **Live DPP Generator**.
2. Selezionare l'articolo PIM o la variante PLM completata.
3. Footlink calcola automaticamente:
   - Percentuale di tracciabilità certificata (es. $92\%$ dei componenti tracciati fino alla conceria).
   - Score ambientale sintetico e punteggio di riparabilità della suola.
   - Elenco lotti conciari con medaglia LWG e provenienza (Italia, Europa).
4. Cliccare su **Genera Passaporto DPP Ufficiale**:
   - Viene generato il codice univoco GS1 Digital Link.
   - Viene prodotto il file vettoriale del QR Code per la stampa su cartellino o etichetta interna termosaldata.
   - Cliccando su **Anteprima Consumatore**, è possibile testare l'esperienza visiva del cliente finale da smartphone prima del lancio.

---

## 3. Best Practice Operative e Regole di Qualità

| Situazione | ❌ Cosa NON Fare | ✅ Best Practice Footlink |
|---|---|---|
| **Nuovo colore per un modello esistente** | Creare un nuovo modello di prodotto da zero duplicando i dati tecnici della forma | Aprire il modello esistente ed eseguire l'esplosione colorway in *Color Intelligence Studio* |
| **Doppio stabilimento produttivo** | Creare due articoli diversi nell'e-commerce con nomi e foto duplicati | Mantenere 1 articolo commerciale PIM e collegare 2 varianti PLM tramite il modulo *Ponte 1:N* |
| **Materiale con certificazione scaduta** | Ignorare l'avviso e mandare la commessa in produzione | Contattare il fornitore per caricare il certificato aggiornato nel *Tannery Vault*, oppure sostituire il componente nella distinta base |
| **Aggiornamento avanzamento terzisti** | Telefonare ai 5 laboratori a fine giornata per chiedere quante scarpe hanno montato | Fornire il link mobile ai terzisti per un click istantaneo di avanzamento a costo 0 € |
| **Calcolo dei consumi pellame** | Inserire solo la superficie netta della tomaia senza tolleranza | Impostare sempre la percentuale di scarto di tranciatura in base alla scelta della pelle ($15\%\dots 22\%$) |

---

## 4. Domande Frequenti (FAQ) Operative

**D1: Se modifico la suola su una variante PLM, cambia anche per gli altri colori?**  
*R:* No. Ogni variante PLM possiede una propria istanza di distinta base. Se la modifica riguarda tutti i colori (es. cambio universale del battistrada), è possibile utilizzare la funzione "Propaga Componente a tutte le Colorway" con un clic.

**D2: Il laboratorio terzista deve pagare una licenza per usare Footlink?**  
*R:* Assolutamente no. Il modello Footlink prevede l'accesso a costo zero (0 €) per tutti i terzisti della filiera. Non necessitano di account a pagamento né di installazioni: lavorano tramite Web App mobile con segregazione di sicurezza L6.

**D3: Il QR Code del DPP funziona anche se aggiorno le informazioni sulla scarpa in futuro?**  
*R:* Sì. Il codice QR implementa lo standard GS1 Digital Link dinamico. L'URL indirizza alla scheda digitale persistente nel cloud Footlink: qualsiasi aggiornamento su riparabilità, cura del pellame o certificazioni si riflette istantaneamente alla scansione.
