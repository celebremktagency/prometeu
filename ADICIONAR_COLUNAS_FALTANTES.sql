-- ADICIONAR COLUNAS FALTANTES ÀS TABELAS EXISTENTES
-- Execute no Supabase SQL Editor

-- 1. ADICIONAR COLUNAS FALTANTES EM WORKOUT_TEMPLATES
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS biblioteca_id uuid REFERENCES workout_libraries(id) ON DELETE SET NULL;
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 2. VERIFICAR SE TREINOS TEM YOUTUBE_URL
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS youtube_url text;

-- 3. ATUALIZAR FUNÇÃO DE BIBLIOTECAS PARA FUNCIONAR MESMO SEM BIBLIOTECA_ID
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
        COALESCE(
            (SELECT COUNT(*) 
             FROM workout_templates wt 
             WHERE wt.biblioteca_id = wl.id 
             AND wt.ativo = true),
            0::bigint
        ) as workout_count,
        wl.created_at
    FROM workout_libraries wl
    WHERE wl.ativo = true
    ORDER BY wl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. INSERIR TREINOS EXEMPLO PARA AS BIBLIOTECAS
DO $$
DECLARE
    lombar_id uuid;
    cervical_id uuid;
BEGIN
    -- Buscar IDs das bibliotecas
    SELECT id INTO lombar_id FROM workout_libraries WHERE nome LIKE '%Lombar%' LIMIT 1;
    SELECT id INTO cervical_id FROM workout_libraries WHERE nome LIKE '%Cervical%' LIMIT 1;
    
    -- Inserir treinos para biblioteca lombar se existir
    IF lombar_id IS NOT NULL THEN
        INSERT INTO workout_templates (
            nome, descricao, objetivo, tipo_treino, nivel_dificuldade, 
            duracao_estimada_min, frequencia_semanal, youtube_url, 
            biblioteca_id, publico, ativo, created_by
        ) VALUES
        (
            'Treino de Costa na Prancha', 
            'Fortalecimento lombar em posição neutra com progressão gradual',
            'Fortalecer musculatura lombar profunda',
            'reabilitacao',
            'iniciante',
            20,
            3,
            'https://www.youtube.com/watch?v=exemplo1',
            lombar_id,
            true,
            true,
            NULL
        ),
        (
            'Treino de Costa Agachamento', 
            'Agachamento assistido para lombar com apoio na parede',
            'Fortalecer lombar com movimento funcional',
            'reabilitacao',
            'iniciante',
            25,
            3,
            'https://www.youtube.com/watch?v=exemplo2',
            lombar_id,
            true,
            true,
            NULL
        ),
        (
            'Mobilização Lombar Suave', 
            'Exercícios de mobilização para alívio de tensão lombar',
            'Melhorar mobilidade e reduzir dor',
            'reabilitacao',
            'iniciante',
            15,
            5,
            'https://www.youtube.com/watch?v=exemplo3',
            lombar_id,
            true,
            true,
            NULL
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Inserir treinos para biblioteca cervical se existir
    IF cervical_id IS NOT NULL THEN
        INSERT INTO workout_templates (
            nome, descricao, objetivo, tipo_treino, nivel_dificuldade, 
            duracao_estimada_min, frequencia_semanal, youtube_url, 
            biblioteca_id, publico, ativo, created_by
        ) VALUES
        (
            'Alongamento Cervical Office', 
            'Alongamentos para quem trabalha no escritório',
            'Aliviar tensão cervical do trabalho',
            'alongamento',
            'iniciante',
            10,
            5,
            'https://www.youtube.com/watch?v=exemplo4',
            cervical_id,
            true,
            true,
            NULL
        ),
        (
            'Fortalecimento Pescoço', 
            'Fortalecimento da musculatura cervical',
            'Fortalecer músculos do pescoço',
            'fortalecimento',
            'intermediario',
            15,
            3,
            'https://www.youtube.com/watch?v=exemplo5',
            cervical_id,
            true,
            true,
            NULL
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 5. VERIFICAR SE TUDO ESTÁ FUNCIONANDO
SELECT 'Workout templates com biblioteca_id:' as info, COUNT(*) as count 
FROM workout_templates WHERE biblioteca_id IS NOT NULL
UNION ALL
SELECT 'Bibliotecas criadas:' as info, COUNT(*) as count 
FROM workout_libraries WHERE ativo = true;