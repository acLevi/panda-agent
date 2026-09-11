#!/usr/bin/env bash
# Abre o Panda numa instalação limpa, isolada da sua configuração do OpenCode.
#
# Por que existe: quem desenvolve o Panda tem os .md do core symlinkados em
# ~/.config/opencode. Testar ali mistura o modo de desenvolvimento com o de
# distribuição, e some com o caso que mais importa — o de quem instalou agora.
#
# O que isola: a configuração (XDG_CONFIG_HOME) e a pasta pessoal (HOME).
# O que NÃO isola: suas credenciais — o login continua valendo, você não
# precisa autenticar de novo a cada teste.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="${PANDA_TESTE_DIR:-/tmp/panda-teste}"
ORIGEM="file:$REPO"
MANTER=0

while [ $# -gt 0 ]; do
  case "$1" in
    --manter)  MANTER=1 ;;
    --github)  ORIGEM="github:acLevi/panda-agent" ;;
    --ajuda|-h)
      cat <<'AJUDA'
uso: scripts/teste-limpo.sh [opções] [-- argumentos do opencode]

  (sem opção)  apaga o ambiente anterior e começa do zero
  --manter     reaproveita o ambiente e as notas do teste anterior
  --github     instala do GitHub em vez do seu código local
  --ajuda      mostra isto

O ambiente fica em /tmp/panda-teste (mude com PANDA_TESTE_DIR).
Seu ~/.config/opencode não é lido nem tocado. Seu login continua valendo.

exemplos:
  scripts/teste-limpo.sh                      # do zero, com o código local
  scripts/teste-limpo.sh --manter             # continua o teste de ontem
  scripts/teste-limpo.sh --github             # testa o que está publicado
  scripts/teste-limpo.sh -- run "/setup"      # passa argumentos pro opencode
AJUDA
      exit 0 ;;
    --) shift; break ;;
    *) echo "opção desconhecida: $1 (veja --ajuda)" >&2; exit 1 ;;
  esac
  shift
done

CFG="$BASE/config"
CASA="$BASE/casa"

if [ "$MANTER" -eq 0 ]; then
  rm -rf "$BASE"
fi
mkdir -p "$CFG/opencode" "$CASA"

# Configuração mínima: só o plugin. Nenhum agente ou comando solto,
# então o que rodar vem do pacote — que é o ponto do teste.
cat > "$CFG/opencode/opencode.json" <<JSON
{
  "\$schema": "https://opencode.ai/config.json",
  "autoupdate": false,
  "plugin": ["$ORIGEM"]
}
JSON

echo "ambiente:  $BASE"
echo "origem:    $ORIGEM"
echo "pasta:     $CASA  (o /setup vai criar panda/ aqui dentro)"
if [ "$MANTER" -eq 1 ] && [ -d "$CASA/panda" ]; then
  echo "notas:     reaproveitando as do teste anterior"
else
  echo "notas:     nenhuma — é uma primeira vez de verdade"
fi
echo

cd "$CASA"
export HOME="$CASA"
export XDG_CONFIG_HOME="$CFG"
export XDG_DATA_HOME="${XDG_DATA_HOME:-$(getent passwd "$(id -u)" | cut -d: -f6)/.local/share}"

exec opencode "$@"
