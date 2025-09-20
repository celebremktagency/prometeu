import React from 'react';
import { Pressable, Text, PressableProps, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { colors, typography, radii, shadows } from '../theme/tokens';

interface ButtonPrimaryProps extends PressableProps {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  size?: 'large' | 'medium';
}

interface StyledButtonProps {
  disabled?: boolean;
  size?: 'large' | 'medium';
}

const StyledButton = styled(Pressable)<StyledButtonProps>`
  background-color: ${({ disabled }) => disabled ? colors.neutralLight : colors.accent};
  height: ${({ size }) => size === 'large' ? '72px' : '56px'};
  border-radius: ${({ size }) => size === 'large' ? '36px' : '28px'};
  justify-content: center;
  align-items: center;
  flex-direction: row;
  shadow-color: ${colors.shadow};
  shadow-offset: 0px 6px;
  shadow-opacity: 1;
  shadow-radius: 16px;
  elevation: 6;
`;

const ButtonText = styled(Text)<{ disabled?: boolean }>`
  font-family: ${typography.fontFamilyPrimary};
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: ${({ disabled }) => disabled ? colors.textSecondary : '#FFFFFF'};
  margin-left: ${({ children }) => children ? '8px' : '0px'};
`;

export const ButtonPrimary: React.FC<ButtonPrimaryProps> = ({
  title,
  loading = false,
  disabled = false,
  size = 'large',
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <StyledButton
      disabled={isDisabled}
      size={size}
      style={[
        {
          transform: [{ scale: 1 }],
        },
        style,
      ]}
      {...props}
      android_ripple={{
        color: 'rgba(255, 255, 255, 0.2)',
        borderless: false,
      }}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={isDisabled ? colors.textSecondary : '#FFFFFF'} 
        />
      )}
      <ButtonText disabled={isDisabled}>
        {title}
      </ButtonText>
    </StyledButton>
  );
};