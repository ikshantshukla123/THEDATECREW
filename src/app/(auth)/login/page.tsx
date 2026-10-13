import Image from "next/image";
import type { Metadata } from "next";
import { BRAND_IMAGES } from "@/lib/brand-images";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// Hero is picked per request, so this page cannot be prerendered.
export const dynamic = "force-dynamic";

function pickHero() {
  return BRAND_IMAGES[Math.floor(Math.random() * BRAND_IMAGES.length)];
}

export default function LoginPage() {
  const hero = pickHero();

  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative h-44 w-full overflow-hidden sm:h-56 lg:h-auto">
        <Image
          src={hero.src}
          alt=""
          aria-hidden
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          placeholder="blur"
          className="object-cover object-center"
        />

        {/* Scrim keeps the copy legible over any photo in the set. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/10 lg:from-ink/90 lg:via-ink/30 lg:to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-12">
          <p className="font-display text-xl leading-snug text-balance text-white/95 sm:text-2xl lg:max-w-md lg:text-[32px] lg:text-wrap lg:leading-[1.25]">
            Every match begins with someone who listened carefully.
          </p>
          <p className="mt-2 hidden text-sm text-white/70 lg:block">
            The Dating Company · Matchmaker workspace
          </p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 items-center justify-center bg-bg px-5 py-10 sm:px-8 lg:py-12">
        <div className="w-full min-w-0 max-w-[380px]">
          <div className="mb-10 flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-md bg-primary font-display text-sm text-primary-fg"
            >
              T
            </span>
            <span className="text-sm font-semibold tracking-tight text-fg">
              The Dating Company
            </span>
          </div>

          <h1 className="font-display text-[28px] leading-9 text-fg">Welcome back</h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            Sign in to your matchmaker workspace.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-fg-subtle">
            Trouble signing in? Contact your admin.
          </p>
        </div>
      </main>
    </div>
  );
}
