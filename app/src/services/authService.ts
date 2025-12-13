import { supabase } from './supabaseClient'
import { User } from '../types'

interface SignUpData {
 name: string
 email: string
 password: string
 tipo: 'aluno' | 'personal_trainer' | 'fisioterapeuta' | 'nutricionista' | 'medico'
}

export const authService = {
 async signUp(emailOrData: string | SignUpData, senha?: string, nome?: string, tipo?: 'aluno' | 'personal_trainer') {
  let signUpData: SignUpData;
  
  if (typeof emailOrData === 'string') {
   signUpData = {
    email: emailOrData,
    password: senha!,
    name: nome!,
    tipo: tipo!
   };
  } else {
   signUpData = emailOrData;
  }
  try {
   const { data: authData, error: authError } = await supabase.auth.signUp({
    email: signUpData.email,
    password: signUpData.password,
    options: {
     data: {
      name: signUpData.name,
      tipo: signUpData.tipo
     }
    }
   })

   if (authError) throw authError

   if (authData.user) {
    const { data: profileData, error: profileError } = await supabase
     .from('user_profiles')
     .insert([
      {
       user_id: authData.user.id,
       nome: signUpData.name,
       email: signUpData.email,
       tipo: signUpData.tipo
      }
     ])
     .select()
     .single()

    if (profileError) throw profileError

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
    const { data: profile } = await supabase
     .from('user_profiles')
     .select('*')
     .eq('user_id', data.user.id)
     .single()

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

  const { data, error } = await supabase
   .from('user_profiles')
   .select('*')
   .eq('user_id', user.id)
   .single()

  if (error) throw error
  return data
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