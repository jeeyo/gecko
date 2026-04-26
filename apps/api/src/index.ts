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
  .onBeforeHandle(({ request }) => {
    if (env.LOG_LEVEL === "debug") {
      console.log(`[api] ${request.method} ${request.url}`);
    }
  })
  .onAfterHandle(({ request, set }) => {
    console.log(`[api] ${request.method} ${new URL(request.url).pathname} -> ${set.status ?? 200}`);
  })
  .get("/api/health", () => ({ ok: true }))
  .group("/api", (g) =>
    g
      .use(authRoutes)
      .use(calendarRoutes)
      .use(expenseRoutes)
      .use(noteRoutes)
      .use(categoryRoutes),
  )
  .onError(({ error, code, set, request }) => {
    const url = new URL(request.url).pathname;
    console.error(`[api] ERROR ${request.method} ${url} | ${code}:`, error);

    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "validation", detail: String(error) };
    }
    set.status = 500;
    return { error: "internal", message: env.LOG_LEVEL === "debug" ? String(error) : undefined };
  })
  .listen(env.PORT);

console.log(`api listening on http://localhost:${env.PORT}`);

export type App = typeof app;
