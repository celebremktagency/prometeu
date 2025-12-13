-- Migration para atualizar sistema de treinos e comunidade
-- Usa IF NOT EXISTS e ALTER TABLE para ser seguro se as tabelas já existirem

-- ============================================
-- SISTEMA DE TREINOS ATUALIZADO
-- ============================================

-- Atualizar tabela treinos existente para ser compatível com o novo sistema
DO $$
BEGIN
  -- Verificar se tabela treinos existe e migrar dados se necessário
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'treinos') THEN
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'treinos' AND column_name = 'difficulty_level') THEN
      ALTER TABLE treinos ADD COLUMN difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'treinos' AND column_name = 'estimated_duration_minutes') THEN
      ALTER TABLE treinos ADD COLUMN estimated_duration_minutes INTEGER DEFAULT 30;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'treinos' AND column_name = 'target_audience') THEN
      ALTER TABLE treinos ADD COLUMN target_audience TEXT[] DEFAULT ARRAY['beginner'];
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'treinos' AND column_name = 'is_public') THEN
      ALTER TABLE treinos ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'treinos' AND column_name = 'created_by') THEN
      ALTER TABLE treinos ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;

    -- Mapear níveis antigos para novos
    UPDATE treinos SET difficulty_level = 
      CASE 
        WHEN nivel = 'iniciante' THEN 1
        WHEN nivel = 'intermediario' THEN 3
        WHEN nivel = 'avancado' THEN 5
        ELSE 1
      END
    WHERE difficulty_level IS NULL;
  END IF;
END $$;

-- Criar tabela workout_templates se não existir (baseada na estrutura existente)
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
  estimated_duration_minutes INTEGER DEFAULT 30,
  target_audience TEXT[] DEFAULT ARRAY['beginner'],
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrar dados da tabela treinos para workout_templates se necessário
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'treinos') 
     AND NOT EXISTS (SELECT 1 FROM workout_templates LIMIT 1) THEN
    INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience, is_public, created_at)
    SELECT 
      nome,
      descricao,
      COALESCE(difficulty_level, 1),
      COALESCE(estimated_duration_minutes, 30),
      COALESCE(target_audience, ARRAY['beginner']),
      COALESCE(is_public, true),
      created_at
    FROM treinos;
  END IF;
END $$;

-- ============================================
-- SISTEMA DE COMUNIDADE ATUALIZADO
-- ============================================

-- Atualizar tabela comunidade_posts
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comunidade_posts') THEN
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'comunidade_posts' AND column_name = 'titulo') THEN
      ALTER TABLE comunidade_posts ADD COLUMN titulo VARCHAR(200);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'comunidade_posts' AND column_name = 'tipo') THEN
      ALTER TABLE comunidade_posts ADD COLUMN tipo VARCHAR(50) DEFAULT 'post' CHECK (tipo IN ('post', 'progresso', 'dica', 'duvida'));
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'comunidade_posts' AND column_name = 'curtidas') THEN
      ALTER TABLE comunidade_posts ADD COLUMN curtidas INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'comunidade_posts' AND column_name = 'visualizacoes') THEN
      ALTER TABLE comunidade_posts ADD COLUMN visualizacoes INTEGER DEFAULT 0;
    END IF;
  END IF;
END $$;

-- Atualizar tabela comunidade_comentarios
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comunidade_comentarios') THEN
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'comunidade_comentarios' AND column_name = 'curtidas') THEN
      ALTER TABLE comunidade_comentarios ADD COLUMN curtidas INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'comunidade_comentarios' AND column_name = 'parent_comment_id') THEN
      ALTER TABLE comunidade_comentarios ADD COLUMN parent_comment_id UUID REFERENCES comunidade_comentarios(id);
    END IF;
  END IF;
END $$;

-- Criar tabela de curtidas se não existir
CREATE TABLE IF NOT EXISTS comunidade_curtidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES comunidade_posts(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES comunidade_comentarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_like_target CHECK (
    (post_id IS NOT NULL AND comentario_id IS NULL) OR
    (post_id IS NULL AND comentario_id IS NOT NULL)
  ),
  UNIQUE(usuario_id, post_id),
  UNIQUE(usuario_id, comentario_id)
);

-- ============================================
-- SISTEMA DE PERSONAL TRAINER
-- ============================================

-- Criar tabela de relacionamento personal-aluno se não existir
CREATE TABLE IF NOT EXISTS personal_aluno (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES users(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fim TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(personal_id, aluno_id)
);

-- Migrar dados da tabela existente se houver
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'PersonalAluno') THEN
    INSERT INTO personal_aluno (personal_id, aluno_id, data_inicio, created_at)
    SELECT personal_id, aluno_id, data_inicio, created_at
    FROM PersonalAluno
    ON CONFLICT (personal_id, aluno_id) DO NOTHING;
  END IF;
END $$;

