INSERT INTO treinos_logs (usuario_id, treino_id, status)
SELECT u.id, t.id, 'planned' 
FROM users u, treinos t 
WHERE u.tipo = 'aluno' 
LIMIT 1;