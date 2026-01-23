// ===========================================
// SERVIÇO DE PROGRAMAS
// Gerencia programas como planos completos de treino
// ===========================================

import { supabase } from './supabaseClient';
import { 
  Programa, 
  ProgramaCompleto, 
  ProgramaTreino, 
  ProgramaFilter, 
  ProgramaAtribuido,
  ApiResponse, 
  PaginatedResponse 
} from '../types';

class ProgramaService {
  // Buscar programas com filtros
  async buscarProgramas(
    filtros: ProgramaFilter = {}, 
    page = 1, 
    limit = 20
  ): Promise<PaginatedResponse<Programa>> {
    try {
      let query = supabase
        .from('programas')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filtros.search) {
        query = query.or(`nome.ilike.%${filtros.search}%,descricao.ilike.%${filtros.search}%`);
      }

      if (filtros.nivel) {
        query = query.eq('nivel', filtros.nivel);
      }

      if (filtros.categoria) {
        query = query.eq('categoria', filtros.categoria);
      }

      if (filtros.duracao_semanas) {
        query = query.eq('duracao_semanas', filtros.duracao_semanas);
      }

      if (filtros.frequencia_semanal) {
        query = query.eq('frequencia_semanal', filtros.frequencia_semanal);
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
      console.error('Erro ao buscar programas:', error);
      throw error;
    }
  }

