---
description: Painel dos seus hábitos — os últimos dias, quantas vezes você fez cada um e há quantos dias seguidos.
agent: panda
---

Monte o painel de hábitos da pessoa e grave em `Dados/Hábitos.md`.

Funciona **sem Obsidian e sem plugin nenhum**: o painel é uma tabela de markdown comum, que se lê
em qualquer editor de texto.

## Regra de ouro: não faça a conta de cabeça

Contar hábito em dezenas de notas é conta, e conta na cabeça sai errada. **Colete os dados com um
comando só** e depois apenas formate o que voltou. Nunca estime, nunca complete um dia que você não
viu, nunca some "de memória".

## Passo 1 — descubra quais são os hábitos

Leia o frontmatter de `Templates/Diário.md`. Os hábitos são todos os campos **exceto** `date` e
`tags`. Campo booleano (`false`) é do tipo fez/não fez; campo numérico (`0`) é do tipo quantidade.

Se não houver nenhum hábito, pare aqui: diga que ela ainda não acompanha nenhum hábito e que dá pra
adicionar com `/ajustar`. Não invente hábito.

## Passo 2 — colete tudo de uma vez

Um comando, não um arquivo por vez:

```bash
find Diário -name '*.md' | sort | tail -40 | xargs grep -H -E '^(campo1|campo2|campo3):'
```

Troque `campo1|campo2|...` pelos hábitos reais dela. O resultado traz uma linha por
arquivo/hábito, no formato `Diário/2026/09/2026-09-10.md:agua: true`.

Se o comando não voltar nada, é porque ainda não há notas diárias com hábitos registrados — diga
isso e pare.

## Passo 2b — deixe o shell somar também

**Você não soma nada de cabeça, nem os totais.** Liste as 7 datas do período e peça a contagem:

```bash
ARQS=$(ls Diário/*/*/{2026-09-05,2026-09-06,2026-09-07,2026-09-08,2026-09-09,2026-09-10,2026-09-11}.md 2>/dev/null)
grep -h '^agua:'      $ARQS | grep -c 'true'      # hábito de fez/não fez
grep -h '^leitura:'   $ARQS | grep -vc ': 0$'     # hábito de quantidade: dias acima de zero
grep -h '^leitura:'   $ARQS | awk -F': ' '{s+=$2} END {print s+0}'   # total acumulado
```

Troque as datas pelas 7 reais e rode uma linha por hábito. **Os números que forem pro painel são
os que voltarem daqui** — se um total que você escreveu não bate com a quantidade de ✅ da linha,
o erro é seu: refaça pelo shell.

## Passo 3 — monte o painel

Use **só** o que voltou do comando. A data de cada registro é a do nome do arquivo.

**Tabela dos últimos 7 dias** — um hábito por linha, um dia por coluna, da data mais antiga pra
mais recente:

| Hábito | 05/09 | 06/09 | ... | Semana |
|---|---|---|---|---|
| Água | ✅ | · | ... | 5/7 |

- `✅` quando o valor é `true`, ou quando o número é maior que zero
- `·` quando é `false`, zero, **ou quando não existe nota naquele dia**
- A coluna final é **o número que voltou do passo 2b**, sempre sobre 7 — nunca uma soma sua

**Hábitos de quantidade** (páginas, minutos, copos): mostre o total que veio do `awk` e a média
**sobre os dias que têm nota** — incluindo os dias registrados como zero. Um dia em que ela anotou
que não leu é informação real, e tirá-lo da conta infla o resultado.

Ex.: 107 páginas em 6 dias com nota, dos quais 5 com leitura → `Leitura — 107 páginas, 5 de 7
dias (média 17,8 por dia com nota)`. Nunca divida de cabeça; use o `awk`.

> **Não lisonjeie.** Uma média calculada só sobre os dias bons faz "21,4/dia" parecer que a meta de
> 20 foi batida, quando ela leu em 5 dos 7 dias. O painel serve pra ela enxergar a realidade — se
> os números puderem ser lidos de dois jeitos, mostre o menos favorável, ou mostre os dois.

**Dias seguidos** — a partir de hoje, andando pra trás, quantos dias consecutivos o hábito foi
feito. Dia sem nota **quebra a sequência**. Conte só dentro do que o comando trouxe; se a sequência
chegar no fim dos dados, diga "pelo menos N dias" em vez de cravar um número.

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
- Se não existirem, acrescente o bloco ao fim do arquivo, com os marcadores.
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
