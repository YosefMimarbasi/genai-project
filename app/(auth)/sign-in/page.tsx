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
      <h1 className="display-sm text-[2.5rem]">Sign in</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <TextInput
          label="Email"
          type="email"
          placeholder="netid@cornell.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-8 pt-5 text-sm text-[var(--color-gray)]">
        New here?{" "}
        <Link href="/sign-up" className="font-bold text-[var(--color-accent)] hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
