import { supabase } from './supabaseClient';

export interface ExerciseFeedback {
 id?: string;
 user_id: string;
 exercise_id: string;
 workout_execution_id?: string;
 
 // Ratings (1-5 scale)
 rating?: number;
 difficulty_level?: number;
 enjoyment_level?: number;
 
 // Pain level (0-10 scale)
 pain_level?: number;
 
 // Text feedback
 notes?: string;
 what_worked_well?: string;
 what_was_difficult?: string;
 suggestions?: string;
 
 // Completion data
 completed_reps?: number;
 completed_sets?: number;
 actual_duration_minutes?: number;
 rest_time_minutes?: number;
 
 // Status
 exercise_completed: boolean;
 technique_feedback?: string; // From professional
 
 created_at?: string;
 updated_at?: string;
}

export interface WorkoutSessionSummary {
 id?: string;
 user_id: string;
 workout_template_id?: string;
 
 // Session timing
 started_at: string;
 completed_at?: string;
 total_duration_minutes?: number;
 
 // Overall feedback (1-5 scale)
 overall_rating?: number;
 overall_difficulty?: number;
 energy_level_before?: number;
 energy_level_after?: number;
 
 // Pain tracking (0-10 scale)
 pain_before?: number;
 pain_after?: number;
 pain_location?: string;
 
 // Notes
 workout_notes?: string;
 trainer_notes?: string; // From professional
 
 status: 'started' | 'paused' | 'completed' | 'abandoned';
 
 created_at?: string;
 updated_at?: string;
}

export interface ClientProgressData {
 client_id: string;
 client_name: string;
 total_workouts: number;
 avg_rating: number;
 avg_difficulty: number;
 avg_pain_level: number;
 last_workout_date: string;
 progress_trend: 'improving' | 'stable' | 'declining';
}

class FeedbackService {
 
 // Exercise Feedback Methods
 async saveExerciseFeedback(feedback: ExerciseFeedback): Promise<void> {
  try {
   const { error } = await supabase
    .from('workout_feedback')
    .upsert(feedback);
   
   if (error) {
    throw new Error('Erro ao salvar feedback: ' + error.message);
   }
  } catch (error: any) {
   throw new Error(error.message || 'Erro ao salvar feedback do exercício');
  }
 }

