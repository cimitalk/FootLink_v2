# Audit di Conformità GDPR, Data Protection Agreement (DPA) di Filiera e Segregazione Multi-Tenant Dati Riservati L6

- **Documento ID:** `GOV-AUDIT-GDPR-L6-2026-10-19`
- **Task di Riferimento:** [`FTL-GOV-004`](../../tasks/FTL-GOV-004.json)
- **Autore:** Chief Governance Officer (`footlink-cgo`)
- **Approvato da:** CEO (`footlink-ceo`)
- **Riferimenti Normativi:** Regolamento UE 2016/679 (GDPR), Regolamento UE 2024/1781 (ESPR), [`ADR-006`](../../adr/ADR-006-unified-design-system-and-l6-cost-segregation.md), [Manifesto di Fondazione v1.1](../../Manifesto_Fondazione_Footlink.md) (Sezione 6.3 - Livello L6)
- **Data:** 19 Ottobre 2026
- **Stato:** Approvato (Operativo per i Design Partner Pilota)

---

## 1. Obiettivo dell'Audit e Contesto Operativo

In preparazione all'onboarding dei primi **3 Design Partner industriali** e dei rispettivi laboratori terzisti nei distretti italiani (Marche, Toscana, Veneto), il CGO ha condotto un audit formale di conformità su due fronti critici:
1. **Conformità Privacy & GDPR (Reg. UE 2016/679):** Definizione della ripartizione dei ruoli di trattamento dati tra Footlink S.r.l. (Responsabile del Trattamento ex art. 28 GDPR), il Brand committente o PMI manifatturiera (Titolare del Trattamento) e i laboratori terzisti/façonisti autorizzati.
2. **Segregazione Rigorosa dei Dati Industriali Riservati (Livello L6):** Garanzia crittografica e applicativa che le distinte base (BOM), i prezzi wholesale/retail, i costi unitari di acquisto delle materie prime e i costi orari di manodopera siano confinati esclusivamente al tenant del Brand/PMI e **mai esposti ai façonisti a 0 € o al consumatore finale nel Passaporto Digitale del Prodotto (DPP UE)**.

---

## 2. Matrice di Segregazione Dati Industriali L6 (`Brand/PMI` vs `Terzista 0 €` vs `Pubblico DPP`)

In conformità ad [`ADR-006`](../../adr/ADR-006-unified-design-system-and-l6-cost-segregation.md), la piattaforma applica i seguenti vincoli di accesso a livello di schema database, endpoint API e interfaccia grafica:

| Categoria Dato | Campo / Payload API | Visibilità Brand / PMI (`BRAND_ADMIN`) | Visibilità Terzista 0 € (`SUBCONTRACTOR_FREE_TIER`) | Visibilità Passaporto DPP (`PUBLIC_CONSUMER`) | Meccanismo di Segregazione Tecnico |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Identificativi Master** | `brand_name`, `product_name`, `master_sku`, `hs_code` | ✅ Visibile | ✅ Visibile | ✅ Visibile | Pubblico per tracciabilità filiera |
| **Specifiche Tecniche Verticali** | `last_code`, `heel_code`, `construction_type`, `care_instructions` | ✅ Visibile | ✅ Visibile | ✅ Visibile | Parametri tecnici indispensabili per la lavorazione |
| **Distinta Base (BOM 3 Livelli)** | Codici materiali, componenti tomaia/fondo, spessori | ✅ Visibile | ✅ Visibile | ⚠️ Solo composizione % fibre/pelle | Filtraggio selettivo attributi sensibili nel serializer |
| **Consumi & Scala Taglie** | `consumption_gross`, `size_grading_matrix` | ✅ Visibile | ✅ Visibile | ❌ Oscurato | Limitato all'officina di produzione |
| **Costi Unitari Materiali** | `unit_cost_eur`, `total_row_cost_eur` | ✅ Visibile | 🔒 **Oscurato (`L6`)** | 🔒 **Oscurato (`L6`)** | Rimosso alla fonte nei serializer FastAPI (`exclude={"unit_cost_eur"}`) |
| **Costi Manodopera Terzista** | `labor_cost_eur`, `cost_per_pair_eur` | ✅ Visibile | 🔒 **Oscurato (`L6`)** | 🔒 **Oscurato (`L6`)** | Mascherato con placeholder `••• L6 Hidden` |
| **Prezzi Commerciali PIM** | `wholesale_price_eur`, `retail_price_eur`, `gross_margin` | ✅ Visibile | 🔒 **Oscurato (`L6`)** | ⚠️ Solo Retail Price se abilitato | Totalmente escluso dalle API terzista `/api/v1/subcontractor/*` |
| **Dati di Filiera & Certificazioni** | Certificazioni LWG, OEKO-TEX, GOTS, Paesi di lavorazione | ✅ Visibile | ✅ Visibile | ✅ Visibile | Tracciabilità obbligatoria Reg. UE 2024/1781 (ESPR) |

