import React, { memo, useState, useCallback, useMemo } from 'react';
import { 
 View, 
 Text, 
 ScrollView, 
 Alert,
 TouchableOpacity,
 KeyboardAvoidingView,
 Platform 
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
 Input, 
 Card 
} from '../design-system';
import { authService } from '../services/authService';

interface AuthScreenProps {
 navigation: any;
}

interface FormData {
 nome: string;
 email: string;
 senha: string;
 tipo: 'aluno' | 'personal_trainer';
}

interface FormErrors {
 nome?: string;
 email?: string;
 senha?: string;
 geral?: string;
}

const UserTypeCard = memo<{
 type: 'aluno' | 'personal_trainer';
 selected: boolean;
 onPress: (type: 'aluno' | 'personal_trainer') => void;
}>(({ type, selected, onPress }) => {
 const handlePress = useCallback(() => {
  Haptics.selectionAsync();
  onPress(type);
 }, [type, onPress]);

 const config = useMemo(() => {
  return type === 'aluno' 
   ? {
     icon: <Ionicons name="person-outline" size={24} color={selected ? colors.accent.primary : colors.text.secondary} />,
     title: 'Aluno',
     subtitle: 'Busco orientação para meus exercícios'
    }
   : {
     icon: <Ionicons name="fitness-outline" size={24} color={selected ? colors.accent.primary : colors.text.secondary} />,
     title: 'Personal',
     subtitle: 'Sou instrutor e ajudo alunos'
    };
 }, [type, selected]);

 return (
  <TouchableOpacity 
   onPress={handlePress}
   activeOpacity={0.8}
   style={{
    flex: 1,
    marginHorizontal: spacing.xxs,
   }}
  >
   <View style={{
    backgroundColor: selected ? colors.background.elevated : colors.background.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: selected ? colors.accent.primary : colors.surface.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 130,
   }}>
    <View style={{
     height: 32,
     justifyContent: 'center',
     alignItems: 'center',
    }}>
     {config.icon}
    </View>
    
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm }}>
     <Text style={{
      ...typography.presets.cardTitle,
      marginBottom: spacing.xxs,
      color: selected ? colors.accent.primary : colors.text.primary,
     }}>
      {config.title}
     </Text>
     <Text style={{
      ...typography.presets.caption,
      textAlign: 'center',
      lineHeight: 18,
     }}>
      {config.subtitle}
     </Text>
    </View>
   </View>
  </TouchableOpacity>
 );
});

