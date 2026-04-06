import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api-client';
import { Evaluation } from '@/types/database';

export function useEvaluations() {
  return useQuery({
    queryKey: ['evaluations'],
    queryFn: () => api.evaluations.list(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => api.evaluations.get(id),
    enabled: !!id,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.evaluations.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.evaluations.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation', id] });
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}
