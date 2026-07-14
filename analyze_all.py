#!/usr/bin/env python3
"""Batch analysis of all screenplays in ROTEIROS/"""
import PyPDF2, json, os, re, sys
from collections import Counter, defaultdict

BASE = 'D:/CineWeave/ROTEIROS/'
OUT = 'C:/Users/gnnss/AppData/Local/Temp/all_analysis.json'
ERROR_LOG = 'C:/Users/gnnss/AppData/Local/Temp/analysis_errors.txt'

errors = []

def extract_text_safe(path):
    """Extract text from PDF with error handling"""
    try:
        with open(path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            pages = []
            for p in reader.pages:
                try:
                    t = p.extract_text()
                    pages.append(t if t else '')
                except:
                    pages.append('')
            return '\n'.join(pages), len(pages)
    except Exception as e:
        return None, 0

def detect_acts(lines):
    """Detect act structure from text"""
    acts = []
    for i, l in enumerate(lines):
        ul = l.strip().upper()
        if re.match(r'^ACT\s+(ONE|TWO|THREE|FOUR|FIVE|1|2|3|4|5|I{1,3}|IV|V)\b', ul):
            acts.append({'label': l.strip(), 'line': i})
        elif ul.startswith('ATO ') and len(l) < 30:
            acts.append({'label': l.strip(), 'line': i})
    return acts

def analyze_screenplay(filename, filepath):
    """Full analysis of one screenplay"""
    text, n_pages = extract_text_safe(filepath)
    if text is None:
        errors.append(f"FAILED: {filename}")
        return None
    
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    # ── Detect elements ──
    scene_headings = []
    characters = []
    dialogues = []
    actions = []
    transitions = []
    parentheticals = []
    
    for i, l in enumerate(lines):
        # Scene heading
        if re.match(r'^(INT\.|EXT\.|INT\./EXT\.|I/E\.)', l, re.I):
            scene_headings.append(l)
            continue
        
        # Transition
        if l.upper().endswith('TO:') or l.startswith('>'):
            transitions.append(l)
            continue
        
        # Parenthetical
        if l.startswith('(') and l.endswith(')'):
            parentheticals.append(l)
            continue
        
        # Character (ALL CAPS, standalone)
        if re.match(r'^[A-Z][A-Z\s\.\'\-]+$', l) and 2 < len(l) < 45:
            if not re.match(r'^(INT\.|EXT\.)', l, re.I) and 'FADE' not in l.upper():
                characters.append(l)
                continue
        
        # Dialogue (if previous was character) or Action
        if len(l) > 3:
            prev = lines[i-1].strip() if i > 0 else ''
            prev_is_char = bool(re.match(r'^[A-Z][A-Z\s\.\'\-]+$', prev) and 
                                2 < len(prev) < 45 and not prev.startswith('INT'))
            if prev_is_char:
                dialogues.append(l)
            elif not l.startswith('SFX') and not l.startswith('SOUND'):
                actions.append(l)
    
    # ── Scene type stats ──
    int_count = sum(1 for s in scene_headings if s.upper().startswith('INT'))
    ext_count = sum(1 for s in scene_headings if s.upper().startswith('EXT'))
    int_ext_count = sum(1 for s in scene_headings if 'INT./EXT' in s.upper() or 'INT/EXT' in s.upper())
    
    # ── Word counts ──
    action_words = sum(len(a.split()) for a in actions)
    dialogue_words = sum(len(d.split()) for d in dialogues)
    
    # ── Dialogue length stats ──
    dialogue_lens = [len(d.split()) for d in dialogues if d]
    avg_dialogue = sum(dialogue_lens) / len(dialogue_lens) if dialogue_lens else 0
    median_dialogue = sorted(dialogue_lens)[len(dialogue_lens)//2] if dialogue_lens else 0
    
    # ── Action line stats ──
    action_lens = [len(a.split()) for a in actions if a]
    avg_action = sum(action_lens) / len(action_lens) if action_lens else 0
    
    # ── Character stats ──
    char_freq = Counter(c.strip() for c in characters)
    unique_chars = len(char_freq)
    top_chars = char_freq.most_common(10)
    
    # How many chars carry 80% of dialogue?
    total_lines = sum(char_freq.values())
    cumulative = 0
    chars_for_80pct = 0
    for _, count in char_freq.most_common():
        cumulative += count
        chars_for_80pct += 1
        if cumulative >= total_lines * 0.8:
            break
    
    # ── Act detection ──
    acts = detect_acts(lines)
    n_acts = len(acts)
    scenes_per_act = []
    if n_acts > 0 and len(scene_headings) > 0:
        # Rough act segmentation by scene count
        scenes_per_act = [len(scene_headings) // max(n_acts, 1)] * n_acts
    
    # ── Pacing ──
    words_total = sum(len(l.split()) for l in lines if len(l) > 3)
    words_per_page = round(words_total / max(n_pages, 1))
    scenes_per_page = round(len(scene_headings) / max(n_pages, 1), 2)
    
    # ── Words per scene ──
    words_per_scene = round(words_total / max(len(scene_headings), 1))
    
    # ── Action vs Dialogue ratio ──
    ad_ratio = round(action_words / max(dialogue_words, 1), 2)
    
    # ── Longest dialogue lines (top 5%) ──
    dialogue_lens_sorted = sorted(dialogue_lens, reverse=True)
    top_5pct_count = max(1, len(dialogue_lens_sorted) // 20)
    avg_longest = sum(dialogue_lens_sorted[:top_5pct_count]) / top_5pct_count if dialogue_lens_sorted else 0
    
    # ── Extract title ──
    title_guess = filename.replace('.pdf', '').replace('_', ' ').replace('-', ' ').title()
    # Try to find actual title from first page
    first_lines = lines[:20] if lines else []
    for l in first_lines:
        clean = l.strip().upper()
        if len(clean) > 5 and len(clean) < 80 and not re.match(r'^(INT\.|EXT\.|FADE|PAGE|\d+)', clean):
            if not clean.startswith('WRITTEN') and not clean.startswith('BASED'):
                title_guess = clean
                break
    
    return {
        'filename': filename,
        'title': title_guess,
        'pages': n_pages,
        'words_total': words_total,
        'words_per_page': words_per_page,
        'scenes_total': len(scene_headings),
        'scenes_per_page': scenes_per_page,
        'words_per_scene': words_per_scene,
        'scene_int': int_count,
        'scene_ext': ext_count,
        'scene_int_ext': int_ext_count,
        'pct_int': round(int_count / max(len(scene_headings), 1) * 100, 1),
        'pct_ext': round(ext_count / max(len(scene_headings), 1) * 100, 1),
        'action_lines': len(actions),
        'dialogue_lines': len(dialogues),
        'character_entries': len(characters),
        'transitions': len(transitions),
        'parentheticals': len(parentheticals),
        'action_words': action_words,
        'dialogue_words': dialogue_words,
        'ratio_action_dialogue': ad_ratio,
        'avg_action_words': round(avg_action, 1),
        'avg_dialogue_words': round(avg_dialogue, 1),
        'median_dialogue_words': median_dialogue,
        'avg_longest_dialogue_words': round(avg_longest, 1),
        'unique_characters': unique_chars,
        'chars_for_80pct': chars_for_80pct,
        'top_characters': top_chars,
        'acts_detected': n_acts,
        'action_density': round(action_words / max(len(actions), 1), 1),
        'dialogue_density': round(dialogue_words / max(len(dialogues), 1), 1),
    }

# ── Process all files ──
files = sorted([f for f in os.listdir(BASE) if f.endswith('.pdf')])
print(f"Processing {len(files)} screenplays...\n")

results = {}
for i, fname in enumerate(files):
    path = BASE + fname
    r = analyze_screenplay(fname, path)
    if r:
        results[fname] = r
        fsize = os.path.getsize(path) // 1024
        print(f"[{i+1:2d}/{len(files)}] {r['pages']:3d}p | {r['scenes_total']:3d} cenas | {r['ratio_action_dialogue']:5.2f} a:d | {r['avg_dialogue_words']:4.1f} pal/fala | {fname[:45]}")
    else:
        print(f"[{i+1:2d}/{len(files)}] FAILED | {fname[:45]}")
    sys.stdout.flush()

# ── Save ──
output = {
    'screenplays': results,
    'errors': errors,
    'total_analyzed': len(results),
    'total_errors': len(errors),
}
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n\nSaved to {OUT}")
print(f"Analyzed: {len(results)}/{len(files)}")
print(f"Errors: {len(errors)}")

# Print aggregate stats
all_ad_ratios = [r['ratio_action_dialogue'] for r in results.values()]
all_avg_dialogue = [r['avg_dialogue_words'] for r in results.values()]
all_scenes = [r['scenes_total'] for r in results.values()]
all_pages = [r['pages'] for r in results.values()]
all_int_pct = [r['pct_int'] for r in results.values()]

print("\n\n===== AGREGADOS =====")
print(f"Média de páginas: {sum(all_pages)/len(all_pages):.0f}")
print(f"Média de cenas: {sum(all_scenes)/len(all_scenes):.0f}")
print(f"Média ratio Ação:Diálogo: {sum(all_ad_ratios)/len(all_ad_ratios):.2f}")
print(f"Média palavras/fala: {sum(all_avg_dialogue)/len(all_avg_dialogue):.1f}")
print(f"Média INT%: {sum(all_int_pct)/len(all_int_pct):.1f}%")
print(f"Média páginas por cena: {sum(all_pages)/max(sum(all_scenes),1):.2f}")

# Write error log
with open(ERROR_LOG, 'w') as f:
    for e in errors:
        f.write(e + '\n')
