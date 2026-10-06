import { useCallback, useEffect, useState } from "react";

const jaInstalado = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

/** Captura o evento nativo de instalação do PWA (Chrome/Edge/Android). */
export function useInstalacao() {
  const [promptEvento, setPromptEvento] = useState(null);
  const [instalado, setInstalado] = useState(jaInstalado);

  useEffect(() => {
    const aoPrompt = (evento) => {
      evento.preventDefault();
      setPromptEvento(evento);
    };
    const aoInstalar = () => {
      setInstalado(true);
      setPromptEvento(null);
    };
    window.addEventListener("beforeinstallprompt", aoPrompt);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPrompt);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  const instalar = useCallback(async () => {
    if (!promptEvento) return false;
    promptEvento.prompt();
    const { outcome } = await promptEvento.userChoice;
    setPromptEvento(null);
    return outcome === "accepted";
  }, [promptEvento]);

  return {
    podeInstalar: Boolean(promptEvento) && !instalado,
    instalado,
    instalar,
  };
}
