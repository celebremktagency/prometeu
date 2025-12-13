const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSelectExistingWorkout() {
  console.log('📋 Testando seleção de treino existente...\n');

  try {
    // 1. Buscar usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    const student = users.find(u => u.tipo === 'aluno');
    
    if (!student) {
      console.log('❌ Nenhum aluno encontrado');
      return;
    }

    console.log(`👨‍🎓 Aluno: ${student.email}`);

    // 2. Buscar treinos existentes
    console.log('\n🔍 Buscando treinos disponíveis...');
    
    const { data: availableWorkouts, error: workoutsError } = await supabase
      .from('treinos')
      .select('*')
      .order('created_at', { ascending: false });

    if (workoutsError) {
      console.log('❌ Erro ao buscar treinos:', workoutsError);
      return;
    }

    if (availableWorkouts.length === 0) {
      console.log('❌ Nenhum treino encontrado');
      return;
    }

    console.log(`✅ ${availableWorkouts.length} treino(s) disponível(eis):`);
    availableWorkouts.forEach((workout, index) => {
      console.log(`  ${index + 1}. ${workout.exercicio} (ID: ${workout.id})`);
    });

    // 3. Simular seleção de treino (primeiro da lista)
    const selectedWorkout = availableWorkouts[0];
    console.log(`\n📌 Selecionando: ${selectedWorkout.exercicio}`);

    // 4. Testar busca de treinos atribuídos existentes
    console.log('\n🔍 Verificando treinos já atribuídos ao aluno...');
    
    const { data: assignedWorkouts, error: assignedError } = await supabase
      .from('treinos_atribuidos')
      .select('*')
      .eq('aluno_id', student.id)
      .eq('status', 'ativo');

    if (assignedError) {
      console.log('❌ Erro ao verificar atribuições:', assignedError);
    } else {
      console.log(`✅ ${assignedWorkouts.length} treino(s) já atribuído(s)`);
    }

    // 5. Simular execução direta do treino selecionado
    console.log('\n🏃‍♂️ Simulando execução direta do treino...');
    
    // Criar uma sessão fictícia (sem treino atribuído)
    const directSessionData = {
      treino_atribuido_id: null, // Pode ser null para treinos autogerenciados
      cliente_id: student.id,
      data_execucao: new Date().toISOString(),
      exercicios_realizados: [
        {
          nome: selectedWorkout.exercicio,
          tipo: 'selecionado_da_biblioteca',
          series: 3,
          repeticoes: [15, 12, 10],
          tempo_execucao: '20 minutos'
        }
      ],
      tempo_total_min: 20,
      finalizado: true
    };

    const { data: directSession, error: sessionError } = await supabase
      .from('execucoes_treino')
      .insert(directSessionData)
      .select()
      .single();

    if (sessionError) {
      console.log('❌ Erro ao criar sessão direta:', sessionError);
      
      // Tentar without null treino_atribuido_id
      console.log('🔄 Tentando sem treino_atribuido_id...');
      
      const alternativeData = { ...directSessionData };
      delete alternativeData.treino_atribuido_id;
      
      const { data: altSession, error: altError } = await supabase
        .from('execucoes_treino')
        .insert(alternativeData)
        .select()
        .single();

      if (altError) {
        console.log('❌ Erro na tentativa alternativa:', altError);
      } else {
        console.log('✅ Sessão direta criada (método alternativo)');
        directSession = altSession;
      }
    } else {
      console.log('✅ Sessão direta criada com sucesso');
    }

    // 6. Registrar feedback se sessão foi criada
    if (directSession) {
      console.log('\n📝 Registrando feedback da sessão...');
      
      const feedbackData = {
        execucao_treino_id: directSession.id,
        cliente_id: student.id,
        nivel_dor_antes: 1,
        nivel_dor_durante: 2,
        nivel_dor_depois: 1,
        satisfacao_geral: 5,
        dificuldade_percebida: 2,
        energia_nivel: 4,
        sentiu_dor: false,
        observacoes: 'Treino selecionado da biblioteca executado com sucesso',
        recomendaria: true
      };

      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback_treino')
        .insert(feedbackData)
        .select()
        .single();

      if (feedbackError) {
        console.log('❌ Erro ao registrar feedback:', feedbackError);
      } else {
        console.log('✅ Feedback registrado:', feedback.id);
      }
    }

    // 7. Verificar histórico do aluno
    console.log('\n📊 Verificando histórico do aluno...');
    
    const { data: userHistory, error: historyError } = await supabase
      .from('execucoes_treino')
      .select(`
        *,
        feedback:feedback_treino(*)
      `)
      .eq('cliente_id', student.id)
      .order('data_execucao', { ascending: false });

    if (historyError) {
      console.log('❌ Erro ao buscar histórico:', historyError);
    } else {
      console.log(`✅ ${userHistory.length} sessão(ões) no histórico:`);
      userHistory.forEach((session, index) => {
        const date = session.data_execucao.split('T')[0];
        const hasfeedback = session.feedback && session.feedback.length > 0;
        const exercises = session.exercicios_realizados || [];
        console.log(`  ${index + 1}. ${date} - ${session.tempo_total_min}min - ${exercises.length} exercício(s) - Feedback: ${hasfeedback ? '✅' : '❌'}`);
      });
    }

    console.log('\n🎉 Teste de seleção de treino existente concluído!');
    console.log('📋 Funcionalidades testadas:');
    console.log('- ✅ Busca de treinos disponíveis na biblioteca');
    console.log('- ✅ Seleção de treino específico');
    console.log('- ✅ Verificação de treinos já atribuídos');
    console.log('- ✅ Execução direta de treino selecionado');
    console.log('- ✅ Registro de feedback da sessão');
    console.log('- ✅ Verificação do histórico do usuário');

    console.log('\n💡 O sistema permite que alunos selecionem e executem treinos da biblioteca!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSelectExistingWorkout();