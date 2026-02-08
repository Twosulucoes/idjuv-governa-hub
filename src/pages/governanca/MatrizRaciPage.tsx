import { Link } from "react-router-dom";
import { Users, Download } from "lucide-react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const matrizCompras = [
  { processo: "Termo de Demanda", PRES: "I", DIRAF: "C", CI: "I", UD: "R", FISC: "I" },
  { processo: "Análise Orçamentária", PRES: "I", DIRAF: "R", CI: "C", UD: "I", FISC: "I" },
  { processo: "Autorização", PRES: "A", DIRAF: "I", CI: "C", UD: "I", FISC: "I" },
  { processo: "Execução Contratual", PRES: "I", DIRAF: "R", CI: "I", UD: "I", FISC: "R" },
  { processo: "Fiscalização", PRES: "I", DIRAF: "I", CI: "I", UD: "I", FISC: "R" },
  { processo: "Pagamento", PRES: "I", DIRAF: "R", CI: "C", UD: "I", FISC: "I" },
];

const matrizDiarias = [
  { processo: "Solicitação", PRES: "I", DIRAF: "I", CI: "I", UD: "R" },
  { processo: "Análise", PRES: "I", DIRAF: "R", CI: "C", UD: "I" },
  { processo: "Autorização", PRES: "A", DIRAF: "I", CI: "I", UD: "I" },
  { processo: "Pagamento", PRES: "I", DIRAF: "R", CI: "C", UD: "I" },
  { processo: "Relatório Viagem", PRES: "I", DIRAF: "C", CI: "I", UD: "R" },
];

const matrizPatrimonio = [
  { processo: "Tombamento", PRES: "I", DIRAF: "R", CI: "C", UD: "I" },
  { processo: "Distribuição", PRES: "I", DIRAF: "R", CI: "I", UD: "R" },
  { processo: "Inventário", PRES: "I", DIRAF: "R", CI: "C", UD: "I" },
  { processo: "Baixa", PRES: "A", DIRAF: "R", CI: "C", UD: "I" },
];

const matrizIntegridade = [
  { processo: "Canal de Denúncias", PRES: "A", DIRAF: "I", CI: "R", UD: "I" },
  { processo: "Apuração", PRES: "I", DIRAF: "C", CI: "R", UD: "I" },
  { processo: "Relatório de Integridade", PRES: "A", DIRAF: "I", CI: "R", UD: "I" },
];

const legendaRaci = [
  { letra: "R", nome: "Responsável", descricao: "Quem executa a atividade", cor: "bg-primary" },
  { letra: "A", nome: "Aprovador", descricao: "Quem autoriza a atividade", cor: "bg-success" },
  { letra: "C", nome: "Consultado", descricao: "Quem é consultado", cor: "bg-info" },
  { letra: "I", nome: "Informado", descricao: "Quem é informado", cor: "bg-muted" },
];

function getBadgeClass(letra: string) {
  switch (letra) {
    case "R": return "bg-primary";
    case "A": return "bg-success";
    case "C": return "bg-info text-info-foreground";
    default: return "";
  }
}

export default function MatrizRaciPage() {
  return (
    <ModuleLayout module="governanca">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            <Users className="w-3 h-3 mr-1" />
            Governança
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Matriz RACI
          </h1>
          <p className="text-muted-foreground">
            Responsabilidades e papéis nos processos administrativos
          </p>
        </div>

        {/* Legenda */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Legenda RACI</CardTitle>
                <CardDescription>Papéis e responsabilidades por processo</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {legendaRaci.map((item) => (
                <div key={item.letra} className="flex items-center gap-3">
                  <Badge className={item.cor}>{item.letra}</Badge>
                  <div>
                    <p className="font-medium text-sm">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">{item.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div><strong>PRES</strong> – Presidência</div>
              <div><strong>DIRAF</strong> – Dir. Administrativa</div>
              <div><strong>CI</strong> – Controle Interno</div>
              <div><strong>UD</strong> – Unidade Demandante</div>
              <div><strong>FISC</strong> – Fiscal de Contrato</div>
            </div>
          </CardContent>
        </Card>

        {/* Compras e Contratações */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Compras e Contratações (Lei 14.133)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead className="text-center">PRES</TableHead>
                  <TableHead className="text-center">DIRAF</TableHead>
                  <TableHead className="text-center">CI</TableHead>
                  <TableHead className="text-center">UD</TableHead>
                  <TableHead className="text-center">FISC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrizCompras.map((row) => (
                  <TableRow key={row.processo}>
                    <TableCell className="font-medium">{row.processo}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.PRES)}>{row.PRES}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.DIRAF)}>{row.DIRAF}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.CI)}>{row.CI}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.UD)}>{row.UD}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.FISC)}>{row.FISC}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Diárias e Viagens */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Diárias e Viagens</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead className="text-center">PRES</TableHead>
                  <TableHead className="text-center">DIRAF</TableHead>
                  <TableHead className="text-center">CI</TableHead>
                  <TableHead className="text-center">UD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrizDiarias.map((row) => (
                  <TableRow key={row.processo}>
                    <TableCell className="font-medium">{row.processo}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.PRES)}>{row.PRES}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.DIRAF)}>{row.DIRAF}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.CI)}>{row.CI}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.UD)}>{row.UD}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Patrimônio */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Patrimônio e Almoxarifado</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead className="text-center">PRES</TableHead>
                  <TableHead className="text-center">DIRAF</TableHead>
                  <TableHead className="text-center">CI</TableHead>
                  <TableHead className="text-center">UD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrizPatrimonio.map((row) => (
                  <TableRow key={row.processo}>
                    <TableCell className="font-medium">{row.processo}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.PRES)}>{row.PRES}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.DIRAF)}>{row.DIRAF}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.CI)}>{row.CI}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.UD)}>{row.UD}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Integridade */}
        <Card>
          <CardHeader>
            <CardTitle>Integridade e Ética</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead className="text-center">PRES</TableHead>
                  <TableHead className="text-center">DIRAF</TableHead>
                  <TableHead className="text-center">CI</TableHead>
                  <TableHead className="text-center">UD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrizIntegridade.map((row) => (
                  <TableRow key={row.processo}>
                    <TableCell className="font-medium">{row.processo}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.PRES)}>{row.PRES}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.DIRAF)}>{row.DIRAF}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.CI)}>{row.CI}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeClass(row.UD)}>{row.UD}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
