import { supabase } from './supabaseClient'

export const treinoService = {
 async criarTreino(exercicio: string, descricao?: string): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
   .from('treinos')
   .insert([
    {
     exercicio,
     descricao,
     usuario_id: user.id,
     status: 'planned',
     data_criacao: new Date().toISOString(),
     series: 3,
     repeticoes: 10,
     categoria: 'personalizado',
     duracao_min: 30,
     nivel: 'iniciante'
     // criado_por removido - foreign key com problema
    }
   ])
   .select()
   .single()

  if (error) throw error
  return data
 },

 async listarTreinos(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar todos os treinos disponíveis (incluindo os que têm usuario_id null)
  const { data, error } = await supabase
   .from('treinos')
   .select('*')
   .order('data_criacao', { ascending: false })

  if (error) throw error
  return data || []
 },

 async iniciarTreino(id: string): Promise<any> {
  const { data, error } = await supabase
   .from('treinos')
   .update({
    status: 'in_progress',
    data_execucao: new Date().toISOString()
   })
   .eq('id', id)
   .select()
   .single()

  if (error) throw error
  return data
 },

 async finalizarTreino(id: string, observacoes?: string): Promise<any> {
  const { data, error } = await supabase
   .from('treinos')
   .update({
    status: 'completed',
    observacoes
   })
   .eq('id', id)
   .select()
   .single()

  if (error) throw error
  return data
 },

 async listarExercicios(): Promise<any[]> {
  const { data, error } = await supabase
   .from('exercises')
   .select('*')
   .eq('ativo', true)
   .order('nome')

  if (error) throw error
  return data || []
 },

 async listarWorkoutTemplates(): Promise<any[]> {
  const { data, error } = await supabase
   .from('workout_templates')
   .select('*')
   .eq('ativo', true)
   .eq('publico', true)
   .order('nome')

  if (error) throw error
  return data || []
 }
}