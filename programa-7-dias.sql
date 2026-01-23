-- Programa: 7 Dias de Barriga Tanquinho
-- Execute este SQL no Supabase SQL Editor

-- 1. Inserir exercícios específicos (se não existirem)
INSERT INTO exercicios (id, nome, descricao, grupo_muscular, equipamento, dificuldade, is_publico) VALUES
('core-001', 'Prancha Isométrica Pro', 'Exercício isométrico para fortalecer todo o core', ARRAY['core', 'ombros'], 'peso corporal', 'iniciante', true),
('core-002', 'Bicycle Crunch Pro', 'Movimento alternado que trabalha oblíquos', ARRAY['core', 'oblíquos'], 'peso corporal', 'intermediario', true),
('core-003', 'Mountain Climbers Pro', 'Exercício dinâmico que combina core e cardio', ARRAY['core', 'cardio'], 'peso corporal', 'intermediario', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir treinos para cada dia
INSERT INTO treinos (id, nome, descricao, objetivo, duracao_estimada, nivel, is_publico, tags) VALUES
('treino-dia1', 'Dia 1 - Ativação Core', 'Ativação suave do core', 'Ativação', 15, 'iniciante', true, ARRAY['core', 'barriga tanquinho', '7 dias']),
('treino-dia2', 'Dia 2 - Core Básico', 'Fortalecimento básico', 'Fortalecimento', 20, 'iniciante', true, ARRAY['core', 'barriga tanquinho', '7 dias']),
('treino-dia3', 'Dia 3 - Cardio Core', 'Treino cardiovascular com core', 'Queima', 25, 'intermediario', true, ARRAY['core', 'barriga tanquinho', '7 dias']),
('treino-dia4', 'Dia 4 - Resistência', 'Treino de resistência', 'Resistência', 20, 'intermediario', true, ARRAY['core', 'barriga tanquinho', '7 dias']),
('treino-dia5', 'Dia 5 - Core Intenso', 'Intensificação do treino', 'Intensificação', 30, 'intermediario', true, ARRAY['core', 'barriga tanquinho', '7 dias']),
('treino-dia6', 'Dia 6 - Definição', 'Foco na definição muscular', 'Definição', 25, 'avancado', true, ARRAY['core', 'barriga tanquinho', '7 dias']),
('treino-dia7', 'Dia 7 - Finalização', 'Consolidação do programa', 'Consolidação', 20, 'avancado', true, ARRAY['core', 'barriga tanquinho', '7 dias'])
ON CONFLICT (id) DO NOTHING;

-- 3. Adicionar exercícios aos treinos
-- Dia 1 - Suave
INSERT INTO treino_exercicios (treino_id, exercicio_id, ordem, series, repeticoes, tempo_descanso, observacoes) VALUES
('treino-dia1', 'core-001', 1, 2, '20-30s', '45s', 'Foque na postura correta'),
('treino-dia1', 'core-002', 2, 2, '10-15', '45s', 'Movimento controlado'),
('treino-dia1', 'core-003', 3, 2, '15-20', '60s', 'Ritmo moderado')
ON CONFLICT DO NOTHING;

-- Dia 2 - Básico  
INSERT INTO treino_exercicios (treino_id, exercicio_id, ordem, series, repeticoes, tempo_descanso, observacoes) VALUES
('treino-dia2', 'core-001', 1, 3, '30-45s', '45s', 'Aumente o tempo'),
('treino-dia2', 'core-002', 2, 3, '15-20', '45s', 'Mais repetições'),
('treino-dia2', 'core-003', 3, 3, '20-25', '60s', 'Mantenha o ritmo')
ON CONFLICT DO NOTHING;

-- Dia 3 - Cardio
INSERT INTO treino_exercicios (treino_id, exercicio_id, ordem, series, repeticoes, tempo_descanso, observacoes) VALUES
('treino-dia3', 'core-001', 1, 3, '45-60s', '30s', 'Tempo reduzido de descanso'),
('treino-dia3', 'core-002', 2, 4, '20-25', '30s', 'Ritmo mais acelerado'),
('treino-dia3', 'core-003', 3, 4, '25-30', '45s', 'Intensidade alta')
ON CONFLICT DO NOTHING;

-- Dia 4 - Resistência
INSERT INTO treino_exercicios (treino_id, exercicio_id, ordem, series, repeticoes, tempo_descanso, observacoes) VALUES
('treino-dia4', 'core-001', 1, 3, '45s', '45s', 'Foque na resistência'),
('treino-dia4', 'core-002', 2, 3, '20', '45s', 'Movimento preciso'),
('treino-dia4', 'core-003', 3, 3, '25', '60s', 'Mantenha a forma')
ON CONFLICT DO NOTHING;

-- Dia 5 - Intenso
INSERT INTO treino_exercicios (treino_id, exercicio_id, ordem, series, repeticoes, tempo_descanso, observacoes) VALUES
('treino-dia5', 'core-001', 1, 4, '60-90s', '30s', 'Máxima intensidade'),
('treino-dia5', 'core-002', 2, 4, '25-30', '30s', 'Sem parar entre reps'),
('treino-dia5', 'core-003', 3, 4, '30-35', '45s', 'Push yourself!')
ON CONFLICT DO NOTHING;

-- Dia 6 - Definição  
INSERT INTO treino_exercicios (treino_id, exercicio_id, ordem, series, repeticoes, tempo_descanso, observacoes) VALUES
('treino-dia6', 'core-001', 1, 4, '60s', '30s', 'Máxima contração'),
('treino-dia6', 'core-002', 2, 4, '25', '30s', 'Foco na qualidade'),
('treino-dia6', 'core-003', 3, 4, '30', '45s', 'Velocidade controlada')
ON CONFLICT DO NOTHING;

-- Dia 7 - Finalização
INSERT INTO treino_exercicios (treino_id, exercicio_id, ordem, series, repeticoes, tempo_descanso, observacoes) VALUES
('treino-dia7', 'core-001', 1, 3, '60s', '45s', 'Finalize com força'),
('treino-dia7', 'core-002', 2, 3, '20', '45s', 'Último esforço'),
('treino-dia7', 'core-003', 3, 3, '25', '60s', 'Você conseguiu!')
ON CONFLICT DO NOTHING;

-- 4. Criar o programa
INSERT INTO programas (id, nome, descricao, objetivo, duracao_semanas, frequencia_semanal, nivel, categoria, is_publico, tags) VALUES
('prog-7dias', '7 Dias de Barriga Tanquinho', 
'Programa intensivo de 7 dias focado no desenvolvimento e definição do core. Exercícios progressivos que vão ativar, fortalecer e definir sua barriga em apenas uma semana!', 
'Definição do Core', 1, 7, 'intermediario', 'Core/Abdômen', true, 
ARRAY['barriga tanquinho', '7 dias', 'core', 'definição', 'desafio', 'intensivo'])
ON CONFLICT (id) DO NOTHING;

-- 5. Agendar treinos para cada dia da semana
INSERT INTO programa_treinos (programa_id, treino_id, dia_semana, semana, ordem, observacoes) VALUES
('prog-7dias', 'treino-dia1', 1, 1, 1, 'Dia 1 - Começando o desafio com ativação suave'),
('prog-7dias', 'treino-dia2', 2, 1, 1, 'Dia 2 - Evoluindo para o básico'),
('prog-7dias', 'treino-dia3', 3, 1, 1, 'Dia 3 - Adicionando cardio ao core'),
('prog-7dias', 'treino-dia4', 4, 1, 1, 'Dia 4 - Meio do caminho, foco na resistência'),
('prog-7dias', 'treino-dia5', 5, 1, 1, 'Dia 5 - Intensidade máxima!'),
('prog-7dias', 'treino-dia6', 6, 1, 1, 'Dia 6 - Definindo os músculos'),
('prog-7dias', 'treino-dia7', 7, 1, 1, 'Dia 7 - Finalização épica do desafio!')
ON CONFLICT DO NOTHING;

-- Verificar resultado
SELECT 'Programa criado com sucesso!' as resultado,
       (SELECT COUNT(*) FROM exercicios WHERE id LIKE 'core-%') as exercicios_criados,
       (SELECT COUNT(*) FROM treinos WHERE id LIKE 'treino-dia%') as treinos_criados,  
       (SELECT COUNT(*) FROM treino_exercicios WHERE treino_id LIKE 'treino-dia%') as exercicios_nos_treinos,
       (SELECT COUNT(*) FROM programas WHERE id = 'prog-7dias') as programas_criados,
       (SELECT COUNT(*) FROM programa_treinos WHERE programa_id = 'prog-7dias') as cronograma_criado;