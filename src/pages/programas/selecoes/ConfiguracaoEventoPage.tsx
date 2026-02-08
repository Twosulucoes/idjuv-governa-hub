/**
 * CONFIGURAÇÃO DO EVENTO - SELEÇÕES ESTUDANTIS
 * Página para editar datas, locais e modalidades do evento
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Calendar, 
  MapPin, 
  Clock,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Globe,
  FileText
} from "lucide-react";
import { toast } from "sonner";

// Dados mock do evento
const eventoMock = {
  titulo: "Seleções Estudantis 2026",
  subtitulo: "Jogos da Juventude 2026 — Representando Roraima",
  inscricoesAbertas: true,
  dataInicioInscricoes: "2026-02-09",
  dataFimInscricoes: "2026-02-13",
  idadeMinima: 15,
  idadeMaxima: 17,
  linkRegulamento: "https://example.com/regulamento.pdf",
  modalidades: [
    {
      id: "1",
      nome: "Voleibol",
      ativo: true,
      seletivas: [
        { naipe: "Feminino", data: "2026-02-28", horario: "08:00", local: "Ginásio Poliesportivo Hélio Campos" },
        { naipe: "Masculino", data: "2026-03-01", horario: "08:00", local: "Ginásio Poliesportivo Hélio Campos" }
      ]
    },
    {
      id: "2",
      nome: "Futsal",
      ativo: true,
      seletivas: [
        { naipe: "Masculino", data: "2026-03-07", horario: "08:00", local: "Escola Est. Prof. Antônio Ferreira" },
        { naipe: "Feminino", data: "2026-03-08", horario: "08:00", local: "Ginásio Poliesportivo Hélio Campos" }
      ]
    },
    {
      id: "3",
      nome: "Basquetebol",
      ativo: true,
      seletivas: [
        { naipe: "Masculino", data: "2026-03-14", horario: "08:00", local: "Ginásio Poliesportivo Hélio Campos" },
        { naipe: "Feminino", data: "2026-03-15", horario: "08:00", local: "Ginásio Poliesportivo Hélio Campos" }
      ]
    },
    {
      id: "4",
      nome: "Handebol",
      ativo: true,
      seletivas: [
        { naipe: "Masculino", data: "2026-03-21", horario: "08:00", local: "Ginásio Poliesportivo Hélio Campos" },
        { naipe: "Feminino", data: "2026-03-22", horario: "08:00", local: "Ginásio Poliesportivo Hélio Campos" }
      ]
    }
  ],
  locais: [
    { id: "1", nome: "Ginásio Poliesportivo Hélio Campos", endereco: "Rua Presidente Juscelino Kubitscheck, 848 - Canarinho, Boa Vista - RR" },
    { id: "2", nome: "Escola Est. Prof. Antônio Ferreira", endereco: "Rua Reinaldo Neves, 558 - Jardim Floresta, Boa Vista - RR" }
  ]
};

export default function ConfiguracaoEventoPage() {
  const [evento, setEvento] = useState(eventoMock);
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    setSalvando(true);
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Configurações salvas com sucesso!");
    setSalvando(false);
  };

  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Configuração do Evento
            </h1>
            <p className="text-muted-foreground">Seleções Estudantis - Jogos da Juventude 2026</p>
          </div>
          <Button onClick={handleSalvar} disabled={salvando} className="gap-2">
            <Save className="h-4 w-4" />
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList>
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>
            <TabsTrigger value="modalidades">Modalidades</TabsTrigger>
            <TabsTrigger value="locais">Locais</TabsTrigger>
          </TabsList>

          {/* Tab Geral */}
          <TabsContent value="geral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Informações do Evento
                </CardTitle>
                <CardDescription>Dados exibidos no hot site público</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título do Evento</Label>
                    <Input 
                      id="titulo"
                      value={evento.titulo}
                      onChange={(e) => setEvento({...evento, titulo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitulo">Subtítulo</Label>
                    <Input 
                      id="subtitulo"
                      value={evento.subtitulo}
                      onChange={(e) => setEvento({...evento, subtitulo: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regulamento">Link do Regulamento (PDF)</Label>
                  <Input 
                    id="regulamento"
                    type="url"
                    value={evento.linkRegulamento}
                    onChange={(e) => setEvento({...evento, linkRegulamento: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Inscrições */}
          <TabsContent value="inscricoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Período de Inscrições
                </CardTitle>
                <CardDescription>Configure as datas e critérios de elegibilidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`h-5 w-5 ${evento.inscricoesAbertas ? 'text-green-500' : 'text-yellow-500'}`} />
                    <div>
                      <p className="font-medium">Status das Inscrições</p>
                      <p className="text-sm text-muted-foreground">
                        {evento.inscricoesAbertas ? 'As inscrições estão abertas ao público' : 'Inscrições fechadas'}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={evento.inscricoesAbertas}
                    onCheckedChange={(checked) => setEvento({...evento, inscricoesAbertas: checked})}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dataInicio">Data Início</Label>
                    <Input 
                      id="dataInicio"
                      type="date"
                      value={evento.dataInicioInscricoes}
                      onChange={(e) => setEvento({...evento, dataInicioInscricoes: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataFim">Data Fim</Label>
                    <Input 
                      id="dataFim"
                      type="date"
                      value={evento.dataFimInscricoes}
                      onChange={(e) => setEvento({...evento, dataFimInscricoes: e.target.value})}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="idadeMin">Idade Mínima</Label>
                    <Input 
                      id="idadeMin"
                      type="number"
                      value={evento.idadeMinima}
                      onChange={(e) => setEvento({...evento, idadeMinima: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idadeMax">Idade Máxima</Label>
                    <Input 
                      id="idadeMax"
                      type="number"
                      value={evento.idadeMaxima}
                      onChange={(e) => setEvento({...evento, idadeMaxima: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Modalidades */}
          <TabsContent value="modalidades" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Modalidades e Seletivas
                  </CardTitle>
                  <CardDescription>Configure as modalidades e datas das seletivas</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Modalidade
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {evento.modalidades.map((modalidade) => (
                  <Card key={modalidade.id} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{modalidade.nome}</CardTitle>
                          <Badge variant={modalidade.ativo ? "default" : "secondary"}>
                            {modalidade.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <Switch checked={modalidade.ativo} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {modalidade.seletivas.map((seletiva, idx) => (
                          <div key={idx} className="p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{seletiva.naipe}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Data:</span>
                                <p className="font-medium">{new Date(seletiva.data).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Horário:</span>
                                <p className="font-medium">{seletiva.horario}</p>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Local:</span>
                                <p className="font-medium">{seletiva.local}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Locais */}
          <TabsContent value="locais" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Locais das Seletivas
                  </CardTitle>
                  <CardDescription>Gerencie os locais disponíveis</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Local
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {evento.locais.map((local) => (
                  <div key={local.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{local.nome}</p>
                      <p className="text-sm text-muted-foreground">{local.endereco}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
