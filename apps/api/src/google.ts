import { google } from "googleapis";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { oauthTokens } from "./db/schema";
import { env, googleConfigured } from "./env";

export const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function makeOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

export async function loadStoredTokens() {
  const rows = await db.select().from(oauthTokens).where(eq(oauthTokens.id, 1)).limit(1);
  return rows[0] ?? null;
}

export async function saveTokens(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
  email?: string | null;
}) {
  const existing = await loadStoredTokens();
  const merged = {
    id: 1,
    accessToken: tokens.access_token ?? existing?.accessToken ?? null,
    refreshToken: tokens.refresh_token ?? existing?.refreshToken ?? null,
    scope: tokens.scope ?? existing?.scope ?? null,
    tokenType: tokens.token_type ?? existing?.tokenType ?? null,
    expiryDate: tokens.expiry_date ?? existing?.expiryDate ?? null,
    email: tokens.email ?? existing?.email ?? null,
  };
  if (existing) {
    await db.update(oauthTokens).set(merged).where(eq(oauthTokens.id, 1));
  } else {
    await db.insert(oauthTokens).values(merged);
  }
}

export async function getAuthorizedClient() {
  if (!googleConfigured()) return null;
  const stored = await loadStoredTokens();
  if (!stored?.refreshToken) return null;
  const client = makeOAuthClient();
  client.setCredentials({
    access_token: stored.accessToken ?? undefined,
    refresh_token: stored.refreshToken,
    scope: stored.scope ?? undefined,
    token_type: stored.tokenType ?? undefined,
    expiry_date: stored.expiryDate ?? undefined,
  });
  client.on("tokens", (t) => {
    void saveTokens({
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      scope: t.scope,
      token_type: t.token_type,
      expiry_date: t.expiry_date,
    });
  });
  return client;
}

export async function authStatus() {
  if (!googleConfigured()) return { connected: false, configured: false } as const;
  const stored = await loadStoredTokens();
  return {
    connected: Boolean(stored?.refreshToken),
    configured: true,
    email: stored?.email ?? undefined,
    selectedCalendarIds: stored?.selectedCalendarIds ?? [],
  } as const;
}
