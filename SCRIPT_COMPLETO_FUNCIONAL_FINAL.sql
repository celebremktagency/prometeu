-- ============================================
-- SCRIPT COMPLETO FUNCIONAL FINAL - PROMETEUS APP
-- Execute este arquivo INTEIRO no Supabase SQL Editor
-- ============================================

-- 1. REMOVER TODAS AS TABELAS EXISTENTES (RESET COMPLETO)
DROP TABLE IF EXISTS workout_sessions CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS professional_reports CASCADE;
DROP TABLE IF EXISTS client_exams CASCADE;
DROP TABLE IF EXISTS treinos_atribuidos CASCADE;
DROP TABLE IF EXISTS personal_aluno CASCADE;
DROP TABLE IF EXISTS workout_templates CASCADE;
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
  email VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('aluno', 'personal_trainer')),
  data_nascimento DATE,
  telefone VARCHAR(20),
  objetivo_principal VARCHAR(100),
  nivel_dor_atual INTEGER DEFAULT 0 CHECK (nivel_dor_atual >= 0 AND nivel_dor_atual <= 10),
  localizacao_dor TEXT,
  atividade_fisica_frequencia VARCHAR(50),
  medicamentos TEXT,
  restricoes_medicas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA DE EXERCÍCIOS
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
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA DE TEMPLATES DE TREINO
CREATE TABLE workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  nivel_dificuldade VARCHAR(20) DEFAULT 'iniciante' CHECK (nivel_dificuldade IN ('iniciante', 'intermediario', 'avancado')),
  duracao_estimada_min INTEGER DEFAULT 30,
  frequencia_semanal INTEGER DEFAULT 3,
  observacoes_profissional TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RELACIONAMENTO TREINO-EXERCÍCIOS
CREATE TABLE workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 1,
  series_customizado INTEGER,
  repeticoes_customizado VARCHAR(50),
  descanso_customizado VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(personal_id, aluno_id)
);

-- 7. TREINOS ATRIBUÍDOS COM CALENDÁRIO
CREATE TABLE treinos_atribuidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  data_atribuicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_inicio DATE,
  data_fim DATE,
  dias_semana INTEGER[] DEFAULT ARRAY[1,3,5], -- 0=dom, 1=seg, 2=ter, etc
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'pausado', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SESSÕES DE TREINO (EXECUÇÃO)
CREATE TABLE workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fim TIMESTAMP WITH TIME ZONE,
  nivel_dor_antes INTEGER CHECK (nivel_dor_antes >= 0 AND nivel_dor_antes <= 10),
  nivel_dor_depois INTEGER CHECK (nivel_dor_depois >= 0 AND nivel_dor_depois <= 10),
  exercicios_completados INTEGER DEFAULT 0,
  duracao_real_min INTEGER,
  observacoes_cliente TEXT,
  dificuldade_percebida VARCHAR(20) CHECK (dificuldade_percebida IN ('facil', 'medio', 'dificil')),
  status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'interrompido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. RELATÓRIOS PROFISSIONAIS
CREATE TABLE professional_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(300) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'progresso' CHECK (tipo IN ('avaliacao_inicial', 'progresso', 'final')),
  conteudo TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizado', 'em_andamento')),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. EXAMES DE CLIENTES
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
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'analisado', 'em_analise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. COMUNIDADE
CREATE TABLE comunidade_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  autor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(200),
  conteudo TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'post' CHECK (tipo IN ('post', 'duvida', 'conquista', 'dica')),
  curtidas INTEGER DEFAULT 0,
  visualizacoes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE comunidade_comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES comunidade_posts(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comunidade_comentarios(id),
  curtidas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. SISTEMA DE CURTIDAS
CREATE TABLE comunidade_curtidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES comunidade_posts(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES comunidade_comentarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_like_target CHECK (
    (post_id IS NOT NULL AND comentario_id IS NULL) OR
    (post_id IS NULL AND comentario_id IS NOT NULL)
  )
);

-- 13. SISTEMA DE SEQUÊNCIAS
CREATE TABLE user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. LOGS DE TREINOS E DOR
CREATE TABLE treinos_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duracao_min INTEGER,
  exercicios_completados INTEGER,
  nivel_satisfacao INTEGER CHECK (nivel_satisfacao >= 1 AND nivel_satisfacao <= 5),
  observacoes TEXT
);

