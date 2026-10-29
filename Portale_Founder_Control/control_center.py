#!/usr/bin/env python3
"""
Footlink Founder Control Center — Web Dashboard & Governance Gatekeeper
Zero external dependencies (Python 3 standard library only).
Reads and updates tasks/*.json, adr/*.md, and docs/**/*.md in real time.
"""

import datetime
import glob
import html
import json
import os
import re
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AZIENDA_DIR = os.path.join(ROOT_DIR, "Azienda")
APPLICATIVO_DIR = os.path.join(ROOT_DIR, "Applicativo")
PORTALE_DIR = os.path.join(ROOT_DIR, "Portale_Founder_Control")

TASKS_DIR = os.path.join(AZIENDA_DIR, "tasks")
ARCHIVE_TASKS_DIR = os.path.join(TASKS_DIR, "archive_epoch_1")
ADR_DIR = os.path.join(AZIENDA_DIR, "adr")
DOCS_DIR = os.path.join(AZIENDA_DIR, "docs")
PORT = int(os.environ.get("FOOTLINK_PORT", "8080"))


def find_task_path(task_id: str) -> str:
    p_active = os.path.join(TASKS_DIR, f"{task_id}.json")
    if os.path.isfile(p_active):
        return p_active
    p_arch = os.path.join(ARCHIVE_TASKS_DIR, f"{task_id}.json")
    if os.path.isfile(p_arch):
        return p_arch
    return p_active


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=2))).isoformat(timespec="seconds")


AGENT_ROLE_MAP = {
    "CEO": "footlink-ceo",
    "CGO": "footlink-cgo",
    "CTO": "footlink-cto",
    "CPO": "footlink-cpo",
    "CRO": "footlink-cro",
    "CMO": "footlink-cmo",
}

PREFIX_MAP = {
    "CEO": "FTL-CEO",
    "CGO": "FTL-GOV",
    "CTO": "FTL-TECH",
    "CPO": "FTL-PROD",
    "CRO": "FTL-REV",
    "CMO": "FTL-MKT",
}

VALID_PRIORITIES = {"critical", "high", "medium", "low"}
VALID_STATUSES = {"backlog", "todo", "in_progress", "review", "done", "blocked", "paused_ai_quota", "cancelled"}
VALID_EFFORTS = {"XS (<2h)", "S (2-8h)", "M (1-3gg)", "L (3-10gg)", "XL (>10gg)"}
VALID_ESCALATIONS = {"L0", "L1", "L2", "L3", "L4", "L5", "L6"}
VALID_TAGS = {"PLM", "PIM", "infra", "governance", "sales", "marketing", "product", "finops"}


def generate_next_task_id(role: str) -> str:
    prefix = PREFIX_MAP.get(role, "FTL-CEO")
    existing = (
        glob.glob(os.path.join(TASKS_DIR, f"{prefix}-*.json"))
        + glob.glob(os.path.join(ARCHIVE_TASKS_DIR, f"{prefix}-*.json"))
    )
    max_num = 0
    for p in existing:
        base = os.path.basename(p)
        m = re.search(rf"^{prefix}-(\d+)\.json$", base)
        if m:
            num = int(m.group(1))
            if num > max_num:
                max_num = num
    next_num = max_num + 1
    return f"{prefix}-{next_num:03d}"


def handle_create_task(payload: dict) -> dict:
    role = payload.get("assignee_role", "CEO").strip()
    if role not in AGENT_ROLE_MAP:
        raise ValueError(f"Ruolo non valido: {role}. Deve essere uno tra {list(AGENT_ROLE_MAP.keys())}")

    title = payload.get("title", "").strip()
    if len(title) < 5:
        raise ValueError("Il titolo deve contenere almeno 5 caratteri.")

    description = payload.get("description", "").strip()
    if len(description) < 10:
        raise ValueError("La descrizione deve contenere almeno 10 caratteri per orientare la C-Suite.")

    priority = payload.get("priority", "high").strip()
    if priority not in VALID_PRIORITIES:
        priority = "high"

    status = payload.get("status", "todo").strip()
    if status not in ("todo", "backlog"):
        status = "todo"

    estimated_effort = payload.get("estimated_effort", "M (1-3gg)").strip()
    if estimated_effort not in VALID_EFFORTS:
        estimated_effort = "M (1-3gg)"

    escalation_level = payload.get("escalation_level", "L2").strip()
    if escalation_level not in VALID_ESCALATIONS:
        escalation_level = "L2"

    raw_criteria = payload.get("acceptance_criteria") or []
    if isinstance(raw_criteria, str):
        criteria = [c.strip().lstrip("-*• ") for c in raw_criteria.split("\n") if c.strip()]
    elif isinstance(raw_criteria, list):
        criteria = [str(c).strip().lstrip("-*• ") for c in raw_criteria if str(c).strip()]
    else:
        criteria = []

    if not criteria:
        criteria = [
            f"Analisi strategica e scomposizione organizzativa da parte del ruolo {role}",
            "Definizione dei deliverable e attribuzione delle dipendenze C-Suite",
            "Conferma di conformità FinOps e chiusura del task nel Founder Control Center"
        ]

    raw_tags = payload.get("tags") or []
    if isinstance(raw_tags, list):
        tags = [t for t in raw_tags if t in VALID_TAGS]
    else:
        tags = []
    if not tags:
        default_role_tags = {
            "CEO": ["governance", "product"],
            "CGO": ["governance"],
            "CTO": ["infra", "product"],
            "CPO": ["product", "PLM"],
            "CRO": ["finops"],
            "CMO": ["marketing", "sales"],
        }
        tags = default_role_tags.get(role, ["governance"])

    notes = payload.get("notes", "").strip()
    now_str = now_iso()
    combined_notes = notes if notes else f"Iniziativa inserita dal Founder nel Control Center per triage e strutturazione {role}."

    task_id = generate_next_task_id(role)
    assignee_agent = AGENT_ROLE_MAP[role]
    requires_escalation = escalation_level != "L0"
    esc_reason = f"Direttiva Founder ({escalation_level}) — Richiede triage e strutturazione C-Suite" if requires_escalation else None

    # Calculate default due date ~ 30 days ahead
    due_date = (datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=2))) + datetime.timedelta(days=30)).strftime("%Y-%m-%dT23:59:59+02:00")

    task_object = {
        "task_id": task_id,
        "title": title,
        "description": description,
        "status": status,
        "priority": priority,
        "assignee_role": role,
        "assignee_agent": assignee_agent,
        "created_by": "Founder (Control Center)",
        "created_at": now_str,
        "updated_at": now_str,
        "due_date": due_date,
        "estimated_effort": estimated_effort,
        "actual_effort": None,
        "dependencies": [],
        "blocked_by": [],
        "output_artifacts": [],
        "requires_escalation": requires_escalation,
        "escalation_reason": esc_reason,
        "escalation_level": escalation_level,
        "decision_record_id": None,
        "tags": tags,
        "acceptance_criteria": criteria,
        "notes": combined_notes,
    }

    save_task(task_object)
    sync_dependencies_and_readme()
    return task_object


