import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/api/client";
import { useExpense } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseAmountToCents } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { ArrowLeft, Trash2 } from "lucide-react";

export function ExpenseEditPage() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === "new";
  const nav = useNavigate();
  const [search] = useSearchParams();
  const qc = useQueryClient();

  const { data: existing } = useExpense(isNew ? undefined : id);
  const { data: categories = [] } = useCategories();

  const initialDate = useMemo(() => {
    const q = search.get("date");
    if (q) return q;
    return format(new Date(), "yyyy-MM-dd");
  }, [search]);

  const [date, setDate] = useState(initialDate);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (existing) {
      setDate(existing.date);
      setAmount((existing.amountCents / 100).toFixed(2));
      setCategoryId(existing.categoryId);
      setNote(existing.note ?? "");
    }
  }, [existing]);

  useEffect(() => {
    if (isNew && !categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [isNew, categoryId, categories]);

  const save = useMutation({
    mutationFn: async () => {
      const cents = parseAmountToCents(amount);
      if (cents === null || cents <= 0) throw new Error("Invalid amount");
      if (!categoryId) throw new Error("Pick a category");
      const body = {
        date,
        amountCents: cents,
        categoryId,
        note: note.trim() || null,
      };
      if (isNew) return api.createExpense(body);
      return api.updateExpense(id!, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense", id] });
      nav(-1);
    },
  });

  const remove = useMutation({
    mutationFn: () => api.deleteExpense(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      nav("/expenses");
    },
  });

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col p-4 sm:p-6">
      <header className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => nav(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">
          {isNew ? "Add expense" : "Edit expense"}
        </h1>
      </header>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-14 text-2xl font-semibold"
            autoFocus={isNew}
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {categories.map((c) => {
              const active = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "bg-card",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            placeholder="Optional"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {save.isError ? (
          <p className="text-sm text-destructive">{(save.error as Error).message}</p>
        ) : null}
      </div>

      <div
        className="sticky bottom-0 mt-auto flex gap-2 bg-background pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        {!isNew ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
        <Button variant="outline" className="flex-1" onClick={() => nav(-1)}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={() => save.mutate()}
          disabled={save.isPending}
        >
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
