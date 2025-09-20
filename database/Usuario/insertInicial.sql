INSERT INTO users (nome, email, tipo, plano, data_fim) VALUES
('João Personal', 'personal@exemplo.com', 'personal', 'mensal', now() + interval '1 month'),
('Maria Aluna', 'aluna@exemplo.com', 'aluno', 'trial', now() + interval '7 days')
ON CONFLICT DO NOTHING;