import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useInstalacao } from "../hooks/useInstalacao.jsx";
import ModalInstalar from "./ModalInstalar.jsx";

export default function Cabecalho({ tema, onAlternarTema }) {
  const { podeInstalar, instalar } = useInstalacao();
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const ref = useRef(null);

  // Expõe a altura real do cabeçalho em uma variável CSS, para que a barra
  // fixa da tela de leitura encaixe exatamente abaixo dele.
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return undefined;
    const medir = () =>
      document.documentElement.style.setProperty(
        "--cabecalho-altura",
        `${elemento.offsetHeight}px`,
      );
    medir();
    window.addEventListener("resize", medir);
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => {
      window.removeEventListener("resize", medir);
      observador.disconnect();
    };
  }, []);

  return (
    <header ref={ref} className="cabecalho">
      <Link to="/" className="marca">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="40" height="40" />
        <span>
          DDS na mão
          <small>Diálogos Diários de Segurança</small>
        </span>
      </Link>
      <div className="cabecalho__acoes">
        {podeInstalar && (
          <button type="button" className="btn-instalar" onClick={instalar}>
            📲 Instalar
          </button>
        )}
        <button
          type="button"
          className="btn-info"
          onClick={() => setAjudaAberta(true)}
          aria-label="Como instalar o app"
        >
          i
        </button>
        <button
          type="button"
          className="botao-icone"
          onClick={onAlternarTema}
          aria-label={tema === "escuro" ? "Ativar modo claro" : "Ativar modo escuro"}
          title={tema === "escuro" ? "Modo claro" : "Modo escuro"}
        >
          {tema === "escuro" ? "☀" : "☾"}
        </button>
      </div>
      <ModalInstalar aberto={ajudaAberta} onFechar={() => setAjudaAberta(false)} />
    </header>
  );
}
