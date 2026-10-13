import { redirect } from "next/navigation";

// Becomes /customers once the dashboard lands.
export default function Home() {
  redirect("/login");
}
