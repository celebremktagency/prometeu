import { supabase } from './supabaseClient'

export const insightsService = {
 async listarInsights(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
   .from('insights')
   .select('*')
   .eq('user_id', user.id)
   .eq('ativo', true)
   .order('data_criacao', { ascending: false })

  if (error) return []
  return data || []
 },

 async marcarComoLido(id: string): Promise<void> {
  await supabase
   .from('insights')
   .update({ data_lida: new Date().toISOString() })
   .eq('id', id)
 }
}