"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, LogOut, Plus, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, activeOrg, setActiveOrgId, refetchUser } = useAuth();

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

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold">
              <Bell className="w-4.5 h-4.5" />
              WatchTower
            </Link>
            {user.organizations && user.organizations.length > 1 && (
              <select
                value={activeOrg?.id ?? ""}
                onChange={(e) => setActiveOrgId(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white"
              >
                {user.organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            )}
            {user.organizations && user.organizations.length === 1 && (
              <span className="text-sm text-slate-500">{activeOrg?.name}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" />
              New deadline
            </Link>
            <Link href="/dashboard/settings" className="p-1.5 rounded-md hover:bg-slate-50" title="Settings">
              <Settings className="w-4 h-4 text-slate-600" />
            </Link>
            <button onClick={logout} className="p-1.5 rounded-md hover:bg-slate-50" title="Log out">
              <LogOut className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
