import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { env } from "./env";
import { authRoutes } from "./routes/auth";
import { calendarRoutes } from "./routes/calendar";
import { expenseRoutes } from "./routes/expenses";
import { noteRoutes } from "./routes/notes";
import { categoryRoutes } from "./routes/categories";

const app = new Elysia()
  .use(cors({ origin: env.WEB_ORIGIN, credentials: true }))
  .get("/api/health", () => ({ ok: true }))
  .group("/api", (g) =>
    g
      .use(authRoutes)
      .use(calendarRoutes)
      .use(expenseRoutes)
      .use(noteRoutes)
      .use(categoryRoutes),
  )
  .onError(({ error, code, set }) => {
    console.error(`[api] ${code}:`, error);
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "validation", detail: String(error) };
    }
    set.status = 500;
    return { error: "internal" };
  })
  .listen(env.PORT);

console.log(`api listening on http://localhost:${env.PORT}`);

export type App = typeof app;
