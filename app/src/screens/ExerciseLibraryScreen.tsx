import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/types'
import { exercicioService } from '../services/exercicioService'

type ExerciseLibraryScreenRouteProp = RouteProp<RootStackParamList, 'ExerciseLibrary'>
type ExerciseLibraryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ExerciseLibrary'>

interface Props {
  route: ExerciseLibraryScreenRouteProp
  navigation: ExerciseLibraryScreenNavigationProp
}

export default function ExerciseLibraryScreen({ navigation }: Props) {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async () => {
    try {
      setLoading(true)
      const response = await exercicioService.buscarExercicios({ search: searchTerm }, 1, 100)
      if (response.data) {
        setExercises(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error)
      Alert.alert('Erro', 'Não foi possível carregar os exercícios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadExercises()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleExercisePress = (exercise: any) => {
    navigation.navigate('ExerciseDetail', { exercise })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'iniciante':
        return '#4CAF50'
      case 'intermediario':
        return '#FF9800'
      case 'avancado':
        return '#F44336'
      default:
        return '#757575'
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando exercícios...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca de Exercícios</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar exercícios..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <ScrollView style={styles.exercisesList}>
        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={styles.exerciseCard}
            onPress={() => handleExercisePress(exercise)}
          >
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.nome}</Text>
              <Text style={styles.exerciseDescription}>
                {exercise.descricao || 'Sem descrição'}
              </Text>
              <View style={styles.exerciseMeta}>
                <Text style={styles.equipment}>{exercise.equipamento}</Text>
                <View 
                  style={[
                    styles.difficultyBadge, 
                    { backgroundColor: getDifficultyColor(exercise.dificuldade) }
                  ]}
                >
                  <Text style={styles.difficultyText}>
                    {exercise.dificuldade || 'N/A'}
                  </Text>
                </View>
              </View>
              {exercise.grupo_muscular && exercise.grupo_muscular.length > 0 && (
                <View style={styles.muscleGroups}>
                  {exercise.grupo_muscular.slice(0, 3).map((group: string, index: number) => (
                    <Text key={index} style={styles.muscleGroup}>
                      {group}
                    </Text>
                  ))}
                  {exercise.grupo_muscular.length > 3 && (
                    <Text style={styles.muscleGroup}>
                      +{exercise.grupo_muscular.length - 3}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {exercises.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchTerm ? 'Nenhum exercício encontrado' : 'Nenhum exercício disponível'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchTerm 
              ? 'Tente uma busca diferente'
              : 'Entre em contato com seu personal trainer'
            }
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  exercisesList: {
    padding: 15,
  },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  exerciseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipment: {
    fontSize: 12,
    color: '#999',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleGroup: {
    fontSize: 11,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})