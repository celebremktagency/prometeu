--
-- PROMETEUS - SCRIPT DE RESTAURAÇÃO SIMPLIFICADO
-- Apenas as tabelas e dados necessários para o funcionamento do app
--

-- ===========================================
-- CONFIGURAÇÕES INICIAIS
-- ===========================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ===========================================
-- TABELAS DO PROMETEUS (APENAS PUBLIC SCHEMA)
-- ===========================================

-- Tabela: public.users
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    email text NOT NULL,
    tipo text NOT NULL,
    plano text DEFAULT 'trial'::text,
    data_inicio timestamp with time zone DEFAULT now(),
    data_fim timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_plano_check CHECK ((plano = ANY (ARRAY['trial'::text, 'mensal'::text, 'anual'::text]))),
    CONSTRAINT users_tipo_check CHECK ((tipo = ANY (ARRAY['personal'::text, 'aluno'::text])))
);

-- Tabela: public.user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    idade integer,
    peso numeric(5,2),
    altura numeric(5,2),
    objetivo text,
    nivel_experiencia text,
    dores_existentes text[],
    localizacao_dores text,
    intensidade_dor integer,
    atividade_fisica_frequencia text,
    medicamentos text,
    restricoes_medicas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT user_profiles_intensidade_dor_check CHECK (((intensidade_dor >= 0) AND (intensidade_dor <= 10))),
    CONSTRAINT user_profiles_nivel_experiencia_check CHECK ((nivel_experiencia = ANY (ARRAY['Iniciante'::text, 'Intermediário'::text, 'Avançado'::text])))
);

-- Tabela: public.treinos  
CREATE TABLE IF NOT EXISTS public.treinos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    tipo text,
    series integer DEFAULT 3,
    repeticoes text DEFAULT '10'::text,
    nivel text DEFAULT 'iniciante'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT treinos_pkey PRIMARY KEY (id),
    CONSTRAINT treinos_nivel_check CHECK ((nivel = ANY (ARRAY['iniciante'::text, 'intermediario'::text, 'avancado'::text])))
);

-- Tabela: public.treinos_logs
CREATE TABLE IF NOT EXISTS public.treinos_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid,
    treino_id uuid,
    data timestamp with time zone DEFAULT now(),
    status text DEFAULT 'planned'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT treinos_logs_pkey PRIMARY KEY (id),
    CONSTRAINT treinos_logs_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'done'::text, 'skipped'::text]))),
    CONSTRAINT treinos_logs_treino_id_fkey FOREIGN KEY (treino_id) REFERENCES public.treinos(id) ON DELETE CASCADE,
    CONSTRAINT treinos_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela: public.dores_logs
CREATE TABLE IF NOT EXISTS public.dores_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid,
    treino_id uuid,
    data timestamp with time zone DEFAULT now(),
    intensidade numeric(3,1) NOT NULL,
    musculo text NOT NULL,
    descricao text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dores_logs_pkey PRIMARY KEY (id),
    CONSTRAINT dores_logs_intensidade_check CHECK (((intensidade >= (0)::numeric) AND (intensidade <= (10)::numeric))),
    CONSTRAINT dores_logs_treino_id_fkey FOREIGN KEY (treino_id) REFERENCES public.treinos(id) ON DELETE SET NULL,
    CONSTRAINT dores_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela: public.personal_aluno
