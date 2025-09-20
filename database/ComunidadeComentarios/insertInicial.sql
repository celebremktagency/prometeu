INSERT INTO comunidade_comentarios (post_id, usuario_id, conteudo)
SELECT p.id, u.id, 'Ótimo post!'
FROM comunidade_posts p, users u 
LIMIT 1;