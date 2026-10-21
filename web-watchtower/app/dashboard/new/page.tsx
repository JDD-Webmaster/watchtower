"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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

  if (!activeOrg) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/organizations/${activeOrg.id}/deadline-items`, {
        ...form,
        recurrence_interval_days: form.recurrence === "custom_days" ? Number(form.recurrence_interval_days) : null,
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
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Add a deadline</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
          <input
            required
            placeholder="e.g. Renew acme.com domain"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
          <input
            list="category-presets"
            placeholder="Domain, Hosting, Government Levy…"
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <datalist id="category-presets">
            {CATEGORY_PRESETS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Due date</label>
            <input
              type="date"
              required
              className="input"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Repeats</label>
            <select
              className="input"
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Repeat every (days)</label>
            <input
              type="number"
              min={1}
              required
              className="input"
              value={form.recurrence_interval_days}
              onChange={(e) => setForm({ ...form, recurrence_interval_days: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Owner</label>
          <select
            className="input"
            value={form.owner_user_id}
            onChange={(e) => setForm({ ...form, owner_user_id: Number(e.target.value) })}
          >
            <option value={user?.id}>{user?.name} (you)</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">
            Who gets reminded — assigning to other teammates is coming soon.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            className="input"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? "Adding…" : "Add deadline"}
        </button>
      </form>
    </div>
  );
}
