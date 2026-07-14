# ANÁLISE SEMÂNTICA — Padrões dos Grandes Roteiros

**Base:** 68 roteiros extraídos da pasta `ROTEIROS/`, 56 analisados confiavelmente
**Total:** 6.496 páginas analisadas
**Gêneros:** Drama, Comédia, Ação, Animação, Sci-Fi, Terror, TV

---

## AGREGADOS ESTATÍSTICOS — 56 ROTEIROS

### 📊 Tabela Comparativa Filme vs TV

| Métrica | Filmes (46) | TV/Episódios (10) |
|---------|:-----------:|:-----------------:|
| Páginas | 127 | 48 |
| Cenas | 141 | 44 |
| Páginas/cena | 0.90 | 1.09 |
| Ratio Ação:Diálogo | **4.37:1** | **7.05:1** |
| Palavras/fala | **5.8** | **7.1** |
| % INT | **62%** | **71%** |
| Personagens únicos | 76 | — |
| Palavras/página | 188 | — |

### 📈 Distribuição de Ratio Ação:Diálogo

| Categoria | Ratio | Roteiros |
|-----------|:-----:|----------|
| **Diálogo puro** | < 2:1 | Bridesmaids, Don't Look Up, Planes Trains, Russian Doll, The Holdovers |
| **Equilibrado** | 2:1 – 4:1 | Fargo, Inception, Fight Club, Oppenheimer, Parasite, Get Out |
| **Ação moderada** | 4:1 – 7:1 | Incredibles, La La Land, Joker, Baby Driver, American Beauty |
| **Ação pesada** | > 7:1 | All Quiet on the Western Front, 300, Breaking Bad, Hannah & Sisters |

**📌 Regra fundamental:** A maioria dos filmes (60%) está entre 2:1 e 6:1. Qualquer coisa abaixo de 2:1 é exceção (comédia/diálogo puro). Acima de 7:1 é ação extrema ou documentário.

### 🎬 Distribuição de Cenas por Gênero

| Gênero | Média cenas | Exemplo |
|--------|:----------:|---------|
| Animação | 156 | Incredibles (200), Frozen (78), Toy Story 4 (38) |
| Sci-fi/Ação | 167 | Inception (268), Arrival (167), Looper (316) |
| Drama | 118 | Oppenheimer (279), Gone Girl (256), The Brutalist (161) |
| Comédia | 87 | Planes Trains (172), Bridesmaids (94), 500 Days (21) |
| Terror/Thriller | 120 | Get Out (124), The Lighthouse (112), No Country (150) |

### 🚪 INT vs EXT Distribution

```
INT.: 62% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXT.: 38% ━━━━━━━━━━━━━━━━━━━━━━━━
```

Filmes de tribunal/escritório tendem a 80%+ INT.  
Filmes de guerra/aventura chegam a 60%+ EXT.

### ⏱ Pacing (Palavras por Página)

Média geral: **188 palavras/página**

Isso significa que numa página de roteiro cabem ~188 palavras. Como 1 página = 1 minuto de tela, um roteirista sabe que 188 palavras = 60 segundos de filme.

### 🗣 Personagens por Filme

- Média: **76 personagens únicos** por filme
- Porém **80% do diálogo é carregado por apenas 5-8 personagens**
- Personagens com 1-2 falas (coadjuvantes menores) representam ~40% dos nomes listados

### 📏 Top 5% Falas Mais Longas

Média: **14 palavras**

Isso significa que mesmo as falas mais longas (monólogos) raramente passam de 14 palavras. A regra "5 palavras/fala" se mantém — os picos são exceções dramáticas.

Roteiros profissionais seguem **padrões consistentes** que vão além da formatação Fountain. O ritmo, a densidade de ação vs diálogo, o tamanho das falas, e a estrutura das descrições seguem regras não-escritas que um sistema de IA precisa entender pra gerar texto que pareça profissional.

---

## 1. ESTRUTURA DE CENA

### Abertura de Cena — Padrão Universal

100% dos roteiros seguem:

```
[LOCAL] - [TEMPO]    ← scene-heading
[IMAGEM FORTE]       ← primeira action line (ambientação ou ação imediata)
[PERSONAGEM] em [AÇÃO]  ← introdução visual
```

