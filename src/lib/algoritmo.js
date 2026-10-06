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

/** Chave curta "MM-DD" usada pelos dias celebrados (comemorativos). */
export const chaveDiaCurto = (agora = new Date()) =>
  `${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;

/**
 * Nome, cor, assunto e DDS central das campanhas do calendário SESMT, por mês.
 * `cor` colore dinamicamente os cards (ex.: "Outubro Rosa" → tom rosado);
 * `assunto` diz de que trata a campanha (ex.: "Conscientização sobre o Câncer
 * de Mama") e é exibido no card: "Outubro Rosa — Conscientização sobre o
 * Câncer de Mama."; `ids` são os DDS que mais conversam com o tema central da
 * campanha e têm prioridade na sugestão do mês (janela de 6 meses).
 */
export const CAMPANHAS_MES = {
  janeiro: {
    nome: "Janeiro Branco",
    cor: "#7fa3c3",
    assunto: "Conscientização sobre a Saúde Mental",
    texto: "Mês da saúde mental: o estresse, o sono e a rotina também são riscos de segurança.",
    ids: ["janeiro-a-carga-invisivel-do-esgotamento"],
  },
  fevereiro: {
    nome: "Fevereiro Roxo",
    cor: "#8a5db5",
    assunto: "Doenças Invisíveis: Lúpus, Fibromialgia e Alzheimer",
    texto: "Doenças invisíveis e os cuidados que evitam o desgaste: exames, pausas ativas e ergonomia.",
    ids: ["fevereiro-microtraumas-e-a-acumulacao-invisivel"],
  },
  marco: {
    nome: "Março Lilás",
    cor: "#b06ab3",
    assunto: "Saúde e Segurança da Mulher",
    texto: "Mês da mulher: prevenção, inclusão e segurança da trabalhadora.",
    ids: ["marco-prevencao-na-saude-da-mulher"],
  },
  abril: {
    nome: "Abril Verde",
    cor: "#3e9b4f",
    assunto: "Segurança e Saúde no Trabalho",
    texto: "Mês da segurança e saúde no trabalho — 28 de abril, regras de ouro e direito de recusa.",
    ids: ["abril-28-de-abril"],
  },
  maio: {
    nome: "Maio Amarelo",
    cor: "#c99a00",
    assunto: "Segurança no Trânsito",
    texto: "Mês do trânsito seguro: atenção no trajeto, direção defensiva e o risco do celular ao volante.",
    ids: ["maio-direcao-defensiva-no-trajeto"],
  },
  junho: {
    nome: "Junho Verde",
    cor: "#2e8b57",
    assunto: "Meio Ambiente e Doação de Sangue",
    texto: "Mês do meio ambiente: resíduos, descarte correto e sustentabilidade com segurança.",
    ids: ["junho-a-sustentabilidade-e-o-sesmt"],
  },
  julho: {
    nome: "Julho Amarelo",
    cor: "#c99a00",
    assunto: "Prevenção e Combate às Hepatites Virais",
    texto: "Mês das hepatites virais: prevenção, higiene e proteção no trabalho.",
    ids: ["julho-higiene-ocupacional-hepatites-virais"],
  },
  agosto: {
    nome: "Agosto Dourado",
    cor: "#bf8f00",
    assunto: "Aleitamento Materno e Combate ao Assédio",
    texto: "Mês do cuidado: aleitamento, saúde e respeito no ambiente de trabalho.",
    ids: ["agosto-aleitamento-e-saude-da-familia", "agosto-prevencao-ao-assedio"],
  },
  setembro: {
    nome: "Setembro Amarelo",
    cor: "#d19e00",
    assunto: "Prevenção ao Suicídio e Valorização da Vida",
    texto: "Mês da valorização da vida: escuta ativa e saúde mental no turno.",
    ids: ["setembro-a-valorizacao-da-vida"],
  },
  outubro: {
    nome: "Outubro Rosa",
    cor: "#d95f8b",
    assunto: "Conscientização sobre o Câncer de Mama",
    texto: "Mês da prevenção ao câncer de mama: autocuidado, exames e informação salvam vidas.",
    ids: ["outubro-autocuidado-e-exames"],
  },
  novembro: {
    nome: "Novembro Azul",
    cor: "#4a6fc4",
    assunto: "Saúde do Homem e Prevenção ao Câncer de Próstata",
    texto: "Mês da saúde do homem: exames, coração e a quebra de tabus.",
    ids: ["novembro-o-homem-que-nao-procura", "novembro-saude-do-homem-e-tabus"],
  },
  dezembro: {
    nome: "Dezembro Laranja",
    cor: "#e07b2f",
    assunto: "Prevenção ao Câncer de Pele e Combate ao HIV",
    texto: "Mês da prevenção ao câncer de pele e das celebrações com responsabilidade.",
    ids: ["dezembro-radiacao-solar"],
  },
};

/**
 * Dias celebrados que dão prioridade a um DDS alusivo à data (ids do
 * catálogo). A campanha em vigor passa a ser a do dia celebrado.
 */
export const DIAS_CELEBRADOS = {
  "03-08": {
    campanha: "marco",
    dia: "Dia Internacional da Mulher",
    ids: ["marco-prevencao-na-saude-da-mulher", "marco-inclusao-e-seguranca-da-mulher"],
  },
  "04-28": {
    campanha: "abril",
    dia: "Dia Mundial da Segurança e Saúde no Trabalho",
    ids: ["abril-28-de-abril"],
  },
  "06-05": {
    campanha: "junho",
    dia: "Dia Mundial do Meio Ambiente",
    ids: ["junho-vazamentos-de-oleo-e-quimicos", "junho-a-sustentabilidade-e-o-sesmt"],
  },
  "06-14": {
    campanha: "junho",
    dia: "Dia Mundial do Doador de Sangue",
    ids: ["junho-a-solidariedade-e-a-doacao-de-sangue"],
  },
  "07-28": {
    campanha: "julho",
    dia: "Dia Mundial de Combate às Hepatites",
    ids: ["julho-higiene-ocupacional-hepatites-virais"],
  },
  "09-10": {
    campanha: "setembro",
    dia: "Dia Mundial de Prevenção ao Suicídio",
    ids: ["setembro-a-valorizacao-da-vida"],
  },
  "10-10": {
    campanha: "outubro",
    dia: "Dia Nacional de Segurança e Saúde nas Escolas",
    ids: ["outubro-seguranca-nas-escolas"],
  },
  "10-19": {
    campanha: "outubro",
    dia: "Dia Internacional de Combate ao Câncer de Mama",
    ids: ["outubro-autocuidado-e-exames"],
  },
  "11-27": {
    campanha: "novembro",
    dia: "Dia do Técnico de Segurança do Trabalho",
    ids: ["novembro-o-dia-do-tst-e-engenheiro"],
  },
  "12-01": {
    campanha: "dezembro",
    dia: "Dia Mundial de Combate à AIDS",
    ids: ["dezembro-prevencao-ao-hiv"],
  },
  "12-11": {
    campanha: "dezembro",
    dia: "Dia do Engenheiro",
    ids: ["dezembro-o-dia-do-engenheiro"],
  },
};

/**
 * Campanha em vigor hoje: o dia celebrado tem prioridade sobre o mês.
 * Sem campanha para o mês ou dia, devolve null (e o card não é exibido).
 */
export const campanhaDoDia = (agora = new Date()) => {
  const celebrado = DIAS_CELEBRADOS[chaveDiaCurto(agora)];
  if (celebrado) {
    const campanha = CAMPANHAS_MES[celebrado.campanha];
    if (campanha) {
      return {
        chave: celebrado.campanha,
        nome: campanha.nome,
        cor: campanha.cor,
        assunto: campanha.assunto,
        texto: campanha.texto,
        dia: celebrado.dia,
      };
    }
  }
  const campanhaMes = CAMPANHAS_MES[mesAtual(agora)];
  return campanhaMes
    ? {
        chave: mesAtual(agora),
        nome: campanhaMes.nome,
        cor: campanhaMes.cor,
        assunto: campanhaMes.assunto,
        texto: campanhaMes.texto,
        dia: null,
      }
    : null;
};

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

  const mes = mesAtual(agora);

  // Núcleo da campanha (DDS que mais conversam com o tema, ex.: "Outubro Rosa"
  // → prevenção do câncer de mama) tem prioridade, desde que não tenha sido
  // lido há menos de 6 meses.
  const nucleo = (CAMPANHAS_MES[mes]?.ids ?? [])
    .map((id) => catalogo.find((item) => item.id === id))
    .filter((item) => item && !leituraRecente(historico.leituras[item.id], DIAS_JANELA_LEITURA, agora));
  if (nucleo.length) return { dds: sortear(nucleo), origem: "campanha" };

  const doMes = catalogo.filter(
    (item) =>
      item.campanha_sesmt === mes &&
      !leituraRecente(historico.leituras[item.id], DIAS_JANELA_LEITURA, agora),
  );
  const escolhido = sortear(doMes.length ? doMes : catalogo.filter((i) => i.campanha_sesmt === mes));
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

  // Dia celebrado tem prioridade sobre a campanha do mês: o DDS sugerido
  // alude à data (ex.: 28/04 → "Abril — 28 de Abril").
  const celebrado = DIAS_CELEBRADOS[chaveDiaCurto(agora)];
  if (celebrado) {
    const disponiveis = celebrado.ids.filter(
      (id) => id && !leituraRecente(historico.leituras[id], DIAS_JANELA_LEITURA, agora),
    );
    const candidatos = disponiveis
      .map((id) => catalogo.find((item) => item.id === id))
      .filter(Boolean);
    if (candidatos.length) {
      return { dds: sortear(candidatos), origem: "campanha", doDia: false };
    }
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
