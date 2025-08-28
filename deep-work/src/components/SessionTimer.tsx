import React, { useMemo } from "react";
import { useFocusSession } from "../hooks/useFocusSession";

export default function SessionTimer() {
  const { session, remainingMs, stop } = useFocusSession();
  if (!session) return null;

  const remainingText = useMemo(() => {
    const ms = Math.max(0, remainingMs);
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [remainingMs]);

  return (
    <div className="flex-1 min-h-0 rounded-2xl bg-white/95 border border-slate-100 shadow p-6 flex flex-col items-center justify-between">
      <div className="text-center">
        <div className="text-base font-medium">{session.task}</div>
        <div className="text-slate-500 text-sm mt-1">
          {session.type === "pomodoro" ? "Pomodoro Session" : "Focus Session"} • {Math.round(session.durationMs/60000)}min
        </div>
      </div>

      <div className="text-5xl font-semibold">{remainingText}</div>

      <div className="flex gap-3">
        <button className="rounded-lg border px-3 py-2 hover:bg-slate-50" onClick={stop}>
          Stop
        </button>
      </div>
    </div>
  );
}
