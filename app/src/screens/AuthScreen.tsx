import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import styled from 'styled-components/native';
import { colors, typography, spacing, radii } from '../theme/tokens';
import { ButtonPrimary } from '../components/ButtonPrimary';
import { useAuth } from '../hooks/useAuth';

interface AuthScreenProps {
  navigation: any;
}

const Container = styled(KeyboardAvoidingView)`
  flex: 1;
  background-color: ${colors.bg};
`;

const ScrollContainer = styled(ScrollView)`
  flex: 1;
`;

const Content = styled(View)`
  flex: 1;
  justify-content: center;
  padding: ${spacing.xxl}px ${spacing.lg}px;
  min-height: 600px;
`;

const LogoContainer = styled(View)`
  align-items: center;
  margin-bottom: ${spacing.xxl}px;
`;

const Logo = styled(View)`
  width: 72px;
  height: 72px;
  background-color: ${colors.accent};
  border-radius: 36px;
  justify-content: center;
  align-items: center;
  margin-bottom: ${spacing.lg}px;
`;

const LogoText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: 32px;
  font-weight: 700;
  color: #FFFFFF;
`;

const Title = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.h1.size}px;
  font-weight: ${typography.h1.weight};
  line-height: ${typography.h1.lineHeight}px;
  color: ${colors.textPrimary};
  text-align: center;
  margin-bottom: ${spacing.xl}px;
`;

const FormContainer = styled(View)`
  margin-bottom: ${spacing.xl}px;
`;

const InputContainer = styled(View)`
  margin-bottom: ${spacing.md}px;
`;

const Label = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.small.size}px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: ${spacing.sm}px;
`;

const Input = styled(TextInput)<{ hasError?: boolean }>`
  height: 56px;
  background-color: ${colors.neutralLight};
  border-radius: ${radii.md}px;
  padding: 0 ${spacing.md}px;
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  color: ${colors.textPrimary};
  border-width: ${({ hasError }) => hasError ? '2px' : '1px'};
  border-color: ${({ hasError }) => hasError ? colors.danger : 'transparent'};
`;

const ErrorText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.caption.size}px;
  color: ${colors.danger};
  margin-top: ${spacing.xs}px;
`;

const ButtonContainer = styled(View)`
  margin-bottom: ${spacing.lg}px;
`;

const SwitchContainer = styled(View)`
  align-items: center;
  margin-bottom: ${spacing.lg}px;
`;

const SwitchText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.small.size}px;
  color: ${colors.textSecondary};
`;

const SwitchLink = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.small.size}px;
  font-weight: 600;
  color: ${colors.accent};
`;

const TermsText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.caption.size}px;
  color: ${colors.textSecondary};
  text-align: center;
  line-height: 18px;
`;

const TermsLink = styled(Text)`
  color: ${colors.accent};
  font-weight: 600;
`;

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, loading } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.message || `Erro ao ${isLogin ? 'fazer login' : 'criar conta'}`
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Container behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollContainer showsVerticalScrollIndicator={false}>
        <Content>
          <LogoContainer>
            <Logo>
              <LogoText>P</LogoText>
            </Logo>
            <Title>
              {isLogin ? 'Bem-vindo de volta!' : 'Alcance o seu potencial máximo'}
            </Title>
          </LogoContainer>

          <FormContainer>
            {!isLogin && (
              <InputContainer>
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Seu nome completo"
                  placeholderTextColor={colors.textSecondary}
                  hasError={!!errors.name}
                  autoCapitalize="words"
                />
                {errors.name && <ErrorText>{errors.name}</ErrorText>}
              </InputContainer>
            )}

            <InputContainer>
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="seu@email.com"
                placeholderTextColor={colors.textSecondary}
                hasError={!!errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <ErrorText>{errors.email}</ErrorText>}
            </InputContainer>

            <InputContainer>
              <Label>Senha</Label>
              <Input
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Sua senha"
                placeholderTextColor={colors.textSecondary}
                hasError={!!errors.password}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.password && <ErrorText>{errors.password}</ErrorText>}
            </InputContainer>
          </FormContainer>

          <ButtonContainer>
            <ButtonPrimary
              title={isLogin ? 'Entrar' : 'Criar conta'}
              onPress={handleSubmit}
              loading={loading}
            />
          </ButtonContainer>

          <SwitchContainer>
            <SwitchText>
              {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
              <SwitchLink onPress={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </SwitchLink>
            </SwitchText>
          </SwitchContainer>

          <TermsText>
            Ao continuar, você aceita nossos{' '}
            <TermsLink>Termos de Uso</TermsLink> e{' '}
            <TermsLink>Política de Privacidade</TermsLink>
          </TermsText>
        </Content>
      </ScrollContainer>
    </Container>
  );
};