export const AuthScreen = memo<AuthScreenProps>(({ navigation }) => {
 const [isLogin, setIsLogin] = useState(true);
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState<FormData>({
  nome: '',
  email: '',
  senha: '',
  tipo: 'aluno',
 });
 const [errors, setErrors] = useState<FormErrors>({});

 const validateForm = useCallback((): boolean => {
  const newErrors: FormErrors = {};

  if (!isLogin && !formData.nome.trim()) {
   newErrors.nome = 'Nome é obrigatório';
  }

  if (!formData.email.trim()) {
   newErrors.email = 'Email é obrigatório';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
   newErrors.email = 'Email inválido';
  }

  if (!formData.senha.trim()) {
   newErrors.senha = 'Senha é obrigatória';
  } else if (formData.senha.length < 6) {
   newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
 }, [formData, isLogin]);

 const handleSubmit = useCallback(async () => {
  if (!validateForm()) {
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
   return;
  }

  setLoading(true);
  setErrors({});

  try {
   if (isLogin) {
    await authService.signIn(formData.email, formData.senha);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   } else {
    await authService.signUp(formData.email, formData.senha, formData.nome, formData.tipo);
    Alert.alert(
     'Conta criada!', 
     'Sua conta foi criada com sucesso. Faça login para continuar.',
     [{ text: 'OK', onPress: () => setIsLogin(true) }]
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   }
  } catch (error: any) {
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
   setErrors({ geral: error.message });
  } finally {
   setLoading(false);
  }
 }, [formData, isLogin, validateForm]);

 const toggleMode = useCallback(() => {
  Haptics.selectionAsync();
  setIsLogin(!isLogin);
  setErrors({});
  setFormData({
   nome: '',
   email: '',
   senha: '',
   tipo: 'aluno',
  });
 }, [isLogin]);

 const updateFormData = useCallback((field: keyof FormData) => {
  return (value: string | 'aluno' | 'personal_trainer') => {
   setFormData(prev => ({ ...prev, [field]: value }));
   // Limpar erro do campo quando usuário digita
   if (errors[field as keyof FormErrors]) {
    setErrors(prev => ({ ...prev, [field]: undefined }));
   }
  };
 }, [errors]);

 const selectUserType = useCallback((type: 'aluno' | 'personal_trainer') => {
  updateFormData('tipo')(type);
 }, [updateFormData]);

 const handleForgotPassword = useCallback(async () => {
  if (!formData.email.trim()) {
   Alert.alert('Email necessário', 'Por favor, insira seu email para recuperar a senha.');
   return;
  }

  if (!/\S+@\S+\.\S+/.test(formData.email)) {
   Alert.alert('Email inválido', 'Por favor, insira um email válido.');
   return;
  }

  try {
   setLoading(true);
   await authService.resetPassword(formData.email);
   
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   Alert.alert(
    'Email enviado!', 
    'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.',
    [{ text: 'OK' }]
   );
  } catch (error: any) {
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
   Alert.alert('Erro', error.message || 'Não foi possível enviar o email de recuperação');
  } finally {
   setLoading(false);
  }
 }, [formData.email]);

 return (
  <LinearGradient
   colors={colors.gradients.cardDark}
   style={{ flex: 1 }}
  >
   <View style={{ flex: 1, paddingTop: 50 }}>
    <KeyboardAvoidingView
     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
     style={{ flex: 1 }}
    >
     <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
       paddingHorizontal: spacing.screenHorizontal,
       paddingVertical: spacing.screenVertical,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
     >
      {/* Header com logo */}
      <View style={{
       alignItems: 'center',
       marginTop: spacing['3xl'],
       marginBottom: spacing['4xl'],
      }}>
       <View style={{
        width: 80,
        height: 80,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        borderWidth: 2,
        borderColor: colors.accent.primary,
       }}>
        <Text style={{ fontSize: 16 }}>🏋️</Text>
       </View>
       
       <Text style={[
        typography.presets.screenTitle,
        { marginBottom: spacing.xs }
       ]}>
        {isLogin ? 'Entrar' : 'Criar sua conta'}
       </Text>
       
       <Text style={[
        typography.presets.body,
        { textAlign: 'center' }
       ]}>
        {isLogin 
         ? 'Acesse sua conta para continuar'
         : 'Preencha os dados para começar'
        }
       </Text>
      </View>

      {/* Formulário */}
      <Card variant="glass" padding="lg" style={{ marginBottom: spacing.xl }}>
       {/* Erro geral */}
       {errors.geral && (
        <View style={{
         backgroundColor: colors.semantic.error + '20',
         borderWidth: 1,
         borderColor: colors.semantic.error,
         borderRadius: borderRadius.md,
         padding: spacing.sm,
         marginBottom: spacing.md,
        }}>
         <Text style={{
          color: colors.semantic.error,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
         }}>
          {errors.geral}
         </Text>
        </View>
       )}

       {/* Nome (só no cadastro) */}
       {!isLogin && (
        <Input
         label="Nome completo"
         value={formData.nome}
         onChangeText={updateFormData('nome')}
         placeholder="Digite seu nome"
         error={errors.nome}
         leftIcon={<Ionicons name="person-outline" size={20} color={colors.text.secondary} />}
         autoCapitalize="words"
         autoCorrect={false}
        />
       )}

       {/* Tipo de conta (só no cadastro) */}
       {!isLogin && (
        <View style={{ marginBottom: spacing.md }}>
         <Text style={[
          typography.presets.body,
          { 
           color: colors.text.secondary,
           marginBottom: spacing.sm 
          }
         ]}>
          Tipo de conta
         </Text>
         <View style={{ 
          flexDirection: 'row',
          gap: spacing.sm 
         }}>
          <UserTypeCard
           type="aluno"
           selected={formData.tipo === 'aluno'}
           onPress={selectUserType}
          />
          <UserTypeCard
           type="personal_trainer"
           selected={formData.tipo === 'personal_trainer'}
           onPress={selectUserType}
          />
         </View>
        </View>
       )}

       {/* Email */}
       <Input
        label="Email"
        value={formData.email}
        onChangeText={updateFormData('email')}
        placeholder="seu@email.com"
        error={errors.email}
        leftIcon={<Ionicons name="mail-outline" size={20} color={colors.text.secondary} />}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
       />

       {/* Senha */}
       <Input
        label="Senha"
        value={formData.senha}
        onChangeText={updateFormData('senha')}
        placeholder="Digite sua senha"
        error={errors.senha}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.text.secondary} />}
        secureTextEntry
        showPasswordToggle
        autoCapitalize="none"
        autoCorrect={false}
       />
      </Card>

      {/* Botão principal */}
      <Button
       title={isLogin ? 'Entrar' : 'Criar Conta'}
       onPress={handleSubmit}
       variant="gradient"
       size="lg"
       fullWidth
       loading={loading}
       style={{ marginBottom: spacing.lg }}
      />

      {/* Esqueci a senha (só no login) */}
      {isLogin && (
       <TouchableOpacity
        onPress={handleForgotPassword}
        activeOpacity={0.7}
        style={{
         alignItems: 'center',
         paddingVertical: spacing.sm,
         marginBottom: spacing.sm,
        }}
       >
        <Text style={[
         typography.presets.body,
         { color: colors.accent.primary, textDecorationLine: 'underline' }
        ]}>
         Esqueci minha senha
        </Text>
       </TouchableOpacity>
      )}

      {/* Toggle entre login/cadastro */}
      <TouchableOpacity
       onPress={toggleMode}
       activeOpacity={0.7}
       style={{
        alignItems: 'center',
        paddingVertical: spacing.sm,
       }}
      >
       <Text style={[
        typography.presets.body,
        { color: colors.text.secondary }
       ]}>
        {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
        <Text style={{ color: colors.accent.primary }}>
         {isLogin ? 'Cadastre-se' : 'Entrar'}
        </Text>
       </Text>
      </TouchableOpacity>

      {/* Espaçamento final */}
      <View style={{ height: spacing['2xl'] }} />
     </ScrollView>
    </KeyboardAvoidingView>
   </View>
  </LinearGradient>
 );
});