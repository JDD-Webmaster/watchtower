import type { Metadata } from "next";
import { LegalDoc, LegalList, LegalSection } from "@/components/LegalDoc";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact & data requests — ${site.name}`,
  description:
    "Get in touch with the WatchTower team, or exercise your rights to access, export or delete your personal data.",
  alternates: { canonical: "/legal/contact" },
};

export default function ContactPage() {
  return (
    <LegalDoc
      title="Contact & data requests"
      updated={site.effectiveDate}
      intro={`Everything — questions, bug reports, privacy requests — comes to ${site.contactEmail}. There is no support portal and no ticket queue; you will get a reply from a person.`}
    >
      <LegalSection heading="Send us a message">
        <ContactForm email={site.contactEmail} />
      </LegalSection>

      <LegalSection heading="Data requests">
        <p>
          If you want to see, export or delete your data, use the form above and pick the
          matching subject. We will ask you to confirm the email address on the account before
          we act, so that nobody else can delete your data by guessing.
        </p>
        <LegalList
          items={[
            "Access my data — we send you everything we hold about your account as a JSON file.",
            "Export my data — the same JSON file, in a format you can load into a spreadsheet or another tool.",
            "Delete my account — we close the account and delete your organisations, deadlines, reminder settings and reminder history.",
          ]}
        />
        <p>
          We respond to verified requests within 30 days, and usually much sooner. We do not
          charge for this.
        </p>
      </LegalSection>

      <LegalSection heading="Security disclosures">
        <p>
          If you have found a vulnerability in the hosted service, email us with the subject
          &ldquo;Security disclosure&rdquo; and a description of what you found and how to
          reproduce it. Please give us a reasonable window to fix it before you disclose it
          publicly, and do not access data that is not yours while you are testing.
        </p>
        <p>
          We will acknowledge your report, keep you updated on the fix, and credit you in the
          release notes if you would like us to.
        </p>
      </LegalSection>

      <LegalSection heading="Bugs and feature requests">
        <p>
          Those belong in{" "}
          <a
            href={`${site.github}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            the issue tracker
          </a>{" "}
          on the project repository — it is public, so other people can find and upvote your
          request, and it saves everyone the email round-trip.
        </p>
      </LegalSection>

      <LegalSection heading="If you are self-hosting">
        <p>
          We cannot see your data, reset your password, or delete anything on a self-hosted
          install — that is your server and your database. Contact the operator of the instance
          you are using, or post a question in{" "}
          <a
            href={`${site.github}/discussions`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            the project discussions
          </a>{" "}
          and we will help you work it out.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
