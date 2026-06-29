import { redirect } from "next/navigation";

// Legacy path — the studio moved to /studio.
export default function ArenaRedirect() {
  redirect("/studio");
}
