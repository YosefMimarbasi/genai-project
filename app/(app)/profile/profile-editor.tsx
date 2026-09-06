"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { SPORTS, type Sport } from "@/lib/sports";
import { Select } from "@/components/ui/select";
import { SportPanel } from "./sport-panel";

interface ProfileEditorProps {
  userId: string;
  initialSkillTier: Record<string, number>;
}

export function ProfileEditor({ userId, initialSkillTier }: ProfileEditorProps) {
  const [skillTier, setSkillTier] = useState(initialSkillTier);
  const [activeSport, setActiveSport] = useState<Sport | null>(null);

  const addedSports = Object.keys(skillTier) as Sport[];
  const availableSports = SPORTS.filter((sport) => !addedSports.includes(sport));

  function handleSaved(sport: string, tier: number) {
    setSkillTier((prev) => ({ ...prev, [sport]: tier }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">What do you play?</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Add the sports you play so we can match you with someone at your level.
        </p>
      </div>

      {addedSports.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {addedSports.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setActiveSport(sport)}
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm",
                "transition-[border-color,background-color] duration-150 ease-[var(--ease-out-strong)]",
                "active:scale-[0.97]",
                activeSport === sport
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-foreground)]/30"
              )}
            >
              {sport}
              <span className="font-mono text-xs text-[var(--color-muted)]">
                T{skillTier[sport]}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {availableSports.length > 0 ? (
        <Select
          label={addedSports.length === 0 ? "Add your first sport" : "Add another sport"}
          placeholder="Choose a sport"
          options={availableSports.map((sport) => ({ value: sport, label: sport }))}
          value={null}
          onValueChange={(value) => setActiveSport(value as Sport)}
          className="max-w-xs"
        />
      ) : null}

      {activeSport ? (
        <SportPanel
          key={activeSport}
          sport={activeSport}
          userId={userId}
          savedTiers={skillTier}
          initialTier={skillTier[activeSport] ?? null}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
