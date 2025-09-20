# Prometeus App

Um aplicativo React Native para acompanhamento de treinos e registros de dor, desenvolvido com Expo e integrado ao Supabase.

## 🏗️ Tecnologias Utilizadas

- **React Native** + **Expo** (~49.0.0)
- **TypeScript** para tipagem estática
- **React Query** para gerenciamento de estado e cache
- **styled-components/native** para estilização
- **React Navigation** para navegação
- **Supabase** para backend e autenticação
- **react-native-chart-kit** para gráficos
- **react-native-vector-icons** (Feather) para ícones
- **ESLint** + **Prettier** para qualidade de código

## 📁 Estrutura do Projeto

```
/app
  /src
    /assets          # Recursos estáticos (ícones, imagens)
    /components      # Componentes reutilizáveis
    /screens         # Telas do aplicativo
    /hooks          # Custom hooks
    /services       # Serviços e integrações
    /utils          # Funções utilitárias
    /theme          # Design tokens e temas
    /navigation     # Configuração de navegação
    /types          # Tipos TypeScript
/database           # Scripts SQL para Supabase
/docs              # Documentação
```

## 🚀 Como Executar

### Pré-requisitos

1. **Node.js** (versão 16 ou superior)
2. **npm** ou **yarn**
3. **Expo CLI** (`npm install -g @expo/cli`)
4. **Conta no Supabase** com projeto criado

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone <repository-url>
   cd prometeus-app
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas credenciais do Supabase:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://hchhqeqlkgknucokvxec.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjaGhxZXFsa2drbnVjb2t2eGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjM5NjYsImV4cCI6MjA3MzkzOTk2Nn0.5OQ1d5brht8h4jQKdbVyKm3aJkkef-RFxrPXNSAuVyc
   ```

4. **Execute os scripts SQL no Supabase:**
   
   No painel do Supabase, execute os seguintes scripts na ordem:
   
   ```sql
   -- 1. Criar tabela usuarios
   -- Execute: /database/Usuario/usuario.sql
   
   -- 2. Criar tabela treinos  
   -- Execute: /database/Treino/treino.sql
   
   -- 3. Criar tabela dores
   -- Execute: /database/Dor/dor.sql
   
   -- 4. Criar tabela insights
   -- Execute: /database/Insights/insights.sql
   
   -- 5. (Opcional) Inserir dados de exemplo
   -- Execute os arquivos insertInicial.sql de cada pasta
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm start
   # ou
   yarn start
   ```

6. **Execute no dispositivo:**
   - **iOS:** Pressione `i` ou use o app Expo Go
   - **Android:** Pressione `a` ou use o app Expo Go
   - **Web:** Pressione `w`

## 📱 Funcionalidades

### 🔐 Autenticação
- Cadastro de usuários com nome, email e senha
- Login com email e senha
- Logout seguro

### 🏃‍♂️ Treinos
- Visualização de treinos planejados na tela inicial
- Lista completa de treinos na aba "Treinos"
- Adicionar novos exercícios com séries e repetições
- Marcar treinos como concluídos
- Excluir treinos

### 😣 Registro de Dor
- Slider interativo para avaliar nível de dor (0-10)
- Seleção de músculos específicos
- Registro automático com timestamp
- Interface visual com silhueta humana (placeholder)

### 📊 Insights e Progresso
- Gráficos de progresso semanal (treinos concluídos)
- Gráfico de nível de dor (média dos últimos 7 dias)
- Atualização automática dos dados
- Refresh manual disponível

## 🧪 Checklist de Testes

Siga este checklist para validar o funcionamento completo:

- [ ] **Configuração inicial**
  - [ ] `npm install` executa sem erros
  - [ ] `expo start` inicia o servidor
  - [ ] Arquivo `.env` criado com as credenciais do Supabase
  - [ ] Scripts SQL executados no Supabase

- [ ] **Autenticação**
  - [ ] Cadastro de novo usuário funciona
  - [ ] Login com credenciais corretas
  - [ ] Erro mostrado para credenciais inválidas
  - [ ] Logout limpa a sessão

- [ ] **Navegação**
  - [ ] Bottom tabs funcionam (Home, Progresso, Treinos)
  - [ ] Transições entre telas são suaves
  - [ ] Botão voltar funciona corretamente

- [ ] **Treinos**
  - [ ] Lista de treinos carrega corretamente
  - [ ] Adicionar novo treino funciona
  - [ ] Marcar treino como concluído
  - [ ] Excluir treino funciona
  - [ ] Botão "Iniciar" na Home atualiza o status

- [ ] **Registro de Dor**
  - [ ] Slider de dor responde ao toque
  - [ ] Seleção de músculos funciona
  - [ ] Registro é salvo no banco
  - [ ] Validação impede envio sem seleção

- [ ] **Insights**
  - [ ] Gráficos carregam dados corretos
  - [ ] Progresso semanal atualiza após treinos
  - [ ] Nível de dor atualiza após registros
  - [ ] Pull-to-refresh funciona

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm start              # Inicia o Expo dev server
npm run android        # Executa no Android
npm run ios           # Executa no iOS
npm run web           # Executa no navegador

# Qualidade de código
npm run lint          # Executa ESLint
npm run lint:fix      # Corrige problemas do ESLint automaticamente
npm run format        # Formata código com Prettier
npm run type-check    # Verifica tipos TypeScript
```

