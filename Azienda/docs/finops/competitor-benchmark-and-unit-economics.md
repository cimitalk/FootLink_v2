# Benchmark Competitivo PLM/PIM & Modello FinOps / Unit Economics — Footlink

- **Documento ID:** `FINOPS-BENCH-001`
- **Task di Riferimento:** [`FTL-REV-001`](../../tasks/FTL-REV-001.json)
- **Decision Record Correlato:** [`ADR-004: Modello di Pricing a Rete e FinOps`](../../adr/ADR-004-network-pricing-and-finops.md)
- **Redatto da:** CRO (`footlink-cro`)
- **Allineato con:** [`PRD-001`](../prd/PRD-001-mvp-pim-plm.md) (CPO), [`ADR-002`](../../adr/ADR-002-core-architecture-free-tier.md) (CTO), [`OKR-2026-Q4-2027-Q1`](../okr/OKR-2026-Q4-2027-Q1.md) (CEO)
- **Data:** 18 Ottobre 2026
- **Stato:** In Revisione (`review` — Soggetto ad Approvazione L4 Founder)

---

## 1. Executive Summary

Il mercato dei software per la gestione del prodotto nel settore moda, calzature e pelletteria presenta una **polarizzazione estrema**:
1. Da un lato, **suite Enterprise monolitiche (Centric PLM, Lectra / Kubix Link)** progettate per multinazionali del lusso, con costi di setup tra `30.000 €` e `150.000+ €`, tempi di implementazione di `6–18 mesi`, licenze a pagamento per i fornitori e totale disconnessione dalla realtà operativa dei piccoli laboratori artigiani.
2. Dall'altro, **PIM puri orizzontali (Akeneo PIM, Salsify)** che gestiscono solo il catalogo marketing/e-commerce ma ignorano completamente la fabbrica (distinte base multi-livello, forme, consumi pellame, sfridi, fasi di giunteria/montaggio e tracciabilità di lotto per il DPP UE).
3. Nel mezzo, il **90% delle PMI e dei terzisti nei distretti italiani (Marche, Toscana, Veneto, Lombardia, Puglia)** opera ancora su **Fogli Excel, PDF stampati, WhatsApp ed ERP contabili legacy (es. vecchi gestionali AS400/client-server)** privi di collaborazione di filiera.

**Footlink** si posiziona nell'oceano blu tra questi due estremi: **l'unico sistema operativo nativo `1 Articolo PIM (Vendita) ↔ N Articoli PLM (Fabbrica)` con Passaporto Digitale del Prodotto (DPP UE) integrato e accesso gratuito per sempre (`0 €`) per tutti i laboratori terzisti**, erogato con un Margine Lordo SaaS **> 85%** (superiore alla soglia minima FinOps del **75%**).

---

## 2. Analisi Competitiva Approfondita (PLM, PIM & Status Quo Distretti)

### 2.1 Matrice di Confronto Diretto

