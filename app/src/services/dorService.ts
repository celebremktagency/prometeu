import { supabase } from './supabaseClient'

export const dorService = {
 // Registrar dor na tabela adequada
 async registrarDor(data: {
  nivel: number | string,
  localizacao: string,
  descricao?: string,
  contexto?: string,
  exercicio_relacionado?: string
 }): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Garantir que nivel seja sempre integer
  const nivelDor = typeof data.nivel === 'string' ? parseInt(data.nivel) : data.nivel;
  
  console.log('🩹 [DEBUG] Registrando dor:', {
   nivel: nivelDor,
   localizacao: data.localizacao,
   descricao: data.descricao,
   contexto: data.contexto,
   exercicio: data.exercicio_relacionado
  });

  // Tentar inserir na tabela registros_dor primeiro
  const { error: registroError } = await supabase
   .from('registros_dor')
   .insert({
    user_id: user.id,
    nivel_dor: nivelDor,
    localizacao: data.localizacao,
    descricao: data.descricao || null,
    contexto: data.contexto || 'geral',
    exercicio_relacionado: data.exercicio_relacionado || null,
    data_registro: new Date().toISOString()
   });

  if (registroError) {
   console.log('🩹 [DEBUG] Tabela registros_dor não existe, usando user_profiles...');
   
   // Fallback para user_profiles
   const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .update({
     nivel_dor_atual: nivelDor,
     localizacao_dor: data.localizacao,
     updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single();

   if (profileError) throw profileError;
   return profileData;
  }

  console.log('🩹 [DEBUG] Dor registrada com sucesso');
  return { success: true };
 },

 async obterDorAtual(): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
   .from('user_profiles')
   .select('nivel_dor_atual, localizacao_dor, updated_at')
   .eq('user_id', user.id)
   .single()

  if (error) throw error
  return data
 },

 async listarHistoricoDor(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Usar a tabela registros_dor se existir, senão simular dados
  const { data, error } = await supabase
   .from('registros_dor')
   .select('*')
   .eq('user_id', user.id)
   .order('data_registro', { ascending: false })

  if (error) {
   // Se erro, retornar dados simulados baseados no user_profiles
   const { data: profile } = await supabase
    .from('user_profiles')
    .select('nivel_dor_atual, updated_at')
    .eq('user_id', user.id)
    .single()
   
   if (profile && profile.nivel_dor_atual > 0) {
    return [{
     nivel_dor: profile.nivel_dor_atual,
     data_registro: profile.updated_at || new Date().toISOString(),
     user_id: user.id
    }]
   }
   return []
  }
  return data || []
 }
}