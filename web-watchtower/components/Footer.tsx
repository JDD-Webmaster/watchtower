import Link from "next/link";
import { ArrowUpRight, Bell, GitBranch, ShieldCheck } from "lucide-react";
import { footerColumns, site } from "@/lib/site";

// The marketing footer. Deliberately not a generic three-column link dump:
// the top block earns the click (brand + what the product does + the primary
// action), the column grid covers orientation, and the bottom bar carries the
// legal-ish facts. Everything that is a real link is a real page — no dead
// "#" hrefs, no links to a blog that doesn't exist.
//
// "use cache" because the copyright year comes from `new Date()`, and Next's
// cache components refuse to prerender an unstable value. Caching the whole
// footer keeps the page static; the build ID is part of the cache key, so the
// year refreshes on every deploy.
export async function Footer() {
  "use cache";

  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-slate-200 bg-slate-950 text-slate-400">
      {/* Soft light from the top edge — keeps the dark panel from reading
          as a flat slab against the slate-50 page above it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(99,102,241,0.16),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* ---- Top block: brand + primary action ---- */}
        <div className="grid gap-10 py-14 md:grid-cols-2 lg:gap-16">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <Bell className="h-4.5 w-4.5" />
              </span>
              <span className="text-lg font-bold tracking-tight">{site.name}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              {site.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Start tracking free
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
              >
                <GitBranch className="h-4 w-4" />
                View source
              </a>
            </div>
            <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              MIT licensed · self-hostable · your data stays yours
            </p>
          </div>

          {/* ---- Column grid ---- */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:justify-items-end"
          >
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
                        >
                          {link.label}
                          <ArrowUpRight className="h-3 w-3 opacity-60" />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-slate-400 transition hover:text-white"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* ---- Bottom bar ---- */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-7 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-500">
            © {year} {site.legalEntity}. All rights reserved. Released under the{" "}
            <a
              href={`${site.github}/blob/main/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 underline underline-offset-2 transition hover:text-white"
            >
              {site.license} licence
            </a>
            .
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/legal/privacy" className="text-slate-500 transition hover:text-white">
              Privacy
            </Link>
            <Link href="/legal/terms" className="text-slate-500 transition hover:text-white">
              Terms
            </Link>
            <Link href="/legal/contact" className="text-slate-500 transition hover:text-white">
              Contact
            </Link>
            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-500 transition hover:text-white"
            >
              <GitBranch className="h-3.5 w-3.5" />
              {site.repoLabel}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
