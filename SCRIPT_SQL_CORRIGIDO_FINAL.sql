-- ============================================
-- SCRIPT SQL CORRIGIDO FINAL - PROMETEUS APP
-- Versão sem erros de sintaxe PostgreSQL
-- ============================================

-- PASSO 1: BACKUP ANTES DE EXECUTAR
CREATE TABLE IF NOT EXISTS backup_migration_data AS 
SELECT 'user_profiles' as tabela, 
       jsonb_build_object(
           'id', id,
           'user_id', user_id,
           'nome', nome,
           'email', email,
           'tipo', tipo,
           'created_at', created_at
       ) as dados_originais,
       NOW() as backup_timestamp
FROM user_profiles
WHERE EXISTS (SELECT 1 FROM user_profiles LIMIT 1);

-- PASSO 2: CRIAR NOVA TABELA DE REGISTROS DE DOR
CREATE TABLE IF NOT EXISTS registros_dor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel_dor INTEGER NOT NULL CHECK (nivel_dor >= 0 AND nivel_dor <= 10),
  localizacao TEXT NOT NULL DEFAULT 'Não especificado',
  contexto VARCHAR(50) CHECK (contexto IN ('antes_treino', 'depois_treino', 'geral', 'avaliacao')) DEFAULT 'geral',
  observacoes TEXT,
  atividade_relacionada TEXT,
  medicacao_tomada BOOLEAN DEFAULT false,
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 3: SISTEMA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('treino', 'dor', 'progresso', 'sistema', 'conquista', 'meta')),
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  dados JSONB DEFAULT '{}',
  lida BOOLEAN DEFAULT false,
  data_leitura TIMESTAMP WITH TIME ZONE,
  prioridade VARCHAR(20) DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  expira_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 4: SISTEMA DE METAS PERSONALIZADAS
CREATE TABLE IF NOT EXISTS metas_pessoais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_meta VARCHAR(50) NOT NULL CHECK (tipo_meta IN ('peso', 'dor', 'treinos_semana', 'treinos_mes', 'sequencia', 'duracao', 'custom')),
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT,
  valor_atual DECIMAL(10,2) DEFAULT 0,
  valor_objetivo DECIMAL(10,2) NOT NULL,
  unidade VARCHAR(20) DEFAULT '',
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_objetivo DATE NOT NULL,
  ativa BOOLEAN DEFAULT true,
  progresso_percentual DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_data_objetivo CHECK (data_objetivo >= data_inicio),
  CONSTRAINT check_valor_objetivo CHECK (valor_objetivo > 0),
  CONSTRAINT check_progresso CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100)
);

-- PASSO 5: SISTEMA DE CONQUISTAS
CREATE TABLE IF NOT EXISTS conquistas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  icone VARCHAR(50) DEFAULT 'trophy',
  cor VARCHAR(7) DEFAULT '#FFD700',
  raridade VARCHAR(20) DEFAULT 'comum' CHECK (raridade IN ('comum', 'raro', 'epico', 'lendario')),
  criterio JSONB NOT NULL,
  pontos INTEGER DEFAULT 10,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario_conquistas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conquista_id UUID REFERENCES conquistas(id) ON DELETE CASCADE,
  desbloqueada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visualizada BOOLEAN DEFAULT false,
  data_visualizacao TIMESTAMP WITH TIME ZONE,
  pontos_ganhos INTEGER DEFAULT 0,
  UNIQUE(usuario_id, conquista_id)
);

-- PASSO 6: INSERIR CONQUISTAS BÁSICAS
INSERT INTO conquistas (codigo, nome, descricao, icone, cor, raridade, criterio, pontos) VALUES
('primeiro_treino', 'Primeiro Treino', 'Complete seu primeiro treino!', 'play-circle', '#4CAF50', 'comum', '{"tipo": "total_workouts", "valor": 1, "operador": ">="}', 10),
('streak_7', 'Uma Semana Forte', 'Mantenha uma sequência de 7 dias', 'calendar', '#FF9800', 'raro', '{"tipo": "streak", "valor": 7, "operador": ">="}', 25),
('streak_30', 'Dedicação Total', 'Sequência incrível de 30 dias', 'trophy', '#E91E63', 'epico', '{"tipo": "streak", "valor": 30, "operador": ">="}', 100),
('treinos_10', 'Em Movimento', 'Complete 10 treinos', 'fitness', '#2196F3', 'comum', '{"tipo": "total_workouts", "valor": 10, "operador": ">="}', 20),
('treinos_50', 'Atleta Dedicado', 'Complete 50 treinos', 'medal', '#9C27B0', 'raro', '{"tipo": "total_workouts", "valor": 50, "operador": ">="}', 50)
ON CONFLICT (codigo) DO NOTHING;

