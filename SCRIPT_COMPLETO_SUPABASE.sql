-- ============================================
-- SCRIPT COMPLETO PARA EXECUTAR NO SUPABASE
-- ============================================
-- Cole este script inteiro no SQL Editor do Supabase Dashboard e execute

-- Primeiro, criar tabela users se não existir (baseada na estrutura existente)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('personal_trainer', 'aluno')),
  plano text DEFAULT 'trial' CHECK (plano IN ('trial', 'mensal', 'anual')),
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Criar tabela user_profiles se não existir (baseada na estrutura existente)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  nome text,
  email text,
  tipo text CHECK (tipo IN ('personal_trainer', 'aluno')),
  idade integer,
  peso numeric(5,2),
  altura numeric(5,2),
  objetivo text,
  nivel_experiencia text CHECK (nivel_experiencia IN ('Iniciante', 'Intermediário', 'Avançado')),
  dores_existentes text[],
  localizacao_dores text,
  intensidade_dor integer CHECK (intensidade_dor >= 0 AND intensidade_dor <= 10),
  atividade_fisica_frequencia text,
  medicamentos text,
  restricoes_medicas text,
  plano text DEFAULT 'trial',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Tabela personal_aluno (relacionamento personal-cliente existente)
CREATE TABLE IF NOT EXISTS personal_aluno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id uuid REFERENCES users(id) ON DELETE CASCADE,
  aluno_id uuid REFERENCES users(id) ON DELETE CASCADE,
  data_vinculo timestamp with time zone DEFAULT now(),
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(aluno_id), -- Aluno só pode ter 1 personal
  CHECK (personal_id != aluno_id) -- Personal não pode ser aluno de si mesmo
);

-- Agora criar o sistema de workouts

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
INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds, duration_seconds) 
SELECT 
  (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'),
  (SELECT id FROM exercises WHERE name = 'Polichinelos'),
  1, 2, 20, 60, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM workout_template_exercises 
  WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo')
  AND exercise_id = (SELECT id FROM exercises WHERE name = 'Polichinelos')
);

INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds, duration_seconds) 
SELECT 
  (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'),
  (SELECT id FROM exercises WHERE name = 'Agachamento'),
  2, 3, 10, 90, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM workout_template_exercises 
  WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo')
  AND exercise_id = (SELECT id FROM exercises WHERE name = 'Agachamento')
);

INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds, duration_seconds) 
SELECT 
  (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'),
  (SELECT id FROM exercises WHERE name = 'Flexão de Braço'),
  3, 3, 8, 90, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM workout_template_exercises 
  WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo')
  AND exercise_id = (SELECT id FROM exercises WHERE name = 'Flexão de Braço')
);

INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds, duration_seconds) 
SELECT 
  (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'),
  (SELECT id FROM exercises WHERE name = 'Prancha'),
  4, 3, NULL, 60, 30
WHERE NOT EXISTS (
  SELECT 1 FROM workout_template_exercises 
  WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo')
  AND exercise_id = (SELECT id FROM exercises WHERE name = 'Prancha')
);

INSERT INTO workout_template_exercises (workout_template_id, exercise_id, order_index, sets, reps, rest_seconds, duration_seconds) 
SELECT 
  (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo'),
  (SELECT id FROM exercises WHERE name = 'Alongamento de Posterior'),
  5, 1, NULL, 30, 60
WHERE NOT EXISTS (
  SELECT 1 FROM workout_template_exercises 
  WHERE workout_template_id = (SELECT id FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo')
  AND exercise_id = (SELECT id FROM exercises WHERE name = 'Alongamento de Posterior')
);

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

-- Policies for public read access to reference data
DROP POLICY IF EXISTS "Public read access to exercise_categories" ON exercise_categories;
CREATE POLICY "Public read access to exercise_categories" ON exercise_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access to muscle_groups" ON muscle_groups;
CREATE POLICY "Public read access to muscle_groups" ON muscle_groups FOR SELECT USING (true);

-- Policies for exercises (everyone can read, trainers can create)
DROP POLICY IF EXISTS "Public read access to exercises" ON exercises;
CREATE POLICY "Public read access to exercises" ON exercises FOR SELECT USING (true);

DROP POLICY IF EXISTS "Trainers can insert exercises" ON exercises;
CREATE POLICY "Trainers can insert exercises" ON exercises FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Trainers can update their exercises" ON exercises;
CREATE POLICY "Trainers can update their exercises" ON exercises FOR UPDATE USING (created_by = auth.uid());

-- Policies for workout templates
DROP POLICY IF EXISTS "Public read access to public workout templates" ON workout_templates;
CREATE POLICY "Public read access to public workout templates" ON workout_templates FOR SELECT USING (is_public = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Trainers can create workout templates" ON workout_templates;
CREATE POLICY "Trainers can create workout templates" ON workout_templates FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Trainers can update their workout templates" ON workout_templates;
CREATE POLICY "Trainers can update their workout templates" ON workout_templates FOR UPDATE USING (created_by = auth.uid());

-- Policies for workout template exercises
DROP POLICY IF EXISTS "Public read access to workout template exercises" ON workout_template_exercises;
CREATE POLICY "Public read access to workout template exercises" ON workout_template_exercises FOR SELECT USING (true);

-- Policies for user workout programs
DROP POLICY IF EXISTS "Users can read their workout programs" ON user_workout_programs;
CREATE POLICY "Users can read their workout programs" ON user_workout_programs FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can assign workout programs" ON user_workout_programs;
CREATE POLICY "Trainers can assign workout programs" ON user_workout_programs FOR INSERT WITH CHECK (true);

-- Policies for workout sessions
DROP POLICY IF EXISTS "Users can manage their workout sessions" ON workout_sessions;
CREATE POLICY "Users can manage their workout sessions" ON workout_sessions FOR ALL USING (user_id = auth.uid());

-- Policies for pain reports
DROP POLICY IF EXISTS "Users can manage their pain reports" ON pain_reports;
CREATE POLICY "Users can manage their pain reports" ON pain_reports FOR ALL USING (user_id = auth.uid());

-- Policies for trainer invitations
DROP POLICY IF EXISTS "Trainers can manage their invitations" ON trainer_invitations;
CREATE POLICY "Trainers can manage their invitations" ON trainer_invitations FOR ALL USING (trainer_id = auth.uid());

-- Enable RLS on existing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_aluno ENABLE ROW LEVEL SECURITY;

-- Policies for users table
DROP POLICY IF EXISTS "Users can read their own data" ON users;
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Policies for user_profiles table
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
CREATE POLICY "Users can read their own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for personal_aluno table
DROP POLICY IF EXISTS "Users can read their relationships" ON personal_aluno;
CREATE POLICY "Users can read their relationships" ON personal_aluno FOR SELECT USING (
  auth.uid() = personal_id OR auth.uid() = aluno_id
);

DROP POLICY IF EXISTS "Personal trainers can manage relationships" ON personal_aluno;
CREATE POLICY "Personal trainers can manage relationships" ON personal_aluno FOR ALL USING (auth.uid() = personal_id);