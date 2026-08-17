# Banco

O schema e as correções 001, 002 e 004 a 007 já estão aplicados no projeto de
verdade. A 008 fica guardada até o envio de imagem existir no produto: ela muda
o que as colunas de imagem guardam, e aplicar antes do código que grava desse
jeito deixaria o painel salvando num formato que o banco recusa.

Tudo aqui roda e é testado num Postgres 16 local antes de ir, e o passo a passo
do que falta no painel do Supabase está em `PROMPT-SUPABASE.md`.

## Arquivos

| arquivo | o que é | testado |
| --- | --- | --- |
| `schema.sql` | tabelas, restrições, gatilhos, funções e RLS | sim, 151 asserções |
| `testes-rls.sql` | 151 asserções de RLS, de limite, de cobrança, de migração de rascunho e de permissão de função | sim |
| `correcoes/` | remendos para projeto que já rodou uma versão anterior do schema | sim |
| `storage.sql` | bucket das imagens e permissões | não, precisa do Supabase |
| `local/stub.sql` | só para rodar local, nunca aplicar no Supabase | sim |

## Aplicar no Supabase

1. Criar o projeto, região São Paulo (`sa-east-1`).
2. SQL Editor, colar `schema.sql`, executar.
3. SQL Editor, colar `storage.sql`, executar.
4. Rodar `testes-rls.sql` para conferir que a RLS ficou de pé. Colar no SQL
   Editor e executar serve, e é o caminho mais curto: o arquivo é SQL puro, sem
   comando de `psql` dentro, então não precisa da senha do banco.

   Pela linha de comando também vale:

```
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/testes-rls.sql
```

Tem que terminar com `TODOS OS TESTES PASSARAM`. O script roda dentro de uma
transação e desfaz tudo no fim, então pode ser executado com dados reais.

5. Conferir na mão a lista que está no fim de `storage.sql`.
6. Rodar a conferência pela API, que testa do lado de fora:

```
CHAVE=sb_publishable_... ./supabase/conferir-api.sh
```

   A bateria em `testes-rls.sql` roda dentro do banco, como o banco. Esta roda
   como visitante, pela mesma porta que qualquer pessoa da internet usa. São
   coisas diferentes, e já aconteceu de a permissão estar certa no banco e a
   função continuar exposta na API.

## Projeto que já rodou uma versão anterior

Os arquivos em `correcoes/` são remendos para quem já aplicou o schema antes de
uma correção existir. Rodar na ordem do número, no SQL Editor. Em projeto novo
não precisa de nenhum: o `schema.sql` já sai correto.

| arquivo | o que conserta |
| --- | --- |
| `001-fechar-execute-de-public.sql` | EXECUTE herdado de PUBLIC em toda função, o que deixava `limpar_eventos_antigos()` chamável por qualquer pessoa em `/rest/v1/rpc` |
| `002-fechar-execute-de-anon.sql` | EXECUTE nominal que o Supabase dá a `anon`, que a 001 não alcançava e mantinha treze funções abertas |
| `003-fechar-listagem-do-bucket.sql` | listagem do bucket de imagens, que entregava os arquivos de página ainda não publicada |
| `004-categoria.sql` | acrescenta a coluna da categoria, que vira o tipo do schema.org e monta a página |
| `005-rascunho-anonimo.sql` | deixa a página começar numa conta provisória, exige conta confirmada para publicar e acrescenta a faxina do rascunho parado |
| `006-endereco-livre.sql` | a conferência de endereço do cadastro, que a RLS deixava responder "livre" para endereço já guardado no rascunho de outra pessoa |
| `007-enderecos-dos-exemplos.sql` | reserva os seis endereços das páginas de exemplo que estavam soltos, e que alguém poderia cadastrar para nunca abrir |
| `008-envio-de-imagem.sql` | prepara o banco para imagem enviada pelo dono. **Guardada**, ver a nota no topo |
| `009-cobranca.sql` | assinatura, cobrança e a trava de idempotência do webhook, as quatro funções da chave de serviço, os números do painel e o endereço `/assinar` |
| `010-migrar-rascunho.sql` | move o rascunho da conta provisória para a conta que já existe, quando o Google recusa ligar a identidade |

## Rodar local, sem Supabase

```
initdb -D /tmp/pg/data -U postgres --auth=trust
pg_ctl -D /tmp/pg/data -o "-p 5433" start
createdb -h localhost -p 5433 -U postgres entrais

psql -h localhost -p 5433 -U postgres -d entrais -f supabase/local/stub.sql
psql -h localhost -p 5433 -U postgres -d entrais -f supabase/schema.sql
psql -h localhost -p 5433 -U postgres -d entrais -f supabase/testes-rls.sql
```

## Decisões que ficaram no schema

- **Dia sem horário significa fechado.** Não existe campo `fechado`, porque com
  vários intervalos por dia ele viraria contradição.
- **Limite de plano é conferido no banco, não na tela.** O painel escreve
  direto pelo navegador, então limite que mora só no JavaScript não é limite.
- **O dono não mexe em `plano`, `plano_expira_em` nem `status`.** Um gatilho
  devolve o valor anterior em silêncio. Só a chave de serviço passa.
- **Plano pago vencido volta a valer como gratuito sozinho.** Esquecer de
  rebaixar na mão não vira assinatura vitalícia de graça.
- **Ninguém escreve na tabela de eventos, nem o dono.** A página pública chama
  `registrar_evento(slug, tipo)`, que só aceita negócio publicado e ativo.
  Não guarda IP, cookie nem nada pessoal.
