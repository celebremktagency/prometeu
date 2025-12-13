const { createClient } = require('@supabase/supabase-js');

// URLs from different sources
const providedUrl = 'https://gftlgqkbdfmmsydxrohb.supabase.co';
const envUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const envKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';
const providedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdGxncWtiZGZtbXN5ZHhyb2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMjkyMzcsImV4cCI6MjA0ODkwNTIzN30.gZdQ-m6_8JaCXoTJklUlUAkHT_G3sHkIXON0eDWRD8M';

async function analyzeWithBothURLs() {
  console.log('🔍 SUPABASE DATABASE STATE ANALYSIS');
  console.log('===================================');
  console.log('⚠️  CRITICAL ISSUE DETECTED: URL MISMATCH');
  console.log('');
  console.log('URL provided by user:', providedUrl);
  console.log('URL in .env file:     ', envUrl);
  console.log('');

  // Test both URLs
  const configurations = [
    { name: 'ENV Configuration', url: envUrl, key: envKey },
    { name: 'Provided Configuration', url: providedUrl, key: providedKey }
  ];

  for (const config of configurations) {
    console.log(`\n🧪 Testing: ${config.name}`);
    console.log(`URL: ${config.url}`);
    console.log(`Key: ${config.key.substring(0, 50)}...`);
    console.log('-'.repeat(50));

    try {
      const supabase = createClient(config.url, config.key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });

      // Test basic connection with a simple query
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(0);
      
      if (testError) {
        if (testError.message.includes('relation') && testError.message.includes('does not exist')) {
          console.log('✅ Connection: SUCCESSFUL - Database accessible');
          console.log('❌ Table: user_profiles does not exist');
          
          // Test expected tables from SQL analysis
          await testTablesExistence(supabase, config.name);
          
        } else if (testError.message.includes('fetch failed') || testError.message.includes('network')) {
          console.log('❌ Connection: FAILED - Network/DNS issue');
        } else if (testError.message.includes('Invalid API key')) {
          console.log('❌ Connection: FAILED - Invalid API key');
        } else if (testError.message.includes('permission denied')) {
          console.log('✅ Connection: SUCCESSFUL - RLS protection active');
        } else {
          console.log(`⚠️  Connection: ${testError.message}`);
        }
      } else {
        console.log('✅ Connection: SUCCESSFUL - user_profiles table exists');
        await getTableInfo(supabase, config.name);
      }

    } catch (error) {
      console.log(`❌ Connection: FAILED - ${error.message}`);
    }
  }

  // Analyze project structure
  console.log('\n📁 PROJECT STRUCTURE ANALYSIS');
  console.log('=============================');
  analyzeProjectStructure();
}

async function testTablesExistence(supabase, configName) {
  console.log('\n🔍 Testing table existence...');
  
  const expectedTables = [
    'user_profiles', 'exercises', 'workout_templates', 'workout_exercises',
    'personal_aluno', 'treinos_atribuidos', 'workout_sessions', 'workout_feedback',
    'treinos_logs', 'dores_logs', 'comunidade_posts', 'user_streaks',
    // Legacy tables
    'usuarios', 'treinos', 'exercicios', 'registros_dor', 'insights'
  ];

  let existingTables = [];
  let tablesWithData = [];

  for (const tableName of expectedTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`✅ ${tableName}: EXISTS (${count || 0} records)`);
        existingTables.push({ name: tableName, count: count || 0 });
        if (count > 0) {
          tablesWithData.push({ name: tableName, count });
        }
      }
    } catch (err) {
      // Table doesn't exist, ignore
    }
  }

  console.log(`\nSUMMARY for ${configName}:`);
  console.log(`📊 Existing tables: ${existingTables.length}`);
  console.log(`📈 Tables with data: ${tablesWithData.length}`);
  
  if (tablesWithData.length > 0) {
    console.log('\n📋 Tables containing data:');
    tablesWithData.forEach(table => {
      console.log(`   - ${table.name}: ${table.count} records`);
    });
  }

  return { existingTables, tablesWithData };
}