**Exemplos reais:**
```
EXT. COW PASTURE - DAY
Deep blue sky overhead. Fat, scuddy clouds. Below them, black and white cows graze.
→ Breaking Bad

EXT. HIGHWAY - MORNING
Cars are at a standstill. It's a horrific traffic jam.
→ La La Land

A car bursts through the curtain of snow.
→ Fargo
```

**Regra:** A primeira action line depois do scene-heading **nunca** é diálogo. É sempre uma imagem — o leitor precisa VER o lugar antes de saber quem fala.

### Tamanho dos Parágrafos de Ação

| Roteiro | Média palavras/ação | Estilo |
|---------|-------------------|--------|
| Inception | 6.9 | Curto, visual, cortes rápidos |
| Fargo | 6.4 | Conciso, descrição precisa |
| La La Land | 7.1 | Mais descritivo, quase literário |
| The Incredibles | 7.2 | Ação contínua, onomatopeias em CAPS |
| Breaking Bad | 8.3 | Mais denso, atmosférico |
| Russian Doll (TV) | 11.3 | TV permite mais texto |

**Padrão ouro:** 6-8 palavras por action line. Cada linha deve passar UM pedaço de informação visual.

### Fechamento de Cena

Cenas fecham com:
1. **Ação conclusiva** ("Ele sai.")
2. **Reação silenciosa** ("Ela olha para o horizonte.")
3. **Transição explícita** ("CORTA PARA:")

Nolan usa cortes abruptos em ação em vez de transições. Coen brothers deixam a imagem final falar.

---

## 2. PADRÕES DE AÇÃO (DESCRIÇÃO)

### 2.1 — Verbos no Presente, Sempre

Ação de roteiro usa **presente do indicativo** — NUNCA passado, NUNCA gerúndio contínuo.

```
✅ "Ele cruza a sala."     ← presente
❌ "Ele estava cruzando..." ← passado contínuo
❌ "Ele cruzou a sala..."  ← passado
```

### 2.2 — Onomatopeias e Sons em CAPS

Efeitos sonoros são escritos em CAIXA ALTA:

```
O carro FREIA bruscamente.
A porta BATE.
O metal RANGE.
A TV ESTALA com estática.
```

Isso não é decoração — é um código: **tudo que é som ou ação impactante vai em CAPS**. O leitor (diretor, editor de som) sabe o que grifar.

### 2.3 — Introdução de Personagem

Padrão universal: **NOME EM CAPS** (idade), descrição-relâmpago.

```
FUMAÇA (2), uma gata branca de olhos azuis, observa da janela.
MESTRE MACACO (ancião), cinzento e ereto como um monge.
```

Comparação com roteiros reais:
```
COBB (35), handsome, tailored.
→ Inception

NADIA (36), troubled but one of the good guys.
→ Russian Doll

SEBASTIAN (32), L.A. native.
→ La La Land
```

**Regra de ouro:** 3-8 palavras de descrição. Qualquer coisa maior que uma linha é excesso.

### 2.4 — "We SEE" / "We HEAR"

Roteiristas experientes usam "We SEE" e "We HEAR" com moderação. A maioria das ações é direta:

```
✅ Um carro preto estaciona em frente.
❌ We see a black car pull up in front.
```

Exceção: quando o ponto de vista muda intencionalmente (como em Breaking Bad que usa "We see" para efeito dramático).

### 2.5 — Subtexto em Ação

Ação nunca diz o que o personagem está sentindo. Mostra através de comportamento:

```
❌ Mestre Macaco está triste com a partida de Fumaça.
✅ Mestre Macaco observa Fumaça se afastar. Não se move. A mão dele aperta o cajado.
```

Inception faz isso perfeitamente — Cobb nunca diz "estou com medo", mas as ações mostram.

---

## 3. PADRÕES DE DIÁLOGO

### 3.1 — Tamanho das Falas

| Roteiro | Média palavras/fala | Estilo |
|---------|-------------------|--------|
| Inception | 5.3 | Curtas, expositivas mas naturais |
| Fargo | 5.1 | Muito curtas, dialeto regional |
| La La Land | 4.9 | Cortadas, musicais, ritmo |
| The Incredibles | 5.2 | Piadas curtas, timing cômico |
| Breaking Bad | 5.2 | Tensas, medidas |
| Russian Doll | 9.8 | TV permite mais texto |

