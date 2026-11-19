import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./components/ui";
import { APP_NAME } from "./config";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

document.title = APP_NAME; // the name lives in src/config.js only

// AuthProvider sits inside the router because it redirects to /login when a session expires
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
