import { supabase } from './supabaseClient'

export interface WorkoutLibrary {
 id: string
 nome: string
 descricao: string
 categoria: string
 subcategoria?: string
 cor_tema: string
 criado_por?: string
 publico: boolean
 ativo: boolean
 created_at: string
 updated_at: string
}

export interface ExerciseCategory {
 id: string
 name: string
 description: string
 created_at: string
}

export const workoutLibraryService = {
 // Listar todas as bibliotecas disponíveis
 async getWorkoutLibraries(): Promise<WorkoutLibrary[]> {
  const { data, error } = await supabase
   .from('workout_libraries')
   .select('*')
   .eq('ativo', true)
   .eq('publico', true)
   .order('nome')

  if (error) throw error
  return data || []
 },

 // Obter biblioteca específica
 async getWorkoutLibrary(id: string): Promise<WorkoutLibrary | null> {
  const { data, error } = await supabase
   .from('workout_libraries')
   .select('*')
   .eq('id', id)
   .eq('ativo', true)
   .single()

  if (error) return null
  return data
 },

 // Listar bibliotecas por categoria
 async getLibrariesByCategory(categoria: string): Promise<WorkoutLibrary[]> {
  const { data, error } = await supabase
   .from('workout_libraries')
   .select('*')
   .eq('categoria', categoria)
   .eq('ativo', true)
   .eq('publico', true)
   .order('nome')

  if (error) throw error
  return data || []
 },

 // Obter todas as categorias de exercícios
 async getExerciseCategories(): Promise<ExerciseCategory[]> {
  const { data, error } = await supabase
   .from('exercise_categories')
   .select('*')
   .order('name')

  if (error) throw error
  return data || []
 },

 // Obter exercícios de uma biblioteca (assumindo relacionamento futuro)
 async getLibraryExercises(libraryId: string): Promise<any[]> {
  // Por enquanto, retorna exercícios relacionados por categoria
  const library = await this.getWorkoutLibrary(libraryId)
  if (!library) return []

  const { data, error } = await supabase
   .from('exercises')
   .select('*')
   .or(`grupo_muscular.ilike.%${library.categoria}%,tags.cs.{"${library.categoria}"}`)
   .eq('ativo', true)
   .order('nome')

  if (error) return []
  return data || []
 },

 // Buscar bibliotecas por termo
 async searchLibraries(searchTerm: string): Promise<WorkoutLibrary[]> {
  const { data, error } = await supabase
   .from('workout_libraries')
   .select('*')
   .or(`nome.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`)
   .eq('ativo', true)
   .eq('publico', true)
   .order('nome')

  if (error) throw error
  return data || []
 },

 // Obter estatísticas das bibliotecas
 async getLibraryStats() {
  const libraries = await this.getWorkoutLibraries()
  
  const categoryStats = libraries.reduce((acc, lib) => {
   acc[lib.categoria] = (acc[lib.categoria] || 0) + 1
   return acc
  }, {} as Record<string, number>)

  return {
   total: libraries.length,
   byCategory: categoryStats,
   categories: Object.keys(categoryStats),
   mostPopularCategory: Object.entries(categoryStats)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || null
  }
 },

 // Para personal trainers: criar biblioteca personalizada
 async createPersonalLibrary(library: Omit<WorkoutLibrary, 'id' | 'created_at' | 'updated_at' | 'criado_por'>): Promise<WorkoutLibrary> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
   .from('workout_libraries')
   .insert([{
    ...library,
    repeticoes: typeof (library as any).repeticoes === 'number' ? (library as any).repeticoes.toString() : (library as any).repeticoes,
    criado_por: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
   }])
   .select()
   .single()

  if (error) throw error
  return data
 },

 // Obter bibliotecas criadas por um personal trainer
 async getPersonalLibraries(): Promise<WorkoutLibrary[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
   .from('workout_libraries')
   .select('*')
   .eq('criado_por', user.id)
   .eq('ativo', true)
   .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
 }
}