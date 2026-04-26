import { useQuery } from "@tanstack/react-query";
import { api, type GoogleEvent } from "@/api/client";

export function useEvents(from: string, to: string) {
  return useQuery({
    queryKey: ["events", from, to],
    queryFn: async () => {
      try {
        const res = await api.events(from, to);
        return res.events as GoogleEvent[];
      } catch {
        return [] as GoogleEvent[];
      }
    },
    staleTime: 60_000,
  });
}
