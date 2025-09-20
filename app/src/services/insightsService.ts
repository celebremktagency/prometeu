import { supabase } from './supabaseClient';
import { Insight, WeeklyInsights } from '../types/db';
import { dorService } from './dorService';
import { treinoService } from './treinoService';

export const insightsService = {
  async getWeeklyInsights(usuarioId: string): Promise<WeeklyInsights> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    // Get pain data for the week
    const dorData = await dorService.getAverageDorByDay(usuarioId, 7);
    
    // Get training data for the week
    const treinos = await treinoService.getTreinos(usuarioId);
    const weekTreinos = treinos.filter(treino => {
      const treinoDate = new Date(treino.created_at);
      return treinoDate >= startDate && treinoDate <= endDate && treino.status === 'done';
    });

    // Calculate weekly progress (number of completed trainings)
    const progressoSemanal = weekTreinos.length;

    // Calculate average pain level for the week
    const nivelDor = dorData.length > 0 
      ? dorData.reduce((sum, day) => sum + day.average, 0) / dorData.length 
      : 0;

    // Create chart dataset
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const values = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = dorData.find(d => d.date === dateStr);
      return dayData ? dayData.average : 0;
    });

    const dataset_chart = {
      labels,
      values,
    };

    // Save insights to database
    await this.saveInsights(usuarioId, progressoSemanal, nivelDor);

    return {
      progresso_semanal: progressoSemanal,
      nivel_dor: Number(nivelDor.toFixed(1)),
      dataset_chart,
    };
  },

  async saveInsights(usuarioId: string, progressoSemanal: number, nivelDor: number): Promise<Insight> {
    const { data, error } = await supabase
      .from('insights')
      .insert([
        {
          usuario_id: usuarioId,
          progresso_semanal: progressoSemanal,
          nivel_dor: nivelDor,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getLatestInsights(usuarioId: string): Promise<Insight | null> {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('data_registro', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No data found
      throw error;
    }
    return data;
  }
};