import React, { memo, useState, useCallback } from 'react';
import { 
 View, 
 Text, 
 Modal, 
 ScrollView, 
 TouchableOpacity,
 KeyboardAvoidingView,
 Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { borderRadius, spacing } from '../tokens/spacing';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';

interface CreatePostModalProps {
 visible: boolean;
 onClose: () => void;
 onSubmit: (data: { titulo: string; conteudo: string; tipo: string }) => void;
 loading?: boolean;
}

const POST_TYPES = [
 { id: 'texto', label: 'Texto', icon: '', description: 'Post simples com texto' },
 { id: 'pergunta', label: 'Pergunta', icon: '❓', description: 'Tire suas dúvidas' },
 { id: 'dica', label: 'Dica', icon: '', description: 'Compartilhe conhecimento' },
 { id: 'motivacao', label: 'Motivação', icon: 'exercise', description: 'Inspire outros' },
 { id: 'conquista', label: 'Conquista', icon: '', description: 'Celebre seu progresso' },
];

export const CreatePostModal = memo<CreatePostModalProps>(({
 visible,
 onClose,
 onSubmit,
 loading = false,
}) => {
 const [formData, setFormData] = useState({
  titulo: '',
  conteudo: '',
  tipo: 'texto',
 });
 const [errors, setErrors] = useState<{ titulo?: string; conteudo?: string }>({});

 const validateForm = useCallback(() => {
  const newErrors: { titulo?: string; conteudo?: string } = {};

  if (!formData.titulo.trim()) {
   newErrors.titulo = 'Título é obrigatório';
  } else if (formData.titulo.length < 3) {
   newErrors.titulo = 'Título deve ter pelo menos 3 caracteres';
  }

  if (!formData.conteudo.trim()) {
   newErrors.conteudo = 'Conteúdo é obrigatório';
  } else if (formData.conteudo.length < 10) {
   newErrors.conteudo = 'Conteúdo deve ter pelo menos 10 caracteres';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
 }, [formData]);

 const handleSubmit = useCallback(() => {
  if (validateForm()) {
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
   onSubmit(formData);
  } else {
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
 }, [formData, validateForm, onSubmit]);

 const handleClose = useCallback(() => {
  Haptics.selectionAsync();
  setFormData({ titulo: '', conteudo: '', tipo: 'texto' });
  setErrors({});
  onClose();
 }, [onClose]);

 const selectPostType = useCallback((tipo: string) => {
  Haptics.selectionAsync();
  setFormData(prev => ({ ...prev, tipo }));
 }, []);

 const updateFormData = useCallback((field: keyof typeof formData) => {
  return (value: string) => {
   setFormData(prev => ({ ...prev, [field]: value }));
   if (errors[field as keyof typeof errors]) {
    setErrors(prev => ({ ...prev, [field]: undefined }));
   }
  };
 }, [errors]);

 return (
  <Modal
   visible={visible}
   animationType="slide"
   presentationStyle="pageSheet"
   onRequestClose={handleClose}
  >
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
    <SafeAreaView style={{ flex: 1 }}>
     <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
     >
      {/* Header */}
      <View style={{
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       paddingHorizontal: spacing.lg,
       paddingVertical: spacing.md,
       borderBottomWidth: 1,
       borderBottomColor: colors.surface.divider,
      }}>
       <TouchableOpacity onPress={handleClose}>
        <Text style={{
         fontSize: typography.sizes.md,
         color: colors.accent.primary,
         fontWeight: '600',
        }}>
         Cancelar
        </Text>
       </TouchableOpacity>

       <Text style={typography.presets.sectionTitle}>
        Novo Post
       </Text>

       <Button
        title="Publicar"
        onPress={handleSubmit}
        variant="gradient"
        size="sm"
        loading={loading}
        disabled={loading}
       />
      </View>

      <ScrollView
       style={{ flex: 1 }}
       contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
       }}
       showsVerticalScrollIndicator={false}
       keyboardShouldPersistTaps="handled"
      >
       {/* Tipo do Post */}
       <View style={{ marginBottom: spacing.lg }}>
        <Text style={[
         typography.presets.body,
         { 
          color: colors.text.secondary,
          marginBottom: spacing.sm 
         }
        ]}>
         Tipo do post
        </Text>
        
        <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={{ gap: spacing.sm }}
        >
         {POST_TYPES.map((type) => (
          <TouchableOpacity
           key={type.id}
           onPress={() => selectPostType(type.id)}
           activeOpacity={0.8}
          >
           <View style={{
            backgroundColor: formData.tipo === type.id 
             ? colors.background.elevated 
             : colors.background.secondary,
            borderWidth: 2,
            borderColor: formData.tipo === type.id 
             ? colors.accent.primary 
             : colors.surface.border,
            borderRadius: borderRadius.lg,
            padding: spacing.sm,
            minWidth: 100,
            alignItems: 'center',
           }}>
            <Text style={{ fontSize: 24, marginBottom: spacing.xxs }}>
             {type.icon}
            </Text>
            <Text style={{
             ...typography.presets.caption,
             fontWeight: '600',
             color: formData.tipo === type.id 
              ? colors.accent.primary 
              : colors.text.primary,
             marginBottom: spacing.xxs,
            }}>
             {type.label}
            </Text>
            <Text style={{
             fontSize: typography.sizes.xs,
             color: colors.text.tertiary,
             textAlign: 'center',
            }}>
             {type.description}
            </Text>
           </View>
          </TouchableOpacity>
         ))}
        </ScrollView>
       </View>

       {/* Formulário */}
       <Card variant="glass" padding="lg">
        <Input
         label="Título"
         value={formData.titulo}
         onChangeText={updateFormData('titulo')}
         placeholder="Digite o título do seu post..."
         error={errors.titulo}
         leftIcon={<Text style={{ fontSize: 16 }}></Text>}
         maxLength={100}
        />

        <Input
         label="Conteúdo"
         value={formData.conteudo}
         onChangeText={updateFormData('conteudo')}
         placeholder="Compartilhe sua experiência, dicas, perguntas..."
         error={errors.conteudo}
         multiline
         numberOfLines={8}
         style={{ 
          height: 120, 
          paddingTop: spacing.sm,
         }}
         maxLength={500}
        />

        {/* Contador de caracteres */}
        <View style={{
         flexDirection: 'row',
         justifyContent: 'space-between',
         marginTop: spacing.xs,
        }}>
         <Text style={{
          fontSize: typography.sizes.xs,
          color: colors.text.tertiary,
         }}>
          Título: {formData.titulo.length}/100
         </Text>
         <Text style={{
          fontSize: typography.sizes.xs,
          color: colors.text.tertiary,
         }}>
          Conteúdo: {formData.conteudo.length}/500
         </Text>
        </View>
       </Card>

       {/* Dicas */}
       <Card variant="default" padding="md" style={{ 
        marginTop: spacing.lg,
        backgroundColor: colors.surface.card,
       }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
         <Text style={{ fontSize: 16, marginRight: spacing.xs }}></Text>
         <Text style={[typography.presets.caption, { fontWeight: '600' }]}>
          Dicas para um bom post
         </Text>
        </View>
        <Text style={[typography.presets.caption, { lineHeight: 16 }]}>
         • Seja claro e objetivo{'\n'}
         • Use linguagem respeitosa{'\n'}
         • Compartilhe experiências reais{'\n'}
         • Ajude outros membros da comunidade
        </Text>
       </Card>

       {/* Espaçamento final */}
       <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
     </KeyboardAvoidingView>
    </SafeAreaView>
   </LinearGradient>
  </Modal>
 );
});