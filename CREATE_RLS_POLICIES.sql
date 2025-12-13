-- ================================
-- CRIAÇÃO DE POLÍTICAS RLS PARA SISTEMA DE PERSONAL TRAINER
-- ================================

-- 1. HABILITAR RLS nas tabelas (caso não estejam)
ALTER TABLE professional_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_invites ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA TABELA professional_clients

-- Política para permitir que usuários vejam conexões onde são cliente ou personal
CREATE POLICY "Usuários podem ver suas próprias conexões"
ON professional_clients
FOR SELECT
TO authenticated
USING (
  auth.uid() = professional_id OR 
  auth.uid() = client_id
);

-- Política para permitir que alunos criem conexões (conectar com personal)
CREATE POLICY "Alunos podem criar conexões com personal trainers"
ON professional_clients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = client_id AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND tipo = 'aluno'
  ) AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = professional_id 
    AND tipo = 'personal_trainer'
  )
);

-- Política para permitir que personal trainers criem conexões com clientes
CREATE POLICY "Personal trainers podem criar conexões com clientes"
ON professional_clients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = professional_id AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND tipo = 'personal_trainer'
  ) AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = client_id 
    AND tipo = 'aluno'
  )
);

-- Política para atualizar conexões (apenas os envolvidos)
CREATE POLICY "Usuários podem atualizar suas próprias conexões"
ON professional_clients
FOR UPDATE
TO authenticated
USING (
  auth.uid() = professional_id OR 
  auth.uid() = client_id
)
WITH CHECK (
  auth.uid() = professional_id OR 
  auth.uid() = client_id
);

-- Política para deletar conexões (apenas os envolvidos)
CREATE POLICY "Usuários podem deletar suas próprias conexões"
ON professional_clients
FOR DELETE
TO authenticated
USING (
  auth.uid() = professional_id OR 
  auth.uid() = client_id
);

-- 3. POLÍTICAS PARA TABELA professional_invites

-- Política para ver convites (remetente e destinatário)
CREATE POLICY "Usuários podem ver convites enviados/recebidos"
ON professional_invites
FOR SELECT
TO authenticated
USING (
  auth.uid() = client_id OR 
  auth.uid() = professional_id
);

-- Política para clientes enviarem convites para personal trainers
CREATE POLICY "Clientes podem enviar convites para personal trainers"
ON professional_invites
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = client_id AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND tipo = 'aluno'
  ) AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = professional_id 
    AND tipo = 'personal_trainer'
  )
);

-- Política para personal trainers enviarem convites para clientes
CREATE POLICY "Personal trainers podem enviar convites para clientes"
ON professional_invites
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = professional_id AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND tipo = 'personal_trainer'
  ) AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = client_id 
    AND tipo = 'aluno'
  )
);

-- Política para atualizar convites (aceitar/rejeitar)
CREATE POLICY "Usuários podem atualizar convites recebidos"
ON professional_invites
FOR UPDATE
TO authenticated
USING (
  auth.uid() = professional_id OR 
  auth.uid() = client_id
)
WITH CHECK (
  auth.uid() = professional_id OR 
  auth.uid() = client_id
);

-- Política para deletar convites
CREATE POLICY "Usuários podem deletar seus próprios convites"
ON professional_invites
FOR DELETE
TO authenticated
USING (
  auth.uid() = client_id OR 
  auth.uid() = professional_id
);

-- ================================
-- FUNÇÕES AUXILIARES
-- ================================

-- Função para verificar se um usuário é personal trainer
CREATE OR REPLACE FUNCTION is_personal_trainer(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = user_uuid 
    AND tipo = 'personal_trainer'
  );
$$;

-- Função para verificar se um usuário é aluno
CREATE OR REPLACE FUNCTION is_client(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = user_uuid 
    AND tipo = 'aluno'
  );
$$;

-- Função para obter o perfil do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS user_profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM user_profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;