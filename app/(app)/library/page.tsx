import { redirect } from "next/navigation";

/** Legacy path — the gallery lives at /gallery. */
export default function LibraryRedirect() {
  redirect("/gallery");
}
