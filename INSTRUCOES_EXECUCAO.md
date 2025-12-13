# 🚀 Prometeus - Setup Completo do Banco

## 📋 Scripts Criados

1. **`SCRIPT_DROP_TUDO.sql`** - Remove todas as tabelas existentes
2. **`SCRIPT_CRIACAO_COMPLETA.sql`** - Cria todo o sistema do zero

## ⚡ Execução Rápida

### 1️⃣ **Primeiro**: Dropar tudo
```sql
-- Execute no Supabase SQL Editor
-- Cole o conteúdo de SCRIPT_DROP_TUDO.sql
```

### 2️⃣ **Segundo**: Criar tudo
```sql  
-- Execute no Supabase SQL Editor
-- Cole o conteúdo de SCRIPT_CRIACAO_COMPLETA.sql
```

## ✅ O que será criado

### 📊 **Tabelas Básicas** (6):
- `users` - Usuários do sistema
- `dores` - Registro de dores
- `treinos` - Treinos básicos  
- `insights` - Insights do sistema
- `user_profiles` - Perfis detalhados
- `user_streaks` - Sequências de exercícios

### 🏥 **Sistema Profissional** (7):
- `profissionais` - Dados dos profissionais
- `profissional_cliente` - Relacionamento profissional-cliente
- `exames_documentos` - Upload de exames
- `treinos_atribuidos` - Treinos passados pelos profissionais
- `execucoes_treino` - Execuções dos treinos
- `feedback_treino` - Feedback pós-treino com escala EVA
- `cargas_exercicio` - Registro de cargas e progressão

### 🔐 **Segurança**:
- RLS habilitado em todas as tabelas
- Políticas para profissionais e clientes
- Storage bucket para documentos médicos
- Índices para performance

### 👥 **Tipos de Usuário**:
- `aluno` - Cliente/Paciente
- `personal_trainer` - Personal Trainer
- `medico` - Médico  
- `fisioterapeuta` - Fisioterapeuta
- `nutricionista` - Nutricionista

## 🎯 Funcionalidades Habilitadas

✅ **Para Profissionais:**
- Dashboard completo
- Gerenciar clientes (adicionar/remover)
- Atribuir treinos personalizados
- Visualizar exames dos clientes
- Acompanhar execuções e feedback

✅ **Para Clientes:**
- Treinos atribuídos pelo profissional
- Feedback pós-treino obrigatório
- Upload de exames (câmera/galeria/documentos)
- Escala EVA de dor (0-10)
- Registro automático de cargas

✅ **Sistema Geral:**
- Relacionamento profissional-cliente
- Progressão e análise de dados
- Storage seguro para documentos
- Políticas de privacidade

## 🔍 Verificação

Após executar os scripts, execute para verificar:

```sql
-- Verificar tabelas criadas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verificar dados iniciais
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'insights', COUNT(*) FROM insights;
```

## ⚠️ Importante

- **Faça backup** se tiver dados importantes
- **Execute em ordem**: primeiro DROP, depois CRIAÇÃO
- **Verifique erros** no console do Supabase
- **Teste login** após criação

---

**Pronto!** Após executar os dois scripts, seu sistema Prometeus estará completo com todas as funcionalidades profissionais implementadas! 🎉