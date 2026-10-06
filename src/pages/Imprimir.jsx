import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import { nomeLeitor, useHistorico } from "../hooks/useHistorico.jsx";
import { urlConteudo } from "../lib/catalogo.js";

const LINHAS_INICIAIS = 20;

/**
 * Documento para impressão / exportação em PDF:
 *   página 1..N  → texto integral do DDS
 *   página seguinte → ata de presença (sempre com quebra de página),
 *   favorecendo a impressão frente e verso com assinatura e arquivamento.
 */
export default function Imprimir() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { itens, carregando } = useCatalogo();
  const { historico } = useHistorico();
  const [fonte, setFonte] = useState(null);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [linhas, setLinhas] = useState(LINHAS_INICIAIS);

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
      .then((texto) => ativo && setFonte(texto))
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
          <strong>Ops! Este DDS não está disponível para impressão.</strong>
          <br />
          Volte para a lista e escolha outro DDS.
        </p>
        <div className="aviso__acoes">
          <button type="button" className="botao" onClick={() => navegar(-1)}>
            ‹ Voltar
          </button>
          <button type="button" className="botao" onClick={() => navegar("/lidos")}>
            Ver DDS lidos
          </button>
        </div>
      </div>
    );
  }

  const leituraISO = historico.leituras[item.id];
  const leitor = nomeLeitor(historico, item.id);
  const dataDocumento = leituraISO
    ? new Date(leituraISO).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  return (
    <div className="pagina pagina--impressao">
      <nav className="impressao-acoes" aria-label="Ações de impressão">
        <button type="button" className="botao botao--primario" onClick={() => window.print()}>
          🖨️ Imprimir / Salvar PDF
        </button>
        <button type="button" className="botao" onClick={() => setLinhas((n) => n + 10)}>
          ➕ Adicionar 10 linhas
        </button>
        <button type="button" className="botao botao--fantasma" onClick={() => navegar(-1)}>
          ‹ Voltar
        </button>
      </nav>

      <p className="aviso impressao-dica">
        Na janela de impressão escolha <strong>“Salvar como PDF”</strong> para guardar, assinar e
        arquivar. O texto ocupa as primeiras páginas e a <strong>lista de presença</strong> começa
        sempre em uma página nova (ideal para frente e verso).
      </p>

      <article className="folha">
        <header className="folha__cabecalho">
          <span className="folha__icone" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="38" height="38" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 8 C20 8 12 18 12 30 L12 36 L52 36 L52 30 C52 18 44 8 32 8 Z" fill="#f4c400" />
              <rect x="8" y="34" width="48" height="6" rx="3" fill="#f4c400" />
              <rect x="30" y="38" width="28" height="18" rx="5" fill="#ffffff" stroke="#2b2b2b" strokeWidth="1.5" />
              <path d="M34 56 L30 62 L40 56 Z" fill="#ffffff" stroke="#2b2b2b" strokeWidth="1.5" />
              <text x="44" y="51" fontFamily="Arial" fontSize="10" fontWeight="bold" fill="#2b2b2b" textAnchor="middle">
                DDS
              </text>
            </svg>
          </span>
          <div>
            <h1>
              DDS <span>na mão</span>
            </h1>
            <p>Diálogo Diário de Segurança</p>
          </div>
        </header>

        <div className="folha__info">
          <div className="folha__campo">
            <strong>Tema:</strong>
            <span>{item.titulo}</span>
          </div>
          <div className="folha__campo folha__campo--pequeno">
            <strong>Data:</strong>
            <span>{dataDocumento}</span>
          </div>
          <div className="folha__campo folha__campo--pequeno">
            <strong>Leitor:</strong>
            <span>{leitor || "\u00A0"}</span>
          </div>
        </div>

        <div className="folha__tema">
          <strong>📄 TEMA:</strong> {item.titulo}
          {item.subtitulo ? ` — ${item.subtitulo}` : ""}
        </div>

        {erro && (
          <div className="aviso aviso--erro">
            <p>Não foi possível carregar o texto do DDS para impressão.</p>
            <button type="button" className="botao" onClick={() => setTentativa((t) => t + 1)}>
              Tentar de novo
            </button>
          </div>
        )}

        {!fonte && !erro && <p className="aviso">Carregando texto…</p>}

        {fonte && (
          <div className="markdown folha__texto">
            <ReactMarkdown>{fonte}</ReactMarkdown>
          </div>
        )}

        <section className="folha__ata">
          <h2>📋 Lista de Presença</h2>
          <table>
            <thead>
              <tr>
                <th className="c-num">Nº</th>
                <th className="c-nome">Nome</th>
                <th className="c-assinatura">Assinatura</th>
                <th className="c-empresa">Empresa</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: linhas }, (_, indice) => (
                <tr key={indice}>
                  <td className="c-num">{indice + 1}</td>
                  <td className="c-nome" />
                  <td className="c-assinatura" />
                  <td className="c-empresa" />
                </tr>
              ))}
            </tbody>
          </table>

          <div className="folha__assinaturas">
            <div className="folha__assinatura">
              <strong>Assinatura do Leitor</strong>
              <span>Responsável pela leitura do DDS</span>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
