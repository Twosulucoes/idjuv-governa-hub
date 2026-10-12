/**
 * Senha temporária de primeiro acesso. Usa o gerador criptográfico do navegador (`crypto.getRandomValues`),
 * não `Math.random`, e sorteia sem viés. O usuário é obrigado a trocá-la no primeiro login.
 */
const CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";

export function gerarSenhaTemporaria(tamanho = 12): string {
  const limite = 256 - (256 % CARACTERES.length); // descarta o resto para não enviesar o sorteio
  let senha = "";
  while (senha.length < tamanho) {
    const bytes = crypto.getRandomValues(new Uint8Array(tamanho * 2));
    for (const b of bytes) {
      if (b < limite && senha.length < tamanho) senha += CARACTERES[b % CARACTERES.length];
    }
  }
  return senha;
}
