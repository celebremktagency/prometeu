# 🎯 PROMETEUS - NOVA ESTRUTURA DE BANCO DE DADOS

## 📊 HIERARQUIA CORRETA IMPLEMENTADA

```
🏋️ EXERCÍCIO (unidade básica)
    ↓ 
💪 TREINO (sequência de exercícios)
    ↓
📋 PROGRAMA (plano de treino completo)
```

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### 1. **EXERCÍCIOS** - Unidades básicas
```sql
CREATE TABLE exercicios (
  id uuid PRIMARY KEY,
  nome text NOT NULL,                    -- "Agachamento", "Flexão"
  descricao text,
  grupo_muscular text[],                 -- ["pernas", "glúteos"]
  equipamento text,                      -- "peso corporal", "halteres"
  dificuldade text,                      -- "iniciante", "intermediario", "avancado"
  instrucoes text,                       -- Como executar
  dicas_seguranca text,
  video_url text,
  imagem_url text,
  criado_por uuid,                       -- Personal que criou
  is_publico boolean,                    -- Público ou privado
  created_at timestamptz,
  updated_at timestamptz
);
```

### 2. **TREINOS** - Sequências de exercícios
```sql
CREATE TABLE treinos (
  id uuid PRIMARY KEY,
  nome text NOT NULL,                    -- "Upper Body", "Treino Pernas A"
  descricao text,
  objetivo text,                         -- "Hipertrofia", "Força"
  duracao_estimada integer,              -- em minutos
  nivel text,                            -- "iniciante", "intermediario", "avancado"
  criado_por uuid,
  is_publico boolean,
  tags text[],                           -- ["hipertrofia", "pernas"]
  created_at timestamptz,
  updated_at timestamptz
);

-- Relação N:N entre treinos e exercícios
CREATE TABLE treino_exercicios (
  id uuid PRIMARY KEY,
  treino_id uuid REFERENCES treinos(id),
  exercicio_id uuid REFERENCES exercicios(id),
  ordem integer NOT NULL,                -- 1, 2, 3... (ordem no treino)
  series integer DEFAULT 3,
  repeticoes text,                       -- "12", "8-10", "até falha"
  peso_sugerido text,                    -- "70% 1RM", "40kg"
  tempo_descanso text,                   -- "60s", "1-2min"
  observacoes text,
  created_at timestamptz
);
```

### 3. **PROGRAMAS** - Planos completos
```sql
CREATE TABLE programas (
  id uuid PRIMARY KEY,
  nome text NOT NULL,                    -- "Hipertrofia 5x", "Cut 6 semanas"
  descricao text,
  objetivo text,                         -- "Ganho massa muscular"
  duracao_semanas integer,
  frequencia_semanal integer,            -- quantos dias por semana
  nivel text,
  criado_por uuid,
  is_publico boolean,
  categoria text,                        -- "Hipertrofia", "Emagrecimento"
  tags text[],
  created_at timestamptz,
  updated_at timestamptz
);

-- Relação N:N entre programas e treinos
CREATE TABLE programa_treinos (
  id uuid PRIMARY KEY,
  programa_id uuid REFERENCES programas(id),
  treino_id uuid REFERENCES treinos(id),
  dia_semana integer,                    -- 1=segunda, 2=terça, etc.
  semana integer DEFAULT 1,              -- qual semana do programa
  ordem integer,
  observacoes text,
  created_at timestamptz
);
```

### 4. **ATRIBUIÇÕES E EXECUÇÕES**
```sql
-- Personal atribui programa para aluno
CREATE TABLE programas_atribuidos (
  id uuid PRIMARY KEY,
  personal_id uuid REFERENCES users(id),
  aluno_id uuid REFERENCES users(id),
  programa_id uuid REFERENCES programas(id),
  data_inicio date,
  data_fim date,
  status text,                           -- "ativo", "pausado", "concluido"
  observacoes text,
  progresso jsonb,                       -- progressos customizados
  created_at timestamptz,
  updated_at timestamptz
);

-- Log de treinos executados
CREATE TABLE treinos_executados (
  id uuid PRIMARY KEY,
  usuario_id uuid REFERENCES users(id),
  treino_id uuid REFERENCES treinos(id),
  programa_atribuido_id uuid REFERENCES programas_atribuidos(id),
  data_execucao timestamptz,
  duracao_minutos integer,               -- tempo real gasto
  avaliacao integer,                     -- 1-5 estrelas
  feedback text,
  status text,                           -- "concluido", "incompleto", "pulado"
  created_at timestamptz
);

-- Log detalhado de cada exercício executado
CREATE TABLE exercicios_executados (
  id uuid PRIMARY KEY,
  treino_executado_id uuid REFERENCES treinos_executados(id),
  exercicio_id uuid REFERENCES exercicios(id),
  series_planejadas integer,
  series_executadas integer,
  repeticoes_planejadas text,
  repeticoes_executadas jsonb,           -- [12, 10, 8] (por série)
  peso_utilizado jsonb,                  -- [50, 50, 45] (por série)
  tempo_descanso_real text,
  observacoes text,
  dificuldade_percebida integer,         -- 1-10 (escala de esforço)
  created_at timestamptz
);
```

### 5. **SISTEMA DE DORES ATUALIZADO**
```sql
CREATE TABLE dores_logs (
  id uuid PRIMARY KEY,
  usuario_id uuid REFERENCES users(id),
  treino_executado_id uuid REFERENCES treinos_executados(id),
  exercicio_id uuid REFERENCES exercicios(id),
  data timestamptz,
  intensidade numeric(3,1),              -- 0-10
  musculo text,
  tipo_dor text,                         -- "aguda", "crônica", "fadiga"
  descricao text,
  created_at timestamptz
);
```

