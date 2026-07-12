"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Play, RotateCcw, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/components/auth/use-user";
import {
  computeWpm,
  detectFillers,
  diffAccuracy,
  FILLERS,
  longestPause,
  wpmVerdict,
  type DiffToken,
  type FillerCount,
} from "@/lib/speech/metrics";
import { cn } from "@/lib/utils";

// Minimal Web Speech API typings (not in the default DOM lib).
type SpeechRecognitionResult = { transcript: string; isFinal?: boolean };
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<SpeechRecognitionResult> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Phase = "idle" | "recording" | "done";

type Results = {
  durationS: number;
  wpm: number;
  fillers: FillerCount[];
  fillerTotal: number;
  longestPauseS: number;
  accuracyPct: number | null;
  diff: DiffToken[] | null;
  transcript: string;
};

export function Recorder({
  prompt,
}: {
  prompt: {
    id: string;
    kind: "hr_question" | "reading_passage";
    title: string;
    prompt_md: string;
  };
}) {
  const { user } = useUser();
  const isReading = prompt.kind === "reading_passage";

  const [supported, setSupported] = useState<{
    mic: boolean;
    recognition: boolean;
  } | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [saveTranscript, setSaveTranscript] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const finalRef = useRef("");
  const startedRef = useRef(0);
  const resultTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const mic = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    setSupported({ mic, recognition: !!getSpeechRecognition() });
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    if (recorderRef.current && recorderRef.current.state !== "inactive")
      recorderRef.current.stop();
  }, []);

  const finalize = useCallback(() => {
    const durationS = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
    const transcript = finalRef.current.trim();
    const { counts, total } = detectFillers(transcript);
    const wpm = computeWpm(transcript, durationS);
    const acc = isReading ? diffAccuracy(prompt.prompt_md, transcript) : null;
    setResults({
      durationS,
      wpm,
      fillers: counts,
      fillerTotal: total,
      longestPauseS: longestPause(resultTimesRef.current),
      accuracyPct: acc ? acc.accuracyPct : null,
      diff: acc ? acc.diff : null,
      transcript,
    });
    setPhase("done");
  }, [isReading, prompt.prompt_md]);

  const start = useCallback(async () => {
    setError(null);
    setResults(null);
    setSaved(false);
    setInterim("");
    finalRef.current = "";
    resultTimesRef.current = [];
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was blocked. Allow it in your browser and try again.");
      return;
    }
    streamRef.current = stream;

    // MediaRecorder for local playback only — the blob never leaves here.
    try {
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((t) => t.stop());
        finalize();
      };
      recorderRef.current = rec;
      rec.start();
    } catch {
      setError("This browser can't record audio. Try Chrome or Edge.");
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    const SR = getSpeechRecognition();
    if (SR) {
      const recog = new SR();
      recog.lang = "en-IN";
      recog.continuous = true;
      recog.interimResults = true;
      recog.onresult = (e) => {
        resultTimesRef.current.push(Date.now());
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i][0];
          if (e.results[i].isFinal) finalRef.current += r.transcript + " ";
          else live += r.transcript;
        }
        setInterim(live);
      };
      recog.onerror = (ev) => {
        if (ev.error === "no-speech" || ev.error === "aborted") return;
        if (ev.error === "network")
          setError("The speech engine needs internet — reconnect, or use read-aloud playback to self-review.");
      };
      recognitionRef.current = recog;
      try {
        recog.start();
      } catch {
        /* already started */
      }
    }

    startedRef.current = Date.now();
    setPhase("recording");
  }, [finalize]);

  // Hold Space to record (ignore when typing in a field).
  useEffect(() => {
    function isTyping(el: EventTarget | null) {
      const t = el as HTMLElement | null;
      return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    }
    function down(e: KeyboardEvent) {
      if (e.code === "Space" && !e.repeat && phase !== "recording" && !isTyping(e.target)) {
        e.preventDefault();
        start();
      }
    }
    function up(e: KeyboardEvent) {
      if (e.code === "Space" && phase === "recording" && !isTyping(e.target)) {
        e.preventDefault();
        stop();
      }
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, start, stop]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function save() {
    if (!results) return;
    setSaving(true);
    try {
      const res = await fetch("/api/speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: prompt.id,
          mode: prompt.kind,
          durationS: results.durationS,
          wpm: results.wpm,
          fillerCount: results.fillerTotal,
          fillers: results.fillers,
          accuracyPct: results.accuracyPct,
          transcript: saveTranscript ? results.transcript : null,
        }),
      });
      if (res.ok) setSaved(true);
      else setError("Couldn't save — but your practice still counts.");
    } catch {
      setError("Couldn't save — check your connection.");
    } finally {
      setSaving(false);
    }
  }

  if (supported === null) return null;

  if (!supported.mic)
    return (
      <div className="rounded-lg border border-margin/40 bg-margin/5 p-5 text-sm">
        <p className="font-medium">This browser can&apos;t reach a microphone.</p>
        <p className="mt-1 text-muted-foreground">
          Open Fledge in Chrome or Edge on a device with a mic to practice out
          loud.
        </p>
      </div>
    );

  const noRecognition = !supported.recognition;

  return (
    <div>
      {/* record control */}
      <div className="flex flex-col items-center gap-3 rounded-lg border border-rule bg-card p-6">
        {phase !== "done" ? (
          <button
            type="button"
            onClick={phase === "recording" ? stop : start}
            className={cn(
              "flex size-20 items-center justify-center rounded-full border-2 transition-colors",
              phase === "recording"
                ? "animate-pulse border-margin bg-margin/10 text-margin"
                : "border-ballpoint bg-accent text-ballpoint hover:bg-accent/70"
            )}
            aria-label={phase === "recording" ? "Stop recording" : "Start recording"}
          >
            {phase === "recording" ? (
              <Square className="size-7" aria-hidden="true" />
            ) : (
              <Mic className="size-8" aria-hidden="true" />
            )}
          </button>
        ) : (
          <Button variant="outline" onClick={start}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        )}
        <p className="font-mono text-xs text-muted-foreground">
          {phase === "recording"
            ? "recording… tap to stop (or release Space)"
            : phase === "done"
              ? "done — see below"
              : "tap to record, or hold Space"}
        </p>
        {noRecognition && phase === "idle" && (
          <p className="max-w-sm text-center text-xs text-muted-foreground">
            Your browser won&apos;t transcribe live, so we can&apos;t score pace or
            fillers here — but you can still record, play back, and self-review.
            Chrome or Edge unlock the full scoring.
          </p>
        )}
      </div>

      {/* live transcript */}
      {phase === "recording" && (
        <div className="mt-4 min-h-16 rounded-lg border border-rule bg-card p-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            live
          </p>
          <p className="mt-1 leading-relaxed">
            {finalRef.current}
            <span className="text-muted-foreground">{interim}</span>
            {!finalRef.current && !interim && (
              <span className="text-muted-foreground">listening…</span>
            )}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-margin/40 bg-margin/5 p-3 text-sm text-margin">
          {error}
        </p>
      )}

      {/* results */}
      {phase === "done" && results && (
        <div className="mt-5 space-y-5">
          <Positive results={results} isReading={isReading} hadRecognition={!noRecognition} />

          {audioUrl && (
            <div className="rounded-lg border border-rule bg-card p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Play className="size-4 text-ballpoint" aria-hidden="true" />
                Hear yourself back
              </p>
              <audio controls src={audioUrl} className="w-full" />
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                this clip stays in your browser — closing the tab deletes it
              </p>
            </div>
          )}

          {!noRecognition && results.transcript && (
            <>
              <WpmGauge wpm={results.wpm} durationS={results.durationS} />

              <div className="rounded-lg border border-rule bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Filler words</p>
                  <span className="font-mono text-sm">
                    {results.fillerTotal} total
                    {results.longestPauseS > 0 && (
                      <span className="ml-3 text-muted-foreground">
                        longest pause {results.longestPauseS}s
                      </span>
                    )}
                  </span>
                </div>
                {results.fillers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {results.fillers.map((f) => (
                      <span key={f.filler} className="rounded-full border border-margin/40 px-2 py-0.5 font-mono text-[11px] text-margin">
                        {f.filler} ×{f.count}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-sm leading-relaxed">
                  <TranscriptWithFillers text={results.transcript} />
                </p>
              </div>

              {isReading && results.diff && (
                <div className="rounded-lg border border-rule bg-card p-4">
                  <p className="text-sm font-medium">
                    Read accuracy: <span className="text-verdict">{results.accuracyPct}%</span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <ReadDiff diff={results.diff} />
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    <span className="text-margin">red</span> = missed or changed ·{" "}
                    <span className="text-muted-foreground">grey</span> = extra word
                  </p>
                </div>
              )}
            </>
          )}

          {/* save */}
          {user ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule bg-card p-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={saveTranscript} onCheckedChange={setSaveTranscript} />
                Also save the transcript text (your call)
              </label>
              <Button onClick={save} disabled={saving || saved}>
                {saved ? (
                  <>
                    <Check className="size-4" aria-hidden="true" /> Saved
                  </>
                ) : (
                  <>
                    <Save className="size-4" aria-hidden="true" /> {saving ? "Saving…" : "Save session"}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-rule p-4 text-sm text-muted-foreground">
              Sign in to save these numbers and track your pace over time. The
              recording stays on your device either way.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Positive({
  results,
  isReading,
  hadRecognition,
}: {
  results: Results;
  isReading: boolean;
  hadRecognition: boolean;
}) {
  let line = "You showed up and said it out loud — that's the hard part.";
  if (hadRecognition) {
    if (isReading && (results.accuracyPct ?? 0) >= 90)
      line = "Crisp read — that's interview-clear.";
    else if (!isReading && wpmVerdict(results.wpm) === "good" && results.fillerTotal <= 2)
      line = "Steady pace, barely any fillers — that's a strong answer.";
    else if (results.fillerTotal <= 3)
      line = "Good control — the fillers were few and far between.";
  }
  return <p className="font-hand text-2xl text-verdict">{line}</p>;
}

function WpmGauge({ wpm, durationS }: { wpm: number; durationS: number }) {
  const verdict = wpmVerdict(wpm);
  const pct = Math.min(100, (wpm / 200) * 100);
  const label = verdict === "slow" ? "a touch slow" : verdict === "fast" ? "a touch fast" : "right in the band";
  return (
    <div className="rounded-lg border border-rule bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Pace: <span className="font-mono">{wpm} wpm</span>{" "}
          <span className={cn(verdict === "good" ? "text-verdict" : "text-muted-foreground")}>
            — {label}
          </span>
        </p>
        <span className="font-mono text-xs text-muted-foreground">{durationS}s</span>
      </div>
      {/* meter 0–200, target band 110–150 */}
      <div className="relative mt-3 h-3 rounded-full bg-secondary">
        <div
          className="absolute inset-y-0 rounded-full bg-verdict/25"
          style={{ left: `${(110 / 200) * 100}%`, width: `${((150 - 110) / 200) * 100}%` }}
        />
        <div
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-ballpoint"
          style={{ left: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
        target 110–150 wpm — fast enough to sound confident, slow enough to follow
      </p>
    </div>
  );
}

function TranscriptWithFillers({ text }: { text: string }) {
  // Highlight list fillers inline (case-insensitive whole word/phrase).
  const pattern = FILLERS.map((f) => f.replace(/ /g, "\\s+")).join("|");
  const re = new RegExp(`\\b(${pattern})\\b`, "gi");
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <mark key={key++} className="rounded bg-margin/15 px-0.5 text-margin">
        {m[0]}
      </mark>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function ReadDiff({ diff }: { diff: DiffToken[] }) {
  return (
    <>
      {diff.map((d, i) => {
        if (d.status === "match") return <span key={i}>{d.word} </span>;
        if (d.status === "extra")
          return (
            <span key={i} className="text-muted-foreground line-through">
              {d.word}{" "}
            </span>
          );
        return (
          <span key={i} className="rounded bg-margin/15 px-0.5 text-margin">
            {d.word}{" "}
          </span>
        );
      })}
    </>
  );
}
