const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🧪 Testando conexão com Supabase...');
    
    // Teste simples de conexão
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    return true;
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
    return false;
  }
}

async function createTables() {
  const connected = await testConnection();
  
  if (!connected) {
    console.log('❌ Não foi possível conectar ao Supabase');
    return;
  }
  
  console.log('🏗️ Criando tabelas uma por uma...');
  
  // Criar user_settings
  try {
    console.log('📋 Criando tabela user_settings...');
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS user_settings (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
          push_notifications boolean DEFAULT true,
          email_notifications boolean DEFAULT true,
          workout_reminders boolean DEFAULT true,
          pain_tracking_reminders boolean DEFAULT true,
          data_sharing boolean DEFAULT false,
          language varchar(5) DEFAULT 'pt-BR',
          theme varchar(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          UNIQUE(user_id)
        );
      `
    });
    
    if (error) {
      console.log('❌ Erro ao criar user_settings:', error.message);
    } else {
      console.log('✅ Tabela user_settings criada!');
    }
  } catch (err) {
    console.log('❌ Erro user_settings:', err.message);
  }
  
  // Criar notifications
  try {
    console.log('📋 Criando tabela notifications...');
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS notifications (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
          title text NOT NULL,
          message text NOT NULL,
          type varchar(20) DEFAULT 'general' CHECK (type IN ('general', 'workout', 'pain', 'payment', 'community', 'system')),
          is_read boolean DEFAULT false,
          action_url text,
          created_at timestamp with time zone DEFAULT now()
        );
      `
    });
    
    if (error) {
      console.log('❌ Erro ao criar notifications:', error.message);
    } else {
      console.log('✅ Tabela notifications criada!');
    }
  } catch (err) {
    console.log('❌ Erro notifications:', err.message);
  }
}

// Executar
createTables();