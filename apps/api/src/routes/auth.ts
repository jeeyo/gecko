import { Elysia } from "elysia";
import { google } from "googleapis";
import { authStatus, makeOAuthClient, saveTokens, SCOPES } from "../google";
import { env, googleConfigured } from "../env";

export const authRoutes = new Elysia({ prefix: "/auth/google" })
  .get("/status", () => authStatus())
  .get("/start", ({ redirect, set }) => {
    if (!googleConfigured()) {
      set.status = 400;
      return { error: "google_not_configured" };
    }
    const url = makeOAuthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
    });
    return redirect(url);
  })
  .get("/callback", async ({ query, redirect, set }) => {
    const code = (query as { code?: string }).code;
    if (!code) {
      set.status = 400;
      return { error: "missing_code" };
    }
    const client = makeOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    let email: string | null = null;
    try {
      const oauth2 = google.oauth2({ auth: client, version: "v2" });
      const me = await oauth2.userinfo.get();
      email = me.data.email ?? null;
    } catch {
      // ignore
    }
    await saveTokens({ ...tokens, email });
    return redirect(env.WEB_ORIGIN + "/?connected=1");
  });
