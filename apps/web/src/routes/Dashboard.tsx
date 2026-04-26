import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CalendarView } from "@/components/CalendarView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotes } from "@/hooks/useNotes";
import { useExpensesRange } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { formatCents } from "@/lib/currency";
import { Plus } from "lucide-react";

export function Dashboard() {
  const nav = useNavigate();
  const today = new Date();
  const monthFrom = format(startOfMonth(today), "yyyy-MM-dd");
  const monthTo = format(endOfMonth(today), "yyyy-MM-dd");

  const { data: recentNotes = [] } = useNotes();
  const { data: monthExpenses = [] } = useExpensesRange(monthFrom, monthTo);
  const { data: categories = [] } = useCategories();

  const totalsByCategory = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.categoryId] = (acc[e.categoryId] ?? 0) + e.amountCents;
    return acc;
  }, {});
  const total = Object.values(totalsByCategory).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
        <Button
          onClick={() =>
            nav(`/expenses/new?date=${format(today, "yyyy-MM-dd")}`)
          }
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Add expense
        </Button>
      </header>

      <CalendarView
        readOnly
        onEventClick={(info) => {
          if (info.type === "event") nav(`/events/${encodeURIComponent(info.id)}`);
          else nav(`/expenses/${info.id}`);
        }}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent notes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              recentNotes.slice(0, 5).map((n) => (
                <button
                  key={n.id}
                  className="flex items-center justify-between rounded-md px-2 py-2 text-left hover:bg-accent"
                  onClick={() => nav(`/notes/${n.id}`)}
                >
                  <span className="truncate">{n.title || "Untitled"}</span>
                  <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                    {format(new Date(n.updatedAt), "MMM d")}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This month's expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {total === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses this month.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-semibold">{formatCents(total)}</span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  {categories.map((c) => {
                    const v = totalsByCategory[c.id] ?? 0;
                    if (v === 0) return null;
                    const pct = (v / total) * 100;
                    return (
                      <div
                        key={c.id}
                        style={{ width: `${pct}%`, backgroundColor: c.color }}
                        title={`${c.name}: ${formatCents(v)}`}
                      />
                    );
                  })}
                </div>
                <ul className="grid grid-cols-2 gap-1 pt-2 text-xs sm:text-sm">
                  {categories
                    .filter((c) => (totalsByCategory[c.id] ?? 0) > 0)
                    .map((c) => (
                      <li key={c.id} className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-muted-foreground">{c.name}</span>
                        <span className="ml-auto font-medium">
                          {formatCents(totalsByCategory[c.id])}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
