# Sprint 6 — Storytelling e Posizionamento DPP Conceria & Tracciabilità di Filiera (ESPR / LWG / ICEC)

**Autore:** Chief Marketing Officer (`footlink-cmo`)  
**Data:** 19 Ottobre 2026  
**Riferimento Task:** [`FTL-MKT-005`](../../tasks/FTL-MKT-005.json) (allineato a [`FTL-CEO-008`](../../tasks/FTL-CEO-008.json), [`FTL-PROD-006`](../../tasks/FTL-PROD-006.json), [`FTL-TECH-007`](../../tasks/FTL-TECH-007.json))  
**Documento Master PaaS Distrettuale:** [`sprint-6-paas-distrettuale-posizionamento-e-comunicazione.md`](./sprint-6-paas-distrettuale-posizionamento-e-comunicazione.md)  
**Decision Record di Riferimento:** [`ADR-008`](../../adr/ADR-008-production-orders-tannery-traceability-subcontractor-lifecycle.md), [`ADR-006`](../../adr/ADR-006-unified-design-system-and-l6-cost-segregation.md)  
**Governance:** **Gate L5 Attivo (In attesa di approvazione Founder)** · **Zero Paid Ads (L2)**  

---

## 1. Il Ruolo Centrale del Pellame nel Made in Italy e la Sfida Normativa

La calzatura e la pelletteria italiana d'alta gamma non esisterebbero senza la maestria conciaria dei distretti di **Arzignano, Santa Croce sull'Arno, Solofra e Fermo**. Il pellame rappresenta:
- **Dal 50% al 70% del valore intrinseco** del prodotto finito.
- Il principale elemento di percezione tattile, olfattiva e visiva per il consumatore di lusso.
- L'area a maggior rischio normativo e reputazionale a livello europeo:
  - **Regolamento ESPR (UE 2024/1781):** obbligo di passaporto digitale con dati verificati su metodi di concia, durabilità, riparabilità e chimica.
  - **Regolamento Anti-Deforestazione EUDR (UE 2023/1115):** obbligo di geolocalizzazione dell'allevamento di origine del grezzo bovino per garantire l'assenza di deforestazione successiva al 31 dicembre 2020.
  - **Conformità REACH SVHC:** severi limiti per Cromo VI (< 3 ppm), formaldeide, metalli pesanti e sostanze chimiche vietate.

### La Soluzione di Posizionamento Footlink:
Footlink si posiziona come **il primo PLM/PIM al mondo con Tannery Hub e Passaporto Conciario integrato nativamente nella Distinta Base (BOM)**, consentendo alle aziende di passare dalla gestione documentale frammentata a un asset digitale immutabile (hash crittografico SHA-256 a 0 €).

---

## 2. Micro-Copy per i 4 Quadranti di Sostenibilità nel Passaporto Digitale DPP UE

Nel design minimale ad alto contrasto (Nike-Inspired Editorial v2.0), il Passaporto Digitale del Prodotto (DPP) espone ai consumatori e ai buyer showroom 4 quadranti di trasparenza conciaria immediati:

### Quadrante 1: Origine & Tracciabilità del Grezzo (Conformità EUDR)
- **Titolo:** *"ORIGINE CERTIFICATA"*
- **Badge:** `EUDR COMPLIANT · DEFORESTATION-FREE`
- **Descrizione:**  
  *"Pellame bovino proveniente da allevamenti selezionati europei (Normandia, Francia / Baviera, Germania). Filiera geolocalizzata conforme al Regolamento UE 2023/1115: zero impatto da deforestazione, massimo standard di benessere animale."*

### Quadrante 2: Eccellenza Conciaria & Rating Internazionale
- **Titolo:** *"MAESTRIA CONCIARIA ITALIANA"*
- **Badge:** `LWG GOLD RATED · ICEC TS 410 VERIFIED`
- **Descrizione:**  
  *"Lavorato nel distretto conciario d'eccellenza. La conceria opera con certificazione Leather Working Group (LWG) livello Gold e certificazione di tracciabilità ICEC, garantendo riduzione dei consumi idrici, recupero energetico e totale trasparenza di filiera."*