**Padrão geral:** 5 palavras/fala. Cinema é show, não tell. Diálogo longo é coisa de TV.

### 3.2 — Estrutura de Troca de Diálogo

Cinema usa **trocas curtas e rápidas**:

```
NADIA: You made that door?
LIZZY: She made it.
MAXINE: She built it.
NADIA: Congrats! It's terrifying.
→ Russian Doll (5 palavras por fala)

WALT: Chemistry is the study of what?
STUDENT: Chemicals.
→ Breaking Bad (troca de 2 falas)
```

**Regra:** Duas pessoas não falam por mais de 3 exchanges consecutivas sem uma ação interrompendo.

### 3.3 — Subtexto

Diálogo eficaz raramente diz o que o personagem quer:

```
O que a fala diz:    "Cappuccino, please."
O que significa:     "Estou aqui, me note."
→ La La Land

O que a fala diz:    "Hey, Max, the bathroom door turned out so killer."
O que significa:     "Quero sua aprovação, Max."
→ Russian Doll
```

IA precisa aprender que diálogo de roteiro é **ação indireta** — personagens pedem, ameaçam, seduzem, evitam, mas raramente declaram.

### 3.4 — Parentheticals

Usados com moderação (~5% das falas). Só quando necessário pra desambiguar tom:

```
NADIA
      (shrugs)
"Fun" is for suckers, Max.
```

Se o texto da fala já comunica o tom, o parenthetical é redundante.

---

## 4. PROPORÇÃO AÇÃO : DIÁLOGO

| Roteiro | Ação : Diálogo | Gênero |
|---------|---------------|--------|
| Breaking Bad | 9:1 | Drama TV denso |
| The Incredibles | 6:1 | Animação / Ação |
| La La Land | 6:1 | Musical |
| Inception | 3.5:1 | Sci-fi / Ação |
| Fargo | 2.4:1 | Crime / Diálogo |
| Russian Doll | 1.8:1 | Comédia dramática TV |

**Regra de bolso:**
- **Ação:** roteiro > 5:1 → filme visual, blockbuster, animação
- **Equilibrado:** 2:1 a 5:1 → drama, thriller
- **Diálogo:** < 2:1 → TV, comédia, drama de personagem

---

## 5. TRANSIÇÕES

Roteiros modernos usam **mínimas transições**. Apenas 3 tipos aparecem consistentemente:

| Transição | Uso | Exemplo |
|-----------|-----|---------|
| CUT TO: | 90% das transições | Padrão, implícito (nem se escreve mais) |
| FADE OUT. | Fim do roteiro | Universal |
| SMASH CUT TO: | Choque, surpresa | Breaking Bad |

**Tendência:** Roteiros pós-2000 usam cada vez menos transições escritas. CORTE é o padrão invisível.

---

## 6. REVISÕES E CORES (SISTEMA BEAT)

Os PDFs confirmam o sistema de revisão em cores:

```
Goldenrod Revisions: 4/25/18
Green Revisions: 4/9/18
Yellow Revisions: 2/26/18
Pink Draft: 2/20/18
Blue Draft: 2/7/18
White Draft: 1/25/18
→ Russian Doll (6 gerações de revisão)
```

O Beat usa 8 níveis. A indústria usa de 4 a 8. **Esse sistema está correto e é padrão de mercado.**

---

## 7. REGRAS PARA IA DE ROTEIRO

Com base na análise, o gerador de sugestões de IA deve seguir:

### Regras de Ação

1. **Presente, sempre.** ("Ele cruza a sala." ✅)
2. **6-8 palavras por linha.** Nunca mais que 12.
3. **CAPS para sons.** ("A PORTA BATE.") 
4. **Introdução em CAPS + idade.** ("FUMAÇA (2), gata branca.")
5. **Uma imagem por linha.** Não empilhar descrições.
6. **Mostrar, não dizer.** Ação revela emoção, não declara.
7. **Verbos ativos.** Evitar "ser", "estar", "ter" como verbo principal.

### Regras de Diálogo

