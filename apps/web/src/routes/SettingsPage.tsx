import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-status"],
    queryFn: () => api.authStatus(),
  });

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold sm:text-2xl">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data?.configured ? (
            <p className="text-sm text-muted-foreground">
              Google OAuth is not configured. Set <code>GOOGLE_CLIENT_ID</code> and{" "}
              <code>GOOGLE_CLIENT_SECRET</code> in your <code>.env</code> and restart the API.
            </p>
          ) : data.connected ? (
            <p className="text-sm">
              Connected{data.email ? ` as ${data.email}` : ""}.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Not connected.</p>
          )}
          {data?.configured ? (
            <a href={api.authStartUrl()}>
              <Button>{data.connected ? "Reconnect" : "Connect Google"}</Button>
            </a>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
