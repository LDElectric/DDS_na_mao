import { Link } from "react-router-dom";

export default function Cabecalho({ tema, onAlternarTema }) {
  return (
    <header className="cabecalho">
      <Link to="/" className="marca">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="28" height="28" />
        <span>
          DDS na Mão
          <small>Diálogos Diários de Segurança</small>
        </span>
      </Link>
      <button
        type="button"
        className="botao-icone"
        onClick={onAlternarTema}
        aria-label={tema === "escuro" ? "Ativar modo claro" : "Ativar modo escuro"}
        title={tema === "escuro" ? "Modo claro" : "Modo escuro"}
      >
        {tema === "escuro" ? "☀" : "☾"}
      </button>
    </header>
  );
}
