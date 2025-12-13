const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarLogin() {
  console.log('🧪 Testando login...');
  
  try {
    // Teste 1: Login no Auth
    console.log('1. Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'teste@teste.com',
      password: '123456'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }
    
    console.log('✅ Login OK!', authData.user?.id);
    
    // Teste 2: Buscar perfil
    if (authData.user) {
      console.log('2. Buscando perfil...');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Erro no perfil:', profileError);
        return;
      }
      
      console.log('✅ Perfil encontrado!', profile.nome, profile.tipo);
    }
    
    console.log('🎉 Login completo realizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testarLogin();