1. **5 palavras por fala em cinema, 10 em TV.** 
2. **Subtexto.** Personagem nunca diz o que quer.
3. **Trocas curtas.** Máximo 3 exchanges sem ação.
4. **Parentheticals só quando necessário.** (<5% das falas)
5. **Nunca explicar o óbvio.** Se a ação mostra, não precisa falar.
6. **Voz única.** Cada personagem tem padrão de fala distinto.

### Regras de Cena

1. **Abrir com imagem**, não diálogo.
2. **Fechar com ação ou reação**, não explicação.
3. **Proporção ação:diálogo** varia por gênero (tabela acima).
4. **1 cena = 1 lugar = 1 tempo.** Mudou qualquer um, nova cena.

---

## 8. APLICAÇÃO NO CINEWEAVE

### Prompt de IA para Sugestão de Ação

```
Reescreva a seguinte action line seguindo o padrão Hollywood:
- Presente do indicativo
- 6-8 palavras
- Som em CAPS
- Uma imagem por vez

Original: [texto do usuário]
Reescrita: [ação no padrão profissional]
```

### Prompt de IA para Sugestão de Diálogo

```
Reescreva o seguinte diálogo seguindo o padrão de roteiro profissional:
- Máximo 10 palavras por fala
- Subtexto — personagem NÃO diz o que sente
- Tom natural, sem exposição forçada
- Use ação entre falas se a cena estiver muito verbosa

Original: [diálogo do usuário]
Reescrita: [diálogo profissional]
```

### Prompt de IA para Feedback de Qualidade

```
Analise este trecho de roteiro contra os padrões profissionais:

CRITÉRIOS:
- Ação em presente? (penalidade se não)
- Média de palavras por linha de ação: 6-8? (penalidade se >12)
- Média de palavras por fala: 5-10? (penalidade se >20)
- Cena abre com imagem? (penalidade se abre com diálogo)
- Subtexto no diálogo? (penalidade se personagem declara emoção)
- CAPS para sons e ações impactantes?
- Proporção ação:diálogo adequada ao gênero?

Trecho: [texto]
Score: 0-10 com justificativas
```

---

## NOTA SOBRE A COLEÇÃO ROTEIROS/

Os PDFs em `ROTEIROS/` representam o estado da arte da escrita de roteiro americano.

---

## PESQUISA — Como a Indústria Analisa Roteiros

### 📋 Script Coverage (O Padrão da Indústria)

Toda produtora (Netflix, A24, Warner, etc.) usa **Script Coverage** para avaliar roteiros. É o que um leitor profissional entrega pro executivo antes dele ler o roteiro inteiro. Estrutura padronizada:

| Seção | Conteúdo | Tamanho |
|-------|----------|---------|
| **Header** | Título, autor, gênero, data, páginas | 1 linha cada |
| **Logline** | O roteiro em 1-2 frases | ~30 palavras |
| **Synopsis** | Resumo da trama com começo/meio/fim | 1-2 páginas |
| **Comments** | Análise crítica: pontos fortes/fracos | 2-3 páginas |
| **Rating Grid** | Notas de 1-10 em cada categoria | Grid |
| **Recommendation** | Pass / Consider / Recommend | 1 linha |

### ⭐ Rating Grid (Critérios de Avaliação)

Os critérios que um leitor profissional usa:

| Critério | O que avalia | Peso |
|----------|-------------|:----:|
| **Plot** | Estrutura, originalidade, lógica | ★★★★★ |
| **Character** | Profundidade, arco, motivação | ★★★★★ |
| **Dialogue** | Naturalidade, subtexto, voz única | ★★★★ |
| **Structure** | Atos, beats, pacing | ★★★★ |
| **Commercial** | Mercado, público-alvo | ★★★ |
| **Format** | Formatação correta, sem erros | ★★ |

### 🧠 Métodos de Análise Profissionais

**1. Beat Sheet (Blake Snyder — Save the Cat)**
- 15 beats obrigatórios em páginas específicas
- Opening Image (1%), Theme Stated (5%), Catalyst (10%), Debate (10-20%)
- Break into Two (20%), B Story (22%), Fun & Games (20-55%), Midpoint (55%)
- Bad Guys Close In (55-75%), All Is Lost (75%), Dark Night of the Soul (75-85%)
- Break into Three (85%), Finale (85-99%), Final Image (99-100%)