CREATE TABLE IF NOT EXISTS public.personal_aluno (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personal_id uuid,
    aluno_id uuid,
    data_vinculo timestamp with time zone DEFAULT now(),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personal_aluno_pkey PRIMARY KEY (id),
    CONSTRAINT personal_aluno_aluno_id_key UNIQUE (aluno_id),
    CONSTRAINT personal_aluno_check CHECK ((personal_id <> aluno_id)),
    CONSTRAINT personal_aluno_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT personal_aluno_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela: public.treinos_atribuidos
CREATE TABLE IF NOT EXISTS public.treinos_atribuidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personal_id uuid,
    aluno_id uuid,
    treino_id uuid,
    data_atribuicao timestamp with time zone DEFAULT now(),
    data_inicio date,
    data_fim date,
    status text DEFAULT 'ativo'::text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT treinos_atribuidos_pkey PRIMARY KEY (id),
    CONSTRAINT treinos_atribuidos_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT treinos_atribuidos_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT treinos_atribuidos_treino_id_fkey FOREIGN KEY (treino_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela: public.comunidade_posts
CREATE TABLE IF NOT EXISTS public.comunidade_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid,
    conteudo text NOT NULL,
    imagem_url text,
    data timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    titulo text,
    tipo text DEFAULT 'post'::text,
    curtidas integer DEFAULT 0,
    visualizacoes integer DEFAULT 0,
    CONSTRAINT comunidade_posts_pkey PRIMARY KEY (id),
    CONSTRAINT comunidade_posts_conteudo_check CHECK ((length(conteudo) <= 1000)),
    CONSTRAINT comunidade_posts_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela: public.comunidade_comentarios
CREATE TABLE IF NOT EXISTS public.comunidade_comentarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    usuario_id uuid,
    conteudo text NOT NULL,
    data timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    curtidas integer DEFAULT 0,
    parent_comment_id uuid,
    CONSTRAINT comunidade_comentarios_pkey PRIMARY KEY (id),
    CONSTRAINT comunidade_comentarios_conteudo_check CHECK ((length(conteudo) <= 300)),
    CONSTRAINT comunidade_comentarios_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.comunidade_comentarios(id) ON DELETE CASCADE,
    CONSTRAINT comunidade_comentarios_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.comunidade_posts(id) ON DELETE CASCADE,
    CONSTRAINT comunidade_comentarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela: public.comunidade_curtidas
CREATE TABLE IF NOT EXISTS public.comunidade_curtidas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid,
    post_id uuid,
    comentario_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comunidade_curtidas_pkey PRIMARY KEY (id),
    CONSTRAINT comunidade_curtidas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT comunidade_curtidas_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.comunidade_posts(id) ON DELETE CASCADE,
    CONSTRAINT comunidade_curtidas_comentario_id_fkey FOREIGN KEY (comentario_id) REFERENCES public.comunidade_comentarios(id) ON DELETE CASCADE
);

-- Tabela: public.pagamentos
CREATE TABLE IF NOT EXISTS public.pagamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid,
    plano text NOT NULL,
    valor numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text,
    metodo_pagamento text,
    gateway_transaction_id text,
    data_inicio timestamp with time zone NOT NULL,
    data_fim timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pagamentos_pkey PRIMARY KEY (id),
    CONSTRAINT pagamentos_metodo_pagamento_check CHECK ((metodo_pagamento = ANY (ARRAY['cartao'::text, 'pix'::text]))),
    CONSTRAINT pagamentos_plano_check CHECK ((plano = ANY (ARRAY['mensal'::text, 'anual'::text]))),
    CONSTRAINT pagamentos_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'canceled'::text]))),
    CONSTRAINT pagamentos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela: public.user_streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_activity_date date,
    total_workouts integer DEFAULT 0,
    total_workout_minutes integer DEFAULT 0,
    streak_type text DEFAULT 'workout'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_streaks_pkey PRIMARY KEY (id),
    CONSTRAINT user_streaks_streak_type_check CHECK ((streak_type = ANY (ARRAY['workout'::text, 'pain_tracking'::text, 'overall'::text]))),
    CONSTRAINT user_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela: public.workout_templates
CREATE TABLE IF NOT EXISTS public.workout_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    difficulty_level integer DEFAULT 1,
    estimated_duration_minutes integer DEFAULT 30,
    target_audience text[],
    created_by uuid,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT workout_templates_pkey PRIMARY KEY (id),
    CONSTRAINT workout_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT workout_templates_difficulty_level_check CHECK (((difficulty_level >= 1) AND (difficulty_level <= 5)))
);

-- ===========================================
-- INSERÇÃO DOS DADOS EXISTENTES
-- ===========================================

-- Usuários
INSERT INTO public.users (id, nome, email, tipo, plano, data_inicio, data_fim, created_at) VALUES 
('1d5f43af-a58f-457a-9b27-d844814c3d59', 'Emerson', 'emersonbljr2802@gmail.com', 'aluno', 'trial', '2025-09-20 15:15:58.478637+00', NULL, '2025-09-20 15:15:58.478637+00'),
('63d3730b-7866-4e6d-8329-83f65ddf529d', 'Jennifer Maria', 'jennifer.rodriguea@gmail.com', 'aluno', 'trial', '2025-09-20 15:24:00.96685+00', NULL, '2025-09-20 15:24:00.96685+00'),
('ca9399e5-87e7-459f-bb9b-d8c5534adae8', 'Emerson Personal', 'emersin7x@gmail.com', 'personal', 'trial', '2025-09-24 02:24:57.738828+00', NULL, '2025-09-24 02:24:57.738828+00'),
('2495135d-44d3-4252-ba68-e46b5d538374', 'Usuário Teste', 'teste@teste.com', 'aluno', 'trial', '2025-09-24 02:30:00+00', NULL, '2025-09-24 02:30:00+00'),
('11e0a73e-c6ac-44b7-b7e3-9c894d01adfe', 'Usuário Teste 2', 'teste2@teste.com', 'aluno', 'trial', '2025-09-24 03:35:00+00', NULL, '2025-09-24 03:35:00+00')
ON CONFLICT (id) DO NOTHING;

-- Treinos
INSERT INTO public.treinos (id, nome, descricao, tipo, series, repeticoes, nivel, created_at) VALUES 
('1d55d6b2-7952-4fd0-9e08-b788c85957fc', 'Agachamento', 'Exercício para fortalecimento das pernas', 'força', 3, '12', 'iniciante', '2025-09-20 14:54:43.093708+00'),
('f67722bd-5cd0-4e71-acb0-f3f3b24d5788', 'Flexão', 'Exercício para peito e braços', 'força', 3, '10', 'iniciante', '2025-09-20 14:54:43.093708+00'),
('34649ada-ef5c-4f3b-b624-785ec8d27727', 'Prancha', 'Exercício isométrico para core', 'core', 3, '30s', 'iniciante', '2025-09-20 14:54:43.093708+00')
ON CONFLICT (id) DO NOTHING;

