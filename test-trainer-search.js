const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygkfnzqjdipbifccthpb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlna2ZuenFqZGlwYmlmY2N0aHBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODI0NTE4NywiZXhwIjoyMDQzODIxMTg3fQ.bEE6M3zlsE0bKqgLR2VHIrEwEsNqvUlcQp9NlrZTf6I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestTrainers() {
  try {
    console.log('🔍 Criando personal trainers de teste...');

    // Criar alguns personal trainers de teste
    const trainers = [
      {
        nome: 'João Silva',
        email: 'joao.silva.trainer@test.com',
        tipo: 'profissional',
        especialidade: 'Musculação e Hipertrofia',
        experiencia: 5,
        ativo: true,
        user_id: 'trainer-1-uuid'
      },
      {
        nome: 'Maria Santos',
        email: 'maria.santos.trainer@test.com',
        tipo: 'profissional',
        especialidade: 'Emagrecimento e Condicionamento',
        experiencia: 8,
        ativo: true,
        user_id: 'trainer-2-uuid'
      },
      {
        nome: 'Carlos Oliveira',
        email: 'carlos.oliveira.trainer@test.com',
        tipo: 'profissional',
        especialidade: 'Reabilitação e Fisioterapia',
        experiencia: 12,
        ativo: true,
        user_id: 'trainer-3-uuid'
      }
    ];

    for (const trainer of trainers) {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(trainer, { onConflict: 'email' });

      if (error) {
        console.error(`❌ Erro ao criar trainer ${trainer.nome}:`, error);
      } else {
        console.log(`✅ Trainer criado: ${trainer.nome}`);
      }
    }

    console.log('🎉 Personal trainers de teste criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function testSearch() {
  try {
    console.log('\n🔍 Testando busca por personal trainers...');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, nome, email, especialidade, experiencia, ativo')
      .eq('tipo', 'profissional')
      .eq('ativo', true)
      .ilike('nome', '%Silva%');

    if (error) {
      console.error('❌ Erro na busca:', error);
    } else {
      console.log('✅ Resultados da busca:', data);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function run() {
  await createTestTrainers();
  await testSearch();
  process.exit(0);
}

run();