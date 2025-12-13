import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
 View, 
 Text, 
 FlatList, 
 TouchableOpacity, 
 Alert,
 RefreshControl,
 TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { professionalService, Cliente } from '../services/professionalService';

interface ClientListScreenProps {
 navigation: any;
 route?: {
  params?: {
   mode?: 'assign_template';
   template?: any;
   title?: string;
  };
 };
}

export const ClientListScreen = memo<ClientListScreenProps>(({ navigation, route }) => {
 const { mode, template, title } = route?.params || {};
 const isAssignMode = mode === 'assign_template';
 const [clients, setClients] = useState<Cliente[]>([]);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [searchText, setSearchText] = useState('');
 const [addClientModalVisible, setAddClientModalVisible] = useState(false);
 const [newClientEmail, setNewClientEmail] = useState('');
 const [addingClient, setAddingClient] = useState(false);

 const loadClients = useCallback(async () => {
  try {
   setLoading(true);
   const clientsData = await professionalService.listarClientes();
   setClients(clientsData);
  } catch (error: any) {
   console.error('Erro ao carregar clientes:', error);
   Alert.alert('Erro', error.message || 'Não foi possível carregar os clientes');
  } finally {
   setLoading(false);
  }
 }, []);

 const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadClients();
  setRefreshing(false);
 }, [loadClients]);

 useEffect(() => {
  loadClients();
 }, [loadClients]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleClientPress = useCallback(async (client: Cliente) => {
  Haptics.selectionAsync();
  
  if (isAssignMode && template) {
   // Assign template to client
   Alert.alert(
    'Atribuir Programa',
    `Deseja atribuir o programa "${template.nome}" para ${client.nome}?`,
    [
     { text: 'Cancelar', style: 'cancel' },
     {
      text: 'Atribuir',
      onPress: async () => {
       try {
        await professionalService.atribuirTemplate(client.client_id, template.id);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
         'Sucesso', 
         `Programa "${template.nome}" atribuído para ${client.nome}!`,
         [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
       } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Erro', error.message || 'Não foi possível atribuir o programa');
       }
      }
     }
    ]
   );
  } else {
   // Normal client details navigation
   navigation.navigate('ClientDetails', { client });
  }
 }, [navigation, isAssignMode, template]);

 const handleAddClient = useCallback(() => {
  Haptics.selectionAsync();
  setAddClientModalVisible(true);
 }, []);

 const handleConfirmAddClient = useCallback(async () => {
  if (!newClientEmail.trim()) {
   Alert.alert('Erro', 'Por favor, digite um email válido');
   return;
  }

  try {
   setAddingClient(true);
   await professionalService.adicionarCliente(newClientEmail.trim());
   
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   Alert.alert('Sucesso', 'Cliente adicionado com sucesso!');
   
   setNewClientEmail('');
   setAddClientModalVisible(false);
   
   // Recarregar lista
   await loadClients();
  } catch (error: any) {
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
   Alert.alert('Erro', error.message || 'Não foi possível adicionar o cliente');
  } finally {
   setAddingClient(false);
  }
 }, [newClientEmail, loadClients]);

 const handleRemoveClient = useCallback((client: Cliente) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  Alert.alert(
   'Remover Cliente',
   `Tem certeza que deseja remover ${client.nome} da sua lista de clientes?`,
   [
    { text: 'Cancelar', style: 'cancel' },
    {
     text: 'Remover',
     style: 'destructive',
     onPress: async () => {
      try {
       await professionalService.removerCliente(client.aluno_id);
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
       Alert.alert('Sucesso', 'Cliente removido com sucesso');
       await loadClients();
      } catch (error: any) {
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
       Alert.alert('Erro', error.message || 'Não foi possível remover o cliente');
      }
     },
    },
   ]
  );
 }, [loadClients]);

 // Filtrar clientes baseado no texto de busca
 const filteredClients = clients.filter(client => 
  client.nome.toLowerCase().includes(searchText.toLowerCase()) ||
  client.email.toLowerCase().includes(searchText.toLowerCase())
 );

 const renderClientItem = ({ item }: { item: Cliente }) => {
  const diasVinculo = Math.floor((new Date().getTime() - new Date(item.data_vinculo).getTime()) / (1000 * 60 * 60 * 24));
  
  return (
   <TouchableOpacity
    onPress={() => handleClientPress(item)}
    onLongPress={() => handleRemoveClient(item)}
    activeOpacity={0.8}
   >
    <Card variant="elevated" padding="md" style={{ marginBottom: spacing.sm }}>
     <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
     }}>
      <Avatar
       name={item.nome}
       size="md"
       showBorder={true}
      />
      
      <View style={{ flex: 1 }}>
       <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xxs }]}>
        {item.nome}
       </Text>
       <Text style={[
        typography.presets.body, 
        { color: colors.text.secondary, marginBottom: spacing.xxs }
       ]}>
        {item.email}
       </Text>
       <Text style={[
        typography.presets.caption,
        { color: colors.text.tertiary }
       ]}>
        Vinculado há {diasVinculo} dias
       </Text>
      </View>
      
      <View style={{ alignItems: 'flex-end' }}>
       <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
       }}>
        <View style={{
         width: 8,
         height: 8,
         borderRadius: 4,
         backgroundColor: item.status === 'ativo' ? colors.accent.secondary : colors.semantic.error,
        }} />
        <Text style={[
         typography.presets.caption,
         { 
          color: item.status === 'ativo' ? colors.accent.secondary : colors.semantic.error,
          fontWeight: '600',
          textTransform: 'uppercase'
         }
        ]}>
         {item.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </Text>
       </View>
       
       <Text style={{ fontSize: 20 }}>
        {isAssignMode ? '' : '→'}
       </Text>
      </View>
     </View>
    </Card>
   </TouchableOpacity>
  );
 };

 const renderHeader = () => (
  <>
   {/* Busca */}
   <View style={{
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
   }}>
    <TextInput
     placeholder="Buscar clientes..."
     placeholderTextColor={colors.text.tertiary}
     value={searchText}
     onChangeText={setSearchText}
     style={{
      fontSize: typography.sizes.md,
      color: colors.text.primary,
      padding: 0,
     }}
    />
   </View>

   {/* Estatísticas */}
   <View style={{
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
   }}>
    <Card variant="elevated" padding="md" style={{ flex: 1, alignItems: 'center' }}>
     <Text style={[
      typography.presets.cardTitle,
      { color: colors.accent.primary, marginBottom: spacing.xxs }
     ]}>
      {clients.length}
     </Text>
     <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
      Total
     </Text>
    </Card>
    
    <Card variant="elevated" padding="md" style={{ flex: 1, alignItems: 'center' }}>
     <Text style={[
      typography.presets.cardTitle,
      { color: colors.accent.secondary, marginBottom: spacing.xxs }
     ]}>
      {clients.filter(c => c.status === 'ativo').length}
     </Text>
     <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
      Ativos
     </Text>
    </Card>
    
    <Card variant="elevated" padding="md" style={{ flex: 1, alignItems: 'center' }}>
     <Text style={[
      typography.presets.cardTitle,
      { color: colors.semantic.error, marginBottom: spacing.xxs }
     ]}>
      {clients.filter(c => c.status !== 'ativo').length}
     </Text>
     <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
      Inativos
     </Text>
    </Card>
   </View>

   {filteredClients.length === 0 && !loading && (
    <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
     <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>
       {searchText ? '' : ''}
      </Text>
      <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
       {searchText ? 'Nenhum cliente encontrado' : 'Ainda não há clientes'}
      </Text>
      <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.md }]}>
       {searchText 
        ? 'Tente buscar por outro nome ou email' 
        : 'Comece adicionando seus primeiros clientes'
       }
      </Text>
      {!searchText && (
       <Button
        title="Adicionar Cliente"
        onPress={handleAddClient}
        variant="secondary"
        size="sm"
       />
      )}
     </View>
    </Card>
   )}
  </>
 );

 return (
  <LinearGradient
   colors={[colors.background.primary, colors.background.secondary]}
   style={{ flex: 1 }}
  >
   <SafeAreaView style={{ flex: 1 }}>
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
      {title || 'Meus Clientes'}
     </Text>
     
     {!isAssignMode && (
      <Button
       title="Adicionar"
       onPress={handleAddClient}
       variant="gradient"
       size="sm"
       icon={<Text style={{ fontSize: 14 }}>➕</Text>}
      />
     )}
     {isAssignMode && <View style={{ width: 44 }} />}
    </View>

    <FlatList
     data={filteredClients}
     keyExtractor={(item) => item.id}
     renderItem={renderClientItem}
     ListHeaderComponent={renderHeader}
     contentContainerStyle={{
      paddingHorizontal: spacing.screenHorizontal,
      paddingBottom: spacing.screenVertical,
     }}
     showsVerticalScrollIndicator={false}
     refreshControl={
      <RefreshControl
       refreshing={refreshing}
       onRefresh={handleRefresh}
       tintColor={colors.accent.primary}
       colors={[colors.accent.primary]}
      />
     }
    />

    {/* Modal Simples para Adicionar Cliente */}
    {addClientModalVisible && (
     <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
     }}>
      <Card variant="elevated" padding="lg" style={{ width: '100%', maxWidth: 400 }}>
       <Text style={[
        typography.presets.sectionTitle,
        { marginBottom: spacing.md, textAlign: 'center' }
       ]}>
        Adicionar Cliente
       </Text>
       
       <Text style={[
        typography.presets.body,
        { color: colors.text.secondary, marginBottom: spacing.md }
       ]}>
        Digite o email do cliente que você deseja adicionar:
       </Text>
       
       <View style={{
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.surface.border,
       }}>
        <TextInput
         placeholder="email@exemplo.com"
         placeholderTextColor={colors.text.tertiary}
         value={newClientEmail}
         onChangeText={setNewClientEmail}
         keyboardType="email-address"
         autoCapitalize="none"
         autoCorrect={false}
         style={{
          fontSize: typography.sizes.md,
          color: colors.text.primary,
          padding: 0,
         }}
        />
       </View>
       
       <View style={{
        flexDirection: 'row',
        gap: spacing.sm,
       }}>
        <Button
         title="Cancelar"
         onPress={() => {
          setAddClientModalVisible(false);
          setNewClientEmail('');
         }}
         variant="ghost"
         size="md"
         style={{ flex: 1 }}
        />
        
        <Button
         title={addingClient ? "Adicionando..." : "Adicionar"}
         onPress={handleConfirmAddClient}
         variant="gradient"
         size="md"
         style={{ flex: 1 }}
         disabled={addingClient || !newClientEmail.trim()}
        />
       </View>
      </Card>
     </View>
    )}
   </SafeAreaView>
  </LinearGradient>
 );
});