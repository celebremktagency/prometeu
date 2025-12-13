const { createClient } = require('@supabase/supabase-js');

// Working configuration from .env
const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function generateCompleteReport() {
  console.log('🔍 COMPREHENSIVE SUPABASE DATABASE REPORT');
  console.log('==========================================');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log('');

  const report = {
    connection: true,
    tables: {},
    authentication: {},
    rls: {},
    data_summary: {},
    recommendations: []
  };

  try {
    // 1. Comprehensive table scan
    console.log('📋 1. SCANNING ALL TABLES');
    console.log('=========================');

    const allTables = [
      'user_profiles', 'exercises', 'workout_templates', 'workout_exercises',
      'personal_aluno', 'treinos_atribuidos', 'workout_sessions', 'workout_feedback',
      'professional_reports', 'client_exams', 'comunidade_posts', 'comunidade_comentarios',
      'comunidade_curtidas', 'user_streaks', 'treinos_logs', 'dores_logs', 'pagamentos',
      // Legacy tables to check
      'usuarios', 'treinos', 'exercicios', 'registros_dor', 'insights',
      'execucoes_treino', 'feedback_treino'
    ];

    for (const tableName of allTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ ${tableName.padEnd(20)} | ${count || 0} records`);
          report.tables[tableName] = { 
            exists: true, 
            recordCount: count || 0,
            accessible: true
          };
        }
      } catch (err) {
        if (err.message.includes('permission denied')) {
          console.log(`🔒 ${tableName.padEnd(20)} | RLS Protected`);
          report.tables[tableName] = { 
            exists: true, 
            recordCount: 'unknown',
            accessible: false,
            rls: 'enabled'
          };
        }
      }
    }

    // 2. Get detailed structure of key tables
    console.log('\n📊 2. TABLE STRUCTURES & SAMPLE DATA');
    console.log('===================================');

    const keyTables = Object.keys(report.tables).filter(t => 
      report.tables[t].exists && report.tables[t].accessible && report.tables[t].recordCount > 0
    );

    for (const tableName of keyTables.slice(0, 5)) { // Limit to first 5 tables with data
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data && data.length > 0) {
          console.log(`\n📋 ${tableName.toUpperCase()}`);
          console.log(`Records: ${report.tables[tableName].recordCount}`);
          console.log(`Columns: ${Object.keys(data[0]).join(', ')}`);
          
          // Store structure info
          report.tables[tableName].columns = Object.keys(data[0]);
          report.tables[tableName].sampleData = data[0];
        }
      } catch (err) {
        console.log(`Error getting structure for ${tableName}: ${err.message}`);
      }
    }

    // 3. Test Authentication
    console.log('\n🔐 3. AUTHENTICATION STATUS');
    console.log('===========================');

    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();
    
    report.authentication = {
      hasSession: !!sessionData?.session,
      hasUser: !!userData?.user,
      userEmail: userData?.user?.email || 'Not authenticated'
    };

    console.log(`Session: ${sessionData?.session ? '✅ Active' : '❌ None'}`);
    console.log(`User: ${userData?.user ? `✅ ${userData.user.email}` : '❌ Not authenticated'}`);

    // 4. RLS Analysis
    console.log('\n🛡️  4. ROW LEVEL SECURITY ANALYSIS');
    console.log('=================================');

    let rlsProtected = 0;
    let rlsDisabled = 0;

    for (const [tableName, tableInfo] of Object.entries(report.tables)) {
      if (tableInfo.exists) {
        if (tableInfo.accessible === false) {
          rlsProtected++;
          console.log(`🔒 ${tableName}: RLS ENABLED`);
        } else {
          rlsDisabled++;
          console.log(`🔓 ${tableName}: Accessible without auth`);
        }
      }
    }

    // 5. Data Summary
    console.log('\n📈 5. DATA SUMMARY');
    console.log('=================');

    const tablesWithData = Object.entries(report.tables)
      .filter(([name, info]) => info.exists && info.recordCount > 0)
      .sort((a, b) => b[1].recordCount - a[1].recordCount);

    console.log(`Total tables found: ${Object.keys(report.tables).length}`);
    console.log(`Tables with data: ${tablesWithData.length}`);
    console.log(`RLS protected tables: ${rlsProtected}`);
    console.log(`Publicly accessible tables: ${rlsDisabled}`);

    if (tablesWithData.length > 0) {
      console.log('\nTables by record count:');
      tablesWithData.forEach(([name, info]) => {
        console.log(`  ${name}: ${info.recordCount} records`);
      });
    }

    // 6. Check for specific app functionality
    console.log('\n⚡ 6. APPLICATION FUNCTIONALITY CHECK');
    console.log('===================================');

    const functionalityChecks = [
      {
        feature: 'User Management',
        tables: ['user_profiles'],
        status: report.tables.user_profiles?.exists && report.tables.user_profiles?.recordCount > 0
      },
      {
        feature: 'Exercise Library',
        tables: ['exercises'],
        status: report.tables.exercises?.exists
      },
      {
        feature: 'Workout System',
        tables: ['workout_templates', 'workout_exercises'],
        status: report.tables.workout_templates?.exists && report.tables.workout_exercises?.exists
      },
      {
        feature: 'Professional-Client',
        tables: ['personal_aluno', 'treinos_atribuidos'],
        status: report.tables.personal_aluno?.exists && report.tables.treinos_atribuidos?.exists
      },
      {
        feature: 'Workout Tracking',
        tables: ['workout_sessions', 'treinos_logs'],
        status: report.tables.workout_sessions?.exists || report.tables.treinos_logs?.exists
      },
      {
        feature: 'Pain Tracking',
        tables: ['dores_logs'],
        status: report.tables.dores_logs?.exists
      },
      {
        feature: 'Community Features',
        tables: ['comunidade_posts', 'comunidade_comentarios'],
        status: report.tables.comunidade_posts?.exists && report.tables.comunidade_comentarios?.exists
      },
      {
        feature: 'Streak System',
        tables: ['user_streaks'],
        status: report.tables.user_streaks?.exists
      }
    ];

    functionalityChecks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`${icon} ${check.feature}: ${check.status ? 'Ready' : 'Not configured'}`);
    });

    // 7. Generate recommendations
    console.log('\n🎯 7. RECOMMENDATIONS');
    console.log('====================');

    const recommendations = [];

    // Check if main tables exist but are empty
    const emptyImportantTables = ['exercises', 'workout_templates'].filter(
      table => report.tables[table]?.exists && report.tables[table]?.recordCount === 0
    );

    if (emptyImportantTables.length > 0) {
      recommendations.push(`📝 Populate empty important tables: ${emptyImportantTables.join(', ')}`);
    }

    // Check for missing tables
    const expectedTables = ['exercises', 'workout_templates', 'workout_sessions', 'user_streaks'];
    const missingTables = expectedTables.filter(table => !report.tables[table]?.exists);

    if (missingTables.length > 0) {
      recommendations.push(`🏗️  Create missing tables: ${missingTables.join(', ')}`);
    }

    // Check RLS
    if (rlsDisabled > rlsProtected) {
      recommendations.push('🔒 Review RLS policies - many tables are publicly accessible');
    }

    // Check authentication
    if (!report.authentication.hasUser) {
      recommendations.push('🔑 Set up authentication for full functionality testing');
    }

    recommendations.forEach(rec => console.log(rec));

    if (recommendations.length === 0) {
      console.log('🎉 Database appears well-configured! No immediate issues detected.');
    }

    // 8. Final summary
    console.log('\n📋 FINAL SUMMARY');
    console.log('================');
    console.log(`✅ Database connection: Working`);
    console.log(`📊 Total tables: ${Object.keys(report.tables).length}`);
    console.log(`📈 Tables with data: ${tablesWithData.length}`);
    console.log(`👤 Authentication: ${report.authentication.hasUser ? 'Active user' : 'Anonymous'}`);
    console.log(`🔒 Security: ${rlsProtected} protected, ${rlsDisabled} public`);
    console.log(`🚀 App readiness: ${functionalityChecks.filter(c => c.status).length}/${functionalityChecks.length} features ready`);

    return report;

  } catch (error) {
    console.error('❌ Critical error during analysis:', error.message);
    return { error: error.message };
  }
}

// Run the complete analysis
generateCompleteReport()
  .then(result => {
    if (!result.error) {
      console.log('\n✅ Complete database analysis finished successfully!');
    }
  })
  .catch(err => {
    console.error('❌ Analysis failed:', err);
  });