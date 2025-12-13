const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverTableStructure() {
  console.log('🔍 Descobrindo estrutura real das tabelas...\n');

  const tables = [
    'users',
    'user_profiles', 
    'profissionais',
    'profissional_cliente',
    'treinos',
    'workout_sessions',
    'treinos_atribuidos',
    'execucoes_treino',
    'feedback_treino'
  ];

  for (const tableName of tables) {
    console.log(`\n📋 Tabela: ${tableName}`);
    
    try {
      // Tentar fazer uma query inválida para descobrir campos
      const { error } = await supabase
        .from(tableName)
        .select('campo_que_nao_existe_para_descobrir_estrutura');

      if (error && error.message.includes('Could not find the')) {
        // Tentar com *
        const { data, error: selectError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!selectError && data) {
          if (data.length > 0) {
            console.log(`   ✅ Campos encontrados: ${Object.keys(data[0]).join(', ')}`);
          } else {
            console.log('   📭 Tabela vazia - tentando descobrir estrutura...');
            
            // Tentar inserir com campo obrigatório comum
            const { error: insertError } = await supabase
              .from(tableName)
              .insert({})
              .select();

            if (insertError) {
              if (insertError.message.includes('violates not-null constraint')) {
                const match = insertError.message.match(/column "([^"]+)"/);
                if (match) {
                  console.log(`   🎯 Campo obrigatório detectado: ${match[1]}`);
                }
              } else if (insertError.message.includes('Could not find the')) {
                const match = insertError.message.match(/Could not find the '([^']+)' column/);
                if (match) {
                  console.log(`   ❌ Campo inexistente tentado: ${match[1]}`);
                }
              }
              console.log(`   💡 Mensagem de erro: ${insertError.message}`);
            }
          }
        } else if (selectError) {
          console.log(`   ❌ Erro no select: ${selectError.message}`);
        }
      } else if (error) {
        console.log(`   ❌ Erro geral: ${error.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro inesperado: ${error.message}`);
    }
  }

  // Testar inserção em user_profiles com campos básicos
  console.log('\n🧪 Testando inserção em user_profiles...');
  
  const basicFields = ['id', 'nome', 'email', 'tipo', 'telefone', 'created_at'];
  
  for (const field of basicFields) {
    try {
      const testData = {};
      testData[field] = 'teste';
      
      const { error } = await supabase
        .from('user_profiles')
        .insert(testData)
        .select();

      if (error) {
        if (error.message.includes(`Could not find the '${field}'`)) {
          console.log(`   ❌ Campo '${field}' não existe`);
        } else if (error.message.includes('violates not-null constraint')) {
          console.log(`   ✅ Campo '${field}' existe (erro de null)`);
        } else {
          console.log(`   🤔 Campo '${field}': ${error.message}`);
        }
      } else {
        console.log(`   ✅ Campo '${field}' existe e aceitou teste`);
      }
    } catch (error) {
      console.log(`   ❌ Erro ao testar '${field}': ${error.message}`);
    }
  }

  // Testar inserção em treinos
  console.log('\n🧪 Testando inserção em treinos...');
  
  const treinoFields = ['exercicio', 'categoria', 'descricao', 'duracao_min', 'nivel'];
  
  for (const field of treinoFields) {
    try {
      const testData = {};
      testData[field] = 'teste';
      
      const { error } = await supabase
        .from('treinos')
        .insert(testData)
        .select();

      if (error) {
        if (error.message.includes(`Could not find the '${field}'`)) {
          console.log(`   ❌ Campo '${field}' não existe`);
        } else if (error.message.includes('violates not-null constraint')) {
          console.log(`   ✅ Campo '${field}' existe (erro de null)`);
        } else {
          console.log(`   🤔 Campo '${field}': ${error.message}`);
        }
      } else {
        console.log(`   ✅ Campo '${field}' existe e aceitou teste`);
      }
    } catch (error) {
      console.log(`   ❌ Erro ao testar '${field}': ${error.message}`);
    }
  }
}

discoverTableStructure();