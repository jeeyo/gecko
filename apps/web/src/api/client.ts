export type Category = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
};

export type Expense = {
  id: string;
  date: string;
  amountCents: number;
  currency: string;
  categoryId: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseInput = {
  date: string;
  amountCents: number;
  currency?: string;
  categoryId: string;
  note?: string | null;
};

export type NoteSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type GoogleCalendar = {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
};

export type GoogleEvent = {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  allDay: boolean;
  location: string | null;
  description: string | null;
  htmlLink: string | null;
  attendees: { email: string; responseStatus: string | null }[];
};

export type AuthStatus =
  | { connected: true; configured: true; email?: string; selectedCalendarIds: string[] }
  | { connected: false; configured: boolean; email?: string; selectedCalendarIds?: string[] };

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  authStatus: () => request<AuthStatus>("/auth/google/status"),
  authStartUrl: () => `${BASE}/auth/google/start`,

  categories: () => request<Category[]>("/categories"),

  listCalendars: () =>
    request<{ calendars: GoogleCalendar[] } | { error: string; calendars: GoogleCalendar[] }>(
      "/calendar/list",
    ),

  setSelectedCalendars: (ids: string[]) =>
    request<{ ok: true }>("/calendar/selected", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  events: (from: string, to: string) =>
    request<{ events: GoogleEvent[] } | { error: string; events: GoogleEvent[] }>(
      `/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),

  expensesRange: (from: string, to: string) =>
    request<Expense[]>(
      `/expenses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),
  expense: (id: string) => request<Expense>(`/expenses/${id}`),
  createExpense: (body: ExpenseInput) =>
    request<Expense>("/expenses", { method: "POST", body: JSON.stringify(body) }),
  updateExpense: (id: string, body: Partial<ExpenseInput>) =>
    request<Expense>(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteExpense: (id: string) =>
    request<{ ok: true }>(`/expenses/${id}`, { method: "DELETE" }),

  notes: () => request<NoteSummary[]>("/notes"),
  note: (id: string) => request<Note>(`/notes/${id}`),
  createNote: (body: { title?: string; content?: string } = {}) =>
    request<Note>("/notes", { method: "POST", body: JSON.stringify(body) }),
  updateNote: (id: string, body: { title?: string; content?: string }) =>
    request<Note>(`/notes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteNote: (id: string) =>
    request<{ ok: true }>(`/notes/${id}`, { method: "DELETE" }),
};
