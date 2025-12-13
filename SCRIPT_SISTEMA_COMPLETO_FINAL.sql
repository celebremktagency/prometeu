-- ============================================
-- SCRIPT SISTEMA COMPLETO FINAL - PROMETEUS APP
-- Com todas as funcionalidades solicitadas
-- ============================================

-- 1. REMOVER TODAS AS TABELAS EXISTENTES (RESET COMPLETO)
DROP TABLE IF EXISTS workout_calendar CASCADE;
DROP TABLE IF EXISTS workout_feedback CASCADE;
DROP TABLE IF EXISTS exercise_videos CASCADE;
DROP TABLE IF EXISTS workout_sessions CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workout_templates CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS professional_reports CASCADE;
DROP TABLE IF EXISTS client_exams CASCADE;
DROP TABLE IF EXISTS treinos_atribuidos CASCADE;
DROP TABLE IF EXISTS personal_aluno CASCADE;
DROP TABLE IF EXISTS comunidade_curtidas CASCADE;
DROP TABLE IF EXISTS comunidade_comentarios CASCADE;
DROP TABLE IF EXISTS comunidade_posts CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS treinos_logs CASCADE;
DROP TABLE IF EXISTS dores_logs CASCADE;

-- 2. CRIAR TABELA DE PERFIS DE USUÁRIO
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('aluno', 'personal_trainer')),
  data_nascimento DATE,
  telefone VARCHAR(20),
  objetivo_principal VARCHAR(100),
  nivel_dor_atual INTEGER DEFAULT 0 CHECK (nivel_dor_atual >= 0 AND nivel_dor_atual <= 10),
  localizacao_dor TEXT,
  atividade_fisica_frequencia VARCHAR(50),
  medicamentos TEXT,
  restricoes_medicas TEXT,
  peso DECIMAL(5,2),
  altura DECIMAL(3,2),
  experiencia_nivel VARCHAR(20) DEFAULT 'iniciante' CHECK (experiencia_nivel IN ('iniciante', 'intermediario', 'avancado')),
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA DE EXERCÍCIOS (COM SUPORTE A VÍDEOS YOUTUBE)
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  series INTEGER DEFAULT 3,
  repeticoes VARCHAR(50), 
  descanso VARCHAR(50) DEFAULT '60 segundos',
  grupo_muscular VARCHAR(100),
  equipamento VARCHAR(100) DEFAULT 'Nenhum',
  instrucoes TEXT[],
  dificuldade VARCHAR(20) DEFAULT 'iniciante' CHECK (dificuldade IN ('iniciante', 'intermediario', 'avancado')),
  youtube_url TEXT, -- URL do YouTube para o vídeo demonstrativo
  youtube_embed_id TEXT, -- ID para embed do YouTube (extraído da URL)
  imagem_url TEXT,
  tags TEXT[], -- Para facilitar busca e categorização
  ativo BOOLEAN DEFAULT true,
  publico BOOLEAN DEFAULT true, -- Se o exercício pode ser visto por outros profissionais
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA DE TEMPLATES DE TREINO (CONJUNTOS DE EXERCÍCIOS)
CREATE TABLE workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  tipo_treino VARCHAR(50) DEFAULT 'personalizado' CHECK (tipo_treino IN ('emagrecimento', 'hipertrofia', 'reabilitacao', 'condicionamento', 'personalizado')),
  nivel_dificuldade VARCHAR(20) DEFAULT 'iniciante' CHECK (nivel_dificuldade IN ('iniciante', 'intermediario', 'avancado')),
  duracao_estimada_min INTEGER DEFAULT 30,
  frequencia_semanal INTEGER DEFAULT 3,
  observacoes_profissional TEXT,
  imagem_url TEXT,
  cor_tema VARCHAR(7) DEFAULT '#007AFF', -- Hex color para personalização visual
  ativo BOOLEAN DEFAULT true,
  publico BOOLEAN DEFAULT false, -- Se outros profissionais podem usar este template
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RELACIONAMENTO TREINO-EXERCÍCIOS (COM CUSTOMIZAÇÕES)
CREATE TABLE workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 1,
  series_customizado INTEGER,
  repeticoes_customizado VARCHAR(50),
  descanso_customizado VARCHAR(50),
  observacoes TEXT,
  obrigatorio BOOLEAN DEFAULT true, -- Se o exercício é obrigatório ou opcional
  peso_sugerido VARCHAR(50), -- Peso sugerido para este exercício específico
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workout_id, exercise_id)
);

