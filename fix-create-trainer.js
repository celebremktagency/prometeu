const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCreateTrainer() {
  console.log('🔧 Criando personal trainer com dados corretos...\n');

  try {
    // Verificar um usuário existente para ver o formato do plano
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ Erro ao verificar usuários:', usersError);
      return;
    }

    if (existingUsers.length > 0) {
      console.log('📋 Formato dos dados existentes:');
      console.log('- Plano:', existingUsers[0].plano);
      console.log('- Campos:', Object.keys(existingUsers[0]).join(', '));
    }

    // Alterar um usuário existente para personal trainer
    const alunoToConvert = existingUsers[0];
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ tipo: 'personal_trainer' })
      .eq('id', alunoToConvert.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Erro ao atualizar usuário:', updateError);
      return;
    }

    console.log('✅ Usuário convertido para personal trainer:', updatedUser.email);

    // Criar profile se não existir (sem campos extras)
    const profileData = {
      id: updatedUser.id,
      nome: updatedUser.nome,
      email: updatedUser.email,
      tipo: updatedUser.tipo
    };

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      console.log('❌ Erro ao criar/atualizar profile:', profileError);
    } else {
      console.log('✅ Profile criado/atualizado');
    }

    // Criar registro profissional
    const professionalData = {
      user_id: updatedUser.id,
      tipo_profissional: 'personal_trainer'
    };

    const { data: professional, error: profError } = await supabase
      .from('profissionais')
      .insert(professionalData)
      .select()
      .single();

    if (profError) {
      console.log('❌ Erro ao criar profissional:', profError);
    } else {
      console.log('✅ Registro profissional criado');
    }

    // Criar treino básico (apenas com campo obrigatório)
    const workoutData = {
      exercicio: 'Caminhada'
    };

    const { data: workout, error: workoutError } = await supabase
      .from('treinos')
      .insert(workoutData)
      .select()
      .single();

    if (workoutError) {
      console.log('❌ Erro ao criar treino:', workoutError);
    } else {
      console.log('✅ Treino básico criado');
    }

    console.log('\n🎯 Personal trainer pronto para testes!');
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`🆔 ID: ${updatedUser.id}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixCreateTrainer();