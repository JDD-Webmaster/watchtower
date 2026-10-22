"use client";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, Clock, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatusBreakdownBar } from "@/components/charts/StatusBreakdownBar";
import type { DeadlineItem } from "@/lib/types";

export default function DashboardPage() {
  const { activeOrg } = useAuth();
  const qc = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["deadline-items", activeOrg?.id],
    queryFn: () => api.get<{ data: DeadlineItem[] }>(`/organizations/${activeOrg!.id}/deadline-items`).then((r) => r.data),
    enabled: !!activeOrg,
  });

  const markDoneMut = useMutation({
    mutationFn: (id: number) => api.post(`/deadline-items/${id}/mark-done`),
    onSuccess: () => {
      toast.success("Marked done");
      qc.invalidateQueries({ queryKey: ["deadline-items", activeOrg?.id] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"),
  });

  if (!activeOrg || isLoading) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  const overdue = (items ?? []).filter((i) => i.status === "overdue");
  const dueSoon = (items ?? []).filter((i) => i.status === "upcoming" && i.days_until_due <= 14);
  const upcoming = (items ?? []).filter((i) => i.status === "upcoming" && i.days_until_due > 14);
  const done = (items ?? []).filter((i) => i.status === "done");

  if (!items?.length) {
    return (
      <div className="text-center py-20">
        <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm mb-4">No deadlines tracked yet for {activeOrg.name}.</p>
        <Link href="/dashboard/new" className="text-sm font-semibold text-slate-900 underline">
          Add your first one
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StatusBreakdownBar
        segments={[
          { key: "overdue", label: "Overdue", count: overdue.length, barClass: "bg-red-600", iconClass: "text-red-600", icon: AlertTriangle },
          { key: "due_soon", label: "Due soon", count: dueSoon.length, barClass: "bg-amber-500", iconClass: "text-amber-600", icon: Clock },
          { key: "upcoming", label: "Upcoming", count: upcoming.length, barClass: "bg-slate-400", iconClass: "text-slate-500", icon: CalendarCheck },
          { key: "done", label: "Done", count: done.length, barClass: "bg-emerald-600", iconClass: "text-emerald-600", icon: CheckCircle2 },
        ]}
      />
      <Group title="Overdue" icon={AlertTriangle} iconClass="text-red-600" items={overdue} onMarkDone={markDoneMut.mutate} />
      <Group title="Due soon" icon={Clock} iconClass="text-amber-600" items={dueSoon} onMarkDone={markDoneMut.mutate} />
      <Group title="Upcoming" icon={CalendarCheck} iconClass="text-slate-500" items={upcoming} onMarkDone={markDoneMut.mutate} />
      <Group title="Done" icon={CheckCircle2} iconClass="text-emerald-600" items={done} collapsedByDefault />
    </div>
  );
}

function Group({
  title,
  icon: Icon,
  iconClass,
  items,
  onMarkDone,
  collapsedByDefault,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  items: DeadlineItem[];
  onMarkDone?: (id: number) => void;
  collapsedByDefault?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <details open={!collapsedByDefault}>
      <summary className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer mb-3">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        {title}
        <span className="text-slate-400 font-normal">({items.length})</span>
      </summary>
      <div className="space-y-2">
        {items.map((item) => (
          <Row key={item.id} item={item} onMarkDone={onMarkDone} />
        ))}
      </div>
    </details>
  );
}

function Row({ item, onMarkDone }: { item: DeadlineItem; onMarkDone?: (id: number) => void }) {
  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
      <Link href={`/dashboard/deadlines/${item.id}`} className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
        <p className="text-xs text-slate-500">
          {item.category && <span>{item.category} · </span>}
          Due {item.due_date}
          {item.status !== "done" && (
            <span className={item.status === "overdue" ? "text-red-600 font-medium" : ""}>
              {" "}
              ({item.status === "overdue" ? `${Math.abs(item.days_until_due)}d overdue` : `in ${item.days_until_due}d`})
            </span>
          )}
          {" · "}
          {item.owner.name}
        </p>
      </Link>
      {onMarkDone && (
        <button
          onClick={() => onMarkDone(item.id)}
          className="text-xs font-semibold text-slate-600 border border-slate-300 px-2.5 py-1 rounded-md hover:bg-slate-50 shrink-0 ml-3"
        >
          Mark done
        </button>
      )}
    </div>
  );
}
