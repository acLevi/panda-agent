// Busca nas notas — determinística, e igual em qualquer sistema.
//
// Por que existe: o modelo buscava `insônia` e não achava `Insônia`. Em português
// toda palavra que inicia frase é capitalizada, então TODA busca dele errava por
// baixo — e o pior não era contar menos, era narrar por cima do buraco: "foram
// dois anos de silêncio" sobre um período que tinha uma nota no meio.
//
// Dizer "ignore a caixa" no prompt não resolveu: tentei, e ele continuou. Mesma
// lição da aritmética dos hábitos — passo mecânico sai da mão do modelo.

import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { pastaDoDiario } from "./habitos.js"

/** minúsculas e sem acento: "Insônia" e "insonia" viram a mesma coisa. */
const dobrar = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/** Todo .md do vault, com a data quando o nome for AAAA-MM-DD. */
function arquivos(base) {
  const achados = []
  const anda = (dir, nivel) => {
    let itens
    try { itens = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const it of itens) {
      if (it.name.startsWith(".")) continue
      const p = join(dir, it.name)
      if (it.isDirectory()) { if (nivel < 5) anda(p, nivel + 1) }
      else if (it.name.endsWith(".md")) {
        const m = it.name.match(/^(\d{4}-\d{2}-\d{2})\.md$/)
        achados.push({ caminho: p, data: m?.[1] ?? null })
      }
    }
  }
  if (existsSync(base)) anda(base, 0)
  return achados
}

/**
 * Procura os termos em todas as notas, ignorando caixa e acento.
 * Devolve um achado por linha que casou, em ordem cronológica.
 */
export function buscar(base, termos, { limite = 60 } = {}) {
  const alvos = termos.map(dobrar).filter(Boolean)
  if (!alvos.length) return { termos, achados: [], lidos: 0, ilegiveis: [] }

  const achados = []
  const ilegiveis = []
  let lidos = 0

  for (const { caminho, data } of arquivos(base)) {
    let texto
    try { texto = readFileSync(caminho, "utf8"); lidos++ } catch { ilegiveis.push(caminho); continue }
    const linhas = texto.split(/\r?\n/)
    for (let i = 0; i < linhas.length; i++) {
      const dobrada = dobrar(linhas[i])
      const casou = alvos.filter((a) => dobrada.includes(a))
      if (!casou.length) continue
      // frontmatter e títulos raramente são o que a pessoa quis dizer
      if (/^(#|---|\w+:)/.test(linhas[i].trim())) continue
      achados.push({ data, caminho, linha: linhas[i].trim(), termos: casou })
    }
  }

  achados.sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""))
  return {
    termos,
    achados: achados.slice(0, limite),
    truncado: achados.length > limite,
    total: achados.length,
    lidos,
    ilegiveis,
  }
}

/** Texto pronto pro modelo transcrever — ele apresenta, não procura. */
export function formatar(r) {
  const L = [`Busca por: ${r.termos.join(", ")} — ignorando maiúsculas e acentos.`]
  L.push(`Notas lidas: ${r.lidos}. Trechos encontrados: ${r.total}.`)
  if (r.ilegiveis.length) {
    L.push(`ATENÇÃO: ${r.ilegiveis.length} nota(s) não puderam ser lidas — a busca NÃO as cobriu.`)
  }
  L.push("")
  if (!r.achados.length) {
    L.push("Nenhum trecho encontrado. Isto é uma busca completa em todas as notas legíveis:")
    L.push("pode dizer com segurança que não há registro desses termos — não é uma amostra.")
    return L.join("\n")
  }
  for (const a of r.achados) L.push(`${a.data ?? "sem data"} — ${a.linha}`)
  if (r.truncado) L.push(`\n(mostrando ${r.achados.length} de ${r.total}; peça mais se precisar)`)
  L.push("")
  L.push("Estes são TODOS os trechos que casaram. Não conclua nada sobre o que há entre eles.")
  return L.join("\n")
}

export { pastaDoDiario }
