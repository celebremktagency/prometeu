-- ============================================
-- CRIAR TABELAS NECESSÁRIAS PARA SISTEMA DE AVALIAÇÃO DE TREINOS
-- Baseado na verificação direta do Supabase em 2025-12-12
-- ============================================

-- ============================================
-- 1. TABELA DE RESUMO DE SESSÕES DE TREINO
-- ============================================
CREATE TABLE IF NOT EXISTS workout_session_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    workout_template_id UUID, -- Pode referenciar treinos existentes
    
    -- Dados da sessão
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_duration_minutes INTEGER,
    
    -- AVALIAÇÃO PRÉ-TREINO
    recovery_perception INTEGER CHECK (recovery_perception >= 1 AND recovery_perception <= 10), -- 1=muito cansado, 10=totalmente recuperado
    has_pain_before BOOLEAN DEFAULT false,
    pain_location_before TEXT, -- localização da dor antes do treino
    pain_intensity_eva_before INTEGER CHECK (pain_intensity_eva_before >= 0 AND pain_intensity_eva_before <= 10), -- Escala EVA 0-10
    
    -- AVALIAÇÃO PÓS-TREINO
    overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 7), -- 1=péssimo, 7=excelente (sistema de emojis)
    effort_perception_rpe INTEGER CHECK (effort_perception_rpe >= 1 AND effort_perception_rpe <= 10), -- RPE simplificado 1-10
    discomfort_level INTEGER CHECK (discomfort_level >= 1 AND discomfort_level <= 10), -- 1=nenhum, 10=extremo desconforto
    
    -- Dados complementares
    workout_notes TEXT, -- notas do usuário
    trainer_notes TEXT, -- notas do personal trainer
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('started', 'paused', 'completed', 'abandoned')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TABELA DE FEEDBACK DE EXERCÍCIOS
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    workout_session_id UUID REFERENCES workout_session_summary(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL, -- nome do exercício
    
    -- Feedback do exercício específico
    series_completed INTEGER DEFAULT 0, -- número de séries completadas
    series_planned INTEGER, -- número de séries planejadas
    reps_completed INTEGER[], -- array com repetições por série
    weight_used_kg DECIMAL(5,2)[], -- array com pesos utilizados por série
    
    -- Avaliação do exercício
    exercise_rating INTEGER CHECK (exercise_rating >= 1 AND exercise_rating <= 5), -- 1-5 estrelas
    difficulty_perceived INTEGER CHECK (difficulty_perceived >= 1 AND difficulty_perceived <= 5), -- 1=muito fácil, 5=muito difícil
    pain_during_exercise INTEGER CHECK (pain_during_exercise >= 0 AND pain_during_exercise <= 10), -- dor durante exercício
    
    -- Feedback textual
    exercise_notes TEXT,
    technique_feedback TEXT, -- feedback do personal sobre técnica
    
    -- Status e controle
    exercise_completed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para workout_session_summary
CREATE INDEX IF NOT EXISTS idx_workout_session_summary_user_id ON workout_session_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_session_summary_started_at ON workout_session_summary(started_at);
CREATE INDEX IF NOT EXISTS idx_workout_session_summary_status ON workout_session_summary(status);

-- Índices para exercise_feedback
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_user_id ON exercise_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_session_id ON exercise_feedback(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_exercise_name ON exercise_feedback(exercise_name);
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_created_at ON exercise_feedback(created_at);

-- ============================================
-- 4. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS
ALTER TABLE workout_session_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas para workout_session_summary
CREATE POLICY "Users can manage their own workout sessions" ON workout_session_summary
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para professionals verem sessões de seus clientes
CREATE POLICY "Professionals can view client sessions" ON workout_session_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM personal_aluno pa
            WHERE pa.personal_id = auth.uid() 
            AND pa.aluno_id = workout_session_summary.user_id
            AND pa.status = 'ativo'
        )
    );

-- Políticas para professionals adicionarem notas às sessões de clientes
CREATE POLICY "Professionals can add notes to client sessions" ON workout_session_summary
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM personal_aluno pa
            WHERE pa.personal_id = auth.uid() 
            AND pa.aluno_id = workout_session_summary.user_id
            AND pa.status = 'ativo'
        )
    );

-- Políticas para exercise_feedback
CREATE POLICY "Users can manage their own exercise feedback" ON exercise_feedback
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para professionals verem feedback de exercícios de seus clientes
CREATE POLICY "Professionals can view client exercise feedback" ON exercise_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM personal_aluno pa
            WHERE pa.personal_id = auth.uid() 
            AND pa.aluno_id = exercise_feedback.user_id
            AND pa.status = 'ativo'
        )
    );

-- Políticas para professionals adicionarem feedback técnico
CREATE POLICY "Professionals can add technique feedback" ON exercise_feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM personal_aluno pa
            WHERE pa.personal_id = auth.uid() 
            AND pa.aluno_id = exercise_feedback.user_id
            AND pa.status = 'ativo'
        )
    );

-- ============================================
-- 5. TRIGGER PARA ATUALIZAR updated_at
-- ============================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualização automática
CREATE TRIGGER update_workout_session_summary_updated_at 
    BEFORE UPDATE ON workout_session_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_feedback_updated_at 
    BEFORE UPDATE ON exercise_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. DADOS DE EXEMPLO/TESTE
-- ============================================

-- Inserir exemplos apenas se não houver dados
INSERT INTO workout_session_summary (
    user_id, 
    recovery_perception, 
    has_pain_before, 
    overall_satisfaction, 
    effort_perception_rpe, 
    discomfort_level,
    workout_notes,
    status
)
SELECT 
    user_id,
    8, -- boa recuperação
    false, -- sem dor
    6, -- muito satisfeito
    7, -- esforço moderado-alto
    2, -- baixo desconforto
    'Sessão de treino completa com avaliações implementadas',
    'completed'
FROM user_profiles 
WHERE tipo = 'aluno'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- COMENTÁRIOS SOBRE A IMPLEMENTAÇÃO
-- ============================================

/*
ESTRUTURA CRIADA PARA SUPORTAR:

1. PRÉ-TREINO:
   - Percepção de recuperação (1-10)
   - Presença de dor (boolean)
   - Localização da dor (texto)
   - Intensidade da dor EVA (0-10)

2. PÓS-TREINO:
   - Satisfação geral (1-7, sistema de emojis)
   - Percepção de esforço RPE (1-10)
   - Nível de desconforto (1-10)

3. FEEDBACK POR EXERCÍCIO:
   - Séries e repetições completadas
   - Pesos utilizados
   - Avaliação e dificuldade
   - Dor durante exercício
   - Notas e feedback técnico

4. SEGURANÇA:
   - RLS habilitado
   - Usuários só veem seus dados
   - Professionals podem ver/editar dados de clientes ativos
   
5. PERFORMANCE:
   - Índices otimizados
   - Triggers automáticos para timestamps
*/

-- Fim do script de criação