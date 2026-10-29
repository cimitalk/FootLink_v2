# Footlink Platform — Public Technical Whitepaper & Architecture Reference
**Titolo:** Piattaforma PLM+PIM Distrettuale per Calzature, Pelletteria e Moda  
**Versione Tecnica:** 2.0 (Epoca II)  
**Target:** Solution Architects, Software Engineers, Head of IT, Integration Engineers, CTO, Data Protection Officers  
**Licenza & Riservatezza:** Documentazione Tecnica Pubblica Footlink  

---

## 1. Visione Architetturale e Repository a 3 Pilastri

Footlink è strutturata secondo il paradigma architetturale a **3 Pilastri** formalizzato in [ADR-005](../../adr/ADR-005-repository-three-pillars-restructuring.md):

```text
                               ┌──────────────────────────────────────────────────┐
                               │             GOOGLE ANTIGRAVITY ENGINE            │
                               │           (Autonomous C-Suite Orchestration)     │
                               └─────────────────────────┬────────────────────────┘
                                                         │
             ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
             │                                           │                                           │
             ▼                                           ▼                                           ▼
┌─────────────────────────┐                 ┌─────────────────────────┐                 ┌─────────────────────────┐
│     PILASTRO 1:         │                 │     PILASTRO 2:         │                 │     PILASTRO 3:         │
│     AZIENDA/            │                 │   APPLICATIVO/          │                 │ PORTALE FOUNDER CONTROL │
│                         │                 │                         │                 │                         │
│ • Manifesto Fondazione  │                 │ • FastAPI Backend (Py)  │                 │ • Control Center Web    │
│ • Specifiche C-Level    │                 │ • React 18 + TS Vite    │                 │ • Livelli L0-L6 Triage  │
│ • Registri ADR & Task   │                 │ • PostgreSQL Relational │                 │ • Monitoring Spesa L2   │
│ • Whitepaper & Docs     │                 │ • Multi-tenant Engine   │                 │ • Task State Sync       │
└─────────────────────────┘                 └─────────────────────────┘                 └─────────────────────────┘
```

### 1.1 Stack Tecnologico
- **Backend Core:** Python 3.11+, FastAPI (ASGI Framework asincrono ad alte prestazioni), Pydantic v2 (validazione schemi e serializzazione rigida), SQLAlchemy 2.0 (ORM relazionale asincrono con supporto PostgreSQL e SQLite per test).
- **Frontend SPA:** React 18, TypeScript 5, Vite (build engine ultra-veloce), Tailwind CSS con design token calzaturieri personalizzati, Lucide Icons.
- **Data Persistence:** PostgreSQL 16+ con supporto JSONB per attributi dinamici e indici GIN; migrazioni versionate e compatibilità SQLite per development/testing isolato.
- **Sicurezza & Segregazione:** Header-based tenant validation, RBAC/ABAC multi-ruolo, L6 Multi-tenant Data Segregation Guard.
- **Standard di Tracciabilità:** Regolamento UE ESPR 2024/1781 (Digital Product Passport), specifiche GS1 Digital Link per QR code industriali.

---

## 2. Dominio Dati e Modello Relazionale 1:N PIM/PLM

Il cuore differenziante di Footlink è la risoluzione del disallineamento tra il mondo dello sviluppo prodotto (**PLM**) e il mondo commerciale/vendite (**PIM**).

```
   ┌────────────────────────────────────────────────────────┐
   │                  PIM COMMERCIAL ITEM                   │
   │  SKU: SKU-COM-1002 | Name: Venezia Sneaker Cognac      │
   │  Retail Price: 295.00 € | Channel: Shopify / Farfetch  │
   └───────────────────────────┬────────────────────────────┘
                               │
            1:N Bridge Mapping │ (Multi-sourcing / Stabilimenti)
                               │
             ┌─────────────────┴─────────────────┐
             │                                   │
             ▼                                   ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│   PLM VARIANT 01 (IT)   │         │   PLM VARIANT 02 (PT)   │
│ Code: PLM-SNK-042-IT    │         │ Code: PLM-SNK-042-PT    │
│ Facility: Civitanova M. │         │ Facility: Felgueiras    │
│ Origin: 100% Made in IT │         │ Origin: Made in EU      │
│ Lead Time: 21 giorni    │         │ Lead Time: 35 giorni    │
└────────────┬────────────┘         └────────────┬────────────┘
             │                                   │
             ▼                                   ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│    BOM 3-LEVEL (IT)     │         │    BOM 3-LEVEL (PT)     │
│  Upper: Vitello Pieno   │         │  Upper: Crosta Bovina   │
│  Lining: Vitello Natur  │         │  Lining: Microfibra     │
│  Sole: Gomma Naturale   │         │  Sole: TPU Vulcanizzato │
└─────────────────────────┘         └─────────────────────────┘
```

