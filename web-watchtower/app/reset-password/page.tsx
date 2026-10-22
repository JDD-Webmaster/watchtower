"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";
import { AuthField, inputClassName, PasswordField } from "@/components/AuthInputs";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
      toast.success("Password reset successful.");
      setTimeout(() => router.push("/login"), 1500);
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

  const missingTokenOrEmail = !token || !email;

  return (
    <AuthShell
      eyebrow="Set new password"
      heading="Choose something you'll remember."
      body="Enter and confirm your new password to finish resetting your account."
      steps={[
        {
          title: "Pick a strong password",
          body: "Use at least 8 characters — consider something unique to this account.",
        },
        {
          title: "Confirm it",
          body: "Type it twice to make sure there are no typos.",
        },
        {
          title: "Sign in with it",
          body: "You'll be redirected to sign in with your new password.",
        },
      ]}
      highlights={[
        "Reset links are single-use and time-limited",
        "Changing your password signs out old sessions in some setups",
        "If your link expired, just request a new one",
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

      {missingTokenOrEmail && !success ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-medium text-amber-900">
            Invalid or incomplete reset link.
          </p>
          <p className="mt-2 text-sm text-amber-800">
            This link is missing a token or email. Request a new reset link to continue.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Request new link
          </Link>
        </div>
      ) : success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-sm font-medium text-emerald-900">
            Password reset successful.
          </p>
          <p className="mt-2 text-sm text-emerald-800">
            Redirecting you to sign in...
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
          <AuthField id="email" label="Email address" error={fieldErrors.email}>
            <input
              id="email"
              name="email"
              type="email"
              required
              readOnly
              value={email}
              className={inputClassName(Boolean(fieldErrors.email)) + " bg-slate-50"}
            />
          </AuthField>

          <PasswordField
            id="password"
            label="New password"
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
            placeholder="At least 8 characters"
          />

          <PasswordField
            id="password_confirmation"
            label="Confirm new password"
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
            error={fieldErrors.password_confirmation}
            placeholder="Re-enter your password"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Resetting password…" : "Reset password"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link
          href="/login"
          className="font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700"
        >
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
