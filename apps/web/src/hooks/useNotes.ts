import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: () => api.notes(),
    staleTime: 10_000,
  });
}

export function useNote(id: string | undefined) {
  return useQuery({
    queryKey: ["note", id],
    queryFn: () => api.note(id!),
    enabled: Boolean(id),
  });
}
