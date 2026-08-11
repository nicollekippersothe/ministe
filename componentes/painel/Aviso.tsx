const MENSAGENS: Record<string, string> = {
  nome: "O nome do negócio não pode ficar em branco.",
  whatsapp: "Confira o WhatsApp. Informe o DDD e o número completo.",
  estado: "O estado é a sigla de duas letras, por exemplo SP.",
  cep: "O CEP tem oito dígitos, por exemplo 04113-000.",
};

export function Aviso({
  salvo,
  copiado,
  erro,
}: {
  salvo?: boolean;
  copiado?: boolean;
  erro?: string;
}) {
  if (erro) {
    return (
      <p
        role="alert"
        className="mt-4 rounded-xl border border-destaque/30 bg-destaque/8 px-4 py-3 text-sm text-destaque"
      >
        {MENSAGENS[erro] ?? "Não deu para salvar. Confira os campos."}
      </p>
    );
  }

  if (salvo || copiado) {
    return (
      <p
        role="status"
        className="mt-4 rounded-xl bg-aberto-fundo px-4 py-3 text-sm font-medium text-aberto-texto"
      >
        {copiado ? "Horário copiado para terça a sexta." : "Alterações salvas."}
      </p>
    );
  }

  return null;
}