---

## 3. Accordo Quadro per il Trattamento dei Dati (DPA — Data Protection Agreement ex Art. 28 GDPR)

Di seguito la clausola standard vincolante inclusa negli accordi di sperimentazione pilota (LOI / Design Partner):

```markdown
### ALLEGATO DPA — TRATTAMENTO DATI PERSONALI E DI FILIERA
Tra:
1. FOOTLINK S.R.L. (in costituzione), con sede legale in Italia ("Responsabile del Trattamento");
2. L'AZIENDA DESIGN PARTNER ("Titolare del Trattamento").

1. Oggetto e Durata del Trattamento:
   Footlink tratterà i dati anagrafici e operativi conferiti dal Titolare (inclusi nominativi di referenti di reparto,
   numeri telefonici dei laboratori terzisti per l'invio di Magic Link di lavorazione e codici identificativi di lotto)
   esclusivamente per l'erogazione della piattaforma SaaS e la generazione del Passaporto Digitale del Prodotto (DPP UE).

2. Misure di Sicurezza Tecniche e Organizzative:
   - Crittografia dei dati in transito (TLS 1.3) e a riposo (AES-256 su PostgreSQL).
   - Segregazione logica e multi-tenant dei dati industriali: nessuna informazione relativa a distinte base, costi,
     fornitori o formulazioni tecniche sarà accessibile ad altri utenti o terzisti al di fuori di quelli espressamente
     autorizzati dal Titolare.
   - Autenticazione crittografica sicura tramite Magic Link a scadenza determinata per gli accessi dei façonisti da smartphone.

3. Diritti del Titolare:
   Il Titolare mantiene la piena ed esclusiva proprietà intellettuale su tutti i dati industriali e commerciali inseriti.
   I dati possono essere esportati in qualsiasi momento in formato aperto (JSON/CSV) o cancellati su richiesta scritta.
```

---

## 4. Checklist di Pre-Deploy di Sicurezza per il Team Tecnico (CTO)

- [x] **Zero Esposizione Costi:** Verificato che la vista terzista e gli endpoint pubblici non serializzino chiavi relative a costi (`test_main.py` include asserzione `assert "unit_cost" not in subcontractor_payload`).
- [x] **Magic Link a Scadenza:** I token di invito mobile per i terzisti hanno durata massima prefissata e sono revocabili in 1 clic dalla dashboard del Brand.
- [x] **Audit Log Modifiche:** Ogni conferma fase o dichiarazione di lotto ricevuta da terzista traccia timestamp ISO, identificativo commessa e hash dell'operazione.
- [x] **Conformità Open Source & Free-Tier:** Nessun dato privato è memorizzato o transitato su servizi terzi non conformi o server situati al di fuori dello Spazio Economico Europeo (SEE).

---

## 5. Conclusioni e Via Libera CGO

Il Chief Governance Officer attesta che l'architettura attuale di Footlink rispetta integralmente i requisiti del Regolamento Generale sulla Protezione dei Dati (GDPR) e i vincoli di riservatezza industriale **Livello L6**.

Si rilascia **Parere Favorevole** per l'avvio della fase di sperimentazione con i Design Partner nei distretti italiani.
