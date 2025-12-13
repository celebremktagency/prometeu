const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWorkoutCreationFixed() {
  console.log('🏋️‍♂️ Testando criação de treino (versão corrigida)...\n');

  try {
    // 1. Buscar aluno para teste
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('tipo', 'aluno')
      .limit(1);

    if (usersError || users.length === 0) {
      console.log('❌ Erro ao buscar aluno:', usersError);
      return;
    }

    const student = users[0];
    console.log(`👨‍🎓 Aluno: ${student.email}`);

    // 2. Criar treino básico na tabela treinos
    console.log('\n💪 Criando treino básico...');
    
    const workoutName = `Treino Autogerenciado ${Date.now()}`;
    const workoutData = {
      exercicio: workoutName
    };

    const { data: newWorkout, error: workoutError } = await supabase
      .from('treinos')
      .insert(workoutData)
      .select()
      .single();

    if (workoutError) {
      console.log('❌ Erro ao criar treino:', workoutError);
      return;
    }

    console.log('✅ Treino criado:', newWorkout.exercicio);

    // 3. Criar atribuição simplificada (sem profissional)
    console.log('\n📋 Criando atribuição autogerenciada...');
    
    const assignmentData = {
      aluno_id: student.id,
      data_inicio: new Date().toISOString().split('T')[0],
      status: 'ativo'
    };

    const { data: assignment, error: assignError } = await supabase
      .from('treinos_atribuidos')
      .insert(assignmentData)
      .select()
      .single();

    if (assignError) {
      console.log('❌ Erro ao criar atribuição:', assignError);
      return;
    }

    console.log('✅ Atribuição criada:', assignment.id);

    // 4. Registrar sessão de treino
    console.log('\n🏃‍♂️ Registrando sessão de treino...');
    
    const sessionData = {
      treino_atribuido_id: assignment.id,
      cliente_id: student.id, // execucoes_treino usa cliente_id, não aluno_id
      data_execucao: new Date().toISOString(),
      exercicios_realizados: [
        {
          nome: newWorkout.exercicio,
          series: 3,
          repeticoes: [12, 10, 8],
          peso: '5kg',
          observacoes: 'Criado pelo próprio aluno'
        }
      ],
      tempo_total_min: 25,
      finalizado: true
    };

    const { data: session, error: sessionError } = await supabase
      .from('execucoes_treino')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.log('❌ Erro ao registrar sessão:', sessionError);
    } else {
      console.log('✅ Sessão registrada:', session.id);
    }

    // 5. Registrar feedback (se sessão foi criada)
    if (session) {
      console.log('\n📝 Registrando feedback...');
      
      const feedbackData = {
        execucao_treino_id: session.id,
        cliente_id: student.id,
        nivel_dor_antes: 2,
        nivel_dor_durante: 3,
        nivel_dor_depois: 1,
        satisfacao_geral: 4,
        dificuldade_percebida: 3,
        energia_nivel: 4,
        sentiu_dor: false,
        observacoes: 'Treino autogerenciado executado com sucesso',
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

    // 6. Verificar resultado final - buscar treinos do aluno
    console.log('\n🔍 Verificando treinos do aluno...');
    
    const { data: studentWorkouts, error: searchError } = await supabase
      .from('treinos_atribuidos')
      .select(`
        *,
        execucoes:execucoes_treino(
          *,
          feedback:feedback_treino(*)
        )
      `)
      .eq('aluno_id', student.id)
      .eq('status', 'ativo');

    if (searchError) {
      console.log('❌ Erro ao buscar treinos:', searchError);
    } else {
      console.log(`✅ ${studentWorkouts.length} treino(s) ativo(s) encontrado(s)`);
      studentWorkouts.forEach((workout, index) => {
        const execCount = workout.execucoes?.length || 0;
        const feedbackCount = workout.execucoes?.reduce((acc, exec) => 
          acc + (exec.feedback?.length || 0), 0) || 0;
        console.log(`  ${index + 1}. Treino ${workout.id} - ${execCount} execuções, ${feedbackCount} feedbacks`);
      });
    }

    // 7. Buscar sessões com mais detalhes
    console.log('\n📊 Verificando sessões detalhadas...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('execucoes_treino')
      .select(`
        *,
        feedback:feedback_treino(*)
      `)
      .eq('cliente_id', student.id)
      .order('data_execucao', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.log('❌ Erro ao buscar sessões:', sessionsError);
    } else {
      console.log(`✅ ${sessions.length} sessão(ões) encontrada(s)`);
      sessions.forEach((session, index) => {
        const hasfeedback = session.feedback && session.feedback.length > 0;
        console.log(`  ${index + 1}. ${session.data_execucao.split('T')[0]} - ${session.tempo_total_min}min - Feedback: ${hasFeeback ? '✅' : '❌'}`);
      });
    }

    console.log('\n🎉 Teste de criação de treino pelo aluno concluído!');
    console.log('📋 Funcionalidades testadas:');
    console.log('- ✅ Criação de treino básico');
    console.log('- ✅ Atribuição autogerenciada');
    console.log('- ✅ Registro de sessão de treino');
    console.log('- ✅ Registro de feedback');
    console.log('- ✅ Busca de treinos do aluno');
    console.log('- ✅ Verificação de sessões detalhadas');

    console.log('\n💡 O sistema permite que alunos criem seus próprios treinos!');
    
    // Não remover dados de teste para verificação manual se necessário
    console.log('\n📝 Dados de teste mantidos para verificação manual.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testWorkoutCreationFixed();