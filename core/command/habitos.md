---
description: Painel dos seus hábitos — os últimos dias, quantas vezes você fez cada um e há quantos dias seguidos.
agent: panda
---

Monte o painel de hábitos da pessoa e grave em `Dados/Hábitos.md`.

Funciona **sem Obsidian e sem plugin nenhum**: o painel é uma tabela de markdown comum, que se lê
em qualquer editor de texto.

## Regra de ouro: você não faz conta

Existe uma ferramenta chamada **`panda_habitos`** que calcula tudo: as marcas dia a dia dos últimos
7 dias, quantas vezes na semana, os dias seguidos e, para hábitos de quantidade, o total e a média.

**Chame-a e use os números como vieram.** Não recalcule, não arredonde, não some de cabeça, não
tente ler as notas você mesmo. Contar hábito em dezenas de notas é conta, e conta na cabeça sai
errada — já saiu: numa tabela de 28 marcadores todos certos, o total de uma linha veio errado.

> A ferramenta também é o que faz este comando funcionar fora do Linux. A versão anterior ensinava
> `find`, `grep -c` e `awk` no prompt, e no Windows o OpenCode roda PowerShell — nada disso existe
> lá. `find -printf` também não existe no macOS.

Se a ferramenta responder que **não há hábito configurado**, pare aqui: diga que a pessoa ainda não
acompanha nenhum hábito e que dá pra adicionar com `/ajustar`. Não invente hábito.

Se ela responder que **não encontrou as notas**, diga isso e pare.

## Passo 3 — monte o painel

Use **só** o que voltou do comando. A data de cada registro é a do nome do arquivo.

**Tabela dos últimos 7 dias** — um hábito por linha, um dia por coluna, da data mais antiga pra
mais recente:

| Hábito | 05/09 | 06/09 | ... | Semana |
|---|---|---|---|---|
| Água | ✅ | · | ... | 5/7 |

- `✅` quando o valor é `true`, ou quando o número é maior que zero
- `·` quando é `false`, zero, **ou quando não existe nota naquele dia**
- A coluna final é **o `na semana` que a ferramenta devolveu**, sempre sobre 7 — nunca uma soma sua

**Hábitos de quantidade** (páginas, minutos, copos): mostre o `total` e a `média` que a ferramenta
devolveu. Ela já calcula a média **sobre os dias que têm nota**, incluindo os registrados como zero
— um dia em que a pessoa anotou que não leu é informação real, e tirá-lo da conta infla o
resultado.

Ex.: `total: 94 em 6 dias com nota` e `média: 15.7` viram `Leitura — 94 páginas, 5 de 7 dias
(média 15,7 por dia com nota)`.

> **Não lisonjeie.** Uma média calculada só sobre os dias bons faz "21,4/dia" parecer que a meta de
> 20 foi batida, quando ela leu em 5 dos 7 dias. O painel serve pra ela enxergar a realidade — se
> os números puderem ser lidos de dois jeitos, mostre o menos favorável, ou mostre os dois.

**Dias seguidos** — o campo `seguidos` da ferramenta. Dia sem nota quebra a sequência. Se o número
vier com `+` no fim, a sequência chegou ao limite dos dados: diga "pelo menos N dias" em vez de
cravar.

**Contra a meta** — se `.panda/CONTEXTO.md` declarar a meta ("3x por semana", "20 páginas por
dia"), mostre o resultado ao lado dela. Sem meta declarada, só mostre o número.

Numa meta diária, **a quantidade de dias vem junto com a média**, sempre: `média 17,8/dia em 5 de
7 dias` — nunca só a média. Uma meta diária só é cumprida quando os dias também são.

## Passo 4 — grave

Em `Dados/Hábitos.md`, **entre os marcadores**:

```
<!-- panda:inicio -->
...o painel...
<!-- panda:fim -->
```

- Se os marcadores já existirem, **substitua só o que está entre eles** e preserve todo o resto do
  arquivo — inclusive o que ela escreveu à mão.
- Se não existirem, **peça permissão antes** de acrescentar: é a primeira vez que você põe conteúdo
  seu num arquivo que pode ser dela. "Posso acrescentar o painel no fim do seu `Dados/Hábitos.md`?"
  Depois que os marcadores existirem, regenerar é seu território e **não precisa perguntar de
  novo** — perguntar toda vez transformaria um painel automático em burocracia.
- Nunca reescreva o arquivo inteiro.
- Acrescente, dentro do bloco, uma linha dizendo quando o painel foi gerado e que ele é
  regenerado com `/habitos` — assim ninguém tenta atualizar na mão.

Se `.panda/config.json` tiver `"obsidian": true`, ofereça (sem fazer sozinho) acrescentar também
um painel dinâmico de Dataview, que se atualiza sozinho dentro do Obsidian. A tabela estática fica
de qualquer jeito — ela funciona em qualquer lugar.

## Passo 5 — comente o que você viu

Depois de gravar, diga em duas ou três frases o que os números mostram: o que está consistente, o
que caiu, e se algum hábito está longe da meta. Respeite o tom e o feedback do perfil.

**Só comente o que está nos dados.** Dia sem nota é dia sem informação, não é dia perdido — e a
diferença importa. Se faltar muita nota no período, diga que o painel está incompleto.

Se `$ARGUMENTS` trouxer um período ("mês", "últimos 30 dias") ou um hábito específico, ajuste o
recorte — mas mantenha o mesmo cuidado com a coleta.
