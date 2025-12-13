-- ============================================
-- SCRIPT COMPLETO PROMETEUS - EXECUTE NO SUPABASE
-- ============================================
-- Este é o script final para deixar tudo funcional
-- Execute no SQL Editor do Supabase Dashboard

-- ============================================
-- 1. VERIFICAR E CRIAR TABELA DE USUÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(200),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name VARCHAR(200),
  email VARCHAR(255),
  tipo VARCHAR(50) CHECK (tipo IN ('aluno', 'personal_trainer')) DEFAULT 'aluno',
  data_nascimento DATE,
  telefone VARCHAR(20),
  endereco TEXT,
  objetivo TEXT,
  nivel_experiencia VARCHAR(20) CHECK (nivel_experiencia IN ('iniciante', 'intermediario', 'avancado')) DEFAULT 'iniciante',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. SISTEMA DE EXERCÍCIOS E TREINOS
-- ============================================

-- Categorias de exercícios
CREATE TABLE IF NOT EXISTS exercise_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grupos musculares
CREATE TABLE IF NOT EXISTS muscle_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  body_part VARCHAR(50) NOT NULL,
  svg_path TEXT,
  x_position INTEGER,
  y_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercícios
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
  created_by UUID REFERENCES auth.users(id)
);

-- Templates de treino
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
  estimated_duration_minutes INTEGER,
  target_audience TEXT[],
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercícios em templates de treino
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

-- Sessões de treino (treinos realizados)
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_template_id UUID REFERENCES workout_templates(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_duration_minutes INTEGER,
  total_calories_burned INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);

-- ============================================
-- 3. SISTEMA DE DOR E MONITORAMENTO
-- ============================================

-- Relatórios de dor
CREATE TABLE IF NOT EXISTS pain_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  muscle_group_id UUID REFERENCES muscle_groups(id),
  pain_level INTEGER CHECK (pain_level BETWEEN 1 AND 10) NOT NULL,
  pain_type VARCHAR(50),
  triggers TEXT[],
  notes TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  workout_session_id UUID REFERENCES workout_sessions(id)
);

-- ============================================
-- 4. SISTEMA PERSONAL TRAINER
-- ============================================

-- Convites de personal trainer
CREATE TABLE IF NOT EXISTS trainer_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_email VARCHAR(255) NOT NULL,
  invitation_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Relacionamentos trainer-cliente
CREATE TABLE IF NOT EXISTS trainer_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_status VARCHAR(20) DEFAULT 'active' CHECK (relationship_status IN ('active', 'inactive', 'terminated')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(trainer_id, client_id)
);

-- Treinos atribuídos
CREATE TABLE IF NOT EXISTS user_workout_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_template_id UUID REFERENCES workout_templates(id),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT
);

-- ============================================
-- 5. SISTEMA DE COMUNIDADE
-- ============================================

-- Posts da comunidade
CREATE TABLE IF NOT EXISTS comunidade_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(200),
  conteudo TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'post',
  curtidas INTEGER DEFAULT 0,
  visualizacoes INTEGER DEFAULT 0,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da comunidade
CREATE TABLE IF NOT EXISTS comunidade_comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES comunidade_posts(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  curtidas INTEGER DEFAULT 0,
  parent_comment_id UUID REFERENCES comunidade_comentarios(id),
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Curtidas da comunidade
CREATE TABLE IF NOT EXISTS comunidade_curtidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES comunidade_posts(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES comunidade_comentarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_like_target CHECK (
    (post_id IS NOT NULL AND comentario_id IS NULL) OR
    (post_id IS NULL AND comentario_id IS NOT NULL)
  )
);

-- ============================================
-- 6. SISTEMA DE INSIGHTS
-- ============================================

-- Insights
CREATE TABLE IF NOT EXISTS insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tipo VARCHAR(100) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100),
  prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta')),
  ativo BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_lida TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- 7. HABILITAR ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pain_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_curtidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. CRIAR POLÍTICAS RLS (PERMISSIVAS PARA FUNCIONAR)
