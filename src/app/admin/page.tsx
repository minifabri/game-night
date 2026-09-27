import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ActiveGameProvider } from "@/components/game/ActiveGameProvider";

export const metadata: Metadata = {
  title: "Admin — Game Night",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  return authed ? (
    <ActiveGameProvider>
      <AdminDashboard />
    </ActiveGameProvider>
  ) : (
    <AdminLogin />
  );
}
