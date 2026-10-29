# ADR-016: Rifinitura UX PLM/PIM, Ancoraggio Context Bar e Integrazione Anagrafiche Modelli

- **Stato:** Approvato (Founder Directives FTL-TECH-028, FTL-TECH-029, FTL-CEO-030, FTL-CEO-031, FTL-CEO-032, FTL-CEO-033, FTL-CEO-034)
- **Data:** 2026-10-29
- **Decisori:** Founder, CEO, CTO, CPO
- **Impatto FinOps:** 0,00 € (Livello L2 rispettato, 100% stack open-source locale Antigravity)

---

## 1. Contesto e Motivazione

A valle del rilascio iniziale del Modulo 02 (Prodotti PLM & BOM) con separazione architetturale tra Modelli di Base (Forma & Costruzione) e Prodotti/Varianti (Stile & BOM), il Founder ha identificato tramite il *Portale Founder Control* 7 aree di miglioramento UX e coerenza funzionale:

1. **Banner Invasivo (`FTL-TECH-028`):** Presenza di un banner warning `"REGOLA DI DOMINIO INDEROGABILE..."` ridondante che occupava spazio visivo prezioso.
2. **Ingombro Verticale Card Modello (`FTL-TECH-029`):** Nella colonna sinistra, le card dei modelli richiedevano scroll eccessivo.
3. **Scala Taglie Non Vincolata ad Anagrafica (`FTL-CEO-030`):** La scala taglie certificata del modello era un input di testo libero anziché una selezione vincolata alle anagrafiche certificate di sistema (`domain_registries` -> `size_scales`).
4. **Pulsanti Ridondanti nel Modello (`FTL-CEO-031`):** Nel dettaglio modello convivevano due pulsanti che aprivano la stessa form di creazione variante tecnica.
5. **Colore Variante Non Collegato alla Cartella Colori Master (`FTL-CEO-032`):** In fase di creazione variante PLM, il colore era un input testo privo di aggancio a `MasterColor` e swatch esadecimale.
6. **Disallineamento Modale Creazione Articolo PIM (`FTL-CEO-033`):** Cliccando su *"Nuovo Articolo PIM"* in Modulo 02 si apriva erroneamente la form per creare una variante tecnica PLM, violando la separazione 1 Modello : N Prodotti PIM : N Varianti PLM.
7. **Ancoraggio e Sovrapposizioni della Sticky Context Bar (`FTL-CEO-034`):** La context bar della variante attiva aveva ancoraggio `top-2` finendo per metà sotto l'header globale (`sticky top-0 z-40`), conteneva tab duplicati rispetto alla barra operativa principale e non evidenziava con sufficiente chiarezza il legame tra Modello Base e Variante Attiva.

---

## 2. Decisione Architetturale e Implementativa

### 2.1 Rimozione Banner e Riduzione Verticale Card Modelli (FTL-TECH-028 & FTL-TECH-029)
- Rimosso completamente il banner di warning in `ProductModelsManager.tsx`.
- Riprogettate le card dei modelli nella colonna sinistra con padding compatto (`p-3 rounded-xl`), strip tecnica orizzontale (Forma, Taglie) e badge conteggio PIM/PLM, riducendo l'altezza del ~50%.

### 2.2 Selezione Taglie Certificate da Domain Registries (FTL-CEO-030)
- Integrato `availableSizeScales` in `ProductModelsManager.tsx` che aggrega le scale taglie da `domain_registries` (`registry_name === 'size_scales'`) e i preset certificati `CERTIFIED_SIZE_SCALES`.
- Sostituito l'input testo con `<select>` e badge di anteprima immediata di tutte le taglie incluse nella scala selezionata.

### 2.3 Eliminazione Ridondanza Pulsanti nel Modello (FTL-CEO-031)
- L'header del modello selezionato mantiene unicamente le azioni di anagrafica modello: `✏️ Modifica Modello` e `⬇️ Scarica File CAD`.
- Area 1 (Ingegneria PLM) ospita l'azione dedicata `➕ Nuova Variante PLM`.
- Area 2 (Commerciale PIM) ospita l'azione dedicata `➕ Nuovo Articolo PIM`.

### 2.4 Cartella Colori Master su Nuova Variante PLM (FTL-CEO-032)
- Nel form di creazione nuovo prodotto/variante PLM, il campo colore è collegato a `colors` (`MasterColor`), mostrando swatch visivo, codice colore, famiglia commerciale e Pantone TCX.
- Impostazione automatica di `primary_color_id` e codice esadecimale `hex_code` nella variante creata.

### 2.5 Form Dedicato di Creazione Articolo PIM dal Modello (FTL-CEO-033)
- Realizzato il modale `showCreatePimModal` in `PlmProductsManager.tsx` con campi specifici commerciali (SKU PIM, Nome Commerciale, Prezzi Wholesale/Retail B2B, Stagione, Descrizioni IT/EN).
- Inclusa la sezione di selezione/collegamento delle varianti tecniche PLM già ingegnerizzate per il modello, o creazione della variante di lancio iniziale.

### 2.6 Sticky Active Variant Context Bar Ancorata e Semplificata (FTL-CEO-034)
- Ancoraggio corretto a `sticky top-[73px] z-30` per scorrere esattamente sotto l'header globale fisso (`h-[72px]`) senza tagli né sovrapposizioni.
- Rimossi i 4 tab jumper duplicati (`📐 Modelli`, `📦 Prodotti`, `🌿 Distinta`, `🎨 Colorway`) già presenti nella barra principale dei tab operativi.
- Riorganizzato il blocco informativo con chiara distinzione tra:
  - **📐 Modello Base:** `[Codice Modello] · [Nome] · Forma [Last Code]`
  - **👟 Variante PLM Attiva:** `[Swatch Colore] [Codice Variante] · [Colore] · Scala [Size Range] · [N] componenti BOM`
  - Selettore rapido variante e menu a tendina avanzamento Lifecycle Gate.

---

## 3. Conseguenze e Vantaggi

- **UX Fluida ed Ergonomica:** Niente più scroll chilometrici né elementi coperti dall'header in fase di consultazione BOM.
- **Integrità del Dominio:** Impossibile associare scale taglie arbitrarie; la cartella colori master alimenta direttamente le varianti tecniche.
- **Zero Debito Tecnico e Zero Costi:** Pieno rispetto FinOps L2 (0,00 € spesa aggiuntiva), 100% test passing (42/42 Pytest backend) e compilazione TypeScript frontend pulita (0 errori).
