import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/types'
import { programaService } from '../services/programaService'

type ProgramLibraryScreenRouteProp = RouteProp<RootStackParamList, 'ProgramLibrary'>
type ProgramLibraryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProgramLibrary'>

interface Props {
  route: ProgramLibraryScreenRouteProp
  navigation: ProgramLibraryScreenNavigationProp
}

export default function ProgramLibraryScreen({ navigation }: Props) {
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPrograms()
  }, [])

  const loadPrograms = async () => {
    try {
      setLoading(true)
      const response = await programaService.buscarProgramas({}, 1, 50)
      if (response.data) {
        setPrograms(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar programas:', error)
      Alert.alert('Erro', 'Não foi possível carregar os programas')
    } finally {
      setLoading(false)
    }
  }

  const handleProgramPress = (program: any) => {
    // Navigate to program details or execution
    navigation.navigate('ProgramExecution', { template: program })
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando programas...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca de Programas</Text>
        <Text style={styles.subtitle}>Escolha um programa para seguir</Text>
      </View>

      <View style={styles.programsList}>
        {programs.map((program) => (
          <TouchableOpacity
            key={program.id}
            style={styles.programCard}
            onPress={() => handleProgramPress(program)}
          >
            <View style={styles.programInfo}>
              <Text style={styles.programName}>{program.nome}</Text>
              <Text style={styles.programDescription}>
                {program.descricao || 'Sem descrição'}
              </Text>
              <View style={styles.programMeta}>
                <Text style={styles.programMetaText}>
                  {program.duracao_semanas || 4} semanas • {program.frequencia_semanal || 3}x/semana
                </Text>
                <Text style={styles.programLevel}>
                  {program.nivel || 'Iniciante'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {programs.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhum programa disponível</Text>
          <Text style={styles.emptySubtext}>
            Entre em contato com seu personal trainer
          </Text>
        </View>
      )}
    </ScrollView>
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  programsList: {
    padding: 15,
  },
  programCard: {
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
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  programMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programMetaText: {
    fontSize: 12,
    color: '#999',
  },
  programLevel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
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