import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  User, 
  Briefcase, 
  Plane, 
  Package, 
  ClipboardList,
  FileCheck,
  AlertTriangle
} from "lucide-react";
import {
  generateFichaCadastralModelo,
  generateDeclaracaoAcumulacaoModelo,
  generateDeclaracaoBensModelo,
  generateTermoDemandaModelo,
  generateOrdemMissaoModelo,
  generateRelatorioViagemModelo,
  generateRequisicaoMaterialModelo,
  generateTermoResponsabilidadeModelo,
} from "@/lib/pdfModelos";

interface DocumentoModelo {
  id: string;
  titulo: string;
  descricao: string;
  icon: React.ElementType;
  categoria: string;
  onDownload: () => void | Promise<void>;
}

export default function ModelosDocumentosPage() {
  const documentos: DocumentoModelo[] = [
    // Documentos de Servidor
    {
      id: "ficha-cadastral",
      titulo: "Ficha Cadastral do Servidor",
      descricao: "Formulário completo para cadastro de novos servidores com todos os dados pessoais e funcionais.",
      icon: User,
      categoria: "Cadastro de Servidor",
      onDownload: generateFichaCadastralModelo,
    },
    {
      id: "declaracao-acumulacao",
      titulo: "Declaração de Não Acumulação de Cargos",
      descricao: "Declaração obrigatória para servidores informando não acumulação ilícita de cargos públicos.",
      icon: FileCheck,
      categoria: "Declarações",
      onDownload: generateDeclaracaoAcumulacaoModelo,
    },
    {
      id: "declaracao-bens",
      titulo: "Declaração de Bens e Valores",
      descricao: "Declaração patrimonial obrigatória para servidores públicos conforme legislação vigente.",
      icon: ClipboardList,
      categoria: "Declarações",
      onDownload: generateDeclaracaoBensModelo,
    },
    // Documentos de Viagem
    {
      id: "ordem-missao",
      titulo: "Ordem de Missão",
      descricao: "Autorização para deslocamento de servidor a serviço do Instituto.",
      icon: Plane,
      categoria: "Viagens e Diárias",
      onDownload: generateOrdemMissaoModelo,
    },
    {
      id: "relatorio-viagem",
      titulo: "Relatório de Viagem",
      descricao: "Relatório obrigatório após conclusão de viagem a serviço.",
      icon: FileText,
      categoria: "Viagens e Diárias",
      onDownload: generateRelatorioViagemModelo,
    },
    // Documentos Administrativos
    {
      id: "termo-demanda",
      titulo: "Termo de Demanda",
      descricao: "Solicitação formal de produtos ou serviços para atendimento de demandas do setor.",
      icon: ClipboardList,
      categoria: "Administrativo",
      onDownload: generateTermoDemandaModelo,
    },
    {
      id: "requisicao-material",
      titulo: "Requisição de Material",
      descricao: "Solicitação de materiais ao almoxarifado do Instituto.",
      icon: Package,
      categoria: "Administrativo",
      onDownload: generateRequisicaoMaterialModelo,
    },
    {
      id: "termo-responsabilidade",
      titulo: "Termo de Responsabilidade",
      descricao: "Termo de responsabilidade sobre bens patrimoniais sob a guarda do servidor.",
      icon: Briefcase,
      categoria: "Patrimônio",
      onDownload: generateTermoResponsabilidadeModelo,
    },
  ];

  // Agrupar por categoria
  const categorias = documentos.reduce((acc, doc) => {
    if (!acc[doc.categoria]) {
      acc[doc.categoria] = [];
    }
    acc[doc.categoria].push(doc);
    return acc;
  }, {} as Record<string, DocumentoModelo[]>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modelos de Documentos</h1>
          <p className="text-muted-foreground">
            Central de modelos de documentos padronizados do RH/IDJUV para download
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Atenção ao preenchimento
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Os modelos são gerados em branco para preenchimento manual ou impressão. 
                Para documentos preenchidos automaticamente com dados do servidor, acesse a ficha individual do servidor.
              </p>
            </div>
          </CardContent>
        </Card>

        {Object.entries(categorias).map(([categoria, docs]) => (
          <div key={categoria} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b pb-2">{categoria}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {docs.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <doc.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{doc.titulo}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm">
                      {doc.descricao}
                    </CardDescription>
                    <Button 
                      onClick={doc.onDownload}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Modelo PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
