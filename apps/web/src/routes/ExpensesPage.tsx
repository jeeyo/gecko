import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Plus } from "lucide-react";
import { useExpensesRange } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/currency";

export function ExpensesPage() {
  const nav = useNavigate();
  const today = new Date();
  const from = format(startOfMonth(today), "yyyy-MM-dd");
  const to = format(endOfMonth(today), "yyyy-MM-dd");

  const { data: expenses = [], isLoading } = useExpensesRange(from, to);
  const { data: categories = [] } = useCategories();
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const grouped: Record<string, typeof expenses> = {};
  for (const e of expenses) {
    (grouped[e.date] ??= []).push(e);
  }
  const days = Object.keys(grouped).sort().reverse();

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">Expenses</h1>
        <Button onClick={() => nav("/expenses/new")} size="sm">
          <Plus className="h-4 w-4" />
          Add expense
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : days.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No expenses this month. Tap "Add expense" to log one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {days.map((d) => {
            const items = grouped[d];
            const dayTotal = items.reduce((a, b) => a + b.amountCents, 0);
            return (
              <Card key={d}>
                <CardContent className="p-3">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-sm font-medium">
                      {format(new Date(d + "T00:00:00"), "EEE, MMM d")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCents(dayTotal)}
                    </span>
                  </div>
                  <ul className="divide-y">
                    {items.map((x) => {
                      const c = catById[x.categoryId];
                      return (
                        <li key={x.id}>
                          <button
                            className="flex w-full items-center gap-3 rounded-md px-2 py-3 text-left hover:bg-accent"
                            onClick={() => nav(`/expenses/${x.id}`)}
                          >
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: c?.color ?? "#6b7280" }}
                            />
                            <div className="flex flex-1 flex-col">
                              <span className="text-sm font-medium">
                                {c?.name ?? "Other"}
                              </span>
                              {x.note ? (
                                <span className="text-xs text-muted-foreground">
                                  {x.note}
                                </span>
                              ) : null}
                            </div>
                            <span className="font-medium">
                              {formatCents(x.amountCents, x.currency)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
