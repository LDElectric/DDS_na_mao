import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import {
  escolhaDoDia,
  nomeLeitor,
  registradoHoje,
  useHistorico,
} from "../hooks/useHistorico.jsx";
import {
  ROTULOS_ORIGEM,
  campanhaDoDia,
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

  const dds = ddsDoDia ?? sugestao?.dds;
  const hoje = registradoHoje(historico);
  const campanhaAtual = campanhaDoDia();

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
              {sugestao && sugestao.origem !== "do-dia" && (
                <span className="etiqueta etiqueta--origem">{ROTULOS_ORIGEM[sugestao.origem]}</span>
              )}
            </>
          )}
        </header>

        {dds ? (
          <>
            <div className="destaque__tags">
              {dds.tema !== "campanha-sesmt" && (
                <span className="etiqueta etiqueta--tema">{rotuloTema(dds.tema)}</span>
              )}
              {dds.campanha_sesmt === campanhaAtual?.chave && (
                <span className="etiqueta etiqueta--campanha" style={{ "--campanha-cor": campanhaAtual.cor }}>
                  📢 {campanhaAtual.nome}
                </span>
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

      {campanhaAtual && (
        <aside className="campanha-mes" style={{ "--campanha-cor": campanhaAtual.cor }}>
          <strong>📢 {campanhaAtual.nome}</strong>
          {campanhaAtual.assunto && (
            <span className="campanha-mes__assunto">{campanhaAtual.assunto}.</span>
          )}
          {campanhaAtual.dia && <span className="campanha-mes__dia">{campanhaAtual.dia}</span>}
          <p>{campanhaAtual.texto}</p>
        </aside>
      )}

      <section className="painel-estatisticas" aria-label="Resumo">
        <Link className="painel-estatisticas__item" to="/lidos">
          <strong>{Object.keys(historico.leituras).length}</strong>
          <span>DDS lidos</span>
        </Link>
        <Link className="painel-estatisticas__item" to="/biblioteca">
          <strong>{itens.length}</strong>
          <span>DDS no catálogo</span>
        </Link>
      </section>
    </div>
  );
}
