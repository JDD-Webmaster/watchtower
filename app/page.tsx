import Link from "next/link";
import { Bell, Clock, GitBranch, MessageSquare, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Bell className="w-5 h-5" />
            WatchTower
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="https://github.com/JDD-Webmaster/watchtower"
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitBranch className="w-4 h-4" />
              GitHub
            </a>
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Link href="/register" className="bg-slate-900 text-white px-3.5 py-1.5 rounded-lg font-medium hover:bg-slate-800">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Never miss a renewal again.
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-xl mx-auto">
            Domains, hosting, API subscriptions, government levies — log the deadline once.
            WatchTower remembers forever, and nags by SMS and email until someone marks it done.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/register" className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-800">
              Start tracking, free
            </Link>
            <a
              href="https://github.com/JDD-Webmaster/watchtower"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-slate-300 px-5 py-2.5 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
            >
              Self-host it
            </a>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-6">
          <Feature icon={Clock} title="Relentless, not annoying">
            Configurable reminder schedule (30/14/7/1 days out by default), then escalating
            overdue nudges until it's actually handled — never silently dropped.
          </Feature>
          <Feature icon={MessageSquare} title="SMS + email">
            Every reminder goes out on both channels by default, to every owner on the account —
            not just whoever happened to set it up.
          </Feature>
          <Feature icon={ShieldCheck} title="Open source">
            MIT-licensed, self-hostable with one <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">docker compose up</code>,
            or use the hosted version — your data, your choice.
          </Feature>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 space-y-2">
        <p>
          WatchTower is open source —{" "}
          <a
            href="https://github.com/JDD-Webmaster/watchtower"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            contributions welcome
          </a>
          .
        </p>
        <p>
          Built by the team behind{" "}
          <a
            href="https://uselodger.com"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            UseLodger
          </a>{" "}
          — property &amp; hospitality management for hotels, shortlets, landlords, and
          restaurants.
        </p>
      </footer>
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
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <Icon className="w-6 h-6 text-slate-900 mb-3" />
      <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
    </div>
  );
}
