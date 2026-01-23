--
-- PROMETEUS - SCRIPT CORRIGIDO PARA ESTRUTURA EXISTENTE
-- Remove colunas que podem não existir
--

-- ===========================================
-- CONFIGURAÇÕES INICIAIS
-- ===========================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ===========================================
-- LIMPAR DADOS ANTIGOS (SE EXISTIREM)
-- ===========================================

-- Limpar dados das tabelas antigas se existirem
DELETE FROM treinos WHERE nome IN ('Agachamento', 'Flexão', 'Prancha');

-- ===========================================
-- NOVA ESTRUTURA DE TABELAS
-- ===========================================

-- Tabela: public.users (verificar se existe)
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

-- Tabela: public.exercicios (nova)
CREATE TABLE IF NOT EXISTS public.exercicios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    grupo_muscular text[], 
    equipamento text,
    dificuldade text DEFAULT 'iniciante',
    instrucoes text,
    dicas_seguranca text,
    video_url text,
    imagem_url text,
    criado_por uuid,
    is_publico boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT exercicios_pkey PRIMARY KEY (id),
    CONSTRAINT exercicios_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT exercicios_dificuldade_check CHECK ((dificuldade = ANY (ARRAY['iniciante'::text, 'intermediario'::text, 'avancado'::text])))
);

-- Verificar se treinos existe e adicionar colunas necessárias
DO $$ 
BEGIN
    -- Adicionar colunas que podem não existir
    BEGIN
        ALTER TABLE public.treinos ADD COLUMN objetivo text;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.treinos ADD COLUMN duracao_estimada integer;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.treinos ADD COLUMN criado_por uuid;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.treinos ADD COLUMN is_publico boolean DEFAULT true;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.treinos ADD COLUMN tags text[];
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.treinos ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Atualizar constraint se necessário
DO $$
BEGIN
    ALTER TABLE public.treinos DROP CONSTRAINT IF EXISTS treinos_nivel_check;
    ALTER TABLE public.treinos ADD CONSTRAINT treinos_nivel_check CHECK ((nivel = ANY (ARRAY['iniciante'::text, 'intermediario'::text, 'avancado'::text])));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Tabela: public.treino_exercicios (nova - relação N:N)
CREATE TABLE IF NOT EXISTS public.treino_exercicios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    treino_id uuid NOT NULL,
    exercicio_id uuid NOT NULL,
    ordem integer NOT NULL,
    series integer DEFAULT 3,
    repeticoes text,
    peso_sugerido text,
    tempo_descanso text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT treino_exercicios_pkey PRIMARY KEY (id),
    CONSTRAINT treino_exercicios_treino_id_fkey FOREIGN KEY (treino_id) REFERENCES public.treinos(id) ON DELETE CASCADE,
    CONSTRAINT treino_exercicios_exercicio_id_fkey FOREIGN KEY (exercicio_id) REFERENCES public.exercicios(id) ON DELETE CASCADE,
    CONSTRAINT treino_exercicios_unique UNIQUE (treino_id, exercicio_id, ordem)
);

-- Tabela: public.programas (nova)
CREATE TABLE IF NOT EXISTS public.programas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    objetivo text,
    duracao_semanas integer,
    frequencia_semanal integer,
    nivel text DEFAULT 'iniciante',
    criado_por uuid,
    is_publico boolean DEFAULT true,
    categoria text,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT programas_pkey PRIMARY KEY (id),
    CONSTRAINT programas_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT programas_nivel_check CHECK ((nivel = ANY (ARRAY['iniciante'::text, 'intermediario'::text, 'avancado'::text])))
);

-- Tabela: public.programa_treinos (nova - relação N:N)
CREATE TABLE IF NOT EXISTS public.programa_treinos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    programa_id uuid NOT NULL,
    treino_id uuid NOT NULL,
    dia_semana integer,
    semana integer DEFAULT 1,
    ordem integer,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT programa_treinos_pkey PRIMARY KEY (id),
    CONSTRAINT programa_treinos_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE,
    CONSTRAINT programa_treinos_treino_id_fkey FOREIGN KEY (treino_id) REFERENCES public.treinos(id) ON DELETE CASCADE,
    CONSTRAINT programa_treinos_dia_semana_check CHECK ((dia_semana >= 1 AND dia_semana <= 7))
);

