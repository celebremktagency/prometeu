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
('Pés', 'lower', 150, 440);

-- Insert default exercise categories
INSERT INTO exercise_categories (name, description) VALUES
('Aquecimento', 'Exercícios de preparação e aquecimento'),
('Força', 'Exercícios de fortalecimento muscular'),
('Cardio', 'Exercícios cardiovasculares'),
('Flexibilidade', 'Exercícios de alongamento e flexibilidade'),
('Reabilitação', 'Exercícios específicos para reabilitação'),
('Mobilidade', 'Exercícios de mobilidade articular'),
('Estabilização', 'Exercícios de estabilização e propriocepção');

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
CREATE POLICY "Public read access to exercise_categories" ON exercise_categories FOR SELECT USING (true);
CREATE POLICY "Public read access to muscle_groups" ON muscle_groups FOR SELECT USING (true);

-- Policies for exercises (trainers can create, users can read public ones)
CREATE POLICY "Public read access to exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Trainers can insert exercises" ON exercises FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND tipo = 'personal_trainer')
);
CREATE POLICY "Trainers can update their exercises" ON exercises FOR UPDATE USING (created_by = auth.uid());

-- Policies for workout templates
CREATE POLICY "Public read access to public workout templates" ON workout_templates FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Trainers can create workout templates" ON workout_templates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND tipo = 'personal_trainer')
);
CREATE POLICY "Trainers can update their workout templates" ON workout_templates FOR UPDATE USING (created_by = auth.uid());

-- Policies for user workout programs
CREATE POLICY "Users can read their workout programs" ON user_workout_programs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Trainers can assign workout programs" ON user_workout_programs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = auth.uid() AND client_id = user_workout_programs.user_id AND relationship_status = 'active')
);

-- Policies for workout sessions
CREATE POLICY "Users can manage their workout sessions" ON workout_sessions FOR ALL USING (user_id = auth.uid());

-- Policies for pain reports
CREATE POLICY "Users can manage their pain reports" ON pain_reports FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Trainers can read their clients' pain reports" ON pain_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = auth.uid() AND client_id = pain_reports.user_id AND relationship_status = 'active')
);

-- Policies for trainer invitations
CREATE POLICY "Trainers can manage their invitations" ON trainer_invitations FOR ALL USING (trainer_id = auth.uid());

-- Policies for trainer-client relationships
CREATE POLICY "Users can read their trainer relationships" ON trainer_clients FOR SELECT USING (
  trainer_id = auth.uid() OR client_id = auth.uid()
);
CREATE POLICY "Trainers can manage client relationships" ON trainer_clients FOR ALL USING (trainer_id = auth.uid());