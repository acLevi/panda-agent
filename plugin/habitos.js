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

/** Todo arquivo AAAA-MM-DD.md sob Diário/, indexado por data. */
function notasDiarias(base) {
  const raiz = join(base, "Diário")
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

/** Hábitos = campos do template diário, exceto os de controle. */
function habitosDoTemplate(base) {
  const alvo = join(base, "Templates", "Diário.md")
  if (!existsSync(alvo)) return []
  const campos = separar(readFileSync(alvo, "utf8")).meta
  return Object.keys(campos)
    .filter((k) => !["date", "tags", "data", "atualizado", "tipo"].includes(k))
    .map((k) => ({ campo: k, quantidade: /^-?\d+(\.\d+)?$/.test(campos[k]) }))
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
    if (existsSync(join(c, ".panda", "PERFIL.md")) || existsSync(join(c, "Diário"))) return c
  }
  return null
}
