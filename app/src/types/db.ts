// Tipos de usuário
export type UserType = 'personal' | 'aluno';
export type PlanType = 'trial' | 'mensal' | 'anual';
export type TreinoStatus = 'planned' | 'done' | 'skipped';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'canceled';

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: UserType;
  plano: PlanType;
  data_inicio: string;
  data_fim: string | null;
  created_at: string;
}

export interface Treino {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  series: number;
  repeticoes: string;
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  created_at: string;
}

export interface TreinoLog {
  id: string;
  usuario_id: string;
  treino_id: string;
  data: string;
  status: TreinoStatus;
  created_at: string;
}

export interface DorLog {
  id: string;
  usuario_id: string;
  treino_id: string | null;
  data: string;
  intensidade: number;
  musculo: string;
  descricao: string | null;
  created_at: string;
}

export interface PersonalAluno {
  id: string;
  personal_id: string;
  aluno_id: string;
  data_vinculo: string;
  ativo: boolean;
  created_at: string;
}

export interface ComunidadePost {
  id: string;
  usuario_id: string;
  conteudo: string;
  imagem_url: string | null;
  data: string;
  created_at: string;
}

export interface ComunidadeComentario {
  id: string;
  post_id: string;
  usuario_id: string;
  conteudo: string;
  data: string;
  created_at: string;
}

export interface Pagamento {
  id: string;
  usuario_id: string;
  plano: 'mensal' | 'anual';
  valor: number;
  status: PaymentStatus;
  metodo_pagamento: 'cartao' | 'pix' | null;
  gateway_transaction_id: string | null;
  data_inicio: string;
  data_fim: string;
  created_at: string;
}

// Tipos legados mantidos para compatibilidade
export interface Usuario extends User {}
export interface Dor extends DorLog {}

export interface Insight {
  id: string;
  usuario_id: string;
  progresso_semanal: number;
  nivel_dor: number;
  data_registro: string;
}

export interface ChartDataset {
  labels: string[];
  values: number[];
}

export interface WeeklyInsights {
  progresso_semanal: number;
  nivel_dor: number;
  dataset_chart: ChartDataset;
}