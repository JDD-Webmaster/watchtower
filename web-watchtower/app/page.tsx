import Link from "next/link";
import {
  Bell,
  CalendarClock,
  Check,
  Clock,
  GitBranch,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Bell className="h-4 w-4" />
            </span>
            WatchTower
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <a
              href="https://github.com/JDD-Webmaster/watchtower"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:inline-flex"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitBranch className="h-4 w-4" />
              GitHub
            </a>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-slate-900 px-3.5 py-2 font-medium text-white transition hover:bg-slate-800"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.12),transparent_70%)]"
          />
          <div className="relative mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Open source · MIT licensed · self-hostable
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Never miss a renewal again.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Domains, hosting, API subscriptions, government levies — log the deadline once.
              WatchTower remembers forever, and nags by SMS and email until someone marks it
              done.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Start tracking, free
              </Link>
              <a
                href="https://github.com/JDD-Webmaster/watchtower"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Self-host it
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                No credit card
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Two-minute setup
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Your data, your server
              </li>
            </ul>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="scroll-mt-20">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Built to be annoying about the right things
              </h2>
              <p className="mt-3 text-slate-600">
                Most people find out about a renewal the day it expires. WatchTower is designed
                around the opposite problem.
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              <Feature icon={Clock} title="Relentless, not annoying">
                Configurable reminder schedule (30/14/7/1 days out by default), then escalating
                overdue nudges until it&apos;s actually handled — never silently dropped.
              </Feature>
              <Feature icon={MessageSquare} title="SMS + email">
                Every reminder goes out on both channels by default, to every owner on the
                account — not just whoever happened to set it up.
              </Feature>
              <Feature icon={ShieldCheck} title="Open source">
                MIT-licensed, self-hostable with one{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">docker compose up</code>
                , or use the hosted version — your data, your choice.
              </Feature>
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Three steps, then you can forget about it
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: CalendarClock,
                  title: "Log the deadline",
                  body: "Add what it is, when it's due, and how often it comes round again. Categories are preset, but the name and notes are yours.",
                },
                {
                  icon: MessageSquare,
                  title: "Add your number",
                  body: "Turn on SMS and email, and pick how far ahead we warn you. 30, 14, 7 and 1 day is a good default.",
                },
                {
                  icon: Check,
                  title: "Mark it done",
                  body: "We reschedule the next occurrence automatically. If it slips, the overdue nudges keep going until someone acts.",
                },
              ].map((step, index) => (
                <div key={step.title}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <step.icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="bg-slate-950 text-white">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              What are you going to forget this quarter?
            </h2>
            <p className="mt-3 max-w-lg text-slate-400">
              The domain, the licence, the levy, the insurance policy. Give it a date and let
              WatchTower carry it from here.
            </p>
            <Link
              href="/register"
              className="mt-7 rounded-lg bg-white px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Create your free account
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mb-1.5 font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}
