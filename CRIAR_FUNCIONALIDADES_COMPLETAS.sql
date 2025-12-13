-- SCRIPT COMPLETO PARA FUNCIONALIDADES FALTANTES
-- Execute no Supabase SQL Editor

-- 1. TABELA DE CONEXÕES PERSONAL TRAINER
CREATE TABLE IF NOT EXISTS public.personal_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aluno_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'cancelado')),
    data_inicio date DEFAULT CURRENT_DATE,
    data_fim date,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(personal_id, aluno_id)
);

-- 2. TABELA DE SOLICITAÇÕES DE PERSONAL TRAINER
CREATE TABLE IF NOT EXISTS public.personal_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    personal_email text NOT NULL,
    personal_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    mensagem text,
    status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'rejeitado')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. TABELA DE TREINOS ATRIBUÍDOS
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
    status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'pausado', 'cancelado')),
    created_at timestamp with time zone DEFAULT now()
);

-- 4. SISTEMA DE COMUNIDADE
-- Tabela de Posts
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    conteudo text NOT NULL,
    tipo text DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagem', 'video', 'progresso')),
    imagem_url text,
    video_url text,
    tags text[],
    visibilidade text DEFAULT 'publico' CHECK (visibilidade IN ('publico', 'amigos', 'privado')),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conteudo text NOT NULL,
    parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de Likes
CREATE TABLE IF NOT EXISTS public.likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
    autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo text DEFAULT 'like' CHECK (tipo IN ('like', 'love', 'support', 'celebrate')),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, autor_id),
    UNIQUE(comment_id, autor_id),
    CHECK ((post_id IS NOT NULL) != (comment_id IS NOT NULL))
);

-- Tabela de Seguidores
CREATE TABLE IF NOT EXISTS public.follows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seguidor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seguido_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(seguidor_id, seguido_id),
    CHECK (seguidor_id != seguido_id)
);

-- 5. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_personal_connections_personal ON personal_connections(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_connections_aluno ON personal_connections(aluno_id);
CREATE INDEX IF NOT EXISTS idx_personal_requests_email ON personal_requests(personal_email);
CREATE INDEX IF NOT EXISTS idx_personal_requests_aluno ON personal_requests(aluno_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_aluno ON treinos_atribuidos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_personal ON treinos_atribuidos(personal_id);

CREATE INDEX IF NOT EXISTS idx_posts_autor ON posts(autor_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_autor ON comments(autor_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_autor ON likes(autor_id);
CREATE INDEX IF NOT EXISTS idx_follows_seguidor ON follows(seguidor_id);
CREATE INDEX IF NOT EXISTS idx_follows_seguido ON follows(seguido_id);

-- 6. RLS POLICIES
ALTER TABLE personal_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_atribuidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Políticas para conexões
CREATE POLICY "Users can view their connections" ON personal_connections
    FOR SELECT USING (personal_id = auth.uid() OR aluno_id = auth.uid());

CREATE POLICY "Professionals can manage connections" ON personal_connections
    FOR ALL USING (personal_id = auth.uid());

-- Políticas para solicitações
CREATE POLICY "Users can view their requests" ON personal_requests
    FOR SELECT USING (aluno_id = auth.uid() OR personal_id = auth.uid());

CREATE POLICY "Students can create requests" ON personal_requests
    FOR INSERT WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "Professionals can update requests" ON personal_requests
    FOR UPDATE USING (personal_id = auth.uid());

-- Políticas para treinos atribuídos
CREATE POLICY "Users can view their assigned workouts" ON treinos_atribuidos
    FOR SELECT USING (aluno_id = auth.uid() OR personal_id = auth.uid());

CREATE POLICY "Users can assign workouts to themselves" ON treinos_atribuidos
    FOR INSERT WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "Professionals can manage assigned workouts" ON treinos_atribuidos
    FOR ALL USING (personal_id = auth.uid());

-- Políticas para posts (públicos)
CREATE POLICY "Everyone can view public posts" ON posts
    FOR SELECT USING (visibilidade = 'publico' AND ativo = true);

CREATE POLICY "Users can manage their own posts" ON posts
    FOR ALL USING (autor_id = auth.uid());

-- Políticas para comentários
CREATE POLICY "Everyone can view comments on public posts" ON comments
    FOR SELECT USING (
        ativo = true AND 
        post_id IN (
            SELECT id FROM posts WHERE visibilidade = 'publico' AND ativo = true
        )
    );

CREATE POLICY "Users can manage their own comments" ON comments
    FOR ALL USING (autor_id = auth.uid());

-- Políticas para likes
CREATE POLICY "Everyone can view likes on public content" ON likes
    FOR SELECT USING (
        (post_id IN (
            SELECT id FROM posts WHERE visibilidade = 'publico' AND ativo = true
        )) OR
        (comment_id IN (
            SELECT c.id FROM comments c 
            JOIN posts p ON c.post_id = p.id 
            WHERE p.visibilidade = 'publico' AND p.ativo = true AND c.ativo = true
        ))
    );

CREATE POLICY "Users can manage their own likes" ON likes
    FOR ALL USING (autor_id = auth.uid());

-- Políticas para follows
CREATE POLICY "Everyone can view follows" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their follows" ON follows
    FOR ALL USING (seguidor_id = auth.uid());

-- 7. INSERIR DADOS EXEMPLO

-- Posts exemplo
INSERT INTO posts (autor_id, titulo, conteudo, tipo, tags) 
SELECT 
    id,
    'Meu primeiro treino!',
    'Hoje completei meu primeiro treino de lombar. Muito animado com os resultados! 💪',
    'texto',
    ARRAY['treino', 'lombar', 'iniciante']
FROM users 
WHERE tipo = 'aluno' 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO posts (autor_id, titulo, conteudo, tipo, tags)
SELECT 
    id,
    'Dicas para treino de lombar',
    'Pessoal, preparei algumas dicas importantes para treinos de fortalecimento lombar:\n\n1. Sempre aqueça antes\n2. Mantenha a postura correta\n3. Não force além do limite\n\nQualquer dúvida, estou aqui! 👨‍⚕️',
    'texto',
    ARRAY['dicas', 'lombar', 'profissional']
FROM users 
WHERE tipo = 'profissional'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 8. FUNCTIONS ÚTEIS

-- Função para buscar feed de posts
CREATE OR REPLACE FUNCTION get_community_feed(user_id_param uuid DEFAULT NULL, limit_posts integer DEFAULT 20)
RETURNS TABLE (
    id uuid,
    titulo text,
    conteudo text,
    tipo text,
    imagem_url text,
    video_url text,
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
        p.imagem_url,
        p.video_url,
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

-- Função para buscar conexões de personal
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