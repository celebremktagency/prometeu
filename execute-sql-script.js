const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLScript() {
  console.log('🚀 Executando script SQL para estruturar banco...\n');

  try {
    // Ler o script SQL
    const sqlScript = fs.readFileSync('SCRIPT_SISTEMA_PROFISSIONAL.sql', 'utf8');
    
    // Dividir em comandos individuais (separados por ';')
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Encontrados ${commands.length} comandos SQL para executar\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Pular comentários e comandos vazios
      if (command.startsWith('--') || command.trim() === '') {
        continue;
      }

      console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command
        });

        if (error) {
          console.log(`❌ Erro no comando ${i + 1}: ${error.message}`);
          errorCount++;
          
          // Para comandos de criação de tabela, continuar mesmo se já existir
          if (error.message.includes('already exists')) {
            console.log(`   ℹ️ Objeto já existe, continuando...`);
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Erro inesperado no comando ${i + 1}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Resumo da execução:`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);

    // Verificar se as estruturas foram criadas
    console.log('\n🔍 Verificando estruturas criadas...');
    
    const tablesToCheck = [
      'profissionais',
      'profissional_cliente', 
      'exames_documentos',
      'treinos_atribuidos',
      'execucoes_treino',
      'feedback_treino'
    ];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (!error) {
          console.log(`✅ Tabela ${table} acessível`);
        } else {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar ${table}:`, error.message);
      }
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('❌ Arquivo SCRIPT_SISTEMA_PROFISSIONAL.sql não encontrado');
      console.log('💡 Vou tentar criar as estruturas básicas manualmente...\n');
      
      await createBasicStructures();
    } else {
      console.error('❌ Erro ao executar script:', error);
    }
  }
}

async function createBasicStructures() {
  console.log('🔨 Criando estruturas básicas...\n');

  const basicCommands = [
    // Tabela de registros de dor
    `CREATE TABLE IF NOT EXISTS dor_registros (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      aluno_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      localizacao text NOT NULL,
      nivel_dor integer CHECK (nivel_dor BETWEEN 0 AND 10),
      data_registro timestamp with time zone DEFAULT now(),
      observacoes text,
      tipo_registro text DEFAULT 'manual',
      created_at timestamp with time zone DEFAULT now()
    )`,
    
    // Índices para dor_registros
    `CREATE INDEX IF NOT EXISTS idx_dor_aluno ON dor_registros(aluno_id)`,
    `CREATE INDEX IF NOT EXISTS idx_dor_data ON dor_registros(data_registro)`,
    
    // RLS para dor_registros
    `ALTER TABLE dor_registros ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "Users can manage their own pain records" ON dor_registros
      FOR ALL USING (aluno_id = auth.uid())`,
    
    // Atualizar user_profiles se não existir dados
    `INSERT INTO user_profiles (id, nome, email, tipo, created_at)
     SELECT id, nome, email, tipo, created_at 
     FROM users 
     WHERE id NOT IN (SELECT id FROM user_profiles)
     ON CONFLICT (id) DO NOTHING`,
     
    // Política permissiva para user_profiles
    `DROP POLICY IF EXISTS "Users can view and update own profile" ON user_profiles`,
    `CREATE POLICY "Users can manage own profile" ON user_profiles
      FOR ALL USING (id = auth.uid())`
  ];

  for (let i = 0; i < basicCommands.length; i++) {
    const command = basicCommands[i];
    
    console.log(`⚡ Executando comando básico ${i + 1}/${basicCommands.length}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: command
      });

      if (error) {
        console.log(`❌ Erro: ${error.message}`);
        
        // Tentar método alternativo para alguns comandos
        if (command.includes('CREATE TABLE') && error.message.includes('does not exist')) {
          console.log('   ℹ️ Função exec_sql não disponível, tentando método alternativo...');
          // Não podemos executar SQL direto sem função customizada
        }
      } else {
        console.log(`✅ Comando executado com sucesso`);
      }
    } catch (error) {
      console.log(`❌ Erro inesperado:`, error.message);
    }
  }
}

executeSQLScript();