| Dimensione di Analisi | **Footlink (PLM + PIM + DPP Network)** | **Centric PLM (Dassault Systèmes)** | **Lectra / Kubix Link** | **Akeneo PIM (Growth / Enterprise)** | **Excel + WhatsApp + ERP Legacy Distretto** |
|-----------------------|----------------------------------------|-------------------------------------|-------------------------|--------------------------------------|---------------------------------------------|
| **Focus Core** | **Nativo Unificato:** `1 PIM (Vendita) ↔ N PLM (Fabbrica)` + Rete Terzisti + DPP UE | PLM Enterprise pesante (PIM assente o tramite connettori esterni costosi) | PLM + CAD Taglio + Kubix Link (ibrido complesso per grandi gruppi) | Solo PIM Commerciale / Catalogo E-Commerce (Zero PLM/Fabbrica) | Fogli sparsi per ufficio stile + ERP solo per fatture/magazzino fiscale |
| **Modello Relazionale `1 PIM ↔ N PLM`** | ✅ **Nativo Core (`ADR-003`):** 1 SKU vendita collegato a N ricette/fabbriche/lotti | ⚠️ Rigido (richiede customizzazioni pesanti tra Colorway, Sourcing e SKU) | ⚠️ Configurazione custom ad alto costo consulenziale | ❌ Assente (gestisce solo SKU/Varianti commerciali, ignora le distinte di fabbrica) | ❌ Manuale (copia-incolla con errori cronici di codifica tra produzione e B2B) |
| **Verticalità Calzatura / Pelletteria / Abbigliamento** | ✅ **100% Nativa (`PRD-001`):** Forme, calzate, spessori scarnitura, galvaniche, BOM 3 livelli, sfridi PQ/MQ | ✅ Alta nel PLM, ma richiede mesi di parametrizzazione consulenziale | ✅ Forte su taglio pelle/tessuto (CAD), ma UI complessa per piccole pelletterie/tomaifici | ❌ Orizzontale generico (nessun calcolo consumi, forme o cicli di lavorazione) | ⚠️ Artigianale (formule Excel fragili che si rompono ad ogni stagione) |
| **Esperienza & Costo per i Laboratori Terzisti** | 🚀 **0 € PER SEMPRE (`FREE_FOREVER`):** Magic Link mobile su smartphone, ≤ 3 clic, < 5 min, zero formazione | ❌ Portale Vendor a pagamento (licenze utente esterno) + interfaccia desktop complessa | ❌ Licenze/moduli Vendor Portal costosi; i terzisti rifiutano di usarlo | ❌ Non previsto (non gestisce terzisti o commesse di produzione) | ⚠️ WhatsApp / Carta / Telefonate (zero tracciabilità strutturata) |
| **Passaporto Digitale del Prodotto (DPP UE / ESPR)** | ✅ **Automatico per Lotto:** generato unendo dati PIM + lotti reali PLM confermati dai terzisti | ⚠️ Richiede moduli aggiuntivi / integrazioni con partner terzi di tracciabilità | ⚠️ Modulo tracciabilità Enterprise separato ad alto costo (Retraced/TextileGenesis) | ⚠️ Esporta solo attributi statici di catalogo, non conosce i lotti produttivi reali | ❌ Impossibile da generare per lotto senza settimane di data-entry manuale |
| **Canone Ricorrente Annuo (TCO Anno 1 per PMI)** | **1.548 € – 3.588 € / anno** *(149 € – 299 € / mese)* | **25.000 € – 80.000+ € / anno** *(anche su Centric SMB)* | **30.000 € – 90.000+ € / anno** | **15.000 € – 45.000+ € / anno** *(solo PIM, escluso PLM)* | Costo vivo software basso, ma **~25.000+ €/anno di costo occulto** in errori e tempo perso |
| **Costi di Setup / Implementazione** | **0 € (Self/Guided Onboarding)** | **20.000 € – 100.000+ €** *(System Integrator obbligatorio)* | **25.000 € – 120.000+ €** | **10.000 € – 40.000 €** | 0 € (ma debito operativo infinito) |
| **Time-to-Value (Go-Live Operativo)** | **48 ore – 2 settimane** *(Terzista operativo in 5 minuti)* | **4 – 12 mesi** | **6 – 14 mesi** | **2 – 5 mesi** | Immediato ma non scalabile |

---

### 2.2 Analisi Qualitativa per Competitor e Leve di Sostituzione ("Wedge Strategy")

#### A. Contro Centric PLM (incluso Centric SMB)
- **Punti di forza di Centric:** Leader di mercato nei grandi brand globali; copertura profonda dei processi di merchandising e calendarizzazione collezione.
- **Vulnerabilità strutturali nei distretti italiani:**
  1. **Rigetto da parte dei terzisti:** Un tomaificio di Monte Urano (FM) o una pelletteria conto terzi di Scandicci (FI) con 8 dipendenti non farà mai login su un portale desktop pensato per ingegneri gestionali né pagherà licenze vendor.
  2. **Mancanza di un PIM nativo snello:** Centric nasce per l'ufficio stile/tecnico; quando bisogna pubblicare il catalogo B2B o il DPP per lotto, i dati devono essere esportati verso un PIM esterno.
  3. **Prezzo fuori scala per le PMI italiane (1–20M €):** Anche l'offerta "SMB" comporta impegni pluriennali e giornate di consulenza che spaventano l'imprenditore calzaturiero/pellettiero.
- **Come vince Footlink:** *"Zero costi di setup, canone mensile trasparente da 149–299 €/mese, PIM+DPP già inclusi e tutti i vostri laboratori terzisti collegati gratis in 5 minuti dal telefono."*

