# 📋 SOP — Procedura Operativa Standard di Chiusura Sprint Footlink

**Codice Identificativo:** `SOP-GOV-003`  
**Autori:** CGO, CEO, Lead UX/UI Designer, CTO  
**Approvatore:** Founder (Livello L1/L4)  
**Data Entrata in Vigore:** 2026-10-29 (Chiusura Sprint 9)  
**Applicabilità:** Obbligatoria al termine di ogni Sprint di sviluppo.

---

## 🎯 Obiettivo
Garantire che al termine di ogni Sprint l'intero ecosistema Footlink (Codice, Governance, Formazione Business, Documentazione Tecnica, Presidio UX/UI e Sito Web Pubblico Ufficiale) sia perfettamente allineato, collaudato e sincronizzato con il Founder Control Center.

---

## 🔄 Checklist Obbligatoria di Chiusura Sprint (7 Fasi)

### Fase 1: Verifica Stato Task & Chiusura Formale (CGO / CEO)
- [ ] Tutti i task pianificati dello sprint in `Azienda/tasks/` devono essere nello stato `"done"`.
- [ ] I criteri di accettazione di ciascun task devono essere verificati e certificati.
- [ ] Il registro `Azienda/tasks/README.md` deve essere aggiornato con stato, date e dipendenze.

### Fase 2: Audit Collaudo & Regression Testing (CTO / CPO)
- [ ] **Backend Test Suite:** Esecuzione di `python3 -m pytest Applicativo/backend/tests` (deve restituire 100% test superati con 0 fallimenti).
- [ ] **Frontend Build Gate:** Esecuzione di `cd Applicativo/frontend && npm run build` (deve completarsi con 0 errori TypeScript/Vite).
- [ ] **FinOps Check:** Verifica rigida del vincolo *Zero Spesa Autonoma* (L2: 0,00 €).

### Fase 3: Aggiornamento Materiali nei 2 Training Portal (CPO / UX Lead)
- [ ] **Training Portal Business (`training_portal.html`):** Aggiornamento dei 6 flussi operativi di business per riflettere le novità introdotte nello sprint (nuove funzionalità, cambi UX, workflow di fabbrica).
- [ ] **Tech Docs Architetturali (`tech_docs.html`):** Aggiornamento delle REST API, schemi JSON, connettori ERP/e-commerce e specifiche di sicurezza multi-tenant L6.

### Fase 4: Aggiornamento e Sincronizzazione Sito Web Pubblico (CMO / Lead UX/UI)
- [ ] **Sito Web Ufficiale (`website/index.html` sia in `Applicativo/website/` che in `Applicativo/frontend/public/website/`):**
  - Aggiornamento badge telemetrico di rilascio con l'ultimo Sprint completato.
  - Allineamento delle metriche di piattaforma, pricing e showcase delle funzionalità.

### Fase 5: Allineamento Founder Control Center (CGO / CTO)
- [ ] Verifica del corretto caricamento di tutti i ruoli esecutivi (incluso il presidio **UX_LEAD**).
- [ ] Verifica dei link rapidi nell'header verso la Piattaforma (:5173), il Sito Web Pubblico, i 2 Training Portal, l'Archivio DAM e le API Docs.
- [ ] Sincronizzazione in tempo reale di task e documentazione prodotta.

### Fase 6: Registrazione Decisioni (ADR) & Report Esecutivo di Chiusura (CEO / CGO)
- [ ] Registrazione di tutti gli ADR dello sprint in `Azienda/adr/` e allineamento del sommario `Azienda/adr/README.md`.
- [ ] Redazione del **Report Ufficiale di Chiusura Sprint** in `Azienda/docs/okr/sprint-[N]-closure-report.md`.
- [ ] Aggiornamento della memoria di sessione in `Azienda/memory/YYYY-MM-DD.md`.

### Fase 7: Commit & Push Versionato su GitHub (CTO)
- [ ] `git add .`
- [ ] `git commit -m "chore(sprint-[N]): official sprint closure, training portals update, website sync and governance audit"`
- [ ] `git push origin main`
- [ ] Verifica dell'integrità del repository remoto.
