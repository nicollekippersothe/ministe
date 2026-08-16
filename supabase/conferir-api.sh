#!/usr/bin/env bash
# =============================================================================
# Confere o projeto pela API pública, do lado de fora
# =============================================================================
# A bateria em testes-rls.sql roda dentro do banco, como o banco. Este script
# roda como visitante, pela mesma porta que qualquer pessoa da internet usa.
# São coisas diferentes: já aconteceu de a permissão estar certa no banco e a
# função continuar exposta na API, porque o PostgREST publica o schema public
# por conta própria.
#
#   CHAVE=sb_publishable_... ./supabase/conferir-api.sh
#
# A chave é a publishable (a antiga anon). Ela é pública por definição: vai
# dentro do JavaScript que qualquer visitante baixa. A secret NÃO serve aqui,
# e não deve ser usada: ela passa por cima da RLS e faria todo teste passar.
# =============================================================================
set -u

BASE="${BASE:-https://niekaszanicnrciuixnb.supabase.co}"
CHAVE="${CHAVE:-}"

if [ -z "$CHAVE" ]; then
  echo "falta a chave: CHAVE=sb_publishable_... $0" >&2
  exit 1
fi

falhas=0

# Compara o código HTTP com o esperado e imprime o resultado.
confere() {
  local rotulo="$1" esperado="$2" recebido="$3"
  if [ "$recebido" = "$esperado" ]; then
    printf '  ok    %-46s %s\n' "$rotulo" "$recebido"
  else
    printf '  FALHOU %-45s %s, esperado %s\n' "$rotulo" "$recebido" "$esperado"
    falhas=$((falhas + 1))
  fi
}

codigo_get() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 30 -H "apikey: $CHAVE" "$BASE$1"
}

codigo_rpc() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X POST \
    -H "apikey: $CHAVE" -H 'Content-Type: application/json' \
    -d "$2" "$BASE/rest/v1/rpc/$1"
}

echo
echo 'Funções internas, o visitante tem que ser recusado'
# 401 é permissão negada. 404 também serve: quer dizer que o PostgREST nem
# publicou a função, porque o papel não pode executá-la.
for par in \
  'limpar_eventos_antigos:{}' \
  'plano_de:{"p_negocio":"11111111-0000-4000-8000-000000000001"}' \
  'checa_slug:{}' \
  'limite_do_plano:{"p_plano":"gratuito","p_recurso":"itens"}'
do
  nome="${par%%:*}"
  corpo="${par#*:}"
  c=$(codigo_rpc "$nome" "$corpo")
  if [ "$c" = "401" ] || [ "$c" = "404" ]; then
    printf '  ok    %-46s %s\n' "$nome" "$c"
  else
    printf '  FALHOU %-45s %s, esperado 401 ou 404\n' "$nome" "$c"
    falhas=$((falhas + 1))
  fi
done

echo
echo 'Funções da página pública, têm que responder'
confere 'registrar_evento' 204 "$(codigo_rpc registrar_evento '{"p_slug":"inexistente","p_tipo":"visita"}')"
confere 'negocio_publico' 200 "$(codigo_rpc negocio_publico '{"p_negocio":"11111111-0000-4000-8000-000000000001"}')"
# 400 aqui é acerto: a função rodou e o banco recusou o motivo inválido.
confere 'registrar_denuncia recusa motivo inválido' 400 \
  "$(codigo_rpc registrar_denuncia '{"p_slug":"x","p_motivo":"invalido","p_detalhe":null}')"

echo
echo 'Tabelas fechadas para o visitante'
confere 'denuncias' 401 "$(codigo_get '/rest/v1/denuncias?select=id&limit=1')"
confere 'eventos' 401 "$(codigo_get '/rest/v1/eventos?select=id&limit=1')"

echo
echo 'Tabelas que o visitante lê, filtradas pela RLS'
confere 'negocios' 200 "$(codigo_get '/rest/v1/negocios?select=slug&limit=1')"
confere 'itens' 200 "$(codigo_get '/rest/v1/itens?select=id&limit=1')"

echo
echo 'Correções aplicadas no banco'
# A coluna existe? O PostgREST responde 42703 para coluna que falta, e uma lista
# (vazia ou não) para coluna que existe. Então dá para saber sem escrever nada.
resposta=$(curl -s --max-time 30 -H "apikey: $CHAVE" \
  "$BASE/rest/v1/negocios?select=categoria,categoria_livre&limit=1")
