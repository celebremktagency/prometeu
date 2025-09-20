CREATE TABLE IF NOT EXISTS dores_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  treino_id uuid REFERENCES treinos(id) ON DELETE SET NULL,
  data timestamp with time zone DEFAULT now(),
  intensidade numeric(3,1) NOT NULL CHECK (intensidade >= 0 AND intensidade <= 10),
  musculo text NOT NULL,
  descricao text,
  created_at timestamp with time zone DEFAULT now()
);