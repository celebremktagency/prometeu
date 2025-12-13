const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealData() {
  console.log('🧪 Testando dados reais do app...\n');

  try {
    // Buscar usuários
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('tipo', 'aluno')
      .limit(1);

    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário aluno encontrado');
      return;
    }

    const user = users[0];
    console.log(`👤 Testando com usuário: ${user.email}\n`);

    // 1. Testar user_profiles
    console.log('📋 1. Testando user_profiles...');
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('meta_semanal')
      .eq('id', user.id)
      .maybeSingle();

    console.log('Meta semanal:', profile?.meta_semanal || 'Não definida');

    // 2. Testar execucoes_treino
    console.log('\n💪 2. Testando execucoes_treino...');
    const { data: workouts, error: workoutError } = await supabase
      .from('execucoes_treino')
      .select('tempo_total_min, data_execucao, finalizado')
      .eq('cliente_id', user.id);

    if (workoutError) {
      console.log('❌ Erro:', workoutError.message);
    } else {
      console.log(`Encontradas ${workouts?.length || 0} execuções de treino`);
      if (workouts?.length > 0) {
        const totalMinutes = workouts.reduce((sum, w) => sum + (w.tempo_total_min || 0), 0);
        console.log(`Total de minutos: ${totalMinutes}`);
      }
    }

    // 3. Testar registros_dor
    console.log('\n🩹 3. Testando registros_dor...');
    const { data: painRecords, error: painError } = await supabase
      .from('registros_dor')
      .select('nivel_dor, data_registro, localizacao')
      .eq('aluno_id', user.id);

    if (painError) {
      console.log('❌ Erro:', painError.message);
    } else {
      console.log(`Encontrados ${painRecords?.length || 0} registros de dor`);
      if (painRecords?.length > 0) {
        const avgPain = painRecords.reduce((sum, r) => sum + r.nivel_dor, 0) / painRecords.length;
        console.log(`Nível médio de dor: ${avgPain.toFixed(1)}`);
      }
    }

    // 4. Simular criação de dados de teste
    console.log('\n🎯 4. Criando dados de teste...');

    // Criar execução de treino
    const { data: newWorkout, error: workoutCreateError } = await supabase
      .from('execucoes_treino')
      .insert({
        cliente_id: user.id,
        data_execucao: new Date().toISOString(),
        exercicios_realizados: [{ nome: 'Teste', series: 3, repeticoes: [10, 10, 10] }],
        tempo_total_min: 30,
        finalizado: true
      })
      .select()
      .single();

    if (workoutCreateError) {
      console.log('❌ Erro ao criar treino teste:', workoutCreateError.message);
    } else {
      console.log('✅ Treino teste criado com sucesso');
    }

    // Criar registro de dor
    const { data: newPainRecord, error: painCreateError } = await supabase
      .from('registros_dor')
      .insert({
        aluno_id: user.id,
        nivel_dor: 3,
        localizacao: 'lombar',
        observacoes: 'Teste de registro',
        tipo_registro: 'manual'
      })
      .select()
      .single();

    if (painCreateError) {
      console.log('❌ Erro ao criar registro dor teste:', painCreateError.message);
    } else {
      console.log('✅ Registro de dor teste criado com sucesso');
    }

    // 5. Testar novamente após criação
    console.log('\n🔄 5. Retestando após criar dados...');

    const { data: updatedWorkouts } = await supabase
      .from('execucoes_treino')
      .select('tempo_total_min')
      .eq('cliente_id', user.id);

    const totalMinutes = updatedWorkouts?.reduce((sum, w) => sum + (w.tempo_total_min || 0), 0) || 0;
    console.log(`Total de minutos agora: ${totalMinutes}`);

    const { data: updatedPainRecords } = await supabase
      .from('registros_dor')
      .select('nivel_dor')
      .eq('aluno_id', user.id);

    console.log(`Total de registros de dor agora: ${updatedPainRecords?.length || 0}`);

    console.log('\n✅ Teste concluído!');
    console.log('\n💡 Agora o app deve mostrar dados reais em vez de mockados.');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testRealData();