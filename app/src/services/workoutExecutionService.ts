import { supabase } from './supabaseClient';

export interface WorkoutExecution {
 id: string;
 template_id: string;
 user_id: string;
 started_at: string;
 completed_at?: string;
 exercises_completed: string[]; // IDs dos exercícios completados
 status: 'started' | 'paused' | 'completed' | 'cancelled';
 duration_seconds?: number;
 notes?: string;
}

export interface ExerciseExecution {
 exercise_id: string;
 exercise_name: string;
 completed: boolean;
 completed_at?: string;
 sets_completed?: number;
 reps_completed?: number;
 notes?: string;
}

class WorkoutExecutionService {
 async startWorkoutExecution(templateId: string): Promise<WorkoutExecution> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const execution: Omit<WorkoutExecution, 'id'> = {
   template_id: templateId,
   user_id: user.id,
   started_at: new Date().toISOString(),
   exercises_completed: [],
   status: 'started',
  };

  // For now, store in localStorage since we don't have execucoes_treino table
  const executionId = `exec_${Date.now()}`;
  const executionData = { id: executionId, ...execution };
  
  const existingExecutions = this.getStoredExecutions();
  existingExecutions.push(executionData);
  localStorage.setItem('workout_executions', JSON.stringify(existingExecutions));
  
  return executionData;
 }

 async updateExerciseCompletion(
  executionId: string, 
  exerciseId: string, 
  completed: boolean,
  notes?: string
 ): Promise<void> {
  const executions = this.getStoredExecutions();
  const executionIndex = executions.findIndex(e => e.id === executionId);
  
  if (executionIndex === -1) throw new Error('Execução não encontrada');
  
  const execution = executions[executionIndex];
  
  if (completed && !execution.exercises_completed.includes(exerciseId)) {
   execution.exercises_completed.push(exerciseId);
  } else if (!completed) {
   execution.exercises_completed = execution.exercises_completed.filter(id => id !== exerciseId);
  }
  
  executions[executionIndex] = execution;
  localStorage.setItem('workout_executions', JSON.stringify(executions));
 }

 async completeWorkoutExecution(
  executionId: string, 
  duration_seconds: number,
  notes?: string
 ): Promise<void> {
  const executions = this.getStoredExecutions();
  const executionIndex = executions.findIndex(e => e.id === executionId);
  
  if (executionIndex === -1) throw new Error('Execução não encontrada');
  
  executions[executionIndex] = {
   ...executions[executionIndex],
   completed_at: new Date().toISOString(),
   status: 'completed',
   duration_seconds,
   notes,
  };
  
  localStorage.setItem('workout_executions', JSON.stringify(executions));
  
  // Optionally, sync to database here
  // await this.syncExecutionToDatabase(executions[executionIndex]);
 }

 async pauseWorkoutExecution(executionId: string): Promise<void> {
  const executions = this.getStoredExecutions();
  const executionIndex = executions.findIndex(e => e.id === executionId);
  
  if (executionIndex === -1) throw new Error('Execução não encontrada');
  
  executions[executionIndex].status = 'paused';
  localStorage.setItem('workout_executions', JSON.stringify(executions));
 }

 async resumeWorkoutExecution(executionId: string): Promise<void> {
  const executions = this.getStoredExecutions();
  const executionIndex = executions.findIndex(e => e.id === executionId);
  
  if (executionIndex === -1) throw new Error('Execução não encontrada');
  
  executions[executionIndex].status = 'started';
  localStorage.setItem('workout_executions', JSON.stringify(executions));
 }

 getWorkoutExecution(executionId: string): WorkoutExecution | null {
  const executions = this.getStoredExecutions();
  return executions.find(e => e.id === executionId) || null;
 }

 private getStoredExecutions(): WorkoutExecution[] {
  try {
   const stored = localStorage.getItem('workout_executions');
   return stored ? JSON.parse(stored) : [];
  } catch (error) {
   console.error('Error loading stored executions:', error);
   return [];
  }
 }

 async submitPainAssessment(
  executionId: string,
  painLevel: number,
  painAreas: string[],
  painDescription?: string
 ): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
   .from('avaliacoes_dor')
   .insert({
    usuario_id: user.id,
    nivel_dor: painLevel,
    areas_afetadas: painAreas,
    descricao: painDescription,
    contexto: 'pos_treino',
    execution_id: executionId, // Reference to workout execution
   });

  if (error) {
   console.error('Error submitting pain assessment:', error);
   throw new Error('Erro ao salvar avaliação de dor');
  }
 }
}

export const workoutExecutionService = new WorkoutExecutionService();