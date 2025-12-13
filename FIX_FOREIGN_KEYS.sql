-- Script para corrigir foreign keys e estrutura do database

-- 1. Criar tabela treinos se não existir com a estrutura correta
CREATE TABLE IF NOT EXISTS treinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio text NOT NULL,
  descricao text,
  series integer DEFAULT 3,
  repeticoes text DEFAULT '10',
  nivel text DEFAULT 'iniciante' CHECK (nivel IN ('iniciante', 'intermediario', 'avancado')),
  categoria text DEFAULT 'personalizado',
  duracao_min integer DEFAULT 30,
  youtube_url text,
  publico boolean DEFAULT false,
  criado_por uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Remover foreign key constraint se existir e estiver causando problema
ALTER TABLE treinos DROP CONSTRAINT IF EXISTS treinos_criado_por_fkey;

-- 3. Recriar a foreign key constraint corretamente
ALTER TABLE treinos 
ADD CONSTRAINT treinos_criado_por_fkey 
FOREIGN KEY (criado_por) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Verificar se a tabela profissionais existe
CREATE TABLE IF NOT EXISTS profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo_profissional text NOT NULL CHECK (tipo_profissional IN ('medico', 'personal_trainer', 'fisioterapeuta', 'nutricionista')),
  especialidade text,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Verificar se a tabela profissional_cliente existe
CREATE TABLE IF NOT EXISTS profissional_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'finalizado')),
  data_inicio timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(profissional_id, cliente_id)
);

-- 6. Criar dados de profissional para todos os personal trainers se não existirem
INSERT INTO profissionais (user_id, tipo_profissional, especialidade) 
SELECT id, 'personal_trainer', 'Treinamento Personalizado'
FROM users 
WHERE tipo = 'personal_trainer'
ON CONFLICT DO NOTHING;

-- 7. Ajustar tabela execucoes_treino para funcionar com treinos independentes
ALTER TABLE execucoes_treino 
ADD COLUMN IF NOT EXISTS treino_id uuid;

-- 8. Adicionar foreign key para treino_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'execucoes_treino_treino_id_fkey' 
        AND table_name = 'execucoes_treino'
    ) THEN
        ALTER TABLE execucoes_treino 
        ADD CONSTRAINT execucoes_treino_treino_id_fkey 
        FOREIGN KEY (treino_id) REFERENCES treinos(id) ON DELETE CASCADE;
    END IF;
END$$;

-- 9. Habilitar RLS nas tabelas
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissional_cliente ENABLE ROW LEVEL SECURITY;

-- 10. Criar políticas RLS
DROP POLICY IF EXISTS "Users can view and create workouts" ON treinos;
CREATE POLICY "Users can view and create workouts" ON treinos
    FOR ALL USING (publico = true OR criado_por = auth.uid());

DROP POLICY IF EXISTS "Profissionais podem ver seus dados" ON profissionais;
CREATE POLICY "Profissionais podem ver seus dados" ON profissionais
    FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Profissionais veem seus clientes" ON profissional_cliente;
CREATE POLICY "Profissionais veem seus clientes" ON profissional_cliente
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        OR cliente_id = auth.uid()
    );