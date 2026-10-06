/**
 * Gera os ícones PNG do PWA (192, 512 e 512 maskable) sem dependências externas.
 * Desenho: sigla "DDS" em âmbar sobre fundo azul-escuro.
 *
 * Uso: npm run icones
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const FUNDO = [11, 18, 32, 255]; // #0b1220
const TRACO = [245, 158, 11, 255]; // #f59e0b

// Fonte 5x7 usada para desenhar as letras.
const GLIFOS = {
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
};

const CRC_TABELA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABELA[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (tipo, dados) => {
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo), 0);
  return Buffer.concat([tamanho, corpo, crc]);
};

/** Renderiza "DDS" centralizado em um canvas RGBA. */
const desenhar = (tamanho, fracaoTexto) => {
  const px = Buffer.alloc(tamanho * tamanho * 4);
  for (let i = 0; i < tamanho * tamanho; i++) {
    px[i * 4] = FUNDO[0];
    px[i * 4 + 1] = FUNDO[1];
    px[i * 4 + 2] = FUNDO[2];
    px[i * 4 + 3] = FUNDO[3];
  }

  const letras = ["D", "D", "S"];
  const colunas = letras.length * 5 + (letras.length - 1); // 1 glifo 5 col + 1 espaçamento
  const linhas = 7;
  const escala = Math.max(1, Math.floor((tamanho * fracaoTexto) / Math.max(colunas, linhas)));
  const largura = colunas * escala;
  const altura = linhas * escala;
  const origemX = Math.floor((tamanho - largura) / 2);
  const origemY = Math.floor((tamanho - altura) / 2);

  letras.forEach((letra, indice) => {
    const mapa = GLIFOS[letra];
    const baseX = origemX + indice * 6 * escala;
    mapa.forEach((linha, y) => {
      [...linha].forEach((celula, x) => {
        if (celula !== "#") return;
        for (let dy = 0; dy < escala; dy++) {
          for (let dx = 0; dx < escala; dx++) {
            const px2 = baseX + x * escala + dx;
            const py2 = origemY + y * escala + dy;
            const offset = (py2 * tamanho + px2) * 4;
            px[offset] = TRACO[0];
            px[offset + 1] = TRACO[1];
            px[offset + 2] = TRACO[2];
            px[offset + 3] = TRACO[3];
          }
        }
      });
    });
  });

  return px;
};

const gerarPng = (tamanho, arquivo, fracaoTexto) => {
  const px = desenhar(tamanho, fracaoTexto);
  const linhas = Buffer.alloc((tamanho * 4 + 1) * tamanho);
  for (let y = 0; y < tamanho; y++) {
    linhas[y * (tamanho * 4 + 1)] = 0; // filtro "None"
    px.copy(linhas, y * (tamanho * 4 + 1) + 1, y * tamanho * 4, (y + 1) * tamanho * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(linhas, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(path.join(RAIZ, "public", arquivo), png);
  console.log(`✔ public/${arquivo} (${tamanho}x${tamanho}, ${png.length} bytes)`);
};

gerarPng(192, "icon-192.png", 0.72);
gerarPng(512, "icon-512.png", 0.72);
gerarPng(512, "icon-512-maskable.png", 0.55); // zona segura do maskable
