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
    const profileData = {
     id: authData.user.id,
     nome: name,
     email: email,
     tipo: tipo,
     plano: 'trial',
     created_at: new Date().toISOString()
    }

    console.log('Usuário criado com sucesso:', profileData)
    return { user: authData.user, profile: profileData }
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
    // Criar perfil com dados do Auth
    const profile = {
     id: data.user.id,
     nome: data.user.user_metadata?.name || 'Usuário',
     email: data.user.email,
     tipo: data.user.user_metadata?.tipo || 'aluno',
     plano: 'trial',
     created_at: data.user.created_at
    }

    return { user: data.user, profile }
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

  // Retornar dados do Auth sem buscar na tabela
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