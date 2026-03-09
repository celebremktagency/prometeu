-- ========================================
-- TABELAS NECESSÁRIAS PARA PERSONAL TRAINER
-- ========================================

-- 1. Tabela para perfis de usuário estendidos
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    tipo VARCHAR NOT NULL CHECK (tipo IN ('aluno', 'personal_trainer', 'profissional')),
    ativo BOOLEAN DEFAULT true,
    especialidade VARCHAR,
    experiencia INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela para profissionais/personal trainers
CREATE TABLE IF NOT EXISTS public.profissionais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_profissional VARCHAR DEFAULT 'personal_trainer',
    especializacao VARCHAR[],
    anos_experiencia INTEGER,
    cref VARCHAR,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela para convites entre cliente e personal
CREATE TABLE IF NOT EXISTS public.professional_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code VARCHAR(50) NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- 4. Tabela para relacionamento ativo entre cliente e personal
CREATE TABLE IF NOT EXISTS public.professional_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'pendente')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(client_id) -- Um cliente só pode ter um personal ativo
);

-- 5. Tabela para treinos atribuídos pelo personal
CREATE TABLE IF NOT EXISTS public.treinos_atribuidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID REFERENCES public.treinos(id) ON DELETE CASCADE,
    aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'concluido')),
    observacoes TEXT,
    data_atribuicao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ========================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos_atribuidos ENABLE ROW LEVEL SECURITY;

-- Policies para user_profiles
CREATE POLICY "user_profiles_select_own" ON public.user_profiles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_own" ON public.user_profiles 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_own" ON public.user_profiles 
FOR UPDATE USING (auth.uid() = user_id);

-- Policies para profissionais
CREATE POLICY "profissionais_select_own" ON public.profissionais 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profissionais_insert_own" ON public.profissionais 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies para professional_invites
CREATE POLICY "invites_select_related" ON public.professional_invites 
FOR SELECT USING (auth.uid() = client_id OR auth.uid() = professional_id);

CREATE POLICY "invites_insert_client" ON public.professional_invites 
FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "invites_update_professional" ON public.professional_invites 
FOR UPDATE USING (auth.uid() = professional_id);

-- Policies para professional_clients
CREATE POLICY "clients_select_related" ON public.professional_clients 
FOR SELECT USING (auth.uid() = client_id OR auth.uid() = professional_id);

CREATE POLICY "clients_insert_professional" ON public.professional_clients 
FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "clients_update_professional" ON public.professional_clients 
FOR UPDATE USING (auth.uid() = professional_id);

-- Policies para treinos_atribuidos
CREATE POLICY "treinos_atribuidos_select_related" ON public.treinos_atribuidos 
FOR SELECT USING (auth.uid() = aluno_id OR auth.uid() = personal_id);

CREATE POLICY "treinos_atribuidos_insert_personal" ON public.treinos_atribuidos 
FOR INSERT WITH CHECK (auth.uid() = personal_id);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tipo ON public.user_profiles(tipo);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

CREATE INDEX IF NOT EXISTS idx_profissionais_user_id ON public.profissionais(user_id);

CREATE INDEX IF NOT EXISTS idx_professional_invites_client ON public.professional_invites(client_id);
CREATE INDEX IF NOT EXISTS idx_professional_invites_professional ON public.professional_invites(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_invites_status ON public.professional_invites(status);

CREATE INDEX IF NOT EXISTS idx_professional_clients_client ON public.professional_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_professional_clients_professional ON public.professional_clients(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_clients_status ON public.professional_clients(status);

CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_aluno ON public.treinos_atribuidos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_treinos_atribuidos_personal ON public.treinos_atribuidos(personal_id);

-- ========================================
-- DADOS INICIAIS DE TESTE
-- ========================================

-- Inserir um personal trainer de exemplo (substitua pelos dados reais)
/*
INSERT INTO public.user_profiles (user_id, nome, email, tipo, ativo, especialidade, experiencia) 
VALUES (
    'YOUR_USER_ID_HERE', 
    'Personal Teste', 
    'personal@teste.com', 
    'personal_trainer', 
    true, 
    'Musculação e Funcional', 
    5
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.profissionais (user_id, tipo_profissional, anos_experiencia, especializacao) 
VALUES (
    'YOUR_USER_ID_HERE',
    'personal_trainer',
    5,
    ARRAY['Musculação', 'Treinamento Funcional']
) ON CONFLICT DO NOTHING;
*/