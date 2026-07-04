import type { Metadata } from "next";
import { ComingSoonLine, NotebookStub } from "@/components/shared/notebook-stub";

export const metadata: Metadata = {
  title: "Speak",
  description:
    "In-browser speaking practice — answer HR questions out loud, see your pace and filler words. Your voice never leaves your device.",
};

export default function SpeakPage() {
  return (
    <NotebookStub scribble="say it out loud —" title="Train your voice">
      <p>
        Answer real HR questions out loud. See your pace, your filler words,
        and hear yourself back.
      </p>
      <p>
        The Communication Lab is on its way. Everything runs in your browser
        — your voice never leaves this device.
      </p>
      <ComingSoonLine />
    </NotebookStub>
  );
}