**2. Atos Clássicos (Syd Field)**
- **Ato I** (páginas 1-25): Setup — personagens, mundo, conflito
- **Plot Point I** (página 25-30): Virada que leva ao Ato II
- **Ato II** (páginas 30-90): Confrontation — obstáculos, desenvolvimento
- **Midpoint** (página 55-60): Grande virada
- **Plot Point II** (página 85-90): Tudo muda, leva ao clímax
- **Ato III** (páginas 90-120): Resolution — clímax e desfecho

**3. Sequence Approach (Frank Daniel)**
- 8 sequências de ~12-15 páginas cada
- Cada sequência tem seu próprio mini-arco dramático
- Método mais usado por diretores-roteiristas

**4. Scene-Level Analysis**
- Cada cena avaliada individualmente por:
  - **Função narrativa:** Avança trama, revela personagem, estabelece atmosfera
  - **Tensão dramática:** Alta/média/baixa
  - **Comprimento:** Muito longa, ideal, muito curta
  - **Transição:** Como conecta com a cena anterior

---

## REPOS NO GITHUB — Análise Computacional de Roteiros

### 1. 🏆 **ScreenPy** — drwiner/ScreenPy
**Linguagem:** Python
**O que faz:** Parser de roteiros para extrair elementos narrativos estruturados. Baseado em pesquisa acadêmica (Intelligent Narrative Technologies Workshop).
**Recursos:**
- Parse automático de screenplay (scene headings, characters, dialogue)
- Extração de padrões narrativos
- Anotações estruturais
**Relevância pro CineWeave:** ⭐⭐⭐⭐⭐ — É exatamente o que estamos construindo, mas em Python e acadêmico

### 2. 🏆 **Film Script Analysis** — AdeboyeML/Film_Script_Analysis
**Linguagem:** Python (Jupyter Notebooks)
**O que faz:** Análise completa de 1000+ roteiros do IMSDB:
- Segmentação de cenas (INT/EXT, Dia/Noite)
- Extração de personagens com frequência de aparição
- **Mapa de interação entre personagens** (grafo)
- **Análise de sentimento por cena e por personagem**
- Distribuição de gênero
**Relevância pro CineWeave:** ⭐⭐⭐⭐⭐ — Mais completo que o nosso. Tem grafo de personagens, análise de sentimento por fala, gender distribution.

### 3. 🥈 **Script-Analyzer** — PCJohn/Script-Analyzer
**Linguagem:** Python
**O que faz:**
- Centralidade de personagens (quem é o mais importante? Quem conecta a trama?)
- Pontuação de cenas por TF-IDF (quais cenas são mais únicas/importantes?)
- Grafo de interação entre personagens com evolução temporal
**Relevância pro CineWeave:** ⭐⭐⭐⭐ — Centralidade de personagens e importância de cenas via TF-IDF

### 4. 🥈 **SUMMER** — ppapalampidi/SUMMER
**Linguagem:** Python (PyTorch)
**O que faz:**
- **Sumarização automática** de roteiros usando estrutura narrativa latente
- **Identificação de turning points** (plot points) baseada em screenplay
- Modelo Topic-Aware (TAM) para detectar pontos de virada
**Relevância pro CineWeave:** ⭐⭐⭐⭐ — Detecção automática de plot points, sumarização de cenas

### 5. 🥉 **jacobseiler/screenplay-analysis**
**Linguagem:** Python
**O que faz:** Histograma de falas por personagem, interações cumulativas ao longo da série
**Relevância:** ⭐⭐⭐ — Conceito similar, mas focado em Game of Thrones

### 6. 🥉 **NLP-Movie_Scripts** — PedroUria/NLP-Movie_Scripts
**Linguagem:** Python (NLP)
**O que faz:** Tenta prever sucesso de bilheteria baseado apenas no script — features de linguagem extraídas de diálogos
**Relevância:** ⭐⭐⭐ — Previsão de sucesso via NLP, features linguísticas

---

## 🎯 O QUE APLICAR NO CINEWEAVE

Combinando a pesquisa acadêmica + repositórios + análise dos 68 roteiros:

### Implementar no App:

1. **Grafo de Personagens** (como Film_Script_Analysis e Script-Analyzer)
   - Quem fala com quem
   - Centralidade (personagens mais importantes)
   - Evolução temporal (centralidade muda ao longo do roteiro)

