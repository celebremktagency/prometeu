import { supabase } from './supabaseClient'

export const communityService = {
 async listarPosts(): Promise<any[]> {
  const { data, error } = await supabase
   .from('comunidade_posts')
   .select('*')
   .eq('status', 'ativo')
   .order('created_at', { ascending: false })

  if (error) return []
  return data || []
 },

 async criarPost(titulo: string, conteudo: string, tipo: string = 'texto'): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
   .from('comunidade_posts')
   .insert([
    {
     autor_id: user.id,
     titulo,
     conteudo,
     tipo,
     status: 'ativo',
     curtidas: 0,
     comentarios_count: 0,
     visualizacoes: 0
    }
   ])
   .select()
   .single()

  if (error) throw error
  return data
 }
}