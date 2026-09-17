import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { ApiError } from './ApiError';

export type QueryState<T> =
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: ApiError };

/**
 * Minimal read hook with explicit loading / success / error states and abort on unmount.
 * Deliberately small; if caching, deduplication or background refetch become necessary,
 * replace it with TanStack Query behind the same feature-level hooks (docs/ARCHITECTURE.md).
 */
export function useApiQuery<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<QueryState<T>>({ status: 'loading', data: undefined, error: undefined });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetcher(controller.signal)
      .then((data) => setState({ status: 'success', data, error: undefined }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError({ kind: 'unknown', status: 0, code: 'unknown_error', message: '' });
        setState({ status: 'error', data: undefined, error: apiError });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are provided by the caller
  }, [...deps, version]);

  const reload = useCallback(() => {
    setState({ status: 'loading', data: undefined, error: undefined });
    setVersion((v) => v + 1);
  }, []);

  /** Replace data locally after a mutation (e.g. append a created item). */
  const setData = useCallback((updater: (current: T) => T) => {
    setState((current) => (current.status === 'success' ? { ...current, data: updater(current.data) } : current));
  }, []);

  return { ...state, reload, setData };
}
