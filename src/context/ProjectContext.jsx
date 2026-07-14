import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { syncProjectToSupabase, loadProjectsFromSupabase, isConfigured as isSupabaseConfigured, isLoggedIn } from '../lib/sync';

const ProjectContext = createContext();

const initialProjects = [
  {
    id: 'smoke-ninja-cat',
    title: 'Smoke Ninja Cat',
    tagline: 'Pelos e aço. Instinto e metal. Uma gata vai provar que um coração valente vale mais que qualquer modificação.',
    genre: 'Cyberpunk Aventura / Animação',
    logline: 'Fumaça, uma gata branca que nunca precisou lutar, vê seu lar invadido por pássaros cyberpunk com modificações mortais. Sozinha e derrotada, ela busca os lendários macacos da floresta para aprender a arte ninja. No caminho, encontra Baby, uma gata furtiva das sombras que se torna sua aliada. Juntas, terão que unir forças para enfrentar o Rei dos Pássaros e proteger o território que amam.',
    characters: [
      { id: 'snc-char-1', name: 'Fumaça', role: 'Protagonista', description: 'Gata branca de olhos azuis, pelagem pura e macia. Começa como uma gata doméstica comum e se transforma em uma guerreira ninja através do treinamento.', traits: ['Determinada', 'Corajosa', 'Curiosa', 'Resiliente', 'Leal'], backstory: 'Sempre viveu no quintal da casa. Nunca precisou lutar até os pássaros cyberpunk aparecerem e ameaçarem seu lar. A jornada a transforma de uma gata doméstica em uma ninja — sua maior força não são as garras, mas a determinação.', avatar: 'blue', notes: 'Tem uma mancha cinza quase imperceptível atrás da orelha esquerda. Seu reflexo é tão rápido que os macacos se impressionaram.' },
      { id: 'snc-char-2', name: 'Mestre Macaco', role: 'Mentor', description: 'Macaco cinzento sábio, olhos profundos e postura ereta. Líder do grupo de macacos da floresta urbana.', traits: ['Sábio', 'Paciente', 'Exigente', 'Protetor', 'Respeitado'], backstory: 'Líder do grupo de macacos da floresta urbana atrás da casa. Já treinou muitos animais na arte do movimento e da luta. Vê potencial em Fumaça desde o primeiro momento e a aceita como aprendiz.', avatar: 'green', notes: 'Ensina a Arte da Sombra — atacar de onde ninguém espera. Conhece todos os caminhos da floresta como as patas de suas próprias mãos.' },
      { id: 'snc-char-3', name: 'Baby', role: 'Aliada / Anti-heroína', description: 'Gata de pelagem escura, olhos amarelos. Vive na sacada do andar de cima. Especialista em bombas de fumaça e ataques furtivos.', traits: ['Furtiva', 'Irônica', 'Prática', 'Independente', 'Leal'], backstory: 'Vive na sacada do andar de cima. Aprendeu a sobreviver nas sombras. Cria suas próprias bombas de fumaça com materiais encontrados. Não confia em ninguém, mas respeita quem luta — e Fumaça mostrou que sabe lutar.', avatar: 'purple', notes: 'Seu colar carrega pequenos artefatos metálicos — suas bombas de fumaça improvisadas. Cada bomba é única.' },
      { id: 'snc-char-4', name: 'Rei dos Pássaros', role: 'Antagonista', description: 'Pássaro grande com modificações cibernéticas: asas mecânicas que brilham vermelho, olhos de sensor, penas de aço afiadas como lâminas.', traits: ['Arrogante', 'Cruel', 'Ambicioso', 'Estrategista', 'Impiedoso'], backstory: 'Líder do bando de pássaros cyberpunk. Expandiu seu território destruindo ninhos e lares de outros animais. Não aceita derrota — sua asa mecânica danificada na batalha final é uma ferida de orgulho que nunca vai sarar.', avatar: 'red', notes: 'Suas penas de aço podem cortar galhos grossos. A modificação nos olhos permite visão térmica e noturna.' }
    ],
    locations: [
      { id: 'snc-loc-1', name: 'O Quintal', type: 'EXT.', description: 'Espaço cercado por muros baixos e árvores altas. Grama alta, um brinquedo velho abandonado, uma mangueira enroscada. É o coração do território de Fumaça — seu lar, seu sol, seu paraíso.', timeOfDay: 'DIA', mood: 'Acolhedor, Familiar, Paraíso Esquecido' },
      { id: 'snc-loc-2', name: 'A Casa da Família', type: 'INT./EXT.', description: 'Casa modesta com piscina nos fundos. Janelas com tela de proteção. Telhado de telhas vermelhas. O refúgio de Fumaça quando precisa se esconder ou descansar entre batalhas.', timeOfDay: 'DIA', mood: 'Seguro, Familiar, Aconchegante' },
      { id: 'snc-loc-3', name: 'A Sacada da Baby', type: 'EXT.', description: 'Segundo andar, varanda estreita com vasos quebrados, uma cadeira velha, um tapete desfiado. O território de Baby, cheio de sombras e esconderijos perfeitos para emboscadas.', timeOfDay: 'TARDE', mood: 'Sombrio, Furtivo, Precário' },
      { id: 'snc-loc-4', name: 'Floresta dos Macacos', type: 'EXT.', description: 'Mata fechada atrás da casa. Árvores enormes com galhos entrelaçados formando pontes naturais. Luz filtrada pelas folhas, sombras dançantes. A academia de treinamento de Fumaça.', timeOfDay: 'DIA', mood: 'Místico, Desafiador, Sábio' },
      { id: 'snc-loc-5', name: 'Os Telhados', type: 'EXT.', description: 'Vista do alto da casa e das vizinhanças. Telhas vermelhas, antenas enferrujadas, um para-raios. O palco da batalha final contra o Rei dos Pássaros.', timeOfDay: 'ENTARDECER', mood: 'Épico, Perigoso, Crepuscular' }
    ],
    objects: [
      { id: 'snc-obj-1', name: 'Bomba de Fumaça (Baby)', significance: 'Dispositivo favorito de Baby. Feito de latas amassadas, pólvora caseira e fragmentos de metal. Cria uma cortina de fumaça densa que desorienta os inimigos.', description: 'Pequena lata enferrujada envolta em barbante. Quando ativada, libera uma nuvem espessa de fumaça cinzenta com cheiro de pólvora e metal queimado.' },
      { id: 'snc-obj-2', name: 'Pena de Aço', significance: 'Pena caída de um dos pássaros cyberpunk durante o primeiro ataque no quintal. Serve como prova da ameaça e lembrete do perigo que Fumaça precisa enfrentar.', description: 'Pena de aço oxidado com bordas afiadas. Brilho metálico frio, uma das pontas manchada com sangue — o primeiro ferimento de Fumaça na guerra pelo território.' },
      { id: 'snc-obj-3', name: 'Amuleto dos Macacos', significance: 'Presente do Mestre Macaco ao final do treinamento. Uma pequena pedra polida com marcações de garras. Símbolo de proteção e da nova identidade de Fumaça como ninja.', description: 'Pequeno seixo cinzento e liso com três riscos paralelos gravados por garra. Pendurado em um cipó fino que Fumaça usa no pescoço como colar.' }
    ],
    screenplay: [
      { id: 'snc-sc-1', type: 'scene-heading', text: 'EXT. O QUINTAL - DIA' },
      { id: 'snc-sc-2', type: 'action', text: 'O quintal é um paraíso esquecido — grama alta balançando com o vento, um brinquedo velho abandonado, uma mangueira enroscada como uma cobra de plástico. FUMAÇA, uma gata branca de olhos azuis, está no topo do muro observando seu território com olhos semicerrados.' },
      { id: 'snc-sc-3', type: 'action', text: 'O vento move a grama alta. Fumaça desce com graça felina, cada passo calculado. Ela ama este lugar.' },
      { id: 'snc-sc-4', type: 'character', text: 'FUMAÇA' },
      { id: 'snc-sc-5', type: 'parenthetical', text: '(observando o horizonte)' },
      { id: 'snc-sc-6', type: 'dialogue', text: 'Meu território. Meu sol. Meu lar.' },
      { id: 'snc-sc-7', type: 'action', text: 'Um som metálico corta o ar. Pássaros cyberpunk pousam no muro. Suas penas são de aço oxidado, olhos brilham vermelho como sensores. O REI DOS PÁSSAROS lidera o bando, suas asas mecânicas zumbindo.' },
      { id: 'snc-sc-8', type: 'character', text: 'REI DOS PÁSSAROS' },
      { id: 'snc-sc-9', type: 'dialogue', text: 'Este território agora pertence ao bando, gata. Sua era acabou.' },
      { id: 'snc-sc-10', type: 'action', text: 'Os pássaros atacam. Garras de aço rasgam o ar. Fumaça tenta se defender, mas as lâminas cortam sua pelagem branca. Manchas de sangue brotam.' },
      { id: 'snc-sc-11', type: 'action', text: 'Fumaça foge para debaixo da casa, ofegante. Sua primeira derrota. Ela lambe os ferimentos, os olhos vidrados.' },
      { id: 'snc-sc-12', type: 'character', text: 'FUMAÇA' },
      { id: 'snc-sc-13', type: 'parenthetical', text: '(ofegante)' },
      { id: 'snc-sc-14', type: 'dialogue', text: 'Eu... não posso vencer sozinha. Preciso de ajuda.' },
      { id: 'snc-sc-15', type: 'action', text: 'Ela lembra dos macacos que viu na floresta além do muro. Os sábios da árvore grande. Dizem que eles conhecem uma arte antiga — a arte do movimento felino.' },
      { id: 'snc-sc-16', type: 'transition', text: 'CORTA PARA:' },
      { id: 'snc-sc-17', type: 'scene-heading', text: 'EXT. FLORESTA DOS MACACOS - DIA' },
      { id: 'snc-sc-18', type: 'action', text: 'A floresta é um labirinto de galhos e sombras. Luzes douradas filtram pelas folhas criando um mosaico no chão. Fumaça caminha cautelosa, cada sentido alerta.' },
      { id: 'snc-sc-19', type: 'action', text: 'MESTRE MACACO aparece de cima de um galho. Cinzento, olhos profundos como poços, postura ereta que impõe respeito.' },
      { id: 'snc-sc-20', type: 'character', text: 'MESTRE MACACO' },
      { id: 'snc-sc-21', type: 'dialogue', text: 'Você veio longe, gatinha. O que uma doméstica quer na floresta dos macacos?' },
      { id: 'snc-sc-22', type: 'character', text: 'FUMAÇA' },
      { id: 'snc-sc-23', type: 'dialogue', text: 'Quero aprender a lutar. Meu lar está ameaçado por pássaros de metal.' },
      { id: 'snc-sc-24', type: 'action', text: 'O Mestre Macaco observa Fumaça por um longo momento. Seus olhos percorrem os ferimentos, a postura cansada, mas algo brilha no olhar da gata.' },
      { id: 'snc-sc-25', type: 'character', text: 'MESTRE MACACO' },
      { id: 'snc-sc-26', type: 'dialogue', text: 'Seu corpo é mole. Seus olhos não sabem ver. Mas seu coração... seu coração é de guerreira. Fique. Vamos descobrir se o resto acompanha.' },
      { id: 'snc-sc-27', type: 'action', text: 'Montagem de treinamento: Fumaça escala árvores enormes, cai, levanta e tenta de novo. Seu corpo aprende a pisar sem fazer barulho, a sentir o vento antes do ataque.' },
      { id: 'snc-sc-28', type: 'action', text: 'Mestre Macaco ensina a Arte da Sombra — atacar de onde ninguém espera. Fumaça desaparece entre as folhas, reaparece do outro lado.' },
      { id: 'snc-sc-29', type: 'action', text: 'Dia após dia. A gata branca se transforma. Seus movimentos ficam fluidos. Seus olhos aprendem a ver.' },
      { id: 'snc-sc-30', type: 'action', text: 'Fumaça executa seu primeiro ataque perfeito — um salto silencioso, garra precisa, aterrissagem impecável. Os macacos aplaudem.' },
      { id: 'snc-sc-31', type: 'character', text: 'MESTRE MACACO' },
      { id: 'snc-sc-32', type: 'dialogue', text: 'Você está pronta, pequena fumaça. A guerreira dentro de você acordou. Mas lembre-se: a verdadeira batalha não é contra o inimigo — é contra seus próprios limites.' },
      { id: 'snc-sc-33', type: 'action', text: 'Mestre Macaco entrega a Fumaça um pequeno AMULETO DE PEDRA com marcas de garra. Ela coloca no pescoço.' },
      { id: 'snc-sc-34', type: 'transition', text: 'CORTA PARA:' },
      { id: 'snc-sc-35', type: 'scene-heading', text: 'EXT. A SACADA DA BABY - TARDE' },
      { id: 'snc-sc-36', type: 'action', text: 'Fumaça volta ao território. Mas algo mudou — há cheiro de outro felino no ar. Ela segue o rastro até a sacada do andar de cima.' },
      { id: 'snc-sc-37', type: 'action', text: 'BABY está deitada em um vaso quebrado. Pelagem escura como carvão, olhos amarelos que brilham na penumbra. Um colar com pequenos artefatos metálicos — bombas de fumaça improvisadas.' },
      { id: 'snc-sc-38', type: 'character', text: 'BABY' },
      { id: 'snc-sc-39', type: 'parenthetical', text: '(sem se levantar)' },
      { id: 'snc-sc-40', type: 'dialogue', text: 'É sua aquele quintal? Os pássaros de ferro estão ficando irritantes. O barulho não deixa ninguém dormir.' },
      { id: 'snc-sc-41', type: 'character', text: 'FUMAÇA' },
      { id: 'snc-sc-42', type: 'dialogue', text: 'Eles vão ser expulsos. Eu voltei mais forte.' },
      { id: 'snc-sc-43', type: 'character', text: 'BABY' },
      { id: 'snc-sc-44', type: 'parenthetical', text: '(rindo)' },
      { id: 'snc-sc-45', type: 'dialogue', text: 'Você? Uma gata branca contra um exército de metal? Você precisa de alguém que conheça as sombras.' },
      { id: 'snc-sc-46', type: 'action', text: 'Pássaros atacam a sacada. Baby reage na hora — joga uma bomba de fumaça. O ar se enche de névoa cinzenta. Os pássaros gritam, desorientados.' },
      { id: 'snc-sc-47', type: 'action', text: 'Fumaça se move na fumaça. Ataque das sombras. Um pássaro cai.' },
      { id: 'snc-sc-48', type: 'character', text: 'FUMAÇA' },
      { id: 'snc-sc-49', type: 'parenthetical', text: '(impressionada)' },
      { id: 'snc-sc-50', type: 'dialogue', text: 'Onde aprendeu isso?' },
      { id: 'snc-sc-51', type: 'character', text: 'BABY' },
      { id: 'snc-sc-52', type: 'dialogue', text: 'Sobrevivendo. Você quer seu quintal de volta? Eu quero minha sacada em paz. Acho que podemos fazer um acordo.' },
      { id: 'snc-sc-53', type: 'action', text: 'As duas se encaram. O respeito nasce nos olhos de ambas. Baby estende a pata. Fumaça aceita.' },
      { id: 'snc-sc-54', type: 'character', text: 'FUMAÇA' },
      { id: 'snc-sc-55', type: 'dialogue', text: 'Nós vamos acabar com eles. Juntas.' },
      { id: 'snc-sc-56', type: 'transition', text: 'CORTA PARA:' },
      { id: 'snc-sc-57', type: 'scene-heading', text: 'EXT. OS TELHADOS - ENTARDECER' },
      { id: 'snc-sc-58', type: 'action', text: 'O sol se põe atrás da casa. O céu é um oceano de laranja e vermelho. Os pássaros cyberpunk se reúnem no telhado — dezenas de olhos vermelhos brilhando na penumbra.' },
      { id: 'snc-sc-59', type: 'action', text: 'Fumaça está no muro. Seus olhos azuis fixos no horizonte. Baby está na sacada, bombas prontas. É hora.' },
      { id: 'snc-sc-60', type: 'action', text: 'Fumaça avança primeiro. Seus movimentos são precisos — a dança que os macacos ensinaram. Ela escala o muro em dois saltos, desaparece entre as sombras do telhado.' },
      { id: 'snc-sc-61', type: 'action', text: 'Baby joga bombas de fumaça. O telhado fica coberto de névoa cinzenta. Os pássaros gritam, desorientados.' },
      { id: 'snc-sc-62', type: 'action', text: 'Fumaça ataca das sombras. Um a um, os pássaros caem. Garra precisa. Movimento silencioso. A Arte da Sombra em ação.' },
      { id: 'snc-sc-63', type: 'action', text: 'O REI DOS PÁSSAROS desce do céu. Suas asas mecânicas brilham com luz vermelha intensa. O vento das hélices espalha a fumaça.' },
      { id: 'snc-sc-64', type: 'character', text: 'REI DOS PÁSSAROS' },
      { id: 'snc-sc-65', type: 'dialogue', text: 'Você é só uma gata brincando de ninja. Isto não é um jogo.' },
      { id: 'snc-sc-66', type: 'character', text: 'FUMAÇA' },
      { id: 'snc-sc-67', type: 'dialogue', text: 'Brincando não. Eu sou uma ninja.' },
      { id: 'snc-sc-68', type: 'action', text: 'Fumaça e o Rei se enfrentam. Golpes de aço contra garras felinas. Penas metálicas voam. Fumaça leva um corte na face mas não recua.' },
      { id: 'snc-sc-69', type: 'action', text: 'Baby ataca pelas costas — uma bomba direto na asa mecânica do Rei. A explosão danifica o motor. Faíscas voam.' },
      { id: 'snc-sc-70', type: 'action', text: 'O Rei cai no telhado, sua asa danificada soltando faíscas azuis. Os outros pássaros fogem. O silêncio volta ao entardecer.' },
      { id: 'snc-sc-71', type: 'character', text: 'REI DOS PÁSSAROS' },
      { id: 'snc-sc-72', type: 'parenthetical', text: '(derrotado)' },
      { id: 'snc-sc-73', type: 'dialogue', text: 'Isso não acabou, gata. Voltaremos.' },
      { id: 'snc-sc-74', type: 'action', text: 'Ele foge, mancando. Fumaça não o persegue. A batalha terminou.' },
      { id: 'snc-sc-75', type: 'action', text: 'Fumaça e Baby estão no topo do muro, lado a lado. O sol se põe atrás delas. O quintal está silencioso. Em paz.' },
      { id: 'snc-sc-76', type: 'character', text: 'BABY' },
      { id: 'snc-sc-77', type: 'dialogue', text: 'Não foi ruim, gata branca.' },
      { id: 'snc-sc-78', type: 'character', text: 'FUMAÇA' },
      { id: 'snc-sc-79', type: 'parenthetical', text: '(sorrindo)' },
      { id: 'snc-sc-80', type: 'dialogue', text: 'Você também não, gata escura.' },
      { id: 'snc-sc-81', type: 'action', text: 'As duas sentam juntas no muro, observando o horizonte. A noite cai sobre o quintal.' },
      { id: 'snc-sc-82', type: 'character', text: 'FUMAÇA' },
      { id: 'snc-sc-83', type: 'parenthetical', text: '(para si mesma)' },
      { id: 'snc-sc-84', type: 'dialogue', text: 'Lar é onde a luta vale a pena.' },
      { id: 'snc-sc-85', type: 'action', text: 'Fumaça toca o amuleto no pescoço. Fecha os olhos. Uma brisa quente passa. O quintal está seguro.' },
      { id: 'snc-sc-86', type: 'transition', text: 'FADE A PRETO.' }
    ],
    mindMapNodes: [
      { id: 'snc-act1', label: 'ATO I: A Ameaça', type: 'act', x: 150, y: 80, details: 'Os pássaros cyberpunk invadem o quintal. Fumaça é derrotada e decide buscar ajuda.' },
      { id: 'snc-act2', label: 'ATO II: O Treinamento', type: 'act', x: 450, y: 80, details: 'Fumaça encontra os macacos. Aprende navegação em árvores, artes marciais felinas e a Arte da Sombra.' },
      { id: 'snc-act3', label: 'ATO III: A Aliança', type: 'act', x: 750, y: 80, details: 'Fumaça conhece Baby. Rivalidade inicial se transforma em aliança contra os pássaros.' },
      { id: 'snc-act4', label: 'ATO IV: A Batalha Final', type: 'act', x: 1050, y: 80, details: 'Confronto épico nos telhados. Fumaça e Baby derrotam o Rei dos Pássaros.' },
      { id: 'snc-char-1', label: 'Fumaça', type: 'character', x: 150, y: 280, details: 'Protagonista. Gata branca ninja. Determinada e resiliente.' },
      { id: 'snc-char-2', label: 'Mestre Macaco', type: 'character', x: 350, y: 280, details: 'Mentor. Macaco sábio que ensina a Arte da Sombra.' },
      { id: 'snc-char-3', label: 'Baby', type: 'character', x: 750, y: 280, details: 'Aliada. Gata furtiva das sombras, especialista em bombas de fumaça.' },
      { id: 'snc-char-4', label: 'Rei dos Pássaros', type: 'character', x: 950, y: 280, details: 'Antagonista. Pássaro cyberpunk com asas mecânicas e penas de aço.' },
      { id: 'snc-loc-1', label: 'O Quintal', type: 'location', x: 150, y: 480, details: 'EXT. DIA. Território de Fumaça. O lar que ela protege.' },
      { id: 'snc-loc-2', label: 'Casa da Família', type: 'location', x: 350, y: 480, details: 'INT./EXT. DIA. Refúgio de Fumaça. Piscina e telhado.' },
      { id: 'snc-loc-3', label: 'Sacada da Baby', type: 'location', x: 750, y: 480, details: 'EXT. TARDE. Território de Baby. Cheio de sombras.' },
      { id: 'snc-loc-4', label: 'Floresta dos Macacos', type: 'location', x: 550, y: 480, details: 'EXT. DIA. Academia de treinamento. Árvores gigantes.' },
      { id: 'snc-loc-5', label: 'Os Telhados', type: 'location', x: 950, y: 480, details: 'EXT. ENTARDECER. Palco da batalha final.' },
      { id: 'snc-obj-1', label: 'Bomba de Fumaça', type: 'object', x: 650, y: 380, details: 'Dispositivo de Baby. Cortina de fumaça densa.' },
      { id: 'snc-obj-2', label: 'Pena de Aço', type: 'object', x: 850, y: 380, details: 'Prova da ameaça. Primeiro ferimento de Fumaça.' },
      { id: 'snc-obj-3', label: 'Amuleto dos Macacos', type: 'object', x: 250, y: 380, details: 'Presente do Mestre Macaco. Símbolo de proteção.' },
      { id: 'snc-scene-1', label: 'Cena 1: A Invasão', type: 'scene', x: 170, y: 600, details: 'Pássaros atacam o quintal. Fumaça é derrotada.' },
      { id: 'snc-scene-2', label: 'Cena 2: O Treinamento', type: 'scene', x: 470, y: 600, details: 'Fumaça aprende com os macacos na floresta.' },
      { id: 'snc-scene-3', label: 'Cena 3: A Aliança', type: 'scene', x: 770, y: 600, details: 'Fumaça e Baby unem forças na sacada.' },
      { id: 'snc-scene-4', label: 'Cena 4: A Batalha', type: 'scene', x: 1070, y: 600, details: 'Confronto final nos telhados ao entardecer.' },
      { id: 'snc-plot-1', label: 'A Derrota', type: 'plot_point', x: 170, y: 180, details: 'Fumaça perde o território para os pássaros.' },
      { id: 'snc-plot-2', label: 'O Aprendizado', type: 'plot_point', x: 470, y: 180, details: 'Fumaça domina a Arte da Sombra.' },
      { id: 'snc-plot-3', label: 'A Aliança', type: 'plot_point', x: 770, y: 180, details: 'Baby e Fumaça criam o plano de ataque.' },
      { id: 'snc-plot-4', label: 'A Vitória', type: 'plot_point', x: 1070, y: 180, details: 'Fumaça derrota o Rei dos Pássaros.' },
      { id: 'snc-world-1', label: 'Pássaros Cyberpunk', type: 'world', x: 350, y: 680, details: 'Ameaça tecnológica. Modificações de aço e sensores.' },
      { id: 'snc-world-2', label: 'Modificações de Aço', type: 'world', x: 650, y: 680, details: 'Asas mecânicas, penas-lâmina, visão térmica.' },
      { id: 'snc-world-3', label: 'A Floresta Urbana', type: 'world', x: 950, y: 680, details: 'Onde a natureza e a cidade se encontram.' },
      { id: 'snc-theme-1', label: 'Tema: Coragem', type: 'theme', x: 1200, y: 280, details: 'Coragem não é ausência de medo, mas a escolha de enfrentá-lo.' },
      { id: 'snc-theme-2', label: 'Tema: União', type: 'theme', x: 1200, y: 380, details: 'Inimigas podem se tornar aliadas diante de uma ameaça maior.' }
    ],
    mindMapLinks: [
      { id: 'snc-l-act1-2', source: 'snc-act1', target: 'snc-act2' },
      { id: 'snc-l-act2-3', source: 'snc-act2', target: 'snc-act3' },
      { id: 'snc-l-act3-4', source: 'snc-act3', target: 'snc-act4' },
      { id: 'snc-l-act1-char1', source: 'snc-act1', target: 'snc-char-1' },
      { id: 'snc-l-act2-char2', source: 'snc-act2', target: 'snc-char-2' },
      { id: 'snc-l-act3-char3', source: 'snc-act3', target: 'snc-char-3' },
      { id: 'snc-l-act4-char4', source: 'snc-act4', target: 'snc-char-4' },
      { id: 'snc-l-char1-loc1', source: 'snc-char-1', target: 'snc-loc-1' },
      { id: 'snc-l-char1-loc2', source: 'snc-char-1', target: 'snc-loc-2' },
      { id: 'snc-l-char2-loc4', source: 'snc-char-2', target: 'snc-loc-4' },
      { id: 'snc-l-char3-loc3', source: 'snc-char-3', target: 'snc-loc-3' },
      { id: 'snc-l-char3-loc5', source: 'snc-char-3', target: 'snc-loc-5' },
      { id: 'snc-l-char4-loc5', source: 'snc-char-4', target: 'snc-loc-5' },
      { id: 'snc-l-char1-obj3', source: 'snc-char-1', target: 'snc-obj-3' },
      { id: 'snc-l-char3-obj1', source: 'snc-char-3', target: 'snc-obj-1' },
      { id: 'snc-l-char4-obj2', source: 'snc-char-4', target: 'snc-obj-2' },
      { id: 'snc-l-act1-scene1', source: 'snc-act1', target: 'snc-scene-1' },
      { id: 'snc-l-act2-scene2', source: 'snc-act2', target: 'snc-scene-2' },
      { id: 'snc-l-act3-scene3', source: 'snc-act3', target: 'snc-scene-3' },
      { id: 'snc-l-act4-scene4', source: 'snc-act4', target: 'snc-scene-4' },
      { id: 'snc-l-act1-plot1', source: 'snc-act1', target: 'snc-plot-1' },
      { id: 'snc-l-act2-plot2', source: 'snc-act2', target: 'snc-plot-2' },
      { id: 'snc-l-act3-plot3', source: 'snc-act3', target: 'snc-plot-3' },
      { id: 'snc-l-act4-plot4', source: 'snc-act4', target: 'snc-plot-4' },
      { id: 'snc-l-scene1-world1', source: 'snc-scene-1', target: 'snc-world-1' },
      { id: 'snc-l-scene2-world3', source: 'snc-scene-2', target: 'snc-world-3' },
      { id: 'snc-l-scene4-world2', source: 'snc-scene-4', target: 'snc-world-2' },
      { id: 'snc-l-plot1-theme1', source: 'snc-plot-1', target: 'snc-theme-1' },
      { id: 'snc-l-plot3-theme2', source: 'snc-plot-3', target: 'snc-theme-2' },
      { id: 'snc-l-char1-theme1', source: 'snc-char-1', target: 'snc-theme-1' },
      { id: 'snc-l-char3-theme2', source: 'snc-char-3', target: 'snc-theme-2' }
    ],
    recordings: [
      { id: 'snc-rec-1', title: 'Brainstorm: Smoke Ninja Cat', duration: '32:07', date: '12/07/2026', transcript: 'Sessão de brainstorming para Smoke Ninja Cat, uma história sobre uma gata branca chamada Fumaça que se torna ninja para proteger seu território de pássaros cyberpunk.\n\nEstrutura em 4 atos:\n- Ato I: A Ameaça no Quintal — pássaros cyberpunk invadem, Fumaça é derrotada\n- Ato II: Treinamento com os Macacos — Fumaça aprende a Arte da Sombra\n- Ato III: Encontro com Baby — rivalidade vira aliança\n- Ato IV: Batalha Final nos telhados\n\nPersonagens: Fumaça (protagonista determinada), Mestre Macaco (mentor sábio), Baby (aliada furtiva), Rei dos Pássaros (antagonista cruel).\n\nTom: aventura séria. Só os pássaros têm modificações cyberpunk. Fumaça vence usando instinto e treinamento — natureza sobre tecnologia.', processed: true }
    ],
    mediaUploads: [
      { id: 'snc-med-1', name: 'ConceptArt_Fumaca.jpg', date: '12/07/2026', type: 'image', url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=400&q=80', processed: true },
      { id: 'snc-med-2', name: 'Notas_Passaros_Cyberpunk.txt', date: '12/07/2026', type: 'note', url: '', content: 'Os pássaros cyberpunk têm modificações de aço: asas mecânicas com motores que zumbem, penas de aço oxidado afiadas como lâminas, olhos com sensores vermelhos (visão térmica e noturna). O Rei dos Pássaros é o maior e mais forte — sua asa direita tem um motor extra que dá mais velocidade. A fraqueza deles é a fumaça: sem visão, os sensores ficam perdidos. É por isso que as bombas de Baby são tão eficazes.', processed: true }
    ],
    ideas: [
      { id: 'snc-idea-1', title: 'A Jornada da Gata Branca', content: 'Fumaça começa como uma gata doméstica comum e se transforma em uma ninja através do treinamento com os macacos. Sua maior força não são as garras, mas a determinação.', category: 'character', tags: ['jornada', 'evolução', 'protagonista'], color: 'blue', createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000 },
      { id: 'snc-idea-2', title: 'Bombas de Fumaça como Extensão', content: 'Baby não só usa bombas de fumaça — ela as cria, modifica e aperfeiçoa. Cada bomba é única, e ela as trata como extensões do próprio corpo.', category: 'world', tags: ['gadget', 'furtividade', 'personagem'], color: 'purple', createdAt: Date.now() - 43200000, updatedAt: Date.now() - 43200000 },
      { id: 'snc-idea-3', title: 'Natureza vs Tecnologia', content: 'Os pássaros cyberpunk representam a tecnologia que oprime a natureza. Fumaça, uma gata sem modificações, vence usando apenas instinto e treinamento — natureza sobre tecnologia.', category: 'theme', tags: ['natureza', 'tecnologia', 'simbologia'], color: 'green', createdAt: Date.now() - 21600000, updatedAt: Date.now() - 21600000 },
      { id: 'snc-idea-4', title: 'Inimiga Que Vira Aliada', content: 'Baby e Fumaça começam como rivais — uma do quintal, outra da sacada. Mas ao reconhecerem a ameaça maior, unem forças. A amizade nasce do respeito conquistado em batalha.', category: 'plot', tags: ['aliada', 'rivalidade', 'amizade'], color: 'purple', createdAt: Date.now() - 10800000, updatedAt: Date.now() - 10800000 }
    ],
    brainstormData: {
      plot_points: [
        { id: 'snc-bd-plot-1', title: 'A Invasão do Quintal', description: 'Os pássaros cyberpunk atacam o quintal de Fumaça. Ela tenta defender mas é derrotada e ferida.', act: 'I', tags: ['invasão', 'derrota', 'perigo'] },
        { id: 'snc-bd-plot-2', title: 'O Treinamento na Floresta', description: 'Fumaça encontra os macacos. Mestre Macaco a treina na Arte da Sombra, navegação em árvores e ataques furtivos.', act: 'II', tags: ['treinamento', 'aprendizado', 'superação'] },
        { id: 'snc-bd-plot-3', title: 'O Encontro na Sacada', description: 'Fumaça conhece Baby na sacada. Após um confronto inicial e um ataque dos pássaros, elas formam uma aliança.', act: 'III', tags: ['encontro', 'aliança', 'rivalidade'] },
        { id: 'snc-bd-plot-4', title: 'A Batalha nos Telhados', description: 'Fumaça e Baby enfrentam o Rei dos Pássaros e seu bando nos telhados ao entardecer. Vitória com dano na asa do Rei.', act: 'IV', tags: ['clímax', 'batalha', 'vitória'] }
      ],
      scenes: [
        { id: 'snc-bd-sc-1', title: 'O Ataque no Quintal', description: 'Pássaros cyberpunk invadem o território. Fumaça é derrotada e decide buscar ajuda na floresta.', act: 'I', tags: ['ataque', 'derrota', 'decisão'] },
        { id: 'snc-bd-sc-2', title: 'O Treinamento na Floresta', description: 'Fumaça escala árvores, aprende a pisar sem barulho e domina a Arte da Sombra. Recebe o amuleto dos macacos.', act: 'II', tags: ['treinamento', 'superação', 'mentor'] },
        { id: 'snc-bd-sc-3', title: 'O Encontro na Sacada', description: 'Fumaça encontra Baby. Demonstração de habilidade com bombas de fumaça. Formação da aliança.', act: 'III', tags: ['encontro', 'aliança', 'ação'] },
        { id: 'snc-bd-sc-4', title: 'A Batalha nos Telhados', description: 'Batalha épica no entardecer. Fumaça usa a Arte da Sombra. Baby danifica a asa do Rei. Vitória e paz.', act: 'IV', tags: ['clímax', 'batalha', 'catarse'] }
      ],
      dialogues: [
        { id: 'snc-bd-dia-1', speaker: 'Fumaça', line: 'Meu território. Meu sol. Meu lar.', context: 'Fumaça observa o quintal antes do ataque.', tags: ['apego', 'lar', 'identidade'] },
        { id: 'snc-bd-dia-2', speaker: 'Rei dos Pássaros', line: 'Este território agora pertence ao bando, gata. Sua era acabou.', context: 'Os pássaros invadem o quintal.', tags: ['ameaça', 'conflito', 'invasão'] },
        { id: 'snc-bd-dia-3', speaker: 'Mestre Macaco', line: 'Seu corpo é mole. Seus olhos não sabem ver. Mas seu coração... seu coração é de guerreira.', context: 'Mestre Macaco aceita Fumaça como aprendiz.', tags: ['sabedoria', 'aceitação', 'potencial'] },
        { id: 'snc-bd-dia-4', speaker: 'Baby', line: 'Você quer seu quintal de volta? Eu quero minha sacada em paz. Acho que podemos fazer um acordo.', context: 'Baby propõe aliança a Fumaça.', tags: ['aliança', 'acordo', 'união'] },
        { id: 'snc-bd-dia-5', speaker: 'Fumaça', line: 'Brincando não. Eu sou uma ninja.', context: 'Fumaça enfrenta o Rei dos Pássaros.', tags: ['determinação', 'identidade', 'coragem'] },
        { id: 'snc-bd-dia-6', speaker: 'Fumaça', line: 'Lar é onde a luta vale a pena.', context: 'Fumaça reflete após a vitória.', tags: ['catarse', 'lar', 'propósito'] }
      ],
      world_elements: [
        { id: 'snc-bd-world-1', name: 'Pássaros Cyberpunk', type: 'threat', description: 'Pássaros com modificações de aço: asas mecânicas, penas-lâmina, visão térmica. Liderados pelo Rei dos Pássaros.', tags: ['ameaça', 'tecnologia', 'cyberpunk'] },
        { id: 'snc-bd-world-2', name: 'A Arte da Sombra', type: 'technique', description: 'Estilo de luta ensinado pelos macacos. Baseado em furtividade, movimento silencioso e ataque de onde não esperam.', tags: ['técnica', 'ninja', 'treinamento'] },
        { id: 'snc-bd-world-3', name: 'Territórios do Lar', type: 'setting', description: 'O quintal, a casa, a sacada, a floresta e os telhados formam o mapa do mundo de Fumaça. Cada lugar tem seu papel.', tags: ['cenário', 'território', 'mapa'] }
      ],
      themes: [
        { id: 'snc-bd-theme-1', statement: 'Coragem não é ausência de medo, mas a escolha de enfrentá-lo.', evidence: 'Fumaça sente medo dos pássaros, mas escolhe lutar pelo seu lar.', relevance: 'Central' },
        { id: 'snc-bd-theme-2', statement: 'A união transforma rivais em aliados — juntas somos mais fortes.', evidence: 'Baby e Fumaça começam como rivais e se tornam aliadas contra a ameaça maior.', relevance: 'Central' },
        { id: 'snc-bd-theme-3', statement: 'A natureza é mais forte que a tecnologia quando guiada pelo coração.', evidence: 'Fumaça, sem modificações, vence os pássaros cyberpunk usando instinto e treinamento.', relevance: 'Secundário' }
      ]
    }
  },
];

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('cineweave_projects');
    if (!saved) return initialProjects;
    try {
      const savedList = JSON.parse(saved);
      const mergedList = [...savedList];
      initialProjects.forEach(initP => {
        const index = mergedList.findIndex(p => p.id === initP.id);
        if (index === -1) {
          mergedList.push(initP);
        } else {
          // Preserve user changes, fill missing data from mock
          const saved = mergedList[index];
          
          // Migrate brainstormData.characters -> project.characters (old format compat)
          let savedChars = saved.characters || [];
          let savedBD = saved.brainstormData || {};
          if (!savedChars.length && savedBD.characters?.length) {
            savedChars = savedBD.characters;
          }
          // Strip characters from brainstormData (now lives in project.characters)
          if (savedBD && typeof savedBD === 'object') {
            delete savedBD.characters;
          }
          const hasBD = savedBD && Object.keys(savedBD).length > 0;
          
          mergedList[index] = {
            ...initP,       // mock fills all fields
            ...saved,       // user changes override
            // Arrays: preserve user state, only use mock if user has empty
            characters: savedChars.length > 0 ? savedChars : initP.characters,
            locations: saved.locations?.length > 0 ? saved.locations : initP.locations,
            objects: saved.objects?.length > 0 ? saved.objects : initP.objects,
            screenplay: saved.screenplay?.length > 0 ? saved.screenplay : initP.screenplay,
            recordings: saved.recordings?.length > 0 ? saved.recordings : initP.recordings,
            mediaUploads: saved.mediaUploads?.length > 0 ? saved.mediaUploads : initP.mediaUploads,
            ideas: saved.ideas?.length > 0 ? saved.ideas : initP.ideas,
            mindMapNodes: saved.mindMapNodes?.length > 0 ? saved.mindMapNodes : initP.mindMapNodes,
            mindMapLinks: saved.mindMapLinks?.length > 0 ? saved.mindMapLinks : initP.mindMapLinks,
            brainstormData: hasBD ? savedBD : initP.brainstormData || {
              plot_points: [], scenes: [], dialogues: [], world_elements: [], themes: []
            },
          };
        }
      });
      // Migration pass for user-created projects that didn't match any initialProject
      for (let i = 0; i < mergedList.length; i++) {
        const p = mergedList[i];
        if (!p.characters?.length && p.brainstormData?.characters?.length) {
          mergedList[i] = { ...p, characters: p.brainstormData.characters };
          delete mergedList[i].brainstormData.characters;
        }
      }
      return mergedList;
    } catch (e) {
      return initialProjects;
    }
  });
  
  const [currentProjectId, setCurrentProjectId] = useState(() => {
    return projects[0]?.id || '';
  });

  useEffect(() => {
    localStorage.setItem('cineweave_projects', JSON.stringify(projects));
  }, [projects]);

  const syncTimeoutRef = useRef(null);
  const syncingRef = useRef(false);

  const triggerSupabaseSync = useCallback((proj) => {
    if (!isSupabaseConfigured()) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        await syncProjectToSupabase(proj);
      } catch (err) {
        console.error('[ProjectContext] Supabase sync error:', err);
      } finally {
        syncingRef.current = false;
      }
    }, 1500);
  }, []);

  // Load from Supabase on startup if logged in
  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) return;
        const sbProjects = await loadProjectsFromSupabase();
        if (!sbProjects || sbProjects.length === 0) return;

        setProjects(prev => {
          const merged = [...prev];
          for (const sbProj of sbProjects) {
            const existingIdx = merged.findIndex(p => p.title === sbProj.title);
            if (existingIdx >= 0) {
              // Merge: prefer Supabase (source of truth), keep local id
              const local = merged[existingIdx];
              merged[existingIdx] = {
                ...local,
                ...sbProj,
                id: local.id,
                characters: sbProj.characters.length > 0 ? sbProj.characters : local.characters,
                locations: sbProj.locations.length > 0 ? sbProj.locations : local.locations,
                objects: sbProj.objects.length > 0 ? sbProj.objects : local.objects,
                screenplay: sbProj.screenplay.length > 0 ? sbProj.screenplay : local.screenplay,
                recordings: sbProj.recordings.length > 0 ? sbProj.recordings : local.recordings,
                mediaUploads: sbProj.mediaUploads.length > 0 ? sbProj.mediaUploads : local.mediaUploads,
                mindMapNodes: sbProj.mindMapNodes?.length > 0 ? sbProj.mindMapNodes : local.mindMapNodes,
                mindMapLinks: sbProj.mindMapLinks?.length > 0 ? sbProj.mindMapLinks : local.mindMapLinks,
                brainstormData: (() => {
                  const sbBD = sbProj.brainstormData;
                  const hasSB = sbBD && Object.values(sbBD).some(arr => Array.isArray(arr) && arr.length > 0);
                  return hasSB ? sbBD : (local.brainstormData || {
                    plot_points: [], scenes: [], dialogues: [], world_elements: [], themes: []
                  });
                })(),
              };
            } else {
              merged.push(sbProj);
            }
          }
          return merged;
        });
      } catch (err) {
        console.error('[ProjectContext] Failed to load from Supabase:', err);
      }
    })();
  }, []);

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  const updateProject = (updatedProj) => {
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
    triggerSupabaseSync(updatedProj);
  };

  const [lastSavedTimestamp, setLastSavedTimestamp] = useState(0);

  const autoSaveVersionIfNeeded = (proj, type = 'Roteiro') => {
    const now = Date.now();
    // 2 minutes (120000ms) cooldown for autosave to avoid bloat
    if (now - lastSavedTimestamp > 120000) {
      if (!proj.history) proj.history = [];
      const newVersion = {
        id: `v-auto-${now}`,
        timestamp: now,
        name: `Auto-save ${type} (${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`,
        screenplay: JSON.parse(JSON.stringify(proj.screenplay || [])),
        mindMapNodes: JSON.parse(JSON.stringify(proj.mindMapNodes || [])),
        mindMapLinks: JSON.parse(JSON.stringify(proj.mindMapLinks || []))
      };
      proj.history = [newVersion, ...proj.history].slice(0, 10);
      setLastSavedTimestamp(now);
    }
  };

  const saveVersion = (name = '') => {
    const proj = { ...currentProject };
    if (!proj.history) proj.history = [];
    const now = Date.now();
    const newVersion = {
      id: `v-manual-${now}`,
      timestamp: now,
      name: name || `Versão ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      screenplay: JSON.parse(JSON.stringify(proj.screenplay || [])),
      mindMapNodes: JSON.parse(JSON.stringify(proj.mindMapNodes || [])),
      mindMapLinks: JSON.parse(JSON.stringify(proj.mindMapLinks || []))
    };
    proj.history = [newVersion, ...proj.history].slice(0, 10);
    setLastSavedTimestamp(now);
    updateProject(proj);
  };

  const restoreVersion = (versionId) => {
    const proj = { ...currentProject };
    if (!proj.history) return;
    const version = proj.history.find(v => v.id === versionId);
    if (!version) return;

    // Save a backup of the current state before restoring
    const backupVersion = {
      id: `v-backup-${Date.now()}`,
      timestamp: Date.now(),
      name: `Antes de restaurar: ${version.name}`,
      screenplay: JSON.parse(JSON.stringify(proj.screenplay || [])),
      mindMapNodes: JSON.parse(JSON.stringify(proj.mindMapNodes || [])),
      mindMapLinks: JSON.parse(JSON.stringify(proj.mindMapLinks || []))
    };

    proj.screenplay = JSON.parse(JSON.stringify(version.screenplay));
    proj.mindMapNodes = JSON.parse(JSON.stringify(version.mindMapNodes));
    proj.mindMapLinks = JSON.parse(JSON.stringify(version.mindMapLinks));
    proj.history = [backupVersion, ...proj.history.filter(v => v.id !== versionId)].slice(0, 10);

    updateProject(proj);
  };

  const linkNodeToFirstAct = (proj, nodeId) => {
    const firstAct = proj.mindMapNodes.find(n => n.type === 'act');
    if (firstAct) {
      const exists = proj.mindMapLinks.some(l =>
        (l.source === firstAct.id && l.target === nodeId) ||
        (l.source === nodeId && l.target === firstAct.id)
      );
      if (!exists) {
        proj.mindMapLinks.push({
          id: `l-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          source: firstAct.id,
          target: nodeId
        });
      }
    }
  };

  const addProject = (title, tagline = '', genre = '', logline = '') => {
    const newProj = {
      id: `proj-${Date.now()}`,
      title,
      tagline,
      genre,
      logline,
      characters: [],
      locations: [],
      objects: [],
      screenplay: [
        { id: `sc-${Date.now()}-1`, type: 'scene-heading', text: 'INT. LOCAL INICIAL - DIA' },
        { id: `sc-${Date.now()}-2`, type: 'action', text: 'Descreva a ação inicial aqui.' }
      ],
      mindMapNodes: [
        { id: `n-${Date.now()}-act1`, label: 'ATO I: Introdução', type: 'act', x: 150, y: 150, details: 'Apresentação dos personagens e do conflito inicial.' },
        { id: `n-${Date.now()}-act2`, label: 'ATO II: Complicação', type: 'act', x: 400, y: 150, details: 'Obstáculos maiores e o ponto de não retorno.' },
        { id: `n-${Date.now()}-act3`, label: 'ATO III: Clímax', type: 'act', x: 650, y: 150, details: 'O confronto decisivo e a crise máxima.' },
        { id: `n-${Date.now()}-act4`, label: 'ATO IV: Resolução', type: 'act', x: 900, y: 150, details: 'O desfecho, consequências e nova realidade.' }
      ],
      mindMapLinks: [
        { id: `l-${Date.now()}-1`, source: `n-${Date.now()}-act1`, target: `n-${Date.now()}-act2` },
        { id: `l-${Date.now()}-2`, source: `n-${Date.now()}-act2`, target: `n-${Date.now()}-act3` },
        { id: `l-${Date.now()}-3`, source: `n-${Date.now()}-act3`, target: `n-${Date.now()}-act4` }
      ],
      recordings: [],
      mediaUploads: [],
      ideas: [],
      needsAutoLayout: true
    };
    setProjects(prev => [...prev, newProj]);
    setCurrentProjectId(newProj.id);
    return newProj;
  };

  const deleteProject = (id) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    setCurrentProjectId(remaining[0].id);
  };

  // Add / Edit elements in project database
  const saveCharacter = (character) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    if (character.id) {
      proj.characters = proj.characters.map(c => c.id === character.id ? character : c);
      proj.mindMapNodes = proj.mindMapNodes.map(node => {
        if (node.type === 'character' && (node.id === `n-${character.id}` || node.id === character.id)) {
          return { ...node, label: character.name, details: `${character.role}. ${character.description}` };
        }
        return node;
      });
    } else {
      const newChar = { ...character, id: `char-${Date.now()}` };
      proj.characters.push(newChar);
      proj.mindMapNodes.push({
        id: `n-${newChar.id}`,
        label: newChar.name,
        type: 'character',
        x: 300 + Math.random() * 400,
        y: 300 + Math.random() * 200,
        details: `${newChar.role}. ${newChar.description}`
      });
      linkNodeToFirstAct(proj, `n-${newChar.id}`);
    }
    updateProject(proj);
  };

  const deleteCharacter = (id) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    proj.characters = proj.characters.filter(c => c.id !== id);
    proj.mindMapNodes = proj.mindMapNodes.filter(node => node.id !== `n-${id}` && node.id !== id);
    updateProject(proj);
  };

  const saveLocation = (location) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    if (location.id) {
      proj.locations = proj.locations.map(l => l.id === location.id ? location : l);
      proj.mindMapNodes = proj.mindMapNodes.map(node => {
        if (node.type === 'location' && (node.id === `n-${location.id}` || node.id === location.id)) {
          return { ...node, label: location.name, details: `${location.type} ${location.name}. ${location.description}` };
        }
        return node;
      });
    } else {
      const newLoc = { ...location, id: `loc-${Date.now()}` };
      proj.locations.push(newLoc);
      proj.mindMapNodes.push({
        id: `n-${newLoc.id}`,
        label: newLoc.name,
        type: 'location',
        x: 300 + Math.random() * 400,
        y: 400 + Math.random() * 200,
        details: `${newLoc.type} ${newLoc.name}. ${newLoc.description}`
      });
      linkNodeToFirstAct(proj, `n-${newLoc.id}`);
    }
    updateProject(proj);
  };

  const deleteLocation = (id) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    proj.locations = proj.locations.filter(l => l.id !== id);
    proj.mindMapNodes = proj.mindMapNodes.filter(node => node.id !== `n-${id}` && node.id !== id);
    updateProject(proj);
  };

  const saveObject = (obj) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    if (obj.id) {
      proj.objects = proj.objects.map(o => o.id === obj.id ? obj : o);
      proj.mindMapNodes = proj.mindMapNodes.map(node => {
        if (node.type === 'object' && (node.id === `n-${obj.id}` || node.id === obj.id)) {
          return { ...node, label: obj.name, details: obj.significance };
        }
        return node;
      });
    } else {
      const newObj = { ...obj, id: `obj-${Date.now()}` };
      proj.objects.push(newObj);
      proj.mindMapNodes.push({
        id: `n-${newObj.id}`,
        label: newObj.name,
        type: 'object',
        x: 300 + Math.random() * 400,
        y: 350 + Math.random() * 200,
        details: newObj.significance
      });
      linkNodeToFirstAct(proj, `n-${newObj.id}`);
    }
    updateProject(proj);
  };

  const deleteObject = (id) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    proj.objects = proj.objects.filter(o => o.id !== id);
    proj.mindMapNodes = proj.mindMapNodes.filter(node => node.id !== `n-${id}` && node.id !== id);
    updateProject(proj);
  };

  // ── IDEAS ─────────────────────────────────────────────────────
  const saveIdea = (idea) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ideia');
    if (idea.id) {
      proj.ideas = proj.ideas.map(i => i.id === idea.id ? idea : i);
    } else {
      const newIdea = { ...idea, id: `idea-${Date.now()}`, createdAt: Date.now(), updatedAt: Date.now() };
      proj.ideas.unshift(newIdea);
    }
    updateProject(proj);
  };

  const deleteIdea = (id) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ideia');
    proj.ideas = proj.ideas.filter(i => i.id !== id);
    updateProject(proj);
  };

  const updateIdea = (id, updates) => {
    const proj = { ...currentProject };
    proj.ideas = proj.ideas.map(i => i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i);
    updateProject(proj);
  };

  const reorderIdeas = (ideas) => {
    const proj = { ...currentProject };
    proj.ideas = ideas;
    updateProject(proj);
  };

  const addRecording = (title, duration, transcript) => {
    const proj = { ...currentProject };
    const newRec = {
      id: `rec-${Date.now()}`,
      title,
      duration,
      date: new Date().toLocaleDateString('pt-BR'),
      transcript,
      processed: false
    };
    proj.recordings.unshift(newRec);
    updateProject(proj);
    return newRec;
  };

  const addMediaUpload = (name, type, url = '', content = '') => {
    const proj = { ...currentProject };
    const newMed = {
      id: `med-${Date.now()}`,
      name,
      date: new Date().toLocaleDateString('pt-BR'),
      type,
      url: url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80',
      content: content || '',
      processed: false
    };
    proj.mediaUploads.unshift(newMed);
    updateProject(proj);
  };

  const processBrainstorm = () => {
    const proj = { ...currentProject };
    let changed = false;

    const unprocessedRecs = proj.recordings.filter(r => !r.processed);
    const unprocessedMeds = proj.mediaUploads.filter(m => !m.processed);

    if (unprocessedRecs.length === 0 && unprocessedMeds.length === 0) return false;

    autoSaveVersionIfNeeded(proj, 'Brainstorm');

    proj.recordings = proj.recordings.map(r => ({ ...r, processed: true }));
    proj.mediaUploads = proj.mediaUploads.map(m => ({ ...m, processed: true }));

    const latestTranscript = unprocessedRecs[0]?.transcript || '';

    if (latestTranscript.toLowerCase().includes('personagem') || latestTranscript.toLowerCase().includes('vilão') || latestTranscript.toLowerCase().includes('mocinho')) {
      const newChar = {
        id: `char-mock-${Date.now()}`,
        name: 'Doutor Shinoda',
        role: 'Aliado Secreto',
        description: 'Um médico hacker renegado que realiza implantes ilegais nos esgotos da cidade.',
        traits: ['Sábio', 'Trêmulo', 'Nervoso'],
        backstory: 'Ex-cirurgião da Zenith Corporation demitido por tentar denunciar experimentos imorais.',
        avatar: 'green',
        notes: 'Extraído automaticamente da gravação de áudio.'
      };
      proj.characters.push(newChar);
      proj.mindMapNodes.push({
        id: `n-${newChar.id}`,
        label: newChar.name,
        type: 'character',
        x: 450,
        y: 400,
        details: `${newChar.role}. ${newChar.description}`
      });
      linkNodeToFirstAct(proj, `n-${newChar.id}`);
      changed = true;
    } else if (latestTranscript.toLowerCase().includes('cenário') || latestTranscript.toLowerCase().includes('lugar') || latestTranscript.toLowerCase().includes('cidade')) {
      const newLoc = {
        id: `loc-mock-${Date.now()}`,
        name: 'O Mercado das Sombras',
        type: 'EXT.',
        description: 'Um mercado caótico sob a ponte do viaduto do chá, com barracas brilhando em holografia roxa e verde vendendo hardware obsoleto.',
        timeOfDay: 'NOITE',
        mood: 'Caótico, Perigoso, Luminoso'
      };
      proj.locations.push(newLoc);
      proj.mindMapNodes.push({
        id: `n-${newLoc.id}`,
        label: newLoc.name,
        type: 'location',
        x: 650,
        y: 420,
        details: `EXT. ${newLoc.name}. ${newLoc.description}`
      });
      linkNodeToFirstAct(proj, `n-${newLoc.id}`);
      changed = true;
    } else {
      const newSceneId = `sc-mock-${Date.now()}`;
      const title = 'INT. MERCADO DAS SOMBRAS - NOITE';
      proj.screenplay.push(
        { id: `${newSceneId}-1`, type: 'scene-heading', text: title },
        { id: `${newSceneId}-2`, type: 'action', text: 'Max entra no mercado úmido. A chuva passa pelas grelhas do viaduto superior. As barracas vendem chips biológicos piscando em luz violeta.' },
        { id: `${newSceneId}-3`, type: 'character', text: 'MAX' },
        { id: `${newSceneId}-4`, type: 'dialogue', text: 'Alguém aqui tem que saber onde fica o laboratório secundário da Dra. Vance.' }
      );
      proj.mindMapNodes.push({
        id: `n-${newSceneId}`,
        label: 'Cena: Mercado das Sombras',
        type: 'scene',
        x: 650,
        y: 250,
        details: 'Max busca pistas no Mercado das Sombras.'
      });
      
      const act2 = proj.mindMapNodes.find(n => n.id.includes('act2') || n.id === 'n-act2');
      if (act2) {
        proj.mindMapLinks.push({
          id: `l-mock-${Date.now()}`,
          source: act2.id,
          target: `n-${newSceneId}`
        });
      }
      changed = true;
    }

    if (changed) {
      proj.needsAutoLayout = true;
    }

    updateProject(proj);
    return changed;
  };

  const markRecordingsProcessed = () => {
    const proj = { ...currentProject };
    proj.recordings = proj.recordings.map(r => ({ ...r, processed: true }));
    updateProject(proj);
  };

  const processLLMToProject = (llmData, recordingTitle, recordingTranscript) => {
    // llmData can be either old format (characters, locations, objects, scenes) 
    // or new format (characters, plot_points, scenes, dialogues, world_elements, themes)
    // We MERGE with existing project data instead of replacing

    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Extração IA');

    // 1. Handle ACTS - preserve existing, add new from scenes
    let actNodes = proj.mindMapNodes.filter(n => n.type === 'act');
    const llmActs = new Set();
    
    const scenesSource = llmData.scenes || llmData.plot_points || [];
    if (Array.isArray(scenesSource)) {
      scenesSource.forEach(scene => {
        if (scene.act && typeof scene.act === 'string') {
          const uAct = scene.act.trim().toUpperCase();
          if (uAct) llmActs.add(uAct);
        }
      });
    }

    const romanToInt = (roman) => {
      const uRoman = (roman || '').trim().toUpperCase();
      const map = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
      return map[uRoman] || 99;
    };

    const sortedActs = Array.from(llmActs).sort((a, b) => romanToInt(a) - romanToInt(b));
    
    sortedActs.forEach((actStr, index) => {
      const exists = actNodes.some(n => n.label.toUpperCase().includes(actStr));
      if (!exists) {
        actNodes.push({
          id: `n-${Date.now()}-act${actStr.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          label: `ATO ${actStr.toUpperCase()}`,
          type: 'act',
          x: 150 + index * 250,
          y: 150,
          details: `Estrutura do Ato ${actStr.toUpperCase()}`
        });
      }
    });

    actNodes = actNodes.map((act, index) => ({
      ...act,
      x: 150 + index * 250,
      y: 150
    }));

    proj.mindMapNodes = proj.mindMapNodes.filter(n => n.type !== 'act');
    proj.mindMapNodes.push(...actNodes);

    for (let index = 0; index < actNodes.length - 1; index++) {
      proj.mindMapLinks.push({
        id: `l-act-seq-${Date.now()}-${index}`,
        source: actNodes[index].id,
        target: actNodes[index + 1].id
      });
    }

    // 2. MERGE CHARACTERS (by name)
    const newCharacters = (llmData.characters || []).map(char => ({
      name: char.name || '',
      role: char.role || 'Coadjuvante',
      description: char.description || '',
      traits: Array.isArray(char.traits) ? char.traits : [],
      backstory: char.backstory || '',
      avatar: ['amber','green','blue','purple','red','pink'][Math.floor(Math.random() * 6)],
      notes: ''
    })).filter(c => c.name);

    newCharacters.forEach(newChar => {
      const existingIdx = proj.characters.findIndex(c => c.name.toLowerCase() === newChar.name.toLowerCase());
      if (existingIdx >= 0) {
        // Merge: update existing with new info (preserve user edits in notes/avatar)
        proj.characters[existingIdx] = {
          ...proj.characters[existingIdx],
          role: newChar.role,
          description: newChar.description || proj.characters[existingIdx].description,
          traits: [...new Set([...(proj.characters[existingIdx].traits || []), ...newChar.traits])],
          backstory: newChar.backstory || proj.characters[existingIdx].backstory,
        };
        // Update mindMap node
        const nodeIdx = proj.mindMapNodes.findIndex(n => n.id === `n-${proj.characters[existingIdx].id}`);
        if (nodeIdx >= 0) {
          proj.mindMapNodes[nodeIdx] = {
            ...proj.mindMapNodes[nodeIdx],
            label: proj.characters[existingIdx].name,
            details: `${proj.characters[existingIdx].role}. ${proj.characters[existingIdx].description}`
          };
        }
      } else {
        // Create new
        const id = `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const fullChar = { ...newChar, id };
        proj.characters.push(fullChar);
        proj.mindMapNodes.push({
          id: `n-${id}`,
          label: fullChar.name,
          type: 'character',
          x: 300 + Math.random() * 400,
          y: 300 + Math.random() * 200,
          details: `${fullChar.role}. ${fullChar.description}`
        });
        linkNodeToFirstAct(proj, `n-${id}`);
      }
    });

    // 3. MERGE LOCATIONS (from world_elements type=location or old locations)
    const locationSources = [
      ...(llmData.world_elements || []).filter(w => w.type === 'location'),
      ...(llmData.locations || [])
    ];

    locationSources.forEach(loc => {
      const newLoc = {
        name: loc.name || '',
        type: loc.type || 'INT.',
        description: loc.description || '',
        timeOfDay: loc.timeOfDay || 'DIA',
        mood: loc.mood || ''
      };
      if (!newLoc.name) return;

      const existingIdx = proj.locations.findIndex(l => 
        l.name.toLowerCase() === newLoc.name.toLowerCase() && l.type === newLoc.type
      );
      if (existingIdx >= 0) {
        proj.locations[existingIdx] = { ...proj.locations[existingIdx], ...newLoc };
        const nodeIdx = proj.mindMapNodes.findIndex(n => n.id === `n-${proj.locations[existingIdx].id}`);
        if (nodeIdx >= 0) {
          proj.mindMapNodes[nodeIdx] = {
            ...proj.mindMapNodes[nodeIdx],
            label: proj.locations[existingIdx].name,
            details: `${proj.locations[existingIdx].type} ${proj.locations[existingIdx].name}. ${proj.locations[existingIdx].description}`
          };
        }
      } else {
        const id = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const fullLoc = { ...newLoc, id };
        proj.locations.push(fullLoc);
        proj.mindMapNodes.push({
          id: `n-${id}`,
          label: fullLoc.name,
          type: 'location',
          x: 300 + Math.random() * 400,
          y: 300 + Math.random() * 200,
          details: `${fullLoc.type} ${fullLoc.name}. ${fullLoc.description}`
        });
        linkNodeToFirstAct(proj, `n-${id}`);
      }
    });

    // 4. MERGE OBJECTS (from world_elements type=object/technology or old objects)
    const objectSources = [
      ...(llmData.world_elements || []).filter(w => ['object', 'technology', 'organization'].includes(w.type)),
      ...(llmData.objects || [])
    ];

    objectSources.forEach(obj => {
      const newObj = {
        name: obj.name || '',
        description: obj.description || '',
        significance: obj.significance || ''
      };
      if (!newObj.name) return;

      const existingIdx = proj.objects.findIndex(o => o.name.toLowerCase() === newObj.name.toLowerCase());
      if (existingIdx >= 0) {
        proj.objects[existingIdx] = { ...proj.objects[existingIdx], ...newObj };
        const nodeIdx = proj.mindMapNodes.findIndex(n => n.id === `n-${proj.objects[existingIdx].id}`);
        if (nodeIdx >= 0) {
          proj.mindMapNodes[nodeIdx] = {
            ...proj.mindMapNodes[nodeIdx],
            label: proj.objects[existingIdx].name,
            details: proj.objects[existingIdx].significance
          };
        }
      } else {
        const id = `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const fullObj = { ...newObj, id };
        proj.objects.push(fullObj);
        proj.mindMapNodes.push({
          id: `n-${id}`,
          label: fullObj.name,
          type: 'object',
          x: 300 + Math.random() * 400,
          y: 300 + Math.random() * 200,
          details: fullObj.significance
        });
        linkNodeToFirstAct(proj, `n-${id}`);
      }
    });

    // 5. APPEND SCENES to screenplay (dedup by scene-heading text)
    const newScenes = (llmData.scenes || []).filter(s => s.title || (s.elements && s.elements.length));
    let screenplayIdCounter = proj.screenplay.length;
    
    newScenes.forEach(scene => {
      const sceneHeadingText = scene.title || `CENA ${screenplayIdCounter + 1}`;
      const existsInScreenplay = proj.screenplay.some(s => 
        s.type === 'scene-heading' && s.text.trim().toUpperCase() === sceneHeadingText.trim().toUpperCase()
      );
      
      if (!existsInScreenplay) {
        if (scene.elements && Array.isArray(scene.elements)) {
          scene.elements.forEach(el => {
            proj.screenplay.push({
              id: `sc-el-${Date.now()}-${screenplayIdCounter++}`,
              type: el.type || 'action',
              text: el.text || ''
            });
          });
        } else {
          proj.screenplay.push(
            { id: `sc-el-${Date.now()}-${screenplayIdCounter++}`, type: 'scene-heading', text: sceneHeadingText },
            { id: `sc-el-${Date.now()}-${screenplayIdCounter++}`, type: 'action', text: scene.description || '' }
          );
        }
      }

      // Add scene node to mindmap
      const sceneId = `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const actLetter = (scene.act || 'I').trim().toUpperCase();
      const actIdx = actNodes.findIndex(n => n.label.toUpperCase().includes(`ATO ${actLetter}`));
      const colX = 150 + (actIdx >= 0 ? actIdx : 0) * 250;
      const sceneCount = proj.mindMapNodes.filter(n => n.type === 'scene').length;
      const rowY = 520 + sceneCount * 120;

      proj.mindMapNodes.push({
        id: `n-${sceneId}`,
        label: scene.title || `Cena ${sceneCount + 1}`,
        type: 'scene',
        x: colX + Math.random() * 20,
        y: rowY,
        details: scene.description || ''
      });

      const targetAct = proj.mindMapNodes.find(n => n.type === 'act' && n.label.toUpperCase().includes(`ATO ${actLetter}`));
      if (targetAct) {
        proj.mindMapLinks.push({
          id: `l-scene-${sceneId}`,
          source: targetAct.id,
          target: `n-${sceneId}`
        });
      }
    });

    // 6. WORLD ELEMENTS (non-location, non-object) - add as generic nodes
    const otherWorldElements = (llmData.world_elements || []).filter(w => 
      !['location', 'object', 'technology', 'organization'].includes(w.type)
    );
    otherWorldElements.forEach(w => {
      if (!w.name) return;
      const id = `world-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const full = { ...w, id };
      // Add to a general worldElements array if it exists, or store in project
      if (!proj.worldElements) proj.worldElements = [];
      proj.worldElements.push(full);
      proj.mindMapNodes.push({
        id: `n-${id}`,
        label: full.name,
        type: 'world',
        x: 300 + Math.random() * 400,
        y: 300 + Math.random() * 200,
        details: `${full.type}: ${full.description}`
      });
      linkNodeToFirstAct(proj, `n-${id}`);
    });

    // 7. PLOT POINTS - add as act-level nodes or connect to acts
    (llmData.plot_points || []).forEach((pp, i) => {
      if (!pp.title) return;
      const id = `plot-${Date.now()}-${i}`;
      const actLetter = (pp.act || 'I').trim().toUpperCase();
      const actIdx = actNodes.findIndex(n => n.label.toUpperCase().includes(`ATO ${actLetter}`));
      const colX = 150 + (actIdx >= 0 ? actIdx : 0) * 250;
      const rowY = 300 + i * 100;
      
      proj.mindMapNodes.push({
        id: `n-${id}`,
        label: pp.title,
        type: 'plot_point',
        x: colX,
        y: rowY,
        details: pp.description || ''
      });

      const targetAct = proj.mindMapNodes.find(n => n.type === 'act' && n.label.toUpperCase().includes(`ATO ${actLetter}`));
      if (targetAct) {
        proj.mindMapLinks.push({
          id: `l-plot-${id}`,
          source: targetAct.id,
          target: `n-${id}`
        });
      }
    });

    // 8. THEMES - add as special nodes
    (llmData.themes || []).forEach((t, i) => {
      if (!t.statement) return;
      const id = `theme-${Date.now()}-${i}`;
      proj.mindMapNodes.push({
        id: `n-${id}`,
        label: `Tema: ${t.statement.substring(0, 50)}${t.statement.length > 50 ? '...' : ''}`,
        type: 'theme',
        x: 800 + Math.random() * 200,
        y: 150 + i * 80,
        details: `${t.statement}\nEvidência: ${t.evidence}\nRelevância: ${t.relevance}`
      });
      linkNodeToFirstAct(proj, `n-${id}`);
    });

    // 9. Mark recordings/uploads as processed
    proj.recordings = proj.recordings.map(r => ({ ...r, processed: true }));
    proj.mediaUploads = proj.mediaUploads.map(m => ({ ...m, processed: true }));

    // Save brainstormData for BrainstormTab extracted items (characters read from project.characters)
    proj.brainstormData = {
      plot_points: llmData.plot_points || [],
      scenes: llmData.scenes || [],
      dialogues: llmData.dialogues || [],
      world_elements: llmData.world_elements || [],
      themes: llmData.themes || [],
    };

    // 10. Rebuild semantic links (character-location, character-object, object-location)
    rebuildSemanticLinks(proj);

    updateProject(proj);
    return { 
      characters: newCharacters.length, 
      locations: locationSources.length, 
      objects: objectSources.length, 
      scenes: newScenes.length 
    };
  };

  const rebuildSemanticLinks = (proj) => {
    // Clear existing relationship links
    proj.mindMapLinks = proj.mindMapLinks.filter(l => l.type !== 'relationship');

    const mentions = (text, name) => {
      if (!text || !name) return false;
      const cleanText = text.toLowerCase();
      const cleanName = name.toLowerCase();
      return cleanName.length > 2 && cleanText.includes(cleanName);
    };

    const nodeAttractions = {};

    // Character <-> Location
    proj.characters.forEach(char => {
      proj.locations.forEach(loc => {
        const charMentionLoc = mentions(char.description, loc.name) || mentions(char.backstory, loc.name);
        const locMentionChar = mentions(loc.description, char.name);
        if (charMentionLoc || locMentionChar) {
          const charNodeId = `n-${char.id}`;
          const locNodeId = `n-${loc.id}`;
          proj.mindMapLinks.push({
            id: `l-rel-char-loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            source: charNodeId,
            target: locNodeId,
            type: 'relationship'
          });
          nodeAttractions[charNodeId] = locNodeId;
        }
      });
    });

    // Character <-> Object
    proj.characters.forEach(char => {
      proj.objects.forEach(obj => {
        const charMentionObj = mentions(char.description, obj.name) || mentions(char.backstory, obj.name);
        const objMentionChar = mentions(obj.description, char.name) || mentions(obj.significance, char.name);
        if (charMentionObj || objMentionChar) {
          const charNodeId = `n-${char.id}`;
          const objNodeId = `n-${obj.id}`;
          proj.mindMapLinks.push({
            id: `l-rel-char-obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            source: charNodeId,
            target: objNodeId,
            type: 'relationship'
          });
          if (!nodeAttractions[objNodeId]) nodeAttractions[objNodeId] = charNodeId;
        }
      });
    });

    // Object <-> Location
    proj.locations.forEach(loc => {
      proj.objects.forEach(obj => {
        const locMentionObj = mentions(loc.description, obj.name);
        const objMentionLoc = mentions(obj.description, loc.name) || mentions(obj.significance, loc.name);
        if (locMentionObj || objMentionLoc) {
          const locNodeId = `n-${loc.id}`;
          const objNodeId = `n-${obj.id}`;
          proj.mindMapLinks.push({
            id: `l-rel-loc-obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            source: locNodeId,
            target: objNodeId,
            type: 'relationship'
          });
          if (!nodeAttractions[objNodeId]) nodeAttractions[objNodeId] = locNodeId;
        }
      });
    });

    // Reposition nodes based on attractions
    proj.mindMapNodes = proj.mindMapNodes.map(node => {
      const targetId = nodeAttractions[node.id];
      if (targetId) {
        const targetNode = proj.mindMapNodes.find(n => n.id === targetId);
        if (targetNode) {
          const angle = node.type === 'object' ? Math.PI / 3 : -Math.PI / 3;
          return {
            ...node,
            x: Math.round(targetNode.x + Math.cos(angle) * 120),
            y: Math.round(targetNode.y + Math.sin(angle) * 120)
          };
        }
      }
      return node;
    });
  };

  const updateScreenplay = (newScreenplay) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Roteiro');
    proj.screenplay = newScreenplay;
    updateProject(proj);
  };

  const updateMindMap = (nodes, links) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Mapa');
    proj.mindMapNodes = nodes;
    proj.mindMapLinks = links;
    updateProject(proj);
  };

  // Cross-tab navigation
  const [tabNavigation, setTabNavigation] = useState(null);
  const navigateTo = useCallback((tab, targetId) => {
    setTabNavigation({ tab, targetId });
  }, []);

  // Auto-clear navigation after it's been consumed
  useEffect(() => {
    if (tabNavigation) {
      const t = setTimeout(() => setTabNavigation(null), 3000);
      return () => clearTimeout(t);
    }
  }, [tabNavigation]);

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      currentProjectId,
      setCurrentProjectId,
      updateProject,
      addProject,
      deleteProject,
      saveCharacter,
      deleteCharacter,
      saveLocation,
      deleteLocation,
      saveObject,
      deleteObject,
      saveIdea,
      deleteIdea,
      updateIdea,
      reorderIdeas,
      addRecording,
      addMediaUpload,
      processBrainstorm,
      processLLMToProject,
      markRecordingsProcessed,
      updateScreenplay,
      updateMindMap,
      tabNavigation,
      navigateTo
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
