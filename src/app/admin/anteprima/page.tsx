import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/auth";
import { DisplayPreview } from "@/components/admin/preview/DisplayPreview";

export const metadata: Metadata = {
  title: "Anteprima — Game Night",
  robots: { index: false, follow: false },
};

/** Rendered inside the content editor's preview frame only. */
export default async function PreviewPage() {
  const authed = await isAdminAuthenticated();
  return authed ? <DisplayPreview /> : null;
}
