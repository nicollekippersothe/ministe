/**
 * O que aparece no lugar da tela enquanto ela vem do servidor.
 *
 * **É o conserto do "demorando muito" que a pessoa sente, e não o do que o
 * relógio mede.** Sem esta fronteira, o toque no botão deixava a tela anterior
 * congelada até a nova chegar inteira, e nada respondia ao dedo. Com ela o
 * caminho troca na hora: o título e os blocos entram vazios, e o conteúdo cai
 * dentro assim que o banco responde.
 *
 * Uma só, aqui em cima, e não uma por seção. Ela envolve o `children` do
 * layout do painel, que é exatamente o pedaço que muda quando a pessoa vai de
 * Horários para Botões. Uma cópia dentro de cada pasta cobriria o mesmo pedaço
 * de novo, com a mesma forma.
 *
 * O segundo ganho é do `Link`: numa rota dinâmica o Next só adianta o que
 * estiver acima de uma fronteira dessas. Enquanto ela faltava, os links da
 * navegação do painel apontavam para telas que só começavam a existir depois do
 * toque.
 *
 * O desenho é de propósito parecido com a média das seções, e não com nenhuma
 * em particular: blocos na altura de um grupo de campos. Fica em `aria-hidden`
 * porque quem usa leitor de tela já ouve o aviso de carregando do próprio
 * navegador, e ouvir sete caixas vazias seria ruído.
 */
function Bloco({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-borda/60 ${className}`} />;
}

export default function Carregando() {
  return (
    <main className="mt-6" aria-hidden>
      <Bloco className="h-8 w-52" />

      <div className="mt-6 flex flex-col gap-4">
        <Bloco className="h-5 w-40" />
        <Bloco className="h-[4.5rem] w-full" />
        <Bloco className="h-[4.5rem] w-full" />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <Bloco className="h-5 w-56" />
        <Bloco className="h-[4.5rem] w-full" />
        <Bloco className="h-[4.5rem] w-full" />
        <Bloco className="h-[4.5rem] w-full" />
      </div>
    </main>
  );
}
