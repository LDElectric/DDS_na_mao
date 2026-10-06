/**
 * Motor de sugestão do "DDS na Mão".
 *
 * Prioridade 1: Calendário SESMT (primeiro DDS do mês).
 * Prioridade 2: Regra dos 6 meses (antirrepeticão).
 * Prioridade 3: Regra de diversidade (evitar monotonia de tema).
 */

export const MESES = [
  "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export const DIAS_JANELA_LEITURA = 180; // "Regra dos 6 meses"

const doisDigitos = (n) => String(n).padStart(2, "0");

export const chaveDia = (agora = new Date()) =>
  `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;

export const chaveMes = (agora = new Date()) =>
  `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}`;

export const mesAtual = (agora = new Date()) => MESES[agora.getMonth()];

const sortear = (lista) =>
  lista.length ? lista[Math.floor(Math.random() * lista.length)] : null;

const leituraRecente = (data, dias, agora) =>
  Boolean(data) && agora.getTime() - new Date(data).getTime() < dias * 86400000;

/**
 * Prioridade 1 - Calendário SESMT.
 * Devolve um DDS de campanha somente quando ainda não houve sugestão
 * de campanha registrada neste mês.
 */
export const verificarCampanhaMes = (catalogo, historico, agora = new Date()) => {
  if (historico.campanhaDoMes[chaveMes(agora)]) return null;

  const doMes = catalogo.filter(
    (item) =>
      item.campanha_sesmt === mesAtual(agora) &&
      !leituraRecente(historico.leituras[item.id], DIAS_JANELA_LEITURA, agora),
  );
  const escolhido = sortear(doMes.length ? doMes : catalogo.filter((i) => i.campanha_sesmt === mesAtual(agora)));
  return escolhido ? { dds: escolhido, origem: "campanha" } : null;
};

/**
 * Prioridade 2 - Regra dos 6 meses.
 * Exclui da lista de sorteio tudo que foi lido nos últimos 180 dias.
 * (A pesquisa manual nunca passa por este filtro.)
 */
export const filtrarLidosRecentes = (catalogo, historico, dias = DIAS_JANELA_LEITURA, agora = new Date()) =>
  catalogo.filter((item) => !leituraRecente(historico.leituras[item.id], dias, agora));

/**
 * Prioridade 3 - Regra de diversidade.
 * Evita repetir o tema do último DDS sugerido.
 */
export const sortearNovoDDS = (catalogoFiltrado, ultimoTema) => {
  if (!catalogoFiltrado.length) return null;
  const diverso = catalogoFiltrado.filter((item) => item.tema !== ultimoTema);
  return sortear(diverso.length ? diverso : catalogoFiltrado);
};

/**
 * Sugestão do dia: respeita a ordem estrita de prioridades e, quando já
 * existe sugestão registrada para hoje, devolve a mesma.
 */
export const sugerirDoDia = (catalogo, historico, agora = new Date()) => {
  if (!catalogo.length) return null;

  const salva = historico.sugestoes[chaveDia(agora)];
  if (salva) {
    const dds = catalogo.find((item) => item.id === salva);
    if (dds) return { dds, origem: "do-dia", doDia: true };
  }

  const campanha = verificarCampanhaMes(catalogo, historico, agora);
  if (campanha) return { ...campanha, doDia: false };

  return sortearResultado(catalogo, historico, { agora });
};

/** Re-sorteio manual ("Sortear outro"), mantendo as prioridades 2 e 3. */
export const sortearOutro = (catalogo, historico, { agora = new Date(), excluirId = null } = {}) => {
  if (!catalogo.length) return null;

  const filtrado = filtrarLidosRecentes(catalogo, historico, DIAS_JANELA_LEITURA, agora).filter(
    (item) => item.id !== excluirId,
  );
  const base = filtrado.length ? filtrado : catalogo.filter((item) => item.id !== excluirId);

  return sortearResultado(catalogo, historico, { agora, base, antirepeticao: filtrado.length > 0 });
};

const sortearResultado = (catalogo, historico, { agora, base = null, antirepeticao = null } = {}) => {
  const recentes = base ?? filtrarLidosRecentes(catalogo, historico, DIAS_JANELA_LEITURA, agora);
  const lista = base ?? (recentes.length ? recentes : catalogo);
  const dds = sortearNovoDDS(lista, historico.ultimoTema);
  if (!dds) return null;
  const repetiu = antirepeticao ?? recentes.length > 0;
  return { dds, origem: repetiu ? "antirepeticao" : "catalogo-total", doDia: false };
};

/** Rótulos legíveis para os códigos de origem/exibição. */
export const ROTULOS_ORIGEM = {
  campanha: "Campanha do mês",
  "do-dia": "Sugestão do dia",
  antirepeticao: "Fora da janela de 6 meses",
  "catalogo-total": "Todo o catálogo",
};
