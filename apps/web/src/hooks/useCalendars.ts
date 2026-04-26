import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export function useCalendars() {
  return useQuery({
    queryKey: ["calendars"],
    queryFn: async () => {
      const res = await api.listCalendars();
      if ("error" in res) return [];
      return res.calendars;
    },
    staleTime: 5 * 60_000,
  });
}
