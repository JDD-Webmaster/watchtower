"use client";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Mail, MessageSquare, Send } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function SupportPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/support", form);
      toast.success("Support request sent to hello@uselodger.com");
      setForm({ ...form, subject: "", message: "" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support</h1>
        <p className="mt-1 text-sm text-slate-500">
          Need help? Reach us directly — we read every message.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Send a message</h2>
            <p className="text-sm text-slate-500">We&apos;ll reply to hello@uselodger.com</p>
          </div>
          <form onSubmit={submit} className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-900">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">Subject</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Billing, SMS not sending, bug report..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">Message</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your issue or question..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h3 className="font-semibold text-slate-900">Other ways to reach us</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <a href="mailto:hello@uselodger.com" className="text-sm text-slate-600 underline underline-offset-2">
                    hello@uselodger.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">GitHub Issues</p>
                  <a
                    href="https://github.com/JDD-Webmaster/watchtower/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-slate-600 underline underline-offset-2"
                  >
                    Report a bug or request a feature
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>
            </ul>
          </section>
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h3 className="font-semibold text-amber-900">SMS costs</h3>
            <p className="mt-2 text-sm text-amber-800">
              SMS messages incur provider charges. Each organisation uses its own dedicated wallet to
              fund SMS. We never charge from the platform owner&apos;s account. Fund your wallet to keep
              SMS reminders going.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
