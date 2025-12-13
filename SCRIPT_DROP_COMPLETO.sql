-- =============================================
-- SCRIPT PARA DROPAR ABSOLUTAMENTE TUDO
-- Remove TODAS as tabelas, funções, views, triggers, etc.
-- =============================================

-- =============================================
-- 1. DESABILITAR RLS EM TUDO
-- =============================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Desabilitar RLS em todas as tabelas
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- =============================================
-- 2. DROPAR TODAS AS VIEWS
-- =============================================

DROP VIEW IF EXISTS view_profissionais_completa CASCADE;
DROP VIEW IF EXISTS view_cliente_dashboard CASCADE;
DROP VIEW IF EXISTS view_treinos_completa CASCADE;
DROP VIEW IF EXISTS view_usuario_completo CASCADE;

-- =============================================
-- 3. DROPAR TODAS AS TABELAS (qualquer nome)
-- =============================================

-- Sistema profissional (possíveis nomes)
DROP TABLE IF EXISTS cargas_exercicio CASCADE;
DROP TABLE IF EXISTS feedback_treino CASCADE;
DROP TABLE IF EXISTS execucoes_treino CASCADE;
DROP TABLE IF EXISTS treinos_atribuidos CASCADE;
DROP TABLE IF EXISTS exames_documentos CASCADE;
DROP TABLE IF EXISTS profissional_cliente CASCADE;
DROP TABLE IF EXISTS profissionais CASCADE;
DROP TABLE IF EXISTS avaliacoes_profissionais CASCADE;
DROP TABLE IF EXISTS mensagens_profissional CASCADE;
DROP TABLE IF EXISTS planos_tratamento CASCADE;

-- Tabelas básicas (vários nomes possíveis)
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS treinos CASCADE;
DROP TABLE IF EXISTS treino CASCADE;
DROP TABLE IF EXISTS dores CASCADE;
DROP TABLE IF EXISTS dor CASCADE;

-- Tabelas do sistema antigo
DROP TABLE IF EXISTS treinos_logs CASCADE;
DROP TABLE IF EXISTS dores_logs CASCADE;
DROP TABLE IF EXISTS personal_aluno CASCADE;
DROP TABLE IF EXISTS comunidade_posts CASCADE;
DROP TABLE IF EXISTS comunidade_comentarios CASCADE;
DROP TABLE IF EXISTS pagamentos CASCADE;

-- Tabelas relacionadas ao Supabase/Auth
DROP TABLE IF EXISTS auth_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Dropar users por último (pode ter dependências)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user CASCADE;

-- =============================================
-- 4. DROPAR USANDO QUERY DINÂMICA (pega qualquer tabela restante)
-- =============================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Dropar todas as tabelas restantes no schema public
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- =============================================
-- 5. DROPAR TODAS AS FUNÇÕES CUSTOMIZADAS
-- =============================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_user_streak() CASCADE;
DROP FUNCTION IF EXISTS calculate_imc() CASCADE;

-- =============================================
-- 6. DROPAR TIPOS CUSTOMIZADOS
-- =============================================

DROP TYPE IF EXISTS user_type CASCADE;
DROP TYPE IF EXISTS workout_status CASCADE;
DROP TYPE IF EXISTS professional_type CASCADE;

-- =============================================
-- 7. LIMPAR STORAGE (comentado por segurança)
-- =============================================

-- DESCOMENTE APENAS SE QUISER APAGAR ARQUIVOS TAMBÉM
-- DELETE FROM storage.objects WHERE bucket_id = 'medical-documents';
-- DELETE FROM storage.objects WHERE bucket_id = 'avatars';
-- DELETE FROM storage.objects WHERE bucket_id = 'workout-images';
-- DELETE FROM storage.buckets WHERE id = 'medical-documents';
-- DELETE FROM storage.buckets WHERE id = 'avatars';
-- DELETE FROM storage.buckets WHERE id = 'workout-images';

-- =============================================
-- 8. DROPAR SEQUENCES CUSTOMIZADAS
-- =============================================

DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS treinos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS dores_id_seq CASCADE;

-- =============================================
-- 9. VERIFICAÇÃO FINAL
-- =============================================

-- Mostrar o que sobrou
SELECT 
    'TABELAS RESTANTES:' as tipo,
    tablename as nome
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'FUNÇÕES RESTANTES:' as tipo,
    proname as nome
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname NOT LIKE 'pg_%'

UNION ALL

SELECT 
    'VIEWS RESTANTES:' as tipo,
    viewname as nome
FROM pg_views
WHERE schemaname = 'public'

ORDER BY tipo, nome;

-- =============================================
-- RESULTADO ESPERADO
-- =============================================

-- Se tudo deu certo, a query acima deve retornar apenas:
-- - Tabelas do sistema Supabase (auth, storage, etc.)
-- - Funções padrão do PostgreSQL
-- - Nenhuma tabela/função customizada

SELECT 'LIMPEZA COMPLETA REALIZADA!' as status;