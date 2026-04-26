import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/routes/Dashboard";
import { ExpensesPage } from "@/routes/ExpensesPage";
import { ExpenseEditPage } from "@/routes/ExpenseEditPage";
import { NotesPage } from "@/routes/NotesPage";
import { NoteEditPage } from "@/routes/NoteEditPage";
import { EventDetailPage } from "@/routes/EventDetailPage";
import { SettingsPage } from "@/routes/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/expenses/new" element={<ExpenseEditPage />} />
            <Route path="/expenses/:id" element={<ExpenseEditPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/notes/:id" element={<NoteEditPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
