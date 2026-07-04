import type { Metadata } from "next";
import { ComingSoonLine, NotebookStub } from "@/components/shared/notebook-stub";

export const metadata: Metadata = {
  title: "Pathways",
  description:
    "Structured career roadmaps for Indian college students — Java Full-Stack, DSA, and more, with resources in English, Tamil, and Hindi.",
};

export default function PathwaysPage() {
  return (
    <NotebookStub scribble="the maps —" title="Pick your path">
      <p>
        One goal, one map, no tutorial-hopping. Java Full-Stack comes first —
        modules, topics, and resources in your language.
      </p>
      <p>The maps are being drawn right now. Check back soon.</p>
      <ComingSoonLine />
    </NotebookStub>
  );
}
