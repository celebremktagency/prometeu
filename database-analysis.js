const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gftlgqkbdfmmsydxrohb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdGxncWtiZGZtbXN5ZHhyb2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMjkyMzcsImV4cCI6MjA0ODkwNTIzN30.gZdQ-m6_8JaCXoTJklUlUAkHT_G3sHkIXON0eDWRD8M';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function analyzeDatabaseState() {
  console.log('🔍 SUPABASE DATABASE ANALYSIS REPORT');
  console.log('====================================\n');

  const report = {
    connection: false,
    tables: {},
    authentication: {},
    rls: {},
    summary: {}
  };

  try {
    // 1. Test basic connection
    console.log('1️⃣ Testing Connection...');
    const { data: testData, error: testError } = await supabase
      .from('usuarios')
      .select('count')
      .limit(0);
    
    if (testError) {
      if (testError.message.includes('relation') && testError.message.includes('does not exist')) {
        console.log('✅ Connection successful - Database accessible but table "usuarios" does not exist');
        report.connection = true;
      } else {
        console.log(`⚠️  Connection issue: ${testError.message}`);
        report.connection = false;
      }
    } else {
      console.log('✅ Connection successful - Table "usuarios" exists');
      report.connection = true;
    }

    // 2. Check common tables
    console.log('\n2️⃣ Checking Common Tables...');
    const commonTables = [
      'usuarios', 'user_profiles', 'profiles', 'users',
      'treinos', 'workouts', 'exercises', 'exercicios',
      'dor_registros', 'pain_records',
      'insights', 'progress'
    ];

    for (const tableName of commonTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`❌ ${tableName}: Table does not exist`);
            report.tables[tableName] = { exists: false, error: 'Table not found' };
          } else {
            console.log(`⚠️  ${tableName}: ${error.message}`);
            report.tables[tableName] = { exists: false, error: error.message };
          }
        } else {
          console.log(`✅ ${tableName}: EXISTS (${count || 0} records)`);
          report.tables[tableName] = { exists: true, recordCount: count || 0 };
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
        report.tables[tableName] = { exists: false, error: err.message };
      }
    }

    // 3. Get sample data from existing tables
    console.log('\n3️⃣ Sample Data from Existing Tables...');
    for (const [tableName, tableInfo] of Object.entries(report.tables)) {
      if (tableInfo.exists && tableInfo.recordCount > 0) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(2);
          
          if (error) {
            console.log(`⚠️  ${tableName} sample data: ${error.message}`);
          } else if (data && data.length > 0) {
            console.log(`\n📊 ${tableName} structure (sample):`);
            console.log('   Columns:', Object.keys(data[0]).join(', '));
            console.log('   Sample record:', JSON.stringify(data[0], null, 4));
            report.tables[tableName].sampleData = data[0];
            report.tables[tableName].columns = Object.keys(data[0]);
          }
        } catch (err) {
          console.log(`❌ ${tableName} sample: ${err.message}`);
        }
      }
    }

    // 4. Test Authentication
    console.log('\n4️⃣ Testing Authentication...');
    
    // Check current session
    const { data: sessionData } = await supabase.auth.getSession();
    report.authentication.hasSession = !!sessionData?.session;
    console.log(`Session status: ${sessionData?.session ? 'Active' : 'No session'}`);

    // Check current user
    const { data: userData } = await supabase.auth.getUser();
    report.authentication.hasUser = !!userData?.user;
    console.log(`User status: ${userData?.user ? `Logged in as ${userData.user.email}` : 'Not authenticated'}`);

    // Try to access auth.users (will fail with anon key, which is expected)
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('*')
        .limit(1);
      
      if (authError) {
        console.log(`Auth system: ${authError.message.includes('permission denied') ? 'Protected (normal)' : authError.message}`);
        report.authentication.authSystemProtected = true;
      } else {
        console.log('⚠️  Auth system: Unexpectedly accessible');
        report.authentication.authSystemProtected = false;
      }
    } catch (err) {
      console.log(`Auth system: Protected (${err.message})`);
      report.authentication.authSystemProtected = true;
    }

    // 5. Check RLS Policies
    console.log('\n5️⃣ Testing Row Level Security (RLS)...');
    for (const [tableName, tableInfo] of Object.entries(report.tables)) {
      if (tableInfo.exists) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (error) {
            if (error.message.includes('permission denied') || error.message.includes('RLS')) {
              console.log(`🔒 ${tableName}: RLS ENABLED (access denied without auth)`);
              report.rls[tableName] = 'enabled';
            } else {
              console.log(`❓ ${tableName}: ${error.message}`);
              report.rls[tableName] = 'error';
            }
          } else {
            console.log(`🔓 ${tableName}: RLS DISABLED or PERMISSIVE (accessible without auth)`);
            report.rls[tableName] = 'disabled_or_permissive';
          }
        } catch (err) {
          console.log(`❓ ${tableName}: ${err.message}`);
          report.rls[tableName] = 'error';
        }
      }
    }

    // 6. Generate Summary
    console.log('\n📋 SUMMARY REPORT');
    console.log('=================');
    
    const existingTables = Object.entries(report.tables)
      .filter(([name, info]) => info.exists)
      .map(([name, info]) => ({ name, records: info.recordCount }));
    
    const tablesWithData = existingTables.filter(t => t.records > 0);
    const emptyTables = existingTables.filter(t => t.records === 0);
    
    console.log(`\n📊 Database Status:`);
    console.log(`   - Connection: ${report.connection ? '✅ Working' : '❌ Failed'}`);
    console.log(`   - Total tables found: ${existingTables.length}`);
    console.log(`   - Tables with data: ${tablesWithData.length}`);
    console.log(`   - Empty tables: ${emptyTables.length}`);
    
    if (tablesWithData.length > 0) {
      console.log(`\n📈 Tables with data:`);
      tablesWithData.forEach(t => console.log(`   - ${t.name}: ${t.records} records`));
    }
    
    if (emptyTables.length > 0) {
      console.log(`\n📭 Empty tables:`);
      emptyTables.forEach(t => console.log(`   - ${t.name}`));
    }
    
    console.log(`\n🔐 Authentication:`);
    console.log(`   - Auth system: ${report.authentication.authSystemProtected ? '✅ Protected' : '⚠️ Exposed'}`);
    console.log(`   - Current session: ${report.authentication.hasSession ? 'Active' : 'None'}`);
    
    const rlsEnabledTables = Object.entries(report.rls).filter(([name, status]) => status === 'enabled').length;
    const rlsDisabledTables = Object.entries(report.rls).filter(([name, status]) => status === 'disabled_or_permissive').length;
    
    console.log(`\n🛡️  Row Level Security:`);
    console.log(`   - Tables with RLS enabled: ${rlsEnabledTables}`);
    console.log(`   - Tables with RLS disabled/permissive: ${rlsDisabledTables}`);
    
    // Save detailed report
    report.summary = {
      connection: report.connection,
      totalTables: existingTables.length,
      tablesWithData: tablesWithData.length,
      emptyTables: emptyTables.length,
      authProtected: report.authentication.authSystemProtected,
      rlsEnabledTables: rlsEnabledTables
    };

    console.log('\n✅ Analysis complete!');
    return report;

  } catch (error) {
    console.error('\n❌ Critical error during analysis:', error.message);
    return { error: error.message };
  }
}

// Run analysis
analyzeDatabaseState()
  .then(result => {
    console.log('\n💾 Analysis complete. Report generated.');
  })
  .catch(err => {
    console.error('Analysis failed:', err);
  });