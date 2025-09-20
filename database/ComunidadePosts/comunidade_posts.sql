CREATE TABLE IF NOT EXISTS comunidade_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  conteudo text NOT NULL CHECK (length(conteudo) <= 1000),
  imagem_url text,
  data timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);