import type { Metadata } from "next";
import { ComingSoonLine, NotebookStub } from "@/components/shared/notebook-stub";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your week's plan, progress, and streak.",
};

export default function DashboardPage() {
  return (
    <NotebookStub scribble="this week —" title="Your week, planned">
      <p>
        Once sign-in lands: this week&apos;s plan first — what to learn, what
        to practice, what to say out loud — each with its reason. Then your
        progress, solves, and streak.
      </p>
      <ComingSoonLine />
    </NotebookStub>
  );
}
