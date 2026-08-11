import type { ReactNode } from "react";

/**
 * Campos do painel.
 *
 * Todo campo tem label de verdade, ligado pelo id. Nada de placeholder no
 * lugar de rótulo, que some quando a pessoa começa a digitar e deixa quem usa
 * leitor de tela sem saber o que preencher.
 */

const BASE =
  "w-full rounded-xl border border-borda bg-superficie px-3.5 py-3 text-[1rem] text-texto placeholder:text-suave/60";

function Rotulo({
  htmlFor,
  children,
  dica,
}: {
  htmlFor: string;
  children: ReactNode;
  dica?: string;
}) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-texto">
        {children}
      </label>
      {dica ? (
        <p id={`${htmlFor}-dica`} className="mt-0.5 text-xs leading-relaxed text-suave">
          {dica}
        </p>
      ) : null}
    </div>
  );
}

export function Texto({
  id,
  rotulo,
  dica,
  valor,
  ...resto
}: {
  id: string;
  rotulo: string;
  dica?: string;
  valor: string | null;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "defaultValue">) {
  return (
    <div>
      <Rotulo htmlFor={id} dica={dica}>
        {rotulo}
      </Rotulo>
      <input
        id={id}
        name={id}
        defaultValue={valor ?? ""}
        aria-describedby={dica ? `${id}-dica` : undefined}
        className={BASE}
        {...resto}
      />
    </div>
  );
}

export function AreaTexto({
  id,
  rotulo,
  dica,
  valor,
  ...resto
}: {
  id: string;
  rotulo: string;
  dica?: string;
  valor: string | null;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "defaultValue">) {
  return (
    <div>
      <Rotulo htmlFor={id} dica={dica}>
        {rotulo}
      </Rotulo>
      <textarea
        id={id}
        name={id}
        defaultValue={valor ?? ""}
        rows={2}
        aria-describedby={dica ? `${id}-dica` : undefined}
        className={`${BASE} resize-y`}
        {...resto}
      />
    </div>
  );
}

export function Escolha({
  id,
  rotulo,
  dica,
  valor,
  opcoes,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  valor: string;
  opcoes: Array<{ valor: string; rotulo: string }>;
}) {
  return (
    <div>
      <Rotulo htmlFor={id} dica={dica}>
        {rotulo}
      </Rotulo>
      <select
        id={id}
        name={id}
        defaultValue={valor}
        aria-describedby={dica ? `${id}-dica` : undefined}
        className={BASE}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Marcar({
  id,
  rotulo,
  dica,
  marcado,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  marcado: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-borda bg-superficie p-3.5">
      <input
        id={id}
        name={id}
        type="checkbox"
        defaultChecked={marcado}
        aria-describedby={dica ? `${id}-dica` : undefined}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--c-destaque)]"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-texto">
          {rotulo}
        </label>
        {dica ? (
          <p id={`${id}-dica`} className="mt-0.5 text-xs leading-relaxed text-suave">
            {dica}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 text-lg font-semibold tracking-tight text-texto">
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

export function BarraSalvar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky inset-x-0 bottom-0 -mx-5 mt-2 border-t border-borda bg-fundo/95 px-5 pt-3 backdrop-blur-sm"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
      {children}
    </div>
  );
}

export function Botao({
  children,
  tom = "forte",
  ...resto
}: {
  children: ReactNode;
  tom?: "forte" | "leve";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cor =
    tom === "forte"
      ? "bg-texto text-superficie"
      : "border border-borda bg-superficie text-texto";
  return (
    <button
      className={`flex h-12 w-full items-center justify-center rounded-full px-5 font-semibold ${cor}`}
      {...resto}
    >
      {children}
    </button>
  );
}
