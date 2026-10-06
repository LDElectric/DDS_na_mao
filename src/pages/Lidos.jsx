import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import { formatarDataLeitura, listarLeituras, useHistorico } from "../hooks/useHistorico.jsx";
import { DIAS_JANELA_LEITURA } from "../lib/algoritmo.js";

export default function Lidos() {
  const { itens, carregando, erro } = useCatalogo();
  const { historico } = useHistorico();
  const [params, setParams] = useSearchParams();
  const janela = params.get("janela") === String(DIAS_JANELA_LEITURA) ? DIAS_JANELA_LEITURA : null;

  const lista = useMemo(
    () => listarLeituras(historico, itens, janela),
    [historico, itens, janela],
  );

  if (carregando) return <p className="aviso">Carregando catálogo…</p>;
  if (erro) return <p className="aviso aviso--erro">Erro ao carregar o catálogo.</p>;

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">DDS lidos</h1>
      <p className="subtitulo-pagina">
        Título e data da leitura neste dispositivo. Toque em um item para reabrir o texto.
      </p>

      <div className="chips" role="group" aria-label="Filtrar período">
        <button
          type="button"
          className={`chips__item${janela === DIAS_JANELA_LEITURA ? " chips__item--ativo" : ""}`}
          onClick={() => setParams({ janela: String(DIAS_JANELA_LEITURA) })}
        >
          Últimos {DIAS_JANELA_LEITURA} dias
        </button>
        <button
          type="button"
          className={`chips__item${janela == null ? " chips__item--ativo" : ""}`}
          onClick={() => setParams({})}
        >
          Todos
        </button>
      </div>

      {lista.length === 0 ? (
        <p className="aviso">Nenhum DDS lido neste período.</p>
      ) : (
        <ul className="lista">
          {lista.map(({ id, iso, item, titulo }) => (
            <li key={id}>
              {item ? (
                <Link to={`/ler/${id}`} className="item-dds">
                  <div className="item-dds__corpo">
                    <h3 className="item-dds__titulo">{titulo}</h3>
                    <small className="item-dds__meta">Lido em {formatarDataLeitura(iso)}</small>
                  </div>
                  <span className="item-dds__situacao item-dds__situacao--lido" aria-hidden="true">
                    ›
                  </span>
                </Link>
              ) : (
                <div className="item-dds">
                  <div className="item-dds__corpo">
                    <h3 className="item-dds__titulo">{titulo}</h3>
                    <small className="item-dds__meta">Lido em {formatarDataLeitura(iso)}</small>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
