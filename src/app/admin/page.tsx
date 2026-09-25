import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin — Palestrati vs Divanisti",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  return authed ? <AdminDashboard /> : <AdminLogin />;
}
