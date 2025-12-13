-- ==========================================
-- CORREÇÕES PARA O BANCO DE DADOS
-- ==========================================

-- 1. CRIAR TABELA REGISTROS_DOR QUE ESTÁ FALTANDO
CREATE TABLE IF NOT EXISTS public.registros_dor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    localizacao text NOT NULL,
    nivel_dor integer CHECK (nivel_dor BETWEEN 0 AND 10),
    data_registro timestamp with time zone DEFAULT now(),
    observacoes text,
    tipo_registro text DEFAULT 'manual',
    created_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_registros_dor_aluno ON registros_dor(aluno_id);
CREATE INDEX IF NOT EXISTS idx_registros_dor_data ON registros_dor(data_registro);

-- RLS para registros_dor
ALTER TABLE registros_dor ENABLE ROW LEVEL SECURITY;

-- Política permissiva para usuários gerenciarem seus próprios registros
CREATE POLICY "Users can manage their own pain records" ON registros_dor
    FOR ALL USING (aluno_id = auth.uid());

-- 2. ADICIONAR CAMPO META_SEMANAL EM USER_PROFILES SE NÃO EXISTIR
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'meta_semanal'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN meta_semanal integer DEFAULT 3;
    END IF;
END $$;

-- 3. ADICIONAR OUTROS CAMPOS ÚTEIS EM USER_PROFILES SE NÃO EXISTIREM
DO $$ 
BEGIN
    -- Objetivo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'objetivo'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN objetivo text;
    END IF;
    
    -- Data de nascimento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'data_nascimento'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN data_nascimento date;
    END IF;
    
    -- Telefone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'telefone'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN telefone text;
    END IF;
END $$;

-- 4. CORRIGIR POLÍTICAS RLS MUITO RESTRITIVAS
-- Remover política restritiva do user_profiles
DROP POLICY IF EXISTS "Users can view and update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;

-- Criar política mais permissiva
CREATE POLICY "Users manage own profile data" ON user_profiles
    FOR ALL USING (id = auth.uid());

-- 5. PERMITIR INSERÇÕES EM EXECUCOES_TREINO SEM TREINO_ATRIBUIDO_ID
-- Tornar treino_atribuido_id opcional para treinos autogerenciados
ALTER TABLE execucoes_treino ALTER COLUMN treino_atribuido_id DROP NOT NULL;

-- 6. POLÍTICA PERMISSIVA PARA EXECUCOES_TREINO
DROP POLICY IF EXISTS "Users can manage own workout sessions" ON execucoes_treino;
CREATE POLICY "Users manage own workout sessions" ON execucoes_treino
    FOR ALL USING (cliente_id = auth.uid());

-- 7. POLÍTICA PERMISSIVA PARA FEEDBACK_TREINO
DROP POLICY IF EXISTS "Users can manage own feedback" ON feedback_treino;
CREATE POLICY "Users manage own workout feedback" ON feedback_treino
    FOR ALL USING (cliente_id = auth.uid());

-- 8. POLÍTICA PERMISSIVA PARA TREINOS_ATRIBUIDOS
DROP POLICY IF EXISTS "Users can manage own assigned workouts" ON treinos_atribuidos;
CREATE POLICY "Users manage own assigned workouts" ON treinos_atribuidos
    FOR ALL USING (aluno_id = auth.uid());

-- 9. ATUALIZAR USER_PROFILES COM DADOS DOS USERS
INSERT INTO user_profiles (id, nome, email, tipo, meta_semanal, objetivo)
SELECT 
    u.id,
    u.nome,
    u.email,
    u.tipo,
    CASE WHEN u.tipo = 'aluno' THEN 3 ELSE NULL END as meta_semanal,
    CASE WHEN u.tipo = 'aluno' THEN 'Melhorar condicionamento físico' ELSE NULL END as objetivo
FROM users u
WHERE u.id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    tipo = EXCLUDED.tipo,
    meta_semanal = COALESCE(user_profiles.meta_semanal, EXCLUDED.meta_semanal),
    objetivo = COALESCE(user_profiles.objetivo, EXCLUDED.objetivo);

-- 10. CRIAR FUNÇÃO PARA CALCULAR STATS REAIS
CREATE OR REPLACE FUNCTION get_user_real_stats(user_id_param uuid)
RETURNS TABLE (
    tempo_total_exercicio_min integer,
    registros_dor_mes integer,
    treinos_semana integer,
    streak_dias integer,
    meta_semanal integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Tempo total de exercício (últimos 30 dias)
        COALESCE(SUM(et.tempo_total_min), 0)::integer as tempo_total_exercicio_min,
        
        -- Registros de dor este mês
        (SELECT COUNT(*)::integer 
         FROM registros_dor rd 
         WHERE rd.aluno_id = user_id_param 
         AND rd.data_registro >= date_trunc('month', CURRENT_DATE))::integer as registros_dor_mes,
        
        -- Treinos esta semana
        (SELECT COUNT(*)::integer 
         FROM execucoes_treino et2 
         WHERE et2.cliente_id = user_id_param 
         AND et2.finalizado = true
         AND et2.data_execucao >= date_trunc('week', CURRENT_DATE))::integer as treinos_semana,
        
        -- Streak (dias consecutivos) - simplificado
        (SELECT COUNT(DISTINCT DATE(et3.data_execucao))::integer 
         FROM execucoes_treino et3 
         WHERE et3.cliente_id = user_id_param 
         AND et3.finalizado = true
         AND et3.data_execucao >= CURRENT_DATE - INTERVAL '7 days')::integer as streak_dias,
        
        -- Meta semanal do usuário
        COALESCE((SELECT up.meta_semanal FROM user_profiles up WHERE up.id = user_id_param), 3)::integer as meta_semanal
        
    FROM execucoes_treino et
    WHERE et.cliente_id = user_id_param 
    AND et.finalizado = true
    AND et.data_execucao >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. LIMPAR DADOS MOCKADOS QUE POSSAM EXISTIR
DELETE FROM execucoes_treino 
WHERE exercicios_realizados::text LIKE '%mock%' 
OR exercicios_realizados::text LIKE '%demo%';

DELETE FROM registros_dor 
WHERE observacoes LIKE '%mock%' 
OR observacoes LIKE '%demo%'
OR observacoes LIKE '%teste%';

-- 12. GRANT PERMISSIONS PARA A FUNÇÃO
GRANT EXECUTE ON FUNCTION get_user_real_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_real_stats TO anon;