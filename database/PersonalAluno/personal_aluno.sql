CREATE TABLE IF NOT EXISTS personal_aluno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id uuid REFERENCES users(id) ON DELETE CASCADE,
  aluno_id uuid REFERENCES users(id) ON DELETE CASCADE,
  data_vinculo timestamp with time zone DEFAULT now(),
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(aluno_id), -- Aluno só pode ter 1 personal
  CHECK (personal_id != aluno_id) -- Personal não pode ser aluno de si mesmo
);