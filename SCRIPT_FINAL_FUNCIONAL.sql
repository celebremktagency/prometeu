-- ============================================
-- SCRIPT FINAL FUNCIONAL - UM ARQUIVO SÓ
-- Execute este arquivo completo no Supabase
-- ============================================

-- 1. CRIAR TABELAS PRINCIPAIS
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
  estimated_duration_minutes INTEGER DEFAULT 30,
  target_audience TEXT[] DEFAULT ARRAY['beginner'],
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_aluno (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fim TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(personal_id, aluno_id)
);

CREATE TABLE IF NOT EXISTS treinos_atribuidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  treino_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  data_atribuicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_inicio DATE,
  data_fim DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 2. ATUALIZAR TABELAS EXISTENTES
ALTER TABLE comunidade_posts ADD COLUMN IF NOT EXISTS titulo VARCHAR(200);
ALTER TABLE comunidade_posts ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'post';
ALTER TABLE comunidade_posts ADD COLUMN IF NOT EXISTS curtidas INTEGER DEFAULT 0;
ALTER TABLE comunidade_posts ADD COLUMN IF NOT EXISTS visualizacoes INTEGER DEFAULT 0;

ALTER TABLE comunidade_comentarios ADD COLUMN IF NOT EXISTS curtidas INTEGER DEFAULT 0;
ALTER TABLE comunidade_comentarios ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comunidade_comentarios(id);

-- 3. HABILITAR RLS
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_atribuidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_curtidas ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS (SIMPLES E FUNCIONAIS)
-- workout_templates
DROP POLICY IF EXISTS "workout_templates_select" ON workout_templates;
DROP POLICY IF EXISTS "workout_templates_insert" ON workout_templates;
DROP POLICY IF EXISTS "workout_templates_update" ON workout_templates;

CREATE POLICY "workout_templates_select" ON workout_templates FOR SELECT USING (
  is_public = true OR created_by = auth.uid()
);

CREATE POLICY "workout_templates_insert" ON workout_templates FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "workout_templates_update" ON workout_templates FOR UPDATE USING (
  created_by = auth.uid()
);

-- personal_aluno
DROP POLICY IF EXISTS "personal_aluno_all" ON personal_aluno;
CREATE POLICY "personal_aluno_all" ON personal_aluno FOR ALL USING (
  personal_id = auth.uid() OR aluno_id = auth.uid()
);

-- treinos_atribuidos
DROP POLICY IF EXISTS "treinos_atribuidos_all" ON treinos_atribuidos;
CREATE POLICY "treinos_atribuidos_all" ON treinos_atribuidos FOR ALL USING (
  personal_id = auth.uid() OR aluno_id = auth.uid()
);

-- comunidade_curtidas
DROP POLICY IF EXISTS "comunidade_curtidas_all" ON comunidade_curtidas;
CREATE POLICY "comunidade_curtidas_all" ON comunidade_curtidas FOR ALL USING (
  usuario_id = auth.uid()
);

-- 5. INSERIR DADOS EXEMPLO (apenas se não existirem)
INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience, is_public)
SELECT 'Treino Iniciante - Corpo Todo', 'Treino completo para iniciantes focado em movimentos básicos', 1, 30, ARRAY['beginner'], true
WHERE NOT EXISTS (SELECT 1 FROM workout_templates WHERE name = 'Treino Iniciante - Corpo Todo');

INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience, is_public)
SELECT 'Treino HIIT - Intermediário', 'Treino de alta intensidade para queima de gordura', 3, 25, ARRAY['intermediate'], true
WHERE NOT EXISTS (SELECT 1 FROM workout_templates WHERE name = 'Treino HIIT - Intermediário');

INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience, is_public)
SELECT 'Treino de Força - Avançado', 'Treino focado em desenvolvimento de força muscular', 5, 45, ARRAY['advanced'], true
WHERE NOT EXISTS (SELECT 1 FROM workout_templates WHERE name = 'Treino de Força - Avançado');

INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience, is_public)
SELECT 'Treino de Reabilitação', 'Treino leve focado em recuperação e mobilidade', 1, 20, ARRAY['beginner', 'rehabilitation'], true
WHERE NOT EXISTS (SELECT 1 FROM workout_templates WHERE name = 'Treino de Reabilitação');

INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience, is_public)
SELECT 'Treino de Mobilidade', 'Exercícios de alongamento e mobilidade articular', 1, 15, ARRAY['beginner', 'intermediate'], true
WHERE NOT EXISTS (SELECT 1 FROM workout_templates WHERE name = 'Treino de Mobilidade');

-- 6. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_workout_templates_public ON workout_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_workout_templates_created_by ON workout_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_personal_aluno_personal ON personal_aluno(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_aluno_aluno ON personal_aluno(aluno_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_personal ON treinos_atribuidos(personal_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_aluno ON treinos_atribuidos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_comunidade_posts_usuario ON comunidade_posts(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comunidade_posts_data ON comunidade_posts(data DESC);

-- 7. VERIFICAÇÃO FINAL
SELECT 
  'workout_templates' as tabela,
  (SELECT COUNT(*) FROM workout_templates) as registros
UNION ALL
SELECT 
  'personal_aluno' as tabela,
  (SELECT COUNT(*) FROM personal_aluno) as registros
UNION ALL
SELECT 
  'treinos_atribuidos' as tabela,
  (SELECT COUNT(*) FROM treinos_atribuidos) as registros
UNION ALL
SELECT 
  'comunidade_curtidas' as tabela,
  (SELECT COUNT(*) FROM comunidade_curtidas) as registros;