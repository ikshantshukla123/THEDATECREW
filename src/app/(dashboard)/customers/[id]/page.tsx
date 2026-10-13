import { redirect } from "next/navigation";

export default async function ClientPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  redirect(`/customers/${id}/biodata`);
}
