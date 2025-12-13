-- =============================================
-- SCRIPT COMPLETO - CRIAÇÃO DO ZERO
-- Cria todo o sistema Prometeus com funcionalidades profissionais
-- Execute este script DEPOIS de dropar tudo com SCRIPT_DROP_TUDO.sql
-- =============================================

BEGIN;

-- =============================================
-- 1. CRIAR TABELA USERS (BASE)
-- =============================================

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('medico', 'personal_trainer', 'fisioterapeuta', 'nutricionista', 'aluno')),
  plano text DEFAULT 'trial' CHECK (plano IN ('trial', 'mensal', 'anual')),
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 2. CRIAR TABELAS BÁSICAS
-- =============================================

-- Tabela de dores
CREATE TABLE dores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  musculo text NOT NULL,
  nivel numeric(3,1) NOT NULL,
  data_registro timestamp with time zone DEFAULT now()
);

-- Tabela de treinos básica
CREATE TABLE treinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  exercicio text NOT NULL,
  series int DEFAULT 3,
  repeticoes text DEFAULT '10',
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'skipped')),
  observacoes text,
  data_criacao timestamp with time zone DEFAULT now(),
  data_execucao timestamp with time zone
);

-- Tabela de insights
CREATE TABLE insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  categoria text,
  data_criacao timestamp with time zone DEFAULT now(),
  visualizado boolean DEFAULT false
);

-- Tabela de perfis de usuário
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  peso numeric(5,2),
  idade integer,
  altura integer,
  objetivo text,
  nivel_experiencia text,
  dores_existentes text[],
  localizacao_dores text,
  intensidade_dor integer,
  atividade_fisica_frequencia text,
  medicamentos text,
  restricoes_medicas text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de streaks
CREATE TABLE user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_workout_date date,
  total_workouts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 3. SISTEMA PROFISSIONAL
-- =============================================

-- 3.1. PROFISSIONAIS
CREATE TABLE profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tipo_profissional text NOT NULL CHECK (tipo_profissional IN ('medico', 'personal_trainer', 'fisioterapeuta', 'nutricionista')),
  especialidade text,
  crf_crefito_crmv text,
  descricao text,
  experiencia_anos integer DEFAULT 0,
  preco_consulta numeric(10,2),
  aceita_novos_clientes boolean DEFAULT true,
  avaliacao_media numeric(3,2) DEFAULT 0.0,
  total_avaliacoes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3.2. RELACIONAMENTO PROFISSIONAL-CLIENTE
CREATE TABLE profissional_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'finalizado')),
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(profissional_id, cliente_id)
);

-- 3.3. EXAMES E DOCUMENTOS
CREATE TABLE exames_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profissional_id uuid REFERENCES profissionais(id) ON DELETE SET NULL,
  tipo_documento text NOT NULL CHECK (tipo_documento IN ('exame_sangue', 'raio_x', 'ressonancia', 'ultrassom', 'laudo_medico', 'prescricao', 'atestado', 'outro')),
  titulo text NOT NULL,
  descricao text,
  url_arquivo text NOT NULL,
  data_exame date,
  data_upload timestamp with time zone DEFAULT now(),
  visivel_para_profissionais boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 3.4. TREINOS ATRIBUÍDOS
CREATE TABLE treinos_atribuidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  exercicios jsonb NOT NULL DEFAULT '[]',
  objetivo text,
  nivel_dificuldade text CHECK (nivel_dificuldade IN ('iniciante', 'intermediario', 'avancado')),
  duracao_estimada_min integer,
  frequencia_semanal integer DEFAULT 1,
  data_inicio date NOT NULL,
  data_fim date,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'finalizado')),
  observacoes_profissional text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3.5. EXECUÇÕES DE TREINO
