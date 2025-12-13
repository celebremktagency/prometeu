# 🏥 Sistema Profissional Prometeus - Execução

## 📋 Ordem de Execução dos Scripts

Para implementar o sistema profissional completo, execute os scripts na seguinte ordem:

### 1️⃣ **PRIMEIRO**: `SCRIPT_BASE_PRIMEIRO.sql`
```sql
-- Cria as tabelas básicas necessárias
-- Execute este script PRIMEIRO no Supabase SQL Editor
```

**O que faz:**
- Cria tabela `users` com tipos de profissionais
- Cria tabelas básicas (`dores`, `treinos`, `insights`, `user_profiles`, `user_streaks`)
- Configura RLS básico
- Adiciona índices essenciais

### 2️⃣ **SEGUNDO**: `SCRIPT_PROFISSIONAL_SIMPLES.sql`
```sql
-- Adiciona o sistema profissional completo
-- Execute este script DEPOIS do script base
```

**O que faz:**
- Cria 7 tabelas do sistema profissional
- Configura storage para documentos médicos
- Implementa políticas RLS avançadas
- Cria triggers e funções
- Migra dados existentes

## 🚀 Como Executar

### No Supabase Dashboard:
1. Acesse o projeto no [Supabase](https://supabase.com)
2. Vá para **SQL Editor**
3. Cole o conteúdo do `SCRIPT_BASE_PRIMEIRO.sql`
4. Clique em **Run** ou `Ctrl+Enter`
5. Aguarde a confirmação
6. Cole o conteúdo do `SCRIPT_PROFISSIONAL_SIMPLES.sql`
7. Clique em **Run** novamente

### Verificação:
Execute esta query para verificar se tudo foi criado:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%profission%' 
OR tablename LIKE '%exam%' 
OR tablename LIKE '%treino%'
ORDER BY tablename;
```

## 📊 Tabelas Criadas

### Básicas:
- `users` - Usuários do sistema
- `dores` - Registro de dores
- `treinos` - Treinos básicos
- `insights` - Insights do sistema
- `user_profiles` - Perfis detalhados
- `user_streaks` - Sequências de exercícios

### Sistema Profissional:
- `profissionais` - Dados dos profissionais
- `profissional_cliente` - Relacionamento profissional-cliente
- `exames_documentos` - Upload de exames
- `treinos_atribuidos` - Treinos passados pelos profissionais
- `execucoes_treino` - Execuções dos treinos
- `feedback_treino` - Feedback pós-treino
- `cargas_exercicio` - Registro de cargas e progressão

## 🔧 Configurações Adicionais

### Storage Bucket:
O script cria automaticamente o bucket `medical-documents` para armazenar exames e documentos.

### Tipos de Usuário:
- `aluno` - Cliente/Paciente
- `personal_trainer` - Personal Trainer
- `medico` - Médico
- `fisioterapeuta` - Fisioterapeuta  
- `nutricionista` - Nutricionista

## 🛠️ Troubleshooting

### Erro: "relation does not exist"
- Certifique-se de executar o `SCRIPT_BASE_PRIMEIRO.sql` antes
- Verifique se o script foi executado completamente

### Erro: "storage bucket already exists"
- Normal se o bucket já existir
- O script usa `ON CONFLICT` para evitar erros

### Erro: "policy already exists"
- Normal se as políticas já existem
- O script usa `IF NOT EXISTS` quando possível

## 📱 Funcionalidades Habilitadas

Após a execução dos scripts, o app terá:

✅ **Sistema de profissionais** completo  
✅ **Upload de exames** pelos clientes  
✅ **Treinos atribuídos** por profissionais  
✅ **Feedback pós-treino** com escala EVA  
✅ **Dashboard profissional** para gerenciar clientes  
✅ **Registro de cargas** e progressão  
✅ **Relacionamento** profissional-cliente  

## 🔄 Próximos Passos

1. Execute os scripts na ordem correta
2. Teste o login/cadastro no app
3. Crie contas de profissionais e clientes
4. Teste o fluxo completo:
   - Profissional adiciona cliente
   - Profissional atribui treino
   - Cliente executa treino
   - Cliente fornece feedback
   - Cliente faz upload de exames

## ⚠️ Importante

- **Faça backup** dos dados existentes antes da execução
- **Teste primeiro** em ambiente de desenvolvimento
- **Verifique permissões** no Supabase após execução
- **Monitore logs** durante a implementação

---

**Desenvolvido para Prometeus** - Sistema de gerenciamento profissional de saúde e fitness