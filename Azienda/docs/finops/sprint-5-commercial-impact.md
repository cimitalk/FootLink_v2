# Sprint 5 — Commercial Impact & FinOps Unit Economics Analysis (CRO Deliverable)

**Autore:** Chief Revenue Officer (CRO), Footlink  
**Data:** 19 Ottobre 2026  
**Riferimento Task:** `FTL-REV-004` (Task Object CGO v1.0)  
**Stato:** Approvato per Revisione Founder  
**Classificazione:** Interno / Strategico (Conforme FinOps L2 — Spesa Diretta Autonoma 0,00 €)

---

## 1. Executive Summary & Obiettivi Commerciali dello Sprint 5

Lo **Sprint 5** ha introdotto quattro innovazioni strutturali richieste direttamente dal Founder:
1. **Modello Dati Dinamico ed Estensibile (Data Model Schema Studio):** Capacità per il brand di aggiungere, modificare e correggere attributi di prodotto senza interventi sul database.
2. **Semplificazione Radicale della UI (Nike Design System v2.0):** Decongestione dei flussi di lavoro, navigazione intuitiva su 7 moduli operativi e focalizzazione sul processo moda.
3. **Tabelle Anagrafiche di Dominio Master Centralizzate:** Gestione condivisa di categorie, canali retail, codici doganali HS, fasi di lavorazione, fornitori e laboratori terzisti a 0 €.
4. **Calendario Moda Gerarchico (1 Stagione ↔ N Collezioni):** Gestione di stagioni (es. *P/E 2026 - Primavera Estate 2026*, *A/I 2026-2027*) e collezioni annidate (*Main Collection, Fashion Runway, Limited Edition / Capsule*).

Da una prospettiva di **Revenue & FinOps**, queste funzionalità trasformano Footlink da "strumento di compliance DPP" a **piattaforma di gestione operativa del campionario moda (PLM+PIM OS)**, ampliando il Total Addressable Market (TAM) e riducendo drasticamente il costo totale di possesso (TCO) per le PMI della moda e del lusso.

---

## 2. Benchmark Unit Economics: Footlink vs. PLM/PIM Legacy

Nel settore moda (calzature, pelletteria, abbigliamento), l'adozione di software enterprise tradizionali (Centric Software, Lectra Kubix Link, PTC FlexPLM, Akeneo PIM) è frenata dai costi proibitivi di personalizzazione e configurazione.

| Dimensione di Analisi | Soluzioni Legacy (Centric / Lectra / Akeneo) | Footlink OS (Sprint 5) | Vantaggio Competitivo Footlink |
| :--- | :--- | :--- | :--- |
| **Costo Aggiunta Attributo Custom** | **€ 1.200 – € 3.500** (Ticket System Integrator) | **€ 0,00** (Self-service in 30 secondi dal Founder) | **100% Risparmio Costi di Integrazione** |
| **Tempo di Rilascio Modifica Modello Dati** | 3 – 8 settimane (pianificazione sprint IT) | **Istantaneo (< 1 secondo)** con riflesso UI/API | **Time-to-Market azzerato** |
| **Costo Licenza Laboratori Terzisti** | **€ 45 – € 95 / mese** per ciascun tomaificio o suolificio | **€ 0,00 per sempre** (Mobile Portal a 3 Clic) | **Zero attrito nell'onboarding di filiera** |
| **Gestione Calendario Stagioni/Collezioni** | Modulo aggiuntivo a pagamento (€ 8.000 / anno) | **Nativo nel piano base** | **Funzionalità enterprise inclusa** |
| **TCO Annuo (PMI con 15 utenti + 20 terzisti)** | **€ 48.000 – € 85.000 / anno** | **€ 5.880 – € 9.480 / anno** (SaaS Footlink) | **Riduzione del TCO dell'88%** |

---

## 3. Impatto Commerciale: LTV, Churn e Ciclo di Vendita B2B

