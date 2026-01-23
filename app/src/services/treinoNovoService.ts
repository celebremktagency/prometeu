// ===========================================
// SERVIÇO DE TREINOS (NOVA ESTRUTURA)
// Gerencia treinos como sequências de exercícios
// ===========================================

import { supabase } from './supabaseClient';
import { Treino, TreinoCompleto, TreinoExercicio, TreinoFilter, ApiResponse, PaginatedResponse } from '../types';

class TreinoNovoService {
  // Buscar treinos com filtros
  async buscarTreinos(
    filtros: TreinoFilter = {}, 
    page = 1, 
    limit = 20
  ): Promise<PaginatedResponse<Treino>> {
    try {
      let query = supabase
        .from('treinos')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filtros.search) {
        query = query.or(`nome.ilike.%${filtros.search}%,descricao.ilike.%${filtros.search}%`);
      }

      if (filtros.nivel) {
        query = query.eq('nivel', filtros.nivel);
      }

      if (filtros.objetivo) {
        query = query.eq('objetivo', filtros.objetivo);
      }

      if (filtros.tags && filtros.tags.length > 0) {
        query = query.contains('tags', filtros.tags);
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
      console.error('Erro ao buscar treinos:', error);
      throw error;
    }
  }

  // Buscar treino completo por ID (com exercícios)
  async buscarCompleto(id: string): Promise<TreinoCompleto | null> {
    try {
      const { data, error } = await supabase
        .from('treinos')
        .select(`
          *,
          treino_exercicios(
            *,
            exercicio:exercicios(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Processar e ordenar exercícios
      if (data && data.treino_exercicios) {
        data.exercicios = data.treino_exercicios
          .sort((a: any, b: any) => a.ordem - b.ordem)
          .map((te: any) => ({
            ...te,
            exercicio: te.exercicio
          }));
        
        delete data.treino_exercicios;
      }

      return data as TreinoCompleto;
    } catch (error) {
      console.error('Erro ao buscar treino completo:', error);
      return null;
    }
  }

  // Criar novo treino
  async criar(treino: Omit<Treino, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Treino>> {
    try {
      const { data, error } = await supabase
        .from('treinos')
        .insert(treino)
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      return {
        data: null,
        error: 'Erro ao criar treino',
        success: false
      };
    }
  }

  // Atualizar treino
  async atualizar(id: string, treino: Partial<Treino>): Promise<ApiResponse<Treino>> {
    try {
      const { data, error } = await supabase
        .from('treinos')
        .update(treino)
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
      console.error('Erro ao atualizar treino:', error);
      return {
        data: null,
        error: 'Erro ao atualizar treino',
        success: false
      };
    }
  }

  // Deletar treino
  async deletar(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Os exercícios do treino são deletados automaticamente (CASCADE)
      const { error } = await supabase
        .from('treinos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
      return {
        data: false,
        error: 'Erro ao deletar treino',
        success: false
      };
    }
  }

  // Adicionar exercício ao treino
  async adicionarExercicio(
    treinoId: string, 
    exercicioData: Omit<TreinoExercicio, 'id' | 'created_at'>
  ): Promise<ApiResponse<TreinoExercicio>> {
    try {
      const { data, error } = await supabase
        .from('treino_exercicios')
        .insert({
          ...exercicioData,
          treino_id: treinoId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao adicionar exercício ao treino:', error);
      return {
        data: null,
        error: 'Erro ao adicionar exercício ao treino',
        success: false
      };
    }
  }

  // Atualizar exercício do treino
  async atualizarExercicio(
    id: string, 
    exercicioData: Partial<TreinoExercicio>
  ): Promise<ApiResponse<TreinoExercicio>> {
    try {
      const { data, error } = await supabase
        .from('treino_exercicios')
        .update(exercicioData)
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
      console.error('Erro ao atualizar exercício do treino:', error);
      return {
        data: null,
        error: 'Erro ao atualizar exercício do treino',
        success: false
      };
    }
  }

  // Remover exercício do treino
  async removerExercicio(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('treino_exercicios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao remover exercício do treino:', error);
      return {
        data: false,
        error: 'Erro ao remover exercício do treino',
        success: false
      };
    }
  }

  // Reordenar exercícios do treino
  async reordenarExercicios(
    treinoId: string, 
    exercicios: { id: string; ordem: number }[]
  ): Promise<ApiResponse<boolean>> {
    try {
      // Atualizar em batch
      const updates = exercicios.map(ex => 
        supabase
          .from('treino_exercicios')
          .update({ ordem: ex.ordem })
          .eq('id', ex.id)
      );

      await Promise.all(updates);

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao reordenar exercícios:', error);
      return {
        data: false,
        error: 'Erro ao reordenar exercícios',
        success: false
      };
    }
  }

  // Duplicar treino
  async duplicar(id: string, novoNome?: string): Promise<ApiResponse<TreinoCompleto>> {
    try {
      // Buscar treino original
      const treinoOriginal = await this.buscarCompleto(id);
      if (!treinoOriginal) {
        throw new Error('Treino não encontrado');
      }

      // Criar novo treino
      const novoTreino = {
        ...treinoOriginal,
        nome: novoNome || `${treinoOriginal.nome} (Cópia)`,
        criado_por: undefined // será definido pelo RLS
      };
      delete (novoTreino as any).id;
      delete (novoTreino as any).created_at;
      delete (novoTreino as any).updated_at;
      delete (novoTreino as any).exercicios;

      const { data: novoTreinoData, error: treinoError } = await supabase
        .from('treinos')
        .insert(novoTreino)
        .select()
        .single();

      if (treinoError) throw treinoError;

      // Copiar exercícios
      if (treinoOriginal.exercicios && treinoOriginal.exercicios.length > 0) {
        const exerciciosParaCopiar = treinoOriginal.exercicios.map(ex => ({
          treino_id: novoTreinoData.id,
          exercicio_id: ex.exercicio_id,
          ordem: ex.ordem,
          series: ex.series,
          repeticoes: ex.repeticoes,
          peso_sugerido: ex.peso_sugerido,
          tempo_descanso: ex.tempo_descanso,
          observacoes: ex.observacoes
        }));

        const { error: exerciciosError } = await supabase
          .from('treino_exercicios')
          .insert(exerciciosParaCopiar);

        if (exerciciosError) throw exerciciosError;
      }

      // Buscar treino completo criado
      const treinoCompleto = await this.buscarCompleto(novoTreinoData.id);

      return {
        data: treinoCompleto!,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao duplicar treino:', error);
      return {
        data: null,
        error: 'Erro ao duplicar treino',
        success: false
      };
    }
  }

  // Buscar treinos populares
  async buscarPopulares(limit = 10): Promise<Treino[]> {
    try {
      const { data, error } = await supabase
        .from('treinos')
        .select(`
          *,
          programa_treinos(count)
        `)
        .eq('is_publico', true)
        .order('programa_treinos.count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar treinos populares:', error);
      return [];
    }
  }

  // Buscar treinos criados por um personal
  async buscarPorCriador(personalId: string): Promise<Treino[]> {
    try {
      const { data, error } = await supabase
        .from('treinos')
        .select('*')
        .eq('criado_por', personalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar treinos do personal:', error);
      return [];
    }
  }

  // Buscar treinos por objetivo
  async buscarPorObjetivo(objetivo: string): Promise<Treino[]> {
    try {
      const { data, error } = await supabase
        .from('treinos')
        .select('*')
        .eq('objetivo', objetivo)
        .eq('is_publico', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar treinos por objetivo:', error);
      return [];
    }
  }

  // Estimativa de duração baseada nos exercícios
  async calcularDuracaoEstimada(treinoId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('treino_exercicios')
        .select('series, tempo_descanso')
        .eq('treino_id', treinoId);

      if (error || !data) return 0;

      // Cálculo simples: série = ~1min, descanso conforme especificado
      let duracaoTotal = 0;
      data.forEach(ex => {
        const tempoSeries = ex.series * 1; // 1 min por série
        const tempoDescanso = this.parseTempoDescanso(ex.tempo_descanso || '60s');
        const tempoDescansoTotal = (ex.series - 1) * tempoDescanso;
        duracaoTotal += tempoSeries + tempoDescansoTotal;
      });

      return Math.round(duracaoTotal);
    } catch (error) {
      console.error('Erro ao calcular duração:', error);
      return 0;
    }
  }

  private parseTempoDescanso(tempo: string): number {
    // Converte "60s", "1-2min", "90s" etc para minutos
    if (tempo.includes('min')) {
      const match = tempo.match(/(\d+)/);
      return match ? parseInt(match[1]) : 1;
    }
    if (tempo.includes('s')) {
      const match = tempo.match(/(\d+)/);
      return match ? parseInt(match[1]) / 60 : 1;
    }
    return 1; // default 1 minuto
  }
}

export const treinoNovoService = new TreinoNovoService();