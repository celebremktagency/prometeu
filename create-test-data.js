const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🎯 Criando dados de teste para validar sistema...\n');

  try {
    // 1. Verificar usuários existentes
    console.log('👥 Verificando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`Encontrados ${users.length} usuários:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.tipo})`);
    });

    // 2. Criar profiles para usuários se não existirem
    console.log('\n📋 Criando profiles...');
    for (const user of users) {
      try {
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          console.log(`❌ Erro ao verificar profile de ${user.email}:`, profileCheckError);
          continue;
        }

        if (!existingProfile) {
          const { data: newProfile, error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              nome: user.nome,
              email: user.email,
              tipo: user.tipo,
              telefone: null,
              data_nascimento: null,
              objetivo: user.tipo === 'aluno' ? 'Melhorar condicionamento físico' : null,
              meta_semanal: user.tipo === 'aluno' ? 3 : null,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (profileError) {
            console.log(`❌ Erro ao criar profile para ${user.email}:`, profileError);
          } else {
            console.log(`✅ Profile criado para ${user.email}`);
          }
        } else {
          console.log(`ℹ️ Profile já existe para ${user.email}`);
        }
      } catch (error) {
        console.log(`❌ Erro inesperado para ${user.email}:`, error.message);
      }
    }

    // 3. Criar um profissional se não existir
    console.log('\n👨‍⚕️ Criando profissional de teste...');
    const personalTrainers = users.filter(u => u.tipo === 'personal_trainer');
    
    if (personalTrainers.length > 0) {
      const trainer = personalTrainers[0];
      
      try {
        const { data: existingProfessional, error: profCheckError } = await supabase
          .from('profissionais')
          .select('*')
          .eq('user_id', trainer.id)
          .maybeSingle();

        if (profCheckError && profCheckError.code !== 'PGRST116') {
          console.log('❌ Erro ao verificar profissional:', profCheckError);
        } else if (!existingProfessional) {
          const { data: newProfessional, error: profError } = await supabase
            .from('profissionais')
            .insert({
              user_id: trainer.id,
              tipo_profissional: 'personal_trainer',
              especialidade: 'Musculação e Condicionamento Físico',
              crf_crefito_crmv: 'CREF-123456',
              descricao: 'Personal trainer especializado em reabilitação e fortalecimento',
              experiencia_anos: 5,
              preco_consulta: 80.00,
              aceita_novos_clientes: true,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (profError) {
            console.log('❌ Erro ao criar profissional:', profError);
          } else {
            console.log('✅ Profissional criado com sucesso');
          }
        } else {
          console.log('ℹ️ Profissional já existe');
        }
      } catch (error) {
        console.log('❌ Erro inesperado ao criar profissional:', error.message);
      }
    } else {
      console.log('⚠️ Nenhum personal trainer encontrado para criar profissional');
    }

    // 4. Criar alguns treinos básicos
    console.log('\n💪 Criando treinos básicos...');
    const basicWorkouts = [
      {
        exercicio: 'Caminhada',
        categoria: 'aerobico',
        descricao: 'Caminhada de intensidade moderada',
        duracao_min: 30,
        calorias_estimadas: 150,
        nivel: 'iniciante',
        equipamento_necessario: null,
        musculos_trabalhados: ['pernas', 'cardio']
      },
      {
        exercicio: 'Alongamento',
        categoria: 'flexibilidade',
        descricao: 'Série básica de alongamentos',
        duracao_min: 15,
        calorias_estimadas: 50,
        nivel: 'iniciante',
        equipamento_necessario: null,
        musculos_trabalhados: ['todo corpo']
      },
      {
        exercicio: 'Fortalecimento Lombar',
        categoria: 'fortalecimento',
        descricao: 'Exercícios para fortalecimento da região lombar',
        duracao_min: 20,
        calorias_estimadas: 80,
        nivel: 'intermediario',
        equipamento_necessario: null,
        musculos_trabalhados: ['lombar', 'core']
      }
    ];

    for (const workout of basicWorkouts) {
      try {
        const { data: existingWorkout, error: workoutCheckError } = await supabase
          .from('treinos')
          .select('*')
          .eq('exercicio', workout.exercicio)
          .maybeSingle();

        if (workoutCheckError && workoutCheckError.code !== 'PGRST116') {
          console.log(`❌ Erro ao verificar treino ${workout.exercicio}:`, workoutCheckError);
          continue;
        }

        if (!existingWorkout) {
          const { data: newWorkout, error: workoutError } = await supabase
            .from('treinos')
            .insert(workout)
            .select()
            .single();

          if (workoutError) {
            console.log(`❌ Erro ao criar treino ${workout.exercicio}:`, workoutError);
          } else {
            console.log(`✅ Treino '${workout.exercicio}' criado`);
          }
        } else {
          console.log(`ℹ️ Treino '${workout.exercicio}' já existe`);
        }
      } catch (error) {
        console.log(`❌ Erro inesperado ao criar treino ${workout.exercicio}:`, error.message);
      }
    }

    console.log('\n✅ Dados de teste criados com sucesso!');
    console.log('\n📋 Próximo passo: testar conexão aluno-personal');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestData();