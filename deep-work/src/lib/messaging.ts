import type { ActiveSession, SessionType } from "../types";

export const MSG = {
  START: "START_SESSION",
  STOP: "STOP_SESSION",
  GET:  "GET_SESSION"
} as const;

export type Msg =
  | { type: typeof MSG.START; payload: { task: string; sessionType: SessionType; durationMin: number } }
  | { type: typeof MSG.STOP }
  | { type: typeof MSG.GET };

export type MsgResponse =
  | { ok: true; session?: ActiveSession | null }
  | { ok: false; error: string };