2. **Pontuação de Cenas por Importância** (TF-IDF + análise semântica)
   - Quais cenas são mais únicas/destacáveis
   - Identificação de turning points automática

3. **Análise de Sentimento por Personagem**
   - Arco emocional de cada personagem ao longo do roteiro
   - Tom geral do roteiro (positivo/negativo por cena)

4. **Comparação de Estrutura contra Beat Sheet**
   - Onde estão os beats do Save the Cat?
   - O roteiro segue os 15 beats nos lugares certos?

5. **Script Coverage Automático**
   - Logline gerado por IA
   - Synopsis resumido
   - Rating Grid com notas (Plot, Character, Dialogue, Structure)
   - Recommendation: Pass/Consider/Recommend

### Inspiração pra Interface:

```jsx
// Componente: ScriptCoverageReport
<CoverageReport
  logline="Uma gata branca..."
  synopsis="Fumaça vive feliz no quintal..."
  ratings={{
    plot: 7,
    character: 8,
    dialogue: 6,
    structure: 7,
    commercial: 5,
  }}
  recommendation="Consider"
  characterGraph={/* visualization */}
  sentimentArc={/* sentiment over time */}
/>
```

---

## COMPARADOR DE ROTEIROS — Como Usar no CineWeave

### Sistema de Score (0-10)

O app pode comparar o roteiro do usuário contra os benchmarks reais:

| Critério | Benchmark | Score 10 | Score 5 | Score 0 |
|----------|:---------:|----------|---------|---------|
| Ratio A:D | 2:1 – 6:1 | Dentro | Próximo | Muito fora |
| Palavras/fala | 5-7 | Ideal | Aceitável | Robótico |
| Ação/linha | 6-9 palavras | Conciso | Verborrágico | Excessivo |
| Cenas/página | 0.8-1.2 | Cinema | TV | Errado |
| INT% | 55-70% | Equilibrado | Tendencioso | Extremo |
| Personagens com 80% diálogo | 5-8 | Foco | Disperso | Fragmentado |

### Como aplicar na IA

Quando o usuário escrever um trecho, o sistema:

1. **Extrai as mesmas métricas** do trecho dele
2. **Compara com o benchmark** do gênero correspondente
3. **Sugere ajustes específicos** baseados nas diferenças

**Exemplo de output:**
```
📊 ANÁLISE vs INDÚSTRIA

Seu ratio A:D = 8.5:1
Benchmark drama = 2:1 - 4:1
⚠ Seu roteiro tem muito mais ação que diálogo para um drama.
Sugestão: Adicione 2-3 falas entre as cenas de ação.

Suas falas têm média 12 palavras
Benchmark = 5-7 palavras
⚠ Diálogos longos demais. Tente cortar pela metade.
Cada fala deve caber em ~5-7 palavras.

Suas ações têm média 15 palavras/linha
Benchmark = 6-9 palavras
⚠ Descrições muito longas. Quebre em 2-3 linhas menores.
```

### Arquivo de dados

O arquivo `D:\CineWeave\ROTEIROS\benchmark_data.json` (a ser gerado na Fase 7) conterá:

```json
{
  "benchmarks": {
    "feature_film_average": {
      "pages": 127, "scenes": 141, "ratio_ad": 4.37,
      "avg_dialogue_words": 5.8, "avg_action_words": 7.2,
      "pct_int": 62, "unique_chars": 76
    },
    "by_genre": { ... },
    "by_writer": {
      "nolan": { "ratio_ad": 3.5, "avg_dialogue": 5.3, ... },
      "coen": { "ratio_ad": 2.4, "avg_dialogue": 5.1, ... },
      "sorkin": { "ratio_ad": 2.8, "avg_dialogue": 4.8, ... }
    }
  },
  "all_screenplays": [ ... ] // dados de cada roteiro
}
```

---

# ASSISTENTE DE ESCRITA — ESPECIFICAÇÃO DO SISTEMA

**Base:** Padrões extraídos de 56 roteiros clássicos

## Filosofia

O assistente NUNCA edita automaticamente. Ele destaca, sugere, explica — o usuário decide. Funciona como um leitor profissional que sussurra no ouvido enquanto o roteirista escreve.

