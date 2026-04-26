import { Elysia, t } from "elysia";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { expenses } from "../db/schema";
import { env } from "../env";

const ExpenseInput = t.Object({
  date: t.String({ format: "date" }),
  amountCents: t.Integer({ minimum: 0 }),
  currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
  categoryId: t.String(),
  note: t.Optional(t.Nullable(t.String())),
});

const ExpenseUpdate = t.Partial(ExpenseInput);

export const expenseRoutes = new Elysia({ prefix: "/expenses" })
  .get(
    "/",
    async ({ query }) => {
      return db
        .select()
        .from(expenses)
        .where(and(gte(expenses.date, query.from), lte(expenses.date, query.to)))
        .orderBy(asc(expenses.date));
    },
    {
      query: t.Object({
        from: t.String({ format: "date" }),
        to: t.String({ format: "date" }),
      }),
    },
  )
  .get("/:id", async ({ params, set }) => {
    const row = await db.select().from(expenses).where(eq(expenses.id, params.id)).limit(1);
    if (!row[0]) {
      set.status = 404;
      return { error: "not_found" };
    }
    return row[0];
  })
  .post(
    "/",
    async ({ body }) => {
      const [row] = await db
        .insert(expenses)
        .values({
          date: body.date,
          amountCents: body.amountCents,
          currency: body.currency ?? env.DEFAULT_CURRENCY,
          categoryId: body.categoryId,
          note: body.note ?? null,
        })
        .returning();
      return row;
    },
    { body: ExpenseInput },
  )
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      const [row] = await db
        .update(expenses)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(expenses.id, params.id))
        .returning();
      if (!row) {
        set.status = 404;
        return { error: "not_found" };
      }
      return row;
    },
    { body: ExpenseUpdate },
  )
  .delete("/:id", async ({ params, set }) => {
    const [row] = await db.delete(expenses).where(eq(expenses.id, params.id)).returning();
    if (!row) {
      set.status = 404;
      return { error: "not_found" };
    }
    return { ok: true };
  });
