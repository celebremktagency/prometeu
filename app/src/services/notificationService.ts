import { supabase } from './supabaseClient'

export interface Notification {
 id: string
 user_id: string
 tipo: 'workout_reminder' | 'achievement' | 'social' | 'system' | 'pain_reminder' | 'streak_warning'
 titulo: string
 mensagem: string
 dados?: Record<string, any>
 lida: boolean
 acao_url?: string
 prioridade: 'baixa' | 'media' | 'alta'
 agendada_para?: string
 enviada_em?: string
 created_at: string
 updated_at: string
}

export interface NotificationPreferences {
 id: string
 user_id: string
 workout_reminders: boolean
 achievement_alerts: boolean
 social_notifications: boolean
 system_updates: boolean
 pain_reminders: boolean
 streak_warnings: boolean
 push_enabled: boolean
 email_enabled: boolean
 quiet_hours_start?: string
 quiet_hours_end?: string
 created_at: string
 updated_at: string
}

export const notificationService = {
 // Obter notificações do usuário
 async getUserNotifications(limit: number = 50, includeRead: boolean = false): Promise<Notification[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
   .from('notifications')
   .select('*')
   .eq('user_id', user.id)
   .order('created_at', { ascending: false })
   .limit(limit)

  if (!includeRead) {
   query = query.eq('lida', false)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
 },

 // Obter notificações não lidas
 async getUnreadNotifications(): Promise<Notification[]> {
  return this.getUserNotifications(50, false)
 },

 // Contar notificações não lidas
 async getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
   .from('notifications')
   .select('*', { count: 'exact', head: true })
   .eq('user_id', user.id)
   .eq('lida', false)

  if (error) throw error
  return count || 0
 },

 // Marcar notificação como lida
 async markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
   .from('notifications')
   .update({ 
    lida: true,
    updated_at: new Date().toISOString()
   })
   .eq('id', notificationId)

  if (error) throw error
 },

 // Marcar todas como lidas
 async markAllAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase
   .from('notifications')
   .update({ 
    lida: true,
    updated_at: new Date().toISOString()
   })
   .eq('user_id', user.id)
   .eq('lida', false)

  if (error) throw error
 },

 // Criar notificação (sistema interno)
 async createNotification(notification: {
  user_id: string
  tipo: Notification['tipo']
  titulo: string
  mensagem: string
  dados?: Record<string, any>
  prioridade?: 'baixa' | 'media' | 'alta'
  acao_url?: string
  agendada_para?: string
 }): Promise<Notification> {
  const { data, error } = await supabase
   .from('notifications')
   .insert([{
    user_id: notification.user_id,
    tipo: notification.tipo,
    titulo: notification.titulo,
    mensagem: notification.mensagem,
    dados: notification.dados,
    prioridade: notification.prioridade || 'media',
    acao_url: notification.acao_url,
    agendada_para: notification.agendada_para,
    lida: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
   }])
   .select()
   .single()

  if (error) throw error
  return data
 },

 // Deletar notificação
 async deleteNotification(notificationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase
   .from('notifications')
   .delete()
   .eq('id', notificationId)
   .eq('user_id', user.id) // Só pode deletar suas próprias notificações

  if (error) throw error
 },

 // Obter preferências de notificação
 async getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
   .from('user_settings')
   .select('*')
   .eq('user_id', user.id)
   .maybeSingle()

  if (error) throw error
  
  // Se não existir, criar com defaults
  if (!data) {
   return this.createDefaultPreferences()
  }
  
  return data
 },

 // Criar preferências padrão
 async createDefaultPreferences(): Promise<NotificationPreferences> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const defaultPrefs = {
   user_id: user.id,
   workout_reminders: true,
   achievement_alerts: true,
   social_notifications: true,
   system_updates: true,
   pain_reminders: true,
   streak_warnings: true,
   push_enabled: true,
   email_enabled: false,
   quiet_hours_start: '22:00',
   quiet_hours_end: '07:00',
   created_at: new Date().toISOString(),
   updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
   .from('user_settings')
   .insert([defaultPrefs])
   .select()
   .single()

  if (error) throw error
  return data
 },

 // Atualizar preferências de notificação
 async updateNotificationPreferences(preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase
   .from('user_settings')
   .update({
    ...preferences,
    updated_at: new Date().toISOString()
   })
   .eq('user_id', user.id)

  if (error) throw error
 },

 // Helpers para diferentes tipos de notificações
 async sendWorkoutReminder(userId: string, workoutName: string): Promise<void> {
  await this.createNotification({
   user_id: userId,
   tipo: 'workout_reminder',
   titulo: 'Hora do treino!',
   mensagem: `Não esqueça do seu treino: ${workoutName}`,
   prioridade: 'media',
   dados: { workout_name: workoutName }
  })
 },

 async sendAchievementAlert(userId: string, achievement: string): Promise<void> {
  await this.createNotification({
   user_id: userId,
   tipo: 'achievement',
   titulo: 'Conquista desbloqueada!',
   mensagem: `Parabéns! Você conquistou: ${achievement}`,
   prioridade: 'alta',
   dados: { achievement }
  })
 },

 async sendStreakWarning(userId: string, streakType: string, daysAtRisk: number): Promise<void> {
  await this.createNotification({
   user_id: userId,
   tipo: 'streak_warning',
   titulo: 'Sua sequência está em risco!',
   mensagem: `Você tem ${daysAtRisk} dias de sequência em ${streakType}. Não deixe ela quebrar!`,
   prioridade: 'media',
   dados: { streak_type: streakType, days_at_risk: daysAtRisk }
  })
 },

 async sendPainReminder(userId: string): Promise<void> {
  await this.createNotification({
   user_id: userId,
   tipo: 'pain_reminder',
   titulo: 'Como você está se sentindo?',
   mensagem: 'Registre seu nível de dor para acompanhar seu progresso',
   prioridade: 'baixa'
  })
 },

 async sendSocialNotification(userId: string, type: 'like' | 'comment' | 'follow', fromUser: string): Promise<void> {
  const messages = {
   like: `${fromUser} curtiu seu post`,
   comment: `${fromUser} comentou em seu post`,
   follow: `${fromUser} começou a te seguir`
  }

  await this.createNotification({
   user_id: userId,
   tipo: 'social',
   titulo: 'Atividade social',
   mensagem: messages[type],
   prioridade: 'baixa',
   dados: { social_type: type, from_user: fromUser }
  })
 },

 // Obter estatísticas de notificações
 async getNotificationStats() {
  const notifications = await this.getUserNotifications(1000, true)
  
  const typeCount = notifications.reduce((acc, notif) => {
   acc[notif.tipo] = (acc[notif.tipo] || 0) + 1
   return acc
  }, {} as Record<string, number>)

  const readCount = notifications.filter(n => n.lida).length
  const unreadCount = notifications.filter(n => !n.lida).length

  return {
   total: notifications.length,
   read: readCount,
   unread: unreadCount,
   readRate: notifications.length > 0 ? (readCount / notifications.length * 100) : 0,
   byType: typeCount,
   recentUnread: notifications.filter(n => !n.lida).slice(0, 5)
  }
 }
}