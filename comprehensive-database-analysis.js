const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('🔍 COMPREHENSIVE DATABASE ANALYSIS');
  console.log('=====================================\n');

  try {
    // Get all tables from information_schema
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }

    console.log(`📊 Found ${tablesData.length} tables in the database:\n`);
    
    const tableAnalysis = [];
    
    for (const table of tablesData) {
      const tableName = table.table_name;
      console.log(`\n🔸 Analyzing table: ${tableName}`);
      console.log('=' .repeat(50));

      try {
        // Get column information
        const { data: columnsData, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .order('ordinal_position');

        if (columnsError) {
          console.log(`❌ Error getting columns for ${tableName}:`, columnsError.message);
          continue;
        }

        // Get record count
        let recordCount = 0;
        let sampleData = [];
        try {
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!countError) {
            recordCount = count || 0;
          }

          // Get sample data if records exist
          if (recordCount > 0) {
            const { data: samples, error: sampleError } = await supabase
              .from(tableName)
              .select('*')
              .limit(3);
            
            if (!sampleError && samples) {
              sampleData = samples;
            }
          }
        } catch (err) {
          console.log(`⚠️  Could not count records for ${tableName}: ${err.message}`);
        }

        // Display table information
        console.log(`📁 Table: ${tableName}`);
        console.log(`📊 Records: ${recordCount}`);
        console.log(`📋 Columns (${columnsData.length}):`);
        
        columnsData.forEach(col => {
          console.log(`  • ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
        });

        // Show sample data
        if (sampleData.length > 0) {
          console.log(`\n📄 Sample data (${sampleData.length} records):`);
          sampleData.forEach((record, index) => {
            console.log(`  ${index + 1}. ${JSON.stringify(record, null, 2)}`);
          });
        } else {
          console.log(`\n📄 No sample data (empty table)`);
        }

        tableAnalysis.push({
          name: tableName,
          recordCount,
          columns: columnsData,
          sampleData
        });

      } catch (error) {
        console.log(`❌ Error analyzing ${tableName}:`, error.message);
      }
    }

    // Summary
    console.log('\n\n📈 DATABASE SUMMARY');
    console.log('===================');
    console.log(`Total tables: ${tableAnalysis.length}`);
    console.log(`Tables with data: ${tableAnalysis.filter(t => t.recordCount > 0).length}`);
    console.log(`Empty tables: ${tableAnalysis.filter(t => t.recordCount === 0).length}`);

    console.log('\n📊 Table Record Counts:');
    tableAnalysis
      .sort((a, b) => b.recordCount - a.recordCount)
      .forEach(table => {
        console.log(`  • ${table.name}: ${table.recordCount} records`);
      });

    // Group tables by functionality
    console.log('\n🏗️  TABLE CATEGORIES:');
    console.log('====================');

    const categories = {
      'Authentication & Users': ['users', 'user_profiles', 'auth'],
      'Workouts & Training': ['workouts', 'workout_', 'treinos', 'exercicios', 'exercise'],
      'Pain Management': ['dor', 'pain'],
      'Professional Features': ['professional', 'trainer', 'client'],
      'Community Features': ['posts', 'comments', 'community', 'social'],
      'Payments & Subscriptions': ['payment', 'subscription', 'billing'],
      'Achievements & Progress': ['streak', 'achievement', 'progress'],
      'Medical & Reports': ['exam', 'report', 'medical'],
      'Calendar & Scheduling': ['calendar', 'schedule', 'appointment'],
      'Notifications': ['notification'],
      'System & Config': ['config', 'settings', 'system']
    };

    Object.entries(categories).forEach(([category, keywords]) => {
      const matchingTables = tableAnalysis.filter(table => 
        keywords.some(keyword => 
          table.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (matchingTables.length > 0) {
        console.log(`\n${category}:`);
        matchingTables.forEach(table => {
          console.log(`  • ${table.name} (${table.recordCount} records)`);
        });
      }
    });

    // Tables that don't match any category
    const categorizedTableNames = new Set();
    Object.values(categories).flat().forEach(keyword => {
      tableAnalysis.forEach(table => {
        if (table.name.toLowerCase().includes(keyword.toLowerCase())) {
          categorizedTableNames.add(table.name);
        }
      });
    });

    const uncategorizedTables = tableAnalysis.filter(table => 
      !categorizedTableNames.has(table.name)
    );

    if (uncategorizedTables.length > 0) {
      console.log(`\nOther Tables:`);
      uncategorizedTables.forEach(table => {
        console.log(`  • ${table.name} (${table.recordCount} records)`);
      });
    }

  } catch (error) {
    console.error('❌ Error analyzing database:', error);
  }
}

// Run the analysis
analyzeDatabase().catch(console.error);