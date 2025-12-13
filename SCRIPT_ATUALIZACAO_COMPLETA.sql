-- =============================================
-- SCRIPT DE ATUALIZAÇÃO COMPLETA DO SISTEMA
-- Sistema de Gerenciamento Profissional para Prometeus
-- Versão: 1.0
-- Data: 2025-01-16
-- =============================================

-- IMPORTANTE: Execute este script no Supabase para implementar o sistema completo

BEGIN;

-- =============================================
-- 1. BACKUP DAS TABELAS EXISTENTES (opcional)
-- =============================================

-- Caso queira fazer backup das tabelas existentes
-- CREATE TABLE users_backup AS SELECT * FROM users;
-- CREATE TABLE treinos_backup AS SELECT * FROM treinos;

-- =============================================
-- 2. ATUALIZAR TABELA DE USUÁRIOS
-- =============================================

-- Adicionar novos tipos de profissionais se a coluna já existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='users' AND column_name='tipo') THEN
        -- Remover constraint antigo se existir
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tipo_check;
        -- Adicionar nova constraint com todos os tipos
        ALTER TABLE users ADD CONSTRAINT users_tipo_check 
        CHECK (tipo IN ('medico', 'personal_trainer', 'fisioterapeuta', 'nutricionista', 'aluno'));
    END IF;
END $$;

-- =============================================
-- 3. CRIAR STORAGE BUCKET PARA DOCUMENTOS MÉDICOS
-- =============================================

-- Criar bucket para documentos médicos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para documentos médicos
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- 4. CRIAR TABELAS DO SISTEMA PROFISSIONAL
-- =============================================

-- 4.1. PROFISSIONAIS
CREATE TABLE IF NOT EXISTS profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo_profissional text NOT NULL CHECK (tipo_profissional IN ('medico', 'personal_trainer', 'fisioterapeuta', 'nutricionista')),
  especialidade text,
  crf_crefito_crmv text, -- Registro profissional
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

-- 4.2. RELACIONAMENTO PROFISSIONAL-CLIENTE
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

-- 4.3. EXAMES E DOCUMENTOS
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

-- 4.4. TREINOS ATRIBUÍDOS
CREATE TABLE IF NOT EXISTS treinos_atribuidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  exercicios jsonb NOT NULL, -- Array de exercícios com detalhes
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

-- 4.5. EXECUÇÕES DE TREINO
CREATE TABLE IF NOT EXISTS execucoes_treino (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_atribuido_id uuid NOT NULL REFERENCES treinos_atribuidos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_execucao timestamp with time zone NOT NULL,
  exercicios_realizados jsonb NOT NULL, -- Array com exercícios realizados e dados
  tempo_total_min integer,
  nivel_dificuldade_percebido integer CHECK (nivel_dificuldade_percebido BETWEEN 1 AND 10),
  observacoes_cliente text,
  finalizado boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 4.6. FEEDBACK PÓS-TREINO
CREATE TABLE IF NOT EXISTS feedback_treino (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_treino_id uuid NOT NULL REFERENCES execucoes_treino(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Escala EVA (0-10)
  nivel_dor_antes integer CHECK (nivel_dor_antes BETWEEN 0 AND 10),
  nivel_dor_durante integer CHECK (nivel_dor_durante BETWEEN 0 AND 10),
  nivel_dor_depois integer CHECK (nivel_dor_depois BETWEEN 0 AND 10),
  -- Avaliação geral
  satisfacao_geral integer CHECK (satisfacao_geral BETWEEN 1 AND 5),
  dificuldade_percebida integer CHECK (dificuldade_percebida BETWEEN 1 AND 5),
  energia_nivel integer CHECK (energia_nivel BETWEEN 1 AND 5),
  -- Sintomas
  sentiu_dor boolean DEFAULT false,
  locais_dor text[], -- Array de locais onde sentiu dor
  intensidade_dor integer CHECK (intensidade_dor BETWEEN 0 AND 10),
  -- Exercícios específicos
  exercicios_dificeis text[], -- Exercícios que teve dificuldade
  exercicios_faceis text[], -- Exercícios que achou fáceis
  -- Observações
  observacoes text,
  recomendaria boolean,
  created_at timestamp with time zone DEFAULT now()
);

-- 4.7. CARGAS E PROGRESSÃO
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

-- 4.8. AVALIAÇÕES PROFISSIONAIS
CREATE TABLE IF NOT EXISTS avaliacoes_profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo_avaliacao text NOT NULL CHECK (tipo_avaliacao IN ('inicial', 'progressao', 'reavaliacao', 'final')),
  peso_kg numeric(5,2),
  altura_cm integer,
  imc numeric(4,2),
  percentual_gordura numeric(4,2),
  massa_muscular_kg numeric(5,2),
  pressao_arterial text,
  frequencia_cardiaca_repouso integer,
  flexibilidade_score integer,
  resistencia_score integer,
  forca_score integer,
  observacoes text,
  recomendacoes text,
  proxima_avaliacao date,
  created_at timestamp with time zone DEFAULT now()
);

-- 4.9. COMUNICAÇÃO PROFISSIONAL-CLIENTE
CREATE TABLE IF NOT EXISTS mensagens_profissional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remetente_tipo text NOT NULL CHECK (remetente_tipo IN ('profissional', 'cliente')),
  remetente_id uuid NOT NULL,
  assunto text,
  conteudo text NOT NULL,
  anexos text[], -- URLs de arquivos anexos
  lida boolean DEFAULT false,
  data_leitura timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 4.10. PLANOS DE TRATAMENTO
CREATE TABLE IF NOT EXISTS planos_tratamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  objetivo_principal text NOT NULL,
  objetivos_secundarios text[],
  duracao_semanas integer NOT NULL,
  fase_atual integer DEFAULT 1,
  total_fases integer DEFAULT 1,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'concluido', 'cancelado')),
  data_inicio date NOT NULL,
  data_prevista_fim date,
  data_real_fim date,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =============================================

