// ===========================================
// SERVIÇO DE EXERCÍCIOS
// Gerencia a biblioteca de exercícios únicos
// ===========================================

import { supabase } from './supabaseClient';
import { Exercicio, ExercicioFilter, ApiResponse, PaginatedResponse } from '../types';

class ExercicioService {
  // Buscar exercícios com filtros
  async buscarExercicios(
    filtros: ExercicioFilter = {}, 
    page = 1, 
    limit = 20
  ): Promise<PaginatedResponse<Exercicio>> {
    try {
      let query = supabase
        .from('exercicios')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filtros.search) {
        query = query.or(`nome.ilike.%${filtros.search}%,descricao.ilike.%${filtros.search}%`);
      }

      if (filtros.grupo_muscular && filtros.grupo_muscular.length > 0) {
        query = query.contains('grupo_muscular', filtros.grupo_muscular);
      }

      if (filtros.equipamento) {
        query = query.eq('equipamento', filtros.equipamento);
      }

      if (filtros.dificuldade) {
        query = query.eq('dificuldade', filtros.dificuldade);
      }

      if (filtros.criado_por) {
        query = query.eq('criado_por', filtros.criado_por);
      }

      // Ordenar e paginar
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error);
      throw error;
    }
  }

  // Buscar exercício por ID
  async buscarPorId(id: string): Promise<Exercicio | null> {
    try {
      const { data, error } = await supabase
        .from('exercicios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar exercício:', error);
      return null;
    }
  }

  // Criar novo exercício
  async criar(exercicio: Omit<Exercicio, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Exercicio>> {
    try {
      const { data, error } = await supabase
        .from('exercicios')
        .insert(exercicio)
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao criar exercício:', error);
      return {
        data: null,
        error: 'Erro ao criar exercício',
        success: false
      };
    }
  }

  // Atualizar exercício
  async atualizar(id: string, exercicio: Partial<Exercicio>): Promise<ApiResponse<Exercicio>> {
    try {
      const { data, error } = await supabase
        .from('exercicios')
        .update(exercicio)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error);
      return {
        data: null,
        error: 'Erro ao atualizar exercício',
        success: false
      };
    }
  }

  // Deletar exercício
  async deletar(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('exercicios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao deletar exercício:', error);
      return {
        data: false,
        error: 'Erro ao deletar exercício',
        success: false
      };
    }
  }

  // Buscar exercícios por grupo muscular
  async buscarPorGrupoMuscular(grupos: string[]): Promise<Exercicio[]> {
    try {
      const { data, error } = await supabase
        .from('exercicios')
        .select('*')
        .contains('grupo_muscular', grupos)
        .eq('is_publico', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar exercícios por grupo muscular:', error);
      return [];
    }
  }

  // Buscar exercícios populares
  async buscarPopulares(limit = 10): Promise<Exercicio[]> {
    try {
      const { data, error } = await supabase
        .from('exercicios')
        .select(`
          *,
          treino_exercicios(count)
        `)
        .eq('is_publico', true)
        .order('treino_exercicios.count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar exercícios populares:', error);
      return [];
    }
  }

  // Exercícios do sistema (públicos)
  async buscarSistema(): Promise<Exercicio[]> {
    try {
      const { data, error } = await supabase
        .from('exercicios')
        .select('*')
        .eq('is_publico', true)
        .is('criado_por', null)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar exercícios do sistema:', error);
      return [];
    }
  }

  // Exercícios criados por um personal
  async buscarPorCriador(personalId: string): Promise<Exercicio[]> {
    try {
      const { data, error } = await supabase
        .from('exercicios')
        .select('*')
        .eq('criado_por', personalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar exercícios do personal:', error);
      return [];
    }
  }
}

export const exercicioService = new ExercicioService();