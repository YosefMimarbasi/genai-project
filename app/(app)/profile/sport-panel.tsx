"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiFetchJson, ApiError } from "@/lib/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { CourtDiagram, courtDimensions } from "@/components/court-diagram";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TierSelector } from "./tier-selector";
import type { Sport } from "@/lib/sports";

interface SkillNormalizeResponse {
  saved: boolean;
  requiresManualTier: boolean;
  suggestion: { tier: number; confidence: number; rationale: string };
}

interface SportPanelProps {
  sport: Sport;
  userId: string;
  savedTiers: Record<string, number>;
  initialTier: number | null;
  onSaved: (sport: string, tier: number) => void;
}

export function SportPanel({
  sport,
  userId,
  savedTiers,
  initialTier,
  onSaved,
}: SportPanelProps) {
  const [experience, setExperience] = useState("");
  const [rationale, setRationale] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(initialTier);
  const [lastSavedTier, setLastSavedTier] = useState<number | null>(initialTier);
  const [gettingSuggestion, setGettingSuggestion] = useState(false);
  const [saving, setSaving] = useState(false);

  const confirmed = selectedTier !== null && selectedTier === lastSavedTier;
  const hasUnsavedChange = selectedTier !== null && selectedTier !== lastSavedTier;

  async function handleGetSuggestion() {
    if (!experience.trim()) {
      toast.error("Describe how you play first. A sentence or two is plenty.");
      return;
    }

    setGettingSuggestion(true);
    setRationale(null);
    try {
      const response = await apiFetchJson<SkillNormalizeResponse>(
 "/api/onboarding/skill-normalize",
        {
          method: "POST",
          body: JSON.stringify({ sport, experienceDescription: experience }),
        }
      );

      setSelectedTier(response.suggestion.tier);
      setRationale(response.suggestion.rationale);

      if (response.saved) {
        // The route already wrote this to profiles — nothing left to save.
        setLastSavedTier(response.suggestion.tier);
        onSaved(sport, response.suggestion.tier);
      } else {
        toast.message("Not confident enough to save automatically. Take a look.", {
          description: response.suggestion.rationale,
        });
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't get a suggestion. Try again.");
    } finally {
      setGettingSuggestion(false);
    }
  }

  async function handleSaveTier() {
    if (selectedTier === null) return;

    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        default_skill_tier: { ...savedTiers, [sport]: selectedTier },
      })
      .eq("id", userId);
    setSaving(false);

    if (error) {
      toast.error("Couldn't save that tier. Try again.");
      return;
    }

    setLastSavedTier(selectedTier);
    onSaved(sport, selectedTier);
    toast.success(`${sport} saved at tier ${selectedTier}.`);
  }

  return (
    <div className="surface mt-10 p-6 sm:p-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div>
          <h2 className="title text-2xl">{sport}</h2>
          <p className="mt-2 max-w-[48ch] text-[var(--color-muted-foreground)]">
            A sentence or two about how you play is enough. Mention matches, leagues, or just how
            long you've played.
          </p>

          <div className="mt-6">
            <Textarea
              label="How you play"
              placeholder={`e.g. "Played JV in high school, still play a few times a month."`}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
              hint="This is sent to an AI model to suggest a tier. Nothing is saved without your confirmation."
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button variant="secondary" onClick={handleGetSuggestion} loading={gettingSuggestion}>
              Get a tier suggestion
            </Button>
            {rationale ? (
              <p className="ui-text max-w-[36ch] text-xs text-[var(--color-muted-foreground)]">{rationale}</p>
            ) : null}
          </div>

          <div className="mt-8 border-t border-[var(--color-border)] pt-6">
            <p className="ui-text mb-3 text-sm font-semibold">
              {confirmed ? "Saved tier" : "Your tier"}
            </p>
            <TierSelector value={selectedTier} onChange={setSelectedTier} confirmed={confirmed} />
          </div>

          {hasUnsavedChange ? (
            <Button className="mt-6" onClick={handleSaveTier} loading={saving}>
              Save tier
            </Button>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <p className="eyebrow tnum text-[var(--color-muted-foreground)]">{courtDimensions(sport)}</p>
          <CourtDiagram
            sport={sport}
            className="mt-4 w-full text-[var(--color-border-strong)]"
          />
        </aside>
      </div>
    </div>
  );
}
