const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

// List of all possible tables based on the database structure I've seen
const expectedTables = [
  'users',
  'user_profiles', 
  'workouts',
  'workout_exercises',
  'workout_libraries',
  'workout_library_exercises',
  'exercises',
  'exercise_categories',
  'treinos',
  'exercicios',
  'dor',
  'insights',
  'user_streaks',
  'achievements',
  'user_achievements',
  'posts',
  'post_comments',
  'post_likes',
  'community_members',
  'payments',
  'subscriptions',
  'professional_profiles',
  'client_connections',
  'client_invitations',
  'exams',
  'reports',
  'calendar_events',
  'notifications',
  'user_settings',
  'workout_ratings',
  'trainer_ratings',
  'support_tickets',
  'pain_levels',
  'progress_tracking',
  'goals',
  'user_goals'
];

async function analyzeTable(tableName) {
  console.log(`\n🔸 Analyzing table: ${tableName}`);
  console.log('=' .repeat(50));

  try {
    // Try to get record count and structure
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(0);

    if (error) {
      console.log(`❌ Table ${tableName} does not exist or is not accessible: ${error.message}`);
      return null;
    }

    console.log(`📁 Table: ${tableName}`);
    console.log(`📊 Records: ${count || 0}`);

    // Get sample data if records exist
    if (count > 0) {
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);

      if (!sampleError && sampleData && sampleData.length > 0) {
        console.log(`\n📄 Sample data structure (first record):`);
        const firstRecord = sampleData[0];
        Object.entries(firstRecord).forEach(([key, value]) => {
          const type = typeof value;
          const displayValue = value === null ? 'NULL' : 
                              type === 'string' && value.length > 50 ? `"${value.substring(0, 47)}..."` :
                              JSON.stringify(value);
          console.log(`  • ${key}: ${displayValue} (${type})`);
        });

        if (sampleData.length > 1) {
          console.log(`\n📄 Additional sample records:`);
          sampleData.slice(1).forEach((record, index) => {
            console.log(`  Record ${index + 2}: ${JSON.stringify(record, null, 2)}`);
          });
        }
      }
    } else {
      console.log(`\n📄 Empty table (no records)`);
      
      // Try to insert a test record to see the structure
      try {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({})
          .select();
        
        if (insertError) {
          console.log(`\n📋 Table structure hints from error: ${insertError.message}`);
        }
      } catch (err) {
        // Ignore insert errors, just trying to get structure info
      }
    }

    return {
      name: tableName,
      recordCount: count || 0,
      exists: true
    };

  } catch (error) {
    console.log(`❌ Error analyzing ${tableName}:`, error.message);
    return null;
  }
}

async function comprehensiveAnalysis() {
  console.log('🔍 COMPREHENSIVE DATABASE ANALYSIS');
  console.log('=====================================\n');

  const existingTables = [];
  const nonExistentTables = [];

  // Analyze each expected table
  for (const tableName of expectedTables) {
    const result = await analyzeTable(tableName);
    if (result) {
      existingTables.push(result);
    } else {
      nonExistentTables.push(tableName);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Try some additional table names that might exist
  const additionalTables = [
    'auth_users',
    'buckets', 
    'objects',
    'workout_completions',
    'exercise_logs',
    'pain_history',
    'user_sessions',
    'app_settings',
    'feedback',
    'help_articles',
    'faq'
  ];

  console.log('\n🔍 Checking additional possible tables...');
  for (const tableName of additionalTables) {
    const result = await analyzeTable(tableName);
    if (result) {
      existingTables.push(result);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n\n📈 DATABASE SUMMARY');
  console.log('===================');
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Non-existent tables: ${nonExistentTables.length}`);
  console.log(`📊 Tables with data: ${existingTables.filter(t => t.recordCount > 0).length}`);
  console.log(`📄 Empty tables: ${existingTables.filter(t => t.recordCount === 0).length}`);

  console.log('\n📊 EXISTING TABLES BY RECORD COUNT:');
  existingTables
    .sort((a, b) => b.recordCount - a.recordCount)
    .forEach(table => {
      console.log(`  • ${table.name}: ${table.recordCount} records`);
    });

  if (nonExistentTables.length > 0) {
    console.log('\n❌ TABLES NOT FOUND:');
    nonExistentTables.forEach(table => {
      console.log(`  • ${table}`);
    });
  }

  // Categorize existing tables
  console.log('\n🏗️  EXISTING TABLES BY CATEGORY:');
  console.log('================================');

  const categories = {
    'Core User System': existingTables.filter(t => 
      ['users', 'user_profiles', 'auth'].some(keyword => 
        t.name.toLowerCase().includes(keyword)
      )
    ),
    'Workout System': existingTables.filter(t => 
      ['workout', 'treino', 'exercise', 'exercicio'].some(keyword => 
        t.name.toLowerCase().includes(keyword)
      )
    ),
    'Pain Management': existingTables.filter(t => 
      ['dor', 'pain'].some(keyword => 
        t.name.toLowerCase().includes(keyword)
      )
    ),
    'Professional Features': existingTables.filter(t => 
      ['professional', 'trainer', 'client'].some(keyword => 
        t.name.toLowerCase().includes(keyword)
      )
    ),
    'Progress & Achievements': existingTables.filter(t => 
      ['streak', 'achievement', 'progress', 'goal'].some(keyword => 
        t.name.toLowerCase().includes(keyword)
      )
    ),
    'Community Features': existingTables.filter(t => 
      ['post', 'comment', 'like', 'community'].some(keyword => 
        t.name.toLowerCase().includes(keyword)
      )
    ),
    'Business Features': existingTables.filter(t => 
      ['payment', 'subscription', 'billing'].some(keyword => 
        t.name.toLowerCase().includes(keyword)
      )
    ),
    'Medical & Reports': existingTables.filter(t => 
      ['exam', 'report', 'medical'].some(keyword => 
        t.name.toLowerCase().includes(keyword)
      )
    ),
    'Calendar & Events': existingTables.filter(t => 
      ['calendar', 'event', 'schedule', 'appointment'].some(keyword => 
        t.name.toLowerCase().includes(keyword)
      )
    ),
    'System Features': existingTables.filter(t => 
      ['notification', 'setting', 'support', 'help'].some(keyword => 
        t.name.toLowerCase().includes(keyword)
      )
    )
  };

  const categorizedTables = new Set();
  Object.entries(categories).forEach(([category, tables]) => {
    if (tables.length > 0) {
      console.log(`\n${category}:`);
      tables.forEach(table => {
        console.log(`  • ${table.name} (${table.recordCount} records)`);
        categorizedTables.add(table.name);
      });
    }
  });

  const uncategorized = existingTables.filter(table => 
    !categorizedTables.has(table.name)
  );

  if (uncategorized.length > 0) {
    console.log(`\nOther Tables:`);
    uncategorized.forEach(table => {
      console.log(`  • ${table.name} (${table.recordCount} records)`);
    });
  }

  console.log('\n\n🎯 NEXT STEPS FOR ANALYSIS:');
  console.log('===========================');
  console.log('1. Review the existing tables with data');
  console.log('2. Check which services in your React Native app are using these tables');
  console.log('3. Identify unused tables that could add value to your app');
  console.log('4. Plan integration of missing features');
  
  return existingTables;
}

comprehensiveAnalysis().catch(console.error);