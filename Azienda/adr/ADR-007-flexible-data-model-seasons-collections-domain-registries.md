# ADR-007: Architettura Modello Dati Dinamico, Gerarchia Stagione/Collezione 1:N, Anagrafiche di Dominio e Streamlining UX

**Data:** 19 Ottobre 2026  
**Stato:** Approvata  
**Proponenti:** CTO (`footlink-cto`) & CPO (`footlink-cpo`)  
**Approvatori:** CGO (`footlink-cgo`) & Founder  
**Task di Riferimento:** [`FTL-GOV-005`](../tasks/FTL-GOV-005.json) & [`FTL-TECH-006`](../tasks/FTL-TECH-006.json)  
**Escalation Level:** L1 (Scelta Architetturale di Dominio e UX Core)  

---

## 1. Contesto & Motivazione

Nei primi 4 sprint di Footlink, il modello di dati era prevalentemente rigido (campi prefissati nei modelli Pydantic/SQLAlchemy) e concentrato sulla relazione cardine `1 PIM Commercial Item ↔ N PLM Production Variants` e sulla distinta base a 3 livelli.

Dall'audit del Founder e dai primi feedback di fabbrica sono emerse 4 esigenze critiche:
1. **Flessibilità dello Schema:** Ogni distretto (es. Fermo per calzature uomo/donna, Riviera del Brenta per calzature lusso donna, Scandicci per pelletteria, Biella per tessuti) richiede attributi tecnici o commerciali specifici (es. altezza tacco mm, finitura bordi, resistenza a trazione, tipo di tintura). Il Founder deve poter definire, estendere e correggere tali campi dinamicamente senza dover alterare manualmente il DDL o rilasciare nuove migrazioni SQL ad ogni esigenza.
2. **Calendario della Moda Reale (Stagioni & Collezioni):** La moda non vive di codici isolati, ma di una gerarchia temporale rigorosa: 1 Stagione (es. *P/E 2026*) racchiude diverse Collezioni (*Main Collection*, *Fashion Runway*, *Capsule / Limited Edition*). Tutti i prodotti PIM e le varianti PLM devono essere governati da questo albero.
3. **Anagrafiche di Dominio Centralizzate:** Categorie, canali, fornitori, fasi di produzione, terzisti façonisti, unità di misura e certificazioni non possono essere stringhe libere nel codice o nei form, ma devono poggiare su tabelle anagrafiche master gestibili in piattaforma.
4. **Ergonomia e Semplificazione UI:** L'interfaccia iniziale accumulava contemporaneamente tab analitici, report di conformità e debug. È necessario convergere verso un minimalismo editoriale orientato ai processi di lavoro.

---

## 2. Decisioni Architetturali

### Decisione 1: Modello Dati Flessibile con Schema Attribute Definitions + Dynamic Payload
- Viene creata la tabella `schema_attribute_definitions` per registrare le definizioni dei campi:
  - `field_key` (slug identificativo univoco)
  - `target_entity` (`pim_item`, `plm_variant`, `bom_item`)
  - `label_it` e `label_en`
  - `field_type` (`text`, `number`, `select`, `boolean`, `date`)
  - `options_json` (opzioni per i campi di tipo `select`)
  - `is_required`, `default_value`, `group_name`, `is_system`
- Nelle tabelle fisiche (`pim_commercial_items`, `plm_production_variants`, `bom_items`), i valori dei campi custom vengono persistiti nel dizionario `metadata_json` (compatibile sia con SQLite che con PostgreSQL `JSONB`).
- I frontend form renderizzano dinamicamente i componenti UI corretti (input testo, numero, dropdown select, checkbox) e sincronizzano i valori con il backend.

### Decisione 2: Gerarchia Rigorosa 1 Stagione ↔ N Collezioni ↔ N Prodotti
- Vengono formalizzate due entità relazionali con vincolo di integrità referenziale:
  - `seasons` (id, codice, nome, anno, stato: *planning*, *active*, *production*, *archived*, date di inizio/fine).
  - `collections` (id, season_id, codice, nome, mercato target, stato: *draft*, *approved*, *in_production*, *closed*).
- L'entità PIM (`pim_commercial_items`) memorizza `season_id` e `collection_id` oltre al codice leggibile, consentendo interrogazioni, filtri globali e report per collezione.

### Decisione 3: Sottosistema Unificato Anagrafiche di Dominio (`domain_registries`)
- Per evitare la proliferazione di tabelle statiche mono-colonna, si adotta una tabella polimorfica indicizzata:
  - `domain_registries`: `id`, `registry_domain` (`pim` o `plm`), `registry_name` (`categories`, `retail_channels`, `suppliers`, `subcontractors`, `production_phases`, `component_types`, `size_scales`, `certifications`), `entry_code`, `label_it`, `label_en`, `metadata_json`, `is_active`, `sort_order`.
- Endpoint unificati `/api/v1/registries/{domain}/{registry_name}` con CRUD completo e cache in-memory lato client.

### Decisione 4: Interaction Design Streamlined & Process-Oriented
- Riorganizzazione dell'App in 6 macro-aree chiare:
  1. **Prodotti & Ponte 1:N** (PIM commerciale e PLM industriale integrati)
  2. **Stagioni & Collezioni** (Struttura gerarchica e calendario lanci)
  3. **Anagrafiche di Dominio** (Gestione master data PIM e PLM)
  4. **Modello Dati & Campi** (Studio di configurazione schema Founder)
  5. **Laboratori Terzisti** (Portale façonisti 0 € e avanzamento fasi)
  6. **Passaporto DPP** (Sintesi ESPR UE e QR code)
- Adozione della *progressive disclosure*: i dati tecnici profondi (costing segregato L6, codici syndication multicanale) sono accessibili tramite drawer e tab contestuali, preservando la pulizia dell'area di lavoro principale.

---

## 3. Conseguenze & Vincoli

- **Retrocompatibilità:** I prodotti creati negli Sprint 1–4 continuano a funzionare grazie al fallback automatico sui campi storici (`season` stringa) e alla migrazione non distruttiva `init_schema()`.
- **Performance & Zero Cost:** La persistenza poggia sulle medesime risorse SQLite / PostgreSQL free-tier (0 EUR/mese), garantendo risposta < 20ms sulle anagrafiche.
- **Autonomia del Founder:** Nuovi attributi o nuove collezioni non richiedono deployment o modifiche di codice.
