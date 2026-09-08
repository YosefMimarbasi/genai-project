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
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Client-side format nudge only — the real restriction is enforced
    // server-side by the auth.users trigger (see feature/schema-rls), so a
    // bypassed client check still gets rejected there.
    if (!CORNELL_EMAIL.test(email)) {
      setEmailError("Use your @cornell.edu email");
      return;
    }
    setEmailError(undefined);

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
      <h1 className="display-sm text-[2.5rem]">Create an account</h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.5] text-[var(--color-gray)]">
        Open to Cornell students. You'll need your NetID address.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <TextInput
          label="Email"
          type="email"
          placeholder="netid@cornell.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          hint="Your NetID address, e.g. abc123@cornell.edu."
          required
        />
        <TextInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          hint="At least 8 characters."
          required
        />
        <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
          Sign up
        </Button>

        {/* Linked at the point of collection, not only from the footer. */}
        <p className="text-xs leading-[1.6] text-[var(--color-gray)]">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="font-bold text-[var(--color-accent)] hover:underline">
            Terms of Use
          </Link>{" "}
          and the{" "}
          <Link href="/privacy" className="font-bold text-[var(--color-accent)] hover:underline">
            Privacy Policy
          </Link>
          . This app arranges games with other students in person. Read the safety section of the
          terms before your first match.
        </p>
      </form>

      <p className="mt-8 border-t border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] pt-5 text-sm text-[var(--color-gray)]">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-bold text-[var(--color-accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
