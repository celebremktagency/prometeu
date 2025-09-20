CREATE TABLE IF NOT EXISTS pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plano text NOT NULL CHECK (plano IN ('mensal', 'anual')),
  valor numeric(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled')),
  metodo_pagamento text CHECK (metodo_pagamento IN ('cartao', 'pix')),
  gateway_transaction_id text,
  data_inicio timestamp with time zone NOT NULL,
  data_fim timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);