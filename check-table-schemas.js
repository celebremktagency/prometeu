const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchemas() {
  console.log('🔍 Verificando esquemas das tabelas...\n');

  try {
    // 1. Verificar colunas da tabela professional_clients
    console.log('📋 1. Verificando schema da tabela professional_clients...');
    const { data: profClientsData, error: profClientsError } = await supabase
      .from('professional_clients')
      .select('*')
      .limit(1);
    
    if (profClientsError) {
      console.error('❌ Erro:', profClientsError.message);
    } else {
      console.log('✅ Tabela professional_clients está acessível');
      
      // Testar insert para ver quais colunas são necessárias
      console.log('   📝 Testando inserção...');
      const { error: insertError } = await supabase
        .from('professional_clients')
        .insert({
          professional_id: 'test-id',
          client_id: 'test-id-2', 
          started_at: new Date().toISOString(),
          status: 'ativo'
        });
      
      if (insertError) {
        console.log('   ⚠️ Erro esperado de teste:', insertError.message);
        // Analisar o erro para ver que colunas são obrigatórias
      } else {
        console.log('   ✅ Schema parece correto, removendo teste...');
        // Remover o registro de teste
        await supabase
          .from('professional_clients')
          .delete()
          .eq('professional_id', 'test-id');
      }
    }

    // 2. Verificar colunas da tabela professional_invites
    console.log('\n📋 2. Verificando schema da tabela professional_invites...');
    const { data: profInvitesData, error: profInvitesError } = await supabase
      .from('professional_invites')
      .select('*')
      .limit(1);
    
    if (profInvitesError) {
      console.error('❌ Erro:', profInvitesError.message);
    } else {
      console.log('✅ Tabela professional_invites está acessível');
      
      // Testar insert
      console.log('   📝 Testando inserção...');
      const { error: insertError } = await supabase
        .from('professional_invites')
        .insert({
          client_id: 'test-client-id',
          professional_id: 'test-prof-id',
          invite_code: 'TEST123',
          status: 'pending',
          expires_at: new Date(Date.now() + 24*60*60*1000).toISOString()
        });
      
      if (insertError) {
        console.log('   ⚠️ Erro esperado de teste:', insertError.message);
      } else {
        console.log('   ✅ Schema parece correto, removendo teste...');
        await supabase
          .from('professional_invites')
          .delete()
          .eq('invite_code', 'TEST123');
      }
    }

    // 3. Verificar se as foreign keys estão corretas
    console.log('\n🔗 3. Verificando relacionamentos...');
    
    // Testar busca com join
    const { data: joinTest, error: joinError } = await supabase
      .from('professional_clients')
      .select(`
        *,
        professional:user_profiles!professional_id(id, nome, email),
        client:user_profiles!client_id(id, nome, email)
      `)
      .limit(1);
    
    if (joinError) {
      console.error('❌ Erro nos relacionamentos:', joinError.message);
    } else {
      console.log('✅ Relacionamentos estão funcionando');
    }

    // 4. Verificar se podemos criar uma conexão real de teste
    console.log('\n🧪 4. Teste de conexão completa...');
    
    // Buscar um personal trainer e um aluno reais
    const { data: personal } = await supabase
      .from('user_profiles')
      .select('id, nome')
      .eq('tipo', 'personal_trainer')
      .limit(1)
      .single();
    
    const { data: aluno } = await supabase
      .from('user_profiles')
      .select('id, nome')
      .eq('tipo', 'aluno')
      .limit(1)
      .single();
    
    if (personal && aluno) {
      console.log(`   👨‍🏫 Personal: ${personal.nome} (${personal.id})`);
      console.log(`   👨‍🎓 Aluno: ${aluno.nome} (${aluno.id})`);
      
      // Verificar se já existe conexão
      const { data: existingConnection } = await supabase
        .from('professional_clients')
        .select('*')
        .eq('professional_id', personal.id)
        .eq('client_id', aluno.id)
        .single();
      
      if (existingConnection) {
        console.log('   ✅ Já existe uma conexão entre eles');
      } else {
        console.log('   📝 Testando criação de conexão...');
        
        const { data: newConnection, error: connectionError } = await supabase
          .from('professional_clients')
          .insert({
            professional_id: personal.id,
            client_id: aluno.id,
            started_at: new Date().toISOString(),
            status: 'ativo'
          })
          .select()
          .single();
        
        if (connectionError) {
          console.error('   ❌ Erro ao criar conexão:', connectionError.message);
        } else {
          console.log('   ✅ Conexão criada com sucesso!');
          console.log('   🧹 Removendo conexão de teste...');
          
          await supabase
            .from('professional_clients')
            .delete()
            .eq('id', newConnection.id);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTableSchemas();
