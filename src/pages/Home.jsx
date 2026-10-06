import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import { contarLidos, useHistorico } from "../hooks/useHistorico.jsx";
import {
  DIAS_JANELA_LEITURA,
  ROTULOS_ORIGEM,
  chaveDia,
  sortearOutro,
  sugerirDoDia,
} from "../lib/algoritmo.js";
import { rotuloParte, rotuloTema } from "../lib/catalogo.js";

export default function Home() {
  const { itens, carregando, erro, recarregar } = useCatalogo();
  const { historico, registrarLeitura, registrarSugestao } = useHistorico();
  const localizacao = useLocation();
  const [sugestao, setSugestao] = useState(null);

  // Sorteio inicial (ou re-sorteio quando a tela veio da leitura).
  useEffect(() => {
    if (carregando || erro || !itens.length || sugestao) return;

    const reSortear = Boolean(localizacao.state?.sortear);
    const resultado = reSortear
      ? sortearOutro(itens, historico, { excluirId: historico.sugestoes[chaveDia()] })
      : sugerirDoDia(itens, historico);

    if (!resultado) return;
    setSugestao(resultado);
    if (!resultado.doDia) registrarSugestao(resultado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, erro, itens, sugestao]);

  const aoSortear = () => {
    const resultado = sortearOutro(itens, historico, { excluirId: sugestao?.dds.id });
    if (!resultado) return;
    setSugestao(resultado);
    registrarSugestao(resultado);
  };

  if (carregando) return <p className="aviso">Carregando catálogo…</p>;

  if (erro) {
    return (
      <div className="aviso aviso--erro">
        <p>Não foi possível carregar o catálogo. Verifique a conexão e tente de novo.</p>
        <button type="button" className="botao" onClick={recarregar}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const lidos = contarLidos(historico);
  const dds = sugestao?.dds;

  return (
    <div className="pagina">
      <section className="destaque">
        <header className="destaque__cabecalho">
          <span className="etiqueta">Sugestão do dia</span>
          {sugestao && (
            <span className="etiqueta etiqueta--origem">{ROTULOS_ORIGEM[sugestao.origem]}</span>
          )}
        </header>

        {dds ? (
          <>
            <div className="destaque__tags">
              <span className="etiqueta etiqueta--tema">{rotuloTema(dds.tema)}</span>
              {dds.campanha_sesmt && (
                <span className="etiqueta etiqueta--campanha">Campanha: {dds.campanha_sesmt}</span>
              )}
            </div>

            <h1 className="destaque__titulo">{dds.titulo}</h1>
            {dds.subtitulo && <p className="destaque__subtitulo">{dds.subtitulo}</p>}
            <p className="destaque__meta">
              {rotuloParte(dds.parte)} · {dds.capitulo_nome}
            </p>

            <div className="destaque__acoes">
              <Link className="botao botao--primario" to={`/ler/${dds.id}`}>
                Ler agora
              </Link>
              <button type="button" className="botao" onClick={aoSortear}>
                Sortear outro
              </button>
            </div>

            <button
              type="button"
              className={`link-suave${historico.leituras[dds.id] ? " link-suave--ok" : ""}`}
              onClick={() => registrarLeitura(dds.id)}
              disabled={Boolean(historico.leituras[dds.id])}
            >
              {historico.leituras[dds.id] ? "✓ Marcado como lido" : "Marcar como lido"}
            </button>
          </>
        ) : (
          <p>Sorteando…</p>
        )}
      </section>

      <section className="painel-estatisticas" aria-label="Resumo">
        <div>
          <strong>{lidos}</strong>
          <span>lidos em {DIAS_JANELA_LEITURA} dias</span>
        </div>
        <div>
          <strong>{itens.length}</strong>
          <span>DDS no catálogo</span>
        </div>
        <div>
          <strong>{Object.keys(historico.leituras).length}</strong>
          <span>lidos no total</span>
        </div>
      </section>

      <section className="atalhos">
        <Link className="atalho" to="/busca">
          <span aria-hidden="true">⌕</span>
          Pesquisar DDS
          <small>Acesso livre, inclusive aos repetidos</small>
        </Link>
        <Link className="atalho" to="/biblioteca">
          <span aria-hidden="true">☰</span>
          Biblioteca completa
          <small>Partes, capítulos e progresso</small>
        </Link>
      </section>

      <p className="rodape-info">
        O app respeita a ordem de prioridades: campanha SESMT do mês → 6 meses sem repetição →
        diversidade de tema.
      </p>
    </div>
  );
}
