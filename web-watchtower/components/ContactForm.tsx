"use client";
import { useMemo, useState } from "react";
import { Check, Copy, Mail, Send } from "lucide-react";

const subjects = [
  { value: "General enquiry", label: "General enquiry" },
  { value: "Access my data", label: "Access my data" },
  { value: "Delete my account", label: "Delete my account" },
  { value: "Export my data", label: "Export my data" },
  { value: "Security disclosure", label: "Security disclosure" },
];

// There is no contact API — a form POST would need an inbox and a spam
// filter. Instead this composes a prefilled email and hands it to the user's
// mail client, with a copy-to-clipboard escape hatch for people using a web
// mail provider that has no local client.
export function ContactForm({ email }: { email: string }) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState(subjects[0].value);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const body = useMemo(() => {
    const lines = [
      `Name: ${name || "(your name)"}`,
      `Email: ${from || "(your email)"}`,
      `Subject: ${subject}`,
      "",
      message || "(your message)",
    ];
    return lines.join("\n");
  }, [name, from, subject, message]);

  const mailto = `mailto:${email}?subject=${encodeURIComponent(
    `[${subjectTag(subject)}] WatchTower enquiry`,
  )}&body=${encodeURIComponent(body)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(
      `To: ${email}\nSubject: ${subject}\n\n${body}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = mailto;
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium text-slate-900"
          >
            Your name
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ade John"
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-slate-900"
          >
            Your email
          </label>
          <input
            id="contact-email"
            type="email"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="you@company.com"
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="block text-sm font-medium text-slate-900"
        >
          What&apos;s this about?
        </label>
        <select
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          {subjects.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-slate-900"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you need. If it's a data request, include the email address on the account so we can find it."
          className="mt-1.5 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
        >
          <Send className="h-4 w-4" />
          Open in your mail app
        </button>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied" : "Copy instead"}
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <Mail className="h-3.5 w-3.5" />
          {email}
        </span>
      </div>
    </form>
  );
}

function subjectTag(subject: string) {
  return subject.replace(/[^A-Za-z ]/g, "").trim();
}
