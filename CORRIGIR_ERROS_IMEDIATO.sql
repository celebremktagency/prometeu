-- CORREÇÃO IMEDIATA DOS ERROS
-- Execute este script no Supabase SQL Editor

-- 1. CORRIGIR FOREIGN KEY REFERENCE
-- Se a tabela personal_connections existir, vamos verificar e corrigir
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_connections') THEN
        -- Dropar foreign key constraint problemática se existir
        ALTER TABLE personal_connections DROP CONSTRAINT IF EXISTS personal_connections_personal_id_fkey;
        ALTER TABLE personal_connections DROP CONSTRAINT IF EXISTS personal_connections_aluno_id_fkey;
        
        -- Recriar constraints corretas
        ALTER TABLE personal_connections 
        ADD CONSTRAINT personal_connections_personal_id_fkey 
        FOREIGN KEY (personal_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        ALTER TABLE personal_connections 
        ADD CONSTRAINT personal_connections_aluno_id_fkey 
        FOREIGN KEY (aluno_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign keys corrigidas para personal_connections';
    END IF;
END $$;

-- 2. CRIAR TABELAS BÁSICAS SE NÃO EXISTIREM
CREATE TABLE IF NOT EXISTS public.workout_libraries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    categoria text NOT NULL,
    subcategoria text,
    cor_tema text DEFAULT '#4A90E2',
    criado_por uuid REFERENCES auth.users(id),
    publico boolean DEFAULT false,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personal_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aluno_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text DEFAULT 'ativo',
    data_inicio date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(personal_id, aluno_id)
);

CREATE TABLE IF NOT EXISTS public.personal_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    personal_email text NOT NULL,
    personal_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    mensagem text,
    status text DEFAULT 'pendente',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    conteudo text NOT NULL,
    tipo text DEFAULT 'texto',
    tags text[],
    visibilidade text DEFAULT 'publico',
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conteudo text NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
    autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo text DEFAULT 'like',
    created_at timestamp with time zone DEFAULT now(),
    CHECK ((post_id IS NOT NULL) != (comment_id IS NOT NULL))
);

-- 3. RLS PERMISSIVA PARA TODAS AS TABELAS
ALTER TABLE workout_libraries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for workout_libraries" ON workout_libraries;
CREATE POLICY "Allow all for workout_libraries" ON workout_libraries FOR ALL USING (true);

ALTER TABLE personal_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for personal_connections" ON personal_connections;
CREATE POLICY "Allow all for personal_connections" ON personal_connections FOR ALL USING (true);

ALTER TABLE personal_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for personal_requests" ON personal_requests;
CREATE POLICY "Allow all for personal_requests" ON personal_requests FOR ALL USING (true);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for posts" ON posts;
CREATE POLICY "Allow all for posts" ON posts FOR ALL USING (true);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for comments" ON comments;
CREATE POLICY "Allow all for comments" ON comments FOR ALL USING (true);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for likes" ON likes;
CREATE POLICY "Allow all for likes" ON likes FOR ALL USING (true);

-- 4. FUNÇÃO SIMPLES PARA BIBLIOTECAS
CREATE OR REPLACE FUNCTION get_libraries_with_workout_count()
RETURNS TABLE (
    id uuid,
    nome text,
    descricao text,
    categoria text,
    subcategoria text,
    cor_tema text,
    workout_count bigint,
    created_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wl.id,
        wl.nome,
        wl.descricao,
        wl.categoria,
        wl.subcategoria,
        wl.cor_tema,
        0::bigint as workout_count, -- Temporário, sem JOIN complexo
        wl.created_at
    FROM workout_libraries wl
    WHERE wl.ativo = true
    ORDER BY wl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO SIMPLES PARA FEED DA COMUNIDADE
CREATE OR REPLACE FUNCTION get_community_feed(user_id_param uuid DEFAULT NULL, limit_posts integer DEFAULT 20)
RETURNS TABLE (
    id uuid,
    titulo text,
    conteudo text,
    tipo text,
    tags text[],
    autor_id uuid,
    autor_nome text,
    autor_tipo text,
    created_at timestamp with time zone,
    likes_count bigint,
    comments_count bigint,
    user_liked boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.titulo,
        p.conteudo,
        p.tipo,
        p.tags,
        p.autor_id,
        u.nome as autor_nome,
        u.tipo as autor_tipo,
        p.created_at,
        0::bigint as likes_count, -- Simplificado
        0::bigint as comments_count, -- Simplificado
        false as user_liked
    FROM posts p
    JOIN users u ON p.autor_id = u.id
    WHERE p.visibilidade = 'publico' AND p.ativo = true
    ORDER BY p.created_at DESC
    LIMIT limit_posts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. INSERIR DADOS EXEMPLO
INSERT INTO workout_libraries (nome, descricao, categoria, publico) VALUES
('Lombar - Lesão', 'Treinos específicos para reabilitação da região lombar', 'lombar', true),
('Cervical - Alívio', 'Exercícios para alívio de tensão cervical', 'cervical', true)
ON CONFLICT DO NOTHING;

INSERT INTO posts (autor_id, titulo, conteudo, tags) 
SELECT 
    id,
    'Bem-vindos à comunidade!',
    'Vamos compartilhar nossos progressos e experiências com treinos de reabilitação!',
    ARRAY['comunidade', 'boas-vindas']
FROM users 
LIMIT 1
ON CONFLICT DO NOTHING;