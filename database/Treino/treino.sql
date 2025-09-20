CREATE TABLE IF NOT EXISTS treinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  tipo text,
  series int DEFAULT 3,
  repeticoes text DEFAULT '10',
  nivel text DEFAULT 'iniciante' CHECK (nivel IN ('iniciante', 'intermediario', 'avancado')),
  created_at timestamp with time zone DEFAULT now()
);