CREATE TABLE dores_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nivel_dor INTEGER NOT NULL CHECK (nivel_dor >= 0 AND nivel_dor <= 10),
  localizacao VARCHAR(200),
  observacoes TEXT,
  contexto VARCHAR(50) CHECK (contexto IN ('antes_treino', 'depois_treino', 'geral'))
);

-- 15. PAGAMENTOS
CREATE TABLE pagamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  tipo VARCHAR(50) DEFAULT 'mensalidade',
  data_vencimento DATE,
  data_pagamento TIMESTAMP WITH TIME ZONE,
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
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_curtidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dores_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas simples e funcionais
CREATE POLICY "user_profiles_own" ON user_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "exercises_all" ON exercises FOR ALL USING (true);
CREATE POLICY "workout_templates_all" ON workout_templates FOR ALL USING (true);
CREATE POLICY "workout_exercises_all" ON workout_exercises FOR ALL USING (true);
CREATE POLICY "personal_aluno_related" ON personal_aluno FOR ALL USING (personal_id = auth.uid() OR aluno_id = auth.uid());
CREATE POLICY "treinos_atribuidos_related" ON treinos_atribuidos FOR ALL USING (personal_id = auth.uid() OR aluno_id = auth.uid());
CREATE POLICY "workout_sessions_own" ON workout_sessions FOR ALL USING (aluno_id = auth.uid());
CREATE POLICY "professional_reports_related" ON professional_reports FOR ALL USING (profissional_id = auth.uid() OR cliente_id = auth.uid());
CREATE POLICY "client_exams_related" ON client_exams FOR ALL USING (profissional_id = auth.uid() OR cliente_id = auth.uid());
CREATE POLICY "comunidade_posts_all" ON comunidade_posts FOR ALL USING (true);
CREATE POLICY "comunidade_comentarios_all" ON comunidade_comentarios FOR ALL USING (true);
CREATE POLICY "comunidade_curtidas_own" ON comunidade_curtidas FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "user_streaks_own" ON user_streaks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "treinos_logs_own" ON treinos_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "dores_logs_own" ON dores_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "pagamentos_own" ON pagamentos FOR ALL USING (user_id = auth.uid());

-- ============================================
-- DADOS DE EXEMPLO
-- ============================================

-- Inserir exercícios básicos
INSERT INTO exercises (nome, descricao, series, repeticoes, descanso, grupo_muscular, equipamento, instrucoes) VALUES
('Prancha', 'Prancha isométrica para fortalecimento do core', 3, '30-60 segundos', '60 segundos', 'Core', 'Nenhum', 
 ARRAY['Deite-se de barriga para baixo', 'Apoie-se nos antebraços e dedos dos pés', 'Mantenha o corpo reto como uma prancha', 'Contraia o abdômen', 'Mantenha a posição pelo tempo indicado']),

('Ponte de Glúteo', 'Exercício para fortalecer glúteos e região lombar', 3, '15', '45 segundos', 'Glúteos', 'Nenhum',
 ARRAY['Deite-se de costas com joelhos dobrados', 'Pés apoiados no chão', 'Contraia os glúteos e levante o quadril', 'Forme uma linha reta dos joelhos aos ombros', 'Abaixe controladamente']),

('Fortalecimento de Quadríceps', 'Exercício isométrico para quadríceps', 2, '12', '90 segundos', 'Quadríceps', 'Elástico',
 ARRAY['Sente-se em uma cadeira', 'Coloque o elástico no tornozelo', 'Estenda a perna lentamente', 'Contraia o músculo da coxa', 'Retorne à posição inicial controladamente']),

