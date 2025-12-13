const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeRLSPolicies() {
  console.log('🔧 Aplicando políticas RLS...\n');

  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./CREATE_RLS_POLICIES.sql', 'utf8');
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 Encontrados ${commands.length} comandos SQL para executar\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('CREATE POLICY') || command.includes('ALTER TABLE')) {
        const policyName = command.match(/"([^"]*)"/) ? command.match(/"([^"]*)"/)[1] : `Comando ${i+1}`;
        
        console.log(`🔄 Executando: ${policyName}`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: command + ';' });
          
          if (error) {
            console.error(`❌ Erro: ${error.message}`);
            errorCount++;
          } else {
            console.log(`✅ Sucesso`);
            successCount++;
          }
        } catch (err) {
          console.error(`❌ Erro de execução: ${err.message}`);
          errorCount++;
        }
        
        console.log(''); // Linha em branco
      }
    }
    
    console.log(`📊 Resultado final:`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Todas as políticas RLS foram aplicadas com sucesso!');
    } else {
      console.log('\n⚠️ Algumas políticas falharam. Verifique os erros acima.');
    }

  } catch (error) {
    console.error('❌ Erro ao processar arquivo SQL:', error);
  }
}

executeRLSPolicies();
