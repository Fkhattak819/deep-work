import React, { useMemo, useState, useEffect } from "react";
import type { SessionType } from "../types";
import { useFocusSession } from "../hooks/useFocusSession";

const PRESETS: Record<SessionType, number> = {
  pomodoro: 25, flow: 90, quick: 15, custom: 25
};

const ClockIcon = ({ filled=false }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" className={filled ? "text-white" : ""} />
    <path d="M12 7v5l3 2" />
  </svg>
);
const ZapIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
  </svg>
);
const TargetIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function SessionForm() {
  const { session, start } = useFocusSession(); // read-only here
  const running = !!session && session.status !== "finished";

  const [task, setTask] = useState("");
  const [type, setType] = useState<SessionType>("pomodoro");
  const [durationMin, setDurationMin] = useState<number>(PRESETS.pomodoro);

  useEffect(() => { if (type !== "custom") setDurationMin(PRESETS[type]); }, [type]);

  const canStart = task.trim().length > 0 && durationMin > 0;

  return (
    <div className="flex-1 min-h-0 rounded-2xl bg-white/95 border border-slate-100 shadow p-4 flex flex-col">
      <h2 className="text-lg font-semibold text-center">Start a Focus Session</h2>
      <p className="text-center text-slate-500 text-sm mt-0.5 mb-3">
        What are you working on today?
      </p>

      <label className="text-xs text-slate-600">Session Title</label>
      <input
        className="mt-1 mb-3 w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="e.g., Algorithms homework…"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        disabled={running}
      />

      <div className="text-xs text-slate-600 mb-1">Session Type</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Pill icon={<ClockIcon />} label="Pomodoro" sub="25min" selected={type==="pomodoro"} onClick={()=>setType("pomodoro")} disabled={running} />
        <Pill icon={<ZapIcon   />} label="Flow State" sub="90min" selected={type==="flow"}     onClick={()=>setType("flow")}     disabled={running} />
        <Pill icon={<TargetIcon/>} label="Quick Focus" sub="15min" selected={type==="quick"}   onClick={()=>setType("quick")}    disabled={running} />
      </div>

      <div className="text-xs text-slate-600 mb-1">Duration (minutes)</div>
      <input
        type="number"
        className="w-full rounded-lg border px-3 py-2 mb-3 text-sm"
        value={durationMin}
        onChange={e => { setType("custom"); setDurationMin(parseInt(e.target.value || "0")) }}
        min={1}
        disabled={running}
      />

      <button
        className="w-full rounded-lg bg-[#601ff5] text-white py-2 text-sm font-medium shadow hover:bg-[#601ff5]/90 disabled:opacity-50"
        onClick={() => start(task.trim() || "Untitled", type, durationMin)}
        disabled={!canStart || running}
      >
        Start Focus Session
      </button>
    </div>
  );
}

function Pill({ icon, label, sub, selected, onClick, disabled }:{
  icon: React.ReactNode; label: string; sub: string;
  selected: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full flex flex-col items-center justify-center text-center",
        "rounded-xl px-3 py-3 transition border shadow-sm",
        selected
          ? "bg-[#601ff5] border-[#601ff5] text-white shadow-[0_8px_20px_-6px_rgba(96,31,245,0.6)]"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow",
      ].join(" ")}
    >
      <div className={["h-6 w-6 mb-1.5 grid place-items-center rounded-full", selected ? "bg-white/20" : "bg-slate-100 text-slate-600"].join(" ")}>
        {icon}
      </div>
      <div className={`text-xs font-semibold ${selected ? "text-white" : "text-slate-800"}`}>{label}</div>
      <div className={`text-[11px] mt-0.5 ${selected ? "text-indigo-100" : "text-slate-500"}`}>{sub}</div>
    </button>
  );
}
