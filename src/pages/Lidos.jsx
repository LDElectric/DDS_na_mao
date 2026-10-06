import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import { formatarDataLeitura, listarLeituras, useHistorico } from "../hooks/useHistorico.jsx";
import { DIAS_JANELA_LEITURA } from "../lib/algoritmo.js";

export default function Lidos() {
  const { itens, carregando, erro, recarregar } = useCatalogo();
  const { historico } = useHistorico();
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const janela = params.get("janela") === String(DIAS_JANELA_LEITURA) ? DIAS_JANELA_LEITURA : null;

  const lista = useMemo(
    () => listarLeituras(historico, itens, janela),
    [historico, itens, janela],
  );

  if (carregando) return <p className="aviso">Carregando catálogo…</p>;

  if (erro) {
    return (
      <div className="aviso aviso--erro">
        <p>
          Não conseguimos carregar o catálogo agora. Se estiver sem conexão, tente de novo em
          alguns instantes — o histórico continua salvo neste aparelho.
        </p>
        <button type="button" className="botao" onClick={recarregar}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">DDS lidos</h1>
      <p className="subtitulo-pagina">
        Título e data de cada DDS escolhido neste dispositivo. Toque no cartão para reabrir o texto
        ou use <strong>Imprimir / PDF</strong> para gerar o documento com ata de presença.
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
        <div className="aviso">
          <p>
            {janela
              ? `Nenhum DDS escolhido nos últimos ${DIAS_JANELA_LEITURA} dias neste aparelho.`
              : "Nenhum DDS registrado neste aparelho ainda."}
          </p>
          <p>
            É simples: abra o texto da sugestão do dia, leia com a equipe e toque em{" "}
            <strong>Escolher este DDS</strong> para registrar.
          </p>
          <div className="aviso__acoes">
            <Link className="botao botao--primario" to="/">
              Ver sugestão do dia
            </Link>
            <Link className="botao" to="/biblioteca">
              Explorar biblioteca
            </Link>
          </div>
        </div>
      ) : (
        <ul className="lista">
          {lista.map(({ id, iso, item, titulo, doDia }) => (
            <li key={id} className="item-lista">
              {item ? (
                <Link to={`/ler/${id}`} className="item-dds">
                  <div className="item-dds__corpo">
                    {doDia && <span className="etiqueta etiqueta--escolha">✓ DDS do dia</span>}
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

              {item && (
                <button
                  type="button"
                  className="botao item-lista__imprimir"
                  onClick={() => navegar(`/imprimir/${id}`)}
                >
                  🖨️ Imprimir / PDF
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
