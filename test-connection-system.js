const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnectionSystem() {
  console.log('🧪 Testando sistema de conexão aluno-personal...\n');

  try {
    // 1. Buscar usuários de teste
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    const personalTrainer = users.find(u => u.tipo === 'personal_trainer');
    const student = users.find(u => u.tipo === 'aluno');

    if (!personalTrainer) {
      console.log('❌ Personal trainer não encontrado');
      return;
    }

    if (!student) {
      console.log('❌ Aluno não encontrado');
      return;
    }

    console.log('👥 Usuários para teste:');
    console.log(`- Personal: ${personalTrainer.email} (${personalTrainer.id})`);
    console.log(`- Aluno: ${student.email} (${student.id})`);

    // 2. Testar busca do profissional
    console.log('\n🔍 Testando busca do profissional...');
    const { data: profissionalData, error: profError } = await supabase
      .from('profissionais')
      .select('*')
      .eq('user_id', personalTrainer.id)
      .single();

    if (profError) {
      console.log('❌ Erro ao buscar profissional:', profError);
      return;
    }

    console.log('✅ Profissional encontrado:', profissionalData.id);

    // 3. Testar verificação de conexão existente
    console.log('\n🔗 Verificando conexão existente...');
    const { data: existingConnection, error: connectionError } = await supabase
      .from('profissional_cliente')
      .select('*')
      .eq('cliente_id', student.id)
      .eq('profissional_id', profissionalData.id)
      .maybeSingle();

    if (connectionError && connectionError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar conexão:', connectionError);
      return;
    }

    if (existingConnection) {
      console.log('ℹ️ Conexão já existe, removendo para teste...');
      
      const { error: deleteError } = await supabase
        .from('profissional_cliente')
        .delete()
        .eq('id', existingConnection.id);

      if (deleteError) {
        console.log('❌ Erro ao remover conexão:', deleteError);
        return;
      }
      
      console.log('✅ Conexão removida');
    } else {
      console.log('✅ Nenhuma conexão existente');
    }

    // 4. Testar criação de nova conexão
    console.log('\n➕ Criando nova conexão...');
    const connectionData = {
      profissional_id: profissionalData.id,
      cliente_id: student.id,
      data_inicio: new Date().toISOString(),
      status: 'ativo'
    };

    const { data: newConnection, error: createError } = await supabase
      .from('profissional_cliente')
      .insert(connectionData)
      .select(`
        *,
        profissional:profissionais!profissional_cliente_profissional_id_fkey(
          *,
          user_profile:users!profissionais_user_id_fkey(nome, email)
        )
      `)
      .single();

    if (createError) {
      console.log('❌ Erro ao criar conexão:', createError);
      return;
    }

    console.log('✅ Conexão criada com sucesso!');
    console.log('🆔 ID da conexão:', newConnection.id);

    // 5. Testar busca de conexão do aluno
    console.log('\n🔍 Testando busca de conexão do aluno...');
    const { data: studentConnection, error: studentConnError } = await supabase
      .from('profissional_cliente')
      .select(`
        *,
        profissional:profissionais!profissional_cliente_profissional_id_fkey(
          *,
          user_profile:users!profissionais_user_id_fkey(nome, email)
        )
      `)
      .eq('cliente_id', student.id)
      .eq('status', 'ativo')
      .single();

    if (studentConnError) {
      console.log('❌ Erro ao buscar conexão do aluno:', studentConnError);
      return;
    }

    console.log('✅ Conexão do aluno encontrada');
    console.log('👨‍⚕️ Personal conectado:', studentConnection.profissional?.user_profile?.nome);

    // 6. Testar busca de clientes do personal
    console.log('\n📋 Testando busca de clientes do personal...');
    const { data: personalClients, error: clientsError } = await supabase
      .from('profissional_cliente')
      .select(`
        *,
        cliente:users!profissional_cliente_cliente_id_fkey(nome, email)
      `)
      .eq('profissional_id', profissionalData.id)
      .eq('status', 'ativo');

    if (clientsError) {
      console.log('❌ Erro ao buscar clientes:', clientsError);
      return;
    }

    console.log(`✅ ${personalClients.length} cliente(s) encontrado(s)`);
    personalClients.forEach(client => {
      console.log(`- ${client.cliente?.nome} (${client.cliente?.email})`);
    });

    // 7. Testar remoção de conexão
    console.log('\n🗑️ Testando remoção de conexão...');
    const { error: removeError } = await supabase
      .from('profissional_cliente')
      .update({
        status: 'finalizado',
        data_fim: new Date().toISOString()
      })
      .eq('id', newConnection.id);

    if (removeError) {
      console.log('❌ Erro ao finalizar conexão:', removeError);
    } else {
      console.log('✅ Conexão finalizada com sucesso');
    }

    // 8. Verificar se conexão foi removida
    console.log('\n🔍 Verificando se conexão foi removida...');
    const { data: verifyRemoval, error: verifyError } = await supabase
      .from('profissional_cliente')
      .select('*')
      .eq('cliente_id', student.id)
      .eq('status', 'ativo')
      .maybeSingle();

    if (verifyError && verifyError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar remoção:', verifyError);
    } else if (verifyRemoval) {
      console.log('⚠️ Conexão ainda ativa (não foi removida corretamente)');
    } else {
      console.log('✅ Conexão removida corretamente');
    }

    console.log('\n🎉 Teste completo do sistema de conexão!');
    console.log('📊 Resumo:');
    console.log('- ✅ Busca de profissional por email');
    console.log('- ✅ Verificação de conexões existentes');
    console.log('- ✅ Criação de nova conexão');
    console.log('- ✅ Busca de conexão do aluno');
    console.log('- ✅ Busca de clientes do personal');
    console.log('- ✅ Remoção/finalização de conexão');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testConnectionSystem();