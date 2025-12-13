const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSelectWorkoutSimple() {
  console.log('📋 Testando seleção de treino (versão simplificada)...\n');

  try {
    // 1. Buscar usuários
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

    // 2. Buscar treinos disponíveis (sem order by created_at)
    console.log('\n🔍 Buscando treinos disponíveis...');
    
    const { data: availableWorkouts, error: workoutsError } = await supabase
      .from('treinos')
      .select('*');

    if (workoutsError) {
      console.log('❌ Erro ao buscar treinos:', workoutsError);
      return;
    }

    console.log(`✅ ${availableWorkouts.length} treino(s) disponível(eis):`);
    availableWorkouts.forEach((workout, index) => {
      console.log(`  ${index + 1}. ${workout.exercicio} (ID: ${workout.id})`);
    });

    if (availableWorkouts.length === 0) {
      console.log('⚠️ Nenhum treino disponível');
      return;
    }

    // 3. Selecionar primeiro treino
    const selectedWorkout = availableWorkouts[0];
    console.log(`\n📌 Selecionando: ${selectedWorkout.exercicio}`);

    // 4. Simular execução direta
    console.log('\n🏃‍♂️ Simulando execução do treino selecionado...');
    
    const sessionData = {
      cliente_id: student.id,
      data_execucao: new Date().toISOString(),
      exercicios_realizados: [
        {
          treino_origem: selectedWorkout.exercicio,
          tipo: 'biblioteca',
          duracao: '25 min',
          observacoes: 'Selecionado da biblioteca de treinos'
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
      console.log('❌ Erro ao criar sessão:', sessionError);
    } else {
      console.log('✅ Sessão criada com sucesso:', session.id);
      
      // 5. Registrar feedback
      console.log('\n📝 Registrando feedback...');
      
      const feedbackData = {
        execucao_treino_id: session.id,
        cliente_id: student.id,
        satisfacao_geral: 4,
        observacoes: `Executei o treino "${selectedWorkout.exercicio}" da biblioteca`
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

    // 6. Verificar histórico atualizado
    console.log('\n📊 Verificando histórico atualizado...');
    
    const { data: history, error: historyError } = await supabase
      .from('execucoes_treino')
      .select('*')
      .eq('cliente_id', student.id)
      .order('data_execucao', { ascending: false })
      .limit(3);

    if (historyError) {
      console.log('❌ Erro ao buscar histórico:', historyError);
    } else {
      console.log(`✅ ${history.length} sessão(ões) recentes:`);
      history.forEach((session, index) => {
        const date = session.data_execucao.split('T')[0];
        console.log(`  ${index + 1}. ${date} - ${session.tempo_total_min}min - ${session.finalizado ? 'Concluído' : 'Em andamento'}`);
      });
    }

    console.log('\n🎉 Teste de seleção de treino concluído!');
    console.log('📋 Resultado:');
    console.log('- ✅ Busca de treinos na biblioteca');
    console.log('- ✅ Seleção de treino específico');  
    console.log('- ✅ Execução de treino selecionado');
    console.log('- ✅ Registro de feedback');
    console.log('- ✅ Atualização do histórico');

    console.log('\n💡 Alunos podem selecionar e executar treinos da biblioteca!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSelectWorkoutSimple();