"""Análise estrutural de roteiros usando métodos profissionais de cinema."""
import PyPDF2, os, re, json
from io import BytesIO
from collections import Counter

BASE = "D:/CineWeave/ROTEIROS/"

# Métodos de análise
METODOS = """
1. SYD FIELD (3 Atos)
   Ato I   = Setup (25% do roteiro)
   Ato II  = Confrontation (50%)
   Ato III = Resolution (25%)
   Plot Points = viradas narrativas

2. SAVE THE CAT (Blake Snyder)
   15 beats em % específicos da página
   Opening Image (1%) → Final Image (99%)

3. JORNADA DO HERÓI (Vogler/Campbell)
   12 estágios: Mundo Comum → Retorno com Elixir

4. SEQUENCE APPROACH (Frank Daniel)
   8 sequências de ~12-15 páginas cada
"""

def get_text(fname):
    with open(BASE + fname, "rb") as f:
        r = PyPDF2.PdfReader(BytesIO(f.read()))
    return "\n".join(p.extract_text() for p in r.pages)

def analyze_structure(fname, label):
    """Analisar estrutura narrativa usando métodos profissionais."""
    text = get_text(fname)
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    upper = text.upper()
    
    pages = 0
    # Estimate pages from PDF
    with open(BASE + fname, "rb") as f:
        pages = len(PyPDF2.PdfReader(BytesIO(f.read())).pages)
    
    if pages < 10:
        return None
    
    # ── 1. Detectar Cenas e sua distribuição ──
    scene_indices = []  # line numbers where scenes start
    scene_types = []    # INT or EXT
    for i, l in enumerate(lines):
        if re.match(r"^(INT\.|EXT\.|INT\./EXT\.)", l, re.I):
            scene_indices.append(i)
            if l.upper().startswith("INT"):
                scene_types.append("INT")
            else:
                scene_types.append("EXT")
    
    total_scenes = len(scene_indices)
    if total_scenes < 5:
        return None
    
    # Dividir cenas por quartis (aproximação de atos)
    q1 = total_scenes // 4
    q2 = total_scenes // 2
    q3 = 3 * total_scenes // 4
    
    act1_scenes = scene_types[:q1]
    act2_scenes = scene_types[q1:q3]
    act3_scenes = scene_types[q3:]
    
    # ── 2. Distribuição INT/EXT por ato ──
    def int_pct(scenes):
        return sum(1 for s in scenes if s == "INT") / max(len(scenes), 1) * 100
    
    act1_int = int_pct(act1_scenes)
    act2_int = int_pct(act2_scenes)
    act3_int = int_pct(act3_scenes)
    
    # ── 3. Densidade de cenas (pacing) por ato ──
    # Estimar onde cada cena cai na página
    # (proporção de linhas)
    pages_per_scene = pages / max(total_scenes, 1)
    
    # ── 4. Detectar possíveis Plot Points ──
    # Procurar palavras-chave de virada narrativa nas linhas
    virada_keywords = ["MAS", "PORÉM", "ENTRETANTO", "SUBITAMENTE", "DE REPENTE",
                       "NO ENTANTO", "TUDO MUDA", "FOI ENTÃO QUE",
                       "BUT", "SUDDENLY", "HOWEVER", "EVERYTHING CHANGES",
                       "THEN", "JUST THEN", "AT THAT MOMENT",
                       "CORTA PARA", "CUT TO", "DISSOLVE"]
    
    viradas = {}
    for i, l in enumerate(lines):
        up = l.upper()
        for kw in virada_keywords:
            if kw in up:
                # Estimar página
                est_page = (i / max(len(lines), 1)) * pages
                if 0 < est_page <= pages:
                    viradas[int(est_page)] = viradas.get(int(est_page), 0) + 1
    
    # ── 5. Beat Sheet (Save the Cat) ──
    beats = [
        ("Opening Image", 0.01), ("Theme Stated", 0.05), ("Set-Up", 0.01),
        ("Catalyst", 0.10), ("Debate", 0.10), ("Break into Two", 0.20),
        ("B Story", 0.22), ("Fun & Games", 0.20), ("Midpoint", 0.55),
        ("Bad Guys Close In", 0.55), ("All Is Lost", 0.75),
        ("Dark Night of Soul", 0.75), ("Break into Three", 0.85),
        ("Finale", 0.85), ("Final Image", 0.99),
    ]
    
    beat_analysis = []
    for beat_name, beat_pct in beats:
        beat_page = pages * beat_pct
        beat_scene = int(total_scenes * beat_pct)
        # Encontrar a cena mais próxima deste beat
        nearest_scene = min(scene_indices, key=lambda x: abs(x - int(beat_scene * (len(lines)/max(total_scenes,1))))) if scene_indices else 0
        nearest_line = lines[nearest_scene] if nearest_scene < len(lines) else ""
        beat_analysis.append({
            "beat": beat_name,
            "expected_pct": beat_pct,
            "expected_page": round(beat_page),
            "expected_scene": beat_scene + 1,
            "nearest_heading": nearest_line[:60] if nearest_line else "",
        })
    
    # ── 6. Análise de Diálogo por Ato ──
    dialog_per_act = {"act1": 0, "act2": 0, "act3": 0}
    chars_per_act = {"act1": set(), "act2": set(), "act3": set()}
    current_act = "act1"
    in_dialogue = False
    current_char = ""
    
    for i, l in enumerate(lines):
        # Determinar ato atual pela posição
        line_pct = i / max(len(lines), 1)
        if line_pct < 0.25:
            current_act = "act1"
        elif line_pct < 0.75:
            current_act = "act2"
        else:
            current_act = "act3"
        
        # Detectar personagem
        if re.match(r"^[A-Z\xc0-\xff][A-Z\xc0-\xff\s\.\'\-]{1,40}$", l) and not l.startswith("INT") and not l.startswith("EXT"):
            if len(l) > 1 and "FADE" not in l:
                current_char = l.strip()
                in_dialogue = True
                chars_per_act[current_act].add(current_char)
        elif in_dialogue:
            if not l or l.startswith("(") or re.match(r"^(INT|EXT)", l, re.I):
                in_dialogue = False
            elif len(l) > 5:
                dialog_per_act[current_act] += len(l.split())
    
    # ── 7. Transições e seu posicionamento ──
    transition_positions = []
    trans_patterns = ["CUT TO:", "CORTA PARA", "FADE OUT", "FADE IN", "FADE TO BLACK",
                      "SMASH CUT", "DISSOLVE", "CORTE", "FADE A PRETO"]
    for i, l in enumerate(lines):
        up = l.upper()
        for tp in trans_patterns:
            if tp in up:
                transition_positions.append((i / max(len(lines), 1)) * pages)
                break
    
    # ── Resultado ──
    return {
        "titulo": label,
        "pages": pages,
        "total_scenes": total_scenes,
        "pages_per_scene": round(pages_per_scene, 2),
        "int_distribution": {
            "act1": round(act1_int, 1),
            "act2": round(act2_int, 1),
            "act3": round(act3_int, 1),
        },
        "dialog_words_per_act": {k: round(v) for k, v in dialog_per_act.items()},
        "characters_per_act": {k: len(v) for k, v in chars_per_act.items()},
        "dialog_pct_per_act": {
            "act1": round(dialog_per_act["act1"] / max(sum(dialog_per_act.values()), 1) * 100, 1),
            "act2": round(dialog_per_act["act2"] / max(sum(dialog_per_act.values()), 1) * 100, 1),
            "act3": round(dialog_per_act["act3"] / max(sum(dialog_per_act.values()), 1) * 100, 1),
        },
        "transitions": len(transition_positions),
        "transitions_per_act": {
            "act1": sum(1 for t in transition_positions if t < pages * 0.25),
            "act2": sum(1 for t in transition_positions if pages * 0.25 <= t < pages * 0.75),
            "act3": sum(1 for t in transition_positions if t >= pages * 0.75),
        },
        "beat_sheet": beat_analysis[:5],  # Primeiros 5 beats como amostra
    }

