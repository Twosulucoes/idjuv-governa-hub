import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileDown,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Link2,
  ClipboardList,
} from "lucide-react";
import { gerarDeclaracaoNaoAcumulacao, gerarDeclaracaoBensValores } from "@/lib/pdfDeclaracoes";

const LINKS_CERTIDOES = [
  {
    nome: "Certidão Negativa Estadual",
    orgao: "Tribunal de Justiça de Roraima (TJ-RR)",
    url: "https://certidao.tjrr.jus.br/",
    descricao: "Certidão negativa de ações cíveis e criminais",
  },
  {
    nome: "Certidão Negativa Federal",
    orgao: "Tribunal Regional Federal da 1ª Região (TRF1)",
    url: "https://sistemas.trf1.jus.br/certidao/",
    descricao: "Certidão de distribuição de ações e execuções",
  },
  {
    nome: "Certidão de Quitação Eleitoral",
    orgao: "Tribunal Superior Eleitoral (TSE)",
    url: "https://www.tse.jus.br/servicos-eleitorais/certidoes/certidao-de-quitacao-eleitoral",
    descricao: "Comprova regularidade com a Justiça Eleitoral",
  },
];

const DOCUMENTOS_NECESSARIOS = [
  "RG e CPF (cópia legível)",
  "Título de Eleitor e comprovante de votação",
  "Certificado de Reservista (se homem)",
  "Comprovante de endereço atualizado",
  "Comprovante de escolaridade",
  "Certidão de nascimento ou casamento",
  "Certidão de nascimento dos dependentes (se houver)",
  "Carteira de trabalho (CTPS) - páginas de identificação e contratos",
  "PIS/PASEP",
  "Certidões negativas (estadual, federal e eleitoral)",
  "Declaração de Não Acumulação de Cargos (assinada)",
  "Declaração de Bens e Valores (assinada)",
];

export function OrientacoesDocumentosCard() {
  const [isOpen, setIsOpen] = useState(true);

  const handleDownloadNaoAcumulacao = async () => {
    const doc = await gerarDeclaracaoNaoAcumulacao();
    doc.save("declaracao-nao-acumulacao-cargos.pdf");
  };

  const handleDownloadBensValores = async () => {
    const doc = await gerarDeclaracaoBensValores();
    doc.save("declaracao-bens-valores.pdf");
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card className="border-primary/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                Orientações e Documentos Necessários
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Alerta Importante */}
            <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-300">
                Documentação Física Obrigatória
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                Além do preenchimento desta ficha online, você deverá apresentar{" "}
                <strong>cópias físicas de todos os documentos</strong> no ato da
                admissão, junto com as declarações devidamente assinadas.
              </AlertDescription>
            </Alert>

            {/* Declarações para Download */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Declarações para Download
              </h3>
              <p className="text-sm text-muted-foreground">
                Baixe, imprima, preencha e assine as declarações abaixo:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={handleDownloadNaoAcumulacao}
                >
                  <FileDown className="h-5 w-5 mr-3 text-primary shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">Declaração de Não Acumulação de Cargos</div>
                    <div className="text-xs text-muted-foreground">
                      Obrigatória para posse
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={handleDownloadBensValores}
                >
                  <FileDown className="h-5 w-5 mr-3 text-primary shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">Declaração de Bens e Valores</div>
                    <div className="text-xs text-muted-foreground">
                      Lei nº 8.429/1992
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Links para Certidões */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Emitir Certidões Online
              </h3>
              <p className="text-sm text-muted-foreground">
                Acesse os links abaixo para emitir suas certidões gratuitamente:
              </p>
              <div className="space-y-2">
                {LINKS_CERTIDOES.map((certidao) => (
                  <a
                    key={certidao.nome}
                    href={certidao.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <ExternalLink className="h-5 w-5 text-primary mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    <div>
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {certidao.nome}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {certidao.orgao}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {certidao.descricao}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Lista de Documentos */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Documentos para Apresentar na Admissão
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {DOCUMENTOS_NECESSARIOS.map((doc, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
