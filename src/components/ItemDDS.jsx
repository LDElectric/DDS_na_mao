import { Link } from "react-router-dom";
import { rotuloParte, rotuloTema } from "../lib/catalogo.js";

export default function ItemDDS({ item, lido = false }) {
  return (
    <Link to={`/ler/${item.id}`} className="item-dds">
      <div className="item-dds__corpo">
        <span className="etiqueta etiqueta--tema">{rotuloTema(item.tema)}</span>
        <h3 className="item-dds__titulo">{item.titulo}</h3>
        {item.subtitulo && <p className="item-dds__subtitulo">{item.subtitulo}</p>}
        <small className="item-dds__meta">
          {rotuloParte(item.parte)} · {item.capitulo_nome}
        </small>
      </div>
      <span
        className={`item-dds__situacao${lido ? " item-dds__situacao--lido" : ""}`}
        aria-label={lido ? "Lido" : "Não lido"}
      >
        {lido ? "✓" : "›"}
      </span>
    </Link>
  );
}
