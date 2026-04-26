import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotesPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: notes = [], isLoading } = useNotes();

  const create = useMutation({
    mutationFn: () => api.createNote({ title: "Untitled", content: "" }),
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      nav(`/notes/${n.id}`);
    },
  });

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">Notes</h1>
        <Button onClick={() => create.mutate()} disabled={create.isPending} size="sm">
          <Plus className="h-4 w-4" />
          New note
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No notes yet. Tap "New note" to start.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {notes.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => nav(`/notes/${n.id}`)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent"
                  >
                    <span className="truncate font-medium">{n.title || "Untitled"}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(new Date(n.updatedAt), "MMM d, h:mm a")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
