// Cálculo dos hábitos, em JavaScript e não em shell.
//
// Por que não shell: no Windows o OpenCode roda PowerShell ou cmd.exe — não há
// `awk`, `grep -c` nem `find -printf`. E `-printf` também não existe no find do
// macOS. Um comando que ensina receita de shell no prompt funciona só no Linux,
// que é justamente onde a pessoa-alvo do kit NÃO está.
//
// Por que não deixar o modelo contar: ele monta a tabela dia a dia sem errar um
// marcador e erra o total. Aqui a conta é exata, sempre.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import { join } from "node:path"
import { separar, valorDeHabito } from "./markdown.js"

const DIA_MS = 86400000
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const ddmm = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}`

/**
 * A pasta do diário. Normalmente `Diário/`, mas quem adota um vault que já existe
 * pode ter `diario/`, `Journal/` ou outro nome — e o /setup promete se adaptar.
 * Sem isto, os hábitos dessa pessoa sumiriam em silêncio.
 */
export function pastaDoDiario(base) {
  // 1. o que o config.json disser vence
  try {
    const cfg = JSON.parse(readFileSync(join(base, ".panda", "config.json"), "utf8"))
    if (typeof cfg.pasta_diario === "string" && existsSync(join(base, cfg.pasta_diario))) {
      return join(base, cfg.pasta_diario)
    }
  } catch { /* sem config ou config quebrado: segue pro palpite */ }

  // 2. senão, procura um nome equivalente, ignorando maiúscula e acento
  const alvo = ["diario", "journal", "daily", "notasdiarias"]
  const normal = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  try {
    for (const it of readdirSync(base, { withFileTypes: true })) {
      if (it.isDirectory() && alvo.includes(normal(it.name))) return join(base, it.name)
    }
  } catch { /* base ilegível */ }

  return join(base, "Diário")
}

/** Todo arquivo AAAA-MM-DD.md sob a pasta do diário, indexado por data. */
function notasDiarias(base) {
  const raiz = pastaDoDiario(base)
  const achadas = new Map()
  const anda = (dir, nivel) => {
    let itens
    try { itens = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const it of itens) {
      const p = join(dir, it.name)
      if (it.isDirectory() && nivel < 3) anda(p, nivel + 1)
      else if (/^\d{4}-\d{2}-\d{2}\.md$/.test(it.name)) achadas.set(it.name.slice(0, 10), p)
    }
  }
  if (existsSync(raiz) && statSync(raiz).isDirectory()) anda(raiz, 0)
  return achadas
}

/**
 * O modelo de nota diária. Normalmente `Templates/Diário.md` — mas quem adotou um
 * vault que já existia tem o dela, com outro nome, e o /setup respeita isso. Sem
 * olhar o config, o hábito dessa pessoa nunca seria contado: ficaria registrado no
 * contexto e invisível aqui, e o /habitos diria que ela não acompanha nada.
 */
function templateDiario(base) {
  try {
    const cfg = JSON.parse(readFileSync(join(base, ".panda", "config.json"), "utf8"))
    if (typeof cfg.template_diario === "string") {
      const alvo = join(base, cfg.template_diario)
      if (existsSync(alvo)) return alvo
    }
  } catch { /* sem config: usa o padrão */ }
  return join(base, "Templates", "Diário.md")
}

const CONTROLE = ["date", "tags", "data", "atualizado", "tipo", "aliases", "alias", "cssclass"]

/**
 * Quais hábitos acompanhar.
 *
 * A lista explícita do `config.json` vence. Ela existe por causa dos vaults
 * adotados: o modelo de nota diária de outra pessoa tem campos que NÃO são
 * hábitos — um `humor: 5` viraria "humor 3/7 na semana", que é bobagem. Onde a
 * lista não existe (vault criado pelo próprio /setup), inferir do modelo está
 * certo, porque ali todo campo foi posto pela pessoa como hábito.
 */
function habitosDoTemplate(base) {
  const alvo = templateDiario(base)
  const campos = existsSync(alvo) ? separar(readFileSync(alvo, "utf8")).meta : {}

  let lista = null
  try {
    const cfg = JSON.parse(readFileSync(join(base, ".panda", "config.json"), "utf8"))
    if (Array.isArray(cfg.habitos)) lista = cfg.habitos.filter((h) => typeof h === "string")
  } catch { /* sem config: infere */ }

  const nomes = lista ?? Object.keys(campos).filter((k) => !CONTROLE.includes(k))
  const quantidade = (k) => /^-?\d+([.,]\d+)?$/.test(campos[k] ?? "")
  return nomes.map((k) => ({ campo: k, quantidade: quantidade(k) }))
}

export function calcularHabitos(base, dias = 7) {
  const notas = notasDiarias(base)
  const habitos = habitosDoTemplate(base)
  if (habitos.length === 0) return { semHabitos: true, notas: notas.size }

  const hoje = new Date(); hoje.setHours(12, 0, 0, 0)
  const janela = []
  for (let i = dias - 1; i >= 0; i--) janela.push(iso(new Date(hoje.getTime() - i * DIA_MS)))

  const lidas = new Map()
  const ilegiveis = new Set()
  const ler = (data) => {
    if (!lidas.has(data)) {
      const p = notas.get(data)
      let meta = null
      if (p) {
        try {
          meta = separar(readFileSync(p, "utf8")).meta
        } catch {
          // Arquivo travado por sincronização (OneDrive, Dropbox) ou sem permissão.
          // Pular é obrigatório — mas some da contagem, então isso PRECISA aparecer
          // no resultado. Contagem menor sem aviso é o pior erro que este código pode ter.
          ilegiveis.add(data)
        }
      }
      lidas.set(data, meta)
    }
    return lidas.get(data)
  }

  const linhas = habitos.map(({ campo, quantidade }) => {
    const marcas = janela.map((d) => {
      const v = valorDeHabito(ler(d), campo)
      return { dia: d, temNota: notas.has(d), feito: v?.feito === true, n: v?.n }
    })
    const feitos = marcas.filter((m) => m.feito).length
    const comNota = marcas.filter((m) => m.temNota).length

    // Sequência: anda pra trás a partir de hoje. Dia sem nota quebra.
    let seq = 0, cravado = true
    for (let i = 0; i < 366; i++) {
      const d = iso(new Date(hoje.getTime() - i * DIA_MS))
      const v = valorDeHabito(ler(d), campo)
      if (v?.feito !== true) break
      seq++
      if (i === 365) cravado = false
    }

    const linha = { campo, quantidade, marcas, feitos, dias, comNota, seq, seqCravada: cravado }
    if (quantidade) {
      const total = marcas.reduce((s, m) => s + (m.n ?? 0), 0)
      linha.total = total
      // Média sobre dias COM NOTA, incluindo os zeros: excluir os zeros infla o
      // resultado e faz uma meta não batida parecer batida.
      linha.mediaPorDiaComNota = comNota ? Number((total / comNota).toFixed(1)) : 0
    }
    return linha
  })

  return {
    semHabitos: false,
    janela,
    linhas,
    notasNaJanela: janela.filter((d) => notas.has(d)).length,
    ilegiveis: [...ilegiveis].sort(),
  }
}

/** Texto determinístico pro modelo transcrever — ele formata, não calcula. */
export function formatarParaOModelo(r) {
  if (r.semHabitos) return "NENHUM HÁBITO CONFIGURADO no template diário."
  const L = []
  L.push(`Janela: ${ddmm(r.janela[0])} a ${ddmm(r.janela[r.janela.length - 1])} (${r.janela.length} dias)`)
  L.push(`Dias com nota na janela: ${r.notasNaJanela} de ${r.janela.length}`)
  L.push(`Colunas: ${r.janela.map(ddmm).join(" ")}`)
  L.push("")
  for (const l of r.linhas) {
    const marcas = l.marcas.map((m) => (m.feito ? "X" : ".")).join("  ")
    L.push(`${l.campo}`)
    L.push(`  marcas:    ${marcas}`)
    L.push(`  na semana: ${l.feitos}/${l.dias}`)
    L.push(`  seguidos:  ${l.seq}${l.seqCravada ? "" : "+"}`)
    if (l.quantidade) {
      L.push(`  total:     ${l.total} em ${l.comNota} dias com nota`)
      L.push(`  média:     ${l.mediaPorDiaComNota} por dia com nota (zeros incluídos)`)
    }
    L.push("")
  }
  if (r.ilegiveis?.length) {
    L.push(
      `ATENÇÃO: ${r.ilegiveis.length} nota(s) não puderam ser lidas (${r.ilegiveis.join(", ")}) — ` +
        "provavelmente travadas por sincronização de nuvem. Os números abaixo NÃO incluem esses dias. " +
        "Diga isso a ela em vez de apresentar a contagem como completa.",
    )
    L.push("")
  }
  L.push("Estes números são exatos para os dias que deu pra ler. Use-os como estão; não recalcule.")
  return L.join("\n")
}

/** A pasta-base: a atual, ou `panda/` dentro dela. Mesma regra do agente. */
export function descobrirBase(dir) {
  for (const c of [dir, join(dir, "panda")]) {
    if (existsSync(join(c, ".panda", "PERFIL.md")) || existsSync(pastaDoDiario(c))) return c
  }
  return null
}