-- 6. RELACIONAMENTO PERSONAL-ALUNO
CREATE TABLE personal_aluno (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fim TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  plano_tipo VARCHAR(20) DEFAULT 'basico' CHECK (plano_tipo IN ('basico', 'premium', 'vip')),
  valor_mensal DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(personal_id, aluno_id)
);

-- 7. TREINOS ATRIBUÍDOS COM CALENDÁRIO AVANÇADO
CREATE TABLE treinos_atribuidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  nome_personalizado VARCHAR(200), -- Nome personalizado para este treino específico
  data_atribuicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  dias_semana INTEGER[] DEFAULT ARRAY[1,3,5], -- 0=domingo, 1=segunda, etc
  horario_sugerido TIME,
  lembretes_ativo BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'pausado', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CALENDÁRIO DE TREINOS (PARA VISUALIZAÇÃO DETALHADA)
CREATE TABLE workout_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  treino_atribuido_id UUID REFERENCES treinos_atribuidos(id) ON DELETE CASCADE,
  data_treino DATE NOT NULL,
  horario_inicio TIME,
  horario_fim TIME,
  status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_andamento', 'concluido', 'reagendado', 'faltou')),
  reagendado_de DATE, -- Data original se foi reagendado
  motivo_reagendamento TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aluno_id, data_treino, treino_atribuido_id)
);

