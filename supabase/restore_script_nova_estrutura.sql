--
-- PROMETEUS - NOVA ESTRUTURA: EXERCÍCIOS → TREINOS → PROGRAMAS
-- Hierarquia correta: Exercício (unidade) → Treino (sequência) → Programa (plano completo)
--

-- ===========================================
-- CONFIGURAÇÕES INICIAIS
-- ===========================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ===========================================
-- NOVA ESTRUTURA DE TABELAS
-- ===========================================

-- 1. TABELA DE USUÁRIOS (mantida igual)
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

-- 2. EXERCÍCIOS (unidades básicas - ex: agachamento, flexão)
CREATE TABLE IF NOT EXISTS public.exercicios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    grupo_muscular text[], -- Array: ['pernas', 'glúteos'] 
    equipamento text, -- ex: 'peso livre', 'máquina', 'peso corporal'
    dificuldade text DEFAULT 'iniciante',
    instrucoes text, -- como executar
    dicas_seguranca text,
    video_url text, -- URL do vídeo demonstrativo
    imagem_url text, -- URL da imagem do exercício
    criado_por uuid, -- personal que criou (NULL = sistema)
    is_publico boolean DEFAULT true, -- exercício público ou privado
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT exercicios_pkey PRIMARY KEY (id),
    CONSTRAINT exercicios_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT exercicios_dificuldade_check CHECK ((dificuldade = ANY (ARRAY['iniciante'::text, 'intermediario'::text, 'avancado'::text])))
);

-- 3. TREINOS (sequência de exercícios - ex: "Treino de Pernas A")
CREATE TABLE IF NOT EXISTS public.treinos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL, -- ex: "Treino Pernas A", "Upper Body"
    descricao text,
    objetivo text, -- ex: "Hipertrofia", "Força", "Resistência"
    duracao_estimada integer, -- em minutos
    nivel text DEFAULT 'iniciante',
    criado_por uuid, -- personal que criou
    is_publico boolean DEFAULT true,
    tags text[], -- ['hipertrofia', 'pernas', 'iniciante']
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT treinos_pkey PRIMARY KEY (id),
    CONSTRAINT treinos_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT treinos_nivel_check CHECK ((nivel = ANY (ARRAY['iniciante'::text, 'intermediario'::text, 'avancado'::text])))
);

-- 4. TREINO_EXERCICIOS (relação N:N entre treinos e exercícios)
CREATE TABLE IF NOT EXISTS public.treino_exercicios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    treino_id uuid NOT NULL,
    exercicio_id uuid NOT NULL,
    ordem integer NOT NULL, -- ordem do exercício no treino (1, 2, 3...)
    series integer DEFAULT 3,
    repeticoes text, -- ex: "12", "8-10", "até falha"
    peso_sugerido text, -- ex: "70% 1RM", "moderado", "40kg"
    tempo_descanso text, -- ex: "60s", "1-2min"
    observacoes text, -- dicas específicas para este exercício no treino
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT treino_exercicios_pkey PRIMARY KEY (id),
    CONSTRAINT treino_exercicios_treino_id_fkey FOREIGN KEY (treino_id) REFERENCES public.treinos(id) ON DELETE CASCADE,
    CONSTRAINT treino_exercicios_exercicio_id_fkey FOREIGN KEY (exercicio_id) REFERENCES public.exercicios(id) ON DELETE CASCADE,
    CONSTRAINT treino_exercicios_unique UNIQUE (treino_id, exercicio_id, ordem)
);

