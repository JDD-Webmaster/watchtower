"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Users, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Combobox } from "@/components/Combobox";
import { CATEGORY_PRESETS, type Recurrence } from "@/lib/types";

export default function NewDeadlinePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeOrg, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    notes: "",
    due_date: "",
    recurrence: "none" as Recurrence,
    recurrence_interval_days: "",
    owner_user_id: user?.id ?? "",
  });
  const [targets, setTargets] = useState<Array<{ user_id: number; channels: string[] }>>([]);

  if (!activeOrg) return null;

  const orgMembers = user?.organizations?.find((o) => o.id === activeOrg.id)
    ? // members will be loaded from team page; for now use owner + current user context
      []
    : [];

  const toggleTarget = (memberId: number) => {
    setTargets((prev) => {
      const exists = prev.find((t) => t.user_id === memberId);
      if (exists) {
        return prev.filter((t) => t.user_id !== memberId);
      }
      return [...prev, { user_id: memberId, channels: ["email", "sms"] }];
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/organizations/${activeOrg.id}/deadline-items`, {
        ...form,
        recurrence_interval_days:
          form.recurrence === "custom_days" ? Number(form.recurrence_interval_days) : null,
        notification_targets: targets.length > 0 ? targets : undefined,
      });
      qc.invalidateQueries({ queryKey: ["deadline-items", activeOrg.id] });
      toast.success("Deadline added");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add deadline");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add a deadline</h1>
        <p className="mt-1 text-sm text-slate-500">
          Log it once. WatchTower will remind the right people at the right time.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Details</h2>
            <p className="text-sm text-slate-500">What needs renewing and when?</p>
          </div>
          <div className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium text-slate-900">Name</label>
              <input
                required
                placeholder="e.g. Renew acme.com domain"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900">Category</label>
              <div className="mt-1.5">
                <Combobox
                  value={form.category}
                  onChange={(v) => setForm({ ...form, category: v })}
                  options={CATEGORY_PRESETS}
                  placeholder="Click to browse, or type to search / enter your own"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Pick from the list or type anything — it&apos;s just there to help you stay consistent.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-900">Due date</label>
                <input
                  type="date"
                  required
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900">Repeats</label>
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={form.recurrence}
                  onChange={(e) => setForm({ ...form, recurrence: e.target.value as Recurrence })}
                >
                  <option value="none">Never (one-off)</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom_days">Every N days</option>
                </select>
              </div>
            </div>

            {form.recurrence === "custom_days" && (
              <div>
                <label className="block text-sm font-medium text-slate-900">Repeat every (days)</label>
                <input
                  type="number"
                  min={1}
                  required
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={form.recurrence_interval_days}
                  onChange={(e) => setForm({ ...form, recurrence_interval_days: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-900">Notes</label>
              <textarea
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                rows={4}
                placeholder="Account numbers, renewal links, who to contact..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Who gets notified</h2>
            <p className="text-sm text-slate-500">
              Choose who receives SMS and email reminders for this deadline. Leave empty to use
              org defaults (owners + item owner).
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Team members</p>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900"
                onClick={() => router.push("/dashboard/team")}
              >
                <Users className="h-4 w-4" />
                Manage team
              </button>
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center">
              <p className="text-sm text-slate-500">
                Add team members in{" "}
                <button type="button" onClick={() => router.push("/dashboard/team")} className="font-medium text-slate-900 underline underline-offset-2">
                  Team management
                </button>{" "}
                to pick specific people per deadline.
              </p>
              {targets.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {targets.map((t) => (
                    <span key={t.user_id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      Member #{t.user_id}
                      <button type="button" onClick={() => toggleTarget(t.user_id)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? "Adding…" : "Add deadline"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
