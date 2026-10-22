import type { Metadata } from "next";
import { LegalDoc, LegalList, LegalSection } from "@/components/LegalDoc";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Service — ${site.name}`,
  description:
    "The terms that govern your use of the WatchTower renewal reminder service, including SMS and email reminders.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated={site.effectiveDate}
      intro={`These terms govern your use of ${site.name}. By creating an account or using the service you accept them. If you do not agree, please do not use the service.`}
    >
      <LegalSection heading="1. The agreement">
        <p>
          These terms are between you and {site.legalEntity} (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
          They apply to the hosted service. If you self-host {site.name}, these terms do not apply
          to your deployment — you are the operator responsible for it, and you may use the
          software under the MIT licence in{" "}
          <a
            href={`${site.github}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            the repository
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="2. What the service does">
        <p>
          {site.name} lets you record deadlines — domain renewals, hosting, subscriptions,
          licences, government levies and anything else with a due date — and sends you reminders
          by SMS and email before and after that date. You can adjust how far ahead we warn you,
          how often we repeat an overdue nudge, and who on your account receives them.
        </p>
        <p>
          The service does what you have configured it to do. It does not renew anything for you,
          pay anything for you, file anything for you, or tell you what you are legally required to
          do. It is a reminder tool, not a legal, tax, financial or compliance adviser, and
          nothing in it should be relied on as professional advice.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your account">
        <LegalList
          items={[
            "You must be at least 16 years old and able to enter into a binding contract.",
            "You must give accurate information, and keep it accurate. In particular, if your phone number or email address changes, update it — a reminder that cannot reach you is worthless.",
            "You are responsible for everything done through your account, including anyone you invite to your organisation.",
            "Keep your password to yourself. Tell us promptly if you think someone else has accessed your account.",
            "One person or organisation may not create multiple accounts to work around a limit on a plan, or use the service to send unsolicited bulk messages.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="4. SMS and email reminders">
        <p>
          You can turn SMS and email reminders on and off per organisation, per user, and per
          channel. By enabling a channel you consent to us sending you messages on that channel
          about the deadlines in your account.
        </p>
        <LegalList
          items={[
            "These are service messages about deadlines you asked us to track. They are not marketing, and we do not sell or share your contact details.",
            "Standard carrier rates may apply to SMS messages, and your network provider may filter or delay them. That is outside our control.",
            "You can stop messages at any time by turning the channel off in your settings. Turning off SMS does not stop email, and vice versa.",
            "You must give us a phone number you own or have permission to use. Sending reminders to someone who has not consented is not allowed.",
            "We may suspend a channel that is being used to harass, spam, or to send to a number that has complained.",
          ]}
        />
        <p>
          Where local law requires it, you can reply STOP to an SMS to opt out. Replies are
          handled on a best-effort basis and do not reach a person.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "Use the service to send messages that are unlawful, misleading, or that target someone who has not consented.",
            "Reverse engineer, attack, overload or attempt to gain unauthorised access to the service, or interfere with another user&rsquo;s use of it.",
            "Use automated means to create accounts or to scrape the service.",
            "Resell or redistribute the hosted service without our written permission.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="6. Availability and dependencies">
        <p>
          We depend on third parties to deliver messages: our SMS providers, our email provider
          and our hosting provider. They do not answer to us, and their failures can delay or
          prevent a reminder from reaching you. We do our best to work around that, and we will
          show a failed send in your reminder history, but we cannot guarantee delivery of any
          message.
        </p>
        <p>
          We aim to keep the service available, but we do not guarantee uninterrupted operation.
          We may change or remove features. We will try to give reasonable notice before a change
          that materially reduces what the service does.
        </p>
      </LegalSection>

      <LegalSection heading="7. Your content stays yours">
        <p>
          The deadlines, notes and categories you record remain yours. You grant us only the
          narrow licence needed to host that content, display it back to you, and build the
          reminders we send you from it. We do not claim ownership of your data and we do not
          use it to train models or to advertise to you.
        </p>
      </LegalSection>

      <LegalSection heading="8. Our licence to you">
        <p>
          The {site.name} source code is released under the {site.license} licence. We grant you
          a worldwide, royalty-free, non-exclusive licence to use, copy, modify and run the
          software, including commercially and in self-hosted deployments. If you run a modified
          version as a hosted service for others, you must keep this notice and the licence
          header in the source.
        </p>
      </LegalSection>

      <LegalSection heading="9. No warranty">
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
          warranties of any kind, express or implied, including fitness for a particular purpose,
          merchantability and non-infringement. We do not warrant that a reminder will be sent, that
          it will reach you, or that it will arrive in time for you to act.
        </p>
        <p>
          This matters: a missed renewal can have real consequences. Treat WatchTower as a
          helpful second pair of eyes, not as your only one. Check anything important independently.
        </p>
      </LegalSection>

      <LegalSection heading="10. Limitation of liability">
        <p>
          To the fullest extent permitted by law, we are not liable for indirect or consequential
          loss, or for lost profits, lost data, business interruption, or the consequences of a
          reminder that did not arrive, was late, or was wrong. Our total liability to you for
          any claim arising out of the service is limited to the greater of the amount you paid
          us in the twelve months before the claim, or 100 USD.
        </p>
        <p>
          Nothing in these terms excludes liability that cannot lawfully be excluded, including
          for fraud or for death or personal injury caused by negligence.
        </p>
      </LegalSection>

      <LegalSection heading="11. Indemnity">
        <p>
          You agree to indemnify us against claims, damages and reasonable costs arising from
          your use of the service, your content, or your breach of these terms or applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="12. Suspension and termination">
        <p>
          You can close your account at any time by emailing us. Closing your account deletes your
          organisations, deadlines, reminder settings and reminder history, as described in the{" "}
          <a href="/legal/privacy" className="font-medium text-slate-900 underline underline-offset-2">
            Privacy Policy
          </a>
          .
        </p>
        <p>
          We may suspend or close an account if you breach these terms, if your use puts the
          service or another user at risk, or if we are required to by law. Where we can, we will
          tell you why and give you a chance to fix it first.
        </p>
      </LegalSection>

      <LegalSection heading="13. Changes to these terms">
        <p>
          We may update these terms. The date at the top of this page shows when they last
          changed. If a change materially affects your rights we will tell you by email or in the
          app before it takes effect. Continuing to use the service after that means you accept
          the updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="14. Governing law">
        <p>
          These terms are governed by the laws of the {site.jurisdiction}, and the courts of that
          jurisdiction have exclusive jurisdiction over any dispute, without affecting any
          mandatory consumer protections available to you where you live.
        </p>
      </LegalSection>

      <LegalSection heading="15. Contact">
        <p>
          Questions about these terms go to{" "}
          <a
            href={`mailto:${site.contactEmail}`}
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            {site.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
