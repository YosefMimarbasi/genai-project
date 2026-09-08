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
    <section className="py-6">
      <h1 className="display -ml-[0.045em] text-[clamp(2.75rem,8vw,6rem)]">
        What do
        <br />
        you play?
      </h1>
      <p className="mt-8 max-w-[42ch] text-[1.0625rem] leading-[1.5] text-[var(--color-gray)]">
        Add the sports you play so we can match you with someone at your level.
      </p>

      <div className="mt-12 border-t border-[color-mix(in_oklab,var(--color-rule)_18%,transparent)] pt-8">
        {addedSports.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {addedSports.map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => setActiveSport(sport)}
                aria-pressed={activeSport === sport}
                className={cn(
                  "flex items-center gap-2 border px-4 py-2 text-sm font-bold",
                  "transition-[transform,background-color,border-color,color] duration-[160ms] ease-[var(--ease-out-strong)]",
                  "active:scale-[0.97]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
                  activeSport === sport
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-ground)]"
                    : "border-[color-mix(in_oklab,var(--color-rule)_25%,transparent)] hover:border-[var(--color-ink)]"
                )}
              >
                {sport}
                <span className="text-xs opacity-70">T{skillTier[sport]}</span>
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
    </section>
  );
}
