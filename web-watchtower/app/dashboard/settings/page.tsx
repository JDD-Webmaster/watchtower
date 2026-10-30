"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, MessageSquare, User } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ReminderRule } from "@/lib/types";
import { getAllTimezones } from "@/lib/countries";
import { PhoneNumberField } from "@/components/PhoneNumberField";
import type { Country } from "react-phone-number-input";

export default function SettingsPage() {
  const { user, activeOrg, refetchUser } = useAuth();
  const qc = useQueryClient();
  const timezones = getAllTimezones();

  const [prefs, setPrefs] = useState({ email: true, sms: true });
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<Country | undefined>(undefined);
  const [userTz, setUserTz] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // Seeding editable form fields from the fetched user record once it
    // loads — not a value derivable at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(user.notification_preferences || { email: true, sms: true });
    setPhone(user.phone ?? "");
    setCountry((user.country as Country) || undefined);
    setUserTz(user.timezone ?? "");
  }, [user]);

  const savePrefsMut = useMutation({
    mutationFn: () => {
      setPhoneError(null);
      return api.patch("/user", {
        notification_preferences: prefs,
        phone,
        country,
        timezone: userTz || null,
      });
    },
    onSuccess: () => {
      toast.success("Preferences saved");
      refetchUser();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.errors?.phone?.[0]) {
        setPhoneError(e.errors.phone[0]);
      } else {
        toast.error(e instanceof ApiError ? e.message : "Failed");
      }
    },
  });

  const { data: orgRule } = useQuery({
    queryKey: ["org-reminder-rule", activeOrg?.id],
    queryFn: () => api.get<{ data: ReminderRule }>(`/organizations/${activeOrg!.id}/reminder-rule`).then((r) => r.data),
    enabled: !!activeOrg,
  });

  const [orgName, setOrgName] = useState("");
  const [orgTz, setOrgTz] = useState("");
  const [offsets, setOffsets] = useState("");
  const [overdueRepeat, setOverdueRepeat] = useState("");

  useEffect(() => {
    if (activeOrg) {
      // Seeding editable form fields from the active org once it loads —
      // not a value derivable at render time.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrgName(activeOrg.name);
      setOrgTz(activeOrg.timezone);
    }
  }, [activeOrg]);

  useEffect(() => {
    if (orgRule) {
      // Seeding editable form fields from the fetched reminder rule once it
      // loads — not a value derivable at render time.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOffsets(orgRule.offsets_days.join(", "));
      setOverdueRepeat(String(orgRule.overdue_repeat_days));
    }
  }, [orgRule]);

  const saveOrgMut = useMutation({
    mutationFn: () => api.patch(`/organizations/${activeOrg!.id}`, { name: orgName, timezone: orgTz }),
    onSuccess: () => {
      toast.success("Organization updated");
      refetchUser();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed — are you the owner?"),
  });

  const saveOrgRuleMut = useMutation({
    mutationFn: () =>
      api.put(`/organizations/${activeOrg!.id}/reminder-rule`, {
        offsets_days: offsets
          .split(",")
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n)),
        overdue_repeat_days: parseInt(overdueRepeat, 10) || 3,
      }),
    onSuccess: () => {
      toast.success("Default reminder schedule updated");
      qc.invalidateQueries({ queryKey: ["org-reminder-rule", activeOrg?.id] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed — are you the owner?"),
  });

  if (!user || !activeOrg) return null;
  const isOwner = activeOrg.role === "owner";

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your profile, notifications, timezone, country, and reminder schedule.
        </p>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <User className="h-4 w-4" />
              Your profile & notifications
            </h2>
            <p className="text-sm text-slate-500">Control how and where you get reminded</p>
          </div>
          <div className="space-y-5 p-6">
            <div className="sm:max-w-md">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-900">
                Phone (for SMS)
              </label>
              <div className="mt-1.5">
                <PhoneNumberField
                  id="phone"
                  value={phone}
                  onChange={(v) => {
                    setPhone(v);
                    if (phoneError) setPhoneError(null);
                  }}
                  country={country}
                  onCountryChange={setCountry}
                  error={Boolean(phoneError)}
                />
              </div>
              {phoneError ? (
                <p className="mt-1.5 text-xs text-red-600">{phoneError}</p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">
                  Pick the country first if the number isn&apos;t already in international
                  format.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">Your timezone</label>
              <select
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 sm:max-w-md"
                value={userTz}
                onChange={(e) => setUserTz(e.target.value)}
              >
                <option value="">Use organization timezone</option>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                Reminders consider your selected timezone and country for delivery.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={prefs.email}
                  onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
                />
                <Mail className="h-4 w-4 text-slate-400" />
                Email reminders
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={prefs.sms}
                  onChange={(e) => setPrefs({ ...prefs, sms: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
                />
                <MessageSquare className="h-4 w-4 text-slate-400" />
                SMS reminders
              </label>
            </div>
            <button
              onClick={() => savePrefsMut.mutate()}
              disabled={savePrefsMut.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              {savePrefsMut.isPending ? "Saving…" : "Save preferences"}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Organization</h2>
            <p className="text-sm text-slate-500">
              {!isOwner ? "Only an owner can change these." : "Manage your workspace"}
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-900">Organization name</label>
                <input
                  disabled={!isOwner}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm disabled:opacity-50"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900">Default timezone</label>
                <select
                  disabled={!isOwner}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm disabled:opacity-50"
                  value={orgTz}
                  onChange={(e) => setOrgTz(e.target.value)}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => saveOrgMut.mutate()}
                disabled={saveOrgMut.isPending}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saveOrgMut.isPending ? "Saving…" : "Save organization"}
              </button>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Default reminder schedule</h2>
            <p className="text-sm text-slate-500">
              Applies to every deadline unless it has its own custom schedule. Only owners can change
              this.
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-900">
                  Days before due (comma-separated)
                </label>
                <input
                  disabled={!isOwner}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm disabled:opacity-50"
                  value={offsets}
                  onChange={(e) => setOffsets(e.target.value)}
                  placeholder="30, 14, 7, 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900">
                  Repeat overdue reminder every (days)
                </label>
                <input
                  disabled={!isOwner}
                  type="number"
                  min={1}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm disabled:opacity-50"
                  value={overdueRepeat}
                  onChange={(e) => setOverdueRepeat(e.target.value)}
                />
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => saveOrgRuleMut.mutate()}
                disabled={saveOrgRuleMut.isPending}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saveOrgRuleMut.isPending ? "Saving…" : "Save reminder schedule"}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
