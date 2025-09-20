CREATE TABLE IF NOT EXISTS comunidade_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES comunidade_posts(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES users(id) ON DELETE CASCADE,
  conteudo text NOT NULL CHECK (length(conteudo) <= 300),
  data timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);