import { Suspense, lazy, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Cabecalho from "./components/Cabecalho.jsx";
import Rodape from "./components/Rodape.jsx";
import { CatalogoProvider } from "./hooks/useCatalogo.jsx";
import { HistoricoProvider } from "./hooks/useHistorico.jsx";
import Biblioteca from "./pages/Biblioteca.jsx";
import Busca from "./pages/Busca.jsx";
import Home from "./pages/Home.jsx";
import Lidos from "./pages/Lidos.jsx";

// A tela de Leitura puxa o react-markdown: carregada sob demanda para
// deixar o bundle inicial (e o primeiro paint) mais leve.
const Leitura = lazy(() => import("./pages/Leitura.jsx"));
const Imprimir = lazy(() => import("./pages/Imprimir.jsx"));

const CHAVE_TEMA = "dds-na-mao:tema";

export default function App() {
  const [tema, setTema] = useState(() => localStorage.getItem(CHAVE_TEMA) ?? "claro");

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
            <Suspense fallback={<p className="aviso">Preparando a tela…</p>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/ler/:id" element={<Leitura />} />
                <Route path="/imprimir/:id" element={<Imprimir />} />
                <Route path="/busca" element={<Busca />} />
                <Route path="/biblioteca" element={<Biblioteca />} />
                <Route path="/lidos" element={<Lidos />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </Suspense>
          </main>
          <Rodape />
        </div>
      </CatalogoProvider>
    </HistoricoProvider>
  );
}
