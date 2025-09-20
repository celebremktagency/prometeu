INSERT INTO dores_logs (usuario_id, intensidade, musculo, descricao)
SELECT id, 3.5, 'Bíceps', 'Dor leve após treino'
FROM users WHERE tipo = 'aluno' LIMIT 1;