import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
 Avatar,
 MetricCard,
} from '../design-system';
import { Cliente } from '../services/professionalService';

interface ClientDetailsScreenProps {
 navigation: any;
 route: {
  params: {
   client: Cliente;
  };
 };
}

export const ClientDetailsScreen = memo<ClientDetailsScreenProps>(({ navigation, route }) => {
 const { client } = route.params;
 const [loading, setLoading] = useState(false);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleAssignWorkout = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('WorkoutLibrary', { 
   assignToClient: true,
   clientId: client.client_id,
   clientName: client.nome 
  });
 }, [navigation, client]);

 const handleCreateWorkout = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('CreateWorkout', {
   assignToClient: true,
   clientId: client.client_id,
   clientName: client.nome
  });
 }, [navigation, client]);

 const handleViewProgress = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('ClientProgress', { 
   clientId: client.id,
   clientName: client.nome 
  });
 }, [navigation, client]);

 const handleSendMessage = useCallback(() => {
  Haptics.selectionAsync();
  Alert.alert('Em breve', 'Sistema de mensagens em desenvolvimento');
 }, []);

 const diasVinculo = Math.floor((new Date().getTime() - new Date(client.data_vinculo).getTime()) / (1000 * 60 * 60 * 24));

 return (
  <LinearGradient
   colors={[colors.background.primary, colors.background.secondary]}
   style={{ flex: 1 }}
  >
   <SafeAreaView style={{ flex: 1 }}>
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
       Detalhes do Cliente
      </Text>
      
      <TouchableOpacity onPress={handleSendMessage}>
       <View style={{
        width: 44,
        height: 44,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.surface.border,
       }}>
        <Ionicons name="chatbubble-outline" size={20} color={colors.accent.primary} />
       </View>
      </TouchableOpacity>
     </View>

     {/* Profile Header */}
     <LinearGradient
      colors={['rgba(228, 255, 26, 0.08)', 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
       borderRadius: borderRadius.xl,
       padding: spacing.lg,
       marginBottom: spacing.lg,
       alignItems: 'center',
      }}
     >
      <Avatar
       name={client.nome}
       size="lg"
       showBorder={true}
      />
      
      <Text style={[
       typography.presets.screenTitle,
       { marginTop: spacing.md, marginBottom: spacing.xs, textAlign: 'center' }
      ]}>
       {client.nome}
      </Text>
      
      <Text style={[
       typography.presets.body,
       { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xs }
      ]}>
       {client.email}
      </Text>
      
      <View style={{
       flexDirection: 'row',
       alignItems: 'center',
       gap: spacing.xs,
      }}>
       <View style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: client.ativo ? colors.accent.secondary : colors.semantic.error,
       }} />
       <Text style={[
        typography.presets.body,
        { 
         color: client.ativo ? colors.accent.secondary : colors.semantic.error,
         fontWeight: '600'
        }
       ]}>
        {client.ativo ? 'Cliente Ativo' : 'Cliente Inativo'}
       </Text>
      </View>
     </LinearGradient>

     {/* Informações Básicas */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Informações
      </Text>
      
      <Card variant="glass" padding="lg">
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.border,
       }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Email
        </Text>
        <Text style={[typography.presets.body, { fontWeight: '600' }]}>
         {client.email}
        </Text>
       </View>
       
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.border,
       }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Tipo de conta
        </Text>
        <Text style={[typography.presets.body, { fontWeight: '600' }]}>
         Aluno
        </Text>
       </View>
       
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.border,
       }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Vinculado há
        </Text>
        <Text style={[typography.presets.body, { fontWeight: '600' }]}>
         {diasVinculo} dias
        </Text>
       </View>
       
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
       }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Status
        </Text>
        <Text style={[
         typography.presets.body, 
         { 
          fontWeight: '600',
          color: client.ativo ? colors.accent.secondary : colors.semantic.error
         }
        ]}>
         {client.ativo ? 'Ativo' : 'Inativo'}
        </Text>
       </View>
      </Card>
     </View>

     {/* Estatísticas Rápidas */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Estatísticas
      </Text>
      
      <View style={{
       flexDirection: 'row',
       gap: spacing.sm,
      }}>
       <View style={{ flex: 1 }}>
        <MetricCard
         value={Math.floor(Math.random() * 20) + 5}
         label="Treinos"
         icon={<Ionicons name="fitness-outline" size={20} color={colors.accent.secondary} />}
         accentColor={colors.accent.secondary}
         size="sm"
        />
       </View>
       
       <View style={{ flex: 1 }}>
        <MetricCard
         value={`${Math.floor(Math.random() * 15) + 5}h`}
         label="Tempo"
         icon={<Ionicons name="time-outline" size={20} color={colors.semantic.info} />}
         accentColor={colors.semantic.info}
         size="sm"
        />
       </View>
       
       <View style={{ flex: 1 }}>
        <MetricCard
         value={Math.floor(Math.random() * 10)}
         label="Dor EVA"
         icon={<Ionicons name="stats-chart-outline" size={20} color={colors.semantic.warning} />}
         accentColor={colors.semantic.warning}
         size="sm"
        />
       </View>
      </View>
     </View>

     {/* Ações */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Ações
      </Text>
      
      <View style={{ gap: spacing.sm }}>
       <Button
        title="Atribuir da Biblioteca"
        onPress={handleAssignWorkout}
        variant="primary"
        size="lg"
        icon={<Ionicons name="library-outline" size={16} color={colors.background.primary} />}
       />
       
       <Button
        title="Criar Treino Personalizado"
        onPress={handleCreateWorkout}
        variant="gradient"
        size="lg"
        icon={<Ionicons name="add-circle-outline" size={16} color={colors.background.primary} />}
       />
       
       <Button
        title="Ver Progresso Completo"
        onPress={handleViewProgress}
        variant="secondary"
        size="lg"
        icon={<Text style={{ fontSize: 16 }}>📈</Text>}
       />
       
       <Button
        title="Enviar Mensagem"
        onPress={handleSendMessage}
        variant="ghost"
        size="lg"
        icon={<Ionicons name="chatbubble-outline" size={20} color={colors.accent.primary} />}
       />
      </View>
     </View>

     {/* Histórico Recente - Placeholder */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Atividade Recente
      </Text>
      
      <Card variant="glass" padding="lg">
       <View style={{ alignItems: 'center' }}>
        <Ionicons name="clipboard-outline" size={20} color={colors.text.primary} />
        <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
         Histórico em desenvolvimento
        </Text>
        <Text style={[typography.presets.body, { textAlign: 'center' }]}>
         Em breve você verá toda a atividade do cliente aqui
        </Text>
       </View>
      </Card>
     </View>

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </SafeAreaView>
  </LinearGradient>
 );
});