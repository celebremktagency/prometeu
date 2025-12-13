-- =============================================
-- SCRIPT RLS COMPLETO - PROFISSIONAIS VEEM TUDO DOS CLIENTES
-- Como você pediu: "O médico/personal/qualquer coisa da pessoa vai ter acesso a tudo que o usuario faz"
-- =============================================

-- =============================================
-- 1. POLÍTICAS DA TABELA USERS
-- =============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Qualquer um pode se cadastrar" ON users;
DROP POLICY IF EXISTS "Usuários podem ver próprios dados" ON users;
DROP POLICY IF EXISTS "Usuários podem atualizar próprios dados" ON users;

-- Criar políticas corretas
CREATE POLICY "Qualquer um pode se cadastrar" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users - próprios dados" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users - profissionais veem clientes" ON users
    FOR SELECT USING (
        id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

CREATE POLICY "Users - update próprio" ON users
    FOR UPDATE USING (id = auth.uid());

-- =============================================
-- 2. DORES - PROFISSIONAIS VEEM TUDO DOS CLIENTES
-- =============================================

DROP POLICY IF EXISTS "Users can view own dores" ON dores;
DROP POLICY IF EXISTS "Dores - select próprio" ON dores;
DROP POLICY IF EXISTS "Dores - insert próprio" ON dores;
DROP POLICY IF EXISTS "Dores - update próprio" ON dores;
DROP POLICY IF EXISTS "Dores - delete próprio" ON dores;

CREATE POLICY "Dores - cliente próprio" ON dores 
    FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Dores - profissional vê cliente" ON dores
    FOR SELECT USING (
        usuario_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

-- =============================================
-- 3. TREINOS - PROFISSIONAIS VEEM TUDO DOS CLIENTES
-- =============================================

DROP POLICY IF EXISTS "Users can view own treinos" ON treinos;
DROP POLICY IF EXISTS "Treinos - select próprio" ON treinos;
DROP POLICY IF EXISTS "Treinos - insert próprio" ON treinos;
DROP POLICY IF EXISTS "Treinos - update próprio" ON treinos;
DROP POLICY IF EXISTS "Treinos - delete próprio" ON treinos;

CREATE POLICY "Treinos - cliente próprio" ON treinos 
    FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Treinos - profissional vê cliente" ON treinos
    FOR SELECT USING (
        usuario_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

-- =============================================
-- 4. INSIGHTS - PROFISSIONAIS VEEM TUDO DOS CLIENTES
-- =============================================

DROP POLICY IF EXISTS "Users can view own insights" ON insights;
DROP POLICY IF EXISTS "Insights - select próprio" ON insights;
DROP POLICY IF EXISTS "Insights - insert próprio" ON insights;
DROP POLICY IF EXISTS "Insights - update próprio" ON insights;

CREATE POLICY "Insights - cliente próprio" ON insights 
    FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Insights - profissional vê cliente" ON insights
    FOR SELECT USING (
        usuario_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

-- =============================================
-- 5. USER_PROFILES - PROFISSIONAIS VEEM TUDO DOS CLIENTES
-- =============================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Profile - select próprio" ON user_profiles;
DROP POLICY IF EXISTS "Profile - insert próprio" ON user_profiles;
DROP POLICY IF EXISTS "Profile - update próprio" ON user_profiles;
DROP POLICY IF EXISTS "Profile - delete próprio" ON user_profiles;

CREATE POLICY "Profile - cliente próprio" ON user_profiles 
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Profile - profissional vê cliente" ON user_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

-- =============================================
-- 6. USER_STREAKS - PROFISSIONAIS VEEM TUDO DOS CLIENTES
-- =============================================

DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Streaks - select próprio" ON user_streaks;
DROP POLICY IF EXISTS "Streaks - insert próprio" ON user_streaks;
DROP POLICY IF EXISTS "Streaks - update próprio" ON user_streaks;
DROP POLICY IF EXISTS "Streaks - delete próprio" ON user_streaks;

CREATE POLICY "Streaks - cliente próprio" ON user_streaks 
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Streaks - profissional vê cliente" ON user_streaks
    FOR SELECT USING (
        user_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

-- =============================================
-- 7. PROFISSIONAIS
-- =============================================

DROP POLICY IF EXISTS "Profissionais podem ver seus dados" ON profissionais;
DROP POLICY IF EXISTS "Profissional - select próprio" ON profissionais;
DROP POLICY IF EXISTS "Profissional - insert próprio" ON profissionais;
DROP POLICY IF EXISTS "Profissional - update próprio" ON profissionais;

CREATE POLICY "Profissional - próprios dados" ON profissionais 
    FOR ALL USING (user_id = auth.uid());

-- =============================================
-- 8. PROFISSIONAL_CLIENTE
-- =============================================

DROP POLICY IF EXISTS "Relacionamento profissional-cliente" ON profissional_cliente;
DROP POLICY IF EXISTS "ProfCliente - profissional" ON profissional_cliente;
DROP POLICY IF EXISTS "ProfCliente - cliente" ON profissional_cliente;

CREATE POLICY "ProfCliente - profissional full" ON profissional_cliente
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
    );

CREATE POLICY "ProfCliente - cliente vê próprio" ON profissional_cliente
    FOR SELECT USING (cliente_id = auth.uid());

-- =============================================
-- 9. EXAMES_DOCUMENTOS - PROFISSIONAIS VEEM TODOS OS EXAMES DOS CLIENTES
-- =============================================

DROP POLICY IF EXISTS "Exames - cliente" ON exames_documentos;
DROP POLICY IF EXISTS "Exames - profissional pode ver" ON exames_documentos;
DROP POLICY IF EXISTS "Exames - cliente full" ON exames_documentos;
DROP POLICY IF EXISTS "Exames - profissional select" ON exames_documentos;

CREATE POLICY "Exames - cliente próprio" ON exames_documentos 
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Exames - profissional vê todos do cliente" ON exames_documentos
    FOR ALL USING (
        cliente_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

-- =============================================
-- 10. TREINOS_ATRIBUIDOS
-- =============================================

DROP POLICY IF EXISTS "Treinos atribuídos - cliente" ON treinos_atribuidos;
DROP POLICY IF EXISTS "Treinos atribuídos - profissional" ON treinos_atribuidos;
DROP POLICY IF EXISTS "TreinosAtrib - cliente select" ON treinos_atribuidos;
DROP POLICY IF EXISTS "TreinosAtrib - profissional full" ON treinos_atribuidos;

CREATE POLICY "TreinosAtrib - cliente vê próprio" ON treinos_atribuidos 
    FOR SELECT USING (cliente_id = auth.uid());

CREATE POLICY "TreinosAtrib - profissional full" ON treinos_atribuidos
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
    );

-- =============================================
-- 11. EXECUCOES_TREINO
-- =============================================

DROP POLICY IF EXISTS "Execuções - cliente" ON execucoes_treino;
DROP POLICY IF EXISTS "Execuções - profissional pode ver" ON execucoes_treino;
DROP POLICY IF EXISTS "Execucoes - cliente full" ON execucoes_treino;
DROP POLICY IF EXISTS "Execucoes - profissional select" ON execucoes_treino;

CREATE POLICY "Execucoes - cliente próprio" ON execucoes_treino 
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Execucoes - profissional vê tudo" ON execucoes_treino
    FOR ALL USING (
        cliente_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

-- =============================================
-- 12. FEEDBACK_TREINO
-- =============================================

DROP POLICY IF EXISTS "Feedback - cliente" ON feedback_treino;
DROP POLICY IF EXISTS "Feedback - profissional pode ver" ON feedback_treino;
DROP POLICY IF EXISTS "Feedback - cliente full" ON feedback_treino;
DROP POLICY IF EXISTS "Feedback - profissional select" ON feedback_treino;

CREATE POLICY "Feedback - cliente próprio" ON feedback_treino 
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Feedback - profissional vê tudo" ON feedback_treino
    FOR ALL USING (
        cliente_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

-- =============================================
-- 13. CARGAS_EXERCICIO
-- =============================================

DROP POLICY IF EXISTS "Cargas - cliente" ON cargas_exercicio;
DROP POLICY IF EXISTS "Cargas - profissional pode ver" ON cargas_exercicio;
DROP POLICY IF EXISTS "Cargas - cliente full" ON cargas_exercicio;
DROP POLICY IF EXISTS "Cargas - profissional select" ON cargas_exercicio;

CREATE POLICY "Cargas - cliente próprio" ON cargas_exercicio 
    FOR ALL USING (cliente_id = auth.uid());

CREATE POLICY "Cargas - profissional vê tudo" ON cargas_exercicio
    FOR ALL USING (
        cliente_id IN (
            SELECT cliente_id FROM profissional_cliente 
            WHERE profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
            AND status = 'ativo'
        )
    );

-- =============================================
-- VERIFICAÇÃO
-- =============================================

SELECT 'RLS CONFIGURADO: PROFISSIONAIS VEEM TUDO DOS CLIENTES!' as status;

-- Mostrar resumo das políticas
SELECT 
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename
ORDER BY tablename;