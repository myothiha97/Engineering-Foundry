import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDatabase } from "@platform/database";

export function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
  return betterAuth({
    database: drizzleAdapter(createDatabase(), { provider: "pg" }),
    secret,
    emailAndPassword: { enabled: true, minPasswordLength: 12 },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
    trustedOrigins: [
      process.env.NEXT_PUBLIC_GO_APP_URL,
      process.env.NEXT_PUBLIC_BACKEND_APP_URL,
    ].filter((value): value is string => Boolean(value)),
  });
}
