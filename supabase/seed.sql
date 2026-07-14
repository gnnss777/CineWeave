-- CineWeave - Seed data (São Paulo 2089 demo project)
-- Run AFTER creating the schema via migration.sql

-- Note: Replace '00000000-0000-0000-0000-000000000000' with your actual user UUID
-- after creating a user via Supabase Auth.

DO $$
DECLARE
  uid UUID := '00000000-0000-0000-0000-000000000000'; -- ← SUBSTITUA pelo seu user ID
  pid UUID;
  cid1 UUID; cid2 UUID; cid3 UUID;
  lid1 UUID; lid2 UUID; lid3 UUID;
  oid1 UUID; oid2 UUID;
  nid1 UUID; nid2 UUID; nid3 UUID;
  nid4 UUID; nid5 UUID; nid6 UUID;
  nid7 UUID; nid8 UUID; nid9 UUID;
BEGIN

  -- Project
  INSERT INTO public.projects (id, user_id, title, tagline, genre, logline)
  VALUES (uuid_generate_v4(), uid, 'São Paulo 2089', 'Memórias sintéticas e segredos orgânicos nas ruínas do Copan.', 'Cyberpunk Noir / Suspense', 'Um detetive cibernético com falha de memória investiga o assassinato de uma cientista que descobriu como clonar lembranças, apenas para descobrir que a vítima era sua própria criadora e ele é o clone.')
  RETURNING id INTO pid;

  -- Characters
  INSERT INTO public.characters (id, project_id, user_id, name, role, description, traits, backstory, avatar, notes)
  VALUES
    (uuid_generate_v4(), pid, uid, 'Detetive Max Santos', 'Protagonista', 'Ex-policial cansado, com um braço biônico e memória fragmentada devido a um implante defeituoso.', '["Melancólico","Perspicaz","Obcecado","Cínico"]', 'Perdeu sua esposa há 5 anos e teve sua memória apagada pela Corporação Zenith. Desde então, trabalha como investigador particular nos níveis inferiores.', 'amber', 'Tem o hábito de fumar cigarros virtuais e vive tendo flashes de memórias que não parecem ser dele.')
  RETURNING id INTO cid1;

  INSERT INTO public.characters (id, project_id, user_id, name, role, description, traits, backstory, avatar, notes)
  VALUES
    (uuid_generate_v4(), pid, uid, 'Dra. Elisa Vance', 'Vítima / Cientista', 'Neurocientista brilhante da Zenith Corporation que desenvolveu a tecnologia de clonagem de memória pura.', '["Brilhante","Idealista","Secreta"]', 'Trabalhava no laboratório ultrassecreto da Zenith, mas começou a repassar segredos para a resistência urbana antes de ser silenciada.', 'purple', 'Criou Max para ser o repositório de sua maior descoberta caso ela morresse.')
  RETURNING id INTO cid2;

  INSERT INTO public.characters (id, project_id, user_id, name, role, description, traits, backstory, avatar, notes)
  VALUES
    (uuid_generate_v4(), pid, uid, 'Kaelen (O Agente)', 'Antagonista', 'Assassino corporativo implacável, equipado com camuflagem ótica ativa e modificações de combate de elite.', '["Frio","Metódico","Fiel à corporação"]', 'Braço direito do CEO da Zenith Corporation, encarregado de apagar qualquer rastro do Projeto Mnemosyne.', 'red', 'Usa uma máscara espelhada que reflete a luz dourada do neon da cidade.')
  RETURNING id INTO cid3;

  -- Locations
  INSERT INTO public.locations (id, project_id, user_id, name, type, description, time_of_day, mood)
  VALUES
    (uuid_generate_v4(), pid, uid, 'Escritório do Max', 'INT.', 'Um cubículo escuro acima de um mercado de macarrão no Nível 3. Ventilador de teto girando devagar, luzes de neon piscando do lado de fora da janela chuvosa.', 'NOITE', 'Gloom, Melancolia, fumaça virtual')
  RETURNING id INTO lid1;

  INSERT INTO public.locations (id, project_id, user_id, name, type, description, time_of_day, mood)
  VALUES
    (uuid_generate_v4(), pid, uid, 'Laboratório Zenith Corp', 'INT.', 'Sala estéril e futurista de vidro e cromo. Um casulo biológico de clonagem no centro, fios ópticos vermelhos pendurados como veias.', 'NOITE', 'Clínico, Assustador, Tecnológico')
  RETURNING id INTO lid2;

  INSERT INTO public.locations (id, project_id, user_id, name, type, description, time_of_day, mood)
  VALUES
    (uuid_generate_v4(), pid, uid, 'Terraço do Edifício Copan', 'EXT.', 'Vista deslumbrante de São Paulo coberta por painéis holográficos e chuva ácida. Luzes vermelhas de tráfego voador refletem nas poças de água.', 'NOITE', 'Épico, Melancólico, Chuvoso')
  RETURNING id INTO lid3;

  -- Objects
  INSERT INTO public.objects (id, project_id, user_id, name, significance, description)
  VALUES
    (uuid_generate_v4(), pid, uid, 'O Gravador de Almas (Mnemosyne V4)', 'O dispositivo que armazena a memória original da Dra. Elisa Vance.', 'Um cilindro prateado metálico de 10cm com runas de fibra óptica azul que brilham quando ativo.')
  RETURNING id INTO oid1;

  INSERT INTO public.objects (id, project_id, user_id, name, significance, description)
  VALUES
    (uuid_generate_v4(), pid, uid, 'Cigarro Virtual Holográfico', 'O vício de Max que o ajuda a focar e projetar hologramas de pistas.', 'Um pequeno cilindro fosco que emite um brilho âmbar e projeta fumaça tridimensional fria.')
  RETURNING id INTO oid2;

  -- Screenplay
  INSERT INTO public.screenplay_elements (project_id, user_id, sort_order, element_type, text) VALUES
    (pid, uid, 0, 'scene-heading', 'INT. ESCRITÓRIO DO MAX - NOITE'),
    (pid, uid, 1, 'action', 'A chuva ácida bate forte contra a janela suja. Lá fora, um holograma gigante de uma gueixa pisca em tons de azul e dourado.'),
    (pid, uid, 2, 'action', 'DETETIVE MAX SANTOS está sentado atrás de sua mesa de metal. Ele dá uma tragada em seu cigarro virtual. A fumaça azulada brilha no escuro.'),
    (pid, uid, 3, 'action', 'Max olha para um pequeno CILINDRO PRATEADO (Mnemosyne V4) sobre a mesa. Ele hesita, com o braço mecânico estendido.'),
    (pid, uid, 4, 'character', 'MAX'),
    (pid, uid, 5, 'parenthetical', '(para si mesmo)'),
    (pid, uid, 6, 'dialogue', 'Eu lembro do cheiro de café dela. Do som do riso. Mas por que não lembro de mim mesmo?'),
    (pid, uid, 7, 'action', 'A porta do escritório abre com um rangido eletrônico seco.'),
    (pid, uid, 8, 'action', 'KAELEN entra. Sua máscara espelhada brilha refletindo o neon âmbar.'),
    (pid, uid, 9, 'character', 'KAELEN'),
    (pid, uid, 10, 'dialogue', 'Porque você não passa de um backup de dados, Detetive. E meu trabalho é deletar este arquivo.'),
    (pid, uid, 11, 'scene-heading', 'EXT. TERRAÇO DO EDIFÍCIO COPAN - NOITE'),
    (pid, uid, 12, 'action', 'A tempestade ruge. Max corre pela borda do terraço, seu casaco preto ensopado. Ele está sangrando óleo sintético azulado do braço cibernético.'),
    (pid, uid, 13, 'action', 'Kaelen caminha lentamente sob a chuva, empunhando uma pistola de pulso energético.');

  -- Mind Map Nodes
  INSERT INTO public.mind_map_nodes (id, project_id, user_id, label, node_type, x, y, details)
  VALUES
    (uuid_generate_v4(), pid, uid, 'ATO I: O Backup', 'act', 200, 150, 'Max investiga o assassinato da Dra. Vance e encontra o Gravador de Almas. Ele percebe que Kaelen está caçando ele.')
  RETURNING id INTO nid1;

  INSERT INTO public.mind_map_nodes (id, project_id, user_id, label, node_type, x, y, details)
  VALUES
    (uuid_generate_v4(), pid, uid, 'ATO II: A Revelação', 'act', 500, 150, 'Max descobre que a Zenith Corporation está clonando cientistas. Ele descobre que suas memórias foram retiradas da própria Dra. Vance.')
  RETURNING id INTO nid2;

  INSERT INTO public.mind_map_nodes (id, project_id, user_id, label, node_type, x, y, details)
  VALUES
    (uuid_generate_v4(), pid, uid, 'ATO III: O Reboot', 'act', 800, 150, 'Confronto final no terraço do Copan. Max decide fazer o upload das memórias originais da Dra. Vance para a rede municipal.')
  RETURNING id INTO nid3;

  INSERT INTO public.mind_map_nodes (project_id, user_id, label, node_type, x, y, details)
  VALUES (pid, uid, 'Max Santos', 'character', 200, 350, 'Detetive com braço cibernético e memória deletada.')
  RETURNING id INTO nid4;

  INSERT INTO public.mind_map_nodes (project_id, user_id, label, node_type, x, y, details)
  VALUES (pid, uid, 'Dra. Elisa Vance', 'character', 500, 350, 'Criadora de Max e desenvolvedora do Mnemosyne.')
  RETURNING id INTO nid5;

  INSERT INTO public.mind_map_nodes (project_id, user_id, label, node_type, x, y, details)
  VALUES (pid, uid, 'Kaelen (Assassino)', 'character', 800, 350, 'Assassino que tenta apagar Max.')
  RETURNING id INTO nid6;

  INSERT INTO public.mind_map_nodes (project_id, user_id, label, node_type, x, y, details)
  VALUES (pid, uid, 'Escritório Nível 3', 'location', 200, 500, 'Cenário inicial. Neon e decadência.')
  RETURNING id INTO nid7;

  INSERT INTO public.mind_map_nodes (project_id, user_id, label, node_type, x, y, details)
  VALUES (pid, uid, 'Laboratório Zenith', 'location', 500, 500, 'Onde Max foi criado/clonado.')
  RETURNING id INTO nid8;

  INSERT INTO public.mind_map_nodes (project_id, user_id, label, node_type, x, y, details)
  VALUES (pid, uid, 'Terraço do Copan', 'location', 800, 500, 'Clímax da história na chuva ácida.');

  INSERT INTO public.mind_map_nodes (project_id, user_id, label, node_type, x, y, details)
  VALUES (pid, uid, 'Mnemosyne V4', 'object', 350, 425, 'Cilindro com a mente de Vance.');

  -- Mind Map Links
  INSERT INTO public.mind_map_links (project_id, user_id, source_node_id, target_node_id) VALUES
    (pid, uid, nid1, nid2),
    (pid, uid, nid2, nid3),
    (pid, uid, nid1, nid4),
    (pid, uid, nid2, nid5),
    (pid, uid, nid3, nid6),
    (pid, uid, nid4, nid7),
    (pid, uid, nid5, nid8),
    (pid, uid, nid6, (SELECT id FROM public.mind_map_nodes WHERE project_id = pid AND label = 'Terraço do Copan' LIMIT 1));

END $$;
