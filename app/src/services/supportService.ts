import { supabase } from './supabaseClient'

export interface SupportTicket {
 id: string
 user_id: string
 categoria: 'bug' | 'feature' | 'account' | 'payment' | 'training' | 'technical' | 'other'
 assunto: string
 descricao: string
 prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
 status: 'aberto' | 'em_andamento' | 'aguardando_resposta' | 'resolvido' | 'fechado'
 anexos?: string[]
 resposta_admin?: string
 data_resposta?: string
 admin_id?: string
 rating?: number
 feedback_resolucao?: string
 created_at: string
 updated_at: string
}

export interface FAQ {
 id: string
 categoria: string
 pergunta: string
 resposta: string
 tags: string[]
 ordem: number
 ativo: boolean
 views: number
 helpful_votes: number
 created_at: string
 updated_at: string
}

export const supportService = {
 // Criar novo ticket de suporte
 async createSupportTicket(ticket: {
  categoria: SupportTicket['categoria']
  assunto: string
  descricao: string
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente'
  anexos?: string[]
 }): Promise<SupportTicket> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
   .from('support_tickets')
   .insert([{
    user_id: user.id,
    categoria: ticket.categoria,
    assunto: ticket.assunto,
    descricao: ticket.descricao,
    prioridade: ticket.prioridade || 'media',
    status: 'aberto',
    anexos: ticket.anexos,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
   }])
   .select()
   .single()

  if (error) throw error
  return data
 },

 // Listar tickets do usuário
 async getUserTickets(): Promise<SupportTicket[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
   .from('support_tickets')
   .select('*')
   .eq('user_id', user.id)
   .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
 },

 // Obter ticket específico
 async getTicket(ticketId: string): Promise<SupportTicket | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
   .from('support_tickets')
   .select('*')
   .eq('id', ticketId)
   .eq('user_id', user.id) // Só pode ver seus próprios tickets
   .single()

  if (error) return null
  return data
 },

 // Obter tickets abertos
 async getOpenTickets(): Promise<SupportTicket[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
   .from('support_tickets')
   .select('*')
   .eq('user_id', user.id)
   .in('status', ['aberto', 'em_andamento', 'aguardando_resposta'])
   .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
 },

 // Adicionar comentário ao ticket (usuário respondendo)
 async addTicketComment(ticketId: string, comentario: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Atualizar status para aguardando resposta e adicionar comentário
  const { error } = await supabase
   .from('support_tickets')
   .update({
    descricao: `${comentario}\n\n--- Comentário anterior ---\n`,
    status: 'aguardando_resposta',
    updated_at: new Date().toISOString()
   })
   .eq('id', ticketId)
   .eq('user_id', user.id)

  if (error) throw error
 },

 // Fechar ticket
 async closeTicket(ticketId: string, rating?: number, feedback?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const updates: any = {
   status: 'fechado',
   updated_at: new Date().toISOString()
  }

  if (rating) updates.rating = rating
  if (feedback) updates.feedback_resolucao = feedback

  const { error } = await supabase
   .from('support_tickets')
   .update(updates)
   .eq('id', ticketId)
   .eq('user_id', user.id)

  if (error) throw error
 },

 // Reabrir ticket
 async reopenTicket(ticketId: string, motivo: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase
   .from('support_tickets')
   .update({
    status: 'aberto',
    descricao: `${motivo}\n\n--- Ticket reaberto ---\n`,
    updated_at: new Date().toISOString()
   })
   .eq('id', ticketId)
   .eq('user_id', user.id)

  if (error) throw error
 },

 // Obter estatísticas de suporte do usuário
 async getUserSupportStats() {
  const tickets = await this.getUserTickets()
  
  const statusCount = tickets.reduce((acc, ticket) => {
   acc[ticket.status] = (acc[ticket.status] || 0) + 1
   return acc
  }, {} as Record<string, number>)

  const categoryCount = tickets.reduce((acc, ticket) => {
   acc[ticket.categoria] = (acc[ticket.categoria] || 0) + 1
   return acc
  }, {} as Record<string, number>)

  const resolvedTickets = tickets.filter(t => t.status === 'resolvido' || t.status === 'fechado')
  const ratedTickets = resolvedTickets.filter(t => t.rating)
  const averageRating = ratedTickets.length > 0 
   ? ratedTickets.reduce((sum, t) => sum + (t.rating || 0), 0) / ratedTickets.length
   : 0

  return {
   total: tickets.length,
   byStatus: statusCount,
   byCategory: categoryCount,
   resolved: resolvedTickets.length,
   averageRating: Math.round(averageRating * 10) / 10,
   responseTime: this.calculateAverageResponseTime(tickets),
   openTickets: tickets.filter(t => ['aberto', 'em_andamento', 'aguardando_resposta'].includes(t.status)).length
  }
 },

 calculateAverageResponseTime(tickets: SupportTicket[]): number {
  const respondedTickets = tickets.filter(t => t.data_resposta)
  if (respondedTickets.length === 0) return 0

  const totalHours = respondedTickets.reduce((sum, ticket) => {
   const created = new Date(ticket.created_at)
   const responded = new Date(ticket.data_resposta!)
   const hours = (responded.getTime() - created.getTime()) / (1000 * 60 * 60)
   return sum + hours
  }, 0)

  return Math.round(totalHours / respondedTickets.length)
 },

 // Sistema de FAQ (simulado - precisa de tabela dedicada)
 async getFAQs(categoria?: string): Promise<FAQ[]> {
  // Mock data - em produção viria de uma tabela dedicada
  const mockFAQs: FAQ[] = [
   {
    id: '1',
    categoria: 'account',
    pergunta: 'Como altero minha senha?',
    resposta: 'Vá em Configurações > Conta > Alterar Senha. Digite sua senha atual e a nova senha.',
    tags: ['senha', 'conta', 'segurança'],
    ordem: 1,
    ativo: true,
    views: 150,
    helpful_votes: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
   },
   {
    id: '2',
    categoria: 'training',
    pergunta: 'Como criar um treino personalizado?',
    resposta: 'Na aba Treinos, toque em "Criar Treino" e selecione os exercícios desejados. Você pode ajustar séries, repetições e descanso.',
    tags: ['treino', 'personalizado', 'exercício'],
    ordem: 2,
    ativo: true,
    views: 89,
    helpful_votes: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
   },
   {
    id: '3',
    categoria: 'technical',
    pergunta: 'O app está lento, o que fazer?',
    resposta: 'Tente fechar outros apps, reiniciar o dispositivo ou verificar sua conexão com a internet. Se persistir, entre em contato conosco.',
    tags: ['performance', 'lento', 'técnico'],
    ordem: 3,
    ativo: true,
    views: 67,
    helpful_votes: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
   }
  ]

  return categoria 
   ? mockFAQs.filter(faq => faq.categoria === categoria)
   : mockFAQs
 },

 async searchFAQs(searchTerm: string): Promise<FAQ[]> {
  const faqs = await this.getFAQs()
  const term = searchTerm.toLowerCase()
  
  return faqs.filter(faq => 
   faq.pergunta.toLowerCase().includes(term) ||
   faq.resposta.toLowerCase().includes(term) ||
   faq.tags.some(tag => tag.toLowerCase().includes(term))
  )
 },

 // Marcar FAQ como útil
 async markFAQHelpful(faqId: string): Promise<void> {
  // TODO: Implementar quando houver tabela de FAQ
  console.log(`FAQ ${faqId} marked as helpful`)
 },

 // Templates de tickets comuns
 getTicketTemplates(): Array<{title: string, category: SupportTicket['categoria'], description: string}> {
  return [
   {
    title: 'Reportar Bug',
    category: 'bug',
    description: 'Descreva o problema:\n\n1. O que você estava fazendo?\n2. O que esperava que acontecesse?\n3. O que realmente aconteceu?\n4. Como reproduzir o problema?\n\nDispositivo: \nVersão do app: '
   },
   {
    title: 'Sugerir Funcionalidade',
    category: 'feature',
    description: 'Descreva a funcionalidade que gostaria de ver no app:\n\n1. Qual funcionalidade?\n2. Como ela te ajudaria?\n3. Em que situação você usaria?\n\nDetalhes adicionais:'
   },
   {
    title: 'Problema com Treino',
    category: 'training',
    description: 'Descreva o problema com o treino:\n\n1. Qual exercício/treino?\n2. Qual o problema específico?\n3. Quando acontece?\n\nDetalhes:'
   },
   {
    title: 'Problema Técnico',
    category: 'technical',
    description: 'Descreva o problema técnico:\n\n1. O que não está funcionando?\n2. Quando começou?\n3. Mensagens de erro?\n\nDispositivo: \nSistema operacional: '
   }
  ]
 }
}