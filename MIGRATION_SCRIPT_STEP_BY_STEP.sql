-- ============================================
-- SCRIPT DE MIGRAÇÃO PASSO A PASSO - PROMETEUS APP
-- Execute cada seção individualmente para máxima segurança
-- ============================================

-- PASSO 1: BACKUP E PREPARAÇÃO
-- ============================================

-- Criar tabela de backup dos dados atuais
CREATE TABLE IF NOT EXISTS backup_migration_data AS 
SELECT 
    'user_profiles' as tabela,
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

-- PASSO 2: CONSOLIDAÇÃO DE TABELAS DE DOR
-- ============================================

-- Criar nova tabela unificada de registros de dor
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT idx_aluno_data_registro UNIQUE (aluno_id, data_registro)
);

-- Migrar dados da tabela 'dores' existente (se existir)
INSERT INTO registros_dor (aluno_id, nivel_dor, localizacao, data_registro, created_at)
SELECT 
    usuario_id,
    CASE 
        WHEN nivel > 10 THEN 10
        WHEN nivel < 0 THEN 0
        ELSE nivel::INTEGER
    END,
    COALESCE(musculo, 'Região não especificada'),
    data_registro,
    data_registro
FROM dores 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dores')
ON CONFLICT (aluno_id, data_registro) DO NOTHING;

-- PASSO 3: SISTEMA DE NOTIFICAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('treino', 'dor', 'progresso', 'sistema', 'conquista', 'meta')),
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  dados JSONB DEFAULT '{}', -- Dados adicionais estruturados
  lida BOOLEAN DEFAULT false,
  data_leitura TIMESTAMP WITH TIME ZONE,
  prioridade VARCHAR(20) DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  expira_em TIMESTAMP WITH TIME ZONE, -- Para notificações temporárias
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 4: SISTEMA DE METAS PERSONALIZADAS
-- ============================================

CREATE TABLE IF NOT EXISTS metas_pessoais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_meta VARCHAR(50) NOT NULL CHECK (tipo_meta IN ('peso', 'dor', 'treinos_semana', 'treinos_mes', 'sequencia', 'duracao', 'custom')),
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT,
  valor_atual DECIMAL(10,2) DEFAULT 0,
  valor_objetivo DECIMAL(10,2) NOT NULL,
  unidade VARCHAR(20) DEFAULT '', -- kg, nível, treinos, dias, minutos, etc
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
-- ============================================

CREATE TABLE IF NOT EXISTS conquistas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  icone VARCHAR(50) DEFAULT 'trophy', -- nome do ícone
  cor VARCHAR(7) DEFAULT '#FFD700',
  raridade VARCHAR(20) DEFAULT 'comum' CHECK (raridade IN ('comum', 'raro', 'epico', 'lendario')),
  criterio JSONB NOT NULL, -- {"tipo": "streak", "valor": 7, "operador": ">="}
  pontos INTEGER DEFAULT 10, -- pontos ganhos ao desbloquear
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
-- ============================================

INSERT INTO conquistas (codigo, nome, descricao, icone, cor, raridade, criterio, pontos) VALUES
('primeiro_treino', 'Primeiro Treino', 'Complete seu primeiro treino!', 'play-circle', '#4CAF50', 'comum', '{"tipo": "total_workouts", "valor": 1, "operador": ">="}', 10),
('streak_7', 'Uma Semana Forte', 'Mantenha uma sequência de 7 dias', 'calendar', '#FF9800', 'raro', '{"tipo": "streak", "valor": 7, "operador": ">="}', 25),
('streak_30', 'Dedicação Total', 'Sequência incrível de 30 dias', 'trophy', '#E91E63', 'epico', '{"tipo": "streak", "valor": 30, "operador": ">="}', 100),
('treinos_10', 'Em Movimento', 'Complete 10 treinos', 'fitness', '#2196F3', 'comum', '{"tipo": "total_workouts", "valor": 10, "operador": ">="}', 20),
('treinos_50', 'Atleta Dedicado', 'Complete 50 treinos', 'medal', '#9C27B0', 'raro', '{"tipo": "total_workouts", "valor": 50, "operador": ">="}', 50),
('sem_dor', 'Sem Dor', 'Registre nível 0 de dor por 3 dias consecutivos', 'heart', '#4CAF50', 'raro', '{"tipo": "sem_dor_dias", "valor": 3, "operador": ">="}', 30),
('madrugador', 'Madrugador', 'Complete 5 treinos antes das 8h', 'sunrise', '#FF5722', 'raro', '{"tipo": "treinos_manha", "valor": 5, "operador": ">="}', 25);