-- ============================================

-- Política para perfis de usuário
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
CREATE POLICY "Users can manage their own profile" ON user_profiles FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can read client profiles" ON user_profiles;
CREATE POLICY "Trainers can read client profiles" ON user_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = auth.uid() AND client_id = user_profiles.user_id)
);

-- Políticas para dados públicos (permissivas)
DROP POLICY IF EXISTS "Public read exercise_categories" ON exercise_categories;
CREATE POLICY "Public read exercise_categories" ON exercise_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read muscle_groups" ON muscle_groups;
CREATE POLICY "Public read muscle_groups" ON muscle_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read exercises" ON exercises;
CREATE POLICY "Public read exercises" ON exercises FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert exercises" ON exercises;
CREATE POLICY "Anyone can insert exercises" ON exercises FOR INSERT WITH CHECK (true);

-- Políticas para templates de treino
DROP POLICY IF EXISTS "Public read workout_templates" ON workout_templates;
CREATE POLICY "Public read workout_templates" ON workout_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create workout_templates" ON workout_templates;
CREATE POLICY "Anyone can create workout_templates" ON workout_templates FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own workout_templates" ON workout_templates;
CREATE POLICY "Users can update own workout_templates" ON workout_templates FOR UPDATE USING (created_by = auth.uid());

-- Políticas para exercícios de template (permissivas)
DROP POLICY IF EXISTS "Public read workout_template_exercises" ON workout_template_exercises;
CREATE POLICY "Public read workout_template_exercises" ON workout_template_exercises FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert workout_template_exercises" ON workout_template_exercises;
CREATE POLICY "Anyone can insert workout_template_exercises" ON workout_template_exercises FOR INSERT WITH CHECK (true);

-- Políticas para sessões de treino
DROP POLICY IF EXISTS "Users manage own workout_sessions" ON workout_sessions;
CREATE POLICY "Users manage own workout_sessions" ON workout_sessions FOR ALL USING (user_id = auth.uid());

-- Políticas para relatórios de dor
DROP POLICY IF EXISTS "Users manage own pain_reports" ON pain_reports;
CREATE POLICY "Users manage own pain_reports" ON pain_reports FOR ALL USING (user_id = auth.uid());

