-- Insert sample workout data

-- Insert sample exercises
INSERT INTO exercises (name, description, instructions, difficulty_level, category_id, primary_muscle_group_id, equipment_needed, duration_minutes, calories_per_minute) VALUES
-- Aquecimento exercises
('Polichinelos', 'Exercício cardiovascular básico', 'Pule abrindo e fechando braços e pernas simultaneamente', 1, (SELECT id FROM exercise_categories WHERE name = 'Aquecimento'), (SELECT id FROM muscle_groups WHERE name = 'Abdômen'), ARRAY['Nenhum'], 5, 8.5),
('Corrida Estacionária', 'Correr no lugar', 'Corra no lugar elevando bem os joelhos', 1, (SELECT id FROM exercise_categories WHERE name = 'Aquecimento'), (SELECT id FROM muscle_groups WHERE name = 'Coxa Anterior'), ARRAY['Nenhum'], 5, 10.0),
('Alongamento de Braços', 'Alongamento dos músculos dos braços', 'Estenda um braço e puxe com a outra mão', 1, (SELECT id FROM exercise_categories WHERE name = 'Aquecimento'), (SELECT id FROM muscle_groups WHERE name = 'Braços'), ARRAY['Nenhum'], 3, 2.0),

-- Força exercises
('Flexão de Braço', 'Exercício clássico para peito e braços', 'Deite de bruços, apoie as mãos no chão e empurre o corpo para cima', 2, (SELECT id FROM exercise_categories WHERE name = 'Força'), (SELECT id FROM muscle_groups WHERE name = 'Peito'), ARRAY['Nenhum'], 10, 6.0),
('Agachamento', 'Exercício fundamental para pernas', 'Flexione os joelhos como se fosse sentar, mantendo as costas retas', 2, (SELECT id FROM exercise_categories WHERE name = 'Força'), (SELECT id FROM muscle_groups WHERE name = 'Coxa Anterior'), ARRAY['Nenhum'], 10, 8.0),
('Prancha', 'Exercício isométrico para core', 'Mantenha o corpo reto apoiado nos antebraços e pés', 2, (SELECT id FROM exercise_categories WHERE name = 'Força'), (SELECT id FROM muscle_groups WHERE name = 'Abdômen'), ARRAY['Nenhum'], 3, 5.0),
('Burpee', 'Exercício completo de alta intensidade', 'Agachamento + prancha + salto em sequência', 4, (SELECT id FROM exercise_categories WHERE name = 'Força'), (SELECT id FROM muscle_groups WHERE name = 'Abdômen'), ARRAY['Nenhum'], 10, 12.0),

-- Cardio exercises
('Pular Corda', 'Exercício cardiovascular intenso', 'Pule a corda mantendo ritmo constante', 3, (SELECT id FROM exercise_categories WHERE name = 'Cardio'), (SELECT id FROM muscle_groups WHERE name = 'Panturrilha'), ARRAY['Corda'], 15, 11.0),
('Mountain Climbers', 'Escalada na prancha', 'Na posição de prancha, alterne joelhos ao peito rapidamente', 3, (SELECT id FROM exercise_categories WHERE name = 'Cardio'), (SELECT id FROM muscle_groups WHERE name = 'Abdômen'), ARRAY['Nenhum'], 5, 9.0),

-- Flexibilidade exercises
('Alongamento de Posterior', 'Alongamento da coxa posterior', 'Sentado, estenda uma perna e alcance o pé', 1, (SELECT id FROM exercise_categories WHERE name = 'Flexibilidade'), (SELECT id FROM muscle_groups WHERE name = 'Coxa Posterior'), ARRAY['Nenhum'], 5, 2.0),
('Alongamento de Ombros', 'Relaxamento dos ombros', 'Gire os ombros para frente e para trás lentamente', 1, (SELECT id FROM exercise_categories WHERE name = 'Flexibilidade'), (SELECT id FROM muscle_groups WHERE name = 'Ombros'), ARRAY['Nenhum'], 3, 1.5),

-- Reabilitação exercises
('Caminhada Leve', 'Caminhada em ritmo baixo', 'Caminhe em ritmo confortável focando na postura', 1, (SELECT id FROM exercise_categories WHERE name = 'Reabilitação'), (SELECT id FROM muscle_groups WHERE name = 'Coxa Anterior'), ARRAY['Nenhum'], 20, 4.0),
('Mobilização de Tornozelo', 'Exercício para mobilidade do tornozelo', 'Gire o tornozelo em todas as direções lentamente', 1, (SELECT id FROM exercise_categories WHERE name = 'Reabilitação'), (SELECT id FROM muscle_groups WHERE name = 'Tornozelos'), ARRAY['Nenhum'], 5, 1.0);

-- Insert sample workout templates
INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience) VALUES
('Treino Iniciante - Corpo Todo', 'Treino completo para iniciantes focado em movimentos básicos', 1, 30, ARRAY['beginner']),
('Treino Intermediário - HIIT', 'Treino de alta intensidade para queima de gordura', 3, 25, ARRAY['intermediate']),
('Treino de Reabilitação', 'Treino leve focado em recuperação e mobilidade', 1, 20, ARRAY['beginner', 'rehabilitation']),
('Treino Avançado - Força', 'Treino intenso focado em ganho de força muscular', 4, 45, ARRAY['advanced']),
('Treino Cardio Intenso', 'Treino cardiovascular de alta intensidade', 4, 35, ARRAY['intermediate', 'advanced']);

