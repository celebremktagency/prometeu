const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔗 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl ? 'Configurada' : 'MISSING');
console.log('Key:', supabaseKey ? 'Configurada' : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Teste básico - tentar fazer login com o primeiro usuário
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, email, tipo')
      .limit(1);
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Conexão funcionando');
      console.log('Exemplo de perfil:', profiles[0]);
      
      // Simular login como este usuário para testar as políticas
      console.log('\n🔐 Testando autenticação...');
      
      // Verificar se conseguimos fazer uma query autenticada
      const testUserId = profiles[0].user_id;
      
      // Fazer uma query que deveria funcionar com RLS
      const { data: connectionTest, error: connectionError } = await supabase
        .from('professional_clients')
        .select('*')
        .limit(1);
      
      if (connectionError) {
        console.log('❌ Erro ao acessar professional_clients:', connectionError.message);
        
        if (connectionError.message.includes('row-level security')) {
          console.log('🔧 RLS está ativo mas sem políticas adequadas');
          
          // Criar instruções para executar manualmente
          console.log('\n📋 Execute estes comandos no SQL Editor do Supabase:');
          console.log('\n-- 1. Criar política básica para professional_clients');
          console.log(`CREATE POLICY "allow_authenticated_access" ON professional_clients FOR ALL TO authenticated USING (true);`);
          
          console.log('\n-- 2. Criar política básica para professional_invites');
          console.log(`CREATE POLICY "allow_authenticated_access" ON professional_invites FOR ALL TO authenticated USING (true);`);
          
          console.log('\n-- 3. Ou desabilitar RLS temporariamente:');
          console.log(`ALTER TABLE professional_clients DISABLE ROW LEVEL SECURITY;`);
          console.log(`ALTER TABLE professional_invites DISABLE ROW LEVEL SECURITY;`);
        }
      } else {
        console.log('✅ Acesso às tabelas funcionando');
      }
      
    } else {
      console.log('❌ Nenhum perfil encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
  }
}

testConnection();