-- PASSO 7: ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_registros_dor_aluno_data 
ON registros_dor(aluno_id, data_registro DESC);

CREATE INDEX IF NOT EXISTS idx_notificacoes_nao_lidas 
ON notificacoes(usuario_id, lida, created_at DESC) 
WHERE lida = false;

CREATE INDEX IF NOT EXISTS idx_metas_ativas 
ON metas_pessoais(aluno_id, ativa) 
WHERE ativa = true;

CREATE INDEX IF NOT EXISTS idx_usuario_conquistas_usuario 
ON usuario_conquistas(usuario_id, desbloqueada_em DESC);

-- PASSO 8: HABILITAR RLS NAS NOVAS TABELAS
ALTER TABLE registros_dor ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_pessoais ENABLE ROW LEVEL SECURITY;
ALTER TABLE conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_conquistas ENABLE ROW LEVEL SECURITY;

-- PASSO 9: CRIAR POLÍTICAS RLS (SEM IF NOT EXISTS)
DROP POLICY IF EXISTS "registros_dor_read" ON registros_dor;
CREATE POLICY "registros_dor_read" ON registros_dor 
FOR SELECT USING (
    aluno_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM personal_aluno pa WHERE pa.aluno_id = registros_dor.aluno_id AND pa.personal_id = auth.uid() AND pa.status = 'ativo')
);

DROP POLICY IF EXISTS "registros_dor_write" ON registros_dor;
CREATE POLICY "registros_dor_write" ON registros_dor 
FOR INSERT WITH CHECK (aluno_id = auth.uid());

DROP POLICY IF EXISTS "notificacoes_own" ON notificacoes;
CREATE POLICY "notificacoes_own" ON notificacoes 
FOR ALL USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "metas_own" ON metas_pessoais;
CREATE POLICY "metas_own" ON metas_pessoais 
FOR ALL USING (aluno_id = auth.uid());

DROP POLICY IF EXISTS "conquistas_read" ON conquistas;
CREATE POLICY "conquistas_read" ON conquistas 
FOR SELECT USING (ativa = true);

DROP POLICY IF EXISTS "usuario_conquistas_own" ON usuario_conquistas;
CREATE POLICY "usuario_conquistas_own" ON usuario_conquistas 
FOR ALL USING (usuario_id = auth.uid());

-- PASSO 10: FUNÇÃO PARA CALCULAR PROGRESSO DE META
CREATE OR REPLACE FUNCTION calcular_progresso_meta(meta_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    meta RECORD;
    valor_atual DECIMAL(10,2);
    progresso DECIMAL(5,2);
BEGIN
    SELECT * INTO meta FROM metas_pessoais WHERE id = meta_id AND ativa = true;
    
    IF meta IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calcular valor atual baseado no tipo de meta
    CASE meta.tipo_meta
        WHEN 'treinos_semana' THEN
            SELECT COUNT(*) INTO valor_atual
            FROM workout_sessions ws
            WHERE ws.aluno_id = meta.aluno_id 
            AND ws.status = 'concluido'
            AND ws.created_at >= DATE_TRUNC('week', CURRENT_DATE);
            
        WHEN 'sequencia' THEN
            SELECT COALESCE(current_streak, 0) INTO valor_atual
            FROM user_streaks 
            WHERE user_id = meta.aluno_id;
            
        ELSE
            valor_atual := meta.valor_atual;
    END CASE;
    
    -- Atualizar valor atual na meta
    UPDATE metas_pessoais 
    SET valor_atual = valor_atual,
        progresso_percentual = LEAST((valor_atual / valor_objetivo) * 100, 100),
        updated_at = NOW()
    WHERE id = meta_id;
    
    progresso := LEAST((valor_atual / meta.valor_objetivo) * 100, 100);
    
    RETURN progresso;
END;
$$ LANGUAGE plpgsql;

-- PASSO 11: VERIFICAÇÃO FINAL
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Habilitado"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'registros_dor', 'notificacoes', 'metas_pessoais', 
    'conquistas', 'usuario_conquistas'
)
ORDER BY tablename;

-- ============================================
-- SCRIPT CONCLUÍDO COM SUCESSO! ✅
-- 
-- INSTRUÇÕES:
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. Todas as novas funcionalidades estarão disponíveis
-- 3. RLS está habilitado para segurança
-- 4. Índices criados para performance
-- ============================================