const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarConexao() {
  console.log('🧪 Testando conexão com Supabase...');
  
  try {
    // Teste 1: Verificar se consegue listar tabelas
    console.log('1. Testando listagem de user_profiles...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, nome, email, tipo')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro na consulta:', error);
      return;
    }
    
    console.log('✅ Conexão OK! Dados encontrados:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📋 Primeiros usuários:', data);
    }
    
    // Teste 2: Verificar schema
    console.log('\n2. Testando estrutura da tabela...');
    const { data: schema } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (schema && schema[0]) {
      console.log('📐 Estrutura da tabela:', Object.keys(schema[0]));
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testarConexao();