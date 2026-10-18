# Footlink — Brand Guidelines & Design System v2.0 (Nike-Inspired Editorial Minimalism)

- **Documento ID:** `MKT-BRAND-002` (Supersedes v1.0 su direttiva Founder del `2026-10-18T10:24`)
- **Task di Riferimento:** [`FTL-MKT-001`](../../tasks/FTL-MKT-001.json), [`FTL-MKT-002`](../../tasks/FTL-MKT-002.json)
- **Autore:** CMO (`footlink-cmo`)
- **Ispirazione Estetica Ufficiale:** **Nike Editorial Minimalism (`https://www.nike.com/it/`)** — Contrasto assoluto Bianco/Nero, tipografia Display Condensed ExtraBold ad altissimo impatto, superfici architettoniche `#F5F5F5`, zero badge multicolore "cheap" da template SaaS, bottoni rigorosamente pill-shaped.
- **Regola Aurea sul Logo:** Il marchio **FOOTLINK** utilizza un pittogramma vettoriale iconico e dinamico ("The Stitch-Wing Link"). **È tassativamente vietato inserire la dicitura `1:N` nel logo** (`1:N` resta un pilastro architetturale interno del prodotto, mai un elemento del marchio).

---

## 1. Filosofia Estetica: "Editorial Performance, Zero SaaS Clutter"

I software B2B tradizionali per la manifattura soffrono di interfacce sovraccariche di blu/viola artificiali, gradienti cheap, decine di badge colorati e tabelle illeggibili.
Footlink adotta invece il linguaggio visivo dei grandi brand sportivi e moda globali (**ispirazione diretta: `nike.com/it`**):
1. **Spazio Bianco Drammatico & Contrasto Netto:** Il contenuto respira su sfondi `#FFFFFF` (Bianco Puro) e `#F5F5F5` (Grigio Architettonico Nike), alternati a blocchi spotlight `#111111` (Nero Assoluto).
2. **Tipografia come Architettura:** I titoli non decorano, comandano la pagina. Carattere **Condensed ExtraBold / Black (`font-weight: 900`, `text-transform: uppercase`, `letter-spacing: -0.04em`, `line-height: 0.94`)** abbinato a un corpo testo essenziale, chiaro e privo di gergo informatico.
3. **Semplicità Immediata in 5 Secondi:** Un imprenditore calzaturiero, un pellettiere o un façonista deve capire ogni schermata al primo sguardo, senza dover decifrare sigle astratte.

---

## 2. Nuovo Logotipo Ufficiale Footlink (Zero `1:N` nel Logo)

### 2.1 Pittogramma Vettoriale ("The Dynamic Sole-Link")
Il nuovo simbolo di Footlink è un segno grafico monolitico, affilato e dinamico disegnato in SVG puro:
- **Forma:** Due lame geometriche parallele inclinate a 22° che si fondono in una curva aerodinamica continua — evocando simultaneamente il **profilo teso di una suola in movimento**, un **punto di impuntura sartoriale** e una **connessione continua** tra laboratorio e mercato.
- **Wordmark:** `FOOTLINK` composto in maiuscolo geometrico (`font-weight: 900`, tracking `-0.04em`), solido e monocromatico (`#111111` su fondo chiaro, `#FFFFFF` su fondo scuro).
- **Divieto Tassativo:** **Nessuna scritta `1:N`, nessun bordo arancione/blu, nessun box da icona app economica.**

```html
<!-- Esempio SVG Ufficiale del Nuovo Logo Footlink -->
<svg width="168" height="32" viewBox="0 0 168 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="FOOTLINK">
  <!-- Pittogramma: Dynamic Sole-Link -->
  <path d="M4 24L14.5 6H24L13.5 24H4Z" fill="currentColor"/>
  <path d="M15.5 24L23 11H31L23.5 24H15.5Z" fill="currentColor"/>
  <path d="M4 26.5H29.5L28 29H2.5L4 26.5Z" fill="currentColor"/>
  <!-- Wordmark -->
  <text x="38" y="24" fill="currentColor" font-family="'Barlow Condensed', 'Inter', sans-serif" font-weight="900" font-size="25" letter-spacing="-0.03em">FOOTLINK</text>
</svg>
```

---

## 3. Palette Colori Minimalista High-Contrast (`nike.com/it` Standard)

Nessuna sfumatura decorativa, nessun blu/arancione/viola da template SaaS. L'intera esperienza visiva poggia su una scala monocromatica rigorosa con un unico indicatore semantico funzionale per le conferme di produzione.

