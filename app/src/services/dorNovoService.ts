// ===========================================
// SERVIÇO DE DORES (NOVA ESTRUTURA)
// Gerencia logs de dores relacionados a exercícios e treinos
// ===========================================

import { supabase } from './supabaseClient';
import { DorLog, ApiResponse } from '../types';

class DorNovoService {
  // Registrar nova dor
  async registrarDor(dadosDor: {
    intensidade: number;
    musculo: string;
    tipo_dor?: 'aguda' | 'crônica' | 'fadiga';
    descricao?: string;
    treino_executado_id?: string;
    exercicio_id?: string;
  }): Promise<ApiResponse<DorLog>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('dores_logs')
        .insert({
          usuario_id: user.id,
          ...dadosDor,
          data: new Date().toISOString()
        })
        .select(`
          *,
          exercicio:exercicios(nome, grupo_muscular),
          treino_executado:treinos_executados(
            data_execucao,
            treino:treinos(nome)
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
      console.error('Erro ao registrar dor:', error);
      return {
        data: null,
        error: 'Erro ao registrar dor',
        success: false
      };
    }
  }

  // Buscar histórico de dores do usuário
  async buscarHistorico(
    page = 1,
    limit = 20,
    filtros: {
      musculo?: string;
      tipo_dor?: string;
      data_inicio?: string;
      data_fim?: string;
    } = {}
  ): Promise<{ data: DorLog[]; total: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('dores_logs')
        .select(`
          *,
          exercicio:exercicios(nome, grupo_muscular),
          treino_executado:treinos_executados(
            data_execucao,
            treino:treinos(nome)
          )
        `, { count: 'exact' })
        .eq('usuario_id', user.id);

      // Aplicar filtros
      if (filtros.musculo) {
        query = query.eq('musculo', filtros.musculo);
      }

      if (filtros.tipo_dor) {
        query = query.eq('tipo_dor', filtros.tipo_dor);
      }

      if (filtros.data_inicio) {
        query = query.gte('data', filtros.data_inicio);
      }

      if (filtros.data_fim) {
        query = query.lte('data', filtros.data_fim);
      }

      const { data, error, count } = await query
        .order('data', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Erro ao buscar histórico de dores:', error);
      return { data: [], total: 0 };
    }
  }

  // Buscar dor por ID
  async buscarPorId(id: string): Promise<DorLog | null> {
    try {
      const { data, error } = await supabase
        .from('dores_logs')
        .select(`
          *,
          exercicio:exercicios(nome, grupo_muscular),
          treino_executado:treinos_executados(
            data_execucao,
            treino:treinos(nome)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar dor:', error);
      return null;
    }
  }

  // Atualizar registro de dor
  async atualizarDor(
    id: string,
    dadosAtualizados: Partial<DorLog>
  ): Promise<ApiResponse<DorLog>> {
    try {
      const { data, error } = await supabase
        .from('dores_logs')
        .update(dadosAtualizados)
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
      console.error('Erro ao atualizar dor:', error);
      return {
        data: null,
        error: 'Erro ao atualizar registro de dor',
        success: false
      };
    }
  }

