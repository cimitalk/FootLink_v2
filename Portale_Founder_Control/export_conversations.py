#!/usr/bin/env python3
"""
Footlink — Conversation Exporter & Epoche Archiver
Utility di governance per esportare le chat di Antigravity in file Markdown consultabili
e catalogarle per Epoche (Epoca I, Epoca II, ecc.) nel repository FootLink_v2.

Uso:
    python3 Portale_Founder_Control/export_conversations.py --epoch 1
    python3 Portale_Founder_Control/export_conversations.py --epoch 2
    python3 Portale_Founder_Control/export_conversations.py --id <conversation_id>
    python3 Portale_Founder_Control/export_conversations.py --all
"""

import os
import sys
import json
import sqlite3
import re
import argparse
from datetime import datetime

# Percorsi base
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
ANTIGRAVITY_DIR = os.path.expanduser("~/.gemini/antigravity")
DB_PATH = os.path.join(ANTIGRAVITY_DIR, "conversation_summaries.db")
BRAIN_DIR = os.path.join(ANTIGRAVITY_DIR, "brain")

# Epoche Delimiters
EPOCH_1_END_DATE = "2026-10-25T23:59:59"  # Fino alla pianificazione di Epoca 2
DEFAULT_EPOCH_1_OUT = os.path.join(ROOT_DIR, "Azienda", "memory", "archive", "transcripts_epoca_1")
DEFAULT_EPOCH_2_OUT = os.path.join(ROOT_DIR, "Azienda", "memory", "archive", "transcripts_epoca_2")


def slugify(text: str) -> str:
    """Trasforma un titolo in uno slug pulito per i nomi dei file."""
    if not text:
        return "untitled"
    # Sostituisci caratteri speciali
    s = text.lower().strip()
    # Rimuovi emoji e simboli
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '_', s)
    return s[:60].strip('_-')


def clean_message_content(content: str) -> str:
    """Pulisce i tag tecnici dai messaggi dell'utente o dell'agente."""
    if not content:
        return ""
    text = content
    # Rimuovi tag di sistema e wrapper
    text = re.sub(r'<USER_REQUEST>\s*', '', text)
    text = re.sub(r'\s*</USER_REQUEST>', '', text)
    text = re.sub(r'<ADDITIONAL_METADATA>[\s\S]*?</ADDITIONAL_METADATA>', '', text)
    text = re.sub(r'<USER_SETTINGS_CHANGE>[\s\S]*?</USER_SETTINGS_CHANGE>', '', text)
    text = re.sub(r'<SYSTEM_MESSAGE>[\s\S]*?</SYSTEM_MESSAGE>', '', text)
    return text.strip()