('Agachamento Livre', 'Agachamento básico para fortalecimento de membros inferiores', 3, '12-15', '60 segundos', 'Membros Inferiores', 'Nenhum',
 ARRAY['Fique em pé com pés na largura dos ombros', 'Desça flexionando joelhos e quadril', 'Mantenha as costas retas', 'Desça até formar 90 graus nos joelhos', 'Suba controladamente']),

('Flexão de Braço', 'Flexão de braço tradicional', 3, '8-12', '60 segundos', 'Membros Superiores', 'Nenhum',
 ARRAY['Posição de prancha com braços estendidos', 'Mãos na largura dos ombros', 'Desça flexionando os braços', 'Mantenha o corpo alinhado', 'Suba empurrando o chão']);

-- Criar templates de treino
INSERT INTO workout_templates (nome, descricao, objetivo, nivel_dificuldade, duracao_estimada_min, frequencia_semanal, observacoes_profissional) VALUES
('Fortalecimento Lombar', 'Treino focado em fortalecer a região lombar e core', 'Fortalecimento e estabilização da região lombar', 'intermediario', 45, 3, 'Paciente respondendo bem aos exercícios. Aumentar intensidade na próxima semana.'),

('Reabilitação de Joelho', 'Exercícios específicos para reabilitação do joelho', 'Reabilitação e fortalecimento do joelho', 'iniciante', 30, 4, 'Sem dor durante os exercícios. Paciente pode progredir para próxima fase.'),

('Treino Full Body', 'Treino completo para todo o corpo', 'Fortalecimento geral e condicionamento', 'intermediario', 60, 3, 'Treino completo focado em grandes grupos musculares.');

-- Associar exercícios aos treinos (vamos pegar os IDs que foram gerados)
-- Workout 1: Fortalecimento Lombar (Prancha + Ponte de Glúteo)
INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 1 
FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Fortalecimento Lombar' AND ex.nome = 'Prancha';

INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 2 
FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Fortalecimento Lombar' AND ex.nome = 'Ponte de Glúteo';

-- Workout 2: Reabilitação de Joelho (Fortalecimento de Quadríceps)
INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 1 
FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Reabilitação de Joelho' AND ex.nome = 'Fortalecimento de Quadríceps';

-- Workout 3: Treino Full Body (Agachamento + Flexão + Prancha)
INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 1 
FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Treino Full Body' AND ex.nome = 'Agachamento Livre';

INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 2 
FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Treino Full Body' AND ex.nome = 'Flexão de Braço';

INSERT INTO workout_exercises (workout_id, exercise_id, ordem) 
SELECT wt.id, ex.id, 3 
FROM workout_templates wt, exercises ex 
WHERE wt.nome = 'Treino Full Body' AND ex.nome = 'Prancha';

-- Posts da comunidade de exemplo
INSERT INTO comunidade_posts (titulo, conteudo, tipo, curtidas) VALUES
('Primeira semana de treino concluída!', 'Consegui terminar minha primeira semana seguindo o programa. Senti uma melhora na dor lombar!', 'conquista', 12),
('Dúvida sobre exercícios de joelho', 'Alguém pode me ajudar com exercícios seguros para reabilitação do joelho?', 'duvida', 5),
('Dica: Como manter a motivação', 'Compartilho aqui algumas dicas que me ajudaram a manter a consistência nos treinos...', 'dica', 18);

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para calcular streak do usuário
CREATE OR REPLACE FUNCTION calculate_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak_count INTEGER := 0;
    last_date DATE;
    check_date DATE;
BEGIN
    -- Buscar a data do último treino
    SELECT MAX(DATE(data_inicio)) INTO last_date
    FROM workout_sessions 
    WHERE aluno_id = user_uuid AND status = 'concluido';
    
    -- Se não há treinos, retorna 0
    IF last_date IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Verificar sequência contínua
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
    'personal_aluno', 'treinos_atribuidos', 'workout_sessions',
    'professional_reports', 'client_exams', 'comunidade_posts',
    'comunidade_comentarios', 'user_streaks'
)
ORDER BY tablename;

-- ============================================
-- FIM DO SCRIPT - TUDO PRONTO! 🚀
-- ============================================