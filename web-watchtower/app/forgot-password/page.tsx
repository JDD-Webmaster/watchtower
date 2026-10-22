"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";
import { AuthField, inputClassName } from "@/components/AuthInputs";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      await api.post("/forgot-password", { email });
      setSent(true);
      toast.success("If an account exists, we've sent a reset link.");
    } catch (err) {
      if (err instanceof ApiError) {
        const next: Record<string, string> = {};
        for (const [field, messages] of Object.entries(err.errors ?? {})) {
          if (messages?.length) next[field] = messages[0];
        }
        setFieldErrors(next);
        if (Object.keys(next).length === 0) setFormError(err.message);
        else toast.error(err.message);
      } else {
        setFormError("Could not reach the server. Check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Reset password"
      heading="Get a link to reset it."
      body="Enter the email address associated with your account and we'll send you a link to set a new password."
      steps={[
        {
          title: "Check your inbox",
          body: "We'll email you a secure reset link if an account exists.",
        },
        {
          title: "Choose a new password",
          body: "Click the link and pick a strong password for your account.",
        },
        {
          title: "Sign back in",
          body: "Use your new password to sign in and get back to your deadlines.",
        },
      ]}
      highlights={[
        "Links expire quickly for security",
        "We don't reveal whether an email is registered",
        "Email delivery uses your configured mail transport",
      ]}
    >
      {formError && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      {sent ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-sm font-medium text-emerald-900">
            Check your email for a reset link.
          </p>
          <p className="mt-2 text-sm text-emerald-800">
            If an account exists with {email}, you&apos;ll receive an email shortly.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
          <AuthField id="email" label="Email address" error={fieldErrors.email}>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              className={inputClassName(Boolean(fieldErrors.email))}
            />
          </AuthField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Sending link…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
