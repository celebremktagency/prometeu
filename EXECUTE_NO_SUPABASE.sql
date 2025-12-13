-- ============================================
-- SCRIPT COMPLETO PARA EXECUTAR NO SUPABASE
-- ============================================
-- Cole este script inteiro no SQL Editor do Supabase Dashboard e execute

-- Create workouts and exercises system

-- Table for exercise categories
CREATE TABLE IF NOT EXISTS exercise_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for muscle groups
CREATE TABLE IF NOT EXISTS muscle_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  body_part VARCHAR(50) NOT NULL, -- 'upper', 'lower', 'core'
  svg_path TEXT, -- SVG path for body diagram
  x_position INTEGER, -- X coordinate on body diagram
  y_position INTEGER, -- Y coordinate on body diagram
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for exercises
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  instructions TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
  category_id UUID REFERENCES exercise_categories(id),
  primary_muscle_group_id UUID REFERENCES muscle_groups(id),
  equipment_needed TEXT[],
  video_url TEXT,
  image_url TEXT,
  duration_minutes INTEGER,
  calories_per_minute DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Table for secondary muscle groups targeted by exercises
CREATE TABLE IF NOT EXISTS exercise_muscle_groups (
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (exercise_id, muscle_group_id)
);

-- Table for workout templates
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
  estimated_duration_minutes INTEGER,
  target_audience TEXT[], -- ['beginner', 'intermediate', 'advanced', 'rehabilitation']
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for workout template exercises (what exercises are in each template)
CREATE TABLE IF NOT EXISTS workout_template_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  order_index INTEGER NOT NULL,
  sets INTEGER DEFAULT 1,
  reps INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER DEFAULT 60,
  weight_kg DECIMAL(5,2),
  notes TEXT
);

-- Table for user's assigned workout programs
CREATE TABLE IF NOT EXISTS user_workout_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_template_id UUID REFERENCES workout_templates(id),
  assigned_by UUID REFERENCES users(id), -- personal trainer who assigned it
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT
);

-- Table for completed workouts (workout sessions)
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_template_id UUID REFERENCES workout_templates(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_duration_minutes INTEGER,
  total_calories_burned INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);

-- Table for completed exercises within a workout session
CREATE TABLE IF NOT EXISTS workout_session_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  order_index INTEGER NOT NULL,
  sets_completed INTEGER DEFAULT 0,
  reps_completed INTEGER[],
  weight_used_kg DECIMAL(5,2)[],
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Table for pain tracking
CREATE TABLE IF NOT EXISTS pain_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  muscle_group_id UUID REFERENCES muscle_groups(id),
  pain_level INTEGER CHECK (pain_level BETWEEN 1 AND 10) NOT NULL,
  pain_type VARCHAR(50), -- 'sharp', 'dull', 'burning', 'aching', 'cramping'
  triggers TEXT[], -- what triggers the pain
  notes TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  workout_session_id UUID REFERENCES workout_sessions(id) -- if pain reported during/after workout
);

-- Table for personal trainer invitations
CREATE TABLE IF NOT EXISTS trainer_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_email VARCHAR(255) NOT NULL,
  invitation_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Table for trainer-client relationships
CREATE TABLE IF NOT EXISTS trainer_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  relationship_status VARCHAR(20) DEFAULT 'active' CHECK (relationship_status IN ('active', 'inactive', 'terminated')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(trainer_id, client_id)
);

-- Insert default muscle groups for body diagram
INSERT INTO muscle_groups (name, body_part, x_position, y_position) VALUES
-- Upper body
('Pescoço', 'upper', 150, 50),
('Ombros', 'upper', 150, 80),
('Peito', 'upper', 150, 120),
('Braços', 'upper', 100, 120),
('Antebraços', 'upper', 80, 160),
('Costas Superior', 'upper', 150, 140),
('Costas Média', 'upper', 150, 180),
-- Core
('Abdômen', 'core', 150, 200),
('Lombar', 'core', 150, 220),
-- Lower body
('Quadril', 'lower', 150, 240),
('Glúteos', 'lower', 150, 260),
('Coxa Anterior', 'lower', 130, 300),
('Coxa Posterior', 'lower', 170, 300),
('Joelhos', 'lower', 150, 340),
('Panturrilha', 'lower', 150, 380),
('Tornozelos', 'lower', 150, 420),
('Pés', 'lower', 150, 440)
ON CONFLICT (name) DO NOTHING;

