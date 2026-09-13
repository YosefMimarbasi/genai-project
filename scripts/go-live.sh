#!/usr/bin/env bash
#
# Takes the deployment from "built but unconfigured" to "working".
#
# Everything this does, you could do by hand from the README. It exists
# because the by-hand version is fifteen steps with two traps in it: the
# NEXT_PUBLIC_* pair is compiled into the browser bundle, so setting it
# without rebuilding changes nothing a visitor can see; and Vercel's CLI
# will not overwrite a variable that already exists, so the placeholders
# currently in place have to be removed first, not just re-added.
#
# Secrets are read with `read -rs`, never echoed, never written to the
# shell history, and never passed as command-line arguments (which would
# be visible in the process list). They go to disk only in .env.local,
# which is gitignored, and to Vercel over stdin.
#
# Safe to re-run. Every step is idempotent.
#
# Usage:  bash scripts/go-live.sh

set -euo pipefail

APP_URL="https://cornell-paddle-match.vercel.app"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
warn() { printf '\033[33m%s\033[0m\n' "$1"; }
fail() { printf '\033[31m%s\033[0m\n' "$1" >&2; exit 1; }

cd "$(dirname "$0")/.."

[ -f package.json ] || fail "Run this from the repo (couldn't find package.json)."

bold "Cornell Racket Queue — go live"
echo
echo "From your Supabase project's Settings -> API page:"
echo "  * Project URL       https://<ref>.supabase.co"
echo "  * Publishable key   sb_publishable_...  (older projects: 'anon')"
echo "  * Secret key        sb_secret_...       (older projects: 'service_role')"
echo
echo
echo "And an Anthropic API key from console.anthropic.com."
echo
echo "The Supabase secret key bypasses Row Level Security, so it is"
echo "server-only and never reaches the browser. If you have pasted either"
echo "secret anywhere it does not belong, roll it in the dashboard first"
echo "and use the new value here."
echo
echo "Nothing you type is echoed or logged."
echo

# --- collect -------------------------------------------------------------

read -rp "Supabase Project URL: " SUPABASE_URL_IN
[ -n "$SUPABASE_URL_IN" ] || fail "Project URL is required."
case "$SUPABASE_URL_IN" in
  https://*) ;;
  *) fail "That doesn't look like a URL (expected https://<ref>.supabase.co)." ;;
esac

read -rsp "Supabase publishable (anon) key: " ANON_KEY_IN; echo
[ -n "$ANON_KEY_IN" ] || fail "Publishable key is required."

read -rsp "Supabase secret (service_role) key: " SERVICE_KEY_IN; echo
[ -n "$SERVICE_KEY_IN" ] || fail "Secret key is required."

# The two Supabase keys are easy to transpose, and getting it wrong is not
# a loud failure: the publishable key in the server slot means every
# privileged query quietly returns nothing, while the secret key in the
# public slot ships an RLS bypass to every visitor's browser.
case "$ANON_KEY_IN" in
  sb_secret_*) fail "That's the SECRET key in the publishable slot. Swap them." ;;
esac
case "$SERVICE_KEY_IN" in
  sb_publishable_*) fail "That's the PUBLISHABLE key in the secret slot. Swap them." ;;
esac

read -rsp "Anthropic API key: " ANTHROPIC_KEY_IN; echo
[ -n "$ANTHROPIC_KEY_IN" ] || fail "Anthropic key is required."

# Generated rather than asked for: it is a shared secret between Vercel
# Cron and this app, so it only has to be long and random.
CRON_SECRET_IN="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))')"

# The project ref is the first label of the Supabase hostname.
PROJECT_REF="$(printf '%s' "$SUPABASE_URL_IN" | sed -E 's#^https://([^.]+)\..*#\1#')"
echo
bold "Project ref: $PROJECT_REF"

# Refuse to proceed with the very placeholders this script exists to
# replace — otherwise it would cheerfully "succeed" and change nothing.
for v in "$SUPABASE_URL_IN" "$ANON_KEY_IN" "$SERVICE_KEY_IN" "$ANTHROPIC_KEY_IN"; do
  case "$(printf '%s' "$v" | tr '[:upper:]' '[:lower:]')" in
    *placeholder*|*changeme*|*your-*) fail "That's a placeholder value, not a real one." ;;
  esac
done

# --- 1. local env --------------------------------------------------------

echo
bold "1/5  Writing .env.local"
cat > .env.local <<ENVFILE
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL_IN
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY_IN
SUPABASE_URL=$SUPABASE_URL_IN
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY_IN
ANTHROPIC_API_KEY=$ANTHROPIC_KEY_IN
CRON_SECRET=$CRON_SECRET_IN
ENVFILE
echo "     done (.env.local is gitignored)"

