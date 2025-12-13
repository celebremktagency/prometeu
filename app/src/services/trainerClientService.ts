import { supabase } from './supabaseClient';

export interface TrainerClientRelationship {
 id: string;
 trainer_id: string;
 client_id: string;
 status: 'pending' | 'approved' | 'rejected';
 requested_by: 'trainer' | 'client';
 created_at: string;
 updated_at: string;
 trainer?: any;
 client?: any;
}

export interface WorkoutAssignment {
 id: string;
 trainer_id: string;
 client_id: string;
 workout_template_id?: string;
 treino_id?: string;
 scheduled_days: string[]; // ['monday', 'wednesday', 'friday']
 start_date: string;
 end_date?: string;
 active: boolean;
 created_at: string;
}

class TrainerClientService {
 // CLIENT REQUESTS TRAINER
 async requestTrainer(trainerUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Get trainer's professional ID
  const { data: trainer, error: trainerError } = await supabase
   .from('profissionais')
   .select('id, user_id')
   .eq('user_id', trainerUserId)
   .single();

  if (trainerError || !trainer) throw new Error('Treinador não encontrado');

  // Check if relationship already exists
  const { data: existing } = await supabase
   .from('trainer_client_relationships')
   .select('id')
   .eq('trainer_id', trainer.id)
   .eq('client_id', user.id)
   .single();

  if (existing) throw new Error('Solicitação já enviada');

  // Create relationship request
  const { error } = await supabase
   .from('trainer_client_relationships')
   .insert({
    trainer_id: trainer.id,
    client_id: user.id,
    status: 'pending',
    requested_by: 'client'
   });

  if (error) throw error;
 }

 // TRAINER INVITES CLIENT
 async inviteClient(clientUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Get trainer's professional ID
  const { data: trainer, error: trainerError } = await supabase
   .from('profissionais')
   .select('id')
   .eq('user_id', user.id)
   .single();

  if (trainerError || !trainer) throw new Error('Você não é um treinador cadastrado');

  // Check if relationship already exists
  const { data: existing } = await supabase
   .from('trainer_client_relationships')
   .select('id')
   .eq('trainer_id', trainer.id)
   .eq('client_id', clientUserId)
   .single();

  if (existing) throw new Error('Convite já enviado');

  // Create relationship request
  const { error } = await supabase
   .from('trainer_client_relationships')
   .insert({
    trainer_id: trainer.id,
    client_id: clientUserId,
    status: 'pending',
    requested_by: 'trainer'
   });

  if (error) throw error;
 }

 // APPROVE/REJECT RELATIONSHIP
 async respondToRequest(relationshipId: string, approve: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
   .from('trainer_client_relationships')
   .update({
    status: approve ? 'approved' : 'rejected',
    updated_at: new Date().toISOString()
   })
   .eq('id', relationshipId);

  if (error) throw error;
 }

 // GET PENDING REQUESTS FOR CURRENT USER
 async getPendingRequests(): Promise<TrainerClientRelationship[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Check if user is a trainer
  const { data: trainer } = await supabase
   .from('profissionais')
   .select('id')
   .eq('user_id', user.id)
   .single();

  let query = supabase
   .from('trainer_client_relationships')
   .select(`
    *,
    trainer:profissionais!trainer_client_relationships_trainer_id_fkey(
     user_id,
     tipo_profissional,
     user_profiles!profissionais_user_id_fkey(nome, email)
    ),
    client:user_profiles!trainer_client_relationships_client_id_fkey(nome, email)
   `)
   .eq('status', 'pending');

  if (trainer) {
   // Trainer sees requests TO them
   query = query.eq('trainer_id', trainer.id);
  } else {
   // Client sees requests FROM them
   query = query.eq('client_id', user.id);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
 }

 // GET CURRENT TRAINER FOR CLIENT
 async getCurrentTrainer(): Promise<any | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
   .from('trainer_client_relationships')
   .select(`
    *,
    trainer:profissionais!trainer_client_relationships_trainer_id_fkey(
     *,
     user_profiles!profissionais_user_id_fkey(nome, email, avatar_url)
    )
   `)
   .eq('client_id', user.id)
   .eq('status', 'approved')
   .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.trainer || null;
 }

 // GET CLIENTS FOR TRAINER
 async getMyClients(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Get trainer's professional ID
  const { data: trainer } = await supabase
   .from('profissionais')
   .select('id')
   .eq('user_id', user.id)
   .single();

  if (!trainer) throw new Error('Você não é um treinador cadastrado');

  const { data, error } = await supabase
   .from('trainer_client_relationships')
   .select(`
    *,
    client:user_profiles!trainer_client_relationships_client_id_fkey(*)
   `)
   .eq('trainer_id', trainer.id)
   .eq('status', 'approved');

  if (error) throw error;
  return data?.map(r => r.client) || [];
 }

 // ASSIGN WORKOUT TO CLIENT
 async assignWorkoutToClient(
  clientId: string, 
  workoutData: {
   workout_template_id?: string;
   treino_id?: string;
   scheduled_days: string[];
   start_date: string;
   end_date?: string;
  }
 ): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Get trainer's professional ID
  const { data: trainer } = await supabase
   .from('profissionais')
   .select('id')
   .eq('user_id', user.id)
   .single();

  if (!trainer) throw new Error('Você não é um treinador cadastrado');

  // Ensure repeticoes is string if it exists in workoutData
  const sanitizedWorkoutData = {
   ...workoutData,
   ...((workoutData as any).hasOwnProperty('repeticoes') && {
    repeticoes: typeof (workoutData as any).repeticoes === 'number' 
     ? (workoutData as any).repeticoes.toString() 
     : (workoutData as any).repeticoes
   })
  };

  const { error } = await supabase
   .from('workout_assignments')
   .insert({
    trainer_id: trainer.id,
    client_id: clientId,
    ...sanitizedWorkoutData,
    active: true
   });

  if (error) throw error;
 }

 // GET TODAY'S WORKOUTS FOR CLIENT
 async getTodaysWorkouts(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  const { data, error } = await supabase
   .from('workout_assignments')
   .select(`
    *,
    workout_template:workout_templates(*),
    treino:treinos(*),
    trainer:profissionais(
     user_profiles!profissionais_user_id_fkey(nome)
    )
   `)
   .eq('client_id', user.id)
   .eq('active', true)
   .contains('scheduled_days', [dayName])
   .lte('start_date', today.toISOString().split('T')[0])
   .or(`end_date.is.null,end_date.gte.${today.toISOString().split('T')[0]}`);

  if (error) throw error;
  return data || [];
 }
}

export const trainerClientService = new TrainerClientService();