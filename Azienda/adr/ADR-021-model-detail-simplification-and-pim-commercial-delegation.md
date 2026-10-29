# ADR-021: Ottimizzazione Scheda Dettaglio Modello, Rimozione Azioni Duplicate e Delega Commerciale PIM a Modulo 03

**Data:** 2026-10-29  
**Stato:** Approvato (Direttiva Founder / Sprint 9)  
**Ruoli Coinvolti:** CEO, Lead UX/UI Designer & Ergonomics Officer, CTO, CPO  
**Task Collegati:** FTL-CEO-040, FTL-CEO-039, ADR-011, ADR-013, ADR-020

---

## Contesto

In seguito alla revisione visiva e funzionale effettuata dal Founder sul Modulo 02 (`Prodotti (PLM & BOM)` -> tab `Modelli di Base`), sono state riscontrate tre significative incongruenze ergonomiche e architetturali nella scheda di dettaglio del modello:

1. **Ridondanza Azioni (Spunto 1):** Il tasto `✏️ Modifica` era presente due volte: su ogni card nella lista a sinistra dei modelli e nuovamente nell'angolo in alto a destra della scheda di dettaglio destra. Questo generava incertezza su dove applicare le modifiche e rischiava click accidentali durante lo scorrimento della lista.
2. **Sovraffollamento a 3 Livelli (Spunto 2):** La scheda modello risultava frammentata su tre livelli disomogenei: (a) Specifiche Tecniche del Modello, (b) Varianti Tecniche PLM collegate, (c) Articoli Commerciali PIM collegati. La presenza di un'ulteriore sotto-barra a 3 tab (`Vista Completa | Varianti PLM | Articoli PIM`) complicava la gerarchia visiva.
3. **Confusione Ontologica tra Ingegneria e Commercializzazione (Spunto 3):** Mostrare e permettere la creazione/sgancio di articoli commerciali PIM (listini, wholesale/retail, canali showroom) all'interno dell'anagrafica ingegneristica della forma/costruzione violava il principio di separazione delle responsabilità tra Modulo 02 (PLM / Fabbrica) e Modulo 03 (PIM / Vendita & Feed).

---

## Decisione

In pieno allineamento tra il Founder, il CEO e il Lead UX/UI Designer & Ergonomics Officer:

1. **Single Source of Action (Header della Scheda Dettaglio):**
   - Rimossi i pulsanti `✏️ Modifica` e `✕` da tutte le card della lista modelli a sinistra.
   - La lista sinistra ha ora il solo scopo di filtro, consultazione e selezione (`Selezionato ●` / `Ispeziona →`).
   - Le azioni primarie sul modello (`✏️ Modifica Modello` e `🗑️ Elimina`) sono centralizzate univocamente nella testata della scheda dettaglio a destra.
2. **Eliminazione del Livello PIM e della Sotto-Barra Tab:**
   - Rimossa la sotto-barra di navigazione a schede che generava una tripla barra innaturale.
   - Rimossa integralmente l'intera `AREA 2 · COMMERCIALE PIM` dalla vista del Modello.
   - La scheda è ora strutturata in **2 soli livelli puliti**:
     - **Livello 1:** Specifiche Tecniche del Modello Base (Last code forma, costruzione suola, altezza tacco, scala taglie di default, riferimento cartamodello/CAD 3D vettoriale).
     - **Livello 2:** Varianti Tecniche PLM di Produzione & Distinte Base (elenco varianti di fabbrica, BOM comp., terzisti, manodopera L6, con navigazione diretta `🌿 BOM →` e `📦 Scheda Tecnica →`).
3. **Delega Commerciale Integrale a Modulo 03 PIM:**
   - La gestione dell'aggancio 1:N tra modelli PLM e articoli commerciali di vendita, i listini prezzi, i canali showroom ed e-commerce risiede esclusivamente nel **Modulo 03 PIM (Catalogo & Feed)**.
   - Inserito un callout elegante a piè di pagina nella vista modello con pulsante diretto `Vai a 03 PIM (Catalogo Commerciale) ↗` per reindirizzare rapidamente l'operatore quando necessario.
4. **Coerenza Semantica nei Badge:**
   - Il badge sulla card del modello a sinistra mostra unicamente `🏭 X Varianti PLM`, eliminando la fuorviante dicitura mista PIM/PLM a livello di forma geometrica.

---

## Conseguenze e Vantaggi

- **Ergonomia e Chiarezza Operativa:** Drastica riduzione del carico cognitivo per i modellisti e gli ingegneri di manovia.
- **Eliminazione Azioni Duplicate:** Azione di modifica collocata nel solo punto naturale di consultazione del dettaglio.
- **Rigorosa Separazione di Dominio:** PLM governa la costruzione e le varianti di fabbrica; PIM governa l'aggregazione commerciale e la monetizzazione.
- **Continuità di Flusso:** Collegamento bidirezionale rapido tra Modulo 02 e Modulo 03 senza appesantire l'interfaccia.
