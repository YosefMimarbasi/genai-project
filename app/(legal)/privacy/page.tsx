import type { Metadata } from "next";
import { LegalPage, Section, List, Fill } from "../legal-prose";

export const metadata: Metadata = {
  title: "Privacy Policy | Cornell Racket Queue",
  description: "What Cornell Racket Queue collects, why, and who it is shared with.",
};

/*
 * Every data flow described here is read off this codebase, not invented:
 * Supabase Auth holds the account, `profiles` holds sports and tiers,
 * `queue_entries` holds a ready-up, `messages` holds chat, and two routes
 * (/api/onboarding/skill-normalize and /api/matches/[matchId]/messages)
 * send text to Anthropic. Keep this in sync when those change.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <Section heading="Who runs this">
        <p>
          Cornell Racket Queue is an independent student project operated by{" "}
          <Fill>[operator name]</Fill>. It is not affiliated with, endorsed by, or sponsored by
          Cornell University. Questions about this policy go to <Fill>[contact email]</Fill>.
        </p>
      </Section>

      <Section heading="What we collect">
        <List
          items={[
            <>
              <strong>Your account.</strong> Your Cornell email address and a password, handled by
              our authentication provider. We never see your password.
            </>,
            <>
              <strong>Your profile.</strong> The racket sports you play and your skill tier (1 to
              5) for each.
            </>,
            <>
              <strong>Your ready-ups.</strong> Each time you join the queue: the sport, your tier,
              the time window you are free, the courts you picked, and whether you chose casual or
              competitive.
            </>,
            <>
              <strong>Your matches and messages.</strong> Who you matched with, the time and place
              you agreed on, and the messages you send in a confirmed match.
            </>,
            <>
              <strong>What you write about your play.</strong> The free-text description you give
              when asking for a tier suggestion.
            </>,
          ]}
        />
      </Section>

      <Section heading="Why we collect it">
        <p>
          To match you with another student at a similar level who is free when you are and will
          play where you will, and to let the two of you agree on a time and place. We do not sell
          your data, and we do not use it for advertising.
        </p>
      </Section>

      <Section heading="Who else sees it">
        <List
          items={[
            <>
              <strong>Other students.</strong> When you are matched, that person can see the
              details of the match and the messages you send them. Your email address is not shown
              to them.
            </>,
            <>
              <strong>Supabase</strong> hosts the database and handles sign-in.
            </>,
            <>
              <strong>Vercel</strong> hosts and serves the site.
            </>,
            <>
              <strong>Anthropic</strong> processes two specific pieces of text: the description you
              write when you ask for a tier suggestion, and a chat message that looks like it is
              proposing a time or place, so the app can offer to fill in the details. Nothing else
              you write is sent there.
            </>,
          ]}
        />
      </Section>

      <Section heading="Cookies">
        <p>
          We set only the cookies needed to keep you signed in. There are no advertising or
          analytics cookies, so there is nothing to opt out of.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <p>
          Queue entries are short-lived and expire on their own. Your profile, matches and messages
          are kept while your account exists. Ask us to delete your account at{" "}
          <Fill>[contact email]</Fill> and we will remove your profile, queue history and messages.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can view and change your sports and tiers at any time on your profile, stop using the
          queue whenever you like, and ask for your data to be deleted. Depending on where you
          live, you may also have a right to a copy of your data or to object to how it is used.
          Write to <Fill>[contact email]</Fill> and we will respond.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          If this policy changes in a way that affects you, we will update the date above and, for
          significant changes, tell you in the app.
        </p>
      </Section>
    </LegalPage>
  );
}
