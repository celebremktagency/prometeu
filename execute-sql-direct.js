const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://dxmvqwpvsetkhvixpize.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bXZxd3B2c2V0a2h2aXhwaXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzYwMzQsImV4cCI6MjA3NjkxMjAzNH0.-Orj2DyD0jr4eEs6rNhiAZ9Z61RbLmA9VF9Z6nXwvLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTablesDirectly() {
  console.log('🏗️ Criando tabelas diretamente no Supabase...');
  
  // 1. Primeiro, criar os planos de assinatura (dados estáticos)
  try {
    console.log('📋 Inserindo planos de assinatura...');
    
    // Verificar se já existem dados
    const { data: existingPlans } = await supabase
      .from('subscription_plans')
      .select('id')
      .limit(1);
    
    if (!existingPlans || existingPlans.length === 0) {
      const plans = [
        {
          name: 'Gratuito',
          description: 'Plano básico com funcionalidades limitadas',
          price: 0.00,
          billing_period: 'monthly',
          features: ['3 treinos por mês', 'Tracking básico de dor'],
          max_clients: 0,
          is_active: true
        },
        {
          name: 'Personal Básico',
          description: 'Para personal trainers iniciantes',
          price: 29.90,
          billing_period: 'monthly',
          features: ['Até 20 clientes', 'Criação de treinos', 'Relatórios básicos'],
          max_clients: 20,
          is_active: true
        },
        {
          name: 'Personal Pro',
          description: 'Para personal trainers estabelecidos',
          price: 59.90,
          billing_period: 'monthly',
          features: ['Clientes ilimitados', 'Relatórios avançados', 'Análise de dados'],
          max_clients: 999,
          is_active: true
        },
        {
          name: 'Aluno Premium',
          description: 'Acesso completo para alunos',
          price: 19.90,
          billing_period: 'monthly',
          features: ['Treinos ilimitados', 'Análise de progresso', 'Suporte priority'],
          max_clients: 0,
          is_active: true
        }
      ];
      
      const { error: plansError } = await supabase
        .from('subscription_plans')
        .insert(plans);
      
      if (plansError) {
        console.log('❌ Erro ao inserir planos:', plansError.message);
      } else {
        console.log('✅ Planos de assinatura inseridos!');
      }
    } else {
      console.log('ℹ️ Planos já existem no banco');
    }
  } catch (err) {
    console.log('❌ Erro nos planos:', err.message);
  }
  
  // 2. Inserir FAQs
  try {
    console.log('📋 Inserindo FAQs...');
    
    const { data: existingFaqs } = await supabase
      .from('faqs')
      .select('id')
      .limit(1);
    
    if (!existingFaqs || existingFaqs.length === 0) {
      const faqs = [
        {
          category: 'Geral',
          question: 'Como funciona o aplicativo?',
          answer: 'O Prometheus é uma plataforma que conecta alunos e personal trainers, oferecendo ferramentas para tracking de treinos e monitoramento de dor.',
          order_index: 1,
          is_active: true
        },
        {
          category: 'Geral',
          question: 'Posso usar sem personal trainer?',
          answer: 'Sim! Você pode usar o app como aluno independente com treinos pré-definidos e tracking de progresso.',
          order_index: 2,
          is_active: true
        },
        {
          category: 'Pagamento',
          question: 'Como alterar meu plano?',
          answer: 'Acesse Perfil > Configurações > Planos e Assinatura para alterar seu plano a qualquer momento.',
          order_index: 1,
          is_active: true
        },
        {
          category: 'Pagamento',
          question: 'Como cancelar minha assinatura?',
          answer: 'Você pode cancelar sua assinatura em Perfil > Configurações > Planos e Assinatura. O acesso continuará até o fim do período pago.',
          order_index: 2,
          is_active: true
        },
        {
          category: 'Técnico',
          question: 'Como sincronizar meus dados?',
          answer: 'Os dados são sincronizados automaticamente. Para forçar sincronização, vá em Configurações > Backup e Sincronização.',
          order_index: 1,
          is_active: true
        },
        {
          category: 'Técnico',
          question: 'O app funciona offline?',
          answer: 'Funcionalidades básicas como tracking de treinos funcionam offline, mas a sincronização requer conexão à internet.',
          order_index: 2,
          is_active: true
        }
      ];
      
      const { error: faqsError } = await supabase
        .from('faqs')
        .insert(faqs);
      
      if (faqsError) {
        console.log('❌ Erro ao inserir FAQs:', faqsError.message);
      } else {
        console.log('✅ FAQs inseridos!');
      }
    } else {
      console.log('ℹ️ FAQs já existem no banco');
    }
  } catch (err) {
    console.log('❌ Erro nos FAQs:', err.message);
  }
  
  console.log('🎉 Processo concluído! Verifique o dashboard do Supabase para confirmar as tabelas.');
}

// Executar
createTablesDirectly();