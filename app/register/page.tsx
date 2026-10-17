"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { refetchUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    organization_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/register", form);
      refetchUser();
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">
          Takes a minute. No credit card — WatchTower is free.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Your name">
            <input required className="input" {...field("name")} />
          </Field>
          <Field label="Email">
            <input type="email" required className="input" {...field("email")} />
          </Field>
          <Field label="Password">
            <input type="password" required minLength={8} className="input" {...field("password")} />
          </Field>
          <Field label="Confirm password">
            <input type="password" required className="input" {...field("password_confirmation")} />
          </Field>
          <Field label="Organization / business name" hint="You can add more later and switch between them.">
            <input required className="input" {...field("organization_name")} />
          </Field>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-500 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-slate-900 font-medium underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