-- 9. SESSÕES DE TREINO (EXECUÇÃO DETALHADA)
CREATE TABLE workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  calendar_id UUID REFERENCES workout_calendar(id) ON DELETE SET NULL,
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fim TIMESTAMP WITH TIME ZONE,
  nivel_dor_antes INTEGER CHECK (nivel_dor_antes >= 0 AND nivel_dor_antes <= 10),
  nivel_dor_depois INTEGER CHECK (nivel_dor_depois >= 0 AND nivel_dor_depois <= 10),
  exercicios_completados INTEGER DEFAULT 0,
  exercicios_totais INTEGER DEFAULT 0,
  duracao_real_min INTEGER,
  observacoes_cliente TEXT,
  dificuldade_percebida VARCHAR(20) CHECK (dificuldade_percebida IN ('facil', 'medio', 'dificil')),
  satisfacao_treino INTEGER CHECK (satisfacao_treino >= 1 AND satisfacao_treino <= 5),
  energia_antes INTEGER CHECK (energia_antes >= 1 AND energia_antes <= 5),
  energia_depois INTEGER CHECK (energia_depois >= 1 AND energia_depois <= 5),
  status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'interrompido')),
  localizacao TEXT, -- Onde foi feito o treino (casa, academia, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. FEEDBACK DETALHADO DE TREINOS
CREATE TABLE workout_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  series_realizadas INTEGER,
  repeticoes_realizadas VARCHAR(50),
  peso_utilizado VARCHAR(50),
  dificuldade_exercicio VARCHAR(20) CHECK (dificuldade_exercicio IN ('facil', 'medio', 'dificil')),
  observacoes TEXT,
  tempo_descanso_real VARCHAR(50),
  concluido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. RELATÓRIOS PROFISSIONAIS
CREATE TABLE professional_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(300) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'progresso' CHECK (tipo IN ('avaliacao_inicial', 'progresso', 'evolucao', 'final')),
  conteudo TEXT NOT NULL,
  dados_metricas JSONB, -- Dados estruturados de métricas (peso, medidas, etc)
  periodo_inicio DATE,
  periodo_fim DATE,
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizado', 'em_andamento')),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_compartilhamento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. EXAMES DE CLIENTES
CREATE TABLE client_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(300) NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  tipo_documento VARCHAR(50) DEFAULT 'exame',
  data_exame DATE,
  data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nome_arquivo VARCHAR(300),
  url_arquivo TEXT,
  observacoes TEXT,
  resultados_importantes TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'analisado', 'em_analise')),
  tags TEXT[], -- Para facilitar busca
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. COMUNIDADE
CREATE TABLE comunidade_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  autor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(200),
  conteudo TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'post' CHECK (tipo IN ('post', 'duvida', 'conquista', 'dica')),
  imagem_url TEXT,
  curtidas INTEGER DEFAULT 0,
  comentarios_count INTEGER DEFAULT 0,
  visualizacoes INTEGER DEFAULT 0,
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'publicado' CHECK (status IN ('rascunho', 'publicado', 'moderacao', 'removido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE comunidade_comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES comunidade_posts(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comunidade_comentarios(id),
  curtidas INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'publicado' CHECK (status IN ('publicado', 'moderacao', 'removido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. SISTEMA DE CURTIDAS
CREATE TABLE comunidade_curtidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES comunidade_posts(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES comunidade_comentarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_like_target CHECK (
    (post_id IS NOT NULL AND comentario_id IS NULL) OR
    (post_id IS NULL AND comentario_id IS NOT NULL)
  ),
  UNIQUE(usuario_id, post_id),
  UNIQUE(usuario_id, comentario_id)
);

-- 15. SISTEMA DE SEQUÊNCIAS/CONSTÂNCIA APRIMORADO
CREATE TABLE user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_workouts INTEGER DEFAULT 0,
  workouts_this_week INTEGER DEFAULT 0,
  workouts_this_month INTEGER DEFAULT 0,
  last_workout_date DATE,
  weekly_goal INTEGER DEFAULT 3,
  monthly_goal INTEGER DEFAULT 12,
  streak_level VARCHAR(20) DEFAULT 'iniciante' CHECK (streak_level IN ('iniciante', 'consistente', 'dedicado', 'lenda')),
  badges_earned TEXT[] DEFAULT '{}',
  points_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. LOGS DE TREINOS E DOR
CREATE TABLE treinos_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duracao_min INTEGER,
  exercicios_completados INTEGER,
  exercicios_totais INTEGER,
  nivel_satisfacao INTEGER CHECK (nivel_satisfacao >= 1 AND nivel_satisfacao <= 5),
  calorias_estimadas INTEGER,
  observacoes TEXT,
  pontos_ganhos INTEGER DEFAULT 0
);

CREATE TABLE dores_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nivel_dor INTEGER NOT NULL CHECK (nivel_dor >= 0 AND nivel_dor <= 10),
  localizacao VARCHAR(200),
  observacoes TEXT,
  contexto VARCHAR(50) CHECK (contexto IN ('antes_treino', 'depois_treino', 'geral')),
  atividade_relacionada TEXT,
  medicacao_tomada BOOLEAN DEFAULT false
);

-- 17. PAGAMENTOS
CREATE TABLE pagamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'reembolsado')),
  tipo VARCHAR(50) DEFAULT 'mensalidade',
  descricao TEXT,
  data_vencimento DATE,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  metodo_pagamento VARCHAR(50),
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_atribuidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_curtidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dores_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "user_profiles_own" ON user_profiles FOR ALL USING (user_id = auth.uid());

-- Exercícios: todos podem ver exercícios públicos, apenas criador pode editar
CREATE POLICY "exercises_read" ON exercises FOR SELECT USING (publico = true OR created_by = auth.uid());
CREATE POLICY "exercises_write" ON exercises FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "exercises_update" ON exercises FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "exercises_delete" ON exercises FOR DELETE USING (created_by = auth.uid());

