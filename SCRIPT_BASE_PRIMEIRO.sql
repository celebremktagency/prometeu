-- =============================================
-- SCRIPT BASE - EXECUTAR PRIMEIRO
-- Cria estrutura básica antes do sistema profissional
-- =============================================

BEGIN;

-- =============================================
-- 1. CRIAR TABELA USERS (BASE)
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('medico', 'personal_trainer', 'fisioterapeuta', 'nutricionista', 'aluno')),
  plano text DEFAULT 'trial' CHECK (plano IN ('trial', 'mensal', 'anual')),
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 2. CRIAR TABELAS BÁSICAS EXISTENTES
-- =============================================

-- Tabela de dores
CREATE TABLE IF NOT EXISTS dores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  musculo text NOT NULL,
  nivel numeric(3,1) NOT NULL,
  data_registro timestamp with time zone DEFAULT now()
);

-- Tabela de treinos básica
CREATE TABLE IF NOT EXISTS treinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  exercicio text NOT NULL,
  series int DEFAULT 3,
  repeticoes text DEFAULT '10',
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'skipped')),
  observacoes text,
  data_criacao timestamp with time zone DEFAULT now(),
  data_execucao timestamp with time zone
);

-- Tabela de insights
CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  categoria text,
  data_criacao timestamp with time zone DEFAULT now(),
  visualizado boolean DEFAULT false
);

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  peso numeric(5,2),
  idade integer,
  altura integer,
  objetivo text,
  nivel_experiencia text,
  dores_existentes text[],
  localizacao_dores text,
  intensidade_dor integer,
  atividade_fisica_frequencia text,
  medicamentos text,
  restricoes_medicas text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_workout_date date,
  total_workouts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 3. HABILITAR RLS NAS TABELAS BÁSICAS
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dores ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. POLÍTICAS BÁSICAS RLS
-- =============================================

-- Usuários podem ver e editar apenas seus próprios dados
CREATE POLICY "Users can view own data" ON users FOR ALL USING (id = auth.uid());
CREATE POLICY "Users can view own dores" ON dores FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "Users can view own treinos" ON treinos FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "Users can view own insights" ON insights FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "Users can view own profile" ON user_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view own streaks" ON user_streaks FOR ALL USING (user_id = auth.uid());

-- =============================================
-- 5. ÍNDICES BÁSICOS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_dores_usuario_id ON dores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_treinos_usuario_id ON treinos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_insights_usuario_id ON insights(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- =============================================
-- 6. DADOS INICIAIS DE EXEMPLO
-- =============================================

-- Inserir usuário de teste (apenas se não existir)
INSERT INTO users (nome, email, tipo) 
VALUES ('Admin Test', 'admin@prometeus.com', 'personal_trainer')
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- FINALIZAÇÃO
-- =============================================

COMMIT;

-- Verificar tabelas criadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;