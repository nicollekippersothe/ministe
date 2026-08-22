/**
 * Monta uma página de revisão com as telas do produto.
 *
 * Captura cada tela duas vezes, num celular emulado e num monitor, e junta
 * tudo num arquivo HTML que se basta: as imagens vão embutidas, então dá para
 * abrir offline, mandar por link ou olhar no celular. Na página de revisão um
 * botão troca a largura, e a moldura acompanha: aparelho preto no celular,
 * janela discreta no computador.
 *
 * Precisa do servidor de produção rodando:
 *   npm run build && npm start
 *   npm run revisao
 */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, devices } from "playwright";
import sharp from "sharp";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SAIDA = process.env.SAIDA ?? "/tmp/revisao";
const EXECUTAVEL = process.env.CHROMIUM;

/** As duas larguras em que toda tela é capturada. */
const TAMANHOS = ["celular", "monitor"];

/**
 * O que cada tela é, o que já funciona e o que ainda está por vir.
 * A nota é tão importante quanto a imagem: sem ela dá para reclamar de algo
 * que ainda nem foi construído.
 *
 * Campos que enquadram a captura:
 *   focar   rola até um elemento e fotografa só o que cabe na tela ali;
 *   rolar   mesma coisa, com a altura de rolagem escrita na mão (um número,
 *           ou um número por tamanho);
 *   nada    a página inteira, de cima a baixo.
 */
