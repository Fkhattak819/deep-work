export type SessionType = "pomodoro" | "flow" | "quick" | "custom";

export type TimerStatus = "running" | "finished";

export type ActiveSession = {
  task: string;
  startedAt: number;   // ms epoch
  durationMs: number;  // planned duration
  type: SessionType;
  status?: TimerStatus; // optional now (defaults to running)
};
