"use client";
import { useState, use, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Mail, MessageSquare, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DeadlineItem, ReminderLog, ReminderRule } from "@/lib/types";

export default function DeadlineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { activeOrg } = useAuth();
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [ruleDraft, setRuleDraft] = useState<{ offsets: string; overdue: string } | null>(null);

  const { data: item } = useQuery({
    queryKey: ["deadline-item", id],
    queryFn: () => api.get<{ data: DeadlineItem }>(`/deadline-items/${id}`).then((r) => r.data),
  });

  const { data: logs } = useQuery({
    queryKey: ["reminder-logs", id],
    queryFn: () => api.get<{ data: ReminderLog[] }>(`/deadline-items/${id}/reminder-logs`).then((r) => r.data),
  });

  const markDoneMut = useMutation({
    mutationFn: () => api.post(`/deadline-items/${id}/mark-done`),
    onSuccess: () => {
      toast.success("Marked done");
      qc.invalidateQueries({ queryKey: ["deadline-item", id] });
      qc.invalidateQueries({ queryKey: ["deadline-items", activeOrg?.id] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/deadline-items/${id}`),
    onSuccess: () => {
      toast.success("Deadline deleted");
      qc.invalidateQueries({ queryKey: ["deadline-items", activeOrg?.id] });
      router.push("/dashboard");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  const saveRuleMut = useMutation({
    mutationFn: (rule: { offsets_days: number[]; overdue_repeat_days: number }) =>
      api.put(`/deadline-items/${id}/reminder-rule`, rule),
    onSuccess: () => {
      toast.success("Reminder schedule updated for this item");
      qc.invalidateQueries({ queryKey: ["deadline-item", id] });
      setRuleDraft(null);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  const resetRuleMut = useMutation({
    mutationFn: () => api.delete(`/deadline-items/${id}/reminder-rule`),
    onSuccess: () => {
      toast.success("Reverted to organization default");
      qc.invalidateQueries({ queryKey: ["deadline-item", id] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  if (!item) return <p className="text-sm text-slate-400">Loading…</p>;

  const rule: ReminderRule | undefined = item.reminder_rule ?? undefined;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{item.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {item.category && <span>{item.category} · </span>}
              Due {item.due_date} · {item.recurrence === "none" ? "One-off" : `Repeats ${item.recurrence}`} · Owner: {item.owner.name}
            </p>
          </div>
          <span
            className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${
              item.status === "overdue"
                ? "bg-red-50 text-red-700"
                : item.status === "done"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {item.status}
          </span>
        </div>

        {item.notes && <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap">{item.notes}</p>}

        <div className="flex items-center gap-2 mt-5">
          {item.status !== "done" && (
            <button
              onClick={() => markDoneMut.mutate()}
              disabled={markDoneMut.isPending}
              className="bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              Mark done
            </button>
          )}
          <button
            onClick={() => confirm("Delete this deadline and its reminder history?") && deleteMut.mutate()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Reminder schedule</h2>
          {rule && (
            <button onClick={() => resetRuleMut.mutate()} className="text-xs text-slate-500 underline">
              Revert to organization default
            </button>
          )}
        </div>

        {ruleDraft ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Days before due (comma-separated)</label>
              <input
                className="input"
                value={ruleDraft.offsets}
                onChange={(e) => setRuleDraft({ ...ruleDraft, offsets: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Repeat overdue reminder every (days)</label>
              <input
                className="input"
                type="number"
                min={1}
                value={ruleDraft.overdue}
                onChange={(e) => setRuleDraft({ ...ruleDraft, overdue: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  saveRuleMut.mutate({
                    offsets_days: ruleDraft.offsets.split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n)),
                    overdue_repeat_days: parseInt(ruleDraft.overdue, 10) || 3,
                  })
                }
                className="text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-md"
              >
                Save
              </button>
              <button onClick={() => setRuleDraft(null)} className="text-xs font-semibold text-slate-600 px-3 py-1.5">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Reminds {rule ? rule.offsets_days.join(", ") : "30, 14, 7, 1"} day(s) before due, then every{" "}
              {rule ? rule.overdue_repeat_days : 3} day(s) once overdue.
              {!rule && <span className="text-slate-400"> (organization default)</span>}
            </p>
            <button
              onClick={() =>
                setRuleDraft({
                  offsets: (rule?.offsets_days ?? [30, 14, 7, 1]).join(", "),
                  overdue: String(rule?.overdue_repeat_days ?? 3),
                })
              }
              className="text-xs font-semibold text-slate-600 underline shrink-0 ml-3"
            >
              Customize
            </button>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Reminder history</h2>
        {!logs?.length ? (
          <p className="text-sm text-slate-400">No reminders sent yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <Fragment key={log.id}>
                <div
                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {log.channel === "sms" ? (
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="uppercase text-xs text-slate-500">{log.channel}</span>
                    <span className={`text-xs font-medium ${log.success ? "text-emerald-600" : "text-red-600"}`}>
                      {log.success ? "Sent" : "Failed"}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(log.sent_at).toLocaleString()}</span>
                  </div>
                  {expandedLogId === log.id ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                {expandedLogId === log.id && (
                  <div className="bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg -mt-2 px-4 py-3">
                    {log.error && <p className="text-xs text-red-600 mb-2">{log.error}</p>}
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-sans">{log.content}</pre>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Prevent static prerender of client components that use auth context
