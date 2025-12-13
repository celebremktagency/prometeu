-- ============================================
-- SCRIPT DE IMPLEMENTAÇÃO COMPLETA
-- Sistema de Treinos, Comunidade e Personal Trainer
-- ============================================

-- Executar este script completo no Supabase SQL Editor

-- ============================================
-- 1. SISTEMA DE TREINOS ATUALIZADO
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
      ALTER TABLE treinos ADD COLUMN created_by UUID REFERENCES auth.users(id);
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

-- Criar tabela workout_templates se não existir
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
-- 2. SISTEMA DE COMUNIDADE ATUALIZADO
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
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- 3. SISTEMA DE PERSONAL TRAINER
-- ============================================

-- Criar tabela de relacionamento personal-aluno se não existir
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

-- Criar tabela de treinos atribuídos se não existir
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

-- ============================================
-- 4. POLÍTICAS DE SEGURANÇA RLS
-- ============================================

-- Aguardar um momento para garantir que todas as tabelas foram criadas
-- (PostgreSQL às vezes precisa de um momento para processar as transações)

-- Habilitar RLS nas novas tabelas (aguardar criação das tabelas)
DO $$
BEGIN
  -- Verificar se as tabelas existem antes de aplicar RLS
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_templates') THEN
    ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comunidade_curtidas') THEN
    ALTER TABLE comunidade_curtidas ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'personal_aluno') THEN
    ALTER TABLE personal_aluno ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'treinos_atribuidos') THEN
    ALTER TABLE treinos_atribuidos ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Políticas para workout_templates (verificar se tabela e colunas existem)
DO $$
BEGIN
  -- Só criar políticas se a tabela personal_aluno existir com a coluna status
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_templates') 
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'personal_aluno')
     AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'personal_aluno' AND column_name = 'status') THEN
    
    -- Remover políticas existentes se houver
    DROP POLICY IF EXISTS "workout_templates_select_policy" ON workout_templates;
    DROP POLICY IF EXISTS "workout_templates_insert_policy" ON workout_templates;
    DROP POLICY IF EXISTS "workout_templates_update_policy" ON workout_templates;

    -- Criar novas políticas
    CREATE POLICY "workout_templates_select_policy" ON workout_templates FOR SELECT USING (
      is_public = true OR 
      created_by = auth.uid() OR 
      EXISTS (SELECT 1 FROM personal_aluno WHERE personal_id = created_by AND aluno_id = auth.uid() AND status = 'ativo')
    );

    CREATE POLICY "workout_templates_insert_policy" ON workout_templates FOR INSERT WITH CHECK (
      created_by = auth.uid() AND
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND tipo IN ('personal_trainer', 'admin'))
    );

    CREATE POLICY "workout_templates_update_policy" ON workout_templates FOR UPDATE USING (
      created_by = auth.uid()
    );
    
  ELSE
    -- Política simplificada se personal_aluno não existir ainda
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_templates') THEN
      DROP POLICY IF EXISTS "workout_templates_select_policy" ON workout_templates;
      DROP POLICY IF EXISTS "workout_templates_insert_policy" ON workout_templates;
      DROP POLICY IF EXISTS "workout_templates_update_policy" ON workout_templates;
      
      CREATE POLICY "workout_templates_select_policy" ON workout_templates FOR SELECT USING (
        is_public = true OR created_by = auth.uid()
      );
      
      CREATE POLICY "workout_templates_insert_policy" ON workout_templates FOR INSERT WITH CHECK (
        created_by = auth.uid()
      );
      
      CREATE POLICY "workout_templates_update_policy" ON workout_templates FOR UPDATE USING (
        created_by = auth.uid()
      );
    END IF;
  END IF;
END $$;

-- Políticas para comunidade_posts (atualizar referência para auth.users)
DO $$
BEGIN
  -- Remover políticas existentes
  DROP POLICY IF EXISTS "comunidade_posts_select_policy" ON comunidade_posts;
  DROP POLICY IF EXISTS "comunidade_posts_insert_policy" ON comunidade_posts;
  DROP POLICY IF EXISTS "comunidade_posts_update_policy" ON comunidade_posts;

  -- Recriar políticas
  CREATE POLICY "comunidade_posts_select_policy" ON comunidade_posts FOR SELECT USING (true);
  
  CREATE POLICY "comunidade_posts_insert_policy" ON comunidade_posts FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
  );

  CREATE POLICY "comunidade_posts_update_policy" ON comunidade_posts FOR UPDATE USING (
    usuario_id = auth.uid()
  );

  CREATE POLICY "comunidade_posts_delete_policy" ON comunidade_posts FOR DELETE USING (
    usuario_id = auth.uid()
  );
