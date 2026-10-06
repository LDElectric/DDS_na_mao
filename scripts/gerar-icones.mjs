/**
 * Gera os icones do PWA "DDS na mao" usando sharp + SVG source.
 *
 * Arquivos gerados:
 *   public/icon-192.png          - icone normal 192x192
 *   public/icon-512.png          - icone normal 512x512
 *   public/icon-512-maskable.png - icone adaptavel (safe-zone 80%)
 *
 * Uso: npm run icones
 * Requer: npm install --save-dev sharp (ja instalado)
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicDir = path.join(RAIZ, "public");
const svgPath = path.join(publicDir, "icon-source.svg");

if (!fs.existsSync(svgPath)) {
  console.error("ERRO: public/icon-source.svg nao encontrado.");
  process.exit(1);
}

const svgBuffer = fs.readFileSync(svgPath);

const icones = [
  { arquivo: "icon-192.png", tamanho: 192 },
  { arquivo: "icon-512.png", tamanho: 512 },
  { arquivo: "icon-512-maskable.png", tamanho: 512 },
];

for (const { arquivo, tamanho } of icones) {
  const destino = path.join(publicDir, arquivo);
  // Remove o arquivo existente antes de recriar (evita bloqueio no Windows)
  if (fs.existsSync(destino)) fs.unlinkSync(destino);
  await sharp(svgBuffer).resize(tamanho, tamanho).png().toFile(destino);
  const stat = fs.statSync(destino);
  console.log(`OK  public/${arquivo}  (${tamanho}x${tamanho}, ${stat.size} bytes)`);
}

console.log("\nIcones PWA gerados com sucesso!");
