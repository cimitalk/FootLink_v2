# 🏛️ Direttiva Esecutiva Sprint 5 — Sviluppo Piattaforma Core & Allineamento OKR

**Data:** 19 Ottobre 2026  
**Autore:** CEO (`footlink-ceo`)  
**Destinatari:** C-Suite Footlink (CTO, CPO, CGO, CRO, CMO) & Founder  
**Task di Riferimento:** [`FTL-CEO-005`](../../tasks/FTL-CEO-005.json)  
**Stato:** Approvato  

---

## 1. Visione Esecutiva & Mandato del Founder

Il Founder ha espresso chiaramente la direzione strategica per lo **Sprint 5**: dopo aver consolidato la governance (Sprint 1), il ponte 1:N con la distinta base (Sprint 2), il Design System v2.0 con costing segregato (Sprint 3) e la validazione pilota nei distretti con deploy free-tier (Sprint 4), è il momento di **entrare verticalmente nello sviluppo della piattaforma** per affrontare 4 questioni determinanti per l'adozione industriale:

1. **Gestione del modello dati chiara e flessibile:** il Founder e gli amministratori devono poter integrare, estendere e correggere gli schemi e i campi dati (PIM, PLM, BOM) con riflesso immediato e dinamico sull'interfaccia e sulle API della piattaforma.
2. **Semplificazione radicale della UI:** decongestionare le schermate eliminando il rumore visivo, gli elementi non essenziali al processo e raggruppando i flussi secondo le reali abitudini di lavoro di brand manager, modellisti e responsabili di produzione.
3. **Tabelle anagrafiche di dominio (PLM & PIM):** centralizzare la gestione master di categorie, canali, marchi, certificazioni, codici doganali (PIM) e fasi, materiali, fornitori, terzisti façonisti, scale taglie e unità di misura (PLM).
4. **Gerarchia Stagioni e Collezioni:** strutturare la piattaforma secondo il reale calendario della moda (1 Stagione es. *P/E 2026 - Primavera Estate 2026* che racchiude *N Collezioni* es. *Main collection, Fashion, Limited edition / Capsule*), assicurando che tutti i prodotti PIM e le varianti PLM siano tracciati, interrogati e filtrati in questa logica.

---

## 2. Allineamento con gli OKR Aziendali Q4 2026 – Q1 2027

| Obiettivo Strategico (Objective) | Risultato Chiave (Key Result) | Impatto Sprint 5 |
|---|---|---|
| **O1: Piattaforma PLM+PIM di riferimento per i distretti Made in Italy** | KR 1.1: Tempo di onboard di un nuovo modello < 10 minuti | **UI Semplificata + Anagrafiche centralizzate** riducono l'inserimento manuale del 60%. |
| **O2: Flessibilità e Adattabilità Verticale senza debito tecnico** | KR 2.1: Capacità di supportare calzature, pelletteria e abbigliamento senza modifiche al codice sorgente | **Modello Dati Dinamico** permette al Founder di aggiungere campi specifici in 30 secondi. |
| **O3: Rispetto del Calendario Industriale della Moda** | KR 3.1: Supporto al ciclo multi-stagione e multi-collezione per i marchi partner | **Modulo Stagioni & Collezioni** abilita la pianificazione e il campionario per P/E 2026 e successive. |
| **O4: FinOps Invariante a Costo Zero per i Terzisti** | KR 4.1: Cost-to-serve terzisti a 0 €/mese e margine lordo SaaS > 75% | Le anagrafiche laboratori preservano la gratuità perpetua per i façonisti. |

---

## 3. Mandati Operativi per la C-Suite

### 🎯 CPO (Chief Product Officer) — Priorità Massima (`FTL-PROD-005`)
- Redigere il **PRD-005** dettagliando i flussi utente, le entità di dominio (Season, Collection, DomainRegistry, AttributeDefinition), la validazione formale e l'albero di dipendenze.
- Definire i principi di Interaction Design per la **UI Decongestionata** (stile Nike Editorial Minimalism), riducendo i tab dispersivi a percorsi guidati orientati al processo.

### 💻 CTO (Chief Technology Officer) — Priorità Massima (`FTL-TECH-006`)
- Progettare e implementare l'architettura full-stack:
  - Database DDL (SQLite e PostgreSQL) con tabelle dedicate per stagioni, collezioni, anagrafiche e schema definitions.
  - API RESTful complete in FastAPI con fallback compatibile standard library.
  - Componenti React/TypeScript modulari per la gestione visuale delle 4 aree.
  - Form dinamiche che leggono le definizioni di schema e renderizzano i campi custom in tempo reale.
- Garantire l'esecuzione con esito 100% passante della test suite e conformità ai vincoli free-tier.

### ⚖️ CGO (Chief Governance Officer) (`FTL-GOV-005`)
- Redigere **ADR-007** formalizzando le scelte architetturali sul dynamic schema EAV/JSON e la gerarchia stagioni/collezioni.
- Aggiornare il registro dei task e verificare il rispetto del Manifesto di Fondazione.

### 💰 CRO (Chief Revenue Officer) (`FTL-REV-004`)
- Analizzare l'impatto del modello multi-stagione sul pricing tier per Brand e PMI (upsell su cataloghi storici vs collezioni correnti).
- Confermare l'invarianza del costo zero per le anagrafiche dei façonisti distrettuali.

### 📣 CMO (Chief Marketing Officer) (`FTL-MKT-004`)
- Standardizzare la tassonomia moda e lusso per stagioni e collezioni.
- Ottimizzare il micro-copywriting della UI semplificata per massimizzare la chiarezza visiva ed editoriale.

---

## 4. Presidio Gate L2–L6 e Red Lines

- **L2 (Spesa Monetaria):** Nessuna spesa infrastrutturale. L'implementazione risiede interamente nello stack a costo zero già validato.
- **L6 (Segregazione Industriale):** Gli attributi custom industriali (es. costi di assemblaggio o formule di concia) restano protetti e segregati dal profilo terzista 0 €.

*Approvato per esecuzione immediata.*
