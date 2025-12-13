const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkForeignKeys() {
  console.log('🔍 Verificando estrutura das foreign keys...\n');
  
  try {
    // 1. Verificar estrutura da tabela user_profiles
    console.log('📋 1. Verificando user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, user_id, nome, email, tipo')
      .limit(3);
    
    if (profilesError) {
      console.error('❌ Erro:', profilesError.message);
      return;
    }
    
    console.log('✅ Estrutura user_profiles:');
    profiles.forEach(profile => {
      console.log(`   - ID: ${profile.id}`);
      console.log(`   - USER_ID: ${profile.user_id}`);
      console.log(`   - Nome: ${profile.nome}`);
      console.log(`   - Tipo: ${profile.tipo}`);
      console.log('   ---');
    });
    
    // 2. Verificar qual campo é usado nas foreign keys
    console.log('\n🔗 2. Testando foreign keys...');
    
    // Pegar um personal trainer e um aluno
    const personal = profiles.find(p => p.tipo === 'personal_trainer');
    const aluno = profiles.find(p => p.tipo === 'aluno');
    
    if (!personal || !aluno) {
      console.log('❌ Não encontrou personal e aluno para teste');
      return;
    }
    
    console.log(`👨‍🏫 Personal: ${personal.nome}`);
    console.log(`   - ID: ${personal.id}`);
    console.log(`   - USER_ID: ${personal.user_id}`);
    
    console.log(`👨‍🎓 Aluno: ${aluno.nome}`);
    console.log(`   - ID: ${aluno.id}`);
    console.log(`   - USER_ID: ${aluno.user_id}`);
    
    // 3. Testar insert com user_id ao invés de id
    console.log('\n📝 3. Testando insert com user_id...');
    
    const { data: insertResult, error: insertError } = await supabase
      .from('professional_clients')
      .insert({
        professional_id: personal.user_id,  // Usar user_id
        client_id: aluno.user_id,          // Usar user_id
        started_at: new Date().toISOString(),
        status: 'ativo',
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro com user_id:', insertError.message);
      
      // Testar com id
      console.log('\n📝 4. Testando insert com id...');
      const { data: insertResult2, error: insertError2 } = await supabase
        .from('professional_clients')
        .insert({
          professional_id: personal.id,  // Usar id
          client_id: aluno.id,          // Usar id
          started_at: new Date().toISOString(),
          status: 'ativo',
        })
        .select()
        .single();
      
      if (insertError2) {
        console.error('❌ Erro com id:', insertError2.message);
      } else {
        console.log('✅ Sucesso com campo id!');
        console.log('   Resultado:', insertResult2);
        
        // Limpar
        await supabase
          .from('professional_clients')
          .delete()
          .eq('id', insertResult2.id);
        console.log('🧹 Registro de teste removido');
      }
    } else {
      console.log('✅ Sucesso com campo user_id!');
      console.log('   Resultado:', insertResult);
      
      // Limpar
      await supabase
        .from('professional_clients')
        .delete()
        .eq('id', insertResult.id);
      console.log('🧹 Registro de teste removido');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkForeignKeys();
