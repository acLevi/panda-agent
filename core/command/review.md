---
description: Revisa um período que terminou — semana, mês ou trimestre. O que foi planejado, o que aconteceu de verdade e o que ajustar.
agent: panda
---

Faça a revisão de um período **que já terminou**. Revisão é retrospectiva: o `/plan` olha pra
frente, o `/review` olha pra trás e alimenta o próximo `/plan`.

**Antes de tudo:** leia `.panda/PERFIL.md` e `.panda/CONTEXTO.md`.

## Granularidade e período

Pelo `$ARGUMENTS`: "semana" → semanal, "mês" → mensal, "trimestre" → trimestral. Vazio → assuma o
período mais recente que já fechou e diga qual você assumiu. Se ele informar uma data ou número de
semana, use esse.

## Como revisar

1. **Leia o plano do período** em `Planejamento/` — era isso que estava combinado.
2. **Leia o que aconteceu:** as notas diárias do período, os hábitos registrados no frontmatter
   delas e as fontes extras que o perfil declarar.
3. **Compare, item a item:** o que foi concluído, o que ficou pela metade, o que nem começou.
4. **Procure o padrão, não só o placar.** Se três semanas seguidas a mesma tarefa não sai, o
   problema não é a tarefa — é o plano, o horário ou a prioridade. Diga isso.
5. **Hábitos:** quantos dias de cada, e se isso bate com a meta declarada.
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

O campo `periodo` no frontmatter é o que permite o `/plan` seguinte achar esta revisão — preencha
sempre. A coluna "Por quê" fica vazia quando ela não souber: inventar motivo é pior que admitir
que não sabe.

## Tom

Revisão que só elogia não serve pra nada, e revisão que só cobra faz a pessoa parar de revisar.
Seja honesto: mostre o que foi feito com clareza, aponte o que ficou pra trás e **explique o custo
disso** em relação aos objetivos dela — respeitando o parâmetro de feedback do perfil. Termine
sempre com um ajuste acionável, não com um julgamento.

Confirme o conteúdo antes de gravar.
