-- ================================
-- CORRIGIR RLS PARA PROFESSIONAL_CLIENTS
-- ================================

-- 1. Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "allow_authenticated_access" ON professional_clients;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias conexões" ON professional_clients;
DROP POLICY IF EXISTS "Alunos podem criar conexões com personal trainers" ON professional_clients;
DROP POLICY IF EXISTS "Personal trainers podem criar conexões com clientes" ON professional_clients;

-- 2. Criar política permissiva para autenticados (para desenvolvimento)
CREATE POLICY "Usuários autenticados podem acessar professional_clients"
ON professional_clients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Se necessário, também aplicar para professional_invites
DROP POLICY IF EXISTS "allow_authenticated_access" ON professional_invites;
CREATE POLICY "Usuários autenticados podem acessar professional_invites"
ON professional_invites
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Verificar se as tabelas têm RLS habilitado
ALTER TABLE professional_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_invites ENABLE ROW LEVEL SECURITY;