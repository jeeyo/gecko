import { Elysia, t } from "elysia";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { notes } from "../db/schema";

const NoteInput = t.Object({
  title: t.Optional(t.String()),
  content: t.Optional(t.String()),
});

export const noteRoutes = new Elysia({ prefix: "/notes" })
  .get("/", async () => {
    return db
      .select({
        id: notes.id,
        title: notes.title,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .orderBy(desc(notes.updatedAt));
  })
  .get("/:id", async ({ params, set }) => {
    const row = await db.select().from(notes).where(eq(notes.id, params.id)).limit(1);
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
        .insert(notes)
        .values({
          title: body.title ?? "Untitled",
          content: body.content ?? "",
        })
        .returning();
      return row;
    },
    { body: NoteInput },
  )
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      const [row] = await db
        .update(notes)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(notes.id, params.id))
        .returning();
      if (!row) {
        set.status = 404;
        return { error: "not_found" };
      }
      return row;
    },
    { body: NoteInput },
  )
  .delete("/:id", async ({ params, set }) => {
    const [row] = await db.delete(notes).where(eq(notes.id, params.id)).returning();
    if (!row) {
      set.status = 404;
      return { error: "not_found" };
    }
    return { ok: true };
  });