# ── ANALISAR ──
scripts = [
    # BR
    ("bacurau.pdf", "BR - Bacurau"),
    ("que-horas-ela-volta-2015.pdf", "BR - Que Horas Ela Volta"),
    ("eduardoemonica.pdf", "BR - Eduardo e Monica"),
    ("o-homem-que-copiava-2003.pdf", "BR - O Homem Que Copiava"),
    ("saneamento-basico-2005.pdf", "BR - Saneamento Basico"),
    ("ESTRANHO CAMINHO.pdf", "BR - Estranho Caminho"),
    # EUA
    ("Inception.pdf", "US - Inception"),
    ("FARGO.pdf", "US - Fargo"),
    ("La_La_Land_Full_Script.pdf", "US - La La Land"),
    ("The_Incredibles.pdf", "US - The Incredibles"),
    ("Fight_Club_Full_Script.pdf", "US - Fight Club"),
    ("ARRIVAL.pdf", "US - Arrival"),
    ("Gone_Girl_Full_Script.pdf", "US - Gone Girl"),
    ("BABY_DRIVER.pdf", "US - Baby Driver"),
]

results = []
for fname, label in scripts:
    try:
        r = analyze_structure(fname, label)
        if r:
            results.append(r)
            print(f"OK: {label} ({r['pages']}p, {r['total_scenes']}cen)")
    except Exception as e:
        print(f"ERRO: {label} -> {e}")

