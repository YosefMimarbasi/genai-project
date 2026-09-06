"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Card } from "@/components/ui/card";
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
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-semibold">Create an account</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Cornell students only — use your @cornell.edu email.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <TextInput
            label="Email"
            type="email"
            placeholder="you@cornell.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            required
          />
          <TextInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <Button type="submit" loading={submitting} className="mt-1">
            Sign up
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[var(--color-accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
