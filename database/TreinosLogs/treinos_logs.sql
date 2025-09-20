CREATE TABLE IF NOT EXISTS treinos_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  treino_id uuid REFERENCES treinos(id) ON DELETE CASCADE,
  data timestamp with time zone DEFAULT now(),
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'skipped')),
  created_at timestamp with time zone DEFAULT now()
);