-- PASSO 7: SISTEMA DE BACKUP DE DADOS
-- ============================================

CREATE TABLE IF NOT EXISTS backup_dados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_backup VARCHAR(50) NOT NULL CHECK (tipo_backup IN ('completo', 'treinos', 'dor', 'progresso', 'mensal')),
  dados_json JSONB NOT NULL,
  data_backup TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tamanho_kb INTEGER,
  formato VARCHAR(20) DEFAULT 'json',
  hash_verificacao TEXT, -- Para verificar integridade
  status VARCHAR(20) DEFAULT 'criado' CHECK (status IN ('criado', 'verificado', 'corrompido')),
  expira_em TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year')
);

-- PASSO 8: ÍNDICES DE PERFORMANCE
-- ============================================

-- Índices para registros de dor
CREATE INDEX IF NOT EXISTS idx_registros_dor_aluno_data 
ON registros_dor(aluno_id, data_registro DESC);

CREATE INDEX IF NOT EXISTS idx_registros_dor_nivel 
ON registros_dor(nivel_dor) 
WHERE nivel_dor > 0;

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_nao_lidas 
ON notificacoes(usuario_id, lida, created_at DESC) 
WHERE lida = false;

CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo_data 
ON notificacoes(tipo, created_at DESC);

-- Índices para metas
CREATE INDEX IF NOT EXISTS idx_metas_ativas 
ON metas_pessoais(aluno_id, ativa) 
WHERE ativa = true;

-- Índices para conquistas
CREATE INDEX IF NOT EXISTS idx_usuario_conquistas_usuario 
ON usuario_conquistas(usuario_id, desbloqueada_em DESC);

CREATE INDEX IF NOT EXISTS idx_conquistas_ativas 
ON conquistas(ativa) 
WHERE ativa = true;

-- PASSO 9: VIEWS MATERIALIZED PARA DASHBOARDS
-- ============================================

-- View para métricas do aluno (atualizar diariamente)
CREATE MATERIALIZED VIEW IF NOT EXISTS aluno_metricas AS
SELECT 
    up.user_id,
    up.nome,
    up.tipo,
    COALESCE(us.current_streak, 0) as sequencia_atual,
    COALESCE(us.total_workouts, 0) as total_treinos,
    COUNT(rd.id) as total_registros_dor,
    COALESCE(AVG(rd.nivel_dor), 0) as media_dor_30_dias,
    COUNT(ws.id) FILTER (WHERE ws.created_at >= CURRENT_DATE - INTERVAL '30 days') as treinos_ultimo_mes,
    COUNT(ws.id) FILTER (WHERE ws.created_at >= CURRENT_DATE - INTERVAL '7 days') as treinos_ultima_semana,
    COUNT(uc.id) as total_conquistas,
    COALESCE(SUM(uc.pontos_ganhos), 0) as pontos_total,
    up.created_at as membro_desde,
    CURRENT_DATE as data_calculo
FROM user_profiles up
LEFT JOIN user_streaks us ON up.user_id = us.user_id
LEFT JOIN registros_dor rd ON up.user_id = rd.aluno_id 
    AND rd.created_at >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN workout_sessions ws ON up.user_id = ws.aluno_id
