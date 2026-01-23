-- Execute este SQL no Supabase SQL Editor para desabilitar confirmação de email

-- Verificar configurações atuais de auth
SELECT * FROM auth.config;

-- Atualizar para desabilitar confirmação de email
UPDATE auth.config 
SET enable_signup = true;

-- Se a coluna enable_email_confirmations existir
UPDATE auth.config 
SET enable_email_confirmations = false
WHERE enable_email_confirmations IS NOT NULL;

-- Alternativa: Configurar via função (se disponível)
-- ALTER SYSTEM SET auth.enable_email_confirmations = false;

-- Verificar novamente
SELECT * FROM auth.config;