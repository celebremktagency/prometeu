-- CORREÇÃO DAS FUNÇÕES SQL
-- Execute este script no Supabase SQL Editor

-- 1. REMOVER FUNÇÕES EXISTENTES QUE PODEM TER CONFLITO
DROP FUNCTION IF EXISTS get_community_feed(uuid, integer);
DROP FUNCTION IF EXISTS get_community_feed();
DROP FUNCTION IF EXISTS get_libraries_with_workout_count();
DROP FUNCTION IF EXISTS get_personal_connections(uuid);

-- 2. CRIAR TABELAS BÁSICAS PRIMEIRO
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

CREATE TABLE IF NOT EXISTS public.treinos_atribuidos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    aluno_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    treino_id uuid REFERENCES treinos(id) ON DELETE CASCADE,
    workout_template_id uuid REFERENCES workout_templates(id) ON DELETE CASCADE,
    nome_customizado text,
    observacoes text,
    data_atribuicao timestamp with time zone DEFAULT now(),
    data_inicio date DEFAULT CURRENT_DATE,
    data_fim date,
    dias_semana integer[] DEFAULT '{1,3,5}',
    status text DEFAULT 'ativo',
    created_at timestamp with time zone DEFAULT now()
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

ALTER TABLE treinos_atribuidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for treinos_atribuidos" ON treinos_atribuidos;
CREATE POLICY "Allow all for treinos_atribuidos" ON treinos_atribuidos FOR ALL USING (true);

-- 4. RECRIAR FUNÇÕES COM ASSINATURAS CORRETAS
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
        COALESCE(wt_count.count, 0) as workout_count,
        wl.created_at
    FROM workout_libraries wl
    LEFT JOIN (
        SELECT 
            biblioteca_id,
            COUNT(*) as count
        FROM workout_templates 
        WHERE ativo = true AND biblioteca_id IS NOT NULL
        GROUP BY biblioteca_id
    ) wt_count ON wl.id = wt_count.biblioteca_id
    WHERE wl.ativo = true
    ORDER BY wl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO PARA FEED DA COMUNIDADE
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
        COALESCE(l.likes_count, 0) as likes_count,
        COALESCE(c.comments_count, 0) as comments_count,
        CASE 
            WHEN user_id_param IS NOT NULL THEN 
                EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND autor_id = user_id_param)
            ELSE false
        END as user_liked
    FROM posts p
    JOIN users u ON p.autor_id = u.id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as likes_count 
        FROM likes 
        WHERE post_id IS NOT NULL 
        GROUP BY post_id
    ) l ON p.id = l.post_id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as comments_count 
        FROM comments 
        WHERE ativo = true 
        GROUP BY post_id
    ) c ON p.id = c.post_id
    WHERE p.visibilidade = 'publico' AND p.ativo = true
    ORDER BY p.created_at DESC
    LIMIT limit_posts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO PARA CONEXÕES DE PERSONAL
CREATE OR REPLACE FUNCTION get_personal_connections(personal_id_param uuid)
RETURNS TABLE (
    id uuid,
    aluno_id uuid,
    aluno_nome text,
    aluno_email text,
    status text,
    data_inicio date,
    created_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.aluno_id,
        u.nome as aluno_nome,
        u.email as aluno_email,
        pc.status,
        pc.data_inicio,
        pc.created_at
    FROM personal_connections pc
    JOIN users u ON pc.aluno_id = u.id
    WHERE pc.personal_id = personal_id_param
    ORDER BY pc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. INSERIR DADOS EXEMPLO
INSERT INTO workout_libraries (nome, descricao, categoria, publico) VALUES
('Lombar - Lesão', 'Treinos específicos para reabilitação da região lombar', 'lombar', true),
('Cervical - Alívio', 'Exercícios para alívio de tensão cervical', 'cervical', true),
('Joelho - Reabilitação', 'Protocolo de reabilitação para lesões de joelho', 'joelho', true)
ON CONFLICT DO NOTHING;

-- Inserir posts exemplo
INSERT INTO posts (autor_id, titulo, conteudo, tags) 
SELECT 
    id,
    'Bem-vindos à comunidade!',
    'Vamos compartilhar nossos progressos e experiências com treinos de reabilitação!',
    ARRAY['comunidade', 'boas-vindas']
FROM users 
WHERE tipo = 'profissional'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO posts (autor_id, titulo, conteudo, tags) 
SELECT 
    id,
    'Meu primeiro treino!',
    'Hoje completei meu primeiro treino de lombar. Muito animado com os resultados! 💪',
    ARRAY['treino', 'lombar', 'progresso']
FROM users 
WHERE tipo = 'aluno'
LIMIT 1
ON CONFLICT DO NOTHING;