"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { AuthField, inputClassName, PasswordField } from "@/components/AuthInputs";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, refetchUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Already signed in? Don't make them re-authenticate to reach a page they
  // can already open.
  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      await api.post("/login", { email, password });
      refetchUser();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        // Laravel returns a 422 with per-field messages. Show them against the
        // field they belong to instead of dumping them in a toast.
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
      eyebrow="Welcome back"
      heading="Pick up where you left off."
      body="Your deadlines are exactly where you left them. Sign in and we'll tell you what's due next."
      steps={[
        {
          title: "See what's next",
          body: "Your dashboard sorts everything by how soon it is due, overdue first.",
        },
        {
          title: "Get reminded, not nagged",
          body: "SMS and email go out on the schedule you set, to every owner on the account.",
        },
        {
          title: "Mark it done",
          body: "Tick it off and the next recurrence is scheduled automatically.",
        },
      ]}
      highlights={[
        "Reminders by SMS and email on both channels by default",
        "30, 14, 7 and 1 day warnings before every deadline",
        "Open source — run the whole thing yourself if you'd rather",
      ]}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Welcome back. Enter your details to continue.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate={false}>
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
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className={inputClassName(Boolean(fieldErrors.email))}
          />
        </AuthField>

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          placeholder="••••••••"
        />

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700"
        >
          Create one free
        </Link>
      </p>
    </AuthShell>
  );
}
