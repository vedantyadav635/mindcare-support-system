/** Small helpers shared by the tests. */
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ToastProvider } from "../components/ui";
import { AuthProvider } from "../context/AuthContext";

/** Shows the current URL and router state, so a test can check where the app navigated to. */
export function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

/**
 * Render `routes` (an array of [path, element]) inside everything the real app provides:
 * router, toasts and auth. `start` is the first URL.
 */
export function renderApp(routes, start) {
  return render(
    <MemoryRouter initialEntries={[start]}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {routes.map(([path, element]) => <Route key={path} path={path} element={element} />)}
          </Routes>
          <LocationProbe />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}
