import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export function useCurrency() {
  const { data: status } = useQuery({
    queryKey: ["authStatus"],
    queryFn: () => api.authStatus(),
  });
  return status?.defaultCurrency ?? "USD";
}
