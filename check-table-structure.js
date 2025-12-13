const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

const keyTables = [
  'users',
  'user_profiles', 
  'treinos',
  'exercises',
  'workout_templates',
  'execucoes_treino',
  'personal_aluno',
  'registros_dor'
];

async function checkTableStructures() {
  console.log('📐 Verificando estrutura das tabelas principais...\n');
  
  for (const table of keyTables) {
    try {
      console.log(`\n=== ${table.toUpperCase()} ===`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ERRO: ${error.message}`);
        continue;
      }
      
      if (data && data.length > 0) {
        const fields = Object.keys(data[0]);
        console.log(`📋 Campos encontrados (${fields.length}):`);
        fields.forEach(field => console.log(`  - ${field}`));
        
        // Show sample data for some key fields
        console.log('📋 Dados de exemplo:');
        const sampleData = data[0];
        Object.keys(sampleData).slice(0, 8).forEach(key => {
          let value = sampleData[key];
          if (typeof value === 'string' && value.length > 50) {
            value = value.substring(0, 50) + '...';
          }
          console.log(`  ${key}: ${value}`);
        });
      } else {
        console.log('📋 Tabela existe mas está vazia - buscando estrutura...');
        
        // Try to get table info from information_schema if available
        try {
          const { data: infoData } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', table)
            .eq('table_schema', 'public');
            
          if (infoData && infoData.length > 0) {
            console.log(`📋 Campos da estrutura (${infoData.length}):`);
            infoData.forEach(col => {
              console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
          }
        } catch (infoError) {
          console.log('⚠️ Não foi possível obter estrutura via information_schema');
        }
      }
      
    } catch (error) {
      console.log(`❌ EXCEPTION: ${error.message}`);
    }
  }
}

checkTableStructures();