import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { ProfileEditor } from "./profile-editor";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already guards every (app) route, but a server render can
  // still race a just-expired session — fail safe rather than crash.
  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_skill_tier")
    .eq("id", user.id)
    .single();

  return (
    <ProfileEditor
      userId={user.id}
      initialSkillTier={(profile?.default_skill_tier as Record<string, number>) ?? {}}
    />
  );
}
