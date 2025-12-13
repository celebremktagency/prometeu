import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { treinoService } from '../services/treinoService'
import { templateService } from '../services/templateService'

interface WorkoutTemplateDetailScreenProps {
 navigation: any
 route: {
  params: {
   template: any
  }
 }
}

export const WorkoutTemplateDetailScreen: React.FC<WorkoutTemplateDetailScreenProps> = ({ 
 navigation, 
 route 
}) => {
 const { template } = route.params
 const [loading, setLoading] = useState(false)
 const [exercises, setExercises] = useState<any[]>([])
 const [loadingExercises, setLoadingExercises] = useState(true)

 useEffect(() => {
  const loadTemplateExercises = async () => {
   try {
    setLoadingExercises(true)
    const templateData = await templateService.obterTemplate(template.id)
    setExercises(templateData.treinos || [])
   } catch (error) {
    console.error('Erro ao carregar exercícios:', error)
   } finally {
    setLoadingExercises(false)
   }
  }

  loadTemplateExercises()
 }, [template.id])

 const criarTreinoDoTemplate = async () => {
  setLoading(true)
  try {
   await treinoService.criarTreino(
    template.nome, 
    `Treino baseado no template: ${template.descricao || template.objetivo}`
   )
   Alert.alert('Sucesso', 'Treino criado com base no template!')
   navigation.goBack()
  } catch (error: any) {
   Alert.alert('Erro', error.message)
  } finally {
   setLoading(false)
  }
 }

 return (
  <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
   <ScrollView style={{ flex: 1, padding: 20 }}>
    <View style={{ 
     flexDirection: 'row', 
     justifyContent: 'space-between', 
     alignItems: 'center',
     marginBottom: 30 
    }}>
     <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
      {template.nome}
     </Text>
     <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
    </View>

    {/* Informações Básicas */}
    <View style={{ marginBottom: 20 }}>
     <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
      Informações
     </Text>
     <View style={{ 
      backgroundColor: '#f8f9fa', 
      padding: 15, 
      borderRadius: 10,
      marginBottom: 15
     }}>
      <Text style={{ marginBottom: 5 }}>
       <Text style={{ fontWeight: 'bold' }}>Duração: </Text>
       {template.duracao_estimada_min || 0} minutos
      </Text>
      <Text style={{ marginBottom: 5 }}>
       <Text style={{ fontWeight: 'bold' }}>Nível: </Text>
       {template.nivel || 'Não especificado'}
      </Text>
      <Text style={{ marginBottom: 5 }}>
       <Text style={{ fontWeight: 'bold' }}>Categoria: </Text>
       {template.categoria || 'Não especificado'}
      </Text>
      <Text>
       <Text style={{ fontWeight: 'bold' }}>Status: </Text>
       {template.ativo ? 'Ativo' : 'Inativo'}
      </Text>
     </View>
    </View>

    {/* Objetivo */}
    {template.objetivo && (
     <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Objetivo
      </Text>
      <View style={{ 
       backgroundColor: '#f0f8ff', 
       padding: 15, 
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#cce7ff'
      }}>
       <Text style={{ lineHeight: 20 }}>{template.objetivo}</Text>
      </View>
     </View>
    )}

    {/* Descrição */}
    {template.descricao && (
     <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Descrição
      </Text>
      <View style={{ 
       backgroundColor: '#f0fff4', 
       padding: 15, 
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#b3f5cc'
      }}>
       <Text style={{ lineHeight: 20 }}>{template.descricao}</Text>
      </View>
     </View>
    )}

    {/* Exercícios */}
    <View style={{ marginBottom: 20 }}>
     <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
       Exercícios ({exercises.length})
     </Text>
     {loadingExercises ? (
      <View style={{ 
       backgroundColor: '#f8f9fa', 
       padding: 15, 
       borderRadius: 10,
       alignItems: 'center'
      }}>
       <Text>Carregando exercícios...</Text>
      </View>
     ) : exercises.length > 0 ? (
      exercises.map((exercise, index) => (
       <View key={exercise.id} style={{ 
        backgroundColor: '#fffbf0', 
        padding: 15, 
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ffeaa7',
        marginBottom: 10
       }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 5 }}>
         {exercise.exercicio}
        </Text>
        {exercise.descricao && (
         <Text style={{ color: '#666', marginBottom: 5 }}>
          {exercise.descricao}
         </Text>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
         <Text style={{ color: '#333' }}>
          <Text style={{ fontWeight: 'bold' }}>Séries: </Text>
          {exercise.series || 3}
         </Text>
         <Text style={{ color: '#333' }}>
          <Text style={{ fontWeight: 'bold' }}>Reps: </Text>
          {exercise.repeticoes || '10'}
         </Text>
         <Text style={{ color: '#333' }}>
          <Text style={{ fontWeight: 'bold' }}>Duração: </Text>
          {exercise.duracao_min || 30} min
         </Text>
        </View>
       </View>
      ))
     ) : (
      <View style={{ 
       backgroundColor: '#f8f9fa', 
       padding: 15, 
       borderRadius: 10,
       alignItems: 'center'
      }}>
       <Text style={{ color: '#666' }}>Nenhum exercício encontrado</Text>
      </View>
     )}
    </View>

    {/* Instruções */}
    {template.instrucoes && (
     <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Instruções
      </Text>
      <View style={{ 
       backgroundColor: '#fff5f5', 
       padding: 15, 
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#ffe0e0'
      }}>
       <Text style={{ lineHeight: 20 }}>{template.instrucoes}</Text>
      </View>
     </View>
    )}

    {/* Observações */}
    {template.observacoes && (
     <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Observações
      </Text>
      <View style={{ 
       backgroundColor: '#fff8e1', 
       padding: 15, 
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#ffeb3b'
      }}>
       <Text style={{ color: '#e65100', lineHeight: 20 }}>
        {template.observacoes}
       </Text>
      </View>
     </View>
    )}

    {/* Botão para usar template */}
    <View style={{ marginTop: 20, marginBottom: 40 }}>
     <Button 
      title="Usar Este Template" 
      onPress={criarTreinoDoTemplate}
      loading={loading}
     />
    </View>
   </ScrollView>
  </SafeAreaView>
 )
}