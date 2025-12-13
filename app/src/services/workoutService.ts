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
   .from('profissional_cliente')
   .select('*')
   .eq('cliente_id', user.id)
   .eq('status', 'ativo')
   .maybeSingle()

  return !!data
 },

 // Obter personal trainer do usuário
 async getPersonalTrainer(): Promise<PersonalConnection | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
   .from('profissional_cliente')
   .select(`
    *,
    profissional:profissionais(user_id, tipo_profissional),
    user:users!profissional_cliente_profissional_id_fkey(nome)
   `)
   .eq('cliente_id', user.id)
   .eq('status', 'ativo')
   .maybeSingle()

  if (error) throw error
  return data
 },

 // Listar treinos do usuário
 async getUserWorkouts(): Promise<WorkoutTemplate[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Verificar se tem personal trainer
  const hasPersonal = await this.hasPersonalTrainer()

  if (hasPersonal) {
   // Se tem personal, buscar treinos atribuídos
   const { data, error } = await supabase
    .from('treinos_atribuidos')
    .select(`
     *,
     workout_template:workout_templates(*)
    `)
    .eq('aluno_id', user.id)
    .eq('status', 'ativo')

   if (error) throw error
   return data?.map(item => item.workout_template) || []
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

  // Primeiro buscar o profissional_id do usuário atual
  const { data: profData, error: profError } = await supabase
   .from('profissionais')
   .select('id')
   .eq('user_id', user.id)
   .single()

  if (profError || !profData) return []

  const { data, error } = await supabase
   .from('profissional_cliente')
   .select(`
    *,
    cliente:users!profissional_cliente_cliente_id_fkey(nome, email)
   `)
   .eq('profissional_id', profData.id)
   .eq('status', 'ativo')

  if (error) throw error
  return data || []
 },

 // Para personal trainers: atribuir treino a aluno
 async assignWorkoutToStudent(workoutTemplateId: string, alunoId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase
   .from('treinos_atribuidos')
   .insert([
    {
     workout_template_id: workoutTemplateId,
     aluno_id: alunoId,
     personal_id: user.id,
     data_atribuicao: new Date().toISOString(),
     status: 'ativo'
    }
   ])

  if (error) throw error
 }
}