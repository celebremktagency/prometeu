const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableColumns(tableName) {
  try {
    // Tentar fazer uma query que falhe para ver os campos disponíveis
    const { error } = await supabase
      .from(tableName)
      .select('nonexistent_field_to_trigger_error')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      // Extrair campos válidos da mensagem de erro
      const match = error.message.match(/Possible columns: (.+)/);
      if (match) {
        return match[1].split(', ').map(col => col.trim());
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function checkDetailedStructure() {
  console.log('🔍 Analisando estrutura detalhada das tabelas...\n');

  const tables = [
    'users',
    'user_profiles', 
    'profissionais',
    'profissional_cliente',
    'treinos',
    'workout_sessions',
    'treinos_atribuidos',
    'execucoes_treino',
    'feedback_treino',
    'exames_documentos'
  ];

  for (const tableName of tables) {
    console.log(`📋 Tabela: ${tableName}`);
    
    try {
      // Tentar buscar colunas
      const columns = await getTableColumns(tableName);
      
      if (columns) {
        console.log(`   Colunas: ${columns.join(', ')}`);
      } else {
        // Método alternativo - tentar inserir dados vazios
        try {
          const { error: insertError } = await supabase
            .from(tableName)
            .insert({})
            .select();
          
          if (insertError && insertError.message.includes('null value')) {
            // Extrair campos obrigatórios
            const requiredFields = [];
            const match = insertError.message.match(/null value in column "([^"]+)"/g);
            if (match) {
              match.forEach(m => {
                const field = m.match(/null value in column "([^"]+)"/);
                if (field) requiredFields.push(field[1]);
              });
            }
            console.log(`   Campos obrigatórios detectados: ${requiredFields.join(', ')}`);
          } else if (insertError) {
            console.log(`   Erro: ${insertError.message}`);
          }
        } catch (e) {
          console.log(`   Não foi possível determinar estrutura`);
        }
      }
    } catch (error) {
      console.log(`   Erro ao verificar: ${error.message}`);
    }
    
    console.log('');
  }

  // Verificar se existe alguma tabela de dor/pain
  console.log('🩹 Procurando tabelas relacionadas a dor...');
  const painTables = ['dor_registros', 'pain_records', 'registros_dor', 'dor'];
  
  for (const tableName of painTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error) {
        console.log(`✅ Encontrada: ${tableName}`);
      }
    } catch (error) {
      // Tabela não existe
    }
  }
  
  console.log('\n📊 Resumo do banco atual:');
  console.log('- Sistema de usuários: ✅ (users table com campos: id, nome, email, tipo, plano)');
  console.log('- Sistema de profiles: 🟡 (user_profiles existe mas está vazio)');
  console.log('- Sistema profissional: 🟡 (profissionais existe mas está vazio)');
  console.log('- Sistema de conexões: 🟡 (profissional_cliente existe mas está vazio)');
  console.log('- Sistema de treinos: 🟡 (treinos existe mas está vazio)');
  console.log('- Sistema de sessões: 🟡 (workout_sessions existe mas está vazio)');
  console.log('- Sistema de dor: ❌ (tabela não encontrada)');
  
  console.log('\n💡 Próximos passos:');
  console.log('1. Executar scripts SQL para popular estruturas das tabelas');
  console.log('2. Criar dados de teste para validar sistema');
  console.log('3. Testar funcionalidades uma por uma');
}

checkDetailedStructure();