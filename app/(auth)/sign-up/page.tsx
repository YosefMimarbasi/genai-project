"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { TextInput } from "@/components/ui/text-input";
import { Button } from "@/components/ui/button";

const CORNELL_EMAIL = /^[^\s@]+@cornell\.edu$/i;

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // §8 inline-validation — validate on blur, not on every keystroke, so
  // the user isn't told they're wrong while still typing.
  function validateEmail(value: string) {
    if (!CORNELL_EMAIL.test(value)) {
      setEmailError("Use your Cornell address, ending in @cornell.edu");
      return false;
    }
    setEmailError(undefined);
    return true;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Client-side format nudge only — the real restriction is enforced
    // server-side by the auth.users trigger, so a bypassed check still
    // gets rejected there.
    setTouched(true);
    if (!validateEmail(email)) {
      // §8 focus-management — send focus to the field that failed.
      document.getElementById("signup-email")?.focus();
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Check your email to confirm your account.");
    router.push("/sign-in");
  }

  return (
    <>
      <h1 className="display text-[clamp(2rem,7vw,2.75rem)]">Create an account</h1>
      <p className="mt-3 text-[var(--color-muted-foreground)]">
        Open to Cornell students. You'll need your NetID address.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <TextInput
          id="signup-email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="netid@cornell.edu"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched) validateEmail(e.target.value);
          }}
          onBlur={(e) => {
            setTouched(true);
            validateEmail(e.currentTarget.value);
          }}
          error={emailError}
          hint="Your NetID address, e.g. abc123@cornell.edu"
          required
        />
        <TextInput
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          hint="At least 8 characters."
          required
        />

        <Button type="submit" size="lg" full loading={submitting} className="mt-2">
          Sign up
        </Button>

        {/* Linked at the point of collection, not only from the footer. */}
        <p className="ui-text text-xs leading-relaxed text-[var(--color-muted-foreground)]">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="font-semibold text-[var(--color-primary)] underline underline-offset-2">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-[var(--color-primary)] underline underline-offset-2">
            Privacy Policy
          </Link>
          . This app arranges games with other students in person, so read the safety section of
          the terms before your first match.
        </p>
      </form>

      <p className="ui-text mt-8 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-muted-foreground)]">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-[var(--color-primary)] underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
