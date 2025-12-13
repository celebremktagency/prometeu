-- 1. CORRIGIR FOREIGN KEY DA TABELA registros_dor
-- Primeiro remover a constraint existente se houver problema
ALTER TABLE registros_dor DROP CONSTRAINT IF EXISTS registros_dor_aluno_id_fkey;

-- Recriar a constraint correta
ALTER TABLE registros_dor 
ADD CONSTRAINT registros_dor_aluno_id_fkey 
FOREIGN KEY (aluno_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. VERIFICAR SE user_profiles TEM OS CAMPOS NECESSÁRIOS
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS meta_semanal integer DEFAULT 3;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS objetivo text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS telefone text;

-- 3. ADICIONAR CAMPOS NOS TREINOS PARA BIBLIOTECA PESSOAL
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'personalizado';
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS duracao_min integer DEFAULT 30;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS nivel text DEFAULT 'iniciante';
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES auth.users(id);
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS publico boolean DEFAULT false;

-- 4. RLS MAIS PERMISSIVA PARA TREINOS
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and create workouts" ON treinos;
CREATE POLICY "Users can view and create workouts" ON treinos
    FOR ALL USING (publico = true OR criado_por = auth.uid() OR criado_por IS NULL);

-- 5. POPULAR USER_PROFILES COM USERS EXISTENTES
INSERT INTO user_profiles (id, nome, email, tipo, meta_semanal, objetivo)
SELECT 
    u.id,
    u.nome,
    u.email,
    u.tipo,
    CASE WHEN u.tipo = 'aluno' THEN 3 ELSE NULL END as meta_semanal,
    CASE WHEN u.tipo = 'aluno' THEN 'Melhorar condicionamento físico' ELSE NULL END as objetivo
FROM users u
WHERE u.id NOT IN (SELECT id FROM user_profiles WHERE id IS NOT NULL)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    tipo = EXCLUDED.tipo,
    meta_semanal = COALESCE(user_profiles.meta_semanal, EXCLUDED.meta_semanal),
    objetivo = COALESCE(user_profiles.objetivo, EXCLUDED.objetivo);

-- 6. ADICIONAR TREINOS EXEMPLO
INSERT INTO treinos (exercicio, descricao, categoria, duracao_min, nivel, publico) VALUES
('Alongamento Básico', 'Série de alongamentos para todo o corpo', 'flexibilidade', 15, 'iniciante', true),
('Cardio Leve', 'Exercícios cardiovasculares de baixo impacto', 'cardio', 20, 'iniciante', true),
('Fortalecimento Core', 'Exercícios para fortalecimento do abdômen e lombar', 'fortalecimento', 25, 'intermediario', true),
('Mobilidade Articular', 'Exercícios para melhorar mobilidade das articulações', 'mobilidade', 20, 'iniciante', true)
ON CONFLICT DO NOTHING;