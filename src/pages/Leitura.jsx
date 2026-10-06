import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import ModalEscolha from "../components/ModalEscolha.jsx";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import {
  escolhaDoDia,
  escolhidoHoje,
  formatarDataLeitura,
  nomeLeitor,
  useHistorico,
} from "../hooks/useHistorico.jsx";
import { rotuloParte, rotuloTema, urlConteudo } from "../lib/catalogo.js";
import { semTituloInicial } from "../lib/markdown.js";

/** Tamanhos de letra do texto (rem) — ferramenta de acessibilidade da barra superior. */
const ESCALAS = [0.85, 1, 1.15, 1.3, 1.5];
const CHAVE_ESCALA = "dds-na-mao:escala-texto";

const escalaInicial = () => {
  const bruto = localStorage.getItem(CHAVE_ESCALA);
  const indice = bruto == null ? 1 : Number(bruto);
  return Number.isInteger(indice) && indice >= 0 && indice < ESCALAS.length ? indice : 1;
};

/**
 * Tela de leitura: dedicada ao texto. A barra superior concentra tudo —
 * "‹ Voltar", a ferramenta de tamanho da letra (A−/A+) e "✓ Escolher este DDS".
 * Abrir o texto não registra nada; só a confirmação grava a leitura.
 */
export default function Leitura() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { itens, carregando } = useCatalogo();
  const { historico, escolherDDS } = useHistorico();
  const [fonte, setFonte] = useState(null);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [escolhendo, setEscolhendo] = useState(false);
  const [escala, setEscala] = useState(escalaInicial);

  useEffect(() => {
    localStorage.setItem(CHAVE_ESCALA, String(escala));
  }, [escala]);

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
  const leitor = nomeLeitor(historico, item.id);
  const noMinimo = escala === 0;
  const noMaximo = escala === ESCALAS.length - 1;

  return (
    <article className="leitura">
      <nav className="leitura__topo" aria-label="Ações da leitura">
        <button
          type="button"
          className="botao botao--fantasma"
          onClick={() => (window.history.state?.idx > 0 ? navegar(-1) : navegar("/"))}
        >
          ‹ Voltar
        </button>

        <div className="leitura__ferramentas">
          <div className="leitura__tam" role="group" aria-label="Tamanho do texto">
            <button
              type="button"
              aria-label="Diminuir o tamanho do texto"
              disabled={noMinimo}
              onClick={() => setEscala((atual) => Math.max(0, atual - 1))}
            >
              A−
            </button>
            <button
              type="button"
              aria-label="Aumentar o tamanho do texto"
              disabled={noMaximo}
              onClick={() => setEscala((atual) => Math.min(ESCALAS.length - 1, atual + 1))}
            >
              A+
            </button>
          </div>

          {escolhidoHojeEste ? (
            <span className="leitura__status">
              ✓ {ehDoDia ? "DDS do dia" : "Escolhido"}
            </span>
          ) : (
            <button
              type="button"
              className="botao botao--primario botao-escolher"
              onClick={() => setEscolhendo(true)}
            >
              ✓ Escolher este DDS
            </button>
          )}
        </div>
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
      </header>

      {erro && (
        <div className="aviso aviso--erro">
          <p>
            Não conseguimos carregar o texto agora. Se estiver sem conexão, tente de novo quando a
            conexão voltar — os textos visitados ficam guardados no aparelho.
          </p>
          <button type="button" className="botao" onClick={() => setTentativa((t) => t + 1)}>
            Tentar carregar de novo
          </button>
        </div>
      )}

      {!fonte && !erro && <p className="aviso">Carregando texto…</p>}

      {fonte && (
        <div className="markdown" style={{ fontSize: `${ESCALAS[escala]}rem` }}>
          <ReactMarkdown>{semTituloInicial(fonte)}</ReactMarkdown>
        </div>
      )}

      {escolhidoHojeEste && (
        <footer className="leitura__rodape">
          <div className="confirmacao confirmacao--ok">
            <p>
              <strong>
                ✓ {ehDoDia ? "DDS do dia escolhido" : "Registrado como leitura de hoje"} às{" "}
                {formatarDataLeitura(historico.leituras[item.id]).split(" às ")[1]}
                {leitor ? ` por ${leitor}` : ""}.
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
        </footer>
      )}

      <ModalEscolha
        aberto={escolhendo}
        onConfirmar={(nome) => {
          escolherDDS(item.id, nome);
          setEscolhendo(false);
        }}
        onFechar={() => setEscolhendo(false)}
      />
    </article>
  );
}
