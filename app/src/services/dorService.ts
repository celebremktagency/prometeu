import { supabase } from './supabaseClient';
import { Dor } from '../types/db';

export interface RecordDorData {
  usuarioId: string;
  musculo: string;
  nivel: number;
}

export const dorService = {
  async recordDor({ usuarioId, musculo, nivel }: RecordDorData): Promise<Dor> {
    const { data, error } = await supabase
      .from('dores')
      .insert([
        {
          usuario_id: usuarioId,
          musculo,
          nivel,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDorHistory(usuarioId: string, startDate: string, endDate: string): Promise<Dor[]> {
    const { data, error } = await supabase
      .from('dores')
      .select('*')
      .eq('usuario_id', usuarioId)
      .gte('data_registro', startDate)
      .lte('data_registro', endDate)
      .order('data_registro', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getDorByMusculo(usuarioId: string, musculo: string, days: number = 7): Promise<Dor[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const { data, error } = await supabase
      .from('dores')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('musculo', musculo)
      .gte('data_registro', startDate.toISOString())
      .lte('data_registro', endDate.toISOString())
      .order('data_registro', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAverageDorByDay(usuarioId: string, days: number = 7): Promise<{ date: string; average: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const { data, error } = await supabase
      .from('dores')
      .select('nivel, data_registro')
      .eq('usuario_id', usuarioId)
      .gte('data_registro', startDate.toISOString())
      .lte('data_registro', endDate.toISOString())
      .order('data_registro', { ascending: true });

    if (error) throw error;

    const groupedByDay = (data || []).reduce((acc, dor) => {
      const date = new Date(dor.data_registro).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(dor.nivel);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(groupedByDay).map(([date, niveis]) => ({
      date,
      average: niveis.reduce((sum, nivel) => sum + nivel, 0) / niveis.length,
    }));
  }
};