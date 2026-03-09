// ===========================================
// TIPOS PARA NOVA ESTRUTURA: EXERCÍCIOS → TREINOS → PROGRAMAS
// ===========================================

// Tipos base
export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: 'aluno' | 'personal' | 'personal_trainer' | 'profissional';
  plano: 'trial' | 'mensal' | 'anual';
  data_inicio: string;
  data_fim?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  idade?: number;
  peso?: number;
  altura?: number;
  objetivo?: string;
  nivel_experiencia?: 'Iniciante' | 'Intermediário' | 'Avançado';
  dores_existentes?: string[];
  localizacao_dores?: string;
  intensidade_dor?: number;
  atividade_fisica_frequencia?: string;
  medicamentos?: string;
  restricoes_medicas?: string;
  created_at: string;
  updated_at: string;
}

// ===========================================
// NOVA HIERARQUIA: EXERCÍCIOS
// ===========================================

export interface Exercicio {
  id: string;
  nome: string;
  descricao?: string;
  grupo_muscular: string[]; // Array de grupos: ['pernas', 'glúteos']
  equipamento?: string; // 'peso livre', 'máquina', 'peso corporal'
  dificuldade: 'iniciante' | 'intermediario' | 'avancado';
  mobilidade: 'musculacao' | 'cardio' | 'yoga' | 'flexibilidade'; // NOVO CAMPO
  instrucoes?: string;
  dicas_seguranca?: string;
  video_url?: string;
  imagem_url?: string;
  criado_por?: string; // ID do personal que criou
  is_publico: boolean;
  created_at: string;
  updated_at: string;
}

// ===========================================
// TREINOS (SEQUÊNCIA DE EXERCÍCIOS)
// ===========================================

export interface Treino {
  id: string;
  nome: string;
  descricao?: string;
  objetivo?: string; // 'Hipertrofia', 'Força', 'Resistência'
  duracao_estimada?: number; // em minutos
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  criado_por?: string;
  is_publico: boolean;
  tags?: string[]; // ['hipertrofia', 'pernas', 'iniciante']
  created_at: string;
  updated_at: string;
}

export interface TreinoExercicio {
  id: string;
  treino_id: string;
  exercicio_id: string;
  ordem: number; // ordem no treino (1, 2, 3...)
  series: number;
  repeticoes: string; // '12', '8-10', 'até falha'
  peso_sugerido?: string; // '70% 1RM', 'moderado', '40kg'
  tempo_descanso?: string; // '60s', '1-2min'
  observacoes?: string;
  created_at: string;
  
  // Dados expandidos (joins)
  exercicio?: Exercicio;
}

export interface TreinoCompleto extends Treino {
  exercicios: TreinoExercicio[];
}

// ===========================================
// PROGRAMAS (PLANOS COMPLETOS)
// ===========================================

export interface Programa {
  id: string;
  nome: string;
  descricao?: string;
  objetivo?: string; // 'Ganho massa muscular', 'Perda de peso'
  duracao_semanas?: number;
  frequencia_semanal?: number; // quantos dias por semana
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  criado_por?: string;
  is_publico: boolean;
  categoria?: string; // 'Hipertrofia', 'Emagrecimento', 'Força'
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProgramaTreino {
  id: string;
  programa_id: string;
  treino_id: string;
  dia_semana?: number; // 1=segunda, 2=terça, etc.
  semana?: number; // qual semana do programa
  ordem?: number;
  observacoes?: string;
  created_at: string;
  
  // Dados expandidos
  treino?: TreinoCompleto;
}

export interface ProgramaCompleto extends Programa {
  treinos: ProgramaTreino[];
}

// ===========================================
// ATRIBUIÇÕES E EXECUÇÕES
// ===========================================

export interface ProgramaAtribuido {
  id: string;
  personal_id: string;
  aluno_id: string;
  programa_id: string;
  data_inicio: string;
  data_fim?: string;
  status: 'ativo' | 'pausado' | 'concluido' | 'cancelado';
  observacoes?: string;
  progresso?: any; // JSON com progressos
  created_at: string;
  updated_at: string;
  
