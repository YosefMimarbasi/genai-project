import type { Metadata } from "next";
import { LegalPage, Section, List, ContactEmail } from "../legal-prose";

export const metadata: Metadata = {
  title: "Accessibility | Cornell Racket Queue",
  description: "How Cornell Racket Queue approaches accessibility, and how to report a problem.",
};

/*
 * Only claims things this codebase actually does. WCAG 2.1 AA is named as
 * the target, not as an achieved certification, because no audit has been
 * run — claiming conformance without testing is the kind of statement that
 * creates liability rather than reducing it.
 */
export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility" updated="September 2026">
      <Section heading="What we aim for">
        <p>
          We build against WCAG 2.1 Level AA. We have not had an independent audit, so treat this
          as a statement of intent and current practice rather than a claim of full conformance.
        </p>
      </Section>

      <Section heading="What is in place today">
        <List
          items={[
 "Every control can be reached and operated with a keyboard, and the focused element is always visibly outlined.",
 "Form fields have real labels, and errors are announced rather than shown only as colour.",
 "Colour is never the only way information is conveyed. A tier you have saved and a tier merely suggested differ in fill, not just in shade.",
 "If your system asks for reduced motion, movement is removed and only gentle fades remain.",
 "Text reflows down to small screens without a horizontal scrollbar, and respects your browser's text size.",
 "Court diagrams are decorative and hidden from screen readers; the same information is given as text next to them.",
          ]}
        />
      </Section>

      <Section heading="Known gaps">
        <List
          items={[
 "No screen reader testing has been done on the live matching flow.",
 "The 90-second window to accept a match is a fixed time limit and cannot currently be extended.",
 "Colour contrast has been designed carefully but not measured across every state.",
          ]}
        />
      </Section>

      <Section heading="Telling us about a problem">
        <p>
          If something here blocks you, email <ContactEmail /> and describe what you
          were trying to do and what got in the way. We will reply and tell you what we can fix and
          when. If you need something the app cannot currently do, say so and we will find another
          way to get it done.
        </p>
      </Section>
    </LegalPage>
  );
}
