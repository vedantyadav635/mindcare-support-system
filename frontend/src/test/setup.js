/**
 * Runs before every test file: matchers, and browser features that jsdom (the fake browser) does not have.
 * `afterEach` and `vi` are Vitest globals (see `globals: true` in vite.config.js).
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { setToken } from "../api/client";

afterEach(() => {
  cleanup(); // unmount whatever the test rendered
  setToken(null); // the login token is kept in memory too: tests must not leak it into each other
  sessionStorage.clear();
  vi.clearAllMocks();
});

// The app asks matchMedia about "reduced motion" and "fine pointer"
window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
});

// <dialog> is not implemented in jsdom; Modal calls these
HTMLDialogElement.prototype.showModal ??= function showModal() { this.setAttribute("open", ""); };
HTMLDialogElement.prototype.close ??= function close() { this.removeAttribute("open"); };

// Used when the page scrolls a new message into view
Element.prototype.scrollIntoView ??= () => {};