-- Profissionais
CREATE INDEX IF NOT EXISTS idx_profissionais_user_id ON profissionais(user_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_tipo ON profissionais(tipo_profissional);

-- Relacionamento profissional-cliente
CREATE INDEX IF NOT EXISTS idx_prof_cliente_profissional ON profissional_cliente(profissional_id);
CREATE INDEX IF NOT EXISTS idx_prof_cliente_cliente ON profissional_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_prof_cliente_status ON profissional_cliente(status);

-- Exames e documentos
CREATE INDEX IF NOT EXISTS idx_exames_cliente ON exames_documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_exames_profissional ON exames_documentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_exames_data ON exames_documentos(data_exame);

-- Treinos atribuídos
CREATE INDEX IF NOT EXISTS idx_treinos_atrib_prof ON treinos_atribuidos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atrib_cliente ON treinos_atribuidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atrib_status ON treinos_atribuidos(status);

-- Execuções de treino
CREATE INDEX IF NOT EXISTS idx_exec_treino_atrib ON execucoes_treino(treino_atribuido_id);
CREATE INDEX IF NOT EXISTS idx_exec_treino_cliente ON execucoes_treino(cliente_id);
CREATE INDEX IF NOT EXISTS idx_exec_treino_data ON execucoes_treino(data_execucao);

-- Feedback
CREATE INDEX IF NOT EXISTS idx_feedback_exec ON feedback_treino(execucao_treino_id);
CREATE INDEX IF NOT EXISTS idx_feedback_cliente ON feedback_treino(cliente_id);

-- Cargas
CREATE INDEX IF NOT EXISTS idx_cargas_exec ON cargas_exercicio(execucao_treino_id);
CREATE INDEX IF NOT EXISTS idx_cargas_cliente ON cargas_exercicio(cliente_id);

-- Avaliações
CREATE INDEX IF NOT EXISTS idx_aval_prof ON avaliacoes_profissionais(profissional_id);
CREATE INDEX IF NOT EXISTS idx_aval_cliente ON avaliacoes_profissionais(cliente_id);

-- =============================================
-- 6. TRIGGERS E FUNÇÕES
-- =============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profissionais_updated_at
    BEFORE UPDATE ON profissionais
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treinos_atrib_updated_at
    BEFORE UPDATE ON treinos_atribuidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planos_trat_updated_at
    BEFORE UPDATE ON planos_tratamento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. POLÍTICAS RLS (Row Level Security)
-- =============================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissional_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_atribuidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargas_exercicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_profissional ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_tratamento ENABLE ROW LEVEL SECURITY;

-- Políticas para profissionais
CREATE POLICY "Profissionais podem ver seus dados" ON profissionais
    FOR ALL USING (user_id = auth.uid());

-- Políticas para relacionamento profissional-cliente
CREATE POLICY "Profissionais veem seus clientes" ON profissional_cliente
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        OR cliente_id = auth.uid()
    );

-- Políticas para exames
CREATE POLICY "Cliente vê seus exames" ON exames_documentos
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Profissional vê exames de seus clientes" ON exames_documentos
    FOR SELECT USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        OR cliente_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

-- Políticas para treinos atribuídos
CREATE POLICY "Treinos atribuídos - profissional" ON treinos_atribuidos
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
    );

CREATE POLICY "Treinos atribuídos - cliente" ON treinos_atribuidos
    FOR SELECT USING (cliente_id = auth.uid());

-- Políticas para execuções
CREATE POLICY "Execuções - cliente" ON execucoes_treino
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Execuções - profissional" ON execucoes_treino
    FOR SELECT USING (
        treino_atribuido_id IN (
            SELECT id FROM treinos_atribuidos 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        )
    );

