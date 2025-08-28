export type SessionType = "pomodoro" | "flow" | "quick" | "custom"

export type ActiveSession = {
  task: string
  startedAt: number
  durationMs: number
  type: SessionType
}

const KEY = "activeSession"

export async function getActive(): Promise<ActiveSession | null> {
  const r = await chrome.storage.local.get(KEY)
  return (r[KEY] as ActiveSession | undefined) ?? null
}

export async function setActive(s: ActiveSession | null) {
  if (s) await chrome.storage.local.set({ [KEY]: s })
  else   await chrome.storage.local.remove(KEY)
}
