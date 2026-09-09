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
      <h1 className="display -ml-[0.03em] text-[clamp(2.75rem,8vw,6rem)]">
        What do
        <br />
        you play?
      </h1>
      <p className="mt-8 max-w-[42ch] text-[1.0625rem] leading-[1.5] text-[var(--color-muted-foreground)]">
        Add the sports you play so we can match you with someone at your level.
      </p>

      <div className="mt-12 pt-8">
        {addedSports.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {addedSports.map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => setActiveSport(sport)}
                aria-pressed={activeSport === sport}
                className={cn(
 "flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold",
 "transition-[transform,box-shadow,background-color,color] duration-[160ms] ease-[var(--ease-out)]",
 "active:scale-[0.98]",
 "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-primary)]",
                  activeSport === sport
                    ? "bg-[var(--color-primary)] text-white "
                    : "surface hover:text-[var(--color-primary)]"
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
