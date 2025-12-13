const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTrainerUser() {
  console.log('👨‍⚕️ Criando usuário personal trainer para testes...\n');

  try {
    // Primeiro verificar se já existe um personal trainer
    const { data: existingTrainers, error: trainerError } = await supabase
      .from('users')
      .select('*')
      .eq('tipo', 'personal_trainer');

    if (trainerError) {
      console.log('❌ Erro ao verificar trainers existentes:', trainerError);
      return;
    }

    if (existingTrainers.length > 0) {
      console.log('✅ Personal trainer já existe:');
      existingTrainers.forEach(trainer => {
        console.log(`- ${trainer.email} (ID: ${trainer.id})`);
      });
      
      // Verificar se tem profile
      for (const trainer of existingTrainers) {
        await checkAndCreateProfile(trainer);
        await checkAndCreateProfessional(trainer);
      }
      return;
    }

    // Criar novo usuário personal trainer
    console.log('🆕 Criando novo personal trainer...');
    const trainerData = {
      nome: 'Personal Trainer Teste',
      email: 'personal@teste.com',
      tipo: 'personal_trainer',
      plano: 'premium',
      data_inicio: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    const { data: newTrainer, error: createError } = await supabase
      .from('users')
      .insert(trainerData)
      .select()
      .single();

    if (createError) {
      console.log('❌ Erro ao criar personal trainer:', createError);
      return;
    }

    console.log('✅ Personal trainer criado:', newTrainer.email);

    // Criar profile
    await checkAndCreateProfile(newTrainer);
    
    // Criar registro profissional
    await checkAndCreateProfessional(newTrainer);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function checkAndCreateProfile(user) {
  console.log(`\n📋 Verificando profile para ${user.email}...`);
  
  try {
    // Verificar se existe profile
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar profile:', profileCheckError);
      return;
    }

    if (existingProfile) {
      console.log('✅ Profile já existe');
      return;
    }

    // Tentar criar profile com campos básicos apenas
    const profileData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      created_at: new Date().toISOString()
    };

    const { data: newProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.log('❌ Erro ao criar profile:', profileError);
    } else {
      console.log('✅ Profile criado com sucesso');
    }
  } catch (error) {
    console.log('❌ Erro inesperado ao criar profile:', error.message);
  }
}

async function checkAndCreateProfessional(user) {
  console.log(`\n👨‍⚕️ Verificando registro profissional para ${user.email}...`);
  
  try {
    // Verificar se existe registro profissional
    const { data: existingProfessional, error: profCheckError } = await supabase
      .from('profissionais')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profCheckError && profCheckError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar profissional:', profCheckError);
      return;
    }

    if (existingProfessional) {
      console.log('✅ Registro profissional já existe');
      return;
    }

    // Tentar criar registro profissional com campos mínimos
    const professionalData = {
      user_id: user.id,
      tipo_profissional: 'personal_trainer',
      created_at: new Date().toISOString()
    };

    const { data: newProfessional, error: profError } = await supabase
      .from('profissionais')
      .insert(professionalData)
      .select()
      .single();

    if (profError) {
      console.log('❌ Erro ao criar registro profissional:', profError);
    } else {
      console.log('✅ Registro profissional criado');
    }
  } catch (error) {
    console.log('❌ Erro inesperado ao criar profissional:', error.message);
  }
}

async function createBasicWorkout() {
  console.log('\n💪 Criando treino básico...');
  
  try {
    // Verificar se já existe
    const { data: existing, error: checkError } = await supabase
      .from('treinos')
      .select('*')
      .eq('exercicio', 'Caminhada')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar treino:', checkError);
      return;
    }

    if (existing) {
      console.log('✅ Treino básico já existe');
      return;
    }

    // Criar treino com apenas o campo obrigatório
    const workoutData = {
      exercicio: 'Caminhada',
      created_at: new Date().toISOString()
    };

    const { data: newWorkout, error: workoutError } = await supabase
      .from('treinos')
      .insert(workoutData)
      .select()
      .single();

    if (workoutError) {
      console.log('❌ Erro ao criar treino:', workoutError);
    } else {
      console.log('✅ Treino básico criado');
    }
  } catch (error) {
    console.log('❌ Erro inesperado ao criar treino:', error.message);
  }
}

// Executar todas as funções
async function main() {
  await createTrainerUser();
  await createBasicWorkout();
  
  console.log('\n🎯 Resumo:');
  console.log('1. Personal trainer criado/verificado');
  console.log('2. Profiles verificados');
  console.log('3. Registros profissionais verificados'); 
  console.log('4. Treino básico criado');
  console.log('\n✅ Pronto para testar sistema de conexão!');
}

main();