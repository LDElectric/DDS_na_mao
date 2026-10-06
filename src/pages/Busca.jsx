import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ItemDDS from "../components/ItemDDS.jsx";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import { useHistorico } from "../hooks/useHistorico.jsx";
import { buscarDDS, rotuloTema, sugerirTemas } from "../lib/catalogo.js";

export default function Busca() {
  const { itens, carregando, erro, recarregar } = useCatalogo();
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

  const temasSugeridos = useMemo(
    () => (resultados.length ? [] : sugerirTemas(itens, termo)),
    [itens, termo, resultados.length],
  );

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

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">Busca manual</h1>
      <p className="subtitulo-pagina">
        A pesquisa manual permite acessar qualquer DDS, inclusive os já escolhidos nos últimos 6
        meses.
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

      {!resultados.length && (
        <div className="aviso">
          <p>
            <strong>Ops! Não encontramos DDS para {termo ? `“${termo}”` : "esse filtro"}</strong>
            {tema && (
              <>
                <br />o filtro <strong>{rotuloTema(tema)}</strong> também pode estar escondendo
                resultados.
              </>
            )}
          </p>
          <p>
            Tente uma palavra mais curta (ex.: “altura” em vez de “trabalho em altura”), limpe o
            filtro de tema ou navegue pelo catálogo completo.
          </p>

          {temasSugeridos.length > 0 && (
            <div className="sugestoes-tema">
              <span>Talvez você procure por:</span>
              <div className="chips">
                {temasSugeridos.map((valor) => (
                  <button
                    key={valor}
                    type="button"
                    className="chips__item"
                    onClick={() => {
                      setTermo("");
                      setTema(valor);
                    }}
                  >
                    {rotuloTema(valor)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="aviso__acoes">
            <button
              type="button"
              className="botao"
              onClick={() => {
                setTermo("");
                setTema(null);
              }}
            >
              Limpar busca
            </button>
            <Link className="botao botao--primario" to="/biblioteca">
              Biblioteca completa
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
