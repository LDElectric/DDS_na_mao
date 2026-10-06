import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { carregarCatalogo } from "../lib/catalogo.js";

const Contexto = createContext(null);

/** Carrega o catálogo JSON uma única vez e o disponibiliza para as telas. */
export function CatalogoProvider({ children }) {
  const [estado, setEstado] = useState({ carregando: true, erro: null, itens: [] });

  const carregar = useCallback(() => {
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }));
    carregarCatalogo()
      .then((itens) => setEstado({ carregando: false, erro: null, itens }))
      .catch((erro) => setEstado({ carregando: false, erro, itens: [] }));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const valor = useMemo(() => ({ ...estado, recarregar: carregar }), [estado, carregar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const useCatalogo = () => {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useCatalogo precisa estar dentro de <CatalogoProvider>");
  return contexto;
};