# ── AGREGAR ──
br = [r for r in results if r['titulo'].startswith("BR")]
us = [r for r in results if r['titulo'].startswith("US")]

def avg(vals):
    if not vals: return 0
    return sum(vals) / len(vals)

print("\n\n" + "="*70)
print("ANÁLISE ESTRUTURAL - SYD FIELD (3 ATOS)")
print("="*70)
print(f"\n{'Métrica':<35s} {'BR':>12s} {'US':>12s}")
print("-"*60)
print(f"{'Páginas':<35s} {avg([r['pages'] for r in br]):>9.0f}     {avg([r['pages'] for r in us]):>9.0f}")
print(f"{'Cenas totais':<35s} {avg([r['total_scenes'] for r in br]):>9.0f}     {avg([r['total_scenes'] for r in us]):>9.0f}")
print(f"{'Páginas/cena':<35s} {avg([r['pages_per_scene'] for r in br]):>9.2f}     {avg([r['pages_per_scene'] for r in us]):>9.2f}")

print(f"\nDISTRIBUIÇÃO INT POR ATO:")
print(f"{'Ato I (Setup)':<35s} {avg([r['int_distribution']['act1'] for r in br]):>9.1f}%    {avg([r['int_distribution']['act1'] for r in us]):>9.1f}%")
print(f"{'Ato II (Confront.)':<35s} {avg([r['int_distribution']['act2'] for r in br]):>9.1f}%    {avg([r['int_distribution']['act2'] for r in us]):>9.1f}%")
print(f"{'Ato III (Resol.)':<35s} {avg([r['int_distribution']['act3'] for r in br]):>9.1f}%    {avg([r['int_distribution']['act3'] for r in us]):>9.1f}%")

print(f"\nDIÁLOGO POR ATO (% do total):")
print(f"{'Ato I':<35s} {avg([r['dialog_pct_per_act']['act1'] for r in br]):>9.1f}%    {avg([r['dialog_pct_per_act']['act1'] for r in us]):>9.1f}%")
print(f"{'Ato II':<35s} {avg([r['dialog_pct_per_act']['act2'] for r in br]):>9.1f}%    {avg([r['dialog_pct_per_act']['act2'] for r in us]):>9.1f}%")
print(f"{'Ato III':<35s} {avg([r['dialog_pct_per_act']['act3'] for r in br]):>9.1f}%    {avg([r['dialog_pct_per_act']['act3'] for r in us]):>9.1f}%")

print(f"\nPERSONAGENS POR ATO:")
print(f"{'Ato I':<35s} {avg([r['characters_per_act']['act1'] for r in br]):>9.0f}     {avg([r['characters_per_act']['act1'] for r in us]):>9.0f}")
print(f"{'Ato II':<35s} {avg([r['characters_per_act']['act2'] for r in br]):>9.0f}     {avg([r['characters_per_act']['act2'] for r in us]):>9.0f}")
print(f"{'Ato III':<35s} {avg([r['characters_per_act']['act3'] for r in br]):>9.0f}     {avg([r['characters_per_act']['act3'] for r in us]):>9.0f}")

print(f"\nTRANSIÇÕES:")
print(f"{'Total':<35s} {avg([r['transitions'] for r in br]):>9.0f}     {avg([r['transitions'] for r in us]):>9.0f}")
print(f"{'Ato I':<35s} {avg([r['transitions_per_act']['act1'] for r in br]):>9.0f}     {avg([r['transitions_per_act']['act1'] for r in us]):>9.0f}")
print(f"{'Ato II':<35s} {avg([r['transitions_per_act']['act2'] for r in br]):>9.0f}     {avg([r['transitions_per_act']['act2'] for r in us]):>9.0f}")
print(f"{'Ato III':<35s} {avg([r['transitions_per_act']['act3'] for r in br]):>9.0f}     {avg([r['transitions_per_act']['act3'] for r in us]):>9.0f}")

# Beat Sheet amostra
print(f"\n\nBEAT SHEET (Save the Cat) - AMOSTRA")
print("="*70)
for r in results[:3]:  # Primeiros 3
    print(f"\n{r['titulo']}:")
    for b in r['beat_sheet']:
        print(f"  {b['beat']:20s} p.{b['expected_page']:3d} -> {b['nearest_heading'][:50]}")

# Salvar
with open("D:/CineWeave/analise_estrutural.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\n\n{len(results)} roteiros analisados estruturalmente.")
print("Salvo em analise_estrutural.json")
