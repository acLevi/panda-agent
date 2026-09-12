---
description: Como você está indo. Sem período, é um panorama rápido; com período (semana, mês, trimestre), fecha o que terminou e grava a revisão.
agent: panda
---

Olhar pra trás. O `/planejar` olha pra frente; este olha pro que já passou e alimenta o próximo
`/planejar`.

**Antes de tudo:** leia `.panda/PERFIL.md` e `.panda/CONTEXTO.md`.

## Dois modos

| `$ARGUMENTS` | Modo | Grava? |
|---|---|---|
| **vazio** | **panorama** — como a pessoa está indo agora, sem recorte fechado | **não** |
| "semana", "mês", "trimestre", uma data | **fechamento** do período | sim, com confirmação |

O panorama é o uso do dia a dia: uma pergunta rápida, resposta na conversa, nada escrito. O
fechamento é ritual de fim de período e produz a nota que o próximo planejamento vai ler.

Na dúvida, **assuma panorama** — é o que não deixa rastro. E diga qual modo você entendeu, pra ela
poder corrigir numa palavra.

### Modo panorama

Leia o planejamento em vigor, as notas recentes (7 a 14 dias), os hábitos pela ferramenta
`panda_habitos`, e as fontes extras que o perfil declarar. Responda **na conversa**, assim:

- **✅ Concluído** — o que já está pronto
- **🔄 Em andamento** — o que está sendo tocado, e o quanto anda
- **⏸️ Parado** — o que foi planejado e não saiu do lugar, com o que você observou sobre o porquê
- **📊 Hábitos** — os números da ferramenta, contra a meta que o perfil declara
- **➡️ Próximo passo** — de 1 a 3 ações concretas, tiradas do plano em vigor

Três regras que valem mais que o formato:

- **Cite de onde tirou.** A nota ou o período que sustenta cada conclusão.
- **Não invente número.** "3 dos 5 dias" é útil; "70% de progresso" é chute.
- **Dado que não existe é dado que não existe.** Dias sem nota são falta de informação, não fracasso
  — e a diferença importa.

Se `$ARGUMENTS` trouxer uma área específica ("estudos", "treino"), foque nela e mantenha o resto de
fora.

**Não grave nada neste modo.** Se ela quiser guardar, aí sim proponha onde.

### Modo fechamento

Pelo `$ARGUMENTS`: "semana" → semanal, "mês" → mensal, "trimestre" → trimestral. Se ela informar uma
data ou número de semana, use esse. Siga daqui pra baixo.

## Como revisar

1. **Leia o plano do período** em `Planejamento/` — era isso que estava combinado.
2. **Leia o que aconteceu:** as notas diárias do período, os hábitos registrados no frontmatter
   delas e as fontes extras que o perfil declarar.
3. **Compare, item a item:** o que foi concluído, o que ficou pela metade, o que nem começou.
4. **Procure o padrão, não só o placar.** Se três semanas seguidas a mesma tarefa não sai, o
   problema não é a tarefa — é o plano, o horário ou a prioridade. Diga isso.
5. **Hábitos:** chame a ferramenta **`panda_habitos`** e use os números como vieram. Compare com a
   meta que o perfil declara — a ferramenta dá a contagem, o perfil dá a meta. Nunca conte à mão.
   (A ferramenta olha os últimos 7 dias; para revisão de mês ou trimestre, diga que o número é da
   última semana em vez de fingir que cobre o período todo.)
6. **Pergunte o que você não pode saber.** Por que uma coisa não saiu é informação que só a pessoa
   tem. Pergunte antes de concluir.

## O resultado

Grave em `Revisões/<Semanal|Mensal|Trimestral>/<ANO>/<identificador do período>.md`.

### O template

Use `Templates/Revisão.md`. **Se ele não existir, crie-o agora** com o esqueleto abaixo e escreva a
revisão seguindo ele. Revisões com formato estável são comparáveis entre si; revisões em texto
livre viram desabafo que ninguém relê. Se ela já editou o template, siga o dela.

```markdown
---
tipo: revisão
periodo: <ex.: 2026-W38, 2026-09, 2026-Q3>
tags: [revisao]
---

# Revisão — <período por extenso>

> Plano de origem: <link pro planejamento deste período>

## 📋 O que estava planejado
| Item | Como ficou | Por quê |
|---|---|---|
| <prioridade 1> | feito · pela metade · nem comecei | <só se ela souber> |

## 🌊 O que aconteceu fora do plano
<o que consumiu o período e não estava previsto — costuma explicar a tabela acima>

## 📊 Hábitos do período
<números, não impressão>

## 👍 O que funcionou
- <e vale manter>

## 🔧 O que não funcionou
- <e o ajuste concreto, não a intenção genérica>

## ➡️ Pro próximo período
- <pontos de partida pro próximo planejamento>
```

O campo `periodo` no frontmatter é o que permite o `/planejar` seguinte achar esta revisão — preencha
sempre. A coluna "Por quê" fica vazia quando ela não souber: inventar motivo é pior que admitir
que não sabe.

## Tom

Revisão que só elogia não serve pra nada, e revisão que só cobra faz a pessoa parar de revisar.
Seja honesto: mostre o que foi feito com clareza, aponte o que ficou pra trás e **explique o custo
disso** em relação aos objetivos dela — respeitando o parâmetro de feedback do perfil. Termine
sempre com um ajuste acionável, não com um julgamento.

Confirme o conteúdo antes de gravar.
