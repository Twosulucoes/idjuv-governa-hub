/**
 * Leitor de CSV dos arquivos diários do Transferegov (antigo Siconv): separador ";", campo entre aspas com ""
 * escapado (o texto pode ter ";" e quebra de linha), linhas em CRLF e BOM no início do arquivo.
 *
 * Lê em fluxo, um registro por vez: o arquivo das propostas passa de 1 GB descompactado e não cabe na memória.
 * Sem dependência: roda no GitHub Actions só com o Node (testes em csv.test.mjs).
 */

/**
 * Cria um leitor incremental. `escrever(texto)` recebe pedaços em qualquer ponto (no meio de um campo ou de um
 * CRLF); `fim()` entrega o último registro. `aoRegistro(campos)` recebe cada registro como array de textos.
 */
export function criarLeitorCsv(aoRegistro, { separador = ";" } = {}) {
  let campo = "";
  let campos = [];
  let entreAspas = false;
  let aspaPendente = false; // viu " dentro de aspas: ou é "" (aspa literal) ou fecha o campo
  let inicio = true;

  const fecharCampo = () => {
    campos.push(campo);
    campo = "";
  };
  const fecharRegistro = () => {
    fecharCampo();
    // linha em branco (inclusive a última, depois do CRLF final) não é registro
    if (!(campos.length === 1 && campos[0] === "")) aoRegistro(campos);
    campos = [];
  };

  function escrever(texto) {
    let i = 0;
    if (inicio && texto.length > 0) {
      if (texto.charCodeAt(0) === 0xfeff) i = 1;
      inicio = false;
    }
    for (; i < texto.length; i++) {
      const c = texto[i];
      if (aspaPendente) {
        aspaPendente = false;
        if (c === '"') {
          campo += '"';
          continue;
        }
        entreAspas = false; // a aspa anterior fechou o campo; este caractere segue a regra de fora das aspas
      }
      if (entreAspas) {
        if (c === '"') aspaPendente = true;
        else campo += c;
      } else if (c === '"' && campo === "") {
        entreAspas = true;
      } else if (c === separador) {
        fecharCampo();
      } else if (c === "\n") {
        fecharRegistro();
      } else if (c !== "\r") {
        campo += c;
      }
    }
  }

  function fim() {
    if (aspaPendente) {
      aspaPendente = false;
      entreAspas = false;
    }
    if (campo !== "" || campos.length > 0) fecharRegistro();
  }

  return { escrever, fim };
}

/**
 * Lê um fluxo (async iterável de Buffer ou texto, como o stdout de `unzip -p`) e chama `aoRegistro(objeto)` para
 * cada linha de dados, com as chaves do cabeçalho. Devolve o cabeçalho.
 */
export async function lerCsvComCabecalho(fluxo, aoRegistro) {
  let cabecalho = null;
  const leitor = criarLeitorCsv((campos) => {
    if (!cabecalho) {
      cabecalho = campos.map((c) => c.trim());
      return;
    }
    const objeto = {};
    cabecalho.forEach((nome, i) => {
      objeto[nome] = campos[i] ?? "";
    });
    aoRegistro(objeto);
  });
  const decodificador = new TextDecoder("utf-8");
  for await (const pedaco of fluxo) {
    leitor.escrever(typeof pedaco === "string" ? pedaco : decodificador.decode(pedaco, { stream: true }));
  }
  leitor.escrever(decodificador.decode());
  leitor.fim();
  return cabecalho ?? [];
}