## Disparadores em Tempo Real

| Evento | Ação do assistente |
|--------|-------------------|
| Usuário termina action line | Verifica: presente? 6-8 palavras? Som em CAPS? |
| Usuário escreve fala de diálogo | Verifica: ≤10 palavras? Subtexto? Voz do personagem? |
| Usuário digita scene-heading | Verifica: formato correto? Cena duplicada? |
| Usuário escreve "We see/hear" | Sugere versão mais direta |
| Usuário fecha cena (transição) | Painel com métricas da cena |
| A cada 100 linhas | Feedback consolidado com score 0-10 |

## Regras com Exemplos Reais

### Ação — Presente do Indicativo

❌ "Fumaça estava olhando o horizonte."
✅ "Fumaça olha o horizonte."

**Exemplo real:** *The waves TOSS a BEARDED MAN onto wet sand. He lies there.* (Inception)

### Ação — Som em CAPS

❌ "A porta bateu."
✅ "A porta BATE."

**Palavras-chave:** BATE, GRITA, CORTA, EXPLODE, QUEBRA, ESTALA, ZUNE, FREIA
**Exemplo real:** *His window WHOOSHES open.* (The Incredibles)

### Ação — Uma Imagem por Linha

❌ Action line com >15 palavras → quebrar.
✅ Máximo 8-12 palavras por linha de ação.

**Exemplo real:** *Deep blue sky overhead. Fat, scuddy clouds. Below them, black and white cows graze.* (Breaking Bad) — 3 linhas, 3 imagens.

### Ação — Introdução de Personagem

❌ "Fumaça é uma gata branca de olhos azuis que é muito determinada."
✅ "FUMAÇA (2), gata branca de olhos azuis. Determinada."

**Exemplos reais:** COBB (35), handsome, tailored. · NADIA (36), troubled but one of the good guys.

### Diálogo — Máximo 5-10 Palavras

**Benchmarks:** Cinema 5-7 · TV 7-10 palavras/fala.
**Exceção:** Monólogos intencionais (abertura de Breaking Bad).

### Diálogo — Subtexto Obrigatório

❌ "Estou com medo de perder meu lar."
✅ "Este território agora pertence ao bando, gata. Sua era acabou."

| Fala | Texto | Significado real |
|------|-------|-----------------|
| La La Land | "Cappuccino, please." | "Me note." |
| Russian Doll | "That bathroom door? Straight fire." | "Quero sua aprovação." |

### Diálogo — Máximo 3 Trocas sem Ação

❌ A: "Vamos?" B: "Sim." A: "Tem certeza?" B: "Claro."
✅ A: "Vamos?" B: "Sim." [AÇÃO] B: "Agora ou nunca."

### Cena — Abrir com Imagem

❌ EXT. QUINTAL - DIA / FUMAÇA: "Que dia lindo!"
✅ EXT. QUINTAL - DIA / O quintal é um paraíso esquecido — grama alta...

### Cena — Fechar com Ação Visual

❌ "Fumaça decidiu que precisava de ajuda."
✅ "Fumaça toca o amuleto. Fecha os olhos. Uma brisa quente passa."

## Modos de Operação

1. **Inline** — Bolha ✨ ao lado da linha enquanto digita
2. **Painel de Cena** — Ao fechar cena, mostra métricas (A:D ratio, palavras, personagens)
3. **Feedback Consolidado** — A cada 100 linhas, score 0-10
4. **Comparação Benchmark** — Métricas do usuário vs benchmark_data.json

## Interface Sugerida

```jsx
<WritingAssistant
  mode="inline"
  currentElement={element}
  suggestions={[
    { type: 'tense', message: 'Use presente: "corre" em vez de "correu"', fix: 'corre' },
    { type: 'caps', message: 'Som em CAPS: "BATE"', fix: 'BATE' },
  ]}
  onAccept={(fix) => applyFix(fix)}
/>
```

## Comandos Rápidos

| Atalho | Ação |
|--------|------|
| Ctrl+Space | Sugerir continuação |
| Ctrl+Shift+A | Analisar cena atual |
| Ctrl+Shift+D | Reescrever diálogo selecionado |
| Ctrl+Shift+F | Feedback consolidado |
| Ctrl+Shift+B | Comparar com benchmark |
