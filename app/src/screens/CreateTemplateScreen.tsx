import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
 View, 
 Text, 
 ScrollView, 
 TouchableOpacity, 
 Alert,
 TextInput,
 FlatList 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
 colors,
 typography,
 spacing,
 borderRadius,
 Button,
 Card,
 Input,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { templateService } from '../services/templateService';
import { treinoService } from '../services/treinoService';

interface CreateTemplateScreenProps {
 navigation: any;
 route: {
  params?: {
   template?: any;
   isEditing?: boolean;
   isCopy?: boolean;
  };
 };
}

export const CreateTemplateScreen = memo<CreateTemplateScreenProps>(({ navigation, route }) => {
 const { template, isEditing = false, isCopy = false } = route.params || {};
 const [nome, setNome] = useState(template?.nome || '');
 const [descricao, setDescricao] = useState(template?.descricao || '');
 const [objetivo, setObjetivo] = useState(template?.objetivo || '');
 const [tipoTreino, setTipoTreino] = useState(template?.tipo_treino || 'personalizado');
 const [nivelDificuldade, setNivelDificuldade] = useState<'iniciante' | 'intermediario' | 'avancado'>(template?.nivel_dificuldade || 'iniciante');
 const [calculatedDuration, setCalculatedDuration] = useState(0);
 const [frequenciaSemanal, setFrequenciaSemanal] = useState(template?.frequencia_semanal || 3);
 const [publico, setPublico] = useState(template?.publico || false);
 const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
 const [availableWorkouts, setAvailableWorkouts] = useState<any[]>([]);
 const [filteredWorkouts, setFilteredWorkouts] = useState<any[]>([]);
 const [searchText, setSearchText] = useState('');
 const [loading, setLoading] = useState(false);
 const [loadingWorkouts, setLoadingWorkouts] = useState(true);

 // Load template data when editing
 useEffect(() => {
  if (isEditing && template) {
   setNome(template.nome || '');
   setDescricao(template.descricao || '');
   setObjetivo(template.objetivo || '');
   setTipoTreino(template.tipo_treino || 'personalizado');
   setNivelDificuldade(template.nivel_dificuldade || 'iniciante');
   // Duration will be calculated from exercises
   setFrequenciaSemanal(template.frequencia_semanal || 3);
   setPublico(template.publico || false);
  }
 }, [isEditing, template]);

 // Load template exercises when editing
 useEffect(() => {
  const loadTemplateExercises = async () => {
   if ((isEditing || isCopy) && template?.id && availableWorkouts.length > 0) {
    try {
     // Get template exercises from database
     const templateData = await templateService.obterTemplate(template.id);
     if (templateData.treinos && templateData.treinos.length > 0) {
      const exerciseIds = templateData.treinos.map((t: any) => t.id);
      setSelectedWorkouts(exerciseIds);
      console.log('Loaded template exercises:', exerciseIds);
     } else {
      console.log('No exercises found for template');
     }
    } catch (error) {
     console.error('Erro ao carregar exercícios do template:', error);
    }
   }
  };

  loadTemplateExercises();
 }, [isEditing, isCopy, template?.id, availableWorkouts.length]);

 // Calculate duration from selected exercises
 useEffect(() => {
  if (selectedWorkouts.length > 0 && availableWorkouts.length > 0) {
   const selectedExercises = availableWorkouts.filter(workout => 
    selectedWorkouts.includes(workout.id)
   );
   const totalDuration = selectedExercises.reduce((total, exercise) => 
    total + (exercise.duracao_min || 0), 0
   );
   setCalculatedDuration(totalDuration);
  } else {
   setCalculatedDuration(0);
  }
 }, [selectedWorkouts, availableWorkouts]);

 const TIPOS_TREINO = [
  { id: 'personalizado', label: 'Personalizado', icon: '' },
  { id: 'cardio', label: 'Cardio', icon: 'heart' },
  { id: 'forca', label: 'Força', icon: '' },
  { id: 'flexibilidade', label: 'Flexibilidade', icon: '🤸' },
  { id: 'funcional', label: 'Funcional', icon: '🏃' },
 ];

 const NIVEIS = [
  { id: 'iniciante', label: 'Iniciante', icon: '🟢' },
  { id: 'intermediario', label: 'Intermediário', icon: '🟡' },
  { id: 'avancado', label: 'Avançado', icon: '🔴' },
 ];

 const loadWorkouts = useCallback(async () => {
  try {
   setLoadingWorkouts(true);
   const workouts = await treinoService.listarTreinos();
   setAvailableWorkouts(workouts);
  } catch (error: any) {
   console.error('Erro ao carregar treinos:', error);
   console.error('Error details:', error.message, error.stack);
   Alert.alert('Erro', `Não foi possível carregar os treinos: ${error.message || 'Erro desconhecido'}`);
  } finally {
   setLoadingWorkouts(false);
  }
 }, []);

 useEffect(() => {
  loadWorkouts();
 }, [loadWorkouts]);

 // Filter workouts based on search text
 useEffect(() => {
  if (!searchText.trim()) {
   setFilteredWorkouts(availableWorkouts);
  } else {
   const filtered = availableWorkouts.filter(workout =>
    workout.exercicio?.toLowerCase().includes(searchText.toLowerCase()) ||
    workout.categoria?.toLowerCase().includes(searchText.toLowerCase()) ||
    workout.tipo?.toLowerCase().includes(searchText.toLowerCase())
   );
   setFilteredWorkouts(filtered);
  }
 }, [availableWorkouts, searchText]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleWorkoutToggle = useCallback((workoutId: string) => {
  Haptics.selectionAsync();
  setSelectedWorkouts(prev => 
   prev.includes(workoutId) 
    ? prev.filter(id => id !== workoutId)
    : [...prev, workoutId]
  );
 }, []);

 const handleCreateTemplate = useCallback(async () => {
  if (!nome.trim()) {
   Alert.alert('Erro', 'Nome do programa é obrigatório');
   return;
  }

  if (selectedWorkouts.length === 0) {
   Alert.alert('Erro', 'Selecione pelo menos um exercício');
   return;
  }

  try {
   setLoading(true);

   const templateData = {
    nome: nome.trim(),
    descricao: descricao.trim() || undefined,
    objetivo: objetivo.trim() || undefined,
    tipo_treino: tipoTreino,
    nivel_dificuldade: nivelDificuldade,
    duracao_estimada_min: calculatedDuration || 30,
    frequencia_semanal: frequenciaSemanal,
    publico,
   };

   if (isEditing && template?.id) {
    await templateService.atualizarTemplate(template.id, {
     ...templateData,
     treino_ids: selectedWorkouts,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
     'Sucesso', 
     'Programa atualizado com sucesso!',
     [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
   } else {
    await templateService.criarTemplate({
     ...templateData,
     treino_ids: selectedWorkouts,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
     'Sucesso', 
     'Programa criado com sucesso!',
     [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
   }
  } catch (error: any) {
   console.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} template:`, error);
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
   Alert.alert('Erro', error.message || `Não foi possível ${isEditing ? 'atualizar' : 'criar'} o programa`);
  } finally {
   setLoading(false);
  }
 }, [nome, descricao, tipoTreino, nivelDificuldade, publico, selectedWorkouts, navigation, isEditing, template, isCopy]);

 const renderWorkoutItem = ({ item }: { item: any }) => {
  const isSelected = selectedWorkouts.includes(item.id);
  
  return (
   <TouchableOpacity
    onPress={() => handleWorkoutToggle(item.id)}
    activeOpacity={0.8}
    style={{ marginBottom: spacing.sm }}
   >
    <Card 
     variant="elevated" 
     padding="md" 
     style={{
      borderWidth: 2,
      borderColor: isSelected ? colors.accent.primary : colors.surface.border,
      backgroundColor: isSelected 
       ? colors.accent.primary + '10' 
       : colors.surface.card,
     }}
    >
     <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
     }}>
      {/* Checkbox */}
      <View style={{
       width: 24,
       height: 24,
       borderRadius: 12,
       borderWidth: 2,
       borderColor: isSelected ? colors.accent.primary : colors.surface.border,
       backgroundColor: isSelected ? colors.accent.primary : 'transparent',
       alignItems: 'center',
       justifyContent: 'center',
      }}>
       {isSelected && (
        <Text style={{ color: colors.text.inverse, fontSize: 14, fontWeight: '600' }}>
         ✓
        </Text>
       )}
      </View>

      {/* Conteúdo do treino */}
      <View style={{ flex: 1 }}>
       <Text style={[typography.presets.body, { fontWeight: '600', marginBottom: spacing.xxs }]}>
        {item.exercicio}
       </Text>
       
       <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
       }}>
        <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
         {item.series || 3} séries
        </Text>
        <View style={{
         width: 4,
         height: 4,
         borderRadius: 2,
         backgroundColor: colors.text.tertiary,
        }} />
        <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
         {item.repeticoes || '10'} reps
        </Text>
        <View style={{
         width: 4,
         height: 4,
         borderRadius: 2,
         backgroundColor: colors.text.tertiary,
        }} />
        <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
         {item.duracao_min || 30}min
        </Text>
       </View>
      </View>
     </View>
    </Card>
   </TouchableOpacity>
  );
 };

 return (
  <ScreenWrapper navigation={navigation} showTabBar={false}>
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
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
      {isEditing ? 'Editar Programa' : 
       isCopy ? ' Copiar Programa' : 
       '➕ Criar Programa'}
     </Text>
     
     <View style={{ width: 44 }} />
    </View>

    <ScrollView
     style={{ flex: 1 }}
     contentContainerStyle={{
      paddingHorizontal: spacing.screenHorizontal,
      paddingBottom: spacing.screenVertical,
     }}
     showsVerticalScrollIndicator={false}
    >
     {/* Informações Básicas */}
     <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.presets.cardTitle, { marginBottom: spacing.md }]}>
        Informações do Programa
      </Text>

      <Input
       label="Nome do programa"
       value={nome}
       onChangeText={setNome}
       placeholder="Ex: Barriga Tanquinho, Força Total, Cardio Intenso..."
       style={{ marginBottom: spacing.md }}
      />
      
      <Text style={[typography.presets.caption, { color: colors.text.tertiary, marginBottom: spacing.md }]}>
        Dica: Crie programas temáticos como "Abdominais Completo", "Treino de Braços", etc.
      </Text>

      <Input
       label="Descrição (opcional)"
       value={descricao}
       onChangeText={setDescricao}
       placeholder="Descreva o programa..."
       multiline
       numberOfLines={2}
       style={{ marginBottom: spacing.md }}
      />

      <Input
       label="Objetivo (opcional)"
       value={objetivo}
       onChangeText={setObjetivo}
       placeholder="Ex: Fortalecimento, Reabilitação, Condicionamento..."
       style={{ marginBottom: spacing.md }}
      />

      {/* Tipo de Treino */}
      <Text style={[typography.presets.body, { marginBottom: spacing.sm }]}>
       Tipo de Treino
      </Text>
      <View style={{
       flexDirection: 'row',
       flexWrap: 'wrap',
       gap: spacing.sm,
       marginBottom: spacing.md,
      }}>
       {TIPOS_TREINO.map((tipo) => (
        <TouchableOpacity
         key={tipo.id}
         onPress={() => {
          Haptics.selectionAsync();
          setTipoTreino(tipo.id);
         }}
         activeOpacity={0.8}
        >
         <View style={{
          backgroundColor: tipoTreino === tipo.id 
           ? colors.background.elevated 
           : colors.background.secondary,
          borderWidth: 2,
          borderColor: tipoTreino === tipo.id 
           ? colors.accent.primary 
           : colors.surface.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
         }}>
          <Text style={{ fontSize: 14 }}>{tipo.icon}</Text>
          <Text style={{
           fontSize: typography.sizes.sm,
           fontWeight: '600',
           color: tipoTreino === tipo.id 
            ? colors.accent.primary 
            : colors.text.primary,
          }}>
           {tipo.label}
          </Text>
         </View>
        </TouchableOpacity>
       ))}
      </View>

      {/* Nível */}
      <Text style={[typography.presets.body, { marginBottom: spacing.sm }]}>
       Nível de Dificuldade
      </Text>
      <View style={{
       flexDirection: 'row',
       gap: spacing.sm,
       marginBottom: spacing.md,
      }}>
       {NIVEIS.map((niv) => (
        <TouchableOpacity
         key={niv.id}
         onPress={() => {
          Haptics.selectionAsync();
          setNivelDificuldade(niv.id as any);
         }}
         activeOpacity={0.8}
         style={{ flex: 1 }}
        >
         <View style={{
          backgroundColor: nivelDificuldade === niv.id 
           ? colors.background.elevated 
           : colors.background.secondary,
          borderWidth: 2,
          borderColor: nivelDificuldade === niv.id 
           ? colors.accent.primary 
           : colors.surface.border,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.sm,
          alignItems: 'center',
         }}>
          <Text style={{ fontSize: 16, marginBottom: spacing.xs }}>
           {niv.icon}
          </Text>
          <Text style={{
           fontSize: typography.sizes.sm,
           fontWeight: '600',
           color: nivelDificuldade === niv.id 
            ? colors.accent.primary 
            : colors.text.primary,
          }}>
           {niv.label}
          </Text>
         </View>
        </TouchableOpacity>
       ))}
      </View>

      {/* Duração Calculada e Frequência */}
      <View style={{
       flexDirection: 'row',
       gap: spacing.sm,
       marginBottom: spacing.md,
      }}>
       <View style={{ flex: 1 }}>
        <Text style={[typography.presets.body, { marginBottom: spacing.sm }]}>
          Duração Total (calculada)
        </Text>
        <View style={{
         backgroundColor: colors.background.secondary,
         borderRadius: borderRadius.sm,
         paddingHorizontal: spacing.md,
         paddingVertical: spacing.sm,
         borderWidth: 1,
         borderColor: colors.surface.border,
        }}>
         <Text style={[
          typography.presets.body, 
          { 
           color: calculatedDuration > 0 ? colors.accent.primary : colors.text.secondary,
           fontWeight: '600'
          }
         ]}>
          {calculatedDuration > 0 ? `${calculatedDuration} min` : 'Selecione exercícios'}
         </Text>
        </View>
       </View>
       
       <View style={{ flex: 1 }}>
        <Text style={[typography.presets.body, { marginBottom: spacing.sm }]}>
         Freq. Semanal
        </Text>
        <Input
         value={frequenciaSemanal.toString()}
         onChangeText={(text) => setFrequenciaSemanal(parseInt(text) || 0)}
         keyboardType="numeric"
         placeholder="3"
        />
       </View>
      </View>

      {/* Público */}
      <TouchableOpacity
       onPress={() => {
        Haptics.selectionAsync();
        setPublico(!publico);
       }}
       activeOpacity={0.8}
       style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
       }}
      >
       <View style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: publico ? colors.accent.primary : colors.surface.border,
        backgroundColor: publico ? colors.accent.primary : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
       }}>
        {publico && (
         <Text style={{ color: colors.text.inverse, fontSize: 14, fontWeight: '600' }}>
          ✓
         </Text>
        )}
       </View>
       <Text style={typography.presets.body}>
        Tornar programa público (outros usuários podem usar)
       </Text>
      </TouchableOpacity>
     </Card>

     {/* Seleção de Exercícios */}
     <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
      <View style={{
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: spacing.md,
      }}>
       <Text style={typography.presets.cardTitle}>
         Exercícios ({selectedWorkouts.length} selecionados)
       </Text>
      </View>

      {/* Search Input */}
      <Input
       value={searchText}
       onChangeText={setSearchText}
       placeholder=" Pesquisar exercícios..."
       style={{ marginBottom: spacing.md }}
      />

      {loadingWorkouts ? (
       <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Carregando exercícios...
        </Text>
       </View>
      ) : availableWorkouts.length === 0 ? (
       <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Ionicons name="help-circle-outline" size={48} color={colors.text.secondary} style={{ marginBottom: spacing.sm }} />
        <Text style={[typography.presets.body, { color: colors.text.secondary, textAlign: 'center' }]}>
         Nenhum exercício encontrado{'\n'}Crie alguns exercícios primeiro
        </Text>
       </View>
      ) : (
       filteredWorkouts.map((workout) => (
        <View key={workout.id}>
         {renderWorkoutItem({ item: workout })}
        </View>
       ))
      )}
     </Card>

     {/* Botão de Criar/Salvar */}
     <Button
      title={isEditing ? `Salvar Alterações` : 
          isCopy ? `Criar Cópia${selectedWorkouts.length > 0 ? ` (${selectedWorkouts.length} exercícios)` : ''}` :
          `Criar Programa${selectedWorkouts.length > 0 ? ` (${selectedWorkouts.length} exercícios)` : ''}`}
      onPress={handleCreateTemplate}
      variant="gradient"
      size="lg"
      loading={loading}
      disabled={!nome.trim() || selectedWorkouts.length === 0}
     />

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});