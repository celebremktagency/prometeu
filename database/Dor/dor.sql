CREATE TABLE IF NOT EXISTS dores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  musculo text NOT NULL,
  nivel numeric(3,1) NOT NULL, -- ex: 3.0
  data_registro timestamp with time zone DEFAULT now()
);