#### B. Contro Lectra / Kubix Link
- **Punti di forza di Lectra:** Dominio storico nelle sale taglio automatizzate (macchine Vector/Versalis) e flessibilità di Kubix Link come aggregatore dati per grandi maison.
- **Vulnerabilità strutturali:**
  1. **Architettura consulenziale ("Project-ware"):** Kubix Link richiede un progetto sartoriale per ogni cliente per definire le tabelle e le relazioni, rendendolo inaccessibile alle PMI.
  2. **Nessun effetto rete virale:** Ogni installazione è un silo isolato per il singolo grande brand.
- **Come vince Footlink:** Modello `1 PIM ↔ N PLM` pre-configurato out-of-the-box con tutti gli attributi verticali per Calzature, Pelletteria e Abbigliamento (`PRD-001`), integrabile via API con i file DXF/consumi usciti dal CAD Lectra senza dover comprare il loro PLM.

#### C. Contro Akeneo PIM
- **Punti di forza di Akeneo:** Eccellente gestione multilingua e sindacazione cataloghi e-commerce (Shopify, Magento, marketplace).
- **Vulnerabilità strutturali:**
  1. **Cecità totale sulla fabbrica:** Akeneo non sa cosa sia una BOM a 3 livelli, uno sfrido in piedi quadri (PQ), una variante di calzata o un lotto di conceria LWG.
  2. **Incapacità di soddisfare il DPP UE di lotto:** Senza il legame `1 PIM ↔ N PLM` e senza i lotti confermati dai terzisti, Akeneo può mostrare solo informazioni generiche di modello, non la tracciabilità reale di lotto richiesta dal regolamento ESPR.
- **Come vince Footlink:** Per le PMI e i Brand moda, Footlink offre l'80% delle funzioni PIM che servono davvero (completezza scheda, media gallery, export B2B/B2C e pagina DPP pubblica) **alimentate direttamente e senza doppio data-entry dalla scheda tecnica di fabbrica PLM**.

#### D. Contro Fogli Excel + WhatsApp + ERP Contabili Legacy (Il Vero Concorrente nel 90% delle PMI)
- **Perché le PMI usano ancora Excel + WhatsApp:** È gratuito, immediato e i terzisti sanno già usare WhatsApp.
- **Il costo occulto devastante per la PMI:**
  1. **Errori di produzione su versione scheda sbagliata:** Basta una modifica al pellame o al tacco non recepita dal tomaificio/montaggio per bruciare `3.000 € – 10.000 €` di materiali su un singolo lotto sbagliato (**1 solo errore evitato ripaga 2 anni di Footlink PMI Pro**).
  2. **Rischio blocco commerciale DPP UE:** Con l'entrata in vigore dei requisiti di tracciabilità e delle richieste dei grandi buyer internazionali, chi non può dimostrare digitalmente la catena di custodia Tier 1–3 perde le commesse Private Label e l'accesso ai department store europei.
- **Come vince Footlink:** Non chiediamo al terzista di abbandonare lo smartphone, ma trasformiamo il messaggio WhatsApp in un **Magic Link Footlink a 0 €** dove il terzista preme 3 bottoni e aggiorna automaticamente il PLM e il Passaporto Digitale della PMI.

---

## 3. Matrice Completa FinOps del Cost-to-Serve (Infrastruttura + AI + Rete)

In piena conformità con [`ADR-002`](../../adr/ADR-002-core-architecture-free-tier.md) (CTO) e [`ADR-004`](../../adr/ADR-004-network-pricing-and-finops.md) (CRO), il modello FinOps di Footlink distingue due fasi operative:
- **Fase 1 (Bootstrap & Validazione Q1 — 0 € Cash Out):** Infrastruttura interamente ospitata su piani Free-Tier (Supabase Free + Render/Fly Free + Cloudflare Pages Free) e crediti AI coperti dal piano **Google Antigravity / Google AI Pro** del Founder (con protezione automatica `paused_ai_quota` — *Manifesto Sez. 6.2*). **Costo vivo monetario = 0,00 €/mese** (100% conforme al vincolo L2).
- **Fase 2 (Scaling Commerciale Post-Approvazione L2 Founder):** Allocazione analitica al centesimo di ogni risorsa cloud, storage, CDN e chiamata API AI per singolo tenant.

