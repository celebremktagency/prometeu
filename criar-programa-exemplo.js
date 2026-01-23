// Exemplo: Criar programa "7 Dias de Barriga Tanquinho"
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://jndkdbetebrlijohtuoz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZGtkYmV0ZWJybGlqb2h0dW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDYxODIsImV4cCI6MjA4MzgyMjE4Mn0.qBz0GVDtGqSIgouXQW5EdCxPevekPPY7cq4gV-3k6NA'
)

async function criarPrograma7Dias() {
  console.log('🏋️ Criando programa: 7 Dias de Barriga Tanquinho\n')
  
  // 1. Criar exercícios específicos para core
  const exercicios = [
    {
      nome: 'Prancha Isométrica',
      descricao: 'Exercício isométrico para fortalecer todo o core',
      grupo_muscular: ['core', 'ombros'],
      equipamento: 'peso corporal',
      dificuldade: 'iniciante'
    },
    {
      nome: 'Bicycle Crunch',
      descricao: 'Movimento alternado que trabalha oblíquos',
      grupo_muscular: ['core', 'oblíquos'],
      equipamento: 'peso corporal', 
      dificuldade: 'intermediario'
    },
    {
      nome: 'Mountain Climbers',
      descricao: 'Exercício dinâmico que combina core e cardio',
      grupo_muscular: ['core', 'cardio'],
      equipamento: 'peso corporal',
      dificuldade: 'intermediario'
    }
  ]
  
  console.log('📝 1. Criando exercícios...')
  const exercicioIds = []
  for (const ex of exercicios) {
    const { data, error } = await supabase
      .from('exercicios')
      .insert(ex)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar exercício:', error)
      continue
    }
    exercicioIds.push(data.id)
    console.log(`✅ ${ex.nome} criado`)
  }
  
  // 2. Criar treinos para cada dia
  const treinos = [
    { nome: 'Dia 1 - Ativação Core', objetivo: 'Ativação', duracao_estimada: 15 },
    { nome: 'Dia 2 - Core Básico', objetivo: 'Fortalecimento', duracao_estimada: 20 },
    { nome: 'Dia 3 - Cardio Core', objetivo: 'Queima', duracao_estimada: 25 },
    { nome: 'Dia 4 - Resistência', objetivo: 'Resistência', duracao_estimada: 20 },
    { nome: 'Dia 5 - Core Intenso', objetivo: 'Intensificação', duracao_estimada: 30 },
    { nome: 'Dia 6 - Definição', objetivo: 'Definição', duracao_estimada: 25 },
    { nome: 'Dia 7 - Finalização', objetivo: 'Consolidação', duracao_estimada: 20 }
  ]
  
  console.log('\n🏃 2. Criando treinos diários...')
  const treinoIds = []
  for (const treino of treinos) {
    const { data, error } = await supabase
      .from('treinos')
      .insert({
        ...treino,
        nivel: 'intermediario',
        is_publico: true,
        tags: ['core', 'barriga tanquinho', '7 dias']
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar treino:', error)
      continue
    }
    treinoIds.push(data.id)
    console.log(`✅ ${treino.nome} criado`)
  }
  
  // 3. Adicionar exercícios aos treinos
  console.log('\n💪 3. Adicionando exercícios aos treinos...')
  for (let i = 0; i < treinoIds.length; i++) {
    const treinoId = treinoIds[i]
    
    // Cada treino terá os 3 exercícios com intensidade crescente
    const intensidade = Math.floor(i / 2) + 1 // 1, 1, 2, 2, 3, 3, 3
    
    for (let j = 0; j < exercicioIds.length; j++) {
      const exercicioId = exercicioIds[j]
      
      const { error } = await supabase
        .from('treino_exercicios')
        .insert({
          treino_id: treinoId,
          exercicio_id: exercicioId,
          ordem: j + 1,
          series: 2 + intensidade, // 3-5 séries
          repeticoes: `${10 + (intensidade * 5)}-${20 + (intensidade * 5)}`, // 10-20 a 20-35
          tempo_descanso: '45s',
          observacoes: `Dia ${i + 1} - Intensidade ${intensidade}`
        })
      
      if (error) console.error('Erro ao adicionar exercício:', error)
    }
    console.log(`✅ Exercícios adicionados ao ${treinos[i].nome}`)
  }
  
  // 4. Criar o programa
  console.log('\n🎯 4. Criando programa principal...')
  const { data: programa, error: programaError } = await supabase
    .from('programas')
    .insert({
      nome: '7 Dias de Barriga Tanquinho',
      descricao: 'Programa intensivo de 7 dias focado no desenvolvimento e definição do core. Exercícios progressivos que vão ativar, fortalecer e definir sua barriga.',
      objetivo: 'Definição do Core',
      duracao_semanas: 1,
      frequencia_semanal: 7,
      nivel: 'intermediario',
      categoria: 'Core/Abdômen',
      is_publico: true,
      tags: ['barriga tanquinho', '7 dias', 'core', 'definição', 'desafio']
    })
    .select()
    .single()
  
  if (programaError) {
    console.error('Erro ao criar programa:', programaError)
    return
  }
  
  console.log('✅ Programa criado:', programa.nome)
  
  // 5. Agendar treinos nos dias da semana
  console.log('\n📅 5. Agendando treinos para cada dia...')
  for (let i = 0; i < treinoIds.length; i++) {
    const dia = i + 1 // Dia 1 a 7 da semana
    
    const { error } = await supabase
      .from('programa_treinos')
      .insert({
        programa_id: programa.id,
        treino_id: treinoIds[i],
        dia_semana: dia,
        semana: 1,
        ordem: 1,
        observacoes: `Dia ${dia} do desafio - ${treinos[i].objetivo}`
      })
    
    if (error) {
      console.error('Erro ao agendar treino:', error)
      continue
    }
    
    console.log(`✅ ${treinos[i].nome} agendado para dia ${dia}`)
  }
  
  console.log('\n🎉 PROGRAMA CRIADO COM SUCESSO!')
  console.log(`ID do programa: ${programa.id}`)
  console.log('Estrutura completa:')
  console.log('• Exercícios: 3 específicos para core')
  console.log('• Treinos: 7 treinos diários progressivos') 
  console.log('• Programa: 1 semana de desafio intensivo')
  console.log('• Cronograma: 1 treino por dia durante 7 dias')
  
  return programa.id
}

criarPrograma7Dias().catch(console.error)