## 🎨 Design System

O app utiliza um design system consistente definido em `/app/src/theme/tokens.ts`:

### Cores
- **Background:** `#FFFFFF`
- **Surface:** `#F7F8FA` 
- **Accent:** `#06C7C3` (cyan/teal)
- **Danger:** `#FF4D6D` (para dor/alertas)
- **Text Primary:** `#0F1724`
- **Text Secondary:** `#6B7280`

### Tipografia
- **Font Family:** Poppins
- **H1:** 42px, weight 700
- **H2:** 32px, weight 600
- **Body:** 16px, weight 400

### Espaçamentos
- **xs:** 4px, **sm:** 8px, **md:** 16px
- **lg:** 24px, **xl:** 32px, **xxl:** 48px

## 🗃️ Banco de Dados

### Tabelas Supabase

1. **usuarios**
   - `id` (UUID, PK)
   - `nome` (TEXT)
   - `email` (TEXT, UNIQUE)
   - `created_at` (TIMESTAMP)

2. **treinos**
   - `id` (UUID, PK)
   - `usuario_id` (UUID, FK)
   - `exercicio` (TEXT)
   - `series` (INT)
   - `repeticoes` (TEXT)
   - `status` (TEXT: planned/done/skipped)
   - `created_at` (TIMESTAMP)

3. **dores**
   - `id` (UUID, PK)
   - `usuario_id` (UUID, FK)
   - `musculo` (TEXT)
   - `nivel` (NUMERIC 0-10)
   - `data_registro` (TIMESTAMP)

4. **insights**
   - `id` (UUID, PK)
   - `usuario_id` (UUID, FK)
   - `progresso_semanal` (NUMERIC)
   - `nivel_dor` (NUMERIC)
   - `data_registro` (TIMESTAMP)

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de instalação de dependências**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Erro "Metro bundler crashed"**
   ```bash
   expo start --clear
   ```

3. **Problemas com Supabase**
   - Verifique se as variáveis de ambiente estão corretas
   - Confirme que as tabelas foram criadas no Supabase
   - Verifique se o RLS (Row Level Security) está configurado

4. **Fontes não carregam**
   - As fontes Poppins são opcionais
   - O app funcionará com fontes do sistema se houver erro

## 📄 Licença

Este projeto foi desenvolvido como demonstração técnica.

## 🤝 Contribuição

Para contribuir com o projeto:

1. Faça fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

**Desenvolvido com ❤️ usando React Native + Expo**