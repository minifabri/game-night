import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { GameConsole } from "@/components/admin/GameConsole";
import { ActiveGameProvider } from "@/components/game/ActiveGameProvider";

export const metadata: Metadata = {
  title: "Console — Game Night",
  robots: { index: false, follow: false },
};

export default async function GameConsolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authed = await isAdminAuthenticated();
  return authed ? (
    <ActiveGameProvider>
      <GameConsole gameId={id} />
    </ActiveGameProvider>
  ) : (
    <AdminLogin />
  );
}
