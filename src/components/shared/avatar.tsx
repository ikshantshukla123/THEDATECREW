import Image from "next/image";
import { cn } from "@/lib/utils";

/** Deterministic tint from the name, so a person keeps the same colour. */
const TINTS = [
  "bg-primary-soft text-primary",
  "bg-accent-soft text-accent-text",
  "bg-verified-soft text-verified",
  "bg-surface-muted text-fg-muted",
];

function tintFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

type Props = {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  /** Rendered pixel size for the circle variant. */
  size?: number;
  className?: string;
};

export function Avatar({ firstName, lastName, photoUrl, size = 40, className }: Props) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const name = `${firstName} ${lastName}`;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
        !photoUrl && tintFor(name),
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={`Photo of ${firstName}`}
          fill
          sizes={`${size}px`}
          className="object-cover"
          style={{ objectPosition: "center 30%" }}
        />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </span>
  );
}
