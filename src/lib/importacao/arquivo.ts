/** SHA-256 do arquivo (hex), para o log e para avisar quando o mesmo arquivo já foi importado. */
export async function calcularSha256(arquivo: Blob): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await arquivo.arrayBuffer());
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
