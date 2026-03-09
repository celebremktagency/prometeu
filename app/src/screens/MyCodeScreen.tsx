import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Share, Clipboard } from 'react-native';
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
import { inviteService } from '../services/inviteService';
import { authService } from '../services/authService';

interface MyCodeScreenProps {
 navigation: any;
}

export const MyCodeScreen = memo<MyCodeScreenProps>(({ navigation }) => {
 const [loading, setLoading] = useState(true);
 const [user, setUser] = useState<any>(null);
 const [myCode, setMyCode] = useState<string>('');

 const loadUserData = useCallback(async () => {
  try {
   const currentUser = await authService.getCurrentUserProfile();
   setUser(currentUser);
   
   // Use user_id if available, otherwise fallback to id
   const userId = currentUser.user_id || currentUser.id;
   const code = await inviteService.generateProfessionalCode(userId);
   setMyCode(code);
  } catch (error: any) {
   console.error('Erro ao carregar dados:', error);
   Alert.alert('Erro', 'Não foi possível carregar suas informações');
  } finally {
   setLoading(false);
  }
 }, []);

 useEffect(() => {
  loadUserData();
 }, [loadUserData]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleCopyCode = useCallback(async () => {
  Haptics.selectionAsync();
  
  try {
   Clipboard.setString(myCode);
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   Alert.alert('Copiado!', 'Código copiado para a área de transferência');
  } catch (error) {
   Alert.alert('Erro', 'Não foi possível copiar o código');
  }
 }, [myCode]);

 const handleShareCode = useCallback(async () => {
  Haptics.selectionAsync();
  
  try {
   const shareMessage = `Olá! Sou seu personal trainer ${user?.nome}.\n\nPara me encontrar no app Prometeus, use meu código:\n\n${myCode}\n\nBaixe o app e vamos começar a treinar juntos!`;
   
   await Share.share({
    message: shareMessage,
    title: 'Meu Código de Personal Trainer',
   });
  } catch (error: any) {
   if (error.code !== 'ECANCELED') {
    Alert.alert('Erro', 'Não foi possível compartilhar o código');
   }
  }
 }, [myCode, user]);

 const handleInstructionsPress = useCallback(() => {
  Haptics.selectionAsync();
  
  Alert.alert(
   '📖 Como usar seu código',
   ` Compartilhe seu código ${myCode} com seus clientes\n\n Seus clientes devem:\n1. Abrir o app Prometeus\n2. Tocar em "Encontrar Personal"\n3. Inserir seu código\n4. Enviar o convite\n\n Você receberá o convite na aba "Ver Convites"\n\n Aceite o convite para começar a treinar juntos!`,
   [{ text: 'Entendi' }]
  );
 }, [myCode]);

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
       Meu Código
     </Text>
     
     <TouchableOpacity onPress={handleInstructionsPress}>
      <Ionicons name="help-circle-outline" size={24} color={colors.accent.primary} />
     </TouchableOpacity>
    </View>

    <ScrollView
     style={{ flex: 1 }}
     contentContainerStyle={{
      paddingHorizontal: spacing.screenHorizontal,
      paddingBottom: spacing.screenVertical,
     }}
     showsVerticalScrollIndicator={false}
    >
     {loading ? (
      <Card variant="glass" padding="lg">
       <View style={{ alignItems: 'center' }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Carregando seu código...
        </Text>
       </View>
      </Card>
     ) : (
      <>
       {/* Main Card */}
       <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
        <View style={{ alignItems: 'center' }}>
         <Ionicons name="fitness-outline" size={64} color={colors.accent.primary} style={{ marginBottom: spacing.md }} />
         
         <Text style={[
          typography.presets.cardTitle, 
          { textAlign: 'center', marginBottom: spacing.sm }
         ]}>
          Seu Código de Personal
         </Text>
         
         <Text style={[
          typography.presets.body, 
          { textAlign: 'center', marginBottom: spacing.lg, color: colors.text.secondary }
         ]}>
          Compartilhe este código com seus clientes
         </Text>

         {/* Code Display */}
         <View style={{
          backgroundColor: colors.surface.card,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          marginBottom: spacing.lg,
          borderWidth: 2,
          borderColor: colors.accent.primary,
          borderStyle: 'dashed',
         }}>
          <Text style={[
           typography.presets.screenTitle,
           { 
            textAlign: 'center',
            color: colors.accent.primary,
            fontFamily: 'monospace',
            letterSpacing: 2,
           }
          ]}>
           {myCode}
          </Text>
         </View>

         {/* User Info */}
         <View style={{
          backgroundColor: colors.background.elevated,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.lg,
          width: '100%',
         }}>
          <Text style={[typography.presets.caption, { textAlign: 'center', color: colors.text.tertiary }]}>
           Personal Trainer
          </Text>
          <Text style={[typography.presets.body, { textAlign: 'center', fontWeight: '600' }]}>
           {user?.nome || 'Seu nome'}
          </Text>
          {user?.email && (
           <Text style={[typography.presets.caption, { textAlign: 'center', color: colors.text.secondary }]}>
            {user.email}
           </Text>
          )}
         </View>

         {/* Action Buttons */}
         <View style={{
          flexDirection: 'row',
          gap: spacing.sm,
          width: '100%',
         }}>
          <Button
           title=" Copiar"
           onPress={handleCopyCode}
           variant="secondary"
           size="md"
           style={{ flex: 1 }}
          />
          
          <Button
           title="📤 Compartilhar"
           onPress={handleShareCode}
           variant="gradient"
           size="md"
           style={{ flex: 1 }}
          />
         </View>
        </View>
       </Card>

       {/* Instructions Card */}
       <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
        <View style={{ alignItems: 'center' }}>
         <Ionicons name="information-circle-outline" size={16} color={colors.accent.tertiary} />
         <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.sm }]}>
          Como funciona?
         </Text>
         <Text style={[typography.presets.body, { textAlign: 'center', color: colors.text.secondary }]}>
          Seus clientes usam este código para te encontrar no app e enviarem convites.
          
          Você receberá os convites na seção "Ver Convites" e poderá aceitar ou rejeitar cada um.
         </Text>
        </View>
       </Card>

       {/* Quick Actions */}
       <View style={{
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
       }}>
        <Button
         title=" Ver Convites"
         onPress={() => navigation.navigate('InviteManagement')}
         variant="ghost"
         size="md"
         style={{ flex: 1 }}
        />
        
        <Button
         title=" Meus Clientes"
         onPress={() => navigation.navigate('ClientList')}
         variant="ghost"
         size="md"
         style={{ flex: 1 }}
        />
       </View>
      </>
     )}

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});