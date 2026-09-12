// Envelope do Panda: lê os .md do próprio pacote e injeta na configuração do OpenCode.
//
// Regra que não pode ser quebrada: o prompt do agente e o texto dos comandos vivem NOS ARQUIVOS
// .md em core/. Este arquivo nunca contém uma cópia deles — senão o modo de desenvolvimento
// (symlink dos .md) e o modo de distribuição (este plugin) passam a entregar coisas diferentes.

import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { calcularHabitos, formatarParaOModelo, descobrirBase } from "./habitos.js"

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

export const panda = async () => ({
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
})
