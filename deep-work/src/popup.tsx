import { useEffect, useMemo, useState } from "react"
// IMPORTANT: only import getActive here (not setActive) to avoid name clash
import { getActive } from "./lib/storage"
import type { ActiveSession, SessionType } from "./lib/storage"
import "./style.css"
import logoDataUri from "data-base64:/assets/DeepIcon.png"

const PRESETS: Record<SessionType, number> = {
  pomodoro: 25, flow: 90, quick: 15, custom: 25
}

const ClockIcon = ({ filled=false }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" className={filled ? "text-white" : ""} />
    <path d="M12 7v5l3 2" />
  </svg>
)
const ZapIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
  </svg>
)
const TargetIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export default function Popup() {
  const [task, setTask] = useState("")
  const [type, setType] = useState<SessionType>("pomodoro")
  const [durationMin, setDurationMin] = useState<number>(PRESETS.pomodoro)

  // NOTE: rename state setter to avoid clashing with storage.setActive
  const [active, setActiveState] = useState<ActiveSession | null>(null)
  const [remainingMs, setRemainingMs] = useState<number>(0)

  useEffect(() => {
    if (type !== "custom") setDurationMin(PRESETS[type])
  }, [type])

  // Load current session (if background already running)
  useEffect(() => { getActive().then(setActiveState) }, [])

  // Live countdown
  useEffect(() => {
    const id = setInterval(async () => {
      const s = await getActive()
      setActiveState(s)
      if (!s) { setRemainingMs(0); return }
      setRemainingMs(s.startedAt + s.durationMs - Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const start = async () => {
    await chrome.runtime.sendMessage({
      type: "START_SESSION",
      task: task.trim() || "Untitled",
      sessionType: type,
      durationMin
    })
    const s = await getActive()
    setActiveState(s)
  }

  const stop = async () => {
    await chrome.runtime.sendMessage({ type: "STOP_SESSION" })
    setActiveState(null)
  }

  const running = !!active
  const canStart = task.trim().length > 0 && durationMin > 0

  return (
    <div className="w-[400px] h-[560px] overflow-hidden bg-[#f5f7fb] text-slate-800">
      <div className="h-full flex flex-col gap-3 p-4">

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2">
            <img src={logoDataUri} alt="Deep Work logo" className="h-9 w-9" />
            <h1 className="text-xl font-semibold leading-tight">Focus Flow</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Your minimal focus companion</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-5 border-b border-slate-200 pb-1">
          <Tab icon={<span>🎯</span>} selected>Focus</Tab>
          <Tab icon={<span>⚙️</span>}>Distractions</Tab>
          <Tab icon={<span>❓</span>}>Hints</Tab>
          <Tab icon={<span>📊</span>}>Stats</Tab>
        </div>

        {/* Body: form when idle, big ring when running */}
        {!running ? (
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
              <Pill icon={<ClockIcon />}  label="Pomodoro"   sub="25min"
                    selected={type==="pomodoro"} onClick={()=>setType("pomodoro")} disabled={running}/>
              <Pill icon={<ZapIcon   />}  label="Flow State"  sub="90min"
                    selected={type==="flow"}     onClick={()=>setType("flow")}     disabled={running}/>
              <Pill icon={<TargetIcon/>}  label="Quick Focus" sub="15min"
                    selected={type==="quick"}   onClick={()=>setType("quick")}    disabled={running}/>
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
              onClick={start}
              disabled={!canStart}
            >
              Start Focus Session
            </button>
          </div>
        ) : (
          <RunningView
            active={active!}
            remainingMs={remainingMs}
            onReset={async () => {
              await chrome.runtime.sendMessage({ type: "STOP_SESSION" })
              await chrome.runtime.sendMessage({
                type: "START_SESSION",
                task: active!.task,
                sessionType: active!.type,
                durationMin: Math.round(active!.durationMs / 60000)
              })
            }}
            onStop={stop}
          />
        )}
      </div>
    </div>
  )
}

function Tab({ icon, children, selected=false, onClick }:{
  icon: React.ReactNode; children: React.ReactNode; selected?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
        selected ? "bg-[#601ff5] text-white shadow" : "text-slate-600 hover:text-slate-800"
      ].join(" ")}
    >
      <span className={selected ? "text-white" : "text-slate-500"}>{icon}</span>
      {children}
    </button>
  )
}

function Pill({ icon, label, sub, selected, onClick, disabled }:{
  icon: React.ReactNode; label: string; sub: string; selected: boolean; onClick: () => void; disabled?: boolean;
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
  )
}

function ProgressRing({ progress }: { progress: number }) {
  const size = 200, stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(1, progress)) * c
  return (
    <svg width={size} height={size} className="mx-auto text-[#601ff5]">
      <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none"
        strokeDasharray={`${dash} ${c}`} transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  )
}

function RunningView({
  active, remainingMs, onReset, onStop
}: {
  active: ActiveSession
  remainingMs: number
  onReset: () => void
  onStop: () => void
}) {
  const total = active.durationMs
  const rem = Math.max(0, remainingMs)
  const progress = 1 - rem / total

  const m = Math.floor(rem / 60_000)
  const s = Math.floor((rem % 60_000) / 1000)
  const timeText = `${m}:${s.toString().padStart(2, "0")}`

  return (
    <div className="flex-1 min-h-0 rounded-2xl bg-white/95 border border-slate-100 shadow p-6 flex flex-col items-center">
      <div className="text-center mb-2">
        <div className="text-slate-700 font-medium">{active.task}</div>
        <div className="text-slate-500 text-sm">{
          active.type === "pomodoro" ? "Pomodoro Session" :
          active.type === "flow" ? "Flow Session" :
          active.type === "quick" ? "Quick Focus" : "Custom"
        } • {Math.round(active.durationMs/60000)}min</div>
      </div>

      <div className="relative my-6">
        <ProgressRing progress={progress} />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-5xl font-semibold">{timeText}</div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-5 pb-1">
        {/* Reset */}
        <button
          onClick={onReset}
          className="h-12 w-12 rounded-full border border-slate-200 hover:bg-slate-50 grid place-items-center text-lg"
          title="Reset"
        >↻</button>

        {/* Play (placeholder – pause/resume coming later) */}
        <button
          onClick={() => {}}
          className="h-14 w-14 rounded-full bg-[#601ff5] text-white shadow-md hover:bg-[#601ff5]/90 grid place-items-center text-xl"
          title="Running"
        >▶</button>

        {/* Stop */}
        <button
          onClick={onStop}
          className="h-12 w-12 rounded-full border border-slate-200 hover:bg-slate-50 grid place-items-center text-lg"
          title="Stop"
        >■</button>
      </div>
    </div>
  )
}
