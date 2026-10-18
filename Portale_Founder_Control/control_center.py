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
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AZIENDA_DIR = os.path.join(ROOT_DIR, "Azienda")
APPLICATIVO_DIR = os.path.join(ROOT_DIR, "Applicativo")
PORTALE_DIR = os.path.join(ROOT_DIR, "Portale_Founder_Control")

TASKS_DIR = os.path.join(AZIENDA_DIR, "tasks")
ADR_DIR = os.path.join(AZIENDA_DIR, "adr")
DOCS_DIR = os.path.join(AZIENDA_DIR, "docs")
PORT = int(os.environ.get("FOOTLINK_PORT", "8080"))


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=2))).isoformat(timespec="seconds")


def load_tasks():
    tasks = []
    for path in sorted(glob.glob(os.path.join(TASKS_DIR, "FTL-*.json"))):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["_file"] = os.path.basename(path)
                tasks.append(data)
        except Exception as e:
            print(f"Error loading {path}: {e}")
    order = [
        # Sprint 1 (Bootstrap C-Suite)
        "FTL-GOV-001",
        "FTL-CEO-001",
        "FTL-TECH-001",
        "FTL-PROD-001",
        "FTL-REV-001",
        "FTL-MKT-001",
        # Sprint 2 (Three-Pillars Architecture, Full-Stack & GTM Execution)
        "FTL-GOV-002",
        "FTL-CEO-002",
        "FTL-PROD-002",
        "FTL-TECH-002",
        "FTL-TECH-003",
        "FTL-MKT-002",
        "FTL-REV-002",
    ]
    tasks.sort(key=lambda t: (order.index(t["task_id"]) if t.get("task_id") in order else 999, t.get("task_id", "")))
    return tasks


