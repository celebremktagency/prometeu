-- =============================================
-- FIX COMPLETO: Schema do Prometeu App
-- Rodar no Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Adicionar colunas faltantes em user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS plano text DEFAULT 'trial';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS especialidade text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS experiencia text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nivel_dor_atual integer DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS localizacao_dor text;

-- 2. Adicionar constraint UNIQUE em user_id (necessário para upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 3. Adicionar FKs em professional_clients para user_profiles
-- Primeiro verificar se já existem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professional_clients_trainer_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.professional_clients
      ADD CONSTRAINT professional_clients_trainer_id_fkey_profiles
      FOREIGN KEY (trainer_id) REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professional_clients_client_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.professional_clients
      ADD CONSTRAINT professional_clients_client_id_fkey_profiles
      FOREIGN KEY (client_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- 4. Corrigir FK de treinos_atribuidos.aluno_id para apontar para auth.users.id
-- (Se atualmente aponta para user_profiles.id, precisamos corrigir)
-- Primeiro, dropar a FK antiga se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'treinos_atribuidos_aluno_id_fkey'
  ) THEN
    ALTER TABLE public.treinos_atribuidos DROP CONSTRAINT treinos_atribuidos_aluno_id_fkey;
  END IF;
  -- Criar nova FK apontando para auth.users
  ALTER TABLE public.treinos_atribuidos
    ADD CONSTRAINT treinos_atribuidos_aluno_id_fkey
    FOREIGN KEY (aluno_id) REFERENCES auth.users(id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK aluno_id já existe ou erro: %', SQLERRM;
END $$;

-- Mesma coisa para personal_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'treinos_atribuidos_personal_id_fkey'
  ) THEN
    ALTER TABLE public.treinos_atribuidos DROP CONSTRAINT treinos_atribuidos_personal_id_fkey;
  END IF;
  ALTER TABLE public.treinos_atribuidos
    ADD CONSTRAINT treinos_atribuidos_personal_id_fkey
    FOREIGN KEY (personal_id) REFERENCES auth.users(id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK personal_id já existe ou erro: %', SQLERRM;
END $$;

-- FK para treino_id -> treinos.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'treinos_atribuidos_treino_id_fkey'
  ) THEN
    ALTER TABLE public.treinos_atribuidos
      ADD CONSTRAINT treinos_atribuidos_treino_id_fkey
      FOREIGN KEY (treino_id) REFERENCES public.treinos(id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK treino_id já existe ou erro: %', SQLERRM;
END $$;

-- 5. RLS Policies para user_profiles (permitir insert/update pelo próprio usuário)
-- Política de INSERT
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
  CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy insert: %', SQLERRM;
END $$;

-- Política de UPDATE
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
  CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy update: %', SQLERRM;
END $$;

-- Política de SELECT (todos podem ler - necessário para buscar trainers/clientes)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;
  CREATE POLICY "Profiles are viewable by everyone" ON public.user_profiles
    FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy select: %', SQLERRM;
END $$;

-- 6. RLS Policies para professional_clients
ALTER TABLE public.professional_clients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own connections" ON public.professional_clients;
  CREATE POLICY "Users can view own connections" ON public.professional_clients
    FOR SELECT USING (auth.uid() = trainer_id OR auth.uid() = client_id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can create connections" ON public.professional_clients;
  CREATE POLICY "Users can create connections" ON public.professional_clients
    FOR INSERT WITH CHECK (auth.uid() = trainer_id OR auth.uid() = client_id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can delete own connections" ON public.professional_clients;
  CREATE POLICY "Users can delete own connections" ON public.professional_clients
    FOR DELETE USING (auth.uid() = trainer_id OR auth.uid() = client_id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy: %', SQLERRM;
END $$;

-- 7. RLS Policies para treinos_atribuidos
ALTER TABLE public.treinos_atribuidos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view assigned workouts" ON public.treinos_atribuidos;
  CREATE POLICY "Users can view assigned workouts" ON public.treinos_atribuidos
    FOR SELECT USING (auth.uid() = aluno_id OR auth.uid() = personal_id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Trainers can assign workouts" ON public.treinos_atribuidos;
  CREATE POLICY "Trainers can assign workouts" ON public.treinos_atribuidos
    FOR INSERT WITH CHECK (auth.uid() = personal_id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Trainers can update assigned workouts" ON public.treinos_atribuidos;
  CREATE POLICY "Trainers can update assigned workouts" ON public.treinos_atribuidos
    FOR UPDATE USING (auth.uid() = personal_id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy: %', SQLERRM;
END $$;

-- 8. Deletar o usuario corrompido teste@teste.com se existir
-- (Precisa ser feito pelo Dashboard > Authentication > Users)

-- Verificar resultado
SELECT 'user_profiles' as tabela, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
