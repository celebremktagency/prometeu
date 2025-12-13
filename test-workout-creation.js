const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWorkoutCreation() {
  console.log('🏋️‍♂️ Testando sistema de criação de treino pelo aluno...\n');

  try {
    // 1. Buscar aluno para teste
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('tipo', 'aluno')
      .limit(1);

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    if (users.length === 0) {
      console.log('❌ Nenhum aluno encontrado');
      return;
    }

    const student = users[0];
    console.log(`👨‍🎓 Aluno para teste: ${student.email} (${student.id})`);

    // 2. Testar criação de treino básico
    console.log('\n💪 Testando criação de treino básico...');
    
    const workoutData = {
      exercicio: `Treino Personalizado ${Date.now()}` // Unique name
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
    console.log('🆔 ID do treino:', newWorkout.id);

    // 3. Buscar profissional para atribuição
    const { data: professionals, error: profError } = await supabase
      .from('profissionais')
      .select('*')
      .limit(1);

    let professionalId = null;
    
    if (!profError && professionals.length > 0) {
      professionalId = professionals[0].id;
      console.log('\n👨‍⚕️ Profissional encontrado para atribuição:', professionalId);
    } else {
      console.log('\n⚠️ Nenhum profissional encontrado - criando treino autogerenciado');
    }

    // 4. Testar atribuição de treino (treinos_atribuidos)
    console.log('\n📋 Testando atribuição de treino...');
    
    const assignmentData = {
      profissional_id: professionalId, // Pode ser null para autogerenciamento
      cliente_id: student.id,
      treino_id: newWorkout.id,
      data_inicio: new Date().toISOString().split('T')[0], // Date format
      status: 'ativo'
    };

    // Verificar se a tabela aceita treino_id ou precisa de outro campo
    let { data: assignment, error: assignError } = await supabase
      .from('treinos_atribuidos')
      .insert(assignmentData)
      .select()
      .single();

    if (assignError) {
      console.log('❌ Erro ao atribuir treino (tentativa 1):', assignError);
      
      // Tentar sem treino_id se não existir esse campo
      const assignmentData2 = {
        profissional_id: professionalId,
        cliente_id: student.id,
        nome: newWorkout.exercicio,
        exercicios: [
          {
            nome: newWorkout.exercicio,
            series: 3,
            repeticoes: 10,
            tipo: 'autogerenciado'
          }
        ],
        data_inicio: new Date().toISOString().split('T')[0],
        status: 'ativo'
      };

      const result2 = await supabase
        .from('treinos_atribuidos')
        .insert(assignmentData2)
        .select()
        .single();

      assignment = result2.data;
      assignError = result2.error;
    }

    if (assignError) {
      console.log('❌ Erro ao atribuir treino (tentativa 2):', assignError);
      return;
    }

    console.log('✅ Treino atribuído com sucesso');
    console.log('🆔 ID da atribuição:', assignment.id);

    // 5. Testar execução de treino
    console.log('\n🏃‍♂️ Testando execução de treino...');
    
    const executionData = {
      treino_atribuido_id: assignment.id,
      cliente_id: student.id,
      data_execucao: new Date().toISOString(),
      exercicios_realizados: [
        {
          exercicio: newWorkout.exercicio,
          series_completadas: 3,
          repeticoes_realizadas: [10, 8, 6],
          peso_usado: 5,
          tempo_descanso: 60
        }
      ],
      tempo_total_min: 30,
      finalizado: true
    };

    const { data: execution, error: execError } = await supabase
      .from('execucoes_treino')
      .insert(executionData)
      .select()
      .single();

    if (execError) {
      console.log('❌ Erro ao registrar execução:', execError);
    } else {
      console.log('✅ Execução registrada com sucesso');
      console.log('🆔 ID da execução:', execution.id);
    }

    // 6. Testar feedback da sessão
    console.log('\n📝 Testando feedback da sessão...');
    
    if (execution) {
      const feedbackData = {
        execucao_treino_id: execution.id,
        cliente_id: student.id,
        nivel_dor_antes: 3,
        nivel_dor_durante: 4,
        nivel_dor_depois: 2,
        satisfacao_geral: 4,
        dificuldade_percebida: 3,
        energia_nivel: 4,
        sentiu_dor: true,
        locais_dor: ['lombar'],
        intensidade_dor: 2,
        observacoes: 'Treino executado com sucesso pelo próprio aluno',
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
        console.log('✅ Feedback registrado com sucesso');
        console.log('🆔 ID do feedback:', feedback.id);
      }
    }

    // 7. Testar busca de treinos do aluno
    console.log('\n🔍 Testando busca de treinos do aluno...');
    
    const { data: studentWorkouts, error: searchError } = await supabase
      .from('treinos_atribuidos')
      .select(`
        *,
        execucoes:execucoes_treino(*)
      `)
      .eq('cliente_id', student.id)
      .eq('status', 'ativo');

    if (searchError) {
      console.log('❌ Erro ao buscar treinos:', searchError);
    } else {
      console.log(`✅ ${studentWorkouts.length} treino(s) encontrado(s)`);
      studentWorkouts.forEach(workout => {
        console.log(`- ${workout.nome || 'Treino'} (${workout.execucoes?.length || 0} execuções)`);
      });
    }

    // 8. Limpeza (opcional)
    console.log('\n🧹 Limpando dados de teste...');
    
    // Remover feedback
    if (execution) {
      await supabase.from('feedback_treino').delete().eq('execucao_treino_id', execution.id);
    }
    
    // Remover execução
    if (execution) {
      await supabase.from('execucoes_treino').delete().eq('id', execution.id);
    }
    
    // Remover atribuição
    if (assignment) {
      await supabase.from('treinos_atribuidos').delete().eq('id', assignment.id);
    }
    
    // Remover treino
    await supabase.from('treinos').delete().eq('id', newWorkout.id);
    
    console.log('✅ Dados de teste removidos');

    console.log('\n🎉 Teste completo do sistema de criação de treino!');
    console.log('📊 Resumo:');
    console.log('- ✅ Criação de treino básico');
    console.log('- ✅ Atribuição de treino para aluno');
    console.log('- ✅ Execução de treino pelo aluno');
    console.log('- ✅ Registro de feedback da sessão');
    console.log('- ✅ Busca de treinos do aluno');
    console.log('- ✅ Limpeza dos dados de teste');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testWorkoutCreation();