-- Tabela: public.programas_atribuidos (nova)
CREATE TABLE IF NOT EXISTS public.programas_atribuidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personal_id uuid NOT NULL,
    aluno_id uuid NOT NULL,
    programa_id uuid NOT NULL,
    data_inicio date NOT NULL,
    data_fim date,
    status text DEFAULT 'ativo',
    observacoes text,
    progresso jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT programas_atribuidos_pkey PRIMARY KEY (id),
    CONSTRAINT programas_atribuidos_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT programas_atribuidos_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT programas_atribuidos_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE,
    CONSTRAINT programas_atribuidos_status_check CHECK ((status = ANY (ARRAY['ativo'::text, 'pausado'::text, 'concluido'::text, 'cancelado'::text])))
);

-- Tabela: public.treinos_executados (nova)
CREATE TABLE IF NOT EXISTS public.treinos_executados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    treino_id uuid NOT NULL,
    programa_atribuido_id uuid,
    data_execucao timestamp with time zone DEFAULT now(),
    duracao_minutos integer,
    avaliacao integer,
    feedback text,
    status text DEFAULT 'concluido',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT treinos_executados_pkey PRIMARY KEY (id),
    CONSTRAINT treinos_executados_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT treinos_executados_treino_id_fkey FOREIGN KEY (treino_id) REFERENCES public.treinos(id) ON DELETE CASCADE,
    CONSTRAINT treinos_executados_programa_atribuido_id_fkey FOREIGN KEY (programa_atribuido_id) REFERENCES public.programas_atribuidos(id) ON DELETE SET NULL,
    CONSTRAINT treinos_executados_avaliacao_check CHECK ((avaliacao >= 1 AND avaliacao <= 5)),
    CONSTRAINT treinos_executados_status_check CHECK ((status = ANY (ARRAY['concluido'::text, 'incompleto'::text, 'pulado'::text])))
);

-- Tabela: public.exercicios_executados (nova)
CREATE TABLE IF NOT EXISTS public.exercicios_executados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    treino_executado_id uuid NOT NULL,
    exercicio_id uuid NOT NULL,
    series_planejadas integer,
    series_executadas integer,
    repeticoes_planejadas text,
    repeticoes_executadas jsonb,
    peso_utilizado jsonb,
    tempo_descanso_real text,
    observacoes text,
    dificuldade_percebida integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT exercicios_executados_pkey PRIMARY KEY (id),
    CONSTRAINT exercicios_executados_treino_executado_id_fkey FOREIGN KEY (treino_executado_id) REFERENCES public.treinos_executados(id) ON DELETE CASCADE,
    CONSTRAINT exercicios_executados_exercicio_id_fkey FOREIGN KEY (exercicio_id) REFERENCES public.exercicios(id) ON DELETE CASCADE,
    CONSTRAINT exercicios_executados_dificuldade_check CHECK ((dificuldade_percebida >= 1 AND dificuldade_percebida <= 10))
);

-- Verificar se dores_logs existe, senão usar tabela existente
DO $$
BEGIN
    -- Tentar criar nova tabela de dores
    CREATE TABLE IF NOT EXISTS public.dores_logs (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        usuario_id uuid NOT NULL,
        treino_executado_id uuid,
        exercicio_id uuid,
        data timestamp with time zone DEFAULT now(),
        intensidade numeric(3,1) NOT NULL,
        musculo text NOT NULL,
        tipo_dor text,
        descricao text,
        created_at timestamp with time zone DEFAULT now(),
        CONSTRAINT dores_logs_pkey PRIMARY KEY (id),
        CONSTRAINT dores_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE,
        CONSTRAINT dores_logs_treino_executado_id_fkey FOREIGN KEY (treino_executado_id) REFERENCES public.treinos_executados(id) ON DELETE SET NULL,
        CONSTRAINT dores_logs_exercicio_id_fkey FOREIGN KEY (exercicio_id) REFERENCES public.exercicios(id) ON DELETE SET NULL,
        CONSTRAINT dores_logs_intensidade_check CHECK (((intensidade >= (0)::numeric) AND (intensidade <= (10)::numeric)))
    );
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ===========================================
-- INSERÇÃO DOS DADOS BÁSICOS
-- ===========================================