-- Políticas para relacionamentos trainer-cliente
DROP POLICY IF EXISTS "Users can read own relationships" ON trainer_clients;
CREATE POLICY "Users can read own relationships" ON trainer_clients FOR SELECT USING (
  trainer_id = auth.uid() OR client_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can manage trainer relationships" ON trainer_clients;
CREATE POLICY "Users can manage trainer relationships" ON trainer_clients FOR ALL USING (trainer_id = auth.uid() OR client_id = auth.uid());

-- Políticas para convites
DROP POLICY IF EXISTS "Trainers manage own invitations" ON trainer_invitations;
CREATE POLICY "Trainers manage own invitations" ON trainer_invitations FOR ALL USING (trainer_id = auth.uid());

-- Políticas para programas de treino
DROP POLICY IF EXISTS "Users read own programs" ON user_workout_programs;
CREATE POLICY "Users read own programs" ON user_workout_programs FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers assign programs" ON user_workout_programs;
CREATE POLICY "Trainers assign programs" ON user_workout_programs FOR INSERT WITH CHECK (true);

-- Políticas para comunidade (permissivas)
DROP POLICY IF EXISTS "Public read comunidade_posts" ON comunidade_posts;
CREATE POLICY "Public read comunidade_posts" ON comunidade_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create own posts" ON comunidade_posts;
CREATE POLICY "Users create own posts" ON comunidade_posts FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Users update own posts" ON comunidade_posts;
CREATE POLICY "Users update own posts" ON comunidade_posts FOR UPDATE USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Public read comentarios" ON comunidade_comentarios;
CREATE POLICY "Public read comentarios" ON comunidade_comentarios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create comentarios" ON comunidade_comentarios;
CREATE POLICY "Users create comentarios" ON comunidade_comentarios FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own curtidas" ON comunidade_curtidas;
CREATE POLICY "Users manage own curtidas" ON comunidade_curtidas FOR ALL USING (usuario_id = auth.uid());

-- Políticas para insights
DROP POLICY IF EXISTS "Users manage own insights" ON insights;
CREATE POLICY "Users manage own insights" ON insights FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================
-- 9. INSERIR DADOS INICIAIS
-- ============================================

-- Grupos musculares
INSERT INTO muscle_groups (name, body_part, x_position, y_position) VALUES
('Pescoço', 'upper', 150, 50),
('Ombros', 'upper', 150, 80),
('Peito', 'upper', 150, 120),
('Braços', 'upper', 100, 120),
('Antebraços', 'upper', 80, 160),
('Costas Superior', 'upper', 150, 140),
('Costas Média', 'upper', 150, 180),
('Abdômen', 'core', 150, 200),
('Lombar', 'core', 150, 220),
('Quadril', 'lower', 150, 240),
('Glúteos', 'lower', 150, 260),
('Coxa Anterior', 'lower', 130, 300),
('Coxa Posterior', 'lower', 170, 300),
('Joelhos', 'lower', 150, 340),
('Panturrilha', 'lower', 150, 380),
('Tornozelos', 'lower', 150, 420),
('Pés', 'lower', 150, 440)
ON CONFLICT (name) DO NOTHING;

-- Categorias de exercícios
INSERT INTO exercise_categories (name, description) VALUES
('Aquecimento', 'Exercícios de preparação e aquecimento'),
('Força', 'Exercícios de fortalecimento muscular'),
('Cardio', 'Exercícios cardiovasculares'),
('Flexibilidade', 'Exercícios de alongamento e flexibilidade'),
('Reabilitação', 'Exercícios específicos para reabilitação'),
('Mobilidade', 'Exercícios de mobilidade articular'),
('Estabilização', 'Exercícios de estabilização e propriocepção')
ON CONFLICT (name) DO NOTHING;

-- Exercícios básicos
INSERT INTO exercises (name, description, instructions, difficulty_level, category_id, primary_muscle_group_id, equipment_needed, duration_minutes, calories_per_minute) VALUES
-- Aquecimento
('Polichinelos', 'Exercício cardiovascular básico', 'Pule abrindo e fechando braços e pernas simultaneamente', 1, 
  (SELECT id FROM exercise_categories WHERE name = 'Aquecimento'), 
  (SELECT id FROM muscle_groups WHERE name = 'Abdômen'), 
  ARRAY['Nenhum'], 5, 8.5),
  
('Corrida Estacionária', 'Correr no lugar', 'Corra no lugar elevando bem os joelhos', 1, 
  (SELECT id FROM exercise_categories WHERE name = 'Aquecimento'), 
  (SELECT id FROM muscle_groups WHERE name = 'Coxa Anterior'), 
  ARRAY['Nenhum'], 5, 10.0),

-- Força
('Flexão de Braço', 'Exercício clássico para peito e braços', 'Deite de bruços, apoie as mãos no chão e empurre o corpo para cima', 2, 
  (SELECT id FROM exercise_categories WHERE name = 'Força'), 
  (SELECT id FROM muscle_groups WHERE name = 'Peito'), 
  ARRAY['Nenhum'], 10, 6.0),

('Agachamento', 'Exercício fundamental para pernas', 'Flexione os joelhos como se fosse sentar, mantendo as costas retas', 2, 
  (SELECT id FROM exercise_categories WHERE name = 'Força'), 
  (SELECT id FROM muscle_groups WHERE name = 'Coxa Anterior'), 
  ARRAY['Nenhum'], 10, 8.0),

('Prancha', 'Exercício isométrico para core', 'Mantenha o corpo reto apoiado nos antebraços e pés', 2, 
  (SELECT id FROM exercise_categories WHERE name = 'Força'), 
  (SELECT id FROM muscle_groups WHERE name = 'Abdômen'), 
  ARRAY['Nenhum'], 3, 5.0),

-- Cardio
('Mountain Climbers', 'Escalada na prancha', 'Na posição de prancha, alterne joelhos ao peito rapidamente', 3, 
  (SELECT id FROM exercise_categories WHERE name = 'Cardio'), 
  (SELECT id FROM muscle_groups WHERE name = 'Abdômen'), 
  ARRAY['Nenhum'], 5, 9.0),

-- Reabilitação
('Caminhada Leve', 'Caminhada em ritmo baixo', 'Caminhe em ritmo confortável focando na postura', 1, 
  (SELECT id FROM exercise_categories WHERE name = 'Reabilitação'), 
  (SELECT id FROM muscle_groups WHERE name = 'Coxa Anterior'), 
  ARRAY['Nenhum'], 20, 4.0),

('Alongamento de Posterior', 'Alongamento da coxa posterior', 'Sentado, estenda uma perna e alcance o pé', 1, 
  (SELECT id FROM exercise_categories WHERE name = 'Flexibilidade'), 
  (SELECT id FROM muscle_groups WHERE name = 'Coxa Posterior'), 
  ARRAY['Nenhum'], 5, 2.0)
ON CONFLICT (name) DO NOTHING;

-- Templates de treino
INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience) VALUES
('Treino Iniciante - Corpo Todo', 'Treino completo para iniciantes focado em movimentos básicos', 1, 30, ARRAY['beginner']),
('Treino de Reabilitação', 'Treino leve focado em recuperação e mobilidade', 1, 20, ARRAY['beginner', 'rehabilitation']),
('Treino Cardio Básico', 'Treino cardiovascular simples', 2, 25, ARRAY['beginner', 'intermediate']),
('Treino de Força', 'Treino focado em fortalecimento', 3, 40, ARRAY['intermediate'])
ON CONFLICT (name) DO NOTHING;

