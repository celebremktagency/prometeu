import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
 colors,
 typography,
 spacing,
 borderRadius,
 Button,
 Card,
 Avatar,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { inviteService } from '../services/inviteService';
import { authService } from '../services/authService';

interface InviteManagementScreenProps {
 navigation: any;
}

export const InviteManagementScreen = memo<InviteManagementScreenProps>(({ navigation }) => {
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [pendingInvites, setPendingInvites] = useState<any[]>([]);
 const [user, setUser] = useState<any>(null);

 const loadInvites = useCallback(async () => {
  try {
   const currentUser = await authService.getCurrentUserProfile();
   setUser(currentUser);
   
   // Use user_id for foreign key relationships
   const userId = currentUser.user_id || currentUser.id;
   const invites = await inviteService.getPendingInvites(userId);
   setPendingInvites(invites);
  } catch (error: any) {
   console.error('Erro ao carregar convites:', error);
   Alert.alert('Erro', 'Não foi possível carregar os convites');
  } finally {
   setLoading(false);
  }
 }, []);

 const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadInvites();
  setRefreshing(false);
 }, [loadInvites]);

 useEffect(() => {
  loadInvites();
 }, [loadInvites]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleAcceptInvite = useCallback(async (invite: any) => {
  Haptics.selectionAsync();
  
  Alert.alert(
   'Aceitar Convite',
   `Deseja aceitar o convite de ${invite.client?.nome || 'Cliente'}?\n\nEle se tornará seu cliente e poderá receber seus treinos.`,
   [
    { text: 'Cancelar', style: 'cancel' },
    {
     text: 'Aceitar',
     style: 'default',
     onPress: async () => {
      try {
       setLoading(true);
       await inviteService.acceptProfessionalInvite(invite.id, user.user_id || user.id);
       
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
       Alert.alert('Sucesso!', `${invite.client?.nome} agora é seu cliente!`);
       
       // Reload invites
       await loadInvites();
      } catch (error: any) {
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
       Alert.alert('Erro', error.message || 'Não foi possível aceitar o convite');
      } finally {
       setLoading(false);
      }
     }
    }
   ]
  );
 }, [user, loadInvites]);

 const handleRejectInvite = useCallback(async (invite: any) => {
  Haptics.selectionAsync();
  
  Alert.alert(
   'Rejeitar Convite',
   `Tem certeza que deseja rejeitar o convite de ${invite.client?.nome || 'Cliente'}?`,
   [
    { text: 'Cancelar', style: 'cancel' },
    {
     text: 'Rejeitar',
     style: 'destructive',
     onPress: async () => {
      try {
       setLoading(true);
       await inviteService.rejectProfessionalInvite(invite.id, user.user_id || user.id);
       
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
       Alert.alert('Convite rejeitado', 'O convite foi rejeitado');
       
       // Reload invites
       await loadInvites();
      } catch (error: any) {
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
       Alert.alert('Erro', error.message || 'Não foi possível rejeitar o convite');
      } finally {
       setLoading(false);
      }
     }
    }
   ]
  );
 }, [user, loadInvites]);

 const renderInviteItem = useCallback(({ invite }: { invite: any }) => (
  <Card variant="elevated" padding="md" style={{ marginBottom: spacing.sm }}>
   <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
   }}>
    <Avatar
     name={invite.client?.nome || 'Cliente'}
     size="sm"
     showBorder={false}
    />
    
    <View style={{ flex: 1 }}>
     <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xxs }]}>
      {invite.client?.nome || 'Cliente sem nome'}
     </Text>
     <Text style={[typography.presets.body, { color: colors.text.secondary, marginBottom: spacing.xxs }]}>
      {invite.client?.email}
     </Text>
     <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
      Convite enviado em {new Date(invite.created_at).toLocaleDateString('pt-BR')}
     </Text>
    </View>
   </View>

   <View style={{
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
   }}>
    <Button
     title="Aceitar"
     onPress={() => handleAcceptInvite(invite)}
     variant="gradient"
     size="sm"
     style={{ flex: 1 }}
    />
    <Button
     title="Rejeitar"
     onPress={() => handleRejectInvite(invite)}
     variant="ghost"
     size="sm"
     style={{ flex: 1 }}
    />
   </View>
  </Card>
 ), [handleAcceptInvite, handleRejectInvite]);

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
       Convites
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
     refreshControl={
      <RefreshControl
       refreshing={refreshing}
       onRefresh={onRefresh}
       tintColor={colors.accent.primary}
      />
     }
    >
     {loading ? (
      <Card variant="glass" padding="lg">
       <View style={{ alignItems: 'center' }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Carregando convites...
        </Text>
       </View>
      </Card>
     ) : pendingInvites.length === 0 ? (
      <Card variant="glass" padding="lg">
       <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>📭</Text>
        <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
         Nenhum convite pendente
        </Text>
        <Text style={[typography.presets.body, { textAlign: 'center', color: colors.text.secondary }]}>
         Quando clientes enviarem convites para você, eles aparecerão aqui
        </Text>
       </View>
      </Card>
     ) : (
      <View>
       <Text style={[
        typography.presets.sectionTitle, 
        { marginBottom: spacing.md }
       ]}>
        📨 Convites Pendentes ({pendingInvites.length})
       </Text>
       
       {pendingInvites.map((invite) => (
        <View key={invite.id}>
         {renderInviteItem({ invite })}
        </View>
       ))}
      </View>
     )}

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});