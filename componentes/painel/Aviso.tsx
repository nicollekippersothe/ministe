const MENSAGENS: Record<string, string> = {
  nome: "O nome do negócio não pode ficar em branco.",
  whatsapp: "Confira o WhatsApp: precisa ter DDD e o número completo.",
  estado: "O estado é a sigla com duas letras, tipo SP.",
  cep: "O CEP precisa ter oito dígitos, tipo 04113-000.",
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
        {copiado ? "Horário copiado para terça a sexta." : "Pronto, salvo."}
      </p>
    );
  }

  return null;
}
