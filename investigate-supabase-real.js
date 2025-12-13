const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function investigateSupabaseStructure() {
  console.log('🔍 INVESTIGANDO ESTRUTURA REAL DO SUPABASE...\n');
  
  try {
    // 1. Descobrir quais tabelas existem
    console.log('1. VERIFICANDO QUAIS TABELAS EXISTEM:');
    const { data: tableData, error: tableError } = await supabase
      .rpc('get_tables_info', {});
    
    if (tableError) {
      console.log('Erro RPC, vou tentar outra abordagem...');
      
      // Tentar acessar tabelas conhecidas
      const tablesToCheck = [
        'users', 'user_profiles', 'treinos', 'profissionais', 'profissional_cliente', 
        'personal_aluno', 'execucoes_treino', 'workout_sessions', 'registros_dor'
      ];
      
      for (const table of tablesToCheck) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(0);
          if (!error) {
            console.log(`✅ ${table} - EXISTE`);
          }
        } catch (e) {
          console.log(`❌ ${table} - NÃO EXISTE`);
        }
      }
    }

    console.log('\n2. ANALISANDO ESTRUTURA DA TABELA USERS:');
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersData && usersData.length > 0) {
        console.log('Campos na tabela users:', Object.keys(usersData[0]));
      }
    } catch (e) {
      console.log('Erro ao acessar users:', e.message);
    }

    console.log('\n3. ANALISANDO ESTRUTURA DA TABELA TREINOS:');
    try {
      const { data: treinosData, error: treinosError } = await supabase
        .from('treinos')
        .select('*')
        .limit(1);
      
      if (treinosData && treinosData.length > 0) {
        console.log('Campos na tabela treinos:', Object.keys(treinosData[0]));
      } else if (treinosData) {
        console.log('Tabela treinos existe mas está vazia');
      }
      
      if (treinosError) {
        console.log('Erro treinos:', treinosError);
      }
    } catch (e) {
      console.log('Erro ao acessar treinos:', e.message);
    }

    console.log('\n4. TESTANDO CRIAÇÃO DE TREINO:');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User autenticado:', !!user);
      
      if (user) {
        const { data, error } = await supabase
          .from('treinos')
          .insert({
            exercicio: 'TESTE',
            descricao: 'teste',
            series: 3,
            repeticoes: '10',
            nivel: 'iniciante',
            categoria: 'teste',
            duracao_min: 30,
            publico: false,
            criado_por: user.id,
          })
          .select();
        
        if (error) {
          console.log('❌ ERRO AO CRIAR TREINO:', error);
        } else {
          console.log('✅ Treino criado com sucesso:', data);
          
          // Deletar o treino de teste
          await supabase.from('treinos').delete().eq('id', data[0].id);
          console.log('Treino teste deletado');
        }
      }
    } catch (e) {
      console.log('Erro no teste de criação:', e.message);
    }

    console.log('\n5. VERIFICANDO TABELAS PROFISSIONAL:');
    try {
      const { data: profData, error: profError } = await supabase
        .from('profissionais')
        .select('*')
        .limit(1);
      
      if (!profError && profData) {
        console.log('✅ Tabela profissionais existe');
        if (profData.length > 0) {
          console.log('Campos:', Object.keys(profData[0]));
        }
      } else {
        console.log('❌ Erro profissionais:', profError);
      }
    } catch (e) {
      console.log('Tabela profissionais não existe ou erro:', e.message);
    }

    try {
      const { data: profClienteData, error: profClienteError } = await supabase
        .from('profissional_cliente')
        .select('*')
        .limit(1);
      
      if (!profClienteError && profClienteData) {
        console.log('✅ Tabela profissional_cliente existe');
        if (profClienteData.length > 0) {
          console.log('Campos:', Object.keys(profClienteData[0]));
        }
      } else {
        console.log('❌ Erro profissional_cliente:', profClienteError);
      }
    } catch (e) {
      console.log('Tabela profissional_cliente não existe ou erro:', e.message);
    }

    try {
      const { data: personalAlunoData, error: personalAlunoError } = await supabase
        .from('personal_aluno')
        .select('*')
        .limit(1);
      
      if (!personalAlunoError && personalAlunoData) {
        console.log('✅ Tabela personal_aluno existe');
        if (personalAlunoData.length > 0) {
          console.log('Campos:', Object.keys(personalAlunoData[0]));
        }
      } else {
        console.log('❌ Erro personal_aluno:', personalAlunoError);
      }
    } catch (e) {
      console.log('Tabela personal_aluno não existe ou erro:', e.message);
    }

    console.log('\n6. VERIFICANDO EXECUÇÕES:');
    try {
      const { data: execData, error: execError } = await supabase
        .from('execucoes_treino')
        .select('*')
        .limit(1);
      
      if (!execError && execData) {
        console.log('✅ Tabela execucoes_treino existe');
        if (execData.length > 0) {
          console.log('Campos:', Object.keys(execData[0]));
        }
      } else {
        console.log('❌ Erro execucoes_treino:', execError);
      }
    } catch (e) {
      console.log('Tabela execucoes_treino não existe ou erro:', e.message);
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

investigateSupabaseStructure();