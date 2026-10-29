# Footlink — Strategia del Sito Web Pubblico Ufficiale, Specifiche di Computer Motion & Funnel di Conversione

- **Data di Pubblicazione:** 2026-10-29
- **Iniziativa:** Sprint 9 — Coordinamento e Gestione Sito Web Pubblico
- **Autori:** CMO, CPO, CTO, CRO, CEO, CGO
- **Collocazione Codice:** [`Applicativo/website/`](../../../Applicativo/website/) (e mirror in [`Applicativo/frontend/public/website/`](../../../Applicativo/frontend/public/website/))
- **Delibera di Riferimento:** [`ADR-019`](../../adr/ADR-019-footlink-public-website-architecture-motion-and-onboarding.md)
- **Task Object:** [`FTL-CEO-038.json`](../../tasks/FTL-CEO-038.json)

---

## 1. Visione & Obiettivi di Mercato (CEO & CMO)

Il **Sito Web Pubblico Ufficiale di Footlink** è la principale vetrina di divulgazione e lead generation della piattaforma, progettato per comunicare in modo chiaro, scientifico ed esteticamente impeccabile il posizionamento di Footlink come **il primo Sistema Operativo verticale per la filiera calzaturiera e della pelletteria Made in Italy**.

### 1.1. Obiettivi di Business Primari
1. **Divulgazione del Valore Differenziante:**
   - Superamento dei vecchi software generici o PLM monolitici inadatti alla filiera italiana.
   - Centralità del modello ontologico **1 Articolo Commerciale PIM (Stile/Vendita) ↔ N Varianti Industriali PLM (Produzione)**.
   - Distinta Base (BOM) gerarchica a 3 livelli intuitiva e collaborativa.
   - Passaporto Digitale del Prodotto (DPP UE) conforme al regolamento ESPR 2024/1781 ed EUDR 2023/1115 con generazione live di QR Code e crittografia SHA-256.
2. **Pricing Trasparente e Viralità di Rete (ADR-004):**
   - **Terzisti e Laboratori a Costo Zero (0,00 € perpetuo):** azzeramento totale delle barriere all'onboarding.
   - **PMI Manifatturiere a € 149/mese (€ 119/mese annuale):** accessibilità economica senza eguali sul mercato.
   - **Fashion Brand Enterprise:** soluzioni su misura con isolamento multi-tenant L6 e conformità contrattuale.
3. **Funnel ad Alta Conversione:**
   - Modale interattivo **Richiedi Demo Guidata** a 3 step con rilascio del VIP Pass.
   - Modale interattivo **Iscriviti / Onboarding** con differenziazione per ruolo e distretto.
   - Form reattivo **Contact Us** con instradamento dipartimentale e notifiche toast non bloccanti.

---

## 2. Direttive Visive & Integrazione con la Suite DAM (Sprint 7)

Il sito applica rigorosamente il **Luxury Editorial Minimalism** e il tema **Cyber Neon Luminous** formalizzati nel *DAM Styleguide & Token Cheat Sheet* (`Azienda/dam/01_brand_identity/brand-styleguide-cheat-sheet.md`):

| Token Grafico | Valore HEX / Font | Ruolo nell'Interfaccia |
| :--- | :--- | :--- |
| **Pitch Deep Black** | `#0A0A0A` | Sfondo immersivo principale, profondità infinita |
| **Dark Charcoal** | `#141414` | Superfici card, container modali, box telemetrici |
| **Subtle Precision Border** | `#222222` | Reticoli millimetrici di divisione, bordi sottili 1px |
| **Emerald Neon Wave** | `#00FF87` | Accento primario di stato attivo, onde matematiche, KPI salienti |
| **Ruby Core Wave** | `#FF3366` | Accento secondario per alert normativi, DPP UE e indicatori di costo |
| **Optic Pure White** | `#FFFFFF` | Wordmark Footlink, H1 monumentali, bottoni primari ad alto contrasto |
| **Display Typography** | `Barlow Condensed` (900) | Titoli monumentali scultorei, impatto editoriale contemporaneo |
| **Body Typography** | `Inter` (400, 600, 800) | Copy descrittivo, etichette ergonomiche, leggibilità assoluta |
| **Telemetry Typography** | `JetBrains Mono` (500, 700) | Coordinate vettoriali, gradi angolari $\theta$, codici ISO-BOM e metriche |

---

## 3. Motori Matematici di Computer Motion (CTO)

Tutte le animazioni sono implementate in **puro codice JavaScript ES6+ e Canvas 2D / vettoriale**, senza librerie esterne pesanti (GSAP, Three.js), garantendo caricamento immediato e fluidità costante a **60 FPS**.

### 3.1. Motore a Onde Armoniche & HUD Orbitale (`motion-engine.js`)
- **Equazione d'Onda Parametrica:**
  $$y(x, t) = H \cdot y_{\text{base}} + A_1 \sin(k_1 x + \omega_1 t + \phi_1) + A_2 \sin(k_2 x + \omega_2 t + \phi_2)$$