-- Insert default exercise categories
INSERT INTO exercise_categories (name, description) VALUES
('Aquecimento', 'Exercícios de preparação e aquecimento'),
('Força', 'Exercícios de fortalecimento muscular'),
('Cardio', 'Exercícios cardiovasculares'),
('Flexibilidade', 'Exercícios de alongamento e flexibilidade'),
('Reabilitação', 'Exercícios específicos para reabilitação'),
('Mobilidade', 'Exercícios de mobilidade articular'),
('Estabilização', 'Exercícios de estabilização e propriocepção')
ON CONFLICT (name) DO NOTHING;

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
('Mobilização de Tornozelo', 'Exercício para mobilidade do tornozelo', 'Gire o tornozelo em todas as direções lentamente', 1, (SELECT id FROM exercise_categories WHERE name = 'Reabilitação'), (SELECT id FROM muscle_groups WHERE name = 'Tornozelos'), ARRAY['Nenhum'], 5, 1.0)
ON CONFLICT (name) DO NOTHING;

-- Insert sample workout templates
INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience) VALUES
('Treino Iniciante - Corpo Todo', 'Treino completo para iniciantes focado em movimentos básicos', 1, 30, ARRAY['beginner']),
('Treino Intermediário - HIIT', 'Treino de alta intensidade para queima de gordura', 3, 25, ARRAY['intermediate']),
('Treino de Reabilitação', 'Treino leve focado em recuperação e mobilidade', 1, 20, ARRAY['beginner', 'rehabilitation']),
('Treino Avançado - Força', 'Treino intenso focado em ganho de força muscular', 4, 45, ARRAY['advanced']),
('Treino Cardio Intenso', 'Treino cardiovascular de alta intensidade', 4, 35, ARRAY['intermediate', 'advanced'])
ON CONFLICT (name) DO NOTHING;

