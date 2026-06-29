import { redirect } from "next/navigation";

/** Composer is disabled — bulk generation lives in Arena. */
export default function ComposerRedirect() {
  redirect("/studio");
}
