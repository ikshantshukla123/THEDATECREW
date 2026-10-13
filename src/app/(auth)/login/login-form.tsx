"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof LoginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    // TODO: replace with the `login` server action.
    void values;
    setFormError("Authentication is not wired up yet.");
  }

  const fieldClass =
    "w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-fg " +
    "placeholder:text-fg-subtle transition-colors hover:border-fg-subtle/60";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-fg-muted">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@thedatingcompany.in"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={fieldClass}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1.5 text-xs text-danger">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-fg-muted">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`${fieldClass} pr-11`}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-fg-subtle transition-colors hover:text-fg-muted"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" role="alert" className="mt-1.5 text-xs text-danger">
            {errors.password.message}
          </p>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-md border border-danger/25 bg-danger/8 px-3.5 py-2.5 text-xs text-danger"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-[22px] font-semibold text-primary-fg transition-[background-color,transform] hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>

      {process.env.NODE_ENV !== "production" && (
        <div className="rounded-md border border-border bg-surface-muted px-3.5 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-fg-muted uppercase">
            Demo credentials
          </p>
          <p className="mt-1.5 font-mono text-xs text-fg-muted">
            Seeded in milestone 1 — see README.
          </p>
        </div>
      )}
    </form>
  );
}
