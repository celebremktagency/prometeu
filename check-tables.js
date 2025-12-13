const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
  'users',
  'user_profiles', 
  'treinos',
  'exercicios',
  'exercises',
  'workout_templates',
  'workout_sessions',
  'execucoes_treino', 
  'treinos_atribuidos',
  'personal_aluno',
  'registros_dor',
  'dores',
  'insights',
  'user_streaks',
  'notifications',
  'comunidade_posts',
  'user_goals',
  'support_tickets',
  'workout_libraries',
  'exercise_categories',
  'user_settings'
];

async function checkTables() {
  console.log('🔍 Verificando quais tabelas existem no Supabase...\n');
  
  const existingTables = [];
  const missingTables = [];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === 'PGRST106') {
          missingTables.push(table);
          console.log(`❌ ${table} - NÃO EXISTE`);
        } else {
          console.log(`⚠️  ${table} - ERRO: ${error.message}`);
        }
      } else {
        existingTables.push(table);
        console.log(`✅ ${table} - EXISTS (${data.length} records checked)`);
      }
    } catch (error) {
      console.log(`❌ ${table} - EXCEPTION: ${error.message}`);
      missingTables.push(table);
    }
  }
  
  console.log('\n📊 RESUMO:');
  console.log(`✅ Tabelas existentes: ${existingTables.length}`);
  console.log(existingTables.join(', '));
  console.log(`❌ Tabelas em falta: ${missingTables.length}`);
  console.log(missingTables.join(', '));
}

checkTables();