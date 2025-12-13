const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarCadastro() {
  console.log('🧪 Testando cadastro completo...');
  
  try {
    // Teste 1: Cadastro no Auth
    console.log('1. Testando cadastro no Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'teste@teste.com',
      password: '123456',
      options: {
        data: {
          name: 'Usuario Teste',
          tipo: 'aluno'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Erro no auth:', authError);
      return;
    }
    
    console.log('✅ Auth criado!', authData.user?.id);
    
    // Teste 2: Inserir na tabela user_profiles
    if (authData.user) {
      console.log('2. Inserindo em user_profiles...');
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: authData.user.id,
          nome: 'Usuario Teste',
          email: 'teste@teste.com',
          tipo: 'aluno'
        }])
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ Erro no profile:', profileError);
        return;
      }
      
      console.log('✅ Profile criado!', profileData);
    }
    
    console.log('🎉 Cadastro completo realizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testarCadastro();