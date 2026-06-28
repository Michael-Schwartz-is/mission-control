import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

declare const process: {
  env: Record<string, string | undefined>;
};

const LOCAL_ORIGINS = new Set([
  "http://localhost:5555",
  "http://127.0.0.1:5555",
]);

function allowedRedirectOrigins() {
  return [
    process.env.SITE_URL,
    process.env.CLIENT_URL,
    ...LOCAL_ORIGINS,
  ].filter((origin): origin is string => Boolean(origin));
}

function isAllowedRedirect(redirectTo: string) {
  const url = new URL(redirectTo);
  return allowedRedirectOrigins().some((origin) => {
    const allowed = new URL(origin);
    return url.origin === allowed.origin;
  });
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async redirect({ redirectTo }) {
      if (redirectTo.startsWith("/") || redirectTo.startsWith("?")) {
        return `${process.env.SITE_URL}${redirectTo}`;
      }
      if (isAllowedRedirect(redirectTo)) return redirectTo;
      return process.env.SITE_URL!;
    },
  },
});