-- Templates de treino: públicos para leitura, apenas criador edita
CREATE POLICY "workout_templates_read" ON workout_templates FOR SELECT USING (publico = true OR created_by = auth.uid());
CREATE POLICY "workout_templates_write" ON workout_templates FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "workout_templates_update" ON workout_templates FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "workout_templates_delete" ON workout_templates FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "workout_exercises_all" ON workout_exercises FOR ALL USING (true);
CREATE POLICY "personal_aluno_related" ON personal_aluno FOR ALL USING (personal_id = auth.uid() OR aluno_id = auth.uid());
CREATE POLICY "treinos_atribuidos_related" ON treinos_atribuidos FOR ALL USING (personal_id = auth.uid() OR aluno_id = auth.uid());
CREATE POLICY "workout_calendar_related" ON workout_calendar FOR ALL USING (aluno_id = auth.uid() OR EXISTS (SELECT 1 FROM treinos_atribuidos ta WHERE ta.id = treino_atribuido_id AND ta.personal_id = auth.uid()));
CREATE POLICY "workout_sessions_related" ON workout_sessions FOR ALL USING (aluno_id = auth.uid() OR EXISTS (SELECT 1 FROM treinos_atribuidos ta WHERE ta.aluno_id = workout_sessions.aluno_id AND ta.personal_id = auth.uid()));
CREATE POLICY "workout_feedback_related" ON workout_feedback FOR ALL USING (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND (ws.aluno_id = auth.uid() OR EXISTS (SELECT 1 FROM treinos_atribuidos ta WHERE ta.aluno_id = ws.aluno_id AND ta.personal_id = auth.uid()))));
CREATE POLICY "professional_reports_related" ON professional_reports FOR ALL USING (profissional_id = auth.uid() OR cliente_id = auth.uid());
CREATE POLICY "client_exams_related" ON client_exams FOR ALL USING (profissional_id = auth.uid() OR cliente_id = auth.uid());
CREATE POLICY "comunidade_posts_all" ON comunidade_posts FOR ALL USING (status = 'publicado' OR autor_id = auth.uid());
CREATE POLICY "comunidade_comentarios_all" ON comunidade_comentarios FOR ALL USING (status = 'publicado' OR autor_id = auth.uid());
CREATE POLICY "comunidade_curtidas_own" ON comunidade_curtidas FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "user_streaks_own" ON user_streaks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "treinos_logs_own" ON treinos_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "dores_logs_own" ON dores_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "pagamentos_related" ON pagamentos FOR ALL USING (user_id = auth.uid() OR personal_id = auth.uid());

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices importantes para queries frequentes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_tipo ON user_profiles(tipo);
CREATE INDEX idx_exercises_grupo_muscular ON exercises(grupo_muscular);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);
CREATE INDEX idx_exercises_publico ON exercises(publico) WHERE publico = true;
CREATE INDEX idx_workout_templates_tipo ON workout_templates(tipo_treino);
CREATE INDEX idx_workout_templates_created_by ON workout_templates(created_by);
CREATE INDEX idx_workout_calendar_data ON workout_calendar(data_treino);
CREATE INDEX idx_workout_calendar_aluno ON workout_calendar(aluno_id);
CREATE INDEX idx_workout_sessions_aluno ON workout_sessions(aluno_id);
CREATE INDEX idx_workout_sessions_data ON workout_sessions(data_inicio);
CREATE INDEX idx_treinos_atribuidos_aluno ON treinos_atribuidos(aluno_id);
CREATE INDEX idx_treinos_atribuidos_personal ON treinos_atribuidos(personal_id);
CREATE INDEX idx_user_streaks_user ON user_streaks(user_id);

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para extrair ID do YouTube do URL
CREATE OR REPLACE FUNCTION extract_youtube_id(url TEXT)
RETURNS TEXT AS $$
DECLARE
    youtube_id TEXT;
BEGIN
    -- Extrair ID de diferentes formatos de URL do YouTube
    IF url ~ 'youtube\.com/watch\?v=([a-zA-Z0-9_-]+)' THEN
        youtube_id := substring(url from 'youtube\.com/watch\?v=([a-zA-Z0-9_-]+)');
    ELSIF url ~ 'youtu\.be/([a-zA-Z0-9_-]+)' THEN
        youtube_id := substring(url from 'youtu\.be/([a-zA-Z0-9_-]+)');
    ELSIF url ~ 'youtube\.com/embed/([a-zA-Z0-9_-]+)' THEN
        youtube_id := substring(url from 'youtube\.com/embed/([a-zA-Z0-9_-]+)');
    END IF;
    
    RETURN youtube_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o embed_id quando youtube_url for inserido/atualizado
CREATE OR REPLACE FUNCTION update_youtube_embed_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.youtube_url IS NOT NULL AND NEW.youtube_url != OLD.youtube_url THEN
        NEW.youtube_embed_id := extract_youtube_id(NEW.youtube_url);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_youtube_embed_id
    BEFORE INSERT OR UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_youtube_embed_id();

-- Função para calcular streak do usuário
CREATE OR REPLACE FUNCTION calculate_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak_count INTEGER := 0;
    last_date DATE;
    check_date DATE;
