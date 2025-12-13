import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProgramExecution {
 id: string;
 template_id: string;
 user_id: string;
 started_at: string;
 completed_at?: string;
 current_workout_index: number;
 total_workouts: number;
 workouts_completed: string[];
 status: 'started' | 'paused' | 'completed' | 'cancelled';
 duration_seconds?: number;
 notes?: string;
}

export interface WorkoutInProgram {
 treino: any;
 index: number;
 completed: boolean;
 completed_at?: string;
 execution_id?: string;
}

class ProgramExecutionService {
 async startProgramExecution(template: any): Promise<ProgramExecution> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Get workouts from template
  let treinoIds: string[] = [];
  try {
   if (template.observacoes_profissional) {
    const parsed = JSON.parse(template.observacoes_profissional);
    treinoIds = parsed.treino_ids || [];
   }
  } catch (error) {
   throw new Error('Programa mal formado');
  }

  if (treinoIds.length === 0) {
   throw new Error('Este programa não possui exercícios');
  }

  const execution: Omit<ProgramExecution, 'id'> = {
   template_id: template.id,
   user_id: user.id,
   started_at: new Date().toISOString(),
   current_workout_index: 0,
   total_workouts: treinoIds.length,
   workouts_completed: [],
   status: 'started',
  };

  // Store in AsyncStorage for now (could be database later)
  const executionId = `prog_${Date.now()}`;
  const executionData = { id: executionId, ...execution };
  
  const existingExecutions = await this.getStoredExecutions();
  existingExecutions.push(executionData);
  await AsyncStorage.setItem('program_executions', JSON.stringify(existingExecutions));
  
  return executionData;
 }

 async getProgramWorkouts(template: any): Promise<WorkoutInProgram[]> {
  // Parse treino_ids from template
  let treinoIds: string[] = [];
  try {
   if (template.observacoes_profissional) {
    const parsed = JSON.parse(template.observacoes_profissional);
    treinoIds = parsed.treino_ids || [];
   }
  } catch (error) {
   return [];
  }

  if (treinoIds.length === 0) return [];

  // Fetch workout details
  const { data: treinos, error } = await supabase
   .from('treinos')
   .select('*')
   .in('id', treinoIds);

  if (error || !treinos) return [];

  // Create ordered workout list
  const workoutsInProgram: WorkoutInProgram[] = treinoIds.map((id, index) => {
   const treino = treinos.find(t => t.id === id);
   
   // Normalize repeticoes to always be string
   if (treino && typeof treino.repeticoes === 'number') {
    treino.repeticoes = treino.repeticoes.toString();
   }
   
   return {
    treino: treino || null,
    index,
    completed: false,
    completed_at: undefined,
    execution_id: undefined,
   };
  });

  return workoutsInProgram;
 }

 async completeWorkoutInProgram(
  executionId: string, 
  workoutIndex: number,
  workoutExecutionId: string
 ): Promise<void> {
  const executions = await this.getStoredExecutions();
  const executionIndex = executions.findIndex(e => e.id === executionId);
  
  if (executionIndex === -1) throw new Error('Execução de programa não encontrada');
  
  const execution = executions[executionIndex];
  
  // Mark workout as completed
  if (!execution.workouts_completed.includes(workoutExecutionId)) {
   execution.workouts_completed.push(workoutExecutionId);
  }
  
  // Move to next workout
  execution.current_workout_index = Math.min(
   execution.current_workout_index + 1, 
   execution.total_workouts
  );
  
  // Check if program is complete
  if (execution.workouts_completed.length >= execution.total_workouts) {
   execution.status = 'completed';
   execution.completed_at = new Date().toISOString();
  }
  
  executions[executionIndex] = execution;
  await AsyncStorage.setItem('program_executions', JSON.stringify(executions));
 }

 async pauseProgramExecution(executionId: string): Promise<void> {
  const executions = await this.getStoredExecutions();
  const executionIndex = executions.findIndex(e => e.id === executionId);
  
  if (executionIndex === -1) throw new Error('Execução não encontrada');
  
  executions[executionIndex].status = 'paused';
  await AsyncStorage.setItem('program_executions', JSON.stringify(executions));
 }

 async resumeProgramExecution(executionId: string): Promise<void> {
  const executions = await this.getStoredExecutions();
  const executionIndex = executions.findIndex(e => e.id === executionId);
  
  if (executionIndex === -1) throw new Error('Execução não encontrada');
  
  executions[executionIndex].status = 'started';
  await AsyncStorage.setItem('program_executions', JSON.stringify(executions));
 }

 async cancelProgramExecution(executionId: string): Promise<void> {
  const executions = await this.getStoredExecutions();
  const executionIndex = executions.findIndex(e => e.id === executionId);
  
  if (executionIndex === -1) throw new Error('Execução não encontrada');
  
  // Remove the execution completely instead of just marking as cancelled
  executions.splice(executionIndex, 1);
  await AsyncStorage.setItem('program_executions', JSON.stringify(executions));
 }

 async getProgramExecution(executionId: string): Promise<ProgramExecution | null> {
  const executions = await this.getStoredExecutions();
  return executions.find(e => e.id === executionId) || null;
 }

 async getCurrentProgramExecution(): Promise<ProgramExecution | null> {
  const executions = await this.getStoredExecutions();
  return executions.find(e => e.status === 'started' || e.status === 'paused') || null;
 }

 private async getStoredExecutions(): Promise<ProgramExecution[]> {
  try {
   const stored = await AsyncStorage.getItem('program_executions');
   return stored ? JSON.parse(stored) : [];
  } catch (error) {
   console.error('Error loading stored program executions:', error);
   return [];
  }
 }
}

export const programExecutionService = new ProgramExecutionService();