def parse_conversation_transcript(transcript_path: str):
    """
    Legge il file transcript.jsonl e aggrega i turni di dialogo
    in una sequenza logica Utente -> Agente (con riassunto dei tool).
    """
    if not os.path.exists(transcript_path):
        return []

    turns = []
    current_agent_tools = []
    current_agent_content = []
    current_agent_time = None

    def flush_agent():
        nonlocal current_agent_tools, current_agent_content, current_agent_time
        if current_agent_tools or current_agent_content:
            turns.append({
                'role': 'agent',
                'timestamp': current_agent_time or '',
                'tools': list(current_agent_tools),
                'content': '\n\n'.join([c for c in current_agent_content if c])
            })
            current_agent_tools = []
            current_agent_content = []
            current_agent_time = None

    with open(transcript_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except Exception:
                continue

            step_type = data.get('type')
            source = data.get('source')
            content = data.get('content') or ''
            tool_calls = data.get('tool_calls') or []
            created_at = data.get('created_at') or ''

            # Input Utente (o messaggio inviato dal subagente parent)
            if step_type == 'USER_INPUT' or source == 'USER_EXPLICIT':
                flush_agent()
                cleaned = clean_message_content(content)
                if cleaned:
                    turns.append({
                        'role': 'user',
                        'timestamp': created_at,
                        'tools': [],
                        'content': cleaned
                    })
            elif step_type == 'SYSTEM_MESSAGE':
                # Prompt iniziale di un subagente
                cleaned = clean_message_content(content)
                if cleaned and not turns:
                    turns.append({
                        'role': 'system_prompt',
                        'timestamp': created_at,
                        'tools': [],
                        'content': cleaned
                    })
            elif step_type == 'PLANNER_RESPONSE' or source == 'MODEL':
                # Scarta gli echo di log dei tool tipo "Created At: ..." o "Command exited with code 0"
                if content.strip().startswith('Created At:') or content.strip().startswith('Command exited with'):
                    continue

                if not current_agent_time:
                    current_agent_time = created_at

                for tc in tool_calls:
                    name = tc.get('name') or tc.get('tool') or 'tool'
                    args = tc.get('arguments') or tc.get('args') or {}
                    summary = args.get('toolSummary') or args.get('Path') or args.get('CommandLine') or ''
                    # Tronca summary molto lunghi
                    if summary:
                        summary_str = str(summary).replace('\n', ' ')
                        if len(summary_str) > 90:
                            summary_str = summary_str[:87] + '...'
                        current_agent_tools.append(f'`{name}`: {summary_str}')
                    else:
                        current_agent_tools.append(f'`{name}`')

                cleaned_content = clean_message_content(content)
                if cleaned_content:
                    current_agent_content.append(cleaned_content)

    flush_agent()
    return turns


def export_conversation_to_markdown(conv_meta: dict, turns: list, out_path: str, subagents: list = None):
    """Genera il file Markdown strutturato per la conversazione."""
    title = conv_meta.get('title') or 'Conversazione Senza Titolo'
    conv_id = conv_meta.get('conversation_id')
    last_mod = conv_meta.get('last_mod') or conv_meta.get('last_modified_time', '')
    created_date = last_mod[:10] if last_mod else ''
    agent_name = conv_meta.get('agent_name') or ''
    parent_id = conv_meta.get('parent_conversation_id') or ''
    step_count = conv_meta.get('step_count', 0)

    lines = []
    lines.append(f"# 📜 Trascrizione: {title}\n")
    lines.append(f"> **Archivio Chat Antigravity — Footlink Governance**  ")
    lines.append(f"> **Data Ultima Modifica:** `{last_mod}` | **ID Sessione:** `{conv_id}`  ")
    if agent_name:
        lines.append(f"> **Ruolo Sub-Agente:** `{agent_name}` | **Parent ID:** `{parent_id}`  ")
    lines.append(f"> **Totale Step Raw:** `{step_count}` | **Turni Aggregati:** `{len(turns)}`\n")
    lines.append("---\n")

    if subagents:
        lines.append("## 🤖 Sub-Agenti Associati a questa Sessione\n")
        lines.append("| Ruolo | ID Sub-Agente | Trascrizione Dedicata |")
        lines.append("|---|---|---|")
        for sub in subagents:
            sub_title = sub.get('title') or sub.get('agent_name') or 'Subagent'
            sub_id = sub.get('conversation_id')
            sub_role = sub.get('agent_name') or 'subagent'
            sub_filename = f"subagents/{sub_id[:8]}_{slugify(sub_role)}.md"
            lines.append(f"| **{sub_role}** | `{sub_id}` | [{sub_title}]({sub_filename}) |")
        lines.append("\n---\n")

    lines.append("## 💬 Cronologia del Dialogo\n")

    for idx, turn in enumerate(turns, 1):
        role = turn['role']
        ts = turn.get('timestamp') or ''
        content = turn.get('content') or ''
        tools = turn.get('tools') or []

        if role == 'user':
            lines.append(f"### 👤 Founder / Utente — [{ts}]\n")
            lines.append(f"{content}\n")
            lines.append("---\n")
        elif role == 'system_prompt':
            lines.append(f"### ⚙️ Incarico Sub-Agente (Prompt) — [{ts}]\n")
            lines.append(f"{content}\n")
            lines.append("---\n")
        elif role == 'agent':
            agent_label = f"🤖 Assistente AI ({agent_name})" if agent_name else "🤖 Assistente AI"
            lines.append(f"### {agent_label} — [{ts}]\n")
            
            if tools:
                lines.append(f"<details>")
                lines.append(f"<summary>🛠️ <b>Azioni & Tool Eseguiti ({len(tools)})</b></summary>\n")
                for t in tools:
                    lines.append(f"- {t}")
                lines.append(f"\n</details>\n")

            if content:
                lines.append(f"{content}\n")
            else:
                lines.append(f"*(Operazioni tool completate senza output di testo aggiuntivo)*\n")
            lines.append("---\n")

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


def generate_index_readme(exported_items: list, out_dir: str, epoch_num: int):
    """Genera il file README.md indice per la cartella di archivio dell'Epoca."""
    readme_path = os.path.join(out_dir, "README.md")
    
    lines = []
    lines.append(f"# 🏛️ Archivio Storico Trascrizioni Chat — EPOCA {epoch_num}\n")
    lines.append(f"> **Documento di Governance e Tracciabilità Conversazioni Antigravity**  ")
    lines.append(f"> **Epoca di Riferimento:** `Epoca {epoch_num}`  ")
    lines.append(f"> **Data Generazione Archivio:** `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`  ")
    lines.append(f"> **Totale Sessioni Principali Archiviate:** `{len(exported_items)}`\n")
    lines.append("---\n")

    lines.append("## 1. Mappa delle Sessioni Principali\n")
    lines.append("| # | Data | Titolo Sessione | ID Chat | Turni | Sub-Agenti | File Trascrizione |")
    lines.append("|---|---|---|---|---|---|---|")

    for i, item in enumerate(exported_items, 1):
        title = item['title']
        cid = item['conversation_id'][:8]
        date_str = item['date']
        turns_cnt = item['turns_count']
        sub_cnt = len(item.get('subagents', []))
        rel_file = item['filename']
        lines.append(f"| {i} | `{date_str}` | **{title}** | `{cid}` | {turns_cnt} | {sub_cnt} | [📄 Leggi Chat]({rel_file}) |")

    lines.append("\n---\n")
    lines.append("## 2. Note di Governance sull'Archiviazione\n")
    lines.append("1. **Pulizia della UI Antigravity:** Le sessioni censite in questa cartella sono state congelate e archiviate in formato Markdown perenne. Il Founder può eliminare tranquillamente le chat corrispondenti dalla sidebar di Google Antigravity, mantenendo la visuale focalizzata unicamente sull'Epoca attiva.\n")
    lines.append("2. **Integrità Storica:** Ogni file `.md` contiene sia i prompt e le direttive del Founder sia le risposte complete dell'assistente, con i tool richiamati racchiusi in blocchi comprimibili.\n")

    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


def get_all_footlink_conversations():
    """Recupera tutte le conversazioni associate al workspace FootLink."""
    if not os.path.exists(DB_PATH):
        print(f"Errore: Database {DB_PATH} non trovato.")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    rows = c.execute("""
        SELECT conversation_id, title, preview, step_count, datetime(last_modified_time) as last_mod,
               agent_name, parent_conversation_id, nesting_depth, workspace_uris
        FROM conversation_summaries
        WHERE workspace_uris LIKE '%FootLink%'
        ORDER BY last_modified_time ASC
    """).fetchall()

    convs = [dict(r) for r in rows]
    conn.close()
    return convs


def main():
    parser = argparse.ArgumentParser(description="Esporta e archivia le chat di Antigravity per Epoche.")
    parser.add_argument("--epoch", type=int, choices=[1, 2], help="Numero dell'epoca da esportare (1 o 2)")
    parser.add_argument("--id", type=str, help="Esporta una specifica conversazione tramite ID")
    parser.add_argument("--all", action="store_true", help="Esporta tutte le conversazioni trovate")
    parser.add_argument("--out", type=str, help="Cartella di destinazione personalizzata")

    args = parser.parse_args()

    all_convs = get_all_footlink_conversations()
    if not all_convs:
        print("Nessuna conversazione FootLink trovata.")
        return

    # Mappatura parent -> subagents
    subagents_by_parent = {}
    for c in all_convs:
        parent_id = c.get('parent_conversation_id')
        if parent_id:
            subagents_by_parent.setdefault(parent_id, []).append(c)

    # Filtro
    if args.id:
        target_convs = [c for c in all_convs if c['conversation_id'] == args.id]
        out_dir = args.out or os.path.join(ROOT_DIR, "Azienda", "memory", "archive", "transcripts_custom")
        epoch_num = 1
    elif args.epoch == 1 or (not args.epoch and not args.all):
        # Default: Epoca 1
        target_convs = [c for c in all_convs if (c.get('last_mod') or '') <= "2026-10-26 00:00:00"]
        out_dir = args.out or DEFAULT_EPOCH_1_OUT
        epoch_num = 1
    elif args.epoch == 2:
        target_convs = [c for c in all_convs if (c.get('last_mod') or '') > "2026-10-26 00:00:00"]
        out_dir = args.out or DEFAULT_EPOCH_2_OUT
        epoch_num = 2
    else:
        target_convs = all_convs
        out_dir = args.out or os.path.join(ROOT_DIR, "Azienda", "memory", "archive", "transcripts_all")
        epoch_num = 0

    print(f"🚀 Avvio esportazione conversazioni per Epoca {epoch_num}...")
    print(f"📁 Destinazione: {out_dir}")
    print(f"📊 Totale conversazioni target identificate: {len(target_convs)}")

    # Separiamo root conversations da subagents
    root_convs = [c for c in target_convs if not c.get('parent_conversation_id')]
    subagent_convs = [c for c in target_convs if c.get('parent_conversation_id')]

    print(f"   ├─ Sessioni Principali (Root): {len(root_convs)}")
    print(f"   └─ Sessioni Sub-Agenti: {len(subagent_convs)}")

    os.makedirs(out_dir, exist_ok=True)
    subagents_dir = os.path.join(out_dir, "subagents")
    os.makedirs(subagents_dir, exist_ok=True)

    # Esportazione subagents
    for sub in subagent_convs:
        cid = sub['conversation_id']
        sub_role = sub.get('agent_name') or 'subagent'
        transcript_path = os.path.join(BRAIN_DIR, cid, ".system_generated", "logs", "transcript.jsonl")
        turns = parse_conversation_transcript(transcript_path)
        sub_filename = f"{cid[:8]}_{slugify(sub_role)}.md"
        sub_out_path = os.path.join(subagents_dir, sub_filename)
        export_conversation_to_markdown(sub, turns, sub_out_path)

    # Esportazione sessioni root
    exported_root_items = []
    for idx, conv in enumerate(root_convs, 1):
        cid = conv['conversation_id']
        title = conv.get('title') or f"Sessione {idx}"
        last_mod = conv.get('last_mod') or ''
        date_str = last_mod[:10] if last_mod else '2026-xx-xx'
        
        transcript_path = os.path.join(BRAIN_DIR, cid, ".system_generated", "logs", "transcript.jsonl")
        turns = parse_conversation_transcript(transcript_path)
        
        associated_subs = subagents_by_parent.get(cid, [])
        filename = f"{idx:02d}_{date_str}_{slugify(title)}_{cid[:8]}.md"
        out_path = os.path.join(out_dir, filename)
        
        export_conversation_to_markdown(conv, turns, out_path, subagents=associated_subs)
        
        exported_root_items.append({
            'index': idx,
            'title': title,
            'conversation_id': cid,
            'date': date_str,
            'filename': filename,
            'turns_count': len(turns),
            'subagents': associated_subs
        })
        print(f"  [{idx:02d}/{len(root_convs):02d}] ✅ Esportata: {title} ({len(turns)} turni) -> {filename}")

    # Genera README index
    generate_index_readme(exported_root_items, out_dir, epoch_num)
    print(f"📖 Generato indice ufficiale: {os.path.join(out_dir, 'README.md')}")
    print(f"🎉 Esportazione completata con successo!")


if __name__ == "__main__":
    main()