def save_task(task_data):
    task_id = task_data["task_id"]
    path = os.path.join(TASKS_DIR, f"{task_id}.json")
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
            if all(d in done_ids for d in deps) and not t["blocked_by"] and t.get("status") == "backlog":
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

    sprint1 = [t for t in tasks if t["task_id"].endswith("-001")]
    sprint2 = [t for t in tasks if not t["task_id"].endswith("-001")]

    lines = [
        "# 📋 Founder Control Dashboard — Registro Task (`Azienda/tasks/`)",
        "",
        "Questa directory contiene i **Task Object JSON** della C-Suite di **Footlink**, validati secondo il [Task Object Schema v1.0](./schema/task-object-v1.schema.json) definito dal CGO e orchestrati tramite **Google Antigravity** (`OpenClaw` in stato *suspended*).",
        "",
        "---",
        "",
        "## 🚀 Sprint 1 — Bootstrap C-Suite & Fondamenta Governance",
        "",
        "| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |",
        "|---|:---:|---|:---:|:---:|---|:---:|",
    ]
    for t in sprint1:
        tid = t["task_id"]
        role = t["assignee_role"]
        title = t["title"]
        prio = prio_badges.get(t["priority"], t["priority"])
        st = status_badges.get(t["status"], t["status"])
        deps = ", ".join(f"`{d}`" for d in (t.get("dependencies") or [])) or "—"
        esc = f"Sì (`{t.get('escalation_level')}`)" if t.get("requires_escalation") else f"No (`{t.get('escalation_level')}`)"
        lines.append(f"| [`{tid}`](./{tid}.json) | **{role}** | {title} | {prio} | {st} | {deps} | {esc} |")

    if sprint2:
        lines.extend([
            "",
            "---",
            "",
            "## ⚡ Sprint 2 — Riorganizzazione 3 Pilastri, Core Applicativo PLM/PIM & Go-To-Market",
            "",
            "| Task ID | Ruolo | Titolo | Priorità | Stato | Dipendenze | Escalation Founder |",
            "|---|:---:|---|:---:|:---:|---|:---:|",
        ])
        for t in sprint2:
            tid = t["task_id"]
            role = t["assignee_role"]
            title = t["title"]
            prio = prio_badges.get(t["priority"], t["priority"])
            st = status_badges.get(t["status"], t["status"])
            deps = ", ".join(f"`{d}`" for d in (t.get("dependencies") or [])) or "—"
            esc = f"Sì (`{t.get('escalation_level')}`)" if t.get("requires_escalation") else f"No (`{t.get('escalation_level')}`)"
            lines.append(f"| [`{tid}`](./{tid}.json) | **{role}** | {title} | {prio} | {st} | {deps} | {esc} |")

    lines.extend([
        "",
        "---",
        "",
        "## ⚙️ Regole di Aggiornamento",
        "1. Ogni sub-agente di Google Antigravity, quando prende in carico un task, aggiorna `status` a `\"in_progress\"` e `updated_at` con il timestamp corrente.",
        "2. Al termine della produzione dei deliverable in `Azienda/docs/`, `Azienda/adr/` o `Applicativo/`, popola `output_artifacts`, imposta `status` a `\"review\"` (se richiede approvazione L2–L6 del Founder) oppure `\"done\"`.",
        "3. Il **Founder Control Center** (`Portale_Founder_Control/control_center.py` su `http://127.0.0.1:8080`) mantiene sincronizzato questo registro in tempo reale.",
        "",
    ])
    os.makedirs(TASKS_DIR, exist_ok=True)
    with open(os.path.join(TASKS_DIR, "README.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def list_all_docs():
    docs = []
    azienda_core = [
        os.path.join("Azienda", f)
        for f in [
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
    portale_files = [
        os.path.relpath(p, ROOT_DIR)
        for p in sorted(
            glob.glob(os.path.join(PORTALE_DIR, "*.md"))
            + glob.glob(os.path.join(PORTALE_DIR, "*.py"))
        )
    ]
    root_files = ["README.md", "AGENTS.md", ".github/workflows/ci.yml"]

    candidates = azienda_core + adr_files + doc_files + applicativo_files + portale_files + root_files
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
            docs.append({
                "path": rel,
                "pillar": pillar,
                "size": os.path.getsize(full_p),
                "mtime": datetime.datetime.fromtimestamp(os.path.getmtime(full_p)).strftime("%Y-%m-%d %H:%M:%S"),
            })
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
  .docs-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 10px;
  }
  .doc-item {
    background: var(--panel); border: 1px solid var(--border);
    padding: 12px 14px; border-radius: 8px; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center;
  }
  .doc-item:hover { border-color: var(--accent); }
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
</style>
</head>
<body>

<header>
  <div class="brand">
    <div class="brand-logo">👞</div>
    <div>
      <h1>Footlink — Founder Control Center</h1>
      <p>Autonomous C-Suite Governance • Google Antigravity + GitHub (OpenClaw: Suspended)</p>
    </div>
  </div>
  <div class="top-controls">
    <span class="pill green" id="quota-pill">⚡ AI Quota: ACTIVE (€21.99 Pro + €30 Credits)</span>
    <span class="pill amber">🛡️ Spend Policy: €0 Autonomous (L2 Founder Lock)</span>
    <button class="btn btn-warn" onclick="toggleQuotaPause()">⏸️ Toggle Standby (paused_ai_quota)</button>
    <button class="btn" onclick="fetchState()">🔄 Aggiorna Ora</button>
  </div>
</header>

<div class="container">
  <div class="kpi-grid" id="kpi-grid"></div>

  <div class="kpi-grid" style="margin-bottom:20px;">
    <div class="kpi-card" style="border-left:4px solid #38bdf8;">
      <div class="label">🏢 Pilastro 1 — Azienda/</div>
      <div class="value" style="font-size:18px;">Governance &amp; C-Suite</div>
      <div class="sub"><code>Manifesto</code> • <code>adr/</code> • <code>tasks/</code> • <code>docs/</code></div>
    </div>
    <div class="kpi-card" style="border-left:4px solid #22c55e;">
      <div class="label">💻 Pilastro 2 — Applicativo/</div>
      <div class="value" style="font-size:18px;">Piattaforma PLM + PIM</div>
      <div class="sub"><code>backend/</code> (FastAPI) • <code>frontend/</code> (React) • <code>database/</code></div>
    </div>
    <div class="kpi-card" style="border-left:4px solid #a855f7;">
      <div class="label">🎛️ Pilastro 3 — Portale Founder Control/</div>
      <div class="value" style="font-size:18px;">Cabina di Regia L1–L6</div>
      <div class="sub"><code>control_center.py</code> • Gatekeeper &amp; Real-Time Sync</div>
    </div>
  </div>

  <div id="approval-queue-container"></div>

  <div class="section-title">
    <span>📊 C-Suite Task Board — Sprint 1 &amp; Sprint 2 (Real-Time Sync con <code>Azienda/tasks/*.json</code>)</span>
    <span style="font-size:12px;color:var(--muted)" id="last-sync"></span>
  </div>
  <div class="kanban" id="kanban-board"></div>

  <div class="section-title">
    <span>📚 Esplora Repository a 3 Pilastri: 🏢 Azienda • 💻 Applicativo • 🎛️ Portale Founder Control</span>
  </div>
  <div class="docs-grid" id="docs-grid"></div>
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
            <span>👁️ Anteprima / Render</span>
          </button>
          <button type="button" class="seg-btn" id="btn-seg-code" onclick="setDocMode('code')">
            <span>💻 Codice Sorgente</span>
          </button>
        </div>
      </div>

      <div class="modal-header-right">
        <div id="html-viewport-controls" style="display:none;align-items:center;gap:4px;">
          <button class="btn btn-sm" id="btn-vp-desktop" onclick="setHtmlViewport('desktop')" title="Vista Desktop (100%)">🖥️ 100%</button>
          <button class="btn btn-sm" id="btn-vp-mobile" onclick="setHtmlViewport('mobile')" title="Vista Mobile (375px)">📱 375px</button>
        </div>
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
    </div>
  </div>
</div>

<script>
let currentState = { tasks: [], docs: [] };

async function fetchState() {
  const res = await fetch('/api/state');
  currentState = await res.json();
  renderAll();
}

function renderAll() {
  const tasks = currentState.tasks || [];
  const counts = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0, paused_ai_quota: 0 };
  tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });

  const anyPaused = counts.paused_ai_quota > 0;
  const pill = document.getElementById('quota-pill');
  if (anyPaused) {
    pill.className = 'pill amber';
    pill.textContent = '⏸️ AI Quota: STANDBY (paused_ai_quota)';
  } else {
    pill.className = 'pill green';
    pill.textContent = '⚡ AI Quota: ACTIVE (Google Antigravity Pro)';
  }

  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi-card">
      <div class="label">Progresso Globale Sprint 1 &amp; 2</div>
      <div class="value">${counts.done} / ${tasks.length} Done</div>
      <div class="sub">${counts.in_progress} in esecuzione • ${counts.todo} pronti</div>
    </div>
    <div class="kpi-card">
      <div class="label">In Attesa Approvazione Founder</div>
      <div class="value" style="color:${counts.review > 0 ? '#c084fc' : '#4ade80'}">${counts.review} Task</div>
      <div class="sub">Escalation L1–L6 / Gatekeeper Check</div>
    </div>
    <div class="kpi-card">
      <div class="label">Target FinOps SaaS Margin</div>
      <div class="value" style="color:#4ade80">&gt; 75%</div>
      <div class="sub">Terzisti: 0 € • Spesa autonoma: 0 €</div>
    </div>
    <div class="kpi-card">
      <div class="label">File nei 3 Pilastri di Root</div>
      <div class="value">${(currentState.docs || []).length}</div>
      <div class="sub">🏢 Azienda • 💻 Applicativo • 🎛️ Portale</div>
    </div>
  `;

  // Render Founder Approval Queue
  const reviewTasks = tasks.filter(t => t.status === 'review');
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
  const columns = [
    { key: 'backlog', label: '📥 Backlog' },
    { key: 'todo', label: '🟢 Todo / Ready' },
    { key: 'in_progress', label: '🔄 In Progress' },
    { key: 'review', label: '🟣 In Review (Founder)' },
    { key: 'done', label: '✅ Done' }
  ];

  document.getElementById('kanban-board').innerHTML = columns.map(col => {
    const colTasks = tasks.filter(t => col.key === 'backlog' ? (t.status === 'backlog' || t.status === 'paused_ai_quota' || t.status === 'blocked') : t.status === col.key);
    return `
      <div class="col">
        <div class="col-header">
          <span>${col.label}</span>
          <span class="pill">${colTasks.length}</span>
        </div>
        ${colTasks.map(t => renderCard(t)).join('')}
      </div>
    `;
  }).join('');

  // Render Docs with 3-Pillar icon badges
  const pillarIcon = (p) => p === 'Azienda' ? '🏢' : (p === 'Applicativo' ? '💻' : (p === 'Portale_Founder_Control' ? '🎛️' : '📄'));
  document.getElementById('docs-grid').innerHTML = (currentState.docs || []).map(d => `
    <div class="doc-item" onclick="openDoc('${d.path}')">
      <div>
        <div style="font-family:monospace;font-size:12.5px;color:#38bdf8;font-weight:600;">${pillarIcon(d.pillar)} ${d.path}</div>
        <div style="font-size:11px;color:var(--muted);">Pilastro: ${d.pillar || 'Root'} • Aggiornato: ${d.mtime}</div>
      </div>
      <span style="font-size:11px;color:var(--muted);">${(d.size/1024).toFixed(1)} KB</span>
    </div>
  `).join('');

  document.getElementById('last-sync').textContent = 'Ultimo sync: ' + new Date().toLocaleTimeString('it-IT');
}

function renderCard(t) {
  const extraClass = t.status === 'review' ? 'review-highlight' : (t.status === 'in_progress' ? 'inprog-highlight' : '');
  const sprintBadge = (t.task_id && t.task_id.endsWith('-001')) ? 'S1' : 'S2';
  return `
    <div class="task-card ${extraClass}">
      <div class="task-top">
        <span class="task-id">${t.task_id} <span style="font-size:10px;color:var(--muted);">[${sprintBadge}]</span></span>
        <span class="role-badge">${t.assignee_role} • ${t.escalation_level}</span>
      </div>
      <div class="task-title">${t.title}</div>
      <div class="task-desc">${t.description}</div>
      ${t.escalation_reason ? `<div class="esc-box">⚠️ <strong>Escalation:</strong> ${t.escalation_reason}</div>` : ''}
      ${t.notes ? `<div style="font-size:11px;color:#cbd5e1;background:rgba(255,255,255,0.04);padding:6px;border-radius:6px;">📝 ${t.notes}</div>` : ''}
      <div class="artifact-list">
        ${(t.output_artifacts || []).map(a => `<a class="artifact-link" onclick="openDoc('${a}')">🔗 ${a}</a>`).join('')}
      </div>
      <div class="card-actions">
        ${t.status === 'review' ? `<button class="btn btn-approve" onclick="updateTaskStatus('${t.task_id}', 'done')">✅ Approva</button>` : ''}
        ${t.status !== 'done' ? `<button class="btn" onclick="promptNote('${t.task_id}', '${t.status}')">📝 Nota Founder</button>` : ''}
        <button class="btn" onclick="openDoc('Azienda/tasks/${t.task_id}.json')">🔍 JSON</button>
      </div>
    </div>
  `;
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

let currentDoc = {
  path: '',
  content: '',
  ext: '',
  mode: 'preview',
  viewport: 'desktop'
};

async function openDoc(path) {
  try {
    const res = await fetch('/api/doc?path=' + encodeURIComponent(path));
    const data = await res.json();
    const ext = (path.split('.').pop() || '').toLowerCase();

    currentDoc.path = path;
    currentDoc.content = data.content || '';
    currentDoc.ext = ext;
    currentDoc.viewport = 'desktop';

    // Default view mode:
    // Markdown (.md) and HTML (.html/.htm) -> preview
    // Other files (e.g. .json, .py, .txt) -> code
    if (ext === 'md' || ext === 'html' || ext === 'htm') {
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
  currentDoc.mode = mode;
  updateModalView();
}

function updateModalView() {
  const btnPrev = document.getElementById('btn-seg-preview');
  const btnCode = document.getElementById('btn-seg-code');
  const mdView = document.getElementById('modal-md-view');
  const htmlView = document.getElementById('modal-html-view');
  const codeView = document.getElementById('modal-code-view');
  const iframe = document.getElementById('modal-html-iframe');
  const codeText = document.getElementById('modal-code-text');

  if (currentDoc.mode === 'preview') {
    btnPrev.classList.add('active');
    btnCode.classList.remove('active');
  } else {
    btnPrev.classList.remove('active');
    btnCode.classList.add('active');
  }

  mdView.style.display = 'none';
  htmlView.style.display = 'none';
  codeView.style.display = 'none';

  if (currentDoc.mode === 'code') {
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
  if (e.key === 'Escape' && document.getElementById('doc-modal').style.display === 'flex') {
    closeModal();
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
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/":
            body = INDEX_HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif parsed.path == "/api/state":
            sync_dependencies_and_readme()
            self._send_json({"tasks": load_tasks(), "docs": list_all_docs()})
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
        else:
            self.send_error(404)


if __name__ == "__main__":
    sync_dependencies_and_readme()
    server = HTTPServer(("127.0.0.1", PORT), ControlCenterHandler)
    print(f"Footlink Founder Control Center active at http://127.0.0.1:{PORT}")
    server.serve_forever()
