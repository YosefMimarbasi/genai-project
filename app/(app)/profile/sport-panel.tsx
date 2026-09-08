"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiFetchJson, ApiError } from "@/lib/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Card } from "@/components/ui/card";
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

export function SportPanel({ sport, userId, savedTiers, initialTier, onSaved }: SportPanelProps) {
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
      toast.error("Describe how you play first — a sentence or two is plenty.");
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
        toast.message("Not confident enough to save automatically — take a look.", {
          description: response.suggestion.rationale,
        });
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't get a suggestion — try again.");
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
      toast.error("Couldn't save that tier — try again.");
      return;
    }

    setLastSavedTier(selectedTier);
    onSaved(sport, selectedTier);
    toast.success(`${sport} saved at tier ${selectedTier}.`);
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-medium">{sport}</h2>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">
          A sentence or two about how you play is enough — mention matches, leagues, or just how
          long you've played.
        </p>
      </div>

      <Textarea
        placeholder={`e.g. "Played JV in high school, still play a few times a month."`}
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        rows={3}
      />

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleGetSuggestion}
          loading={gettingSuggestion}
        >
          Get a tier suggestion
        </Button>
        {rationale ? <p className="text-xs text-[var(--color-muted)]">{rationale}</p> : null}
      </div>

      <div className="border-t border-[var(--color-border)] pt-4">
        <p className="mb-2 text-sm font-medium">
          {confirmed ? "Saved tier" : "Your tier"}
        </p>
        <TierSelector value={selectedTier} onChange={setSelectedTier} confirmed={confirmed} />
      </div>

      {hasUnsavedChange ? (
        <Button size="sm" onClick={handleSaveTier} loading={saving} className="self-start">
          Save tier
        </Button>
      ) : null}
    </Card>
  );
}