-- Políticas para feedback
CREATE POLICY "Feedback - cliente" ON feedback_treino
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Feedback - profissional" ON feedback_treino
    FOR SELECT USING (
        execucao_treino_id IN (
            SELECT et.id FROM execucoes_treino et
            JOIN treinos_atribuidos ta ON et.treino_atribuido_id = ta.id
            WHERE ta.profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        )
    );

-- Políticas para cargas
CREATE POLICY "Cargas - cliente" ON cargas_exercicio
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Cargas - profissional" ON cargas_exercicio
    FOR SELECT USING (
        execucao_treino_id IN (
            SELECT et.id FROM execucoes_treino et
            JOIN treinos_atribuidos ta ON et.treino_atribuido_id = ta.id
            WHERE ta.profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        )
    );

-- =============================================
-- 8. VIEWS ÚTEIS
-- =============================================

-- View para dados completos do profissional
CREATE OR REPLACE VIEW view_profissionais_completa AS
SELECT 
    p.*,
    u.nome,
    u.email,
    COUNT(pc.cliente_id) as total_clientes_ativos,
    AVG(CASE WHEN av.created_at > NOW() - INTERVAL '30 days' THEN av.peso_kg END) as peso_medio_clientes
FROM profissionais p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN profissional_cliente pc ON p.id = pc.profissional_id AND pc.status = 'ativo'
LEFT JOIN avaliacoes_profissionais av ON p.id = av.profissional_id
GROUP BY p.id, u.nome, u.email;

-- View para dashboard do cliente
CREATE OR REPLACE VIEW view_cliente_dashboard AS
SELECT 
    pc.cliente_id,
    COUNT(ta.id) as treinos_ativos,
    COUNT(et.id) as execucoes_mes,
    AVG(ft.satisfacao_geral) as satisfacao_media,
    MAX(et.data_execucao) as ultimo_treino
FROM profissional_cliente pc
LEFT JOIN treinos_atribuidos ta ON pc.cliente_id = ta.cliente_id AND ta.status = 'ativo'
LEFT JOIN execucoes_treino et ON ta.id = et.treino_atribuido_id 
    AND et.data_execucao > NOW() - INTERVAL '30 days'
LEFT JOIN feedback_treino ft ON et.id = ft.execucao_treino_id
GROUP BY pc.cliente_id;

-- =============================================
-- 9. MIGRAÇÃO DE DADOS EXISTENTES
-- =============================================

-- Atualizar tipos de usuário existentes
UPDATE users SET tipo = 'personal_trainer' WHERE tipo = 'personal';

-- Criar registros de profissionais para usuários existentes que são personal trainers
INSERT INTO profissionais (user_id, tipo_profissional, aceita_novos_clientes) 
SELECT id, 'personal_trainer', true
FROM users 
WHERE tipo = 'personal_trainer'
AND id NOT IN (SELECT user_id FROM profissionais);

-- =============================================
-- 10. DADOS DE EXEMPLO (opcional)
-- =============================================

-- Inserir alguns tipos de documento padrão se necessário
-- INSERT INTO ... (comentado por segurança)

-- =============================================
-- FINALIZAÇÃO
-- =============================================

COMMIT;

-- Mostrar resumo das tabelas criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profissionais',
    'profissional_cliente',
    'exames_documentos',
    'treinos_atribuidos',
    'execucoes_treino',
    'feedback_treino',
    'cargas_exercicio',
    'avaliacoes_profissionais',
    'mensagens_profissional',
    'planos_tratamento'
)
ORDER BY tablename;

-- =============================================
-- INSTRUÇÕES DE USO:
-- =============================================

/*
1. Execute este script no SQL Editor do Supabase
2. Verifique se todas as tabelas foram criadas corretamente
3. Configure as permissões adicionais no dashboard do Supabase se necessário
4. Teste a aplicação para garantir que tudo funciona corretamente

FUNCIONALIDADES IMPLEMENTADAS:
- Sistema completo de profissionais (médicos, personal trainers, fisioterapeutas, nutricionistas)
- Relacionamento profissional-cliente
- Upload e gerenciamento de exames médicos
- Treinos atribuídos por profissionais a clientes
- Execução de treinos com feedback detalhado
- Sistema de avaliação pós-treino (EVA, satisfação, etc.)
- Registro de cargas e progressão
- Avaliações profissionais periódicas
- Sistema de mensagens profissional-cliente
- Planos de tratamento estruturados

PRÓXIMOS PASSOS:
- Implementar notificações push
- Criar relatórios de progresso
- Adicionar sistema de agendamento
- Integrar com APIs de pagamento
- Criar dashboard analítico
*/