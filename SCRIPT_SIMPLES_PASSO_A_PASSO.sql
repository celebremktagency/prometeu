-- ============================================
-- SCRIPT SIMPLES - EXECUTAR PASSO A PASSO
-- ============================================

-- PASSO 1: Criar as tabelas principais
-- Execute este bloco primeiro

-- Tabela de templates de treino
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

-- Tabela de relacionamento personal-aluno
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

-- Tabela de treinos atribuídos
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

-- Tabela de curtidas da comunidade
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

-- PASSO 2: Atualizar tabelas existentes
-- Execute este bloco depois

-- Atualizar comunidade_posts
ALTER TABLE comunidade_posts ADD COLUMN IF NOT EXISTS titulo VARCHAR(200);
ALTER TABLE comunidade_posts ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'post';
ALTER TABLE comunidade_posts ADD COLUMN IF NOT EXISTS curtidas INTEGER DEFAULT 0;
ALTER TABLE comunidade_posts ADD COLUMN IF NOT EXISTS visualizacoes INTEGER DEFAULT 0;

-- Atualizar comunidade_comentarios
ALTER TABLE comunidade_comentarios ADD COLUMN IF NOT EXISTS curtidas INTEGER DEFAULT 0;
ALTER TABLE comunidade_comentarios ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comunidade_comentarios(id);

-- PASSO 3: Inserir dados exemplo
-- Execute este bloco depois

INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience, is_public)
VALUES 
  ('Treino Iniciante - Corpo Todo', 'Treino completo para iniciantes focado em movimentos básicos', 1, 30, ARRAY['beginner'], true),
  ('Treino HIIT - Intermediário', 'Treino de alta intensidade para queima de gordura', 3, 25, ARRAY['intermediate'], true),
  ('Treino de Força - Avançado', 'Treino focado em desenvolvimento de força muscular', 5, 45, ARRAY['advanced'], true),
  ('Treino de Reabilitação', 'Treino leve focado em recuperação e mobilidade', 1, 20, ARRAY['beginner', 'rehabilitation'], true)
ON CONFLICT (name) DO NOTHING;

-- PASSO 4: Habilitar RLS e criar políticas básicas
-- Execute este bloco por último

-- Habilitar RLS
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_atribuidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_curtidas ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (mais permissivas)
DROP POLICY IF EXISTS "workout_templates_select_policy" ON workout_templates;
DROP POLICY IF EXISTS "workout_templates_insert_policy" ON workout_templates;

CREATE POLICY "workout_templates_select_policy" ON workout_templates FOR SELECT USING (true);
CREATE POLICY "workout_templates_insert_policy" ON workout_templates FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "personal_aluno_all_policy" ON personal_aluno;
CREATE POLICY "personal_aluno_all_policy" ON personal_aluno FOR ALL USING (
  personal_id = auth.uid() OR aluno_id = auth.uid()
);

DROP POLICY IF EXISTS "treinos_atribuidos_all_policy" ON treinos_atribuidos;
CREATE POLICY "treinos_atribuidos_all_policy" ON treinos_atribuidos FOR ALL USING (
  personal_id = auth.uid() OR aluno_id = auth.uid()
);

DROP POLICY IF EXISTS "comunidade_curtidas_all_policy" ON comunidade_curtidas;
CREATE POLICY "comunidade_curtidas_all_policy" ON comunidade_curtidas FOR ALL USING (
  usuario_id = auth.uid()
);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_workout_templates_public ON workout_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_personal_aluno_personal ON personal_aluno(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_aluno_aluno ON personal_aluno(aluno_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_personal ON treinos_atribuidos(personal_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_aluno ON treinos_atribuidos(aluno_id);

-- Verificação final
SELECT 'Implementação concluída! ✅' as status;