-- Perfis de usuário  
INSERT INTO public.user_profiles (id, user_id, idade, peso, altura, objetivo, nivel_experiencia, dores_existentes, localizacao_dores, intensidade_dor, atividade_fisica_frequencia, medicamentos, restricoes_medicas, created_at, updated_at) VALUES 
('e380e48c-360d-4ea7-90b9-a5cca9fbc9b2', '1d5f43af-a58f-457a-9b27-d844814c3d59', 22, 66.00, 169.00, 'Ganhar massa muscular', 'Intermediário', '{Nenhuma}', '', 0, '3-4x por semana', '', '', '2025-09-20 16:19:03.159619+00', '2025-09-20 16:19:03.159619+00'),
('afd5a1a4-55f3-48bf-bd43-7d91b3bf360e', '2495135d-44d3-4252-ba68-e46b5d538374', 22, 66.00, 169.00, 'Ganhar massa muscular', 'Intermediário', '{Nenhuma}', '', 0, '3-4x por semana', '', '', '2025-09-24 02:31:23.709793+00', '2025-09-24 02:31:23.709793+00'),
('83ef7824-c98d-4f11-a753-b92eca77739a', '11e0a73e-c6ac-44b7-b7e3-9c894d01adfe', 22, 66.00, 169.00, 'Ganhar massa muscular', 'Intermediário', '{}', '', 0, '3-4x por semana', '', '', '2025-09-24 03:36:25.244045+00', '2025-09-24 03:36:25.244045+00')
ON CONFLICT (id) DO NOTHING;

-- Workout templates
INSERT INTO public.workout_templates (id, name, description, difficulty_level, estimated_duration_minutes, target_audience, created_by, is_public, created_at) VALUES 
('4755a5c0-a9c7-4422-bfc9-7ec0d3df949e', 'Treino Iniciante - Corpo Todo', 'Treino completo para iniciantes focado em movimentos básicos', 1, 30, '{beginner}', NULL, true, '2025-09-24 02:13:33.59483+00'),
('7099b24d-9dc4-4e76-a746-1dfc515b9204', 'Treino HIIT - Intermediário', 'Treino de alta intensidade para queima de gordura', 3, 25, '{intermediate}', NULL, true, '2025-09-24 02:13:33.59483+00'),
('910e5466-3cb1-4851-bc33-90e73e8fa95e', 'Treino de Força - Avançado', 'Treino focado em desenvolvimento de força muscular', 5, 45, '{advanced}', NULL, true, '2025-09-24 02:13:33.59483+00')
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- ÍNDICES PARA PERFORMANCE
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON public.user_streaks(streak_type);
CREATE INDEX IF NOT EXISTS idx_treinos_logs_usuario_id ON public.treinos_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_dores_logs_usuario_id ON public.dores_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comunidade_posts_usuario_id ON public.comunidade_posts(usuario_id);
CREATE INDEX IF NOT EXISTS idx_personal_aluno_personal_id ON public.personal_aluno(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_aluno_aluno_id ON public.personal_aluno(aluno_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_personal_id ON public.treinos_atribuidos(personal_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_aluno_id ON public.treinos_atribuidos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON public.pagamentos(usuario_id);

-- ===========================================
-- FUNCTIONS E TRIGGERS
-- ===========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON public.user_streaks;
CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON public.user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS) - BÁSICO
-- ===========================================

-- Ativar RLS nas tabelas principais
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dores_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (só para usuários autenticados)
DROP POLICY IF EXISTS "Allow authenticated users" ON public.users;
CREATE POLICY "Allow authenticated users" ON public.users
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users profiles" ON public.user_profiles;
CREATE POLICY "Allow authenticated users profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users treinos_logs" ON public.treinos_logs;
CREATE POLICY "Allow authenticated users treinos_logs" ON public.treinos_logs
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users dores_logs" ON public.dores_logs;
CREATE POLICY "Allow authenticated users dores_logs" ON public.dores_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Treinos e comunidade são públicos
DROP POLICY IF EXISTS "Treinos are public" ON public.treinos;
CREATE POLICY "Treinos are public" ON public.treinos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Community posts are public" ON public.comunidade_posts;
CREATE POLICY "Community posts are public" ON public.comunidade_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Community comments are public" ON public.comunidade_comentarios;
CREATE POLICY "Community comments are public" ON public.comunidade_comentarios
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Workout templates are public" ON public.workout_templates;
CREATE POLICY "Workout templates are public" ON public.workout_templates
  FOR SELECT USING (true);

-- Script executado com sucesso
SELECT 'Prometeus Database restored successfully! 🚀' as result;