-- Criar tabela de treinos atribuídos se não existir
CREATE TABLE IF NOT EXISTS treinos_atribuidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES users(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES users(id) ON DELETE CASCADE,
  treino_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  data_atribuicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_inicio DATE,
  data_fim DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- POLÍTICAS DE SEGURANÇA RLS
-- ============================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_curtidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_atribuidos ENABLE ROW LEVEL SECURITY;

-- Políticas para workout_templates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_templates' AND policyname = 'workout_templates_select_policy') THEN
    CREATE POLICY "workout_templates_select_policy" ON workout_templates FOR SELECT USING (
      is_public = true OR created_by = auth.uid() OR 
      EXISTS (SELECT 1 FROM personal_aluno WHERE personal_id = auth.uid() AND aluno_id = created_by)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_templates' AND policyname = 'workout_templates_insert_policy') THEN
    CREATE POLICY "workout_templates_insert_policy" ON workout_templates FOR INSERT WITH CHECK (
      created_by = auth.uid() AND
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND tipo IN ('personal_trainer', 'admin'))
    );
  END IF;
END $$;

-- Políticas para comunidade_posts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comunidade_posts' AND policyname = 'comunidade_posts_select_policy') THEN
    CREATE POLICY "comunidade_posts_select_policy" ON comunidade_posts FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comunidade_posts' AND policyname = 'comunidade_posts_insert_policy') THEN
    CREATE POLICY "comunidade_posts_insert_policy" ON comunidade_posts FOR INSERT WITH CHECK (
      usuario_id = auth.uid()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comunidade_posts' AND policyname = 'comunidade_posts_update_policy') THEN
    CREATE POLICY "comunidade_posts_update_policy" ON comunidade_posts FOR UPDATE USING (
      usuario_id = auth.uid()
    );
  END IF;
END $$;

-- Políticas para comunidade_comentarios
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comunidade_comentarios' AND policyname = 'comunidade_comentarios_select_policy') THEN
    CREATE POLICY "comunidade_comentarios_select_policy" ON comunidade_comentarios FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comunidade_comentarios' AND policyname = 'comunidade_comentarios_insert_policy') THEN
    CREATE POLICY "comunidade_comentarios_insert_policy" ON comunidade_comentarios FOR INSERT WITH CHECK (
      usuario_id = auth.uid()
    );
  END IF;
END $$;

-- Políticas para personal_aluno
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_aluno' AND policyname = 'personal_aluno_select_policy') THEN
    CREATE POLICY "personal_aluno_select_policy" ON personal_aluno FOR SELECT USING (
      personal_id = auth.uid() OR aluno_id = auth.uid()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_aluno' AND policyname = 'personal_aluno_insert_policy') THEN
    CREATE POLICY "personal_aluno_insert_policy" ON personal_aluno FOR INSERT WITH CHECK (
      personal_id = auth.uid() AND
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND tipo = 'personal_trainer')
    );
  END IF;
END $$;

-- Políticas para treinos_atribuidos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'treinos_atribuidos' AND policyname = 'treinos_atribuidos_select_policy') THEN
    CREATE POLICY "treinos_atribuidos_select_policy" ON treinos_atribuidos FOR SELECT USING (
      personal_id = auth.uid() OR aluno_id = auth.uid()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'treinos_atribuidos' AND policyname = 'treinos_atribuidos_insert_policy') THEN
    CREATE POLICY "treinos_atribuidos_insert_policy" ON treinos_atribuidos FOR INSERT WITH CHECK (
      personal_id = auth.uid() AND
      EXISTS (SELECT 1 FROM personal_aluno WHERE personal_id = auth.uid() AND aluno_id = treinos_atribuidos.aluno_id AND status = 'ativo')
    );
  END IF;
END $$;

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir treinos exemplo se não existirem
INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience, is_public)
VALUES 
  ('Treino Iniciante - Corpo Todo', 'Treino completo para iniciantes focado em movimentos básicos', 1, 30, ARRAY['beginner'], true),
  ('Treino HIIT - Intermediário', 'Treino de alta intensidade para queima de gordura', 3, 25, ARRAY['intermediate'], true),
  ('Treino de Força - Avançado', 'Treino focado em desenvolvimento de força muscular', 5, 45, ARRAY['advanced'], true),
  ('Treino de Reabilitação', 'Treino leve focado em recuperação e mobilidade', 1, 20, ARRAY['beginner', 'rehabilitation'], true)
ON CONFLICT DO NOTHING;

-- Inserir posts exemplo na comunidade se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM comunidade_posts LIMIT 1) THEN
    INSERT INTO comunidade_posts (usuario_id, titulo, conteudo, tipo)
    SELECT 
      id,
      'Bem-vindos à comunidade!',
      'Este é um espaço para compartilharmos nossas jornadas de saúde e fitness. Vamos nos apoiar mutuamente!',
      'post'
    FROM users
    WHERE email LIKE '%admin%' OR email LIKE '%personal%'
    LIMIT 1;
  END IF;
END $$;