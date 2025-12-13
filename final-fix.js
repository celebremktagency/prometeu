const fs = require('fs');
const path = require('path');

function finalFixFile(filePath) {
  if (!fs.existsSync(filePath)) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  try {
    // Remove all those weird closing brackets/parens at the end
    content = content.replace(/\}+\)+\s*$/g, '');
    
    // Fix missing closing braces for interfaces
    content = content.replace(/(interface\s+\w+\s*\{[^}]*)\s*$/gm, '$1\n}');
    
    // Fix missing closing braces for styled components
    content = content.replace(/(const\s+\w+\s*=\s*styled[^`]*`[^`]*)`[;\s]*$/gm, '$1\`;');
    
    // Fix malformed styled component CSS
    content = content.replace(/(`[^`]*)\s*\$\{\s*\}\s*([^`]*`)/g, '$1$2');
    content = content.replace(/border-bottom-\s*$/gm, 'border-bottom-color: transparent;');
    content = content.replace(/shadow-\s*$/gm, 'shadow-color: transparent;');
    
    // Fix malformed function declarations
    content = content.replace(/(\w+)\s*=>\s*\{?\s*$/gm, '$1 => {\n  return null;\n};');
    
    // Remove weird template literal expressions
    content = content.replace(/\$\{[^}]*\}\s*\)\s*=>\s*color\s*\|\|\s*colors\.\w+/g, 'colors.primary');
    
    // Fix broken JSX
    content = content.replace(/<Ionicons\s*\/>/g, '<Ionicons name="help-outline" size={20} />');
    content = content.replace(/<AvatarImage\s*\/>/g, '<AvatarImage source={{ uri: userAvatar }} />');
    
    // Remove extra closing brackets
    content = content.replace(/^\s*\}\s*$/gm, '');
    content = content.replace(/^\s*\)\s*$/gm, '');
    
    // Fix missing exports
    if (!content.includes('export') && filePath.includes('.tsx')) {
      const componentName = path.basename(filePath, '.tsx');
      content += `\n\nexport default ${componentName};`;
    }

    // Clean up multiple newlines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // Ensure file ends properly
    content = content.trim();

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Final fix: ${filePath}`);
      return true;
    }

  } catch (error) {
    console.log(`❌ Error in final fix ${filePath}: ${error.message}`);
    return false;
  }

  return false;
}

// Critical files that need manual fixes
const criticalFiles = [
  './app/src/components/HeaderMain.tsx',
  './app/src/components/SimpleProgressChart.tsx',
  './app/src/components/Card.tsx',
  './app/src/components/BottomNav.tsx',
  './app/src/components/BodyDiagram.tsx',
  './app/src/screens/WorkoutSelectionScreen.tsx'
];

console.log('🔧 Final fixes for critical files...\n');

let fixedCount = 0;
criticalFiles.forEach(filePath => {
  if (finalFixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\n✅ Applied final fixes to ${fixedCount} files`);

// Now let's completely rewrite the most broken ones
console.log('\n🔄 Rewriting most broken files...');

// Completely rewrite HeaderMain.tsx
const headerMainContent = `import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../design-system';

interface HeaderMainProps {
  title?: string;
  userName?: string;
  userAvatar?: string;
  onMenuPress?: () => void;
  onAvatarPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  paddingTop?: number;
}

interface ContainerProps {
  paddingTop: number;
}

const Container = styled(View)<ContainerProps>\`
  padding-top: \${({ paddingTop }) => paddingTop + 8}px;
  padding-horizontal: 20px;
  padding-bottom: \${spacing.xl}px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom-width: 1px;
  border-bottom-color: \${colors.border};
  min-height: 75px;
\`;

const LeftSection = styled(TouchableOpacity)\`
  flex-direction: row;
  align-items: center;
  flex: 1;
\`;

const TitleContainer = styled(View)\`
  margin-left: \${spacing.md}px;
  flex: 1;
\`;

const Title = styled(Text)\`
  line-height: \${typography.h2.lineHeight}px;
\`;

const Subtitle = styled(Text)\`
  line-height: \${typography.small.lineHeight}px;
  margin-top: 2px;
\`;

const AvatarContainer = styled(TouchableOpacity)\`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  overflow: hidden;
\`;

const AvatarImage = styled(Image)\`
  width: 100%;
  height: 100%;
\`;

const AvatarPlaceholder = styled(View)\`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
\`;

const AvatarText = styled(Text)\`
\`;

export const HeaderMain: React.FC<HeaderMainProps> = ({
  title = 'Prometeus',
  userName,
  userAvatar,
  onMenuPress,
  onAvatarPress,
  showBackButton = false,
  onBackPress,
  paddingTop: customPaddingTop
}) => {
  const insets = useSafeAreaInsets();
  const finalPaddingTop = customPaddingTop || Math.max(insets.top + spacing.lg, spacing.xxl);

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <Container paddingTop={finalPaddingTop}>
      <LeftSection onPress={showBackButton ? onBackPress : onMenuPress} activeOpacity={0.7}>
        <Ionicons 
          name={showBackButton ? "arrow-back" : "menu"} 
          size={22} 
          color={colors.textPrimary} 
        />
        <TitleContainer>
          <Title>{title}</Title>
          {userName && !showBackButton && (
            <Subtitle>
              {getGreeting()}, {userName.split(' ')[0]}
            </Subtitle>
          )}
        </TitleContainer>
      </LeftSection>

      {!showBackButton && (
        <AvatarContainer onPress={onAvatarPress} activeOpacity={0.8}>
          {userAvatar ? (
            <AvatarImage source={{ uri: userAvatar }} />
          ) : (
            <AvatarPlaceholder>
              <AvatarText>{getInitials(userName)}</AvatarText>
            </AvatarPlaceholder>
          )}
        </AvatarContainer>
      )}
    </Container>
  );
};`;

fs.writeFileSync('./app/src/components/HeaderMain.tsx', headerMainContent);
console.log('✅ Rewrote HeaderMain.tsx');

console.log('\n🎉 Final fixes completed!');