BEGIN
    -- Buscar a data do último treino concluído
    SELECT MAX(DATE(data_inicio)) INTO last_date
    FROM workout_sessions 
    WHERE aluno_id = user_uuid AND status = 'concluido';
    
    -- Se não há treinos, retorna 0
    IF last_date IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Verificar se o último treino foi hoje ou ontem
    IF last_date < CURRENT_DATE - INTERVAL '1 day' THEN
        RETURN 0; -- Streak quebrado
    END IF;
    
    -- Contar dias consecutivos com treino
    check_date := last_date;
    WHILE EXISTS (
        SELECT 1 FROM workout_sessions 
        WHERE aluno_id = user_uuid 
        AND DATE(data_inicio) = check_date 
        AND status = 'concluido'
    ) LOOP
        current_streak_count := current_streak_count + 1;
        check_date := check_date - INTERVAL '1 day';
    END LOOP;
    
    RETURN current_streak_count;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar streak automaticamente
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    new_streak INTEGER;
    total_count INTEGER;
BEGIN
    IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
        -- Calcular novo streak
        new_streak := calculate_user_streak(NEW.aluno_id);
        
        -- Contar total de treinos
        SELECT COUNT(*) INTO total_count
        FROM workout_sessions 
        WHERE aluno_id = NEW.aluno_id AND status = 'concluido';
        
        -- Atualizar ou inserir em user_streaks
        INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_workouts, last_workout_date)
        VALUES (NEW.aluno_id, new_streak, new_streak, total_count, CURRENT_DATE)
        ON CONFLICT (user_id) DO UPDATE SET
            current_streak = new_streak,
            longest_streak = GREATEST(user_streaks.longest_streak, new_streak),
            total_workouts = total_count,
            last_workout_date = CURRENT_DATE,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_streak
    AFTER INSERT OR UPDATE ON workout_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- Função para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comunidade_posts SET comentarios_count = comentarios_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comunidade_posts SET comentarios_count = comentarios_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR DELETE ON comunidade_comentarios
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_count();

-- ============================================
-- DADOS DE EXEMPLO
-- ============================================

-- Inserir exercícios básicos com vídeos do YouTube
INSERT INTO exercises (nome, descricao, series, repeticoes, descanso, grupo_muscular, equipamento, instrucoes, dificuldade, youtube_url, tags) VALUES
('Prancha', 'Prancha isométrica para fortalecimento do core', 3, '30-60 segundos', '60 segundos', 'Core', 'Nenhum', 
 ARRAY['Deite-se de barriga para baixo', 'Apoie-se nos antebraços e dedos dos pés', 'Mantenha o corpo reto como uma prancha', 'Contraia o abdômen', 'Mantenha a posição pelo tempo indicado'], 
 'iniciante', 'https://youtu.be/example1', ARRAY['core', 'isometrico', 'casa']),

('Ponte de Glúteo', 'Exercício para fortalecer glúteos e região lombar', 3, '15', '45 segundos', 'Glúteos', 'Nenhum',
 ARRAY['Deite-se de costas com joelhos dobrados', 'Pés apoiados no chão', 'Contraia os glúteos e levante o quadril', 'Forme uma linha reta dos joelhos aos ombros', 'Abaixe controladamente'],
 'iniciante', 'https://youtu.be/example2', ARRAY['gluteos', 'lombar', 'casa']),

('Fortalecimento de Quadríceps', 'Exercício isométrico para quadríceps', 2, '12', '90 segundos', 'Quadríceps', 'Elástico',
 ARRAY['Sente-se em uma cadeira', 'Coloque o elástico no tornozelo', 'Estenda a perna lentamente', 'Contraia o músculo da coxa', 'Retorne à posição inicial controladamente'],
 'intermediario', 'https://youtu.be/example3', ARRAY['quadriceps', 'reabilitacao', 'elastico']),

('Agachamento Livre', 'Agachamento básico para fortalecimento de membros inferiores', 3, '12-15', '60 segundos', 'Membros Inferiores', 'Nenhum',
 ARRAY['Fique em pé com pés na largura dos ombros', 'Desça flexionando joelhos e quadril', 'Mantenha as costas retas', 'Desça até formar 90 graus nos joelhos', 'Suba controladamente'],
 'iniciante', 'https://youtu.be/example4', ARRAY['pernas', 'funcional', 'casa']),

