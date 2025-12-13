import React, { memo, useState, useCallback } from 'react';
import { 
 View, 
 Text, 
 ScrollView, 
 TouchableOpacity, 
 Alert,
 TextInput,
 Vibration 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
 colors,
 typography,
 spacing,
 borderRadius,
 Button,
 Card,
} from '../design-system';
import { dorService } from '../services/dorService';

interface PainLevelScreenProps {
 navigation: any;
 route: {
  params: {
   returnTo: string;
   returnParams?: any;
   workoutCompleted?: boolean;
   workoutSummary?: {
    duration: string;
    sets: string;
    exercise: string;
   };
  };
 };
}

export const PainLevelScreen = memo<PainLevelScreenProps>(({ navigation, route }) => {
 const { returnTo, returnParams, workoutCompleted, workoutSummary } = route.params;
 const [painLevel, setPainLevel] = useState(0);
 const [painLocation, setPainLocation] = useState('');
 const [painDescription, setPainDescription] = useState('');
 const [loading, setLoading] = useState(false);

 const painLevels = [
  { level: 0, label: 'Sem dor', emoji: '', color: colors.accent.secondary },
  { level: 1, label: 'Muito leve', emoji: '🙂', color: '#90EE90' },
  { level: 2, label: 'Leve', emoji: '😐', color: '#FFE135' },
  { level: 3, label: 'Moderada', emoji: '😕', color: '#FFA500' },
  { level: 4, label: 'Forte', emoji: '😖', color: '#FF6B6B' },
  { level: 5, label: 'Muito forte', emoji: '😣', color: colors.semantic.error },
 ];

 const commonPainLocations = [
  'Joelho', 'Costas', 'Ombro', 'Pescoço', 'Quadril', 
  'Punho', 'Tornozelo', 'Lombar', 'Cervical', 'Outro'
 ];

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleSavePain = useCallback(async () => {
  if (painLevel === 0) {
   // No pain, just go back with success message
   if (workoutCompleted) {
    Alert.alert(
     'Ótimo! ',
     `Treino concluído com sucesso!\n\n${workoutSummary?.exercise}\nDuração: ${workoutSummary?.duration}\nSéries: ${workoutSummary?.sets}`,
     [{ 
      text: 'Voltar', 
      onPress: () => {
       if (returnTo === 'ProgramExecution') {
        navigation.navigate(returnTo, returnParams);
       } else {
        navigation.navigate('Home');
       }
      }
     }]
    );
   } else {
    navigation.navigate(returnTo, returnParams);
   }
   return;
  }

  if (!painLocation.trim()) {
   Alert.alert('Atenção', 'Por favor, informe onde está sentindo dor.');
   return;
  }

  try {
   setLoading(true);
   
   await dorService.registrarDor({
    nivel: painLevel,
    localizacao: painLocation,
    descricao: painDescription,
    contexto: workoutCompleted ? 'pós-treino' : 'durante-treino',
    exercicio_relacionado: workoutSummary?.exercise
   });

   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   Vibration.vibrate(100);

   Alert.alert(
    workoutCompleted ? 'Dor registrada' : 'Dor registrada - Pare o exercício',
    workoutCompleted 
     ? `Sua dor foi registrada. Recomendamos consultar um profissional.\n\nTreino: ${workoutSummary?.exercise}\nDuração: ${workoutSummary?.duration}`
     : 'Pare imediatamente o exercício e descanse. Sua dor foi registrada.',
    [{ 
     text: 'Entendi', 
     onPress: () => {
      if (returnTo === 'ProgramExecution') {
       navigation.navigate(returnTo, returnParams);
      } else {
       navigation.navigate('Home');
      }
     }
    }]
   );
  } catch (error: any) {
   Alert.alert('Erro', error.message || 'Não foi possível registrar a dor');
  } finally {
   setLoading(false);
  }
 }, [painLevel, painLocation, painDescription, navigation, returnTo, returnParams, workoutCompleted, workoutSummary]);

 return (
  <LinearGradient
   colors={[colors.background.primary, colors.background.secondary]}
   style={{ flex: 1 }}
  >
   <SafeAreaView style={{ flex: 1 }}>
    {/* Header */}
    <View style={{
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: spacing.screenHorizontal,
     paddingVertical: spacing.screenVertical,
    }}>
     <TouchableOpacity onPress={handleGoBack}>
      <Text style={{ fontSize: 24, color: colors.text.primary }}>←</Text>
     </TouchableOpacity>
     
     <Text style={typography.presets.screenTitle}>
      Como você se sentiu?
     </Text>
     
     <View style={{ width: 24 }} />
    </View>

    <ScrollView
     style={{ flex: 1 }}
     contentContainerStyle={{
      paddingHorizontal: spacing.screenHorizontal,
      paddingBottom: spacing.screenVertical,
     }}
     showsVerticalScrollIndicator={false}
    >
     {workoutCompleted && workoutSummary && (
      <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
       <Text style={[typography.presets.cardTitle, { marginBottom: spacing.sm }]}>
         Exercício Concluído
       </Text>
       <Text style={[typography.presets.body, { marginBottom: spacing.xs }]}>
        <Text style={{ fontWeight: '600' }}>Exercício:</Text> {workoutSummary.exercise}
       </Text>
       <Text style={[typography.presets.body, { marginBottom: spacing.xs }]}>
        <Text style={{ fontWeight: '600' }}>Duração:</Text> {workoutSummary.duration}
       </Text>
       <Text style={[typography.presets.body]}>
        <Text style={{ fontWeight: '600' }}>Séries:</Text> {workoutSummary.sets}
       </Text>
      </Card>
     )}

     {/* Pain Level Selection */}
     <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.presets.cardTitle, { marginBottom: spacing.md }]}>
       Nível de Dor/Desconforto
      </Text>
      
      <View style={{
       flexDirection: 'row',
       flexWrap: 'wrap',
       gap: spacing.sm,
      }}>
       {painLevels.map((level) => (
        <TouchableOpacity
         key={level.level}
         onPress={() => {
          setPainLevel(level.level);
          Haptics.selectionAsync();
         }}
         style={{
          backgroundColor: painLevel === level.level ? level.color : colors.background.secondary,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          minWidth: '30%',
          alignItems: 'center',
          borderWidth: painLevel === level.level ? 2 : 1,
          borderColor: painLevel === level.level ? level.color : colors.surface.border,
         }}
        >
         <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>
          {level.emoji}
         </Text>
         <Text style={[
          typography.presets.caption,
          { 
           fontWeight: '600',
           textAlign: 'center',
           color: painLevel === level.level ? 'white' : colors.text.primary
          }
         ]}>
          {level.level}
         </Text>
         <Text style={[
          typography.presets.caption,
          { 
           textAlign: 'center',
           color: painLevel === level.level ? 'white' : colors.text.secondary
          }
         ]}>
          {level.label}
         </Text>
        </TouchableOpacity>
       ))}
      </View>
     </Card>

     {painLevel > 0 && (
      <>
       {/* Pain Location */}
       <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.presets.cardTitle, { marginBottom: spacing.md }]}>
         Onde está a dor?
        </Text>
        
        <View style={{
         flexDirection: 'row',
         flexWrap: 'wrap',
         gap: spacing.sm,
         marginBottom: spacing.md,
        }}>
         {commonPainLocations.map((location) => (
          <TouchableOpacity
           key={location}
           onPress={() => {
            setPainLocation(location);
            Haptics.selectionAsync();
           }}
           style={{
            backgroundColor: painLocation === location ? colors.accent.primary : colors.background.secondary,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderColor: painLocation === location ? colors.accent.primary : colors.surface.border,
           }}
          >
           <Text style={[
            typography.presets.caption,
            { 
             color: painLocation === location ? 'white' : colors.text.primary,
             fontWeight: '600'
            }
           ]}>
            {location}
           </Text>
          </TouchableOpacity>
         ))}
        </View>

        <TextInput
         style={{
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.surface.border,
          color: colors.text.primary,
          fontSize: 16,
         }}
         placeholder="Ou digite outra localização..."
         placeholderTextColor={colors.text.tertiary}
         value={painLocation}
         onChangeText={setPainLocation}
        />
       </Card>

       {/* Pain Description */}
       <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.presets.cardTitle, { marginBottom: spacing.md }]}>
         Descrição da dor (opcional)
        </Text>
        
        <TextInput
         style={{
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.surface.border,
          color: colors.text.primary,
          fontSize: 16,
          minHeight: 100,
          textAlignVertical: 'top',
         }}
         placeholder="Descreva a dor: é uma fisgada? Queimação? Pontada? O que sente exatamente?"
         placeholderTextColor={colors.text.tertiary}
         value={painDescription}
         onChangeText={setPainDescription}
         multiline={true}
         numberOfLines={4}
        />
       </Card>
      </>
     )}

     {/* Action Button */}
     <Button
      title={
       painLevel === 0 
        ? (workoutCompleted ? " Finalizei sem dor!" : " Continuar sem dor")
        : " Registrar dor"
      }
      onPress={handleSavePain}
      variant={painLevel === 0 ? "gradient" : "secondary"}
      size="lg"
      loading={loading}
     />

     <View style={{ height: spacing.xl * 2 }} />
    </ScrollView>
   </SafeAreaView>
  </LinearGradient>
 );
});