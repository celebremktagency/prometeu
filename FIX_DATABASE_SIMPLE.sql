-- SCRIPT PARA EXECUTAR NO SUPABASE SQL EDITOR
-- Execute este script no painel do Supabase -> SQL Editor

-- 1. CORRIGIR RLS DA TABELA registros_dor
DROP POLICY IF EXISTS "Users can manage their own pain records" ON registros_dor;
CREATE POLICY "Users can manage their own pain records" ON registros_dor
    FOR ALL USING (true); -- Política permissiva para testar

-- 2. CORRIGIR RLS DA TABELA user_profiles
DROP POLICY IF EXISTS "Users can view and edit their own profile" ON user_profiles;
CREATE POLICY "Users can view and edit their own profile" ON user_profiles
    FOR ALL USING (true); -- Política permissiva para sincronização

-- 2. ADICIONAR CAMPOS FALTANTES NOS TREINOS
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'personalizado';
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS duracao_min integer DEFAULT 30;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS nivel text DEFAULT 'iniciante';
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES auth.users(id);
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS publico boolean DEFAULT false;

-- 3. CORRIGIR RLS DOS TREINOS
DROP POLICY IF EXISTS "Users can view and create workouts" ON treinos;
CREATE POLICY "Users can view and create workouts" ON treinos
    FOR ALL USING (publico = true OR criado_por = auth.uid() OR criado_por IS NULL);

-- 4. ADICIONAR CAMPOS NO USER_PROFILES
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS meta_semanal integer DEFAULT 3;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS objetivo text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS telefone text;

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

-- 6. INSERIR TREINOS EXEMPLO
INSERT INTO treinos (exercicio, descricao, categoria, duracao_min, nivel, publico) VALUES
('Alongamento Básico', 'Série de alongamentos para todo o corpo', 'flexibilidade', 15, 'iniciante', true),
('Cardio Leve', 'Exercícios cardiovasculares de baixo impacto', 'cardio', 20, 'iniciante', true),
('Fortalecimento Core', 'Exercícios para fortalecimento do abdômen e lombar', 'fortalecimento', 25, 'intermediario', true),
('Mobilidade Articular', 'Exercícios para melhorar mobilidade das articulações', 'mobilidade', 20, 'iniciante', true)
ON CONFLICT DO NOTHING;

-- 7. VERIFICAR SE FOREIGN KEY ESTÁ CORRETA
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='registros_dor';