import { requireSession } from "@/lib/auth/session";
import { getClientDetail } from "@/features/customers/service";
import { getNotes } from "@/features/notes/service";
import { NoteComposer } from "@/features/notes/components/note-composer";
import { NoteList } from "@/features/notes/components/note-list";

export default async function NotesPage({
  params,
}: PageProps<"/customers/[id]/notes">) {
  const { id } = await params;
  const session = await requireSession();
  // Re-check scope before reading notes — the layout's check is not enough.
  await getClientDetail(session.matchmakerId, id);
  const notes = await getNotes(id);

  return (
    <div className="flex flex-col gap-5">
      <NoteComposer profileId={id} />
      <NoteList notes={notes} />
    </div>
  );
}