('Flexão de Braço', 'Flexão de braço tradicional', 3, '8-12', '60 segundos', 'Membros Superiores', 'Nenhum',
 ARRAY['Posição de prancha com braços estendidos', 'Mãos na largura dos ombros', 'Desça flexionando os braços', 'Mantenha o corpo alinhado', 'Suba empurrando o chão'],
 'intermediario', 'https://youtu.be/example5', ARRAY['peito', 'triceps', 'casa']);

-- Criar templates de treino com tipos específicos
INSERT INTO workout_templates (nome, descricao, objetivo, tipo_treino, nivel_dificuldade, duracao_estimada_min, frequencia_semanal, observacoes_profissional, cor_tema) VALUES
('Treino de Emagrecimento', 'Treino completo focado em queima calórica e emagrecimento', 'Perda de peso e tonificação muscular', 'emagrecimento', 'intermediario', 45, 4, 'Treino de alta intensidade com foco em exercícios compostos.', '#FF6B6B'),

('Fortalecimento Lombar', 'Treino focado em fortalecer a região lombar e core', 'Fortalecimento e estabilização da região lombar', 'reabilitacao', 'iniciante', 30, 3, 'Paciente respondendo bem aos exercícios. Aumentar intensidade na próxima semana.', '#4ECDC4'),

('Reabilitação de Joelho', 'Exercícios específicos para reabilitação do joelho', 'Reabilitação e fortalecimento do joelho', 'reabilitacao', 'iniciante', 25, 4, 'Sem dor durante os exercícios. Paciente pode progredir para próxima fase.', '#45B7D1'),

('Hipertrofia de Bíceps', 'Treino específico para desenvolvimento dos bíceps', 'Hipertrofia muscular do bíceps', 'hipertrofia', 'avancado', 40, 2, 'Foco em volume e intensidade para máximo desenvolvimento.', '#96CEB4'),

('Condicionamento Full Body', 'Treino completo para condicionamento físico geral', 'Melhora do condicionamento físico e resistência', 'condicionamento', 'intermediario', 50, 3, 'Treino completo focado em grandes grupos musculares.', '#FECA57');

-- Associar exercícios aos treinos
-- Treino de Emagrecimento
INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 1 FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Treino de Emagrecimento' AND ex.nome = 'Agachamento Livre';

INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 2 FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Treino de Emagrecimento' AND ex.nome = 'Flexão de Braço';

INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 3 FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Treino de Emagrecimento' AND ex.nome = 'Prancha';

-- Fortalecimento Lombar
INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 1 FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Fortalecimento Lombar' AND ex.nome = 'Prancha';

INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 2 FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Fortalecimento Lombar' AND ex.nome = 'Ponte de Glúteo';

-- Posts da comunidade de exemplo
INSERT INTO comunidade_posts (titulo, conteudo, tipo, curtidas, tags) VALUES
('Primeira semana de treino concluída!', 'Consegui terminar minha primeira semana seguindo o programa. Senti uma melhora na dor lombar!', 'conquista', 12, ARRAY['motivacao', 'progresso']),
('Dúvida sobre exercícios de joelho', 'Alguém pode me ajudar com exercícios seguros para reabilitação do joelho?', 'duvida', 5, ARRAY['duvida', 'joelho', 'reabilitacao']),
('Dica: Como manter a motivação', 'Compartilho aqui algumas dicas que me ajudaram a manter a consistência nos treinos...', 'dica', 18, ARRAY['motivacao', 'dicas', 'consistencia']);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles', 'exercises', 'workout_templates', 'workout_exercises',
    'personal_aluno', 'treinos_atribuidos', 'workout_calendar', 'workout_sessions',
    'workout_feedback', 'professional_reports', 'client_exams', 'comunidade_posts',
    'comunidade_comentarios', 'user_streaks'
)
ORDER BY tablename;

-- Verificar exercícios com vídeos
SELECT nome, youtube_url, youtube_embed_id, tags FROM exercises LIMIT 5;

-- ============================================
-- FIM DO SCRIPT - SISTEMA COMPLETO! 🚀
-- ============================================