import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, LogEntry } from './types';
import { uid, isoDate } from './util';
import { XP_FOR, levelFromXp, streakDays } from './dogmath';
import { allDogs, initialState, totalXp, updateDogData } from './state';
import { syncAllReminders } from './reminders';

export * from './state';

const KEY = 'pawgress:state:v1';

interface Store {
  ready: boolean;
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  /** Logs for the active dog, plus any other dogs listed in alsoFor (e.g. a walk together). */
  addLog: (entry: Omit<LogEntry, 'id' | 'at'> & { at?: string }, alsoFor?: string[]) => { xp: number; leveledUp: boolean };
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          // Older saves had only a server address: treat a saved address as "server" mode.
          if (!saved.aiMode) saved.aiMode = saved.aiProxyUrl ? 'server' : 'demo';
          setState({ ...initialState(), ...saved });
        }
      } catch {
        // Corrupt or unreadable storage: start fresh rather than crash.
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 300);
  }, [state, ready]);

  // Keep phone reminders in step with every dog's plan. Only re-schedules when a plan actually changes.
  const reminderSig =
    ready && state.onboarded
      ? JSON.stringify([state.remindersOn, allDogs(state).map((d) => [d.dog.name, d.routine.map((r) => [r.time, r.days, r.title, r.remind])])])
      : '';
  useEffect(() => {
    if (!reminderSig) return;
    const t = setTimeout(() => {
      const s = stateRef.current;
      syncAllReminders(allDogs(s).map((d) => ({ dogName: d.dog.name, routine: d.routine })), s.remindersOn).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [reminderSig]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  const addLog: Store['addLog'] = useCallback((entry, alsoFor = []) => {
    const at = entry.at ?? new Date().toISOString();
    const apply = (s: AppState): AppState => {
      if (!s.dog) return s;
      let next = s;
      for (const dogId of [s.dog.id, ...alsoFor.filter((x) => x !== s.dog!.id)]) {
        const log: LogEntry = { ...entry, id: uid(), at } as LogEntry;
        next = updateDogData(next, dogId, (d) => {
          const out = { ...d, logs: [log, ...d.logs] };
          if (log.type === 'weight' && log.kg) {
            const day = isoDate(new Date(log.at));
            out.dog = { ...d.dog, weights: [...d.dog.weights.filter((w) => w.date !== day), { date: day, kg: log.kg }] };
          }
          return out;
        });
      }
      return next;
    };
    const before = levelFromXp(totalXp(stateRef.current)).level;
    const next = apply(stateRef.current);
    stateRef.current = next; // keeps rapid back-to-back logs from overwriting each other
    setState(apply);
    const after = levelFromXp(totalXp(next)).level;
    return { xp: (entry.xp ?? XP_FOR[entry.type]) * (1 + alsoFor.length), leveledUp: after > before };
  }, []);

  const reset = useCallback(() => {
    AsyncStorage.removeItem(KEY).catch(() => {});
    setState(initialState());
  }, []);

  const value = useMemo(() => ({ ready, state, update, addLog, reset }), [ready, state, update, addLog, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

export function useGame() {
  const { state } = useStore();
  return useMemo(() => {
    const xp = totalXp(state);
    return { xp, ...levelFromXp(xp), streak: streakDays([...state.logs, ...state.otherDogs.flatMap((d) => d.logs)]) };
  }, [state]);
}

