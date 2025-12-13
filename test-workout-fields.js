const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWorkoutFields() {
  console.log('🔍 Descobrindo campos das tabelas de treino...\n');

  // Tentar descobrir campos da tabela treinos_atribuidos
  console.log('📋 Testando campos da tabela treinos_atribuidos...');
  
  const fieldsToTest = [
    'id', 'profissional_id', 'cliente_id', 'aluno_id', 
    'treino_id', 'nome', 'exercicios', 'data_inicio', 
    'status', 'created_at', 'updated_at'
  ];

  const validFields = [];
  
  for (const field of fieldsToTest) {
    try {
      const testData = {};
      testData[field] = (field === 'exercicios') ? [] : 'teste';
      
      const { error } = await supabase
        .from('treinos_atribuidos')
        .insert(testData)
        .select();

      if (error) {
        if (error.message.includes(`Could not find the '${field}'`)) {
          console.log(`❌ Campo '${field}' não existe`);
        } else {
          console.log(`✅ Campo '${field}' existe`);
          validFields.push(field);
        }
      } else {
        console.log(`✅ Campo '${field}' existe e aceitou teste`);
        validFields.push(field);
        // Deletar o registro de teste se foi criado
        await supabase.from('treinos_atribuidos').delete().eq(field, 'teste');
      }
    } catch (error) {
      console.log(`❌ Erro ao testar '${field}': ${error.message}`);
    }
  }

  console.log(`\n✅ Campos válidos encontrados: ${validFields.join(', ')}`);

  // Testar também execucoes_treino
  console.log('\n📋 Testando campos da tabela execucoes_treino...');
  
  const execFields = [
    'id', 'treino_atribuido_id', 'cliente_id', 'aluno_id',
    'data_execucao', 'exercicios_realizados', 'tempo_total_min',
    'finalizado', 'created_at'
  ];

  const validExecFields = [];
  
  for (const field of execFields) {
    try {
      const testData = {};
      testData[field] = (field === 'exercicios_realizados') ? [] : 
                       (field === 'finalizado') ? false :
                       (field === 'tempo_total_min') ? 30 : 'teste';
      
      const { error } = await supabase
        .from('execucoes_treino')
        .insert(testData)
        .select();

      if (error) {
        if (error.message.includes(`Could not find the '${field}'`)) {
          console.log(`❌ Campo '${field}' não existe`);
        } else {
          console.log(`✅ Campo '${field}' existe`);
          validExecFields.push(field);
        }
      } else {
        console.log(`✅ Campo '${field}' existe e aceitou teste`);
        validExecFields.push(field);
        // Deletar o registro de teste se foi criado
        await supabase.from('execucoes_treino').delete().eq(field, 'teste');
      }
    } catch (error) {
      console.log(`❌ Erro ao testar '${field}': ${error.message}`);
    }
  }

  console.log(`\n✅ Campos válidos execucoes_treino: ${validExecFields.join(', ')}`);

  // Agora tentar criar um treino atribuído com os campos corretos
  console.log('\n🧪 Testando criação com campos válidos...');
  
  // Buscar IDs reais para teste
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('tipo', 'aluno')
    .limit(1);

  const { data: professionals, error: profError } = await supabase
    .from('profissionais')
    .select('*')
    .limit(1);

  if (users.length > 0 && professionals.length > 0) {
    const student = users[0];
    const professional = professionals[0];
    
    // Tentar diferentes combinações de campos
    const testData = {
      profissional_id: professional.id,
      nome: 'Teste de Treino',
      data_inicio: new Date().toISOString().split('T')[0],
      status: 'ativo'
    };

    // Tentar com aluno_id se cliente_id não existir
    if (validFields.includes('aluno_id')) {
      testData.aluno_id = student.id;
    }

    console.log('📝 Testando com dados:', JSON.stringify(testData, null, 2));

    const { data: testWorkout, error: testError } = await supabase
      .from('treinos_atribuidos')
      .insert(testData)
      .select()
      .single();

    if (testError) {
      console.log('❌ Erro no teste final:', testError);
    } else {
      console.log('✅ Treino atribuído criado com sucesso!');
      console.log('🆔 ID:', testWorkout.id);
      
      // Limpar teste
      await supabase.from('treinos_atribuidos').delete().eq('id', testWorkout.id);
      console.log('🧹 Dados de teste removidos');
    }
  }
}

testWorkoutFields();