-- Insert exercises into workout templates
-- Treino Iniciante - Corpo Todo
INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds, duration_seconds) VALUES
((SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'), (SELECT id FROM exercises WHERE name = 'Polichinelos'), 1, 2, 20, 60, NULL),
((SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'), (SELECT id FROM exercises WHERE name = 'Agachamento'), 2, 3, 10, 90, NULL),
((SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'), (SELECT id FROM exercises WHERE name = 'Flexão de Braço'), 3, 3, 8, 90, NULL),
((SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'), (SELECT id FROM exercises WHERE name = 'Prancha'), 4, 3, NULL, 60, 30),
((SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'), (SELECT id FROM exercises WHERE name = 'Alongamento de Posterior'), 5, 1, NULL, 30, 60)
ON CONFLICT DO NOTHING;

-- Treino Intermediário - HIIT
INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds, duration_seconds) VALUES
((SELECT id FROM workout_templates WHERE name = 'Treino Intermediário - HIIT'), (SELECT id FROM exercises WHERE name = 'Burpee'), 1, 4, 8, 45, NULL),
((SELECT id FROM workout_templates WHERE name = 'Treino Intermediário - HIIT'), (SELECT id FROM exercises WHERE name = 'Mountain Climbers'), 2, 4, 15, 45, NULL),
((SELECT id FROM workout_templates WHERE name = 'Treino Intermediário - HIIT'), (SELECT id FROM exercises WHERE name = 'Pular Corda'), 3, 3, NULL, 60, 60),
((SELECT id FROM workout_templates WHERE name = 'Treino Intermediário - HIIT'), (SELECT id FROM exercises WHERE name = 'Agachamento'), 4, 4, 20, 45, NULL)
ON CONFLICT DO NOTHING;

-- Treino de Reabilitação
INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds, duration_seconds) VALUES
((SELECT id FROM workout_templates WHERE name = 'Treino de Reabilitação'), (SELECT id FROM exercises WHERE name = 'Caminhada Leve'), 1, 1, NULL, 120, 600),
((SELECT id FROM workout_templates WHERE name = 'Treino de Reabilitação'), (SELECT id FROM exercises WHERE name = 'Alongamento de Ombros'), 2, 2, NULL, 30, 60),
((SELECT id FROM workout_templates WHERE name = 'Treino de Reabilitação'), (SELECT id FROM exercises WHERE name = 'Mobilização de Tornozelo'), 3, 2, NULL, 30, 60),
((SELECT id FROM workout_templates WHERE name = 'Treino de Reabilitação'), (SELECT id FROM exercises WHERE name = 'Alongamento de Posterior'), 4, 2, NULL, 30, 60)
ON CONFLICT DO NOTHING;

-- Create RLS policies
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE pain_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_clients ENABLE ROW LEVEL SECURITY;

-- Policies for public read access to reference data
DROP POLICY IF EXISTS "Public read access to exercise_categories" ON exercise_categories;
CREATE POLICY "Public read access to exercise_categories" ON exercise_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access to muscle_groups" ON muscle_groups;
CREATE POLICY "Public read access to muscle_groups" ON muscle_groups FOR SELECT USING (true);

-- Policies for exercises (trainers can create, users can read public ones)
DROP POLICY IF EXISTS "Public read access to exercises" ON exercises;
CREATE POLICY "Public read access to exercises" ON exercises FOR SELECT USING (true);

DROP POLICY IF EXISTS "Trainers can insert exercises" ON exercises;
CREATE POLICY "Trainers can insert exercises" ON exercises FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND tipo = 'personal_trainer')
);

DROP POLICY IF EXISTS "Trainers can update their exercises" ON exercises;
CREATE POLICY "Trainers can update their exercises" ON exercises FOR UPDATE USING (created_by = auth.uid());

-- Policies for workout templates
DROP POLICY IF EXISTS "Public read access to public workout templates" ON workout_templates;
CREATE POLICY "Public read access to public workout templates" ON workout_templates FOR SELECT USING (is_public = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Trainers can create workout templates" ON workout_templates;
CREATE POLICY "Trainers can create workout templates" ON workout_templates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND tipo = 'personal_trainer')
);

DROP POLICY IF EXISTS "Trainers can update their workout templates" ON workout_templates;
CREATE POLICY "Trainers can update their workout templates" ON workout_templates FOR UPDATE USING (created_by = auth.uid());

-- Policies for workout template exercises
DROP POLICY IF EXISTS "Public read access to workout template exercises" ON workout_template_exercises;
CREATE POLICY "Public read access to workout template exercises" ON workout_template_exercises FOR SELECT USING (true);

-- Policies for user workout programs
DROP POLICY IF EXISTS "Users can read their workout programs" ON user_workout_programs;
CREATE POLICY "Users can read their workout programs" ON user_workout_programs FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can assign workout programs" ON user_workout_programs;
CREATE POLICY "Trainers can assign workout programs" ON user_workout_programs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = auth.uid() AND client_id = user_workout_programs.user_id AND relationship_status = 'active')
);

-- Policies for workout sessions
DROP POLICY IF EXISTS "Users can manage their workout sessions" ON workout_sessions;
CREATE POLICY "Users can manage their workout sessions" ON workout_sessions FOR ALL USING (user_id = auth.uid());

-- Policies for pain reports
DROP POLICY IF EXISTS "Users can manage their pain reports" ON pain_reports;
CREATE POLICY "Users can manage their pain reports" ON pain_reports FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can read their clients pain reports" ON pain_reports;
CREATE POLICY "Trainers can read their clients pain reports" ON pain_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = auth.uid() AND client_id = pain_reports.user_id AND relationship_status = 'active')
);

-- Policies for trainer invitations
DROP POLICY IF EXISTS "Trainers can manage their invitations" ON trainer_invitations;
CREATE POLICY "Trainers can manage their invitations" ON trainer_invitations FOR ALL USING (trainer_id = auth.uid());

-- Policies for trainer-client relationships
DROP POLICY IF EXISTS "Users can read their trainer relationships" ON trainer_clients;
CREATE POLICY "Users can read their trainer relationships" ON trainer_clients FOR SELECT USING (
  trainer_id = auth.uid() OR client_id = auth.uid()
);

DROP POLICY IF EXISTS "Trainers can manage client relationships" ON trainer_clients;
CREATE POLICY "Trainers can manage client relationships" ON trainer_clients FOR ALL USING (trainer_id = auth.uid());