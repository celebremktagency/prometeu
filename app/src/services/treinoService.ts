import { supabase } from './supabaseClient';
import { Treino } from '../types/db';

export interface CreateTreinoData {
  exercicio: string;
  series: number;
  repeticoes: string;
  status?: 'planned' | 'done' | 'skipped';
}

export interface UpdateTreinoData {
  exercicio?: string;
  series?: number;
  repeticoes?: string;
  status?: 'planned' | 'done' | 'skipped';
}

export const treinoService = {
  async getTreinos(usuarioId: string): Promise<Treino[]> {
    const { data, error } = await supabase
      .from('treinos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTreino(usuarioId: string, payload: CreateTreinoData): Promise<Treino> {
    const { data, error } = await supabase
      .from('treinos')
      .insert([
        {
          usuario_id: usuarioId,
          ...payload,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTreino(id: string, payload: UpdateTreinoData): Promise<Treino> {
    const { data, error } = await supabase
      .from('treinos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTreino(id: string): Promise<void> {
    const { error } = await supabase
      .from('treinos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async markTreinoAsDone(id: string): Promise<Treino> {
    return this.updateTreino(id, { status: 'done' });
  }
};