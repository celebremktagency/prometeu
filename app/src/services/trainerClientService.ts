import { supabase } from './supabaseClient';

export interface TrainerClientRelationship {
 id: string;
 trainer_id: string;
 client_id: string;
 started_at: string;
 ended_at?: string;
 trainer?: any;
 client?: any;
}

export interface WorkoutAssignment {
 id: string;
 treino_id: string;
 aluno_id: string;
 personal_id: string;
 data_inicio: string;
 data_fim?: string;
 status: string;
 observacoes?: string;
 created_at: string;
}

class TrainerClientService {
 // CLIENT REQUESTS TRAINER
 async requestTrainer(trainerUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Check if relationship already exists
  const { data: existing } = await supabase
   .from('professional_clients')
   .select('id')
   .eq('trainer_id', trainerUserId)
   .eq('client_id', user.id)
   .single();

  if (existing) throw new Error('Solicitação já enviada');

  const { error } = await supabase
   .from('professional_clients')
   .insert({
    trainer_id: trainerUserId,
    client_id: user.id,
    started_at: new Date().toISOString()
   });

  if (error) throw error;
 }

 // TRAINER INVITES CLIENT
 async inviteClient(clientUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
   .from('user_profiles')
   .select('tipo')
   .eq('user_id', user.id)
   .single();

  if (!profile || (profile.tipo !== 'personal_trainer' && profile.tipo !== 'profissional')) {
   throw new Error('Você não é um treinador cadastrado');
  }

  const { data: existing } = await supabase
   .from('professional_clients')
   .select('id')
   .eq('trainer_id', user.id)
   .eq('client_id', clientUserId)
   .single();

  if (existing) throw new Error('Convite já enviado');

  const { error } = await supabase
   .from('professional_clients')
   .insert({
    trainer_id: user.id,
    client_id: clientUserId,
    started_at: new Date().toISOString()
   });

  if (error) throw error;
 }

 // GET CURRENT TRAINER FOR CLIENT
 async getCurrentTrainer(): Promise<any | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: connection, error } = await supabase
   .from('professional_clients')
   .select('*')
   .eq('client_id', user.id)
   .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!connection) return null;

  // Buscar dados do treinador separadamente
  const { data: trainerProfile } = await supabase
   .from('user_profiles')
   .select('nome, email, avatar_url')
   .eq('user_id', connection.trainer_id)
   .single();

  return trainerProfile || null;
 }

 // GET CLIENTS FOR TRAINER
 async getMyClients(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: connections, error } = await supabase
   .from('professional_clients')
   .select('*')
   .eq('trainer_id', user.id);

  if (error) throw error;
  if (!connections || connections.length === 0) return [];

  // Buscar dados dos clientes separadamente
  const clientIds = connections.map(c => c.client_id);
  const { data: clients } = await supabase
   .from('user_profiles')
   .select('*')
   .in('user_id', clientIds);

  return clients || [];
 }

 // ASSIGN WORKOUT TO CLIENT
 async assignWorkoutToClient(
  clientId: string,
  workoutData: {
   treino_id: string;
   data_inicio: string;
   data_fim?: string;
   observacoes?: string;
  }
 ): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
   .from('treinos_atribuidos')
   .insert({
    treino_id: workoutData.treino_id,
    aluno_id: clientId,
    personal_id: user.id,
    data_inicio: workoutData.data_inicio,
    data_fim: workoutData.data_fim || null,
    observacoes: workoutData.observacoes || null,
    status: 'ativo'
   });

  if (error) throw error;
 }

 // GET TODAY'S WORKOUTS FOR CLIENT
 async getTodaysWorkouts(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const today = new Date().toISOString().split('T')[0];

  const { data: assignments, error } = await supabase
   .from('treinos_atribuidos')
   .select('*')
   .eq('aluno_id', user.id)
   .eq('status', 'ativo')
   .lte('data_inicio', today)
   .or(`data_fim.is.null,data_fim.gte.${today}`);

  if (error) throw error;
  if (!assignments || assignments.length === 0) return [];

  // Buscar dados dos treinos separadamente
  const treinoIds = assignments.map(a => a.treino_id);
  const { data: treinos } = await supabase
   .from('treinos')
   .select('*')
   .in('id', treinoIds);

  // Buscar dados do personal
  const personalIds = [...new Set(assignments.map(a => a.personal_id))];
  const { data: personals } = await supabase
   .from('user_profiles')
   .select('user_id, nome')
   .in('user_id', personalIds);

  return assignments.map(a => ({
   ...a,
   treino: treinos?.find(t => t.id === a.treino_id) || null,
   personal: personals?.find(p => p.user_id === a.personal_id) || null,
  }));
 }
}

export const trainerClientService = new TrainerClientService();
