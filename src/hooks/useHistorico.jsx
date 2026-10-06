import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { chaveDia, chaveMes } from "../lib/algoritmo.js";

/**
 * Histórico de leituras e sugestões persistido no dispositivo
 * (localStorage, conforme o plano: backend-less).
 */
const CHAVE = "dds-na-mao:historico:v1";
const Contexto = createContext(null);

const vazio = () => ({
  versao: 1,
  leituras: {}, // id -> ISO da última leitura
  sugestoes: {}, // "AAAA-MM-DD" -> id sugerido
  campanhaDoMes: {}, // "AAAA-MM" -> id da campanha já sorteada no mês
  ultimoTema: null,
});

const ler = () => {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return vazio();
    return { ...vazio(), ...JSON.parse(bruto) };
  } catch {
    return vazio();
  }
};

const gravar = (historico) => {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(historico));
  } catch {
    /* modo privado / cota cheia: segue apenas em memória */
  }
};

export function HistoricoProvider({ children }) {
  const [historico, setHistorico] = useState(ler);

  const atualizar = useCallback((mutacao) => {
    setHistorico((atual) => {
      const proximo = mutacao(atual);
      gravar(proximo);
      return proximo;
    });
  }, []);

  const registrarLeitura = useCallback(
    (id) =>
      atualizar((atual) => ({
        ...atual,
        leituras: { ...atual.leituras, [id]: new Date().toISOString() },
      })),
    [atualizar],
  );

  const registrarSugestao = useCallback(
    ({ dds, origem }) =>
      atualizar((atual) => {
        const agora = new Date();
        const proximo = {
          ...atual,
          sugestoes: { ...atual.sugestoes, [chaveDia(agora)]: dds.id },
          ultimoTema: dds.tema,
        };
        if (origem === "campanha") {
          proximo.campanhaDoMes = { ...atual.campanhaDoMes, [chaveMes(agora)]: dds.id };
        }
        return proximo;
      }),
    [atualizar],
  );

  const limparHistorico = useCallback(() => atualizar(() => vazio()), [atualizar]);

  const valor = useMemo(
    () => ({ historico, registrarLeitura, registrarSugestao, limparHistorico }),
    [historico, registrarLeitura, registrarSugestao, limparHistorico],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useHistorico = () => {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useHistorico precisa estar dentro de <HistoricoProvider>");
  return contexto;
};

/** Quantidade de DDS lidos dentro da janela de 6 meses. */
export const contarLidos = (historico, dias = 180) => {
  const limite = Date.now() - dias * 86400000;
  return Object.values(historico.leituras).filter(
    (data) => new Date(data).getTime() >= limite,
  ).length;
};
