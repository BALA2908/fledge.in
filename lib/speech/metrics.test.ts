import { describe, expect, it } from "vitest";
import {
  computeWpm,
  detectFillers,
  diffAccuracy,
  longestPause,
  wordCount,
  wpmVerdict,
} from "./metrics";

describe("computeWpm", () => {
  it("counts words per minute", () => {
    // 20 words in 10s = 120 wpm
    const text = Array.from({ length: 20 }, () => "word").join(" ");
    expect(computeWpm(text, 10)).toBe(120);
  });
  it("returns 0 for empty text or zero duration", () => {
    expect(computeWpm("", 10)).toBe(0);
    expect(computeWpm("hello world", 0)).toBe(0);
  });
  it("ignores punctuation in the word count", () => {
    expect(wordCount("Hello, world! It's me.")).toBe(4);
  });
});

describe("wpmVerdict", () => {
  it("bands around the 110–150 target", () => {
    expect(wpmVerdict(90)).toBe("slow");
    expect(wpmVerdict(110)).toBe("good");
    expect(wpmVerdict(150)).toBe("good");
    expect(wpmVerdict(180)).toBe("fast");
  });
});

describe("detectFillers", () => {
  it("counts common fillers case-insensitively", () => {
    const { total, counts } = detectFillers("Um, I basically think, uh, it works. Um yeah.");
    expect(total).toBe(4); // um ×2, basically, uh
    expect(counts.find((c) => c.filler === "um")?.count).toBe(2);
  });
  it("matches multi-word fillers without double-counting", () => {
    const { counts } = detectFillers("you know, it is, you know, fine");
    expect(counts.find((c) => c.filler === "you know")?.count).toBe(2);
  });
  it("counts 'so' ONLY at sentence start", () => {
    const { counts } = detectFillers("So I began. I did so well. So then it worked.");
    expect(counts.find((c) => c.filler === "so")?.count).toBe(2);
  });
  it("does not flag 'so' mid-sentence only", () => {
    const { counts } = detectFillers("It was so good and so fast.");
    expect(counts.find((c) => c.filler === "so")).toBeUndefined();
  });
  it("does not match fillers inside other words", () => {
    // "likely" must not count as "like"; "actually" is itself a filler though
    const { counts } = detectFillers("It is likely correct.");
    expect(counts.find((c) => c.filler === "like")).toBeUndefined();
  });
});

describe("longestPause", () => {
  it("finds the biggest gap in seconds", () => {
    expect(longestPause([0, 500, 3200, 3400])).toBe(2.7);
  });
  it("returns 0 for fewer than two timestamps", () => {
    expect(longestPause([])).toBe(0);
    expect(longestPause([100])).toBe(0);
  });
});

describe("diffAccuracy", () => {
  it("100% for an exact read", () => {
    const { accuracyPct } = diffAccuracy("The quick brown fox", "the quick brown fox");
    expect(accuracyPct).toBe(100);
  });
  it("penalises skipped/wrong target words", () => {
    const { accuracyPct, diff } = diffAccuracy("the quick brown fox", "the brown fox");
    expect(accuracyPct).toBe(75); // 3 of 4 target words matched
    expect(diff.find((d) => d.word === "quick")?.status).toBe("wrong");
  });
  it("marks extra spoken words without lowering matched-target accuracy", () => {
    const { accuracyPct, diff } = diffAccuracy("hello world", "hello there world");
    expect(accuracyPct).toBe(100);
    expect(diff.some((d) => d.status === "extra" && d.word === "there")).toBe(true);
  });
  it("is punctuation- and case-insensitive", () => {
    expect(diffAccuracy("An API, simply.", "an api simply").accuracyPct).toBe(100);
  });
  it("handles an empty target", () => {
    expect(diffAccuracy("", "anything").accuracyPct).toBe(0);
  });
});
