/**
 * Os arquivos de conteúdo começam com "# DDS: <título>", mas a tela de leitura
 * e a folha de impressão já exibem o título do catálogo logo acima do texto.
 * Remove esse H1 inicial (e a linha em branco seguinte) para não repetir o
 * título duas vezes. Textos sem H1 no início passam inalterados.
 */
export const semTituloInicial = (texto) => {
  const linhas = String(texto ?? "").split(/\r?\n/);

  let inicio = 0;
  while (inicio < linhas.length && linhas[inicio].trim() === "") inicio += 1;

  if (inicio >= linhas.length || !/^#\s+/.test(linhas[inicio])) return texto;

  linhas.splice(inicio, 1);
  while (inicio < linhas.length && linhas[inicio].trim() === "") linhas.splice(inicio, 1);

  return linhas.join("\n");
};
