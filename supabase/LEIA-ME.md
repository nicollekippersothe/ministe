# Banco

Nada aqui foi executado num projeto Supabase. Os arquivos estão prontos para
aplicar, e o schema já foi rodado e testado num Postgres 16 local.

## Arquivos

| arquivo | o que é | testado |
| --- | --- | --- |
| `schema.sql` | tabelas, restrições, gatilhos, funções e RLS | sim, 71 asserções |
| `testes-rls.sql` | 71 asserções de RLS, de limite e de permissão de função | sim |
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

## Preço do plano pago

R$ 29,90 por mês, ou R$ 19,90 por mês pagando o ano (R$ 238,80). Mostrado na
tela inicial, em `componentes/inicial/Planos.tsx`, junto da tabela de limites
acima. Nenhum outro lugar do código tinha esse número, então a pesquisa e o
raciocínio ficam registrados aqui, para não precisar refazer a conta na
próxima vez que alguém perguntar de onde ele saiu.

Pesquisa feita em agosto de 2026:

| produto | preço | o que é |
| --- | --- | --- |
| linkme.bio | a partir de R$ 6,90/mês (anual) | link na bio, sem catálogo nem endereço |
| Linktree | US$ 8 a US$ 35/mês | link na bio, mercado americano |
| Beacons.ai | US$ 10 a US$ 90/mês | link na bio com loja, mercado americano |
| "site pronto" (SitesProntos.com.br) | R$ 559,99 de ativação + R$ 19,99/mês | site editável, com taxa de entrada |
| Anota AI | a partir de R$ 299,99/mês | cardápio com robô de WhatsApp e PDV, categoria bem mais cara |

O `entrais` fica acima do link.bio mais barato porque entrega mais que uma
lista de links (catálogo com preço, horário, endereço no mapa, SEO). Fica bem
abaixo de Linktree e Beacons, que cobram em dólar para um público diferente.
E fica abaixo do "site pronto" mais próximo, que cobra R$ 19,99 por mês só
depois de uma ativação de quase R$ 560: o `entrais` não tem taxa de entrada,
então o mensal absorve um pouco do que lá vira ativação. Anota AI não é
comparável de verdade, é outra categoria de produto (automação de pedido),
por isso custa dez vezes mais.

O desconto do plano anual (33%) segue o padrão do setor: Linktree dá de 30 a
37% no anual, Beacons de 20 a 25%.

Continua valendo o que já estava demarcado no roadmap: a cobrança em si
começa manual, o campo `plano` é virado na mão. Este preço é o que a tela
promete, não o que já está automatizado no banco.

## Ainda em aberto

- Apagar o arquivo do Storage quando o registro sai do banco, senão o 1 GB
  gratuito enche de lixo.
- Rollup diário dos eventos, quando a tabela crescer. Por enquanto tem índice
  e uma função de limpeza dos registros com mais de 400 dias.
- Intervalos de horário que se sobrepõem no mesmo dia não são barrados. Não
  quebram a página, o painel é que precisa evitar.
