-- ============================================
-- SCRIPT PARA CORRIGIR FOREIGN KEY NA TABELA execucoes_treino
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Verificar a constraint atual
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%execucoes_treino%' AND contype = 'f';

-- PASSO 2: Remover a constraint incorreta
ALTER TABLE execucoes_treino DROP CONSTRAINT IF EXISTS execucoes_treino_cliente_id_fkey;

-- PASSO 3: Adicionar a constraint correta (apontando para auth.users)
ALTER TABLE execucoes_treino 
ADD CONSTRAINT execucoes_treino_cliente_id_fkey 
FOREIGN KEY (cliente_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- PASSO 4: Verificar se a constraint foi criada corretamente
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'execucoes_treino_cliente_id_fkey';

-- PASSO 5: Testar insert para verificar se funciona
-- (Substitua 'your-user-id' por um ID válido de auth.users)
-- INSERT INTO execucoes_treino (
--     cliente_id,
--     data_execucao,
--     exercicios_realizados,
--     tempo_total_min,
--     nivel_dificuldade_percebido,
--     observacoes_cliente,
--     finalizado
-- ) VALUES (
--     'your-user-id',
--     NOW(),
--     '[]'::jsonb,
--     30,
--     5,
--     'Teste após correção FK',
--     false
-- );