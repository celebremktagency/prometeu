-- =============================================
-- SCRIPT PARA CORRIGIR POLÍTICAS RLS
-- Permite cadastro de usuários e operações básicas
-- =============================================

-- =============================================
-- 1. CORRIGIR POLÍTICAS DA TABELA USERS
-- =============================================

-- Remover política antiga
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Criar políticas corretas
CREATE POLICY "Qualquer um pode se cadastrar" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem ver próprios dados" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprios dados" ON users
    FOR UPDATE USING (id = auth.uid());

-- =============================================
-- 2. CORRIGIR POLÍTICAS DAS OUTRAS TABELAS BÁSICAS
-- =============================================

-- DORES
DROP POLICY IF EXISTS "Users can view own dores" ON dores;
CREATE POLICY "Dores - select próprio" ON dores FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Dores - insert próprio" ON dores FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Dores - update próprio" ON dores FOR UPDATE USING (usuario_id = auth.uid());
CREATE POLICY "Dores - delete próprio" ON dores FOR DELETE USING (usuario_id = auth.uid());

-- TREINOS
DROP POLICY IF EXISTS "Users can view own treinos" ON treinos;
CREATE POLICY "Treinos - select próprio" ON treinos FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Treinos - insert próprio" ON treinos FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Treinos - update próprio" ON treinos FOR UPDATE USING (usuario_id = auth.uid());
CREATE POLICY "Treinos - delete próprio" ON treinos FOR DELETE USING (usuario_id = auth.uid());

-- INSIGHTS
DROP POLICY IF EXISTS "Users can view own insights" ON insights;
CREATE POLICY "Insights - select próprio" ON insights FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Insights - insert próprio" ON insights FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Insights - update próprio" ON insights FOR UPDATE USING (usuario_id = auth.uid());

-- USER_PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Profile - select próprio" ON user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Profile - insert próprio" ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Profile - update próprio" ON user_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Profile - delete próprio" ON user_profiles FOR DELETE USING (user_id = auth.uid());

-- USER_STREAKS
DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
CREATE POLICY "Streaks - select próprio" ON user_streaks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Streaks - insert próprio" ON user_streaks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Streaks - update próprio" ON user_streaks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Streaks - delete próprio" ON user_streaks FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- 3. CORRIGIR POLÍTICAS DO SISTEMA PROFISSIONAL
-- =============================================

-- PROFISSIONAIS
DROP POLICY IF EXISTS "Profissionais podem ver seus dados" ON profissionais;
CREATE POLICY "Profissional - select próprio" ON profissionais FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Profissional - insert próprio" ON profissionais FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Profissional - update próprio" ON profissionais FOR UPDATE USING (user_id = auth.uid());

-- PROFISSIONAL_CLIENTE
DROP POLICY IF EXISTS "Relacionamento profissional-cliente" ON profissional_cliente;
CREATE POLICY "ProfCliente - profissional" ON profissional_cliente
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
    );
CREATE POLICY "ProfCliente - cliente" ON profissional_cliente
    FOR SELECT USING (cliente_id = auth.uid());

-- EXAMES_DOCUMENTOS
DROP POLICY IF EXISTS "Exames - cliente" ON exames_documentos;
DROP POLICY IF EXISTS "Exames - profissional pode ver" ON exames_documentos;
CREATE POLICY "Exames - cliente full" ON exames_documentos FOR ALL USING (cliente_id = auth.uid());
CREATE POLICY "Exames - profissional select" ON exames_documentos
    FOR SELECT USING (
        cliente_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
        AND visivel_para_profissionais = true
    );

-- TREINOS_ATRIBUIDOS
DROP POLICY IF EXISTS "Treinos atribuídos - cliente" ON treinos_atribuidos;
DROP POLICY IF EXISTS "Treinos atribuídos - profissional" ON treinos_atribuidos;
CREATE POLICY "TreinosAtrib - cliente select" ON treinos_atribuidos FOR SELECT USING (cliente_id = auth.uid());
CREATE POLICY "TreinosAtrib - profissional full" ON treinos_atribuidos
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
    );

-- EXECUCOES_TREINO
DROP POLICY IF EXISTS "Execuções - cliente" ON execucoes_treino;
DROP POLICY IF EXISTS "Execuções - profissional pode ver" ON execucoes_treino;
CREATE POLICY "Execucoes - cliente full" ON execucoes_treino FOR ALL USING (cliente_id = auth.uid());
CREATE POLICY "Execucoes - profissional select" ON execucoes_treino
    FOR SELECT USING (
        treino_atribuido_id IN (
            SELECT id FROM treinos_atribuidos 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        )
    );

-- FEEDBACK_TREINO
DROP POLICY IF EXISTS "Feedback - cliente" ON feedback_treino;
DROP POLICY IF EXISTS "Feedback - profissional pode ver" ON feedback_treino;
CREATE POLICY "Feedback - cliente full" ON feedback_treino FOR ALL USING (cliente_id = auth.uid());
CREATE POLICY "Feedback - profissional select" ON feedback_treino
    FOR SELECT USING (
        execucao_treino_id IN (
            SELECT et.id FROM execucoes_treino et
            JOIN treinos_atribuidos ta ON et.treino_atribuido_id = ta.id
            WHERE ta.profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        )
    );

-- CARGAS_EXERCICIO
DROP POLICY IF EXISTS "Cargas - cliente" ON cargas_exercicio;
DROP POLICY IF EXISTS "Cargas - profissional pode ver" ON cargas_exercicio;
CREATE POLICY "Cargas - cliente full" ON cargas_exercicio FOR ALL USING (cliente_id = auth.uid());
CREATE POLICY "Cargas - profissional select" ON cargas_exercicio
    FOR SELECT USING (
        execucao_treino_id IN (
            SELECT et.id FROM execucoes_treino et
            JOIN treinos_atribuidos ta ON et.treino_atribuido_id = ta.id
            WHERE ta.profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        )
    );

-- =============================================
-- VERIFICAÇÃO
-- =============================================

-- Mostrar todas as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

SELECT 'POLÍTICAS RLS CORRIGIDAS COM SUCESSO!' as status;