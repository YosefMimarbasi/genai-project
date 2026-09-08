import type { Metadata } from "next";
import { LegalPage, Section, List, Fill } from "../legal-prose";

export const metadata: Metadata = {
  title: "Terms of Use | Cornell Racket Queue",
  description: "The rules for using Cornell Racket Queue.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="September 2026">
      <Section heading="What this is">
        <p>
          Cornell Racket Queue introduces Cornell students who want to play a racket sport at the
          same time, at a similar level, at a court they can both get to. It is an independent
          student project run by <Fill>[operator name]</Fill>, not affiliated with, endorsed by, or
          sponsored by Cornell University.
        </p>
        <p>By creating an account you agree to what follows.</p>
      </Section>

      <Section heading="Who can use it">
        <p>
          You need a current Cornell email address, and the account has to be yours. Do not share
          it, and do not create one for someone else.
        </p>
      </Section>

      <Section heading="Meeting people in person">
        <p>
          This app arranges for you to meet someone you may not know, in person. We do not run
          background checks and we do not verify anything about another student beyond their
          Cornell email address.
        </p>
        <List
          items={[
            "Play at the public courts listed in the app, during the hours they are open.",
            "Tell someone you trust where you are going and who you are meeting.",
            "You are free to leave at any point, for any reason, without explaining yourself.",
            <>
              If someone makes you feel unsafe, stop and report it to us at{" "}
              <Fill>[contact email]</Fill>. In an emergency call 911, or Cornell Police at{" "}
              <Fill>[campus emergency number]</Fill>.
            </>,
          ]}
        />
      </Section>

      <Section heading="How to behave">
        <p>Do not use this app to harass, threaten, impersonate, or spam anyone. Specifically:</p>
        <List
          items={[
            "Do not send abusive, harassing, or sexual messages.",
            "Do not use the app to advertise, recruit, or sell anything.",
            "Do not repeatedly accept matches you have no intention of showing up for.",
            "Do not attempt to access another student's account or data.",
          ]}
        />
        <p>
          We can suspend or remove an account that does any of this, and we do not have to warn you
          first.
        </p>
      </Section>

      <Section heading="Court availability">
        <p>
          Court hours and access rules shown in the app come from Cornell Recreational Services and
          from residence halls, and they change. Physical education classes and intramural
          programming take priority over open recreation, so a court can be unavailable with no
          notice. Check before you travel. Some game rooms are open only to residents of that
          building or to a guest they let in.
        </p>
      </Section>

      <Section heading="What we do not promise">
        <p>
          The app is provided as it is. We do not promise you will be matched, that anyone will
          show up, that a court will be free, or that the service will be available at any given
          moment. To the fullest extent the law allows, we are not liable for what happens between
          you and another student, or for anything that happens at a court.
        </p>
      </Section>

      <Section heading="Closing your account">
        <p>
          You can stop using the app at any time and ask us to delete your account at{" "}
          <Fill>[contact email]</Fill>. See the privacy policy for what deletion covers.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          If these terms change we will update the date above. Continuing to use the app after that
          means you accept the new version.
        </p>
      </Section>
    </LegalPage>
  );
}
