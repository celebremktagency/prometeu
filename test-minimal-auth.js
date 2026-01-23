const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jndkdbetebrlijohtuoz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZGtkYmV0ZWJybGlqb2h0dW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDYxODIsImV4cCI6MjA4MzgyMjE4Mn0.qBz0GVDtGqSIgouXQW5EdCxPevekPPY7cq4gV-3k6NA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('🔬 Testando configurações mínimas...')
  
  try {
    // Teste 1: SignUp mais simples possível
    console.log('\n1️⃣ Teste signup básico...')
    const { data, error } = await supabase.auth.signUp({
      email: 'emersonbljr2802@gmail.com',
      password: '123456789'
    })
    
    console.log('Resultado signup básico:', { 
      user: data?.user?.id ? 'criado' : 'não criado',
      session: data?.session ? 'ativa' : 'não ativa',
      error: error?.message || 'nenhum'
    })
    
    if (error) {
      console.error('❌ Erro no signup básico:', error)
      
      // Teste 2: Verificar se o problema é de configuração
      console.log('\n2️⃣ Verificando health do servidor...')
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: supabaseAnonKey }
      })
      
      console.log('Status do servidor:', response.status)
      
      if (response.status === 200) {
        console.log('✅ Servidor REST funcionando')
      } else {
        console.log('❌ Servidor REST com problemas')
      }
      
      // Teste 3: Verificar endpoint de auth
      console.log('\n3️⃣ Testando endpoint de auth...')
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { apikey: supabaseAnonKey }
      })
      
      console.log('Status auth:', authResponse.status)
      
      if (authResponse.status !== 200) {
        console.log('❌ Endpoint de Auth com problema')
        console.log('Resposta:', await authResponse.text())
      }
    } else {
      console.log('✅ Signup funcionou!')
    }
    
  } catch (err) {
    console.error('💥 Erro geral:', err.message)
  }
}

testAuth()