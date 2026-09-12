// Envelope do Panda: lê os .md do próprio pacote e injeta na configuração do OpenCode.
//
// Regra que não pode ser quebrada: o prompt do agente e o texto dos comandos vivem NOS ARQUIVOS
// .md em core/. Este arquivo nunca contém uma cópia deles — senão o modo de desenvolvimento
// (symlink dos .md) e o modo de distribuição (este plugin) passam a entregar coisas diferentes.

import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

import { calcularHabitos, formatarParaOModelo, descobrirBase, pastaDoDiario } from "./habitos.js"
import { situacao, pareceProjeto } from "./situacao.js"
import { buscar, formatar as formatarBusca } from "./busca.js"
import { separar } from "./markdown.js"

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..")


let cache = { texto: null, quando: 0, base: null }

export const panda = async (entrada) => {
  const diretorioAtual = entrada?.directory ?? process.cwd()
  return {
  config: async (config) => {
    try {
      const agente = separar(readFileSync(join(raiz, "core", "agent", "panda.md"), "utf8"))
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
        const { meta, corpo } = separar(readFileSync(join(pasta, arquivo), "utf8"))
        config.command[nome] = {
          template: corpo,
          description: meta.description,
          agent: meta.agent ?? "panda",
          ...config.command[nome],
        }
      }
      // Comandos que a própria pessoa pediu, via /ajustar. Moram DENTRO do vault
      // (`.panda/comandos/`), então viajam no backup junto com as notas — e o
      // plugin injeta, então funcionam mesmo quando ela abre o OpenCode na pasta
      // de cima. Deixar em `.opencode/command/` do vault não funcionaria: o
      // OpenCode só carrega esse diretório relativo ao cwd, e o vault costuma ser
      // uma subpasta.
      const base = descobrirBase(diretorioAtual)
      if (base) {
        const seus = join(base, ".panda", "comandos")
        let arquivos = []
        try { arquivos = readdirSync(seus) } catch { /* não existe: normal */ }
        for (const arquivo of arquivos) {
          if (!arquivo.endsWith(".md")) continue
          const nome = arquivo.slice(0, -3)

          // Nem todo arquivo .md daqui é um comando. Um README posto pra explicar a
          // pasta viraria `/README`; nome com espaço ou começando com ponto não é
          // digitável e vira entrada morta na lista dela. Avisa em vez de sumir
          // calado — comando que ela pediu e não aparece é pior que erro visível.
          if (!/^[a-z0-9][a-z0-9_-]{0,31}$/.test(nome)) {
            console.error(
              `[panda] ignorei .panda/comandos/${arquivo}: nome de comando precisa ser ` +
                "minúsculo, sem espaço nem acento, começando por letra ou número.",
            )
            continue
          }

          // Um comando do core nunca é substituído por um dela sem querer.
          if (config.command[nome]) continue
          const { meta, corpo } = separar(readFileSync(join(seus, arquivo), "utf8"))
          config.command[nome] = {
            template: corpo,
            description: meta.description,
            agent: meta.agent ?? "panda",
          }
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
      if (!base) {
        // Sem vault aqui. Se a pasta é um projeto de código, avisar importa: é onde
        // o /setup criaria um diário por engano.
        if (pareceProjeto(diretorioAtual)) {
          output.system.push(
            "## Situação atual (calculado, não inferido)\n\n" +
              `Hoje é ${new Date().toISOString().slice(0, 10)}.\n` +
              "Não há notas do Panda nesta pasta, e ela **parece um projeto de código** " +
              "(tem `.git`, `package.json` ou similar).\n\n" +
              "**Não crie um diário aqui.** Se pedirem `/setup`, diga que esta pasta é de " +
              "trabalho e pergunte onde as notas devem ficar — a pasta pessoal é o normal. " +
              "Diário dentro de repositório vai parar num commit sem querer.",
          )
        }
        return
      }
      const agora = Date.now()
      if (!cache.texto || agora - cache.quando > 60_000 || cache.base !== base) {
        cache = { texto: situacao(base), quando: agora, base }
      }
      const rel = base === diretorioAtual ? "." : relative(diretorioAtual, base).split(sep).join("/")
      // O vault dela pode chamar o diário de `diario/` ou `Journal/`. Sem dizer qual é,
      // o comando criaria uma pasta paralela e as notas ficariam em dois lugares.
      const relDiario = relative(diretorioAtual, pastaDoDiario(base)).split(sep).join("/")
      output.system.push(
        "## Situação atual (calculado, não inferido)\n\n" +
          `Pasta-base das notas: \`${rel}\` — use este prefixo em todo caminho; não precisa procurar.\n` +
          `Pasta do diário: \`${relDiario}\` — as notas do dia vão aqui, não em outro lugar.\n` +
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
    // Busca sem argumento não dá: o termo é a pergunta. Mas o formato é uma
    // string simples separada por vírgula, o que evita depender de zod.
    panda_buscar: {
      description:
        "Procura termos em TODAS as notas, ignorando maiúsculas e acentos. Use sempre que a pessoa " +
        "perguntar sobre o próprio passado — inclusive em conversa solta, sem comando. Devolve os " +
        "trechos com data. Buscar à mão erra: 'Insônia' no início de uma frase não casa com 'insônia'.",
      args: { termos: { type: "string", description: "termos separados por vírgula, incluindo variações" } },
      async execute(args, ctx) {
        const base = descobrirBase(ctx.directory)
        if (!base) return "Não encontrei as notas: nem esta pasta nem `panda/` têm um diário."
        const termos = String(args?.termos ?? "").split(",").map((t) => t.trim()).filter(Boolean)
        if (!termos.length) return "Preciso de pelo menos um termo pra buscar."
        const r = buscar(base, termos)
        return { title: `Busca: ${termos.join(", ")}`, output: formatarBusca(r), metadata: { total: r.total } }
      },
    },

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
