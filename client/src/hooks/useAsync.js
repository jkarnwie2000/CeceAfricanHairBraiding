import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/http.js';

/**
 * Run an async loader and track { data, loading, error }.
 * Re-runs whenever `deps` change; ignores results from stale runs.
 */
export function useAsync(loader, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, loading: immediate, error: null });
  const runId = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async () => {
    const id = ++runId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loaderRef.current();
      if (id === runId.current) setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const message = getErrorMessage(err);
      if (id === runId.current && message) setState((s) => ({ ...s, loading: false, error: message }));
      return null;
    }
  }, []);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), []);

  return { ...state, reload: run, setData };
}
