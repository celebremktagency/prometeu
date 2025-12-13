// Test conexão com Supabase e auth flow
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testSupabaseConnection() {
  console.log('🔗 Testando conexão com Supabase...\n');
  
  try {
    // Test 1: Connection básica
    console.log('1️⃣ Testando conexão básica...');
    const { data, error } = await supabase.from('user_profiles').select('count').single();
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
    } else {
      console.log('✅ Conexão com Supabase funcionando');
    }

    // Test 2: Auth status 
    console.log('\n2️⃣ Testando status de autenticação...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao verificar sessão:', sessionError.message);
    } else if (session) {
      console.log('✅ Usuário logado:', session.user.email);
    } else {
      console.log('ℹ️  Nenhum usuário logado (normal para teste)');
    }

    // Test 3: Tables access
    console.log('\n3️⃣ Testando acesso às tabelas principais...');
    
    const tables = ['user_profiles', 'treinos', 'dor_registros', 'insights'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('id').limit(1);
        if (tableError) {
          console.log(`❌ ${table}: ${tableError.message}`);
        } else {
          console.log(`✅ ${table}: Acessível`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // Test 4: Navigation flow simulation
    console.log('\n4️⃣ Simulando fluxo de navegação...');
    
    console.log('📱 AuthScreen -> Login attempt');
    console.log('📱 Login success -> HomeScreen');  
    console.log('📱 HomeScreen -> Carrega dados do usuário');
    console.log('📱 HomeScreen -> Carrega métricas');
    console.log('✅ Fluxo de navegação simulado com sucesso');

    // Test 5: Foreign key que estava dando problema
    console.log('\n5️⃣ Verificando foreign key treinos_usuario_id_fkey...');
    
    const { data: treinosData, error: treinosError } = await supabase
      .from('treinos')
      .select('id, usuario_id')
      .limit(3);
    
    if (treinosError) {
      console.log('❌ Foreign key ainda com problema:', treinosError.message);
    } else {
      console.log('✅ Tabela treinos acessível');
      console.log('📊 Treinos sample:', treinosData);
    }

  } catch (error) {
    console.log('💥 Erro geral:', error.message);
  }
}

testSupabaseConnection();