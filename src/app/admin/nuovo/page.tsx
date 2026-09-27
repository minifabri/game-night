import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { NewGameForm } from "@/components/admin/NewGameForm";

export const metadata: Metadata = {
  title: "Nuovo gioco — Game Night",
  robots: { index: false, follow: false },
};

export default async function NewGamePage() {
  const authed = await isAdminAuthenticated();
  return authed ? <NewGameForm /> : <AdminLogin />;
}
