-- Corrigir políticas RLS para permitir signup
-- Execute este script no Supabase SQL Editor

-- Remover políticas restritivas da tabela users
DROP POLICY IF EXISTS "Allow authenticated users" ON public.users;

-- Criar política permissiva para insert durante signup
CREATE POLICY "Enable insert for authenticated users during signup" ON public.users
    FOR INSERT WITH CHECK (true);

-- Criar política para usuários verem seus próprios dados
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Criar política para usuários atualizarem seus próprios dados  
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Verificar se RLS está ativo (deve estar)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para service_role (admin) - acesso total
CREATE POLICY "Service role has full access" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Mostrar políticas ativas
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';