-- 5. PROGRAMAS (planos de treino completos - ex: "Programa Iniciante 4x/semana")
CREATE TABLE IF NOT EXISTS public.programas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL, -- ex: "Programa Hipertrofia 5x", "Cut 6 semanas"
    descricao text,
    objetivo text, -- ex: "Ganho massa muscular", "Perda de peso"
    duracao_semanas integer, -- duração do programa
    frequencia_semanal integer, -- quantos dias por semana
    nivel text DEFAULT 'iniciante',
    criado_por uuid, -- personal que criou
    is_publico boolean DEFAULT true,
    categoria text, -- ex: "Hipertrofia", "Emagrecimento", "Força"
    tags text[], -- ['iniciante', 'hipertrofia', '4x semana']
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT programas_pkey PRIMARY KEY (id),
    CONSTRAINT programas_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT programas_nivel_check CHECK ((nivel = ANY (ARRAY['iniciante'::text, 'intermediario'::text, 'avancado'::text])))
);

-- 6. PROGRAMA_TREINOS (relação N:N entre programas e treinos)
CREATE TABLE IF NOT EXISTS public.programa_treinos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    programa_id uuid NOT NULL,
    treino_id uuid NOT NULL,
    dia_semana integer, -- 1=segunda, 2=terça, etc. (NULL para programas flexíveis)
    semana integer DEFAULT 1, -- qual semana do programa (para progressão)
    ordem integer, -- ordem dentro do dia/semana
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT programa_treinos_pkey PRIMARY KEY (id),
    CONSTRAINT programa_treinos_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE,
    CONSTRAINT programa_treinos_treino_id_fkey FOREIGN KEY (treino_id) REFERENCES public.treinos(id) ON DELETE CASCADE,
    CONSTRAINT programa_treinos_dia_semana_check CHECK ((dia_semana >= 1 AND dia_semana <= 7))
);

-- 7. PROGRAMAS ATRIBUÍDOS (personal atribui programa para aluno)
CREATE TABLE IF NOT EXISTS public.programas_atribuidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personal_id uuid NOT NULL,
    aluno_id uuid NOT NULL,
    programa_id uuid NOT NULL,
    data_inicio date NOT NULL,
    data_fim date,
    status text DEFAULT 'ativo',
    observacoes text,
    progresso jsonb, -- progressos personalizados por semana
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT programas_atribuidos_pkey PRIMARY KEY (id),
    CONSTRAINT programas_atribuidos_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT programas_atribuidos_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT programas_atribuidos_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE,
    CONSTRAINT programas_atribuidos_status_check CHECK ((status = ANY (ARRAY['ativo'::text, 'pausado'::text, 'concluido'::text, 'cancelado'::text])))
);

-- 8. TREINOS EXECUTADOS (log de execução de treinos pelos alunos)
CREATE TABLE IF NOT EXISTS public.treinos_executados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    treino_id uuid NOT NULL,
    programa_atribuido_id uuid, -- se faz parte de um programa atribuído
    data_execucao timestamp with time zone DEFAULT now(),
    duracao_minutos integer, -- tempo real gasto
    avaliacao integer, -- 1-5 estrelas
    feedback text, -- feedback do aluno sobre o treino
    status text DEFAULT 'concluido',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT treinos_executados_pkey PRIMARY KEY (id),
    CONSTRAINT treinos_executados_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT treinos_executados_treino_id_fkey FOREIGN KEY (treino_id) REFERENCES public.treinos(id) ON DELETE CASCADE,
    CONSTRAINT treinos_executados_programa_atribuido_id_fkey FOREIGN KEY (programa_atribuido_id) REFERENCES public.programas_atribuidos(id) ON DELETE SET NULL,
    CONSTRAINT treinos_executados_avaliacao_check CHECK ((avaliacao >= 1 AND avaliacao <= 5)),
    CONSTRAINT treinos_executados_status_check CHECK ((status = ANY (ARRAY['concluido'::text, 'incompleto'::text, 'pulado'::text])))
);

