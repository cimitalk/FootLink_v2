# Footlink Master Training Curriculum & Enablement Framework
**Ruolo:** Training Manager & Head of Customer Enablement  
**Versione:** 2.0 (Allineata a Epoca II - Sprint 8+)  
**Data:** Ottobre 2026  
**Stato:** 🟢 Ufficiale ed Esecutivo  
**Target:** Brand Calzaturieri, PMI Manifatturiere, Uffici Modelleria, Concerie, Laboratori Terzisti / Fasonisti  

---

## 1. Visione Didattica: L'Approccio "Zero-Training UX" e l'Enablement di Filiera

Nel settore moda e manifattura calzaturiera italiana (distretti di Fermo-Macerata, Riviera del Brenta, Montebelluna, Santa Croce sull'Arno, San Mauro Pascoli, Napoli), l'adozione software fallisce tradizionalmente per tre motivi:
1. **Frattura tra Ufficio Stile/Modelleria ed E-commerce/Vendite:** I sistemi PLM parlano in pezzi, fustelle e consumi; i sistemi PIM parlano in canali, lookbook e taglie commerciali.
2. **Attrito con i Laboratori Terzisti (Fasonisti):** Chiedere a un laboratorio di 4 artigiani di acquistare licenze ERP o installare client pesanti porta al rifiuto totale e all'uso di fotocopie e WhatsApp.
3. **Tempi di Onboarding Proibitivi:** Corsi di 40 ore che paralizzano la produzione dei campionari stagionali.

### La Formula Footlink: "Time-to-First-BOM < 15 Minuti"
La didattica di Footlink si fonda su tre pilastri formativi inderogabili:
- **Ponte PIM ↔ PLM (1 : N):** Formare i team a non duplicare mai i dati: un articolo vendibile (PIM) governa $N$ distinte base produttive (PLM) per multi-sourcing, lotti o stabilimenti.
- **Inclusione del Terzista a Costo Zero (0 €) e Senza Installazione:** Il laboratorio riceve commesse su smartphone, scansiona il QR code, dichiara l'avanzamento (Taglio, Giunteria, Montaggio, Finissaggio) con interfaccia L6 segregata e zero training.
- **Tracciabilità Conciaria e Passaporto DPP (ESPR UE 2024/1781):** Trasformare la compliance ambientale in un vantaggio competitivo senza sovraccaricare gli operatori.

---

## 2. Matrice dei Percorsi Formativi per Ruolo (Role-Based Learning Paths)

La Footlink Academy articola la formazione in **6 percorsi specialistici**, ciascuno calibrato su competenze pratiche, lessico di settore e obiettivi operativi misurabili:

| Percorso ID | Profilo Professionale | Moduli Chiave | Durata Target | Output Certificato |
|---|---|---|---|---|
| **TRN-PATH-01** | **Modellista & Product Developer** | Modelli, Varianti PLM, Distinta Base 3 Livelli (Upper, Lining, Sole), Esplosione Colorway | 35 minuti | Creazione completa del Tech Pack e distinta base con consumi e tolleranze |
| **TRN-PATH-02** | **Color & Material Specialist** | Color Intelligence Studio, Tannery Vault, Schede Pelli LWG, Palette e Mappatura E-commerce | 25 minuti | Configurazione cartella colori e abbinamento lotti conciari certificati |
| **TRN-PATH-03** | **Merchandiser & E-commerce Lead** | Catalogo PIM, Ponte 1:N PIM/PLM, Tassonomie Merceologiche, Canali B2B & Shopify | 30 minuti | Pubblicazione catalogo commerciale collegato a varianti di produzione multiple |
| **TRN-PATH-04** | **Laboratorio Terzista & Fasonista** | Subcontractor Mobile Portal L6, Lettura Commesse, Avanzamento Fasi e Segnalazione Blocchi | 10 minuti | Avanzamento commessa con scansione lotti a costo 0 € e zero carta |
| **TRN-PATH-05** | **Sustainability & Compliance Officer** | DPP Generator, Normativa ESPR UE 2024/1781, GS1 Digital Link, Validazione LWG e Tracciabilità | 20 minuti | Generazione del Passaporto Digitale di Prodotto con QR Code pubblico |
| **TRN-PATH-06** | **Direttore di Produzione & C-Suite** | Distretto PaaS, Governance L0–L6, Ordini di Produzione, Vendor Hub 360, Unit Economics | 30 minuti | Monitoraggio commesse, ranking fornitori e controllo margini di distretto |

---

## 3. Syllabus Dettagliato dei Moduli di Formazione

### Modulo 1: Fondamenti di Piattaforma e Architettura dei Dati
- **Obiettivo:** Comprendere la struttura del database Footlink, le gerarchie merceologiche (Divisione, Categoria, Famiglia, Modello) e la filosofia dei 3 pilastri.
- **Contenuti didattici:**
  - Differenza sostanziale tra *Modello di Prodotto* (forma, dima, tacco, stile), *Variante PLM* (codice di produzione, stabilimento, distinta base) e *Articolo PIM* (SKU commerciale, prezzo, lookbook, canale).
  - La regola d'oro: **1 PIM può puntare a N PLM, ma ogni PLM ha la sua distinta base autonoma**.
  - Navigazione dell'Home Hub e indicatori di salute dati (Data Quality Score).

### Modulo 2: La Distinta Base Calzaturiera a 3 Livelli (BOM 3-Level Engine)
- **Obiettivo:** Costruire e gestire distinte base complete con classificazione strutturata calzaturiera.
- **Contenuti didattici:**
  - **Livello 1: Tomaia (Upper):** Pellami di tomaia, fodere esterne, puntale, contrafforte, cerniere, occhielli, filati di cucitura.
  - **Livello 2: Fodera & Rinforzi (Lining):** Fodere vitello/capra, microfibra, tele di rinforzo termoadesive, imbottiture collo.
  - **Livello 3: Fondo & Suola (Sole):** Soletta di montaggio (sottopiede), cambrione d'acciaio, suola gomma/cuoio, guardolo, tacco, sottotacco, battistrada.
  - Calcolo automatico dei consumi (decimetri quadri $dm^2$, metri $m$, paia $pr$) e percentuali di scarto (tranciatura manuale vs automatica a lama oscillante).
  - Validazione automatica del fornitore: blocco se la certificazione LWG del fornitore è scaduta (*Vendor Compliance Guard*).

### Modulo 3: Color Intelligence Studio & Tannery Vault
- **Obiettivo:** Gestire la cromia e la tracciabilità delle pelli dalla conceria alla calzatura finita.
- **Contenuti didattici:**
  - Creazione master color con codici esadecimali `#HEX`, coordinate $CIE\ L^*a^*b^*$ e standard Pantone FHI.
  - Esplosione automatica delle varianti colore (*Colorway Matrix*): come generare 8 varianti di colore con un clic applicando la combinazione su tomaia, fodera e battistrada.
  - Mappatura automatica sui colori normalizzati dell'e-commerce (es. "Cognac Anticato" $\rightarrow$ "Marrone").
  - Tannery Vault: inserimento lotti conciari, verifica delle certificazioni (LWG Gold/Silver/Bronze, ISO 14001, OEKO-TEX Leather Standard) e associazione dei certificati digitali (DAM).

### Modulo 4: Il Ponte 1:N PIM ↔ PLM e Cataloghi Omnicanale
- **Obiettivo:** Configurare il mapping commerciale-produttivo per il multi-sourcing globale o per lotti differenziati.
- **Contenuti didattici:**
  - Creazione dell'articolo commerciale PIM (SKU, Nome commerciale, Descrizione SEO, Prezzo Retail, Valuta, Canali abilitati: Shopify, Farfetch, B2B Showroom).
  - Assegnazione delle varianti PLM primarie e secondarie (es. PLM-IT-01 per produzione interna Marche e PLM-PT-02 per laboratorio esterno Porto).
  - Gestione delle regole di fallback e aggregazione delle giacenze e disponibilità per taglia (scala taglie Paris Point 35–46 o UK/US).

### Modulo 5: Gestione della Rete Produttiva, Vendor Hub 360 e Terzisti
- **Obiettivo:** Inviare ordini di lavoro e monitorare i laboratori di montaggio e giunteria senza frizioni.
- **Contenuti didattici:**
  - Anagrafica Fornitori & Terzisti con matrice di affidabilità, puntualità e rating qualitativo calcolato automaticamente.
  - Generazione dell'Ordine di Lavoro (Work Order) per fase:
    1. *Taglio / Tranciatura* (taglio tomaie e fodere)
    2. *Preparazione e Giunteria* (scarnitura, ripiegatura, cucitura tomaia)
    3. *Montaggio / Calzatura* (applicazione soletta, montaggio su forma con premonta, boetta, suolatura)
    4. *Finissaggio & Confezionamento* (lucidatura, applicazione soletta di pulizia, inscatolamento)
  - Il portale Subcontractor Mobile a costo zero: come il terzista riceve il link con token sicuro, visualizza solo la propria commessa (segregazione L6) e conferma l'avanzamento lotti con un tocco sul telefono.

### Modulo 6: Passaporto Digitale di Prodotto (DPP) e Compliance ESPR UE
- **Obiettivo:** Conoscere e applicare il regolamento europeo Ecodesign for Sustainable Products Regulation (ESPR).
- **Contenuti didattici:**
  - Sintesi automatica del passaporto digitale: Footlink aggrega la distinta base, i lotti conciari LWG, la percentuale di materiali riciclati e la carbon footprint stimata.
  - Generazione del codice QR conforme a GS1 Digital Link (`https://footlink.id/dpp/{passport_id}`).
  - Simulazione dell'esperienza cliente: la scansione del cartellino da parte del consumatore finale per visualizzare la storia del pellame, il laboratorio che l'ha confezionata e le istruzioni di riparazione e riciclo.

---

## 4. Modalità di Erogazione e Strumenti Formativi

Per garantire la massima flessibilità aziendale, il programma formativo è disponibile su 3 canali sincronizzati:

1. **Training Portal Interattivo (`training_portal.html`):**
   - Accessibile via web browser da qualsiasi dispositivo.
   - Contiene il percorso guidato, checklist interattiva, simulatori "hands-on" di BOM e DPP, e quiz di certificazione finale.
2. **Documentazione Tecnica Pubblica (`tech_docs.html`):**
   - Portale di consultazione continua con API specs, modelli dati relazionali, payload JSON ed esempi di integrazione per programmatori e sistemisti.
3. **Micro-Learning & Assistenza In-App:**
   - Callout contestuali, tooltip di settore e documentazione incorporata direttamente nella barra superiore di Footlink.

---

## 5. Criteri di Certificazione: "Footlink Certified Specialist"

Al termine dei percorsi, l'operatore può sostenere l'esame di valutazione interattivo:
- **Formato:** 10 quesiti pratici basati su casi reali di produzione e commercializzazione.
- **Soglia di Superamento:** $\ge 80\%$ (almeno 8 risposte corrette su 10).
- **Riconoscimento:** Rilascio istantaneo del Badge Digitale e Certificato Nominale attestante le competenze su PIM, PLM, BOM calzaturiera e Passaporto DPP.
