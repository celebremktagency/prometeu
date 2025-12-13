const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLScript() {
  try {
    console.log('🔄 Lendo script SQL...');
    
    // Ler o arquivo SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'SCRIPT_NOVAS_FUNCIONALIDADES.sql'), 'utf8');
    
    console.log('🚀 Executando script no Supabase...');
    
    // Dividir o script em comandos individuais (por `;` seguido de quebra de linha)
    const commands = sqlScript
      .split(';\n')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 Total de comandos SQL: ${commands.length}`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.trim()) {
        try {
          console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
          
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: command + ';'
          });
          
          if (error) {
            console.log(`❌ Erro no comando ${i + 1}:`, error.message);
            // Continuar mesmo com erro, algumas tabelas podem já existir
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (err) {
          console.log(`❌ Erro no comando ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Script executado completamente!');
    
    // Testar algumas consultas para verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'user_settings', 
        'notifications', 
        'ratings', 
        'workout_feedback', 
        'user_goals',
        'health_assessments',
        'subscription_plans',
        'progress_reports',
        'faqs',
        'support_tickets',
        'data_exports'
      ]);
    
    if (tablesError) {
      console.log('❌ Erro ao verificar tabelas:', tablesError);
    } else {
      console.log('📊 Tabelas encontradas:', tables?.map(t => t.table_name));
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar o script
executeSQLScript();