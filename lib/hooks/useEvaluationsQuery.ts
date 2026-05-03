import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { Evaluation } from "@/types/database";

async function fetchEvaluations(): Promise<Evaluation[]> {
  const res = await apiGet("/api/evaluations");
  const json = await res.json();
  return (json.data ?? json) as Evaluation[];
}

async function fetchEvaluation(id: string): Promise<Evaluation> {
  const res = await apiGet(`/api/evaluations/${id}`);
  const json = await res.json();
  return (json.data ?? json) as Evaluation;
}

export function useEvaluations() {
  return useQuery({
    queryKey: ["evaluations"],
    queryFn: fetchEvaluations,
    staleTime: 1000 * 60 * 5,
  });
}

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: ["evaluation", id],
    queryFn: () => fetchEvaluation(id),
    enabled: !!id,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPost("/api/evaluations", data);
      const json = await res.json();
      return (json.data ?? json) as Evaluation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiPost(`/api/evaluations/${id}`, data);
      const json = await res.json();
      return (json.data ?? json) as Evaluation;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation", id] });
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}
