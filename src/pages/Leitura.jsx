import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCatalogo } from "../hooks/useCatalogo.jsx";
import { useHistorico } from "../hooks/useHistorico.jsx";
import { rotuloParte, rotuloTema, urlConteudo } from "../lib/catalogo.js";

export default function Leitura() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { itens, carregando } = useCatalogo();
  const { registrarLeitura } = useHistorico();
  const [fonte, setFonte] = useState(null);
  const [erro, setErro] = useState(null);

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
        if (!ativo) return;
        setFonte(texto);
        registrarLeitura(item.id);
      })
      .catch((falha) => ativo && setErro(falha));

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (carregando) return <p className="aviso">Carregando…</p>;

  if (!item) {
    return (
      <div className="aviso aviso--erro">
        <p>DDS não encontrado no catálogo.</p>
        <Link className="botao" to="/busca">
          Ir para a busca
        </Link>
      </div>
    );
  }

  return (
    <article className="leitura">
      <nav className="leitura__topo">
        <button type="button" className="botao botao--fantasma" onClick={() => navegar(-1)}>
          ‹ Voltar
        </button>
        <button
          type="button"
          className="botao botao--fantasma"
          onClick={() => navegar("/", { state: { sortear: true } })}
        >
          Sortear outro
        </button>
      </nav>

      <header className="leitura__cabecalho">
        <div className="destaque__tags">
          <span className="etiqueta etiqueta--tema">{rotuloTema(item.tema)}</span>
          {item.campanha_sesmt && (
            <span className="etiqueta etiqueta--campanha">Campanha: {item.campanha_sesmt}</span>
          )}
        </div>
        <h1>{item.titulo}</h1>
        {item.subtitulo && <p className="leitura__subtitulo">{item.subtitulo}</p>}
        <p className="destaque__meta">
          {rotuloParte(item.parte)} · {item.capitulo_nome}
        </p>
      </header>

      {erro && (
        <div className="aviso aviso--erro">
          <p>Não foi possível carregar o texto. Verifique a conexão.</p>
        </div>
      )}

      {!fonte && !erro && <p className="aviso">Carregando texto…</p>}

      {fonte && (
        <div className="markdown">
          <ReactMarkdown>{fonte}</ReactMarkdown>
        </div>
      )}

      <footer className="leitura__rodape">
        <button
          type="button"
          className="botao botao--primario"
          onClick={() => navegar("/", { state: { sortear: true } })}
        >
          Sortear outro DDS
        </button>
        <Link className="botao" to="/biblioteca">
          Ver biblioteca
        </Link>
      </footer>
    </article>
  );
}