- **`status = 'suspenso'` tira a página do ar na hora**, sem apagar dado.
- **Trocar o endereço guarda o antigo** em `slug_anterior`, e o antigo não pode
  ser tomado por outra pessoa.
- **`itens_fotos` repete `negocio_id`** de propósito, com chave composta, para
  a política de RLS não precisar de join e para foto nenhuma conseguir apontar
  para item de outro negócio.
- **Permissão de função tem dois caminhos, e fechar um deixa o outro.** O
  Postgres dá EXECUTE a PUBLIC em toda função nova (`=X/postgres` na ACL) e o
  Supabase dá um grant nominal a `anon` para publicar a função na API
  (`anon=X/postgres`). O schema revoga dos dois e devolve nominalmente só para
  as três que a página pública chama. A asserção do teste lista quem pode
  chamar o quê, então função nova que nasça aberta cai lá.
- **O stub local reproduz o default privilege do Supabase.** Sem isso o
  Postgres local nasce mais fechado que o projeto de verdade, o teste passa e o
  furo só aparece em produção. Foi o que aconteceu uma vez.
- **`alter default privileges ... revoke execute on functions from public` não
  fecha nada.** Medido no Postgres 16: a linha roda, não guarda linha em
  `pg_default_acl`, e a função criada depois nasce com PUBLIC podendo executar.
  Quem fecha é o `revoke execute on all functions`, que passa por cima do que
  já existe e por isso roda no fim do `schema.sql`. Arquivo de correção roda
  sozinho, sem essa varredura: **função nova em correção pede revoke escrito na
  mão**. O revoke de `anon` e `authenticated` no mesmo trecho funciona, porque
  desfaz um default privilege que o Supabase guardou de verdade.
- **Conferir se um endereço está livre é função, e não consulta.** A RLS
  esconde o rascunho dos outros, com razão, e por isso uma consulta comum
  responderia "livre" para endereço que já tem dono, com a colisão aparecendo
  só na gravação. `endereco_livre(slug)` é security definer e devolve booleano:
  enxerga o que precisa e conta só o sim ou o não.
- **A primeira página começa antes da conta.** A pessoa monta o rascunho numa
  conta provisória (anonymous sign-in) e entra com o Google na hora de
  publicar, quando a identidade é ligada na mesma conta e o `dono_id` continua
  o mesmo. Login na frente de tudo é onde a maioria desiste, e página no ar é
  onde a identidade passa a importar: é o endereço do produto e a reputação
  dele que vão junto. Conta provisória é usuário como qualquer outro em
  `auth.users`, então nenhuma política precisou afrouxar.
- **Publicar é conferido no banco, não na tela.** O gatilho
  `protege_publicacao` recusa `publicado = true` vindo de token com
  `is_anonymous`. A tela leva para o Google antes disso, mas tela é conforto:
  quem manda um PATCH direto no PostgREST passa longe dela.
- **Rascunho provisório parado é apagado.** `limpar_rascunhos_abandonados(dias)`
  remove a conta provisória com mais de trinta dias e nenhuma página no ar, e a
  chave estrangeira leva o negócio junto, devolvendo o endereço. Conta que
  entrou com o Google deixa de ser provisória e some da faxina.
- **Coluna de imagem guarda caminho, e nunca URL inteira.** O dono tem UPDATE
  na própria linha, com razão, e com isso ele conseguiria gravar ali o endereço
  de uma imagem hospedada em qualquer lugar. A página pública passaria a
  carregar imagem de terceiro, e o servidor desse terceiro ficaria sabendo o IP
  de cada visitante, que nunca escolheu isso. Guardando só o caminho de dentro
  do bucket, e montando o endereço no código, a coluna por construção aponta
  para dentro de casa. A restrição ainda compara a primeira pasta com o id da
  própria linha, então logo de um negócio jamais aponta para o arquivo de outro.
  Vem na correção 008.
- **A listagem do bucket fica fechada.** Bucket público serve o arquivo sem
  passar por RLS, então a política de SELECT só governa o caminho autenticado e
  a listagem. Aberta, ela entrega os arquivos de página não publicada, o que
  contradiz o "ninguém vê até você publicar" da tela de cadastro.

## Limites do plano gratuito

| recurso | gratuito | pago |
| --- | --- | --- |
| páginas por conta | 1 | 5 |
| itens no cardápio | 20 | 500 |
| fotos por item | 3 | 10 |
| fotos na galeria | 12 | 100 |
| links | 8 | 30 |
| intervalos por dia | 3 | 4 |

Estão todos numa função só, `limite_do_plano`. Mudar número é mudar uma linha.

Contagem de visitas e cliques fica no plano gratuito, no básico: quantas
visitas e quantos cliques no período. Histórico longo e comparação com o
período anterior ficam para o pago. O raciocínio é que o número básico é o
único jeito de o dono ver que a página está trabalhando, e esconder isso
atrás de assinatura tira justamente a prova que faria ele assinar.

A tabela `eventos` já guarda os três tipos (`visita`, `clique_whatsapp`,
`clique_acao`) e a página pública já tem os ganchos. Falta a tela do painel.

## Ainda em aberto

- Apagar o arquivo do Storage quando o registro sai do banco, senão o 1 GB
  gratuito enche de lixo.
- Rollup diário dos eventos, quando a tabela crescer. Por enquanto tem índice
  e uma função de limpeza dos registros com mais de 400 dias.
- Intervalos de horário que se sobrepõem no mesmo dia não são barrados. Não
  quebram a página, o painel é que precisa evitar.
