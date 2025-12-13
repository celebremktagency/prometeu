-- Script completo para criar BD funcional no Supabase

-- 1. CRIAR TABELA USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('aluno', 'personal_trainer', 'fisioterapeuta', 'nutricionista', 'medico')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRIAR TABELA DORES  
CREATE TABLE IF NOT EXISTS dores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    intensidade INTEGER NOT NULL CHECK (intensidade >= 0 AND intensidade <= 10),
    localizacao TEXT NOT NULL,
    observacoes TEXT,
    data_registro TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRIAR TABELA TREINOS
CREATE TABLE IF NOT EXISTS treinos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRIAR TABELA EXERCICIOS (dados básicos)
CREATE TABLE IF NOT EXISTS exercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    grupo_muscular TEXT NOT NULL,
    equipamento TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CRIAR TABELA TREINO_EXERCICIOS (relacionamento)
CREATE TABLE IF NOT EXISTS treino_exercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treino_id UUID REFERENCES treinos(id) ON DELETE CASCADE,
    exercicio_id UUID REFERENCES exercicios(id) ON DELETE CASCADE,
    series INTEGER DEFAULT 3,
    repeticoes TEXT DEFAULT '8-12',
    peso DECIMAL,
    descanso INTEGER DEFAULT 60,
    observacoes TEXT,
    ordem INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HABILITAR RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dores ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE treino_exercicios ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLICIES DE SEGURANÇA

-- Users - usuários só veem seus próprios dados
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Dores - usuários só veem suas próprias dores
CREATE POLICY "dores_select_own" ON dores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dores_insert_own" ON dores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dores_update_own" ON dores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dores_delete_own" ON dores FOR DELETE USING (auth.uid() = user_id);

-- Treinos - usuários só veem seus próprios treinos
CREATE POLICY "treinos_select_own" ON treinos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "treinos_insert_own" ON treinos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "treinos_update_own" ON treinos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "treinos_delete_own" ON treinos FOR DELETE USING (auth.uid() = user_id);

-- Exercicios - todos podem ver (dados públicos)
CREATE POLICY "exercicios_select_all" ON exercicios FOR SELECT USING (true);

-- Treino_exercicios - usuários só veem exercícios de seus treinos
CREATE POLICY "treino_exercicios_select_own" ON treino_exercicios FOR SELECT USING (
    EXISTS (SELECT 1 FROM treinos WHERE treinos.id = treino_exercicios.treino_id AND treinos.user_id = auth.uid())
);
CREATE POLICY "treino_exercicios_insert_own" ON treino_exercicios FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM treinos WHERE treinos.id = treino_exercicios.treino_id AND treinos.user_id = auth.uid())
);
CREATE POLICY "treino_exercicios_update_own" ON treino_exercicios FOR UPDATE USING (
    EXISTS (SELECT 1 FROM treinos WHERE treinos.id = treino_exercicios.treino_id AND treinos.user_id = auth.uid())
);
CREATE POLICY "treino_exercicios_delete_own" ON treino_exercicios FOR DELETE USING (
    EXISTS (SELECT 1 FROM treinos WHERE treinos.id = treino_exercicios.treino_id AND treinos.user_id = auth.uid())
);

-- 8. INSERIR EXERCÍCIOS BÁSICOS
INSERT INTO exercicios (nome, grupo_muscular, equipamento, descricao) VALUES 
('Supino Reto', 'Peito', 'Barra', 'Exercício básico para peitoral'),
('Agachamento', 'Pernas', 'Barra', 'Exercício fundamental para pernas'),
('Levantamento Terra', 'Posterior', 'Barra', 'Exercício completo posterior'),
('Rosca Direta', 'Bíceps', 'Barra', 'Exercício básico para bíceps'),
('Tríceps Testa', 'Tríceps', 'Barra', 'Exercício para tríceps'),
('Desenvolvimento', 'Ombros', 'Halteres', 'Exercício para ombros'),
('Puxada Alta', 'Costas', 'Cabo', 'Exercício para dorsais'),
('Remada Baixa', 'Costas', 'Cabo', 'Exercício para romboides'),
('Leg Press', 'Pernas', 'Máquina', 'Exercício para quadríceps'),
('Flexão', 'Peito', 'Peso corporal', 'Exercício básico sem equipamento')
ON CONFLICT DO NOTHING;

-- 9. CRIAR FUNÇÃO PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. CRIAR TRIGGERS PARA updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_treinos_updated_at BEFORE UPDATE ON treinos 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();