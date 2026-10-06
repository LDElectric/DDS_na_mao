import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";

const ITENS = [
  { para: "/", rotulo: "Início", icone: "⌂" },
  { para: "/busca", rotulo: "Busca", icone: "⌕" },
  { para: "/biblioteca", rotulo: "Biblioteca", icone: "☰" },
];

export default function Rodape() {
  const ref = useRef(null);

  // Expõe a altura real da barra de navegação em uma variável CSS, para que a
  // barra de ação da tela de leitura encaixe exatamente acima dela.
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return undefined;
    const medir = () =>
      document.documentElement.style.setProperty("--rodape-altura", `${elemento.offsetHeight}px`);
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
    <nav ref={ref} className="rodape" aria-label="Navegação principal">
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
