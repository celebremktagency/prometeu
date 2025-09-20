# API Documentation - Prometeus App

Esta documentação descreve todos os serviços e endpoints utilizados pelo aplicativo Prometeus, que utiliza Supabase como backend.

## 🏗️ Arquitetura

O app utiliza a arquitetura de **services** para abstrair as chamadas ao Supabase:
- **supabaseClient.ts** - Configuração do cliente
- **authService.ts** - Autenticação
- **treinoService.ts** - Gerenciamento de treinos
- **dorService.ts** - Registros de dor
- **insightsService.ts** - Cálculos e insights

## 🔐 Autenticação (authService.ts)

### `signUp(data: SignUpData)`
**Descrição:** Registra novo usuário e cria perfil na tabela usuarios.

**Parâmetros:**
```typescript
interface SignUpData {
  name: string;
  email: string;
  password: string;
}
```

**Retorno:**
```typescript
{
  user: User;
  profile: Usuario;
}
```

**Comportamento:**
1. Cria usuário no Supabase Auth
2. Insere perfil na tabela `usuarios` com o mesmo ID
3. Retorna dados do usuário e perfil

---

### `signIn(email: string, password: string)`
**Descrição:** Faz login e busca perfil do usuário.

**Parâmetros:**
- `email` (string) - Email do usuário
- `password` (string) - Senha do usuário

**Retorno:**
```typescript
{
  user: User;
  profile: Usuario;
}
```

**Comportamento:**
1. Autentica no Supabase Auth
2. Busca perfil na tabela `usuarios`
3. Retorna dados combinados

---

### `signOut()`
**Descrição:** Encerra sessão do usuário.

**Comportamento:**
- Remove token de autenticação
- Limpa estado local

---

### `getCurrentUser()`
**Descrição:** Retorna usuário autenticado atual.

**Retorno:** `User | null`

---

### `getCurrentUserProfile()`
**Descrição:** Busca perfil completo do usuário logado.

**Retorno:** `Usuario | null`

## 🏃‍♂️ Treinos (treinoService.ts)

### `getTreinos(usuarioId: string)`
**Descrição:** Lista todos os treinos do usuário.

**SQL Generated:**
```sql
SELECT * FROM treinos 
WHERE usuario_id = $1 
ORDER BY created_at DESC
```

**Retorno:** `Treino[]`

---

### `createTreino(usuarioId: string, payload: CreateTreinoData)`
**Descrição:** Cria novo treino para o usuário.

**Parâmetros:**
```typescript
interface CreateTreinoData {
  exercicio: string;
  series: number;
  repeticoes: string;
  status?: 'planned' | 'done' | 'skipped';
}
```

**SQL Generated:**
```sql
INSERT INTO treinos (usuario_id, exercicio, series, repeticoes, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING *
```

**Validações:**
- `usuarioId` deve ser válido
- `exercicio` é obrigatório
- `status` padrão é 'planned'

---

### `updateTreino(id: string, payload: UpdateTreinoData)`
**Descrição:** Atualiza treino existente.

**Parâmetros:**
```typescript
interface UpdateTreinoData {
  exercicio?: string;
  series?: number;
  repeticoes?: string;
  status?: 'planned' | 'done' | 'skipped';
}
```

**SQL Generated:**
```sql
UPDATE treinos 
SET exercicio = $2, series = $3, repeticoes = $4, status = $5
WHERE id = $1
RETURNING *
```

---

### `deleteTreino(id: string)`
**Descrição:** Remove treino permanentemente.

**SQL Generated:**
```sql
DELETE FROM treinos WHERE id = $1
```

---

### `markTreinoAsDone(id: string)`
**Descrição:** Marca treino como concluído (shortcut para updateTreino).

**Comportamento:** Executa `updateTreino(id, { status: 'done' })`

## 😣 Dor (dorService.ts)

### `recordDor(data: RecordDorData)`
**Descrição:** Registra nível de dor para músculo específico.

**Parâmetros:**
```typescript
interface RecordDorData {
  usuarioId: string;
  musculo: string;
  nivel: number; // 0.0 - 10.0
}
```

**SQL Generated:**
```sql
INSERT INTO dores (usuario_id, musculo, nivel)
VALUES ($1, $2, $3)
RETURNING *
```

**Validações:**
- `nivel` deve estar entre 0.0 e 10.0
- `musculo` é obrigatório
- `usuarioId` deve ser válido

---

### `getDorHistory(usuarioId: string, startDate: string, endDate: string)`
**Descrição:** Busca histórico de dor em período específico.

**SQL Generated:**
```sql
SELECT * FROM dores 
WHERE usuario_id = $1 
  AND data_registro >= $2 
  AND data_registro <= $3
ORDER BY data_registro ASC
```

---

### `getDorByMusculo(usuarioId: string, musculo: string, days: number = 7)`
**Descrição:** Busca registros de dor para músculo específico nos últimos N dias.

