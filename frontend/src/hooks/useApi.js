/**
 * Load data for a page.
 *   const { data, error, loading, refreshing, reload } = useApi(loadFn);
 * `loadFn` must return a promise and must be a STABLE function (defined outside the component,
 * or wrapped in useCallback), because a new function means "load again".
 */
import { useCallback, useEffect, useState } from "react";

export default function useApi(loadFn) {
  const [state, setState] = useState({ data: null, error: "", loading: true, fn: null });

  // Runs the request and turns the result (or error message) into a state object.
  // `fn` remembers which loadFn produced it, so we can tell when the data is for an older search/page.
  const run = useCallback(
    () =>
      loadFn()
        .then((data) => ({ data, error: "", loading: false, fn: loadFn }))
        .catch((e) => ({ data: null, error: e.message, loading: false, fn: loadFn })),
    [loadFn],
  );

  useEffect(() => {
    let ignore = false; // don't update state if the page was left while loading
    run().then((next) => !ignore && setState(next));
    return () => {
      ignore = true;
    };
  }, [run]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    return run().then(setState);
  }, [run]);

  // refreshing: the old data is still shown while new data (another page, another search) is on its way
  const { data, error, loading } = state;
  return { data, error, loading, reload, refreshing: !loading && state.fn !== loadFn };
}
