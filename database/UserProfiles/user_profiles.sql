CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  idade integer,
  peso numeric(5,2),
  altura numeric(5,2),
  objetivo text,
  nivel_experiencia text CHECK (nivel_experiencia IN ('Iniciante', 'Intermediário', 'Avançado')),
  dores_existentes text[],
  localizacao_dores text,
  intensidade_dor integer CHECK (intensidade_dor >= 0 AND intensidade_dor <= 10),
  atividade_fisica_frequencia text,
  medicamentos text,
  restricoes_medicas text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);