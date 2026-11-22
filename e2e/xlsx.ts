import { crc32, deflateRawSync } from "node:zlib";

/** Monta um .xlsx de verdade (zip com os xml mínimos) para os testes de importação. */
export function criarXlsx(abas: { nome: string; linhas: (string | number | null)[][] }[]): Buffer {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const compartilhadas: string[] = [];
  const idx = (t: string) => {
    let i = compartilhadas.indexOf(t);
    if (i < 0) i = compartilhadas.push(t) - 1;
    return i;
  };
  const col = (i: number) => String.fromCharCode(65 + i);
  const arquivos: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${abas
      .map((a, i) => `<sheet name="${esc(a.nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas
      .map((_, i) => `<Relationship Id="rId${i + 1}" Type="x" Target="worksheets/sheet${i + 1}.xml"/>`)
      .join("")}</Relationships>`,
  };
  abas.forEach((a, i) => {
    const linhas = a.linhas
      .map((l, r) => {
        const cels = l
          .map((v, c) => {
            if (v === null || v === "") return "";
            const ref = `${col(c)}${r + 1}`;
            return typeof v === "number" ? `<c r="${ref}"><v>${v}</v></c>` : `<c r="${ref}" t="s"><v>${idx(v)}</v></c>`;
          })
          .join("");
        return `<row r="${r + 1}">${cels}</row>`;
      })
      .join("");
    arquivos[`xl/worksheets/sheet${i + 1}.xml`] = `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${linhas}</sheetData></worksheet>`;
  });
  arquivos["xl/sharedStrings.xml"] = `<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${compartilhadas.map((t) => `<si><t>${esc(t)}</t></si>`).join("")}</sst>`;
  return zip(arquivos);
}

function zip(arquivos: Record<string, string>): Buffer {
  const partes: Buffer[] = [];
  const central: Buffer[] = [];
  let pos = 0;
  for (const [nome, texto] of Object.entries(arquivos)) {
    const dados = Buffer.from(texto, "utf8");
    const comp = deflateRawSync(dados);
    const nomeB = Buffer.from(nome);
    const crc = crc32(dados);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(dados.length, 22);
    local.writeUInt16LE(nomeB.length, 26);
    partes.push(local, nomeB, comp);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(20, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt16LE(8, 10);
    c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(comp.length, 20);
    c.writeUInt32LE(dados.length, 24);
    c.writeUInt16LE(nomeB.length, 28);
    c.writeUInt32LE(pos, 42);
    central.push(c, nomeB);
    pos += local.length + nomeB.length + comp.length;
  }
  const dirCentral = Buffer.concat(central);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(Object.keys(arquivos).length, 8);
  fim.writeUInt16LE(Object.keys(arquivos).length, 10);
  fim.writeUInt32LE(dirCentral.length, 12);
  fim.writeUInt32LE(pos, 16);
  return Buffer.concat([...partes, dirCentral, fim]);
}
