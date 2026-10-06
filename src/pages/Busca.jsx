import { useMemo, useState } from "react";
import ItemDDS from "../components/ItemDDS.jsx";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import { useHistorico } from "../hooks/useHistorico.jsx";
import { buscarDDS, rotuloTema } from "../lib/catalogo.js";

export default function Busca() {
  const { itens, carregando, erro } = useCatalogo();
  const { historico } = useHistorico();
  const [termo, setTermo] = useState("");
  const [tema, setTema] = useState(null);

  const temasDisponiveis = useMemo(
    () => [...new Set(itens.map((item) => item.tema))].sort((a, b) =>
      rotuloTema(a).localeCompare(rotuloTema(b), "pt-BR"),
    ),
    [itens],
  );

  const resultados = useMemo(() => buscarDDS(itens, termo, { tema }), [itens, termo, tema]);

  if (carregando) return <p className="aviso">Carregando catálogo…</p>;
  if (erro) return <p className="aviso aviso--erro">Erro ao carregar o catálogo.</p>;

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">Busca manual</h1>
      <p className="subtitulo-pagina">
        A pesquisa manual permite acessar qualquer DDS, inclusive os lidos nos últimos 6 meses.
      </p>

      <div className="campo-busca">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Título, tema, capítulo…"
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          autoFocus
          aria-label="Pesquisar DDS"
        />
        {termo && (
          <button type="button" onClick={() => setTermo("")} aria-label="Limpar busca">
            ✕
          </button>
        )}
      </div>

      <div className="chips" role="group" aria-label="Filtrar por tema">
        <button
          type="button"
          className={`chips__item${tema === null ? " chips__item--ativo" : ""}`}
          onClick={() => setTema(null)}
        >
          Todos
        </button>
        {temasDisponiveis.map((valor) => (
          <button
            key={valor}
            type="button"
            className={`chips__item${tema === valor ? " chips__item--ativo" : ""}`}
            onClick={() => setTema(tema === valor ? null : valor)}
          >
            {rotuloTema(valor)}
          </button>
        ))}
      </div>

      <p className="contador">{resultados.length} resultado(s)</p>

      <ul className="lista">
        {resultados.map((item) => (
          <li key={item.id}>
            <ItemDDS item={item} lido={Boolean(historico.leituras[item.id])} />
          </li>
        ))}
      </ul>

      {!resultados.length && <p className="aviso">Nenhum DDS encontrado para esse filtro.</p>}
    </div>
  );
}
