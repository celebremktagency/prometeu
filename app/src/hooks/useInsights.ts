import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insightsService } from '../services/insightsService';
import { dorService, RecordDorData } from '../services/dorService';

export const useInsights = (usuarioId: string | undefined) => {
  const queryClient = useQueryClient();

  const {
    data: weeklyInsights,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['insights', usuarioId],
    queryFn: () => insightsService.getWeeklyInsights(usuarioId!),
    enabled: !!usuarioId,
  });

  const recordDorMutation = useMutation({
    mutationFn: (data: RecordDorData) => dorService.recordDor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights', usuarioId] });
    },
  });

  return {
    weeklyInsights,
    isLoading,
    error,
    refetch,
    recordDor: recordDorMutation.mutateAsync,
    isRecordingDor: recordDorMutation.isPending,
  };
};