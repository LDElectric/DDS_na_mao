/** Quantidade de DDS lidos dentro da janela (padrão: 6 meses). */
export const contarLidos = (historico, dias = 180, agora = Date.now()) => {
  const limite = agora - dias * 86400000;
  return Object.values(historico.leituras).filter(
    (data) => new Date(data).getTime() >= limite,
  ).length;
};

/** Lista de leituras (mais recente primeiro), opcionalmente só da janela em dias. */
export const listarLeituras = (historico, itens, dias = null, agora = Date.now()) => {
  const porId = new Map(itens.map((item) => [item.id, item]));
  const limite = dias == null ? 0 : agora - dias * 86400000;
  return Object.entries(historico.leituras)
    .filter(([, iso]) => new Date(iso).getTime() >= limite)
    .map(([id, iso]) => {
      const item = porId.get(id) ?? null;
      return {
        id,
        iso,
        item,
        titulo: item?.titulo ?? "DDS indisponível no catálogo",
      };
    })
    .sort((a, b) => new Date(b.iso) - new Date(a.iso));
};

export const formatarDataLeitura = (iso) => {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "data desconhecida";
  const dia = data.toLocaleDateString("pt-BR");
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} às ${hora}`;
};
