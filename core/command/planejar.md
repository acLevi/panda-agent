---
description: Cria ou atualiza um planejamento de semana, mês ou trimestre, partindo do que já foi planejado e do que de fato aconteceu.
agent: panda
---

Crie ou atualize uma nota de planejamento no vault, de forma **progressiva**: cada plano nasce do
plano maior em vigor e do que realmente aconteceu no período anterior.

**Antes de tudo:** leia `.panda/PERFIL.md` e `.panda/CONTEXTO.md` — objetivos, metas, rotina e as
áreas que a pessoa acompanha saem de lá.

## Granularidade

Decida pelo `$ARGUMENTS`:
- "semana"/"semanal" → semanal
- "mês"/"mensal", ou uma data tipo `2026-09` → mensal
- "trimestre"/"trimestral", ou `Q3`/`Q4` → trimestral
- vazio → pergunte.

## Lógica progressiva

| Período | Nasce de |
|---|---|
| **Semana** | o plano do **mês** em vigor + o que ficou pendente nas semanas anteriores |
| **Mês** | a **revisão do mês anterior** (o que foi feito, o que não foi e por quê) + as semanas |
| **Trimestre** | a **revisão do trimestre anterior** + os meses |

Em qualquer caso, leia também `Dados/Objetivos.md` e `Dados/Metas.md` (o porquê e as metas),
`Dados/Rotina.md` e `Dados/Hábitos.md` (o quando e o como), e as fontes extras que o perfil
declarar — se o plano envolver uma área que tem fonte própria (estudos, trabalho, projeto),
consulte o estado real dessa fonte antes de planejar em cima dela.

## Onde gravar

- **Semanal** → `Planejamento/Semanal/<ANO>/<ANO>-W<SS>.md`
- **Mensal** → `Planejamento/Mensal/<ANO>/<ANO>-<MM>.md`
- **Trimestral** → `Planejamento/Trimestral/<ANO>/<ANO>-Q<T>.md`

**Planejamento é prospectivo** e mora em `Planejamento/`; **revisão é retrospectiva** e mora em
`Revisões/` — não misture os dois.

### O template

Use `Templates/Planejamento.md`. **Se ele não existir, crie-o agora** com o esqueleto abaixo e só
então escreva o plano seguindo ele. É o que mantém os planos parecidos entre si ao longo dos meses
— e a lógica progressiva depende disso: daqui a seis meses você vai precisar **ler** o plano
anterior pra escrever o próximo, e formato que muda toda vez torna isso cada vez mais difícil.

Se ela já tiver editado o template, **siga o dela** — o esqueleto é ponto de partida, não regra.

```markdown
---
tipo: planejamento
periodo: <ex.: 2026-W38, 2026-09, 2026-Q3>
tags: [planejamento]
---

# Planejamento — <período por extenso>

> Nasce de: <link ou nome do plano/revisão que deu origem a este>

## 🎯 Foco do período
<uma frase: se só uma coisa sair, que seja esta>

## ✅ Prioridades
- [ ] 1.
- [ ] 2.
- [ ] 3.

## 📂 Por área
### <categoria da pessoa>
- [ ]

## 📌 Vindo de trás
<o que ficou pendente do período anterior e continua valendo>

## 🧭 Como vou saber que deu certo
- <evidência observável, não sensação>
```

As categorias em "Por área" são as do perfil dela. O campo `periodo` no frontmatter é o que permite
achar este plano depois — preencha sempre.

Se a nota do período já existir, **atualize-a** em vez de duplicar: incorpore o que avançou,
registre o que mudou e ajuste os próximos passos.

## Como montar

1. Leia o plano da granularidade imediatamente superior e as revisões anteriores.
2. Extraia: o que foi concluído, o que ficou pendente, e as metas do período.
3. Monte: foco do período, prioridades, metas por área, entregas, e os blocos internos
   (semanas dentro do mês, meses dentro do trimestre).
4. **Seja realista.** Um plano com quinze prioridades não é um plano. Se o período anterior ficou
   pela metade, diga isso e planeje menos — não repita a lista inteira fingindo que dá.
5. Proponha o conteúdo e confirme antes de gravar.

Regras: markdown puro, wikilinks `[[...]]`, checklists `- [ ]`, frontmatter preservado, nada de
sintaxe de Templater.