**Comportamento:**
1. Calcula data de início (hoje - N dias)
2. Filtra por usuário, músculo e período
3. Ordena por data

---

### `getAverageDorByDay(usuarioId: string, days: number = 7)`
**Descrição:** Calcula média de dor por dia nos últimos N dias.

**Retorno:**
```typescript
{
  date: string;      // YYYY-MM-DD
  average: number;   // Média do dia
}[]
```

**Algoritmo:**
1. Busca todos os registros do período
2. Agrupa por data (formato YYYY-MM-DD)
3. Calcula média para cada dia
4. Retorna array ordenado por data

## 📊 Insights (insightsService.ts)

### `getWeeklyInsights(usuarioId: string)`
**Descrição:** Calcula insights semanais combinando dados de treino e dor.

**Retorno:**
```typescript
interface WeeklyInsights {
  progresso_semanal: number;    // Número de treinos concluídos
  nivel_dor: number;           // Média de dor da semana
  dataset_chart: ChartDataset; // Dados para gráfico
}

interface ChartDataset {
  labels: string[];   // ['Seg', 'Ter', 'Qua', ...]
  values: number[];   // Valores correspondentes
}
```

**Algoritmo:**
1. **Progresso Semanal:**
   - Conta treinos com `status = 'done'` nos últimos 7 dias
   
2. **Nível de Dor:**
   - Busca registros de dor dos últimos 7 dias
   - Calcula média geral do período
   
3. **Dataset do Gráfico:**
   - Cria array de 7 dias (hoje - 6 até hoje)
   - Para cada dia, calcula média de dor
   - Retorna labels e values alinhados

**Chamadas Internas:**
- `dorService.getAverageDorByDay()`
- `treinoService.getTreinos()` (filtrado por data)

---

### `saveInsights(usuarioId: string, progressoSemanal: number, nivelDor: number)`
**Descrição:** Salva snapshot dos insights na tabela.

**SQL Generated:**
```sql
INSERT INTO insights (usuario_id, progresso_semanal, nivel_dor)
VALUES ($1, $2, $3)
RETURNING *
```

**Uso:** Chamado automaticamente por `getWeeklyInsights()` para manter histórico.

---

### `getLatestInsights(usuarioId: string)`
**Descrição:** Busca insights mais recentes do usuário.

**SQL Generated:**
```sql
SELECT * FROM insights 
WHERE usuario_id = $1 
ORDER BY data_registro DESC 
LIMIT 1
```

## 🔒 Segurança e Validações

### Row Level Security (RLS)
Todas as tabelas devem ter RLS habilitado no Supabase:

```sql
-- Exemplo para tabela treinos
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own treinos" ON treinos
FOR ALL USING (auth.uid() = usuario_id);
```

### Validações de Entrada

1. **Todos os serviços:**
   - Verificam se `usuarioId` corresponde ao token JWT
   - Validam tipos e formatos de dados

2. **Treinos:**
   - `exercicio`: string não vazia
   - `series`: número positivo
   - `status`: enum válido

3. **Dor:**
   - `nivel`: número entre 0.0 e 10.0
   - `musculo`: string não vazia

## 🚨 Tratamento de Erros

### Códigos de Erro Comuns

- **PGRST116** - Nenhum dado encontrado
- **23505** - Violação de unique constraint
- **23503** - Violação de foreign key
- **42501** - Acesso negado (RLS)

### Padrão de Tratamento

```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select('*');
    
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Service error:', error);
  throw new Error('User-friendly message');
}
```

## 📈 Performance e Cache

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});
```

### Query Keys Pattern

- `['treinos', usuarioId]` - Lista de treinos
- `['insights', usuarioId]` - Insights do usuário
- `['dor', usuarioId, periodo]` - Registros de dor

### Invalidação de Cache

Mutations invalidam queries relacionadas:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries(['treinos', usuarioId]);
  queryClient.invalidateQueries(['insights', usuarioId]);
}
```

## 🔄 Fluxos de Dados

### Fluxo de Registro de Dor
1. Usuário move slider e seleciona músculos
2. `PainLevelScreen` chama `recordDor()` para cada músculo
3. `dorService.recordDor()` insere registros
4. Hook invalida cache de insights
5. `ProgressScreen` recarrega dados automaticamente

### Fluxo de Treino
1. Usuário clica "Iniciar" na `HomeScreen`
2. `useTreinos.markAsDone()` atualiza status
3. Cache de treinos e insights é invalidado
4. UI atualiza automaticamente

### Fluxo de Insights
1. `ProgressScreen` monta e chama `useInsights()`
2. `insightsService.getWeeklyInsights()` calcula dados
3. Busca treinos e dores dos últimos 7 dias
4. Processa dados e retorna insights + dataset
5. Salva snapshot na tabela `insights`

---

**Documentação atualizada em:** `2024-01-XX`  
**Versão da API:** `1.0.0`