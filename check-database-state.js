const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gftlgqkbdfmmsydxrohb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdGxncWtiZGZtbXN5ZHhyb2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMjkyMzcsImV4cCI6MjA0ODkwNTIzN30.gZdQ-m6_8JaCXoTJklUlUAkHT_G3sHkIXON0eDWRD8M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseState() {
  console.log('🔍 SUPABASE DATABASE STATE ANALYSIS');
  console.log('=====================================\n');

  try {
    // 1. Test connection
    console.log('1. Testing Connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .limit(1);
    
    if (connectionError) {
      console.log('❌ Connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Connection successful\n');

    // 2. List all tables in public schema
    console.log('2. Tables in public schema:');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_public_tables');

    if (tablesError) {
      console.log('⚠️ Could not fetch tables via RPC. Trying alternative method...');
      
      // Try alternative method using information_schema
      const { data: altTables, error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');
      
      if (altError) {
        console.log('❌ Could not fetch tables:', altError.message);
      } else {
        console.log('Tables found:', altTables.map(t => t.table_name));
      }
    } else {
      console.log('Tables found:', tables);
    }

    // 3. Check specific tables we expect
    const expectedTables = ['usuarios', 'treinos', 'exercicios', 'dor_registros', 'insights'];
    console.log('\n3. Checking expected tables:');
    
    for (const tableName of expectedTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: exists, ${count} records`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }

    // 4. Get sample data from existing tables
    console.log('\n4. Sample data from existing tables:');
    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log(`\n📊 ${tableName} sample data:`);
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }

    // 5. Check authentication
    console.log('\n5. Testing Authentication:');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth session:', authData?.session ? 'Active session' : 'No active session');
    
    // Try to get user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('Auth user error:', userError.message);
    } else {
      console.log('Current user:', userData?.user ? userData.user.email : 'No user');
    }

    // 6. Check RLS policies
    console.log('\n6. Checking RLS policies:');
    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error && error.message.includes('permission denied')) {
          console.log(`🔒 ${tableName}: RLS is active (permission denied without auth)`);
        } else if (error) {
          console.log(`❓ ${tableName}: ${error.message}`);
        } else {
          console.log(`🔓 ${tableName}: Accessible without auth (RLS might be disabled)`);
        }
      } catch (err) {
        console.log(`❓ ${tableName}: ${err.message}`);
      }
    }

    // 7. Check specific auth tables
    console.log('\n7. Checking auth system:');
    try {
      const { data: authUsers, error: authUsersError } = await supabase
        .from('auth.users')
        .select('*')
        .limit(1);
      
      if (authUsersError) {
        console.log('Auth users table:', authUsersError.message);
      } else {
        console.log('✅ Auth system accessible');
      }
    } catch (err) {
      console.log('Auth system check failed:', err.message);
    }

    console.log('\n=====================================');
    console.log('🏁 Database analysis complete');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Add RPC function check
async function createHelperRPC() {
  console.log('\n📝 Creating helper RPC function...');
  
  const createRPCQuery = `
    create or replace function get_public_tables()
    returns table(table_name text, row_count bigint)
    language plpgsql
    security definer
    as $$
    declare
        tbl text;
        query text;
        result record;
    begin
        for tbl in 
            select t.table_name 
            from information_schema.tables t 
            where t.table_schema = 'public' 
            and t.table_type = 'BASE TABLE'
        loop
            query := format('select count(*) from %I', tbl);
            execute query into result;
            table_name := tbl;
            row_count := result.count;
            return next;
        end loop;
    end;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec', { query: createRPCQuery });
    if (error) {
      console.log('Could not create RPC function:', error.message);
    } else {
      console.log('✅ RPC function created');
    }
  } catch (err) {
    console.log('RPC creation failed:', err.message);
  }
}

// Run the analysis
checkDatabaseState();