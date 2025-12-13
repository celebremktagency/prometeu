const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarUsuarios() {
  console.log('🧪 Criando usuários de teste...');
  
  const usuarios = [
    {
      email: 'aluno@teste.com',
      password: '123456',
      name: 'João Silva',
      tipo: 'aluno'
    },
    {
      email: 'trainer@teste.com',
      password: '123456',
      name: 'Personal Trainer',
      tipo: 'personal_trainer'
    }
  ];
  
  for (const usuario of usuarios) {
    try {
      console.log(`\n📝 Criando ${usuario.tipo}: ${usuario.email}`);
      
      // Cadastro no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: usuario.email,
        password: usuario.password,
        options: {
          data: {
            name: usuario.name,
            tipo: usuario.tipo
          }
        }
      });
      
      if (authError) {
        console.error('❌ Erro no auth:', authError.message);
        continue;
      }
      
      if (authData.user) {
        // Inserir na tabela user_profiles
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: authData.user.id,
            nome: usuario.name,
            email: usuario.email,
            tipo: usuario.tipo
          }])
          .select()
          .single();
        
        if (profileError) {
          console.error('❌ Erro no profile:', profileError.message);
          continue;
        }
        
        console.log('✅ Usuário criado com sucesso!');
      }
      
    } catch (error) {
      console.error('❌ Erro geral:', error.message);
    }
  }
  
  console.log('\n🎉 Usuários de teste criados!');
  console.log('📋 Credenciais:');
  console.log('   Aluno: aluno@teste.com / 123456');
  console.log('   Trainer: trainer@teste.com / 123456');
}

criarUsuarios();