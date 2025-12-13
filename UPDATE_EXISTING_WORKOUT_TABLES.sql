-- ============================================
-- ATUALIZAR TABELAS EXISTENTES PARA SISTEMA DE AVALIAÇÃO
-- Baseado na verificação direta do Supabase em 2025-12-12
-- ============================================

-- ============================================
-- 1. ATUALIZAR TABELA execucoes_treino (JÁ EXISTE)
-- Adicionar campos para avaliações pré e pós-treino
-- ============================================

DO $$
BEGIN
    -- CAMPOS PRÉ-TREINO
    -- Percepção de recuperação (1-10)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'recovery_perception'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN recovery_perception INTEGER CHECK (recovery_perception >= 1 AND recovery_perception <= 10);
    END IF;

    -- Presença de dor antes do treino
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'has_pain_before'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN has_pain_before BOOLEAN DEFAULT false;
    END IF;

    -- Localização da dor antes do treino
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'pain_location_before'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN pain_location_before TEXT;
    END IF;

    -- Intensidade da dor EVA (0-10) antes do treino
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'pain_intensity_eva_before'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN pain_intensity_eva_before INTEGER CHECK (pain_intensity_eva_before >= 0 AND pain_intensity_eva_before <= 10);
    END IF;

    -- CAMPOS PÓS-TREINO
    -- Satisfação geral (1-7, sistema de emojis)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'overall_satisfaction'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 7);
    END IF;

    -- Percepção de esforço RPE (já existe rpe_geral, mas vamos padronizar)
    -- Verificar se rpe_geral tem os constraints corretos
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'effort_perception_rpe'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN effort_perception_rpe INTEGER CHECK (effort_perception_rpe >= 1 AND effort_perception_rpe <= 10);
        
        -- Migrar dados do rpe_geral para o novo campo (se houver dados)
        UPDATE execucoes_treino 
        SET effort_perception_rpe = CASE 
            WHEN rpe_geral >= 1 AND rpe_geral <= 10 THEN rpe_geral
            ELSE NULL 
        END
        WHERE rpe_geral IS NOT NULL;
    END IF;

    -- Nível de desconforto (1-10)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'discomfort_level'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN discomfort_level INTEGER CHECK (discomfort_level >= 1 AND discomfort_level <= 10);
    END IF;

    -- Dor depois do treino
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'has_pain_after'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN has_pain_after BOOLEAN DEFAULT false;
    END IF;

    -- Localização da dor depois do treino
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'pain_location_after'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN pain_location_after TEXT;
    END IF;

    -- Intensidade da dor EVA depois do treino
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'pain_intensity_eva_after'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN pain_intensity_eva_after INTEGER CHECK (pain_intensity_eva_after >= 0 AND pain_intensity_eva_after <= 10);
    END IF;

    -- Notas do personal trainer (para feedback técnico)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'execucoes_treino' AND column_name = 'trainer_notes'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD COLUMN trainer_notes TEXT;
    END IF;

    RAISE NOTICE 'Tabela execucoes_treino atualizada com sucesso!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao atualizar execucoes_treino: %', SQLERRM;
END $$;

-- ============================================
-- 2. CRIAR TABELA DE FEEDBACK POR SÉRIE (NOVA)
-- Para capturar o feedback de cada série individual
-- ============================================

CREATE TABLE IF NOT EXISTS series_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execucao_treino_id UUID REFERENCES execucoes_treino(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    series_number INTEGER NOT NULL,
    
    -- Dados da série
    planned_reps INTEGER,
    completed_reps INTEGER,
    planned_weight_kg DECIMAL(5,2),
    used_weight_kg DECIMAL(5,2),
    
    -- Feedback da série (modal pós-série)
    series_completed BOOLEAN DEFAULT true, -- checkbox "Você completou a série?"
    difficulty_perceived INTEGER CHECK (difficulty_perceived >= 1 AND difficulty_perceived <= 5), -- dificuldade percebida 1-5
    pain_during_series INTEGER CHECK (pain_during_series >= 0 AND pain_during_series <= 10), -- dor durante a série
    
    -- Observações
    series_notes TEXT,
    technique_notes TEXT, -- notas do personal sobre técnica
    
    -- Timestamps
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ATUALIZAR TABELA pain_reports (JÁ EXISTE)
-- Adicionar referência para execução de treino se não existir
-- ============================================

DO $$
BEGIN
    -- Adicionar referência para execução de treino
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'pain_reports' AND column_name = 'execucao_treino_id'
    ) THEN
        ALTER TABLE pain_reports 
        ADD COLUMN execucao_treino_id UUID REFERENCES execucoes_treino(id);
    END IF;

    -- Adicionar tipo de avaliação (antes/durante/depois do treino)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'pain_reports' AND column_name = 'assessment_timing'
    ) THEN
        ALTER TABLE pain_reports 
        ADD COLUMN assessment_timing VARCHAR(20) CHECK (assessment_timing IN ('before_workout', 'during_workout', 'after_workout', 'standalone'));
    END IF;

    RAISE NOTICE 'Tabela pain_reports atualizada com sucesso!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao atualizar pain_reports: %', SQLERRM;
END $$;

-- ============================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para execucoes_treino (campos novos)
CREATE INDEX IF NOT EXISTS idx_execucoes_treino_recovery_perception ON execucoes_treino(recovery_perception);
CREATE INDEX IF NOT EXISTS idx_execucoes_treino_has_pain_before ON execucoes_treino(has_pain_before);
CREATE INDEX IF NOT EXISTS idx_execucoes_treino_overall_satisfaction ON execucoes_treino(overall_satisfaction);

