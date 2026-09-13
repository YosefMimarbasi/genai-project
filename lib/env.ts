export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Whether a variable is missing *or* obviously a stand-in.
 *
 * "Set" and "configured" are not the same thing, and conflating them has
 * bitten this project twice. The deployment ran for days with all six
 * variables set to literal `placeholder-...` strings, looking healthy
 * while every signed-in feature returned a 500. And the ready-up
 * concurrency test guarded itself with a plain presence check, so CI —
 * which supplies placeholders to let the build import modules that read
 * env at module scope — convinced it a real Supabase existed and it tried
 * to create users against `https://placeholder.supabase.co`.
 *
 * One predicate, used by both `/api/health` and that test's skip guard,
 * so the two can never drift on what "configured" means.
 */
export function isPlaceholderValue(value: string | undefined): boolean {
  if (!value) return true;
  return /placeholder|changeme|your[-_]|example\.com|^<.*>$/i.test(value);
}

/** True only when every named variable holds a real-looking value. */
export function hasRealEnv(...names: string[]): boolean {
  return names.every((name) => !isPlaceholderValue(process.env[name]));
}
