import { NavLink } from "react-router-dom";

const ITENS = [
  { para: "/", rotulo: "Início", icone: "⌂" },
  { para: "/busca", rotulo: "Busca", icone: "⌕" },
  { para: "/biblioteca", rotulo: "Biblioteca", icone: "☰" },
];

export default function Rodape() {
  return (
    <nav className="rodape" aria-label="Navegação principal">
      {ITENS.map(({ para, rotulo, icone }) => (
        <NavLink
          key={para}
          to={para}
          end={para === "/"}
          className={({ isActive }) => `rodape__item${isActive ? " rodape__item--ativo" : ""}`}
        >
          <span aria-hidden="true">{icone}</span>
          {rotulo}
        </NavLink>
      ))}
    </nav>
  );
}
