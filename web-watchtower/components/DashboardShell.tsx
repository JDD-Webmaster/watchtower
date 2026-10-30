"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CalendarClock,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareOff,
  Plus,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const nav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New deadline", href: "/dashboard/new", icon: Plus },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Wallet & Billing", href: "/dashboard/wallet", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Support", href: "/dashboard/support", icon: HelpCircle },
];

function DashboardNav() {
  const pathname = usePathname();
  return (
    <>
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );
}

// Only hidden on the Settings page itself (telling someone already there to
// "go add it in Settings" is just noise) — isolated in its own component so
// its usePathname() call sits behind the same Suspense boundary DashboardNav
// already needs for the same reason (static prerendering can't resolve the
// current URL ahead of time).
function PhoneNudgeBanner({ onDismiss }: { onDismiss: () => void }) {
  const pathname = usePathname();
  if (pathname === "/dashboard/settings") return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <MessageSquareOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="flex-1">
        No phone number on file — SMS reminders can&apos;t reach you yet.{" "}
        <Link
          href="/dashboard/settings"
          className="font-semibold underline underline-offset-2 hover:text-amber-700"
        >
          Add one in Settings
        </Link>
        .
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-amber-600 hover:text-amber-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, activeOrg, setActiveOrgId, refetchUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [phoneNudgeDismissed, setPhoneNudgeDismissed] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  const logout = async () => {
    await api.post("/logout");
    refetchUser();
    router.push("/login");
  };

  if (isLoading || !user) {
    return <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  }

  // SMS defaults to "on" until a user opts out (see UserResource/ReminderDispatchService),
  // so a missing phone number here means reminders are silently never sent, not that the
  // user chose email-only.
  const showPhoneNudge =
    !phoneNudgeDismissed && !user.phone && (user.notification_preferences?.sms ?? true);

  return (
    <div className="flex-1 flex min-h-0">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        <div className="flex h-16 items-center gap-2 px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Bell className="h-4 w-4" />
            </span>
            WatchTower
          </Link>
        </div>
        <div className="px-4">
          {user.organizations && user.organizations.length > 1 ? (
            <select
              value={activeOrg?.id ?? ""}
              onChange={(e) => setActiveOrgId(Number(e.target.value))}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
            >
              {user.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
              {activeOrg?.name}
            </div>
          )}
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-3">
          <Suspense fallback={null}>
            <DashboardNav />
          </Suspense>
        </nav>
        <div className="border-t border-slate-200 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-h-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-600">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Bell className="h-4 w-4" />
            WatchTower
          </Link>
          <Link href="/dashboard/new" className="p-2 text-slate-600">
            <Plus className="h-5 w-5" />
          </Link>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-80 bg-white flex flex-col">
              <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-2 font-bold">
                  <Bell className="h-4 w-4" />
                  WatchTower
                </div>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 px-3">
                <Suspense fallback={null}>
                  <DashboardNav />
                </Suspense>
              </nav>
              <div className="border-t border-slate-200 p-3">
                <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600">
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            {showPhoneNudge && (
              <Suspense fallback={null}>
                <PhoneNudgeBanner onDismiss={() => setPhoneNudgeDismissed(true)} />
              </Suspense>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
