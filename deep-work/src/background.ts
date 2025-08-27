// src/background.ts
import { getActive, setActive, ActiveSession } from "~lib/storage"

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("tick", { periodInMinutes: 1 / 60 }) // ~1s
})

chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  if (msg?.type === "START_SESSION") {
    const s: ActiveSession = {
      task: msg.task,
      type: msg.sessionType,
      startedAt: Date.now(),
      durationMs: msg.durationMin * 60_000
    }
    setActive(s).then(() => {
      chrome.alarms.create("session_end", { when: s.startedAt + s.durationMs })
      send({ ok: true })
    })
    return true
  }
  if (msg?.type === "STOP_SESSION") {
    endSession("stopped").then(() => send({ ok: true }))
    return true
  }
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tick") {
    const s = await getActive()
    if (!s) return
    const remaining = s.startedAt + s.durationMs - Date.now()
    // show remaining on badge (optional)
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

  const title =
    reason === "completed" ? "Focus complete" : "Session stopped"
  chrome.notifications.create({
    type: "basic",
    iconUrl: "assets/icon.png",
    title,
    message: `Task: ${s.task}`
  })
}