  // Dados expandidos
  programa?: ProgramaCompleto;
  personal?: User;
  aluno?: User;
}

export interface TreinoExecutado {
  id: string;
  usuario_id: string;
  treino_id: string;
  programa_atribuido_id?: string;
  data_execucao: string;
  duracao_minutos?: number;
  avaliacao?: number; // 1-5 estrelas
  feedback?: string;
  status: 'concluido' | 'incompleto' | 'pulado';
  created_at: string;
  
  // Dados expandidos
  treino?: TreinoCompleto;
  exercicios_executados?: ExercicioExecutado[];
}

export interface ExercicioExecutado {
  id: string;
  treino_executado_id: string;
  exercicio_id: string;
  series_planejadas?: number;
  series_executadas?: number;
  repeticoes_planejadas?: string;
  repeticoes_executadas?: number[]; // [12, 10, 8]
  peso_utilizado?: number[]; // [50, 50, 45]
  tempo_descanso_real?: string;
  observacoes?: string;
  dificuldade_percebida?: number; // 1-10
  created_at: string;
  
  // Dados expandidos
  exercicio?: Exercicio;
}

// ===========================================
// LOGS E ANÁLISES
// ===========================================

export interface DorLog {
  id: string;
  usuario_id: string;
  treino_executado_id?: string;
  exercicio_id?: string;
  data: string;
  intensidade: number; // 0-10
  musculo: string;
  tipo_dor?: 'aguda' | 'crônica' | 'fadiga';
  descricao?: string;
  created_at: string;
  
  // Dados expandidos
  exercicio?: Exercicio;
  treino_executado?: TreinoExecutado;
}

// ===========================================
// RELACIONAMENTOS
// ===========================================

export interface PersonalAluno {
  id: string;
  personal_id: string;
  aluno_id: string;
  data_vinculo: string;
  ativo: boolean;
  created_at: string;
  
  // Dados expandidos
  personal?: User;
  aluno?: User;
}

// ===========================================
// COMUNIDADE (mantida)
// ===========================================

export interface ComunidadePost {
  id: string;
  usuario_id: string;
  conteudo: string;
  imagem_url?: string;
  titulo?: string;
  tipo: string;
  curtidas: number;
  visualizacoes: number;
  data: string;
  created_at: string;
  
  // Dados expandidos
  usuario?: User;
}

export interface ComunidadeComentario {
  id: string;
  post_id: string;
  usuario_id: string;
  conteudo: string;
  curtidas: number;
  parent_comment_id?: string;
  data: string;
  created_at: string;
  
  // Dados expandidos
  usuario?: User;
}

// ===========================================
// UTILITÁRIOS E RESPONSES
// ===========================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filtros para busca
export interface ExercicioFilter {
  grupo_muscular?: string[];
  equipamento?: string;
  dificuldade?: string;
  criado_por?: string;
  search?: string;
}

export interface TreinoFilter {
  nivel?: string;
  objetivo?: string;
  tags?: string[];
  criado_por?: string;
  search?: string;
}

export interface ProgramaFilter {
  nivel?: string;
  categoria?: string;
  duracao_semanas?: number;
  frequencia_semanal?: number;
  tags?: string[];
  criado_por?: string;
  search?: string;
}

// Estados de carregamento
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// ===========================================
// TIPOS LEGADOS (deprecated - migrar gradualmente)
// ===========================================

/** @deprecated Use Exercicio instead */
export interface Dor {
  id: string;
  user_id: string;
  intensidade: number;
  localizacao: string;
  observacoes?: string;
  data_registro: string;
}

// Exportar tudo
export * from './navigation.types';

// Constantes úteis
export const GRUPOS_MUSCULARES = [
  'peito', 'costas', 'ombros', 'bíceps', 'tríceps',
  'pernas', 'quadríceps', 'posteriores', 'glúteos', 
  'panturrilhas', 'core', 'abdômen'
] as const;

export const EQUIPAMENTOS = [
  'peso corporal', 'halteres', 'barra', 'máquina',
  'elásticos', 'kettlebell', 'medicine ball', 'TRX'
] as const;

export const OBJETIVOS_TREINO = [
  'Hipertrofia', 'Força', 'Resistência', 'Emagrecimento',
  'Condicionamento', 'Reabilitação', 'Flexibilidade'
] as const;