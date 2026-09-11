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

Grave em `Revisões/<Semanal|Mensal|Trimestral>/<ANO>/<identificador do período>.md`, usando o
template correspondente em `Templates/` se houver.

Estrutura mínima:
- **O que foi planejado** e o placar honesto de cada item
- **O que aconteceu que não estava no plano** (isso costuma explicar o resto)
- **Hábitos do período**
- **O que funcionou** e vale manter
- **O que não funcionou** e o ajuste concreto pro próximo período
- **Pontos de partida pro próximo plano**

## Tom

Revisão que só elogia não serve pra nada, e revisão que só cobra faz a pessoa parar de revisar.
Seja honesto: mostre o que foi feito com clareza, aponte o que ficou pra trás e **explique o custo
disso** em relação aos objetivos dela — respeitando o parâmetro de feedback do perfil. Termine
sempre com um ajuste acionável, não com um julgamento.

Confirme o conteúdo antes de gravar.
