import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { treinoService, CreateTreinoData, UpdateTreinoData } from '../services/treinoService';

export const useTreinos = (usuarioId: string | undefined) => {
  const queryClient = useQueryClient();

  const {
    data: treinos = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['treinos', usuarioId],
    queryFn: () => treinoService.getTreinos(usuarioId!),
    enabled: !!usuarioId,
  });

  const createTreinoMutation = useMutation({
    mutationFn: (data: CreateTreinoData) => treinoService.createTreino(usuarioId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treinos', usuarioId] });
    },
  });

  const updateTreinoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTreinoData }) => 
      treinoService.updateTreino(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treinos', usuarioId] });
    },
  });

  const deleteTreinoMutation = useMutation({
    mutationFn: (id: string) => treinoService.deleteTreino(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treinos', usuarioId] });
    },
  });

  const markAsDoneMutation = useMutation({
    mutationFn: (id: string) => treinoService.markTreinoAsDone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treinos', usuarioId] });
      queryClient.invalidateQueries({ queryKey: ['insights', usuarioId] });
    },
  });

  return {
    treinos,
    isLoading,
    error,
    refetch,
    createTreino: createTreinoMutation.mutateAsync,
    updateTreino: updateTreinoMutation.mutateAsync,
    deleteTreino: deleteTreinoMutation.mutateAsync,
    markAsDone: markAsDoneMutation.mutateAsync,
    isCreating: createTreinoMutation.isPending,
    isUpdating: updateTreinoMutation.isPending,
    isDeleting: deleteTreinoMutation.isPending,
    isMarkingDone: markAsDoneMutation.isPending,
  };
};