const TELAS = [
  {
    id: "inicial",
    rota: "/",
    nome: "Tela inicial",
    grupo: "Entrada",
    nota: "O telefone da abertura e as três peças da segunda seção são os componentes de verdade da página publicada, montados no servidor com os dados dos exemplos. Se o botão mudar no produto, ele muda aqui junto, e a propaganda continua igual ao que a pessoa recebe. No computador a abertura vira duas colunas, com o texto de um lado e o aparelho do outro.",
  },
  {
    id: "criar",
    rota: "/criar",
    nome: "Criar página",
    grupo: "Entrada",
    nota: "Três respostas: nome, endereço e ramo. O endereço vai sendo limpo enquanto a pessoa digita, com acento e espaço virando hífen sozinhos, e a página é criada de verdade. No computador a coluna da direita mostra o esqueleto da página nascendo conforme as respostas chegam.",
  },
  {
    id: "criar-ramo",
    rota: "/criar",
    nome: "Escolher o ramo",
    grupo: "Entrada",
    focar: "fieldset",
    nota: "Trinta e cinco ramos em sete grupos, numa lista rolável dentro do formulário. A escolha faz duas coisas que valem dinheiro: vira o tipo que o Google entende (Bakery, Dentist, Florist) e monta a página antes de o dono preencher qualquer campo. Cada opção é um rádio com name e value próprios, então a resposta chega ao servidor até num navegador que só interpreta HTML.",
  },
  {
    id: "criar-busca",
    rota: "/criar",
    nome: "Procurar o ramo",
    grupo: "Entrada",
    preparar: async (p) => {
      await p
        .locator("input[type=search]")
        .pressSequentially("ensaio", { delay: 40 });
      await p.waitForTimeout(500);
    },
    focar: "fieldset",
    nota: "Digitar ensaio deixa Fotografia e vídeo de pé na lista. A procura casa pelo jeito que a pessoa fala, e cada categoria carrega os termos de quem procura: bolo acha Confeitaria, inglês acha Aulas particulares, marmita acha Comida caseira. Quem começa com o que foi digitado aparece primeiro, então caf traz Cafeteria antes de Comida caseira.",
  },
  {
    id: "criar-escolhida",
    rota: "/criar",
    nome: "Ramo escolhido",
    grupo: "Entrada",
    preparar: async (p) => {
      await p.check("input[name=categoria][value=fotografia]");
      await p.waitForTimeout(500);
    },
    focar: { sel: "fieldset", ancora: "fim" },
    nota: "Marcada a opção Fotografia e vídeo, a linha embaixo da lista conta o efeito: começa com Ensaios, preço combinado na conversa, e a galeria vem na frente. É a mesma receita que monta a página de verdade, lida de lib/categorias.ts, então a promessa do cadastro e o resultado combinam. Todo campo continua editável depois, no painel.",
  },
  {
    id: "criar-ocupado",
    rota: "/criar",
    nome: "Endereço indisponível",
    grupo: "Entrada",
    preparar: async (p) => {
      await p.fill("#nome", "Doceria da Ana");
      await p.fill("input[name=slug]", "painel");
      await p.waitForTimeout(900);
    },
    focar: "input[name=slug]",
    nota: "O aviso aparece enquanto a pessoa digita, antes de o formulário ir embora. É o momento de maior atrito do cadastro, e por isso vale o único pedaço de código que roda no navegador. Aqui o endereço pedido é painel, que está na lista de rotas reservadas do produto.",
  },
  {
    id: "entrar",
    rota: "/entrar",
    nome: "Entrar",
    grupo: "Entrada",
    nota: "Uma porta só, e o Google resolve as duas chegadas: quem volta de outro aparelho e quem já montou a própria página. O login está ligado pelo Supabase Auth, e a volta do Google passa por /auth/retorno, que troca o código por sessão e grava o cookie ali mesmo, numa rota de servidor. Nome e e-mail servem para guardar a página no nome da pessoa.",
  },
  {
    id: "entrar-publicar",
    rota: "/entrar?motivo=publicar",
    nome: "Entrar para publicar",
    grupo: "Entrada",
    nota: "A mesma tela, com o texto trocado pelo motivo que vem na URL. Quem monta a página antes de ter conta chega aqui na hora de publicar, e o botão vira Entrar e publicar. Por dentro a diferença é grande: a conta provisória continua a mesma e o Google é ligado nela por linkIdentity, então o auth.uid() se mantém e o rascunho segue sendo de quem o montou.",
  },
  {
    id: "publica",
    rota: "/demo",
    nome: "Página do negócio",
    grupo: "O produto",
    vitrine: "Massoterapeuta",
    nota: "É o produto de verdade. Tudo aqui funciona: o selo de aberto se atualiza sozinho, o botão de WhatsApp abre a conversa já escrita, o endereço abre o mapa. As fotos também são de verdade, em domínio público, baixadas do Openverse por scripts/baixar-fotos.mjs, e a procedência de cada arquivo fica registrada em public/exemplo/fotos.json.",
  },
  {
    id: "publica-horarios",
    rota: "/demo",
    nome: "Horários abertos",
    grupo: "O produto",
    preparar: async (p) => {
      await p.click("summary");
      await p.waitForTimeout(400);
    },
    focar: "summary",
    nota: "A tabela da semana abre com um toque, em HTML puro, e o dia de hoje aparece em destaque. A conta de fuso fica no servidor, que manda uma linha do tempo em epoch, e o navegador só compara número: assim a página pode ficar em cache com o selo de aberto agora continuando certo.",
  },
  {
    id: "og",
    imagem: "/demo/opengraph-image",
    nome: "Prévia do link",
    grupo: "O produto",
    nota: "O que aparece quando o dono cola o link no WhatsApp ou na bio do Instagram, e a primeira impressão de quem chega antes de abrir a página. É gerada pelo servidor num tamanho só, 1200 por 630, então esta é a única tela da revisão com uma largura em vez de duas.",
  },
  {
    id: "canto",
    rota: "/bia-marconi",
    nome: "Professora de canto",
    grupo: "O produto",
    vitrine: "Professora de canto",
    nota: "Exemplo no plano pago: botão principal apontando para a agenda, WhatsApp como segundo botão, letra escolhida e rodapé limpo. É a única da família de atender pessoa cuja categoria mostra preço à vista, e por isso ela é quem sustenta o botão de agenda em destaque.",
  },
  {
    id: "astro",
    rota: "/nara-bittencourt",
    nome: "Astróloga",
    grupo: "O produto",
    vitrine: "Astróloga",
    nota: "O caso que vem do Linktree: cinco links, que é o que essa gente tem espalhado por aí. Repare que ela mostra a cidade no lugar do endereço, porque atende online, e que a categoria dela é Consultoria e não Saúde: pendurar leitura de mapa na família da saúde faria a marcação dizer ao Google uma coisa que não é.",
  },
  {
    id: "psi",
    rota: "/camila-reis",
    nome: "Psicóloga",
    grupo: "O produto",
    vitrine: "Psicóloga",
    nota: "Endereço guardado e preço combinado na conversa, que é o caso de boa parte da saúde. As duas seções somem sozinhas e o layout se fecha em volta, que é a regra de campo vazio valendo para o produto inteiro.",
  },
  {
    id: "ilustra",
    rota: "/lia-prado",
    nome: "Ilustradora",
    grupo: "O produto",
    vitrine: "Ilustradora",
    nota: "O caso que o produto existe para atender: alguém boa no que faz, com o trabalho todo dentro de uma rede social. A categoria põe a galeria antes do catálogo, porque trabalho visual se vende pela foto, e o orçamento fica para a conversa, porque ilustração se orça por escopo.",
  },
  {
    id: "doceria",
    rota: "/alecrim-confeitaria",
    nome: "Confeitaria",
    grupo: "O produto",
    vitrine: "Confeitaria",
    nota: "O único exemplo de casa comercial, e ele continua existindo porque o produto continua servindo para isso. Repare no que muda: catálogo na frente com preço à vista, mapa, iFood como segundo botão, e o monograma no lugar do retrato, porque aqui a marca é a casa e não a pessoa.",
  },
  {
    id: "tatu",
    rota: "/teo-sarmento",
    nome: "Tatuador",
    grupo: "O produto",
    vitrine: "Tatuador",
    nota: "Trabalho autoral em que a galeria é o produto, e a página inteira se reorganiza em volta disso. Repare na ordem das seções: aqui e na ilustradora as fotos vêm antes do catálogo, e na confeitaria o catálogo vem primeiro. Quem decide é a categoria escolhida no cadastro, pela mesma receita que a prévia mostra enquanto a pessoa responde.",
  },
  {
    id: "nao-existe",
    rota: "/endereco-que-nao-existe",
    nome: "Endereço livre",
    grupo: "O produto",
    nota: "Endereço livre responde com convite no lugar de erro seco: quem digitou vê que aquele endereço está disponível e começa a página dele ali mesmo. É aquisição de graça, no caminho de quem errou uma letra.",
  },
  {
    id: "denunciar",
    rota: "/denunciar?p=doceria-da-ana",
    nome: "Denunciar uma página",
    grupo: "O produto",
    nota: "Aberta pelo link discreto no rodapé de toda página pública, inclusive as pagas. O formulário pede o endereço, o motivo e um detalhe, e a denúncia segue anônima: pedir identificação afastaria justamente quem tem medo do denunciado. É a peça que de fato pega golpe, porque quem descobre é quem caiu nele.",
  },
  {
    id: "link-recusado",
    rota: "/painel/acoes-botoes",
    nome: "Link recusado",
    grupo: "Painel do dono",
    preparar: async (p) => {
      await p.selectOption("#secundaria-tipo", "link");
      await p.fill("#secundaria-url", "bit.ly/promo");
      await p.click('button:has-text("Salvar")');
      await p.waitForURL(/erro=link_/);
    },
    nota: "Todo link digitado passa por lib/links.ts antes de virar botão. Seguem em frente http e https com o domínio à vista; encurtador (que esconde o destino), usuário antes do arroba e IP puro ficam de fora, cada um com o motivo escrito na tela. A conferência na Google Safe Browsing está escrita e espera a chave.",
  },
  {
    id: "painel",
    rota: "/painel",
    nome: "Painel",
    grupo: "Painel do dono",
    nota: "Funciona de verdade, e agora com login: cada pessoa entra com o Google e enxerga a própria página. A separação mora na RLS do banco, um andar abaixo da tela, então ela vale igual para quem chamar a API direto com a chave pública. O cartão de cima mostra o endereço, o estado (rascunho ou no ar) e o botão que troca um pelo outro.",
    aviso:
      "Editar catálogo, fotos e links entra nas próximas etapas. Hoje o painel cobre informações do negócio, horários, botões e letras.",
  },
  {
    id: "negocio",
    rota: "/painel/negocio",
    nome: "Informações do negócio",
    grupo: "Painel do dono",
    semFixos: true,
    nota: "Salva de verdade e a página pública muda na hora. O WhatsApp é arrumado sozinho: digite (11) 98888-7777 e ele guarda com o código do país.",
  },
  {
    id: "horarios",
    rota: "/painel/horarios",
    nome: "Horários",
    grupo: "Painel do dono",
    semFixos: true,
    nota: "Três intervalos por dia, e turno que vira a madrugada (19:00 às 02:00) é aceito. Dia em branco aparece marcado como fechado, que é como o banco guarda: dia com horário está aberto, e o resto se conclui daí.",
  },
  {
    id: "horarios-barra",
    rota: "/painel/horarios",
    nome: "Barra de salvar",
    grupo: "Painel do dono",
    rolar: { celular: 700, monitor: 500 },
    nota: "O botão Salvar fica preso no rodapé enquanto a pessoa rola. Num formulário longo, no celular, isso poupa a viagem até o fim da página só para salvar.",
  },
  {
    id: "acoes",
    rota: "/painel/acoes-botoes",
    nome: "Botões da página",
    grupo: "Painel do dono",
    semFixos: true,
    nota: "O botão do rodapé vai além do WhatsApp: pode virar iFood, agenda, link de parceiro ou uma ligação, e ainda cabe um segundo botão embaixo.",
  },
  {
    id: "aparencia",
    rota: "/painel/aparencia",
    nome: "Letras da página",
    grupo: "Painel do dono",
    semFixos: true,
    nota: "Escolher a letra é do plano pago, então no gratuito as opções aparecem travadas, com a padrão marcada. Só a combinação aplicada é baixada por quem visita a página.",
    aviso:
      "O tema de cor é um só por enquanto, o areia. Os outros dois entram na etapa 8.",
  },
  {
    id: "previa",
    rota: "/painel/previa",
    nome: "Prévia do rascunho",
    grupo: "Painel do dono",
    nota: "Como o dono vê a própria página antes de publicar. A rota pública entrega só negócio publicado, mesmo para quem tem o endereço na mão, e é por isso que esta tela existe.",
  },
];

