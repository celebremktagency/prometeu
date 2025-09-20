CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('personal', 'aluno')),
  plano text DEFAULT 'trial' CHECK (plano IN ('trial', 'mensal', 'anual')),
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);