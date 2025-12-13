import { supabase } from './supabaseClient'

export interface UserGoal {
 id: string
 user_id: string
 tipo: 'peso' | 'dor' | 'exercicio' | 'streak' | 'custom'
 titulo: string
 descricao?: string
 meta_valor: number
 valor_atual: number
 unidade: string // kg, dias, exercicios, etc
 data_inicio: string
 data_meta?: string
 status: 'ativo' | 'pausado' | 'concluido' | 'cancelado'
 prioridade: 'baixa' | 'media' | 'alta'
 publico: boolean
 categoria?: string
 metadata?: Record<string, any>
 created_at: string
 updated_at: string
}

export interface GoalProgress {
 id: string
 goal_id: string
 valor_anterior: number
 valor_novo: number
 data_progresso: string
 observacoes?: string
 metadata?: Record<string, any>
}

export const goalService = {
 // Obter metas do usuário
 async getUserGoals(status?: UserGoal['status']): Promise<UserGoal[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
   .from('user_goals')
   .select('*')
   .eq('user_id', user.id)
   .order('prioridade', { ascending: false })
   .order('created_at', { ascending: false })

  if (status) {
   query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
 },

 // Obter metas ativas
 async getActiveGoals(): Promise<UserGoal[]> {
  return this.getUserGoals('ativo')
 },

 // Obter meta específica
 async getGoal(goalId: string): Promise<UserGoal | null> {
  const { data, error } = await supabase
   .from('user_goals')
   .select('*')
   .eq('id', goalId)
   .single()

  if (error) return null
  return data
 },

 // Criar nova meta
 async createGoal(goal: {
  tipo: UserGoal['tipo']
  titulo: string
  descricao?: string
  meta_valor: number
  unidade: string
  data_meta?: string
  prioridade?: 'baixa' | 'media' | 'alta'
  publico?: boolean
  categoria?: string
  metadata?: Record<string, any>
 }): Promise<UserGoal> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
   .from('user_goals')
   .insert([{
    user_id: user.id,
    tipo: goal.tipo,
    titulo: goal.titulo,
    descricao: goal.descricao,
    meta_valor: goal.meta_valor,
    valor_atual: 0,
    unidade: goal.unidade,
    data_inicio: new Date().toISOString(),
    data_meta: goal.data_meta,
    status: 'ativo',
    prioridade: goal.prioridade || 'media',
    publico: goal.publico || false,
    categoria: goal.categoria,
    metadata: goal.metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
   }])
   .select()
   .single()

  if (error) throw error
  return data
 },

 // Atualizar progresso da meta
 async updateGoalProgress(goalId: string, novoValor: number, observacoes?: string): Promise<UserGoal> {
  const goal = await this.getGoal(goalId)
  if (!goal) throw new Error('Meta não encontrada')

  const valorAnterior = goal.valor_atual
  
  // Determinar novo status
  let novoStatus = goal.status
  if (novoValor >= goal.meta_valor && goal.status === 'ativo') {
   novoStatus = 'concluido'
  }

  const { data, error } = await supabase
   .from('user_goals')
   .update({
    valor_atual: novoValor,
    status: novoStatus,
    updated_at: new Date().toISOString()
   })
   .eq('id', goalId)
   .select()
   .single()

  if (error) throw error

  // Registrar o progresso
  await this.logProgress(goalId, valorAnterior, novoValor, observacoes)

  return data
 },

 // Incrementar progresso da meta
 async incrementGoalProgress(goalId: string, incremento: number, observacoes?: string): Promise<UserGoal> {
  const goal = await this.getGoal(goalId)
  if (!goal) throw new Error('Meta não encontrada')

  const novoValor = goal.valor_atual + incremento
  return this.updateGoalProgress(goalId, novoValor, observacoes)
 },

 // Registrar progresso no histórico
 async logProgress(goalId: string, valorAnterior: number, valorNovo: number, observacoes?: string): Promise<void> {
  // TODO: Implementar quando houver tabela de histórico de progresso
  console.log('Progress logged:', {
   goal_id: goalId,
   from: valorAnterior,
   to: valorNovo,
   date: new Date(),
   notes: observacoes
  })
 },

 // Pausar meta
 async pauseGoal(goalId: string): Promise<void> {
  const { error } = await supabase
   .from('user_goals')
   .update({
    status: 'pausado',
    updated_at: new Date().toISOString()
   })
   .eq('id', goalId)

  if (error) throw error
 },

 // Reativar meta
 async resumeGoal(goalId: string): Promise<void> {
  const { error } = await supabase
   .from('user_goals')
   .update({
    status: 'ativo',
    updated_at: new Date().toISOString()
   })
   .eq('id', goalId)

  if (error) throw error
 },

 // Cancelar meta
 async cancelGoal(goalId: string): Promise<void> {
  const { error } = await supabase
   .from('user_goals')
   .update({
    status: 'cancelado',
    updated_at: new Date().toISOString()
   })
   .eq('id', goalId)

  if (error) throw error
 },

 // Editar meta
 async updateGoal(goalId: string, updates: Partial<Pick<UserGoal, 'titulo' | 'descricao' | 'meta_valor' | 'data_meta' | 'prioridade' | 'publico' | 'categoria'>>): Promise<void> {
  const { error } = await supabase
   .from('user_goals')
   .update({
    ...updates,
    updated_at: new Date().toISOString()
   })
   .eq('id', goalId)

  if (error) throw error
 },

 // Obter estatísticas das metas
 async getGoalStats() {
  const goals = await this.getUserGoals()
  
  const statusCount = goals.reduce((acc, goal) => {
   acc[goal.status] = (acc[goal.status] || 0) + 1
   return acc
  }, {} as Record<string, number>)

  const typeCount = goals.reduce((acc, goal) => {
   acc[goal.tipo] = (acc[goal.tipo] || 0) + 1
   return acc
  }, {} as Record<string, number>)

  const completedGoals = goals.filter(g => g.status === 'concluido')
  const activeGoals = goals.filter(g => g.status === 'ativo')
  
  const averageProgress = activeGoals.length > 0 
   ? activeGoals.reduce((sum, goal) => sum + (goal.valor_atual / goal.meta_valor * 100), 0) / activeGoals.length
   : 0

  return {
   total: goals.length,
   byStatus: statusCount,
   byType: typeCount,
   completionRate: goals.length > 0 ? (completedGoals.length / goals.length * 100) : 0,
   averageProgress: Math.round(averageProgress),
   activeGoals: activeGoals.length,
   completedGoals: completedGoals.length,
   nearCompletion: activeGoals.filter(g => (g.valor_atual / g.meta_valor) >= 0.8),
   overdue: activeGoals.filter(g => g.data_meta && new Date(g.data_meta) < new Date())
  }
 },

 // Obter metas próximas do vencimento
 async getUpcomingDeadlines(days: number = 7): Promise<UserGoal[]> {
  const goals = await this.getActiveGoals()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  return goals.filter(goal => 
   goal.data_meta && 
   new Date(goal.data_meta) <= futureDate &&
   new Date(goal.data_meta) >= new Date()
  ).sort((a, b) => 
   new Date(a.data_meta!).getTime() - new Date(b.data_meta!).getTime()
  )
 },

 // Helpers para diferentes tipos de metas
 async createWeightGoal(targetWeight: number, currentWeight: number, deadline?: string): Promise<UserGoal> {
  return this.createGoal({
   tipo: 'peso',
   titulo: `Atingir ${targetWeight}kg`,
   descricao: `Meta de peso: de ${currentWeight}kg para ${targetWeight}kg`,
   meta_valor: targetWeight,
   unidade: 'kg',
   data_meta: deadline,
   prioridade: 'alta',
   categoria: 'saude',
   metadata: { peso_inicial: currentWeight }
  })
 },

 async createExerciseGoal(exerciseName: string, targetReps: number, deadline?: string): Promise<UserGoal> {
  return this.createGoal({
   tipo: 'exercicio',
   titulo: `${targetReps} ${exerciseName}`,
   descricao: `Conseguir fazer ${targetReps} repetições de ${exerciseName}`,
   meta_valor: targetReps,
   unidade: 'repetições',
   data_meta: deadline,
   prioridade: 'media',
   categoria: 'fitness',
   metadata: { exercise_name: exerciseName }
  })
 },

 async createStreakGoal(streakType: string, targetDays: number): Promise<UserGoal> {
  return this.createGoal({
   tipo: 'streak',
   titulo: `${targetDays} dias consecutivos`,
   descricao: `Manter sequência de ${streakType} por ${targetDays} dias`,
   meta_valor: targetDays,
   unidade: 'dias',
   prioridade: 'alta',
   categoria: 'habito',
   metadata: { streak_type: streakType }
  })
 },

 async createPainReductionGoal(currentPainLevel: number, targetPainLevel: number): Promise<UserGoal> {
  return this.createGoal({
   tipo: 'dor',
   titulo: `Reduzir dor para nível ${targetPainLevel}`,
   descricao: `Diminuir nível de dor de ${currentPainLevel} para ${targetPainLevel}`,
   meta_valor: targetPainLevel,
   unidade: 'nível',
   prioridade: 'alta',
   categoria: 'saude',
   metadata: { 
    pain_inicial: currentPainLevel,
    reverse_goal: true // Meta de redução
   }
  })
 }
}