- **Fisica di Interazione Cursore (Spring Solver):**
  L'interazione con il mouse è regolata dalla legge di Hooke con smorzamento elastico per garantire un feeling organico e fluido:
  $$a_x = -k (x - x_{\text{target}}) - c v_x, \quad a_y = -k (y - y_{\text{target}}) - c v_y$$
- **Nodi di Telemetria Rotanti:** 18 nodi orbitali calcolano dinamicamente l'angolo $\theta = \operatorname{atan2}(dy, dx)$ e proiettano in tempo reale le coordinate $[X, Y]$ in overlay HUD con blending `screen`.

### 3.2. Spaccato Tecnico Calzaturiero ad Esploso 3D (`footwear-blueprint.js`)
- **Geometria Vettoriale Procedurale:** Riproduzione ad alta precisione dei 6 strati industriali di una calzatura Made in Italy:
  1. `L1-UPPER`: Tomaia in Vitello Pieno Fiore 1.4-1.6mm LWG Gold.
  2. `L2-LINING`: Fodera Capretto Naturale Metal-Free con rinforzo tallone.
  3. `L3-INSOLE`: Sottopiede in cuoio rigenerato con lamina d'acciaio C75.
  4. `L4-MIDSOLE`: Intersuola microporosa EVA con guardolo cuoio cucito Blake.
  5. `L5-OUTSOLE`: Battistrada in gomma naturale scolpita ad alta aderenza.
  6. `L6-DPP-CORE`: Tag crittografico NFC + QR laser per Passaporto DPP UE.
- **Interpolazione di Esplosione:** Slider interattivo $0\% \to 100\%$ con formula di distanziamento cubico:
  $$Y_{\text{layer}}(t) = Y_{\text{center}} + \Delta Y_{\text{layer}} \cdot (0.35 + 1.65 \cdot t)$$
- **BOM Inspector Sincronizzato:** Cliccando o passando il mouse su qualunque componente, una scheda laterale reattiva mostra istantaneamente materiale, fornitore qualificato, distretto, stima di costo e certificazioni ESG.

### 3.3. Radar di Telemetria Distrettuale (`network-radar.js`)
- Fascio rotante a $360^\circ$ ad ampiezza conica con decadimento fosforescente su 5 distretti strategici:
  - Fermo-Macerata (1.420 terzisti)
  - Riviera del Brenta (890 terzisti)
  - Santa Croce sull'Arno (1.150 terzisti)
  - Scandicci - Valdarno (960 terzisti)
  - Caserta - Napoli (1.280 terzisti)
  - Barletta - Trani (740 terzisti)
- Al passaggio del raggio, i nodi emettono un'onda di propagazione (ripple pulse) che simula gli scambi telematici in tempo reale.

---

## 4. Architettura Commerciale & Calcolatore ROI (CRO & CPO)

### 4.1. Matrice dei 3 Tier di Prezzo
1. **Tier 3 — Terzisti & Laboratori di Filiera:**
   - **0,00 € Perpetuo (Senza asterischi o commissioni).**
   - Accesso mobile per orlatori, tomaifici e montatori; ricezione ordini e avanzamento fasi in 3 clic.
2. **Tier 2 — PMI Manifatturiere (Pro Growth):**
   - **€ 149 / mese** (€ 119 / mese con fatturazione annuale).
   - Fino a 15 utenti interni, modelli e varianti illimitati, distinta base a 3 livelli, Vault Conceria LWG, simulatori di costo e terzisti esterni illimitati a costo zero.
3. **Tier 1 — Fashion Brand & Gruppi del Lusso (Enterprise):**
   - **Personalizzato su misura.**
   - Multi-brand, integrazioni ERP (SAP, Stealth, AS400), Passaporto DPP scalabile, server dedicato GDPR L6 e SLA 99.9%.

### 4.2. Algoritmo del Calcolatore ROI Interattivo
Il calcolatore quantifica in tempo reale il vantaggio rispetto ai vecchi PLM concorrenti:
$$\text{Risparmio Terzisti} = N_{\text{terzisti}} \times 850\text{ €/anno}$$
$$\text{Ore Recuperate} = N_{\text{modelli}} \times 7.2 + N_{\text{paia}} \times 0.0035$$
$$\text{Risparmio Economico Totale} = \text{Risparmio Terzisti} + (\text{Ore Recuperate} \times 38\text{ €/h})$$

---

## 5. Verifica, Conformità & Istruzioni di Visione

1. **Visione Standalone nel Browser:**
   - È sufficiente aprire direttamente il file [`Applicativo/website/index.html`](file:///Users/a.ciminaritodsgroup.com/Projects/FootLink_v2/Applicativo/website/index.html) con qualsiasi browser (Chrome, Safari, Firefox).
2. **Visione tramite Server Web Locale:**
   - Il sito è disponibile all'URL: `http://localhost:5173/website/index.html` (o `http://127.0.0.1:8080/website/`).
3. **Integrità del Codice:**
   - 0 dipendenze esterne bloccanti.
   - Tutti i moduli JavaScript validati con `node -c`.
   - Nessun impatto sulle API FastAPI o sul frontend React esistente.
