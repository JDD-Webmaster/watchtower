import type { Metadata } from "next";
import { LegalDoc, LegalList, LegalSection } from "@/components/LegalDoc";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${site.name}`,
  description:
    "How WatchTower collects, uses, stores and shares your personal data, and the rights you have over it.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated={site.effectiveDate}
      intro={`This policy explains what ${site.name} collects, why we collect it, who else touches it, and what you can ask us to do with it. It covers the hosted service and the self-hosted edition — in the self-hosted edition, the operator of the server is the controller and this policy does not apply to them.`}
    >
      <LegalSection heading="1. Who we are">
        <p>
          {site.name} is operated by {site.legalEntity} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). We
          are the data controller for the personal data described in this policy. If you have a
          question about this policy or want to exercise any of the rights in section 7, contact
          us at{" "}
          <a
            href={`mailto:${site.contactEmail}`}
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            {site.contactEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="2. What we collect">
        <p>We collect only what the service needs to do its job:</p>
        <LegalList
          items={[
            "Account details: your name, email address, and a securely hashed password. Phone number and country code are optional and only needed if you want SMS reminders.",
            "Organisation details: the name of each organisation (workspace) you create, its generated identifier, and its timezone.",
            "Deadline records: the name, category, due date, recurrence and status of everything you track, plus any notes you write. These are yours — we do not read them beyond what is needed to render a reminder.",
            "Reminder settings: the offsets (for example 30, 14, 7 and 1 days before the due date) and how often an overdue reminder repeats.",
            "Reminder history: a log of each message we attempted to send — the channel, the time, whether it succeeded, the recipient, and the text of the message itself.",
            "Technical data: session and CSRF cookies required to keep you signed in, and server logs containing IP addresses and request timestamps.",
          ]}
        />
        <p>
          We do not collect payment card details, we do not run third-party advertising or
          tracking scripts, and we do not sell your data to anyone.
        </p>
      </LegalSection>

      <LegalSection heading="3. Why we use it, and on what basis">
        <LegalList
          items={[
            "To create and secure your account, keep you signed in, and let you change your details (necessary to perform our contract with you).",
            "To send the reminders you asked for, by the channels you enabled (necessary to perform our contract with you).",
            "To keep a history of what was sent and whether it was delivered, so you and we can diagnose a missed or failed reminder (legitimate interests, and your consent where you have asked for a specific reminder).",
            "To send you service messages about changes to the service (legitimate interests — you can opt out of anything that is not strictly about your reminders).",
            "To detect abuse and keep the service secure and available (legitimate interests, and our legal obligation to protect the system and its users).",
          ]}
        />
        <p>
          For users in Nigeria, the Nigeria Data Protection Act 2023 applies. For users elsewhere,
          we rely on the equivalent bases under their local law. You can withdraw consent for
          marketing or non-essential messages at any time, and the reminders you have explicitly
          asked for will continue until you turn them off in your settings.
        </p>
      </LegalSection>

      <LegalSection heading="4. Who else sees your data">
        <p>
          We use a small number of processors, and only the ones needed for the feature you use:
        </p>
        <LegalList
          items={[
            "SMS providers — Kudi and Termii — receive your phone number and the text of each SMS reminder so it can be delivered. Your number and message content are passed to them.",
            "Our email delivery provider receives your email address and the content of each email reminder. We use a transactional mail service for this.",
            "Our hosting provider stores the database and application files, and processes the requests needed to run the service.",
            "GitHub, if you open an issue or pull request in the public repository. Anything you post there is public.",
          ]}
        />
        <p>
          If you self-host {site.name}, your data stays on your infrastructure and none of the
          above applies — your own mail and SMS providers are the ones to look at.
        </p>
      </LegalSection>

      <LegalSection heading="5. How long we keep it">
        <p>
          We keep your account and its data for as long as your account is active, and for as long
          afterwards as we need to keep it for legitimate purposes — mainly to resolve a
          complaint, enforce our terms, or comply with a legal obligation. Reminder history is
          deleted along with the rest of your data when your account is closed.
        </p>
      </LegalSection>

      <LegalSection heading="6. How we protect it">
        <LegalList
          items={[
            "Passwords are hashed with bcrypt and are never stored or logged in plain text.",
            "Sessions use HTTP-only, secure cookies with CSRF protection on every state-changing request.",
            "All traffic is served over HTTPS.",
            "Authorisation is enforced server-side on every request that touches your data — one organisation can never read another's deadlines.",
            "Access to production systems is limited to the people who operate the service.",
          ]}
        />
        <p>
          No system is perfectly secure. If a breach affects your data and is likely to cause you
          harm, we will tell you and tell the relevant regulator as required by law.
        </p>
      </LegalSection>

      <LegalSection heading="7. Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, delete, restrict
          or port your personal data, and to object to or withdraw consent for certain uses.
        </p>
        <LegalList
          items={[
            "Access and correction — your dashboard shows everything we hold about your deadlines and settings, and you can edit your name, phone number, country and notification preferences at any time.",
            "Deletion — email us and we will close your account and delete your organisations, deadlines, reminder settings and reminder history.",
            "Portability — email us and we will send you a machine-readable copy of your data as a JSON file.",
            "Objection and consent withdrawal — turn off SMS or email reminders in your settings, or email us to object to a particular use.",
          ]}
        />
        <p>
          We respond to verified requests within 30 days. We may ask you to confirm your identity
          first, and we do not charge for this.
        </p>
      </LegalSection>

      <LegalSection heading="8. Cookies">
        <LegalList
          items={[
            "A session cookie, so you stay signed in between requests.",
            "An XSRF token cookie, which the browser sends back with each request to prove the request came from your browser and not a third-party site.",
          ]}
        />
        <p>
          We set no advertising, analytics or cross-site tracking cookies. Because the service
          relies on these two cookies to function, they cannot be turned off without breaking
          sign-in.
        </p>
      </LegalSection>

      <LegalSection heading="9. Children">
        <p>
          {site.name} is a business tool and is not directed at children. We do not knowingly
          collect data from anyone under 16. If you believe a child has created an account,
          contact us and we will remove it.
        </p>
      </LegalSection>

      <LegalSection heading="10. International transfers">
        <p>
          Our processors may process data outside your country, including in the United States
          and the European Economic Area, under standard contractual safeguards. If you are in
          the EEA or UK, you can ask us for details of the transfer mechanism used.
        </p>
      </LegalSection>

      <LegalSection heading="11. Changes to this policy">
        <p>
          When we change this policy we will update the date at the top of this page. If a change
          materially affects how we use your data, we will tell you by email or in the app before
          it takes effect.
        </p>
      </LegalSection>

      <LegalSection heading="12. Contact">
        <p>
          Questions, requests and complaints all go to the same place:{" "}
          <a
            href={`mailto:${site.contactEmail}`}
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            {site.contactEmail}
          </a>
          . You can also reach us through the{" "}
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            project repository
          </a>
          . Our data controller is {site.legalEntity}, subject to the laws of the{" "}
          {site.jurisdiction}.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
