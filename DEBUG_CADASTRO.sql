-- =============================================
-- DEBUG COMPLETO DO CADASTRO
-- =============================================

-- 1. DESATIVAR RLS EM TUDO
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- 2. VERIFICAR ESTRUTURA DA TABELA USERS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE EXISTEM REGISTROS
SELECT COUNT(*) as total_users FROM users;

-- 4. VERIFICAR ÚLTIMOS REGISTROS
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

-- 5. VERIFICAR AUTH.USERS (se tiver acesso)
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. TESTAR INSERT MANUAL
INSERT INTO users (nome, email, tipo) 
VALUES ('Teste Manual', 'teste@teste.com', 'aluno')
ON CONFLICT (email) DO NOTHING;

-- 7. VERIFICAR SE INSERIU
SELECT * FROM users WHERE email = 'teste@teste.com';

SELECT 'DEBUG CONCLUÍDO!' as status;