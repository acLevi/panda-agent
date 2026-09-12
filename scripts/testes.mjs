#!/usr/bin/env node
// Testes determinísticos do core — sem modelo, sem rede, sem espera.
//
// Cobre o que dá pra afirmar com certeza: contas, caminhos, o que o plugin
// injeta, o que acontece com vault vazio. A qualidade da conversa não está
// aqui e nem dá pra estar; isso é teste de artefato, não de prosa.
//
//   node scripts/testes.mjs

import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { calcularHabitos, descobrirBase, formatarParaOModelo, pastaDoDiario } from "../plugin/habitos.js"
import { situacao } from "../plugin/situacao.js"
import { separar, valorDeHabito } from "../plugin/markdown.js"
import { panda } from "../plugin/index.js"

let ok = 0, falhas = []
const t = (nome, fn) => {
  try { fn(); ok++; console.log(`  ✓ ${nome}`) }
  catch (e) { falhas.push([nome, e.message]); console.log(`  ✗ ${nome}\n      ${e.message}`) }
}
const eq = (a, b, oq) => { if (a !== b) throw new Error(`${oq}: esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`) }
const contem = (s, sub, oq) => { if (!String(s).includes(sub)) throw new Error(`${oq}: não contém ${JSON.stringify(sub)}`) }

