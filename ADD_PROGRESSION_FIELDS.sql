-- Script para adicionar campos de progressão e carga aos treinos
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar campos na tabela treinos para definição do exercício
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS carga_sugerida_kg DECIMAL(5,2);
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS cadencia_segundos INTEGER;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS descanso_entre_series_seg INTEGER DEFAULT 60;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS equipamento VARCHAR(100);
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS observacoes_tecnicas TEXT;

-- 2. Criar tabela para registro de execução detalhada de cada série
CREATE TABLE IF NOT EXISTS series_execucoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execucao_treino_id UUID NOT NULL REFERENCES execucoes_treino(id) ON DELETE CASCADE,
    serie_numero INTEGER NOT NULL,
    repeticoes_realizadas INTEGER,
    carga_utilizada_kg DECIMAL(5,2),
    tempo_descanso_seg INTEGER,
    percepcao_esforco INTEGER CHECK (percepcao_esforco BETWEEN 1 AND 10), -- RPE
    observacoes TEXT,
    completada BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_series_execucoes_execucao_id ON series_execucoes(execucao_treino_id);
CREATE INDEX IF NOT EXISTS idx_series_execucoes_serie ON series_execucoes(serie_numero);

-- 4. Adicionar campos extras na tabela execucoes_treino
ALTER TABLE execucoes_treino ADD COLUMN IF NOT EXISTS carga_maxima_kg DECIMAL(5,2);
ALTER TABLE execucoes_treino ADD COLUMN IF NOT EXISTS volume_total_kg DECIMAL(8,2); -- carga x reps total
ALTER TABLE execucoes_treino ADD COLUMN IF NOT EXISTS rpe_geral INTEGER CHECK (rpe_geral BETWEEN 1 AND 10);

-- 5. Criar tabela para histórico de progressão
CREATE TABLE IF NOT EXISTS progressao_exercicios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    exercicio_nome VARCHAR(255) NOT NULL,
    data_registro DATE DEFAULT CURRENT_DATE,
    carga_kg DECIMAL(5,2),
    series INTEGER,
    repeticoes INTEGER,
    volume_total DECIMAL(8,2), -- carga x series x reps
    rpe_medio DECIMAL(3,1),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Índices para histórico de progressão
CREATE INDEX IF NOT EXISTS idx_progressao_usuario ON progressao_exercicios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_progressao_exercicio ON progressao_exercicios(exercicio_nome);
CREATE INDEX IF NOT EXISTS idx_progressao_data ON progressao_exercicios(data_registro);

-- 7. RLS para as novas tabelas
ALTER TABLE series_execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE progressao_exercicios ENABLE ROW LEVEL SECURITY;

-- Políticas para series_execucoes
CREATE POLICY "Users can view their own series executions" ON series_execucoes
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM execucoes_treino et 
        WHERE et.id = series_execucoes.execucao_treino_id 
        AND et.cliente_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own series executions" ON series_execucoes
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM execucoes_treino et 
        WHERE et.id = series_execucoes.execucao_treino_id 
        AND et.cliente_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own series executions" ON series_execucoes
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM execucoes_treino et 
        WHERE et.id = series_execucoes.execucao_treino_id 
        AND et.cliente_id = auth.uid()
    )
);

-- Políticas para progressao_exercicios
CREATE POLICY "Users can view their own progression" ON progressao_exercicios
FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "Users can insert their own progression" ON progressao_exercicios
FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update their own progression" ON progressao_exercicios
FOR UPDATE USING (usuario_id = auth.uid());

-- 8. Função para calcular progressão automaticamente
CREATE OR REPLACE FUNCTION update_progression_after_workout()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando uma execução de treino é marcada como finalizada,
    -- calcular e inserir dados de progressão
    IF NEW.finalizado = true AND (OLD.finalizado IS NULL OR OLD.finalizado = false) THEN
        INSERT INTO progressao_exercicios (
            usuario_id,
            exercicio_nome,
            data_registro,
            carga_kg,
            series,
            repeticoes,
            volume_total,
            rpe_medio
        )
        SELECT 
            NEW.cliente_id,
            t.exercicio,
            NEW.data_execucao::date,
            AVG(se.carga_utilizada_kg),
            t.series,
            t.repeticoes,
            SUM(se.carga_utilizada_kg * se.repeticoes_realizadas),
            AVG(se.percepcao_esforco)
        FROM treinos t
        LEFT JOIN series_execucoes se ON se.execucao_treino_id = NEW.id
        WHERE t.id = NEW.treino_id
        GROUP BY t.exercicio, t.series, t.repeticoes
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para atualizar progressão automaticamente
DROP TRIGGER IF EXISTS trigger_update_progression ON execucoes_treino;
CREATE TRIGGER trigger_update_progression
    AFTER UPDATE ON execucoes_treino
    FOR EACH ROW
    EXECUTE FUNCTION update_progression_after_workout();

-- Comentários explicativos
COMMENT ON COLUMN treinos.carga_sugerida_kg IS 'Carga sugerida para o exercício em kg';
COMMENT ON COLUMN treinos.cadencia_segundos IS 'Cadência/tempo para executar uma repetição';
COMMENT ON COLUMN treinos.descanso_entre_series_seg IS 'Tempo de descanso entre séries em segundos';
COMMENT ON COLUMN treinos.equipamento IS 'Equipamento necessário para o exercício';

COMMENT ON TABLE series_execucoes IS 'Registro detalhado de cada série executada';
COMMENT ON COLUMN series_execucoes.percepcao_esforco IS 'RPE - Rate of Perceived Exertion (1-10)';

COMMENT ON TABLE progressao_exercicios IS 'Histórico de progressão por exercício para análise de evolução';