-- Índices para series_feedback
CREATE INDEX IF NOT EXISTS idx_series_feedback_execucao_id ON series_feedback(execucao_treino_id);
CREATE INDEX IF NOT EXISTS idx_series_feedback_exercise_name ON series_feedback(exercise_name);
CREATE INDEX IF NOT EXISTS idx_series_feedback_completed_at ON series_feedback(completed_at);

-- Índices para pain_reports (campos novos)
CREATE INDEX IF NOT EXISTS idx_pain_reports_execucao_treino_id ON pain_reports(execucao_treino_id);
CREATE INDEX IF NOT EXISTS idx_pain_reports_assessment_timing ON pain_reports(assessment_timing);

-- ============================================
-- 5. POLÍTICAS RLS PARA NOVAS TABELAS/CAMPOS
-- ============================================

-- Habilitar RLS na nova tabela
ALTER TABLE series_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas para series_feedback
CREATE POLICY "Users can manage their own series feedback" ON series_feedback
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM execucoes_treino et
            WHERE et.id = series_feedback.execucao_treino_id
            AND et.cliente_id = auth.uid()
        )
    );

-- Política para professionals verem feedback de séries dos clientes
CREATE POLICY "Professionals can view client series feedback" ON series_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM execucoes_treino et
            JOIN personal_aluno pa ON pa.aluno_id = et.cliente_id
            WHERE et.id = series_feedback.execucao_treino_id
            AND pa.personal_id = auth.uid()
            AND pa.status = 'ativo'
        )
    );

-- Política para professionals adicionarem feedback técnico
CREATE POLICY "Professionals can add technique feedback to series" ON series_feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM execucoes_treino et
            JOIN personal_aluno pa ON pa.aluno_id = et.cliente_id
            WHERE et.id = series_feedback.execucao_treino_id
            AND pa.personal_id = auth.uid()
            AND pa.status = 'ativo'
        )
    );

-- ============================================
-- 6. TRIGGER PARA ATUALIZAÇÃO DE TIMESTAMP
-- ============================================

-- Função já existe, apenas criar trigger para nova tabela
CREATE TRIGGER update_series_feedback_updated_at 
    BEFORE UPDATE ON series_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. VIEWS ÚTEIS PARA CONSULTAS
-- ============================================

-- View para relatório completo de execução de treino
CREATE OR REPLACE VIEW workout_execution_report AS
SELECT 
    et.id,
    et.cliente_id,
    up.nome as cliente_nome,
    et.data_execucao,
    et.tempo_total_min,
    
    -- Avaliação Pré-Treino
    et.recovery_perception,
    et.has_pain_before,
    et.pain_location_before,
    et.pain_intensity_eva_before,
    
    -- Avaliação Pós-Treino
    et.overall_satisfaction,
    et.effort_perception_rpe,
    et.discomfort_level,
    et.has_pain_after,
    et.pain_location_after,
    et.pain_intensity_eva_after,
    
    -- Dados do Treino
    et.exercicios_realizados,
    et.nivel_dificuldade_percebido,
    et.observacoes_cliente,
    et.trainer_notes,
    et.finalizado,
    et.created_at

FROM execucoes_treino et
JOIN user_profiles up ON up.user_id = et.cliente_id;

-- View para relatório de feedback por série
CREATE OR REPLACE VIEW series_feedback_report AS
SELECT 
    sf.id,
    sf.execucao_treino_id,
    et.cliente_id,
    up.nome as cliente_nome,
    et.data_execucao,
    sf.exercise_name,
    sf.series_number,
    sf.planned_reps,
    sf.completed_reps,
    sf.series_completed,
    sf.difficulty_perceived,
    sf.pain_during_series,
    sf.series_notes,
    sf.technique_notes,
    sf.completed_at

FROM series_feedback sf
JOIN execucoes_treino et ON et.id = sf.execucao_treino_id
JOIN user_profiles up ON up.user_id = et.cliente_id;

-- ============================================
-- COMENTÁRIOS SOBRE AS ATUALIZAÇÕES
-- ============================================

/*
MODIFICAÇÕES IMPLEMENTADAS:

1. TABELA execucoes_treino (ATUALIZADA):
   ✅ Campos pré-treino: recovery_perception, has_pain_before, pain_location_before, pain_intensity_eva_before
   ✅ Campos pós-treino: overall_satisfaction, effort_perception_rpe, discomfort_level
   ✅ Campos de dor pós-treino: has_pain_after, pain_location_after, pain_intensity_eva_after
   ✅ Campo para notas do trainer: trainer_notes

2. TABELA series_feedback (NOVA):
   ✅ Feedback individual por série
   ✅ Checkbox "série completada"
   ✅ Dificuldade percebida por série
   ✅ Dor durante série específica
   ✅ Notas técnicas do personal

3. TABELA pain_reports (ATUALIZADA):
   ✅ Referência para execução de treino
   ✅ Timing da avaliação de dor

4. SEGURANÇA E PERFORMANCE:
   ✅ RLS policies adequadas
   ✅ Índices otimizados
   ✅ Views para relatórios
   ✅ Triggers para timestamps

COMPATIBILIDADE:
- Mantém toda a estrutura existente
- Adiciona apenas novos campos opcionais
- Não quebra funcionalidades existentes
- Migra dados quando possível (rpe_geral → effort_perception_rpe)
*/

-- Fim do script de atualização