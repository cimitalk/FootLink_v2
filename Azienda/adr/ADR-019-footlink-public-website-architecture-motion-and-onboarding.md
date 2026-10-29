# ADR-019: Architettura del Sito Web Pubblico Ufficiale, Motori di Computer Motion Vettoriale e Funnel di Onboarding Distrettuale

- **Data di Delibera:** 2026-10-29
- **Stato:** Approvato (C-Suite Consensus in risposta alla Direttiva Founder *Sprint 9 - Sito Web*)
- **Autori:** CTO, CMO, CPO, CRO, CGO, CEO
- **Ambito:** Sito Web Istituzionale e Commerciale, Computer Motion Canvas, Spaccato Tecnico 3D BOM, Funnel Lead Generation & Pricing

---

## 1. Contesto & Obiettivi Strategici

Il Founder ha formalizzato la direttiva per la creazione, il coordinamento e la gestione del **Sito Web Pubblico Ufficiale di Footlink** (`Applicativo/website/`), con i seguenti obiettivi cardine:
1. **Divulgazione della Piattaforma:** Presentazione autorevole del valore differenziante di Footlink nel panorama PLM+PIM (dominio ontologico `1 PIM ↔ N PLM`, Distinta Base gerarchica a 3 livelli, Vault Conceria LWG crittografico SHA-256 e Passaporto Digitale del Prodotto conforme a Regolamento UE ESPR 2024/1781 ed EUDR).
2. **Pricing Trasparente & FinOps (ADR-004):** Esposizione chiara dei 3 livelli di prezzo:
   - **Terzisti & Laboratori di Filiera:** **0,00 € Perpetuo** (fattore virale di rete).
   - **PMI Manifatturiere (Pro Growth):** **€ 149/mese** (€ 119/mese annuo con -20% sconto).
   - **Fashion Brand & Grandi Gruppi:** **Enterprise su misura**.
   - **Calcolatore ROI Interattivo:** Simulatore istantaneo dei risparmi di tempo ed economici rispetto ai vecchi PLM con licenze terzisti a pagamento.
3. **Funnel di Conversione ("Iscriviti", "Richiedi Demo", "Contact Us"):** Form interattivi e modali reattivi con selezione profilo di filiera, convalida client-side e feedback visivo.
4. **Grafica Accattivante & Asset DAM:** Piena integrazione dei token visivi e delle risorse della suite DAM realizzata nello Sprint 7 (`#0A0A0A`, `#141414`, accenti neon `#00FF87` ed `#FF3366`, typography Google Fonts Barlow Condensed, Inter, JetBrains Mono, logo SVG ufficiale).
5. **Computer Motion Vettoriale Avanzato:** Implementazione in puro codice JavaScript matematico senza dipendenze pesanti di terze parti, garantendo 60 FPS stabili, massima leggerezza e portabilità assoluta.

---

## 2. Decisioni Architetturali

### 2.1. Collocazione a Tre Pilastri & Hosting Statico
- Il sito pubblico risiede nel **Secondo Pilastro** del repository:
  - `Applicativo/website/index.html`
  - `Applicativo/website/css/style.css`
  - `Applicativo/website/js/motion-engine.js`
  - `Applicativo/website/js/footwear-blueprint.js`
  - `Applicativo/website/js/network-radar.js`
  - `Applicativo/website/js/app.js`
  - `Applicativo/website/assets/`
- I file sono rispecchiati in `Applicativo/frontend/public/website/`, rendendo il sito accessibile sia aprendo direttamente `index.html` sia tramite il web server Vite/Caddy in produzione.
- Nessun build tool o compilazione obbligatoria: puro HTML5 semantico, CSS3 Moderno con Custom Properties e Vanilla JavaScript ES6+.

### 2.2. Motori Matematici di Computer Motion (Canvas & SVG)
1. **Harmonic Wave & Telemetry Orbit Engine (`motion-engine.js`):**
   - Composizione a 5 strati di onde armoniche: $y(x, t) = H \cdot y_{\text{base}} + A_1 \sin(k_1 x + \omega_1 t) + A_2 \sin(k_2 x + \omega_2 t)$.
   - Nodi di telemetria rotanti con calcolo dinamico dell'angolo $\theta$ e proiezione coordinate $[X, Y]$ in tempo reale.
   - Fisica di interazione cursore con molle smorzate (*Damped Spring Solver* basato sulla legge di Hooke $F = -k \Delta x - c v$).
   - Blending mode `screen` su fondo Deep Pitch Black `#0A0A0A`.
2. **Interactive Exploded Footwear Vector Blueprint (`footwear-blueprint.js`):**
   - Disegno procedurale ad alta precisione vettoriale dei 6 layer industriali della scarpa (Tomaia Vitello LWG, Fodera & Contrafforte, Sottopiede con Lamina, Intersuola & Guardolo, Battistrada scolpito, Tag DPP UE).
   - Controllo slider di esplosione da 0% (assemblata) a 100% (spaccato isometrico) con curve di accelerazione cubiche.
   - Ispezione interattiva hover/click con sincronizzazione della scheda tecnica in tempo reale (BOM L1/L2/L3, fornitori, distretti e certificazioni).
3. **Italian Districts Radar Scanner (`network-radar.js`):**
   - Scansione radar a 360° ad alta precisione sui 5 poli calzaturieri nazionali (Fermo-Macerata, Riviera del Brenta, Santa Croce sull'Arno, Scandicci, Caserta-Napoli, Barletta-Trani) con telemetria dei laboratori terzisti.

### 2.3. Conversion & Onboarding Flow
- **Richiedi Demo Guidata:** Modal a passaggi con selezione topic (PLM/BOM, Passaporto DPP, Terzisti 0€, Vault Conceria) e preferenza oraria.
- **Iscriviti / Onboarding Self-Service:** Modal per selezione ruolo (PMI Manifattura, Laboratorio Terzista a 0€, Fashion Brand, Fornitore) con pre-impostazione permessi L6.
- **Calcolatore Dinamico ROI:** Modello matematico che evidenzia il risparmio derivante dal costo zero dei terzisti rispetto ai vecchi PLM enterprise.
- **Contact Us:** Modulo reattivo con instradamento dipartimentale e notifiche toast non bloccanti.

---

## 3. Conseguenze & Vincoli

- **Prestazioni:** Tempo di caricamento $< 0.8s$, zero blocco del thread principale, 60 FPS stabili anche su dispositivi mobili.
- **FinOps & Costo Infrastruttura:** **0,00 € di costo fisso aggiuntivo**, conforme a ADR-002 e ADR-004.
- **Conformità L2-L6:** Nessuna spesa monetaria autonoma, rispetto rigoroso del Manifesto di Fondazione.
