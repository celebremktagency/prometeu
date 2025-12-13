import { supabase } from './supabaseClient';

export interface Cliente {
 id: string;
 professional_id: string;
 client_id: string;
 aluno_id: string; // Alias for client_id for compatibility
 nome: string;
 email: string;
 status: string;
 data_inicio: string;
 data_vinculo: string; // Alias for data_inicio
 tipo: string;
 ativo?: boolean; // Optional active status
}

export interface WorkoutTemplate {
 id: string;
 nome: string;
 descricao: string;
 tipo: string;
 series: number;
 repeticoes: string | number;
 nivel: string;
 created_at: string;
}

class ProfessionalService {
 async listarClientes(): Promise<Cliente[]> {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuário não autenticado');

   // Primeiro verificar se o usuário é um profissional no user_profiles
   const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, tipo')
    .eq('user_id', user.id)
    .single();

   if (profileError || !userProfile) {
    console.log('Usuário não encontrado');
    return [];
   }

   // Verificar se é profissional
   if (userProfile.tipo === 'aluno') {
    console.log('Usuário não é um profissional cadastrado');
    return [];
   }

   // Buscar relacionamentos na tabela professional_clients (padronizada)
   const { data: relacionamentos, error: errorRel } = await supabase
    .from('professional_clients')
    .select('*')
    .eq('professional_id', user.id)
    .order('started_at', { ascending: false });

   if (errorRel) {
    console.error('Erro ao buscar clientes:', errorRel);
    throw new Error('Erro ao carregar clientes');
   }

   if (!relacionamentos) {
    return [];
   }

   // Buscar dados dos clientes separadamente
   const clientesPromises = relacionamentos.map(async (rel) => {
    const { data: clienteData, error: clienteError } = await supabase
     .from('user_profiles')
     .select('id, nome, email, tipo, ativo')
     .eq('user_id', rel.client_id)
     .single();

    return {
     id: rel.client_id,
     professional_id: user.id,
     client_id: rel.client_id,
     cliente_id: rel.client_id,
     aluno_id: rel.client_id, // Alias for compatibility
     nome: clienteData?.nome || 'Cliente sem nome',
     email: clienteData?.email || '',
     status: rel.status,
     data_inicio: rel.started_at,
     data_vinculo: rel.started_at, // Alias for compatibility
     tipo: clienteData?.tipo || 'aluno',
    };
   });

   const clientes = await Promise.all(clientesPromises);

   return clientes;
  } catch (error) {
   console.error('Erro no serviço listarClientes:', error);
   throw error;
  }
 }

 async adicionarCliente(emailCliente: string): Promise<void> {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuário não autenticado');

   // Verificar se o usuário é um profissional
   const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, tipo')
    .eq('user_id', user.id)
    .single();

   if (profileError || !userProfile || userProfile.tipo === 'aluno') {
    throw new Error('Usuário não é um profissional cadastrado');
   }

   // Buscar o cliente pelo email na user_profiles
   const { data: cliente, error: clienteError } = await supabase
    .from('user_profiles')
    .select('id, tipo')
    .eq('email', emailCliente)
    .eq('tipo', 'aluno')
    .single();

   if (clienteError || !cliente) {
    throw new Error('Cliente não encontrado ou email inválido');
   }

   // Verificar se já existe relacionamento
   const { data: existeRel } = await supabase
    .from('professional_clients')
    .select('id')
    .eq('client_id', cliente.user_id)
    .single();

   if (existeRel) {
    throw new Error('Este cliente já possui um profissional');
   }

   // Criar relacionamento
   const { error: insertError } = await supabase
    .from('professional_clients')
    .insert({
     professional_id: user.id,
     client_id: cliente.user_id,
     status: 'ativo',
     started_at: new Date().toISOString(),
    });

   if (insertError) {
    console.error('Erro ao criar relacionamento:', insertError);
    throw new Error('Erro ao adicionar cliente');
   }
  } catch (error) {
   console.error('Erro no serviço adicionarCliente:', error);
   throw error;
  }
 }

 async removerCliente(clienteId: string): Promise<void> {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuário não autenticado');

   // Verificar se o usuário é um profissional
   const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, tipo')
    .eq('user_id', user.id)
    .single();

   if (profileError || !userProfile || userProfile.tipo === 'aluno') {
    throw new Error('Usuário não é um profissional cadastrado');
   }

   const { error } = await supabase
    .from('professional_clients')
    .update({ status: 'pausado' })
    .eq('professional_id', user.id)
    .eq('client_id', clienteId);

   if (error) {
    console.error('Erro ao remover cliente:', error);
    throw new Error('Erro ao remover cliente');
   }
  } catch (error) {
   console.error('Erro no serviço removerCliente:', error);
   throw error;
  }
 }

 async obterEstatisticas(): Promise<{
  totalClientes: number;
  clientesAtivos: number;
  treinosEstaSemanaMeutora: number;
  templatesDisponiveis: number;
 }> {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuário não autenticado');

   // Verificar se o usuário é um profissional
   const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, tipo')
    .eq('user_id', user.id)
    .single();

   if (profileError || !userProfile || userProfile.tipo === 'aluno') {
    return {
     totalClientes: 0,
     clientesAtivos: 0,
     treinosEstaSemanaMeutora: 0,
     templatesDisponiveis: 0,
    };
   }

   // Contar clientes
   const { data: clientes, error: clientesError } = await supabase
    .from('professional_clients')
    .select('id, status')
    .eq('professional_id', user.id);

   if (clientesError) {
    console.error('Erro ao contar clientes:', clientesError);
    throw new Error('Erro ao carregar estatísticas');
   }

   const totalClientes = clientes?.length || 0;
   const clientesAtivos = clientes?.filter(c => c.status === 'ativo').length || 0;

   // Contar templates de treino (assumindo que todos podem usar)
   const { data: templates, error: templatesError } = await supabase
    .from('treinos')
    .select('id');

   const templatesDisponiveis = templates?.length || 0;

   return {
    totalClientes,
    clientesAtivos,
    treinosEstaSemanaMeutora: Math.floor(Math.random() * clientesAtivos + 1), // Simulado por enquanto
    templatesDisponiveis,
   };
  } catch (error) {
   console.error('Erro no serviço obterEstatisticas:', error);
   throw error;
  }
 }

 async criarTemplateWorkout(template: Omit<WorkoutTemplate, 'id' | 'created_at'>): Promise<void> {
  try {
   const { error } = await supabase
    .from('treinos')
    .insert({
     nome: template.nome,
     descricao: template.descricao,
     tipo: template.tipo,
     series: template.series,
     repeticoes: typeof template.repeticoes === 'number' ? template.repeticoes.toString() : template.repeticoes,
     nivel: template.nivel,
    });

   if (error) {
    console.error('Erro ao criar template:', error);
    throw new Error('Erro ao criar template de treino');
   }
  } catch (error) {
   console.error('Erro no serviço criarTemplateWorkout:', error);
   throw error;
  }
 }

 async atribuirTreinoParaCliente(clienteId: string, treinoId: string): Promise<void> {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuário não autenticado');

   // Verificar se o usuário é um profissional
   const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, tipo')
    .eq('user_id', user.id)
    .single();

   if (profileError || !userProfile || userProfile.tipo === 'aluno') {
    throw new Error('Usuário não é um profissional cadastrado');
   }

   // Verificar se o cliente pertence ao profissional
   const { data: relacionamento } = await supabase
    .from('professional_clients')
    .select('id')
    .eq('professional_id', userProfile.id)
    .eq('client_id', clienteId)
    .eq('status', 'ativo')
    .single();

   if (!relacionamento) {
    throw new Error('Cliente não encontrado ou não ativo');
   }

   // Aqui você pode implementar a lógica de atribuição
   // Por enquanto, simula a atribuição
   console.log(`Treino ${treinoId} atribuído para cliente ${clienteId}`);
  } catch (error) {
   console.error('Erro no serviço atribuirTreinoParaCliente:', error);
   throw error;
  }
 }

 async atribuirTemplate(clienteId: string, templateId: string): Promise<void> {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuário não autenticado');

   // Verificar se o usuário é um profissional
   const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, tipo')
    .eq('user_id', user.id)
    .single();

   if (profileError || !userProfile || userProfile.tipo === 'aluno') {
    throw new Error('Usuário não é um profissional cadastrado');
   }

   // Verificar se o cliente pertence ao profissional
   const { data: relacionamento } = await supabase
    .from('professional_clients')
    .select('id')
    .eq('professional_id', userProfile.id)
    .eq('client_id', clienteId)
    .eq('status', 'ativo')
    .single();

   if (!relacionamento) {
    throw new Error('Cliente não encontrado ou não ativo');
   }

   // Get user_id for the client
   const { data: clientUser, error: clientUserError } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('id', clienteId)
    .single();

   if (clientUserError || !clientUser) {
    throw new Error('Erro ao encontrar dados do cliente');
   }

   // Atribuir o template criando um registro em treinos_atribuidos
   const { error: insertError } = await supabase
    .from('treinos_atribuidos')
    .insert({
     workout_id: templateId,
     aluno_id: clientUser.user_id,
     personal_id: user.id,
     data_inicio: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
     status: 'ativo',
    });

   if (insertError) {
    console.error('Erro ao atribuir template:', insertError);
    throw new Error('Erro ao atribuir programa para o cliente');
   }

   console.log(`Template ${templateId} atribuído para cliente ${clienteId}`);
  } catch (error) {
   console.error('Erro no serviço atribuirTemplate:', error);
   throw error;
  }
 }

 async searchProfessionals(searchTerm: string): Promise<any[]> {
  try {
   const { data: professionals, error } = await supabase
    .from('user_profiles')
    .select('id, user_id, nome, email, especialidade, experiencia, ativo')
    .eq('tipo', 'profissional')
    .eq('ativo', true)
    .ilike('nome', `%${searchTerm}%`)
    .limit(20);

   if (error) {
    console.error('Erro ao buscar professionals:', error);
    throw new Error('Erro ao buscar personal trainers');
   }

   return professionals || [];
  } catch (error) {
   console.error('Erro no serviço searchProfessionals:', error);
   throw error;
  }
 }

 async requestConnection(professionalUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuário não autenticado');

   // Verificar se o usuário é um aluno
   const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, tipo')
    .eq('user_id', user.id)
    .single();

   if (profileError || !userProfile) {
    throw new Error('Perfil do usuário não encontrado');
   }

   if (userProfile.tipo !== 'aluno') {
    throw new Error('Apenas alunos podem solicitar conexão com personal trainers');
   }

   // Buscar o profile do professional
   const { data: professionalProfile, error: profError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', professionalUserId)
    .eq('tipo', 'profissional')
    .single();

   if (profError || !professionalProfile) {
    return { success: false, error: 'Personal trainer não encontrado' };
   }

   // Verificar se já existe uma conexão ou solicitação pendente
   const { data: existingConnection } = await supabase
    .from('professional_clients')
    .select('id, status')
    .eq('client_id', user.id)
    .eq('professional_id', professionalUserId)
    .single();

   if (existingConnection) {
    if (existingConnection.status === 'ativo') {
     return { success: false, error: 'Você já está conectado a este personal trainer' };
    } else if (existingConnection.status === 'pendente') {
     return { success: false, error: 'Já existe uma solicitação pendente para este personal trainer' };
    }
   }

   // Criar nova solicitação de conexão
   const { error: insertError } = await supabase
    .from('professional_clients')
    .insert({
     professional_id: professionalUserId,
     client_id: user.id,
     status: 'pendente',
     started_at: new Date().toISOString(),
    });

   if (insertError) {
    console.error('Erro ao criar solicitação:', insertError);
    return { success: false, error: 'Erro ao enviar solicitação de conexão' };
   }

   return { success: true };
  } catch (error) {
   console.error('Erro no serviço requestConnection:', error);
   return { success: false, error: 'Erro interno do sistema' };
  }
 }

 async atribuirTreino(clientUserId: string, treinoId: string): Promise<void> {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuário não autenticado');

   // Verificar se o usuário é um profissional
   const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, tipo, nome')
    .eq('user_id', user.id)
    .single();

   if (profileError || !userProfile || userProfile.tipo !== 'personal_trainer') {
    throw new Error('Usuário não é um personal trainer');
   }

   // Verificar se o cliente está conectado ao profissional
   const { data: relacionamento } = await supabase
    .from('professional_clients')
    .select('id')
    .eq('professional_id', user.id)
    .eq('client_id', clientUserId)
    .eq('status', 'ativo')
    .single();

   if (!relacionamento) {
    throw new Error('Cliente não está conectado a você ou conexão não está ativa');
   }

   // Copiar o treino da biblioteca para o cliente (criar uma cópia personalizada)
   const { data: originalWorkout, error: workoutError } = await supabase
    .from('treinos')
    .select('*')
    .eq('id', treinoId)
    .single();

   if (workoutError || !originalWorkout) {
    throw new Error('Treino não encontrado');
   }

   // Criar uma cópia do treino para o cliente
   const { error: insertError } = await supabase
    .from('treinos')
    .insert({
     usuario_id: clientUserId,
     exercicio: originalWorkout.exercicio,
     descricao: originalWorkout.descricao,
     series: originalWorkout.series,
     repeticoes: originalWorkout.repeticoes,
     nivel: originalWorkout.nivel,
     categoria: originalWorkout.categoria,
     duracao_min: originalWorkout.duracao_min,
     publico: false, // Treino atribuído é sempre privado
     youtube_url: originalWorkout.youtube_url,
     criado_por: user.id, // Marca que foi atribuído pelo personal
     carga_sugerida_kg: originalWorkout.carga_sugerida_kg,
     cadencia_segundos: originalWorkout.cadencia_segundos,
     descanso_entre_series_seg: originalWorkout.descanso_entre_series_seg,
     equipamento: originalWorkout.equipamento,
     observacoes_tecnicas: `Atribuído por ${userProfile.nome || 'Personal Trainer'}`,
    });

   if (insertError) {
    console.error('Erro ao atribuir treino:', insertError);
    throw new Error('Erro ao atribuir treino para o cliente');
   }

   console.log(`Treino "${originalWorkout.exercicio}" atribuído para cliente ${clientUserId}`);
  } catch (error) {
   console.error('Erro no serviço atribuirTreino:', error);
   throw error;
  }
 }
}

export const professionalService = new ProfessionalService();