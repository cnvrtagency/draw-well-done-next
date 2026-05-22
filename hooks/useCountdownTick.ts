"use client";

import { useEffect, useState } from "react";

const subscribers = new Map<number, Set<() => void>>();
const intervals = new Map<number, number>();

function subscribe(intervalMs: number, callback: () => void) {
  const ms = Math.max(1000, intervalMs);
  let set = subscribers.get(ms);
  if (!set) {
    set = new Set();
    subscribers.set(ms, set);
  }
  set.add(callback);

  if (!intervals.has(ms)) {
    const id = window.setInterval(() => {
      subscribers.get(ms)?.forEach((notify) => notify());
    }, ms);
    intervals.set(ms, id);
  }

  return () => {
    const current = subscribers.get(ms);
    if (!current) return;
    current.delete(callback);
    if (current.size === 0) {
      subscribers.delete(ms);
      const id = intervals.get(ms);
      if (id != null) window.clearInterval(id);
      intervals.delete(ms);
    }
  };
}

export function useCountdownTick(intervalMs = 1000) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    return subscribe(intervalMs, () => setTick((tick) => tick + 1));
  }, [intervalMs]);
}
