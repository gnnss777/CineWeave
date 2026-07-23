# Plano: testar e corrigir a importação do CineWeave até unificar tudo na Enciclopédia

Contexto: o app usa `project.entities` como única fonte da verdade
(characters, locations, scenes, acts, dialogues, plot_points, themes,
objects, world_elements). A importação (Fountain/.txt, PDF, DOCX, FDX)
precisa alimentar exatamente essa estrutura, sem duplicar nada e sem
perder informação, para que Enciclopédia / Roteiro / Mind Map / Corkboard
sempre reflitam os mesmos dados.

Este plano foi desenhado para ser executado **sem abrir o navegador**,
testando o pipeline de importação direto em Node, arquivo por arquivo,
função por função. Isso é bem mais rápido pra achar bugs do que clicar
na UI a cada iteração — e o `entityExtractor.js` / `fountainImport.js`
são JS puro (sem DOM), então rodam direto no Node.

## O que já foi feito nesta sessão

Rodei esse plano e já achei e corrigi **2 bugs reais** que afetavam
100% das importações (qualquer arquivo, Fountain/PDF):

### Bug 1 — `parseSceneHeading` descartava o horário da cena
Em `src/lib/entityExtractor.js`, a regex de cabeçalho de cena captura o
nome do local (`match[2]`) separado do trecho após o traço (`match[3]`,
ex. "NOITE"), mas o código só usava `match[2]` e **jogava fora
`match[3]` inteiro**. Resultado: toda locação importada virava sempre
`timeOfDay: 'DIA'`, não importa se o roteiro dizia NOITE, TARDE,
MADRUGADA, CONTINUOUS etc.

### Bug 2 — número de cena "comia" a palavra de horário
Em `cleanSceneNumber`, quando o número de cena vem depois da palavra de
horário (comum em roteiros exportados de PDF, ex: `"SALA - NOITE 45"`),
a regex removia "NOITE 45" inteiro em vez de só o "45", perdendo a
informação de horário de novo.

Os dois estão corrigidos em:
`fix-completo.patch` (na raiz do repositório)

Também montei um harness de teste (roda em Node, sem browser) em
`/mnt/user-data/outputs/import-tests/`:
- `resolve-loader.mjs` — loader pra Node entender imports sem extensão
  (Vite resolve isso, Node puro não)
- `test_import.mjs` — roda o pipeline completo: parseFountain →
  extractEntitiesFromScreenplay → linkEntitiesToScreenplay, e imprime
  contagens e o que ficou sem linkar
- `debug1.mjs`, `debug2.mjs`, `debug3.mjs` — testes pontuais de
  parseSceneHeading e de deduplicação em reimportação
- `samples/exemplo1.fountain` — roteiro de exemplo em português

Já validei: cabeçalhos com "- NOITE", "- CONTINUOUS", "- ENTARDECER",
número de cena antes/depois, e reimportação do mesmo arquivo (não
duplica personagem/locação/cena/ato).

## Como aplicar o patch e continuar

```bash
cd CineWeave
git apply fix-completo.patch
npm install
```

## Passo a passo pro agente continuar (rodar em loop até fechar)

1. **Rodar o harness contra o `exemplo1.fountain`** e contra roteiros
   reais do usuário (pedir 2-3 arquivos reais em .fountain/.txt/.pdf/.docx
   que estão dando problema — isso acelera MUITO achar bugs de verdade,
   em vez de adivinhar).
   ```bash
   node --experimental-loader import-tests/resolve-loader.mjs \
     import-tests/test_import.mjs <caminho-do-arquivo-convertido-para-texto>
   ```
   Para PDF/DOCX, primeiro rodar `parseFile()` (fileParser.js) — dá pra
   testar em Node também, com um polyfill mínimo de `File`
   (arrayBuffer()/text()/type), já que mammoth e pdfjs-dist não dependem
   do DOM para extrair texto.

2. **Conhecido — ainda não corrigido — anotar e decidir**:
   locais com dois traços, ex. `"INT. CASA DE MARIA - QUARTO - NOITE"`,
   perdem o sublocal ("QUARTO" é descartado, fica só "CASA DE MARIA").
   Isso é um heurística antiga (`hyphenIdx` em `parseSceneHeading`) cujo
   propósito original não está 100% claro — antes de mexer, testar com
   roteiros reais do usuário pra ver se esse padrão aparece e o que
   fazia sentido antes.

3. **Testar os outros formatos de entrada**:
   - `.fdx` (Final Draft) → `src/lib/fdxImport.js` (ainda não auditado
     nesta sessão)
   - `.pdf` → `src/lib/fileParser.js::parsePDF` (heurística de
     coordenadas x/y — mais frágil, testar com PDFs reais exportados de
     Celtx/Final Draft/Beat)
   - `.docx` → `parseDOCX` (usa mammoth, perde toda formatação de
     roteiro — texto vira parágrafo corrido, então depende 100% do
     `parseFountain` conseguir re-detectar cena/personagem/diálogo a
     partir de texto "achatado"; testar se isso funciona bem)

4. **Testar o caminho de enriquecimento por IA** (objetos, plot points,
   temas) em `ProjectContext.jsx` (`extractEnrichmentFromScreenplay`,
   por volta da linha 1255) — isso depende de uma API key configurada,
   então validar separadamente do parsing puro.

