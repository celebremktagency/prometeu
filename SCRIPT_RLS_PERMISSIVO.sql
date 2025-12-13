-- =============================================
-- SCRIPT RLS SUPER PERMISSIVO
-- Permite criar/editar/ver TUDO para TODOS
-- =============================================

-- =============================================
-- 1. USERS - ACESSO TOTAL
-- =============================================

-- Dropar todas as políticas antigas
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- USERS - total permissão
CREATE POLICY "users_all" ON users FOR ALL USING (true) WITH CHECK (true);

-- DORES - total permissão
CREATE POLICY "dores_all" ON dores FOR ALL USING (true) WITH CHECK (true);

-- TREINOS - total permissão  
CREATE POLICY "treinos_all" ON treinos FOR ALL USING (true) WITH CHECK (true);

-- INSIGHTS - total permissão
CREATE POLICY "insights_all" ON insights FOR ALL USING (true) WITH CHECK (true);

-- USER_PROFILES - total permissão
CREATE POLICY "user_profiles_all" ON user_profiles FOR ALL USING (true) WITH CHECK (true);

-- USER_STREAKS - total permissão
CREATE POLICY "user_streaks_all" ON user_streaks FOR ALL USING (true) WITH CHECK (true);

-- PROFISSIONAIS - total permissão
CREATE POLICY "profissionais_all" ON profissionais FOR ALL USING (true) WITH CHECK (true);

-- PROFISSIONAL_CLIENTE - total permissão
CREATE POLICY "profissional_cliente_all" ON profissional_cliente FOR ALL USING (true) WITH CHECK (true);

-- EXAMES_DOCUMENTOS - total permissão
CREATE POLICY "exames_documentos_all" ON exames_documentos FOR ALL USING (true) WITH CHECK (true);

-- TREINOS_ATRIBUIDOS - total permissão
CREATE POLICY "treinos_atribuidos_all" ON treinos_atribuidos FOR ALL USING (true) WITH CHECK (true);

-- EXECUCOES_TREINO - total permissão
CREATE POLICY "execucoes_treino_all" ON execucoes_treino FOR ALL USING (true) WITH CHECK (true);

-- FEEDBACK_TREINO - total permissão
CREATE POLICY "feedback_treino_all" ON feedback_treino FOR ALL USING (true) WITH CHECK (true);

-- CARGAS_EXERCICIO - total permissão
CREATE POLICY "cargas_exercicio_all" ON cargas_exercicio FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- VERIFICAÇÃO
-- =============================================

SELECT 'RLS SUPER PERMISSIVO ATIVADO - TODOS PODEM TUDO!' as status;

SELECT 
    tablename,
    COUNT(*) as policies
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename
ORDER BY tablename;