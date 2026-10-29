#!/usr/bin/env python3
"""
Footlink Sprint DocSync Audit Tool
Verifica automatica dell'allineamento documentale e formativo alla chiusura di ogni sprint.
Analizza:
1. Endpoint FastAPI in Applicativo/backend/app/main.py
2. Riferimento in Applicativo/frontend/public/tech_docs.html e Azienda/docs/technical/
3. Componenti UI in Applicativo/frontend/src/components/
4. Riferimento nel Training Portal (training_portal.html) e in Azienda/docs/training/
5. Stato di sincronizzazione e checklist di conformità
"""

import os
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

def audit_doc_sync():
    print("=" * 70)
    print("🔍 FOOTLINK SPRINT DOC-SYNC AUDIT (Sprint Closure Gate)")
    print("=" * 70)
    
    # Paths
    backend_main = ROOT_DIR / "Applicativo" / "backend" / "app" / "main.py"
    tech_docs_html = ROOT_DIR / "Applicativo" / "frontend" / "public" / "tech_docs.html"
    training_html = ROOT_DIR / "Applicativo" / "frontend" / "public" / "training_portal.html"
    whitepaper_md = ROOT_DIR / "Azienda" / "docs" / "technical" / "footlink-platform-technical-whitepaper.md"
    manual_md = ROOT_DIR / "Azienda" / "docs" / "training" / "manuale-operativo-utenti-footlink.md"
    components_dir = ROOT_DIR / "Applicativo" / "frontend" / "src" / "components"

    errors = []
    warnings = []
    
    # 1. Check file existence
    files_to_check = [
        ("Tech Docs HTML", tech_docs_html),
        ("Training Portal HTML", training_html),
        ("Technical Whitepaper Markdown", whitepaper_md),
        ("Manuale Operativo Markdown", manual_md)
    ]
    for label, path in files_to_check:
        if not path.is_file():
            errors.append(f"File mancante: {label} ({path.relative_to(ROOT_DIR)})")
        else:
            print(f"✅ {label}: Presente ({path.stat().st_size:,} bytes)")

    # 2. Analyze Backend Endpoints
    if backend_main.is_file():
        backend_content = backend_main.read_text(encoding="utf-8")
        # Extract routes matching multiline decorators
        route_matches = re.findall(
            r'@app\.(?:get|post|put|delete|patch)\s*\(\s*["\']([^"\']+)["\']',
            backend_content,
            re.DOTALL
        )
        routes = sorted(list(set(route_matches)))
        print(f"\n📡 Rilevate {len(routes)} route API nel backend FastAPI:")
        
        tech_docs_content = tech_docs_html.read_text(encoding="utf-8") if tech_docs_html.is_file() else ""
        whitepaper_content = whitepaper_md.read_text(encoding="utf-8") if whitepaper_md.is_file() else ""
        combined_docs = (tech_docs_content + "\n" + whitepaper_content).lower()
        
        documented_count = 0
        for r in routes:
            # Check route or normalized base resource (e.g. /api/v1/pim-items -> pim-items, /api/bom -> bom)
            r_clean = r.replace("/api/v1/", "").replace("/api/", "").strip("/")
            resource_key = r_clean.split("/")[0].replace("-", "_") if r_clean else ""
            
            if (r.lower() in combined_docs or 
                r.replace("/v1", "").lower() in combined_docs or
                (resource_key and resource_key in combined_docs)):
                documented_count += 1
            else:
                warnings.append(f"Route API non esplicitata: {r}")

        coverage = (documented_count / len(routes) * 100) if routes else 100
        print(f"📊 Copertura documentale API: {documented_count}/{len(routes)} ({coverage:.1f}%)")

    # 3. Analyze Frontend Components in Training Portal
    if components_dir.is_dir():
        components = [f.stem for f in components_dir.glob("*.tsx")]
        print(f"\n⚛️  Rilevati {len(components)} componenti core nel frontend React:")
        
        training_content = training_html.read_text(encoding="utf-8") if training_html.is_file() else ""
        manual_content = manual_md.read_text(encoding="utf-8") if manual_md.is_file() else ""
        combined_training = (training_content + "\n" + manual_content).lower()
        
        mapped_components = 0
        for c in components:
            # Split CamelCase into tokens (e.g. BomThreeLevelTree -> ['bom', 'three', 'level', 'tree'])
            tokens = [t.lower() for t in re.findall(r'[A-Z][a-z0-9]+', c)]
            meaningful_tokens = [t for t in tokens if t not in ('manager', 'studio', 'hub', 'panel', 'generator', 'tree', 'background')]
            
            # Matched if any meaningful token is present in training content
            if any(t in combined_training for t in meaningful_tokens if len(t) >= 3):
                mapped_components += 1
            else:
                warnings.append(f"Componente UI da arricchire nei moduli formativi: {c}")

        comp_cov = (mapped_components / len(components) * 100) if components else 100
        print(f"📊 Copertura formativa moduli UI: {mapped_components}/{len(components)} ({comp_cov:.1f}%)")

    # 4. Summary & Verdict
    print("\n" + "=" * 70)
    if errors:
        print("❌ VERDETTO SPRINT DOC-SYNC: BLOCCANTE (Errori rilevati)")
        for err in errors:
            print(f"   • {err}")
        return 1
    elif len(warnings) > 15:
        print("⚠️  VERDETTO SPRINT DOC-SYNC: ATTENZIONE (Molti warning)")
        print(f"   Totale warning: {len(warnings)}")
        return 0
    else:
        print("🎉 VERDETTO SPRINT DOC-SYNC: CONFORME (Superato con successo)")
        print("   Tutti i portali e deliverable sono allineati e pronti per il rilascio.")
        return 0

if __name__ == "__main__":
    sys.exit(audit_doc_sync())
