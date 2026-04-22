'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { saveDraft, type SaveDraftInput } from '@/lib/applicant-api';

const DEBOUNCE_MS = 1500;

export interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: number | null;
  error: string | null;
}

export function useAutoSave(): {
  state: AutoSaveState;
  schedule: (patch: SaveDraftInput) => void;
  flush: () => Promise<void>;
} {
  const [state, setState] = useState<AutoSaveState>({
    status: 'idle',
    lastSavedAt: null,
    error: null,
  });
  const pending = useRef<SaveDraftInput | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!pending.current) return;
    const patch = pending.current;
    pending.current = null;
    setState((s) => ({ ...s, status: 'saving', error: null }));
    try {
      const r = await saveDraft(patch);
      setState({ status: 'saved', lastSavedAt: r.last_saved_at, error: null });
    } catch (err) {
      setState({
        status: 'error',
        lastSavedAt: null,
        error: err instanceof Error ? err.message : 'save failed',
      });
    }
  }, []);

  const schedule = useCallback(
    (patch: SaveDraftInput) => {
      pending.current = pending.current
        ? {
            ...pending.current,
            ...patch,
            form_patch: { ...pending.current.form_patch, ...patch.form_patch },
          }
        : patch;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(send, DEBOUNCE_MS);
    },
    [send],
  );

  const flush = useCallback(async () => {
    await send();
  }, [send]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { state, schedule, flush };
}
