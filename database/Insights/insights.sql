CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  progresso_semanal numeric,
  nivel_dor numeric,
  data_registro timestamp with time zone DEFAULT now()
);