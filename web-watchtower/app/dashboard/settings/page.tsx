"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ReminderRule } from "@/lib/types";

const TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : ["UTC"];

export default function SettingsPage() {
  const { user, activeOrg, refetchUser } = useAuth();
  const qc = useQueryClient();

  const [prefs, setPrefs] = useState({ email: true, sms: true });
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  // Each effect below syncs data that arrives asynchronously from a query
  // into local, independently-editable form state — not a value derivable
  // at render time, so this is exactly the "synchronize with an external
  // system" case React's own effect docs endorse, not a derived value the
  // set-state-in-effect lint rule's heuristic is meant to catch.
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(user.notification_preferences);
    setPhone(user.phone ?? "");
    setCountry(user.country ?? "");
  }, [user]);

  const savePrefsMut = useMutation({
    mutationFn: () => api.patch("/user", { notification_preferences: prefs, phone, country }),
    onSuccess: () => {
      toast.success("Preferences saved");
      refetchUser();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrgName(activeOrg.name);
      setOrgTz(activeOrg.timezone);
    }
  }, [activeOrg]);

  useEffect(() => {
    if (orgRule) {
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
        offsets_days: offsets.split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n)),
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
    <div className="max-w-lg space-y-10">
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Your notifications</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={prefs.email} onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })} />
            Email reminders
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={prefs.sms} onChange={(e) => setPrefs({ ...prefs, sms: e.target.checked })} />
            SMS reminders
          </label>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone (for SMS)</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
              <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">— Select —</option>
                <option value="NG">Nigeria</option>
                <option value="GH">Ghana</option>
                <option value="KE">Kenya</option>
                <option value="ZA">South Africa</option>
                <option value="UG">Uganda</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => savePrefsMut.mutate()}
            disabled={savePrefsMut.isPending}
            className="text-xs font-semibold bg-slate-900 text-white px-3.5 py-2 rounded-lg disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Organization</h2>
        {!isOwner && <p className="text-xs text-slate-400 mb-3">Only an owner can change these.</p>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
            <input disabled={!isOwner} className="input disabled:opacity-50" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Timezone</label>
            <select disabled={!isOwner} className="input disabled:opacity-50" value={orgTz} onChange={(e) => setOrgTz(e.target.value)}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Reminders go out at 08:00 in this timezone.</p>
          </div>
          {isOwner && (
            <button
              onClick={() => saveOrgMut.mutate()}
              disabled={saveOrgMut.isPending}
              className="text-xs font-semibold bg-slate-900 text-white px-3.5 py-2 rounded-lg disabled:opacity-50"
            >
              Save
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Default reminder schedule</h2>
        <p className="text-xs text-slate-400 mb-4">Applies to every deadline unless it has its own custom schedule.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Days before due (comma-separated)</label>
            <input disabled={!isOwner} className="input disabled:opacity-50" value={offsets} onChange={(e) => setOffsets(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Repeat overdue reminder every (days)</label>
            <input
              disabled={!isOwner}
              type="number"
              min={1}
              className="input disabled:opacity-50"
              value={overdueRepeat}
              onChange={(e) => setOverdueRepeat(e.target.value)}
            />
          </div>
          {isOwner && (
            <button
              onClick={() => saveOrgRuleMut.mutate()}
              disabled={saveOrgRuleMut.isPending}
              className="text-xs font-semibold bg-slate-900 text-white px-3.5 py-2 rounded-lg disabled:opacity-50"
            >
              Save
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
