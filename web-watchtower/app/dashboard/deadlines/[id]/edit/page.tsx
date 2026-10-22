"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { DeadlineFormFields, type DeadlineFormValue } from "@/components/DeadlineFormFields";
import type { DeadlineItem } from "@/lib/types";

export default function EditDeadlinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: item } = useQuery({
    queryKey: ["deadline-item", id],
    queryFn: () => api.get<{ data: DeadlineItem }>(`/deadline-items/${id}`).then((r) => r.data),
  });

  if (!item) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <EditForm
      id={id}
      item={item}
      onCancel={() => router.push(`/dashboard/deadlines/${id}`)}
    />
  );
}

function EditForm({
  id,
  item,
  onCancel,
}: {
  id: string;
  item: DeadlineItem;
  onCancel: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeOrg } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<DeadlineFormValue>({
    name: item.name,
    category: item.category ?? "",
    notes: item.notes ?? "",
    due_date: item.due_date,
    recurrence: item.recurrence,
    recurrence_interval_days: item.recurrence_interval_days ? String(item.recurrence_interval_days) : "",
    owner_user_id: item.owner.id,
  });
  const [targets, setTargets] = useState(item.notification_targets ?? []);

  const removeTarget = (memberId: number) => {
    setTargets((prev) => prev.filter((t) => t.user_id !== memberId));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/deadline-items/${id}`, {
        ...form,
        recurrence_interval_days:
          form.recurrence === "custom_days" ? Number(form.recurrence_interval_days) : null,
        notification_targets: targets.map((t) => ({ user_id: t.user_id, channels: t.channels })),
      });
      qc.invalidateQueries({ queryKey: ["deadline-item", id] });
      qc.invalidateQueries({ queryKey: ["deadline-items", activeOrg?.id] });
      toast.success("Deadline updated");
      router.push(`/dashboard/deadlines/${id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update deadline");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit deadline</h1>
        <p className="mt-1 text-sm text-slate-500">Update the details or fix a mistake — nothing here is final.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <DeadlineFormFields
          form={form}
          onChange={(patch) => setForm({ ...form, ...patch })}
          targets={targets}
          onRemoveTarget={removeTarget}
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
