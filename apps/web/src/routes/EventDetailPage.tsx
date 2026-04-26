import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, MapPin, Users } from "lucide-react";
import { api, type GoogleEvent } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["event", id, from, to],
    queryFn: async () => {
      const res = await api.events(from, to);
      const events = (res as { events: GoogleEvent[] }).events ?? [];
      return events.find((e) => e.id === id) ?? null;
    },
  });

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => nav(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Event</h1>
      </header>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Event not found in current window.</p>
      ) : (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-lg font-semibold">{data.title}</h2>
            <p className="text-sm text-muted-foreground">
              {data.start
                ? format(
                    new Date(data.start),
                    data.allDay ? "EEE, MMM d, yyyy" : "EEE, MMM d, yyyy 'at' h:mm a",
                  )
                : "—"}
              {data.end && !data.allDay
                ? ` – ${format(new Date(data.end), "h:mm a")}`
                : ""}
            </p>
            {data.location ? (
              <p className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                {data.location}
              </p>
            ) : null}
            {data.attendees.length > 0 ? (
              <div className="flex items-start gap-2 text-sm">
                <Users className="mt-0.5 h-4 w-4" />
                <ul className="flex flex-wrap gap-1">
                  {data.attendees.map((a) => (
                    <li key={a.email} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {a.email}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data.description ? (
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                {data.description.replace(/<[^>]+>/g, "")}
              </pre>
            ) : null}
            {data.htmlLink ? (
              <a
                href={data.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
              >
                Open in Google Calendar <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
