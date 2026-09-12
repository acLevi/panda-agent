// Envelope do Panda: lê os .md do próprio pacote e injeta na configuração do OpenCode.
//
// Regra que não pode ser quebrada: o prompt do agente e o texto dos comandos vivem NOS ARQUIVOS
// .md em core/. Este arquivo nunca contém uma cópia deles — senão o modo de desenvolvimento
// (symlink dos .md) e o modo de distribuição (este plugin) passam a entregar coisas diferentes.

import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

import { calcularHabitos, formatarParaOModelo, descobrirBase } from "./habitos.js"
import { situacao } from "./situacao.js"

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..")

/** Separa o frontmatter YAML simples (chave: valor) do corpo do markdown. */
function ler(caminho) {
  const bruto = readFileSync(caminho, "utf8")
  const casa = bruto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!casa) return { meta: {}, corpo: bruto.trim() }

  const meta = {}
  for (const linha of casa[1].split(/\r?\n/)) {
    const i = linha.indexOf(":")
    if (i === -1) continue
    const chave = linha.slice(0, i).trim()
    const valor = linha.slice(i + 1).trim().replace(/^["']|["']$/g, "")
    if (chave) meta[chave] = valor
  }
  return { meta, corpo: bruto.slice(casa[0].length).trim() }
}

let cache = { texto: null, quando: 0, base: null }

export const panda = async (entrada) => {
  const diretorioAtual = entrada?.directory ?? process.cwd()
  return {
  config: async (config) => {
    try {
      const agente = ler(join(raiz, "core", "agent", "panda.md"))
      config.agent ??= {}
      // O que o usuário já definiu vence: quem editou o próprio panda no opencode.json
      // ou tem um panda.md local não é sobrescrito por uma atualização do plugin.
      config.agent.panda = {
        description: agente.meta.description,
        mode: agente.meta.mode ?? "primary",
        prompt: agente.corpo,
        ...config.agent.panda,
      }

      const pasta = join(raiz, "core", "command")
      config.command ??= {}
      for (const arquivo of readdirSync(pasta)) {
        if (!arquivo.endsWith(".md")) continue
        const nome = arquivo.slice(0, -3)
        const { meta, corpo } = ler(join(pasta, arquivo))
        config.command[nome] = {
          template: corpo,
          description: meta.description,
          agent: meta.agent ?? "panda",
          ...config.command[nome],
        }
      }
    } catch (erro) {
      // Um Panda quebrado não pode impedir o OpenCode de abrir.
      console.error("[panda] não consegui carregar os arquivos do agente:", erro?.message ?? erro)
    }
  },

  // Injeta a situação do vault no prompt de sistema, a cada requisição.
  //
  // Duas ressalvas. É API `experimental`: pode mudar sem aviso, por isso tudo
  // aqui está dentro de try/catch — se quebrar, o Panda perde a iniciativa mas
  // continua funcionando. E o hook NÃO informa qual agente está rodando, então
  // a guarda é a presença de um vault: numa pasta de código não há o que
  // injetar, e nada é injetado.
  "experimental.chat.system.transform": async (_input, output) => {
    try {
      const base = descobrirBase(diretorioAtual)
      if (!base) return
      const agora = Date.now()
      if (!cache.texto || agora - cache.quando > 60_000 || cache.base !== base) {
        cache = { texto: situacao(base), quando: agora, base }
      }
      const rel = base === diretorioAtual ? "." : relative(diretorioAtual, base).split(sep).join("/")
      output.system.push(
        "## Situação atual (calculado, não inferido)\n\n" +
          `Pasta-base das notas: \`${rel}\` — use este prefixo em todo caminho; não precisa procurar.\n` +
          cache.texto +
          "\n\nSão fatos exatos, apurados agora a partir das notas. Use-os como estão — " +
          "principalmente a data de hoje, que você não deve deduzir. O quanto comentar isso " +
          "sem ser perguntado depende da proatividade declarada no perfil.",
      )
    } catch {
      // Perder o contexto de abertura é aceitável; derrubar a sessão não é.
    }
  },

  tool: {
    // Sem argumentos de propósito: a ferramenta entrega os números da última
    // semana, e o modelo recorta e formata. Isso também evita depender de zod.
    panda_habitos: {
      description:
        "Calcula os hábitos das notas diárias: marcas dia a dia dos últimos 7 dias, " +
        "quantas vezes na semana, dias seguidos, e total/média para hábitos de quantidade. " +
        "Os números voltam exatos — use-os como estão, nunca refaça a conta.",
      args: {},
      async execute(_args, ctx) {
        const base = descobrirBase(ctx.directory)
        if (!base) return "Não encontrei as notas: nem esta pasta nem `panda/` têm um diário."
        const r = calcularHabitos(base, 7)
        return {
          title: "Hábitos dos últimos 7 dias",
          output: formatarParaOModelo(r),
          metadata: { base, semHabitos: r.semHabitos },
        }
      },
    },
  },
  }
}
