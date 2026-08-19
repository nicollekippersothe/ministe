/**
 * A contagem de visitas e cliques da página pública.
 *
 * Por que no navegador, e não no servidor: `app/[slug]/page.tsx` declara uma
 * hora de cache, e `generateStaticParams` devolve lista vazia justamente para o
 * Next não tratar a rota como dinâmica. Ou seja, o render do servidor não roda
 * a cada visita, que é o que faz a página ser rápida. Contar no servidor
 * exigiria tornar a rota dinâmica e jogar fora o cache, e contar no middleware
 * poria uma ida ao banco na frente da exata página cuja performance é regra do
 * projeto (AGENTS.md, meta de 90 no Lighthouse).
 *
 * O custo, dito sem maquiagem: só conta quem tem JavaScript, e o número é
 * inflável por quem quiser mandar POST na mão. É o preço de manter a página
 * estática, e é menor que o de perder o cache.
 *
 * Nada é guardado no aparelho. `navigation.type` já vem do próprio navegador e
 * some quando a aba fecha, então evitar que o F5 conte duas vezes custa zero
 * em privacidade. A tabela `eventos` guarda qual página, que tipo e quando, e a
 * política de privacidade publica exatamente isso.
 *
 * O script segue o formato que `componentes/Horarios.tsx` estabeleceu:
 * template literal no topo do módulo, minificado à mão, `!function(){…}()`, só
 * `var`, nomes curtos, e `return` cedo quando o elemento âncora some.
 *
 * Duas decisões dentro dele valem o comentário:
 *
 * 1. **Delegação num ouvinte só do documento**, e nunca `querySelectorAll`. O
 *    `BotaoAcao` é renderizado duas vezes na mesma página, uma na barra de
 *    baixo do celular e outra na coluna da esquerda do monitor, e os dois
 *    carregam `data-evento`. Percorrer a lista contaria o mesmo clique duas
 *    vezes.
 * 2. **O slug sai do `data-conta`**, e não de `location.pathname`. Endereço
 *    antigo redirecionado continua abrindo a página, e ali o caminho da URL
 *    seria o slug de antes.
 */
const SCRIPT = `!function(){var r=document.querySelector("[data-conta]");if(!r)return;var s=r.getAttribute("data-conta");
function e(t){try{navigator.sendBeacon("/api/evento",JSON.stringify({s:s,t:t}))}catch(_){}}
var n;try{n=(performance.getEntriesByType("navigation")[0]||{}).type}catch(_){}
if(n!=="reload")e("visita");
document.addEventListener("click",function(v){var a=v.target&&v.target.closest&&v.target.closest("[data-evento]");if(a)e(a.getAttribute("data-evento"))},true)}();`;

/**
 * Renderizada só pela página pública de verdade.
 *
 * `PaginaPublica` também é usada pela prévia do painel, com os botões de
 * verdade e o `data-evento` de verdade. Sem esta separação, o dono inflaria os
 * próprios números só de conferir a página antes de publicar. A trava é a mesma
 * que `SeloHorario` já usa para não virar a versão viva na tela inicial: quem
 * quer o comportamento pede por prop, e o resto fica de fora.
 */
export function Contagem() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
