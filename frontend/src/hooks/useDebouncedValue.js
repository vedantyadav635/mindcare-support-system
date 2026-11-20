/** A value that follows `value` after it has stopped changing for `delay` ms (so we search when typing pauses). */
import { useEffect, useState } from "react";

export default function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
