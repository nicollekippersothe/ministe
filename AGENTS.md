# Banca

Nome provisório. Micro-SaaS que dá uma página pronta para o negócio local que
hoje só tem Instagram: endereço, horário, cardápio e um botão de WhatsApp que
já abre a conversa escrita.

## Regras de escrita

Nunca usar travessão, nem no produto nem em resposta nem em commit. Usar
vírgula, dois pontos, parênteses ou ponto final.

## Regras do produto

1. Celular primeiro, de verdade. O painel também vai ser usado no celular.
2. A página pública é renderizada no servidor e carrega o mínimo de JavaScript.
   Meta medida no Lighthouse mobile: 90 ou mais em performance.
3. SEO por negócio: title, meta description, Open Graph e JSON-LD do tipo
   LocalBusiness em toda página pública.
4. Acessibilidade: contraste conferido, foco visível, alt em toda imagem,
   formulário com label de verdade. Meta: 100 no Lighthouse.
5. Sem dado inventado. Campo vazio faz a seção sumir, nunca vira "em breve"
   nem exemplo.

## Como rodar

```
npm run dev       # desenvolvimento
npm run build     # build de produção
npm test          # testes de horário e de formatação
npm run fluxo     # teste de fluxo no navegador, precisa do servidor rodando
npm run imagens   # regera as imagens de exemplo em public/exemplo
```

## Onde está o quê

- `app/[slug]` é a página pública, e só entrega negócio publicado.
- `app/painel` é o painel do dono. **Ainda sem login**, então não pode ir para
  a internet antes da etapa 4.
- `componentes/PaginaPublica.tsx` é a página pública inteira, usada também pela
  prévia do painel.
- `lib/dados.ts` é a camada de dados. Hoje grava num arquivo local. Quando o
  Supabase entrar, só este arquivo muda.
- `lib/horarios.ts` concentra toda conta de fuso. O servidor monta uma linha do
  tempo em epoch e o navegador só compara número, então a página pode ficar em
  cache sem o selo de "aberto agora" envelhecer.
- `lib/fontes.ts` tem as cinco combinações de letra. Nenhuma é pré-carregada,
  senão o Next baixa todas em toda rota. Só o CSS aplicado puxa o arquivo.
- `lib/slug.ts` tem as regras do endereço, espelhando a lista do banco.
- `lib/tipos.ts` espelha o schema que vai para o Supabase.
- `assets/` guarda a fonte usada só na geração da imagem de link, no servidor.
- `supabase/` tem o schema, os testes de RLS e o Storage. Nada foi aplicado num
  projeto ainda, mas o schema roda e passa nos testes num Postgres local.
  Ver `supabase/LEIA-ME.md`.

## Etapas

1. Página pública de exemplo no ar. **Feito.**
2. Supabase conectado, schema criado, RLS testada. **SQL escrito e testado
   local, falta aplicar no projeto.**
3. Página pública lendo do banco por slug. **Rota pronta, lendo do arquivo
   local em vez do banco.**
4. Login por link mágico e painel editando os campos básicos. **Painel e telas
   de cadastro feitos, falta ligar o login de verdade.**
5. Upload de imagens.
6. Catálogo e links.
7. Contagem de visitas e cliques.
8. Os outros dois temas.

## Fora da versão 1

Pagamento do cliente final, pedido ou carrinho, domínio próprio, multiusuário,
app nativo, chat interno, integração com iFood ou Instagram. A cobrança da
assinatura começa manual: o campo `plano` é virado na mão.
