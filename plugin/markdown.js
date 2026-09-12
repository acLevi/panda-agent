// Parser de frontmatter — o único do pacote.
//
// Existia em duas cópias (habitos.js e index.js) e as duas tinham os mesmos
// três buracos. Cada um deles fazia a nota sumir em silêncio das contagens,
// que é a pior forma de errar: nada quebra, o número só fica menor.

/** Remove o BOM. Bloco de Notas do Windows escreve isso, e sem tirar o `^---` não casa. */
export function semBom(texto) {
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto
}

/** Frontmatter YAML simples (chave: valor). Devolve {meta, corpo}. */
export function separar(bruto) {
  const texto = semBom(bruto)
  const casa = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!casa) return { meta: {}, corpo: texto.trim() }

  const meta = {}
  for (const linha of casa[1].split(/\r?\n/)) {
    const i = linha.indexOf(":")
    if (i === -1) continue
    const chave = linha.slice(0, i).trim()
    if (!chave) continue
    // Só o valor perde as aspas; `titulo: Reunião: parte 2` mantém o resto intacto
    // porque a divisão é no PRIMEIRO dois-pontos.
    meta[chave] = linha.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, "$2")
  }
  return { meta, corpo: texto.slice(casa[0].length).trim() }
}

/** Como a pessoa pode ter escrito "sim" no frontmatter, à mão ou pelo Panda. */
const VERDADE = /^(true|yes|sim|x|✅)$/i
const FALSIDADE = /^(false|no|não|nao|)$/i

/**
 * O valor de um hábito num dia. `null` = o campo não existe (não é o mesmo que zero).
 * Devolve `{feito}` para sim/não e `{feito, n}` para quantidade.
 */
export function valorDeHabito(meta, campo) {
  if (!meta) return null
  const v = meta[campo]
  if (v === undefined) return null
  if (VERDADE.test(v)) return { feito: true }
  if (FALSIDADE.test(v)) return { feito: false }
  const n = Number(String(v).replace(",", "."))   // 5,5 também é número por aqui
  return Number.isFinite(n) ? { feito: n > 0, n } : null
}
