-- Script baseado na estrutura REAL do Supabase descoberta
-- Tabela treinos tem: id, usuario_id, exercicio, series, repeticoes, status, observacoes, 
-- data_criacao, data_execucao, descricao, categoria, duracao_min, nivel, youtube_url, criado_por, publico

-- 1. CORRIGIR FOREIGN KEY CONSTRAINT DA TABELA TREINOS
-- Campo usuario_id deve referenciar users(id)
ALTER TABLE treinos DROP CONSTRAINT IF EXISTS treinos_usuario_id_fkey;
ALTER TABLE treinos ADD CONSTRAINT treinos_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. CORRIGIR FOREIGN KEY CONSTRAINT DO CRIADO_POR
-- Campo criado_por deve referenciar users(id)
ALTER TABLE treinos DROP CONSTRAINT IF EXISTS treinos_criado_por_fkey;
ALTER TABLE treinos ADD CONSTRAINT treinos_criado_por_fkey 
FOREIGN KEY (criado_por) REFERENCES users(id) ON DELETE SET NULL;

-- 3. VERIFICAR SE RLS ESTÁ HABILITADO E CRIAR POLÍTICAS CORRETAS
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICA PARA TREINOS: usuário pode ver treinos públicos e seus próprios treinos
DROP POLICY IF EXISTS "Users can view and create workouts" ON treinos;
CREATE POLICY "Users can view and create workouts" ON treinos
    FOR ALL USING (
        publico = true OR 
        usuario_id = auth.uid() OR 
        criado_por = auth.uid()
    );

-- 5. GARANTIR QUE A TABELA PROFISSIONAL_CLIENTE ESTÁ CORRETA
-- (Descobrimos que ela existe com: id, profissional_id, cliente_id, status, data_inicio, data_fim, observacoes, created_at)
ALTER TABLE profissional_cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profissionais veem seus clientes" ON profissional_cliente;
CREATE POLICY "Profissionais veem seus clientes" ON profissional_cliente
    FOR ALL USING (
        profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())
        OR cliente_id = auth.uid()
    );

-- 6. GARANTIR QUE A TABELA EXECUCOES_TREINO ESTÁ CORRETA
-- (Tem: id, treino_atribuido_id, cliente_id, data_execucao, exercicios_realizados, tempo_total_min, 
-- nivel_dificuldade_percebido, observacoes_cliente, finalizado, created_at, treino_id)
ALTER TABLE execucoes_treino ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workout executions" ON execucoes_treino;
CREATE POLICY "Users manage own workout executions" ON execucoes_treino
    FOR ALL USING (cliente_id = auth.uid());

-- 7. PERMITIR QUE TREINO_ATRIBUIDO_ID SEJA NULL (para treinos independentes)
ALTER TABLE execucoes_treino ALTER COLUMN treino_atribuido_id DROP NOT NULL;

-- 8. GARANTIR QUE FOREIGN KEY DE TREINO_ID EXISTE E FUNCIONA
-- (Já tem o campo treino_id, só precisa garantir a foreign key)
ALTER TABLE execucoes_treino DROP CONSTRAINT IF EXISTS execucoes_treino_treino_id_fkey;
ALTER TABLE execucoes_treino ADD CONSTRAINT execucoes_treino_treino_id_fkey 
FOREIGN KEY (treino_id) REFERENCES treinos(id) ON DELETE CASCADE;

-- 9. POLÍTICA PARA PROFISSIONAIS
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profissionais podem ver seus dados" ON profissionais;
CREATE POLICY "Profissionais podem ver seus dados" ON profissionais
    FOR ALL USING (user_id = auth.uid());

-- 10. INSERIR DADOS DE EXEMPLO SE NÃO EXISTIREM
INSERT INTO treinos (
    exercicio, descricao, categoria, duracao_min, nivel, publico, status
) VALUES
('Alongamento Básico', 'Série de alongamentos para todo o corpo', 'flexibilidade', 15, 'iniciante', true, 'planned'),
('Cardio Leve', 'Exercícios cardiovasculares de baixo impacto', 'cardio', 20, 'iniciante', true, 'planned'),
('Fortalecimento Core', 'Exercícios para fortalecimento do abdômen e lombar', 'forca', 25, 'intermediario', true, 'planned')
ON CONFLICT DO NOTHING;

-- 11. CRIAR PROFISSIONAIS PARA TODOS OS PERSONAL TRAINERS SE NÃO EXISTIREM
INSERT INTO profissionais (user_id, tipo_profissional, especialidade) 
SELECT id, 'personal_trainer', 'Treinamento Personalizado'
FROM users 
WHERE tipo = 'personal_trainer' 
  AND id NOT IN (SELECT user_id FROM profissionais)
ON CONFLICT DO NOTHING;