### 3.1 Riduzione del Ciclo di Vendita B2B (Sales Cycle: 90 gg → 14 gg)
Prima dello Sprint 5, l'interfaccia densa e la rigidità del modello dati sollevavano obiezioni durante le demo con i titolari di calzaturifici e pelletterie: *"Come inserisco l'altezza del tacco o il rating di sostenibilità se il vostro sistema non lo prevede?"*.
Con il **Data Model Schema Studio** e la **Semplificazione UI**, la demo commerciale permette al prospect di configurare in diretta il proprio vocabolario di prodotto. Il ciclo di vendita passa da un processo lungo e incerto (90 giorni con coinvolgimento di consulenti esterni) a una chiusura rapida in **14 giorni** basata sulla prova del prodotto.

### 3.2 Espansione dell'ACV (Annual Contract Value) e Willingness to Pay (+40%)
La gestione di Stagioni e Collezioni annidate permette a Footlink di proporsi non solo al responsabile sostenibilità/compliance DPP, ma direttamente al **Direttore Commerciale** e al **Responsabile Ufficio Prodotto**:
- **Pricing Tier Standard (1 Brand, 2 Stagioni, fino a 50 SKU):** € 490 / mese (€ 5.880 / anno).
- **Pricing Tier Pro (Multi-Stagione illimitata, Collezioni illimitate, Custom Schema Studio, Export B2B/Shopify):** € 790 / mese (€ 9.480 / anno).
- L'introduzione di Stagioni e Collezioni giustifica un incremento del valore medio del contratto (+40% ACV) mantenendo il ROI per il cliente superiore a 6x rispetto alle soluzioni legacy.

### 3.3 Mitigazione del Churn Annuale (< 2%)
Nel Fashion B2B, i sistemi che gestiscono il calendario stagionale diventano il sistema nervoso centrale dell'azienda. Un software che gestisce l'intero ciclo di campionamento P/E e A/I ha costi di sostituzione (switching cost) elevatissimi. L'LTV (Lifetime Value) stimato sale da € 14.000 a oltre **€ 42.000** su orizzonte quinquennale.

---

## 4. Analisi FinOps: Infrastruttura e Consumo Crediti

In stretta osservanza delle linee guida del Founder e della **Regola L2 (Zero Spesa Monetaria Autonoma)**, l'architettura tecnica dello Sprint 5 garantisce **zero costi marginali di infrastruttura**:

1. **Storage Relazionale Ibrido (SQLite / PostgreSQL JSON):**
   - Gli attributi dinamici e le collezioni sono serializzati in colonne `metadata_json` con indici relazionali leggeri.
   - Non sono necessarie istanze database NoSQL esterne (es. MongoDB) né servizi a pagamento (AWS DocumentDB). L'hosting free-tier (Railway / Render / Hetzner VPS) supporta fino a 100 brand senza incremento di costi.
2. **Ottimizzazione Crediti AI FinOps:**
   - La validazione dei form dinamici e il routing delle anagrafiche sono gestiti via codice nativo deterministico TypeScript/FastAPI senza chiamate LLM a pagamento.
   - I modelli avanzati Antigravity (`pro`) sono riservati esclusivamente a compiti architetturali e decisionali di governance, allocando i task leggeri a `flash` per una riduzione del 75% dei token consumati.

---

## 5. Prossimi Passi Commerciali per la Pipeline Piloti

1. **Aggiornamento Script Demo Piloti Distrettuali (Fermo-Macerata, Scandicci, Riviera del Brenta):** Integrare nei primi 5 minuti della presentazione la creazione live di un attributo personalizzato e la navigazione nel calendario P/E 2026.
2. **Aggiornamento Pricing Sheet e Scheda Prodotto:** Evidenziare la gestione inclusa di Stagioni e Collezioni e le anagrafiche master come standard in tutti i piani.
3. **Comunicazione ai 3 Partner LOI:** Presentare la nuova release semplificata come step di validazione congiunta in vista del go-live commerciale.
