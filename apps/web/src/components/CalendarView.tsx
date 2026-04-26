import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";
import { useEvents } from "@/hooks/useEvents";
import { useExpensesRange } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { formatCents } from "@/lib/currency";

type Range = { start: Date; end: Date };

type Props = {
  readOnly?: boolean;
  onEventClick?: (info: { type: "event" | "expense"; id: string }) => void;
};

export function CalendarView({ readOnly = true, onEventClick }: Props) {
  const calRef = useRef<FullCalendar>(null);
  const [range, setRange] = useState<Range>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { start, end };
  });

  const fromIso = range.start.toISOString();
  const toIso = range.end.toISOString();
  const fromDay = range.start.toISOString().slice(0, 10);
  const toDay = range.end.toISOString().slice(0, 10);

  const { data: events = [] } = useEvents(fromIso, toIso);
  const { data: expenses = [] } = useExpensesRange(fromDay, toDay);
  const { data: categories = [] } = useCategories();

  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );

  const fcEvents = useMemo<EventInput[]>(() => {
    const googleEvents: EventInput[] = events
      .filter((e) => e.start)
      .map((e) => ({
        id: `g:${e.id}`,
        title: e.title,
        start: e.start ?? undefined,
        end: e.end ?? undefined,
        allDay: e.allDay,
        backgroundColor: "#1e40af",
        borderColor: "#1e40af",
        extendedProps: { type: "event", refId: e.id },
      }));
    const expenseEvents: EventInput[] = expenses.map((x) => {
      const cat = categoryById[x.categoryId];
      return {
        id: `x:${x.id}`,
        title: `${cat?.name ?? "Expense"}  ${formatCents(x.amountCents, x.currency)}`,
        start: x.date,
        allDay: true,
        backgroundColor: cat?.color ?? "#6b7280",
        borderColor: cat?.color ?? "#6b7280",
        extendedProps: { type: "expense", refId: x.id },
      };
    });
    return [...googleEvents, ...expenseEvents];
  }, [events, expenses, categoryById]);

  return (
    <div className="rounded-lg border bg-card p-2 sm:p-4">
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        headerToolbar={{ start: "title", center: "", end: "prev,today,next" }}
        events={fcEvents}
        editable={false}
        selectable={!readOnly}
        longPressDelay={150}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          const t = info.event.extendedProps.type as "event" | "expense";
          const refId = info.event.extendedProps.refId as string;
          onEventClick?.({ type: t, id: refId });
        }}
        datesSet={(arg) => setRange({ start: arg.start, end: arg.end })}
      />
    </div>
  );
}
