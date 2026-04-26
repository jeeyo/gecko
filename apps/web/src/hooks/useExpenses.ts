import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export function useExpensesRange(from: string, to: string) {
  return useQuery({
    queryKey: ["expenses", "range", from, to],
    queryFn: () => api.expensesRange(from, to),
    staleTime: 30_000,
  });
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: ["expense", id],
    queryFn: () => api.expense(id!),
    enabled: Boolean(id),
  });
}
