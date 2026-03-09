import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://jndkdbetebrlijohtuoz.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZGtkYmV0ZWJybGlqb2h0dW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDYxODIsImV4cCI6MjA4MzgyMjE4Mn0.qBz0GVDtGqSIgouXQW5EdCxPevekPPY7cq4gV-3k6NA'

console.log('Supabase Config:', { supabaseUrl, anonKey: supabaseAnonKey ? 'present' : 'missing' })

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Configurações para desenvolvimento
    flowType: 'implicit'
  }
})