### 2.1 Entità Fondamentali del Modello Dati
1. **ProductModel:** Definisce l'archetipo formale (codice modello, nome stile, forma/last, categoria, genere, drop, scala taglie).
2. **PlmProductionVariant:** Rappresenta la scheda di ingegnerizzazione industriale. Contiene distinta base, stabilimento, tempi ciclo, costing e note di calzatura.
3. **PimCommercialItem:** Rappresenta l'oggetto commerciabile su canali digitali e fisici (titolo marketing, descrizioni multilingua, bullet points, composizione tessile UE, listini valute, asset multimediali).
4. **PimPlmBridgeMapping:** Tabella di giunzione associativa con metadati di priorità (`is_primary`), allocazione percentuale e regole di routing logistico.
5. **BomItem (Albero a 3 Livelli):**
   - `level = 1`: **Upper (Tomaia)** — pellami primari, inserti, accessori visibili, contrafforte, puntale.
   - `level = 2`: **Lining (Fodera & Accessori)** — pelli di fodera, tessuti tecnici, stringhe, soletta interna.
   - `level = 3`: **Sole (Fondo & Suola)** — soletta di montaggio, cambrione, guardolo, tacco, suola, battistrada.
6. **TanneryBatch & Certificate:** Registro lotti conciari con tracciabilità di provenienza, ID lotto, medaglia LWG (Gold, Silver, Bronze, Audited), codici REACH e data scadenza certificato.
7. **DigitalProductPassport (DPP):** Entità conforme a ESPR con identificativo univoco, payload JSON firmato, hash di integrità e URL GS1 Digital Link.

---

## 3. Sicurezza e Segregazione Multi-Tenant L6

Nel distretto moda, la protezione del know-how e delle tariffe è vitale. Nessun terzista deve poter conoscere le tariffe dei concorrenti o i margini del brand committente.

### 3.1 Architettura del Guard di Segregazione L6
Ogni richiesta API a Footlink attraversa il middleware di segregazione che esamina i contesti di sicurezza:
- `X-Tenant-Id`: Identificativo dell'azienda o del brand proprietario della risorsa.
- `X-User-Role`: Ruolo dell'utente (`admin`, `product_manager`, `designer`, `subcontractor`, `auditor`).
- `X-Vendor-Id`: Quando valorizzato per un utente con ruolo `subcontractor`, interviene il filtro SQL forzato:
  - Solo le righe di `production_orders` e `subcontractor_assignments` con `vendor_id == X-Vendor-Id` vengono restituite.
  - Vengono mascherati i campi `cost_per_pair`, `retail_price`, `total_production_cost` e i dati dei laboratori delle altre fasi.
  - Tentativi di accesso a risorse di terzi restituiscono un codice `HTTP 403 Forbidden` con registrazione nell'Audit Trail di sicurezza.

---

## 4. Specifiche API REST (OpenAPI 3.1 Compliant)

Tutte le API operano con payload JSON e seguono le convenzioni RESTful. Di seguito i principali contratti di interfaccia.

### 4.1 Modulo PLM: Creazione e Lettura Schede Tecniche
- **`GET /api/plm/products`**  
  Restituisce l'elenco delle varianti industriali filtrate per stagione, collezione o stato.
- **`POST /api/plm/products`**  
  Crea una nuova variante PLM.
  ```json
  {
    "model_id": "MOD-SNK-042",
    "variant_code": "PLM-SNK-042-01",
    "name": "Heritage Sneaker Cognac IT",
    "lifecycle_status": "development",
    "target_factory": "Civitanova Marche Plant 1",
    "estimated_cost": 42.50,
    "currency": "EUR"
  }
  ```

