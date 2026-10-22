// Single source of truth for anything that appears in more than one place:
// the footer, the legal pages, and page metadata. Change it here, not in
// the components.
//
// The `legalEntity`, `contactEmail` and `jurisdiction` values are the ones a
// lawyer will want to see first. They are deliberately isolated at the top of
// this file so they can be corrected in one place before the legal pages are
// published.

export const site = {
  name: "WatchTower",
  tagline: "Never miss a renewal again.",
  description:
    "Open-source renewal and compliance reminders — domains, hosting, subscriptions, government levies. Log it once, never forget it again.",
  url: "https://watchtower.uselodger.com",
  github: "https://github.com/JDD-Webmaster/watchtower",
  repoLabel: "JDD-Webmaster/watchtower",
  license: "MIT",

  // --- Legal identity -----------------------------------------------------
  // TODO(owner): replace these three before publishing /legal. The legal
  // pages render them verbatim, so a wrong value here is a wrong value in
  // the published policy.
  legalEntity: "WatchTower",
  contactEmail: "privacy@watchtower.uselodger.com",
  jurisdiction: "Federal Republic of Nigeria",
  /** ISO date the policies take effect. Bump this when you amend them. */
  effectiveDate: "21 October 2026",
} as const;

export const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/" },
      { label: "Create account", href: "/register" },
      { label: "Sign in", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "What it tracks",
    links: [
      { label: "Domains & SSL", href: "/#features" },
      { label: "Hosting renewals", href: "/#features" },
      { label: "API subscriptions", href: "/#features" },
      { label: "Government levies", href: "/#features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Source code", href: site.github, external: true },
      { label: "Self-hosting guide", href: `${site.github}#readme`, external: true },
      { label: "Report an issue", href: `${site.github}/issues`, external: true },
      { label: "Architecture", href: `${site.github}/blob/main/ARCHITECTURE.md`, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of service", href: "/legal/terms" },
      { label: "Contact & data requests", href: "/legal/contact" },
    ],
  },
] as const;
