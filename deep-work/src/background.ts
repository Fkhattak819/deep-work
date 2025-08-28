import { getActive, setActive } from "./lib/storage"
import type { ActiveSession } from "./lib/storage"

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("tick", { periodInMinutes: 1 / 60 }) // ~1s
})
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("tick", { periodInMinutes: 1 / 60 })
})

chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  (async () => {
    if (msg?.type === "START_SESSION") {
      const s: ActiveSession = {
        task: msg.task,
        type: msg.sessionType,
        startedAt: Date.now(),
        durationMs: msg.durationMin * 60_000
      }
      await setActive(s)
      await chrome.alarms.clear("session_end")
      await chrome.alarms.create("session_end", { when: s.startedAt + s.durationMs })
      send({ ok: true })
      return
    }
    if (msg?.type === "STOP_SESSION") {
      await endSession("stopped")
      send({ ok: true })
      return
    }
    if (msg?.type === "GET_SESSION") {
      const s = await getActive()
      send({ ok: true, session: s })
      return
    }
  })()
  return true
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tick") {
    const s = await getActive()
    if (!s) return
    const remaining = s.startedAt + s.durationMs - Date.now()
    const m = Math.max(0, Math.ceil(remaining / 60_000))
    chrome.action.setBadgeText({ text: m.toString() })
  }
  if (alarm.name === "session_end") {
    await endSession("completed")
  }
})

async function endSession(reason: "completed" | "stopped") {
  const s = await getActive()
  if (!s) return
  await setActive(null)
  chrome.action.setBadgeText({ text: "" })
  chrome.notifications.create({
    type: "basic",
    iconUrl: "assets/deepWorkIcon.png",
    title: reason === "completed" ? "Focus complete" : "Session stopped",
    message: `Task: ${s.task}`
  })
  await chrome.alarms.clear("session_end")
}