### 4.2 Modulo BOM: Gestione Distinta Base a 3 Livelli
- **`GET /api/bom/tree/{variant_id}`**  
  Restituisce l'albero gerarchico della distinta base strutturato nei 3 livelli calzaturieri:
  ```json
  {
    "variant_id": "PLM-SNK-042-01",
    "total_materials_cost": 31.80,
    "levels": {
      "level_1_upper": [
        {
          "component_id": "BOM-001",
          "name": "Vitello Pieno Fiore 1.2-1.4mm",
          "supplier_id": "VEN-TAN-01",
          "supplier_name": "Conceria del Chienti",
          "lwg_status": "gold",
          "net_consumption": 16.5,
          "scrap_percentage": 18.0,
          "gross_consumption": 19.47,
          "unit": "dm2",
          "unit_cost": 0.85
        }
      ],
      "level_2_lining": [...],
      "level_3_sole": [...]
    }
  }
  ```

### 4.3 Modulo PIM & Bridge: Associazione Commerciale 1:N
- **`POST /api/bridge/mappings`**  
  Collega un articolo commerciale PIM a una variante produttiva PLM:
  ```json
  {
    "pim_item_id": "PIM-SKU-9921",
    "plm_variant_id": "PLM-SNK-042-01",
    "is_primary": true,
    "allocation_ratio": 0.70,
    "routing_rule": "domestic_priority"
  }
  ```

### 4.4 Modulo Subcontractor L6 Portal
- **`POST /api/subcontractors/advance-phase`**  
  Avanza lo stato della fase da parte dell'operatore o del laboratorio artigiano:
  ```json
  {
    "order_id": "PO-2026-881",
    "assignment_id": "SUB-ASS-042",
    "phase": "giunteria",
    "new_status": "completed",
    "completed_pairs": 500,
    "anomaly_flag": false,
    "notes": "Lotto terminato e pronto per il montaggio"
  }
  ```

### 4.5 Modulo Digital Product Passport (DPP)
- **`POST /api/dpp/generate`**  
  Elabora i dati della variante e del lotto per creare il passaporto conformità ESPR UE:
  ```json
  {
    "plm_variant_id": "PLM-SNK-042-01",
    "batch_lot_number": "LOT-2026-Q4-001",
    "target_market": "EU_GLOBAL"
  }
  ```
  **Risposta (`HTTP 201 Created`):**
  ```json
  {
    "passport_id": "DPP-882190-FTL",
    "gs1_digital_link": "https://footlink.id/dpp/DPP-882190-FTL",
    "traceability_score": 94.5,
    "reparability_index": "B",
    "lwg_certified_leather_share": 100.0,
    "recyclability_percentage": 32.0,
    "qr_code_svg_url": "/api/dpp/qr/DPP-882190-FTL.svg"
  }
  ```

---

## 5. Pattern di Integrazione ERP ed E-Commerce

```text
  ┌─────────────────┐             ┌──────────────────┐             ┌─────────────────┐
  │   SISTEMI ERP   │             │     PLATFORM     │             │    E-COMMERCE   │
  │ (SAP, Stealth,  │ ── REST ──> │     FOOTLINK     │ ── REST ──> │    & B2B PORTAL │
  │     AS400)      │ <─ Webhook ─│     PLM+PIM      │ <─ Webhook ─│ (Shopify, Joor) │
  └─────────────────┘             └──────────────────┘             └─────────────────┘
```

1. **ERP Synchronization:**
   - Footlink agisce da master per la scheda tecnica, distinta base e passaporto sostenibilità.
   - All'approvazione del campionario, Footlink invia tramite webhook JSON i dati di distinta base pronti per la generazione degli ordini d'acquisto (PO) sull'ERP aziendale.
2. **E-Commerce Sync (Shopify / Magento / Farfetch):**
   - Footlink sincronizza verso lo store digitale il catalogo PIM: titoli, composizioni verificate per etichettatura tessile/calzaturiera UE, schede colore arricchite e il link al Passaporto Digitale DPP da mostrare nella pagina prodotto.

---

## 6. Specifiche di Deployment e Parametri Operativi FinOps

Footlink è progettata per operare con massima efficienza computazionale ("Cost-to-Serve < 0.05 € per modello attivo"):
- **Container Docker:** Immagine Linux Alpine con runtime Python 3.11 ultra-leggero (< 180 MB).
- **Consumo RAM Base:** ~85 MB in idle; < 250 MB sotto carico di 50 richieste concorrenti.
- **Circuit Breaker FinOps:** Monitoraggio dei token e chiamate ai servizi AI per mantenere il margine operativo lordo superiore al 75%.
