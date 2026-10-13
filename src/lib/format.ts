/** Formatters live at the UI edge; the DB stores INR integers and centimetres. */

export function formatIncome(annualIncome: number): string {
  const lakhs = annualIncome / 100_000;
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(1)} Cr`;
  return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)} L`;
}

export function formatHeight(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  return `${Math.floor(totalInches / 12)}′ ${totalInches % 12}″`;
}

export function age(dateOfBirth: Date): number {
  const diff = Date.now() - dateOfBirth.getTime();
  return Math.floor(diff / 31_557_600_000);
}

export function relativeTime(date: Date | null): string {
  if (!date) return "Never";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export const NEEDS_ATTENTION_DAYS = 14;

export function needsAttention(lastContactAt: Date | null): boolean {
  if (!lastContactAt) return true;
  return Date.now() - lastContactAt.getTime() > NEEDS_ATTENTION_DAYS * 86_400_000;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