END $$;

-- Políticas para comunidade_comentarios
DO $$
BEGIN
  DROP POLICY IF EXISTS "comunidade_comentarios_select_policy" ON comunidade_comentarios;
  DROP POLICY IF EXISTS "comunidade_comentarios_insert_policy" ON comunidade_comentarios;
  DROP POLICY IF EXISTS "comunidade_comentarios_update_policy" ON comunidade_comentarios;
  DROP POLICY IF EXISTS "comunidade_comentarios_delete_policy" ON comunidade_comentarios;

  CREATE POLICY "comunidade_comentarios_select_policy" ON comunidade_comentarios FOR SELECT USING (true);
  
  CREATE POLICY "comunidade_comentarios_insert_policy" ON comunidade_comentarios FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
  );

  CREATE POLICY "comunidade_comentarios_update_policy" ON comunidade_comentarios FOR UPDATE USING (
    usuario_id = auth.uid()
  );

  CREATE POLICY "comunidade_comentarios_delete_policy" ON comunidade_comentarios FOR DELETE USING (
    usuario_id = auth.uid()
  );
END $$;

-- Políticas para comunidade_curtidas
DO $$
BEGIN
  DROP POLICY IF EXISTS "comunidade_curtidas_select_policy" ON comunidade_curtidas;
  DROP POLICY IF EXISTS "comunidade_curtidas_insert_policy" ON comunidade_curtidas;
  DROP POLICY IF EXISTS "comunidade_curtidas_delete_policy" ON comunidade_curtidas;

  CREATE POLICY "comunidade_curtidas_select_policy" ON comunidade_curtidas FOR SELECT USING (
    usuario_id = auth.uid()
  );
  
  CREATE POLICY "comunidade_curtidas_insert_policy" ON comunidade_curtidas FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
  );

  CREATE POLICY "comunidade_curtidas_delete_policy" ON comunidade_curtidas FOR DELETE USING (
    usuario_id = auth.uid()
  );
END $$;

-- Políticas para personal_aluno
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'personal_aluno') THEN
    DROP POLICY IF EXISTS "personal_aluno_select_policy" ON personal_aluno;
    DROP POLICY IF EXISTS "personal_aluno_insert_policy" ON personal_aluno;
    DROP POLICY IF EXISTS "personal_aluno_update_policy" ON personal_aluno;

    CREATE POLICY "personal_aluno_select_policy" ON personal_aluno FOR SELECT USING (
      personal_id = auth.uid() OR aluno_id = auth.uid()
    );

    CREATE POLICY "personal_aluno_insert_policy" ON personal_aluno FOR INSERT WITH CHECK (
      personal_id = auth.uid()
    );

    CREATE POLICY "personal_aluno_update_policy" ON personal_aluno FOR UPDATE USING (
      personal_id = auth.uid()
    );
  END IF;
END $$;

-- Políticas para treinos_atribuidos
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'treinos_atribuidos') 
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'personal_aluno') 
     AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'personal_aluno' AND column_name = 'status') THEN
    
    DROP POLICY IF EXISTS "treinos_atribuidos_select_policy" ON treinos_atribuidos;
    DROP POLICY IF EXISTS "treinos_atribuidos_insert_policy" ON treinos_atribuidos;
    DROP POLICY IF EXISTS "treinos_atribuidos_update_policy" ON treinos_atribuidos;

    CREATE POLICY "treinos_atribuidos_select_policy" ON treinos_atribuidos FOR SELECT USING (
      personal_id = auth.uid() OR aluno_id = auth.uid()
    );

    CREATE POLICY "treinos_atribuidos_insert_policy" ON treinos_atribuidos FOR INSERT WITH CHECK (
      personal_id = auth.uid() AND
      EXISTS (SELECT 1 FROM personal_aluno WHERE personal_id = auth.uid() AND aluno_id = treinos_atribuidos.aluno_id AND status = 'ativo')
    );

    CREATE POLICY "treinos_atribuidos_update_policy" ON treinos_atribuidos FOR UPDATE USING (
      personal_id = auth.uid() OR aluno_id = auth.uid()
    );
  ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'treinos_atribuidos') THEN
    -- Políticas simplificadas se personal_aluno não existir
    DROP POLICY IF EXISTS "treinos_atribuidos_select_policy" ON treinos_atribuidos;
    DROP POLICY IF EXISTS "treinos_atribuidos_insert_policy" ON treinos_atribuidos;
    DROP POLICY IF EXISTS "treinos_atribuidos_update_policy" ON treinos_atribuidos;

    CREATE POLICY "treinos_atribuidos_select_policy" ON treinos_atribuidos FOR SELECT USING (
      personal_id = auth.uid() OR aluno_id = auth.uid()
    );

    CREATE POLICY "treinos_atribuidos_insert_policy" ON treinos_atribuidos FOR INSERT WITH CHECK (
      personal_id = auth.uid()
    );

    CREATE POLICY "treinos_atribuidos_update_policy" ON treinos_atribuidos FOR UPDATE USING (
      personal_id = auth.uid() OR aluno_id = auth.uid()
    );
  END IF;