## 💻 SERVIÇOS IMPLEMENTADOS

### 1. **ExercicioService** - `exercicioService.ts`
```typescript
// Gerencia exercícios únicos
await exercicioService.buscarExercicios(filtros, page, limit);
await exercicioService.criar(exercicio);
await exercicioService.buscarPorGrupoMuscular(['pernas', 'glúteos']);
await exercicioService.buscarPopulares();
```

### 2. **TreinoNovoService** - `treinoNovoService.ts`
```typescript
// Gerencia treinos como sequências de exercícios
await treinoNovoService.buscarCompleto(id); // com exercícios
await treinoNovoService.adicionarExercicio(treinoId, exercicioData);
await treinoNovoService.reordenarExercicios(treinoId, exercicios);
await treinoNovoService.duplicar(id, novoNome);
```

### 3. **ProgramaService** - `programaService.ts`
```typescript
// Gerencia programas como planos completos
await programaService.buscarCompleto(id); // com treinos e exercícios
await programaService.atribuir(programaId, alunoId, dataInicio);
await programaService.gerarCronogramaSemanal(programaId, semana);
```

### 4. **ExecucaoService** - `execucaoService.ts`
```typescript
// Gerencia execução e logs
await execucaoService.iniciarExecucao(treinoId);
await execucaoService.registrarExercicio(treinoExecutadoId, exercicioId, dados);
await execucaoService.finalizarExecucao(execucaoId, duracao, avaliacao);
await execucaoService.obterEstatisticas(usuarioId);
```

### 5. **DorNovoService** - `dorNovoService.ts`
```typescript
// Gerencia dores relacionadas a exercícios
await dorNovoService.registrarDor(dadosDor);
await dorNovoService.buscarPorExercicio(exercicioId);
await dorNovoService.verificarExercicioProblematico(exercicioId);
```

## 📱 EXEMPLOS DE USO

### **Criando um Exercício:**
```typescript
const exercicio = await exercicioService.criar({
  nome: "Agachamento Búlgaro",
  descricao: "Exercício unilateral para pernas",
  grupo_muscular: ["pernas", "glúteos"],
  equipamento: "peso corporal",
  dificuldade: "intermediario",
  instrucoes: "1. Posicione um pé atrás...",
  is_publico: true
});
```

### **Criando um Treino:**
```typescript
// 1. Criar treino
const treino = await treinoNovoService.criar({
  nome: "Upper Body Hipertrofia",
  objetivo: "Hipertrofia",
  nivel: "intermediario",
  tags: ["hipertrofia", "upper"]
});

// 2. Adicionar exercícios
await treinoNovoService.adicionarExercicio(treino.data.id, {
  exercicio_id: "exercicio-flexao-id",
  ordem: 1,
  series: 4,
  repeticoes: "8-10",
  tempo_descanso: "75s"
});
```

### **Criando um Programa:**
```typescript
// 1. Criar programa
const programa = await programaService.criar({
  nome: "Hipertrofia 5x semana",
  duracao_semanas: 12,
  frequencia_semanal: 5,
  categoria: "Hipertrofia"
});

// 2. Adicionar treinos
await programaService.adicionarTreino(programa.data.id, {
  treino_id: "treino-upper-id",
  dia_semana: 2, // Segunda-feira
  ordem: 1
});
```

### **Executando um Treino:**
```typescript
// 1. Iniciar execução
const execucao = await execucaoService.iniciarExecucao("treino-id");

// 2. Registrar cada exercício
await execucaoService.registrarExercicio(execucao.data.id, "exercicio-id", {
  series_executadas: 3,
  repeticoes_executadas: [12, 10, 8],
  peso_utilizado: [50, 50, 45],
  dificuldade_percebida: 7
});

// 3. Finalizar
await execucaoService.finalizarExecucao(execucao.data.id, 45, 4, "Treino excelente!");
```

## 🔄 MIGRAÇÃO DOS DADOS

### **Dados Incluídos no Script:**
- ✅ **5 usuários** (3 alunos + 2 personals)
- ✅ **5 exercícios** básicos do sistema
- ✅ **2 treinos** exemplo com exercícios
- ✅ **1 programa** exemplo com treinos
- ✅ **Perfis** dos usuários migrados

### **Scripts de Execução:**
1. **`restore_script_nova_estrutura.sql`** - Cria toda estrutura
2. **Script de usuários Authentication** - Cria logins  
3. **Dados iniciais** - Exercícios e treinos base

## 🎯 BENEFÍCIOS DA NOVA ESTRUTURA

### **Para Personals:**
- ✅ Biblioteca de exercícios reutilizável
- ✅ Treinos como templates
- ✅ Programas completos organizados
- ✅ Acompanhamento detalhado dos alunos

### **Para Alunos:**
- ✅ Execução guiada com progressão
- ✅ Histórico completo de performance
- ✅ Analytics de dores por exercício
- ✅ Feedback visual do progresso

### **Para o Sistema:**
- ✅ Escalabilidade infinita
- ✅ Dados estruturados para ML/IA
- ✅ Analytics avançadas
- ✅ Performance otimizada

## 🚀 PRÓXIMOS PASSOS

1. **Execute o script SQL** no Supabase
2. **Crie os usuários** no Authentication  
3. **Teste as funcionalidades** básicas
4. **Adapte as telas** para nova estrutura
5. **Implemente progressivamente** as features

---

**🎉 NOVA ESTRUTURA 100% PRONTA PARA USO!**