  // Deletar registro de dor
  async deletarDor(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('dores_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Erro ao deletar dor:', error);
      return {
        data: false,
        error: 'Erro ao deletar registro de dor',
        success: false
      };
    }
  }

  // Buscar dores relacionadas a um exercício específico
  async buscarPorExercicio(exercicioId: string): Promise<DorLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('dores_logs')
        .select(`
          *,
          exercicio:exercicios(nome, grupo_muscular)
        `)
        .eq('usuario_id', user.id)
        .eq('exercicio_id', exercicioId)
        .order('data', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar dores do exercício:', error);
      return [];
    }
  }

  // Buscar dores por grupo muscular
  async buscarPorMusculo(musculo: string, limit = 20): Promise<DorLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('dores_logs')
        .select(`
          *,
          exercicio:exercicios(nome, grupo_muscular),
          treino_executado:treinos_executados(
            data_execucao,
            treino:treinos(nome)
          )
        `)
        .eq('usuario_id', user.id)
        .eq('musculo', musculo)
        .order('data', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar dores do músculo:', error);
      return [];
    }
  }

  // Obter estatísticas de dores
  async obterEstatisticas(): Promise<{
    totalRegistros: number;
    intensidadeMedia: number;
    muscaloMaisAfetado: string;
    tipoDorMaisComum: string;
    registrosPorMes: { [mes: string]: number };
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('dores_logs')
        .select('intensidade, musculo, tipo_dor, data')
        .eq('usuario_id', user.id);

      if (error) throw error;

      const registros = data || [];
      const total = registros.length;

      if (total === 0) {
        return {
          totalRegistros: 0,
          intensidadeMedia: 0,
          muscaloMaisAfetado: '',
          tipoDorMaisComum: '',
          registrosPorMes: {}
        };
      }

      // Intensidade média
      const intensidadeMedia = registros.reduce((acc, r) => acc + r.intensidade, 0) / total;

      // Músculo mais afetado
      const musculos = registros.reduce((acc, r) => {
        acc[r.musculo] = (acc[r.musculo] || 0) + 1;
        return acc;
      }, {} as { [musculo: string]: number });

      const muscaloMaisAfetado = Object.entries(musculos)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

      // Tipo de dor mais comum
      const tiposDor = registros.reduce((acc, r) => {
        if (r.tipo_dor) {
          acc[r.tipo_dor] = (acc[r.tipo_dor] || 0) + 1;
        }
        return acc;
      }, {} as { [tipo: string]: number });

      const tipoDorMaisComum = Object.entries(tiposDor)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

      // Registros por mês (últimos 12 meses)
      const agora = new Date();
      const registrosPorMes: { [mes: string]: number } = {};

      for (let i = 11; i >= 0; i--) {
        const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const chave = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
        registrosPorMes[chave] = 0;
      }

      registros.forEach(r => {
        const data = new Date(r.data);
        const chave = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
        if (registrosPorMes.hasOwnProperty(chave)) {
          registrosPorMes[chave]++;
        }
      });

      return {
        totalRegistros: total,
        intensidadeMedia: Math.round(intensidadeMedia * 10) / 10,
        muscaloMaisAfetado,
        tipoDorMaisComum,
        registrosPorMes
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de dores:', error);
      return {
        totalRegistros: 0,
        intensidadeMedia: 0,
        muscaloMaisAfetado: '',
        tipoDorMaisComum: '',
        registrosPorMes: {}
      };
    }
  }

  // Registrar dor durante execução de treino
  async registrarDuranteTreino(
    treinoExecutadoId: string,
    exercicioId: string,
    intensidade: number,
    musculo: string,
    descricao?: string
  ): Promise<ApiResponse<DorLog>> {
    return this.registrarDor({
      intensidade,
      musculo,
      tipo_dor: 'aguda',
      descricao,
      treino_executado_id: treinoExecutadoId,
      exercicio_id: exercicioId
    });
  }

  // Buscar últimas dores (dashboard)
  async buscarRecentes(limit = 5): Promise<DorLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('dores_logs')
        .select(`
          *,
          exercicio:exercicios(nome),
          treino_executado:treinos_executados(
            treino:treinos(nome)
          )
        `)
        .eq('usuario_id', user.id)
        .order('data', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar dores recentes:', error);
      return [];
    }
  }

  // Verificar se exercício causa dor frequente
  async verificarExercicioProblematico(exercicioId: string): Promise<{
    causaDor: boolean;
    intensidadeMedia: number;
    totalOcorrencias: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('dores_logs')
        .select('intensidade')
        .eq('usuario_id', user.id)
        .eq('exercicio_id', exercicioId);

      if (error) throw error;

      const ocorrencias = data || [];
      const total = ocorrencias.length;

      if (total === 0) {
        return {
          causaDor: false,
          intensidadeMedia: 0,
          totalOcorrencias: 0
        };
      }

      const intensidadeMedia = ocorrencias.reduce((acc, o) => acc + o.intensidade, 0) / total;

      return {
        causaDor: total >= 3, // 3 ou mais ocorrências = problemático
        intensidadeMedia: Math.round(intensidadeMedia * 10) / 10,
        totalOcorrencias: total
      };
    } catch (error) {
      console.error('Erro ao verificar exercício problemático:', error);
      return {
        causaDor: false,
        intensidadeMedia: 0,
        totalOcorrencias: 0
      };
    }
  }
}

export const dorNovoService = new DorNovoService();