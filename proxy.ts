import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Auth pages — a signed-in user has no reason to be here. */
const AUTH_PATHS = ["/sign-in", "/sign-up"];

/** The public marketing page. Exact match: "/" is a prefix of everything. */
const LANDING_PATH = "/";

/**
 * Readable without an account. The privacy policy in particular has to be
 * reachable *before* someone hands over an email address.
 */
const PUBLIC_PATHS = ["/privacy", "/terms", "/accessibility"];

/** Where a signed-in user lands. */
const APP_HOME = "/play";

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
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  const isLanding = pathname === LANDING_PATH;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!user && !isAuthPath && !isLanding && !isPublic) {
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
