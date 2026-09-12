// O que o Panda sabe antes de a pessoa dizer qualquer coisa.
//
// Sem isto ele abre a conversa cego: não sabe que dia é hoje nem que faz oito
// dias que ninguém escreve. Iniciativa vira esperança de prompt em vez de fato.
//
// Tudo aqui é calculado, nunca inferido — mesma disciplina da ferramenta de
// hábitos. O modelo recebe números prontos e decide o que fazer com eles.

import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { calcularHabitos } from "./habitos.js"

const DIA_MS = 86400000
const SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

/** Caminho da nota de uma data, procurando sob Diário/. */
function notaDe(base, data) {
  const anda = (dir, nivel) => {
    let itens
    try { itens = readdirSync(dir, { withFileTypes: true }) } catch { return null }
    for (const it of itens) {
      const p = join(dir, it.name)
      if (it.isDirectory() && nivel < 3) { const r = anda(p, nivel + 1); if (r) return r }
      else if (it.name === `${data}.md`) return p
    }
    return null
  }
  return anda(join(base, "Diário"), 0)
}

/** Datas de todas as notas diárias, em ordem. */
function datasDasNotas(base) {
  const datas = []
  const anda = (dir, nivel) => {
    let itens
    try { itens = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const it of itens) {
      const p = join(dir, it.name)
      if (it.isDirectory() && nivel < 3) anda(p, nivel + 1)
      else if (/^\d{4}-\d{2}-\d{2}\.md$/.test(it.name)) datas.push(it.name.slice(0, 10))
    }
  }
  const raiz = join(base, "Diário")
  if (existsSync(raiz)) anda(raiz, 0)
  return datas.sort()
}

export function situacao(base) {
  const hoje = new Date(); hoje.setHours(12, 0, 0, 0)
  const hojeIso = iso(hoje)
  const linhas = [`Hoje é ${SEMANA[hoje.getDay()]}, ${hojeIso}.`]

  const datas = datasDasNotas(base)
  const ultima = datas[datas.length - 1] ?? null

  if (!ultima) {
    linhas.push("Ainda não há nenhuma nota diária.")
  } else if (ultima === hojeIso) {
    linhas.push("A nota de hoje já existe — complemente, não crie outra.")
  } else {
    const dias = Math.round((Date.parse(hojeIso) - Date.parse(ultima)) / DIA_MS)
    linhas.push(`Última nota: ${ultima}, ${dias} ${dias === 1 ? "dia" : "dias"} atrás. A de hoje ainda não existe.`)
    const arquivo = notaDe(base, ultima)
    if (arquivo) {
      try {
        const abertas = (readFileSync(arquivo, "utf8").match(/^- \[ \]/gm) ?? []).length
        if (abertas > 0) linhas.push(`Ficaram ${abertas} tarefas não concluídas nessa nota.`)
      } catch { /* nota ilegível não é motivo pra derrubar nada */ }
    }
  }

  // Hábitos só entram se houver alguma nota na janela. Sem nota, "tudo 0/7" só
  // repete a linha de cima com mais palavras.
  const h = calcularHabitos(base, 7)
  if (!h.semHabitos && h.notasNaJanela > 0) {
    linhas.push(`Hábitos nos últimos 7 dias: ${h.linhas.map((l) => `${l.campo} ${l.feitos}/7`).join(", ")}.`)
  }

  return linhas.join("\n")
}
