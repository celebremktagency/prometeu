// ===========================================
// SERVIÇO DE EXECUÇÃO DE TREINOS
// Gerencia logs de execução e progressos dos alunos
// ===========================================

import { supabase } from './supabaseClient';
import { 
  TreinoExecutado, 
  ExercicioExecutado, 
  TreinoCompleto,
  ApiResponse 
} from '../types';

class ExecucaoService {
  // Iniciar execução de treino
  async iniciarExecucao(
    treinoId: string,
    programaAtribuidoId?: string
  ): Promise<ApiResponse<TreinoExecutado>> {
    try {
      const { data, error } = await supabase
        .from('treinos_executados')
        .insert({
          treino_id: treinoId,
          programa_atribuido_id: programaAtribuidoId,
          status: 'incompleto',
          data_execucao: new Date().toISOString()
        })
        .select(`
          *,
          treino:treinos(
            *,
            treino_exercicios(
              *,
              exercicio:exercicios(*)
            )
          )
        `)
        .single();

      if (error) throw error;

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao iniciar execução:', error);
      return {
        data: null,
        error: 'Erro ao iniciar execução do treino',
        success: false
      };
    }
  }

  // Finalizar execução de treino
  async finalizarExecucao(
    execucaoId: string,
    duracaoMinutos: number,
    avaliacao?: number,
    feedback?: string
  ): Promise<ApiResponse<TreinoExecutado>> {
    try {
      const { data, error } = await supabase
        .from('treinos_executados')
        .update({
          status: 'concluido',
          duracao_minutos: duracaoMinutos,
          avaliacao,
          feedback
        })
        .eq('id', execucaoId)
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao finalizar execução:', error);
      return {
        data: null,
        error: 'Erro ao finalizar execução do treino',
        success: false
      };
    }
  }

  // Registrar execução de exercício
  async registrarExercicio(
    treinoExecutadoId: string,
    exercicioId: string,
    dadosExecucao: {
      series_planejadas?: number;
      series_executadas: number;
      repeticoes_planejadas?: string;
      repeticoes_executadas: number[];
      peso_utilizado?: number[];
      tempo_descanso_real?: string;
      observacoes?: string;
      dificuldade_percebida?: number;
    }
  ): Promise<ApiResponse<ExercicioExecutado>> {
    try {
      const { data, error } = await supabase
        .from('exercicios_executados')
        .insert({
          treino_executado_id: treinoExecutadoId,
          exercicio_id: exercicioId,
          ...dadosExecucao
        })
        .select(`
          *,
          exercicio:exercicios(*)
        `)
        .single();

      if (error) throw error;

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao registrar exercício:', error);
      return {
        data: null,
        error: 'Erro ao registrar execução do exercício',
        success: false
      };
    }
  }

