/**
 * Who is logged in, shared with every page.
 *   const { user, role, token, loading, login, logout } = useAuth();
 *
 * On app start, if a token is saved (sessionStorage), we call GET /auth/me to restore the session.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/auth";
import { getToken, onUnauthorized, setToken } from "../api/client";

const AuthContext = createContext(null);

const PROTECTED_PREFIXES = ["/app", "/counsellor", "/admin"];

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(Boolean(getToken())); // only "loading" if there is a session to restore

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  // When any request gets a 401 (expired token): clear the session and go to /login.
  // (On public pages like the landing page we just log out quietly.)
  useEffect(
    () =>
      onUnauthorized(() => {
        logout();
        if (PROTECTED_PREFIXES.some((prefix) => window.location.pathname.startsWith(prefix))) {
          navigate("/login", { replace: true });
        }
      }),
    [logout, navigate],
  );

  // Restore the session once, on app start
  useEffect(() => {
    if (!getToken()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const { access_token } = await authApi.login(email, password);
    setToken(access_token);
    setTokenState(access_token);
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const value = { user, role: user?.role ?? null, token, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}