-- 9. EXERCICIOS EXECUTADOS (log detalhado de cada exercício)
CREATE TABLE IF NOT EXISTS public.exercicios_executados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    treino_executado_id uuid NOT NULL,
    exercicio_id uuid NOT NULL,
    series_planejadas integer,
    series_executadas integer,
    repeticoes_planejadas text,
    repeticoes_executadas jsonb, -- array com repetições de cada série: [12, 10, 8]
    peso_utilizado jsonb, -- array com peso de cada série: [50, 50, 45]
    tempo_descanso_real text,
    observacoes text, -- "Última série até falha", "Peso muito leve"
    dificuldade_percebida integer, -- 1-10 (escala de esforço)
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT exercicios_executados_pkey PRIMARY KEY (id),
    CONSTRAINT exercicios_executados_treino_executado_id_fkey FOREIGN KEY (treino_executado_id) REFERENCES public.treinos_executados(id) ON DELETE CASCADE,
    CONSTRAINT exercicios_executados_exercicio_id_fkey FOREIGN KEY (exercicio_id) REFERENCES public.exercicios(id) ON DELETE CASCADE,
    CONSTRAINT exercicios_executados_dificuldade_check CHECK ((dificuldade_percebida >= 1 AND dificuldade_percebida <= 10))
);

-- ===========================================
-- TABELAS DE APOIO (mantidas com ajustes)
-- ===========================================

-- Tabela: public.user_profiles (mantida)
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

-- Tabela: public.dores_logs (ajustada para nova estrutura)
CREATE TABLE IF NOT EXISTS public.dores_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    treino_executado_id uuid, -- referência ao treino executado que causou dor
    exercicio_id uuid, -- exercício específico que causou dor
    data timestamp with time zone DEFAULT now(),
    intensidade numeric(3,1) NOT NULL,
    musculo text NOT NULL,
    tipo_dor text, -- "aguda", "crônica", "fadiga"
    descricao text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dores_logs_pkey PRIMARY KEY (id),
    CONSTRAINT dores_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT dores_logs_treino_executado_id_fkey FOREIGN KEY (treino_executado_id) REFERENCES public.treinos_executados(id) ON DELETE SET NULL,
    CONSTRAINT dores_logs_exercicio_id_fkey FOREIGN KEY (exercicio_id) REFERENCES public.exercicios(id) ON DELETE SET NULL,
    CONSTRAINT dores_logs_intensidade_check CHECK (((intensidade >= (0)::numeric) AND (intensidade <= (10)::numeric)))
);

-- Tabela: public.personal_aluno (mantida)
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

-- Tabelas da comunidade (mantidas)
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

-- Outras tabelas de apoio (mantidas)
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

-- ===========================================
-- DADOS INICIAIS - EXERCÍCIOS BASE
-- ===========================================

INSERT INTO public.users (id, nome, email, tipo, plano, data_inicio, data_fim, created_at) VALUES 
('1d5f43af-a58f-457a-9b27-d844814c3d59', 'Emerson', 'emersonbljr2802@gmail.com', 'aluno', 'trial', '2025-09-20 15:15:58.478637+00', NULL, '2025-09-20 15:15:58.478637+00'),
('63d3730b-7866-4e6d-8329-83f65ddf529d', 'Jennifer Maria', 'jennifer.rodriguea@gmail.com', 'aluno', 'trial', '2025-09-20 15:24:00.96685+00', NULL, '2025-09-20 15:24:00.96685+00'),
('ca9399e5-87e7-459f-bb9b-d8c5534adae8', 'Emerson Personal', 'emersin7x@gmail.com', 'personal', 'trial', '2025-09-24 02:24:57.738828+00', NULL, '2025-09-24 02:24:57.738828+00')
ON CONFLICT (id) DO NOTHING;

-- Exercícios base do sistema
INSERT INTO public.exercicios (id, nome, descricao, grupo_muscular, equipamento, dificuldade, instrucoes, dicas_seguranca, is_publico, created_at) VALUES 
('1d55d6b2-7952-4fd0-9e08-b788c85957fc', 'Agachamento Livre', 'Exercício fundamental para fortalecimento das pernas e glúteos', ARRAY['pernas', 'glúteos', 'core'], 'peso corporal', 'iniciante', 
'1. Fique em pé, pés na largura dos ombros
2. Desça como se fosse sentar numa cadeira
3. Desça até coxas paralelas ao chão
4. Suba controladamente', 
'Mantenha o core contraído, joelhos alinhados com os pés, não deixe as costas curvarem', true, now()),