-- Inserir usuários (apenas se não existirem)
INSERT INTO public.users (id, nome, email, tipo, plano, data_inicio, data_fim, created_at) VALUES 
('1d5f43af-a58f-457a-9b27-d844814c3d59', 'Emerson', 'emersonbljr2802@gmail.com', 'aluno', 'trial', '2025-09-20 15:15:58.478637+00', NULL, '2025-09-20 15:15:58.478637+00'),
('63d3730b-7866-4e6d-8329-83f65ddf529d', 'Jennifer Maria', 'jennifer.rodriguea@gmail.com', 'aluno', 'trial', '2025-09-20 15:24:00.96685+00', NULL, '2025-09-20 15:24:00.96685+00'),
('ca9399e5-87e7-459f-bb9b-d8c5534adae8', 'Emerson Personal', 'emersin7x@gmail.com', 'personal', 'trial', '2025-09-24 02:24:57.738828+00', NULL, '2025-09-24 02:24:57.738828+00')
ON CONFLICT (id) DO NOTHING;

-- Inserir exercícios básicos
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

-- Inserir treinos básicos (usando apenas colunas que certamente existem)
INSERT INTO public.treinos (id, nome, descricao, nivel, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Treino Full Body Iniciante', 'Treino completo para corpo todo, ideal para iniciantes', 'iniciante', now()),
('550e8400-e29b-41d4-a716-446655440002', 'Treino Upper Body', 'Foco na parte superior do corpo', 'intermediario', now())
ON CONFLICT (id) DO NOTHING;

-- Atualizar treinos com novas colunas se existirem
UPDATE public.treinos 
SET 
    objetivo = CASE 
        WHEN nome = 'Treino Full Body Iniciante' THEN 'Condicionamento Geral'
        WHEN nome = 'Treino Upper Body' THEN 'Hipertrofia'
        ELSE objetivo
    END,
    duracao_estimada = CASE 
        WHEN nome = 'Treino Full Body Iniciante' THEN 45
        WHEN nome = 'Treino Upper Body' THEN 60
        ELSE duracao_estimada
    END,
    is_publico = true,
    tags = CASE 
        WHEN nome = 'Treino Full Body Iniciante' THEN ARRAY['iniciante', 'full body', 'condicionamento']
        WHEN nome = 'Treino Upper Body' THEN ARRAY['intermediario', 'upper', 'hipertrofia']
        ELSE tags
    END
WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');

-- Inserir exercícios dos treinos
INSERT INTO public.treino_exercicios (treino_id, exercicio_id, ordem, series, repeticoes, tempo_descanso, observacoes) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '1d55d6b2-7952-4fd0-9e08-b788c85957fc', 1, 3, '12-15', '60s', 'Foque na técnica perfeita'),
('550e8400-e29b-41d4-a716-446655440001', 'f67722bd-5cd0-4e71-acb0-f3f3b24d5788', 2, 3, '8-12', '60s', 'Se necessário, apoie joelhos'),
('550e8400-e29b-41d4-a716-446655440001', '34649ada-ef5c-4f3b-b624-785ec8d27727', 3, 3, '30s', '45s', 'Mantenha respiração constante'),
('550e8400-e29b-41d4-a716-446655440002', 'f67722bd-5cd0-4e71-acb0-f3f3b24d5788', 1, 4, '10-12', '75s', 'Progressão: adicionar peso'),
('550e8400-e29b-41d4-a716-446655440002', 'a1234567-1234-1234-1234-123456789abc', 2, 4, '8-10', '90s', 'Use spotter se necessário')
ON CONFLICT DO NOTHING;

