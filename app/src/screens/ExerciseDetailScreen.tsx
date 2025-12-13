import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'

interface ExerciseDetailScreenProps {
 navigation: any
 route: {
  params: {
   exercise: any
  }
 }
}

export const ExerciseDetailScreen: React.FC<ExerciseDetailScreenProps> = ({ 
 navigation, 
 route 
}) => {
 const { exercise } = route.params

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
      {exercise.nome}
     </Text>
     <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
    </View>

    {/* Informações do Exercício */}
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
       <Text style={{ fontWeight: 'bold' }}>Grupo Muscular: </Text>
       {exercise.grupo_muscular || 'Não especificado'}
      </Text>
      <Text style={{ marginBottom: 5 }}>
       <Text style={{ fontWeight: 'bold' }}>Equipamento: </Text>
       {exercise.equipamento || 'Não especificado'}
      </Text>
      <Text style={{ marginBottom: 5 }}>
       <Text style={{ fontWeight: 'bold' }}>Nível: </Text>
       {exercise.nivel || 'Não especificado'}
      </Text>
      <Text>
       <Text style={{ fontWeight: 'bold' }}>Status: </Text>
       {exercise.ativo ? 'Ativo' : 'Inativo'}
      </Text>
     </View>
    </View>

    {/* Descrição */}
    {exercise.descricao && (
     <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
       Descrição
      </Text>
      <View style={{ 
       backgroundColor: '#f0f8ff', 
       padding: 15, 
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#cce7ff'
      }}>
       <Text style={{ lineHeight: 20 }}>{exercise.descricao}</Text>
      </View>
     </View>
    )}

    {/* Instruções */}
    {exercise.instrucoes && (
     <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
       Como Executar
      </Text>
      <View style={{ 
       backgroundColor: '#f0fff4', 
       padding: 15, 
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#b3f5cc'
      }}>
       <Text style={{ lineHeight: 20 }}>{exercise.instrucoes}</Text>
      </View>
     </View>
    )}

    {/* Vídeo */}
    {exercise.youtube_url && (
     <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
       📹 Vídeo Demonstrativo
      </Text>
      <View style={{ 
       backgroundColor: '#fff5f5', 
       padding: 15, 
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#ffe0e0'
      }}>
       <Text style={{ color: '#0066cc', textDecorationLine: 'underline' }}>
        {exercise.youtube_url}
       </Text>
       <Text style={{ color: '#666', marginTop: 5, fontSize: 12 }}>
        Abra em um navegador para assistir
       </Text>
      </View>
     </View>
    )}

    {/* Músculos Trabalhados */}
    {exercise.musculos_trabalhados && (
     <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
       Músculos Trabalhados
      </Text>
      <View style={{ 
       backgroundColor: '#fefefe', 
       padding: 15, 
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#eee'
      }}>
       <Text>{exercise.musculos_trabalhados}</Text>
      </View>
     </View>
    )}

    {/* Variações */}
    {exercise.variacoes && (
     <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
       Variações
      </Text>
      <View style={{ 
       backgroundColor: '#f9f9f9', 
       padding: 15, 
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#ddd'
      }}>
       <Text>{exercise.variacoes}</Text>
      </View>
     </View>
    )}

    {/* Cuidados */}
    {exercise.cuidados && (
     <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Cuidados Importantes
      </Text>
      <View style={{ 
       backgroundColor: '#fff8e1', 
       padding: 15, 
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#ffeb3b'
      }}>
       <Text style={{ color: '#e65100' }}>{exercise.cuidados}</Text>
      </View>
     </View>
    )}
   </ScrollView>
  </SafeAreaView>
 )
}