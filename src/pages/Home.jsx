import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import {
  contarLidos,
  escolhaDoDia,
  nomeLeitor,
  registradoHoje,
  useHistorico,
} from "../hooks/useHistorico.jsx";
import {
  DIAS_JANELA_LEITURA,
  ROTULOS_ORIGEM,
  chaveDia,
  sortearOutro,
  sugerirDoDia,
} from "../lib/algoritmo.js";
import { rotuloParte, rotuloTema } from "../lib/catalogo.js";

const horaDo = (iso) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default function Home() {
  const { itens, carregando, erro, recarregar } = useCatalogo();
  const { historico, registrarSugestao } = useHistorico();
  const localizacao = useLocation();
  const [sugestao, setSugestao] = useState(null);

  // DDS já escolhido hoje: ele substitui a sugestão e vale para todos os turnos.
  const escolha = escolhaDoDia(historico);
  const ddsDoDia = escolha ? itens.find((dds) => dds.id === escolha.id) ?? null : null;

  // Sorteio inicial (ou re-sorteio quando a tela veio da leitura).
  // Sem re-sorteio se já existe DDS fixado do dia: ele permanece até 23:59.
  useEffect(() => {
    if (carregando || erro || !itens.length || sugestao || ddsDoDia) return;

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

  const lidos = contarLidos(historico);
  const dds = ddsDoDia ?? sugestao?.dds;
  const hoje = registradoHoje(historico);

  return (
    <div className="pagina">
      <section className="destaque">
        <header className="destaque__cabecalho">
          {ddsDoDia ? (
            <>
              <span className="etiqueta etiqueta--escolha">✓ DDS do dia</span>
              <span className="etiqueta etiqueta--origem">
                Escolhido às {horaDo(escolha.iso)}
                {nomeLeitor(historico, escolha.id) ? ` · ${nomeLeitor(historico, escolha.id)}` : ""}
              </span>
            </>
          ) : (
            <>
              <span className="etiqueta">Sugestão do dia</span>
              {sugestao && (
                <span className="etiqueta etiqueta--origem">{ROTULOS_ORIGEM[sugestao.origem]}</span>
              )}
            </>
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

            {ddsDoDia ? (
              <>
                <div className="destaque__acoes">
                  <Link className="botao botao--primario" to={`/ler/${dds.id}`}>
                    Ver texto
                  </Link>
                  <Link className="botao" to="/busca">
                    Registrar outro DDS
                  </Link>
                </div>
                <p className="destaque__nota">
                  📍 Fixado às {horaDo(escolha.iso)} e válido até 23:59: todos os turnos de hoje
                  leem este mesmo DDS. Outros turnos podem registrar DDS adicional sem trocar o
                  fixado.
                </p>
                {hoje > 1 && (
                  <Link className="link-suave" to="/lidos">
                    {hoje} DDS registrados hoje · ver todos
                  </Link>
                )}
              </>
            ) : (
              <>
                <div className="destaque__acoes">
                  <Link className="botao botao--primario" to={`/ler/${dds.id}`}>
                    Ver texto
                  </Link>
                  <button type="button" className="botao" onClick={aoSortear}>
                    Sortear outro
                  </button>
                </div>

                <div className="escolha">
                  <p className="escolha__ajuda">
                    📖 O texto é só para leitura: ele só será registrado como{" "}
                    <strong>DDS escolhido</strong> quando você tocar em{" "}
                    <strong>✓ Escolher este DDS</strong> lá dentro. Enquanto isso, dá para ver
                    quantos quiser.
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          <p>Sorteando…</p>
        )}
      </section>

      <section className="painel-estatisticas" aria-label="Resumo">
        <Link className="painel-estatisticas__item" to={`/lidos?janela=${DIAS_JANELA_LEITURA}`}>
          <strong>{lidos}</strong>
          <span>lidos em {DIAS_JANELA_LEITURA} dias</span>
        </Link>
        <Link className="painel-estatisticas__item" to="/biblioteca">
          <strong>{itens.length}</strong>
          <span>DDS no catálogo</span>
        </Link>
        <Link className="painel-estatisticas__item" to="/lidos">
          <strong>{Object.keys(historico.leituras).length}</strong>
          <span>lidos no total</span>
        </Link>
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
        Ciclo do dia: ler → <strong>escolher</strong> → imprimir com ata. A 1ª escolha fica fixada
        até 23:59 (turnos do mesmo dia usam o mesmo DDS). Sugestões seguem campanha SESMT do mês →
        6 meses sem repetição → diversidade de tema.
      </p>
    </div>
  );
}