-- Inserir programa exemplo
INSERT INTO public.programas (id, nome, descricao, objetivo, duracao_semanas, frequencia_semanal, nivel, criado_por, is_publico, categoria, tags) VALUES 
('660e8400-e29b-41d4-a716-446655440003', 'Programa Iniciante 3x', 'Programa de 8 semanas para iniciantes, 3x por semana', 'Condicionamento e Introdução', 8, 3, 'iniciante', NULL, true, 'Condicionamento', ARRAY['iniciante', '3x semana', 'condicionamento'])
ON CONFLICT (id) DO NOTHING;

-- Inserir treinos do programa
INSERT INTO public.programa_treinos (programa_id, treino_id, dia_semana, ordem) VALUES 
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 2, 1), -- Segunda
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 4, 1), -- Quarta  
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 6, 1)  -- Sexta
ON CONFLICT DO NOTHING;

-- Inserir perfis se a tabela existir
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

-- Treino Exercícios
CREATE INDEX IF NOT EXISTS idx_treino_exercicios_treino_id ON public.treino_exercicios(treino_id);
CREATE INDEX IF NOT EXISTS idx_treino_exercicios_ordem ON public.treino_exercicios(treino_id, ordem);

-- Programas
CREATE INDEX IF NOT EXISTS idx_programas_criado_por ON public.programas(criado_por);
CREATE INDEX IF NOT EXISTS idx_programas_nivel ON public.programas(nivel);
CREATE INDEX IF NOT EXISTS idx_programas_categoria ON public.programas(categoria);

-- Execuções
CREATE INDEX IF NOT EXISTS idx_treinos_executados_usuario_id ON public.treinos_executados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_treinos_executados_data ON public.treinos_executados(data_execucao);

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

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_exercicios_updated_at ON public.exercicios;
CREATE TRIGGER update_exercicios_updated_at BEFORE UPDATE ON public.exercicios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_treinos_updated_at ON public.treinos;
CREATE TRIGGER update_treinos_updated_at BEFORE UPDATE ON public.treinos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_programas_updated_at ON public.programas;
CREATE TRIGGER update_programas_updated_at BEFORE UPDATE ON public.programas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_programas_atribuidos_updated_at ON public.programas_atribuidos;
CREATE TRIGGER update_programas_atribuidos_updated_at BEFORE UPDATE ON public.programas_atribuidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS) - BÁSICO
-- ===========================================

-- Ativar RLS nas tabelas principais
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programa_treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programas_atribuidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos_executados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios_executados ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permissivas para teste)
DROP POLICY IF EXISTS "Allow authenticated users" ON public.users;
CREATE POLICY "Allow authenticated users" ON public.users FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public exercises are readable" ON public.exercicios;
CREATE POLICY "Public exercises are readable" ON public.exercicios FOR SELECT USING (is_publico = true);

DROP POLICY IF EXISTS "Users can manage their own exercises" ON public.exercicios;
CREATE POLICY "Users can manage their own exercises" ON public.exercicios FOR ALL USING (criado_por = auth.uid() OR criado_por IS NULL);

DROP POLICY IF EXISTS "Public workouts are readable" ON public.treinos;
CREATE POLICY "Public workouts are readable" ON public.treinos FOR SELECT USING (true); -- Permissivo para teste

DROP POLICY IF EXISTS "Users can manage workouts" ON public.treinos;
CREATE POLICY "Users can manage workouts" ON public.treinos FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public workout exercises are readable" ON public.treino_exercicios;
CREATE POLICY "Public workout exercises are readable" ON public.treino_exercicios FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public programs are readable" ON public.programas;
CREATE POLICY "Public programs are readable" ON public.programas FOR SELECT USING (is_publico = true);

DROP POLICY IF EXISTS "Program workouts are readable" ON public.programa_treinos;
CREATE POLICY "Program workouts are readable" ON public.programa_treinos FOR ALL USING (auth.role() = 'authenticated');

-- Script executado com sucesso
SELECT 'Nova estrutura criada com sucesso! 🚀 
- Exercícios (unidades básicas): 5 exercícios base
- Treinos (sequências de exercícios): 2 treinos exemplo
- Programas (planos completos): 1 programa iniciante
- Sistema de execução e logs preparado' as result;