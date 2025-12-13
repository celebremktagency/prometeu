const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simular o inviteService localmente
class TestInviteService {
  async findProfessionalByCode(code) {
    try {
      const professionalIdSuffix = code.replace('PT', '').toLowerCase();
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, nome, email, created_at')
        .eq('tipo', 'personal_trainer');

      if (error) {
        throw new Error('Erro ao buscar personal trainer: ' + error.message);
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhum personal trainer encontrado');
      }

      const matchingProfessional = data.find(prof => 
        prof.id.toLowerCase().endsWith(professionalIdSuffix)
      );

      if (!matchingProfessional) {
        throw new Error('Personal trainer não encontrado com este código');
      }

      return matchingProfessional;

    } catch (error) {
      throw new Error(error.message || 'Erro ao buscar personal trainer');
    }
  }

  async connectWithTrainer(code, clientId) {
    try {
      // Find professional by code
      const professional = await this.findProfessionalByCode(code);
      
      // Check if already connected
      const { data: existing } = await supabase
        .from('professional_clients')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'ativo')
        .single();
      
      if (existing) {
        return { success: false, error: 'Você já está conectado a um personal trainer' };
      }

      // Create professional-client relationship
      const { error: relationError } = await supabase
        .from('professional_clients')
        .insert({
          professional_id: professional.id,
          client_id: clientId,
          started_at: new Date().toISOString(),
          status: 'ativo',
        });

      if (relationError) {
        if (relationError.code === '23505') {
          return { success: false, error: 'Conexão já existe com este personal' };
        }
        return { success: false, error: 'Erro ao criar conexão: ' + relationError.message };
      }

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message || 'Erro ao conectar com personal trainer' };
    }
  }

  async getMyProfessional(clientId) {
    try {
      const { data, error } = await supabase
        .from('professional_clients')
        .select(`
          *,
          professional:user_profiles!professional_id(id, nome, email, created_at)
        `)
        .eq('client_id', clientId)
        .eq('status', 'ativo')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error('Erro ao carregar personal trainer: ' + error.message);
      }

      if (!data) {
        return null;
      }

      return {
        ...data.professional,
        relationship_started: data.started_at,
        relationship_status: data.status,
      };

    } catch (error) {
      throw new Error(error.message || 'Erro ao carregar personal trainer');
    }
  }
}

async function testInviteService() {
  console.log('🧪 Testando funcionalidades do InviteService...\n');
  
  const testService = new TestInviteService();
  
  try {
    // 1. Buscar personal trainers disponíveis
    console.log('📋 1. Buscando personal trainers...');
    const { data: personals, error: personalsError } = await supabase
      .from('user_profiles')
      .select('id, nome, email')
      .eq('tipo', 'personal_trainer');
    
    if (personalsError) {
      console.error('❌ Erro:', personalsError.message);
      return;
    }
    
    console.log(`✅ Encontrados ${personals.length} personal trainers`);
    
    if (personals.length === 0) {
      console.log('❌ Nenhum personal trainer para testar');
      return;
    }
    
    // 2. Gerar código para o primeiro personal
    const testPersonal = personals[0];
    const testCode = `PT${testPersonal.id.slice(-6).toUpperCase()}`;
    console.log(`\n🏷️ 2. Testando código: ${testCode} para ${testPersonal.nome}`);
    
    // 3. Testar busca por código
    try {
      const foundPersonal = await testService.findProfessionalByCode(testCode);
      console.log(`✅ Personal encontrado: ${foundPersonal.nome}`);
    } catch (error) {
      console.error(`❌ Erro na busca: ${error.message}`);
      return;
    }
    
    // 4. Buscar um aluno para teste
    console.log('\n👨‍🎓 3. Buscando alunos...');
    const { data: alunos, error: alunosError } = await supabase
      .from('user_profiles')
      .select('id, nome, email')
      .eq('tipo', 'aluno');
    
    if (alunosError || !alunos || alunos.length === 0) {
      console.log('❌ Nenhum aluno encontrado para teste');
      return;
    }
    
    const testAluno = alunos[0];
    console.log(`✅ Aluno de teste: ${testAluno.nome}`);
    
    // 5. Verificar se já existe conexão
    console.log('\n🔗 4. Verificando conexões existentes...');
    const existingConnection = await testService.getMyProfessional(testAluno.id);
    
    if (existingConnection) {
      console.log(`✅ Aluno já conectado com: ${existingConnection.nome}`);
      console.log(`   📅 Desde: ${new Date(existingConnection.relationship_started).toLocaleDateString()}`);
    } else {
      console.log('📝 Nenhuma conexão existente');
      
      // 6. Testar criação de conexão
      console.log('\n🤝 5. Testando criação de conexão...');
      const connectionResult = await testService.connectWithTrainer(testCode, testAluno.id);
      
      if (connectionResult.success) {
        console.log('✅ Conexão criada com sucesso!');
        
        // Verificar se a conexão foi criada
        const newConnection = await testService.getMyProfessional(testAluno.id);
        if (newConnection) {
          console.log(`✅ Conexão verificada: ${newConnection.nome}`);
        }
        
        // Remover a conexão de teste
        console.log('\n🧹 Removendo conexão de teste...');
        const { error: deleteError } = await supabase
          .from('professional_clients')
          .delete()
          .eq('professional_id', testPersonal.id)
          .eq('client_id', testAluno.id);
        
        if (deleteError) {
          console.error('❌ Erro ao remover:', deleteError.message);
        } else {
          console.log('✅ Conexão de teste removida');
        }
      } else {
        console.error(`❌ Erro na conexão: ${connectionResult.error}`);
      }
    }
    
    console.log('\n🎉 Teste completo!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testInviteService();