5. **Testar a extração de personagem "fallback" em ACTION** (linha
   ~180 de `entityExtractor.js`): texto em CAIXA ALTA dentro de uma ação
   é tratado como possível personagem. Isso pode gerar falsos positivos
   com siglas, nomes de lugares em maiúsculo, títulos de cena mal
   formatados etc. — vale testar com roteiros reais e ver a taxa de
   falso positivo.

6. **Testar a linkagem cena↔roteiro↔enciclopédia depois de EDITAR**:
   `saveScreenplay` (ScreenplayTab.jsx linha ~647) chama
   `linkScreenplayToEntities` toda vez que o roteiro é salvo. Confirmar
   que editar um título de cena no roteiro atualiza a ficha na
   Enciclopédia (e vice-versa) sem criar uma ficha duplicada — esse é o
   requisito central de "tudo unificado".

7. **Repetir**: a cada bug achado, escrever um caso de teste mínimo
   (como os `debugN.mjs`), confirmar o bug, corrigir, rodar de novo até
   verde, seguir pro próximo.

## Atualização — o problema real do áudio (achado depois de mais teste)

Você confirmou: a importação de roteiro estava trazendo dados errados/incompletos
(os bugs 1 e 2 acima explicam boa parte disso — todo horário virava "DIA"), e
que gravar direto no app é suficiente, não precisa subir arquivo de áudio pronto.

Investigando o caminho de gravação, achei a causa raiz de "a IA não analisa
minha gravação": **não tinha bug de parsing aqui — o recurso simplesmente não
estava ligado a nada**.

- O botão "Processar Tudo" (`handleProcessAll`) tinha uma exclusão explícita:
  `isProcessingDoc = (d) => !d.id.startsWith('recording-')` — ou seja, gravações
  eram **puladas de propósito** na hora de mandar pra IA.
- A única função que "processava" gravação (`processBrainstorm`, em
  `ProjectContext.jsx`) é **código de demonstração morto**: nem está ligado a
  nenhum botão na tela, e quando chamado, ignora o conteúdo real da gravação —
  só olha se a transcrição contém a palavra "personagem", "cenário" ou nenhuma
  das duas, e em cada caso insere sempre a MESMA ficha fixa e fictícia
  ("Doutor Shinoda", "O Mercado das Sombras" ou uma cena com "Max").
- Ou seja: salvar uma gravação só guardava o texto em `project.recordings`, sem
  nenhum caminho real até a Enciclopédia.

### Correção aplicada (`src/components/BrainstormTab.jsx`)
- `handleSaveRecording` agora registra a gravação como um documento "já
  parseado" (`addBrainstormDocument`, com `id: recording-{id}` e
  `metadata.source: 'recording'` — o mesmo formato que o resto do código já
  esperava, então provavelmente essa ligação existia antes e foi perdida) e
  dispara a extração por IA de verdade (`extractStructureFromDocuments`, o
  mesmo motor usado pros documentos PDF/DOCX/TXT/MD) automaticamente em seguida.
- `handleProcessAll` não exclui mais gravações da etapa de extração (só
  continua excluindo da etapa de reparse-de-arquivo, que não se aplica a
  gravação, já que ela não tem arquivo, só texto).
- **Bug de concorrência corrigido de brinde**: a função de extração só decidia
  o que salvar de volta no fim (depois de esperar a resposta da IA), usando um
  `currentProject` "fotografado" no momento em que a extração começou. Se
  alguma coisa mudasse o projeto nesse meio-tempo (como a própria gravação
  sendo salva um instante antes), esse salvamento final apagava essa mudança.
  Troquei essa leitura por uma `ref` sempre atualizada (`currentProjectRef`),
  então isso não acontece mais — nem só pra gravação, pra qualquer extração de
  documento também.

Isso já está no patch `fix-completo.patch` (build de produção rodado e
passou limpo depois da mudança).

### O que ainda falta você testar/decidir
1. **Testar de verdade, gravando algo no app** (com API key da NVIDIA
   configurada) e conferir se a Enciclopédia populou com o conteúdo real da
   fala, não mais com "Doutor Shinoda" nem vazio.
2. Se **não tiver** API key configurada, a extração vai falhar (a mensagem já
   existente vai avisar) — confirmar se você já tem essa chave configurada ou
   se isso também precisa entrar no plano.
3. A qualidade da transcrição em si depende 100% da Web Speech API do
   navegador (Chrome funciona bem, outros navegadores podem não suportar —
   vale testar no navegador que você realmente usa).
4. Repetir o mesmo tipo de auditoria ("será que essa função está de fato
   conectada em algum botão, ou é código morto/mock?") no restante do app,
   já que achamos uma função inteira (`processBrainstorm`) desconectada da UI.



Eu apliquei as correções **apenas na cópia local que clonei aqui** (não
tenho como dar push no seu GitHub). O patch
`fix-timeofday.patch` está pronto pra você aplicar no seu repo real.
Se quiser, na próxima mensagem me manda 2-3 roteiros reais (mesmo que
sejam os que estão falhando na importação) que eu continuo o plano
testando contra eles especificamente — é o jeito mais rápido de fechar
o resto dos bugs de verdade, em vez de eu ficar inventando casos de
teste genéricos.
