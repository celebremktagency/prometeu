-- SISTEMA DE BIBLIOTECAS HIERÁRQUICAS
-- Execute este script no Supabase SQL Editor

-- 1. CRIAR TABELA DE BIBLIOTECAS DE TREINOS
CREATE TABLE IF NOT EXISTS public.workout_libraries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    categoria text NOT NULL, -- 'lombar', 'cervical', 'joelho', 'ombro', etc.
    subcategoria text, -- 'lesao', 'fortalecimento', 'alongamento', etc.
    cor_tema text DEFAULT '#4A90E2',
    imagem_url text,
    criado_por uuid REFERENCES auth.users(id),
    publico boolean DEFAULT false,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. CRIAR TABELA DE TREINOS INDIVIDUAIS (compatível com treinos existentes)
CREATE TABLE IF NOT EXISTS public.workout_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    objetivo text,
    tipo_treino text DEFAULT 'personalizado',
    nivel_dificuldade text DEFAULT 'iniciante',
    duracao_estimada_min integer DEFAULT 30,
    frequencia_semanal integer DEFAULT 3,
    observacoes_profissional text,
    youtube_url text,
    imagem_url text,
    cor_tema text DEFAULT '#4A90E2',
    biblioteca_id uuid REFERENCES workout_libraries(id) ON DELETE SET NULL,
    criado_por uuid REFERENCES auth.users(id),
    publico boolean DEFAULT false,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_workout_libraries_categoria ON workout_libraries(categoria);
CREATE INDEX IF NOT EXISTS idx_workout_libraries_publico ON workout_libraries(publico);
CREATE INDEX IF NOT EXISTS idx_workout_templates_biblioteca ON workout_templates(biblioteca_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_publico ON workout_templates(publico);

-- 4. RLS POLICIES
ALTER TABLE workout_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- Política permissiva para bibliotecas
DROP POLICY IF EXISTS "Users can view and manage workout libraries" ON workout_libraries;
CREATE POLICY "Users can view and manage workout libraries" ON workout_libraries
    FOR ALL USING (publico = true OR criado_por = auth.uid());

-- Política permissiva para templates
DROP POLICY IF EXISTS "Users can view and manage workout templates" ON workout_templates;
CREATE POLICY "Users can view and manage workout templates" ON workout_templates
    FOR ALL USING (publico = true OR criado_por = auth.uid());

-- 5. MIGRAR DADOS EXISTENTES DA TABELA TREINOS
INSERT INTO workout_templates (
    nome, descricao, tipo_treino, nivel_dificuldade, 
    duracao_estimada_min, youtube_url, criado_por, publico
)
SELECT 
    exercicio as nome,
    descricao,
    COALESCE(categoria, 'personalizado') as tipo_treino,
    COALESCE(nivel, 'iniciante') as nivel_dificuldade,
    COALESCE(duracao_min, 30) as duracao_estimada_min,
    youtube_url,
    criado_por,
    COALESCE(publico, false) as publico
FROM treinos
WHERE exercicio IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. INSERIR BIBLIOTECAS EXEMPLO
INSERT INTO workout_libraries (nome, descricao, categoria, subcategoria, publico) VALUES
('Lombar - Lesão', 'Treinos específicos para reabilitação da região lombar', 'lombar', 'lesao', true),
('Lombar - Fortalecimento', 'Treinos para fortalecimento da musculatura lombar', 'lombar', 'fortalecimento', true),
('Cervical - Alívio de Tensão', 'Exercícios para alívio de tensão cervical', 'cervical', 'alivio', true),
('Joelho - Reabilitação', 'Protocolo de reabilitação para lesões de joelho', 'joelho', 'lesao', true),
('Ombro - Mobilidade', 'Exercícios de mobilidade para ombros', 'ombro', 'mobilidade', true)
ON CONFLICT DO NOTHING;

-- 7. INSERIR TREINOS EXEMPLO ASSOCIADOS ÀS BIBLIOTECAS
DO $$
DECLARE
    lombar_lesao_id uuid;
    lombar_fort_id uuid;
    cervical_id uuid;
BEGIN
    -- Buscar IDs das bibliotecas
    SELECT id INTO lombar_lesao_id FROM workout_libraries WHERE nome = 'Lombar - Lesão' LIMIT 1;
    SELECT id INTO lombar_fort_id FROM workout_libraries WHERE nome = 'Lombar - Fortalecimento' LIMIT 1;
    SELECT id INTO cervical_id FROM workout_libraries WHERE nome = 'Cervical - Alívio de Tensão' LIMIT 1;
    
    -- Inserir treinos para lombar lesão
    IF lombar_lesao_id IS NOT NULL THEN
        INSERT INTO workout_templates (nome, descricao, biblioteca_id, tipo_treino, nivel_dificuldade, duracao_estimada_min, youtube_url, publico) VALUES
        ('Treino de Costa na Prancha', 'Fortalecimento lombar em posição neutra', lombar_lesao_id, 'reabilitacao', 'iniciante', 20, 'https://youtube.com/watch?v=exemplo1', true),
        ('Treino de Costa Agachamento', 'Agachamento assistido para lombar', lombar_lesao_id, 'reabilitacao', 'iniciante', 25, 'https://youtube.com/watch?v=exemplo2', true),
        ('Mobilização Lombar Suave', 'Exercícios de mobilização para alívio', lombar_lesao_id, 'reabilitacao', 'iniciante', 15, 'https://youtube.com/watch?v=exemplo3', true);
    END IF;
    
    -- Inserir treinos para lombar fortalecimento
    IF lombar_fort_id IS NOT NULL THEN
        INSERT INTO workout_templates (nome, descricao, biblioteca_id, tipo_treino, nivel_dificuldade, duracao_estimada_min, youtube_url, publico) VALUES
        ('Deadlift Progressivo', 'Fortalecimento lombar com deadlift', lombar_fort_id, 'fortalecimento', 'intermediario', 35, 'https://youtube.com/watch?v=exemplo4', true),
        ('Core Stability Avançado', 'Exercícios avançados de core', lombar_fort_id, 'fortalecimento', 'avancado', 40, 'https://youtube.com/watch?v=exemplo5', true);
    END IF;
    
    -- Inserir treinos cervicais
    IF cervical_id IS NOT NULL THEN
        INSERT INTO workout_templates (nome, descricao, biblioteca_id, tipo_treino, nivel_dificuldade, duracao_estimada_min, youtube_url, publico) VALUES
        ('Alongamento Cervical Office', 'Alongamentos para quem trabalha no escritório', cervical_id, 'alongamento', 'iniciante', 10, 'https://youtube.com/watch?v=exemplo6', true),
        ('Fortalecimento Pescoço', 'Fortalecimento da musculatura cervical', cervical_id, 'fortalecimento', 'intermediario', 15, 'https://youtube.com/watch?v=exemplo7', true);
    END IF;
END $$;

-- 8. FUNÇÃO PARA BUSCAR BIBLIOTECAS COM CONTADOR DE TREINOS
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
        COUNT(wt.id) as workout_count,
        wl.created_at
    FROM workout_libraries wl
    LEFT JOIN workout_templates wt ON wl.id = wt.biblioteca_id AND wt.ativo = true
    WHERE wl.ativo = true AND (wl.publico = true OR wl.criado_por = auth.uid())
    GROUP BY wl.id, wl.nome, wl.descricao, wl.categoria, wl.subcategoria, wl.cor_tema, wl.created_at
    ORDER BY wl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;