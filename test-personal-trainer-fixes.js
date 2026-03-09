const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular as funções corrigidas
async function generateProfessionalCode(professionalId) {
  // Generate a more unique code for the professional
  // Use last 4 characters of UUID + 2 random chars
  const idSuffix = professionalId.replace(/-/g, '').slice(-4).toUpperCase();
  const randomChars = Math.random().toString(36).substring(2, 4).toUpperCase();
  const code = `PT${idSuffix}${randomChars}`;
  return code;
}

async function findProfessionalByCode(code) {
  try {
    // Validate code input
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      throw new Error('Código inválido');
    }
    
    const cleanCode = code.trim().toUpperCase();
    
    // Validate code format (should start with PT and be 8 chars)
    if (!cleanCode.startsWith('PT') || cleanCode.length !== 8) {
      throw new Error('Formato de código inválido. Use formato PTXXXXXX');
    }
    
    // Extract suffix from code (remove PT prefix)
    const codeSuffix = cleanCode.replace('PT', '');
    
    // Get all personal trainers (check both tipo values for compatibility)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, nome, email, created_at, tipo')
      .or('tipo.eq.personal_trainer,tipo.eq.profissional')
      .eq('ativo', true);

    if (error) {
      console.error('Database error:', error);
      throw new Error('Erro ao buscar personal trainer: ' + error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('Nenhum personal trainer ativo encontrado no sistema');
    }

    console.log(`📊 Encontrados ${data.length} personal trainers no sistema`);

    // Generate codes for all professionals and find match
    let matchingProfessional = null;
    
    for (const prof of data) {
      try {
        const profCode = await generateProfessionalCode(prof.id || prof.user_id);
        const profSuffix = profCode.replace('PT', '');
        
        console.log(`🔍 ${prof.nome} - Código: ${profCode}`);
        
        if (profSuffix === codeSuffix) {
          matchingProfessional = prof;
          break;
        }
      } catch (error) {
        console.log('Error generating code for professional:', prof.id);
      }
    }

    if (!matchingProfessional) {
      // Fallback: try simpler matching with user_id/id suffix
      const matchByIdSuffix = data.find(prof => {
        const profId = (prof.id || prof.user_id || '').toString().replace(/-/g, '').slice(-4).toUpperCase();
        return codeSuffix.startsWith(profId);
      });
      
      if (matchByIdSuffix) {
        matchingProfessional = matchByIdSuffix;
      }
    }

    if (!matchingProfessional) {
      throw new Error('Personal trainer não encontrado com este código. Verifique se o código está correto.');
    }

    console.log('✅ Personal trainer encontrado:', matchingProfessional.nome);
    return matchingProfessional;

  } catch (error) {
    console.error('❌ Error in findProfessionalByCode:', error.message);
    throw error;
  }
}

async function testPersonalTrainerFixes() {
  console.log('🧪 Testando correções do Personal Trainer...\n');

  try {
    // 1. Verificar personal trainers existentes
    console.log('1️⃣ Verificando personal trainers no sistema:');
    const { data: trainers, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, nome, email, tipo, ativo')
      .or('tipo.eq.personal_trainer,tipo.eq.profissional');

    if (error) {
      console.log('❌ Erro:', error.message);
      return;
    }

    console.log(`📊 Encontrados ${trainers?.length || 0} personal trainers`);
    
    if (!trainers || trainers.length === 0) {
      console.log('🚨 Nenhum personal trainer encontrado. Criando um para teste...');
      
      // Criar um personal trainer de teste
      const { data: newUser, error: createError } = await supabase
        .from('user_profiles')
        .upsert({
          nome: 'Personal Teste',
          email: 'personal.teste@exemplo.com',
          tipo: 'personal_trainer',
          ativo: true
        }, { onConflict: 'email' })
        .select()
        .single();

      if (createError) {
        console.log('❌ Erro ao criar personal de teste:', createError.message);
        return;
      }

      trainers.push(newUser);
      console.log('✅ Personal trainer de teste criado');
    }

    // 2. Testar geração de códigos
    console.log('\n2️⃣ Testando geração de códigos:');
    
    for (const trainer of trainers) {
      const userId = trainer.user_id || trainer.id;
      const code = await generateProfessionalCode(userId);
      console.log(`👤 ${trainer.nome} - Código: ${code}`);
      
      // 3. Testar busca por código
      console.log(`🔍 Testando busca pelo código ${code}:`);
      try {
        const found = await findProfessionalByCode(code);
        console.log(`✅ Encontrado: ${found.nome}`);
      } catch (searchError) {
        console.log(`❌ Erro na busca: ${searchError.message}`);
      }
      
      console.log(''); // Linha em branco para separar
    }

    // 4. Testar código inválido
    console.log('4️⃣ Testando código inválido:');
    try {
      await findProfessionalByCode('PTINVALID');
      console.log('❌ Deveria ter falhado');
    } catch (error) {
      console.log(`✅ Erro esperado: ${error.message}`);
    }

    // 5. Testar formato inválido
    console.log('\n5️⃣ Testando formato inválido:');
    try {
      await findProfessionalByCode('ABC123');
      console.log('❌ Deveria ter falhado');
    } catch (error) {
      console.log(`✅ Erro esperado: ${error.message}`);
    }

    console.log('\n🎉 Testes concluídos!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

testPersonalTrainerFixes();