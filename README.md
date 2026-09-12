# 🐼 Panda

Um agente assistente pessoal de IA para o [OpenCode](https://opencode.ai) que conversa com você e guarda o seu dia a dia em notas que são
**suas** — arquivos de texto comuns, no seu computador, que você pode abrir e editar com ou sem
ele.

Você conta como foi o dia, ele escreve a nota. Quer planejar a semana? Ele planeja a partir do que
você já fez. Quer saber como está indo? Ele te diz, olhando o que está registrado — sem inventar.

E ele se molda a você: o jeito de falar, os hábitos que acompanha, as áreas da sua vida. Tudo isso
você muda **conversando com ele**, sem editar arquivo de configuração nenhum.

> **Status:** em construção. Funciona e foi testado de ponta a ponta, mas ainda está cru.

---

## Instalar

Você precisa do [OpenCode](https://opencode.ai) instalado. Depois, três comandos:

```bash
opencode auth login                        # escolha "OpenCode Zen" — tem modelos gratuitos
opencode plugin -g github:acLevi/panda-agent     # instala o Panda
```

Aí é só abrir o OpenCode e pedir `/setup`:

```bash
opencode
```

Ele cuida do resto: faz umas poucas perguntas, cria suas notas numa pasta `panda` e escreve seu
primeiro dia junto com você. Você não escolhe lugar nenhum e não cria pasta nenhuma.

**Do dia seguinte em diante, é só abrir o OpenCode do mesmo jeito e chamar o Panda.** Ele encontra
suas notas sozinho — você não precisa entrar em pasta nenhuma nem digitar comando de terminal.

> Se você já tem um vault de notas (Obsidian, por exemplo) e abrir o Panda de dentro dele, ele
> trabalha ali mesmo, no formato que você já usa.

**Atualizar:** `opencode plugin -g github:acLevi/panda-agent --force`

## O que dá pra pedir

| Comando | O que faz |
|---|---|
| `/setup` | primeira conversa: te conhece e prepara suas notas |
| `/journal` | registra como foi o dia, ou planeja o dia de manhã |
| `/plan` | planeja a semana, o mês ou o trimestre |
| `/review` | revisa um período que terminou, sem maquiar o resultado |
| `/progress` | como você está indo em relação ao que planejou |
| `/habitos` | painel dos seus hábitos: últimos dias, totais e sequências |
| `/ajustar` | muda qualquer coisa nele: o jeito de falar, os hábitos, ou um comando novo |

O `/ajustar` é o que faz ele ser seu: "fala menos", "quero acompanhar quanta água eu bebo",
"queria um jeito rápido de ver o que fiz na semana" — ele entende e se reconfigura sozinho.

## Suas notas são suas

Tudo que ele escreve é markdown comum, numa pasta sua. Funciona no Obsidian se você usar, e
funciona em qualquer editor de texto se não usar. Se um dia você largar o Panda, as notas
continuam lá, legíveis.

Ele lê o que quiser, mas **nunca escreve sem te perguntar** — e nunca apaga o que você escreveu à
mão.

---

# Para quem for mexer no código

## Estrutura

```
core/                  o Panda em si — igual pra todo mundo
  agent/panda.md       persona, regras e limites. Zero dado pessoal
  command/             setup · journal · plan · review · progress · habitos · ajustar
plugin/index.js        envelope: lê os .md do pacote e injeta na config do OpenCode
perfil-modelo/         referência do que o /setup gera (não é usado em tempo de execução)
```

Os dados de cada pessoa não moram aqui: ficam em `.panda/` **dentro do vault dela**
(`PERFIL.md`, `CONTEXTO.md`, `MEMORIA.md`, `config.json`), junto com as notas.

## As duas regras que sustentam tudo

**1. O core nunca contém dado de usuário; o perfil nunca contém regra de comportamento.**
Mudança que serve pra todo mundo vai pro `core/`. Mudança que serve a uma pessoa vai pro `.panda/`
do vault dela.

**2. O `plugin/index.js` nunca contém cópia de prompt.** Ele lê os `.md` em tempo de execução. Se
o prompt for duplicado dentro do JS, o modo de desenvolvimento e o de distribuição passam a
entregar coisas diferentes.