('f67722bd-5cd0-4e71-acb0-f3f3b24d5788', 'Flexão de Braço', 'Exercício clássico para peito, ombros e tríceps', ARRAY['peito', 'ombros', 'tríceps'], 'peso corporal', 'iniciante',
'1. Posição de prancha, mãos na largura dos ombros
2. Desça o corpo mantendo alinhamento
3. Suba empurrando o chão com as mãos
4. Mantenha core contraído', 
'Não deixe o quadril subir ou descer, mantenha linha reta do calcanhar à cabeça', true, now()),

('34649ada-ef5c-4f3b-b624-785ec8d27727', 'Prancha', 'Exercício isométrico para fortalecimento do core', ARRAY['core', 'ombros'], 'peso corporal', 'iniciante',
'1. Posição de flexão, apoiado nos antebraços
2. Mantenha corpo alinhado
3. Contraia abdômen e glúteos
4. Respire normalmente', 
'Não levante nem abaixe o quadril, mantenha posição neutra da coluna', true, now()),

('a1234567-1234-1234-1234-123456789abc', 'Supino Reto com Barra', 'Exercício principal para desenvolvimento do peito', ARRAY['peito', 'ombros', 'tríceps'], 'barra e peso', 'intermediario',
'1. Deite no banco, pés firmes no chão
2. Pegada na largura dos ombros
3. Desça a barra controladamente até o peito
4. Empurre para cima explosivamente', 
'Use um spotter, não salte a barra no peito, mantenha ombros estáveis', true, now()),

('b2345678-2345-2345-2345-234567890bcd', 'Levantamento Terra', 'Exercício completo para posterior de corpo', ARRAY['posterior', 'pernas', 'core'], 'barra e peso', 'avancado',
'1. Barra próxima às canelas
2. Pegada pronada, largura dos ombros
3. Levante mantendo barra próxima ao corpo
4. Estenda quadris e joelhos simultaneamente', 
'Mantenha costas neutras, core contraído, não arredonde coluna', true, now())
ON CONFLICT (id) DO NOTHING;

-- Treino exemplo
INSERT INTO public.treinos (id, nome, descricao, objetivo, duracao_estimada, nivel, criado_por, is_publico, tags, created_at) VALUES 
('tr001', 'Treino Full Body Iniciante', 'Treino completo para corpo todo, ideal para iniciantes', 'Condicionamento Geral', 45, 'iniciante', NULL, true, ARRAY['iniciante', 'full body', 'condicionamento'], now()),
('tr002', 'Treino Upper Body', 'Foco na parte superior do corpo', 'Hipertrofia', 60, 'intermediario', NULL, true, ARRAY['intermediario', 'upper', 'hipertrofia'], now())
ON CONFLICT (id) DO NOTHING;

-- Exercícios do treino
INSERT INTO public.treino_exercicios (treino_id, exercicio_id, ordem, series, repeticoes, tempo_descanso, observacoes) VALUES 
('tr001', '1d55d6b2-7952-4fd0-9e08-b788c85957fc', 1, 3, '12-15', '60s', 'Foque na técnica perfeita'),
('tr001', 'f67722bd-5cd0-4e71-acb0-f3f3b24d5788', 2, 3, '8-12', '60s', 'Se necessário, apoie joelhos'),
('tr001', '34649ada-ef5c-4f3b-b624-785ec8d27727', 3, 3, '30s', '45s', 'Mantenha respiração constante'),
('tr002', 'f67722bd-5cd0-4e71-acb0-f3f3b24d5788', 1, 4, '10-12', '75s', 'Progressão: adicionar peso'),
('tr002', 'a1234567-1234-1234-1234-123456789abc', 2, 4, '8-10', '90s', 'Use spotter se necessário')
ON CONFLICT DO NOTHING;