### 3.1 Parametri Tecnici Unitari di Costo a Regime (Cloud & AI)

| Risorsa Computazionale / Operativa | Metrica Unitaria | Costo Unitario Standard Cloud | Note di Ottimizzazione Architetturale FinOps |
|------------------------------------|------------------|:-----------------------------:|----------------------------------------------|
| **Database PostgreSQL (Multi-Tenant RLS)** | per 100 MB di dati strutturati + JSONB | **0,12 € / mese** | 100 MB contengono ~12.000 schede tecniche/BOM testuali |
| **Compute Backend API (FastAPI Stateless)** | per 100.000 chiamate API REST | **0,45 € / mese** | Latenza P95 < 250 ms; caching in-memory per dizionari |
| **Object Storage Media (Foto PIM, PDF Certificati)** | per 1 GB di storage S3/R2 compatibile | **0,015 € / GB / mese** | Compressione automatica WebP + deduplicazione certificati LWG/REACH |
| **CDN & Edge Serving Pagina Pubblica DPP (QR)** | per 50.000 scansioni QR Code DPP | **0,10 € / mese** | Pagine DPP staticizzate/cached su Cloudflare Edge (costo quasi zero) |
| **Operazione AI Standard (1 Credito AI Footlink)** | 1 Estrazione BOM da PDF/Immagine o 1 Generazione Scheda PIM/DPP multilingua (~2.500 token in / 800 out su Gemini Flash) | **0,004 € / operazione** | Uso di **Gemini 2.5 Flash** per task strutturati JSON + caching dei prompt di sistema |
| **Costo Marginale 1 Laboratorio Terzista (`Tier 0`)** | 1 Terzista attivo (50 conferme lotto/mese via Magic Link) | **0,12 € / mese** | Completamente sussidiato dalla PMI/Brand committente |

---

### 3.2 Matrice Analitica del Cost-to-Serve e Margine Lordo per Tier (Fase 2 Scaling)

| Componente di Ricavo / Costo (Valori Mensili per Tenant) | **Tier 0: Network (Terzista)** | **Tier 1: PMI Starter** | **Tier 2: PMI Pro** | **Tier 3: Brand Enterprise** |
|----------------------------------------------------------|:------------------------------:|:-----------------------:|:-------------------:|:----------------------------:|
| **Listino Mensile ($R$)** | **0,00 €** | **149,00 €** | **299,00 €** | **899,00 €** *(Base Enterprise)* |
| **Terzisti Gratuiti Connessi (Media / Max nel calcolo)** | — *(Riceve commesse)* | **5 terzisti** *(Max 8)* | **12 terzisti** *(Max 20)* | **25 terzisti** *(Max 50+)* |
| **1. Costo DB PostgreSQL & Compute API FastAPI** | 0,05 € *(allocato a PMI)* | 2,10 € | 3,90 € | 12,00 € |
| **2. Costo Object Storage (5 GB / 25 GB / 100 GB) + Backup** | 0,02 € *(allocato a PMI)* | 0,90 € | 1,80 € | 5,50 € |
| **3. Costo CDN / Traffico Pubblico QR Code DPP UE** | 0,00 € | 0,60 € | 1,10 € | 4,00 € |
| **4. Costo Quota AI Inclusa (100% utilizzo Fair-Use)** | 0,00 € *(0 crediti AI)* | **0,60 €** *(150 crediti AI)* | **2,00 €** *(500 crediti AI)* | **10,00 €** *(2.500 crediti AI)* |
| **5. Costo Cross-Subsidization Terzisti ($N_{\text{sub}} \times 0,12\text{ €}$)** | *(Coperto da Tier 1-3)* | **0,60 €** *(5 × 0,12 €)* | **1,44 €** *(12 × 0,12 €)* | **3,00 €** *(25 × 0,12 €)* |
| **Subtotale Cost-to-Serve Tecnologico (Infra + AI + Rete)** | *(0,12 € riallocato)* | **4,80 € (3,22% di $R$)** | **10,24 € (3,42% di $R$)** | **34,50 € (3,84% di $R$)** |
| **6. Commissioni Incasso B2B (SEPA Direct Debit / Stripe ~1,2%)** | 0,00 € | 1,80 € | 3,60 € | 10,80 € |
| **7. Customer Success & Onboarding Tecnico Allocato** | 0,00 € *(Self-UX 3 clic)* | 9,40 € | 17,90 € | 47,20 € |
| **TOTALE COGS (Cost-to-Serve Complessivo per Tenant)** | **0,00 € netti** | **16,00 € / mese** | **31,74 € / mese** | **92,50 € / mese** |
| **MARGINE LORDO UNITARIO (€ / mese)** | — | **+133,00 € / mese** | **+267,26 € / mese** | **+806,50 € / mese** |
| **MARGINE LORDO SAAS (%) — Soglia Minima > 75%** | **100% Sussidiato** | **89,26%** ✅ | **89,38%** ✅ | **89,71%** ✅ |

