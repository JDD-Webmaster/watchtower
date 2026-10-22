"use client";
import { useState, type ReactNode } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

const fieldBase =
  "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500";

const fieldIdle = "border-slate-300 focus:border-slate-900 focus:ring-slate-900/10";
const fieldInvalid = "border-red-400 focus:border-red-500 focus:ring-red-500/20";

interface AuthFieldProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

/** Label + control + inline error, shared by the login and register forms. */
export function AuthField({ id, label, hint, error, children }: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Spread onto the <input> so the border/focus ring reacts to the error state. */
export function inputClassName(hasError?: boolean) {
  return `${fieldBase} ${hasError ? fieldInvalid : fieldIdle}`;
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}

/** Password input with a show/hide toggle. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete = "current-password",
  required = true,
  minLength,
  placeholder,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`${inputClassName(Boolean(error))} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </AuthField>
  );
}
