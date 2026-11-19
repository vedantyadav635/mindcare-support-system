"""A tiny in-memory limiter for failed logins (slows down password guessing)."""
import threading
import time
from collections import defaultdict, deque


class FailureLimiter:
    """Blocks a key (an email or an IP address) after `max_failures` failures within `window_seconds`.

    ponytail: memory of ONE server process; it resets on restart and is not shared between
    several uvicorn workers. Use Redis for that if the app is ever scaled out.
    """

    def __init__(self, max_failures: int, window_seconds: int = 15 * 60):
        self.max_failures = max_failures
        self.window_seconds = window_seconds
        self._failures: dict[str, deque[float]] = defaultdict(deque)  # key -> times of recent failures
        self._lock = threading.Lock()  # requests run in several threads

    def _forget_old(self, key: str, now: float) -> deque[float]:
        times = self._failures[key]
        while times and times[0] <= now - self.window_seconds:
            times.popleft()
        return times

    def retry_after(self, key: str) -> int:
        """0 if the key may try again now, otherwise the number of seconds to wait."""
        with self._lock:
            now = time.monotonic()
            times = self._forget_old(key, now)
            if len(times) < self.max_failures:
                return 0
            return int(times[0] + self.window_seconds - now) + 1

    def record_failure(self, key: str) -> None:
        with self._lock:
            self._failures[key].append(time.monotonic())

    def reset(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)

    def clear(self) -> None:
        """Forget everything (used by the tests)."""
        with self._lock:
            self._failures.clear()


# 5 wrong passwords for one account, or 20 failed logins from one IP, in 15 minutes
email_limiter = FailureLimiter(max_failures=5)
ip_limiter = FailureLimiter(max_failures=20)