  // Buscar programa completo por ID (com treinos)
  async buscarCompleto(id: string): Promise<ProgramaCompleto | null> {
    try {
      const { data, error } = await supabase
        .from('programas')
        .select(`
          *,
          programa_treinos(
            *,
            treino:treinos(
              *,
              treino_exercicios(
                *,
                exercicio:exercicios(*)
              )
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Processar dados
      if (data && data.programa_treinos) {
        data.treinos = data.programa_treinos
          .sort((a: any, b: any) => {
            // Ordenar por dia da semana, depois por ordem
            if (a.dia_semana !== b.dia_semana) {
              return (a.dia_semana || 0) - (b.dia_semana || 0);
            }
            return (a.ordem || 0) - (b.ordem || 0);
          })
          .map((pt: any) => ({
            ...pt,
            treino: {
              ...pt.treino,
              exercicios: pt.treino.treino_exercicios
                ?.sort((a: any, b: any) => a.ordem - b.ordem)
                ?.map((te: any) => ({
                  ...te,
                  exercicio: te.exercicio
                })) || []
            }
          }));
        
        delete data.programa_treinos;
      }

      return data as ProgramaCompleto;
    } catch (error) {
      console.error('Erro ao buscar programa completo:', error);
      return null;
    }
  }

  // Criar novo programa
  async criar(programa: Omit<Programa, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Programa>> {
    try {
      const { data, error } = await supabase
        .from('programas')
        .insert(programa)
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao criar programa:', error);
      return {
        data: null,
        error: 'Erro ao criar programa',
        success: false
      };
    }
  }

  // Atualizar programa
  async atualizar(id: string, programa: Partial<Programa>): Promise<ApiResponse<Programa>> {
    try {
      const { data, error } = await supabase
        .from('programas')
        .update(programa)
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
      console.error('Erro ao atualizar programa:', error);
      return {
        data: null,
        error: 'Erro ao atualizar programa',
        success: false
      };
    }
  }

  // Deletar programa
  async deletar(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Os treinos do programa são deletados automaticamente (CASCADE)
      const { error } = await supabase
        .from('programas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao deletar programa:', error);
      return {
        data: false,
        error: 'Erro ao deletar programa',
        success: false
      };
    }
  }

  // Adicionar treino ao programa
  async adicionarTreino(
    programaId: string, 
    treinoData: Omit<ProgramaTreino, 'id' | 'created_at'>
  ): Promise<ApiResponse<ProgramaTreino>> {
    try {
      const { data, error } = await supabase
        .from('programa_treinos')
        .insert({
          ...treinoData,
          programa_id: programaId
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
      console.error('Erro ao adicionar treino ao programa:', error);
      return {
        data: null,
        error: 'Erro ao adicionar treino ao programa',
        success: false
      };
    }
  }

  // Remover treino do programa
  async removerTreino(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('programa_treinos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao remover treino do programa:', error);
      return {
        data: false,
        error: 'Erro ao remover treino do programa',
        success: false
      };
    }
  }

  // Atualizar treino do programa
  async atualizarTreino(
    id: string, 
    treinoData: Partial<ProgramaTreino>
  ): Promise<ApiResponse<ProgramaTreino>> {
    try {
      const { data, error } = await supabase
        .from('programa_treinos')
        .update(treinoData)
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
      console.error('Erro ao atualizar treino do programa:', error);
      return {
        data: null,
        error: 'Erro ao atualizar treino do programa',
        success: false
      };
    }
  }

  // Duplicar programa
  async duplicar(id: string, novoNome?: string): Promise<ApiResponse<ProgramaCompleto>> {
    try {
      // Buscar programa original
      const programaOriginal = await this.buscarCompleto(id);
      if (!programaOriginal) {
        throw new Error('Programa não encontrado');
      }

      // Criar novo programa
      const novoPrograma = {
        ...programaOriginal,
        nome: novoNome || `${programaOriginal.nome} (Cópia)`,
        criado_por: undefined // será definido pelo RLS
      };
      delete (novoPrograma as any).id;
      delete (novoPrograma as any).created_at;
      delete (novoPrograma as any).updated_at;
      delete (novoPrograma as any).treinos;

      const { data: novoProgramaData, error: programaError } = await supabase
        .from('programas')
        .insert(novoPrograma)
        .select()
        .single();

      if (programaError) throw programaError;

      // Copiar treinos
      if (programaOriginal.treinos && programaOriginal.treinos.length > 0) {
        const treinosParaCopiar = programaOriginal.treinos.map(pt => ({
          programa_id: novoProgramaData.id,
          treino_id: pt.treino_id,
          dia_semana: pt.dia_semana,
          semana: pt.semana,
          ordem: pt.ordem,
          observacoes: pt.observacoes
        }));

        const { error: treinosError } = await supabase
          .from('programa_treinos')
          .insert(treinosParaCopiar);

        if (treinosError) throw treinosError;
      }

      // Buscar programa completo criado
      const programaCompleto = await this.buscarCompleto(novoProgramaData.id);

      return {
        data: programaCompleto!,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao duplicar programa:', error);
      return {
        data: null,
        error: 'Erro ao duplicar programa',
        success: false
      };
    }
  }

  // Atribuir programa a um aluno
  async atribuir(
    programaId: string,
    alunoId: string,
    dataInicio: string,
    observacoes?: string
  ): Promise<ApiResponse<ProgramaAtribuido>> {
    try {
      const { data, error } = await supabase
        .from('programas_atribuidos')
        .insert({
          programa_id: programaId,
          aluno_id: alunoId,
          data_inicio: dataInicio,
          observacoes,
          status: 'ativo'
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
      console.error('Erro ao atribuir programa:', error);
      return {
        data: null,
        error: 'Erro ao atribuir programa',
        success: false
      };
    }
  }

  // Buscar programas atribuídos de um aluno
  async buscarAtribuidosAluno(alunoId: string): Promise<ProgramaAtribuido[]> {
    try {
      const { data, error } = await supabase
        .from('programas_atribuidos')
        .select(`
          *,
          programa:programas(*),
          personal:users!programas_atribuidos_personal_id_fkey(*)
        `)
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar programas do aluno:', error);
      return [];
    }
  }

  // Buscar programas atribuídos de um personal
  async buscarAtribuidosPersonal(personalId: string): Promise<ProgramaAtribuido[]> {
    try {
      const { data, error } = await supabase
        .from('programas_atribuidos')
        .select(`
          *,
          programa:programas(*),
          aluno:users!programas_atribuidos_aluno_id_fkey(*)
        `)
        .eq('personal_id', personalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar programas do personal:', error);
      return [];
    }
  }

  // Atualizar status do programa atribuído
  async atualizarStatusAtribuido(
    id: string, 
    status: ProgramaAtribuido['status'],
    observacoes?: string
  ): Promise<ApiResponse<ProgramaAtribuido>> {
    try {
      const { data, error } = await supabase
        .from('programas_atribuidos')
        .update({ status, observacoes })
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
      console.error('Erro ao atualizar status do programa:', error);
      return {
        data: null,
        error: 'Erro ao atualizar status do programa',
        success: false
      };
    }
  }

  // Buscar programas populares
  async buscarPopulares(limit = 10): Promise<Programa[]> {
    try {
      const { data, error } = await supabase
        .from('programas')
        .select(`
          *,
          programas_atribuidos(count)
        `)
        .eq('is_publico', true)
        .order('programas_atribuidos.count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar programas populares:', error);
      return [];
    }
  }

  // Buscar programas por categoria
  async buscarPorCategoria(categoria: string): Promise<Programa[]> {
    try {
      const { data, error } = await supabase
        .from('programas')
        .select('*')
        .eq('categoria', categoria)
        .eq('is_publico', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar programas por categoria:', error);
      return [];
    }
  }

  // Gerar cronograma semanal do programa
  async gerarCronogramaSemanal(programaId: string, semana = 1): Promise<{ [dia: number]: ProgramaTreino[] }> {
    try {
      const { data, error } = await supabase
        .from('programa_treinos')
        .select(`
          *,
          treino:treinos(*)
        `)
        .eq('programa_id', programaId)
        .eq('semana', semana)
        .order('dia_semana')
        .order('ordem');

      if (error) throw error;

      // Agrupar por dia da semana
      const cronograma: { [dia: number]: ProgramaTreino[] } = {};
      
      (data || []).forEach(pt => {
        if (pt.dia_semana) {
          if (!cronograma[pt.dia_semana]) {
            cronograma[pt.dia_semana] = [];
          }
          cronograma[pt.dia_semana].push(pt);
        }
      });

      return cronograma;
    } catch (error) {
      console.error('Erro ao gerar cronograma:', error);
      return {};
    }
  }
}

export const programaService = new ProgramaService();