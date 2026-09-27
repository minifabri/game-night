import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { GameEditor } from "@/components/admin/editor/GameEditor";

export const metadata: Metadata = {
  title: "Contenuti — Game Night",
  robots: { index: false, follow: false },
};

export default async function GameContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authed = await isAdminAuthenticated();
  return authed ? <GameEditor gameId={id} /> : <AdminLogin />;
}