> **Verifica Vincolo CTO & CRO (`KR CTO-1.4` & `KR B.3`):**
> - L'incidenza pura dell'infrastruttura + AI + rete terzisti è pari al **3,22% – 3,84% dei ricavi** (ampiamente sotto il tetto massimo del **12%** fissato in `OKR-2026-Q4-2027-Q1`).
> - Il **Margine Lordo SaaS complessivo** (includendo anche gateway di pagamento e supporto cliente) si attesta a **~89,4%**, superando di oltre **14 punti percentuali** la soglia minima inderogabile del **75%**.

---

## 4. Policy di Fair-Use AI e Protezione dei Margini (Circuit Breaker per Tenant)

Per evitare che un utilizzo anomalo delle funzionalità di Intelligenza Artificiale (es. caricamento massivo di migliaia di vecchi PDF scansionati o generazione ripetuta di descrizioni PIM in 15 lingue) possa erodere il margine lordo di un singolo tenant sotto la soglia del 75%, Footlink implementa una **Policy di Fair-Use AI a 3 livelli**:

1. **Contabilizzazione Trasparente in "Crediti AI Footlink":**
   - **Importazione assistita AI di 1 Scheda Tecnica / Distinta Base da PDF o Excel:** `2 Crediti AI` (costo vivo per Footlink: `~0,008 €`).
   - **Generazione automatica Copy Commerciale PIM + Traduzione 4 Lingue (IT/EN/FR/DE) da attributi PLM:** `1 Credito AI` (costo vivo: `~0,004 €`).
   - **Pre-validazione AI completezza e coerenza normativa DPP UE (ESPR Check):** `1 Credito AI` (costo vivo: `~0,004 €`).
   - **Operazioni standard CRUD, calcolo consumi BOM, invio Magic Link terzisti e generazione QR Code DPP:** **0 Crediti AI (100% deterministiche in Python/PostgreSQL, costo AI = 0,00 €)**.
2. **Routing Intelligente dei Modelli (Model Tiering):**
   - Il **95% dei task AI di prodotto** utilizza modelli ad altissima efficienza (**Gemini 2.5 Flash** con output JSON tipizzato Pydantic), mantenendo il costo per singola operazione sotto `0,005 €`.
   - I risultati sono sottoposti a **caching deterministico su hash del documento/BOM**: se una scheda tecnica non è cambiata, l'AI non viene mai richiamata due volte per gli stessi dati.