| Ruolo | Nome Token | HEX | Variabile CSS | Regola d'Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Background Primary** | **Pure White** | `#FFFFFF` | `--bg-white` | Sfondo principale pagina, card interattive su grigio, massima pulizia |
| **Background Secondary** | **Light Bone / Nike Grey** | `#F5F5F5` | `--bg-grey` | Contenitori di sezione, card prodotto, moduli interattivi |
| **Surface Spotlight** | **Pitch Black** | `#111111` | `--bg-black` | Bottoni primari pill, blocchi Hero/Spotlight, footer, badge attivi |
| **Text Primary** | **Ink Black** | `#111111` | `--text-black` | Titoli H1–H4, testi principali, numeri chiave |
| **Text Secondary** | **Warm Neutral Grey** | `#707072` | `--text-grey` | Sottotitoli, descrizioni esplicative, metadati |
| **Border & Hairline** | **Architectural Line** | `#E5E5E5` | `--border-light` | Divisori sottili `1px solid`, griglie pulite senza ombre pesanti |
| **Functional Live Dot** | **Signal Green (Solo Stato)** | `#10B981` | `--status-ok` | Usato *esclusivamente* per il pallino `8px` di stato attivo o conferma completata |

---

## 4. Sistema Tipografico & Bottoni Pill

1. **Display Headline (`H1`, `H2`, Numeri Giganti):**
   - Font: `'Barlow Condensed'`, `'Oswald'` o `'Helvetica Neue Condensed Black'` (`font-weight: 800 / 900`).
   - Stile: `text-transform: uppercase`, `letter-spacing: -0.03em`, `line-height: 0.95`.
   - Dimensioni: H1 Hero `clamp(3.2rem, 6vw, 5.2rem)`; H2 Sezione `clamp(2.2rem, 4vw, 3.4rem)`.
2. **Body & UI Copy:**
   - Font: `'Inter'`, `'Helvetica Neue'`, sans-serif (`font-weight: 400, 500, 600`).
   - Pulito, diretto, frasi brevi di massimo 18 parole.
3. **Bottoni (100% Pill-Shaped):**
   - `border-radius: 999px`, `padding: 14px 28px`, `font-weight: 600`, `font-size: 0.95rem`.
   - Primario su chiaro: `background: #111111; color: #FFFFFF;` (hover `#333333`).
   - Secondario su chiaro: `background: transparent; color: #111111; border: 1.5px solid #CACACB;` (hover `border-color: #111111`).

---

## 5. Architettura Narrativa dei 3 Use Case Semplificati

Per garantire comprensione istantanea anche a chi non è un tecnico IT, i 3 pilastri di Footlink vengono presentati come **3 esperienze visive immediate**:

1. **Use Case 01 — "1 Prodotto in Vendita → N Laboratori in Produzione":**
   - *Sinistra (Showroom / Vendita):* 1 solo modello commerciale (foto, nome, prezzo, codice unico).
   - *Destra (Fabbrica / Distretti):* Scelta rapida tra Lotto A (es. Marche) e Lotto B (es. Veneto) e visualizzazione chiara dei **3 Livelli della Distinta Base**:
     - **Livello 1:** Le Parti del Prodotto (es. Tomaia finita + Fondo).
     - **Livello 2:** I Materiali Scelti (es. Pelle Vitello + Fodera + Suola).
     - **Livello 3:** Lotti Reali e Certificazioni (es. Lotto Conceria certificato).
2. **Use Case 02 — "Passaporto Digitale UE & QR Code in 1 Clic":**
   - *Sinistra:* Selettore prodotto + **Cartellino Fisico con QR Code SVG cliccabile**.
   - *Destra:* **Schermo dello Smartphone** che mostra i 4 dati essenziali che chiunque capisce in 3 secondi: *1. Dove è stato fatto*, *2. Materiali e Certificazioni*, *3. Impatto Ambientale*, *4. Riparabilità e Autenticità*.
3. **Use Case 03 — "Connessione Laboratori & Reparti Esterni (`Dal Laboratorio al Brand. In Tempo Reale.`)":**
   - Portale mobile gratuito per i laboratori partner (`Accesso Partner Gratuito`) articolato in 3 fasi guidate:
     - **Fase 1:** Selezione Reparto e Lavorazione (Taglio / Orlatura / Montaggio)
     - **Fase 2:** Validazione Lotto Materiale (1 tocco sul lotto certificato associato dal Brand)
     - **Fase 3:** Conferma Fine Lavorazione → notifica in tempo reale al Brand e aggiornamento automatico del Passaporto Digitale UE.
