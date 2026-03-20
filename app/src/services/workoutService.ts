import { supabase } from './supabaseClient'

export interface WorkoutTemplate {
 id: string
 nome: string
 descricao?: string
 exercises?: any[]
 user_id?: string
}

export interface Exercise {
 id: string
 nome: string
 descricao?: string
 grupo_muscular: string
 youtube_url?: string
 nivel_dificuldade?: string
}

export interface PersonalConnection {
 id: string
 personal_id: string
 aluno_id: string
 status: string
 personal_nome?: string
 aluno_nome?: string
}

export const workoutService = {
 // Verificar se usuário tem personal trainer
 async hasPersonalTrainer(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
   .from('professional_clients')
   .select('id')
   .eq('client_id', user.id)
   .maybeSingle()

  return !!data
 },

 // Obter personal trainer do usuário
 async getPersonalTrainer(): Promise<PersonalConnection | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: connection, error } = await supabase
   .from('professional_clients')
   .select('*')
   .eq('client_id', user.id)
   .maybeSingle()

  if (error) throw error
  if (!connection) return null

  const { data: trainerProfile } = await supabase
   .from('user_profiles')
   .select('user_id, nome, tipo')
   .eq('user_id', connection.trainer_id)
   .single()

  return { ...connection, trainer: trainerProfile }
 },

 // Listar treinos do usuário
 async getUserWorkouts(): Promise<WorkoutTemplate[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Verificar se tem personal trainer
  const hasPersonal = await this.hasPersonalTrainer()

  if (hasPersonal) {
   // Se tem personal, buscar treinos atribuídos
   const { data: atribuidos, error } = await supabase
    .from('treinos_atribuidos')
    .select('*')
    .eq('aluno_id', user.id)
    .eq('status', 'ativo')

   if (error) throw error
   if (!atribuidos || atribuidos.length === 0) return []

   const treinoIds = atribuidos.map(a => a.treino_id)
   const { data: treinos } = await supabase.from('treinos').select('*').in('id', treinoIds)
   return treinos || []
  } else {
   // Se não tem personal, buscar treinos próprios
   const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('created_by', user.id)

   if (error) throw error
   return data || []
  }
 },

 // Criar novo treino (só se não tiver personal)
 async createWorkout(nome: string, descricao?: string): Promise<WorkoutTemplate> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const hasPersonal = await this.hasPersonalTrainer()
  if (hasPersonal) {
   throw new Error('Usuários com personal trainer não podem criar treinos próprios')
  }

  const { data, error } = await supabase
   .from('workout_templates')
   .insert([
    {
     nome,
     descricao,
     created_by: user.id,
     tipo: 'personalizado'
    }
   ])
   .select()
   .single()

  if (error) throw error
  return data
 },

 // Listar exercícios disponíveis
 async getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
   .from('exercises')
   .select('*')
   .order('nome')

  if (error) throw error
  return data || []
 },

 // Iniciar treino
 async startWorkout(workoutTemplateId: string): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
   .from('workout_sessions')
   .insert([
    {
     user_id: user.id,
     workout_template_id: workoutTemplateId,
     data_inicio: new Date().toISOString(),
     status: 'em_andamento'
    }
   ])
   .select()
   .single()

  if (error) throw error
  return data
 },

 // Finalizar treino
 async finishWorkout(sessionId: string, feedback?: any): Promise<void> {
  const { error } = await supabase
   .from('workout_sessions')
   .update({
    data_fim: new Date().toISOString(),
    status: 'concluido',
    feedback
   })
   .eq('id', sessionId)

  if (error) throw error

  // Registrar no histórico de execuções
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (currentUser) {
   const { error: execError } = await supabase
    .from('execucoes_treino')
    .insert([{
     cliente_id: currentUser.id, // FK correta para auth.users(id)
     data_execucao: new Date().toISOString(),
     exercicios_realizados: '[]',
     tempo_total_min: 0,
     nivel_dificuldade_percebido: 5,
     observacoes_cliente: 'Treino finalizado',
     finalizado: true
    }])

   if (execError) console.warn('Erro ao registrar execução:', execError)
  }
 },

 // Para personal trainers: listar alunos
 async getStudents(): Promise<PersonalConnection[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: connections, error } = await supabase
   .from('professional_clients')
   .select('*')
   .eq('trainer_id', user.id)

  if (error) throw error
  if (!connections || connections.length === 0) return []

  const clientIds = connections.map(c => c.client_id)
  const { data: clients } = await supabase
   .from('user_profiles')
   .select('user_id, nome, email')
   .in('user_id', clientIds)

  return connections.map(conn => ({
   ...conn,
   cliente: clients?.find(c => c.user_id === conn.client_id) || null
  }))
 },

 // Para personal trainers: atribuir treino a aluno
 async assignWorkoutToStudent(workoutTemplateId: string, alunoId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase
   .from('treinos_atribuidos')
   .insert([
    {
     treino_id: workoutTemplateId,
     aluno_id: alunoId,
     personal_id: user.id,
     data_inicio: new Date().toISOString().split('T')[0],
     status: 'ativo'
    }
   ])

  if (error) throw error
 }
}