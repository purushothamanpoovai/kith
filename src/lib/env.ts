function read(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnv() {
  return {
    databaseUrl: read("DATABASE_URL"),
    authSecret: read("AUTH_SECRET"),
    mediaRoot: read("MEDIA_ROOT", "/data/media"),
    appUrl: read("APP_URL", "http://localhost"),
    nodeEnv: process.env.NODE_ENV ?? "development",
    cookieSecure: process.env.AUTH_COOKIE_SECURE === "true",
  };
}
