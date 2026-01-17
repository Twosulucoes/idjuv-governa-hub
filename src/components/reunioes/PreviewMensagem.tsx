import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare } from "lucide-react";

interface PreviewMensagemProps {
  assunto?: string;
  corpo: string;
  canal: "email" | "whatsapp";
  assinatura?: {
    nome: string;
    cargo: string;
    setor?: string;
  };
}

export function PreviewMensagem({ assunto, corpo, canal, assinatura }: PreviewMensagemProps) {
  // Formatar o corpo da mensagem com a assinatura
  let mensagemFinal = corpo;
  if (assinatura && assinatura.nome) {
    mensagemFinal += `\n\n---\n${assinatura.nome}\n${assinatura.cargo}`;
    if (assinatura.setor) {
      mensagemFinal += `\n${assinatura.setor}`;
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {canal === "email" ? (
              <Mail className="h-4 w-4" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            Pré-visualização
          </CardTitle>
          <Badge variant="outline">
            {canal === "email" ? "Email" : "WhatsApp"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {canal === "email" && assunto && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Assunto:</span>{" "}
            <span className="text-foreground">{assunto}</span>
          </div>
        )}
        
        <div className={`text-sm p-3 rounded-lg whitespace-pre-wrap ${
          canal === "whatsapp" 
            ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" 
            : "bg-muted/50"
        }`}>
          {mensagemFinal}
        </div>

        <p className="text-xs text-muted-foreground">
          Variáveis disponíveis: {"{nome}"}, {"{titulo}"}, {"{data}"}, {"{horario}"}, {"{local}"}, {"{link}"}
        </p>
      </CardContent>
    </Card>
  );
}
