-- ============================================
-- ADICIONAR TABELAS DE EXERCÍCIOS - COMPATIBILIDADE MOCK
-- Execute no Supabase para dar suporte aos exercícios
-- ============================================

-- 1. CRIAR TABELA DE EXERCÍCIOS
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  series INTEGER DEFAULT 3,
  repeticoes VARCHAR(50), -- Pode ser "10-15" ou "30 segundos"
  descanso VARCHAR(50) DEFAULT '60 segundos',
  grupo_muscular VARCHAR(100),
  equipamento VARCHAR(100),
  instrucoes TEXT[], -- Array de instruções passo a passo
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RELACIONAMENTO TREINO-EXERCÍCIOS (MANY-TO-MANY)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 1,
  series_customizado INTEGER, -- Override do exercício base
  repeticoes_customizado VARCHAR(50), -- Override do exercício base
  descanso_customizado VARCHAR(50), -- Override do exercício base
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workout_id, exercise_id)
);

-- 3. ATUALIZAR WORKOUT_TEMPLATES PARA COMPATIBILIDADE
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS nivel_dificuldade VARCHAR(20) DEFAULT 'iniciante' CHECK (nivel_dificuldade IN ('iniciante', 'intermediario', 'avancado'));
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS frequencia_semanal INTEGER DEFAULT 3;
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS objetivo TEXT;
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS observacoes_profissional TEXT;

-- 4. TABELA PARA RELATÓRIOS
CREATE TABLE IF NOT EXISTS professional_reports (
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

-- 5. TABELA PARA EXAMES
CREATE TABLE IF NOT EXISTS client_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(300) NOT NULL,
  tipo VARCHAR(100) NOT NULL, -- 'Ressonância Magnética', 'Raio-X', etc
  tipo_documento VARCHAR(50) DEFAULT 'exame',
  data_exame DATE,
  data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nome_arquivo VARCHAR(300),
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'analisado', 'em_analise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. HABILITAR RLS NAS NOVAS TABELAS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_exams ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE SEGURANÇA
-- Exercises - públicos ou criados pelo usuário
CREATE POLICY "exercises_select" ON exercises FOR SELECT USING (
  is_public = true OR created_by = auth.uid()
);

CREATE POLICY "exercises_insert" ON exercises FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "exercises_update" ON exercises FOR UPDATE USING (
  created_by = auth.uid()
);

-- Workout_exercises - apenas quem criou o treino
CREATE POLICY "workout_exercises_all" ON workout_exercises FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workout_templates wt 
    WHERE wt.id = workout_exercises.workout_id 
    AND wt.created_by = auth.uid()
  )
);

-- Professional_reports - profissional ou cliente pode ver
CREATE POLICY "professional_reports_all" ON professional_reports FOR ALL USING (
  profissional_id = auth.uid() OR cliente_id = auth.uid()
);

-- Client_exams - profissional ou cliente pode ver
CREATE POLICY "client_exams_all" ON client_exams FOR ALL USING (
  profissional_id = auth.uid() OR cliente_id = auth.uid()
);

-- 8. INSERIR EXERCÍCIOS DE EXEMPLO
INSERT INTO exercises (nome, descricao, series, repeticoes, descanso, grupo_muscular, equipamento, is_public, instrucoes) VALUES
('Prancha', 'Prancha isométrica para fortalecimento do core', 3, '30-60 segundos', '60 segundos', 'Core', 'Nenhum', true, 
 ARRAY['Deite-se de barriga para baixo', 'Apoie-se nos antebraços e dedos dos pés', 'Mantenha o corpo reto como uma prancha', 'Contraia o abdômen', 'Mantenha a posição pelo tempo indicado']),

('Ponte de Glúteo', 'Exercício para fortalecer glúteos e região lombar', 3, '15', '45 segundos', 'Glúteos', 'Nenhum', true,
 ARRAY['Deite-se de costas com joelhos dobrados', 'Pés apoiados no chão', 'Contraia os glúteos e levante o quadril', 'Forme uma linha reta dos joelhos aos ombros', 'Abaixe controladamente']),

('Fortalecimento de Quadríceps', 'Exercício isométrico para quadríceps', 2, '12', '90 segundos', 'Quadríceps', 'Elástico', true,
 ARRAY['Sente-se em uma cadeira', 'Coloque o elástico no tornozelo', 'Estenda a perna lentamente', 'Contraia o músculo da coxa', 'Retorne à posição inicial controladamente']);

-- 9. CRIAR TREINOS DE EXEMPLO
INSERT INTO workout_templates (name, description, nivel_dificuldade, estimated_duration_minutes, frequencia_semanal, objetivo, observacoes_profissional, is_public) VALUES
('Fortalecimento Lombar', 'Treino focado em fortalecer a região lombar e core', 'intermediario', 45, 3, 'Fortalecimento e estabilização da região lombar', 'Paciente respondendo bem aos exercícios. Aumentar intensidade na próxima semana.', true),

('Reabilitação de Joelho', 'Exercícios específicos para reabilitação do joelho', 'iniciante', 30, 4, 'Reabilitação e fortalecimento do joelho', 'Sem dor durante os exercícios. Paciente pode progredir para próxima fase.', true);

-- 10. ASSOCIAR EXERCÍCIOS AOS TREINOS (assumindo IDs gerados)
-- Nota: Em produção, você precisará pegar os IDs reais gerados
-- Este é apenas um exemplo da estrutura

-- INSTRUÇÕES FINAIS:
-- 1. Execute este script no Supabase
-- 2. Verifique se as tabelas foram criadas
-- 3. Atualize os services para usar as novas estruturas
-- 4. Teste a compatibilidade entre mock e banco

-- ============================================
-- FIM DO SCRIPT
-- ============================================