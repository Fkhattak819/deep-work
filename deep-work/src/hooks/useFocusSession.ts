import { useEffect, useRef, useState } from "react";
import type { ActiveSession } from "../types";
import { MSG, type Msg, type MsgResponse } from "../lib/messaging";

async function send(msg: Msg) {
  return (await chrome.runtime.sendMessage(msg)) as MsgResponse;
}

export function useFocusSession() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const tickRef = useRef<number | null>(null);

  // initial load
  useEffect(() => {
    send({ type: MSG.GET }).then((r) => r.ok && setSession(r.session ?? null));
  }, []);

  // 1s ticker computed from session timestamps
  useEffect(() => {
    if (!session || session.status === "finished") {
      if (tickRef.current) clearInterval(tickRef.current);
      setRemainingMs(0);
      return;
    }
    const update = () => setRemainingMs(Math.max(0, session.startedAt + session.durationMs - Date.now()));
    update();
    tickRef.current && clearInterval(tickRef.current);
    tickRef.current = window.setInterval(update, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [session?.startedAt, session?.durationMs, session?.status]);

  // actions
  const start = async (task: string, sessionType: any, durationMin: number) => {
    const r = await send({ type: MSG.START, payload: { task, sessionType, durationMin } });
    if (r.ok) {
      const g = await send({ type: MSG.GET });
      if (g.ok) setSession(g.session ?? null);
    }
  };

  const stop = async () => {
    const r = await send({ type: MSG.STOP });
    if (r.ok) {
      const g = await send({ type: MSG.GET });
      setSession(g.ok ? g.session ?? null : null);
    }
  };

  return { session, remainingMs, start, stop, setSession };
}
