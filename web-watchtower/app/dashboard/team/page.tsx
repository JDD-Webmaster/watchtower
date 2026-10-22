"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Plus, Shield, Trash2, UserPlus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function TeamPage() {
  const { activeOrg } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team", activeOrg?.id],
    queryFn: () => api.get<{ data: any[] }>(`/organizations/${activeOrg!.id}/members`).then((r) => r.data),
    enabled: !!activeOrg,
  });

  const inviteMut = useMutation({
    mutationFn: () => api.post(`/organizations/${activeOrg!.id}/members`, { email, role }),
    onSuccess: () => {
      toast.success("Member added");
      setEmail("");
      setInviteOpen(false);
      qc.invalidateQueries({ queryKey: ["team", activeOrg?.id] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to add member"),
  });

  const removeMut = useMutation({
    mutationFn: (userId: number) => api.delete(`/organizations/${activeOrg!.id}/members/${userId}`),
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: ["team", activeOrg?.id] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to remove member"),
  });

  if (!activeOrg) return null;

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Decide who receives reminders and what type for each deadline.
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <UserPlus className="h-4 w-4" />
          Add member
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Members</h2>
          <p className="text-sm text-slate-500">{members.length} people in {activeOrg.name}</p>
        </div>
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-6 text-sm text-slate-400">Loading…</div>
          ) : members.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No members yet.</div>
          ) : (
            members.map((member: any) => (
              <div key={member.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <Shield className="h-3 w-3" />
                    {member.role}
                  </span>
                  <span className="text-xs text-slate-500">
                    Email: {member.can_receive_email ? "On" : "Off"} · SMS: {member.can_receive_sms ? "On" : "Off"}
                  </span>
                  {member.role !== "owner" && (
                    <button
                      onClick={() => removeMut.mutate(member.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setInviteOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Add team member</h3>
              <p className="text-sm text-slate-500">They must already have a WatchTower account.</p>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-slate-900">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "member")}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button onClick={() => setInviteOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600">
                Cancel
              </button>
              <button
                onClick={() => inviteMut.mutate()}
                disabled={inviteMut.isPending || !email}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Add member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
