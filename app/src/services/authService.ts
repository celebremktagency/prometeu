import { supabase } from './supabaseClient'
import { User } from '../types'

interface SignUpData {
 name: string
 email: string
 password: string
 tipo: 'aluno' | 'personal_trainer' | 'fisioterapeuta' | 'nutricionista' | 'medico'
}

export const authService = {
 async signUp(email: string, password: string, name: string, tipo: 'aluno' | 'personal_trainer') {
  try {
   console.log('Tentando criar usuário:', { email, name, tipo })

   const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
     data: {
      name: name,
      tipo: tipo
     }
    }
   })

   console.log('Resposta do auth:', { authData, authError })

   if (authError) {
    console.error('Erro de autenticação:', authError)
    throw authError
   }

   if (authData.user) {
    // Salvar perfil no banco de dados
    const profileData = {
     user_id: authData.user.id,
     nome: name,
     email: email,
     tipo: tipo,
     plano: 'trial',
     ativo: true,
     created_at: new Date().toISOString(),
     updated_at: new Date().toISOString()
    }

    // Tentar inserir perfil (ignora se já existe)
    const { error: profileError } = await supabase
     .from('user_profiles')
     .insert(profileData)

    if (profileError) {
     // Se já existe, tentar update
     if (profileError.code === '23505') {
      await supabase.from('user_profiles').update(profileData).eq('user_id', authData.user.id)
     } else {
      console.warn('Aviso: perfil não salvo no banco:', profileError.message)
     }
    } else {
     console.log('Perfil salvo no banco com sucesso')
    }

    return { user: authData.user, profile: { id: authData.user.id, ...profileData } }
   }

   throw new Error('Falha ao criar usuário')
  } catch (error) {
   console.error('Erro no signUp:', error)
   throw error
  }
 },

 async signIn(email: string, password: string) {
  try {
   const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
   })

   if (error) throw error

   if (data.user) {
    // Buscar perfil do banco
    const { data: dbProfile } = await supabase
     .from('user_profiles')
     .select('*')
     .eq('user_id', data.user.id)
     .single()

    if (dbProfile) {
     return { user: data.user, profile: dbProfile }
    }

    // Se não existe no banco, criar perfil com dados do Auth
    const profileData = {
     user_id: data.user.id,
     nome: data.user.user_metadata?.name || 'Usuário',
     email: data.user.email || '',
     tipo: data.user.user_metadata?.tipo || 'aluno',
     plano: 'trial',
     ativo: true,
     created_at: data.user.created_at,
     updated_at: new Date().toISOString()
    }

    const { error: profileError } = await supabase
     .from('user_profiles')
     .insert(profileData)

    if (profileError) {
     if (profileError.code === '23505') {
      await supabase.from('user_profiles').update(profileData).eq('user_id', data.user.id)
     } else {
      console.warn('Aviso: perfil não salvo no banco:', profileError.message)
     }
    }

    return { user: data.user, profile: { id: data.user.id, ...profileData } }
   }

   throw new Error('Falha no login')
  } catch (error) {
   console.error('Erro no signIn:', error)
   throw error
  }
 },

 async signOut() {
  try {
   console.log('Fazendo logout...')
   const { error } = await supabase.auth.signOut()
   if (error) throw error
   console.log('Logout realizado com sucesso')
  } catch (error) {
   console.error('Erro no logout:', error)
   throw error
  }
 },

 async getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
 },

 async getCurrentUserProfile(): Promise<User | null> {
  const user = await this.getCurrentUser()
  if (!user) return null

  // Buscar perfil do banco
  const { data: dbProfile } = await supabase
   .from('user_profiles')
   .select('*')
   .eq('user_id', user.id)
   .single()

  if (dbProfile) {
   return {
    id: dbProfile.user_id || user.id,
    nome: dbProfile.nome || user.user_metadata?.name || 'Usuário',
    email: dbProfile.email || user.email!,
    tipo: dbProfile.tipo || user.user_metadata?.tipo || 'aluno',
    plano: dbProfile.plano || 'trial',
    created_at: dbProfile.created_at || user.created_at
   }
  }

  // Fallback: dados do Auth
  return {
   id: user.id,
   nome: user.user_metadata?.name || 'Usuário',
   email: user.email!,
   tipo: user.user_metadata?.tipo || 'aluno',
   plano: 'trial',
   created_at: user.created_at
  }
 },

 async resetPassword(email: string) {
  try {
   const { error } = await supabase.auth.resetPasswordForEmail(email)
   
   if (error) throw error
   return { success: true }
  } catch (error: any) {
   throw new Error(error.message || 'Erro ao enviar email de recuperação')
  }
 }
}