import React, { memo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
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
 Input,
 Icon,
} from '../design-system';
import { inviteService } from '../services/inviteService';
import { professionalService } from '../services/professionalService';
import { supabase } from '../services/supabaseClient';

interface ConnectPersonalScreenProps {
 navigation: any;
}

export const ConnectPersonalScreen = memo<ConnectPersonalScreenProps>(({ navigation }) => {
 const [code, setCode] = useState('');
 const [loading, setLoading] = useState(false);
 const [searchName, setSearchName] = useState('');
 const [searchResults, setSearchResults] = useState([]);
 const [searchLoading, setSearchLoading] = useState(false);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleConnectWithCode = useCallback(async () => {
  if (!code.trim()) {
   Alert.alert('Erro', 'Digite o código do personal trainer');
   return;
  }

  if (code.trim().length !== 8 || !code.trim().startsWith('PT')) {
   Alert.alert('Erro', 'Código inválido. O código deve ter 8 dígitos e começar com "PT" (ex: PTABC123)');
   return;
  }

  try {
   setLoading(true);
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
   
   // Get current user
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
    Alert.alert('Erro', 'Usuário não autenticado');
    return;
   }

   // Send invitation instead of direct connection
   await inviteService.sendProfessionalInvite(user.id, code.trim());
   
   Alert.alert(
    'Convite Enviado! 📩', 
    'Seu convite foi enviado para o personal trainer. Aguarde a aprovação para estabelecer a conexão.',
    [
     {
      text: 'Ok',
      onPress: () => navigation.goBack()
     }
    ]
   );
  } catch (error: any) {
   console.error('Erro ao enviar convite:', error);
   Alert.alert('Erro', error.message || 'Não foi possível enviar o convite');
  } finally {
   setLoading(false);
  }
 }, [code, navigation]);

 const handleSearchTrainer = useCallback(async () => {
  if (!searchName.trim()) {
   Alert.alert('Erro', 'Digite o nome do personal trainer');
   return;
  }
  
  try {
   setSearchLoading(true);
   Haptics.selectionAsync();
   
   const results = await professionalService.searchProfessionals(searchName.trim());
   setSearchResults(results);
   
   if (results.length === 0) {
    Alert.alert(
     'Nenhum resultado',
     'Não foram encontrados personal trainers com esse nome. Verifique se o nome está correto.'
    );
   }
  } catch (error) {
   console.error('Erro ao buscar professionals:', error);
   Alert.alert('Erro', 'Não foi possível realizar a busca');
  } finally {
   setSearchLoading(false);
  }
 }, [searchName]);

 const handleConnectToProfessional = useCallback(async (professional: any) => {
  try {
   setLoading(true);
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
   
   const result = await professionalService.requestConnection(professional.user_id);
   
   if (result.success) {
    Alert.alert(
     'Solicitação Enviada!',
     `Sua solicitação de conexão foi enviada para ${professional.nome}. Aguarde a aprovação.`,
     [
      {
       text: 'Ok',
       onPress: () => navigation.goBack()
      }
     ]
    );
   } else {
    Alert.alert('Erro', result.error || 'Não foi possível enviar a solicitação');
   }
  } catch (error) {
   console.error('Erro ao conectar com professional:', error);
   Alert.alert('Erro', 'Não foi possível enviar a solicitação');
  } finally {
   setLoading(false);
  }
 }, [navigation]);

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
     <Button
      title="← Voltar"
      onPress={handleGoBack}
      variant="ghost"
      size="sm"
     />
     
     <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <Icon name="handshake" size={24} color={colors.text.primary} />
      <Text style={typography.presets.screenTitle}>
       Conectar Personal
      </Text>
     </View>
     
     <View style={{ width: 80 }} />
    </View>

    <ScrollView
     style={{ flex: 1 }}
     contentContainerStyle={{
      paddingHorizontal: spacing.screenHorizontal,
      paddingBottom: spacing.screenVertical,
     }}
     showsVerticalScrollIndicator={false}
    >
     {/* Header explicativo */}
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
      <Icon name="trainer" size={48} color={colors.accent.primary} style={{ marginBottom: spacing.sm }} />
      <Text style={[
       typography.presets.sectionTitle,
       { textAlign: 'center', marginBottom: spacing.sm }
      ]}>
       Conecte-se ao seu Personal
      </Text>
      <Text style={[
       typography.presets.body,
       { 
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22
       }
      ]}>
       Use o código fornecido pelo seu personal trainer para estabelecer a conexão e começar seu acompanhamento personalizado.
      </Text>
     </LinearGradient>

     {/* Conectar por código */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Conectar por Código
      </Text>
      
      <Card variant="glass" padding="lg">
       <View style={{ marginBottom: spacing.md }}>
        <Text style={[
         typography.presets.body,
         { 
          color: colors.text.secondary,
          marginBottom: spacing.sm,
          lineHeight: 20
         }
        ]}>
         Digite o código de 8 dígitos fornecido pelo seu personal trainer:
        </Text>
        
        <Input
         placeholder="Digite o código (ex: PTABC123)"
         value={code}
         onChangeText={setCode}
         autoCapitalize="characters"
         maxLength={8}
        />
       </View>
       
       <Button
        title={loading ? "Conectando..." : "Conectar"}
        onPress={handleConnectWithCode}
        variant="primary"
        size="lg"
        disabled={loading || !code.trim()}
        icon={<Icon name="connect" size={16} color={colors.background.primary} />}
       />
      </Card>
     </View>

     {/* Divisor */}
     <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.lg,
     }}>
      <View style={{
       flex: 1,
       height: 1,
       backgroundColor: colors.surface.border,
      }} />
      <Text style={[
       typography.presets.caption,
       {
        color: colors.text.secondary,
        paddingHorizontal: spacing.md,
       }
      ]}>
       OU
      </Text>
      <View style={{
       flex: 1,
       height: 1,
       backgroundColor: colors.surface.border,
      }} />
     </View>

     {/* Buscar personal */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Buscar Personal Trainer
      </Text>
      
      <Card variant="glass" padding="lg">
       <View style={{ marginBottom: spacing.md }}>
        <Text style={[
         typography.presets.body,
         { 
          color: colors.text.secondary,
          marginBottom: spacing.sm,
          lineHeight: 20
         }
        ]}>
         Procure pelo nome do personal trainer:
        </Text>
        
        <Input
         placeholder="Nome do personal trainer"
         value={searchName}
         onChangeText={setSearchName}
         autoCapitalize="words"
        />
       </View>
       
       <Button
        title={searchLoading ? "Buscando..." : "Buscar"}
        onPress={handleSearchTrainer}
        variant="secondary"
        size="lg"
        disabled={searchLoading || !searchName.trim()}
        icon={<Icon name="search" size={16} color={colors.text.primary} />}
       />
      </Card>
     </View>

     {/* Resultados da busca */}
     {searchResults.length > 0 && (
      <View style={{ marginBottom: spacing.lg }}>
       <Text style={[
        typography.presets.sectionTitle,
        { marginBottom: spacing.md }
       ]}>
        Resultados Encontrados ({searchResults.length})
       </Text>
       
       {searchResults.map((professional: any, index: number) => (
        <Card key={index} variant="glass" padding="md" style={{ marginBottom: spacing.sm }}>
         <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
         }}>
          <View style={{ flex: 1 }}>
           <Text style={[
            typography.presets.cardTitle,
            { marginBottom: spacing.xxs }
           ]}>
            {professional.nome}
           </Text>
           
           {professional.especialidade && (
            <Text style={[
             typography.presets.caption,
             { color: colors.text.secondary, marginBottom: spacing.xxs }
            ]}>
             {professional.especialidade}
            </Text>
           )}
           
           {professional.experiencia && (
            <Text style={[
             typography.presets.caption,
             { color: colors.text.tertiary }
            ]}>
             {professional.experiencia} anos de experiência
            </Text>
           )}
          </View>
          
          <Button
           title="Conectar"
           onPress={() => handleConnectToProfessional(professional)}
           variant="primary"
           size="sm"
           disabled={loading}
          />
         </View>
        </Card>
       ))}
      </View>
     )}

     {/* Informações adicionais */}
     <Card variant="glass" padding="lg">
      <View style={{
       flexDirection: 'row',
       alignItems: 'flex-start',
       gap: spacing.sm,
       marginBottom: spacing.md,
      }}>
       <Icon name="info" size={20} color={colors.accent.tertiary} />
       <View style={{ flex: 1 }}>
        <Text style={[
         typography.presets.body,
         { 
          fontWeight: '600',
          marginBottom: spacing.xs
         }
        ]}>
         Dicas importantes:
        </Text>
        <Text style={[
         typography.presets.caption,
         { 
          color: colors.text.secondary,
          lineHeight: 18
         }
        ]}>
         • O código é válido por 24 horas{'\n'}
         • Apenas um código por personal trainer{'\n'}
         • Você pode se conectar a apenas um personal por vez{'\n'}
         • O personal precisa estar registrado no app
        </Text>
       </View>
      </View>
     </Card>

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </SafeAreaView>
  </LinearGradient>
 );
});