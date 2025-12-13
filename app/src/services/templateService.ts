import { supabase } from './supabaseClient';

export interface WorkoutTemplate {
 id: string;
 nome: string;
 descricao?: string;
 objetivo?: string;
 tipo_treino: string;
 nivel_dificuldade: 'iniciante' | 'intermediario' | 'avancado';
 duracao_estimada_min: number;
 frequencia_semanal: number;
 created_by: string;
 usuario_id?: string; // Adicionada para compatibilidade
 publico: boolean;
 created_at: string;
 treinos: any[];
 total_exercicios?: number;
}

class TemplateService {
 async listarTemplates(): Promise<WorkoutTemplate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Get all templates (simplified)
  const { data: templates, error } = await supabase
   .from('workout_templates')
   .select('*')
   .or(`publico.eq.true,created_by.eq.${user.id}`)
   .order('created_at', { ascending: false });

  if (error) {
   console.error('Erro ao carregar templates:', error);
   throw error;
  }

  // Calculate exercise count for each template
  const templatesWithCount = templates?.map(template => {
   let exerciseCount = 0;
   
   try {
    if (template.observacoes_profissional) {
     const parsed = JSON.parse(template.observacoes_profissional);
     if (parsed.treino_ids && Array.isArray(parsed.treino_ids)) {
      exerciseCount = parsed.treino_ids.length;
     }
    }
   } catch (parseError) {
    console.error('Erro ao fazer parse dos treino_ids:', parseError);
   }

   return {
    ...template,
    treinos: [],
    total_exercicios: exerciseCount,
   };
  }) || [];

  return templatesWithCount;
 }

 async obterTemplate(templateId: string): Promise<WorkoutTemplate> {
  const { data: template, error } = await supabase
   .from('workout_templates')
   .select('*')
   .eq('id', templateId)
   .single();

  if (error) throw error;

  // Parse treino_ids from observacoes_profissional
  let treinos: any[] = [];
  let treinoIds: string[] = [];
  
  try {
   if (template.observacoes_profissional) {
    const parsed = JSON.parse(template.observacoes_profissional);
    if (parsed.treino_ids && Array.isArray(parsed.treino_ids)) {
     treinoIds = parsed.treino_ids;
     
     // Fetch the actual treino details
     if (treinoIds.length > 0) {
      const { data: treinoDetails, error: treinosError } = await supabase
       .from('treinos')
       .select('*')
       .in('id', treinoIds);
      
      if (!treinosError && treinoDetails) {
       // Normalize repeticoes to always be string
       treinos = treinoDetails.map(treino => ({
        ...treino,
        repeticoes: typeof treino.repeticoes === 'number' ? treino.repeticoes.toString() : treino.repeticoes
       }));
      }
     }
    }
   }
  } catch (parseError) {
   console.error('Erro ao fazer parse dos treino_ids:', parseError);
  }

  return {
   ...template,
   treinos: treinos,
   total_exercicios: treinos.length,
  };
 }

 async criarTemplate(templateData: {
  nome: string;
  descricao?: string;
  objetivo?: string;
  tipo_treino: string;
  nivel_dificuldade: 'iniciante' | 'intermediario' | 'avancado';
  duracao_estimada_min?: number;
  frequencia_semanal: number;
  publico: boolean;
  treino_ids: string[];
 }): Promise<WorkoutTemplate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Calculate total duration from selected exercises
  let calculatedDuration = templateData.duracao_estimada_min || 30;
  
  if (templateData.treino_ids.length > 0) {
   const { data: exercises, error: exercisesError } = await supabase
    .from('treinos')
    .select('duracao_min')
    .in('id', templateData.treino_ids);
   
   if (!exercisesError && exercises) {
    calculatedDuration = exercises.reduce((total, ex) => total + (ex.duracao_min || 0), 0);
    if (calculatedDuration === 0) calculatedDuration = 30; // fallback
   }
  }

  // Create the template
  const { data: template, error: templateError } = await supabase
   .from('workout_templates')
   .insert({
    nome: templateData.nome,
    descricao: templateData.descricao,
    objetivo: templateData.objetivo,
    tipo_treino: templateData.tipo_treino,
    nivel_dificuldade: templateData.nivel_dificuldade,
    duracao_estimada_min: calculatedDuration,
    frequencia_semanal: templateData.frequencia_semanal,
    created_by: user.id,
    publico: templateData.publico,
   })
   .select()
   .single();

  if (templateError) throw templateError;

  // Store selected treino IDs as observacoes_profissional (temporary solution)
  if (templateData.treino_ids.length > 0) {
   const { error: updateError } = await supabase
    .from('workout_templates')
    .update({
     observacoes_profissional: JSON.stringify({ treino_ids: templateData.treino_ids })
    })
    .eq('id', template.id);

   if (updateError) {
    console.error('Erro ao salvar treino_ids:', updateError);
   }
  }

  return {
   ...template,
   treinos: [],
   total_exercicios: templateData.treino_ids.length,
  };
 }

 async atualizarTemplate(templateId: string, templateData: {
  nome: string;
  descricao?: string;
  objetivo?: string;
  tipo_treino: string;
  nivel_dificuldade: 'iniciante' | 'intermediario' | 'avancado';
  duracao_estimada_min?: number;
  frequencia_semanal: number;
  publico: boolean;
  treino_ids?: string[];
 }): Promise<WorkoutTemplate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Calculate duration from exercises if treino_ids provided
  let calculatedDuration = templateData.duracao_estimada_min || 30;
  
  if (templateData.treino_ids !== undefined && templateData.treino_ids.length > 0) {
   const { data: exercises, error: exercisesError } = await supabase
    .from('treinos')
    .select('duracao_min')
    .in('id', templateData.treino_ids);
   
   if (!exercisesError && exercises) {
    calculatedDuration = exercises.reduce((total, ex) => total + (ex.duracao_min || 0), 0);
    if (calculatedDuration === 0) calculatedDuration = 30; // fallback
   }
  }

  // Prepare update data including treino_ids if provided
  const updateData: any = {
   nome: templateData.nome,
   descricao: templateData.descricao,
   objetivo: templateData.objetivo,
   tipo_treino: templateData.tipo_treino,
   nivel_dificuldade: templateData.nivel_dificuldade,
   duracao_estimada_min: calculatedDuration,
   frequencia_semanal: templateData.frequencia_semanal,
   publico: templateData.publico,
  };

  // Store treino_ids in observacoes_profissional if provided
  if (templateData.treino_ids !== undefined) {
   updateData.observacoes_profissional = templateData.treino_ids.length > 0 
    ? JSON.stringify({ treino_ids: templateData.treino_ids })
    : '';
  }

  const { data: template, error } = await supabase
   .from('workout_templates')
   .update(updateData)
   .eq('id', templateId)
   .eq('created_by', user.id) // Only allow updating own templates
   .select()
   .single();

  if (error) throw error;

  return {
   ...template,
   treinos: [],
   total_exercicios: templateData.treino_ids ? templateData.treino_ids.length : 0,
  };
 }

 async excluirTemplate(templateId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
   .from('workout_templates')
   .delete()
   .eq('id', templateId)
   .eq('created_by', user.id); // Only allow deleting own templates

  if (error) throw error;
 }

 async iniciarTemplate(templateId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // For now, just log. The navigation will be handled in the screen
  console.log(`Template ${templateId} iniciado para usuário ${user.id}!`);
 }
}

export const templateService = new TemplateService();