LEFT JOIN usuario_conquistas uc ON up.user_id = uc.usuario_id
WHERE up.tipo = 'aluno'
GROUP BY up.user_id, up.nome, up.tipo, us.current_streak, us.total_workouts, up.created_at;

-- Criar índice único para a view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_aluno_metricas_user_id 
ON aluno_metricas(user_id);

-- PASSO 10: FUNÇÕES ÚTEIS
-- ============================================

-- Função para calcular progresso de meta
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
            
        WHEN 'treinos_mes' THEN
            SELECT COUNT(*) INTO valor_atual
            FROM workout_sessions ws
            WHERE ws.aluno_id = meta.aluno_id 
            AND ws.status = 'concluido'
            AND ws.created_at >= DATE_TRUNC('month', CURRENT_DATE);
            
        WHEN 'sequencia' THEN
            SELECT COALESCE(current_streak, 0) INTO valor_atual
            FROM user_streaks 
            WHERE user_id = meta.aluno_id;
            
        WHEN 'dor' THEN
            SELECT COALESCE(AVG(nivel_dor), 10) INTO valor_atual
            FROM registros_dor 
            WHERE aluno_id = meta.aluno_id
            AND created_at >= CURRENT_DATE - INTERVAL '7 days';
            
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

-- Função para verificar novas conquistas
CREATE OR REPLACE FUNCTION verificar_conquistas(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    conquista RECORD;
    novas_conquistas INTEGER := 0;
    streak_atual INTEGER;
    total_treinos INTEGER;
BEGIN
    -- Buscar dados do usuário
    SELECT COALESCE(current_streak, 0), COALESCE(total_workouts, 0) 
    INTO streak_atual, total_treinos
    FROM user_streaks WHERE user_id = user_uuid;
    
    -- Se não existe registro, criar um
    IF streak_atual IS NULL THEN
        INSERT INTO user_streaks (user_id, current_streak, total_workouts) 
        VALUES (user_uuid, 0, 0)
        ON CONFLICT (user_id) DO NOTHING;
        streak_atual := 0;
        total_treinos := 0;
    END IF;
    
    -- Verificar cada conquista ativa
    FOR conquista IN SELECT * FROM conquistas WHERE ativa = true LOOP
        -- Verificar se usuário já tem esta conquista
        IF NOT EXISTS (SELECT 1 FROM usuario_conquistas WHERE usuario_id = user_uuid AND conquista_id = conquista.id) THEN
            -- Verificar critério baseado no tipo
            IF (conquista.criterio->>'tipo' = 'streak' AND 
                streak_atual >= (conquista.criterio->>'valor')::INTEGER) OR
               (conquista.criterio->>'tipo' = 'total_workouts' AND 
                total_treinos >= (conquista.criterio->>'valor')::INTEGER) THEN
                
                -- Desbloquear conquista
                INSERT INTO usuario_conquistas (usuario_id, conquista_id, pontos_ganhos)
                VALUES (user_uuid, conquista.id, conquista.pontos);
                
                -- Criar notificação
                INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, dados)
                VALUES (
                    user_uuid, 
                    'conquista', 
                    'Nova conquista desbloqueada! 🏆', 
                    'Você desbloqueou: ' || conquista.nome || '!',
                    jsonb_build_object(
                        'conquista_id', conquista.id,
                        'pontos', conquista.pontos,
                        'raridade', conquista.raridade
                    )
                );
                
                novas_conquistas := novas_conquistas + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN novas_conquistas;
END;
$$ LANGUAGE plpgsql;

-- PASSO 11: TRIGGERS AUTOMÁTICOS
-- ============================================