async function getTableInfo(supabase, configName) {
  console.log('\n📊 Getting detailed table information...');
  
  try {
    // Try to get sample data from user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(2);
    
    if (error) {
      console.log(`Table access error: ${error.message}`);
    } else if (data) {
      console.log(`✅ user_profiles: ${data.length} sample records retrieved`);
      if (data.length > 0) {
        console.log('Columns:', Object.keys(data[0]).join(', '));
        console.log('Sample record:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.log(`Error getting table info: ${err.message}`);
  }
}

function analyzeProjectStructure() {
  console.log('\n📄 SQL FILES ANALYSIS');
  console.log('Based on the numerous SQL files in the project:');
  console.log('');
  console.log('🎯 EXPECTED DATABASE STRUCTURE:');
  console.log('');
  console.log('📋 Core Tables:');
  console.log('   • user_profiles - User profile information');
  console.log('   • exercises - Exercise definitions with YouTube links');
  console.log('   • workout_templates - Workout/training templates');
  console.log('   • workout_exercises - Many-to-many: workouts ↔ exercises');
  console.log('   • personal_aluno - Personal trainer ↔ client relationships');
  console.log('   • treinos_atribuidos - Assigned workouts to clients');
  console.log('');
  console.log('🏃 Execution & Tracking:');
  console.log('   • workout_sessions - Individual workout executions');
  console.log('   • workout_feedback - Exercise-specific feedback');
  console.log('   • treinos_logs - Workout history logs');
  console.log('   • dores_logs - Pain level tracking');
  console.log('   • user_streaks - Achievement and consistency tracking');
  console.log('');
  console.log('👥 Community & Professional:');
  console.log('   • comunidade_posts - Community posts');
  console.log('   • comunidade_comentarios - Comments on posts');
  console.log('   • comunidade_curtidas - Like system');
  console.log('   • professional_reports - Professional reports');
  console.log('   • client_exams - Medical exams upload');
  console.log('   • pagamentos - Payment tracking');
  console.log('');
  console.log('🔒 SECURITY FEATURES:');
  console.log('   • Row Level Security (RLS) enabled on all tables');
  console.log('   • User-specific data access policies');
  console.log('   • Public/private content separation');
  console.log('');
  console.log('🚀 ADVANCED FEATURES:');
  console.log('   • YouTube video integration for exercises');
  console.log('   • Automatic streak calculation');
  console.log('   • Comment count triggers');
  console.log('   • Calendar-based workout scheduling');
  console.log('   • Pain level tracking before/after workouts');
  console.log('   • Professional-client relationship management');
  console.log('');
  console.log('📝 MIGRATION STATUS:');
  console.log('   Based on the many SQL files, it appears there have been');
  console.log('   multiple iterations and attempts to set up the database.');
  console.log('   The latest comprehensive script is:');
  console.log('   "SCRIPT_SISTEMA_COMPLETO_FINAL.sql"');
}

// Run the analysis
analyzeWithBothURLs()
  .then(() => {
    console.log('\n✅ Analysis completed!');
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('');
    console.log('1. Verify which Supabase project is the correct one:');
    console.log('   - Check your Supabase dashboard');
    console.log('   - Ensure the URL matches your current project');
    console.log('');
    console.log('2. If using the ENV URL, run the latest SQL script:');
    console.log('   - Execute SCRIPT_SISTEMA_COMPLETO_FINAL.sql');
    console.log('   - Or EXECUTE_NO_SUPABASE_AGORA.sql for updates');
    console.log('');
    console.log('3. Update your Supabase client configuration:');
    console.log('   - Ensure app/src/services/supabaseClient.ts uses correct URL');
    console.log('   - Verify .env file has the right credentials');
  })
  .catch(err => {
    console.error('❌ Analysis failed:', err);
  });