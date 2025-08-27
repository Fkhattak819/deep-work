// src/popup.tsx
import { useEffect, useMemo, useState } from "react"
import { getActive, ActiveSession, SessionType } from "~lib/storage"
import "./style.css" // if you’re using Tailwind/CSS

const PRESETS: Record<SessionType, number> = {
  pomodoro: 25, flow: 90, quick: 15, custom: 25
}

export default function Popup() {
  const [task, setTask] = useState("")
  const [type, setType] = useState<SessionType>("pomodoro")
  const [durationMin, setDurationMin] = useState<number>(PRESETS.pomodoro)
  const [active, setActive] = useState<ActiveSession | null>(null)
  const [remainingMs, setRemainingMs] = useState<number>(0)

  // Sync preset duration when type changes (except custom)
  useEffect(() => {
    if (type !== "custom") setDurationMin(PRESETS[type])
  }, [type])

  // Load current session (if background already running)
  useEffect(() => { getActive().then(setActive) }, [])

  // Live countdown
  useEffect(() => {
    const id = setInterval(async () => {
      const s = await getActive()
      setActive(s)
      if (!s) { setRemainingMs(0); return }
      setRemainingMs(s.startedAt + s.durationMs - Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const remainingText = useMemo(() => {
    const ms = Math.max(0, remainingMs)
    const m = Math.floor(ms / 60_000)
    const s = Math.floor((ms % 60_000) / 1000)
    return `${m}:${s.toString().padStart(2, "0")}`
  }, [remainingMs])

  const start = async () => {
    await chrome.runtime.sendMessage({
      type: "START_SESSION",
      task: task.trim() || "Untitled",
      sessionType: type,
      durationMin
    })
    const s = await getActive()
    setActive(s)
  }

  const stop = async () => {
    await chrome.runtime.sendMessage({ type: "STOP_SESSION" })
    setActive(null)
  }

  const running = !!active
  const canStart = task.trim().length > 0 && durationMin > 0

  return (
    <div className="w-[380px] p-5 text-slate-800">
      {/* Header */}
      <div className="mb-4">
        <div className="text-2xl font-semibold">Study Buddy</div>
        <div className="text-sm text-slate-500">Your minimal focus companion</div>
      </div>

      {/* Tabs (static) */}
      <div className="flex gap-3 mb-4">
        <Tab selected>Focus</Tab>
        <Tab>Distractions</Tab>
        <Tab>Hints</Tab>
        <Tab>Stats</Tab>
      </div>

      {/* Card */}
      <div className="rounded-2xl shadow p-5 bg-white/90">
        <h2 className="text-xl font-semibold text-center">Start a Focus Session</h2>
        <p className="text-center text-slate-500 mb-4">What are you working on today?</p>

        <label className="text-sm">Session Title</label>
        <input
          className="mt-1 mb-3 w-full rounded border px-3 py-2"
          placeholder="e.g., Algorithms homework, Reading chapter 5…"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          disabled={running}
        />

        <div className="text-sm mb-2">Session Type</div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Pill label="Pomodoro" sub="25min" selected={type==="pomodoro"} onClick={()=>setType("pomodoro")} disabled={running}/>
          <Pill label="Flow State" sub="90min" selected={type==="flow"} onClick={()=>setType("flow")} disabled={running}/>
          <Pill label="Quick Focus" sub="15min" selected={type==="quick"} onClick={()=>setType("quick")} disabled={running}/>
        </div>

        <div className="text-sm mb-1">Duration (minutes)</div>
        <input
          type="number"
          className="w-full rounded border px-3 py-2 mb-4"
          value={durationMin}
          onChange={e => { setType("custom"); setDurationMin(parseInt(e.target.value || "0")) }}
          min={1}
          disabled={running}
        />

        {!running ? (
          <button
            className="w-full rounded bg-indigo-600 text-white py-2 disabled:opacity-50"
            onClick={start}
            disabled={!canStart}
          >
            Start Focus Session
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium">Time Left: {remainingText}</div>
            <button className="rounded border px-3 py-2" onClick={stop}>Stop</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Tab({ children, selected=false }: { children: React.ReactNode; selected?: boolean }) {
  return (
    <div className={`px-4 py-2 rounded-lg border shadow-sm text-sm ${selected ? "bg-indigo-600 text-white" : "bg-white"}`}>
      {children}
    </div>
  )
}

function Pill({ label, sub, selected, onClick, disabled }:{
  label:string; sub:string; selected:boolean; onClick:()=>void; disabled?:boolean
}) {
  return (
    <button
      className={`text-left rounded-lg border px-4 py-3 ${selected ? "bg-indigo-600 text-white" : "bg-white"}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="text-sm">{label}</div>
      <div className={`text-xs ${selected ? "text-indigo-100" : "text-slate-500"}`}>{sub}</div>
    </button>
  )
}
