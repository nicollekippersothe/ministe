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
npm test          # testes da lógica de horário
npm run imagens   # regera as imagens de exemplo em public/exemplo
```

## Onde está o quê

- `app/[slug]` ainda não existe. Hoje o exemplo vive em `app/demo`.
- `componentes/PaginaPublica.tsx` é a página pública inteira. Quando o banco
  entrar, a rota nova chama esse mesmo componente.
- `lib/horarios.ts` concentra toda conta de fuso. O servidor monta uma linha do
  tempo em epoch e o navegador só compara número, então a página pode ficar em
  cache sem o selo de "aberto agora" envelhecer.
- `lib/tipos.ts` espelha o schema que vai para o Supabase.
- `assets/` guarda a fonte usada só na geração da imagem de link, no servidor.

## Etapas

1. Página pública de exemplo no ar. **Feito.**
2. Supabase conectado, schema criado, RLS testada.
3. Página pública lendo do banco por slug.
4. Login por link mágico e painel editando os campos básicos.
5. Upload de imagens.
6. Catálogo e links.
7. Contagem de visitas e cliques.
8. Os outros dois temas.

## Fora da versão 1

Pagamento do cliente final, pedido ou carrinho, domínio próprio, multiusuário,
app nativo, chat interno, integração com iFood ou Instagram. A cobrança da
assinatura começa manual: o campo `plano` é virado na mão.
