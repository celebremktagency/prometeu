-- =============================================
-- SCRIPT SISTEMA PROFISSIONAL - VERSÃO SIMPLES
-- Executar APÓS o script base
-- =============================================

BEGIN;

-- =============================================
-- 1. CRIAR STORAGE BUCKET PARA DOCUMENTOS
-- =============================================

-- Criar bucket para documentos médicos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. CRIAR TABELAS DO SISTEMA PROFISSIONAL
-- =============================================

-- 2.1. PROFISSIONAIS
CREATE TABLE IF NOT EXISTS profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- 2.2. RELACIONAMENTO PROFISSIONAL-CLIENTE
CREATE TABLE IF NOT EXISTS profissional_cliente (
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

-- 2.3. EXAMES E DOCUMENTOS
CREATE TABLE IF NOT EXISTS exames_documentos (
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

-- 2.4. TREINOS ATRIBUÍDOS
CREATE TABLE IF NOT EXISTS treinos_atribuidos (
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

-- 2.5. EXECUÇÕES DE TREINO
CREATE TABLE IF NOT EXISTS execucoes_treino (
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

-- 2.6. FEEDBACK PÓS-TREINO
CREATE TABLE IF NOT EXISTS feedback_treino (
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

-- 2.7. CARGAS E PROGRESSÃO
CREATE TABLE IF NOT EXISTS cargas_exercicio (
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
-- 3. ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profissionais_user_id ON profissionais(user_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_tipo ON profissionais(tipo_profissional);
CREATE INDEX IF NOT EXISTS idx_prof_cliente_profissional ON profissional_cliente(profissional_id);
CREATE INDEX IF NOT EXISTS idx_prof_cliente_cliente ON profissional_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_exames_cliente ON exames_documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atrib_cliente ON treinos_atribuidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_exec_treino_cliente ON execucoes_treino(cliente_id);
CREATE INDEX IF NOT EXISTS idx_feedback_cliente ON feedback_treino(cliente_id);

-- =============================================
-- 4. TRIGGERS E FUNÇÕES
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profissionais_updated_at
    BEFORE UPDATE ON profissionais
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treinos_atrib_updated_at
    BEFORE UPDATE ON treinos_atribuidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. POLÍTICAS RLS
-- =============================================

ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissional_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_atribuidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargas_exercicio ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Profissionais podem ver seus dados" ON profissionais
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Relacionamento profissional-cliente" ON profissional_cliente
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        OR cliente_id = auth.uid()
    );

CREATE POLICY "Exames - cliente" ON exames_documentos
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Treinos atribuídos - cliente" ON treinos_atribuidos
    FOR SELECT USING (cliente_id = auth.uid());

CREATE POLICY "Treinos atribuídos - profissional" ON treinos_atribuidos
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
    );

CREATE POLICY "Execuções - cliente" ON execucoes_treino
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Feedback - cliente" ON feedback_treino
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Cargas - cliente" ON cargas_exercicio
    FOR ALL USING (cliente_id = auth.uid());

-- =============================================
-- 6. POLÍTICAS DE STORAGE
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
-- 7. MIGRAÇÃO DE DADOS EXISTENTES
-- =============================================

-- Criar registros de profissionais para usuários existentes
INSERT INTO profissionais (user_id, tipo_profissional, aceita_novos_clientes) 
SELECT id, tipo, true
FROM users 
WHERE tipo IN ('medico', 'personal_trainer', 'fisioterapeuta', 'nutricionista')
AND id NOT IN (SELECT user_id FROM profissionais WHERE user_id IS NOT NULL);

-- =============================================
-- FINALIZAÇÃO
-- =============================================

COMMIT;

-- Verificar criação das tabelas
SELECT tablename, tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profissionais',
    'profissional_cliente',
    'exames_documentos',
    'treinos_atribuidos',
    'execucoes_treino',
    'feedback_treino',
    'cargas_exercicio'
)
ORDER BY tablename;