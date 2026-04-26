import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalendars } from "@/hooks/useCalendars";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["auth-status"],
    queryFn: () => api.authStatus(),
  });

  const { data: calendars = [], isLoading: isLoadingCals } = useCalendars();

  const mutation = useMutation({
    mutationFn: (ids: string[]) => api.setSelectedCalendars(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-status"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const toggleCalendar = (id: string) => {
    if (!data || !("selectedCalendarIds" in data)) return;
    const current = data.selectedCalendarIds ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    mutation.mutate(next);
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold sm:text-2xl">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data?.configured ? (
            <p className="text-sm text-muted-foreground">
              Google OAuth is not configured. Set <code>GOOGLE_CLIENT_ID</code> and{" "}
              <code>GOOGLE_CLIENT_SECRET</code> in your <code>.env</code> and restart the API.
            </p>
          ) : data.connected ? (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                Connected{data.email ? ` as ${data.email}` : ""}.
              </p>

              {isLoadingCals ? (
                <p className="text-sm text-muted-foreground">Fetching calendars…</p>
              ) : calendars.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Select Calendars to show:</h3>
                  <div className="grid gap-2">
                    {calendars.map((cal) => {
                      const isSelected = data.selectedCalendarIds?.includes(cal.id);
                      return (
                        <div
                          key={cal.id}
                          className="flex items-center justify-between rounded-md border p-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: cal.backgroundColor }}
                            />
                            <span>{cal.summary}</span>
                          </div>
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCalendar(cal.id)}
                            disabled={mutation.isPending}
                          >
                            {isSelected ? "Showing" : "Hidden"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No calendars found.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not connected.</p>
          )}
          {data?.configured ? (
            <a href={api.authStartUrl()}>
              <Button variant="outline">{data.connected ? "Reconnect Account" : "Connect Google"}</Button>
            </a>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
