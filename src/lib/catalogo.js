/** Acesso ao catálogo estático publicado em /public/conteudo. */

const BASE = import.meta.env.BASE_URL;

export const URL_CATALOGO = `${BASE}conteudo/catalogo.json`;

export const urlConteudo = (item) => `${BASE}${item.arquivo_md}`;

export const TEMAS = {
  cultura: "Cultura e Comportamento",
  "gestao-de-riscos": "Gestão de Riscos",
  ergonomia: "Ergonomia",
  "saude-mental": "Saúde Mental",
  "higiene-ocupacional": "Higiene Ocupacional",
  "maquinas-e-equipamentos": "Máquinas e Equipamentos",
  eletricidade: "Eletricidade e Bloqueio",
  "trabalho-em-altura": "Trabalho em Altura",
  "espacos-confinados": "Espaços Confinados",
  incendio: "Incêndio e Atmosfera Explosiva",
  logistica: "Logística e Cargas",
  emergencias: "Emergências e Primeiros Socorros",
  "meio-ambiente": "Meio Ambiente",
  "seguranca-vida": "Segurança Fora do Trabalho",
  "campanha-sesmt": "Campanha SESMT",
  geral: "Geral",
};

export const rotuloTema = (tema) => TEMAS[tema] ?? tema;

export const PARTES = {
  1: "Parte I · A Base da Segurança",
  2: "Parte II · Saúde Integral",
  3: "Parte III · Higiene Ocupacional",
  4: "Parte IV · Riscos Operacionais",
  5: "Parte V · Logística, Meio Ambiente e Sociedade",
  6: "Parte VI · Calendário Anual SESMT",
};

export const rotuloParte = (parte) => PARTES[parte] ?? `Parte ${parte}`;

let promessaCache = null;

/** Carrega o catálogo uma única vez por sessão (o Service Worker cuida do offline). */
export const carregarCatalogo = () => {
  if (!promessaCache) {
    promessaCache = fetch(URL_CATALOGO, { cache: "no-cache" })
      .then((resposta) => {
        if (!resposta.ok) throw new Error(`Falha ao carregar o catálogo (${resposta.status})`);
        return resposta.json();
      })
      .catch((erro) => {
        promessaCache = null;
        throw erro;
      });
  }
  return promessaCache;
};

const normalizar = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Busca por título, subtítulo, tema e capítulo (ignora acentos). */
export const buscarDDS = (catalogo, termo, { tema = null } = {}) => {
  const lista = tema ? catalogo.filter((item) => item.tema === tema) : catalogo;
  const consulta = normalizar(termo).trim();
  if (!consulta) return lista;

  return lista.filter((item) =>
    [
      item.titulo,
      item.subtitulo,
      rotuloTema(item.tema),
      item.capitulo_nome,
      item.parte_nome,
      item.campanha_sesmt,
    ]
      .map(normalizar)
      .join(" ")
      .includes(consulta),
  );
};