case "$resposta" in
  \[*) printf '  ok    %-46s %s\n' '004, a coluna da categoria' 'aplicada' ;;
  *)   printf '  FALHOU %-45s %s\n' '004, a coluna da categoria' "$resposta"
       falhas=$((falhas + 1)) ;;
esac

# A função existe? Duas respostas diferentes, e é essa diferença que responde:
# 42501 "permission denied" é função que existe e está fechada, que é o que a
# gente quer. PGRST202 "no matches were found" é função que nem existe.
resposta=$(curl -s --max-time 30 -X POST -H "apikey: $CHAVE" \
  -H 'Content-Type: application/json' -d '{"p_dias":30}' \
  "$BASE/rest/v1/rpc/limpar_rascunhos_abandonados")
case "$resposta" in
  *42501*) printf '  ok    %-46s %s\n' '005, a faxina do rascunho parado' 'aplicada e fechada' ;;
  *PGRST202*) printf '  FALHOU %-45s %s\n' '005, a faxina do rascunho parado' 'a função ainda não existe'
              falhas=$((falhas + 1)) ;;
  *) printf '  FALHOU %-45s %s\n' '005, a faxina do rascunho parado' "$resposta"
     falhas=$((falhas + 1)) ;;
esac

# A 006 trouxe endereco_livre, e é ela que responde as duas linhas abaixo. Sem
# ela as duas falham juntas, o que já diz onde olhar.
livre() {
  curl -s --max-time 30 -X POST -H "apikey: $CHAVE" -H 'Content-Type: application/json' \
    -d "{\"p_slug\":\"$1\"}" "$BASE/rest/v1/rpc/endereco_livre"
}
resposta=$(livre 'nome-que-ninguem-usou')
case "$resposta" in
  true) printf '  ok    %-46s %s\n' '006, a conferência de endereço' 'aplicada' ;;
  *)    printf '  FALHOU %-45s %s\n' '006, a conferência de endereço' "$resposta"
        falhas=$((falhas + 1)) ;;
esac

# Os endereços das páginas de exemplo. Soltos, alguém cadastra um deles e a
# página cadastrada nunca abre, porque o exemplo vem antes na lib/dados.ts.
soltos=""
for s in demo studio-raiz marina-nutricao camila-psicologia atelie-trama aurora-massas rafael-nunes; do
  [ "$(livre "$s")" = "true" ] && soltos="$soltos $s"
done
if [ -z "$soltos" ]; then
  printf '  ok    %-46s %s\n' '007, os endereços dos exemplos' 'todos reservados'
else
  printf '  FALHOU %-45s soltos:%s\n' '007, os endereços dos exemplos' "$soltos"
  falhas=$((falhas + 1))
fi

echo
echo 'Login'
# A pessoa monta a página numa conta provisória e entra com o Google na hora de
# publicar. Então são duas chaves ligadas, e a do e-mail desligada.
ligados=$(curl -s --max-time 30 -H "apikey: $CHAVE" "$BASE/auth/v1/settings" \
  | python3 -c "import json,sys; e=json.load(sys.stdin).get('external',{}); print(','.join(sorted(k for k,v in e.items() if v)) or 'nenhum')")

quer() {
  local rotulo="$1" chave="$2"
  case ",$ligados," in
    *",$chave,"*) printf '  ok    %-46s %s\n' "$rotulo" 'ligado' ;;
    *) printf '  FALHOU %-45s ligados: %s\n' "$rotulo" "$ligados"
       falhas=$((falhas + 1)) ;;
  esac
}

quer 'conta provisória, para montar antes de entrar' anonymous_users
quer 'Google, para publicar' google

case ",$ligados," in
  *,email,*) printf '  FALHOU %-45s %s\n' 'e-mail desligado' "$ligados"
             falhas=$((falhas + 1)) ;;
  *) printf '  ok    %-46s %s\n' 'e-mail desligado' 'desligado' ;;
esac

echo
echo 'Storage'
# Enquanto a correção 003 estiver pendente, isto responde 200 com a lista de
# arquivos. Depois dela, o visitante passa a receber lista vazia mesmo com
# arquivo no bucket.
listagem=$(curl -s --max-time 30 -X POST -H "apikey: $CHAVE" \
  -H 'Content-Type: application/json' -d '{"prefix":"","limit":100}' \
  "$BASE/storage/v1/object/list/imagens")
quantos=$(printf '%s' "$listagem" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo '?')
printf '  info  %-46s %s arquivo(s) visíveis para o visitante\n' 'listagem do bucket' "$quantos"

echo
if [ "$falhas" -eq 0 ]; then
  echo 'TUDO PASSOU'
else
  echo "$falhas conferência(s) falharam"
  exit 1
fi
