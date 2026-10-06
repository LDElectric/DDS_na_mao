import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./styles.css";

// Atualiza o Service Worker em silêncio e recarrega quando houver nova versão.
registerSW({ immediate: true, onRegisteredSW(_url, registro) {
  if (registro) setInterval(() => registro.update(), 60 * 60 * 1000);
} });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