END $$;

-- ============================================
-- 5. DADOS INICIAIS E EXEMPLOS
-- ============================================

-- Inserir treinos exemplo se não existirem
INSERT INTO workout_templates (name, description, difficulty_level, estimated_duration_minutes, target_audience, is_public)
VALUES 
  ('Treino Iniciante - Corpo Todo', 'Treino completo para iniciantes focado em movimentos básicos e fortalecimento geral', 1, 30, ARRAY['beginner'], true),
  ('Treino HIIT - Intermediário', 'Treino de alta intensidade para queima de gordura e condicionamento cardiovascular', 3, 25, ARRAY['intermediate'], true),
  ('Treino de Força - Avançado', 'Treino focado em desenvolvimento de força muscular para atletas experientes', 5, 45, ARRAY['advanced'], true),
  ('Treino de Reabilitação', 'Treino leve focado em recuperação, mobilidade e fortalecimento pós-lesão', 1, 20, ARRAY['beginner', 'rehabilitation'], true),
  ('Treino de Mobilidade', 'Exercícios de alongamento e mobilidade articular para todos os níveis', 1, 15, ARRAY['beginner', 'intermediate', 'advanced'], true)
ON CONFLICT (name) DO NOTHING;

-- Inserir posts exemplo na comunidade se não existirem
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Tentar encontrar um usuário admin ou personal trainer para criar posts iniciais
  SELECT id INTO admin_user_id 
  FROM auth.users u
  JOIN user_profiles up ON u.id = up.user_id 
  WHERE up.tipo IN ('admin', 'personal_trainer')
  LIMIT 1;

  -- Se não encontrar, usar qualquer usuário
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
  END IF;

  -- Inserir posts apenas se houver usuário e não existirem posts
  IF admin_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM comunidade_posts LIMIT 1) THEN
    INSERT INTO comunidade_posts (usuario_id, titulo, conteudo, tipo, curtidas, visualizacoes)
    VALUES 
      (admin_user_id, 'Bem-vindos à Comunidade Prometeus!', 'Este é um espaço para compartilharmos nossas jornadas de saúde e fitness. Vamos nos apoiar mutuamente e celebrar cada conquista!', 'post', 5, 25),
      (admin_user_id, 'Dica: Importância do Aquecimento', 'Nunca pulem o aquecimento! 5-10 minutos podem fazer toda a diferença na prevenção de lesões e no desempenho do treino.', 'dica', 8, 42),
      (admin_user_id, 'Minha primeira semana completa!', 'Consegui completar todos os treinos da semana pela primeira vez. Muito orgulhoso do progresso!', 'progresso', 12, 67);
  END IF;
END $$;

-- ============================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_workout_templates_public ON workout_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_workout_templates_created_by ON workout_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_comunidade_posts_usuario ON comunidade_posts(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comunidade_posts_data ON comunidade_posts(data DESC);
CREATE INDEX IF NOT EXISTS idx_comunidade_comentarios_post ON comunidade_comentarios(post_id);
CREATE INDEX IF NOT EXISTS idx_personal_aluno_personal ON personal_aluno(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_aluno_aluno ON personal_aluno(aluno_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_personal ON treinos_atribuidos(personal_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_aluno ON treinos_atribuidos(aluno_id);

-- ============================================
-- 7. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se todas as tabelas foram criadas
DO $$
BEGIN
  -- Verificar tabelas principais
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_templates') THEN
    RAISE EXCEPTION 'Tabela workout_templates não foi criada';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'personal_aluno') THEN
    RAISE EXCEPTION 'Tabela personal_aluno não foi criada';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'treinos_atribuidos') THEN
    RAISE EXCEPTION 'Tabela treinos_atribuidos não foi criada';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comunidade_curtidas') THEN
    RAISE EXCEPTION 'Tabela comunidade_curtidas não foi criada';
  END IF;

  RAISE NOTICE '✅ Todas as tabelas foram criadas com sucesso!';
  RAISE NOTICE '✅ Sistema de treinos, comunidade e personal trainer implementado!';
  RAISE NOTICE '✅ Execute este script no Supabase SQL Editor para ativar todas as funcionalidades.';
END $$;