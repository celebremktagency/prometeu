import React, { memo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native';
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
import { supabase } from '../services/supabaseClient';

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
 
 const [formData, setFormData] = useState({
  exercicio: template?.exercicio || '',
  descricao: template?.descricao || '',
  series: template?.series?.toString() || '3',
  repeticoes: template?.repeticoes?.toString() || '10',
  nivel: template?.nivel || 'iniciante',
  categoria: template?.categoria || 'personalizado',
  duracao_min: template?.duracao_min?.toString() || '30',
  publico: false,
  youtube_url: template?.youtube_url || '',
 });
 
 const [loading, setLoading] = useState(false);

 const NIVEIS = [
  { id: 'iniciante', label: 'Iniciante', icon: '🟢', color: colors.accent.secondary },
  { id: 'intermediario', label: 'Intermediário', icon: '🟡', color: colors.semantic.warning },
  { id: 'avancado', label: 'Avançado', icon: '🔴', color: colors.semantic.error },
 ];

 const CATEGORIAS = [
  { id: 'personalizado', label: 'Personalizado', icon: 'settings' },
  { id: 'cardio', label: 'Cardio', icon: 'heart' },
  { id: 'forca', label: 'Força', icon: '' },
  { id: 'flexibilidade', label: 'Flexibilidade', icon: '🤸' },
  { id: 'equilibrio', label: 'Equilíbrio', icon: 'balance' },
  { id: 'funcional', label: 'Funcional', icon: '🏃' },
 ];

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const updateFormData = useCallback((field: string, value: string | boolean) => {
  setFormData(prev => ({ ...prev, [field]: value }));
 }, []);

 const handleSubmit = useCallback(async () => {
  if (!formData.exercicio.trim()) {
   Alert.alert('Erro', 'Nome do exercício é obrigatório');
   return;
  }

  if (!formData.series || parseInt(formData.series) < 1) {
   Alert.alert('Erro', 'Número de séries deve ser maior que 0');
   return;
  }

  if (!formData.repeticoes.trim()) {
   Alert.alert('Erro', 'Repetições são obrigatórias');
   return;
  }

  try {
   setLoading(true);
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuário não autenticado');

   const { error } = await supabase
    .from('treinos')
    .insert({
     usuario_id: user.id,
     exercicio: formData.exercicio.trim(),
     descricao: formData.descricao.trim() || null,
     series: parseInt(formData.series),
     repeticoes: formData.repeticoes.trim() || '10',
     nivel: formData.nivel,
     categoria: formData.categoria,
     duracao_min: parseInt(formData.duracao_min) || 30,
     status: 'planned',
     publico: formData.publico,
     youtube_url: formData.youtube_url.trim() || null,
     // criado_por removido - foreign key com problema
    });

   if (error) throw error;

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
 }, [formData, navigation]);

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
       <Text style={{ fontSize: 24, color: colors.text.primary }}>←</Text>
      </TouchableOpacity>
      
      <Text style={typography.presets.screenTitle}>
       {template ? ' Usar Template' : '➕ Criar Treino'}
      </Text>
      
      <TouchableOpacity
       onPress={handleSubmit}
       disabled={loading}
       style={{
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        opacity: loading ? 0.6 : 1,
       }}
      >
       <Text style={[
        typography.presets.caption,
        { color: colors.text.inverse, fontWeight: '600' }
       ]}>
        {loading ? 'Salvando...' : 'SALVAR'}
       </Text>
      </TouchableOpacity>
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
         Usando template: <Text style={{ fontWeight: '600' }}>{template.exercicio}</Text>
        </Text>
       </View>
      </Card>
     )}

     <Card variant="elevated" padding="lg">
      {/* Nome do Exercício */}
      {renderInput(
       'Nome do Exercício *',
       'exercicio',
       'Ex: Flexão de braço, Agachamento...',
       { maxLength: 100 }
      )}

      {/* Descrição */}
      {renderInput(
       'Descrição',
       'descricao',
       'Descreva como executar o exercício...',
       { multiline: true, maxLength: 500 }
      )}

      {/* Séries e Repetições */}
      <View style={{
       flexDirection: 'row',
       gap: spacing.md,
       marginBottom: spacing.lg,
      }}>
       <View style={{ flex: 1 }}>
        {renderInput(
         'Séries *',
         'series',
         '3',
         { keyboardType: 'numeric' }
        )}
       </View>
       
       <View style={{ flex: 1 }}>
        {renderInput(
         'Repetições *',
         'repeticoes',
         '10-15',
         { maxLength: 20 }
        )}
       </View>
      </View>

      {/* Duração e YouTube */}
      <View style={{
       flexDirection: 'row',
       gap: spacing.md,
       marginBottom: spacing.lg,
      }}>
       <View style={{ flex: 1 }}>
        {renderInput(
         'Duração (min)',
         'duracao_min',
         '30',
         { keyboardType: 'numeric' }
        )}
       </View>
      </View>

      {renderInput(
       'YouTube URL',
       'youtube_url',
       'https://youtube.com/watch?v=...',
       { keyboardType: 'url' }
      )}

      {/* Nível */}
      {renderSelector('Nível de Dificuldade', 'nivel', NIVEIS)}

      {/* Categoria */}
      {renderSelector('Categoria', 'categoria', CATEGORIAS)}

      {/* Público */}
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
          updateFormData('publico', false);
         }}
         activeOpacity={0.8}
         style={{ flex: 1 }}
        >
         <View style={{
          backgroundColor: !formData.publico 
           ? colors.background.elevated 
           : colors.background.secondary,
          borderWidth: 2,
          borderColor: !formData.publico 
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
            color: !formData.publico ? colors.accent.primary : colors.text.primary
           }
          ]}>
           Privado
          </Text>
          <Text style={[
           typography.presets.caption,
           { color: colors.text.secondary, textAlign: 'center' }
          ]}>
           Apenas você
          </Text>
         </View>
        </TouchableOpacity>

        <TouchableOpacity
         onPress={() => {
          Haptics.selectionAsync();
          updateFormData('publico', true);
         }}
         activeOpacity={0.8}
         style={{ flex: 1 }}
        >
         <View style={{
          backgroundColor: formData.publico 
           ? colors.background.elevated 
           : colors.background.secondary,
          borderWidth: 2,
          borderColor: formData.publico 
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
            color: formData.publico ? colors.accent.primary : colors.text.primary
           }
          ]}>
           Público
          </Text>
          <Text style={[
           typography.presets.caption,
           { color: colors.text.secondary, textAlign: 'center' }
          ]}>
           Na biblioteca
          </Text>
         </View>
        </TouchableOpacity>
       </View>
      </View>

      {/* Botão de Submissão */}
      <Button
       title={loading ? 'Criando Treino...' : 'Criar Treino'}
       onPress={handleSubmit}
       variant="gradient"
       size="lg"
       disabled={loading}
       icon={<Text style={{ fontSize: 16 }}>{loading ? '' : ''}</Text>}
      />
     </Card>

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});