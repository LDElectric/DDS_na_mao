import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Cabecalho from "./components/Cabecalho.jsx";
import Rodape from "./components/Rodape.jsx";
import { CatalogoProvider } from "./hooks/useCatalogo.jsx";
import { HistoricoProvider } from "./hooks/useHistorico.jsx";
import Biblioteca from "./pages/Biblioteca.jsx";
import Busca from "./pages/Busca.jsx";
import Home from "./pages/Home.jsx";
import Leitura from "./pages/Leitura.jsx";

const CHAVE_TEMA = "dds-na-mao:tema";

export default function App() {
  const [tema, setTema] = useState(() => localStorage.getItem(CHAVE_TEMA) ?? "escuro");

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem(CHAVE_TEMA, tema);
  }, [tema]);

  return (
    <HistoricoProvider>
      <CatalogoProvider>
        <div className="app">
          <Cabecalho tema={tema} onAlternarTema={() => setTema(tema === "escuro" ? "claro" : "escuro")} />
          <main className="conteudo">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ler/:id" element={<Leitura />} />
              <Route path="/busca" element={<Busca />} />
              <Route path="/biblioteca" element={<Biblioteca />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Rodape />
        </div>
      </CatalogoProvider>
    </HistoricoProvider>
  );
}
