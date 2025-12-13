import { supabase } from './supabaseClient'

export interface UserStreak {
 id: string
 user_id: string
 tipo: 'workout' | 'login' | 'pain_log' | 'custom'
 streak_atual: number
 melhor_streak: number
 ultima_atividade: string
 meta_diaria?: number
 ativo: boolean
 created_at: string
 updated_at: string
}

export interface StreakActivity {
 id: string
 user_id: string
 tipo: 'workout' | 'login' | 'pain_log' | 'custom'
 data_atividade: string
 metadata?: Record<string, any>
}

export const streakService = {
 // Obter todas as streaks do usuário
 async getUserStreaks(): Promise<UserStreak[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
   .from('user_streaks')
   .select('*')
   .eq('user_id', user.id)
   .eq('ativo', true)
   .order('streak_atual', { ascending: false })

  if (error) throw error
  return data || []
 },

 // Obter streak específica por tipo
 async getStreakByType(tipo: 'workout' | 'login' | 'pain_log' | 'custom'): Promise<UserStreak | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
   .from('user_streaks')
   .select('*')
   .eq('user_id', user.id)
   .eq('tipo', tipo)
   .eq('ativo', true)
   .maybeSingle()

  if (error) throw error
  return data
 },

 // Inicializar streak para um usuário
 async initializeStreak(tipo: 'workout' | 'login' | 'pain_log' | 'custom', meta_diaria?: number): Promise<UserStreak> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const existingStreak = await this.getStreakByType(tipo)
  if (existingStreak) {
   return existingStreak
  }

  const { data, error } = await supabase
   .from('user_streaks')
   .insert([{
    user_id: user.id,
    tipo,
    streak_atual: 0,
    melhor_streak: 0,
    ultima_atividade: new Date().toISOString(),
    meta_diaria: meta_diaria || 1,
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
   }])
   .select()
   .single()

  if (error) throw error
  return data
 },

 // Registrar atividade e atualizar streak
 async registerActivity(tipo: 'workout' | 'login' | 'pain_log' | 'custom', metadata?: Record<string, any>): Promise<UserStreak> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Verificar se já registrou atividade hoje
  const todayActivity = await this.hasActivityToday(tipo)
  if (todayActivity) {
   // Já registrou hoje, retorna a streak atual
   const streak = await this.getStreakByType(tipo)
   return streak!
  }

  // Obter ou criar streak
  let streak = await this.getStreakByType(tipo)
  if (!streak) {
   streak = await this.initializeStreak(tipo)
  }

  const lastActivity = new Date(streak.ultima_atividade)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  let newStreakCount = streak.streak_atual

  // Verificar se a última atividade foi ontem (continua a streak)
  if (lastActivity.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
   newStreakCount += 1
  } else if (lastActivity.toISOString().split('T')[0] === today) {
   // Já fez atividade hoje, não altera
   return streak
  } else {
   // Quebrou a streak, reinicia
   newStreakCount = 1
  }

  // Atualizar melhor streak se necessário
  const newBestStreak = Math.max(streak.melhor_streak, newStreakCount)

  const { data: updatedStreak, error } = await supabase
   .from('user_streaks')
   .update({
    streak_atual: newStreakCount,
    melhor_streak: newBestStreak,
    ultima_atividade: now.toISOString(),
    updated_at: now.toISOString()
   })
   .eq('id', streak.id)
   .select()
   .single()

  if (error) throw error

  // Registrar a atividade específica (para histórico)
  await this.logActivity(tipo, metadata)

  return updatedStreak
 },

 // Verificar se teve atividade hoje
 async hasActivityToday(tipo: 'workout' | 'login' | 'pain_log' | 'custom'): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
   .from('user_streaks')
   .select('ultima_atividade')
   .eq('user_id', user.id)
   .eq('tipo', tipo)
   .eq('ativo', true)
   .maybeSingle()

  if (error || !data) return false

  const lastActivityDate = new Date(data.ultima_atividade).toISOString().split('T')[0]
  return lastActivityDate === today
 },

 // Registrar atividade no log (para histórico e análises)
 async logActivity(tipo: 'workout' | 'login' | 'pain_log' | 'custom', metadata?: Record<string, any>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // TODO: Implementar quando houver tabela de atividades/logs
  console.log('Activity logged:', { user_id: user.id, tipo, metadata, date: new Date() })
 },

 // Obter estatísticas de streaks
 async getStreakStats() {
  const streaks = await this.getUserStreaks()
  
  const totalStreaks = streaks.reduce((sum, streak) => sum + streak.streak_atual, 0)
  const bestStreaks = streaks.reduce((sum, streak) => sum + streak.melhor_streak, 0)
  
  return {
   activeStreaks: streaks.length,
   totalCurrentDays: totalStreaks,
   totalBestDays: bestStreaks,
   longestStreak: Math.max(...streaks.map(s => s.melhor_streak), 0),
   byType: streaks.reduce((acc, streak) => {
    acc[streak.tipo] = {
     current: streak.streak_atual,
     best: streak.melhor_streak
    }
    return acc
   }, {} as Record<string, { current: number, best: number }>)
  }
 },

 // Definir meta diária para uma streak
 async setDailyGoal(tipo: 'workout' | 'login' | 'pain_log' | 'custom', meta: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  let streak = await this.getStreakByType(tipo)
  if (!streak) {
   streak = await this.initializeStreak(tipo, meta)
   return
  }

  const { error } = await supabase
   .from('user_streaks')
   .update({
    meta_diaria: meta,
    updated_at: new Date().toISOString()
   })
   .eq('id', streak.id)

  if (error) throw error
 },

 // Resetar uma streak específica
 async resetStreak(tipo: 'workout' | 'login' | 'pain_log' | 'custom'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase
   .from('user_streaks')
   .update({
    streak_atual: 0,
    ultima_atividade: new Date().toISOString(),
    updated_at: new Date().toISOString()
   })
   .eq('user_id', user.id)
   .eq('tipo', tipo)

  if (error) throw error
 },

 // Helper functions para diferentes tipos de atividades
 async registerWorkout(metadata?: { workout_id?: string, duration?: number, exercises?: number }): Promise<UserStreak> {
  return this.registerActivity('workout', metadata)
 },

 async registerLogin(): Promise<UserStreak> {
  return this.registerActivity('login')
 },

 async registerPainLog(metadata?: { pain_level?: number, location?: string }): Promise<UserStreak> {
  return this.registerActivity('pain_log', metadata)
 }
}