import React, { memo, useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, TextInput, FlatList } from 'react-native';
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
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { exercicioService } from '../services/exercicioService';
import { treinoNovoService } from '../services/treinoNovoService';
import { Exercicio } from '../types';

interface CreateWorkoutScreenProps {
 navigation: any;
 route?: {
  params?: {
   template?: any;
  };
 };
}

export const CreateWorkoutScreen = memo<CreateWorkoutScreenProps>(({ navigation, route }) => {
 const template = route?.params?.template;
 const [currentStep, setCurrentStep] = useState(1);
 const totalSteps = 3;
 
 const [formData, setFormData] = useState({
  nome: template?.nome || '',
  descricao: template?.descricao || '',
  objetivo: template?.objetivo || 'hipertrofia',
  nivel: template?.nivel || 'iniciante',
  duracao_estimada: template?.duracao_estimada?.toString() || '45',
  is_publico: false,
 });

 const [exercicios, setExercicios] = useState<Exercicio[]>([]);
 const [exerciciosSelecionados, setExerciciosSelecionados] = useState<{exercicio: Exercicio, ordem: number, series?: number, repeticoes?: string, peso_sugerido?: number, tempo_descanso?: number}[]>([]);
 const [busca, setBusca] = useState('');
 const [loading, setLoading] = useState(false);

 const NIVEIS = [
  { id: 'iniciante', label: 'Iniciante', icon: '🟢', color: colors.accent.secondary },
  { id: 'intermediario', label: 'Intermediário', icon: '🟡', color: colors.semantic.warning },
  { id: 'avancado', label: 'Avançado', icon: '🔴', color: colors.semantic.error },
 ];

 const OBJETIVOS = [
  { id: 'hipertrofia', label: 'Hipertrofia', icon: '💪' },
  { id: 'forca', label: 'Força', icon: '🏋️' },
  { id: 'resistencia', label: 'Resistência', icon: '🏃' },
  { id: 'reabilitacao', label: 'Reabilitação', icon: '🏥' },
  { id: 'funcional', label: 'Funcional', icon: '⚡' },
 ];

 // Carregar exercícios disponíveis
 useEffect(() => {
  carregarExercicios();
 }, [busca]);

 const carregarExercicios = async () => {
  try {
   const response = await exercicioService.buscarExercicios(
    { search: busca },
    1,
    20
   );
   setExercicios(response.data || []);
  } catch (error) {
   console.error('Erro ao carregar exercícios:', error);
  }
 };

 const handleGoBack = useCallback(() => {
  if (currentStep > 1) {
   setCurrentStep(prev => prev - 1);
  } else {
   Haptics.selectionAsync();
   navigation.goBack();
  }
 }, [currentStep, navigation]);

 const handleNext = useCallback(() => {
  if (currentStep < totalSteps) {
   setCurrentStep(prev => prev + 1);
   Haptics.selectionAsync();
  }
 }, [currentStep, totalSteps]);

 const validateCurrentStep = () => {
  switch (currentStep) {
   case 1:
    return formData.nome.trim() !== '' && formData.descricao.trim() !== '';
   case 2:
    return exerciciosSelecionados.length > 0;
   case 3:
    return true; // Configurações finais são opcionais
   default:
    return true;
  }
 };

 const updateFormData = useCallback((field: string, value: string | boolean) => {
  setFormData(prev => ({ ...prev, [field]: value }));
 }, []);

 const adicionarExercicio = (exercicio: Exercicio) => {
  if (exerciciosSelecionados.find(ex => ex.exercicio.id === exercicio.id)) {
   Alert.alert('Aviso', 'Este exercício já foi adicionado ao treino');
   return;
  }

  const novoExercicio = {
   exercicio,
   ordem: exerciciosSelecionados.length + 1,
   series: 3,
   repeticoes: '10-12',
   peso_sugerido: 0,
   tempo_descanso: 60
  };

  setExerciciosSelecionados(prev => [...prev, novoExercicio]);
  setMostrarExercicios(false);
  Haptics.selectionAsync();
 };

 const removerExercicio = (index: number) => {
  setExerciciosSelecionados(prev => 
   prev.filter((_, i) => i !== index)
    .map((ex, i) => ({ ...ex, ordem: i + 1 }))
  );
  Haptics.selectionAsync();
 };

 const atualizarExercicio = (index: number, campo: string, valor: any) => {
  setExerciciosSelecionados(prev => 
   prev.map((ex, i) => 
    i === index ? { ...ex, [campo]: valor } : ex
   )
  );
 };

 const handleSubmit = useCallback(async () => {
  if (!formData.nome.trim()) {
   Alert.alert('Erro', 'Nome do treino é obrigatório');
   return;
  }

  if (exerciciosSelecionados.length === 0) {
   Alert.alert('Erro', 'Adicione pelo menos um exercício ao treino');
   return;
  }

  try {
   setLoading(true);

   // Criar treino
   const treinoData = {
    nome: formData.nome.trim(),
    descricao: formData.descricao.trim() || null,
    objetivo: formData.objetivo,
    nivel: formData.nivel,
    duracao_estimada: parseInt(formData.duracao_estimada) || 45,
    is_publico: formData.is_publico
   };

   const novoTreino = await treinoNovoService.criarTreino(treinoData);

   // Adicionar exercícios ao treino
   for (const ex of exerciciosSelecionados) {
    await treinoNovoService.adicionarExercicioTreino(novoTreino.id, {
     exercicio_id: ex.exercicio.id,
     ordem: ex.ordem,
     series: ex.series || 3,
     repeticoes: ex.repeticoes || '10-12',
     peso_sugerido: ex.peso_sugerido || 0,
     tempo_descanso: ex.tempo_descanso || 60
    });
   }

   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   Alert.alert(
    'Sucesso!', 
    'Treino criado com sucesso!',
    [
     {
      text: 'OK',
      onPress: () => navigation.goBack()
     }
    ]
   );
  } catch (error: any) {
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
   Alert.alert('Erro', error.message || 'Não foi possível criar o treino');
  } finally {
   setLoading(false);
  }
 }, [formData, exerciciosSelecionados, navigation]);

 const renderInput = (
  label: string,
  field: string,
  placeholder: string,
  options?: { 
   multiline?: boolean; 
   keyboardType?: 'default' | 'numeric' | 'url';
   maxLength?: number;
  }
 ) => (
  <View style={{ marginBottom: spacing.lg }}>
   <Text style={[
    typography.presets.body,
    { 
     fontWeight: '600',
     marginBottom: spacing.sm,
     color: colors.text.primary 
    }
   ]}>
    {label}
   </Text>
   
   <View style={{
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
    minHeight: options?.multiline ? 100 : 'auto',
   }}>
    <TextInput
     placeholder={placeholder}
     placeholderTextColor={colors.text.tertiary}
     value={(formData as any)[field]}
     onChangeText={(text) => updateFormData(field, text)}
     style={{
      fontSize: typography.sizes.md,
      color: colors.text.primary,
      padding: 0,
      textAlignVertical: options?.multiline ? 'top' : 'center',
     }}
     multiline={options?.multiline}
     keyboardType={options?.keyboardType}
     maxLength={options?.maxLength}
    />
   </View>
  </View>
 );

 const renderSelector = (
  label: string,
  field: string,
  options: { id: string; label: string; icon: string; color?: string }[]
 ) => (
  <View style={{ marginBottom: spacing.lg }}>
   <Text style={[
    typography.presets.body,
    { 
     fontWeight: '600',
     marginBottom: spacing.sm,
     color: colors.text.primary 
    }
   ]}>
    {label}
   </Text>
   
   <View style={{
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
   }}>
    {options.map((option) => (
     <TouchableOpacity
      key={option.id}
      onPress={() => {
       Haptics.selectionAsync();
       updateFormData(field, option.id);
      }}
      activeOpacity={0.8}
     >
      <View style={{
       backgroundColor: (formData as any)[field] === option.id 
        ? colors.background.elevated 
        : colors.background.secondary,
       borderWidth: 2,
       borderColor: (formData as any)[field] === option.id 
        ? (option.color || colors.accent.primary)
        : colors.surface.border,
       borderRadius: borderRadius.md,
       paddingHorizontal: spacing.md,
       paddingVertical: spacing.sm,
       flexDirection: 'row',
       alignItems: 'center',
       gap: spacing.xs,
      }}>
       <Text style={{ fontSize: 16 }}>
        {option.icon}
       </Text>
       <Text style={{
        fontSize: typography.sizes.sm,
        fontWeight: '600',
        color: (formData as any)[field] === option.id 
         ? (option.color || colors.accent.primary)
         : colors.text.primary,
       }}>
        {option.label}
       </Text>
      </View>
     </TouchableOpacity>
    ))}
   </View>
  </View>
 );

 return (
  <ScreenWrapper navigation={navigation} showTabBar={false}>
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
    <ScrollView
     style={{ flex: 1 }}
     contentContainerStyle={{
      paddingHorizontal: spacing.screenHorizontal,
      paddingVertical: spacing.screenVertical,
     }}
     showsVerticalScrollIndicator={false}
    >
     {/* Header */}
     <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xl,
     }}>
      <TouchableOpacity onPress={handleGoBack}>
       <Ionicons 
        name={currentStep > 1 ? "chevron-back" : "close"} 
        size={24} 
        color={colors.text.primary} 
       />
      </TouchableOpacity>
      
      <Text style={[
       typography.presets.screenTitle,
       { flex: 1, textAlign: 'center' }
      ]}>
       Criar Treino
      </Text>
      
      <View style={{ width: 24 }} />
     </View>

     {template && (
      <Card variant="glass" padding="md" style={{ marginBottom: spacing.lg }}>
       <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
       }}>
        <Ionicons name="information-circle-outline" size={20} color={colors.accent.tertiary} />
        <Text style={typography.presets.body}>
         Usando template: <Text style={{ fontWeight: '600' }}>{template.nome}</Text>
        </Text>
       </View>
      </Card>
     )}

     <Card variant="elevated" padding="lg">
      {/* Nome do Treino */}
      {renderInput(
       'Nome do Treino *',
       'nome',
       'Ex: Treino Peito e Tríceps, Upper Body...',
       { maxLength: 100 }
      )}

      {/* Descrição */}
      {renderInput(
       'Descrição',
       'descricao',
       'Descreva o objetivo e foco do treino...',
       { multiline: true, maxLength: 500 }
      )}

      {/* Duração Estimada */}
      {renderInput(
       'Duração Estimada (min)',
       'duracao_estimada',
       '45',
       { keyboardType: 'numeric' }
      )}

      {/* Objetivo */}
      {renderSelector('Objetivo', 'objetivo', OBJETIVOS)}

      {/* Nível */}
      {renderSelector('Nível de Dificuldade', 'nivel', NIVEIS)}

      {/* Visibilidade */}
      <View style={{ marginBottom: spacing.lg }}>
       <Text style={[
        typography.presets.body,
        { 
         fontWeight: '600',
         marginBottom: spacing.sm,
         color: colors.text.primary 
        }
       ]}>
        Visibilidade
       </Text>
       
       <View style={{
        flexDirection: 'row',
        gap: spacing.sm,
       }}>
        <TouchableOpacity
         onPress={() => {
          Haptics.selectionAsync();
          updateFormData('is_publico', false);
         }}
         activeOpacity={0.8}
         style={{ flex: 1 }}
        >
         <View style={{
          backgroundColor: !formData.is_publico 
           ? colors.background.elevated 
           : colors.background.secondary,
          borderWidth: 2,
          borderColor: !formData.is_publico 
           ? colors.accent.primary
           : colors.surface.border,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          alignItems: 'center',
         }}>
          <Text style={{ fontSize: 20, marginBottom: spacing.xs }}>🔒</Text>
          <Text style={[
           typography.presets.body,
           { 
            fontWeight: '600',
            color: !formData.is_publico ? colors.accent.primary : colors.text.primary
           }
          ]}>
           Privado
          </Text>
         </View>
        </TouchableOpacity>

        <TouchableOpacity
         onPress={() => {
          Haptics.selectionAsync();
          updateFormData('is_publico', true);
         }}
         activeOpacity={0.8}
         style={{ flex: 1 }}
        >
         <View style={{
          backgroundColor: formData.is_publico 
           ? colors.background.elevated 
           : colors.background.secondary,
          borderWidth: 2,
          borderColor: formData.is_publico 
           ? colors.accent.primary
           : colors.surface.border,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          alignItems: 'center',
         }}>
          <Text style={{ fontSize: 20, marginBottom: spacing.xs }}>🌐</Text>
          <Text style={[
           typography.presets.body,
           { 
            fontWeight: '600',
            color: formData.is_publico ? colors.accent.primary : colors.text.primary
           }
          ]}>
           Público
          </Text>
         </View>
        </TouchableOpacity>
       </View>
      </View>
     </Card>

     {/* Exercícios Selecionados */}
     <Card variant="elevated" padding="lg" style={{ marginTop: spacing.lg }}>
      <Text style={[
       typography.presets.body,
       { fontWeight: '600', marginBottom: spacing.md, color: colors.text.primary }
      ]}>Exercícios do Treino ({exerciciosSelecionados.length})</Text>

      {exerciciosSelecionados.map((item, index) => (
       <View key={item.exercicio.id} style={{
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.surface.border
       }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
         <Text style={[typography.presets.body, { fontWeight: '600', color: colors.text.primary, flex: 1 }]}>
          {item.ordem}. {item.exercicio.nome}
         </Text>
         <TouchableOpacity onPress={() => removerExercicio(index)}>
          <Ionicons name="trash-outline" size={20} color={colors.semantic.error} />
         </TouchableOpacity>
        </View>
        
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
         <View style={{ flex: 1 }}>
          <Text style={[typography.presets.caption, { color: colors.text.secondary, marginBottom: spacing.xs }]}>Séries</Text>
          <TextInput
           style={{
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.sm,
            padding: spacing.sm,
            color: colors.text.primary,
            textAlign: 'center'
           }}
           value={item.series?.toString() || '3'}
           onChangeText={(text) => atualizarExercicio(index, 'series', parseInt(text) || 3)}
           keyboardType="numeric"
          />
         </View>
         
         <View style={{ flex: 2 }}>
          <Text style={[typography.presets.caption, { color: colors.text.secondary, marginBottom: spacing.xs }]}>Repetições</Text>
          <TextInput
           style={{
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.sm,
            padding: spacing.sm,
            color: colors.text.primary,
            textAlign: 'center'
           }}
           value={item.repeticoes || '10-12'}
           onChangeText={(text) => atualizarExercicio(index, 'repeticoes', text)}
          />
         </View>
         
         <View style={{ flex: 1 }}>
          <Text style={[typography.presets.caption, { color: colors.text.secondary, marginBottom: spacing.xs }]}>Descanso (s)</Text>
          <TextInput
           style={{
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.sm,
            padding: spacing.sm,
            color: colors.text.primary,
            textAlign: 'center'
           }}
           value={item.tempo_descanso?.toString() || '60'}
           onChangeText={(text) => atualizarExercicio(index, 'tempo_descanso', parseInt(text) || 60)}
           keyboardType="numeric"
          />
         </View>
        </View>
       </View>
      ))}

      <Button
       title="+ Adicionar Exercício"
       onPress={() => setMostrarExercicios(true)}
       variant="outline"
       size="md"
      />
     </Card>

     {/* Modal de Seleção de Exercícios */}
     {mostrarExercicios && (
      <Card variant="elevated" padding="lg" style={{ marginTop: spacing.lg }}>
       <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <Text style={[typography.presets.body, { fontWeight: '600', color: colors.text.primary }]}>Selecionar Exercício</Text>
        <TouchableOpacity onPress={() => setMostrarExercicios(false)}>
         <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
       </View>
       
       <TextInput
        style={{
         backgroundColor: colors.background.secondary,
         borderRadius: borderRadius.md,
         padding: spacing.md,
         marginBottom: spacing.md,
         color: colors.text.primary
        }}
        placeholder="Buscar exercícios..."
        placeholderTextColor={colors.text.tertiary}
        value={busca}
        onChangeText={setBusca}
       />
       
       <FlatList
        data={exercicios}
        maxToRenderPerBatch={10}
        style={{ maxHeight: 300 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
         <TouchableOpacity
          onPress={() => adicionarExercicio(item)}
          style={{
           backgroundColor: colors.background.secondary,
           borderRadius: borderRadius.sm,
           padding: spacing.md,
           marginBottom: spacing.xs,
           borderWidth: 1,
           borderColor: colors.surface.border
          }}
         >
          <Text style={[typography.presets.body, { fontWeight: '600', color: colors.text.primary }]}>{item.nome}</Text>
          <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
           {item.grupo_muscular?.join(', ')} • {item.equipamento}
          </Text>
         </TouchableOpacity>
        )}
       />
      </Card>
     )}

     {/* Botão de Submissão */}
     <Card variant="elevated" padding="lg" style={{ marginTop: spacing.lg }}>
      <Button
       title={loading ? 'Criando Treino...' : 'Criar Treino'}
       onPress={handleSubmit}
       variant="gradient"
       size="lg"
       disabled={loading || exerciciosSelecionados.length === 0}
      />
     </Card>

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});