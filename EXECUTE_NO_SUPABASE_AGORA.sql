-- ==========================================
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- ==========================================

-- 1. ADICIONAR CAMPOS EM USER_PROFILES
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS meta_semanal integer DEFAULT 3;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS objetivo text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS data_nascimento date;

-- 2. ADICIONAR CAMPOS EM TREINOS PARA BIBLIOTECA PESSOAL
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'personalizado';
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS duracao_min integer DEFAULT 30;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS nivel text DEFAULT 'iniciante';
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES users(id);
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS publico boolean DEFAULT false;

-- 3. FUNÇÃO PARA CALCULAR STATS REAIS
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
        COALESCE(SUM(et.tempo_total_min), 0)::integer as tempo_total_exercicio_min,
        
        (SELECT COUNT(*)::integer 
         FROM registros_dor rd 
         WHERE rd.aluno_id = user_id_param 
         AND rd.data_registro >= date_trunc('month', CURRENT_DATE))::integer as registros_dor_mes,
        
        (SELECT COUNT(*)::integer 
         FROM execucoes_treino et2 
         WHERE et2.cliente_id = user_id_param 
         AND et2.finalizado = true
         AND et2.data_execucao >= date_trunc('week', CURRENT_DATE))::integer as treinos_semana,
        
        (SELECT COUNT(DISTINCT DATE(et3.data_execucao))::integer 
         FROM execucoes_treino et3 
         WHERE et3.cliente_id = user_id_param 
         AND et3.finalizado = true
         AND et3.data_execucao >= CURRENT_DATE - INTERVAL '7 days')::integer as streak_dias,
        
        COALESCE((SELECT up.meta_semanal FROM user_profiles up WHERE up.id = user_id_param), 3)::integer as meta_semanal
        
    FROM execucoes_treino et
    WHERE et.cliente_id = user_id_param 
    AND et.finalizado = true
    AND et.data_execucao >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. PERMITIR EXECUÇÕES SEM TREINO_ATRIBUIDO_ID
ALTER TABLE execucoes_treino ALTER COLUMN treino_atribuido_id DROP NOT NULL;

-- 5. POLÍTICAS RLS PERMISSIVAS
DROP POLICY IF EXISTS "Users manage own profile data" ON user_profiles;
CREATE POLICY "Users manage own profile data" ON user_profiles
    FOR ALL USING (id = auth.uid());

DROP POLICY IF EXISTS "Users manage own workout sessions" ON execucoes_treino;
CREATE POLICY "Users manage own workout sessions" ON execucoes_treino
    FOR ALL USING (cliente_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own workout feedback" ON feedback_treino;
CREATE POLICY "Users manage own workout feedback" ON feedback_treino
    FOR ALL USING (cliente_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own assigned workouts" ON treinos_atribuidos;
CREATE POLICY "Users manage own assigned workouts" ON treinos_atribuidos
    FOR ALL USING (aluno_id = auth.uid());

-- Política para treinos (permitir ver todos os públicos + próprios)
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and create workouts" ON treinos;
CREATE POLICY "Users can view and create workouts" ON treinos
    FOR ALL USING (publico = true OR criado_por = auth.uid() OR criado_por IS NULL);

-- 6. GRANTS PARA FUNÇÃO
GRANT EXECUTE ON FUNCTION get_user_real_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_real_stats TO anon;

-- 7. POPULAR USER_PROFILES COM DADOS DOS USERS
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

-- 8. ADICIONAR ALGUNS TREINOS EXEMPLO COM YOUTUBE
INSERT INTO treinos (exercicio, descricao, categoria, duracao_min, nivel, youtube_url, publico) VALUES
('Alongamento Básico', 'Série de alongamentos para todo o corpo', 'flexibilidade', 15, 'iniciante', 'https://youtube.com/watch?v=example1', true),
('Cardio Leve', 'Exercícios cardiovasculares de baixo impacto', 'cardio', 20, 'iniciante', 'https://youtube.com/watch?v=example2', true),
('Fortalecimento Core', 'Exercícios para fortalecimento do abdômen e lombar', 'fortalecimento', 25, 'intermediario', 'https://youtube.com/watch?v=example3', true),
('Mobilidade Articular', 'Exercícios para melhorar mobilidade das articulações', 'mobilidade', 20, 'iniciante', 'https://youtube.com/watch?v=example4', true)
ON CONFLICT DO NOTHING;