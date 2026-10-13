import { FileText, Phone, Users } from "lucide-react";
import { relativeTime } from "@/lib/format";
import type { NoteRow } from "../repo";

const ICONS = { CALL: Phone, MEETING: Users, GENERAL: FileText };
const DATETIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function NoteList({ notes }: { notes: NoteRow[] }) {
  if (notes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-5 py-10 text-center text-sm text-fg-muted">
        No notes yet. The first one you add will appear here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.map((note) => {
        const Icon = ICONS[note.type];
        return (
          <li key={note.id} className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-2 flex items-center gap-2 text-[13px] text-fg-muted">
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="font-medium text-fg">{note.author.name}</span>
              <span aria-hidden>·</span>
              <time dateTime={note.createdAt.toISOString()} title={DATETIME.format(note.createdAt)}>
                {relativeTime(note.createdAt)}
              </time>
            </div>
            <p className="text-sm whitespace-pre-wrap text-fg">{note.body}</p>
          </li>
        );
      })}
    </ul>
  );
}