3. **Hard-Cap & Degradazione Graziata (Graceful Degradation):**
   - Al raggiungimento dell'**80% della quota AI mensile**, l'amministratore della PMI riceve un avviso non bloccante in dashboard.
   - Al raggiungimento del **100% della quota AI mensile** (`150` su Starter, `500` su Pro, `2.500` su Enterprise), le chiamate AI si mettono in pausa per quel tenant fino al rinnovo mensile senza bloccare alcuna funzionalità core manuale di PLM, PIM, gestione terzisti o pubblicazione QR Code DPP.
   - Il cliente può opzionalmente acquistare un **AI Booster Pack (`+1.000 Crediti AI a 29,00 €`)**, il cui costo vivo di inferenza è di soli `4,00 €` (**Margine Lordo dell'Add-on AI = 86,2%**).

---

## 5. Unit Economics: CAC, LTV, Payback Period e Viralità di Distretto (`LTV/CAC > 3x`)

Il modello Go-To-Market di Footlink sfrutta la **densità geografica dei distretti manifatturieri italiani** e l'**effetto rete dei terzisti a 0 €** per abbattere drasticamente il Costo di Acquisizione Cliente (CAC).

### 5.1 Effetto Moltiplicatore del "Viral Loop di Distretto" ($K$-Factor B2B)
Nei distretti calzaturieri e pellettieri (es. Fermo-Macerata, Santa Croce/Scandicci, Riviera del Brenta):
1. Una **PMI Produttiva (Calzaturificio A)** entra su Footlink e invita gratuitamente **6 laboratori terzisti** (2 tomaifici, 1 suolificio, 1 tacchificio, 1 montaggio, 1 scatolificio).
2. Ciascuno di questi 6 terzisti lavora contemporaneamente per altri **4–8 calzaturifici del medesimo distretto** (Calzaturifici B, C, D, E).
3. Sperimentando la comodità di confermare le commesse in 3 clic su Footlink senza errori e senza telefonate, il terzista stesso diventa **ambasciatore passivo e attivo** (*"Con il Calzaturificio A usiamo il link gratuito di Footlink e non sbagliamo più un lotto pellame"*), generando **lead inbound a CAC = 0 €** tra gli altri committenti del distretto.

### 5.2 Tabella Unit Economics per Segmento (Proiezione a Regime 12–24 Mesi)

| Metrica Unit Economics | **Tier 1: PMI Starter** | **Tier 2: PMI Pro (Core)** | **Tier 3: Brand Enterprise** | **Blended Portfolio (Mix: 40% T1, 45% T2, 15% T3)** | Target OKR / Vincolo Ruolo CRO |
|------------------------|:-----------------------:|:--------------------------:|:----------------------------:|:---------------------------------------------------:|:------------------------------:|
| **ARPU Mensile ($R$)** | 149,00 € | 299,00 € | 999,00 € *(media tier)* | **344,00 € / mese** | Crescita MRR costante |
| **ARPU Annuale (ARR per Cliente)** | 1.788,00 € | 3.588,00 € | 11.988,00 € | **4.128,00 € / anno** | — |
| **Margine Lordo SaaS (%)** | 89,26% | 89,38% | 89,71% | **89,45%** | **> 75%** *(Target OKR ≥ 78%)* |
| **Margine Lordo Mensile (€)** | 133,00 € | 267,26 € | 896,20 € | **307,70 € / mese** | — |
| **Churn Mensile Stimato** *(ALTA ritenzione per lock-in BOM + DPP + Terzisti)* | 1,8% / mese | 1,2% / mese | 0,6% / mese | **1,25% / mese** | **< 2,0% / mese** |
| **Vita Media Cliente Attesa (mesi)** | ~55 mesi (~4,6 anni) | ~83 mesi (~6,9 anni) | ~120+ mesi *(capped a 84m)* | **~72 mesi (6 anni)** | — |
| **LTV (Lifetime Value sul Margine Lordo)** | **7.315 €** | **22.182 €** | **75.280 €** | **22.154 €** | — |
| **CAC (Customer Acquisition Cost)** *(Outbound mirato distretto + Referral Terzisti 0 € + Inbound CMO)* | **650 €** *(Inside Sales veloce)* | **1.450 €** *(Demo + Pilota guidato)* | **4.800 €** *(Field/Exec Sales)* | **1.630 €** *(In Bootstrap Q1: ~0 € vivo)* | Zero-Budget Adv in Q1 |
| **Rapporto LTV / CAC** | **11,2x** | **15,3x** | **15,7x** | **13,6x** *(anche con churn 2x resta **6,8x**)* | **> 3,0x** *(Target OKR ≥ 4,0x)* |
| **CAC Payback Period (mesi)** | **4,9 mesi** | **5,4 mesi** | **5,4 mesi** | **5,3 mesi** | < 12 mesi |
| **Terzisti Connessi a 0 € per Cliente** | 4 – 8 terzisti | 8 – 15 terzisti | 20 – 50 terzisti | **~9,5 terzisti / cliente** | **≥ 3 terzisti / PMI (`KR B.2`)** |

---

## 6. Simulazione di Scala FinOps del Portafoglio Footlink (3 Orizzonti)

La tabella seguente dimostra come i conti economici di Footlink scalino dal **Trimestre di Lancio (Q1 Bootstrap a costo 0 €)** fino a una base clienti consolidata nei distretti italiani, mantenendo sempre il **Margine Lordo SaaS > 85%**.

| Indicatore FinOps Mensile | **Orizzonte 1: Fine Q1 Bootstrap** *(3 PMI Pilota + 12 Terzisti)* | **Orizzonte 2: Mese 12 (Seed Traction)** *(35 PMI + 4 Brand + 280 Terzisti)* | **Orizzonte 3: Mese 24 (District Leader)** *(150 PMI + 20 Brand + 1.400 Terzisti)* |
|---------------------------|:-----------------------------------------------------------------:|:----------------------------------------------------------------------------:|:----------------------------------------------------------------------------------:|
| **Clienti Paganti Attivi** | 3 Design Partner (in conversione) | 39 (20 Tier 1, 15 Tier 2, 4 Tier 3) | 170 (70 Tier 1, 80 Tier 2, 20 Tier 3) |
| **Laboratori Terzisti Attivi (`Tier 0 a 0 €`)** | **12 Terzisti** *(Ratio 4:1)* | **280 Terzisti** *(Ratio 7,2:1)* | **1.400 Terzisti** *(Ratio 8,2:1)* |
| **MRR (Monthly Recurring Revenue)** | **747,00 € / mese** *(3 × 249 € Early)* | **11.061,00 € / mese** | **54.330,00 € / mese** |
| **ARR (Annual Run-Rate)** | **8.964,00 € / anno** | **132.732,00 € / anno** | **651.960,00 € / anno** |
| **Costo Cloud + DB + Storage + CDN DPP** | **0,00 €** *(100% Free-Tier `ADR-002`)* | **215,00 € / mese** *(1,94% MRR)* | **940,00 € / mese** *(1,73% MRR)* |
| **Costo Inferenza AI (Gemini Flash/Pro)** | **0,00 €** *(Incluso in piano Founder)* | **52,00 € / mese** *(0,47% MRR)* | **265,00 € / mese** *(0,49% MRR)* |
| **Costo Cross-Subsidization Terzisti a 0 €** | **0,00 €** *(Free-Tier)* | **33,60 € / mese** *(0,30% MRR)* | **168,00 € / mese** *(0,31% MRR)* |
| **Gateway Pagamenti & Customer Success Allocato** | **9,00 € / mese** *(solo SEPA alla conv.)* | **840,00 € / mese** *(7,59% MRR)* | **4.150,00 € / mese** *(7,64% MRR)* |
| **Totale Cost-to-Serve ($\text{COGS}_{\text{tot}}$)** | **0,00 € in prova / 9,00 € a conv.** | **1.140,60 € / mese** | **5.523,00 € / mese** |
| **Margine Lordo SaaS Mensile (€)** | **+738,00 € / mese** | **+9.920,40 € / mese** | **+48.807,00 € / mese** |
| **MARGINE LORDO SAAS (%)** | **98,8% (Free-Tier)** | **89,69%** ✅ | **89,83%** ✅ |

---

## 7. Cadenza di Controllo FinOps (Allineata a `Role_CRO_Footlink.md`)

1. **Dashboard FinOps Mensile (`docs/finops/`):** Ogni fine mese, CRO e CTO consolidano per il CEO e il Founder la vista:
   - `MRR per Tier` vs `Costo Cloud + AI per Tenant` vs `Numero Terzisti Gratuiti Attivi per PMI` vs `Gross Margin %`.
2. **Soglia di Guardrail Automatico:**
   - Se un singolo tenant supera il **15% di incidenza Cost-to-Serve sul proprio canone** (es. per uso intensivo storage/API), scatta una notifica congiunta CTO-CRO per ottimizzazione query/caching o proposta commerciale di upgrade al tier superiore.
3. **Rispetto Assoluto del Vincolo L2:**
   - Finché i primi Design Partner operano entro i limiti tecnici del Free-Tier (`ADR-002`), nessuna infrastruttura a pagamento viene attivata. L'eventuale passaggio ai piani cloud Pro (~25–50 €/mese) verrà proposto al Founder con formale **Dossier L2** solo al momento dell'incasso dei primi canoni ricorrenti.
