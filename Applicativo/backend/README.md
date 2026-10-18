# Footlink Core Backend (Python / FastAPI / PostgreSQL)

Core API and Domain Engine for **Footlink**, implementing the architecture formalized in [`ADR-002`](../adr/ADR-002-core-architecture-free-tier.md).

## Core Domain Capabilities
1. **`1 Articolo PIM ↔ N Articoli PLM`:** Full separation and native synchronization between commercial omnichannel catalog items (`PimCommercialItem`) and factory-level technical variants (`PlmProductionVariant`).
2. **Multi-Level Bill of Materials (`BomItem`):** Hierarchical tracking of raw materials, components, net consumption, waste percentage, country of origin, and sustainability certifications (LWG, REACH, GRS).
3. **"Zero-Training Subcontractor" (`SubcontractorAssignment`):** 0 € subcontractor portal integration for lot and production phase confirmation across Italian fashion districts.
4. **EU Digital Product Passport (`DigitalProductPassport`):** Dynamic aggregation of commercial and factory data into an ESPR-compliant DPP payload with public QR URL.

## Quick Start (Local & Free-Tier)

```bash
cd backend
pip install -r requirements.txt
pytest -v
uvicorn app.main:app --reload --port 8000
```

Interactive OpenAPI 3.1 documentation is automatically served at `http://localhost:8000/docs`.
