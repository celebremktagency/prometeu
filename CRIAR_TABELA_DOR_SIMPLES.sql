-- Criar tabela de registros de dor
CREATE TABLE IF NOT EXISTS public.registros_dor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    localizacao text NOT NULL,
    nivel_dor integer CHECK (nivel_dor BETWEEN 0 AND 10),
    data_registro timestamp with time zone DEFAULT now(),
    observacoes text,
    tipo_registro text DEFAULT 'manual',
    created_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_registros_dor_aluno ON registros_dor(aluno_id);
CREATE INDEX IF NOT EXISTS idx_registros_dor_data ON registros_dor(data_registro);

-- RLS
ALTER TABLE registros_dor ENABLE ROW LEVEL SECURITY;

-- Política permissiva
CREATE POLICY "Users can manage their own pain records" ON registros_dor
    FOR ALL USING (aluno_id = auth.uid());

-- Adicionar campo meta_semanal em user_profiles se não existir
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS meta_semanal integer DEFAULT 3;