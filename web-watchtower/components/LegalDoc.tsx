import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";
import { site } from "@/lib/site";

interface LegalDocProps {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}

// Shared chrome for every page under /legal. Kept deliberately plain — these
// documents should look like documents, not like a product landing page.
export function LegalDoc({ title, updated, intro, children }: LegalDocProps) {
  return (
    <div className="flex-1">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Bell className="h-4 w-4" />
            </span>
            {site.name}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-slate-500">Last updated {updated}</p>
          <p className="mt-6 text-base leading-relaxed text-slate-600">{intro}</p>
        </header>

        <div className="mt-10 space-y-10">{children}</div>
      </article>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{heading}</h2>
      <div className="mt-3 space-y-4 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
