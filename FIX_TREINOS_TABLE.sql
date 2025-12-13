-- Script para corrigir a tabela treinos para funcionar com o app

-- 1. Primeiro verificar se a tabela treinos existe e criar se não existir
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
  criado_por uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para permitir acesso aos treinos
DROP POLICY IF EXISTS "Users can view and create workouts" ON treinos;
CREATE POLICY "Users can view and create workouts" ON treinos
    FOR ALL USING (publico = true OR criado_por = auth.uid());

-- 4. Criar alguns treinos de exemplo se a tabela estiver vazia
INSERT INTO treinos (exercicio, descricao, categoria, duracao_min, nivel, youtube_url, publico) 
VALUES
('Alongamento Básico', 'Série de alongamentos para todo o corpo', 'flexibilidade', 15, 'iniciante', 'https://youtube.com/watch?v=example1', true),
('Cardio Leve', 'Exercícios cardiovasculares de baixo impacto', 'cardio', 20, 'iniciante', 'https://youtube.com/watch?v=example2', true),
('Fortalecimento Core', 'Exercícios para fortalecimento do abdômen e lombar', 'forca', 25, 'intermediario', 'https://youtube.com/watch?v=example3', true),
('Mobilidade Articular', 'Exercícios para melhorar mobilidade das articulações', 'flexibilidade', 20, 'iniciante', 'https://youtube.com/watch?v=example4', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Verificar se a tabela execucoes_treino precisa ser ajustada para funcionar sem treino_atribuido_id
ALTER TABLE execucoes_treino 
ALTER COLUMN treino_atribuido_id DROP NOT NULL;

-- 6. Adicionar coluna treino_id se não existir (para treinos independentes)
ALTER TABLE execucoes_treino 
ADD COLUMN IF NOT EXISTS treino_id uuid REFERENCES treinos(id) ON DELETE CASCADE;

-- 7. Permitir que execucoes_treino funcione tanto com treinos_atribuidos quanto com treinos simples
-- (treino_atribuido_id OR treino_id deve estar presente)