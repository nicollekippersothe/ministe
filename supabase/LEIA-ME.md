# Banco

Nada aqui foi executado num projeto Supabase. Os arquivos estão prontos para
aplicar, e o schema já foi rodado e testado num Postgres 16 local.

## Arquivos

| arquivo | o que é | testado |
| --- | --- | --- |
| `schema.sql` | tabelas, restrições, gatilhos, funções e RLS | sim, 47 testes |
| `testes-rls.sql` | a bateria de testes, roda e desfaz tudo no fim | sim |
| `storage.sql` | bucket das imagens e permissões | não, precisa do Supabase |
| `local/stub.sql` | só para rodar local, nunca aplicar no Supabase | sim |

## Aplicar no Supabase

1. Criar o projeto, região São Paulo (`sa-east-1`).
2. SQL Editor, colar `schema.sql`, executar.
3. SQL Editor, colar `storage.sql`, executar.
4. Rodar `testes-rls.sql` para conferir que a RLS ficou de pé:

```
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/testes-rls.sql
```

Tem que terminar com `TODOS OS TESTES PASSARAM`. O script roda dentro de uma
transação e desfaz tudo no fim, então pode ser executado com dados reais.

5. Conferir na mão a lista que está no fim de `storage.sql`.

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

## Ainda em aberto

- Apagar o arquivo do Storage quando o registro sai do banco, senão o 1 GB
  gratuito enche de lixo.
- Rollup diário dos eventos, quando a tabela crescer. Por enquanto tem índice
  e uma função de limpeza dos registros com mais de 400 dias.
- Intervalos de horário que se sobrepõem no mesmo dia não são barrados. Não
  quebram a página, o painel é que precisa evitar.