-- Trigger para atualizar progresso das metas quando treino é concluído
CREATE OR REPLACE FUNCTION trigger_atualizar_metas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
        -- Atualizar todas as metas ativas do usuário
        PERFORM calcular_progresso_meta(id) 
        FROM metas_pessoais 
        WHERE aluno_id = NEW.aluno_id AND ativa = true;
        
        -- Verificar novas conquistas
        PERFORM verificar_conquistas(NEW.aluno_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_metas_workout_completion ON workout_sessions;
CREATE TRIGGER trigger_metas_workout_completion
    AFTER INSERT OR UPDATE ON workout_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_metas();

-- Trigger para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_metas_updated_at ON metas_pessoais;
CREATE TRIGGER trigger_metas_updated_at
    BEFORE UPDATE ON metas_pessoais
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

-- PASSO 12: POLÍTICAS DE SEGURANÇA RLS
-- ============================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE registros_dor ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_pessoais ENABLE ROW LEVEL SECURITY;
ALTER TABLE conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_dados ENABLE ROW LEVEL SECURITY;

-- Políticas para registros de dor
DROP POLICY IF EXISTS "registros_dor_read" ON registros_dor;
CREATE POLICY "registros_dor_read" ON registros_dor 
FOR SELECT USING (
    aluno_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM personal_aluno pa WHERE pa.aluno_id = registros_dor.aluno_id AND pa.personal_id = auth.uid() AND pa.status = 'ativo')
);

DROP POLICY IF EXISTS "registros_dor_write" ON registros_dor;
CREATE POLICY "registros_dor_write" ON registros_dor 
FOR INSERT WITH CHECK (aluno_id = auth.uid());

DROP POLICY IF EXISTS "registros_dor_update" ON registros_dor;
CREATE POLICY "registros_dor_update" ON registros_dor 
FOR UPDATE USING (aluno_id = auth.uid());

-- Políticas para notificações
DROP POLICY IF EXISTS "notificacoes_own" ON notificacoes;
CREATE POLICY "notificacoes_own" ON notificacoes 
FOR ALL USING (usuario_id = auth.uid());

-- Políticas para metas
DROP POLICY IF EXISTS "metas_own" ON metas_pessoais;
CREATE POLICY "metas_own" ON metas_pessoais 
FOR ALL USING (aluno_id = auth.uid());

-- Políticas para conquistas (leitura pública, escrita restrita)
DROP POLICY IF EXISTS "conquistas_read" ON conquistas;
CREATE POLICY "conquistas_read" ON conquistas 
FOR SELECT USING (ativa = true);

DROP POLICY IF EXISTS "usuario_conquistas_own" ON usuario_conquistas;
CREATE POLICY "usuario_conquistas_own" ON usuario_conquistas 
FOR ALL USING (usuario_id = auth.uid());

-- Políticas para backup
DROP POLICY IF EXISTS "backup_own" ON backup_dados;
CREATE POLICY "backup_own" ON backup_dados 
FOR ALL USING (usuario_id = auth.uid());

-- PASSO 13: REFRESH AUTOMÁTICO DA VIEW MATERIALIZADA
-- ============================================

-- Função para refresh da view materializada
CREATE OR REPLACE FUNCTION refresh_aluno_metricas()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY aluno_metricas;
    
    -- Log do refresh
    INSERT INTO backup_dados (usuario_id, tipo_backup, dados_json, tamanho_kb)
    VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, 
        'sistema',
        jsonb_build_object('evento', 'refresh_aluno_metricas', 'timestamp', NOW()),
        0
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se todas as novas tabelas foram criadas
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Habilitado"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'registros_dor', 'notificacoes', 'metas_pessoais', 
    'conquistas', 'usuario_conquistas', 'backup_dados'
)
ORDER BY tablename;

-- Verificar conquistas inseridas
SELECT codigo, nome, raridade FROM conquistas WHERE ativa = true ORDER BY raridade;

-- Verificar view materializada
SELECT COUNT(*) as "Total de usuários na view" FROM aluno_metricas;

-- ============================================
-- SCRIPT DE MIGRAÇÃO CONCLUÍDO! ✅
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute cada PASSO individualmente
-- 2. Verifique os dados após cada passo
-- 3. Execute refresh da view: SELECT refresh_aluno_metricas();
-- 4. Teste as funcionalidades no app
-- ============================================