def load_single_task(task_id: str) -> dict:
    path = find_task_path(task_id)
    if os.path.isfile(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["_file"] = os.path.basename(path)
                data["_rel_path"] = os.path.relpath(path, ROOT_DIR)
                return data
        except Exception:
            pass
    return None


def handle_edit_task(payload: dict) -> dict:
    task_id = payload.get("task_id", "").strip()
    if not task_id:
        raise ValueError("Task ID mancante.")

    path = find_task_path(task_id)
    if not os.path.isfile(path):
        raise ValueError(f"Task non trovato su disco: {task_id}")

    with open(path, "r", encoding="utf-8") as f:
        task_data = json.load(f)

    if "title" in payload:
        title = payload["title"].strip()
        if len(title) < 5:
            raise ValueError("Il titolo deve contenere almeno 5 caratteri.")
        task_data["title"] = title

    if "description" in payload:
        desc = payload["description"].strip()
        if len(desc) < 10:
            raise ValueError("La descrizione deve contenere almeno 10 caratteri.")
        task_data["description"] = desc

    if "assignee_role" in payload:
        role = payload["assignee_role"].strip()
        if role in AGENT_ROLE_MAP:
            task_data["assignee_role"] = role
            task_data["assignee_agent"] = AGENT_ROLE_MAP[role]

    if "priority" in payload and payload["priority"] in VALID_PRIORITIES:
        task_data["priority"] = payload["priority"]

    if "status" in payload and payload["status"] in VALID_STATUSES:
        task_data["status"] = payload["status"]
        if task_data["status"] == "done" and not task_data.get("actual_effort"):
            task_data["actual_effort"] = "Completed & Approved by Founder"

    if "estimated_effort" in payload and payload["estimated_effort"] in VALID_EFFORTS:
        task_data["estimated_effort"] = payload["estimated_effort"]

    if "escalation_level" in payload and payload["escalation_level"] in VALID_ESCALATIONS:
        task_data["escalation_level"] = payload["escalation_level"]
        task_data["requires_escalation"] = payload["escalation_level"] != "L0"
        if task_data["requires_escalation"] and not task_data.get("escalation_reason"):
            task_data["escalation_reason"] = f"Escalation {task_data['escalation_level']} — Richiede approvazione Founder"
        elif not task_data["requires_escalation"]:
            task_data["escalation_reason"] = None

    if "acceptance_criteria" in payload:
        raw_c = payload["acceptance_criteria"]
        if isinstance(raw_c, str):
            criteria = [c.strip().lstrip("-*• ") for c in raw_c.split("\n") if c.strip()]
        elif isinstance(raw_c, list):
            criteria = [str(c).strip().lstrip("-*• ") for c in raw_c if str(c).strip()]
        else:
            criteria = []
        task_data["acceptance_criteria"] = criteria

    if "tags" in payload:
        raw_tags = payload["tags"]
        if isinstance(raw_tags, list):
            task_data["tags"] = [t for t in raw_tags if t in VALID_TAGS]

    if "notes" in payload:
        task_data["notes"] = payload["notes"].strip() if payload["notes"] else None

    save_task(task_data)
    sync_dependencies_and_readme()
    reloaded = load_single_task(task_id)
    return reloaded if reloaded else task_data



def load_tasks():
    tasks = []
    all_task_paths = sorted(
        glob.glob(os.path.join(TASKS_DIR, "FTL-*.json"))
        + glob.glob(os.path.join(ARCHIVE_TASKS_DIR, "FTL-*.json"))
    )
    for path in all_task_paths:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["_file"] = os.path.basename(path)
                data["_rel_path"] = os.path.relpath(path, ROOT_DIR)
                tasks.append(data)
        except Exception as e:
            print(f"Error loading {path}: {e}")
    order = [
        # EPOCA II - Sprint 8 (La Ripartenza & La Verticalizzazione)
        "FTL-CEO-017",
        "FTL-CEO-018",
        "FTL-CEO-019",
        "FTL-GOV-008",
        "FTL-PROD-012",
        "FTL-TECH-021",
        "FTL-REV-007",
        "FTL-MKT-008",
        "FTL-TECH-022",
        "FTL-TECH-023",
        "FTL-PROD-013",
        # EPOCA I - Sprint 1 (Bootstrap C-Suite)
        "FTL-GOV-001",
        "FTL-CEO-001",
        "FTL-TECH-001",
        "FTL-PROD-001",
        "FTL-REV-001",
        "FTL-MKT-001",
        # EPOCA I - Sprint 2 (Three-Pillars Architecture, Full-Stack & GTM Execution)
        "FTL-GOV-002",
        "FTL-CEO-002",
        "FTL-PROD-002",
        "FTL-TECH-002",
        "FTL-TECH-003",
        "FTL-MKT-002",
        "FTL-REV-002",
        # EPOCA I - Sprint 3 (Design System v2.0, Home Hub & Core Process Convergence)
        "FTL-GOV-003",
        "FTL-CEO-003",
        "FTL-PROD-003",
        "FTL-TECH-004",
        # EPOCA I - Sprint 4 (Districts Pilot Onboarding, Zero-Training Mobile, Free-Tier Cloud Deploy)
        "FTL-CEO-004",
        "FTL-GOV-004",
        "FTL-REV-003",
        "FTL-MKT-003",
        "FTL-PROD-004",
        "FTL-TECH-005",
        # EPOCA I - Sprint 5 (Flexible Data Model, Seasons & Collections, Domain Registries, UI Simplification)
        "FTL-CEO-005",
        "FTL-GOV-005",
        "FTL-PROD-005",
        "FTL-TECH-006",
        "FTL-REV-004",
        "FTL-MKT-004",
        "FTL-CEO-006",
        "FTL-CEO-007",
        # EPOCA I - Sprint 6 (District PaaS 3 Tier, Tannery Vault SHA-256, PLM/PIM Split)
        "FTL-CEO-008",
        "FTL-GOV-006",
        "FTL-PROD-006",
        "FTL-TECH-007",
        "FTL-REV-005",
        "FTL-MKT-005",
        "FTL-CEO-009",
        "FTL-CEO-010",
        "FTL-CEO-011",
        "FTL-CEO-012",
        "FTL-PROD-007",
        "FTL-PROD-008",
        "FTL-PROD-009",
        "FTL-TECH-008",
        "FTL-TECH-009",
        "FTL-TECH-010",
        "FTL-TECH-011",
        # EPOCA I - Sprint 7 (Multilevel Taxonomy, Bulk Import, BOM Drag&Drop/Duplicate, DAM, Codebase Analytics)
        "FTL-CEO-013",
        "FTL-GOV-007",
        "FTL-PROD-010",
        "FTL-TECH-012",
        "FTL-REV-006",
        "FTL-MKT-006",
        "FTL-TECH-013",
        "FTL-PROD-011",
        "FTL-CEO-014",
        "FTL-CEO-015",
        "FTL-TECH-014",
        "FTL-TECH-015",
        "FTL-TECH-016",
        "FTL-CEO-016",
        "FTL-MKT-007",
        "FTL-TECH-017",
        "FTL-TECH-018",
        "FTL-TECH-019",
        "FTL-TECH-020",
    ]
    tasks.sort(key=lambda t: (order.index(t["task_id"]) if t.get("task_id") in order else 999, t.get("task_id", "")))
    return tasks


def save_task(task_data):
    task_id = task_data["task_id"]
    path = find_task_path(task_id)
    clean = {k: v for k, v in task_data.items() if not k.startswith("_")}
    clean["updated_at"] = now_iso()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(clean, f, indent=2, ensure_ascii=False)
        f.write("\n")


def sync_dependencies_and_readme():
    tasks = load_tasks()
    done_ids = {t["task_id"] for t in tasks if t.get("status") == "done"}

    for t in tasks:
        row_changed = False
        if t.get("status") in ("backlog", "todo", "blocked"):
            old_blocked = list(t.get("blocked_by") or [])
            new_blocked = [b for b in old_blocked if b not in done_ids]
            if new_blocked != old_blocked:
                t["blocked_by"] = new_blocked
                row_changed = True
            deps = t.get("dependencies") or []
            if deps and all(d in done_ids for d in deps) and not t["blocked_by"] and t.get("status") == "backlog":
                t["status"] = "todo"
                row_changed = True
            if row_changed:
                save_task(t)

    tasks = load_tasks()
    status_badges = {
        "done": "✅ `done`",
        "in_progress": "🔄 `in_progress`",
        "review": "🟣 `review` (Attesa Founder)",
        "todo": "🟢 `todo`",
        "backlog": "📥 `backlog`",
        "blocked": "🔴 `blocked`",
        "paused_ai_quota": "⏸️ `paused_ai_quota`",
        "cancelled": "⚪ `cancelled`",
    }
    prio_badges = {
        "critical": "🔴 `critical`",
        "high": "🟠 `high`",
        "medium": "🟡 `medium`",
        "low": "🔵 `low`",
    }

    sprint1_ids = {"FTL-GOV-001", "FTL-CEO-001", "FTL-TECH-001", "FTL-PROD-001", "FTL-REV-001", "FTL-MKT-001"}
    sprint2_ids = {"FTL-GOV-002", "FTL-CEO-002", "FTL-PROD-002", "FTL-TECH-002", "FTL-TECH-003", "FTL-MKT-002", "FTL-REV-002"}
    sprint3_ids = {"FTL-GOV-003", "FTL-CEO-003", "FTL-PROD-003", "FTL-TECH-004"}
    sprint4_ids = {"FTL-CEO-004", "FTL-GOV-004", "FTL-REV-003", "FTL-MKT-003", "FTL-PROD-004", "FTL-TECH-005"}
    sprint5_ids = {"FTL-CEO-005", "FTL-GOV-005", "FTL-PROD-005", "FTL-TECH-006", "FTL-REV-004", "FTL-MKT-004", "FTL-CEO-006", "FTL-CEO-007"}
    sprint6_ids = {
        "FTL-CEO-008", "FTL-GOV-006", "FTL-PROD-006", "FTL-TECH-007", "FTL-REV-005", "FTL-MKT-005",
        "FTL-CEO-009", "FTL-CEO-010", "FTL-CEO-011", "FTL-CEO-012", "FTL-PROD-007",
        "FTL-PROD-008", "FTL-PROD-009", "FTL-TECH-008", "FTL-TECH-009", "FTL-TECH-010", "FTL-TECH-011"
    }
    sprint7_ids = {
        "FTL-CEO-013", "FTL-GOV-007", "FTL-PROD-010", "FTL-TECH-012", "FTL-REV-006", "FTL-MKT-006",
        "FTL-TECH-013", "FTL-PROD-011", "FTL-CEO-014", "FTL-CEO-015", "FTL-TECH-014", "FTL-TECH-015",
        "FTL-TECH-016", "FTL-CEO-016", "FTL-MKT-007", "FTL-TECH-017", "FTL-TECH-018", "FTL-TECH-019", "FTL-TECH-020"
    }
    sprint8_ids = {
        "FTL-CEO-017", "FTL-CEO-018", "FTL-CEO-019", "FTL-GOV-008", "FTL-PROD-012",
        "FTL-TECH-021", "FTL-REV-007", "FTL-MKT-008", "FTL-TECH-022", "FTL-TECH-023", "FTL-PROD-013"
    }

    epoch1_ids = sprint1_ids | sprint2_ids | sprint3_ids | sprint4_ids | sprint5_ids | sprint6_ids | sprint7_ids
    known_sprints = epoch1_ids | sprint8_ids

    sprint1 = [t for t in tasks if t["task_id"] in sprint1_ids]
    sprint2 = [t for t in tasks if t["task_id"] in sprint2_ids]
    sprint3 = [t for t in tasks if t["task_id"] in sprint3_ids]
    sprint4 = [t for t in tasks if t["task_id"] in sprint4_ids]
    sprint5 = [t for t in tasks if t["task_id"] in sprint5_ids]
    sprint6 = [t for t in tasks if t["task_id"] in sprint6_ids]
    sprint7 = [t for t in tasks if t["task_id"] in sprint7_ids]
    sprint8 = [t for t in tasks if t["task_id"] in sprint8_ids]
    new_founder_tasks = [t for t in tasks if t["task_id"] not in known_sprints]

    def format_task_row(t):
        tid = t["task_id"]
        role = t["assignee_role"]
        title = t["title"]
        prio = prio_badges.get(t["priority"], t["priority"])
        st = status_badges.get(t["status"], t["status"])
        deps = ", ".join(f"`{d}`" for d in (t.get("dependencies") or [])) or "—"
        esc = f"Sì (`{t.get('escalation_level')}`)" if t.get("requires_escalation") else f"No (`{t.get('escalation_level')}`)"
        rel_link = f"./archive_epoch_1/{tid}.json" if tid in epoch1_ids else f"./{tid}.json"
        return f"| [`{tid}`]({rel_link}) | **{role}** | {title} | {prio} | {st} | {deps} | {esc} |"

    lines = [
        "# 📋 Founder Control Dashboard — Registro Task Multi-Epoca (`Azienda/tasks/`)",
        "",
        "Questa directory contiene i **Task Object JSON** della C-Suite di **Footlink**, validati secondo il [Task Object Schema v1.0](./schema/task-object-v1.schema.json) definito dal CGO e orchestrati tramite **Google Antigravity** (`OpenClaw` in stato *suspended*).",
        "",
        "> **Architettura Multi-Epoca ([`ADR-011`](../adr/ADR-011-epoch-2-verticalization-governance-and-modular-depth.md)):**",
        "> - **🚀 EPOCA II — LA VERTICALIZZAZIONE (Da Sprint 8 in poi):** Focalizzata sulla profondità funzionale verticale all'interno di ciascuno dei 9 moduli della piattaforma (*Zero Horizontal Bloat / Deep Vertical Capabilities*). Piano esecutivo: [`PIANO_PROSECUZIONE_STRATEGICO_EPOCA_2.md`](../PIANO_PROSECUZIONE_STRATEGICO_EPOCA_2.md).",
        "> - **📦 EPOCA I — FONDAZIONE & ESPANSIONE ORIZZONTALE (Sprint 1–7):** Consolidata e archiviata fisicamente in [`./archive_epoch_1/`](./archive_epoch_1/) con **67/67 Task Completati (`done`)** e Doppio Riconoscimento del Founder (👑👑). Compendio storico ufficiale: [`epoch-1-historical-consolidation-sprints-1-7.md`](../docs/governance/epoch-1-historical-consolidation-sprints-1-7.md).",
        "",
        "---",
        "",
        "# 🚀 EPOCA II — LA VERTICALIZZAZIONE (Da Sprint 8)",
        "",
        "## 🎯 Sprint 8 — \"La Ripartenza\": Governance Multi-Epoca, Gestione Colori Intelligente & Albo Fornitori 360°",
        "",
        "| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |",
        "|---|:---:|---|:---:|:---:|---|:---:|",
    ]
    for t in sprint8:
        lines.append(format_task_row(t))

    if new_founder_tasks:
        lines.extend([
            "",
            "---",
            "",
            "## 👑 Nuove Iniziative & Direttive Founder — Backlog Epoca II",
            "",
            "Task e direttive inseriti direttamente dal Founder via **Founder Control Center** per analisi, prioritizzazione strategica (CEO/CGO) ed esecuzione da parte dei C-Level responsabili.",
            "",
            "| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |",
            "|---|:---:|---|:---:|:---:|---|:---:|",
        ])
        for t in new_founder_tasks:
            lines.append(format_task_row(t))

    lines.extend([
        "",
        "---",
        "",
        "# 📦 ARCHIVIO CONSOLIDATO EPOCA I — FONDAZIONE & ESPANSIONE ORIZZONTALE (Sprint 1–7)",
        "",
        "Tutti i **67 Task Object** degli Sprint 1–7 sono formalmente chiusi (`done`), validati al 100% e storicizzati nel [Compendio Storico dell'Epoca I](../docs/governance/epoch-1-historical-consolidation-sprints-1-7.md).",
        "",
    ])

    epoch1_sections = [
        ("👑👑 Sprint 7 — Tassonomia Multi-Livello, Bulk Onboarding, BOM Duplicazione/Drag&Drop & Codebase Analytics (19/19 Done)", sprint7),
        ("🛡️ Sprint 6 — Tracciabilità Conceria EUDR, Vault Lotti, Work Orders & Perfezionamento PLM/PIM (17/17 Done)", sprint6),
        ("🚀 Sprint 5 — Modello Dati Flessibile, Gerarchia Stagioni & Collezioni, Tabelle Anagrafiche e Semplificazione UI (8/8 Done)", sprint5),
        ("🏭 Sprint 4 — Lancio Pilota nei Distretti, Validazione sul Campo 'Zero-Training Terzista', Deploy Free-Tier & Gate L2–L6 (6/6 Done)", sprint4),
        ("🎨 Sprint 3 — Convergenza UX/UI Design System v2.0, Home Hub Iniziale & Processi Core (4/4 Done)", sprint3),
        ("⚡ Sprint 2 — Riorganizzazione 3 Pilastri, Core Applicativo PLM/PIM & Go-To-Market (7/7 Done)", sprint2),
        ("🚀 Sprint 1 — Bootstrap C-Suite & Fondamenta Governance (6/6 Done)", sprint1),
    ]

    for sec_title, sec_tasks in epoch1_sections:
        if sec_tasks:
            lines.extend([
                "<details>",
                f"<summary><strong>{sec_title}</strong></summary>",
                "",
                "| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |",
                "|---|:---:|---|:---:|:---:|---|:---:|",
            ])
            for t in sec_tasks:
                lines.append(format_task_row(t))
            lines.extend([
                "",
                "</details>",
                "",
            ])

    lines.extend([
        "---",
        "",
        "## ⚙️ Regole di Aggiornamento",
        "1. Ogni sub-agente di Google Antigravity, quando prende in carico un task, aggiorna `status` a `\"in_progress\"` e `updated_at` con il timestamp corrente.",
        "2. Al termine della produzione dei deliverable in `Azienda/docs/`, `Azienda/adr/` o `Applicativo/`, popola `output_artifacts`, imposta `status` a `\"review\"` (se richiede approvazione L2–L6 del Founder) oppure `\"done\"`.",
        "3. Il **Founder Control Center v2.0** (`Portale_Founder_Control/control_center.py` su `http://127.0.0.1:8080`) mantiene sincronizzato questo registro multi-epoca in tempo reale.",
        "",
    ])
    os.makedirs(TASKS_DIR, exist_ok=True)
    with open(os.path.join(TASKS_DIR, "README.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def list_all_docs():
    docs = []
    
    # Task artifacts to role mapping
    task_artifact_role = {}
    task_files = sorted(
        glob.glob(os.path.join(TASKS_DIR, "FTL-*.json"))
        + glob.glob(os.path.join(ARCHIVE_TASKS_DIR, "FTL-*.json"))
    )
    for p in task_files:
        try:
            with open(p, "r", encoding="utf-8") as f:
                d = json.load(f)
                r = d.get("assignee_role")
                for a in d.get("output_artifacts") or []:
                    norm = os.path.normpath(a)
                    task_artifact_role[norm] = r
                    task_artifact_role[norm.replace("Azienda/", "")] = r
        except Exception:
            pass

    def infer_role(rel_path):
        norm = os.path.normpath(rel_path)
        if norm in task_artifact_role:
            return task_artifact_role[norm]
        for k, r in task_artifact_role.items():
            if norm.endswith(k) or k.endswith(norm):
                return r
        low = norm.lower()
        if "entita/modelli" in low or "entita/prodotti" in low or "entita/distinte_basi" in low or "entita/template" in low:
            return "CPO"
        if "entita/fornitori" in low:
            return "CRO"
        if "entita/stagioni" in low or "entita/collezioni" in low:
            return "CMO"
        if "entita/" in low:
            return "CPO"
        if "piano_prosecuzione_strategico" in low or "role_ceo" in low or "/okr/" in low or "ftl-ceo" in low:
            return "CEO"
        if "archivio_epoche" in low or "role_cgo" in low or "/adr/" in low or "/governance/" in low or "ftl-gov" in low or "portale_founder_control" in low:
            return "CGO"
        if "role_cto" in low or "/technical/" in low or "applicativo/" in low or "ftl-tech" in low or ".github/" in low:
            return "CTO"
        if "role_cpo" in low or "/prd/" in low or "ftl-prod" in low:
            return "CPO"
        if "role_cro" in low or "/finops/" in low or "ftl-rev" in low:
            return "CRO"
        if "role_cmo" in low or "/marketing/" in low or "/dam/" in low or "ftl-mkt" in low:
            return "CMO"
        if "manifesto" in low:
            return "CEO"
        return "TUTTI"

    def infer_epoch(rel_path):
        low = rel_path.lower()
        if any(k in low for k in ("epoch-3", "epoch_3", "epoca-3", "epoca_3", "sprint-13", "sprint-14")):
            return "EPOCH_3"
        if "archive_epoch_1/" in low or "memory/archive/" in low or "epoch-1" in low or "epoca-1" in low or "epoca_1" in low:
            return "EPOCH_1"

        # Dynamic ADR check: ADR-000 to ADR-010 are Epoca 1; ADR-011+ are Epoca 2
        m_adr = re.search(r"adr-(\d+)", low)
        if m_adr:
            adr_num = int(m_adr.group(1))
            return "EPOCH_2" if adr_num >= 11 else "EPOCH_1"

        # Dynamic PRD check: PRD-001 to PRD-008 are Epoca 1; PRD-009+ are Epoca 2
        m_prd = re.search(r"prd-(\d+)", low)
        if m_prd:
            prd_num = int(m_prd.group(1))
            return "EPOCH_2" if prd_num >= 9 else "EPOCH_1"

        # Dynamic Sprint check: Sprint 1-7 are Epoca 1; Sprint 8-12 are Epoca 2; Sprint 13+ Epoca 3
        m_sp = re.search(r"sprint-(\d+)", low)
        if m_sp:
            sp_num = int(m_sp.group(1))
            if sp_num >= 13:
                return "EPOCH_3"
            elif sp_num >= 8:
                return "EPOCH_2"
            elif sp_num >= 1:
                return "EPOCH_1"

        # Dynamic Memory session check
        m_date = re.search(r"2026-10-(\d+)", low)
        if m_date:
            day = int(m_date.group(1))
            return "EPOCH_2" if day > 20 else "EPOCH_1"

        if rel_path.startswith("Azienda/tasks/FTL-") and "archive_epoch_1" not in rel_path:
            return "EPOCH_2"

        if any(k in low for k in (
            "piano_prosecuzione_strategico_epoca_2",
            "epoch-2", "epoca-2", "epoca_2"
        )):
            return "EPOCH_2"

        if any(k in low for k in (
            "q4-2026-okr", "district-pilot", "gtm-execution", "organic-launch",
            "competitor-benchmark", "design-partner", "sales-playbook", "pilot-loi", "pilot-pipeline",
            "audit-gdpr", "process_rules_v1", "governance-risk", "governance-triage",
            "brand-guidelines", "dpp-espr-launch", "editorial-plan", "go-live-launch", "landing-page",
            "c-suite-kickoff", "free-tier-deployment", "fast-onboarding", "dam/"
        )):
            return "EPOCH_1"

        if any(k in low for k in (
            "manifesto", "role_", "identity.md", "soul.md", "user.md", "memory.md", "dreams.md",
            "archivio_epoche", "entita"
        )):
            return "CORE"

        return "CORE"

    def extract_title(full_path):
        ext = os.path.splitext(full_path)[1].lower()
        try:
            if ext == ".md":
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("# "):
                            return line[2:].strip()
            elif ext in (".html", ".htm"):
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read(2048)
                    m = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
                    if m:
                        return m.group(1).strip()
            elif ext == ".json" and "FTL-" in full_path:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    d = json.load(f)
                    tid = d.get("task_id", "")
                    t = d.get("title", "")
                    return f"[{tid}] {t}"
        except Exception:
            pass
        return os.path.basename(full_path)

    azienda_core = [
        os.path.join("Azienda", f)
        for f in [
            "PIANO_PROSECUZIONE_STRATEGICO_EPOCA_2.md",
            "ARCHIVIO_EPOCHE.md",
            "Manifesto_Fondazione_Footlink.md",
            "README.md",
            "IDENTITY.md",
            "SOUL.md",
            "USER.md",
            "MEMORY.md",
            "DREAMS.md",
        ]
    ]
    adr_files = [os.path.relpath(p, ROOT_DIR) for p in sorted(glob.glob(os.path.join(ADR_DIR, "*.md")))]
    task_json_files = [
        os.path.relpath(p, ROOT_DIR)
        for p in sorted(
            glob.glob(os.path.join(TASKS_DIR, "*.json"))
            + glob.glob(os.path.join(ARCHIVE_TASKS_DIR, "*.json"))
        )
    ]
    doc_files = [
        os.path.relpath(p, ROOT_DIR)
        for p in sorted(
            glob.glob(os.path.join(DOCS_DIR, "**", "*.md"), recursive=True)
            + glob.glob(os.path.join(DOCS_DIR, "**", "*.html"), recursive=True)
        )
    ]
    applicativo_files = [
        os.path.relpath(p, ROOT_DIR)
        for p in sorted(
            glob.glob(os.path.join(APPLICATIVO_DIR, "**", "*.md"), recursive=True)
            + glob.glob(os.path.join(APPLICATIVO_DIR, "**", "*.html"), recursive=True)
            + glob.glob(os.path.join(APPLICATIVO_DIR, "**", "*.py"), recursive=True)
            + glob.glob(os.path.join(APPLICATIVO_DIR, "**", "*.tsx"), recursive=True)
            + glob.glob(os.path.join(APPLICATIVO_DIR, "**", "*.sql"), recursive=True)
        )
        if "__pycache__" not in p and "node_modules" not in p and ".pytest_cache" not in p
    ]
    dam_files = [
        os.path.relpath(p, ROOT_DIR)
        for p in sorted(
            glob.glob(os.path.join(ROOT_DIR, "Azienda", "dam", "**", "*.md"), recursive=True)
            + glob.glob(os.path.join(ROOT_DIR, "Azienda", "dam", "**", "*.html"), recursive=True)
            + glob.glob(os.path.join(ROOT_DIR, "Azienda", "dam", "**", "*.svg"), recursive=True)
        )
    ]
    memory_files = [
        os.path.relpath(p, ROOT_DIR)
        for p in sorted(glob.glob(os.path.join(ROOT_DIR, "Azienda", "memory", "**", "*.md"), recursive=True))
    ]
    portale_files = [
        os.path.relpath(p, ROOT_DIR)
        for p in sorted(
            glob.glob(os.path.join(PORTALE_DIR, "*.md"))
            + glob.glob(os.path.join(PORTALE_DIR, "*.py"))
        )
    ]
    root_files = ["README.md", "AGENTS.md", ".github/workflows/ci.yml"]

    entita_files = [
        os.path.relpath(p, ROOT_DIR)
        for p in sorted(glob.glob(os.path.join(ROOT_DIR, "Azienda", "entita", "*.md")))
    ]
    candidates = azienda_core + adr_files + entita_files + task_json_files + doc_files + dam_files + memory_files + applicativo_files + portale_files + root_files
    seen = set()
    for rel in candidates:
        full_p = os.path.join(ROOT_DIR, rel)
        if rel not in seen and os.path.isfile(full_p):
            seen.add(rel)
            pillar = "Azienda" if rel.startswith("Azienda/") else (
                "Applicativo" if rel.startswith("Applicativo/") else (
                    "Portale_Founder_Control" if rel.startswith("Portale_Founder_Control/") else "Root"
                )
            )
            title = extract_title(full_p)
            is_founder_directive = False
            title_lower = title.lower()
            rel_lower = rel.lower()
            if "direttiva founder" in title_lower or "direttiva esecutiva" in title_lower or "founder" in title_lower or "direttiva" in title_lower or "founder" in rel_lower or rel.startswith("Azienda/USER.md"):
                is_founder_directive = True
            else:
                try:
                    with open(full_p, "r", encoding="utf-8", errors="ignore") as f_head:
                        h = f_head.read(1500).lower()
                        if "direttiva founder" in h or "direttiva esecutiva" in h or "founder (control center)" in h:
                            is_founder_directive = True
                except Exception:
                    pass

            docs.append({
                "path": rel,
                "pillar": pillar,
                "role": infer_role(rel),
                "epoch": infer_epoch(rel),
                "title": title,
                "ext": os.path.splitext(rel)[1].lower(),
                "size": os.path.getsize(full_p),
                "mtime": datetime.datetime.fromtimestamp(os.path.getmtime(full_p)).strftime("%Y-%m-%d %H:%M:%S"),
                "is_founder_directive": is_founder_directive,
            })
    # Ordinamento decrescente per data ultima modifica DESC (FTL-TECH-013)
    docs.sort(key=lambda d: d.get("mtime", ""), reverse=True)
    return docs


INDEX_HTML = r"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Footlink — Founder Control Center</title>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
<style>
  :root {
    --bg: #0b0f19;
    --panel: #131b2e;
    --panel-alt: #19233c;
    --border: #263554;
    --text: #e2e8f0;
    --muted: #94a3b8;
    --accent: #38bdf8;
    --green: #22c55e;
    --amber: #f59e0b;
    --purple: #a855f7;
    --red: #ef4444;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    padding-bottom: 48px;
  }
  header {
    background: linear-gradient(90deg, #0f172a 0%, #1e1b4b 100%);
    border-bottom: 1px solid var(--border);
    padding: 18px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand-logo {
    width: 42px; height: 42px; border-radius: 10px;
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: bold;
  }
  .brand h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
  .brand p { font-size: 12px; color: var(--muted); }
  .top-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .pill {
    padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600;
    border: 1px solid var(--border); background: var(--panel);
    display: inline-flex; align-items: center; gap: 6px;
  }
  .pill.green { border-color: rgba(34,197,94,0.4); color: #4ade80; }
  .pill.amber { border-color: rgba(245,158,11,0.4); color: #fbbf24; }
  .pill.purple { border-color: rgba(168,85,247,0.5); color: #c084fc; }
  .btn {
    cursor: pointer; border: 1px solid var(--border); background: var(--panel-alt);
    color: var(--text); padding: 8px 14px; border-radius: 8px; font-size: 13px;
    font-weight: 600; transition: all 0.15s ease;
  }
  .btn:hover { border-color: var(--accent); transform: translateY(-1px); }
  .btn-approve { background: rgba(34,197,94,0.18); border-color: #22c55e; color: #4ade80; }
  .btn-approve:hover { background: rgba(34,197,94,0.3); }
  .btn-warn { background: rgba(245,158,11,0.18); border-color: #f59e0b; color: #fbbf24; }
  .btn-danger { background: rgba(239,68,68,0.18); border-color: #ef4444; color: #f87171; }
  .btn-platform {
    background: linear-gradient(135deg, #0284c7 0%, #6366f1 100%);
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 2px 10px rgba(2, 132, 199, 0.45);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }
  .btn-platform:hover {
    background: linear-gradient(135deg, #0369a1 0%, #4f46e5 100%);
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.55);
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.4);
  }
  .container { max-width: 1440px; margin: 24px auto; padding: 0 24px; }
  .kpi-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 14px; margin-bottom: 24px;
  }
  .kpi-card {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 12px; padding: 16px;
  }
  .kpi-card .label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi-card .value { font-size: 26px; font-weight: 700; margin-top: 6px; }
  .kpi-card .sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .section-title {
    font-size: 16px; font-weight: 700; margin: 26px 0 14px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .approval-banner {
    background: rgba(168, 85, 247, 0.12);
    border: 1px solid rgba(168, 85, 247, 0.45);
    border-radius: 12px; padding: 18px; margin-bottom: 24px;
  }
  .approval-banner h2 { font-size: 16px; color: #d8b4fe; margin-bottom: 10px; }
  .kanban {
    display: grid; grid-template-columns: repeat(5, minmax(250px, 1fr));
    gap: 14px; overflow-x: auto; padding-bottom: 8px;
  }
  .col {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 12px; padding: 14px; min-height: 360px;
  }
  .col-header {
    font-size: 13px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; padding-bottom: 10px; margin-bottom: 12px;
    border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .task-card {
    background: var(--panel-alt); border: 1px solid var(--border);
    border-radius: 10px; padding: 14px; margin-bottom: 12px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .task-card.review-highlight { border-color: #a855f7; box-shadow: 0 0 0 1px rgba(168,85,247,0.35); }
  .task-card.inprog-highlight { border-color: #38bdf8; box-shadow: 0 0 0 1px rgba(56,189,248,0.35); }
  .task-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  .task-id { font-family: monospace; font-size: 12px; font-weight: 700; color: var(--accent); }
  .role-badge {
    font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px;
    background: rgba(56,189,248,0.15); color: #7dd3fc;
  }
  .task-title { font-size: 14px; font-weight: 600; }
  .task-desc { font-size: 12px; color: var(--muted); }
  .task-meta { font-size: 11px; color: var(--muted); display: flex; flex-wrap: wrap; gap: 6px; }
  .esc-box {
    background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.4);
    border-radius: 8px; padding: 8px; font-size: 11.5px; color: #fde68a;
  }
  .artifact-list { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
  .artifact-link {
    font-family: monospace; font-size: 11.5px; color: #38bdf8;
    text-decoration: none; cursor: pointer; word-break: break-all;
  }
  .artifact-link:hover { text-decoration: underline; }
  .card-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .col-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 700px;
    overflow-y: auto;
    padding-right: 4px;
  }
  .col-cards::-webkit-scrollbar {
    width: 6px;
  }
  .col-cards::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 4px;
  }
  .col-cards::-webkit-scrollbar-thumb:hover {
    background: var(--accent);
  }

  /* C-Suite Knowledge Hub & Document Explorer */
  .knowledge-hub {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    margin-top: 36px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }
  .hub-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .hub-title-box h2 {
    font-size: 19px;
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hub-title-box p {
    font-size: 13px;
    color: var(--muted);
    margin-top: 4px;
  }
  .hub-stats {
    font-size: 12px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #7dd3fc;
  }
  .role-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }
  .role-tab {
    cursor: pointer;
    background: var(--panel-alt);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.15s ease;
  }
  .role-tab:hover {
    border-color: var(--accent);
    color: #ffffff;
    transform: translateY(-1px);
  }
  .role-tab.active {
    background: linear-gradient(135deg, #0284c7 0%, #6366f1 100%);
    border-color: transparent;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
  }
  .role-tab .count {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 7px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }
  .hub-toolbar {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .hub-search-box {
    position: relative;
    flex: 1;
    min-width: 280px;
  }
  .hub-search-box input {
    width: 100%;
    background: #090d16;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px 10px 38px;
    color: #ffffff;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .hub-search-box input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
  }
  .hub-search-box .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    font-size: 14px;
    pointer-events: none;
  }
  .clear-search-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 14px;
  }
  .clear-search-btn:hover { color: #ffffff; }
  .hub-format-filters {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .filter-chip {
    cursor: pointer;
    background: var(--panel-alt);
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.15s ease;
  }
  .filter-chip:hover {
    color: var(--text);
    border-color: var(--accent);
  }
  .filter-chip.active {
    background: rgba(56, 189, 248, 0.15);
    border-color: var(--accent);
    color: #38bdf8;
  }
  .hub-results-meta {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 14px;
  }
  .hub-docs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 14px;
  }
  .doc-card {
    background: var(--panel-alt);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.15s ease;
  }
  .doc-card:hover {
    border-color: rgba(56, 189, 248, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  }
  .doc-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .doc-role-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    letter-spacing: 0.3px;
  }
  .role-CEO { background: rgba(56, 189, 248, 0.15); color: #7dd3fc; border: 1px solid rgba(56,189,248,0.4); }
  .role-CGO { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.4); }
  .role-CTO { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.4); }
  .role-CPO { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.4); }
  .role-CRO { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.4); }
  .role-CMO { background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236,72,153,0.4); }
  .role-TUTTI, .role-GENERAL { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border: 1px solid rgba(148,163,184,0.4); }
  .doc-type-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    background: rgba(255, 255, 255, 0.08);
    color: var(--text);
  }
  .type-md { color: #4ade80; background: rgba(34,197,94,0.15); }
  .type-html { color: #c084fc; background: rgba(168,85,247,0.15); }
  .type-json { color: #fbbf24; background: rgba(245,158,11,0.15); }
  .epoch-card-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    letter-spacing: 0.2px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .epoch-card-badge.e1 { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35); }
  .epoch-card-badge.e2 { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); }
  .epoch-card-badge.e3 { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.35); }
  .epoch-card-badge.core { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); }
  .epoch-empty-default {
    grid-column: 1 / -1;
    text-align: center;
    padding: 56px 28px;
    color: var(--muted);
    background: rgba(15, 23, 42, 0.65);
    border-radius: 14px;
    border: 1px dashed rgba(56, 189, 248, 0.45);
    margin: 10px 0;
  }
  .doc-card-title {
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.4;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .doc-card-path {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11.5px;
    color: #38bdf8;
    margin-bottom: 8px;
    word-break: break-all;
    line-height: 1.4;
    cursor: pointer;
  }
  .doc-card-path:hover { text-decoration: underline; }
  .doc-card-meta {
    font-size: 11px;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .doc-card-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 10px;
  }
  .modal-backdrop {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8);
    z-index: 100; align-items: center; justify-content: center; padding: 20px;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 14px; max-width: 1240px; width: 96%; height: 90vh;
    min-height: 580px; display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);
  }
  .modal-header {
    padding: 12px 20px; border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
    background: var(--panel-alt); gap: 14px; flex-wrap: wrap;
  }
  .modal-header-left { display: flex; align-items: center; gap: 10px; min-width: 220px; }
  .modal-header-center { display: flex; align-items: center; justify-content: center; }
  .modal-header-right { display: flex; align-items: center; gap: 8px; }
  .file-icon { font-size: 24px; line-height: 1; }
  .btn-sm { padding: 6px 11px; font-size: 12px; }

  /* Segmented Mode Control */
  .segmented-control {
    display: inline-flex; background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; padding: 3px; gap: 3px;
  }
  .seg-btn {
    background: transparent; border: none; color: var(--muted);
    padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.15s ease; display: inline-flex;
    align-items: center; gap: 6px;
  }
  .seg-btn:hover { color: var(--text); }
  .seg-btn.active {
    background: var(--accent); color: #0b0f19; font-weight: 700;
    box-shadow: 0 1px 4px rgba(56,189,248,0.4);
  }

  /* Body wrapper & views */
  .modal-body-wrapper {
    flex: 1; overflow: hidden; position: relative;
    display: flex; flex-direction: column; background: var(--bg);
  }
  .md-preview {
    flex: 1; overflow-y: auto; padding: 28px 36px; color: #e2e8f0;
    font-size: 14px; line-height: 1.7;
  }
  .html-preview-container {
    flex: 1; display: flex; justify-content: center; align-items: stretch;
    background: #090d16; overflow: hidden; position: relative;
  }
  .html-preview-container iframe {
    width: 100%; height: 100%; border: none; background: #ffffff;
    transition: width 0.25s ease, box-shadow 0.25s ease;
  }
  .html-preview-container.mobile-view iframe {
    width: 390px; box-shadow: 0 0 35px rgba(0, 0, 0, 0.8), 0 0 0 1px #334155;
    border-radius: 14px; margin: 12px auto;
  }
  .code-preview {
    flex: 1; overflow-y: auto; background: #070a12; padding: 20px 24px;
  }
  .code-preview pre {
    margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px; line-height: 1.6; color: #f1f5f9; white-space: pre-wrap; word-break: break-all;
  }

  /* Markdown Typography & Blocks */
  .md-preview h1 {
    font-size: 22px; font-weight: 700; color: #f8fafc;
    border-bottom: 1px solid var(--border); padding-bottom: 8px; margin: 24px 0 14px;
  }
  .md-preview h1:first-child { margin-top: 0; }
  .md-preview h2 {
    font-size: 18px; font-weight: 700; color: #f1f5f9;
    border-bottom: 1px solid rgba(38, 53, 84, 0.6); padding-bottom: 6px; margin: 20px 0 10px;
  }
  .md-preview h3 { font-size: 15px; font-weight: 600; color: #e2e8f0; margin: 16px 0 8px; }
  .md-preview h4 { font-size: 13.5px; font-weight: 600; color: #94a3b8; margin: 12px 0 6px; }
  .md-preview p { margin-bottom: 12px; color: #cbd5e1; }
  .md-preview strong { color: #ffffff; font-weight: 600; }
  .md-preview hr { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
  .md-preview ul, .md-preview ol { margin: 10px 0 16px 22px; color: #cbd5e1; }
  .md-preview li { margin-bottom: 4px; }
  .md-preview li.task-item { list-style-type: none; margin-left: -18px; }
  .md-preview table {
    width: 100%; border-collapse: collapse; margin: 18px 0;
    border: 1px solid var(--border); border-radius: 8px; overflow: hidden; font-size: 13px;
  }
  .md-preview th {
    background: var(--panel-alt); color: #38bdf8; font-weight: 600;
    padding: 10px 12px; border: 1px solid var(--border); text-align: left;
  }
  .md-preview td { padding: 9px 12px; border: 1px solid var(--border); color: #e2e8f0; }
  .md-preview tr:nth-child(even) td { background: rgba(255, 255, 255, 0.02); }
  .md-preview tr:hover td { background: rgba(56, 189, 248, 0.05); }
  .md-preview blockquote {
    border-left: 4px solid var(--accent); padding: 10px 16px; margin: 14px 0;
    background: rgba(56, 189, 248, 0.08); border-radius: 0 8px 8px 0; color: #e2e8f0;
  }
  .md-preview blockquote.alert-note { border-left-color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
  .md-preview blockquote.alert-tip { border-left-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
  .md-preview blockquote.alert-important { border-left-color: #a855f7; background: rgba(168, 85, 247, 0.1); }
  .md-preview blockquote.alert-warning { border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
  .md-preview blockquote.alert-caution { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
  .md-preview pre {
    background: #070a12; border: 1px solid var(--border); border-radius: 8px;
    padding: 14px; overflow-x: auto; margin: 14px 0;
  }
  .md-preview code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px;
    background: rgba(255, 255, 255, 0.08); color: #38bdf8; padding: 2px 6px; border-radius: 4px;
  }
  .md-preview pre code { background: transparent; color: #f1f5f9; padding: 0; }
  .md-preview a { color: #38bdf8; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  .md-preview a:hover { color: #7dd3fc; }

  /* Create Task Modal & Founder Directives */
  .btn-create-task {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%);
    border: 1px solid #f59e0b;
    color: #fef08a;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
  }
  .btn-create-task:hover {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.4) 0%, rgba(217, 119, 6, 0.5) 100%);
    border-color: #fbbf24;
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
    transform: translateY(-1px);
    color: #ffffff;
  }
  .task-card.founder-card {
    border-left: 4px solid #f59e0b;
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, var(--panel-alt) 100%);
  }
  .badge-founder-directive {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.25) 100%);
    border: 1px solid rgba(245, 158, 11, 0.55);
    color: #fef08a;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
  }
  .modal-form-card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 14px;
    max-width: 840px;
    width: 96%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
  }
  .modal-form-header {
    padding: 16px 24px;
    background: linear-gradient(90deg, #131b2e 0%, #1e1b4b 100%);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  .modal-form-header h3 {
    font-size: 17px;
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .modal-form-header p {
    font-size: 12px;
    color: var(--muted);
    margin-top: 3px;
  }
  .modal-form-body {
    flex: 1;
    overflow-y: auto;
    padding: 22px 26px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #0d1322;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-group label {
    font-size: 12.5px;
    font-weight: 600;
    color: #cbd5e1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .form-group label span.hint {
    font-size: 11px;
    color: var(--muted);
    font-weight: normal;
  }
  .form-input, .form-select, .form-textarea {
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 13.5px;
    font-family: inherit;
    outline: none;
    transition: all 0.15s ease;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }
  .form-textarea {
    resize: vertical;
    min-height: 80px;
    line-height: 1.5;
  }
  .form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 640px) {
    .form-grid-2 { grid-template-columns: 1fr; }
  }
  .tag-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;
  }
  .tag-chip {
    font-size: 11.5px;
    padding: 5px 11px;
    border-radius: 6px;
    background: var(--panel-alt);
    border: 1px solid var(--border);
    color: var(--muted);
    cursor: pointer;
    user-select: none;
    transition: all 0.15s ease;
  }
  .tag-chip:hover {
    color: var(--text);
    border-color: var(--accent);
  }
  .tag-chip.selected {
    background: rgba(56, 189, 248, 0.2);
    border-color: #38bdf8;
    color: #38bdf8;
    font-weight: 600;
  }
  .modal-form-footer {
    padding: 14px 24px;
    background: var(--panel);
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  /* Executive Command Deck Navigation & Views */
  header {
    background: linear-gradient(180deg, #0f172a 0%, #131b2e 100%);
    border-bottom: 1px solid var(--border);
    padding: 0;
    display: block;
    position: sticky;
    top: 0;
    z-index: 25;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
  }
  .header-main {
    padding: 14px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .executive-nav-bar {
    padding: 6px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    background: rgba(11, 15, 25, 0.7);
    backdrop-filter: blur(8px);
  }
  .nav-tabs-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .nav-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .nav-tab:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.06);
  }
  .nav-tab.active {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.12);
    border-color: rgba(56, 189, 248, 0.38);
  }
  .nav-badge {
    font-size: 11px;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(239, 68, 68, 0.25);
    color: #f87171;
    font-weight: 700;
  }
  .nav-epoch-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(30, 41, 59, 0.65);
    padding: 3px 8px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .nav-epoch-label {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .nav-epoch-buttons {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .btn-epoch {
    cursor: pointer;
    border: 1px solid transparent;
    background: transparent;
    color: #94a3b8;
    padding: 5px 11px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.12s ease;
  }
  .btn-epoch:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.08);
  }
  .btn-epoch.active {
    background: linear-gradient(135deg, #0284c7, #6366f1);
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.45);
  }
  .view-section {
    display: none;
    animation: fadeInView 0.18s ease-out;
  }
  .view-section.active {
    display: block;
  }
  @keyframes fadeInView {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .epoch-sub-banner {
    background: linear-gradient(90deg, rgba(16,185,129,0.12) 0%, rgba(56,189,248,0.12) 50%, rgba(168,85,247,0.12) 100%);
    border: 1px solid rgba(56,189,248,0.4);
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 20px;
  }
  .entities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 16px;
  }
  .entity-card {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }
  .entity-card:hover {
    border-color: rgba(56, 189, 248, 0.55);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  }
  .entity-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  .entity-title {
    font-size: 15px;
    font-weight: 700;
    color: #f8fafc;
  }
  .entity-path {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    color: #38bdf8;
    margin-top: 3px;
  }
  .entity-desc {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.5;
    margin-bottom: 16px;
    flex: 1;
  }
  .entity-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 12px;
  }
</style>
</head>
<body>

<header>
  <div class="header-main">
    <div class="brand">
      <div class="brand-logo">👞</div>
      <div>
        <h1>Footlink — Founder Control Center</h1>
        <p>Autonomous C-Suite Governance • Google Antigravity + GitHub (OpenClaw: Suspended)</p>
      </div>
    </div>
    <div class="top-controls">
      <button class="btn btn-create-task" onclick="openCreateTaskModal()" title="Crea un nuovo task da assegnare alla C-Suite">
        <span>✨ Crea Task Founder</span>
      </button>
      <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" class="btn btn-platform" title="Apri l'applicazione Web React Vite su http://localhost:5173">
        <span>👟 Piattaforma Footlink</span>
        <span style="font-size:11px;opacity:0.9;background:rgba(0,0,0,0.3);padding:2px 7px;border-radius:4px;">Frontend :5173 ↗</span>
      </a>
      <a href="http://localhost:5173/dam/index.html" target="_blank" rel="noopener noreferrer" class="btn" style="background:#14231b;border-color:#166534;color:#4ade80;" title="Archivio DAM Asset Pubblicitari, Social e Newsletter">
        <span>📁 Archivio DAM</span>
        <span style="font-size:11px;opacity:0.9;background:rgba(0,0,0,0.3);padding:2px 7px;border-radius:4px;">Adv &amp; Social ↗</span>
      </a>
      <a href="/codebase-dashboard" target="_blank" rel="noopener noreferrer" class="btn" style="background:#1e1b4b;border-color:#4338ca;color:#a5b4fc;" title="Dashboard Analitica sulla Codebase (FTL-TECH-017)">
        <span>📊 Codebase Analytics</span>
        <span style="font-size:11px;opacity:0.9;background:rgba(0,0,0,0.3);padding:2px 7px;border-radius:4px;">Real-Time ↗</span>
      </a>
      <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noopener noreferrer" class="btn" style="background:#1e293b;border-color:#334155;color:#38bdf8;" title="Documentazione interattiva API FastAPI Swagger su http://127.0.0.1:8000/docs">
        <span>📖 API Docs</span>
        <span style="font-size:11px;opacity:0.9;background:rgba(0,0,0,0.3);padding:2px 7px;border-radius:4px;">:8000/docs ↗</span>
      </a>
      <span class="pill green" id="quota-pill">⚡ AI Quota: ACTIVE</span>
      <span class="pill amber">🛡️ Spend Policy: €0 Autonomous (L2 Lock)</span>
      <button class="btn btn-warn" onclick="toggleQuotaPause()">⏸️ Toggle Standby</button>
      <button class="btn" onclick="fetchState()">🔄 Aggiorna Ora</button>
    </div>
  </div>

  <div class="executive-nav-bar">
    <div class="nav-tabs-group">
      <button class="nav-tab active" id="tab-csuite" onclick="switchExecutiveView('csuite')">
        <span>📊 C-Suite Task Board</span>
        <span class="nav-badge" id="nav-badge-review" style="display:none;">0</span>
      </button>
      <button class="nav-tab" id="tab-knowledge" onclick="switchExecutiveView('knowledge')">
        <span>📚 Knowledge Hub &amp; Archivio</span>
        <span class="nav-badge" id="nav-badge-docs" style="background:rgba(56,189,248,0.2);color:#38bdf8;">0 docs</span>
      </button>
      <button class="nav-tab" id="tab-entities" onclick="switchExecutiveView('entities')">
        <span>🏛️ Entità di Dominio (PLM+PIM)</span>
        <span class="nav-badge" style="background:rgba(168,85,247,0.2);color:#c084fc;">8 spec</span>
      </button>
      <button class="nav-tab" id="tab-ecosystem" onclick="switchExecutiveView('ecosystem')">
        <span>🎛️ Ecosistema &amp; 3 Pilastri</span>
      </button>
      <button class="nav-tab" id="tab-all" onclick="switchExecutiveView('all')" title="Mostra tutte le sezioni contemporaneamente a scorrimento continuo">
        <span>🌐 Vista Completa</span>
      </button>
    </div>

    <div class="nav-epoch-selector">
      <span class="nav-epoch-label">🏛️ Epoca:</span>
      <div class="nav-epoch-buttons">
        <button class="btn-epoch active" id="btn-epoch-2" onclick="setEpochFilter('EPOCH_2')" title="Epoca II: Verticalizzazione (Sprint 8+ • Attiva)">🚀 Epoca II</button>
        <button class="btn-epoch" id="btn-epoch-1" onclick="setEpochFilter('EPOCH_1')" title="Epoca I: Fondazione (Sprint 1–7 • 67 Done 👑👑)">📦 Epoca I</button>
        <button class="btn-epoch" id="btn-epoch-3" onclick="setEpochFilter('EPOCH_3')" title="Nuova Epoca III: Tabula Rasa a Default Vuoto">✨ Nuova Epoca</button>
        <button class="btn-epoch" id="btn-epoch-core" onclick="setEpochFilter('CORE')" title="Patrimonio Costituzionale &amp; Core">🏛️ Core</button>
        <button class="btn-epoch" id="btn-epoch-all" onclick="setEpochFilter('ALL')" title="Tutte le Epoche e Documenti">🌐 Tutte</button>
      </div>
    </div>
  </div>
</header>

<div class="container">
  <!-- ========================================== -->
  <!-- VISTA 1: C-SUITE TASK BOARD               -->
  <!-- ========================================== -->
  <div id="view-csuite" class="view-section active">
    <div id="approval-queue-container"></div>

    <!-- Multi-Epoch Governance Switcher Banner (ADR-011) -->
    <div class="epoch-sub-banner" id="epoch-banner-box">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="pill green" style="font-size:11px;">🏛️ GOVERNANCE MULTI-EPOCA (ADR-011)</span>
            <strong style="font-size:15px;color:#f8fafc;" id="epoch-banner-title">🚀 EPOCA II: LA VERTICALIZZAZIONE (Da Sprint 8 — "La Ripartenza")</strong>
          </div>
          <div style="font-size:12.5px;color:var(--muted);margin-top:4px;" id="epoch-banner-desc">
            Focus su profondità funzionale verticale per modulo (Zero Horizontal Bloat) • Epoca I (Sprint 1–7, 67/67 Task Done 👑👑) consolidata e archiviata.
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm" style="background:rgba(56,189,248,0.22);border-color:#38bdf8;color:#7dd3fc;font-weight:700;" onclick="switchExecutiveView('entities')" title="Apri Anagrafe Entità di Dominio">
            🏛️ Entità di Dominio ↗
          </button>
          <button class="btn btn-sm" style="background:linear-gradient(135deg,rgba(245,158,11,0.25),rgba(234,179,8,0.35));border-color:#f59e0b;color:#fef08a;font-weight:700;" onclick="openDoc('Azienda/ARCHIVIO_EPOCHE.md', 'preview')" title="Apri il Registro Ufficiale dell'Archivio per Epoche">
            🏛️ Registro Epoche
          </button>
          <button class="btn btn-sm btn-approve" onclick="openDoc('Azienda/docs/governance/epoch-1-historical-consolidation-sprints-1-7.md', 'preview')" title="Apri il Compendio Storico Ufficiale dell'Epoca I">
            📜 Compendio Epoca I
          </button>
          <button class="btn btn-sm" style="background:rgba(168,85,247,0.18);border-color:#a855f7;color:#d8b4fe;" onclick="openDoc('Azienda/docs/okr/epoch-2-masterplan-and-sprint-8-kickoff.md', 'preview')" title="Apri il Master Plan Epoca II e Definizione Sprint 8">
            🎯 Master Plan Sprint 8
          </button>
        </div>
      </div>
    </div>

    <div class="section-title">
      <span id="kanban-section-title">📊 C-Suite Task Board — Epoca II: La Verticalizzazione (Sprint 8 • Real-Time Sync con <code>Azienda/tasks/*.json</code>)</span>
      <span style="font-size:12px;color:var(--muted)" id="last-sync"></span>
    </div>
    <div class="kanban" id="kanban-board"></div>
  </div>

  <!-- ========================================== -->
  <!-- VISTA 2: KNOWLEDGE HUB & ARCHIVIO         -->
  <!-- ========================================== -->
  <div id="view-knowledge" class="view-section" style="display:none;">
    <div class="knowledge-hub" id="knowledge-hub">
      <div class="hub-header">
        <div class="hub-title-box">
          <h2>📚 Archivio Documentale &amp; Deliverable C-Suite</h2>
          <p>Consultazione rapida per ruolo C-Level, ricerca in tempo reale tollerante (es. ADR-013), anteprima e modifica interattiva su disco</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div id="hub-epoch-active-desc" style="font-size:12px;color:#38bdf8;font-weight:600;">
            Mostrando: Epoca II (Sprint 8+ • Attiva)
          </div>
          <div class="hub-stats" id="hub-doc-count">0 Documenti</div>
        </div>
      </div>

      <!-- Quick Domain Entities Shelf in Knowledge Hub -->
      <div style="background:linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.75));border:1px solid rgba(56,189,248,0.35);border-radius:10px;padding:12px 16px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:16px;">🏛️</span>
            <strong style="font-size:13px;color:#f8fafc;letter-spacing:-0.2px;">ANAGRAFE ENTITÀ DI DOMINIO (LIVING SPECS PLM + PIM)</strong>
            <button class="btn btn-sm" onclick="switchExecutiveView('entities')" style="font-size:11px;padding:2px 8px;background:rgba(56,189,248,0.18);color:#38bdf8;border-color:rgba(56,189,248,0.4);">
              Apri Schede Dettagliate ↗
            </button>
          </div>
          <div style="font-size:11px;color:var(--muted);">
            File Markdown in <code>Azienda/entita/</code> • Regolano lo sviluppo software e guidano CPO e CTO
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <button class="btn btn-sm" onclick="openDoc('Azienda/entita/MODELLI.md', 'preview')" style="background:rgba(56,189,248,0.12);border-color:#0284c7;color:#bae6fd;" title="Forma calzatura, costruzione suola, linee CAD">🏷️ Modelli</button>
          <button class="btn btn-sm" onclick="openDoc('Azienda/entita/PRODOTTI.md', 'preview')" style="background:rgba(34,197,94,0.12);border-color:#16a34a;color:#bbf7d0;" title="Ponte 1 Articolo Commerciale PIM : N Varianti PLM">📦 Prodotti (PIM/PLM)</button>
          <button class="btn btn-sm" onclick="openDoc('Azienda/entita/STAGIONI.md', 'preview')" style="background:rgba(234,179,8,0.12);border-color:#ca8a04;color:#fef08a;" title="Calendario moda P/E, A/I e Continuativo">🗓️ Stagioni</button>
          <button class="btn btn-sm" onclick="openDoc('Azienda/entita/COLLEZIONI.md', 'preview')" style="background:rgba(168,85,247,0.12);border-color:#9333ea;color:#e9d5ff;" title="Main Collection, Runway, Capsule e canali">🎨 Collezioni</button>
          <button class="btn btn-sm" onclick="openDoc('Azienda/entita/DISTINTE_BASI.md', 'preview')" style="background:rgba(236,72,153,0.12);border-color:#db2777;color:#fbcfe8;" title="Distinta base multi-livello a 3 livelli e template">🌲 Distinte Basi (BOM)</button>
          <button class="btn btn-sm" onclick="openDoc('Azienda/entita/FORNITORI.md', 'preview')" style="background:rgba(249,115,22,0.12);border-color:#ea580c;color:#fed7aa;" title="Concerie, terzisti a 0 € e albo 360°">🏭 Fornitori &amp; Vendor Hub</button>
          <button class="btn btn-sm" onclick="openDoc('Azienda/entita/README.md', 'preview')" style="background:rgba(148,163,184,0.15);border-color:#64748b;color:#e2e8f0;" title="Catalogo Ontologico e Regole di Allineamento">📖 Catalogo &amp; Regole</button>
          <button class="btn btn-sm" onclick="openDoc('Azienda/entita/TEMPLATE_ENTITA.md', 'preview')" style="background:rgba(148,163,184,0.1);border-color:#475569;color:#94a3b8;" title="Template standard per nuove entità">📋 Template Standard</button>
        </div>
      </div>

      <!-- C-Level Role Filter Tabs -->
      <div class="role-tabs" id="role-tabs-container"></div>

      <!-- Search & Format Filters Toolbar -->
      <div class="hub-toolbar">
        <div class="hub-search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="doc-search-input" placeholder="Cerca per titolo, percorso file (es. ADR-013), parola chiave o deliverable..." oninput="onSearchInput(this.value)" />
          <button class="clear-search-btn" id="clear-search-btn" onclick="clearSearch()" style="display:none;" title="Cancella ricerca">✕</button>
        </div>
        
        <div class="hub-format-filters" id="format-filter-group">
          <button class="filter-chip active" data-ext="all" onclick="setDocFilterExt('all')">Tutti i formati</button>
          <button class="filter-chip" id="chip-entities-filter" onclick="toggleDomainEntitiesFilter()" style="border-color:#38bdf8;color:#7dd3fc;">🏛️ Solo Entità di Dominio</button>
          <button class="filter-chip" data-ext=".md" onclick="setDocFilterExt('.md')">📝 Markdown (.md)</button>
          <button class="filter-chip" data-ext=".html" onclick="setDocFilterExt('.html')">🌐 HTML / Preview (.html)</button>
          <button class="filter-chip" data-ext=".json" onclick="setDocFilterExt('.json')">⚙️ JSON Task</button>
          <button class="filter-chip" data-ext=".py" onclick="setDocFilterExt('.py')">🐍 Codice (.py / .tsx)</button>
          <button class="filter-chip" id="chip-founder-directives" onclick="toggleFounderDirectivesFilter()" style="border-color:#f59e0b;color:#fbbf24;">👑 Direttive Founder</button>
        </div>
      </div>

      <div class="hub-results-meta" id="hub-results-meta"></div>
      <div class="hub-docs-grid" id="hub-docs-grid"></div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- VISTA 3: ENTITÀ DI DOMINIO (PLM + PIM)    -->
  <!-- ========================================== -->
  <div id="view-entities" class="view-section" style="display:none;">
    <div style="background:linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.85));border:1px solid rgba(56,189,248,0.4);border-radius:14px;padding:24px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:20px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:26px;">🏛️</span>
            <div>
              <h2 style="font-size:18px;color:#f8fafc;letter-spacing:-0.2px;">ANAGRAFE ENTITÀ DI DOMINIO (LIVING SPECS PLM + PIM)</h2>
              <p style="font-size:13px;color:var(--muted);margin-top:2px;">
                Documenti testuali costitutivi in <code>Azienda/entita/</code> che guidano l'architettura tecnica del CTO e i requisiti di prodotto del CPO.
              </p>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-approve" onclick="openDoc('Azienda/entita/README.md', 'preview')">📖 Catalogo &amp; Regole di Allineamento</button>
          <button class="btn btn-sm" onclick="openDoc('Azienda/entita/TEMPLATE_ENTITA.md', 'preview')" style="border-color:#64748b;color:#e2e8f0;">📋 Template Nuova Entità</button>
        </div>
      </div>

      <!-- 6 Primary Domain Entities Cards Grid + 2 Catalog Cards -->
      <div class="entities-grid">
        <!-- 1. MODELLI -->
        <div class="entity-card">
          <div class="entity-card-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:22px;">🏷️</span>
              <div>
                <div class="entity-title">Modelli</div>
                <div class="entity-path">Azienda/entita/MODELLI.md</div>
              </div>
            </div>
            <span class="pill" style="font-size:10px;background:rgba(56,189,248,0.15);color:#38bdf8;border-color:rgba(56,189,248,0.3);">Living Spec</span>
          </div>
          <p class="entity-desc">
            Forma calzatura, costruzione suola, linee CAD, codifica e nesting taglie. Archetipo geometrico e tecnico di base per qualsiasi calzatura.
          </p>
          <div class="entity-actions">
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/MODELLI.md', 'preview')" style="background:rgba(56,189,248,0.15);border-color:#38bdf8;color:#7dd3fc;">👁️ Leggi Specifica</button>
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/MODELLI.md', 'edit')" style="background:rgba(34,197,94,0.15);border-color:#22c55e;color:#86efac;">✏️ Modifica Live</button>
          </div>
        </div>

        <!-- 2. PRODOTTI -->
        <div class="entity-card">
          <div class="entity-card-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:22px;">📦</span>
              <div>
                <div class="entity-title">Prodotti (PIM/PLM)</div>
                <div class="entity-path">Azienda/entita/PRODOTTI.md</div>
              </div>
            </div>
            <span class="pill" style="font-size:10px;background:rgba(34,197,94,0.15);color:#4ade80;border-color:rgba(34,197,94,0.3);">Living Spec</span>
          </div>
          <p class="entity-desc">
            Ponte critico 1 Articolo Commerciale PIM : N Varianti Tecniche PLM. SKU padre/figlio, pricing B2B/B2C, canali e lifecycle del prodotto.
          </p>
          <div class="entity-actions">
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/PRODOTTI.md', 'preview')" style="background:rgba(56,189,248,0.15);border-color:#38bdf8;color:#7dd3fc;">👁️ Leggi Specifica</button>
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/PRODOTTI.md', 'edit')" style="background:rgba(34,197,94,0.15);border-color:#22c55e;color:#86efac;">✏️ Modifica Live</button>
          </div>
        </div>

        <!-- 3. STAGIONI -->
        <div class="entity-card">
          <div class="entity-card-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:22px;">🗓️</span>
              <div>
                <div class="entity-title">Stagioni</div>
                <div class="entity-path">Azienda/entita/STAGIONI.md</div>
              </div>
            </div>
            <span class="pill" style="font-size:10px;background:rgba(234,179,8,0.15);color:#facc15;border-color:rgba(234,179,8,0.3);">Living Spec</span>
          </div>
          <p class="entity-desc">
            Calendario moda (P/E Primavera-Estate, A/I Autunno-Inverno e Continuativo). Milestone di campionario e finestre di drop commerciale.
          </p>
          <div class="entity-actions">
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/STAGIONI.md', 'preview')" style="background:rgba(56,189,248,0.15);border-color:#38bdf8;color:#7dd3fc;">👁️ Leggi Specifica</button>
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/STAGIONI.md', 'edit')" style="background:rgba(34,197,94,0.15);border-color:#22c55e;color:#86efac;">✏️ Modifica Live</button>
          </div>
        </div>

        <!-- 4. COLLEZIONI -->
        <div class="entity-card">
          <div class="entity-card-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:22px;">🎨</span>
              <div>
                <div class="entity-title">Collezioni</div>
                <div class="entity-path">Azienda/entita/COLLEZIONI.md</div>
              </div>
            </div>
            <span class="pill" style="font-size:10px;background:rgba(168,85,247,0.15);color:#c084fc;border-color:rgba(168,85,247,0.3);">Living Spec</span>
          </div>
          <p class="entity-desc">
            Raggruppamenti stilistici e commerciali (Main Collection, Capsule, Runway, Special Edition). Mood board, target retail e palette cromatiche.
          </p>
          <div class="entity-actions">
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/COLLEZIONI.md', 'preview')" style="background:rgba(56,189,248,0.15);border-color:#38bdf8;color:#7dd3fc;">👁️ Leggi Specifica</button>
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/COLLEZIONI.md', 'edit')" style="background:rgba(34,197,94,0.15);border-color:#22c55e;color:#86efac;">✏️ Modifica Live</button>
          </div>
        </div>

        <!-- 5. DISTINTE BASI -->
        <div class="entity-card">
          <div class="entity-card-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:22px;">🌲</span>
              <div>
                <div class="entity-title">Distinte Basi (BOM)</div>
                <div class="entity-path">Azienda/entita/DISTINTE_BASI.md</div>
              </div>
            </div>
            <span class="pill" style="font-size:10px;background:rgba(236,72,153,0.15);color:#f472b6;border-color:rgba(236,72,153,0.3);">Living Spec</span>
          </div>
          <p class="entity-desc">
            BOM calzatura a 3 livelli (Tomaia, Fondo/Suola, Minuteria &amp; Packaging). Coefficienti di sfrido, consumi netti e cost breakdown.
          </p>
          <div class="entity-actions">
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/DISTINTE_BASI.md', 'preview')" style="background:rgba(56,189,248,0.15);border-color:#38bdf8;color:#7dd3fc;">👁️ Leggi Specifica</button>
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/DISTINTE_BASI.md', 'edit')" style="background:rgba(34,197,94,0.15);border-color:#22c55e;color:#86efac;">✏️ Modifica Live</button>
          </div>
        </div>

        <!-- 6. FORNITORI -->
        <div class="entity-card">
          <div class="entity-card-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:22px;">🏭</span>
              <div>
                <div class="entity-title">Fornitori &amp; Vendor Hub</div>
                <div class="entity-path">Azienda/entita/FORNITORI.md</div>
              </div>
            </div>
            <span class="pill" style="font-size:10px;background:rgba(249,115,22,0.15);color:#fb923c;border-color:rgba(249,115,22,0.3);">Living Spec</span>
          </div>
          <p class="entity-desc">
            Concerie, suolifici, solettifici e terzisti. Albo fornitori 360°, conformità REACH/LWG, rating qualità e politica Zero Spese Esterne (€0 Autonomous).
          </p>
          <div class="entity-actions">
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/FORNITORI.md', 'preview')" style="background:rgba(56,189,248,0.15);border-color:#38bdf8;color:#7dd3fc;">👁️ Leggi Specifica</button>
            <button class="btn btn-sm" onclick="openDoc('Azienda/entita/FORNITORI.md', 'edit')" style="background:rgba(34,197,94,0.15);border-color:#22c55e;color:#86efac;">✏️ Modifica Live</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- VISTA 4: ECOSISTEMA & 3 PILASTRI          -->
  <!-- ========================================== -->
  <div id="view-ecosystem" class="view-section" style="display:none;">
    <div class="kpi-grid" id="kpi-grid"></div>

    <div class="kpi-grid" style="margin-bottom:20px;">
      <div class="kpi-card" style="border-left:4px solid #38bdf8;">
        <div class="label">🏢 Pilastro 1 — Azienda/</div>
        <div class="value" style="font-size:18px;">Governance &amp; C-Suite</div>
        <div class="sub"><code>Manifesto</code> • <code>adr/</code> • <code>tasks/</code> • <code>docs/</code> • <code>entita/</code></div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm" onclick="openDoc('Azienda/Manifesto_Fondazione_Footlink.md', 'preview')" style="background:rgba(56,189,248,0.15);border-color:#38bdf8;color:#7dd3fc;">
            📜 Manifesto di Fondazione
          </button>
          <button class="btn btn-sm" onclick="switchExecutiveView('knowledge')" style="background:rgba(255,255,255,0.06);">
            📚 Archivio Documentale ↗
          </button>
          <button class="btn btn-sm" onclick="switchExecutiveView('entities')" style="background:rgba(56,189,248,0.15);border-color:#38bdf8;color:#7dd3fc;">
            🏛️ 6 Entità di Dominio ↗
          </button>
        </div>
      </div>

      <div class="kpi-card" style="border-left:4px solid #22c55e;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="label">💻 Pilastro 2 — Applicativo/</div>
          <span class="pill green" style="font-size:10px;padding:2px 8px;">Frontend &amp; Backend</span>
        </div>
        <div class="value" style="font-size:18px;margin-top:4px;">Piattaforma PLM + PIM</div>
        <div class="sub"><code>backend/</code> (FastAPI :8000) • <code>frontend/</code> (React :5173)</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-approve" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
            🚀 Apri Frontend (:5173) ↗
          </a>
          <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noopener noreferrer" class="btn btn-sm" style="background:rgba(34,197,94,0.15);border-color:#22c55e;color:#86efac;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
            📖 Documentazione API (:8000/docs) ↗
          </a>
          <button class="btn btn-sm" onclick="openDoc('Applicativo/frontend/app-live-preview.html')" style="background:rgba(56,189,248,0.15);border-color:#38bdf8;color:#7dd3fc;display:inline-flex;align-items:center;gap:4px;">
            👁️ Live Preview Standalone
          </button>
          <a href="http://localhost:5173/dam/index.html" target="_blank" rel="noopener noreferrer" class="btn btn-sm" style="background:rgba(16,185,129,0.15);border-color:#10b981;color:#6ee7b7;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
            📁 Archivio DAM Adv &amp; Social ↗
          </a>
        </div>
      </div>

      <div class="kpi-card" style="border-left:4px solid #a855f7;">
        <div class="label">🎛️ Pilastro 3 — Portale Founder Control/</div>
        <div class="value" style="font-size:18px;">Cabina di Regia L1–L6</div>
        <div class="sub"><code>control_center.py</code> • Gatekeeper &amp; Real-Time Sync</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <a href="/codebase-dashboard" target="_blank" rel="noopener noreferrer" class="btn btn-sm" style="background:rgba(168,85,247,0.15);border-color:#a855f7;color:#d8b4fe;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
            📊 Dashboard Codebase (SLOC &amp; Git) ↗
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal-backdrop" id="doc-modal" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-header-left">
        <span class="file-icon" id="modal-file-icon">📄</span>
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <strong id="modal-title" style="font-size:14px;letter-spacing:-0.2px;">Documento</strong>
            <span class="pill" id="modal-file-type-badge" style="font-size:10px;padding:2px 8px;">MD</span>
          </div>
          <div id="modal-subtitle" style="font-size:11px;color:var(--muted);"></div>
        </div>
      </div>

      <div class="modal-header-center">
        <div class="segmented-control" id="view-mode-selector">
          <button type="button" class="seg-btn active" id="btn-seg-preview" onclick="setDocMode('preview')">
            <span>👁️ Anteprima</span>
          </button>
          <button type="button" class="seg-btn" id="btn-seg-code" onclick="setDocMode('code')">
            <span>💻 Codice</span>
          </button>
          <button type="button" class="seg-btn" id="btn-seg-edit" onclick="setDocMode('edit')" style="border-left:1px solid rgba(255,255,255,0.12);">
            <span>✏️ Modifica</span>
          </button>
        </div>
      </div>

      <div class="modal-header-right">
        <div id="html-viewport-controls" style="display:none;align-items:center;gap:4px;">
          <button class="btn btn-sm" id="btn-vp-desktop" onclick="setHtmlViewport('desktop')" title="Vista Desktop (100%)">🖥️ 100%</button>
          <button class="btn btn-sm" id="btn-vp-mobile" onclick="setHtmlViewport('mobile')" title="Vista Mobile (375px)">📱 375px</button>
        </div>
        <button class="btn btn-sm btn-approve" id="btn-save-doc" onclick="saveCurrentDoc()" style="display:none;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;font-weight:700;" title="Salva modifiche su disco">💾 Salva Modifiche</button>
        <button class="btn btn-sm" id="btn-open-tab" onclick="openInNewTab()" style="display:none;" title="Apri in una nuova scheda del browser">↗ Nuova Scheda</button>
        <button class="btn btn-sm" id="btn-copy" onclick="copyModalContent()" title="Copia contenuto negli appunti">📋 Copia</button>
        <button class="btn btn-sm" onclick="closeModal()" title="Chiudi finestra (Esc)">✕ Chiudi</button>
      </div>
    </div>

    <div class="modal-body-wrapper">
      <div id="modal-md-view" class="md-preview" style="display:none;"></div>
      <div id="modal-html-view" class="html-preview-container" style="display:none;">
        <iframe id="modal-html-iframe" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" title="HTML Preview"></iframe>
      </div>
      <div id="modal-code-view" class="code-preview" style="display:none;">
        <pre><code id="modal-code-text"></code></pre>
      </div>
      <div id="modal-edit-view" style="display:none;flex:1;height:100%;flex-direction:column;padding:12px;background:#090d16;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;color:var(--muted);">
          <span>✏️ <strong>Editor Markdown Live:</strong> Modifica il contenuto testuale e clicca su "💾 Salva Modifiche" per aggiornare il file su disco.</span>
          <span id="doc-edit-status" style="font-weight:700;color:#22c55e;"></span>
        </div>
        <textarea id="modal-edit-textarea" style="width:100%;flex:1;min-height:550px;background:#0d1117;color:#e6edf3;border:1px solid #30363d;border-radius:8px;padding:16px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:13.5px;line-height:1.6;resize:none;outline:none;" spellcheck="false"></textarea>
      </div>
    </div>
  </div>
</div>
      </div>
    </div>
  </div>
</div>

<div class="modal-backdrop" id="create-task-modal" onclick="if(event.target===this)closeCreateTaskModal()">
  <div class="modal-form-card">
    <div class="modal-form-header">
      <div>
        <h3>✨ Nuova Direttiva / Task Founder</h3>
        <p>Inserisci un'iniziativa: verrà registrata in <code>Azienda/tasks/</code>, sincronizzata nel registro e inviata alla C-Suite per triage, strutturazione ed esecuzione.</p>
      </div>
      <button class="btn btn-sm" onclick="closeCreateTaskModal()" title="Chiudi finestra (Esc)">✕ Chiudi</button>
    </div>

    <div class="modal-form-body">
      <!-- Role selection with dynamic ID display -->
      <div class="form-group">
        <label>
          <span>Destinatario Iniziale per Triage &amp; Strutturazione:</span>
          <span class="hint" id="new-task-id-badge" style="font-family:monospace;font-weight:700;color:var(--accent);background:rgba(56,189,248,0.15);padding:2px 8px;border-radius:4px;">ID Calcolato: FTL-CEO-005</span>
        </label>
        <select class="form-select" id="new-task-role" onchange="onRoleChange(this.value)">
          <option value="CEO" selected>👑 CEO (footlink-ceo) — Triage Strategico, Allineamento OKR &amp; Scomposizione (Consigliato)</option>
          <option value="CGO">⚖️ CGO (footlink-cgo) — Governance, Ingegneria dei Processi, Schema &amp; ADR</option>
          <option value="CTO">💻 CTO (footlink-cto) — Architettura Tecnica, Backend FastAPI, React &amp; DB</option>
          <option value="CPO">📦 CPO (footlink-cpo) — Specifiche Prodotto PLM/PIM, UX/UI &amp; Scheda Tecnica</option>
          <option value="CRO">💰 CRO (footlink-cro) — FinOps, Pricing di Filiera &amp; Sostenibilità</option>
          <option value="CMO">📣 CMO (footlink-cmo) — Marketing, Posizionamento &amp; Go-To-Market Distretti</option>
        </select>
      </div>

      <!-- Title -->
      <div class="form-group">
        <label>
          <span>Titolo dell'Iniziativa / Task:</span>
          <span class="hint">Minimo 5 caratteri</span>
        </label>
        <input type="text" class="form-input" id="new-task-title" placeholder="Es. Integrazione modulo calcolo consumi tomaia e scarti pellami" />
      </div>

      <!-- Description -->
      <div class="form-group">
        <label>
          <span>Descrizione &amp; Direttiva Operativa:</span>
          <span class="hint">Spiega obiettivi, contesto e motivazione strategica</span>
        </label>
        <textarea class="form-textarea" id="new-task-desc" rows="3" placeholder="Descrivi in dettaglio la richiesta del Founder, specificando quali processi industriali tocca e quali C-Level devono collaborare..."></textarea>
      </div>

      <!-- 2 Columns: Priority / Status / Effort and Escalation / Due Date -->
      <div class="form-grid-2">
        <div class="form-group">
          <label><span>Priorità Esecutiva:</span></label>
          <select class="form-select" id="new-task-priority">
            <option value="critical">🔴 Critical (Bloccante / Massima priorità)</option>
            <option value="high" selected>🟠 High (Alta priorità)</option>
            <option value="medium">🟡 Medium (Normale / Sprint Backlog)</option>
            <option value="low">🔵 Low (Bassa / Miglioria futura)</option>
          </select>
        </div>

        <div class="form-group">
          <label><span>Stato Iniziale:</span></label>
          <select class="form-select" id="new-task-status">
            <option value="todo" selected>🟢 todo (Pronto per Presa in Carico C-Suite)</option>
            <option value="backlog">📥 backlog (In attesa di pianificazione sprint)</option>
          </select>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label><span>Stima Effort Iniziale:</span></label>
          <select class="form-select" id="new-task-effort">
            <option value="XS (<2h)">XS (&lt;2h) — Task rapido / Verifica puntuale</option>
            <option value="S (2-8h)">S (2-8h) — Mezza/Una giornata</option>
            <option value="M (1-3gg)" selected>M (1-3gg) — Standard deliverable</option>
            <option value="L (3-10gg)">L (3-10gg) — Epica / Sub-modulo complesso</option>
            <option value="XL (>10gg)">XL (&gt;10gg) — Milestone strategica</option>
          </select>
        </div>

        <div class="form-group">
          <label>
            <span>Policy di Escalation (L0–L6):</span>
            <span class="hint">Red Lines</span>
          </label>
          <select class="form-select" id="new-task-escalation">
            <option value="L2" selected>🛡️ L2 (Zero Spesa Autonoma €0 — Consigliato)</option>
            <option value="L0">⚡ L0 (Autonomia Piena C-Suite)</option>
            <option value="L1">ℹ️ L1 (Notifica Informativa Founder)</option>
            <option value="L3">💼 L3 (Scelta di Business &amp; Pricing Network)</option>
            <option value="L4">📐 L4 (Architettura &amp; Modello Dati 1:N)</option>
            <option value="L5">📢 L5 (Comunicazioni Esterne &amp; Partner)</option>
            <option value="L6">🔒 L6 (Sicurezza, Segreti &amp; Dati Critici)</option>
          </select>
        </div>
      </div>

      <!-- Acceptance Criteria -->
      <div class="form-group">
        <label>
          <span>Criteri di Accettazione / Risultati Attesi:</span>
          <span class="hint">Un criterio per riga</span>
        </label>
        <textarea class="form-textarea" id="new-task-criteria" rows="3" placeholder="Analisi preliminare e scomposizione organizzativa CEO/CGO&#10;Definizione dei deliverable e attribuzione delle dipendenze C-Suite&#10;Conferma di conformità FinOps e chiusura del task nel Founder Control Center"></textarea>
      </div>

      <!-- Tags Multi-Select -->
      <div class="form-group">
        <label>
          <span>Tag Tematici:</span>
          <span class="hint">Seleziona uno o più ambiti</span>
        </label>
        <div class="tag-chips" id="tag-chips-container">
          <span class="tag-chip selected" data-tag="governance" onclick="toggleTagChip(this)">⚖️ governance</span>
          <span class="tag-chip selected" data-tag="product" onclick="toggleTagChip(this)">📦 product</span>
          <span class="tag-chip" data-tag="PLM" onclick="toggleTagChip(this)">📐 PLM</span>
          <span class="tag-chip" data-tag="PIM" onclick="toggleTagChip(this)">🏷️ PIM</span>
          <span class="tag-chip" data-tag="infra" onclick="toggleTagChip(this)">☁️ infra</span>
          <span class="tag-chip" data-tag="finops" onclick="toggleTagChip(this)">💰 finops</span>
          <span class="tag-chip" data-tag="sales" onclick="toggleTagChip(this)">🤝 sales</span>
          <span class="tag-chip" data-tag="marketing" onclick="toggleTagChip(this)">📣 marketing</span>
        </div>
      </div>

      <!-- Notes for CEO/CGO -->
      <div class="form-group">
        <label>
          <span>Note &amp; Istruzioni di Triage per CEO &amp; CGO:</span>
          <span class="hint">Opzionale</span>
        </label>
        <input type="text" class="form-input" id="new-task-notes" placeholder="Es. Valutare se richiede nuovo ADR o integrazione con Sprint 4." />
      </div>

      <div id="create-task-error" style="display:none;color:#ef4444;background:rgba(239,68,68,0.12);border:1px solid #ef4444;padding:10px 14px;border-radius:8px;font-size:12.5px;"></div>
    </div>

    <div class="modal-form-footer">
      <div style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px;">
        <span>📋 Conforme al Task Object Schema v1.0</span>
        <span>•</span>
        <span>Google Antigravity Ready</span>
      </div>
      <div style="display:flex;gap:10px;">
        <button type="button" class="btn" onclick="closeCreateTaskModal()">Annulla</button>
        <button type="button" class="btn btn-create-task" id="btn-submit-task" onclick="submitCreateTask()">
          <span>🚀 Invia Direttiva alla C-Suite</span>
        </button>
      </div>
    </div>
  </div>
</div>

<div class="modal-backdrop" id="edit-task-modal" onclick="if(event.target===this)closeEditTaskModal()">
  <div class="modal-form-card">
    <div class="modal-form-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;">
          <h3 id="edit-task-header-id" style="font-family:monospace;letter-spacing:-0.2px;">FTL-XXX-000</h3>
          <span class="pill" id="edit-task-header-sprint" style="font-size:11px;"></span>
          <span class="pill" id="edit-task-header-role" style="font-size:11px;"></span>
        </div>
        <p style="font-size:12px;color:var(--muted);margin-top:4px;">Modifica i parametri del task. I dati verranno salvati su file in <code>Azienda/tasks/</code> e sincronizzati nel registro.</p>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="btn btn-sm" id="btn-edit-open-raw" onclick="openDocFromEditModal()" title="Visualizza il file JSON grezzo">🔍 JSON</button>
        <button class="btn btn-sm" onclick="closeEditTaskModal()" title="Chiudi finestra (Esc)">✕ Chiudi</button>
      </div>
    </div>
    <div id="edit-task-error-top" style="display:none;color:#ef4444;background:rgba(239,68,68,0.12);border-bottom:1px solid #ef4444;padding:10px 24px;font-size:12.5px;"></div>

    <div class="modal-form-body">
      <input type="hidden" id="edit-task-id-hidden" />

      <!-- Title -->
      <div class="form-group">
        <label>
          <span>Titolo del Task:</span>
          <span class="hint">Minimo 5 caratteri</span>
        </label>
        <input type="text" class="form-input" id="edit-task-title" />
      </div>

      <!-- Description -->
      <div class="form-group">
        <label>
          <span>Descrizione &amp; Mandato Operativo:</span>
          <span class="hint">Minimo 10 caratteri</span>
        </label>
        <textarea class="form-textarea" id="edit-task-desc" rows="3"></textarea>
      </div>

      <!-- 2 Columns: Role & Status / Priority & Effort -->
      <div class="form-grid-2">
        <div class="form-group">
          <label><span>Ruolo Assegnatario (C-Suite):</span></label>
          <select class="form-select" id="edit-task-role">
            <option value="CEO">👑 CEO (footlink-ceo)</option>
            <option value="CGO">⚖️ CGO (footlink-cgo)</option>
            <option value="CTO">💻 CTO (footlink-cto)</option>
            <option value="CPO">📦 CPO (footlink-cpo)</option>
            <option value="CRO">💰 CRO (footlink-cro)</option>
            <option value="CMO">📣 CMO (footlink-cmo)</option>
          </select>
        </div>

        <div class="form-group">
          <label><span>Stato Operativo:</span></label>
          <select class="form-select" id="edit-task-status">
            <option value="todo">🟢 todo (Pronto per Presa in Carico)</option>
            <option value="in_progress">🔄 in_progress (In Lavorazione)</option>
            <option value="review">🟣 review (In Attesa di Approvazione Founder)</option>
            <option value="done">✅ done (Completato ed Approvato)</option>
            <option value="backlog">📥 backlog (In Coda Pianificazione)</option>
            <option value="blocked">🔴 blocked (Bloccato da Dipendenza)</option>
            <option value="paused_ai_quota">⏸️ paused_ai_quota (Standby Quota FinOps)</option>
            <option value="cancelled">⚪ cancelled (Annullato)</option>
          </select>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label><span>Priorità Esecutiva:</span></label>
          <select class="form-select" id="edit-task-priority">
            <option value="critical">🔴 Critical (Bloccante / Massima)</option>
            <option value="high">🟠 High (Alta priorità)</option>
            <option value="medium">🟡 Medium (Normale / Sprint)</option>
            <option value="low">🔵 Low (Bassa / Miglioria futura)</option>
          </select>
        </div>

        <div class="form-group">
          <label><span>Stima Effort:</span></label>
          <select class="form-select" id="edit-task-effort">
            <option value="XS (<2h)">XS (&lt;2h) — Task rapido</option>
            <option value="S (2-8h)">S (2-8h) — Mezza/Una giornata</option>
            <option value="M (1-3gg)">M (1-3gg) — Standard deliverable</option>
            <option value="L (3-10gg)">L (3-10gg) — Epica / Sub-modulo</option>
            <option value="XL (>10gg)">XL (&gt;10gg) — Milestone strategica</option>
          </select>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label><span>Policy di Escalation (L0–L6):</span></label>
          <select class="form-select" id="edit-task-escalation">
            <option value="L2">🛡️ L2 (Zero Spesa Autonoma €0)</option>
            <option value="L0">⚡ L0 (Autonomia Piena C-Suite)</option>
            <option value="L1">ℹ️ L1 (Notifica Informativa Founder)</option>
            <option value="L3">💼 L3 (Scelta di Business &amp; Pricing Network)</option>
            <option value="L4">📐 L4 (Architettura &amp; Modello Dati 1:N)</option>
            <option value="L5">📢 L5 (Comunicazioni Esterne &amp; Partner)</option>
            <option value="L6">🔒 L6 (Sicurezza, Segreti &amp; Dati Critici)</option>
          </select>
        </div>

        <div class="form-group">
          <label><span>Creato Da:</span></label>
          <input type="text" class="form-input" id="edit-task-created-by" disabled style="opacity:0.75;" />
        </div>
      </div>

      <!-- Acceptance Criteria -->
      <div class="form-group">
        <label>
          <span>Criteri di Accettazione / Risultati Attesi (DoD):</span>
          <span class="hint">Un criterio per riga</span>
        </label>
        <textarea class="form-textarea" id="edit-task-criteria" rows="3"></textarea>
      </div>

      <!-- Tags Multi-Select -->
      <div class="form-group">
        <label>
          <span>Tag Tematici:</span>
          <span class="hint">Clicca sui tag per attivare/disattivare</span>
        </label>
        <div class="tag-chips" id="edit-tag-chips-container">
          <span class="tag-chip" data-tag="governance" onclick="toggleTagChip(this)">⚖️ governance</span>
          <span class="tag-chip" data-tag="product" onclick="toggleTagChip(this)">📦 product</span>
          <span class="tag-chip" data-tag="PLM" onclick="toggleTagChip(this)">📐 PLM</span>
          <span class="tag-chip" data-tag="PIM" onclick="toggleTagChip(this)">🏷️ PIM</span>
          <span class="tag-chip" data-tag="infra" onclick="toggleTagChip(this)">☁️ infra</span>
          <span class="tag-chip" data-tag="finops" onclick="toggleTagChip(this)">💰 finops</span>
          <span class="tag-chip" data-tag="sales" onclick="toggleTagChip(this)">🤝 sales</span>
          <span class="tag-chip" data-tag="marketing" onclick="toggleTagChip(this)">📣 marketing</span>
        </div>
      </div>

      <!-- Notes / Directives -->
      <div class="form-group">
        <label>
          <span>Note &amp; Direttive Esecutive:</span>
          <span class="hint">Modifica o aggiungi note per la C-Suite</span>
        </label>
        <textarea class="form-textarea" id="edit-task-notes" rows="2"></textarea>
      </div>

      <!-- Output Artifacts display if any -->
      <div class="form-group" id="edit-task-artifacts-group" style="display:none;">
        <label><span>Deliverable / Output Artifacts Collegati:</span></label>
        <div id="edit-task-artifacts-list" class="artifact-list"></div>
      </div>

      <div id="edit-task-error" style="display:none;color:#ef4444;background:rgba(239,68,68,0.12);border:1px solid #ef4444;padding:10px 14px;border-radius:8px;font-size:12.5px;"></div>
    </div>

    <div class="modal-form-footer">
      <div style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px;">
        <span>📝 Task Object Schema v1.0 Compliant</span>
        <span>•</span>
        <span>Salvataggio Diretto in Azienda/tasks/</span>
      </div>
      <div style="display:flex;gap:10px;">
        <button type="button" class="btn" onclick="closeEditTaskModal()">Annulla</button>
        <button type="button" class="btn btn-approve" id="btn-submit-edit-task" onclick="submitEditTask()">
          <span>💾 Salva Modifiche</span>
        </button>
      </div>
    </div>
  </div>
</div>

<div id="toast-notification" style="display:none;position:fixed;bottom:24px;right:24px;z-index:9999;background:#0f172a;border:1px solid #22c55e;color:#f8fafc;padding:12px 20px;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.5);font-size:13px;align-items:center;gap:10px;transition:opacity 0.25s ease;">
  <span id="toast-icon">✅</span>
  <span id="toast-text">Modifiche salvate con successo!</span>
</div>

<script>
let currentState = { tasks: [], docs: [] };

function showToast(msg, isError = false) {
  const t = document.getElementById('toast-notification');
  if (!t) return;
  t.style.borderColor = isError ? '#ef4444' : '#22c55e';
  document.getElementById('toast-icon').textContent = isError ? '❌' : '✅';
  document.getElementById('toast-text').textContent = msg;
  t.style.display = 'flex';
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => { t.style.display = 'none'; }, 250);
  }, 3500);
}

async function fetchState() {
  try {
    const res = await fetch('/api/state?_t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      currentState = await res.json();
      renderAll();
    }
  } catch (e) {
    console.error('Error fetching state:', e);
  }
}

let activeEpochFilter = 'EPOCH_2';
try {
  const savedEpoch = localStorage.getItem('fcc_epoch');
  if (savedEpoch) activeEpochFilter = savedEpoch;
} catch(e){}

let currentExecutiveView = 'csuite';
try {
  const savedView = localStorage.getItem('fcc_active_view');
  if (savedView) currentExecutiveView = savedView;
} catch(e){}

function switchExecutiveView(viewKey, persist = true) {
  if (persist) {
    currentExecutiveView = viewKey;
    try { localStorage.setItem('fcc_active_view', viewKey); } catch(e){}
  }

  const tabKeys = ['csuite', 'knowledge', 'entities', 'ecosystem', 'all'];
  tabKeys.forEach(k => {
    const tab = document.getElementById('tab-' + k);
    if (tab) tab.classList.toggle('active', k === viewKey);
  });

  const sections = {
    'csuite': document.getElementById('view-csuite'),
    'knowledge': document.getElementById('view-knowledge'),
    'entities': document.getElementById('view-entities'),
    'ecosystem': document.getElementById('view-ecosystem')
  };

  if (viewKey === 'all') {
    Object.values(sections).forEach(sec => {
      if (sec) sec.style.display = 'block';
    });
  } else {
    Object.entries(sections).forEach(([k, sec]) => {
      if (sec) sec.style.display = (k === viewKey) ? 'block' : 'none';
    });
  }

  if (persist) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

const SPRINT_MAP = {
  // EPOCA I - Sprint 1
  'FTL-GOV-001': 'S1', 'FTL-CEO-001': 'S1', 'FTL-TECH-001': 'S1', 'FTL-PROD-001': 'S1', 'FTL-REV-001': 'S1', 'FTL-MKT-001': 'S1',
  // EPOCA I - Sprint 2
  'FTL-GOV-002': 'S2', 'FTL-CEO-002': 'S2', 'FTL-PROD-002': 'S2', 'FTL-TECH-002': 'S2', 'FTL-TECH-003': 'S2', 'FTL-MKT-002': 'S2', 'FTL-REV-002': 'S2',
  // EPOCA I - Sprint 3
  'FTL-GOV-003': 'S3', 'FTL-CEO-003': 'S3', 'FTL-PROD-003': 'S3', 'FTL-TECH-004': 'S3',
  // EPOCA I - Sprint 4
  'FTL-CEO-004': 'S4', 'FTL-GOV-004': 'S4', 'FTL-REV-003': 'S4', 'FTL-MKT-003': 'S4', 'FTL-PROD-004': 'S4', 'FTL-TECH-005': 'S4',
  // EPOCA I - Sprint 5
  'FTL-CEO-005': 'S5', 'FTL-GOV-005': 'S5', 'FTL-PROD-005': 'S5', 'FTL-TECH-006': 'S5', 'FTL-REV-004': 'S5', 'FTL-MKT-004': 'S5', 'FTL-CEO-006': 'S5', 'FTL-CEO-007': 'S5',
  // EPOCA I - Sprint 6
  'FTL-CEO-008': 'S6', 'FTL-GOV-006': 'S6', 'FTL-PROD-006': 'S6', 'FTL-TECH-007': 'S6', 'FTL-REV-005': 'S6', 'FTL-MKT-005': 'S6',
  'FTL-CEO-009': 'S6', 'FTL-CEO-010': 'S6', 'FTL-CEO-011': 'S6', 'FTL-CEO-012': 'S6', 'FTL-PROD-007': 'S6',
  'FTL-PROD-008': 'S6', 'FTL-PROD-009': 'S6', 'FTL-TECH-008': 'S6', 'FTL-TECH-009': 'S6', 'FTL-TECH-010': 'S6', 'FTL-TECH-011': 'S6',
  // EPOCA I - Sprint 7
  'FTL-CEO-013': 'S7', 'FTL-GOV-007': 'S7', 'FTL-PROD-010': 'S7', 'FTL-TECH-012': 'S7', 'FTL-REV-006': 'S7', 'FTL-MKT-006': 'S7',
  'FTL-TECH-013': 'S7', 'FTL-PROD-011': 'S7', 'FTL-CEO-014': 'S7', 'FTL-CEO-015': 'S7', 'FTL-TECH-014': 'S7', 'FTL-TECH-015': 'S7',
  'FTL-TECH-016': 'S7', 'FTL-CEO-016': 'S7', 'FTL-MKT-007': 'S7', 'FTL-TECH-017': 'S7', 'FTL-TECH-018': 'S7', 'FTL-TECH-019': 'S7', 'FTL-TECH-020': 'S7',
  // EPOCA II - Sprint 8 (La Ripartenza & La Verticalizzazione)
  'FTL-CEO-017': 'S8', 'FTL-CEO-018': 'S8', 'FTL-CEO-019': 'S8', 'FTL-GOV-008': 'S8', 'FTL-PROD-012': 'S8',
  'FTL-TECH-021': 'S8', 'FTL-REV-007': 'S8', 'FTL-MKT-008': 'S8', 'FTL-TECH-022': 'S8', 'FTL-TECH-023': 'S8', 'FTL-PROD-013': 'S8',
};

const EPOCH_1_SPRINTS = new Set(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7']);

function getTaskEpoch(taskId) {
  const sp = SPRINT_MAP[taskId];
  if (sp && EPOCH_1_SPRINTS.has(sp)) return 'EPOCH_1';
  return 'EPOCH_2';
}

function setEpochFilter(epochKey) {
  activeEpochFilter = epochKey;
  try { localStorage.setItem('fcc_epoch', epochKey); } catch(e){}

  const btnMap = {
    'EPOCH_2': 'btn-epoch-2',
    'EPOCH_1': 'btn-epoch-1',
    'EPOCH_3': 'btn-epoch-3',
    'CORE': 'btn-epoch-core',
    'ALL': 'btn-epoch-all'
  };
  Object.entries(btnMap).forEach(([k, id]) => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle('active', k === epochKey);
  });

  // Sync Hub chips if present
  const chipMap = {
    'EPOCH_2': 'chip-epoch-2',
    'EPOCH_1': 'chip-epoch-1',
    'EPOCH_3': 'chip-epoch-3',
    'CORE': 'chip-epoch-core',
    'ALL': 'chip-epoch-all'
  };
  Object.entries(chipMap).forEach(([k, id]) => {
    const chip = document.getElementById(id);
    if (chip) chip.classList.toggle('active', k === epochKey);
  });

  const titleEl = document.getElementById('kanban-section-title');
  const bannerTitle = document.getElementById('epoch-banner-title');
  const bannerDesc = document.getElementById('epoch-banner-desc');
  const hubEpochDesc = document.getElementById('hub-epoch-active-desc');

  if (epochKey === 'EPOCH_2') {
    if (titleEl) titleEl.innerHTML = '📊 C-Suite Task Board — <strong>Epoca II: La Verticalizzazione (Sprint 8+)</strong> • Real-Time Sync';
    if (bannerTitle) bannerTitle.textContent = '🚀 EPOCA II: LA VERTICALIZZAZIONE (Da Sprint 8 — "La Ripartenza")';
    if (bannerDesc) bannerDesc.textContent = 'Focus su profondità funzionale verticale per modulo (Zero Horizontal Bloat) • Epoca I (Sprint 1–7, 67/67 Task Done 👑👑) consolidata e archiviata.';
    if (hubEpochDesc) hubEpochDesc.textContent = 'Mostrando: Epoca II (Sprint 8+ • Attiva)';
  } else if (epochKey === 'EPOCH_1') {
    if (titleEl) titleEl.innerHTML = '📦 Archivio Storico Consolidato — <strong>Epoca I: Fondazione Orizzontale (Sprint 1–7 • 67/67 Done 👑👑)</strong>';
    if (bannerTitle) bannerTitle.textContent = '📦 EPOCA I: FONDAZIONE & ESPANSIONE ORIZZONTALE (Sprint 1–7 • Consolidata)';
    if (bannerDesc) bannerDesc.textContent = 'Archivio storico completo sigillato con 67/67 Task completati, 10 ADR, 8 PRD e compendio ufficiale.';
    if (hubEpochDesc) hubEpochDesc.textContent = 'Mostrando: Epoca I (Archivio Storico Sprint 1–7)';
  } else if (epochKey === 'EPOCH_3') {
    if (titleEl) titleEl.innerHTML = '✨ C-Suite Task Board — <strong>Nuova Epoca (Epoca III) • Default Vuoto</strong>';
    if (bannerTitle) bannerTitle.textContent = '✨ NUOVA EPOCA: EPOCA III (Default Vuoto — Pronta per la Ripartenza)';
    if (bannerDesc) bannerDesc.textContent = 'Ambiente a tabula rasa configurato a default vuoto per il Founder. Nessuna contaminazione da epoche pregresse.';
    if (hubEpochDesc) hubEpochDesc.textContent = 'Mostrando: Nuova Epoca (Default Vuoto 📭)';
  } else if (epochKey === 'CORE') {
    if (titleEl) titleEl.innerHTML = '🏛️ C-Suite Board — <strong>Documenti Costituzionali &amp; Fondativi (Core)</strong>';
    if (bannerTitle) bannerTitle.textContent = '🏛️ PATRIMONIO COSTITUZIONALE & CORE (Perenne e Permanente)';
    if (bannerDesc) bannerDesc.textContent = 'Manifesto di Fondazione, Specifiche di Ruolo C-Suite, Registro Archivi e identità stabili trasversali a tutte le epoche.';
    if (hubEpochDesc) hubEpochDesc.textContent = 'Mostrando: Documenti Costituzionali & Core';
  } else {
    if (titleEl) titleEl.innerHTML = '🌐 C-Suite Task Board Globale — <strong>Tutte le Epoche (Sprint 1–8)</strong>';
    if (bannerTitle) bannerTitle.textContent = '🌐 PANORAMICA GLOBALE: TUTTE LE EPOCHE (Epoca I, Epoca II &amp; Costituzionali)';
    if (bannerDesc) bannerDesc.textContent = 'Tutti i 3 Pilastri di Root consultabili in una vista integrata omnicomprensiva.';
    if (hubEpochDesc) hubEpochDesc.textContent = 'Mostrando: Tutte le Epoche (Tutti i Documenti)';
  }
  renderAll();
}

function renderAll() {
  const allTasks = currentState.tasks || [];
  const epoch2Tasks = allTasks.filter(t => getTaskEpoch(t.task_id) === 'EPOCH_2');
  const epoch1Tasks = allTasks.filter(t => getTaskEpoch(t.task_id) === 'EPOCH_1');
  const epoch3Tasks = allTasks.filter(t => getTaskEpoch(t.task_id) === 'EPOCH_3');
  let tasks = [];
  if (activeEpochFilter === 'EPOCH_2') tasks = epoch2Tasks;
  else if (activeEpochFilter === 'EPOCH_1') tasks = epoch1Tasks;
  else if (activeEpochFilter === 'EPOCH_3') tasks = epoch3Tasks;
  else if (activeEpochFilter === 'CORE') tasks = [];
  else tasks = allTasks;

  const counts = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0, paused_ai_quota: 0 };
  tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });

  const e2Counts = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
  epoch2Tasks.forEach(t => { e2Counts[t.status] = (e2Counts[t.status] || 0) + 1; });
  const e1Done = epoch1Tasks.filter(t => t.status === 'done').length;

  const anyPaused = allTasks.some(t => t.status === 'paused_ai_quota');
  const pill = document.getElementById('quota-pill');
  if (anyPaused) {
    pill.className = 'pill amber';
    pill.textContent = '⏸️ AI Quota: STANDBY (paused_ai_quota)';
  } else {
    pill.className = 'pill green';
    pill.textContent = '⚡ AI Quota: ACTIVE (Google Antigravity Pro)';
  }

  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi-card" style="border-top:2px solid #38bdf8;">
      <div class="label">🚀 Progresso Epoca II (Sprint 8+)</div>
      <div class="value">${e2Counts.done} / ${epoch2Tasks.length} Done</div>
      <div class="sub">${e2Counts.todo} pronti (todo) • ${e2Counts.backlog} in backlog • ${e2Counts.in_progress} in corso</div>
    </div>
    <div class="kpi-card" style="border-top:2px solid #22c55e;">
      <div class="label">📦 Archivio Epoca I (Sprint 1–7)</div>
      <div class="value" style="color:#4ade80">${e1Done} / ${epoch1Tasks.length} Done 👑👑</div>
      <div class="sub">Consolidata al 100% • 10 ADR • 9 Moduli Base</div>
    </div>
    <div class="kpi-card" style="border-top:2px solid #a855f7;">
      <div class="label">✨ Nuova Epoca (Epoca III)</div>
      <div class="value" style="color:#c084fc">Default Vuoto</div>
      <div class="sub">0 Task attivi • Pronto per ripartenza</div>
    </div>
    <div class="kpi-card">
      <div class="label">File nei 3 Pilastri di Root</div>
      <div class="value">${(currentState.docs || []).length}</div>
      <div class="sub">🏢 Azienda • 💻 Applicativo • 🎛️ Portale</div>
    </div>
  `;

  // Render Founder Approval Queue
  const reviewTasks = allTasks.filter(t => t.status === 'review');

  // Update Navigation Badges & Active View
  const badgeRev = document.getElementById('nav-badge-review');
  if (badgeRev) {
    if (reviewTasks.length > 0) {
      badgeRev.style.display = 'inline-block';
      badgeRev.textContent = `🔔 ${reviewTasks.length}`;
    } else {
      badgeRev.style.display = 'none';
    }
  }

  const badgeDocs = document.getElementById('nav-badge-docs');
  if (badgeDocs) {
    const totalDocs = (currentState.docs || []).length;
    badgeDocs.textContent = `${totalDocs} docs`;
  }

  switchExecutiveView(currentExecutiveView, false);
  const aq = document.getElementById('approval-queue-container');
  if (reviewTasks.length === 0) {
    aq.innerHTML = '';
  } else {
    aq.innerHTML = `
      <div class="approval-banner">
        <h2>🔔 Coda Approvazioni Founder (${reviewTasks.length} task in stato <code>review</code> pronti per il tuo OK)</h2>
        ${reviewTasks.map(t => `
          <div style="background:rgba(15,23,42,0.75);border:1px solid var(--border);border-radius:10px;padding:14px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div><span class="task-id">${t.task_id}</span> <span class="role-badge">${t.assignee_role}</span> <strong>${t.title}</strong> (${t.escalation_level})</div>
              <div style="font-size:12px;color:#fde68a;margin-top:4px;">Motivo: ${t.escalation_reason || 'Revisione deliverable completati'}</div>
              <div style="margin-top:6px;display:flex;gap:10px;flex-wrap:wrap;">
                ${(t.output_artifacts || []).map(a => `<a class="artifact-link" onclick="openDoc('${a}')">📄 ${a}</a>`).join('')}
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-approve" onclick="updateTaskStatus('${t.task_id}', 'done')">✅ Approva e Sblocca Dipendenze</button>
              <button class="btn btn-warn" onclick="promptNote('${t.task_id}', 'todo')">🔄 Richiedi Modifica</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render Kanban
  if (activeEpochFilter === 'EPOCH_3') {
    document.getElementById('kanban-board').innerHTML = `
      <div style="grid-column: 1 / -1; background: rgba(15,23,42,0.7); border: 1px dashed rgba(56,189,248,0.45); border-radius: 14px; padding: 48px 24px; text-align: center; color: var(--muted); margin: 6px 0;">
        <div style="font-size: 44px; margin-bottom: 12px;">📭</div>
        <div style="display:inline-block;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.4);color:#38bdf8;margin-bottom:12px;">
          ✨ NUOVA EPOCA (EPOCA III) • DEFAULT VUOTO
        </div>
        <div style="font-size: 17px; font-weight: 700; color: #f8fafc;">Nessun Task Presente per la Nuova Epoca</div>
        <div style="font-size: 13.5px; max-width: 580px; margin: 8px auto 20px; line-height: 1.6; color: #94a3b8;">
          La cabina di regia per l'Epoca III è configurata a default vuoto, esattamente come richiesto dal Founder. Puoi inserire la prima direttiva o iniziativa strategica per avviare il backlog della nuova epoca.
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-approve" onclick="openCreateTaskModal()">✨ Crea Primo Task / Direttiva Founder</button>
          <button class="btn" onclick="setEpochFilter('EPOCH_2')">↩️ Torna a Epoca II (Attiva)</button>
        </div>
      </div>
    `;
    renderKnowledgeHub();
    document.getElementById('last-sync').textContent = 'Ultimo sync: ' + new Date().toLocaleTimeString('it-IT');
    return;
  }

  if (activeEpochFilter === 'CORE') {
    document.getElementById('kanban-board').innerHTML = `
      <div style="grid-column: 1 / -1; background: rgba(15,23,42,0.7); border: 1px dashed rgba(245,158,11,0.4); border-radius: 14px; padding: 40px 24px; text-align: center; color: var(--muted); margin: 6px 0;">
        <div style="font-size: 38px; margin-bottom: 10px;">🏛️</div>
        <div style="display:inline-block;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#fbbf24;margin-bottom:12px;">
          PATRIMONIO COSTITUZIONALE &amp; CORE
        </div>
        <div style="font-size: 16px; font-weight: 700; color: #f8fafc;">I Documenti Fondativi Non Hanno Task Operativi di Sprint</div>
        <div style="font-size: 13px; max-width: 540px; margin: 8px auto 16px; line-height: 1.6; color: #94a3b8;">
          Il Manifesto, le Specifiche di Ruolo e i registri costituzionali sono perenni e immutabili. Consulta l'archivio documentale sottostante.
        </div>
        <button class="btn" onclick="setEpochFilter('EPOCH_2')">↩️ Visualizza Task Epoca II</button>
      </div>
    `;
    renderKnowledgeHub();
    document.getElementById('last-sync').textContent = 'Ultimo sync: ' + new Date().toLocaleTimeString('it-IT');
    return;
  }

  const columns = [
    { key: 'backlog', label: '📥 Backlog' },
    { key: 'todo', label: '🟢 Todo / Ready' },
    { key: 'in_progress', label: '🔄 In Progress' },
    { key: 'review', label: '🟣 In Review (Founder)' },
    { key: 'done', label: '✅ Done' }
  ];

  document.getElementById('kanban-board').innerHTML = columns.map(col => {
    let colTasks = tasks.filter(t => col.key === 'backlog' ? (t.status === 'backlog' || t.status === 'paused_ai_quota' || t.status === 'blocked') : t.status === col.key);

    if (col.key === 'done') {
      // Sort Done tasks descending by updated_at / created_at (most recently approved first)
      colTasks.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
      const totalDone = colTasks.length;
      const displayed = showAllDone ? colTasks : colTasks.slice(0, 10);
      return `
        <div class="col">
          <div class="col-header">
            <span>${col.label}</span>
            <span class="pill green" title="${totalDone} task completati in questa vista">${displayed.length} / ${totalDone}</span>
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;padding:2px 2px;">
            <span>${showAllDone ? 'Tutti i ' + totalDone + ' completati' : 'Ultimi ' + displayed.length + ' completati'}</span>
            ${totalDone > 10 ? `<button class="btn btn-sm" onclick="toggleShowAllDone()" style="padding:2px 8px;font-size:10px;background:rgba(255,255,255,0.06);">${showAllDone ? 'Mostra 10' : 'Vedi tutti (' + totalDone + ')'}</button>` : ''}
          </div>
          <div class="col-cards">
            ${displayed.map(t => renderCard(t)).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="col">
        <div class="col-header">
          <span>${col.label}</span>
          <span class="pill">${colTasks.length}</span>
        </div>
        <div class="col-cards">
          ${colTasks.map(t => renderCard(t)).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Render C-Suite Knowledge Hub & Document Explorer
  renderKnowledgeHub();

  document.getElementById('last-sync').textContent = 'Ultimo sync: ' + new Date().toLocaleTimeString('it-IT');
}

function getSprintBadge(taskId) {
  const s = SPRINT_MAP[taskId];
  const ep = getTaskEpoch(taskId) === 'EPOCH_1' ? 'E1' : 'E2';
  return s ? `<span style="font-size:10px;color:var(--muted);">[${ep}·${s}]</span>` : `<span style="font-size:10px;color:#38bdf8;">[E2·S8+]</span>`;
}

function renderCard(t) {
  const extraClass = t.status === 'review' ? 'review-highlight' : (t.status === 'in_progress' ? 'inprog-highlight' : '');
  const isFounder = (t.created_by === 'Founder (Control Center)') || 
                    (t.created_by && t.created_by.includes('Control Center')) ||
                    (t.created_by === 'Founder' && !SPRINT_MAP[t.task_id] && t.task_id !== 'FTL-CEO-006');
  const founderCardClass = isFounder ? 'founder-card' : '';
  const sprintBadge = getSprintBadge(t.task_id);
  const founderBadge = isFounder ? '<span class="badge-founder-directive" title="Iniziativa inserita direttamente dal Founder per triage C-Suite">👑 Direttiva Founder</span>' : '';
  return `
    <div class="task-card ${extraClass} ${founderCardClass}">
      <div class="task-top">
        <span class="task-id" style="cursor:pointer;" onclick="openEditTaskModal('${t.task_id}')" title="Clicca per modificare">${t.task_id}</span>
        ${sprintBadge} ${founderBadge}
        <span class="role-badge role-${t.assignee_role}" style="margin-left:auto;">${t.assignee_role} • ${t.escalation_level}</span>
      </div>
      <div class="task-title" style="cursor:pointer;" onclick="openEditTaskModal('${t.task_id}')" title="Clicca per aprire e modificare">${t.title}</div>
      <div class="task-desc">${t.description}</div>
      ${t.escalation_reason ? `<div class="esc-box">⚠️ <strong>Escalation:</strong> ${t.escalation_reason}</div>` : ''}
      ${t.notes ? `<div style="font-size:11px;color:#cbd5e1;background:rgba(255,255,255,0.04);padding:6px;border-radius:6px;">📝 ${t.notes}</div>` : ''}
      <div class="artifact-list">
        ${(t.output_artifacts || []).map(a => `<a class="artifact-link" onclick="openDoc('${a}')">🔗 ${a}</a>`).join('')}
      </div>
      <div class="card-actions">
        <button class="btn btn-sm btn-approve" onclick="openEditTaskModal('${t.task_id}')">✏️ Modifica</button>
        ${t.status === 'review' ? `<button class="btn btn-sm" onclick="updateTaskStatus('${t.task_id}', 'done')" style="background:rgba(34,197,94,0.3);color:#4ade80;">✅ Approva</button>` : ''}
        ${t.status !== 'done' ? `<button class="btn btn-sm" onclick="promptNote('${t.task_id}', '${t.status}')">📝 Nota</button>` : ''}
        <button class="btn btn-sm" onclick="openDoc('${t._rel_path || ('Azienda/tasks/' + t.task_id + '.json')}')">🔍 JSON</button>
      </div>
    </div>
  `;
}

let currentEditingTaskId = null;

function openEditTaskModal(taskId) {
  const t = (currentState.tasks || []).find(x => x.task_id === taskId);
  if (!t) return;

  currentEditingTaskId = taskId;
  document.getElementById('edit-task-id-hidden').value = taskId;
  document.getElementById('edit-task-header-id').textContent = taskId;

  const sprintBadge = SPRINT_MAP[taskId] || 'Backlog';
  const headerSprint = document.getElementById('edit-task-header-sprint');
  headerSprint.textContent = sprintBadge.startsWith('S') ? 'Sprint ' + sprintBadge.slice(1) : sprintBadge;
  headerSprint.className = 'pill ' + (sprintBadge.startsWith('S') ? 'purple' : 'amber');

  const headerRole = document.getElementById('edit-task-header-role');
  headerRole.textContent = t.assignee_role + ' (' + (t.assignee_agent || 'unassigned') + ')';
  headerRole.className = 'pill green';

  document.getElementById('edit-task-title').value = t.title || '';
  document.getElementById('edit-task-desc').value = t.description || '';
  document.getElementById('edit-task-role').value = t.assignee_role || 'CEO';
  document.getElementById('edit-task-priority').value = t.priority || 'high';
  document.getElementById('edit-task-status').value = t.status || 'todo';
  document.getElementById('edit-task-effort').value = t.estimated_effort || 'M (1-3gg)';
  document.getElementById('edit-task-escalation').value = t.escalation_level || 'L2';
  document.getElementById('edit-task-created-by').value = t.created_by || 'Founder';
  document.getElementById('edit-task-notes').value = t.notes || '';

  // Criteria
  const criteria = Array.isArray(t.acceptance_criteria) ? t.acceptance_criteria.join('\n') : (t.acceptance_criteria || '');
  document.getElementById('edit-task-criteria').value = criteria;

  // Tags
  const currentTags = Array.isArray(t.tags) ? t.tags : [];
  document.querySelectorAll('#edit-tag-chips-container .tag-chip').forEach(chip => {
    const tag = chip.getAttribute('data-tag');
    if (currentTags.includes(tag)) {
      chip.classList.add('selected');
    } else {
      chip.classList.remove('selected');
    }
  });

  // Artifacts
  const artifactsGroup = document.getElementById('edit-task-artifacts-group');
  const artifactsList = document.getElementById('edit-task-artifacts-list');
  if (t.output_artifacts && t.output_artifacts.length > 0) {
    artifactsGroup.style.display = 'block';
    artifactsList.innerHTML = t.output_artifacts.map(a => `
      <a class="artifact-link" onclick="closeEditTaskModal(); openDoc('${a}');">🔗 ${a} ↗</a>
    `).join('');
  } else {
    artifactsGroup.style.display = 'none';
    artifactsList.innerHTML = '';
  }

  const errDiv = document.getElementById('edit-task-error');
  if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }
  const errDivTop = document.getElementById('edit-task-error-top');
  if (errDivTop) { errDivTop.style.display = 'none'; errDivTop.textContent = ''; }

  document.getElementById('edit-task-modal').style.display = 'flex';
}

function closeEditTaskModal() {
  const modal = document.getElementById('edit-task-modal');
  if (modal) modal.style.display = 'none';
  currentEditingTaskId = null;
}

function openDocFromEditModal() {
  if (!currentEditingTaskId) return;
  const t = (currentState.tasks || []).find(x => x.task_id === currentEditingTaskId);
  const path = (t && t._rel_path) ? t._rel_path : `Azienda/tasks/${currentEditingTaskId}.json`;
  closeEditTaskModal();
  openDoc(path);
}

async function submitEditTask() {
  const taskId = document.getElementById('edit-task-id-hidden').value;
  if (!taskId) return;

  const errDiv = document.getElementById('edit-task-error');
  const errDivTop = document.getElementById('edit-task-error-top');
  const btn = document.getElementById('btn-submit-edit-task');
  if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }
  if (errDivTop) { errDivTop.style.display = 'none'; errDivTop.textContent = ''; }

  const title = document.getElementById('edit-task-title').value.trim();
  const desc = document.getElementById('edit-task-desc').value.trim();
  const role = document.getElementById('edit-task-role').value;
  const priority = document.getElementById('edit-task-priority').value;
  const status = document.getElementById('edit-task-status').value;
  const effort = document.getElementById('edit-task-effort').value;
  const escalation = document.getElementById('edit-task-escalation').value;
  const rawCriteria = document.getElementById('edit-task-criteria').value;
  const notes = document.getElementById('edit-task-notes').value.trim();

  function showError(msg) {
    if (errDiv) {
      errDiv.style.display = 'block';
      errDiv.textContent = msg;
      errDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (errDivTop) {
      errDivTop.style.display = 'block';
      errDivTop.textContent = msg;
    }
    showToast(msg, true);
  }

  if (title.length < 5) {
    showError('⚠️ Il titolo deve contenere almeno 5 caratteri.');
    return;
  }
  if (desc.length < 10) {
    showError('⚠️ La descrizione deve contenere almeno 10 caratteri.');
    return;
  }

  const selectedTags = Array.from(document.querySelectorAll('#edit-tag-chips-container .tag-chip.selected'))
    .map(c => c.getAttribute('data-tag'));

  const criteria = rawCriteria
    .split('\n')
    .map(c => c.trim().replace(/^[-*•\s]+/, ''))
    .filter(c => c.length > 0);

  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Salvataggio in corso...</span>';

  try {
    const res = await fetch('/api/edit_task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        title: title,
        description: desc,
        assignee_role: role,
        priority: priority,
        status: status,
        estimated_effort: effort,
        escalation_level: escalation,
        tags: selectedTags,
        acceptance_criteria: criteria,
        notes: notes
      })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Errore durante il salvataggio del task.');
    }

    // Immediately update local currentState with the updated task from server
    if (data.task) {
      const idx = (currentState.tasks || []).findIndex(x => x.task_id === data.task.task_id);
      if (idx !== -1) {
        currentState.tasks[idx] = data.task;
      } else {
        currentState.tasks.push(data.task);
      }
      renderAll();
    }

    closeEditTaskModal();
    showToast(`✅ Task ${taskId} salvato con successo!`);
    await fetchState();
  } catch (err) {
    showError(`❌ ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>💾 Salva Modifiche</span>';
  }
}

function openCreateTaskModal() {
  const modal = document.getElementById('create-task-modal');
  if (!modal) return;
  document.getElementById('new-task-title').value = '';
  document.getElementById('new-task-desc').value = '';
  document.getElementById('new-task-priority').value = 'high';
  document.getElementById('new-task-status').value = 'todo';
  document.getElementById('new-task-effort').value = 'M (1-3gg)';
  document.getElementById('new-task-escalation').value = 'L2';
  document.getElementById('new-task-criteria').value = 'Analisi preliminare e scomposizione organizzativa CEO/CGO\nDefinizione dei deliverable e attribuzione delle dipendenze C-Suite\nConferma di conformità FinOps e chiusura del task nel Founder Control Center';
  document.getElementById('new-task-notes').value = '';
  const errDiv = document.getElementById('create-task-error');
  if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }
  
  const roleSelect = document.getElementById('new-task-role');
  if (roleSelect) roleSelect.value = 'CEO';
  onRoleChange('CEO');

  modal.style.display = 'flex';
  setTimeout(() => {
    const titleInput = document.getElementById('new-task-title');
    if (titleInput) titleInput.focus();
  }, 100);
}

function closeCreateTaskModal() {
  const modal = document.getElementById('create-task-modal');
  if (modal) modal.style.display = 'none';
}

async function onRoleChange(role) {
  const roleTagsMap = {
    'CEO': ['governance', 'product'],
    'CGO': ['governance'],
    'CTO': ['infra', 'product'],
    'CPO': ['product', 'PLM', 'PIM'],
    'CRO': ['finops'],
    'CMO': ['marketing', 'sales']
  };
  const recTags = roleTagsMap[role] || ['governance'];
  document.querySelectorAll('#tag-chips-container .tag-chip').forEach(chip => {
    const tag = chip.getAttribute('data-tag');
    if (recTags.includes(tag)) {
      chip.classList.add('selected');
    } else {
      chip.classList.remove('selected');
    }
  });

  await updateNextTaskIdPreview(role);
}

async function updateNextTaskIdPreview(role) {
  const badge = document.getElementById('new-task-id-badge');
  if (!badge) return;
  try {
    const res = await fetch(`/api/next_task_id?role=${encodeURIComponent(role)}`);
    const data = await res.json();
    if (data.next_task_id) {
      badge.textContent = `ID Calcolato: ${data.next_task_id}`;
    }
  } catch (e) {
    console.error('Error fetching next task id:', e);
  }
}

function toggleTagChip(el) {
  el.classList.toggle('selected');
}

async function submitCreateTask() {
  const errDiv = document.getElementById('create-task-error');
  const btn = document.getElementById('btn-submit-task');
  errDiv.style.display = 'none';
  errDiv.textContent = '';

  const role = document.getElementById('new-task-role').value;
  const title = document.getElementById('new-task-title').value.trim();
  const desc = document.getElementById('new-task-desc').value.trim();
  const priority = document.getElementById('new-task-priority').value;
  const status = document.getElementById('new-task-status').value;
  const effort = document.getElementById('new-task-effort').value;
  const escalation = document.getElementById('new-task-escalation').value;
  const rawCriteria = document.getElementById('new-task-criteria').value;
  const notes = document.getElementById('new-task-notes').value.trim();

  if (title.length < 5) {
    errDiv.style.display = 'block';
    errDiv.textContent = '⚠️ Il titolo deve contenere almeno 5 caratteri.';
    return;
  }
  if (desc.length < 10) {
    errDiv.style.display = 'block';
    errDiv.textContent = '⚠️ La descrizione deve contenere almeno 10 caratteri per guidare la C-Suite.';
    return;
  }

  const selectedTags = Array.from(document.querySelectorAll('#tag-chips-container .tag-chip.selected'))
    .map(c => c.getAttribute('data-tag'));

  const criteria = rawCriteria
    .split('\n')
    .map(c => c.trim().replace(/^[-*•\s]+/, ''))
    .filter(c => c.length > 0);

  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Creazione in corso...</span>';

  try {
    const res = await fetch('/api/create_task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignee_role: role,
        title: title,
        description: desc,
        priority: priority,
        status: status,
        estimated_effort: effort,
        escalation_level: escalation,
        tags: selectedTags,
        acceptance_criteria: criteria,
        notes: notes
      })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Errore durante la creazione del task.');
    }

    closeCreateTaskModal();
    await fetchState();
    alert(`✅ Task ${data.task.task_id} creato con successo!\n\nAssegnato a: ${data.task.assignee_role} (${data.task.assignee_agent})\nStato: ${data.task.status}\n\nÈ ora disponibile per il triage e la strutturazione da parte di CEO e CGO.`);
  } catch (err) {
    errDiv.style.display = 'block';
    errDiv.textContent = `❌ ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🚀 Invia Direttiva alla C-Suite</span>';
  }
}

async function updateTaskStatus(taskId, newStatus, note = null) {
  await fetch('/api/update_task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId, status: newStatus, note })
  });
  await fetchState();
}

async function promptNote(taskId, newStatus) {
  const note = prompt(`Inserisci una direttiva o nota del Founder per ${taskId}:`);
  if (note !== null && note.trim() !== '') {
    await updateTaskStatus(taskId, newStatus, note.trim());
  }
}

async function toggleQuotaPause() {
  await fetch('/api/toggle_pause', { method: 'POST' });
  await fetchState();
}

let showAllDone = false;
function toggleShowAllDone() {
  showAllDone = !showAllDone;
  renderAll();
}

let hubFilter = {
  role: 'TUTTI',
  ext: 'all',
  founderOnly: false,
  entitiesOnly: false,
  query: ''
};

function toggleDomainEntitiesFilter() {
  hubFilter.entitiesOnly = !hubFilter.entitiesOnly;
  const chip = document.getElementById('chip-entities-filter');
  if (chip) chip.classList.toggle('active', hubFilter.entitiesOnly);
  renderKnowledgeHub();
}

function renderKnowledgeHub() {
  const rawDocs = currentState.docs || [];
  const hasQuery = Boolean(hubFilter.query && hubFilter.query.trim());

  // When a search query is active, search across the entire knowledge base.
  // Otherwise, filter by the active epoch selection.
  const allDocs = rawDocs.filter(d => {
    if (hasQuery) {
      return true;
    }
    if (activeEpochFilter === 'EPOCH_2') {
      return d.epoch === 'EPOCH_2' || d.epoch === 'CORE';
    }
    if (activeEpochFilter === 'EPOCH_1') {
      return d.epoch === 'EPOCH_1';
    }
    if (activeEpochFilter === 'EPOCH_3') {
      return d.epoch === 'EPOCH_3';
    }
    if (activeEpochFilter === 'CORE') {
      return d.epoch === 'CORE';
    }
    return true; // ALL
  });
  allDocs.sort((a, b) => (b.mtime || '').localeCompare(a.mtime || ''));

  const rolesList = [
    { key: 'TUTTI', label: '🏢 Tutti i Documenti' },
    { key: 'CEO', label: '👔 CEO' },
    { key: 'CGO', label: '⚖️ CGO' },
    { key: 'CTO', label: '💻 CTO' },
    { key: 'CPO', label: '🎯 CPO' },
    { key: 'CRO', label: '💰 CRO' },
    { key: 'CMO', label: '📢 CMO' }
  ];

  const roleCounts = { TUTTI: allDocs.length };
  rolesList.forEach(r => { if (r.key !== 'TUTTI') roleCounts[r.key] = 0; });
  allDocs.forEach(d => {
    const r = d.role || 'TUTTI';
    if (roleCounts[r] !== undefined) roleCounts[r]++;
  });

  const tabsContainer = document.getElementById('role-tabs-container');
  if (tabsContainer) {
    tabsContainer.innerHTML = rolesList.map(r => `
      <button class="role-tab ${hubFilter.role === r.key ? 'active' : ''}" onclick="setDocFilterRole('${r.key}')">
        <span>${r.label}</span>
        <span class="count">${roleCounts[r.key] || 0}</span>
      </button>
    `).join('');
  }

  let filtered = allDocs.filter(d => {
    if (hubFilter.entitiesOnly && !d.path.startsWith('Azienda/entita/')) {
      return false;
    }
    if (hubFilter.founderOnly && !d.is_founder_directive) {
      return false;
    }
    if (hubFilter.role !== 'TUTTI' && d.role !== hubFilter.role) {
      return false;
    }
    if (hubFilter.ext !== 'all') {
      if (hubFilter.ext === '.py') {
        if (d.ext !== '.py' && d.ext !== '.tsx') return false;
      } else if (d.ext !== hubFilter.ext) {
        return false;
      }
    }
    if (hubFilter.query) {
      const q = hubFilter.query.toLowerCase().trim();
      const qNorm = q.replace(/[\s\-_]+/g, '');
      const pathLow = (d.path || '').toLowerCase();
      const titleLow = (d.title || '').toLowerCase();
      const pathNorm = pathLow.replace(/[\s\-_]+/g, '');
      const titleNorm = titleLow.replace(/[\s\-_]+/g, '');
      const matchPath = pathLow.includes(q) || (qNorm.length > 2 && pathNorm.includes(qNorm));
      const matchTitle = titleLow.includes(q) || (qNorm.length > 2 && titleNorm.includes(qNorm));
      const matchPillar = (d.pillar || '').toLowerCase().includes(q);
      const matchRole = (d.role || '').toLowerCase().includes(q);
      if (!matchPath && !matchTitle && !matchPillar && !matchRole) return false;
    }
    return true;
  });

  const epochLabels = {
    EPOCH_2: '🚀 Epoca II (Sprint 8+)',
    EPOCH_1: '📦 Epoca I (Sprint 1–7)',
    EPOCH_3: '✨ Nuova Epoca (Default Vuoto)',
    CORE: '🏛️ Patrimonio Costituzionale',
    ALL: '🌐 Tutte le Epoche'
  };
  const activeEpochLabel = epochLabels[activeEpochFilter] || activeEpochFilter;

  const counterEl = document.getElementById('hub-doc-count');
  if (counterEl) {
    if (!hasQuery && activeEpochFilter === 'EPOCH_3') {
      counterEl.textContent = '0 Documenti (Default Vuoto)';
    } else {
      counterEl.textContent = `${filtered.length} di ${allDocs.length} Documenti`;
    }
  }

  const metaEl = document.getElementById('hub-results-meta');
  if (metaEl) {
    if (hasQuery) {
      metaEl.textContent = `Risultati ricerca per "${hubFilter.query}": ${filtered.length} file trovati nell'archivio • Filtro Ruolo: ${hubFilter.role} • Formato: ${hubFilter.ext === 'all' ? 'Tutti' : hubFilter.ext}${hubFilter.founderOnly ? ' • 👑 Solo Direttive Founder' : ''}`;
    } else if (activeEpochFilter === 'EPOCH_3') {
      metaEl.textContent = 'Epoca: ✨ Nuova Epoca (Epoca III) • Ambiente tabula rasa inizializzato a default vuoto per il Founder';
    } else {
      metaEl.textContent = `Mostrando ${filtered.length} file • Epoca: ${activeEpochLabel}${hubFilter.entitiesOnly ? ' • 🏛️ Solo Entità di Dominio' : ''} • Filtro: ${hubFilter.role} • Formato: ${hubFilter.ext === 'all' ? 'Tutti' : hubFilter.ext}${hubFilter.founderOnly ? ' • 👑 Solo Direttive Founder' : ''}`;
    }
  }

  const gridEl = document.getElementById('hub-docs-grid');
  if (!gridEl) return;

  if (!hasQuery && activeEpochFilter === 'EPOCH_3') {
    gridEl.innerHTML = `
      <div class="epoch-empty-default">
        <div class="icon">✨</div>
        <h3>Nuova Epoca (Epoca III) — Archivio Documentale a Default Vuoto</h3>
        <p>Non è presente alcun documento o deliverable per la Nuova Epoca.<br>
           L'archivio è inizializzato a <strong>default vuoto</strong> (tabula rasa), pronto ad accogliere i nuovi PRD, ADR e specifiche strategiche del Founder e del C-Suite.</p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap;">
          <button class="btn btn-approve" onclick="openCreateTaskModal()">✨ Crea Task Nuova Epoca</button>
          <button class="btn" onclick="openDoc('Azienda/ARCHIVIO_EPOCHE.md', 'preview')">📖 Consulta Registro Epoche</button>
          <button class="btn" onclick="setEpochFilter('EPOCH_2')">↩️ Torna a Epoca II (Attiva)</button>
        </div>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--muted); background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed var(--border);">
        <div style="font-size: 28px; margin-bottom: 8px;">🔍</div>
        <div style="font-size: 14px; font-weight: 600; color: #e2e8f0;">Nessun documento trovato${hasQuery ? ' per "' + escapeHtml(hubFilter.query) + '"' : ''}</div>
        <div style="font-size: 12px; margin-top: 4px;">Prova a verificare i filtri C-Level (${hubFilter.role}), il formato (${hubFilter.ext}) o la parola chiave di ricerca.</div>
      </div>
    `;
    return;
  }

  const roleEmoji = {
    CEO: '👔',
    CGO: '⚖️',
    CTO: '💻',
    CPO: '🎯',
    CRO: '💰',
    CMO: '📢',
    TUTTI: '🏢',
    GENERAL: '📄'
  };

  gridEl.innerHTML = filtered.map(d => {
    const isHtml = (d.ext === '.html' || d.ext === '.htm');
    const cleanExt = (d.ext || '').replace('.', '');
    const emoji = roleEmoji[d.role] || '📄';
    const epochBadge = (d.epoch === 'EPOCH_1')
      ? `<span class="epoch-card-badge e1">📦 Epoca I</span>`
      : (d.epoch === 'EPOCH_2')
      ? `<span class="epoch-card-badge e2">🚀 Epoca II</span>`
      : (d.epoch === 'EPOCH_3')
      ? `<span class="epoch-card-badge e3">✨ Epoca III</span>`
      : `<span class="epoch-card-badge core">🏛️ Core</span>`;

    const isEntity = (d.path || '').startsWith('Azienda/entita/');
    const entityBadge = isEntity ? `<span class="doc-role-badge" style="background:rgba(56,189,248,0.18);color:#38bdf8;border:1px solid rgba(56,189,248,0.4);font-size:10px;font-weight:700;">🏛️ Entità di Dominio</span>` : '';

    return `
      <div class="doc-card">
        <div>
          <div class="doc-card-top">
            ${epochBadge}
            <span class="doc-role-badge role-${d.role}">${emoji} ${d.role}</span>
            ${entityBadge}
            <span class="doc-type-badge type-${cleanExt}">${cleanExt.toUpperCase()}</span>
            ${d.is_founder_directive ? `<span class="doc-role-badge" style="background:rgba(245,158,11,0.2);color:#fbbf24;border:1px solid rgba(245,158,11,0.4);font-weight:bold;font-size:10px;">👑 Direttiva Founder</span>` : ''}
            <span class="doc-size" style="font-size:11px;color:var(--muted);">${(d.size/1024).toFixed(1)} KB</span>
          </div>
          <div class="doc-card-title" title="${escapeHtml(d.title)}">${escapeHtml(d.title)}</div>
          <div class="doc-card-path" onclick="openDoc('${d.path}')" title="Clicca per aprire">${d.path}</div>
          <div class="doc-card-meta">
            <span>🏛️ ${d.pillar}</span>
            <span>🕒 ${d.mtime}</span>
          </div>
        </div>
        <div class="doc-card-actions">
          <button class="btn btn-sm btn-approve" onclick="openDoc('${d.path}', 'preview')">👁️ Anteprima Live</button>
          <button class="btn btn-sm" onclick="openDoc('${d.path}', 'code')">💻 Codice</button>
          <button class="btn btn-sm" onclick="openDoc('${d.path}', 'edit')" style="background:rgba(56,189,248,0.12);border-color:rgba(56,189,248,0.35);color:#38bdf8;" title="Modifica questo file direttamente">✏️ Modifica</button>
          ${isHtml ? `<button class="btn btn-sm" onclick="window.open('/raw?path=' + encodeURIComponent('${d.path}'), '_blank')" title="Apri in nuova scheda">↗ Scheda</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function toggleFounderDirectivesFilter() {
  hubFilter.founderOnly = !hubFilter.founderOnly;
  const chip = document.getElementById('chip-founder-directives');
  if (chip) chip.classList.toggle('active', hubFilter.founderOnly);
  renderKnowledgeHub();
}

function setDocFilterRole(role) {
  hubFilter.role = role;
  renderKnowledgeHub();
}

function setDocFilterExt(ext) {
  hubFilter.ext = ext;
  document.querySelectorAll('#format-filter-group .filter-chip').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ext') === ext);
  });
  renderKnowledgeHub();
}

function onSearchInput(val) {
  hubFilter.query = val.trim();
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.style.display = hubFilter.query ? 'block' : 'none';
  renderKnowledgeHub();
}

function clearSearch() {
  hubFilter.query = '';
  const input = document.getElementById('doc-search-input');
  if (input) input.value = '';
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.style.display = 'none';
  renderKnowledgeHub();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let currentDoc = {
  path: '',
  content: '',
  ext: '',
  mode: 'preview',
  viewport: 'desktop'
};

async function openDoc(path, forcedMode = null) {
  try {
    const res = await fetch('/api/doc?path=' + encodeURIComponent(path));
    const data = await res.json();
    const ext = (path.split('.').pop() || '').toLowerCase();

    currentDoc.path = path;
    currentDoc.content = data.content || '';
    currentDoc.ext = ext;
    currentDoc.viewport = 'desktop';

    // Default view mode:
    // Forced mode if provided, otherwise preview for .md / .html, code for others
    if (forcedMode) {
      currentDoc.mode = forcedMode;
    } else if (ext === 'md' || ext === 'html' || ext === 'htm') {
      currentDoc.mode = 'preview';
    } else {
      currentDoc.mode = 'code';
    }

    // Update Header Info
    document.getElementById('modal-title').textContent = path;
    const sizeKb = (new Blob([currentDoc.content]).size / 1024).toFixed(1);
    document.getElementById('modal-subtitle').textContent = `Estensione: .${ext} • Dimensione: ${sizeKb} KB`;

    const iconMap = { md: '📝', html: '🌐', htm: '🌐', json: '⚙️', py: '🐍', js: '📜' };
    document.getElementById('modal-file-icon').textContent = iconMap[ext] || '📄';

    const typeBadge = document.getElementById('modal-file-type-badge');
    typeBadge.textContent = ext.toUpperCase();
    typeBadge.className = ext === 'md' ? 'pill green' : (ext === 'html' || ext === 'htm' ? 'pill purple' : 'pill');

    // Controls visibility
    const isHtml = (ext === 'html' || ext === 'htm');
    const isRenderable = (ext === 'md' || isHtml);
    document.getElementById('btn-open-tab').style.display = isHtml ? 'inline-flex' : 'none';
    document.getElementById('html-viewport-controls').style.display = isHtml ? 'inline-flex' : 'none';
    document.getElementById('view-mode-selector').style.display = isRenderable ? 'inline-flex' : 'none';

    // Reset viewport state
    const htmlContainer = document.getElementById('modal-html-view');
    htmlContainer.classList.remove('mobile-view');
    const btnDesk = document.getElementById('btn-vp-desktop');
    const btnMob = document.getElementById('btn-vp-mobile');
    if (btnDesk && btnMob) {
      btnDesk.style.borderColor = 'var(--accent)';
      btnDesk.style.color = 'var(--accent)';
      btnMob.style.borderColor = 'var(--border)';
      btnMob.style.color = 'var(--text)';
    }

    updateModalView();
    document.getElementById('doc-modal').style.display = 'flex';
  } catch (err) {
    alert('Errore nel caricamento del file: ' + err);
  }
}

function setDocMode(mode) {
  if (currentDoc.mode === 'edit') {
    const textarea = document.getElementById('modal-edit-textarea');
    if (textarea) currentDoc.content = textarea.value;
  }
  currentDoc.mode = mode;
  updateModalView();
}

function updateModalView() {
  const btnPrev = document.getElementById('btn-seg-preview');
  const btnCode = document.getElementById('btn-seg-code');
  const btnEdit = document.getElementById('btn-seg-edit');
  const btnSave = document.getElementById('btn-save-doc');
  const mdView = document.getElementById('modal-md-view');
  const htmlView = document.getElementById('modal-html-view');
  const codeView = document.getElementById('modal-code-view');
  const editView = document.getElementById('modal-edit-view');
  const editTextarea = document.getElementById('modal-edit-textarea');
  const iframe = document.getElementById('modal-html-iframe');
  const codeText = document.getElementById('modal-code-text');

  if (btnPrev) btnPrev.classList.toggle('active', currentDoc.mode === 'preview');
  if (btnCode) btnCode.classList.toggle('active', currentDoc.mode === 'code');
  if (btnEdit) btnEdit.classList.toggle('active', currentDoc.mode === 'edit');
  if (btnSave) btnSave.style.display = currentDoc.mode === 'edit' ? 'inline-flex' : 'none';

  if (mdView) mdView.style.display = 'none';
  if (htmlView) htmlView.style.display = 'none';
  if (codeView) codeView.style.display = 'none';
  if (editView) editView.style.display = 'none';

  if (currentDoc.mode === 'edit') {
    if (editTextarea) {
      editTextarea.value = currentDoc.content || '';
    }
    const statusEl = document.getElementById('doc-edit-status');
    if (statusEl) statusEl.textContent = '';
    if (editView) editView.style.display = 'flex';
  } else if (currentDoc.mode === 'code') {
    codeText.textContent = currentDoc.content || '(File vuoto o non presente)';
    codeView.style.display = 'block';
  } else {
    if (currentDoc.ext === 'md') {
      mdView.innerHTML = renderMarkdown(currentDoc.content, currentDoc.path);
      mdView.style.display = 'block';
      mdView.scrollTop = 0;
    } else if (currentDoc.ext === 'html' || currentDoc.ext === 'htm') {
      iframe.src = '/raw?path=' + encodeURIComponent(currentDoc.path);
      htmlView.style.display = 'flex';
    } else {
      codeText.textContent = currentDoc.content;
      codeView.style.display = 'block';
    }
  }
}

async function saveCurrentDoc() {
  const textarea = document.getElementById('modal-edit-textarea');
  const statusEl = document.getElementById('doc-edit-status');
  const btnSave = document.getElementById('btn-save-doc');
  if (!textarea || !currentDoc.path) return;

  const newContent = textarea.value;
  if (statusEl) {
    statusEl.textContent = '⏳ Salvataggio in corso...';
    statusEl.style.color = '#38bdf8';
  }
  if (btnSave) btnSave.disabled = true;

  try {
    const res = await fetch('/api/save_doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: currentDoc.path,
        content: newContent
      })
    });
    const result = await res.json();
    if (result.ok) {
      currentDoc.content = newContent;
      if (statusEl) {
        statusEl.textContent = '✅ File salvato su disco con successo!';
        statusEl.style.color = '#22c55e';
      }
      const sizeKb = (new Blob([newContent]).size / 1024).toFixed(1);
      const sub = document.getElementById('modal-subtitle');
      if (sub) sub.textContent = `Estensione: .${currentDoc.ext} • Dimensione: ${sizeKb} KB • Salvato: ${result.mtime || 'adesso'}`;

      if (currentState.docs) {
        const d = currentState.docs.find(x => x.path === currentDoc.path);
        if (d) {
          d.size = result.size || newContent.length;
          d.mtime = result.mtime || d.mtime;
        }
      }
      setTimeout(() => {
        if (statusEl && statusEl.textContent.includes('successo')) {
          statusEl.textContent = '';
        }
      }, 4000);
    } else {
      if (statusEl) {
        statusEl.textContent = '❌ Errore: ' + (result.error || 'Impossibile salvare');
        statusEl.style.color = '#ef4444';
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = '❌ Errore di connessione: ' + err;
      statusEl.style.color = '#ef4444';
    }
  } finally {
    if (btnSave) btnSave.disabled = false;
  }
}

function setHtmlViewport(mode) {
  currentDoc.viewport = mode;
  const container = document.getElementById('modal-html-view');
  const btnDesk = document.getElementById('btn-vp-desktop');
  const btnMob = document.getElementById('btn-vp-mobile');
  if (mode === 'mobile') {
    container.classList.add('mobile-view');
    btnMob.style.borderColor = 'var(--accent)';
    btnMob.style.color = 'var(--accent)';
    btnDesk.style.borderColor = 'var(--border)';
    btnDesk.style.color = 'var(--text)';
  } else {
    container.classList.remove('mobile-view');
    btnDesk.style.borderColor = 'var(--accent)';
    btnDesk.style.color = 'var(--accent)';
    btnMob.style.borderColor = 'var(--border)';
    btnMob.style.color = 'var(--text)';
  }
}

function openInNewTab() {
  if (!currentDoc.path) return;
  window.open('/raw?path=' + encodeURIComponent(currentDoc.path), '_blank');
}

async function copyModalContent() {
  if (!currentDoc.content) return;
  try {
    await navigator.clipboard.writeText(currentDoc.content);
    const btn = document.getElementById('btn-copy');
    const old = btn.innerHTML;
    btn.innerHTML = '✅ Copiato!';
    btn.style.color = '#4ade80';
    setTimeout(() => {
      btn.innerHTML = old;
      btn.style.color = '';
    }, 2000);
  } catch (e) {
    alert('Impossibile copiare negli appunti');
  }
}

function closeModal() {
  document.getElementById('doc-modal').style.display = 'none';
  const iframe = document.getElementById('modal-html-iframe');
  if (iframe) iframe.src = 'about:blank';
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const editModal = document.getElementById('edit-task-modal');
    const createModal = document.getElementById('create-task-modal');
    if (editModal && editModal.style.display === 'flex') {
      closeEditTaskModal();
    } else if (createModal && createModal.style.display === 'flex') {
      closeCreateTaskModal();
    } else if (document.getElementById('doc-modal')?.style.display === 'flex') {
      closeModal();
    }
  }
});

function handleDocLink(event, href) {
  if (event) event.preventDefault();
  if (!href) return false;
  let target = href;
  if (target.startsWith('./')) target = target.slice(2);
  if (!target.startsWith('/') && currentDoc.path.includes('/')) {
    const dir = currentDoc.path.substring(0, currentDoc.path.lastIndexOf('/'));
    target = dir + '/' + target;
  }
  target = target.replace(/^\//, '');
  openDoc(target);
  return false;
}

function renderMarkdown(content, currentPath) {
  let rendered = '';
  if (typeof marked !== 'undefined' && marked.parse) {
    try {
      rendered = marked.parse(content, { gfm: true, breaks: true });
    } catch (err) {
      console.warn('Marked error, using fallback:', err);
      rendered = renderMarkdownFallback(content);
    }
  } else {
    rendered = renderMarkdownFallback(content);
  }

  // Enhanced GitHub Alert Callouts
  rendered = rendered
    .replace(/<blockquote>\s*<p>\[!NOTE\]/gi, '<blockquote class="alert-note"><p><strong>ℹ️ NOTA:</strong>')
    .replace(/<blockquote>\s*<p>\[!TIP\]/gi, '<blockquote class="alert-tip"><p><strong>💡 SUGGERIMENTO:</strong>')
    .replace(/<blockquote>\s*<p>\[!IMPORTANT\]/gi, '<blockquote class="alert-important"><p><strong>📌 IMPORTANTE:</strong>')
    .replace(/<blockquote>\s*<p>\[!WARNING\]/gi, '<blockquote class="alert-warning"><p><strong>⚠️ ATTENZIONE:</strong>')
    .replace(/<blockquote>\s*<p>\[!CAUTION\]/gi, '<blockquote class="alert-caution"><p><strong>🛑 CAUTELA:</strong>');

  // Intercept relative markdown links
  try {
    const doc = new DOMParser().parseFromString(rendered, 'text/html');
    doc.querySelectorAll('a').forEach(a => {
      const h = a.getAttribute('href');
      if (!h) return;
      if (h.startsWith('http://') || h.startsWith('https://')) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      } else if (!h.startsWith('#')) {
        a.setAttribute('onclick', `return handleDocLink(event, "${h}")`);
      }
    });
    return doc.body.innerHTML;
  } catch (e) {
    return rendered;
  }
}

function renderMarkdownFallback(text) {
  if (!text) return '';
  const codeBlocks = [];
  // Preserve code blocks
  let s = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const safe = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    codeBlocks.push(`<pre><code class="language-${lang}">${safe}</code></pre>`);
    return `__CODEBLOCK_${idx}__`;
  });

  // Escape HTML in prose
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Headings
  s = s.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
       .replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
       .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
       .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
       .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
       .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  // HR
  s = s.replace(/^---$/gm, '<hr>');

  // Tables
  s = s.replace(/((?:^\|[^\n]+\|\r?\n)+)/gm, (tableText) => {
    const rows = tableText.trim().split('\n').map(r => r.trim()).filter(Boolean);
    if (rows.length < 2) return tableText;
    let tableHtml = '<table>';
    rows.forEach((row, i) => {
      if (i === 1 && row.includes('---')) return;
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      const tag = (i === 0) ? 'th' : 'td';
      tableHtml += '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
    });
    tableHtml += '</table>';
    return tableHtml;
  });

  // Blockquotes
  s = s.replace(/^>\s?(.*)$/gm, '<blockquote>$1</blockquote>');

  // Task list checkboxes
  s = s.replace(/^- \[x\]\s+(.*)$/gm, '<li class="task-item"><input type="checkbox" checked disabled> $1</li>')
       .replace(/^- \[ \]\s+(.*)$/gm, '<li class="task-item"><input type="checkbox" disabled> $1</li>');

  // Lists
  s = s.replace(/^[*-]\s+(.*)$/gm, '<li>$1</li>');
  s = s.replace(/^(\d+)\.\s+(.*)$/gm, '<li>$2</li>');

  // Inline formats
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
       .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
       .replace(/\*([^*]+)\*/g, '<em>$1</em>')
       .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Paragraphs
  s = s.split('\n\n').map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<table') || trimmed.startsWith('<hr') || trimmed.startsWith('<li') || trimmed.startsWith('<blockquote') || trimmed.startsWith('__CODEBLOCK_')) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  // Restore code blocks
  s = s.replace(/__CODEBLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)] || '');
  return s;
}

fetchState();
setInterval(fetchState, 4000);
</script>
</body>
</html>
"""


class ControlCenterHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return  # Keep terminal logs clean

    def _send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/":
            body = INDEX_HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            self.end_headers()
            self.wfile.write(body)
        elif parsed.path == "/app":
            app_html = os.path.join(APPLICATIVO_DIR, "frontend", "app-live-preview.html")
            if os.path.isfile(app_html):
                with open(app_html, "rb") as f:
                    body = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            else:
                self.send_response(302)
                self.send_header("Location", "http://localhost:5173")
                self.end_headers()
                return
        elif parsed.path in ("/codebase", "/codebase-dashboard"):
            try:
                from codebase_analytics import generate_codebase_dashboard_html
                dash_html = generate_codebase_dashboard_html()
                body = dash_html.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
                self.end_headers()
                self.wfile.write(body)
                return
            except Exception as e:
                self.send_error(500, f"Error generating codebase dashboard: {e}")
                return
        elif parsed.path == "/api/codebase_stats":
            try:
                from codebase_analytics import get_git_metrics, get_sloc_metrics
                self._send_json({"git": get_git_metrics(), "sloc": get_sloc_metrics()})
                return
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)
                return
        elif parsed.path == "/api/state":
            sync_dependencies_and_readme()
            self._send_json({"tasks": load_tasks(), "docs": list_all_docs()})
        elif parsed.path == "/api/next_task_id":
            qs = urllib.parse.parse_qs(parsed.query)
            role = qs.get("role", ["CEO"])[0]
            next_id = generate_next_task_id(role)
            self._send_json({
                "next_task_id": next_id,
                "role": role,
                "agent": AGENT_ROLE_MAP.get(role, "footlink-ceo")
            })
        elif parsed.path == "/api/doc":
            qs = urllib.parse.parse_qs(parsed.query)
            rel_path = qs.get("path", [""])[0]
            abs_path = os.path.abspath(os.path.join(ROOT_DIR, rel_path))
            if not abs_path.startswith(ROOT_DIR):
                self.send_error(403, "Forbidden")
                return
            if not os.path.exists(abs_path):
                alt_path = os.path.abspath(os.path.join(AZIENDA_DIR, rel_path))
                if alt_path.startswith(AZIENDA_DIR) and os.path.exists(alt_path):
                    abs_path = alt_path
            if os.path.isdir(abs_path):
                files = [
                    os.path.relpath(p, ROOT_DIR)
                    for p in sorted(glob.glob(os.path.join(abs_path, "**", "*"), recursive=True))
                    if os.path.isfile(p) and "__pycache__" not in p and "node_modules" not in p
                ]
                listing = f"# 📁 Directory `{rel_path}`\n\nContiene **{len(files)}** file:\n\n" + "\n".join(
                    f"- [`{f}`](/{f})" for f in files
                )
                self._send_json({
                    "content": listing,
                    "path": rel_path.rstrip("/") + "/index.md",
                    "exists": True,
                    "ext": ".md"
                })
                return
            if not os.path.isfile(abs_path):
                self._send_json({
                    "content": f"File non ancora presente su disco: {rel_path}\n(Verrà creato dal sub-agente durante l'esecuzione del task).",
                    "path": rel_path,
                    "exists": False,
                    "ext": os.path.splitext(rel_path)[1].lower()
                })
                return
            ext = os.path.splitext(abs_path)[1].lower()
            with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
                self._send_json({
                    "content": f.read(),
                    "path": rel_path,
                    "exists": True,
                    "ext": ext
                })
        elif parsed.path == "/raw":
            qs = urllib.parse.parse_qs(parsed.query)
            rel_path = qs.get("path", [""])[0]
            abs_path = os.path.abspath(os.path.join(ROOT_DIR, rel_path))
            if not abs_path.startswith(ROOT_DIR) or not os.path.isfile(abs_path):
                self.send_error(404, f"File non trovato: {rel_path}")
                return
            ext = os.path.splitext(abs_path)[1].lower()
            content_types = {
                ".html": "text/html; charset=utf-8",
                ".htm": "text/html; charset=utf-8",
                ".md": "text/markdown; charset=utf-8",
                ".json": "application/json; charset=utf-8",
                ".txt": "text/plain; charset=utf-8",
                ".css": "text/css; charset=utf-8",
                ".js": "application/javascript; charset=utf-8",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".svg": "image/svg+xml",
                ".pdf": "application/pdf",
            }
            content_type = content_types.get(ext, "application/octet-stream")
            try:
                with open(abs_path, "rb") as f:
                    body = f.read()
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        payload = json.loads(raw or "{}")

        if parsed.path == "/api/update_task":
            task_id = payload.get("task_id")
            new_status = payload.get("status")
            note = payload.get("note")
            for t in load_tasks():
                if t["task_id"] == task_id:
                    if new_status:
                        t["status"] = new_status
                        if new_status == "done" and not t.get("actual_effort"):
                            t["actual_effort"] = "Approved by Founder"
                    if note:
                        prefix = f"[Founder {now_iso()[:16]}]: {note}"
                        t["notes"] = f"{t.get('notes') or ''} | {prefix}".strip(" |")
                    save_task(t)
                    break
            sync_dependencies_and_readme()
            self._send_json({"ok": True})
        elif parsed.path == "/api/toggle_pause":
            tasks = load_tasks()
            any_paused = any(t.get("status") == "paused_ai_quota" for t in tasks)
            for t in tasks:
                if any_paused and t.get("status") == "paused_ai_quota":
                    t["status"] = "todo"
                    save_task(t)
                elif not any_paused and t.get("status") in ("todo", "in_progress"):
                    t["status"] = "paused_ai_quota"
                    save_task(t)
            sync_dependencies_and_readme()
            self._send_json({"ok": True})
        elif parsed.path == "/api/create_task":
            try:
                task = handle_create_task(payload)
                self._send_json({"ok": True, "task": task})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, status=400)
        elif parsed.path == "/api/edit_task":
            try:
                task = handle_edit_task(payload)
                print(f"[/api/edit_task] Saved {task.get('task_id')}: status={task.get('status')}, prio={task.get('priority')}, title={task.get('title')}", flush=True)
                self._send_json({"ok": True, "task": task})
            except Exception as e:
                print(f"[/api/edit_task ERROR] {e}", flush=True)
                self._send_json({"ok": False, "error": str(e)}, status=400)
        elif parsed.path == "/api/save_doc":
            try:
                rel_path = payload.get("path", "").strip()
                new_content = payload.get("content", "")
                if not rel_path:
                    self._send_json({"ok": False, "error": "Path del file mancante"}, status=400)
                    return
                abs_path = os.path.abspath(os.path.join(ROOT_DIR, rel_path))
                if not abs_path.startswith(ROOT_DIR):
                    self._send_json({"ok": False, "error": "Percorso non autorizzato (Forbidden)"}, status=403)
                    return
                os.makedirs(os.path.dirname(abs_path), exist_ok=True)
                with open(abs_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                mtime_str = datetime.datetime.fromtimestamp(os.path.getmtime(abs_path)).strftime("%Y-%m-%d %H:%M:%S")
                size = os.path.getsize(abs_path)
                print(f"[/api/save_doc] Salvato con successo {rel_path} ({size} byte)", flush=True)
                self._send_json({"ok": True, "path": rel_path, "size": size, "mtime": mtime_str})
            except Exception as e:
                print(f"[/api/save_doc ERROR] {e}", flush=True)
                self._send_json({"ok": False, "error": str(e)}, status=500)
        else:
            self.send_error(404)


if __name__ == "__main__":
    sync_dependencies_and_readme()
    server = HTTPServer(("127.0.0.1", PORT), ControlCenterHandler)
    print(f"Footlink Founder Control Center active at http://127.0.0.1:{PORT}")
    server.serve_forever()