### Quadrante 3: Chimica Sicura & Metodo di Lavorazione
- **Titolo:** *"CONCIA & SALUTE"*
- **Badge:** `CHROME-FREE / REACH TESTED · ZERO SVHC`
- **Descrizione:**  
  *"Processo conciario a basso impatto ambientale (concia al vegetale con tannini naturali di castagno e mimosa / wet-white metal-free). Conforme ai più severi standard analitici REACH: assenza di Cromo VI rilevabile (< 3 ppm) e rispetto assoluto per la pelle."*

### Quadrante 4: Distretto Manifatturiero & Circolarità
- **Titolo:** *"MANIFATTURA & DURABILITÀ"*
- **Badge:** `100% MADE IN ITALY · MODELLO RISUOLABILE`
- **Descrizione:**  
  *"Manufatto realizzato e assemblato interamente nei laboratori artigianali del distretto marchigiano/toscano. Progettato secondo i principi di eco-design con cuciture smontabili e suola risuolabile per prolungare la vita del prodotto."*

---

## 3. Matrice dei Dati di Filiera: Brand vs. Terzisti vs. Consumatore (Segregazione L6)

Per garantire la massima fiducia tra le parti della filiera, i dati di concia e lavorazione sono rigidamente segregati a livello architetturale:

| Attributo Tecnico / Conciario | Vista Brand Enterprise | Vista Fabbrica PMI | Vista Terzista Façonista (0 €) | Vista Pubblica Passaporto DPP |
|---|:---:|:---:|:---:|:---:|
| **Tipo Pellame & Grana** | ✅ Visibile | ✅ Visibile | ✅ Visibile (Istruzioni di taglio) | ✅ Visibile |
| **Lotto Bottale Conceria** | ✅ Visibile | ✅ Visibile | ✅ Visibile (Verifica ingresso) | ❌ Nascosto (Anonimizzato) |
| **Ragione Sociale Conceria** | ✅ Visibile | ✅ Visibile | ❌ Nascosta | ❌ Solo Distretto (es. Arzignano) |
| **Rating LWG / Certificato ICEC** | ✅ Visibile | ✅ Visibile | ❌ Non rilevante | ✅ Badge Visibile con Punteggio |
| **Paese Origine Grezzo (EUDR)** | ✅ Visibile | ✅ Visibile | ❌ Non rilevante | ✅ Paese (es. Francia/Italia) |
| **Costo Pellame al mq/sqft** | ✅ Visibile | ✅ Visibile | ❌ **SEGREGAZIONE L6 (Invisibile)** | ❌ **SEGREGAZIONE L6 (Invisibile)** |
| **Compenso di Fase Façonista** | ✅ Visibile | ✅ Visibile | ❌ **SEGREGAZIONE L6 (Invisibile)** | ❌ **SEGREGAZIONE L6 (Invisibile)** |
| **Scheda Manutenzione Pellame** | ✅ Visibile | ✅ Visibile | ❌ Non rilevante | ✅ Guida Cura Consumatore |

---

## 4. Dossier Post LinkedIn per Thought Leadership Organica (Gate L5)

*(I testi completi dei post LinkedIn ufficiali sono riportati in dettaglio nella Sezione 3.3 del master deliverable [`sprint-6-paas-distrettuale-posizionamento-e-comunicazione.md`](./sprint-6-paas-distrettuale-posizionamento-e-comunicazione.md) e sottoposti congiuntamente al vaglio del Founder).*

---

## 5. Stato del Task FTL-MKT-005

- **Stato:** Completato lato CMO (`review` per approvazione Founder L5).
- **Deliverable generati:**
  1. [`sprint-6-paas-distrettuale-posizionamento-e-comunicazione.md`](./sprint-6-paas-distrettuale-posizionamento-e-comunicazione.md) (Master Strategy PaaS, Sales Kit CRO, Fiere di settore).
  2. [`sprint-6-leather-traceability-marketing-positioning.md`](./sprint-6-leather-traceability-marketing-positioning.md) (Deep dive Tracciabilità Conceria, LWG/ICEC, Micro-copy DPP).
- **Prossima Azione:** Condivisione con il CEO e sottomissione al Founder per approvazione del gate L5.
