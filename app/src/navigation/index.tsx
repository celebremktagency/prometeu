import React, { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthScreen } from '../screens/AuthScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { ProgressScreen } from '../screens/ProgressScreen'
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen'
import { WorkoutTemplateDetailScreen } from '../screens/WorkoutTemplateDetailScreen'
import { CommunityScreen } from '../screens/CommunityScreen'
import { CalendarScreen } from '../screens/CalendarScreen'
import { ProfessionalDashboardScreen } from '../screens/ProfessionalDashboardScreen'
import { ClientListScreen } from '../screens/ClientListScreen'
import { ClientDetailsScreen } from '../screens/ClientDetailsScreen'
import { WorkoutLibraryScreen } from '../screens/WorkoutLibraryScreen'
import { CreateWorkoutScreen } from '../screens/CreateWorkoutScreen'
import { WorkoutExecutionScreen } from '../screens/WorkoutExecutionScreen'
import { ProgramExecutionScreen } from '../screens/ProgramExecutionScreen'
import { PainLevelScreen } from '../screens/PainLevelScreen'
import { WorkoutDetailScreen } from '../screens/WorkoutDetailScreen'
import { WorkoutTemplatesScreen } from '../screens/WorkoutTemplatesScreen'
import { CreateTemplateScreen } from '../screens/CreateTemplateScreen'
import { TemplateDetailScreen } from '../screens/TemplateDetailScreen'
import { InviteManagementScreen } from '../screens/InviteManagementScreen'
import { MyCodeScreen } from '../screens/MyCodeScreen'
import { ProfessionalCalendarScreen } from '../screens/ProfessionalCalendarScreen'
import { ClientProgressScreen } from '../screens/ClientProgressScreen'
import { ConnectPersonalScreen } from '../screens/ConnectPersonalScreen'
import { TrainerWorkspaceScreen } from '../screens/TrainerWorkspaceScreen'
import { CreateExerciseScreen } from '../screens/CreateExerciseScreen'
import ProgramLibraryScreen from '../screens/ProgramLibraryScreen'
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen'
import { authService } from '../services/authService'
import { supabase } from '../services/supabaseClient'
import { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AppNavigation = () => {
 const [isAuthenticated, setIsAuthenticated] = useState(false)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  checkAuthStatus()
  
  // Listener para mudanças no auth
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
   console.log('Auth state changed:', event, !!session?.user)
   
   if (event === 'SIGNED_IN' && session?.user) {
    console.log('Usuário logado:', session.user.email)
    setIsAuthenticated(true)
   } else if (event === 'SIGNED_OUT') {
    console.log('Usuário deslogado')
    setIsAuthenticated(false)
   } else {
    // Para TOKEN_REFRESHED e INITIAL_SESSION
    setIsAuthenticated(!!session?.user)
   }
   setLoading(false)
  })

  return () => subscription.unsubscribe()
 }, [])

 const checkAuthStatus = async () => {
  try {
   console.log('Verificando status de autenticação...')
   const { data: { session }, error } = await supabase.auth.getSession()
   
   if (error) {
    console.log('Erro ao verificar sessão:', error.message)
    setIsAuthenticated(false)
   } else if (session?.user) {
    console.log('Sessão existente encontrada:', session.user.email)
    setIsAuthenticated(true)
   } else {
    console.log('Nenhuma sessão encontrada')
    setIsAuthenticated(false)
   }
  } catch (error) {
   console.log('Erro na verificação de auth:', error)
   setIsAuthenticated(false)
  } finally {
   setLoading(false)
  }
 }

 if (loading) {
  return (
   <SafeAreaProvider>
    <View style={{ 
     flex: 1, 
     justifyContent: 'center', 
     alignItems: 'center', 
     backgroundColor: '#f5f5f5' 
    }}>
     <Text style={{ fontSize: 18, color: '#666' }}>
      Verificando login...
     </Text>
    </View>
   </SafeAreaProvider>
  )
 }

 return (
  <SafeAreaProvider>
   <NavigationContainer>
    <Stack.Navigator 
     id={undefined}
     screenOptions={{ headerShown: false }}
    >
     {isAuthenticated ? (
      <>
       <Stack.Screen name="Home" component={HomeScreen} />
       <Stack.Screen name="Profile" component={ProfileScreen} />
       <Stack.Screen name="Progress" component={ProgressScreen} />
       <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
       <Stack.Screen name="WorkoutTemplateDetail" component={WorkoutTemplateDetailScreen} />
       <Stack.Screen name="Community" component={CommunityScreen} />
       <Stack.Screen name="Calendar" component={CalendarScreen} />
       <Stack.Screen name="ProfessionalDashboard" component={ProfessionalDashboardScreen} />
       <Stack.Screen name="ClientList" component={ClientListScreen} />
       <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
       <Stack.Screen name="WorkoutLibrary" component={WorkoutLibraryScreen} />
       <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} />
       <Stack.Screen name="WorkoutExecution" component={WorkoutExecutionScreen} />
       <Stack.Screen name="ProgramExecution" component={ProgramExecutionScreen} />
       <Stack.Screen name="PainLevel" component={PainLevelScreen} />
       <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
       <Stack.Screen name="WorkoutTemplates" component={WorkoutTemplatesScreen} />
       <Stack.Screen name="CreateTemplate" component={CreateTemplateScreen} />
       <Stack.Screen name="TemplateDetail" component={TemplateDetailScreen} />
       <Stack.Screen name="InviteManagement" component={InviteManagementScreen} />
       <Stack.Screen name="MyCode" component={MyCodeScreen} />
       <Stack.Screen name="ProfessionalCalendar" component={ProfessionalCalendarScreen} />
       <Stack.Screen name="ClientProgress" component={ClientProgressScreen} />
       <Stack.Screen name="ConnectPersonal" component={ConnectPersonalScreen} />
       <Stack.Screen name="TrainerWorkspace" component={TrainerWorkspaceScreen} />
       <Stack.Screen name="CreateExercise" component={CreateExerciseScreen} />
       <Stack.Screen name="ProgramLibrary" component={ProgramLibraryScreen} />
       <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
      </>
     ) : (
      <Stack.Screen name="Auth" component={AuthScreen} />
     )}
    </Stack.Navigator>
   </NavigationContainer>
  </SafeAreaProvider>
 )
}