import "server-only";

const read = (key: string) => {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : undefined;
};

export const env = {
  siteUrl: read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000",
  supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseKey: read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  serviceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  resendKey: read("RESEND_API_KEY"),
  resendFrom: read("RESEND_FROM_EMAIL"),
  adminEmail: read("ADMIN_NOTIFICATION_EMAIL"),
  googleClientId: read("GOOGLE_CLIENT_ID"),
  googleClientSecret: read("GOOGLE_CLIENT_SECRET"),
  googleRedirectUri: read("GOOGLE_REDIRECT_URI"),
  googleCalendarId: read("GOOGLE_CALENDAR_ID") ?? "primary",
  tokenKey: read("OAUTH_TOKEN_ENCRYPTION_KEY"),
  metaAppId: read("META_APP_ID"),
  metaAppSecret: read("META_APP_SECRET"),
  instagramVerifyToken: read("INSTAGRAM_VERIFY_TOKEN"),
  timezone: read("DEFAULT_TIMEZONE") ?? "America/Chicago", // Houston, TX
};

export const integrations = {
  supabase: Boolean(env.supabaseUrl && env.supabaseKey),
  supabaseAdmin: Boolean(env.supabaseUrl && env.serviceRoleKey),
  resend: Boolean(env.resendKey && env.resendFrom),
  google: Boolean(env.googleClientId && env.googleClientSecret && env.googleRedirectUri && env.tokenKey),
  instagram: Boolean(env.metaAppId && env.metaAppSecret && env.tokenKey),
};
