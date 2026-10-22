import Link from "next/link";
import { ArrowLeft, Bell, Check } from "lucide-react";
import { site } from "@/lib/site";

export interface AuthStep {
  title: string;
  body: string;
}

interface AuthShellProps {
  /** Small label above the heading, e.g. "Welcome back". */
  eyebrow: string;
  heading: string;
  body: string;
  /** Numbered "what happens next" list shown on the dark panel. */
  steps: AuthStep[];
  /** Short bullet points pinned to the bottom of the dark panel. */
  highlights: string[];
  children: React.ReactNode;
}

// Split-screen shell shared by /login and /register. The left column is the
// form (supplied by the page), the right column is a static pitch that sets
// expectations about what the product does — on mobile it collapses away
// entirely rather than squeezing the form into a scroll.
export function AuthShell({
  eyebrow,
  heading,
  body,
  steps,
  highlights,
  children,
}: AuthShellProps) {
  return (
    <div className="flex-1 grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_1fr]">
      {/* ---------------- Form column ---------------- */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
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
            Back
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <p className="text-center text-xs text-slate-400">
          By continuing you agree to our{" "}
          <Link href="/legal/terms" className="underline underline-offset-2 hover:text-slate-600">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-slate-600">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* ---------------- Pitch column ---------------- */}
      <aside className="relative hidden overflow-hidden bg-slate-950 text-slate-300 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_70%_0%,rgba(99,102,241,0.22),transparent_60%),radial-gradient(50%_50%_at_20%_100%,rgba(14,165,233,0.14),transparent_65%)]"
        />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            {eyebrow}
          </p>
          <h2 className="mt-5 max-w-md text-3xl font-bold leading-tight tracking-tight text-white">
            {heading}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">{body}</p>
        </div>

        <ol className="relative mt-12 space-y-6">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <ul className="relative mt-12 space-y-2.5 border-t border-white/10 pt-8">
          {highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2.5 text-sm text-slate-400">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              {highlight}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
