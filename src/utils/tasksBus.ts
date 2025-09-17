// src/utils/tasksBus.ts
export type TasksUpdatedDetail = { date?: string; ts: number };

const EVENT_NAME = "tasks:updated";

export function notifyTasksUpdated(date?: string) {
  window.dispatchEvent(
    new CustomEvent<TasksUpdatedDetail>(EVENT_NAME, {
      detail: { date, ts: Date.now() },
    })
  );
}

export function onTasksUpdated(cb: (detail: TasksUpdatedDetail) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<TasksUpdatedDetail>).detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
