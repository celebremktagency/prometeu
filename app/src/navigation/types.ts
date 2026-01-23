export type RootStackParamList = {
 Auth: undefined
 Home: undefined
 Profile: undefined
 Progress: undefined
 ExerciseDetail: {
  exercise: any
 }
 WorkoutTemplateDetail: {
  template: any
 }
 Community: undefined
 Calendar: undefined
 ProfessionalDashboard: undefined
 ClientList: undefined
 ClientDetails: {
  client: any
 }
 WorkoutLibrary: undefined
 CreateWorkout: {
  template?: any
 }
 WorkoutExecution: {
  workout: any
  programExecution?: any
  workoutIndex?: number
 }
 ProgramExecution: {
  template: any
 }
 PainLevel: {
  returnTo: string
  returnParams?: any
  workoutCompleted?: boolean
  workoutSummary?: {
   duration: string
   sets: string
   exercise: string
  }
 }
 WorkoutDetail: {
  workout: any
 }
 WorkoutTemplates: undefined
 CreateTemplate: undefined
 TemplateDetail: {
  template: any
 }
 InviteManagement: undefined
 MyCode: undefined
 ProfessionalCalendar: undefined
 ClientProgress: {
  client: any
 }
 ConnectPersonal: undefined
 TrainerWorkspace: undefined
 CreateExercise: undefined
 ProgramLibrary: undefined
 ExerciseLibrary: undefined
 CreateProgram: undefined
}