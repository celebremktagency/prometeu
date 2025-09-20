INSERT INTO comunidade_posts (usuario_id, conteudo)
SELECT id, 'Primeiro post da comunidade! 💪'
FROM users LIMIT 1;