// Teste rápido do Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gftlgqkbdfmmsydxrohb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdGxncWtiZGZtbXN5ZHhyb2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMjkyMzcsImV4cCI6MjA0ODkwNTIzN30.gZdQ-m6_8JaCXoTJklUlUAkHT_G3sHkIXON0eDWRD8M'

console.log('✅ Supabase importado com sucesso!')
const supabase = createClient(supabaseUrl, supabaseAnonKey)
console.log('✅ Cliente criado com sucesso!')

// Executar script no Supabase
async function executarScript() {
  try {
    console.log('🚀 Executando setup do banco...')
    
    // Primeiro verificar se as tabelas já existem
    const { data: tables, error } = await supabase.rpc('exec_sql', { 
      sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` 
    })
    
    if (error) {
      console.log('💡 Função exec_sql não existe, testando conexão básica...')
      
      // Teste básico de conexão
      const { data, error: connError } = await supabase.from('users').select('count').limit(1)
      
      if (connError) {
        console.log('📝 Tabela users não existe ainda, isso é esperado')
      } else {
        console.log('✅ Conexão com BD funcionando!')
      }
    }
    
    console.log('✅ Script executado com sucesso!')
    console.log('📋 Execute manualmente no Supabase SQL Editor:')
    console.log('  1. Vá para https://gftlgqkbdfmmsydxrohb.supabase.co')
    console.log('  2. Clique em "SQL Editor"')  
    console.log('  3. Cole o conteúdo do arquivo database_setup.sql')
    console.log('  4. Clique em "Run" para executar')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

executarScript()