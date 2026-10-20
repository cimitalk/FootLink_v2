# Footlink — DAM Styleguide & Visual Token Cheat Sheet (Sprint 7 / FTL-MKT-007)

Questo documento sintetizza le direttive visive ufficiali per tutte le campagne adv, social media, newsletter ed export grafici dell'archivio DAM.

---

## 1. Palette Cromatica Ufficiale & Gradienti

| Ruolo Grafico | Nome Token | HEX | RGB | Utilizzo Obbligatorio |
| :--- | :--- | :--- | :--- | :--- |
| **Sfondo Assoluto** | **Pitch Deep Black** | `#0A0A0A` | `rgb(10, 10, 10)` | Sfondo principale canvas, card hero, banner display |
| **Superficie Secondaria** | **Dark Charcoal** | `#141414` | `rgb(20, 20, 20)` | Card contenitori, modal, box telemetrici |
| **Linea Architettonica** | **Subtle Border** | `#222222` | `rgb(34, 34, 34)` | Bordi sottili 1px, reticoli griglia |
| **Accento Luminous #1** | **Emerald Neon Wave** | `#00FF87` | `rgb(0, 255, 135)` | Onde primarie, coordinate [X, Y], badge attivi, glow radar |
| **Accento Luminous #2** | **Ruby Core Wave** | `#FF3366` | `rgb(255, 51, 102)` | Onde secondarie armoniche, alert Passaporto DPP, badge Trend |
| **Testo Display / Primario**| **Optic Pure White** | `#FFFFFF` | `rgb(255, 255, 255)`| Titoli H1, wordmark Footlink, cifre KPI |
| **Testo Telemetria / Muted** | **Telemetry Grey** | `#707072` | `rgb(112, 112, 114)`| Etichette tecniche, gradi angolari $\theta$, copyright |

---

## 2. HUD Telemetry & Regola dei Numeri Rotanti (Banner Hero Style)

Per tutte le composizioni adv e social che richiamano il banner Hero della Home:
- **Font Telemetria:** `'JetBrains Mono', 'SF Mono', Menlo, monospace`, peso 700.
- **Reticolo Orbitale:** Cerchio tratteggiato `stroke-dasharray="2 3"`, raggio tra 15px e 24px, spessore 0.8px in `#00FF87` o `#FF3366`.
- **Coordinate [X, Y]:** Sempre formattate con `[X:342 Y:189]`, visualizzate lungo il vettore di rotazione con un tick crosshair di puntamento.
- **Badge Angolare:** `\theta: 142°` in posizione diametralmente opposta sull'orbita.
- **Blending Mode:** `mix-blend-mode: screen` o `globalCompositeOperation = "screen"` su fondo nero profondo per preservare la luminosità senza saturare le etichette.

---

## 3. Tipografia Pubblicitaria & Titoli Display

- **Titoli Principali (H1 / Billboard):** `Inter` o `Barlow Condensed` con `font-weight: 900`, `letter-spacing: -0.04em`, maiuscolo compatto.
- **Copy Tecnico di Supporto:** `font-weight: 500 / 600`, interlinea ariosa (1.4), mai testo multicolore.
- **Pill Buttons:** `border-radius: 9999px`, padding generoso, sfondo bianco o verde smeraldo `#00FF87` con testo nero `#0A0A0A` per massimo contrasto (standard Nike).