  // Atualizar execução de exercício
  async atualizarExercicio(
    execucaoExercicioId: string,
    dadosAtualizados: Partial<ExercicioExecutado>
  ): Promise<ApiResponse<ExercicioExecutado>> {
    try {
      const { data, error } = await supabase
        .from('exercicios_executados')
        .update(dadosAtualizados)
        .eq('id', execucaoExercicioId)
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

  // Buscar execução completa
  async buscarExecucao(execucaoId: string): Promise<TreinoExecutado | null> {
    try {
      const { data, error } = await supabase
        .from('treinos_executados')
        .select(`
          *,
          treino:treinos(
            *,
            treino_exercicios(
              *,
              exercicio:exercicios(*)
            )
          ),
          exercicios_executados(
            *,
            exercicio:exercicios(*)
          )
        `)
        .eq('id', execucaoId)
        .single();

      if (error) throw error;

      // Processar dados do treino
      if (data?.treino?.treino_exercicios) {
        (data.treino as any).exercicios = data.treino.treino_exercicios
          .sort((a: any, b: any) => a.ordem - b.ordem)
          .map((te: any) => ({
            ...te,
            exercicio: te.exercicio
          }));
        delete (data.treino as any).treino_exercicios;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar execução:', error);
      return null;
    }
  }

  // Buscar histórico de execuções do usuário
  async buscarHistoricoUsuario(
    usuarioId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: TreinoExecutado[]; total: number }> {
    try {
      const { data, error, count } = await supabase
        .from('treinos_executados')
        .select(`
          *,
          treino:treinos(nome, objetivo)
        `, { count: 'exact' })
        .eq('usuario_id', usuarioId)
        .order('data_execucao', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return { data: [], total: 0 };
    }
  }

  // Buscar execuções por período
  async buscarPorPeriodo(
    usuarioId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<TreinoExecutado[]> {
    try {
      const { data, error } = await supabase
        .from('treinos_executados')
        .select(`
          *,
          treino:treinos(nome, objetivo, duracao_estimada)
        `)
        .eq('usuario_id', usuarioId)
        .gte('data_execucao', dataInicio)
        .lte('data_execucao', dataFim)
        .order('data_execucao', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar execuções por período:', error);
      return [];
    }
  }

  // Estatísticas de execução
  async obterEstatisticas(usuarioId: string): Promise<{
    totalTreinos: number;
    totalMinutos: number;
    treinosConcluidos: number;
    treinosIncompletos: number;
    avaliacaoMedia: number;
    streakAtual: number;
  }> {
    try {
      // Total de execuções
      const { data: execucoes, error: execucoesError } = await supabase
        .from('treinos_executados')
        .select('status, duracao_minutos, avaliacao, data_execucao')
        .eq('usuario_id', usuarioId);

      if (execucoesError) throw execucoesError;

      const total = execucoes?.length || 0;
      const concluidos = execucoes?.filter(e => e.status === 'concluido').length || 0;
      const incompletos = execucoes?.filter(e => e.status === 'incompleto').length || 0;
      
      const totalMinutos = execucoes?.reduce((acc, e) => acc + (e.duracao_minutos || 0), 0) || 0;
      
      const avaliacoes = execucoes?.filter(e => e.avaliacao).map(e => e.avaliacao) || [];
      const avaliacaoMedia = avaliacoes.length > 0 
        ? avaliacoes.reduce((acc, a) => acc + a, 0) / avaliacoes.length 
        : 0;

      // Calcular streak atual
      const execucoesOrdenadas = execucoes
        ?.filter(e => e.status === 'concluido')
        ?.sort((a, b) => new Date(b.data_execucao).getTime() - new Date(a.data_execucao).getTime()) || [];

      let streakAtual = 0;
      let dataAnterior: Date | null = null;

      for (const execucao of execucoesOrdenadas) {
        const dataExecucao = new Date(execucao.data_execucao);
        
        if (!dataAnterior) {
          // Primeira execução
          const hoje = new Date();
          const diferenca = Math.floor((hoje.getTime() - dataExecucao.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diferenca <= 1) { // Hoje ou ontem
            streakAtual = 1;
            dataAnterior = dataExecucao;
          } else {
            break; // Streak quebrado
          }
        } else {
          // Verificar continuidade
          const diferenca = Math.floor((dataAnterior.getTime() - dataExecucao.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diferenca === 1) { // Dia consecutivo
            streakAtual++;
            dataAnterior = dataExecucao;
          } else {
            break; // Streak quebrado
          }
        }
      }

      return {
        totalTreinos: total,
        totalMinutos,
        treinosConcluidos: concluidos,
        treinosIncompletos: incompletos,
        avaliacaoMedia: Math.round(avaliacaoMedia * 10) / 10,
        streakAtual
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalTreinos: 0,
        totalMinutos: 0,
        treinosConcluidos: 0,
        treinosIncompletos: 0,
        avaliacaoMedia: 0,
        streakAtual: 0
      };
    }
  }

  // Progresso de um exercício específico ao longo do tempo
  async obterProgressoExercicio(
    usuarioId: string,
    exercicioId: string,
    limit = 10
  ): Promise<ExercicioExecutado[]> {
    try {
      const { data, error } = await supabase
        .from('exercicios_executados')
        .select(`
          *,
          treino_executado:treinos_executados(data_execucao)
        `)
        .eq('exercicio_id', exercicioId)
        .eq('treino_executado.usuario_id', usuarioId)
        .order('treino_executado.data_execucao', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter progresso do exercício:', error);
      return [];
    }
  }

  // Marcar treino como pulado
  async pularTreino(
    treinoId: string,
    motivo?: string,
    programaAtribuidoId?: string
  ): Promise<ApiResponse<TreinoExecutado>> {
    try {
      const { data, error } = await supabase
        .from('treinos_executados')
        .insert({
          treino_id: treinoId,
          programa_atribuido_id: programaAtribuidoId,
          status: 'pulado',
          feedback: motivo,
          data_execucao: new Date().toISOString()
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
      console.error('Erro ao pular treino:', error);
      return {
        data: null,
        error: 'Erro ao registrar treino pulado',
        success: false
      };
    }
  }

  // Remover execução (apenas incompletas)
  async removerExecucao(execucaoId: string): Promise<ApiResponse<boolean>> {
    try {
      // Verificar se é incompleta
      const { data: execucao } = await supabase
        .from('treinos_executados')
        .select('status')
        .eq('id', execucaoId)
        .single();

      if (execucao?.status !== 'incompleto') {
        return {
          data: false,
          error: 'Apenas execuções incompletas podem ser removidas',
          success: false
        };
      }

      const { error } = await supabase
        .from('treinos_executados')
        .delete()
        .eq('id', execucaoId);

      if (error) throw error;

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao remover execução:', error);
      return {
        data: false,
        error: 'Erro ao remover execução',
        success: false
      };
    }
  }

  // Buscar última execução do usuário
  async buscarUltimaExecucao(usuarioId: string): Promise<TreinoExecutado | null> {
    try {
      const { data, error } = await supabase
        .from('treinos_executados')
        .select(`
          *,
          treino:treinos(nome)
        `)
        .eq('usuario_id', usuarioId)
        .order('data_execucao', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar última execução:', error);
      return null;
    }
  }
}

export const execucaoService = new ExecucaoService();