import { redirect } from "next/navigation";

// Legacy route — Ghost Palette uses /sign-in and /sign-up (themed Clerk flow).
export default function LoginPage() {
  redirect("/sign-in");
}