const raiz = mkdtempSync(join(tmpdir(), "panda-testes-"))
const dia = (n) => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` }

/** Vault com hábitos conhecidos. Gabarito calculado à mão, não pelo código sob teste. */
function vaultGabarito() {
  const v = join(raiz, "gabarito")
  mkdirSync(join(v, "Templates"), { recursive: true })
  writeFileSync(join(v, "Templates", "Diário.md"),
    "---\ndate: <AAAA-MM-DD>\ntags: [diario]\nagua: false\ncaminhada: false\nleitura: 0\n---\n")
  //            dias atrás:  6      5     4(sem)  3      2      1      0
  const plano = { 6:[1,0,20], 5:[1,1,25], 3:[1,0,15], 2:[0,1,0], 1:[1,0,22], 0:[1,1,12] }
  for (const [off, [a, c, l]] of Object.entries(plano)) {
    const d = dia(Number(off)); const p = join(v, "Diário", d.slice(0,4), d.slice(5,7))
    mkdirSync(p, { recursive: true })
    writeFileSync(join(p, `${d}.md`),
      `---\ndate: ${d}\nagua: ${!!a}\ncaminhada: ${!!c}\nleitura: ${l}\n---\n\n- [ ] pendente\n- [x] feita\n`)
  }
  return v
}

console.log("\nhábitos — contas contra gabarito calculado à parte")
{
  const v = vaultGabarito()
  const r = calcularHabitos(v, 7)
  const por = (c) => r.linhas.find((l) => l.campo === c)
  // gabarito: agua X X . X . X X = 5 · caminhada . X . . X . X = 3 · leitura X X . X . X X = 5
  t("água 5 de 7", () => eq(por("agua").feitos, 5, "feitos"))
  t("caminhada 3 de 7", () => eq(por("caminhada").feitos, 3, "feitos"))
  t("leitura 5 de 7", () => eq(por("leitura").feitos, 5, "feitos"))
  t("leitura soma 94 páginas", () => eq(por("leitura").total, 94, "total"))
  t("média sobre dias COM NOTA inclui zeros (94/6=15.7)", () => eq(por("leitura").mediaPorDiaComNota, 15.7, "média"))
  t("dias seguidos de água = 2", () => eq(por("agua").seq, 2, "seq"))
  t("dia sem nota quebra a sequência", () => eq(por("caminhada").seq, 1, "seq"))
  t("6 dias com nota na janela de 7", () => eq(r.notasNaJanela, 6, "notasNaJanela"))
  t("hábito de quantidade é reconhecido", () => eq(por("leitura").quantidade, true, "quantidade"))
  t("hábito de sim/não não vira quantidade", () => eq(por("agua").quantidade, false, "quantidade"))
}

console.log("\nparser — casos que faziam a nota sumir em silêncio")
{
  // Cada um destes já fez uma nota inteira desaparecer das contagens.
  const casos = [
    ["BOM do Bloco de Notas (Windows)", "\uFEFF---\nagua: true\n---\n", true],
    ["fim de linha CRLF", "---\r\nagua: true\r\n---\r\n", true],
    ["maiúscula e espaço extra", "---\nagua:  True\n---\n", true],
    ["aspas no valor", "---\nagua: \"true\"\n---\n", true],
    ["sim em vez de true", "---\nagua: sim\n---\n", true],
    ["false continua sendo false", "---\nagua: false\n---\n", false],
    ["campo ausente não é false", "---\noutro: 1\n---\n", null],
  ]
  for (const [nome, texto, esperado] of casos) {
    t(nome, () => {
      const v = valorDeHabito(separar(texto).meta, "agua")
      eq(v === null ? null : v.feito, esperado, "valor")
    })
  }
  t("dois-pontos no valor não quebra a chave", () => {
    eq(separar("---\ntitulo: Reunião: parte 2\n---\n").meta.titulo, "Reunião: parte 2", "titulo")
  })
  t("quantidade com vírgula decimal", () => {
    eq(valorDeHabito(separar("---\nleitura: 5,5\n---\n").meta, "leitura").n, 5.5, "n")
  })
  t("BOM não vaza pro corpo", () => {
    if (separar("\uFEFF---\na: 1\n---\ncorpo").corpo !== "corpo") throw new Error("corpo sujo")
  })
}

console.log("\nvault sem hábitos e vault vazio")
{
  const v = join(raiz, "sem-habitos"); mkdirSync(join(v, "Diário"), { recursive: true })
  t("sem template, avisa em vez de inventar", () => eq(calcularHabitos(v, 7).semHabitos, true, "semHabitos"))
  const vazio = join(raiz, "vazio"); mkdirSync(vazio, { recursive: true })
  t("pasta sem diário não é pasta-base", () => eq(descobrirBase(vazio), null, "descobrirBase"))
}

console.log("\nvault bagunçado — nada pode derrubar o OpenCode")
{
  const { chmodSync } = await import("node:fs")
  const bagunca = {
    "perfil vazio": (v) => writeFileSync(join(v, ".panda", "PERFIL.md"), ""),
    "template sem frontmatter": (v) => writeFileSync(join(v, "Templates", "Diário.md"), "só texto"),
    "nome de arquivo com data inválida": (v) => writeFileSync(join(v, "Diário", "2026-13-45.md"), "---\nagua: true\n---"),
    "frontmatter não fechado": (v) => writeFileSync(join(v, "Diário", "2026-09-11.md"), "---\nagua: true\nsem fim"),
    "nota travada pela sincronização": (v) => {
      const f = join(v, "Diário", "2026-09-10.md")
      writeFileSync(f, "---\nagua: true\n---"); chmodSync(f, 0)
    },
  }
  let i = 0
  for (const [nome, montar] of Object.entries(bagunca)) {
    const v = join(raiz, `bagunca-${i++}`)
    mkdirSync(join(v, ".panda"), { recursive: true })
    mkdirSync(join(v, "Templates"), { recursive: true })
    mkdirSync(join(v, "Diário"), { recursive: true })
    writeFileSync(join(v, ".panda", "PERFIL.md"), "---\ntipo: perfil\n---\nAna")
    writeFileSync(join(v, "Templates", "Diário.md"), "---\ndate: x\nagua: false\n---")
    montar(v)
    t(nome, () => { calcularHabitos(v, 7); situacao(v) })
  }
  // Sumir em silêncio é pior que quebrar: o número fica menor e ninguém sabe.
  const trancado = join(raiz, "bagunca-4")
  t("nota ilegível é reportada, não engolida", () => {
    const r = calcularHabitos(trancado, 7)
    if (!r.ilegiveis?.length) throw new Error("não reportou a nota que não deu pra ler")
  })
}

console.log("\npasta-base — a pessoa abre onde o OpenCode abriu")
{
  const casa = join(raiz, "casa"); mkdirSync(casa, { recursive: true })
  mkdirSync(join(casa, "Downloads"), { recursive: true })
  const v = vaultGabarito()
  mkdirSync(join(casa, "panda"), { recursive: true })
  mkdirSync(join(casa, "panda", "Diário"), { recursive: true })
  t("acha panda/ a partir da pasta de cima", () => eq(descobrirBase(casa), join(casa, "panda"), "base"))
  t("acha o próprio diretório quando ele é o vault", () => eq(descobrirBase(v), v, "base"))
}

console.log("\npasta do diário — quem trouxe um vault que já existia")
{
  const iso = dia(0)
  const variantes = [
    ["diario/ minúsculo sem acento", "diario/2026/09", null],
    ["Journal/ (vault em inglês)", "Journal", null],
    ["Daily/", "Daily/2026", null],
    ["nome livre, declarado no config", "MinhasNotas", { pasta_diario: "MinhasNotas" }],
    ["Diário/ padrão", "Diário/2026/09", null],
    ["subpasta a mais (semana-3)", "Diário/2026/09/semana-3", null],
  ]
  let k = 0
  for (const [nome, dir, cfg] of variantes) {
    const v = join(raiz, `pasta-${k++}`)
    mkdirSync(join(v, "Templates"), { recursive: true })
    mkdirSync(join(v, ".panda"), { recursive: true })
    mkdirSync(join(v, dir), { recursive: true })
    writeFileSync(join(v, "Templates", "Diário.md"), "---\ndate: x\nagua: false\n---")
    if (cfg) writeFileSync(join(v, ".panda", "config.json"), JSON.stringify(cfg))
    writeFileSync(join(v, dir, `${iso}.md`), "---\nagua: true\n---")
    t(nome, () => eq(calcularHabitos(v, 7).linhas[0].feitos, 1, "achou a nota"))
  }
  t("o bloco informa a pasta do diário, não só a base", () => {
    const v = join(raiz, "pasta-0")
    if (!pastaDoDiario(v).endsWith("diario")) throw new Error("não detectou diario/")
  })
}

console.log("\nsituação — o que o Panda sabe antes de perguntarem")
{
  const v = vaultGabarito()
  const s = situacao(v)
  t("informa a data de hoje", () => contem(s, dia(0), "situação"))
  t("informa a hora (o /diario escolhe o modo por ela)", () => {
    if (!/Agora são \d{2}:\d{2} — (madrugada|manhã|tarde|noite)/.test(s)) throw new Error("sem hora no bloco")
  })
  t("reconhece que a nota de hoje existe", () => contem(s, "nota de hoje já existe", "situação"))
  t("resume os hábitos da semana", () => contem(s, "agua 5/7", "situação"))

  const parado = join(raiz, "parado")
  mkdirSync(join(parado, "Diário", "2020", "01"), { recursive: true })
  writeFileSync(join(parado, "Diário", "2020", "01", "2020-01-01.md"), "---\ndate: 2020-01-01\n---\n\n- [ ] a\n- [ ] b\n")
  const s2 = situacao(parado)
  t("conta os dias de silêncio", () => contem(s2, "dias atrás", "situação"))
  t("conta tarefas em aberto da última nota", () => contem(s2, "2 tarefas", "situação"))
  t("sem nota na janela, não despeja hábitos zerados", () => {
    if (s2.includes("Hábitos nos últimos")) throw new Error("listou hábitos sem nota nenhuma")
  })
}

console.log("\nplugin — o que ele injeta no OpenCode")
{
  const h = await panda({ directory: raiz })
  const cfg = {}
  await h.config(cfg)
  t("registra o agente panda", () => eq(Object.keys(cfg.agent).join(), "panda", "agentes"))
  t("o prompt não leva o frontmatter junto", () => {
    if (cfg.agent.panda.prompt.startsWith("---")) throw new Error("frontmatter vazou pro prompt")
  })
  t("prompt não está vazio", () => { if (cfg.agent.panda.prompt.length < 2000) throw new Error("prompt curto demais") })
  t("registra os sete comandos", () => eq(Object.keys(cfg.command).sort().join(","),
    "ajustar,diario,habitos,lembrar,planejar,revisar,setup", "comandos"))
  t("todo comando aponta pro agente panda", () => {
    const erradas = Object.entries(cfg.command).filter(([, c]) => c.agent !== "panda").map(([n]) => n)
    if (erradas.length) throw new Error(`sem agent panda: ${erradas.join(", ")}`)
  })
  t("config do usuário vence a do plugin", async () => {
    const meu = { agent: { panda: { prompt: "meu" } } }
    await (await panda({ directory: raiz })).config(meu)
    eq(meu.agent.panda.prompt, "meu", "prompt")
  })
  t("registra a ferramenta de hábitos", () => eq(Object.keys(h.tool).join(), "panda_habitos", "tools"))

  // A escotilha de saída: comandos que a própria pessoa pediu via /ajustar.
  // Moram no vault e precisam funcionar mesmo abrindo o OpenCode na pasta de cima —
  // é justamente o caso em que `.opencode/command/` do vault NÃO é carregado.
  const casaU = join(raiz, "casa-usuario")
  const vaultU = join(casaU, "panda")
  mkdirSync(join(vaultU, ".panda", "comandos"), { recursive: true })
  mkdirSync(join(vaultU, "Diário"), { recursive: true })
  writeFileSync(join(vaultU, ".panda", "PERFIL.md"), "x")
  writeFileSync(join(vaultU, ".panda", "comandos", "treino.md"),
    "---\ndescription: meu treino\nagent: panda\n---\ncorpo\n")
  writeFileSync(join(vaultU, ".panda", "comandos", "diario.md"),
    "---\ndescription: tentativa de sobrescrever o core\n---\nnão deve entrar\n")
  const cu = {}
  await (await panda({ directory: casaU })).config(cu)
  t("comando da pessoa carrega abrindo da pasta de cima", () => eq(cu.command.treino?.description, "meu treino", "treino"))
  t("comando da pessoa não sobrescreve um do core", () => {
    if (!cu.command.diario.description.startsWith("Cria ou atualiza")) throw new Error("core sobrescrito")
  })
  t("comando da pessoa herda agent: panda", () => eq(cu.command.treino.agent, "panda", "agent"))

  const v = vaultGabarito()
  const hv = await panda({ directory: v })
  const out = { system: [] }
  await hv["experimental.chat.system.transform"]({}, out)
  t("injeta a situação quando há vault", () => eq(out.system.length, 1, "blocos"))
  t("o bloco diz que os números são calculados", () => contem(out.system[0], "calculado", "bloco"))
  t("o bloco informa a pasta-base (evita o agente procurar)", () => contem(out.system[0], "Pasta-base das notas: `.`", "bloco"))

  const casa2 = join(raiz, "casa")
  const ho = await panda({ directory: casa2 })
  const oo = { system: [] }
  await ho["experimental.chat.system.transform"]({}, oo)
  t("da pasta de cima, o bloco aponta panda/", () => contem(oo.system[0], "Pasta-base das notas: `panda`", "bloco"))

  const fora = { system: [] }
  const hf = await panda({ directory: join(raiz, "casa", "Downloads") })
  await hf["experimental.chat.system.transform"]({}, fora)
  t("não injeta nada em pasta sem vault", () => eq(fora.system.length, 0, "blocos"))
}

console.log("\ncomandos e agente — o que não pode voltar")
{
  const { readFileSync, readdirSync } = await import("node:fs")
  const dir = new URL("../core/command/", import.meta.url).pathname
  const agente = readFileSync(new URL("../core/agent/panda.md", import.meta.url).pathname, "utf8")
  const cmds = readdirSync(dir).filter((f) => f.endsWith(".md"))

  t("nenhum dado pessoal do autor no core", () => {
    const sujos = [["core/agent/panda.md", agente], ...cmds.map((f) => [f, readFileSync(join(dir, f), "utf8")])]
      .filter(([, txt]) => /\bLevi\b|Gandalf|roadmap\.sh|Deitel/i.test(txt)).map(([f]) => f)
    if (sujos.length) throw new Error(`referência pessoal em: ${sujos.join(", ")}`)
  })
  t("nenhum comando com nome em inglês", () => {
    const ingles = cmds.filter((f) => !/^(ajustar|diario|habitos|lembrar|planejar|revisar|setup)\.md$/.test(f))
    if (ingles.length) throw new Error(`fora do padrão pt-BR: ${ingles.join(", ")}`)
  })
  t("o agente conhece todos os comandos que existem", () => {
    const orfaos = cmds.map((f) => f.replace(/\.md$/, ""))
      .filter((n) => !agente.includes(`/${n}`))
    if (orfaos.length) throw new Error(`o agente nunca cita: ${orfaos.join(", ")}`)
  })
  t("nenhuma referência a comando que não existe mais", () => {
    const mortos = [["core/agent/panda.md", agente], ...cmds.map((f) => [f, readFileSync(join(dir, f), "utf8")])]
      .filter(([, t]) => /\/(journal|plan|review|progress)(?![a-z-])/.test(t)).map(([f]) => f)
    if (mortos.length) throw new Error(`cita comando extinto: ${mortos.join(", ")}`)
  })
  t("perfil-modelo não derivou do que o /setup gera", () => {
    const setup = readFileSync(join(dir, "setup.md"), "utf8")
    const modelo = new URL("../perfil-modelo/", import.meta.url).pathname
    const secoes = readFileSync(join(modelo, "PERFIL.md"), "utf8")
      .split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3).trim())
    const faltando = secoes.filter((sec) => !setup.includes(sec))
    if (faltando.length) throw new Error(`o /setup não gera mais: ${faltando.join(", ")}`)
  })
  t("/habitos não voltou a ensinar shell", () => {
    const txt = readFileSync(join(dir, "habitos.md"), "utf8")
    // As menções permitidas explicam POR QUE não se usa shell; receita, não.
    if (/\$ARQS|xargs|awk -F/.test(txt)) throw new Error("receita de shell de volta no /habitos")
  })
  t("todo comando declara description e agent", () => {
    const ruins = cmds.filter((f) => {
      const fm = readFileSync(join(dir, f), "utf8").match(/^---\n([\s\S]*?)\n---/)
      return !fm || !/description:/.test(fm[1]) || !/agent:\s*panda/.test(fm[1])
    })
    if (ruins.length) throw new Error(`frontmatter incompleto: ${ruins.join(", ")}`)
  })
  t("o agente proíbe deduzir a data", () => contem(agente, "deduza a data", "agente"))
  t("quem reporta hábito usa a ferramenta, não conta à mão", () => {
    const devem = ["habitos.md", "revisar.md"]
    const sem = devem.filter((f) => !readFileSync(join(dir, f), "utf8").includes("panda_habitos"))
    if (sem.length) throw new Error(`contam hábito sem a ferramenta: ${sem.join(", ")}`)
  })
}

rmSync(raiz, { recursive: true, force: true })
console.log(`\n${falhas.length ? "✗" : "✓"} ${ok} passaram, ${falhas.length} falharam\n`)
process.exit(falhas.length ? 1 : 0)
