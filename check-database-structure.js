const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Verificando estrutura do banco de dados...\n');

  try {
    // 1. Verificar tabela user_profiles
    console.log('📋 1. Verificando tabela user_profiles...');
    const { data: userProfiles, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (userProfilesError) {
      console.error('❌ Erro ao verificar user_profiles:', userProfilesError.message);
    } else {
      console.log('✅ Tabela user_profiles existe');
      if (userProfiles && userProfiles.length > 0) {
        console.log('   Colunas:', Object.keys(userProfiles[0]));
      }
    }

    // 2. Verificar tabela professional_clients
    console.log('\n📋 2. Verificando tabela professional_clients...');
    const { data: profClients, error: profClientsError } = await supabase
      .from('professional_clients')
      .select('*')
      .limit(1);
    
    if (profClientsError) {
      console.error('❌ Tabela professional_clients não existe ou erro:', profClientsError.message);
      console.log('   📝 Esta tabela é necessária para conectar personal trainers e clientes');
    } else {
      console.log('✅ Tabela professional_clients existe');
      if (profClients && profClients.length > 0) {
        console.log('   Colunas:', Object.keys(profClients[0]));
      }
    }

    // 3. Verificar tabela professional_invites
    console.log('\n📋 3. Verificando tabela professional_invites...');
    const { data: profInvites, error: profInvitesError } = await supabase
      .from('professional_invites')
      .select('*')
      .limit(1);
    
    if (profInvitesError) {
      console.error('❌ Tabela professional_invites não existe ou erro:', profInvitesError.message);
      console.log('   📝 Esta tabela é necessária para convites entre personal trainers e clientes');
    } else {
      console.log('✅ Tabela professional_invites existe');
      if (profInvites && profInvites.length > 0) {
        console.log('   Colunas:', Object.keys(profInvites[0]));
      }
    }

    // 4. Verificar tipos de usuários existentes
    console.log('\n👥 4. Verificando tipos de usuários...');
    const { data: userTypes, error: userTypesError } = await supabase
      .from('user_profiles')
      .select('tipo, id, nome')
      .not('tipo', 'is', null);
    
    if (!userTypesError && userTypes) {
      const tipos = [...new Set(userTypes.map(u => u.tipo))];
      console.log('✅ Tipos de usuários encontrados:', tipos);
      
      const personalTrainers = userTypes.filter(u => u.tipo === 'personal_trainer');
      const alunos = userTypes.filter(u => u.tipo === 'aluno');
      
      console.log(`   📊 Personal Trainers: ${personalTrainers.length}`);
      console.log(`   📊 Alunos: ${alunos.length}`);
      
      if (personalTrainers.length > 0) {
        console.log('   👨‍🏫 Exemplo de Personal Trainer:', {
          id: personalTrainers[0].id,
          nome: personalTrainers[0].nome,
          codigo: `PT${personalTrainers[0].id.slice(-6).toUpperCase()}`
        });
      }
    }

    // 5. Verificar conexões existentes
    console.log('\n🔗 5. Verificando conexões existentes...');
    const { data: connections, error: connectionsError } = await supabase
      .from('professional_clients')
      .select(`
        *,
        professional:user_profiles!professional_id(nome, email),
        client:user_profiles!client_id(nome, email)
      `);
    
    if (!connectionsError && connections) {
      console.log(`✅ Conexões existentes: ${connections.length}`);
      connections.forEach(conn => {
        console.log(`   🤝 ${conn.professional?.nome || 'Personal'} ↔ ${conn.client?.nome || 'Cliente'}`);
      });
    } else if (connectionsError) {
      console.error('❌ Erro ao verificar conexões:', connectionsError.message);
    }

    // 6. Testar busca por código de personal trainer
    console.log('\n🔍 6. Testando busca por código...');
    const { data: allPersonals, error: allPersonalsError } = await supabase
      .from('user_profiles')
      .select('id, nome, email, created_at')
      .eq('tipo', 'personal_trainer');
    
    if (!allPersonalsError && allPersonals && allPersonals.length > 0) {
      const testPersonal = allPersonals[0];
      const testCode = `PT${testPersonal.id.slice(-6).toUpperCase()}`;
      console.log(`✅ Código de teste gerado: ${testCode} para ${testPersonal.nome}`);
      
      // Simular busca por código
      const codeSuffix = testCode.replace('PT', '').toLowerCase();
      const foundPersonal = allPersonals.find(prof => 
        prof.id.toLowerCase().endsWith(codeSuffix)
      );
      
      if (foundPersonal) {
        console.log('✅ Busca por código funcionaria corretamente');
      } else {
        console.log('❌ Busca por código não funcionou');
      }
    }

    console.log('\n📊 Verificação completa!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkDatabaseStructure();
