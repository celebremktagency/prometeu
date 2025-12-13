const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDatabaseFixes() {
  console.log('🔧 Aplicando correções no banco de dados...\n');

  // 1. Criar tabela registros_dor
  console.log('1️⃣ Criando tabela registros_dor...');
  try {
    // Testar se tabela já existe tentando fazer um select
    const { error: testError } = await supabase
      .from('registros_dor')
      .select('id')
      .limit(1);

    if (testError && testError.code === 'PGRST200') {
      console.log('❌ Tabela registros_dor não existe - precisa ser criada no Supabase SQL Editor');
      console.log('🛠️ Execute este SQL no Supabase:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.registros_dor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    localizacao text NOT NULL,
    nivel_dor integer CHECK (nivel_dor BETWEEN 0 AND 10),
    data_registro timestamp with time zone DEFAULT now(),
    observacoes text,
    tipo_registro text DEFAULT 'manual',
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registros_dor_aluno ON registros_dor(aluno_id);
CREATE INDEX IF NOT EXISTS idx_registros_dor_data ON registros_dor(data_registro);

ALTER TABLE registros_dor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pain records" ON registros_dor
    FOR ALL USING (aluno_id = auth.uid());
      `);
    } else {
      console.log('✅ Tabela registros_dor já existe');
    }
  } catch (error) {
    console.log('❌ Erro ao verificar tabela:', error.message);
  }

  // 2. Verificar se user_profiles tem campos necessários
  console.log('\n2️⃣ Verificando campos em user_profiles...');
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('meta_semanal, objetivo, telefone')
      .limit(1);

    if (error && error.message.includes("meta_semanal")) {
      console.log('❌ Campo meta_semanal não existe - precisa ser adicionado no Supabase SQL Editor');
      console.log('🛠️ Execute este SQL no Supabase:');
      console.log(`
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS meta_semanal integer DEFAULT 3;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS objetivo text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS data_nascimento date;
      `);
    } else {
      console.log('✅ Campos necessários existem em user_profiles');
    }
  } catch (error) {
    console.log('❌ Erro ao verificar campos:', error.message);
  }

  // 3. Criar função para stats reais
  console.log('\n3️⃣ Verificando função get_user_real_stats...');
  try {
    const { data, error } = await supabase
      .rpc('get_user_real_stats', { user_id_param: '00000000-0000-0000-0000-000000000000' });

    if (error && error.code === 'PGRST202') {
      console.log('❌ Função get_user_real_stats não existe - precisa ser criada no Supabase SQL Editor');
      console.log('🛠️ Execute este SQL no Supabase:');
      console.log(`
CREATE OR REPLACE FUNCTION get_user_real_stats(user_id_param uuid)
RETURNS TABLE (
    tempo_total_exercicio_min integer,
    registros_dor_mes integer,
    treinos_semana integer,
    streak_dias integer,
    meta_semanal integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(et.tempo_total_min), 0)::integer as tempo_total_exercicio_min,
        
        (SELECT COUNT(*)::integer 
         FROM registros_dor rd 
         WHERE rd.aluno_id = user_id_param 
         AND rd.data_registro >= date_trunc('month', CURRENT_DATE))::integer as registros_dor_mes,
        
        (SELECT COUNT(*)::integer 
         FROM execucoes_treino et2 
         WHERE et2.cliente_id = user_id_param 
         AND et2.finalizado = true
         AND et2.data_execucao >= date_trunc('week', CURRENT_DATE))::integer as treinos_semana,
        
        (SELECT COUNT(DISTINCT DATE(et3.data_execucao))::integer 
         FROM execucoes_treino et3 
         WHERE et3.cliente_id = user_id_param 
         AND et3.finalizado = true
         AND et3.data_execucao >= CURRENT_DATE - INTERVAL '7 days')::integer as streak_dias,
        
        COALESCE((SELECT up.meta_semanal FROM user_profiles up WHERE up.id = user_id_param), 3)::integer as meta_semanal
        
    FROM execucoes_treino et
    WHERE et.cliente_id = user_id_param 
    AND et.finalizado = true
    AND et.data_execucao >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_real_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_real_stats TO anon;
      `);
    } else {
      console.log('✅ Função get_user_real_stats está disponível');
    }
  } catch (error) {
    console.log('❌ Erro ao verificar função:', error.message);
  }

  // 4. Atualizar user_profiles com dados dos users
  console.log('\n4️⃣ Sincronizando user_profiles com users...');
  try {
    // Buscar usuários que não têm profile
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`📋 Encontrados ${users.length} usuários`);

    for (const user of users) {
      try {
        // Verificar se profile existe
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('id, nome, meta_semanal')
          .eq('id', user.id)
          .maybeSingle();

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          console.log(`❌ Erro ao verificar profile de ${user.email}:`, profileCheckError);
          continue;
        }

        if (!existingProfile) {
          // Criar profile
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              nome: user.nome,
              email: user.email,
              tipo: user.tipo,
              meta_semanal: user.tipo === 'aluno' ? 3 : null,
              objetivo: user.tipo === 'aluno' ? 'Melhorar condicionamento físico' : null
            });

          if (insertError) {
            console.log(`❌ Erro ao criar profile para ${user.email}:`, insertError);
          } else {
            console.log(`✅ Profile criado para ${user.email}`);
          }
        } else if (!existingProfile.nome || existingProfile.nome !== user.nome) {
          // Atualizar profile existente
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              nome: user.nome,
              email: user.email,
              meta_semanal: existingProfile.meta_semanal || (user.tipo === 'aluno' ? 3 : null)
            })
            .eq('id', user.id);

          if (updateError) {
            console.log(`❌ Erro ao atualizar profile de ${user.email}:`, updateError);
          } else {
            console.log(`✅ Profile atualizado para ${user.email}`);
          }
        } else {
          console.log(`ℹ️ Profile OK para ${user.email}`);
        }
      } catch (error) {
        console.log(`❌ Erro inesperado para ${user.email}:`, error.message);
      }
    }
  } catch (error) {
    console.log('❌ Erro geral ao sincronizar profiles:', error);
  }

  // 5. Testar funcionalidades
  console.log('\n5️⃣ Testando funcionalidades...');
  
  // Buscar um usuário aluno para teste
  const { data: testUser } = await supabase
    .from('users')
    .select('*')
    .eq('tipo', 'aluno')
    .limit(1)
    .single();

  if (testUser) {
    console.log(`🧪 Testando com usuário: ${testUser.email}`);

    // Testar função de stats
    try {
      const { data: stats, error: statsError } = await supabase
        .rpc('get_user_real_stats', { user_id_param: testUser.id });

      if (statsError) {
        console.log('❌ Erro ao testar função stats:', statsError);
      } else {
        console.log('✅ Função stats funcionando:', stats[0]);
      }
    } catch (error) {
      console.log('❌ Erro ao testar stats:', error.message);
    }

    // Testar atualização de meta
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ meta_semanal: 4 })
        .eq('id', testUser.id);

      if (updateError) {
        console.log('❌ Erro ao testar atualização de meta:', updateError);
      } else {
        console.log('✅ Atualização de meta funcionando');
      }
    } catch (error) {
      console.log('❌ Erro ao testar atualização:', error.message);
    }
  }

  console.log('\n🎉 Aplicação das correções concluída!');
  console.log('\n📝 Resumo:');
  console.log('- ✅ Verificação de tabelas e campos');
  console.log('- ✅ Sincronização de user_profiles');
  console.log('- ✅ Teste de funcionalidades básicas');
  console.log('\n💡 Se houver erros de SQL, execute os comandos mostrados no Supabase SQL Editor');
}

applyDatabaseFixes();