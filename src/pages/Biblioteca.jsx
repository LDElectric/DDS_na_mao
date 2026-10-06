import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ItemDDS from "../components/ItemDDS.jsx";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import { useHistorico } from "../hooks/useHistorico.jsx";
import { rotuloParte } from "../lib/catalogo.js";

const FILTROS = [
  { id: "todos", rotulo: "Todos" },
  { id: "nao-lidos", rotulo: "Não lidos" },
  { id: "lidos", rotulo: "Lidos" },
];

export default function Biblioteca() {
  const { itens, carregando, erro, recarregar } = useCatalogo();
  const { historico, limparHistorico } = useHistorico();
  const [filtro, setFiltro] = useState("todos");

  const grupos = useMemo(() => {
    const filtrados = itens.filter((item) => {
      const lido = Boolean(historico.leituras[item.id]);
      if (filtro === "lidos") return lido;
      if (filtro === "nao-lidos") return !lido;
      return true;
    });

    const porParte = new Map();
    for (const item of filtrados) {
      const chave = item.parte;
      if (!porParte.has(chave)) porParte.set(chave, []);
      porParte.get(chave).push(item);
    }

    return [...porParte.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([parte, lista]) => ({
        parte,
        itens: lista.sort((a, b) =>
          String(a.capitulo).padStart(2, "0").localeCompare(String(b.capitulo).padStart(2, "0")) ||
          a.titulo.localeCompare(b.titulo, "pt-BR"),
        ),
      }));
  }, [itens, historico.leituras, filtro]);

  if (carregando) return <p className="aviso">Carregando catálogo…</p>;

  if (erro) {
    return (
      <div className="aviso aviso--erro">
        <p>
          Não conseguimos carregar o catálogo agora. Se estiver sem conexão, tente de novo em
          alguns instantes.
        </p>
        <button type="button" className="botao" onClick={recarregar}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const lidosTotal = Object.keys(historico.leituras).length;
  const progresso = itens.length ? Math.round((lidosTotal / itens.length) * 100) : 0;

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">Biblioteca</h1>
      <p className="subtitulo-pagina">
        {lidosTotal} de {itens.length} DDS lidos ({progresso}%)
      </p>

      <div className="barra-progresso" aria-hidden="true">
        <span style={{ width: `${progresso}%` }} />
      </div>

      <div className="chips" role="group" aria-label="Filtrar leituras">
        {FILTROS.map(({ id, rotulo }) => (
          <button
            key={id}
            type="button"
            className={`chips__item${filtro === id ? " chips__item--ativo" : ""}`}
            onClick={() => setFiltro(id)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {grupos.map(({ parte, itens: daParte }) => (
        <section key={parte} className="grupo">
          <h2 className="grupo__titulo">{rotuloParte(parte)}</h2>
          <ul className="lista">
            {daParte.map((item) => (
              <li key={item.id}>
                <ItemDDS item={item} lido={Boolean(historico.leituras[item.id])} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!grupos.length && (
        <div className="aviso">
          <p>
            <strong>Nenhum DDS neste filtro agora.</strong>
          </p>
          <p>
            Limpe o filtro para ver os {itens.length} DDS do catálogo — ou use a{" "}
            <strong>Busca</strong> para procurar por palavra-chave.
          </p>
          <div className="aviso__acoes">
            <button type="button" className="botao botao--primario" onClick={() => setFiltro("todos")}>
              Limpar filtro
            </button>
            <Link className="botao" to="/busca">
              Pesquisar DDS
            </Link>
          </div>
        </div>
      )}

      <div className="zona-perigo">
        <button
          type="button"
          className="link-suave"
          onClick={() => {
            if (confirm("Apagar todo o histórico de leituras deste dispositivo?")) limparHistorico();
          }}
        >
          Apagar histórico de leituras
        </button>
      </div>
    </div>
  );
}
