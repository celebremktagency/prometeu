import { supabase } from './supabaseClient'

export const treinoService = {
 async criarTreino(exercicio: string, descricao?: string): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
   .from('treinos')
   .insert([
    {
     nome: exercicio,
     descricao: descricao,
     objetivo: 'Treino personalizado',
     duracao_estimada: 30,
     nivel: 'iniciante',
     is_publico: false,
     criado_por: user.id,
     tags: ['personalizado']
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

  // Buscar todos os treinos disponíveis da nova estrutura
  const { data, error } = await supabase
   .from('treinos')
   .select('*')
   .order('created_at', { ascending: false })

  if (error) {
   console.error('Erro ao buscar treinos:', error)
   throw error
  }
  
  console.log('Treinos carregados:', data)
  return data || []
 },

 async listarExecucoesTreino(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Primeiro tentar buscar da tabela treinos_executados (nova estrutura)
  const { data: treinosExecutados, error: execError } = await supabase
   .from('treinos_executados')
   .select(`
    *,
    treino:treinos(nome, objetivo, duracao_estimada)
   `)
   .eq('usuario_id', user.id)
   .order('data_execucao', { ascending: false })

  if (!execError && treinosExecutados && treinosExecutados.length > 0) {
   console.log('Execuções da nova estrutura carregadas:', treinosExecutados)
   return treinosExecutados.map(exec => ({
    ...exec,
    exercicio: exec.treino?.nome || 'Treino',
    descricao: exec.treino?.objetivo || '',
    duracao_min: exec.treino?.duracao_estimada || exec.duracao_minutos || 30,
    data_execucao: exec.data_execucao,
    finalizado: exec.status === 'concluido',
    tempo_total_min: exec.duracao_minutos || 30
   }))
  }

  // Se não encontrar, tentar buscar da tabela execucoes_treino (estrutura antiga)
  const { data: execucoesAntigas, error: execAntigasError } = await supabase
   .from('execucoes_treino')
   .select(`
    *,
    treino:treinos(*)
   `)
   .eq('cliente_id', user.id)
   .order('data_execucao', { ascending: false })

  if (!execAntigasError && execucoesAntigas && execucoesAntigas.length > 0) {
   console.log('Execuções da estrutura antiga carregadas:', execucoesAntigas)
   return execucoesAntigas
  }

  // Como último recurso, usar treinos como execuções
  console.log('Usando treinos como execuções (fallback)')
  return this.listarTreinosComoExecucoes()
 },

 async listarTreinosComoExecucoes(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Como fallback, buscar treinos e simular como execuções
  const { data, error } = await supabase
   .from('treinos')
   .select('*')
   .or(`criado_por.eq.${user.id},is_publico.eq.true`)
   .order('created_at', { ascending: false })

  if (error) {
   console.error('Erro ao buscar treinos fallback:', error)
   throw error
  }
  
  // Transformar treinos em formato de execução para compatibilidade
  const execucoesSimuladas = (data || []).map(treino => ({
   ...treino,
   cliente_id: user.id,
   data_execucao: treino.created_at,
   finalizado: false, // Por serem treinos, não execuções
   tempo_total_min: treino.duracao_estimada || 30,
   exercicio: treino.nome,
   descricao: treino.descricao
  }))
  
  console.log('Treinos como execuções (fallback):', execucoesSimuladas)
  return execucoesSimuladas
 },

 async criarExecucoesDemoParaTeste(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  console.log('Criando execuções demo para testar calendário e métricas...')
  
  const exerciciosDemo = [
    { nome: 'Flexão de braço', duracao: 20 },
    { nome: 'Agachamento', duracao: 25 },
    { nome: 'Prancha', duracao: 15 },
    { nome: 'Burpee', duracao: 30 },
    { nome: 'Abdominais', duracao: 20 }
  ]

  // Criar execuções dos últimos 7 dias
  for (let i = 0; i < 7; i++) {
    const data = new Date()
    data.setDate(data.getDate() - i)
    
    const exercicio = exerciciosDemo[i % exerciciosDemo.length]
    
    try {
      // Tentar criar na tabela treinos_executados primeiro
      const { error: novaError } = await supabase
        .from('treinos_executados')
        .insert({
          usuario_id: user.id,
          data_execucao: data.toISOString(),
          status: 'concluido',
          duracao_minutos: exercicio.duracao,
          feedback: `Demo: ${exercicio.nome} concluído`,
          avaliacao: Math.floor(Math.random() * 3) + 3 // 3-5 estrelas
        })

      if (novaError) {
        console.log('Tabela treinos_executados não existe, tentando treinos...')
        // Se falhar, criar na tabela treinos com nova estrutura
        await supabase
          .from('treinos')
          .insert({
            nome: exercicio.nome,
            descricao: `Demo: Treino concluído`,
            objetivo: 'Demo',
            duracao_estimada: exercicio.duracao,
            nivel: 'iniciante',
            is_publico: false,
            criado_por: user.id,
            tags: ['demo']
          })
      }

      console.log(`✅ Execução demo criada: ${exercicio.nome} em ${data.toLocaleDateString()}`)
    } catch (error) {
      console.error(`❌ Erro ao criar execução demo para ${exercicio.nome}:`, error)
    }
  }

  console.log('🎉 Execuções demo criadas! Recarregue o app para ver os dados.')
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
   .from('exercicios')
   .select('*')
   .eq('is_publico', true)
   .order('nome')

  if (error) {
   console.error('Erro ao buscar exercícios:', error)
   throw error
  }
  
  console.log('Exercícios carregados:', data)
  return data || []
 },

 async listarWorkoutTemplates(): Promise<any[]> {
  // Por enquanto retorna os treinos como templates
  const { data, error } = await supabase
   .from('treinos')
   .select('*')
   .eq('is_publico', true)
   .order('nome')

  if (error) {
   console.error('Erro ao buscar templates:', error)
   throw error
  }
  
  console.log('Templates carregados:', data)
  return data || []
 }
}