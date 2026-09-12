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
    <section>
      <h1 className="display text-[clamp(2.25rem,7vw,4rem)]">What do you play?</h1>
      <p className="mt-4 max-w-[48ch] text-lg text-[var(--color-muted-foreground)]">
        Add the sports you play so we can match you with someone at your level.
      </p>

      <div className="mt-10">
        {addedSports.length > 0 ? (
          <div
            role="group"
            aria-label="Your sports"
            className="mb-8 flex flex-wrap gap-2"
          >
            {addedSports.map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => setActiveSport(sport)}
                aria-pressed={activeSport === sport}
                className={cn(
                  "ui-text flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)]",
                  "border-2 px-4 text-sm font-semibold",
                  "transition-[transform,background-color,border-color,color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)]",
                  "active:scale-[0.97]",
                  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-ring)]",
                  activeSport === sport
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[inset_3px_3px_7px_var(--neu-dark),inset_-3px_-3px_7px_var(--neu-light)]"
                    : "border-[var(--color-border-strong)] bg-[var(--color-card)] shadow-[3px_3px_7px_var(--neu-dark),-3px_-3px_7px_var(--neu-light)] hover:border-[var(--color-foreground)]"
                )}
              >
                {sport}
                <span className="tnum text-xs opacity-70">T{skillTier[sport]}</span>
              </button>
            ))}
          </div>
        ) : (
          /* §8 empty-states — say what to do, don't just show a bare select. */
          <p className="mb-8 max-w-[46ch] text-[var(--color-muted-foreground)]">
            You haven't added a sport yet. Pick one below and tell us how you play.
          </p>
        )}

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
