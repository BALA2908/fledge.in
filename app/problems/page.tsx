import type { Metadata } from "next";
import { ComingSoonLine, NotebookStub } from "@/components/shared/notebook-stub";

export const metadata: Metadata = {
  title: "Problems",
  description:
    "Original practice problems with an in-browser judge — Python, Java, C++, and JavaScript.",
};

export default function ProblemsPage() {
  return (
    <NotebookStub scribble="practice daily —" title="Practice till the offer letter">
      <p>
        Original problems — canteen tokens and train seats, not copied
        puzzles. Write code in the browser, run it against real test cases,
        get a verdict.
      </p>
      <p>The problem bank is being written. Python, Java, C++, JavaScript.</p>
      <ComingSoonLine />
    </NotebookStub>
  );
}