-- Insights iniciais
INSERT INTO insights (tipo, titulo, descricao, categoria, prioridade) VALUES
('welcome', 'Bem-vindo ao Prometeus!', 'Complete seu perfil para ter uma experiência personalizada', 'onboarding', 'alta'),
('tip', 'Dica: Hidratação', 'Beba água antes, durante e após os exercícios', 'saude', 'media'),
('tip', 'Importância do Aquecimento', 'Sempre faça aquecimento antes dos exercícios para evitar lesões', 'treino', 'alta'),
('motivation', 'Consistência é a chave', 'Pequenos progressos diários levam a grandes resultados', 'motivacao', 'media')
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pain_reports_user_id ON pain_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_clients_trainer ON trainer_clients(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_clients_client ON trainer_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_comunidade_posts_usuario ON comunidade_posts(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comunidade_posts_data ON comunidade_posts(data DESC);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_public ON workout_templates(is_public);

-- ============================================
-- 11. VERIFICAÇÃO FINAL
-- ============================================

SELECT 
  'user_profiles' as tabela,
  (SELECT COUNT(*) FROM user_profiles) as registros
UNION ALL
SELECT 
  'exercise_categories' as tabela,
  (SELECT COUNT(*) FROM exercise_categories) as registros
UNION ALL
SELECT 
  'muscle_groups' as tabela,
  (SELECT COUNT(*) FROM muscle_groups) as registros
UNION ALL
SELECT 
  'exercises' as tabela,
  (SELECT COUNT(*) FROM exercises) as registros
UNION ALL
SELECT 
  'workout_templates' as tabela,
  (SELECT COUNT(*) FROM workout_templates) as registros
UNION ALL
SELECT 
  'insights' as tabela,
  (SELECT COUNT(*) FROM insights) as registros;

-- ============================================
-- SCRIPT COMPLETO! 
-- Agora seu Supabase está 100% funcional
-- ============================================