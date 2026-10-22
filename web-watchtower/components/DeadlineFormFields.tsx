"use client";
import { useRouter } from "next/navigation";
import { Users, X } from "lucide-react";
import { Combobox } from "@/components/Combobox";
import { CATEGORY_PRESETS, type Recurrence } from "@/lib/types";

export interface DeadlineFormValue {
  name: string;
  category: string;
  notes: string;
  due_date: string;
  recurrence: Recurrence;
  recurrence_interval_days: string;
  owner_user_id: number | string;
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

/** The "Details" + "Who gets notified" cards shared by the add and edit
 *  deadline forms, so the two stay in sync instead of drifting apart. */
export function DeadlineFormFields({
  form,
  onChange,
  targets,
  onRemoveTarget,
}: {
  form: DeadlineFormValue;
  onChange: (patch: Partial<DeadlineFormValue>) => void;
  targets: Array<{ user_id: number; channels: string[]; user?: { name: string } }>;
  onRemoveTarget: (memberId: number) => void;
}) {
  const router = useRouter();

  return (
    <>
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
              className={inputClass}
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900">Category</label>
            <div className="mt-1.5">
              <Combobox
                value={form.category}
                onChange={(v) => onChange({ category: v })}
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
                className={inputClass}
                value={form.due_date}
                onChange={(e) => onChange({ due_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">Repeats</label>
              <select
                className={inputClass}
                value={form.recurrence}
                onChange={(e) => onChange({ recurrence: e.target.value as Recurrence })}
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
                className={inputClass}
                value={form.recurrence_interval_days}
                onChange={(e) => onChange({ recurrence_interval_days: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-900">Notes</label>
            <textarea
              className={inputClass}
              rows={4}
              placeholder="Account numbers, renewal links, who to contact..."
              value={form.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Who gets notified</h2>
          <p className="text-sm text-slate-500">
            Choose who receives SMS and email reminders for this deadline. Leave empty to use org
            defaults (owners + item owner).
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
              <button
                type="button"
                onClick={() => router.push("/dashboard/team")}
                className="font-medium text-slate-900 underline underline-offset-2"
              >
                Team management
              </button>{" "}
              to pick specific people per deadline.
            </p>
            {targets.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {targets.map((t) => (
                  <span
                    key={t.user_id}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  >
                    {t.user?.name ?? `Member #${t.user_id}`}
                    <button type="button" onClick={() => onRemoveTarget(t.user_id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
