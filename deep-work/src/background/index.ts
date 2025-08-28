import { getActive, setActive } from "../lib/storage";
import type { ActiveSession } from "../types";
import { MSG, type Msg, type MsgResponse } from "../lib/messaging";

const TICK = "tick";
const END  = "session_end";

async function scheduleTick() {
  await chrome.alarms.create(TICK, { periodInMinutes: 1 / 60 }); // ~1s
}

chrome.runtime.onInstalled.addListener(scheduleTick);
chrome.runtime.onStartup.addListener(scheduleTick);

chrome.runtime.onMessage.addListener((msg: Msg, _sender, send) => {
  (async () => {
    try {
      if (msg.type === MSG.START) {
        const s: ActiveSession = {
          task: msg.payload.task,
          type: msg.payload.sessionType,
          startedAt: Date.now(),
          durationMs: msg.payload.durationMin * 60_000,
          status: "running"
        };
        await setActive(s);
        await chrome.alarms.clear(END);
        await chrome.alarms.create(END, { when: s.startedAt + s.durationMs });
        send({ ok: true } satisfies MsgResponse);
        return;
      }

      if (msg.type === MSG.STOP) {
        await endSession("stopped");
        send({ ok: true } satisfies MsgResponse);
        return;
      }

      if (msg.type === MSG.GET) {
        const s = await getActive();
        send({ ok: true, session: s } satisfies MsgResponse);
        return;
      }
    } catch (e: any) {
      send({ ok: false, error: String(e?.message || e) } satisfies MsgResponse);
    }
  })();
  return true; // keep channel open for async response
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === TICK) {
    const s = await getActive();
    if (!s) return;
    const remaining = s.startedAt + s.durationMs - Date.now();
    const m = Math.max(0, Math.ceil(remaining / 60_000));
    chrome.action.setBadgeText({ text: m.toString() });
    return;
  }

  if (alarm.name === END) {
    await endSession("completed");
    return;
  }
});

async function endSession(reason: "completed" | "stopped") {
  const s = await getActive()
  if (!s) return
  await setActive(null)
  chrome.action.setBadgeText({ text: "" })

  const title =
    reason === "completed" ? "Focus complete" : "Session stopped"
  chrome.notifications.create({
    type: "basic",
    iconUrl: "assets/deepWorkIcon.png",
    title,
    message: `Task: ${s.task}`
  })
}
