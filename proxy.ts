import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Auth pages — a signed-in user has no reason to be here. */
const AUTH_PATHS = ["/sign-in", "/sign-up"];

/** The public marketing page. Exact match: "/" is a prefix of everything. */
const LANDING_PATH = "/";

/**
 * The signed-in area. This is an allowlist of what to GUARD, which is the
 * inverse of the denylist of public paths it replaced.
 *
 * The denylist redirected anything it did not recognise, and middleware
 * runs before routing, so it cannot tell a protected page from a URL that
 * does not exist. Every typo'd address answered with a 307 to /sign-in,
 * and app/not-found.tsx was unreachable for a signed-out visitor.
 *
 * Listing what to guard is safe here because it is not the only guard:
 * all four pages under app/(app)/ call redirect("/sign-in") themselves
 * when there is no user, and every table is behind RLS. This layer exists
 * to avoid a pointless render, not to be the last line of defence — so a
 * new route added without a line here degrades to a slower redirect, not
 * to exposed data.
 */
const PROTECTED_PREFIXES = ["/play", "/profile", "/matches"];

/** Where a signed-in user lands. */
const APP_HOME = "/play";

/** Exact match, or a real path segment — "/play" must not match "/playground". */
function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session (writing new tokens back via setAll above if
  // needed) and tells us whether the caller is signed in.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPath = AUTH_PATHS.some((path) => isUnder(pathname, path));
  const isLanding = pathname === LANDING_PATH;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => isUnder(pathname, prefix));

  // Only the signed-in area redirects. Anything else unrecognised falls
  // through to Next's router, which answers a genuine 404 with
  // app/not-found.tsx instead of a login page.
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Signed in: skip the marketing page and the auth pages entirely. Legal
  // pages stay readable either way.
  if (user && (isAuthPath || isLanding)) {
    return NextResponse.redirect(new URL(APP_HOME, request.url));
  }

  return response;
}

export const config = {
  /*
   * `api` is excluded deliberately, not as an optimization.
   *
   * This proxy decides access from the *cookie* session, which is the
   * right signal for a page request from a browser and the wrong one for
   * an API call. Route handlers authenticate themselves from an
   * `Authorization: Bearer` token (lib/supabase/verify-user.ts), and the
   * cron route from CRON_SECRET — none of which carry cookies. With /api
   * inside the matcher, every one of those got a 307 to /sign-in before
   * its handler ever ran: Vercel Cron could never trigger the expiry
   * sweep, and any non-browser client was answered with a login page
   * instead of JSON.
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
