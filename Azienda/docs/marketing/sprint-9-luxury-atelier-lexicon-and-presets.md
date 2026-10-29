# Footlink — Luxury Atelier Lexicon & Demo Presets Harmonization
## Sprint 9 Deliverable · FTL-MKT-009 · Chief Marketing Officer (CMO)
**Documento di Riferimento:** [ADR-017](../../adr/ADR-017-materials-catalog-bom-picker-bulk-swap-and-cross-module-ergonomics.md) · [PRD-010](../prd/PRD-010-sprint-9-materials-catalog-bom-picker-and-cross-module-ergonomics.md)  
**Data di Approvazione:** 2026-10-29  
**Obiettivo:** Rafforzamento dell'identità di lusso e artigianalità marchigiana/veneta attraverso un lessico coerente d'atelier e preset industriali pre-caricati.

---

## 1. Visione del CMO: Il Lessico come Vantaggio Competitivo

Nei brand di calzatura e pelletteria d'alta gamma (Made in Italy), la tecnologia non deve sembrare un generico ERP industriale, bensì la naturale estensione digitale dell'Atelier e della modelleria. 
L'adozione del lessico calzaturiero autentico permette a modellisti, responsabili prodotto e façonisti di sentirsi immediatamente a casa, riducendo a zero il tempo di onboarding (*Zero-Training Adoption*).

---

## 2. Tavola di Armonizzazione del Lessico d'Atelier

La piattaforma unifica i termini sia nel frontend sia nei cataloghi PIM/PLM secondo la seguente tassonomia:

| Termine Generico (ERP) | Termine Atelier Footlink | Definizione Modelleria & Storytelling |
| :--- | :--- | :--- |
| **Material / Raw Mat** | **Tirella / Materiale di Cartella** | Pezza campionaria da cartella conceria con finitura, spessore e certificazione. |
| **Sole / Bottom** | **Fondo / Battistrada** | Monoblocco in gomma/EVA o suola in cuoio con guardolo cucito a mano. |
| **Last Code** | **Codice Forma (Last)** | Forma in legno o plastica su cui viene montata la tomaia per dare calzata e silhouette. |
| **Insole** | **Sottopiede / Fusetto di Montaggio** | Elemento strutturale interno su cui poggia il piede e a cui si ancora il guardolo. |
| **Upper Assembly** | **Tomaia Tagliata & Orlata** | Insieme delle pezzature di pellame tagliate (a mano o fustella) e cucite insieme. |
| **Lining** | **Fodera Pieno Fiore Traspirante** | Rivestimento interno a contatto col piede, garantito metal-free o al cromo conforme REACH. |
| **Hardware** | **Minuterie Metalliche & Galvanica** | Morsetti, fibbie, occhielli e zip trattati con finitura galvanica oro chiaro o nichel lucido. |
| **Sample Grading** | **Sviluppo Scala Taglie & Sfrido** | Incremento percentuale dei consumi netti/lordi dalla taglia campione (es. EU 42 / 37). |

---

## 3. Preset Materiali di Lusso Pre-Caricati (Catalogo Sprint 9)

Il catalogo include 13 materiali realistici suddivisi nelle 8 categorie calzaturiere tipiche del Distretto Fermano-Maceratese e della Riviera del Brenta:

1. **Pellami Pregiati (Leather):**
   - *Vitello Pieno Fiore Concia Vegetale LWG Gold* (Conceria del Chienti, 1.3–1.5mm, 42.00 €/m²).
   - *Vitello Crust Scamosciato Idrorepellente* (Conceria Il Ponte, 1.2–1.4mm, 34.50 €/m²).
   - *Nappa Plonge Morbida Mano Seta* (Conceria Montebello, 0.9–1.1mm, 38.00 €/m²).
2. **Fodere (Lining):**
   - *Fodera Vitello Naturale Anallergica Metal-Free* (Conceria del Chienti, 0.8–1.0mm, 21.00 €/m²).
   - *Fodera Capra Scamosciata Antiscivolo* (Conceria Montebello, 0.7–0.9mm, 18.50 €/m²).
3. **Fondi & Suole (Sole Bottom):**
   - *Suola Cuoio Primofiore Liscio Tinto a Mano* (Suolificio Marchigiano, 18.50 €/paio).
   - *Fondo Monoblocco EVA Extralight Battistrada Vibram* (Suolificio Marchigiano, 12.80 €/paio).
4. **Tacchi & Sottotacchi (Heel):**
   - *Tacco Cuoio Fasciato Fresato 25mm* (Tacchettificio Italiano, 4.80 €/paio).
5. **Minuterie Metalliche (Hardware):**
   - *Morsetto Classico Ottone Finitura Oro Chiaro* (Galvanica EcoMarche, 4.20 €/pz).
   - *Fibbia Ottone Satinato Trattamento Anti-Tarnish* (Galvanica EcoMarche, 2.70 €/pz).
6. **Filati (Thread):**
   - *Filato Poliestere Alta Tenacità Titolo 20/3* (Filati Cucirini Adriatica, 7.50 €/cono).
7. **Packaging & Custodia (Packaging):**
   - *Scatola Rigida Fondo & Coperchio Cartone FSC* (Scatolificio del Tronto, 3.20 €/pz).
   - *Pochette Antipolvere Cotone Canvas Organico* (Scatolificio del Tronto, 1.80 €/pz).

---

## 4. Esperienza Utente & Ergonomia Guidata

Grazie al **Guided BOM Material Picker**, il modellista non deve più digitare stringhe manuali o ricordare certificazioni e UoM. Selezionando un articolo dal catalogo:
- La BOM viene compilata istantaneamente con nome tecnico, UoM e fornitore qualificato;
- Se il fornitore ha certificazioni LWG/EUDR scadute, un **alert visivo ambrato/rosso** avvisa prima del lancio in produzione;
- Se un pellame esce di produzione, la funzione **Sostituzione Massiva (Bulk Swap)** consente al Brand di rimpiazzarlo su 10 varianti in due soli clic.