 async getExerciseFeedback(exerciseId: string, userId: string): Promise<ExerciseFeedback[]> {
  try {
   const { data, error } = await supabase
    .from('workout_feedback')
    .select('*')
    .eq('exercise_id', exerciseId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

   if (error) {
    throw new Error('Erro ao carregar feedback: ' + error.message);
   }

   return data || [];
  } catch (error: any) {
   throw new Error(error.message || 'Erro ao carregar feedback do exercício');
  }
 }

 async updateTechniqueFeedback(feedbackId: string, techniqueFeedback: string): Promise<void> {
  try {
   const { error } = await supabase
    .from('workout_feedback')
    .update({ technique_feedback: techniqueFeedback })
    .eq('id', feedbackId);

   if (error) {
    throw new Error('Erro ao atualizar feedback técnico: ' + error.message);
   }
  } catch (error: any) {
   throw new Error(error.message || 'Erro ao atualizar feedback técnico');
  }
 }

 // Workout Session Methods
 async startWorkoutSession(session: Omit<WorkoutSessionSummary, 'id'>): Promise<string> {
  try {
   const { data, error } = await supabase
    .from('workout_session_summary')
    .insert(session)
    .select('id')
    .single();

   if (error) {
    throw new Error('Erro ao iniciar sessão: ' + error.message);
   }

   return data.id;
  } catch (error: any) {
   throw new Error(error.message || 'Erro ao iniciar sessão de treino');
  }
 }

 async updateWorkoutSession(sessionId: string, updates: Partial<WorkoutSessionSummary>): Promise<void> {
  try {
   const { error } = await supabase
    .from('workout_session_summary')
    .update(updates)
    .eq('id', sessionId);

   if (error) {
    throw new Error('Erro ao atualizar sessão: ' + error.message);
   }
  } catch (error: any) {
   throw new Error(error.message || 'Erro ao atualizar sessão de treino');
  }
 }

 async completeWorkoutSession(sessionId: string, completionData: {
  overall_rating?: number;
  overall_difficulty?: number;
  energy_level_after?: number;
  pain_after?: number;
  pain_location?: string;
  workout_notes?: string;
 }): Promise<void> {
  try {
   const { error } = await supabase
    .from('workout_session_summary')
    .update({
     ...completionData,
     completed_at: new Date().toISOString(),
     status: 'completed'
    })
    .eq('id', sessionId);

   if (error) {
    throw new Error('Erro ao finalizar sessão: ' + error.message);
   }
  } catch (error: any) {
   throw new Error(error.message || 'Erro ao finalizar sessão de treino');
  }
 }

 // Professional Dashboard Methods
 async getClientProgress(clientId: string): Promise<ClientProgressData | null> {
  try {
   // Get client info
   const { data: client, error: clientError } = await supabase
    .from('user_profiles')
    .select('nome')
    .eq('user_id', clientId)
    .single();

   if (clientError || !client) {
    return null;
   }

   // Get workout sessions from execucoes_treino (actual table being used)
   const { data: sessions, error: sessionsError } = await supabase
    .from('execucoes_treino')
    .select(`
     id,
     cliente_id,
     data_execucao,
     tempo_total_min,
     recovery_perception,
     has_pain_before,
     pain_location_before,
     pain_intensity_eva_before,
     overall_satisfaction,
     effort_perception_rpe,
     discomfort_level,
     has_pain_after,
     pain_location_after,
     pain_intensity_eva_after,
     trainer_notes,
     finalizado,
     created_at
    `)
    .eq('cliente_id', clientId)
    .order('created_at', { ascending: false });

   if (sessionsError) {
    throw new Error('Erro ao carregar sessões: ' + sessionsError.message);
   }

   const completedSessions = (sessions || []).filter(s => s.finalizado === true);

   if (completedSessions.length === 0) {
    return {
     client_id: clientId,
     client_name: client.nome,
     total_workouts: 0,
     avg_rating: 0,
     avg_difficulty: 0,
     avg_pain_level: 0,
     last_workout_date: '',
     progress_trend: 'stable',
    };
   }

   // Calculate averages using session data only
   const ratingsWithValues = completedSessions.filter(s => s.overall_satisfaction !== null);
   const avgRating = ratingsWithValues.length > 0
    ? ratingsWithValues.reduce((sum, s) => sum + (s.overall_satisfaction || 0), 0) / ratingsWithValues.length
    : 0;

   const rpeWithValues = completedSessions.filter(s => s.effort_perception_rpe !== null);
   const avgDifficulty = rpeWithValues.length > 0
    ? rpeWithValues.reduce((sum, s) => sum + (s.effort_perception_rpe || 0), 0) / rpeWithValues.length
    : 0;

   const painValues = completedSessions.filter(s => 
    s.pain_intensity_eva_before !== null || s.pain_intensity_eva_after !== null
   );
   const avgPainLevel = painValues.length > 0
    ? painValues.reduce((sum, s) => sum + (s.pain_intensity_eva_before || s.pain_intensity_eva_after || 0), 0) / painValues.length
    : 0;

   // Calculate trend based on satisfaction ratings
   let progressTrend: 'improving' | 'stable' | 'declining' = 'stable';
   if (ratingsWithValues.length >= 3) {
    const recent = ratingsWithValues.slice(0, 3);
    const older = ratingsWithValues.slice(3, 6);
    
    if (recent.length > 0 && older.length > 0) {
     const recentAvg = recent.reduce((sum, s) => sum + (s.overall_satisfaction || 0), 0) / recent.length;
     const olderAvg = older.reduce((sum, s) => sum + (s.overall_satisfaction || 0), 0) / older.length;
     
     if (recentAvg > olderAvg + 0.3) progressTrend = 'improving';
     else if (recentAvg < olderAvg - 0.3) progressTrend = 'declining';
    }
   }

   return {
    client_id: clientId,
    client_name: client.nome,
    total_workouts: completedSessions.length,
    avg_rating: Math.round(avgRating * 10) / 10,
    avg_difficulty: Math.round(avgDifficulty * 10) / 10,
    avg_pain_level: Math.round(avgPainLevel * 10) / 10,
    last_workout_date: completedSessions[0]?.created_at || '',
    progress_trend: progressTrend,
   };

  } catch (error: any) {
   throw new Error(error.message || 'Erro ao carregar progresso do cliente');
  }
 }

 async getClientDetailedFeedback(clientId: string, limit: number = 20): Promise<{
  sessions: WorkoutSessionSummary[];
  exerciseFeedback: (ExerciseFeedback & { exercise_name?: string })[];
 }> {
  try {
   // Get recent workout sessions from execucoes_treino
   const { data: sessionsData, error: sessionsError } = await supabase
    .from('execucoes_treino')
    .select(`
     id,
     cliente_id,
     data_execucao,
     tempo_total_min,
     recovery_perception,
     has_pain_before,
     pain_location_before,
     pain_intensity_eva_before,
     overall_satisfaction,
     effort_perception_rpe,
     discomfort_level,
     has_pain_after,
     pain_location_after,
     pain_intensity_eva_after,
     trainer_notes,
     finalizado,
     created_at,
     treino:treinos(exercicio)
    `)
    .eq('cliente_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

   if (sessionsError) {
    throw new Error('Erro ao carregar sessões: ' + sessionsError.message);
   }
   
   // Transform execucoes_treino data to WorkoutSessionSummary format
   const sessions: WorkoutSessionSummary[] = (sessionsData || []).map(session => ({
    id: session.id,
    user_id: session.cliente_id,
    started_at: session.created_at,
    completed_at: session.finalizado ? session.created_at : undefined,
    total_duration_minutes: session.tempo_total_min,
    overall_rating: session.overall_satisfaction,
    overall_difficulty: session.effort_perception_rpe,
    energy_level_before: session.recovery_perception,
    pain_before: session.pain_intensity_eva_before,
    pain_after: session.pain_intensity_eva_after,
    pain_location: session.pain_location_before || session.pain_location_after,
    workout_notes: `Exercício: ${session.treino?.exercicio || 'N/A'}`,
    trainer_notes: session.trainer_notes,
    status: session.finalizado ? 'completed' as const : 'started' as const,
    created_at: session.created_at
   }));

   // Since workout_feedback table doesn't have the expected structure,
   // we'll use the session data as exercise feedback
   const exerciseFeedback = sessions.map(session => ({
    id: session.id,
    user_id: session.user_id,
    exercise_id: session.workout_template_id || session.id,
    rating: session.overall_rating,
    difficulty_level: session.overall_difficulty,
    pain_level: session.pain_before || session.pain_after,
    notes: session.workout_notes,
    technique_feedback: session.trainer_notes,
    exercise_completed: session.status === 'completed',
    created_at: session.created_at,
    exercise_name: session.workout_notes?.replace('Exercício: ', '') || 'Treino',
   }));

   return {
    sessions: sessions,
    exerciseFeedback,
   };

  } catch (error: any) {
   throw new Error(error.message || 'Erro ao carregar feedback detalhado');
  }
 }

 async addTrainerNotes(sessionId: string, trainerNotes: string): Promise<void> {
  try {
   const { error } = await supabase
    .from('execucoes_treino')
    .update({ trainer_notes: trainerNotes })
    .eq('id', sessionId);

   if (error) {
    throw new Error('Erro ao adicionar notas: ' + error.message);
   }
  } catch (error: any) {
   throw new Error(error.message || 'Erro ao adicionar notas do treinador');
  }
 }
}

export const feedbackService = new FeedbackService();