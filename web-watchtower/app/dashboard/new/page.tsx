"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { DeadlineFormFields, type DeadlineFormValue } from "@/components/DeadlineFormFields";
import type { Recurrence } from "@/lib/types";

export default function NewDeadlinePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeOrg, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<DeadlineFormValue>({
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

  const toggleTarget = (memberId: number) => {
    setTargets((prev) => {
      const exists = prev.find((t) => t.user_id === memberId);
      if (exists) return prev.filter((t) => t.user_id !== memberId);
      return [...prev, { user_id: memberId, channels: ["email", "sms"] }];
    });
  };

  const toggleChannel = (memberId: number, channel: "email" | "sms") => {
    setTargets((prev) =>
      prev.map((t) =>
        t.user_id === memberId
          ? {
              ...t,
              channels: t.channels.includes(channel)
                ? t.channels.filter((c) => c !== channel)
                : [...t.channels, channel],
            }
          : t,
      ),
    );
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
        <DeadlineFormFields
          activeOrgId={activeOrg.id}
          form={form}
          onChange={(patch) => setForm({ ...form, ...patch })}
          targets={targets}
          onToggleTarget={toggleTarget}
          onToggleChannel={toggleChannel}
        />

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
