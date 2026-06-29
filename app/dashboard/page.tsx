import { redirect } from "next/navigation";

// Legacy path — the workspace lives at /studio.
export default function DashboardRedirect() {
  redirect("/studio");
}