-- Programa exemplo
INSERT INTO public.programas (id, nome, descricao, objetivo, duracao_semanas, frequencia_semanal, nivel, criado_por, is_publico, categoria, tags) VALUES 
('pr001', 'Programa Iniciante 3x', 'Programa de 8 semanas para iniciantes, 3x por semana', 'Condicionamento e Introdução', 8, 3, 'iniciante', NULL, true, 'Condicionamento', ARRAY['iniciante', '3x semana', 'condicionamento'])
ON CONFLICT (id) DO NOTHING;

-- Treinos do programa
INSERT INTO public.programa_treinos (programa_id, treino_id, dia_semana, ordem) VALUES 
('pr001', 'tr001', 2, 1), -- Segunda
('pr001', 'tr001', 4, 1), -- Quarta  
('pr001', 'tr001', 6, 1)  -- Sexta
ON CONFLICT DO NOTHING;

-- Perfis
INSERT INTO public.user_profiles (id, user_id, idade, peso, altura, objetivo, nivel_experiencia, dores_existentes, created_at, updated_at) VALUES 
('e380e48c-360d-4ea7-90b9-a5cca9fbc9b2', '1d5f43af-a58f-457a-9b27-d844814c3d59', 22, 66.00, 169.00, 'Ganhar massa muscular', 'Intermediário', '{Nenhuma}', now(), now()),
('afd5a1a4-55f3-48bf-bd43-7d91b3bf360e', '63d3730b-7866-4e6d-8329-83f65ddf529d', 22, 66.00, 169.00, 'Ganhar massa muscular', 'Intermediário', '{Nenhuma}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- ÍNDICES PARA PERFORMANCE
-- ===========================================

-- Exercícios
CREATE INDEX IF NOT EXISTS idx_exercicios_grupo_muscular ON public.exercicios USING GIN(grupo_muscular);
CREATE INDEX IF NOT EXISTS idx_exercicios_criado_por ON public.exercicios(criado_por);
CREATE INDEX IF NOT EXISTS idx_exercicios_is_publico ON public.exercicios(is_publico);

-- Treinos  
CREATE INDEX IF NOT EXISTS idx_treinos_criado_por ON public.treinos(criado_por);
CREATE INDEX IF NOT EXISTS idx_treinos_nivel ON public.treinos(nivel);
CREATE INDEX IF NOT EXISTS idx_treinos_tags ON public.treinos USING GIN(tags);

-- Treino Exercícios
CREATE INDEX IF NOT EXISTS idx_treino_exercicios_treino_id ON public.treino_exercicios(treino_id);
CREATE INDEX IF NOT EXISTS idx_treino_exercicios_ordem ON public.treino_exercicios(treino_id, ordem);

-- Programas
CREATE INDEX IF NOT EXISTS idx_programas_criado_por ON public.programas(criado_por);
CREATE INDEX IF NOT EXISTS idx_programas_nivel ON public.programas(nivel);
CREATE INDEX IF NOT EXISTS idx_programas_categoria ON public.programas(categoria);

-- Programa Treinos
CREATE INDEX IF NOT EXISTS idx_programa_treinos_programa_id ON public.programa_treinos(programa_id);
CREATE INDEX IF NOT EXISTS idx_programa_treinos_dia_semana ON public.programa_treinos(programa_id, dia_semana);

-- Programas Atribuídos
CREATE INDEX IF NOT EXISTS idx_programas_atribuidos_personal_id ON public.programas_atribuidos(personal_id);
CREATE INDEX IF NOT EXISTS idx_programas_atribuidos_aluno_id ON public.programas_atribuidos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_programas_atribuidos_status ON public.programas_atribuidos(status);

-- Execuções
CREATE INDEX IF NOT EXISTS idx_treinos_executados_usuario_id ON public.treinos_executados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_treinos_executados_data ON public.treinos_executados(data_execucao);
CREATE INDEX IF NOT EXISTS idx_exercicios_executados_treino_executado_id ON public.exercicios_executados(treino_executado_id);

-- ===========================================
-- FUNCTIONS E TRIGGERS
-- ===========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_exercicios_updated_at ON public.exercicios;
CREATE TRIGGER update_exercicios_updated_at BEFORE UPDATE ON public.exercicios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_treinos_updated_at ON public.treinos;
CREATE TRIGGER update_treinos_updated_at BEFORE UPDATE ON public.treinos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_programas_updated_at ON public.programas;
CREATE TRIGGER update_programas_updated_at BEFORE UPDATE ON public.programas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_programas_atribuidos_updated_at ON public.programas_atribuidos;
CREATE TRIGGER update_programas_atribuidos_updated_at BEFORE UPDATE ON public.programas_atribuidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON public.user_streaks;
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Ativar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programa_treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programas_atribuidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos_executados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios_executados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dores_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_aluno ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Allow authenticated users" ON public.users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users profiles" ON public.user_profiles FOR ALL USING (auth.role() = 'authenticated');

-- Exercícios: públicos para leitura, só criador pode editar
CREATE POLICY "Public exercises are readable" ON public.exercicios FOR SELECT USING (is_publico = true);
CREATE POLICY "Users can manage their own exercises" ON public.exercicios FOR ALL USING (criado_por = auth.uid());

-- Treinos: públicos para leitura, só criador pode editar  
CREATE POLICY "Public workouts are readable" ON public.treinos FOR SELECT USING (is_publico = true);
CREATE POLICY "Users can manage their own workouts" ON public.treinos FOR ALL USING (criado_por = auth.uid());

-- Relações de treinos são públicas se o treino for público
CREATE POLICY "Public workout exercises are readable" ON public.treino_exercicios FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.treinos WHERE id = treino_id AND is_publico = true)
);

