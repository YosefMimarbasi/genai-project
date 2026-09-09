"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { TextInput } from "@/components/ui/text-input";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.push("/play");
    router.refresh();
  }

  return (
    <>
      <h1 className="display text-[clamp(2rem,7vw,2.75rem)]">Sign in</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <TextInput
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="netid@cornell.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextInput
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" size="lg" full loading={submitting} className="mt-2">
          Sign in
        </Button>
      </form>

      <p className="ui-text mt-8 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-muted-foreground)]">
        New here?{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-[var(--color-primary)] underline underline-offset-2"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