CREATE TABLE execucoes_treino (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_atribuido_id uuid NOT NULL REFERENCES treinos_atribuidos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_execucao timestamp with time zone NOT NULL,
  exercicios_realizados jsonb NOT NULL DEFAULT '[]',
  tempo_total_min integer,
  nivel_dificuldade_percebido integer CHECK (nivel_dificuldade_percebido BETWEEN 1 AND 10),
  observacoes_cliente text,
  finalizado boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 3.6. FEEDBACK PÓS-TREINO
CREATE TABLE feedback_treino (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_treino_id uuid NOT NULL REFERENCES execucoes_treino(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nivel_dor_antes integer CHECK (nivel_dor_antes BETWEEN 0 AND 10),
  nivel_dor_durante integer CHECK (nivel_dor_durante BETWEEN 0 AND 10),
  nivel_dor_depois integer CHECK (nivel_dor_depois BETWEEN 0 AND 10),
  satisfacao_geral integer CHECK (satisfacao_geral BETWEEN 1 AND 5),
  dificuldade_percebida integer CHECK (dificuldade_percebida BETWEEN 1 AND 5),
  energia_nivel integer CHECK (energia_nivel BETWEEN 1 AND 5),
  sentiu_dor boolean DEFAULT false,
  locais_dor text[],
  intensidade_dor integer CHECK (intensidade_dor BETWEEN 0 AND 10),
  exercicios_dificeis text[],
  exercicios_faceis text[],
  observacoes text,
  recomendaria boolean,
  created_at timestamp with time zone DEFAULT now()
);

-- 3.7. CARGAS E PROGRESSÃO
CREATE TABLE cargas_exercicio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_treino_id uuid NOT NULL REFERENCES execucoes_treino(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercicio_nome text NOT NULL,
  serie_numero integer NOT NULL,
  peso_kg numeric(5,2),
  repeticoes_realizadas integer,
  tempo_descanso_seg integer,
  observacoes text,
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices básicos
CREATE INDEX idx_dores_usuario_id ON dores(usuario_id);
CREATE INDEX idx_treinos_usuario_id ON treinos(usuario_id);
CREATE INDEX idx_insights_usuario_id ON insights(usuario_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);

-- Índices do sistema profissional
CREATE INDEX idx_profissionais_user_id ON profissionais(user_id);
CREATE INDEX idx_profissionais_tipo ON profissionais(tipo_profissional);
CREATE INDEX idx_prof_cliente_profissional ON profissional_cliente(profissional_id);
CREATE INDEX idx_prof_cliente_cliente ON profissional_cliente(cliente_id);
CREATE INDEX idx_prof_cliente_status ON profissional_cliente(status);
CREATE INDEX idx_exames_cliente ON exames_documentos(cliente_id);
CREATE INDEX idx_exames_profissional ON exames_documentos(profissional_id);
CREATE INDEX idx_treinos_atrib_prof ON treinos_atribuidos(profissional_id);
CREATE INDEX idx_treinos_atrib_cliente ON treinos_atribuidos(cliente_id);
CREATE INDEX idx_treinos_atrib_status ON treinos_atribuidos(status);
CREATE INDEX idx_exec_treino_atrib ON execucoes_treino(treino_atribuido_id);
CREATE INDEX idx_exec_treino_cliente ON execucoes_treino(cliente_id);
CREATE INDEX idx_exec_treino_data ON execucoes_treino(data_execucao);
CREATE INDEX idx_feedback_exec ON feedback_treino(execucao_treino_id);
CREATE INDEX idx_feedback_cliente ON feedback_treino(cliente_id);
CREATE INDEX idx_cargas_exec ON cargas_exercicio(execucao_treino_id);
CREATE INDEX idx_cargas_cliente ON cargas_exercicio(cliente_id);

-- =============================================
-- 5. FUNÇÕES E TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profissionais_updated_at
    BEFORE UPDATE ON profissionais
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treinos_atrib_updated_at
    BEFORE UPDATE ON treinos_atribuidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. HABILITAR RLS E CRIAR POLÍTICAS
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dores ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissional_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_atribuidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargas_exercicio ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can view own data" ON users FOR ALL USING (id = auth.uid());
CREATE POLICY "Users can view own dores" ON dores FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "Users can view own treinos" ON treinos FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "Users can view own insights" ON insights FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "Users can view own profile" ON user_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view own streaks" ON user_streaks FOR ALL USING (user_id = auth.uid());

-- Políticas do sistema profissional
CREATE POLICY "Profissionais podem ver seus dados" ON profissionais
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Relacionamento profissional-cliente" ON profissional_cliente
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        OR cliente_id = auth.uid()
    );

CREATE POLICY "Exames - cliente" ON exames_documentos
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Exames - profissional pode ver" ON exames_documentos
    FOR SELECT USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        OR cliente_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

CREATE POLICY "Treinos atribuídos - cliente" ON treinos_atribuidos
    FOR SELECT USING (cliente_id = auth.uid());

CREATE POLICY "Treinos atribuídos - profissional" ON treinos_atribuidos
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
    );

CREATE POLICY "Execuções - cliente" ON execucoes_treino
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Execuções - profissional pode ver" ON execucoes_treino
    FOR SELECT USING (
        treino_atribuido_id IN (
            SELECT id FROM treinos_atribuidos 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Feedback - cliente" ON feedback_treino
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Feedback - profissional pode ver" ON feedback_treino
    FOR SELECT USING (
        execucao_treino_id IN (
            SELECT et.id FROM execucoes_treino et
            JOIN treinos_atribuidos ta ON et.treino_atribuido_id = ta.id
            WHERE ta.profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Cargas - cliente" ON cargas_exercicio
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Cargas - profissional pode ver" ON cargas_exercicio
    FOR SELECT USING (
        execucao_treino_id IN (
            SELECT et.id FROM execucoes_treino et
            JOIN treinos_atribuidos ta ON et.treino_atribuido_id = ta.id
            WHERE ta.profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        )
    );

-- =============================================
-- 7. CRIAR STORAGE BUCKET
-- =============================================

-- Criar bucket para documentos médicos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 8. POLÍTICAS DE STORAGE
-- =============================================

CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'medical-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'medical-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'medical-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- 9. INSERIR DADOS INICIAIS
-- =============================================

-- Usuário admin de teste
INSERT INTO users (nome, email, tipo) 
VALUES ('Admin Prometeus', 'admin@prometeus.com', 'personal_trainer')
ON CONFLICT (email) DO NOTHING;

-- Inserir alguns insights iniciais
INSERT INTO insights (usuario_id, titulo, conteudo, categoria)
SELECT 
    id,
    'Bem-vindo ao Prometeus!',
    'Você agora faz parte do sistema Prometeus. Configure seu perfil e comece sua jornada de saúde e fitness.',
    'boas-vindas'
FROM users 
WHERE email = 'admin@prometeus.com'
ON CONFLICT DO NOTHING;

-- =============================================
-- FINALIZAÇÃO
-- =============================================

COMMIT;

-- Verificar criação das tabelas
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Contar registros nas tabelas principais
SELECT 
    'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'profissionais', COUNT(*) FROM profissionais
UNION ALL
SELECT 'insights', COUNT(*) FROM insights;

-- =============================================
-- SUCESSO!
-- =============================================

-- Sistema Prometeus criado com sucesso!
-- Tabelas básicas: users, dores, treinos, insights, user_profiles, user_streaks
-- Sistema profissional: profissionais, profissional_cliente, exames_documentos,
--                      treinos_atribuidos, execucoes_treino, feedback_treino, cargas_exercicio
-- Storage: bucket medical-documents configurado
-- RLS: Políticas de segurança implementadas
-- Dados: Usuário admin e insights iniciais inseridos