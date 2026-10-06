import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import { escolhaDoDia, escolhidoHoje, formatarDataLeitura, useHistorico } from "../hooks/useHistorico.jsx";
import { rotuloParte, rotuloTema, urlConteudo } from "../lib/catalogo.js";

export default function Leitura() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { itens, carregando } = useCatalogo();
  const { historico, escolherDDS } = useHistorico();
  const [fonte, setFonte] = useState(null);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  const item = itens.find((dds) => dds.id === id);

  useEffect(() => {
    if (!item) return undefined;
    let ativo = true;
    setFonte(null);
    setErro(null);

    fetch(urlConteudo(item))
      .then((resposta) => {
        if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
        return resposta.text();
      })
      .then((texto) => {
        if (ativo) setFonte(texto);
      })
      .catch((falha) => ativo && setErro(falha));

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, tentativa]);

  if (carregando) return <p className="aviso">Carregando…</p>;

  if (!item) {
    return (
      <div className="aviso aviso--erro">
        <p>
          <strong>Ops! Este DDS não está disponível.</strong>
          <br />
          Ele pode ter saído do catálogo ou o link está incompleto.
        </p>
        <div className="aviso__acoes">
          <button type="button" className="botao" onClick={() => navegar(-1)}>
            ‹ Voltar
          </button>
          <Link className="botao" to="/busca">
            Pesquisar DDS
          </Link>
          <Link className="botao" to="/biblioteca">
            Ver biblioteca
          </Link>
        </div>
      </div>
    );
  }

  const escolha = escolhaDoDia(historico);
  const escolhidoHojeEste = escolhidoHoje(historico, item.id);
  const ehDoDia = escolha?.id === item.id;
  const fixado = escolha ? itens.find((dds) => dds.id === escolha.id) ?? null : null;

  return (
    <article className="leitura">
      <nav className="leitura__topo">
        <button type="button" className="botao botao--fantasma" onClick={() => navegar(-1)}>
          ‹ Voltar
        </button>
        {!escolhidoHojeEste && (
          <button
            type="button"
            className="botao botao--fantasma"
            onClick={() => navegar("/", { state: { sortear: true } })}
          >
            Sortear outro
          </button>
        )}
      </nav>

      <header className="leitura__cabecalho">
        <div className="destaque__tags">
          <span className="etiqueta etiqueta--tema">{rotuloTema(item.tema)}</span>
          {item.campanha_sesmt && (
            <span className="etiqueta etiqueta--campanha">Campanha: {item.campanha_sesmt}</span>
          )}
          {ehDoDia && <span className="etiqueta etiqueta--escolha">✓ DDS do dia</span>}
        </div>
        <h1>{item.titulo}</h1>
        {item.subtitulo && <p className="leitura__subtitulo">{item.subtitulo}</p>}
        <p className="destaque__meta">
          {rotuloParte(item.parte)} · {item.capitulo_nome}
        </p>
        {!escolhidoHojeEste && (
          <p className="leitura__dica">
            Fique à vontade para ler e conferir antes: abrir o texto ainda não registra nada. A
            leitura só entra no histórico quando você tocar em <strong>Escolher este DDS</strong>.
          </p>
        )}
      </header>

      {erro && (
        <div className="aviso aviso--erro">
          <p>
            Não conseguimos carregar o texto agora. Se estiver offline, tente de novo quando a
            conexão voltar — os textos visitados ficam guardados no aparelho.
          </p>
          <button type="button" className="botao" onClick={() => setTentativa((t) => t + 1)}>
            Tentar carregar de novo
          </button>
        </div>
      )}

      {!fonte && !erro && <p className="aviso">Carregando texto…</p>}

      {fonte && (
        <div className="markdown">
          <ReactMarkdown>{fonte}</ReactMarkdown>
        </div>
      )}

      <footer className="leitura__rodape">
        {escolhidoHojeEste ? (
          <div className="confirmacao confirmacao--ok">
            <p>
              <strong>
                ✓ {ehDoDia ? "DDS do dia escolhido" : "Registrado como leitura de hoje"} às{" "}
                {formatarDataLeitura(historico.leituras[item.id]).split(" às ")[1]}.
              </strong>{" "}
              {ehDoDia
                ? "Fica fixado até 23:59: todos os turnos de hoje acessam este mesmo DDS."
                : fixado
                  ? `O DDS fixado do dia continua sendo "${fixado.titulo}".`
                  : "Ciclo concluído — o registro vale para a data de hoje."}
            </p>
            <div className="confirmacao__acoes">
              <Link className="botao botao--primario" to={`/imprimir/${item.id}`}>
                🖨 Imprimir com ata de presença
              </Link>
              <Link className="botao" to="/lidos">
                Ver DDS lidos
              </Link>
              <Link className="botao" to="/">
                Início
              </Link>
            </div>
          </div>
        ) : (
          <div className="escolha">
            <button
              type="button"
              className="botao botao--primario botao-escolher"
              onClick={() => escolherDDS(item.id)}
            >
              ✓ Escolher este DDS
            </button>
            <p className="escolha__ajuda">
              Confirma a leitura e registra o DDS de hoje — sem isso, o texto aberto não conta como
              lido.
            </p>
            <Link className="botao" to={`/imprimir/${item.id}`}>
              🖨 Imprimir com ata
            </Link>
          </div>
        )}
      </footer>
    </article>
  );
}