-- Insert exercises into workout templates

-- Treino Iniciante - Corpo Todo
INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES
((SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'), (SELECT id FROM exercises WHERE name = 'Polichinelos'), 1, 2, 20, 60),
((SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'), (SELECT id FROM exercises WHERE name = 'Agachamento'), 2, 3, 10, 90),
((SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'), (SELECT id FROM exercises WHERE name = 'Flexão de Braço'), 3, 3, 8, 90),
((SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'), (SELECT id FROM exercises WHERE name = 'Prancha'), 4, 3, NULL, 60),
((SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'), (SELECT id FROM exercises WHERE name = 'Alongamento de Posterior'), 5, 1, NULL, 30);

-- Update prancha duration for workout template
UPDATE workout_template_exercises 
SET duration_seconds = 30 
WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo') 
AND exercise_id = (SELECT id FROM exercises WHERE name = 'Prancha');

-- Treino Intermediário - HIIT
INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES
((SELECT id FROM workout_templates WHERE name = 'Treino Intermediário - HIIT'), (SELECT id FROM exercises WHERE name = 'Burpee'), 1, 4, 8, 45),
((SELECT id FROM workout_templates WHERE name = 'Treino Intermediário - HIIT'), (SELECT id FROM exercises WHERE name = 'Mountain Climbers'), 2, 4, 15, 45),
((SELECT id FROM workout_templates WHERE name = 'Treino Intermediário - HIIT'), (SELECT id FROM exercises WHERE name = 'Pular Corda'), 3, 3, NULL, 60),
((SELECT id FROM workout_templates WHERE name = 'Treino Intermediário - HIIT'), (SELECT id FROM exercises WHERE name = 'Agachamento'), 4, 4, 20, 45);

-- Update pular corda duration for HIIT workout
UPDATE workout_template_exercises 
SET duration_seconds = 60 
WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino Intermediário - HIIT') 
AND exercise_id = (SELECT id FROM exercises WHERE name = 'Pular Corda');

-- Treino de Reabilitação
INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES
((SELECT id FROM workout_templates WHERE name = 'Treino de Reabilitação'), (SELECT id FROM exercises WHERE name = 'Caminhada Leve'), 1, 1, NULL, 120),
((SELECT id FROM workout_templates WHERE name = 'Treino de Reabilitação'), (SELECT id FROM exercises WHERE name = 'Alongamento de Ombros'), 2, 2, NULL, 30),
((SELECT id FROM workout_templates WHERE name = 'Treino de Reabilitação'), (SELECT id FROM exercises WHERE name = 'Mobilização de Tornozelo'), 3, 2, NULL, 30),
((SELECT id FROM workout_templates WHERE name = 'Treino de Reabilitação'), (SELECT id FROM exercises WHERE name = 'Alongamento de Posterior'), 4, 2, NULL, 30);

-- Update durations for rehabilitation workout
UPDATE workout_template_exercises 
SET duration_seconds = 600 -- 10 minutes
WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino de Reabilitação') 
AND exercise_id = (SELECT id FROM exercises WHERE name = 'Caminhada Leve');

UPDATE workout_template_exercises 
SET duration_seconds = 60 
WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino de Reabilitação') 
AND exercise_id IN (
  SELECT id FROM exercises WHERE name IN ('Alongamento de Ombros', 'Mobilização de Tornozelo', 'Alongamento de Posterior')
);

-- Treino Avançado - Força
INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES
((SELECT id FROM workout_templates WHERE name = 'Treino Avançado - Força'), (SELECT id FROM exercises WHERE name = 'Flexão de Braço'), 1, 5, 15, 120),
((SELECT id FROM workout_templates WHERE name = 'Treino Avançado - Força'), (SELECT id FROM exercises WHERE name = 'Agachamento'), 2, 5, 25, 120),
((SELECT id FROM workout_templates WHERE name = 'Treino Avançado - Força'), (SELECT id FROM exercises WHERE name = 'Burpee'), 3, 4, 12, 90),
((SELECT id FROM workout_templates WHERE name = 'Treino Avançado - Força'), (SELECT id FROM exercises WHERE name = 'Prancha'), 4, 3, NULL, 90);

-- Update prancha duration for advanced workout
UPDATE workout_template_exercises 
SET duration_seconds = 90 
WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino Avançado - Força') 
AND exercise_id = (SELECT id FROM exercises WHERE name = 'Prancha');

-- Treino Cardio Intenso
INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES
((SELECT id FROM workout_templates WHERE name = 'Treino Cardio Intenso'), (SELECT id FROM exercises WHERE name = 'Polichinelos'), 1, 5, 30, 30),
((SELECT id FROM workout_templates WHERE name = 'Treino Cardio Intenso'), (SELECT id FROM exercises WHERE name = 'Mountain Climbers'), 2, 5, 20, 30),
((SELECT id FROM workout_templates WHERE name = 'Treino Cardio Intenso'), (SELECT id FROM exercises WHERE name = 'Burpee'), 3, 4, 10, 45),
((SELECT id FROM workout_templates WHERE name = 'Treino Cardio Intenso'), (SELECT id FROM exercises WHERE name = 'Pular Corda'), 4, 4, NULL, 60);

-- Update pular corda duration for cardio workout
UPDATE workout_template_exercises 
SET duration_seconds = 90 
WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino Cardio Intenso') 
AND exercise_id = (SELECT id FROM exercises WHERE name = 'Pular Corda');