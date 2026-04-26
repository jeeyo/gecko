const required = (key: string, fallback?: string): string => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${key}`);
  return v;
};

export const env = {
  DATABASE_URL: required("DATABASE_URL", "postgres://localhost/gecko"),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  GOOGLE_REDIRECT_URI:
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3001/api/auth/google/callback",
  PORT: Number(process.env.PORT ?? 3001),
  WEB_ORIGIN: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY ?? "USD",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
};

export const googleConfigured = (): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