-- Programas: públicos para leitura, só criador pode editar
CREATE POLICY "Public programs are readable" ON public.programas FOR SELECT USING (is_publico = true);
CREATE POLICY "Users can manage their own programs" ON public.programas FOR ALL USING (criado_por = auth.uid());

-- Programa treinos são públicos se o programa for público
CREATE POLICY "Public program workouts are readable" ON public.programa_treinos FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.programas WHERE id = programa_id AND is_publico = true)
);

-- Programas atribuídos: personal e aluno podem ver
CREATE POLICY "Personal and student can see assigned programs" ON public.programas_atribuidos FOR ALL USING (
    personal_id = auth.uid() OR aluno_id = auth.uid()
);

-- Execuções: só o usuário pode ver suas próprias
CREATE POLICY "Users can see their own workout executions" ON public.treinos_executados FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "Users can see their own exercise executions" ON public.exercicios_executados FOR ALL USING (
    EXISTS (SELECT 1 FROM public.treinos_executados WHERE id = treino_executado_id AND usuario_id = auth.uid())
);

-- Dores: só o usuário pode ver suas próprias
CREATE POLICY "Users can see their own pain logs" ON public.dores_logs FOR ALL USING (usuario_id = auth.uid());

-- Personal-Aluno: ambos podem ver
CREATE POLICY "Personal and student relationship" ON public.personal_aluno FOR ALL USING (personal_id = auth.uid() OR aluno_id = auth.uid());

-- Comunidade é pública
CREATE POLICY "Community posts are public" ON public.comunidade_posts FOR SELECT USING (true);
CREATE POLICY "Community comments are public" ON public.comunidade_comentarios FOR SELECT USING (true);
CREATE POLICY "Community likes are public" ON public.comunidade_curtidas FOR SELECT USING (true);

-- Users can create community content
CREATE POLICY "Users can create posts" ON public.comunidade_posts FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Users can create comments" ON public.comunidade_comentarios FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Users can create likes" ON public.comunidade_curtidas FOR INSERT WITH CHECK (usuario_id = auth.uid());

SELECT 'Nova estrutura criada com sucesso! 🎯 
- Exercícios (unidades básicas)
- Treinos (sequências de exercícios)  
- Programas (planos completos)
- Sistema de execução e logs completo' as result;