// ---------------------------------------------------------------------------
// Captura
// ---------------------------------------------------------------------------

/** Imagem que o servidor devolve pronta, tipo a prévia do link. */
async function buscarImagem(caminho) {
  for (let tentativa = 0; ; tentativa++) {
    try {
      const r = await fetch(BASE + caminho);
      if (!r.ok) throw new Error(`status ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (erro) {
      if (tentativa === 3) throw erro;
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
}

/** Rola até o elemento e devolve o que cabe na tela a partir dali. */
async function enquadrar(p, focar) {
  const { sel, ancora } =
    typeof focar === "string" ? { sel: focar, ancora: "topo" } : focar;

  await p.evaluate(
    ([sel, ancora, folga]) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const caixa = el.getBoundingClientRect();
      const topo = caixa.top + window.scrollY;
      const alvo =
        ancora === "fim"
          ? topo + caixa.height + folga - window.innerHeight
          : ancora === "meio"
            ? topo - (window.innerHeight - caixa.height) / 2
            : topo - folga;
      window.scrollTo(0, Math.max(0, alvo));
    },
    [sel, ancora, 28],
  );
}

async function retratar(contexto, tela, tamanho) {
  const p = await contexto.newPage();
  try {
    // "load" e não "networkidle": o Next fica buscando as rotas dos links
    // que aparecem na tela, então a rede nunca fica parada de verdade.
    await p.goto(BASE + tela.rota, { waitUntil: "load" });
    await p.waitForTimeout(700);

    // Solta as barras presas, senão o retrato inteiro mostra elas no meio.
    if (tela.semFixos) {
      await p.addStyleTag({
        content: ".sticky, [class*='sticky'] { position: static !important; }",
      });
    }

    if (tela.preparar) await tela.preparar(p, tamanho);

    // Rola até o fim para acordar as imagens que carregam sob demanda.
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(900);

    const recortado = tela.focar !== undefined || tela.rolar !== undefined;

    if (tela.focar !== undefined) {
      await enquadrar(p, tela.focar);
    } else if (tela.rolar !== undefined) {
      const y =
        typeof tela.rolar === "number" ? tela.rolar : tela.rolar[tamanho];
      await p.evaluate((y) => window.scrollTo(0, y), y);
    }
    if (recortado) await p.waitForTimeout(400);

    // Sem fullPage, o retrato é exatamente o que cabe na tela naquele ponto da
    // rolagem, que é o que estas telas querem mostrar.
    return await p.screenshot(recortado ? {} : { fullPage: true });
  } finally {
    await p.close();
  }
}

async function capturar() {
  const navegador = await chromium.launch(
    EXECUTAVEL ? { executablePath: EXECUTAVEL } : {},
  );
  const contextos = {
    celular: await navegador.newContext({
      ...devices["iPhone 13"],
      deviceScaleFactor: 2,
    }),
    monitor: await navegador.newContext({
      viewport: { width: 1440, height: 940 },
      deviceScaleFactor: 2,
    }),
  };

  const brutas = new Map();

  /*
   * As imagens geradas pelo servidor vêm primeiro, e é de propósito. A rota de
   * Open Graph para de responder depois que o otimizador de imagem do Next
   * serve qualquer foto grande no mesmo processo: a geração morre com "Input
   * buffer contains unsupported image format", que não tem relação com a causa.
   * Buscar antes de o navegador abrir a primeira página mantém o processo
   * limpo. O motivo inteiro está em app/[slug]/opengraph-image.tsx.
   */
  for (const tela of TELAS.filter((t) => t.imagem)) {
    brutas.set(tela.id, {
      unico: { largura: "cartao", bruto: await buscarImagem(tela.imagem) },
    });
    console.log(`ok ${tela.id}`);
  }

  for (const tela of TELAS.filter((t) => !t.imagem)) {
    const imagens = {};
    for (const tamanho of TAMANHOS) {
      imagens[tamanho] = {
        largura: tamanho,
        bruto: await retratar(contextos[tamanho], tela, tamanho),
      };
    }
    brutas.set(tela.id, imagens);
    console.log(`ok ${tela.id}`);
  }

  await navegador.close();
  return TELAS.map((t) => ({ ...t, brutas: brutas.get(t.id) }));
}

// ---------------------------------------------------------------------------
// Compressão
// ---------------------------------------------------------------------------

/*
 * O arquivo é uma página web, e agora carrega duas imagens por tela. Largura e
 * qualidade abaixo foram escolhidas mirando uns 12 MB no total: o retrato do
 * celular já sai na medida, e o do monitor desce de 2880 para caber.
 */
const LARGURA_SAIDA = { celular: 720, monitor: 1180, cartao: 1100 };
const QUALIDADE = { celular: 74, monitor: 71, cartao: 80 };

async function comprimir(capturadas) {
  const prontas = [];
  let total = 0;

  for (const t of capturadas) {
    const imagens = {};
    for (const [chave, crua] of Object.entries(t.brutas)) {
      const dados = await sharp(crua.bruto)
        .resize({
          width: LARGURA_SAIDA[crua.largura],
          withoutEnlargement: true,
        })
        .jpeg({ quality: QUALIDADE[crua.largura], mozjpeg: true })
        .toBuffer();
      const meta = await sharp(dados).metadata();
      imagens[chave] = {
        w: meta.width,
        h: meta.height,
        src: `data:image/jpeg;base64,${dados.toString("base64")}`,
      };
      total += dados.length;
    }

    prontas.push({
      id: t.id,
      nome: t.nome,
      grupo: t.grupo,
      rota: t.rota ?? t.imagem,
      vitrine: t.vitrine ?? null,
      nota: t.nota,
      aviso: t.aviso ?? null,
      imagens,
    });
    console.log(`  ${t.id} ${Math.round(pesar(imagens) / 1024)} KB`);
  }

  console.log(`\nimagens: ${Math.round(total / 1024 / 1024)} MB`);
  return prontas;
}

/** Quanto uma tela ocupa somando os tamanhos dela, já em base64. */
function pesar(imagens) {
  return Object.values(imagens).reduce((soma, i) => soma + i.src.length, 0);
}

// ---------------------------------------------------------------------------
// A página de revisão
// ---------------------------------------------------------------------------

function montarPagina(telas) {
  const grupos = [...new Set(telas.map((t) => t.grupo))];
  const dados = JSON.stringify(telas).replace(/</g, "\\u003c");
  const vitrine = telas.filter((t) => t.vitrine);

  const familia = vitrine
    .map(
      (t) => `
      <li class="mini">
        <button class="mini-toque" type="button" data-id="${t.id}">
          <span class="mini-tela"><img src="${t.imagens.celular.src}" alt="Página de ${t.vitrine}" loading="lazy" /></span>
          <span class="mini-rotulo">${t.vitrine}</span>
        </button>
      </li>`,
    )
    .join("");

  const menu = grupos
    .map(
      (g) => `
      <div class="grupo">
        <p class="eyebrow">${g}</p>
        <div class="lista">
          ${telas
            .filter((t) => t.grupo === g)
            .map(
              (t) => `<button class="aba" data-id="${t.id}" type="button">
                <span class="aba-nome">${t.nome}</span>
                <span class="aba-rota">${t.rota}</span>
              </button>`,
            )
            .join("")}
        </div>
      </div>`,
    )
    .join("");

  // O título vira o nome da página na aba e na galeria de quem recebe o link.
  // Nome, e não descrição: "telas para revisão" explicaria o que ela é e
  // serviria igual para qualquer página de qualquer produto.
  return `<title>Telas do Entrais</title>
<style>
  :root {
    --ground: #faf8f5;
    --surface: #ffffff;
    --line: #e6e0d7;
    --ink: #171412;
    --muted: #6b6259;
    --accent: #b4522f;
    --accent-fraco: #f6ebe5;
    --palco: #17151300;
    --palco-solido: #1a1714;
    --palco-linha: #2e2924;
    --palco-ink: #f3efe9;
    --palco-muted: #a9a097;
    --warn: #8a5a12;
    --warn-fundo: #f8eeda;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #131110;
      --surface: #1c1917;
      --line: #2e2924;
      --ink: #f3efe9;
      --muted: #a49a90;
      --accent: #e08a63;
      --accent-fraco: #2a201b;
      --palco-solido: #0c0a09;
      --palco-linha: #241f1b;
      --warn: #e0ac5c;
      --warn-fundo: #2b2115;
    }
  }

  :root[data-theme="dark"] {
    --ground: #131110;
    --surface: #1c1917;
    --line: #2e2924;
    --ink: #f3efe9;
    --muted: #a49a90;
    --accent: #e08a63;
    --accent-fraco: #2a201b;
    --palco-solido: #0c0a09;
    --palco-linha: #241f1b;
    --warn: #e0ac5c;
    --warn-fundo: #2b2115;
  }

  * { box-sizing: border-box; min-width: 0; }

  /* Vale para o botão de tamanho e para o alerta, que têm display próprio e
     passariam por cima do hidden do navegador. */
  [hidden] { display: none !important; }

  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: var(--sans);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  .eyebrow {
    font-family: var(--mono);
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0;
  }

  .largura { max-width: 1120px; margin: 0 auto; padding-inline: 22px; }

  /* Abertura: a família de páginas, que é o que vende. */
  .abertura { padding: 40px 0 12px; }
  .abertura h1 {
    margin: 10px 0 0;
    font-size: clamp(1.9rem, 1.2rem + 2.6vw, 3rem);
    letter-spacing: -0.035em;
    line-height: 1.04;
    text-wrap: balance;
    max-width: 18ch;
  }
  .abertura .intro {
    margin: 14px 0 0;
    max-width: 56ch;
    color: var(--muted);
    font-size: 1.02rem;
  }

  .familia {
    list-style: none;
    display: flex;
    gap: 14px;
    margin: 34px 0 0;
    padding: 0 0 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .familia::-webkit-scrollbar { display: none; }
  .mini { flex: none; }
  .mini-toque {
    display: flex;
    flex-direction: column;
    gap: 9px;
    align-items: center;
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    font: inherit;
    color: inherit;
  }
  .mini-tela {
    display: block;
    width: 132px;
    height: 268px;
    overflow: hidden;
    border-radius: 20px;
    background: #fff;
    border: 5px solid var(--palco-solido);
    box-shadow: 0 14px 26px -16px rgba(23, 20, 18, 0.6);
    transition: transform 0.18s ease;
  }
  .mini-toque:hover .mini-tela { transform: translateY(-3px); }
  .mini-tela img { display: block; width: 100%; height: auto; }
  .mini-rotulo { font-size: 0.82rem; color: var(--muted); }

  /* Bancada: o palco escuro faz a tela clara aparecer. */
  .bancada { padding: 46px 0 70px; }

  .cabeca-bancada {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    border-top: 1px solid var(--line);
    padding-top: 26px;
  }
  .cabeca-bancada h2 {
    margin: 0;
    font-size: 1.35rem;
    letter-spacing: -0.02em;
  }

  .corpo { display: flex; flex-direction: column; gap: 22px; margin-top: 24px; }

  @media (min-width: 940px) {
    .corpo { flex-direction: row; align-items: flex-start; gap: 30px; }
    .navegador { width: 218px; flex: none; position: sticky; top: 18px; }
    .palco-col { flex: 1; min-width: 0; }
  }

  .navegador { display: flex; flex-direction: column; gap: 16px; }
  .grupo { display: flex; flex-direction: column; gap: 7px; }
  .lista { display: flex; flex-direction: column; gap: 3px; }

  @media (max-width: 939px) {
    .lista { flex-direction: row; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
    .lista::-webkit-scrollbar { display: none; }
    .aba { flex: none; }
  }

  .aba {
    display: flex;
    flex-direction: column;
    gap: 1px;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .aba:hover { background: var(--surface); }
  .aba[aria-current="true"] { background: var(--accent-fraco); border-color: var(--accent); }
  .aba-nome { font-size: 0.9rem; font-weight: 550; }
  .aba-rota { font-family: var(--mono); font-size: 0.66rem; color: var(--muted); white-space: nowrap; }
  .aba[aria-current="true"] .aba-rota { color: var(--accent); }

  .palco-col { display: flex; flex-direction: column; gap: 14px; }

  /* Celular ou computador, com a moldura acompanhando a escolha. */
  .tamanhos {
    align-self: flex-start;
    display: inline-flex;
    gap: 3px;
    padding: 3px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
  }
  .tamanhos button {
    border: 0;
    border-radius: 999px;
    background: transparent;
    padding: 5px 14px;
    font: inherit;
    font-size: 0.85rem;
    color: var(--muted);
    cursor: pointer;
  }
  .tamanhos button[aria-pressed="true"] {
    background: var(--accent-fraco);
    color: var(--accent);
    font-weight: 600;
  }

  .palco {
    background: var(--palco-solido);
    border-radius: 20px;
    padding: 30px 18px;
    display: flex;
    justify-content: center;
  }

  .aparelho {
    width: 100%;
    max-width: 386px;
    border-radius: 36px;
    background: #000;
    padding: 9px;
    box-shadow: 0 30px 60px -28px rgba(0, 0, 0, 0.9);
  }
  .janela {
    height: 620px;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 28px;
    background: #fff;
    -webkit-overflow-scrolling: touch;
  }
  .janela img { display: block; width: 100%; height: auto; }
  .barra { display: none; }

  /* Computador: janela discreta, com a barrinha de cima e mais nada. */
  .palco[data-largura="monitor"] { padding: 26px 20px; }
  .palco[data-largura="monitor"] .aparelho {
    max-width: 100%;
    border-radius: 13px;
    background: var(--palco-linha);
    padding: 0;
    overflow: hidden;
    box-shadow: 0 26px 50px -30px rgba(0, 0, 0, 0.85);
  }
  .palco[data-largura="monitor"] .barra {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding-inline: 14px;
  }
  .palco[data-largura="monitor"] .barra span {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--palco-muted);
    opacity: 0.4;
  }
  .palco[data-largura="monitor"] .janela {
    height: 560px;
    border-radius: 0;
  }

  /* Prévia do link: cabe inteira, então fica parada. */
  .palco[data-largura="cartao"] .aparelho {
    max-width: 100%;
    border-radius: 10px;
    padding: 5px;
  }
  .palco[data-largura="cartao"] .janela { height: auto; border-radius: 6px; }

  .ficha { display: flex; flex-direction: column; gap: 9px; margin-top: 4px; }
  .ficha h3 { margin: 0; font-size: 1.2rem; letter-spacing: -0.02em; }
  .ficha p { margin: 0; color: var(--muted); max-width: 66ch; }
  .marca-rota { font-family: var(--mono); font-size: 0.76rem; color: var(--accent); margin: 0; }

  .alerta {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    background: var(--warn-fundo);
    color: var(--warn);
    border-radius: 10px;
    padding: 10px 13px;
    font-size: 0.87rem;
    max-width: 66ch;
  }

  .rodape {
    border-top: 1px solid var(--line);
    margin-top: 12px;
    padding: 22px 0 60px;
    color: var(--muted);
    font-size: 0.87rem;
    max-width: 68ch;
  }
  .rodape p { margin: 0 0 8px; }
  .rodape code {
    font-family: var(--mono);
    font-size: 0.86em;
    background: var(--surface);
    border: 1px solid var(--line);
    padding: 1px 5px;
    border-radius: 5px;
  }

  :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
</style>

<div class="largura abertura">
  <p class="eyebrow">Entrais, revisão de interface</p>
  <h1>Sete negócios, a mesma página.</h1>
  <p class="intro">
    Uma doceria, um estúdio de yoga, uma nutricionista, uma psicóloga, um
    ateliê de crochê, uma casa de massas e um fotógrafo. Toque em qualquer um
    para abrir a tela inteira e conferir o acabamento.
  </p>
  <ul class="familia">${familia}</ul>
</div>

<div class="largura bancada">
  <div class="cabeca-bancada">
    <h2>Todas as telas</h2>
    <p class="eyebrow" id="contagem"></p>
  </div>

  <div class="corpo">
    <nav class="navegador" aria-label="Telas">${menu}</nav>

    <div class="palco-col">
      <div class="tamanhos" id="tamanhos" role="group" aria-label="Tamanho da tela">
        <button type="button" data-tamanho="celular" aria-pressed="true">Celular</button>
        <button type="button" data-tamanho="monitor" aria-pressed="false">Computador</button>
      </div>

      <div class="palco" id="palco" data-largura="celular">
        <div class="aparelho">
          <div class="barra" aria-hidden="true"><span></span><span></span><span></span></div>
          <div class="janela" id="janela"><img id="retrato" alt="" /></div>
        </div>
      </div>

      <div class="ficha">
        <p class="marca-rota" id="rota"></p>
        <h3 id="nome"></h3>
        <p id="nota"></p>
        <div class="alerta" id="alerta" hidden>
          <span id="alerta-texto"></span>
        </div>
      </div>
    </div>
  </div>

  <div class="rodape">
    <p>
      São retratos do build de produção, e servem para julgar layout,
      espaçamento, hierarquia, tamanho de toque e texto. Cada tela foi
      fotografada duas vezes, num iPhone 13 emulado e num monitor de 1440 por
      940, e o botão Celular / Computador troca uma pela outra.
    </p>
    <p>
      O painel e o cadastro aparecem com os dados de exemplo do arquivo local,
      que é a fonte que o servidor de revisão usa.
    </p>
    <p>Regerado com <code>npm run revisao</code> a cada mudança.</p>
  </div>
</div>

<script>
  const TELAS = ${dados};
  const porId = Object.fromEntries(TELAS.map((t) => [t.id, t]));

  const retrato = document.getElementById("retrato");
  const janela = document.getElementById("janela");
  const palco = document.getElementById("palco");
  const alerta = document.getElementById("alerta");
  const tamanhos = document.getElementById("tamanhos");
  document.getElementById("contagem").textContent =
    TELAS.length + " telas, dois tamanhos";

  let tamanho = "celular";
  let atual = TELAS[0].id;

  function mostrar(id, rolar) {
    const t = porId[id];
    if (!t) return;
    atual = id;

    // A prévia do link vem do servidor num tamanho só, então ali o botão sai
    // da frente e a moldura vira o cartão.
    const unico = t.imagens.unico;
    const img = unico || t.imagens[tamanho];

    tamanhos.hidden = Boolean(unico);
    palco.dataset.largura = unico ? "cartao" : tamanho;

    retrato.src = img.src;
    retrato.alt = "Tela: " + t.nome;
    retrato.width = img.w;
    retrato.height = img.h;
    janela.scrollTop = 0;

    document.getElementById("rota").textContent = t.rota;
    document.getElementById("nome").textContent = t.nome;
    document.getElementById("nota").textContent = t.nota;

    alerta.hidden = !t.aviso;
    document.getElementById("alerta-texto").textContent = t.aviso || "";

    for (const b of document.querySelectorAll(".aba")) {
      b.setAttribute("aria-current", String(b.dataset.id === id));
    }
    if (location.hash.slice(1) !== id) history.replaceState(null, "", "#" + id);
    if (rolar) palco.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  for (const b of document.querySelectorAll(".aba")) {
    b.addEventListener("click", () => mostrar(b.dataset.id, false));
  }
  for (const b of document.querySelectorAll(".mini-toque")) {
    b.addEventListener("click", () => mostrar(b.dataset.id, true));
  }
  for (const b of tamanhos.querySelectorAll("button")) {
    b.addEventListener("click", () => {
      tamanho = b.dataset.tamanho;
      for (const outro of tamanhos.querySelectorAll("button")) {
        outro.setAttribute(
          "aria-pressed",
          String(outro.dataset.tamanho === tamanho),
        );
      }
      mostrar(atual, false);
    });
  }

  mostrar(porId[location.hash.slice(1)] ? location.hash.slice(1) : TELAS[0].id, false);
</script>
`;
}

// ---------------------------------------------------------------------------

const capturadas = await capturar();
const prontas = await comprimir(capturadas);
const html = montarPagina(prontas);

await mkdir(SAIDA, { recursive: true });
await writeFile(`${SAIDA}/revisao.html`, html, "utf8");

console.log(
  `\n${prontas.length} telas, ${Math.round(Buffer.byteLength(html) / 1024 / 1024)} MB em ${SAIDA}/revisao.html`,
);