# --- 2. schema -----------------------------------------------------------

echo
bold "2/5  Schema"
echo "     Five migrations: tables, RLS, matching functions, realtime,"
echo "     and the self-healing expiry + schedule function."
echo
echo "     If you already pasted scripts/schema.sql into the Supabase SQL"
echo "     Editor, answer y and this step is skipped."
echo
read -rp "     Schema already applied? [y/N] " SCHEMA_DONE

case "$SCHEMA_DONE" in
  [Yy]*)
    echo "     skipped"
    ;;
  *)
    echo
    echo "     Paste your database connection string:"
    echo "       Supabase -> Settings -> Database -> Connection string -> URI"
    echo "     It looks like postgresql://postgres...@...supabase.com:5432/postgres"
    echo "     and contains your password, so it is not echoed."
    echo
    echo "     Use the SESSION pooler (port 5432), not transaction mode"
    echo "     (6543) — migrations need session-level features that the"
    echo "     transaction pooler does not support."
    echo
    # `supabase link` is deliberately not used: it authenticates against
    # the Supabase management API and fails with
    # LegacyPlatformAuthRequiredError unless you have separately run
    # `supabase login`, which is a browser OAuth round trip. Pushing to a
    # connection string talks to Postgres directly and needs no account
    # login at all.
    read -rsp "     Connection string: " DB_URL_IN; echo
    [ -n "$DB_URL_IN" ] || fail "Connection string is required (or answer y to skip)."

    case "$DB_URL_IN" in
      postgresql://*|postgres://*) ;;
      *) fail "That should start with postgresql://" ;;
    esac
    case "$DB_URL_IN" in
      *:6543/*) warn "     That's the transaction pooler (6543). Migrations usually need 5432." ;;
    esac
    # A literal [YOUR-PASSWORD] is what the dashboard shows before you
    # substitute your own; pushing it would fail with a confusing auth error.
    case "$DB_URL_IN" in
      *'[YOUR-PASSWORD]'*|*'[your-password]'*)
        fail "Replace [YOUR-PASSWORD] in that string with your actual database password." ;;
    esac

    echo
    npx supabase db push --db-url "$DB_URL_IN"
    ;;
esac

# --- 3. vercel env -------------------------------------------------------

echo
bold "3/5  Setting the six variables on Vercel"

set_env() {
  local name="$1" value="$2"
  # Remove first: `vercel env add` will not replace an existing value,
  # and all six currently hold placeholders.
  npx vercel env rm "$name" production --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | npx vercel env add "$name" production >/dev/null
  echo "     set $name"
}

set_env NEXT_PUBLIC_SUPABASE_URL      "$SUPABASE_URL_IN"
set_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON_KEY_IN"
set_env SUPABASE_URL                  "$SUPABASE_URL_IN"
set_env SUPABASE_SERVICE_ROLE_KEY     "$SERVICE_KEY_IN"
set_env ANTHROPIC_API_KEY             "$ANTHROPIC_KEY_IN"
set_env CRON_SECRET                   "$CRON_SECRET_IN"

# --- 4. redeploy ---------------------------------------------------------

echo
bold "4/5  Redeploying"
echo "     Required, not optional: NEXT_PUBLIC_* values are compiled into"
echo "     the browser bundle, so without a rebuild every visitor keeps"
echo "     getting the old ones."
npx vercel deploy --prod --yes

# --- 5. verify -----------------------------------------------------------

echo
bold "5/5  Verifying"
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  BODY="$(curl -fsS "$APP_URL/api/health" 2>/dev/null || true)"
  case "$BODY" in
    *'"ok":true'*)
      echo
      bold "Live. $APP_URL"
      echo "$BODY"
      echo
      echo "Next: sign up with a @cornell.edu address. If the confirmation"
      echo "email never arrives, turn off Supabase Auth -> Providers ->"
      echo "Email -> 'Confirm email' — the built-in SMTP is rate limited to"
      echo "a few messages an hour."
      exit 0
      ;;
  esac
  echo "     not ready yet (attempt $attempt/10)"
  sleep 6
done

echo
warn "Health check still failing. What it says:"
curl -fsS "$APP_URL/api/health" || true
echo
echo "Read it as:"
echo "  unsetOrPlaceholder non-empty -> a variable didn't take; re-run."
echo "  database: unreachable        -> URL or service_role key is wrong."
echo "  schema: missing_functions    -> 'npx supabase db push' didn't apply."
exit 1
