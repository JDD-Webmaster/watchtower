"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import {
  AuthField,
  inputClassName,
  PasswordField,
} from "@/components/AuthInputs";

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading, refetchUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    organization_name: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      await api.post("/register", form);
      refetchUser();
      router.push("/dashboard");
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
        setFormError(
          "Could not reach the server. Check your connection and try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const mismatch =
    form.password_confirmation.length > 0 &&
    form.password !== form.password_confirmation;

  return (
    <AuthShell
      eyebrow="Get started"
      heading="Set it up once. Stop thinking about it."
      body="Most people are done in under two minutes. Here's exactly what happens after you sign up."
      steps={[
        {
          title: "Create your workspace",
          body: "One organisation holds your deadlines. Add more later and switch between them.",
        },
        {
          title: "Log your first deadline",
          body: "A domain, a licence, a levy — give it a due date and we'll take it from there.",
        },
        {
          title: "Add your phone number",
          body: "Turn on SMS and we start nudging you before it's too late to act.",
        },
      ]}
      highlights={[
        "Free to use, and the code is MIT licensed",
        "Self-host it in one docker compose up if you prefer",
        "Export or delete your data whenever you want",
      ]}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Takes a minute. No credit card, no sales call.
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

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <AuthField id="name" label="Your name" error={fieldErrors.name}>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Ade John"
            {...field("name")}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            className={inputClassName(Boolean(fieldErrors.name))}
          />
        </AuthField>

        <AuthField id="email" label="Work email" error={fieldErrors.email}>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            {...field("email")}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className={inputClassName(Boolean(fieldErrors.email))}
          />
        </AuthField>

        <AuthField
          id="organization_name"
          label="Organisation"
          error={fieldErrors.organization_name}
        >
          <input
            id="organization_name"
            name="organization_name"
            required
            autoComplete="organization"
            placeholder="Okonkwo Properties Ltd"
            {...field("organization_name")}
            aria-invalid={Boolean(fieldErrors.organization_name)}
            aria-describedby={
              fieldErrors.organization_name
                ? "organization_name-error"
                : "organization_name-hint"
            }
            className={inputClassName(Boolean(fieldErrors.organization_name))}
          />
        </AuthField>
        {!fieldErrors.organization_name && (
          <p
            id="organization_name-hint"
            className="-mt-2 text-xs text-slate-500"
          >
            You can add more later and switch between them.
          </p>
        )}

        <PasswordField
          id="password"
          label="Password"
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          error={fieldErrors.password}
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
        />
        <PasswordStrength password={form.password} />

        <PasswordField
          id="password_confirmation"
          label="Confirm password"
          value={form.password_confirmation}
          onChange={(v) => setForm((f) => ({ ...f, password_confirmation: v }))}
          error={
            fieldErrors.password_confirmation ??
            (mismatch ? "Passwords do not match." : undefined)
          }
          hint={
            form.password_confirmation.length > 0 && !mismatch ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                Passwords match
              </span>
            ) : undefined
          }
          autoComplete="new-password"
          placeholder="Repeat your password"
        />

        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/20"
          />
          <label
            htmlFor="terms"
            className="text-xs leading-relaxed text-slate-600"
          >
            I agree to the{" "}
            <Link
              href="/legal/terms"
              target="_blank"
              className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              target="_blank"
              className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              Privacy Policy
            </Link>
            , including sending me reminders by SMS and email.
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating your account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
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

const strengthLevels = [
  { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Weak", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", bar: "bg-lime-500", text: "text-lime-600" },
  { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-600" },
];

/** Cheap client-side strength signal. The server only enforces a minimum
 *  length — this is guidance, not a security control. */
function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    if (!password) return 0;
    let points = 0;
    if (password.length >= 8) points++;
    if (password.length >= 12) points++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
    if (/\d/.test(password)) points++;
    if (/[^A-Za-z0-9]/.test(password)) points++;
    return Math.min(4, Math.ceil(points / 1.25));
  }, [password]);

  if (!password) return null;

  const level = strengthLevels[Math.max(0, score - 1)];

  return (
    <div className="-mt-1 flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? level.bar : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${level.text}`}>{level.label}</span>
    </div>
  );
}
