# Footlink — Dynamic Industrial Costing & Margin Simulator Specification
## Sprint 9 Deliverable · FTL-REV-008 · Chief Revenue Officer (CRO)
**Documento di Riferimento:** [ADR-017](../../adr/ADR-017-materials-catalog-bom-picker-bulk-swap-and-cross-module-ergonomics.md) · [PRD-010](../prd/PRD-010-sprint-9-materials-catalog-bom-picker-and-cross-module-ergonomics.md)  
**Data di Approvazione:** 2026-10-29  
**Classificazione Riservatezza:** Presidio di Sicurezza L6 (Riservato Brand / PMI Owner)

---

## 1. Executive Summary & Razionale FinOps

Nel settore calzaturiero e pellettiero di lusso, il costo di produzione industriale (*Cost of Goods Sold - COGS*) è soggetto a forti oscillazioni dovute ai prezzi dei pellami conciati al vegetale o minerale LWG, alle minuterie in ottone galvanizzato e all'aumento delle tariffe di façonnage orlato.

In attuazione della direttiva **FTL-REV-008**, il Modulo 02 (Prodotti PLM & Distinta Base BOM) è stato arricchito con il **Simulatore Dinamico dei Costi Industriali e Margini What-If**, che permette al Brand Owner di simulare istantaneamente la redditività wholesale e retail al variare di:
1. Prezzo e consumo delle materie prime BOM;
2. Tariffa oraria/paio della manodopera terzista;
3. Spese generali di stabilimento e distretto (Overhead %);
4. Scenario di stress-test inflattivo sui pellami (-20% / +30%).

---

## 2. Formulazione Matematica dei Costi e dei Margini

### 2.1. Costo Materiali Base e Sfridi di Taglio
Per ogni componente $i$ presente nell'albero distinta base (Livelli 1, 2 e 3):
$$Q_{gross, i} = Q_{net, i} \times \left(1 + \frac{\text{WastePct}_i}{100}\right)$$
$$C_{mat} = \sum_{i=1}^{n} \left( Q_{gross, i} \times \text{UnitCost}_i \right)$$

### 2.2. Costo di Manodopera / Façon Dinamico
Il Brand Owner può configurare il costo base di montaggio, orlatura e finissaggio:
$$C_{labor} = \text{CustomLaborCost}$$ *(default: standard_labor_cost_eur della variante, es. 29.50 €)*

### 2.3. Spese Generali & Overhead Industriale
Le spese generali includono ammortamento forme e fustelle, logistica distrettuale ed energia:
$$\text{Overhead}_{EUR} = (C_{mat} + C_{labor}) \times \frac{\text{OverheadPct}}{100}$$
*(Preset selezionabili: 0%, 8%, 10%, 12%, 15% — default: 10%)*

### 2.4. Costo Industriale Totale
$$C_{ind} = C_{mat\_adj} + C_{labor} + \text{Overhead}_{EUR}$$
dove $C_{mat\_adj} = C_{mat} \times (1 + \frac{\Delta_{WhatIf}}{100})$.

---

## 3. Simulatori di Redditività Commerciale

### 3.1. Margine B2B Wholesale
Dato il prezzo wholesale all'ingrosso concordato con i retailer ($P_{WS}$):
$$\text{Margine}_{WS} (€) = P_{WS} - C_{ind}$$
$$\text{Margine}_{WS} (\%) = \left(\frac{P_{WS} - C_{ind}}{P_{WS}}\right) \times 100$$
- **Soglia di Sicurezza FinOps:** $\ge 45\%$ per calzatura formale e lusso Made in Italy.

### 3.2. Margine B2C Retail (Netto IVA 22%)
Dato il prezzo di listino al pubblico IVA inclusa ($P_{Retail}$):
$$P_{Net\_Retail} = \frac{P_{Retail}}{1.22}$$
$$\text{Margine}_{Retail} (€) = P_{Net\_Retail} - C_{ind}$$
$$\text{Margine}_{Retail} (\%) = \left(\frac{P_{Net\_Retail} - C_{ind}}{P_{Net\_Retail}}\right) \times 100$$

### 3.3. Moltiplicatore Retail / Markup Industriale
$$M = \frac{P_{Retail}}{C_{ind}}$$
- Target di posizionamento lusso: $3.0\times - 4.5\times$.

---

## 4. What-If Stress Testing (Sensibilità Prezzo Pellami)

Lo slider interattivo consente di testare la resilienza del conto economico:
- **-20% (Efficienza Approvvigionamento):** Acquisto lotti a stock o sinergie consortili.
- **0% (Standard di Distinta Base):** Preventivo base ingegnerizzato.
- **+15% (Aumento Conceria / LWG Gold):** Rincaro materie prime o certificazioni ambientali.
- **+30% (Stress Test Inflattivo / Crisi Supply Chain):** Verifica che il margine wholesale non scenda sotto la soglia critica del 35%.

---

## 5. Matrice di Segregazione Ruoli L6 (Inderogabile)

| Ruolo Utente | Costi Unitari BOM | Costo Manodopera | Costo Industriale | Margini WS/Retail | Simulatore What-If |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Brand / PMI Owner** | ✅ Visibile & Editabile | ✅ Visibile & Editabile | ✅ Calcolato in tempo reale | ✅ Completo | ✅ Attivo |
| **Terzista 0 € (Subcontractor)** | 🔒 Oscurato (0 €) | 🔒 Oscurato | 🔒 Oscurato | 🔒 Oscurato | 🔒 Bloccato (Banner L6) |
| **Consumatore Finale (DPP)** | 🔒 Oscurato | 🔒 Oscurato | 🔒 Oscurato | 🔒 Oscurato | 🔒 Bloccato |
